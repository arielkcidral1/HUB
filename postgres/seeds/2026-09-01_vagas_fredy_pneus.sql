-- Vagas do Briefing de Recrutamento | Fredy Pneus (atualizado em 01/09/2026)
-- Rode este script manualmente no psql para cadastrar as vagas em aberto.
-- Cada vaga com mais de 1 posicao foi desdobrada em uma linha por vaga.
-- A vaga de Gerente de Loja esta pendente de confirmacao do local (unidade "00- Brasil").

insert into public.hub_vagas (cargo, unidade, descricao, requisitos, status, created_by) values

('Auxiliar Mecânico', '20- BNU 1',
'Marca: Fredy Pneus | Local: Blumenau/SC | Presencial | CLT | Benefícios: vale-transporte, plano de saúde, plano odontológico, descontos e oportunidades de crescimento.

Principais atividades: Apoiar a execução de serviços mecânicos básicos; auxiliar na montagem, desmontagem e manutenção de pneus; apoiar a substituição de componentes; organizar ferramentas e manter a oficina limpa e segura.',
'Organização, responsabilidade, disposição para aprender e facilidade para trabalhar em equipe. Experiência em oficina ou serviços automotivos será um diferencial.',
'Aberta', 'Briefing Recrutamento'),

('Gerente de Loja', '00- Brasil',
'Marca: Fredy Pneus | Local: a confirmar | Presencial | CLT | Benefícios: vale-transporte, plano de saúde, plano odontológico, descontos e oportunidades de crescimento.
Situação: pendente de confirmação da cidade/unidade.

Principais atividades: Liderar a equipe da unidade; acompanhar metas, vendas e indicadores; garantir a qualidade do atendimento; organizar as rotinas operacionais, comerciais e administrativas; apoiar o desenvolvimento da equipe.',
'Experiência com gestão de loja e liderança de equipes, perfil comercial, boa comunicação, organização e foco em resultados. Vivência no segmento automotivo será um diferencial.',
'Aberta', 'Briefing Recrutamento'),

('Auxiliar Mecânico', '14- BRQ',
'Marca: Fredy Pneus | Local: Brusque/SC | Presencial | CLT | Benefícios: vale-transporte, plano de saúde, plano odontológico, descontos e oportunidades de crescimento.

Principais atividades: Apoiar a execução de serviços mecânicos básicos; auxiliar na montagem, desmontagem e manutenção de pneus; apoiar a substituição de componentes; organizar ferramentas e manter a oficina limpa e segura.',
'Organização, responsabilidade, disposição para aprender e facilidade para trabalhar em equipe. Experiência em oficina ou serviços automotivos será um diferencial.',
'Aberta', 'Briefing Recrutamento'),

('Vendedor(a)', '14- BRQ',
'Marca: Fredy Pneus | Local: Brusque/SC | Presencial | CLT | Benefícios: vale-transporte, plano de saúde, plano odontológico, descontos e oportunidades de crescimento.

Principais atividades: Atender clientes, identificar necessidades, elaborar orçamentos, vender pneus e serviços automotivos, acompanhar pedidos e contribuir para o atingimento das metas da loja.',
'Boa comunicação, simpatia, proatividade, organização e foco no cliente. Experiência com vendas e negociação será um diferencial.',
'Aberta', 'Briefing Recrutamento'),

('Estoquista', '3- ITJ 1',
'Marca: Fredy Pneus | Local: Itajaí I/SC | Presencial | CLT | Benefícios: vale-transporte, plano de saúde, plano odontológico, descontos e oportunidades de crescimento.

Principais atividades: Receber, conferir, armazenar e organizar produtos; separar pedidos; apoiar inventários; controlar a movimentação de mercadorias e manter o estoque limpo e organizado.',
'Organização, agilidade, responsabilidade, atenção aos detalhes e disposição para atividades de movimentação de produtos. Experiência em estoque será um diferencial.',
'Aberta', 'Briefing Recrutamento'),

('Auxiliar Mecânico', '23- ITJ 2',
'Marca: Fredy Pneus | Local: Itajaí II/SC | Presencial | CLT | Benefícios: vale-transporte, plano de saúde, plano odontológico, descontos e oportunidades de crescimento.

Principais atividades: Apoiar a execução de serviços mecânicos básicos; auxiliar na montagem, desmontagem e manutenção de pneus; apoiar a substituição de componentes; organizar ferramentas e manter a oficina limpa e segura.',
'Organização, responsabilidade, disposição para aprender e facilidade para trabalhar em equipe. Experiência em oficina ou serviços automotivos será um diferencial.',
'Aberta', 'Briefing Recrutamento'),

('Mecânico Automotivo', '23- ITJ 2',
'Marca: Fredy Pneus | Local: Itajaí II/SC | Presencial | CLT | Benefícios: vale-transporte, plano de saúde, plano odontológico, descontos e oportunidades de crescimento.

Principais atividades: Realizar diagnósticos e serviços de manutenção preventiva e corretiva; executar serviços em freios, suspensão e componentes mecânicos; apoiar alinhamento, balanceamento e serviços relacionados a pneus; zelar pela qualidade e segurança das entregas.',
'Experiência comprovada em mecânica automotiva, conhecimento técnico, responsabilidade, organização e bom trabalho em equipe.',
'Aberta', 'Briefing Recrutamento'),

('Estoquista', '21- JRG 2',
'Marca: Fredy Pneus | Local: Jaraguá do Sul - Unidade Jaraguá 2/SC | Presencial | CLT | Benefícios: vale-transporte, plano de saúde, plano odontológico, descontos e oportunidades de crescimento.

Principais atividades: Receber, conferir, armazenar e organizar produtos; separar pedidos; apoiar inventários; controlar a movimentação de mercadorias e manter o estoque limpo e organizado.',
'Organização, agilidade, responsabilidade, atenção aos detalhes e disposição para atividades de movimentação de produtos. Experiência em estoque será um diferencial.',
'Aberta', 'Briefing Recrutamento'),

('Mecânico Automotivo', '1- MTZ',
'Marca: Fredy Pneus | Local: Joinville/SC | Presencial | CLT | Benefícios: vale-transporte, plano de saúde, plano odontológico, descontos e oportunidades de crescimento.

Principais atividades: Realizar diagnósticos e serviços de manutenção preventiva e corretiva; executar serviços em freios, suspensão e componentes mecânicos; apoiar alinhamento, balanceamento e serviços relacionados a pneus; zelar pela qualidade e segurança das entregas.',
'Experiência comprovada em mecânica automotiva, conhecimento técnico, responsabilidade, organização e bom trabalho em equipe.',
'Aberta', 'Briefing Recrutamento'),

('Vendedor(a)', '1- MTZ',
'Marca: Fredy Pneus | Local: Joinville/SC | Presencial | CLT | Benefícios: vale-transporte, plano de saúde, plano odontológico, descontos e oportunidades de crescimento.

Principais atividades: Atender clientes, identificar necessidades, elaborar orçamentos, vender pneus e serviços automotivos, acompanhar pedidos e contribuir para o atingimento das metas da loja.',
'Boa comunicação, simpatia, proatividade, organização e foco no cliente. Experiência com vendas e negociação será um diferencial.',
'Aberta', 'Briefing Recrutamento'),

('Vendedor(a) Atacado', '1- MTZ',
'Marca: Fredy Pneus | Local: Joinville/SC | Presencial | CLT | Benefícios: vale-transporte, plano de saúde, plano odontológico, descontos e oportunidades de crescimento.

Principais atividades: Prospectar novos clientes, atender e desenvolver a carteira, elaborar propostas, negociar condições comerciais, acompanhar pedidos e pós-venda e atuar no atingimento das metas do canal atacadista.',
'Experiência com vendas, boa comunicação, organização, habilidade de negociação e foco em resultados. Vivência com vendas B2B ou no segmento automotivo será um diferencial.',
'Aberta', 'Briefing Recrutamento'),

('Auxiliar Mecânico', '9- DPA IRI',
'Marca: Fredy Pneus | Local: Joinville - Iririú/SC | Presencial | CLT | Benefícios: vale-transporte, plano de saúde, plano odontológico, descontos e oportunidades de crescimento.

Principais atividades: Apoiar a execução de serviços mecânicos básicos; auxiliar na montagem, desmontagem e manutenção de pneus; apoiar a substituição de componentes; organizar ferramentas e manter a oficina limpa e segura.',
'Organização, responsabilidade, disposição para aprender e facilidade para trabalhar em equipe. Experiência em oficina ou serviços automotivos será um diferencial.',
'Aberta', 'Briefing Recrutamento'),

('Borracheiro', '19- RNG 1',
'Marca: Fredy Pneus | Local: Rio Negrinho/SC | Presencial | CLT | Benefícios: vale-transporte, plano de saúde, plano odontológico, descontos e oportunidades de crescimento.

Principais atividades: Realizar montagem, desmontagem, conserto, calibragem e rodízio de pneus; inspecionar as condições dos pneus e rodas; orientar sobre necessidades identificadas; manter ferramentas e área de trabalho organizadas.',
'Conhecimento básico em pneus e serviços automotivos, responsabilidade e facilidade para trabalhar em equipe. Experiência na função será um diferencial.',
'Aberta', 'Briefing Recrutamento'),

('Mecânico Automotivo', '19- RNG 1',
'Marca: Fredy Pneus | Local: Rio Negrinho/SC | Presencial | CLT | Benefícios: vale-transporte, plano de saúde, plano odontológico, descontos e oportunidades de crescimento.

Principais atividades: Realizar diagnósticos e serviços de manutenção preventiva e corretiva; executar serviços em freios, suspensão e componentes mecânicos; apoiar alinhamento, balanceamento e serviços relacionados a pneus; zelar pela qualidade e segurança das entregas.',
'Experiência comprovada em mecânica automotiva, conhecimento técnico, responsabilidade, organização e bom trabalho em equipe.',
'Aberta', 'Briefing Recrutamento'),

('Mecânico Automotivo', '19- RNG 1',
'Marca: Fredy Pneus | Local: Rio Negrinho/SC | Presencial | CLT | Benefícios: vale-transporte, plano de saúde, plano odontológico, descontos e oportunidades de crescimento.

Principais atividades: Realizar diagnósticos e serviços de manutenção preventiva e corretiva; executar serviços em freios, suspensão e componentes mecânicos; apoiar alinhamento, balanceamento e serviços relacionados a pneus; zelar pela qualidade e segurança das entregas.',
'Experiência comprovada em mecânica automotiva, conhecimento técnico, responsabilidade, organização e bom trabalho em equipe.',
'Aberta', 'Briefing Recrutamento'),

('Estoquista', '12- GCS GPO',
'Marca: Achei Pneus | Local: Joinville/SC | Presencial | CLT | Benefícios: vale-transporte, plano de saúde, plano odontológico, descontos e oportunidades de crescimento.

Principais atividades: Receber e conferir mercadorias; armazenar e endereçar produtos; separar e embalar pedidos do e-commerce; apoiar inventários; organizar a expedição e manter o estoque em ordem.',
'Organização, agilidade, atenção aos detalhes, responsabilidade e disposição para movimentação de mercadorias. Experiência em estoque, logística ou expedição será um diferencial.',
'Aberta', 'Briefing Recrutamento'),

('Estoquista', '12- GCS GPO',
'Marca: Achei Pneus | Local: Joinville/SC | Presencial | CLT | Benefícios: vale-transporte, plano de saúde, plano odontológico, descontos e oportunidades de crescimento.

Principais atividades: Receber e conferir mercadorias; armazenar e endereçar produtos; separar e embalar pedidos do e-commerce; apoiar inventários; organizar a expedição e manter o estoque em ordem.',
'Organização, agilidade, atenção aos detalhes, responsabilidade e disposição para movimentação de mercadorias. Experiência em estoque, logística ou expedição será um diferencial.',
'Aberta', 'Briefing Recrutamento'),

('Estoquista', '12- GCS GPO',
'Marca: Achei Pneus | Local: Joinville/SC | Presencial | CLT | Benefícios: vale-transporte, plano de saúde, plano odontológico, descontos e oportunidades de crescimento.

Principais atividades: Receber e conferir mercadorias; armazenar e endereçar produtos; separar e embalar pedidos do e-commerce; apoiar inventários; organizar a expedição e manter o estoque em ordem.',
'Organização, agilidade, atenção aos detalhes, responsabilidade e disposição para movimentação de mercadorias. Experiência em estoque, logística ou expedição será um diferencial.',
'Aberta', 'Briefing Recrutamento'),

('Estoquista', '12- GCS GPO',
'Marca: Achei Pneus | Local: Joinville/SC | Presencial | CLT | Benefícios: vale-transporte, plano de saúde, plano odontológico, descontos e oportunidades de crescimento.

Principais atividades: Receber e conferir mercadorias; armazenar e endereçar produtos; separar e embalar pedidos do e-commerce; apoiar inventários; organizar a expedição e manter o estoque em ordem.',
'Organização, agilidade, atenção aos detalhes, responsabilidade e disposição para movimentação de mercadorias. Experiência em estoque, logística ou expedição será um diferencial.',
'Aberta', 'Briefing Recrutamento'),

('Estoquista', '12- GCS GPO',
'Marca: Achei Pneus | Local: Joinville/SC | Presencial | CLT | Benefícios: vale-transporte, plano de saúde, plano odontológico, descontos e oportunidades de crescimento.

Principais atividades: Receber e conferir mercadorias; armazenar e endereçar produtos; separar e embalar pedidos do e-commerce; apoiar inventários; organizar a expedição e manter o estoque em ordem.',
'Organização, agilidade, atenção aos detalhes, responsabilidade e disposição para movimentação de mercadorias. Experiência em estoque, logística ou expedição será um diferencial.',
'Aberta', 'Briefing Recrutamento'),

('Gerente de Marketing e E-commerce', '12- GCS GPO',
'Marca: Achei Pneus | Local: Joinville/SC | Presencial | Contratação PJ | Horário: 08h às 18h | Faixa informada na RP: R$ 8.500,00.

Principais atividades: Desenvolver e executar o planejamento estratégico de Marketing e E-commerce; liderar campanhas de mídia paga, SEO, CRM e calendário promocional; acompanhar Google Merchant Center e marketplaces; analisar vendas, CAC, ROAS, ROI, conversão, ticket médio e margem; coordenar equipe, agências e fornecedores; apresentar resultados à diretoria.',
'Experiência comprovada em Marketing Digital e E-commerce, gestão de equipes e fornecedores e operações de médio ou grande porte. Histórico de crescimento de vendas, tráfego, conversão ou rentabilidade. Conhecimento de Google Ads, Meta Ads, Google Shopping e marketplaces.',
'Aberta', 'Briefing Recrutamento');
