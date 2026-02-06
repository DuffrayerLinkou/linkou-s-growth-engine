

# Plano: Adicionar Servicos de Site/Landing Page e Aplicacao Web

## O que muda

Adicionar dois novos tipos de servico ao sistema:
- **Site e Landing Page** - Criacao de sites institucionais e landing pages de alta conversao
- **Aplicacao Web** - Desenvolvimento de aplicacoes web com auxilio e suporte de IA

Esses novos servicos aparecerao em:
1. Configuracao de fases e jornadas (admin)
2. Pagina de Templates (admin)
3. Dialog de aplicar templates no detalhe do cliente
4. Landing page publica (secao de servicos)

---

## Novos Servicos e Fases

### Site e Landing Page
| Fase | Label |
|------|-------|
| briefing | Briefing |
| wireframe | Wireframe |
| desenvolvimento | Desenvolvimento |
| revisao | Revisao |
| publicacao | Publicacao |

### Aplicacao Web (IA)
| Fase | Label |
|------|-------|
| descoberta | Descoberta |
| prototipo | Prototipo |
| desenvolvimento | Desenvolvimento |
| testes | Testes |
| deploy | Deploy |

---

## Arquivos a Modificar

### 1. `src/lib/service-phases-config.ts`
- Expandir o type `ServiceType` para incluir `"site"` e `"webapp"`
- Adicionar as entradas em `serviceTypes[]`
- Adicionar as fases em `servicePhases{}`

### 2. `src/lib/services-config.ts`
- Adicionar os dois novos servicos no array `services[]` com icones (Globe para Site, Code para WebApp), titulo, subtitulo, descricao e features

### 3. `src/components/landing/Services.tsx`
- Nenhuma alteracao necessaria (ja renderiza dinamicamente a partir de `services-config.ts`)

### 4. Migration SQL (banco de dados)
- Inserir templates iniciais para os dois novos servicos em `task_templates`

---

## Templates Iniciais

### Site e Landing Page

**Briefing:**
1. Reuniao de briefing do projeto
2. Definir objetivos e publico-alvo
3. Levantar conteudos e referencias

**Wireframe:**
4. Criar wireframe das paginas
5. Aprovar estrutura com cliente

**Desenvolvimento:**
6. Desenvolvimento do layout
7. Implementacao responsiva
8. Integracao de formularios e tracking

**Revisao:**
9. Revisao com cliente
10. Ajustes finais

**Publicacao:**
11. Configurar dominio e hospedagem
12. Publicar e testar

### Aplicacao Web (IA)

**Descoberta:**
1. Definir escopo e funcionalidades
2. Mapear fluxos do usuario
3. Definir stack e integracao com IA

**Prototipo:**
4. Criar prototipo navegavel
5. Validar com cliente

**Desenvolvimento:**
6. Desenvolvimento com Lovable/IA
7. Integracoes (Supabase, APIs)
8. Ajustes de UI/UX

**Testes:**
9. Testes funcionais
10. Revisao com cliente

**Deploy:**
11. Deploy em producao
12. Treinamento do usuario

---

## Detalhes Tecnicos

### Alteracao no ServiceType

```typescript
export type ServiceType = "auditoria" | "producao" | "gestao" | "design" | "site" | "webapp";
```

### Novos itens em serviceTypes

```typescript
{ value: "site", label: "Site e Landing Page", description: "Criacao de sites institucionais e landing pages" },
{ value: "webapp", label: "Aplicacao Web", description: "Desenvolvimento de apps web com suporte de IA" },
```

### Novas fases

```typescript
site: [
  { value: "briefing", label: "Briefing", color: "bg-rose-500/20 text-rose-600 border-rose-500/30", order: 1 },
  { value: "wireframe", label: "Wireframe", color: "bg-amber-500/20 text-amber-600 border-amber-500/30", order: 2 },
  { value: "desenvolvimento", label: "Desenvolvimento", color: "bg-blue-500/20 text-blue-600 border-blue-500/30", order: 3 },
  { value: "revisao", label: "Revisao", color: "bg-cyan-500/20 text-cyan-600 border-cyan-500/30", order: 4 },
  { value: "publicacao", label: "Publicacao", color: "bg-green-500/20 text-green-600 border-green-500/30", order: 5 },
],
webapp: [
  { value: "descoberta", label: "Descoberta", color: "bg-violet-500/20 text-violet-600 border-violet-500/30", order: 1 },
  { value: "prototipo", label: "Prototipo", color: "bg-fuchsia-500/20 text-fuchsia-600 border-fuchsia-500/30", order: 2 },
  { value: "desenvolvimento", label: "Desenvolvimento", color: "bg-sky-500/20 text-sky-600 border-sky-500/30", order: 3 },
  { value: "testes", label: "Testes", color: "bg-orange-500/20 text-orange-600 border-orange-500/30", order: 4 },
  { value: "deploy", label: "Deploy", color: "bg-green-500/20 text-green-600 border-green-500/30", order: 5 },
],
```

### Novos servicos na landing page (services-config.ts)

```typescript
{
  id: "site",
  icon: Globe,
  title: "Sites e Landing Pages",
  subtitle: "Presenca Digital",
  description: "Sites institucionais e landing pages de alta conversao...",
  features: ["Sites institucionais", "Landing pages", "Design responsivo", "SEO otimizado"],
},
{
  id: "webapp",
  icon: Code,
  title: "Aplicacao Web",
  subtitle: "Desenvolvido com IA",
  description: "Aplicacoes web sob medida, criadas com auxilio de inteligencia artificial...",
  features: ["Apps sob medida", "Integracao com IA", "Banco de dados", "Deploy automatizado"],
},
```

---

## Resultado Esperado

1. Admin ve 6 servicos no seletor de Templates e no dialog de aplicar templates
2. Cada servico tem suas fases proprias com templates pre-configurados
3. Landing page exibe os 6 servicos para visitantes
4. Sistema de jornada funciona normalmente com os novos tipos

