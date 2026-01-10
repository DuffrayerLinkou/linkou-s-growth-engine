import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator, TrendingUp, Users, Target, DollarSign, BarChart3, Percent, ShoppingCart } from "lucide-react";

interface CalculatorProps {
  title: string;
  description: string;
  icon: React.ElementType;
  inputs: { key: string; label: string; placeholder?: string }[];
  calculate: (values: Record<string, number>) => { label: string; value: string };
  color: string;
}

function CalculatorCard({ title, description, icon: Icon, inputs, calculate, color }: CalculatorProps) {
  const [values, setValues] = useState<Record<string, string>>({});

  const numericValues: Record<string, number> = {};
  inputs.forEach((input) => {
    numericValues[input.key] = parseFloat(values[input.key] || "0") || 0;
  });

  const allFilled = inputs.every((input) => values[input.key] && parseFloat(values[input.key]) > 0);
  const result = allFilled ? calculate(numericValues) : null;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription className="text-xs">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {inputs.map((input) => (
          <div key={input.key} className="space-y-1">
            <Label className="text-xs">{input.label}</Label>
            <Input
              type="number"
              placeholder={input.placeholder || "0"}
              value={values[input.key] || ""}
              onChange={(e) => setValues({ ...values, [input.key]: e.target.value })}
              className="h-9"
            />
          </div>
        ))}
        {result && (
          <div className="pt-3 border-t">
            <p className="text-xs text-muted-foreground">{result.label}</p>
            <p className="text-2xl font-bold text-primary">{result.value}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const calculators: CalculatorProps[] = [
  {
    title: "ROI",
    description: "Retorno sobre Investimento",
    icon: TrendingUp,
    color: "bg-green-500/20 text-green-600",
    inputs: [
      { key: "receita", label: "Receita Gerada (R$)", placeholder: "10000" },
      { key: "investimento", label: "Investimento Total (R$)", placeholder: "2000" },
    ],
    calculate: (v) => ({
      label: "ROI",
      value: `${(((v.receita - v.investimento) / v.investimento) * 100).toFixed(2)}%`,
    }),
  },
  {
    title: "ROAS",
    description: "Retorno sobre Gasto em Anúncios",
    icon: BarChart3,
    color: "bg-blue-500/20 text-blue-600",
    inputs: [
      { key: "receita", label: "Receita de Anúncios (R$)", placeholder: "15000" },
      { key: "gasto", label: "Gasto em Anúncios (R$)", placeholder: "3000" },
    ],
    calculate: (v) => ({
      label: "ROAS",
      value: `${(v.receita / v.gasto).toFixed(2)}x`,
    }),
  },
  {
    title: "CAC",
    description: "Custo de Aquisição de Cliente",
    icon: Users,
    color: "bg-purple-500/20 text-purple-600",
    inputs: [
      { key: "custo", label: "Custo Total de Marketing (R$)", placeholder: "5000" },
      { key: "clientes", label: "Novos Clientes Adquiridos", placeholder: "25" },
    ],
    calculate: (v) => ({
      label: "CAC",
      value: `R$ ${(v.custo / v.clientes).toFixed(2)}`,
    }),
  },
  {
    title: "LTV",
    description: "Lifetime Value do Cliente",
    icon: DollarSign,
    color: "bg-orange-500/20 text-orange-600",
    inputs: [
      { key: "ticket", label: "Ticket Médio (R$)", placeholder: "200" },
      { key: "frequencia", label: "Compras por Ano", placeholder: "6" },
      { key: "retencao", label: "Anos de Retenção", placeholder: "2" },
    ],
    calculate: (v) => ({
      label: "LTV",
      value: `R$ ${(v.ticket * v.frequencia * v.retencao).toFixed(2)}`,
    }),
  },
  {
    title: "CPL",
    description: "Custo por Lead",
    icon: Target,
    color: "bg-pink-500/20 text-pink-600",
    inputs: [
      { key: "investimento", label: "Investimento (R$)", placeholder: "3000" },
      { key: "leads", label: "Leads Gerados", placeholder: "150" },
    ],
    calculate: (v) => ({
      label: "CPL",
      value: `R$ ${(v.investimento / v.leads).toFixed(2)}`,
    }),
  },
  {
    title: "CPA",
    description: "Custo por Aquisição",
    icon: ShoppingCart,
    color: "bg-red-500/20 text-red-600",
    inputs: [
      { key: "investimento", label: "Investimento (R$)", placeholder: "5000" },
      { key: "conversoes", label: "Conversões", placeholder: "50" },
    ],
    calculate: (v) => ({
      label: "CPA",
      value: `R$ ${(v.investimento / v.conversoes).toFixed(2)}`,
    }),
  },
  {
    title: "Taxa de Conversão",
    description: "Percentual de Conversão",
    icon: Percent,
    color: "bg-teal-500/20 text-teal-600",
    inputs: [
      { key: "conversoes", label: "Conversões", placeholder: "100" },
      { key: "visitantes", label: "Visitantes/Cliques", placeholder: "5000" },
    ],
    calculate: (v) => ({
      label: "Taxa de Conversão",
      value: `${((v.conversoes / v.visitantes) * 100).toFixed(2)}%`,
    }),
  },
  {
    title: "Ticket Médio",
    description: "Valor Médio por Venda",
    icon: Calculator,
    color: "bg-indigo-500/20 text-indigo-600",
    inputs: [
      { key: "receita", label: "Receita Total (R$)", placeholder: "50000" },
      { key: "vendas", label: "Número de Vendas", placeholder: "200" },
    ],
    calculate: (v) => ({
      label: "Ticket Médio",
      value: `R$ ${(v.receita / v.vendas).toFixed(2)}`,
    }),
  },
];

export function CalculatorsTab() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Calculadoras de Métricas
          </CardTitle>
          <CardDescription>
            Otimize suas campanhas de marketing digital com nossas calculadoras. 
            Descubra insights valiosos sobre ROI, CAC, LTV e muito mais.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {calculators.map((calc) => (
          <CalculatorCard key={calc.title} {...calc} />
        ))}
      </div>
    </div>
  );
}
