import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Database, Lock, UserCheck, Cookie, Mail } from "lucide-react";

export default function Privacidade() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Política de Privacidade
            </h1>
            <p className="text-muted-foreground">
              Última atualização: {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>

          {/* Content */}
          <div className="space-y-8">
            {/* Introdução */}
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-xl font-semibold mb-4">1. Introdução</h2>
                <p className="text-muted-foreground leading-relaxed">
                  A <strong>Agência Linkou</strong> ("nós", "nosso" ou "empresa") está comprometida em proteger 
                  a privacidade e os dados pessoais de nossos clientes, parceiros e visitantes. Esta Política 
                  de Privacidade descreve como coletamos, usamos, armazenamos e protegemos suas informações 
                  quando você utiliza nosso site, plataforma e serviços.
                </p>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  Ao acessar ou usar nossos serviços, você concorda com as práticas descritas nesta política. 
                  Recomendamos a leitura completa deste documento.
                </p>
              </CardContent>
            </Card>

            {/* Dados Coletados */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <Database className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold">2. Dados Coletados</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">2.1 Dados Pessoais Fornecidos por Você</h3>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                      <li>Nome completo e nome da empresa</li>
                      <li>Endereço de e-mail</li>
                      <li>Número de telefone/WhatsApp</li>
                      <li>Segmento de atuação</li>
                      <li>Informações sobre investimento em marketing</li>
                      <li>Objetivos de negócio</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">2.2 Dados Coletados Automaticamente</h3>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                      <li>Endereço IP e localização aproximada</li>
                      <li>Tipo de navegador e dispositivo</li>
                      <li>Páginas visitadas e tempo de permanência</li>
                      <li>Origem do tráfego (UTM parameters)</li>
                      <li>Dados de cookies e tecnologias similares</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">2.3 Dados de Clientes da Plataforma</h3>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                      <li>Credenciais de acesso (e-mail e senha criptografada)</li>
                      <li>Dados de campanhas e métricas de performance</li>
                      <li>Arquivos enviados para a plataforma</li>
                      <li>Histórico de interações e tarefas</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Finalidade */}
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-xl font-semibold mb-4">3. Finalidade do Tratamento</h2>
                <p className="text-muted-foreground mb-4">
                  Utilizamos seus dados pessoais para as seguintes finalidades:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li><strong>Prestação de serviços:</strong> Executar e entregar os serviços de marketing digital contratados</li>
                  <li><strong>Comunicação:</strong> Entrar em contato para atendimento, suporte e atualizações</li>
                  <li><strong>Propostas comerciais:</strong> Enviar orçamentos e propostas de serviços</li>
                  <li><strong>Melhoria dos serviços:</strong> Analisar o uso da plataforma para aprimorar a experiência</li>
                  <li><strong>Marketing:</strong> Enviar comunicações promocionais (com seu consentimento)</li>
                  <li><strong>Obrigações legais:</strong> Cumprir exigências legais e regulatórias</li>
                </ul>
              </CardContent>
            </Card>

            {/* Base Legal */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <Lock className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold">4. Base Legal (LGPD)</h2>
                </div>
                <p className="text-muted-foreground mb-4">
                  O tratamento de dados pessoais é realizado com base nas seguintes hipóteses legais 
                  previstas na Lei Geral de Proteção de Dados (Lei nº 13.709/2018):
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li><strong>Consentimento:</strong> Para envio de comunicações de marketing</li>
                  <li><strong>Execução de contrato:</strong> Para prestação dos serviços contratados</li>
                  <li><strong>Interesse legítimo:</strong> Para melhorar nossos produtos e serviços</li>
                  <li><strong>Cumprimento de obrigação legal:</strong> Para atender exigências fiscais e regulatórias</li>
                </ul>
              </CardContent>
            </Card>

            {/* Compartilhamento */}
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-xl font-semibold mb-4">5. Compartilhamento de Dados</h2>
                <p className="text-muted-foreground mb-4">
                  Seus dados podem ser compartilhados com:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li><strong>Supabase:</strong> Plataforma de banco de dados e autenticação</li>
                  <li><strong>Google Analytics:</strong> Análise de tráfego e comportamento</li>
                  <li><strong>Meta (Facebook/Instagram):</strong> Quando utilizamos o pixel para rastreamento</li>
                  <li><strong>Google Ads:</strong> Para campanhas e conversões</li>
                  <li><strong>Prestadores de serviços:</strong> Empresas que nos auxiliam na operação</li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  Não vendemos ou alugamos seus dados pessoais a terceiros.
                </p>
              </CardContent>
            </Card>

            {/* Armazenamento e Segurança */}
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-xl font-semibold mb-4">6. Armazenamento e Segurança</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">6.1 Medidas de Segurança</h3>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                      <li>Criptografia de dados em trânsito (HTTPS/TLS)</li>
                      <li>Criptografia de senhas (bcrypt)</li>
                      <li>Controle de acesso baseado em funções (RBAC)</li>
                      <li>Row Level Security (RLS) no banco de dados</li>
                      <li>Backups regulares e recuperação de desastres</li>
                      <li>Monitoramento contínuo de segurança</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">6.2 Tempo de Retenção</h3>
                    <p className="text-muted-foreground">
                      Mantemos seus dados pelo tempo necessário para cumprir as finalidades descritas 
                      ou conforme exigido por lei. Dados de clientes são mantidos durante a vigência 
                      do contrato e por até 5 anos após seu término para fins legais.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Direitos do Titular */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <UserCheck className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold">7. Seus Direitos (LGPD)</h2>
                </div>
                <p className="text-muted-foreground mb-4">
                  Como titular dos dados, você tem os seguintes direitos:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li><strong>Confirmação e acesso:</strong> Confirmar se tratamos seus dados e acessá-los</li>
                  <li><strong>Correção:</strong> Solicitar a correção de dados incompletos ou inexatos</li>
                  <li><strong>Anonimização ou bloqueio:</strong> Solicitar tratamento restrito de dados desnecessários</li>
                  <li><strong>Portabilidade:</strong> Receber seus dados em formato estruturado</li>
                  <li><strong>Eliminação:</strong> Solicitar a exclusão de dados tratados com consentimento</li>
                  <li><strong>Revogação:</strong> Retirar seu consentimento a qualquer momento</li>
                  <li><strong>Informação:</strong> Saber com quem compartilhamos seus dados</li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  Para exercer seus direitos, entre em contato através do e-mail indicado ao final deste documento.
                </p>
              </CardContent>
            </Card>

            {/* Cookies */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <Cookie className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold">8. Cookies e Tecnologias de Rastreamento</h2>
                </div>
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    Utilizamos cookies e tecnologias similares para melhorar sua experiência:
                  </p>
                  <div>
                    <h3 className="font-medium mb-2">Tipos de Cookies Utilizados</h3>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                      <li><strong>Essenciais:</strong> Necessários para o funcionamento básico do site</li>
                      <li><strong>Analíticos:</strong> Google Analytics para análise de tráfego</li>
                      <li><strong>Marketing:</strong> Meta Pixel e Google Ads para publicidade</li>
                      <li><strong>Funcionais:</strong> Para lembrar suas preferências</li>
                    </ul>
                  </div>
                  <p className="text-muted-foreground">
                    Você pode gerenciar cookies através das configurações do seu navegador. 
                    Note que desabilitar cookies pode afetar a funcionalidade do site.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Alterações */}
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-xl font-semibold mb-4">9. Alterações nesta Política</h2>
                <p className="text-muted-foreground">
                  Podemos atualizar esta Política de Privacidade periodicamente. Quando fizermos 
                  alterações significativas, notificaremos você por e-mail ou através de aviso 
                  em nosso site. Recomendamos revisar esta política regularmente.
                </p>
              </CardContent>
            </Card>

            {/* Contato */}
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <Mail className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold">10. Contato</h2>
                </div>
                <p className="text-muted-foreground mb-4">
                  Para dúvidas sobre esta política, exercício de direitos ou outras solicitações 
                  relacionadas à privacidade, entre em contato:
                </p>
                <div className="space-y-2 text-muted-foreground">
                  <p><strong>Agência Linkou</strong></p>
                  <p>E-mail: contato@linkou.com.br</p>
                  <p>Encarregado de Dados (DPO): privacidade@linkou.com.br</p>
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
