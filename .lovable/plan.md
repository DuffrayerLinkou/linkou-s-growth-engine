
# Diagnóstico e Roadmap da Experiência do Usuário Cliente

## Visão Geral

O ecossistema do cliente está funcional e bem estruturado. A governança de permissões por perfil (Manager, Ponto Focal, Operador) é sólida. O que falta agora é **qualidade de experiência**: o cliente sente que usa uma ferramenta interna de agência, não um painel feito para ele. O objetivo é transformar essa percepção.

---

## Diagnóstico por Página

### Dashboard (`/cliente`)
- **Problema 1** — Ausência de estado vazio inteligente: quando o cliente está recém-onboarded e não há dados ainda, o dashboard exibe cards com zeros e sem contexto. O usuário não sabe o que fazer a seguir.
- **Problema 2** — O card "Ações Pendentes" (aprovação de campanhas) só aparece para Ponto Focal e só quando há pendências. Mas campanhas pendentes de aprovação são o momento mais crítico da jornada — deveriam ter destaque muito maior.
- **Problema 3** — O card "Atividade Recente" usa logs de auditoria com labels técnicas (entity_type: `experiments`) que podem confundir o cliente.
- **Melhoria** — Adicionar uma seção de boas-vindas contextual para novos clientes (sem tarefas/campanhas ainda) com um guia de próximos passos.

### Minha Jornada (`/cliente/minha-jornada`)
- **Problema 1** — A seção de confirmação de ciência (acknowledgement) só existe para Ponto Focal. Para Operadores, ela mostra "Aguardando confirmação", o que pode gerar confusão sobre quem é o Ponto Focal.
- **Problema 2** — As tarefas da fase aparecem em uma lista simples sem possibilidade de interação (exceto ver). Não há link direto para a tarefa na página de Tarefas.
- **Melhoria** — Cada tarefa da fase deveria ter um link `→ Ver tarefa` que abre o detalhe.

### Tarefas (`/cliente/tarefas`)
- **Problema 1** — O botão "Concluir" no card de "Suas Responsabilidades" abre um `AlertDialog` genérico ("Confirmar conclusão?"). Esse é um momento de **conquista** para o cliente — deveria ser celebrado com um feedback visual mais rico (confetti, animação, mensagem de parabéns).
- **Problema 2** — A view de lista agrupa por fase mas fases futuras aparecem visíveis com suas tarefas, o que pode gerar ansiedade desnecessária. Fases futuras deveriam estar colapsadas por padrão.
- **Problema 3** — Não há um indicador de "quem criou esta tarefa" (agência vs cliente). A tarefa da agência e a tarefa criada pelo próprio cliente têm o mesmo visual.
- **Melhoria** — Badge "Criada por você" vs "Criada pela equipe Linkou" nas tarefas.

### Campanhas (`/cliente/campanhas`)
- **Problema 1** — Campanhas em `pending_approval` não têm destaque visual suficiente. Um cliente que não faz login com frequência pode perder campanhas aguardando aprovação há dias.
- **Problema 2** — O botão de aprovação (`ApprovalButton`) está misturado no meio do `CardHeader`, entre badges de status e datas, sem hierarquia visual clara.
- **Melhoria** — Campanhas pendentes de aprovação deveriam aparecer em uma seção pinada no topo, separada da lista geral, com um banner de urgência.

### Arquivos (`/cliente/arquivos`)
- **Problema 1** — A busca e os filtros são bons, mas não há preview de imagens diretamente no card. O usuário precisa clicar em "Visualizar" para ver uma imagem simples.
- **Problema 2** — O card de arquivo não mostra quando foi enviado **em relação ao tempo** ("há 2 dias", "há 1 semana") — apenas a data absoluta.
- **Melhoria** — Usar `formatDistanceToNow` do `date-fns` para datas relativas nos cards.

### Métricas de Tráfego (`/cliente/metricas-trafego`)
- **Problema 1** — A tela de acesso restrito é muito fria: apenas um ícone e "Acesso Restrito". O Operador não sabe nem o que está perdendo.
- **Problema 2** — A tabela mensal tem 12 colunas + 12 linhas, o que fica ilegível em mobile. Não há scroll horizontal explícito indicado ao usuário.
- **Melhoria** — Adicionar scroll hint no mobile e melhorar a tela de acesso restrito para ser mais acolhedora.

### Base de Conhecimento (`/cliente/base-conhecimento`)
- **Ponto positivo** — Conteúdo muito rico e bem organizado.
- **Problema 1** — O conteúdo é estático (hardcoded). Não há forma de o admin adicionar novos guias ou artigos via painel.
- **Problema 2** — Não há barra de busca dentro da Base de Conhecimento para o cliente encontrar um tema específico.
- **Melhoria** — Adicionar campo de busca que filtra guias por palavra-chave em tempo real.

### Minha Conta (`/cliente/minha-conta`)
- **Funcional e limpo.** Único ponto de melhoria: o usuário não pode atualizar seu avatar (foto de perfil). O campo `avatar_url` existe no banco mas não há UI para upload.

---

## Roadmap Priorizado

### Prioridade ALTA (impacto direto na retenção e engajamento)

| # | Melhoria | Arquivo(s) | Esforço |
|---|---|---|---|
| 1 | Banner de aprovação urgente no topo da página de Campanhas | `Campanhas.tsx` | Baixo |
| 2 | Feedback de celebração ao concluir tarefa (animação + mensagem) | `Tarefas.tsx` | Médio |
| 3 | Estado vazio inteligente no Dashboard (guia de próximos passos) | `Dashboard.tsx` | Médio |
| 4 | Busca em tempo real na Base de Conhecimento | `BaseConhecimento.tsx` | Baixo |

### Prioridade MÉDIA (qualidade de experiência)

| # | Melhoria | Arquivo(s) | Esforço |
|---|---|---|---|
| 5 | Badge "Equipe Linkou" vs "Criada por você" nas tarefas | `Tarefas.tsx` | Baixo |
| 6 | Fases futuras colapsadas por padrão na view de lista | `Tarefas.tsx` | Baixo |
| 7 | Datas relativas nos cards de arquivos | `Arquivos.tsx` | Baixo |
| 8 | Link "→ Ver tarefa" nas tarefas da Jornada | `MinhaJornada.tsx` | Baixo |
| 9 | Tela de "Acesso Restrito" mais amigável nas Métricas | `MetricasTrafego.tsx` | Baixo |

### Prioridade BAIXA (melhorias incrementais)

| # | Melhoria | Arquivo(s) | Esforço |
|---|---|---|---|
| 10 | Upload de avatar no perfil | `MinhaConta.tsx` | Médio |
| 11 | Preview de imagens diretamente no card de arquivo | `Arquivos.tsx` | Médio |
| 12 | Scroll horizontal indicado na tabela de métricas no mobile | `MetricasTrafego.tsx` | Baixo |

---

## O que NÃO está no scope desta análise

- Mudanças na estrutura do banco de dados (RLS/tabelas)
- A experiência do Admin (painel separado, já funcional)
- O Linkouzinho (já recentemente atualizado)

---

## Proposta de Execução

Implementar as **4 melhorias de Prioridade ALTA** em um único conjunto de alterações, pois todas afetam páginas diferentes e podem ser feitas em paralelo sem conflito:

1. Banner "Aprovação Urgente" no topo de `/cliente/campanhas`
2. Animação de celebração ao concluir tarefa em `/cliente/tarefas`
3. Estado vazio com guia de próximos passos no `/cliente` (Dashboard)
4. Barra de busca em tempo real na Base de Conhecimento

Você quer implementar todas as 4 de uma vez, ou prefere priorizar alguma em específico?
