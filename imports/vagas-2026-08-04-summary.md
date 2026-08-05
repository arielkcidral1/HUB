# Importacao de vagas - 04/08/2026

Origem: `VAGAS 04.08.26.xlsx`

- Vagas abertas anteriores fechadas no PostgreSQL: 32
- Vagas inseridas como abertas: 22
- Regra aplicada: linhas com `Qtd` maior que 1 foram duplicadas em vagas individuais.
- Campos considerados: unidade, cidade, cargo, quantidade, descricao da funcao, perfil para a vaga, escolaridade, experiencia minima e beneficios.
- Observacao: a data recebida e dados de salario/base nao foram importados. Cidade, quantidade, descricao, perfil e beneficios foram preservados no texto da descricao; escolaridade e experiencia foram preservadas nos requisitos.
- Validacao inicial: registros abertos conferidos sem caracteres quebrados como `�`.
- Correcao posterior: todas as 76 vagas do PostgreSQL foram revisadas e padronizadas com os mesmos rotulos, incluindo 22 abertas e 54 fechadas.
- Validacao final: 0 vagas fora do padrao, sem `�`, sem data recebida e sem salario/base.
- Registro: as 22 vagas abertas importadas da planilha foram atribuidas a conta `Ariel`.
- Inclusao manual: adicionadas 2 vagas abertas para `19- RNG 1`, sendo `Caixa` e `Vendedora`, no mesmo padrao das demais vagas.

Distribuicao por unidade:

- `1- MTZ`: 3
- `2- SBS`: 2
- `9- DPA IRI`: 3
- `11- BC`: 1
- `12- GCS JLLE`: 2
- `13- JRG 1`: 3
- `14- BRQ`: 2
- `19- RNG 1`: 2
- `20- BNU 1`: 1
- `21- JRG 2`: 1
- `23- ITJ 2`: 1
- `28- ARA`: 1
