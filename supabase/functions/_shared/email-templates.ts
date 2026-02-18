// Shared email templates for Linkou notification system

const PRIMARY_COLOR = "#7C3AED";
const BG_COLOR = "#f4f4f7";
const CONTACT_EMAIL = "contato@agencialinkou.com.br";
const CONTACT_PHONE = "(41) 98898-8054";

export function baseEmailLayout(content: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:${BG_COLOR};font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:${BG_COLOR};padding:40px 0;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
  <tr><td style="background:${PRIMARY_COLOR};padding:32px;text-align:center;">
    <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:1px;">Linkou</h1>
  </td></tr>
  <tr><td style="padding:36px 32px 24px;">
    ${content}
  </td></tr>
  <tr><td style="padding:24px 32px;border-top:1px solid #eee;text-align:center;">
    <p style="margin:0 2px;color:#1a1a2e;font-size:14px;font-weight:700;">Leo Santana</p>
    <p style="margin:0 0 8px;color:#4a4a68;font-size:12px;font-weight:500;">Diretor Comercial — Linkou</p>
    <p style="margin:0;color:#9e9eb8;font-size:13px;font-weight:600;">Linkou — Marketing de Performance</p>
    <p style="margin:8px 0 4px;color:#9e9eb8;font-size:12px;">✉ <a href="mailto:${CONTACT_EMAIL}" style="color:${PRIMARY_COLOR};text-decoration:none;">${CONTACT_EMAIL}</a></p>
    <p style="margin:0 0 4px;color:#9e9eb8;font-size:12px;">📞 ${CONTACT_PHONE}</p>
    <p style="margin:0;"><a href="https://agencialinkou.com.br" style="color:${PRIMARY_COLOR};font-size:12px;text-decoration:none;">agencialinkou.com.br</a></p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

function ctaButton(text: string, url: string): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
  <tr><td align="center">
    <a href="${url}" style="display:inline-block;background:${PRIMARY_COLOR};color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:15px;font-weight:600;">${text}</a>
  </td></tr>
</table>`;
}

function infoBox(content: string): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f5ff;border-radius:8px;border:1px solid #e9dffc;margin:16px 0;">
  <tr><td style="padding:20px;">${content}</td></tr>
</table>`;
}

const PLATFORM_URL = "https://www.agencialinkou.com.br";

// ── Category 1: Account ──

export function welcomeEmail(name: string, email: string, password: string): { subject: string; html: string } {
  const displayName = name || "Usuário";
  return {
    subject: "Bem-vindo(a) à plataforma Linkou! 🚀",
    html: baseEmailLayout(`
      <h2 style="margin:0 0 16px;color:#1a1a2e;font-size:20px;">Olá, ${displayName}! 👋</h2>
      <p style="margin:0 0 20px;color:#4a4a68;font-size:15px;line-height:1.6;">Sua conta na plataforma da <strong>Linkou</strong> foi criada com sucesso. Abaixo estão suas credenciais de acesso:</p>
      ${infoBox(`
        <p style="margin:0 0 8px;color:#6b6b8d;font-size:13px;">E-mail de acesso</p>
        <p style="margin:0 0 16px;color:#1a1a2e;font-size:15px;font-weight:600;">${email}</p>
        <p style="margin:0 0 8px;color:#6b6b8d;font-size:13px;">Senha temporária</p>
        <p style="margin:0;color:#1a1a2e;font-size:15px;font-weight:600;">${password}</p>
      `)}
      ${ctaButton("Acessar Plataforma", `${PLATFORM_URL}/auth`)}
      <p style="margin:24px 0 0;padding:16px;background:#fff8e1;border-radius:8px;color:#7a6520;font-size:13px;line-height:1.5;">⚠️ Recomendamos que você troque sua senha no primeiro acesso para garantir a segurança da sua conta.</p>
    `),
  };
}

export function passwordChangedEmail(name: string, newPassword: string): { subject: string; html: string } {
  return {
    subject: "Sua senha foi alterada — Linkou",
    html: baseEmailLayout(`
      <h2 style="margin:0 0 16px;color:#1a1a2e;font-size:20px;">Olá, ${name || "Usuário"}!</h2>
      <p style="margin:0 0 20px;color:#4a4a68;font-size:15px;line-height:1.6;">Sua senha de acesso à plataforma Linkou foi alterada pelo administrador.</p>
      ${infoBox(`
        <p style="margin:0 0 8px;color:#6b6b8d;font-size:13px;">Nova senha</p>
        <p style="margin:0;color:#1a1a2e;font-size:15px;font-weight:600;">${newPassword}</p>
      `)}
      ${ctaButton("Acessar Plataforma", `${PLATFORM_URL}/auth`)}
      <p style="margin:16px 0 0;color:#7a6520;font-size:13px;background:#fff8e1;padding:16px;border-radius:8px;">⚠️ Recomendamos que você troque sua senha após o login.</p>
    `),
  };
}

// ── Category 2: Tasks ──

export function taskAssignedEmail(clientName: string, taskTitle: string, dueDate: string | null): { subject: string; html: string } {
  return {
    subject: `Nova tarefa atribuída — ${clientName}`,
    html: baseEmailLayout(`
      <h2 style="margin:0 0 16px;color:#1a1a2e;font-size:20px;">📋 Nova tarefa atribuída</h2>
      <p style="margin:0 0 20px;color:#4a4a68;font-size:15px;line-height:1.6;">Uma nova tarefa foi criada para o cliente <strong>${clientName}</strong>.</p>
      ${infoBox(`
        <p style="margin:0 0 8px;color:#6b6b8d;font-size:13px;">Tarefa</p>
        <p style="margin:0 0 16px;color:#1a1a2e;font-size:15px;font-weight:600;">${taskTitle}</p>
        ${dueDate ? `<p style="margin:0 0 8px;color:#6b6b8d;font-size:13px;">Prazo</p><p style="margin:0;color:#1a1a2e;font-size:15px;font-weight:600;">${dueDate}</p>` : ""}
      `)}
      ${ctaButton("Ver Tarefas", `${PLATFORM_URL}/cliente/tarefas`)}
    `),
  };
}

export function taskCompletedEmail(clientName: string, taskTitle: string): { subject: string; html: string } {
  return {
    subject: `Tarefa concluída — ${clientName}`,
    html: baseEmailLayout(`
      <h2 style="margin:0 0 16px;color:#1a1a2e;font-size:20px;">✅ Tarefa concluída</h2>
      <p style="margin:0 0 20px;color:#4a4a68;font-size:15px;line-height:1.6;">A tarefa abaixo do cliente <strong>${clientName}</strong> foi marcada como concluída.</p>
      ${infoBox(`
        <p style="margin:0 0 8px;color:#6b6b8d;font-size:13px;">Tarefa</p>
        <p style="margin:0;color:#1a1a2e;font-size:15px;font-weight:600;">${taskTitle}</p>
      `)}
      ${ctaButton("Ver Tarefas", `${PLATFORM_URL}/cliente/tarefas`)}
    `),
  };
}

export function taskDeadlineReminderEmail(taskTitle: string, dueDate: string, isToday: boolean): { subject: string; html: string } {
  const emoji = isToday ? "⚠️" : "📅";
  const label = isToday ? "vence hoje" : "vence amanhã";
  return {
    subject: `${emoji} Tarefa ${label}: ${taskTitle}`,
    html: baseEmailLayout(`
      <h2 style="margin:0 0 16px;color:#1a1a2e;font-size:20px;">${emoji} Lembrete de prazo</h2>
      <p style="margin:0 0 20px;color:#4a4a68;font-size:15px;line-height:1.6;">A tarefa abaixo <strong>${label}</strong>!</p>
      ${infoBox(`
        <p style="margin:0 0 8px;color:#6b6b8d;font-size:13px;">Tarefa</p>
        <p style="margin:0 0 16px;color:#1a1a2e;font-size:15px;font-weight:600;">${taskTitle}</p>
        <p style="margin:0 0 8px;color:#6b6b8d;font-size:13px;">Prazo</p>
        <p style="margin:0;color:#1a1a2e;font-size:15px;font-weight:600;">${dueDate}</p>
      `)}
      ${ctaButton("Ver Tarefas", `${PLATFORM_URL}/cliente/tarefas`)}
    `),
  };
}

// ── Category 3: Campaigns ──

export function campaignPendingApprovalEmail(clientName: string, campaignName: string): { subject: string; html: string } {
  return {
    subject: `Campanha pendente de aprovação — ${clientName}`,
    html: baseEmailLayout(`
      <h2 style="margin:0 0 16px;color:#1a1a2e;font-size:20px;">🔔 Campanha aguardando aprovação</h2>
      <p style="margin:0 0 20px;color:#4a4a68;font-size:15px;line-height:1.6;">A campanha abaixo do cliente <strong>${clientName}</strong> está pronta para sua revisão e aprovação.</p>
      ${infoBox(`
        <p style="margin:0 0 8px;color:#6b6b8d;font-size:13px;">Campanha</p>
        <p style="margin:0;color:#1a1a2e;font-size:15px;font-weight:600;">${campaignName}</p>
      `)}
      ${ctaButton("Revisar Campanha", `${PLATFORM_URL}/cliente/campanhas`)}
    `),
  };
}

export function campaignApprovedEmail(clientName: string, campaignName: string, approverName: string): { subject: string; html: string } {
  return {
    subject: `Campanha aprovada — ${clientName}`,
    html: baseEmailLayout(`
      <h2 style="margin:0 0 16px;color:#1a1a2e;font-size:20px;">✅ Campanha aprovada!</h2>
      <p style="margin:0 0 20px;color:#4a4a68;font-size:15px;line-height:1.6;">A campanha do cliente <strong>${clientName}</strong> foi aprovada por <strong>${approverName}</strong>.</p>
      ${infoBox(`
        <p style="margin:0 0 8px;color:#6b6b8d;font-size:13px;">Campanha</p>
        <p style="margin:0;color:#1a1a2e;font-size:15px;font-weight:600;">${campaignName}</p>
      `)}
      ${ctaButton("Ver Campanha", `${PLATFORM_URL}/admin/campanhas`)}
    `),
  };
}

// ── Category 4: Appointments ──

export function appointmentCreatedEmail(title: string, dateStr: string, clientName: string): { subject: string; html: string } {
  return {
    subject: `Novo agendamento — ${clientName}`,
    html: baseEmailLayout(`
      <h2 style="margin:0 0 16px;color:#1a1a2e;font-size:20px;">📅 Novo agendamento criado</h2>
      <p style="margin:0 0 20px;color:#4a4a68;font-size:15px;line-height:1.6;">Um agendamento foi solicitado pelo cliente <strong>${clientName}</strong>.</p>
      ${infoBox(`
        <p style="margin:0 0 8px;color:#6b6b8d;font-size:13px;">Título</p>
        <p style="margin:0 0 16px;color:#1a1a2e;font-size:15px;font-weight:600;">${title}</p>
        <p style="margin:0 0 8px;color:#6b6b8d;font-size:13px;">Data e hora</p>
        <p style="margin:0;color:#1a1a2e;font-size:15px;font-weight:600;">${dateStr}</p>
      `)}
      ${ctaButton("Ver Agendamentos", `${PLATFORM_URL}/cliente/agendamentos`)}
    `),
  };
}

export function appointmentReminderEmail(title: string, dateStr: string): { subject: string; html: string } {
  return {
    subject: `Lembrete: reunião amanhã — ${title}`,
    html: baseEmailLayout(`
      <h2 style="margin:0 0 16px;color:#1a1a2e;font-size:20px;">⏰ Lembrete de reunião</h2>
      <p style="margin:0 0 20px;color:#4a4a68;font-size:15px;line-height:1.6;">Você tem uma reunião agendada para amanhã.</p>
      ${infoBox(`
        <p style="margin:0 0 8px;color:#6b6b8d;font-size:13px;">Título</p>
        <p style="margin:0 0 16px;color:#1a1a2e;font-size:15px;font-weight:600;">${title}</p>
        <p style="margin:0 0 8px;color:#6b6b8d;font-size:13px;">Data e hora</p>
        <p style="margin:0;color:#1a1a2e;font-size:15px;font-weight:600;">${dateStr}</p>
      `)}
      ${ctaButton("Ver Agendamentos", `${PLATFORM_URL}/cliente/agendamentos`)}
    `),
  };
}

// ── Category 5: Journey ──

const phaseLabels: Record<string, string> = {
  diagnostico: "Diagnóstico",
  estruturacao: "Estruturação",
  operacao_guiada: "Operação Guiada",
  transferencia: "Transferência",
};

export function phaseChangedEmail(clientName: string, fromPhase: string, toPhase: string): { subject: string; html: string } {
  const from = phaseLabels[fromPhase] || fromPhase;
  const to = phaseLabels[toPhase] || toPhase;
  return {
    subject: `Mudança de fase — ${clientName}`,
    html: baseEmailLayout(`
      <h2 style="margin:0 0 16px;color:#1a1a2e;font-size:20px;">🚀 Sua jornada avançou!</h2>
      <p style="margin:0 0 20px;color:#4a4a68;font-size:15px;line-height:1.6;">O cliente <strong>${clientName}</strong> avançou de fase na jornada Linkou.</p>
      ${infoBox(`
        <p style="margin:0 0 8px;color:#6b6b8d;font-size:13px;">De</p>
        <p style="margin:0 0 16px;color:#1a1a2e;font-size:15px;font-weight:600;">${from}</p>
        <p style="margin:0 0 8px;color:#6b6b8d;font-size:13px;">Para</p>
        <p style="margin:0;color:${PRIMARY_COLOR};font-size:15px;font-weight:600;">${to}</p>
      `)}
      ${ctaButton("Ver Minha Jornada", `${PLATFORM_URL}/cliente/jornada`)}
    `),
  };
}

// ── Category 6: Comments ──

export function newCommentEmail(
  commenterName: string,
  entityLabel: string,
  commentPreview: string,
  entityType: "campaign" | "learning",
): { subject: string; html: string } {
  const typeLabel = entityType === "campaign" ? "campanha" : "aprendizado";
  return {
    subject: `Novo comentário em ${typeLabel} — ${entityLabel}`,
    html: baseEmailLayout(`
      <h2 style="margin:0 0 16px;color:#1a1a2e;font-size:20px;">💬 Novo comentário</h2>
      <p style="margin:0 0 20px;color:#4a4a68;font-size:15px;line-height:1.6;"><strong>${commenterName}</strong> comentou na ${typeLabel} <strong>${entityLabel}</strong>:</p>
      ${infoBox(`
        <p style="margin:0;color:#1a1a2e;font-size:14px;line-height:1.6;font-style:italic;">"${commentPreview}"</p>
      `)}
      ${ctaButton("Ver Comentário", `${PLATFORM_URL}/cliente/campanhas`)}
    `),
  };
}

// ── Category 7: Payments ──

export function paymentRegisteredEmail(clientName: string, amount: string, description: string, dueDate: string | null): { subject: string; html: string } {
  return {
    subject: `Novo pagamento registrado — ${clientName}`,
    html: baseEmailLayout(`
      <h2 style="margin:0 0 16px;color:#1a1a2e;font-size:20px;">💰 Pagamento registrado</h2>
      <p style="margin:0 0 20px;color:#4a4a68;font-size:15px;line-height:1.6;">Um novo pagamento foi registrado para o cliente <strong>${clientName}</strong>.</p>
      ${infoBox(`
        <p style="margin:0 0 8px;color:#6b6b8d;font-size:13px;">Descrição</p>
        <p style="margin:0 0 16px;color:#1a1a2e;font-size:15px;font-weight:600;">${description}</p>
        <p style="margin:0 0 8px;color:#6b6b8d;font-size:13px;">Valor</p>
        <p style="margin:0;color:#1a1a2e;font-size:15px;font-weight:600;">R$ ${amount}</p>
        ${dueDate ? `<p style="margin:16px 0 8px;color:#6b6b8d;font-size:13px;">Vencimento</p><p style="margin:0;color:#1a1a2e;font-size:15px;font-weight:600;">${dueDate}</p>` : ""}
      `)}
    `),
  };
}

export function paymentDueReminderEmail(clientName: string, amount: string, description: string, dueDate: string): { subject: string; html: string } {
  return {
    subject: `Pagamento vencendo em breve — ${clientName}`,
    html: baseEmailLayout(`
      <h2 style="margin:0 0 16px;color:#1a1a2e;font-size:20px;">⚠️ Pagamento próximo do vencimento</h2>
      <p style="margin:0 0 20px;color:#4a4a68;font-size:15px;line-height:1.6;">O pagamento abaixo vence em breve.</p>
      ${infoBox(`
        <p style="margin:0 0 8px;color:#6b6b8d;font-size:13px;">Descrição</p>
        <p style="margin:0 0 16px;color:#1a1a2e;font-size:15px;font-weight:600;">${description}</p>
        <p style="margin:0 0 8px;color:#6b6b8d;font-size:13px;">Valor</p>
        <p style="margin:0 0 16px;color:#1a1a2e;font-size:15px;font-weight:600;">R$ ${amount}</p>
        <p style="margin:0 0 8px;color:#6b6b8d;font-size:13px;">Vencimento</p>
        <p style="margin:0;color:#c0392b;font-size:15px;font-weight:600;">${dueDate}</p>
      `)}
    `),
  };
}

// ── Category 8: Lead Thank You ──

export function leadThankYouEmail(name: string): { subject: string; html: string } {
  const displayName = name || "Olá";
  return {
    subject: "Recebemos seu contato! — Linkou",
    html: baseEmailLayout(`
      <h2 style="margin:0 0 16px;color:#1a1a2e;font-size:20px;">Olá, ${displayName}! 👋</h2>
      <p style="margin:0 0 20px;color:#4a4a68;font-size:15px;line-height:1.6;">Recebemos seu contato com sucesso! Agradecemos pelo interesse em nossos serviços.</p>
      <p style="margin:0 0 20px;color:#4a4a68;font-size:15px;line-height:1.6;">Nossa equipe está analisando suas informações e <strong>retornará em até 24h úteis</strong> com um diagnóstico inicial do seu cenário.</p>
      ${infoBox(`
        <p style="margin:0;color:#1a1a2e;font-size:14px;line-height:1.6;">Enquanto isso, conheça mais sobre nosso trabalho nas redes sociais e no nosso site.</p>
      `)}
      ${ctaButton("Conheça a Linkou", "https://agencialinkou.com.br")}
      <p style="margin:24px 0 0;color:#4a4a68;font-size:13px;line-height:1.5;">Se tiver alguma dúvida urgente, entre em contato pelo nosso WhatsApp.</p>
    `),
  };
}
