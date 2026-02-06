

# Plano: Modelos de Jornada por Tipo de Serviço

## O que muda

Hoje, quando o admin aplica templates a um cliente, o sistema busca templates apenas pela fase da jornada (diagnostico, estruturacao, etc.), sem considerar o tipo de servico. O objetivo e permitir que o admin escolha qual **modelo de jornada** (Auditoria, Producao de Midia, Gestao de Trafego, Design) aplicar ao cliente, carregando automaticamente os templates corretos daquela jornada.

---

## Como vai funcionar

1. Na pagina de detalhe do cliente (ClientDetail), o botao "Aplicar Templates" abre um dialog
2. O admin primeiro seleciona o **tipo de servico/jornada** (Auditoria, Producao, Gestao, Design)
3. As fases mudam dinamicamente conforme o servico selecionado
4. O admin seleciona a **fase** desejada dentro daquele servico
5. Os templates daquela combinacao servico + fase sao carregados
6. O admin seleciona quais templates quer aplicar, define responsavel, data base e intervalo
7. As tarefas sao criadas com o `journey_phase` correto

---

## Alteracoes Necessarias

### Arquivo: `src/pages/admin/ClientDetail.tsx`

**1. Novo estado para selecao de servico:**
- Adicionar `selectedServiceType` (estado) com valor padrao `"auditoria"`
- Importar `serviceTypes`, `getPhasesByService` de `service-phases-config`

**2. Atualizar `fetchTemplates`:**
- Adicionar filtro por `service_type` alem de `journey_phase`
- Assinatura muda para `fetchTemplates(serviceType, phase)`

**3. Atualizar `handleOpenTemplateDialog`:**
- Ao abrir o dialog, carregar templates do servico e fase selecionados
- Nao depender mais apenas da fase atual do cliente

**4. Atualizar o Dialog de Templates:**
- Adicionar seletor de **Tipo de Servico** (botoes ou select) no topo do dialog
- Adicionar seletor de **Fase** que muda dinamicamente conforme o servico
- Quando o admin trocar servico ou fase, recarregar os templates
- Manter o restante do formulario igual (responsavel, data base, intervalo, checkboxes)

---

## Fluxo Visual do Dialog Atualizado

```text
+------------------------------------------+
|  Aplicar Templates de Tarefas            |
|                                          |
|  Tipo de Servico:                        |
|  [Auditoria] [Producao] [Gestao] [Design]|
|                                          |
|  Fase:                                   |
|  [Briefing] [Producao] [Revisao] [Entrega]|
|                                          |
|  Templates disponiveis:                  |
|  [x] 1. Reuniao de briefing criativo     |
|  [x] 2. Definir publico-alvo            |
|  [x] 3. Coletar referencias visuais     |
|  [ ] 4. Definir formatos                 |
|                                          |
|  Responsavel: [Selecione]                |
|  Data base: [2026-02-06]  Intervalo: [7] |
|                                          |
|  [Cancelar]  [Criar 3 Tarefas]           |
+------------------------------------------+
```

---

## Detalhes Tecnicos

### Importacoes a adicionar em ClientDetail.tsx

```typescript
import {
  ServiceType,
  serviceTypes,
  getPhasesByService,
} from "@/lib/service-phases-config";
```

### Novos estados

```typescript
const [selectedServiceType, setSelectedServiceType] = useState<ServiceType>("auditoria");
const [selectedTemplatePhase, setSelectedTemplatePhase] = useState<string>("");
```

### fetchTemplates atualizado

```typescript
const fetchTemplates = async (serviceType: ServiceType, phase: string) => {
  const { data, error } = await supabase
    .from("task_templates")
    .select("*")
    .eq("service_type", serviceType)
    .eq("journey_phase", phase)
    .eq("is_active", true)
    .order("order_index", { ascending: true });

  if (!error && data) {
    setTemplates(data as TaskTemplate[]);
    setSelectedTemplates(data.map((t) => t.id));
  }
};
```

### Logica de troca de servico/fase

- Quando `selectedServiceType` muda: atualizar `selectedTemplatePhase` para a primeira fase do servico e recarregar templates
- Quando `selectedTemplatePhase` muda: recarregar templates

### Interface TaskTemplate

Adicionar campo `service_type` na interface local:

```typescript
interface TaskTemplate {
  id: string;
  service_type: string;  // NOVO
  journey_phase: string;
  // ... restante
}
```

---

## Resultado Esperado

1. Admin abre o dialog de templates no detalhe do cliente
2. Seleciona o servico desejado (ex: "Design")
3. As fases mudam para "Descoberta, Conceito, Desenvolvimento, Entrega"
4. Seleciona a fase (ex: "Descoberta")
5. Ve os templates daquela combinacao e escolhe quais aplicar
6. Tarefas sao criadas com a fase e templates corretos
7. Pode repetir o processo para aplicar templates de outros servicos ao mesmo cliente

