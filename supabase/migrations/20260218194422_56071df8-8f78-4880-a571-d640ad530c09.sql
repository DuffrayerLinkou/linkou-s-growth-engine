-- Corrige step 1 do Cold Outbound: nome Guilherme → Leo Santana + "tráfego pago" → "consultoria, tráfego e vendas"
UPDATE email_funnel_steps
SET html_body = '<h2 style="color:#1a1a2e;font-size:20px;margin:0 0 16px;">Olá, {{nome}}! 👋</h2><p style="color:#4a4a68;font-size:15px;line-height:1.7;margin:0 0 20px;">Meu nome é Leo Santana, sou da <strong>Linkou</strong> — uma agência de consultoria, tráfego e vendas.</p><p style="color:#4a4a68;font-size:15px;line-height:1.7;margin:0 0 20px;">Recebi sua indicação e resolvi entrar em contato diretamente. Não vou te tomar muito tempo — só quero saber se faz sentido conversarmos.</p><p style="color:#4a4a68;font-size:15px;line-height:1.7;margin:0 0 20px;">Trabalhamos com empresas do segmento <strong>{{segmento}}</strong> que querem crescer de forma previsível, com estratégia e sem depender de achismos.</p><p style="color:#4a4a68;font-size:15px;line-height:1.7;margin:0;">Se quiser saber mais, basta responder esse email. Sem pressão. 🙂</p>'
WHERE id = 'eba7d3b0-0324-4893-91bf-dd33b9d9f27c';

-- Corrige step 5 do Cold Outbound: "estratégia de tráfego" → "estratégia de consultoria e vendas"
UPDATE email_funnel_steps
SET html_body = '<h2 style="color:#1a1a2e;font-size:20px;margin:0 0 16px;">{{nome}}, essa é minha última mensagem</h2><p style="color:#4a4a68;font-size:15px;line-height:1.7;margin:0 0 20px;">Não quero encher sua caixa de entrada. Mas antes de encerrar, deixa eu te fazer uma última pergunta:</p><p style="color:#7C3AED;font-size:18px;line-height:1.7;margin:0 0 20px;font-weight:600;">Quanto você está deixando de ganhar por não ter uma estratégia de consultoria e vendas que funciona de verdade?</p><p style="color:#4a4a68;font-size:15px;line-height:1.7;margin:0 0 20px;">Se a resposta for mais do que você gostaria, vale a pena a gente conversar.</p><p style="color:#4a4a68;font-size:15px;line-height:1.7;margin:0;">Me chame no WhatsApp ou responda esse email. Estarei por aqui. 👊</p>'
WHERE id = 'd815e1d1-3c1c-4f80-ab12-a046592213a9';

-- Corrige Funil Padrão step 1: "especialistas em tráfego pago" → posicionamento correto + assinatura Leo Santana
UPDATE email_funnel_steps
SET html_body = '<h2>Olá, {{nome}}!</h2><p>Obrigado por entrar em contato com a <strong>Linkou</strong>. Somos uma agência de consultoria, tráfego e vendas — ajudamos empresas a crescer com estratégia, previsibilidade e resultados reais.</p><p>Nos próximos dias, vou compartilhar com você alguns conteúdos que podem transformar sua visão sobre marketing digital.</p><p>Para começar: você sabia que a maioria dos negócios perde oportunidades por não ter uma estratégia clara de aquisição? Vamos mudar isso juntos.</p><p>Qualquer dúvida, basta responder este email.</p><br><p>Abraços,<br><strong>Leo Santana</strong><br><span style="color:#6b6b8d;font-size:13px;">Diretor Comercial — Linkou</span></p>'
WHERE id = '1c0804b7-9543-426e-80bc-a7c79a331e0d';

-- Corrige assinaturas "Equipe Linkou" → Leo Santana onde existirem nos outros steps do Funil Padrão
UPDATE email_funnel_steps
SET html_body = REPLACE(html_body, '<strong>Equipe Linkou</strong>', '<strong>Leo Santana</strong><br><span style="color:#6b6b8d;font-size:13px;">Diretor Comercial — Linkou</span>')
WHERE funnel_id = (SELECT id FROM email_funnels WHERE name = 'Funil Padrão Linkou')
  AND html_body LIKE '%Equipe Linkou%';