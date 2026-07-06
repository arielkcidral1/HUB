-- The public-submission Edge Function uses service_role and triggers CHECK
-- constraints that call validation helpers in app_private.
grant usage on schema app_private to service_role;
grant execute on all functions in schema app_private to service_role;
