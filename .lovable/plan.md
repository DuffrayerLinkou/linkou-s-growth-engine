

# Plano: Expansão da Landing Page para Múltiplos Serviços

## Contexto Atual

A landing page está atualmente focada em um único serviço: **"Auditoria e Consultoria de Tráfego"**. Todas as seções (Hero, Method, Deliverables, ForWhom, FAQ, Testimonials) fazem referência exclusiva a este serviço.

## Novos Serviços a Adicionar

1. **Produção de Mídia** - Para anúncios e conteúdo orgânico
2. **Gestão de Tráfego Pago** - Recorrente e estratégico
3. **Design** - Identidade visual, Apps web, Sites e Landing Pages

---

## Solução Proposta

Criar uma seção de **"Serviços"** modular e visual que apresente todos os serviços da agência, mantendo a possibilidade de destacar cada um com suas características únicas.

### Estrutura da Nova Seção

```
Serviços Linkou
|
+-- Auditoria e Consultoria (existente, reorganizado)
|   +-- Diagnóstico de contas
|   +-- Tracking e pixels
|   +-- Treinamento do time
|
+-- Produção de Mídia (novo)
|   +-- Criativos para anúncios
|   +-- Conteúdo orgânico
|   +-- Vídeos e imagens
|
+-- Gestão de Tráfego (novo)
|   +-- Meta Ads e Google Ads
|   +-- Estratégia recorrente
|   +-- Relatórios mensais
|
+-- Design (novo)
    +-- Identidade Visual
    +-- Apps Web
    +-- Sites e Landing Pages
```

---

## Etapas de Implementação

### Etapa 1: Criar Componente de Serviços

Criar um novo componente `Services.tsx` com:
- Grid de cards para cada serviço
- Ícones distintos para cada categoria
- Descrição e features de cada serviço
- Animações com framer-motion (padrão do projeto)
- CTA para contato específico por serviço

### Etapa 2: Atualizar Componentes Existentes

**Hero.tsx**
- Atualizar headline para posicionamento mais amplo da agência
- Manter CTA principal para contato

**Header.tsx**
- Adicionar link "Serviços" na navegação
- Atualizar texto do CTA principal

**Footer.tsx**
- Adicionar links para cada serviço
- Atualizar descrição da agência

**ContactForm.tsx**
- Adicionar campo de seleção do serviço de interesse
- Mapear serviço selecionado para o lead

### Etapa 3: Reorganizar Seções Específicas

As seções Method, Deliverables e FAQ serão mantidas, mas com ajustes:
- Method: Pode ser renomeado para "Como Trabalhamos"
- Deliverables: Agora focará no serviço principal ou será substituído pela nova seção de Serviços
- FAQ: Adicionar perguntas sobre os novos serviços

### Etapa 4: Atualizar Estrutura da Página

**Index.tsx** atualizado:
```
Header
Hero (atualizado - posicionamento amplo)
Services (NOVO - grid de serviços)
Results (mantido)
ForWhom (mantido)
Testimonials (mantido)
FAQ (atualizado com novos serviços)
ContactForm (com seleção de serviço)
Footer (atualizado)
```

---

## Detalhes Técnicos

### Arquivos a Criar

| Arquivo | Descrição |
|---------|-----------|
| `src/components/landing/Services.tsx` | Nova seção de serviços com grid de cards |
| `src/lib/services-config.ts` | Configuração centralizada dos serviços |

### Arquivos a Modificar

| Arquivo | Alterações |
|---------|------------|
| `src/pages/Index.tsx` | Adicionar componente Services, remover/reorganizar Deliverables |
| `src/components/landing/Hero.tsx` | Atualizar headline e posicionamento |
| `src/components/landing/Header.tsx` | Adicionar link "Serviços" |
| `src/components/landing/ContactForm.tsx` | Adicionar campo de seleção de serviço |
| `src/components/landing/FAQ.tsx` | Adicionar perguntas sobre novos serviços |
| `src/components/landing/Footer.tsx` | Atualizar seção de navegação |

### Estrutura do Componente Services

```tsx
// src/lib/services-config.ts
export const services = [
  {
    id: "auditoria",
    icon: "Search",
    title: "Auditoria e Consultoria",
    subtitle: "Tráfego Pago",
    description: "Diagnóstico completo das suas contas, funis e dados...",
    features: ["Análise de contas", "Setup de tracking", "Treinamento"],
    highlight: true, // Destaque visual
  },
  {
    id: "producao",
    icon: "Video",
    title: "Produção de Mídia",
    subtitle: "Anúncios e Orgânico",
    description: "Criativos que convertem para suas campanhas...",
    features: ["Criativos para ads", "Conteúdo orgânico", "Vídeos"],
  },
  {
    id: "gestao",
    icon: "BarChart",
    title: "Gestão de Tráfego",
    subtitle: "Recorrente e Estratégico",
    description: "Operação contínua das suas campanhas...",
    features: ["Meta Ads", "Google Ads", "Relatórios mensais"],
  },
  {
    id: "design",
    icon: "Palette",
    title: "Design",
    subtitle: "Digital Completo",
    description: "Identidade visual e presença digital...",
    features: ["Identidade Visual", "Apps Web", "Sites e LPs"],
  },
];
```

### Atualização do ContactForm

Adicionar campo de seleção:

```tsx
// Novo campo no formulário
<Select
  value={formData.service}
  onValueChange={(value) => setFormData({ ...formData, service: value })}
>
  <SelectTrigger>
    <SelectValue placeholder="Qual serviço te interessa?" />
  </SelectTrigger>
  <SelectContent>
    {services.map((service) => (
      <SelectItem key={service.id} value={service.id}>
        {service.title}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

### Atualização do Banco de Dados

Será necessário adicionar uma coluna `service_interest` na tabela `leads` para armazenar o serviço de interesse selecionado pelo lead.

---

## Resultado Esperado

1. Landing page apresentando todos os serviços da Linkou de forma profissional
2. Navegação clara entre os serviços
3. Formulário de contato inteligente que captura o interesse específico
4. Posicionamento da agência como full-service de marketing digital
5. Manutenção do design e animações existentes

