import { motion } from "framer-motion";
import { Search, Layers, Compass, Rocket } from "lucide-react";

const phases = [
  {
    icon: Search,
    phase: "01",
    title: "Auditoria Inicial",
    description:
      "Analisamos suas contas, funis e dados. Identificamos vazamentos, oportunidades rápidas e o que precisa de estrutura antes de escalar.",
    details: ["Análise de contas de anúncios", "Mapeamento de funil", "Identificação de quick wins"],
  },
  {
    icon: Layers,
    phase: "02",
    title: "Organização do Ecossistema",
    description:
      "Corrigimos tracking, conectamos dados e criamos dashboards claros. Você passa a enxergar o que antes era invisível.",
    details: ["Setup técnico completo", "Integração de ferramentas", "Criação de dashboards"],
  },
  {
    icon: Compass,
    phase: "03",
    title: "Consultoria Ativa",
    description:
      "Acompanhamos a operação com metodologia de experimentos. Cada mudança é testada, medida e documentada.",
    details: ["Campanhas otimizadas", "Experimentos A/B", "Reuniões de acompanhamento"],
  },
  {
    icon: Rocket,
    phase: "04",
    title: "Autonomia do Time",
    description:
      "Treinamos seu ponto focal para dominar o sistema. Você ganha independência — não precisa mais depender de agência nenhuma.",
    details: ["Treinamento hands-on", "Documentação completa", "Suporte na transição"],
  },
];

export function Method() {
  return (
    <section id="metodo" className="py-20 md:py-32 bg-primary/5 overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">
            Método Linkou de Auditoria e Consultoria
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mt-4 mb-6">
            Como funciona a <span className="text-primary">Auditoria e Consultoria de Tráfego</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Um processo estruturado em 4 fases que transforma seu marketing em um 
            sistema que aprende, evolui e — no final — <span className="text-foreground font-medium">você controla</span>.
          </p>
        </motion.div>

        {/* Intro paragraph */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-center text-muted-foreground max-w-3xl mx-auto mb-16"
        >
          Antes de otimizar, você precisa entender o que está acontecendo. Nossa auditoria revela onde o dinheiro está indo — e nossa consultoria <span className="text-foreground font-medium">organiza o caminho pra frente</span>.
        </motion.p>

        {/* Desktop Timeline - Horizontal */}
        <div className="hidden lg:block">
          {/* Timeline Track */}
          <div className="relative mb-12">
            {/* Background Line */}
            <div className="absolute top-8 left-[8%] right-[8%] h-1 bg-muted rounded-full" />
            
            {/* Animated Progress Line */}
            <motion.div
              className="absolute top-8 left-[8%] h-1 bg-gradient-to-r from-primary via-primary to-primary/50 rounded-full"
              initial={{ width: "0%" }}
              whileInView={{ width: "84%" }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1.8, ease: "easeOut", delay: 0.3 }}
            />
            
            {/* Phase Nodes */}
            <div className="relative flex justify-between px-[5%]">
              {phases.map((phase, index) => (
                <motion.div
                  key={index}
                  initial={{ scale: 0, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ 
                    delay: 0.5 + index * 0.2,
                    type: "spring",
                    stiffness: 200,
                    damping: 15
                  }}
                  className="relative flex flex-col items-center"
                >
                  {/* Node Circle */}
                  <motion.div 
                    className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/25 relative z-10"
                    whileHover={{ scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    <phase.icon className="h-7 w-7 text-primary-foreground" />
                  </motion.div>
                  
                  {/* Pulsing Ring */}
                  <motion.div
                    className="absolute top-0 w-16 h-16 rounded-full border-2 border-primary/50"
                    animate={{ 
                      scale: [1, 1.4, 1],
                      opacity: [0.6, 0, 0.6]
                    }}
                    transition={{
                      duration: 2.5,
                      repeat: Infinity,
                      delay: index * 0.4,
                      ease: "easeInOut"
                    }}
                  />
                  
                  {/* Phase Number Badge */}
                  <motion.div 
                    className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-background border-2 border-primary flex items-center justify-center shadow-md z-20"
                    initial={{ scale: 0, rotate: -180 }}
                    whileInView={{ scale: 1, rotate: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.7 + index * 0.2, type: "spring" }}
                  >
                    <span className="text-xs font-bold text-primary">{phase.phase}</span>
                  </motion.div>

                  {/* Phase Title Below Node */}
                  <motion.span
                    className="mt-4 text-sm font-semibold text-foreground text-center max-w-[120px]"
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.8 + index * 0.15 }}
                  >
                    {phase.title}
                  </motion.span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Desktop Cards Grid */}
          <div className="grid lg:grid-cols-4 gap-6 mt-8">
            {phases.map((phase, index) => (
              <PhaseCard key={index} phase={phase} index={index} />
            ))}
          </div>
        </div>

        {/* Mobile Timeline - Vertical */}
        <div className="lg:hidden space-y-0">
          {phases.map((phase, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="flex gap-4 md:gap-6"
            >
              {/* Timeline Connector */}
              <div className="flex flex-col items-center">
                {/* Node */}
                <motion.div
                  className="relative"
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ 
                    delay: 0.2 + index * 0.15,
                    type: "spring",
                    stiffness: 200
                  }}
                >
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/25 z-10 relative">
                    <phase.icon className="h-6 w-6 md:h-7 md:w-7 text-primary-foreground" />
                  </div>
                  
                  {/* Pulsing Ring */}
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-primary/50"
                    animate={{ 
                      scale: [1, 1.3, 1],
                      opacity: [0.5, 0, 0.5]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: index * 0.3
                    }}
                  />
                  
                  {/* Phase Number Badge */}
                  <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-background border-2 border-primary flex items-center justify-center shadow-sm z-20">
                    <span className="text-[10px] font-bold text-primary">{phase.phase}</span>
                  </div>
                </motion.div>
                
                {/* Vertical Line */}
                {index < phases.length - 1 && (
                  <motion.div
                    className="w-0.5 flex-1 min-h-[40px] origin-top"
                    style={{
                      background: "linear-gradient(to bottom, hsl(var(--primary)), hsl(var(--primary) / 0.3))"
                    }}
                    initial={{ scaleY: 0 }}
                    whileInView={{ scaleY: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 + index * 0.15, duration: 0.5 }}
                  />
                )}
              </div>
              
              {/* Card Content */}
              <div className="pb-6 flex-1">
                <PhaseCard phase={phase} index={index} isMobile />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

interface PhaseCardProps {
  phase: typeof phases[0];
  index: number;
  isMobile?: boolean;
}

function PhaseCard({ phase, index, isMobile }: PhaseCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: isMobile ? 0.1 : 0.3 + index * 0.1, duration: 0.5 }}
      whileHover={{ 
        y: -5,
        transition: { type: "spring", stiffness: 300 }
      }}
      className="group relative bg-card border border-border rounded-2xl p-5 md:p-6 overflow-hidden h-full shadow-sm hover:shadow-xl transition-shadow"
    >
      {/* Gradient Hover Overlay */}
      <motion.div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: "linear-gradient(135deg, hsl(var(--primary) / 0.08), transparent 60%)",
        }}
      />
      
      {/* Animated Border Glow on Hover */}
      <motion.div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          boxShadow: "inset 0 0 0 1px hsl(var(--primary) / 0.3), 0 8px 32px -8px hsl(var(--primary) / 0.15)"
        }}
      />
      
      {/* Content */}
      <div className="relative z-10">
        {/* Mobile: Hide icon since it's in the timeline node */}
        {!isMobile && (
          <div className="flex items-center gap-3 mb-4">
            <motion.div 
              className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"
              whileHover={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 0.5 }}
            >
              <phase.icon className="h-5 w-5 text-primary" />
            </motion.div>
            <span className="text-3xl font-bold text-primary/20">{phase.phase}</span>
          </div>
        )}
        
        {/* Title */}
        <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-3 text-foreground group-hover:text-primary transition-colors duration-300">
          {phase.title}
        </h3>
        
        {/* Description */}
        <p className="text-muted-foreground text-sm md:text-base mb-4">
          {phase.description}
        </p>

        {/* Details with Stagger Animation */}
        <ul className="space-y-2">
          {phase.details.map((detail, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: (isMobile ? 0.2 : 0.5) + index * 0.08 + i * 0.1 }}
              className="flex items-center gap-2 text-sm"
            >
              <motion.span 
                className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0"
                animate={{ 
                  scale: [1, 1.4, 1],
                  opacity: [0.7, 1, 0.7]
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity, 
                  delay: i * 0.3 
                }}
              />
              <span className="text-muted-foreground group-hover:text-foreground transition-colors duration-300">
                {detail}
              </span>
            </motion.li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}
