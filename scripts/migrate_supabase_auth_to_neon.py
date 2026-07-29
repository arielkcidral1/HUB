#!/usr/bin/env python3
"""
Migra usuarios do Supabase Auth para o auth proprio do HUB no Neon.

Requer conexao direta com o banco Postgres do Supabase para ler auth.users,
pois a Admin API nao exporta encrypted_password.

Uso:
  SUPABASE_DB_URL='postgresql://...' DATABASE_URL='postgresql://...' \
    python3 scripts/migrate_supabase_auth_to_neon.py

Opcional:
  --dry-run    mostra o que seria feito sem alterar o Neon.
"""

import argparse
import json
import os
import sys
from urllib.parse import urlparse

import pg8000.native


def connect(database_url):
    parsed = urlparse(database_url)
    if not parsed.scheme.startswith("postgres"):
        raise ValueError("URL Postgres invalida.")
    return pg8000.native.Connection(
        user=parsed.username,
        password=parsed.password,
        host=parsed.hostname,
        port=parsed.port or 5432,
        database=parsed.path.lstrip("/"),
        ssl_context=True,
    )


def quote(value):
    if value is None:
        return "null"
    return "'" + str(value).replace("'", "''") + "'"


def normalize_email(value):
    return str(value or "").strip().lower()


def table_columns(conn, table_name, schema_name="public"):
    rows = conn.run(
        f"""
        select column_name
        from information_schema.columns
        where table_schema = {quote(schema_name)}
          and table_name = {quote(table_name)}
        """
    )
    return {row[0] for row in rows}


def profile_expr(profile_columns, column_name, fallback="null"):
    return f"p.{column_name}" if column_name in profile_columns else fallback


def fetch_supabase_users(source, profile_columns):
    profile_nome = profile_expr(profile_columns, "nome")
    profile_cpf = profile_expr(profile_columns, "cpf")
    profile_cargo = profile_expr(profile_columns, "cargo")
    profile_foto = profile_expr(profile_columns, "foto_perfil")
    profile_config = profile_expr(profile_columns, "configuracoes", "'{}'::jsonb")
    return source.run(
        f"""
        select
          u.id::text as auth_id,
          lower(u.email) as email,
          coalesce(nullif({profile_nome}, ''), nullif(u.raw_user_meta_data ->> 'nome', ''), nullif(u.raw_user_meta_data ->> 'name', ''), split_part(u.email, '@', 1)) as nome,
          {profile_cpf} as cpf,
          coalesce(nullif({profile_cargo}, ''), nullif(u.raw_app_meta_data ->> 'cargo', ''), '') as cargo,
          {profile_foto} as foto_perfil,
          u.encrypted_password as password_hash,
          coalesce({profile_config}, '{{}}'::jsonb)::text as configuracoes,
          u.created_at
        from auth.users u
        left join public.hub_users p on lower(p.email) = lower(u.email)
        where u.email is not null and btrim(u.email) <> ''
        order by u.created_at
        """
    )


def has_column(conn, table_name, column_name):
    rows = conn.run(
        f"""
        select 1
        from information_schema.columns
        where table_schema = 'public'
          and table_name = {quote(table_name)}
          and column_name = {quote(column_name)}
        limit 1
        """
    )
    return bool(rows)


def neon_user_by_email(target, email):
    rows = target.run(
        f"""
        select id::text, password_hash
        from public.hub_users
        where lower(email) = {quote(email)}
        limit 1
        """
    )
    return rows[0] if rows else None


def is_usable_password_hash(value):
    text = str(value or "")
    return text.startswith("$2a$") or text.startswith("$2b$") or text.startswith("$2y$")


def migrate_user(target, row, supports_configuracoes, dry_run=False):
    auth_id, email, nome, cpf, cargo, foto_perfil, password_hash, configuracoes, created_at = row
    email = normalize_email(email)
    if not email:
        return "skipped"

    existing = neon_user_by_email(target, email)
    usable_hash = password_hash if is_usable_password_hash(password_hash) else None
    config_value = configuracoes if configuracoes else "{}"

    if dry_run:
        return "update" if existing else "insert"

    if existing:
        existing_id, existing_hash = existing
        next_hash_sql = quote(usable_hash or existing_hash)
        config_sql = f", configuracoes = coalesce({quote(config_value)}::jsonb, configuracoes)" if supports_configuracoes else ""
        target.run(
            f"""
            update public.hub_users
            set
              nome = coalesce(nullif({quote(nome)}, ''), nome),
              cpf = coalesce(nullif({quote(cpf)}, ''), cpf),
              cargo = coalesce(nullif({quote(cargo)}, ''), cargo),
              foto_perfil = coalesce(nullif({quote(foto_perfil)}, ''), foto_perfil),
              password_hash = coalesce({next_hash_sql}, password_hash)
              {config_sql}
            where id = {quote(existing_id)}::uuid
            """
        )
        return "updated"

    columns = ["id", "nome", "email", "cpf", "cargo", "foto_perfil", "password_hash", "created_by", "created_at"]
    values = [
        f"{quote(auth_id)}::uuid",
        quote(nome or email.split("@")[0]),
        quote(email),
        quote(cpf),
        quote(cargo),
        quote(foto_perfil),
        quote(usable_hash),
        quote("Supabase Auth Migration"),
        f"coalesce({quote(created_at)}, now()::text)::timestamptz",
    ]
    if supports_configuracoes:
        columns.append("configuracoes")
        values.append(f"{quote(config_value)}::jsonb")

    target.run(
        f"""
        insert into public.hub_users ({", ".join(columns)})
        values ({", ".join(values)})
        """
    )
    return "inserted"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    source_url = os.environ.get("SUPABASE_DB_URL", "").strip()
    target_url = os.environ.get("DATABASE_URL", "").strip()
    if not source_url:
        print("SUPABASE_DB_URL nao configurada.", file=sys.stderr)
        return 2
    if not target_url:
        print("DATABASE_URL nao configurada.", file=sys.stderr)
        return 2

    source = connect(source_url)
    target = connect(target_url)
    supports_configuracoes = has_column(target, "hub_users", "configuracoes")
    profile_columns = table_columns(source, "hub_users")
    users = fetch_supabase_users(source, profile_columns)

    counts = {"inserted": 0, "updated": 0, "insert": 0, "update": 0, "skipped": 0, "missing_password": 0}
    for row in users:
        if not is_usable_password_hash(row[6]):
            counts["missing_password"] += 1
        status = migrate_user(target, row, supports_configuracoes, dry_run=args.dry_run)
        counts[status] = counts.get(status, 0) + 1

    mode = "dry_run" if args.dry_run else "applied"
    print(json.dumps({"mode": mode, "source_users": len(users), **counts}, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
