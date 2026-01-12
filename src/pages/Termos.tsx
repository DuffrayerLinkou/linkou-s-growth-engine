import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, UserCog, AlertTriangle, Scale, CreditCard, Mail } from "lucide-react";

export default function Termos() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
              <FileText className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Termos de Uso
            </h1>
            <p className="text-muted-foreground">
              Última atualização: {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>

          {/* Content */}
          <div className="space-y-8">
            {/* Aceitação */}
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-xl font-semibold mb-4">1. Aceitação dos Termos</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Ao acessar e utilizar o site e a plataforma da <strong>Agência Linkou</strong>, 
                  você concorda em cumprir e estar vinculado a estes Termos de Uso. Se você não 
                  concordar com qualquer parte destes termos, não deverá utilizar nossos serviços.
                </p>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  Estes termos se aplicam a todos os visitantes, usuários e outras pessoas que 
                  acessam ou utilizam nossos serviços. Ao se cadastrar, você declara ter capacidade 
                  legal para aceitar estes termos.
                </p>
              </CardContent>
            </Card>

            {/* Descrição dos Serviços */}
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-xl font-semibold mb-4">2. Descrição dos Serviços</h2>
                <p className="text-muted-foreground mb-4">
                  A Agência Linkou oferece os seguintes serviços:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li><strong>Consultoria de Tráfego Pago:</strong> Análise, auditoria e otimização de campanhas</li>
                  <li><strong>Gestão de Campanhas:</strong> Criação e gerenciamento de anúncios em múltiplas plataformas</li>
                  <li><strong>Plataforma de Gestão:</strong> Acesso a dashboard para acompanhamento de métricas e entregas</li>
                  <li><strong>Relatórios e Análises:</strong> Relatórios periódicos de performance</li>
                  <li><strong>Treinamentos:</strong> Capacitação em marketing digital e vendas</li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  Os serviços específicos contratados, prazos e condições são definidos em proposta 
                  comercial e/ou contrato de prestação de serviços.
                </p>
              </CardContent>
            </Card>

            {/* Cadastro e Conta */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <UserCog className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold">3. Cadastro e Conta de Usuário</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">3.1 Criação de Conta</h3>
                    <p className="text-muted-foreground">
                      Para acessar a plataforma, é necessário criar uma conta com informações 
                      verdadeiras, completas e atualizadas. Você é responsável por manter a 
                      confidencialidade de suas credenciais de acesso.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">3.2 Responsabilidade</h3>
                    <p className="text-muted-foreground">
                      Você é responsável por todas as atividades realizadas em sua conta. 
                      Em caso de uso não autorizado, notifique-nos imediatamente.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">3.3 Veracidade das Informações</h3>
                    <p className="text-muted-foreground">
                      Você se compromete a fornecer informações verdadeiras e a mantê-las 
                      atualizadas. Informações falsas podem resultar na suspensão da conta.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Uso Permitido */}
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-xl font-semibold mb-4">4. Uso Permitido</h2>
                <p className="text-muted-foreground mb-4">
                  Ao utilizar nossos serviços, você concorda em:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>Usar a plataforma apenas para finalidades legítimas e autorizadas</li>
                  <li>Respeitar os direitos de propriedade intelectual</li>
                  <li>Não compartilhar credenciais de acesso com terceiros não autorizados</li>
                  <li>Manter dados e arquivos enviados em conformidade com a lei</li>
                  <li>Comunicar-se de forma respeitosa com nossa equipe</li>
                  <li>Cumprir as obrigações contratuais assumidas</li>
                </ul>
              </CardContent>
            </Card>

            {/* Condutas Proibidas */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                  <h2 className="text-xl font-semibold">5. Condutas Proibidas</h2>
                </div>
                <p className="text-muted-foreground mb-4">
                  É expressamente proibido:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>Tentar acessar áreas ou funcionalidades não autorizadas da plataforma</li>
                  <li>Realizar engenharia reversa ou tentar obter o código-fonte</li>
                  <li>Utilizar bots, scripts ou automações não autorizadas</li>
                  <li>Enviar conteúdo ilegal, ofensivo, difamatório ou que viole direitos de terceiros</li>
                  <li>Sobrecarregar ou prejudicar a infraestrutura técnica</li>
                  <li>Revender ou sublicenciar o acesso à plataforma</li>
                  <li>Utilizar os serviços para atividades fraudulentas ou ilegais</li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  O descumprimento destas regras pode resultar na suspensão ou cancelamento 
                  imediato da conta, sem prejuízo de outras medidas legais.
                </p>
              </CardContent>
            </Card>

            {/* Propriedade Intelectual */}
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-xl font-semibold mb-4">6. Propriedade Intelectual</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">6.1 Direitos da Linkou</h3>
                    <p className="text-muted-foreground">
                      A marca "Linkou", logotipos, design da plataforma, textos, gráficos, 
                      código-fonte e demais materiais são de propriedade exclusiva da Agência Linkou, 
                      protegidos por leis de propriedade intelectual.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">6.2 Licença de Uso</h3>
                    <p className="text-muted-foreground">
                      Concedemos uma licença limitada, não exclusiva, intransferível e revogável 
                      para uso da plataforma conforme estes termos. Esta licença não inclui direito 
                      de cópia, modificação ou distribuição.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">6.3 Conteúdo do Cliente</h3>
                    <p className="text-muted-foreground">
                      Você mantém os direitos sobre o conteúdo que enviar para a plataforma, 
                      concedendo-nos licença para utilizá-lo na prestação dos serviços.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Isenção de Responsabilidade */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <Scale className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold">7. Limitação de Responsabilidade</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">7.1 Disponibilidade do Serviço</h3>
                    <p className="text-muted-foreground">
                      Nos esforçamos para manter a plataforma disponível, mas não garantimos 
                      acesso ininterrupto. Manutenções programadas e eventos fora de nosso 
                      controle podem causar indisponibilidade temporária.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">7.2 Resultados de Campanhas</h3>
                    <p className="text-muted-foreground">
                      Embora utilizemos as melhores práticas de mercado, não garantimos resultados 
                      específicos de campanhas de marketing. Diversos fatores externos influenciam 
                      os resultados, incluindo mercado, concorrência e comportamento do consumidor.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">7.3 Links Externos</h3>
                    <p className="text-muted-foreground">
                      Nosso site pode conter links para sites de terceiros. Não somos responsáveis 
                      pelo conteúdo ou práticas de privacidade desses sites.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">7.4 Limite de Indenização</h3>
                    <p className="text-muted-foreground">
                      Nossa responsabilidade total por qualquer reclamação relacionada aos serviços 
                      é limitada ao valor pago pelo cliente nos últimos 3 meses.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pagamentos */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <CreditCard className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold">8. Pagamentos e Cancelamento</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">8.1 Condições Comerciais</h3>
                    <p className="text-muted-foreground">
                      Os valores, formas de pagamento e condições são definidos na proposta 
                      comercial e/ou contrato específico. O não pagamento pode resultar na 
                      suspensão do acesso à plataforma e serviços.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">8.2 Reembolsos</h3>
                    <p className="text-muted-foreground">
                      Solicitações de reembolso serão analisadas caso a caso, considerando 
                      os serviços já prestados. Taxas de setup e valores de mídia já investidos 
                      não são reembolsáveis.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">8.3 Cancelamento</h3>
                    <p className="text-muted-foreground">
                      O cancelamento deve seguir as condições previstas no contrato de prestação 
                      de serviços. O aviso prévio mínimo é de 30 dias, salvo disposição contratual 
                      em contrário.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Alterações */}
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-xl font-semibold mb-4">9. Alterações nos Termos</h2>
                <p className="text-muted-foreground">
                  Reservamo-nos o direito de modificar estes Termos de Uso a qualquer momento. 
                  Alterações significativas serão comunicadas por e-mail ou através de aviso 
                  na plataforma. O uso continuado dos serviços após as alterações constitui 
                  aceitação dos novos termos.
                </p>
              </CardContent>
            </Card>

            {/* Lei Aplicável */}
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-xl font-semibold mb-4">10. Lei Aplicável e Foro</h2>
                <p className="text-muted-foreground">
                  Estes Termos de Uso são regidos pelas leis da República Federativa do Brasil. 
                  Quaisquer disputas serão submetidas ao foro da comarca de São Paulo/SP, 
                  com renúncia expressa a qualquer outro, por mais privilegiado que seja.
                </p>
              </CardContent>
            </Card>

            {/* Disposições Gerais */}
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-xl font-semibold mb-4">11. Disposições Gerais</h2>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>Se qualquer disposição destes termos for considerada inválida, as demais permanecerão em vigor</li>
                  <li>A tolerância quanto ao descumprimento de qualquer obrigação não implica renúncia</li>
                  <li>Estes termos constituem o acordo integral entre as partes sobre o assunto</li>
                  <li>Comunicações oficiais serão enviadas para o e-mail cadastrado na plataforma</li>
                </ul>
              </CardContent>
            </Card>

            {/* Contato */}
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <Mail className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold">12. Contato</h2>
                </div>
                <p className="text-muted-foreground mb-4">
                  Para dúvidas sobre estes Termos de Uso, entre em contato:
                </p>
                <div className="space-y-2 text-muted-foreground">
                  <p><strong>Agência Linkou</strong></p>
                  <p>E-mail: contato@linkou.com.br</p>
                  <p>Jurídico: juridico@linkou.com.br</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
