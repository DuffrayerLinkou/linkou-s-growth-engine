import { motion } from "framer-motion";
import { Building2, User, Star, Mail, Phone } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";

export default function MinhaConta() {
  const { profile, clientInfo } = useAuth();

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold tracking-tight"
        >
          Minha Conta
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-muted-foreground mt-1"
        >
          Visualize suas informações de perfil.
        </motion.p>
      </div>

      {/* Client Info Card */}
      {clientInfo && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center gap-4 space-y-0">
              <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="h-7 w-7 text-primary" />
              </div>
              <div className="flex-1">
                <CardTitle>{clientInfo.name}</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  {clientInfo.segment || "Sem segmento"}
                  <span>•</span>
                  <Badge
                    variant="secondary"
                    className={
                      clientInfo.status === "ativo"
                        ? "bg-green-500/10 text-green-500"
                        : clientInfo.status === "pausado"
                        ? "bg-yellow-500/10 text-yellow-500"
                        : "bg-red-500/10 text-red-500"
                    }
                  >
                    {clientInfo.status === "ativo"
                      ? "Ativo"
                      : clientInfo.status === "pausado"
                      ? "Pausado"
                      : "Encerrado"}
                  </Badge>
                </CardDescription>
              </div>
            </CardHeader>
          </Card>
        </motion.div>
      )}

      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Meu Perfil
              {profile?.ponto_focal && (
                <Badge className="bg-yellow-500/10 text-yellow-600 gap-1 ml-2">
                  <Star className="h-3 w-3" />
                  Ponto Focal
                </Badge>
              )}
            </CardTitle>
            <CardDescription>Suas informações de usuário</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-medium text-lg">
                  {profile?.full_name || "Sem nome"}
                </p>
                <p className="text-sm text-muted-foreground">Nome completo</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Mail className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">{profile?.email || "-"}</p>
                <p className="text-sm text-muted-foreground">Email</p>
              </div>
            </div>

            {profile?.phone && (
              <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <Phone className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">{profile.phone}</p>
                  <p className="text-sm text-muted-foreground">Telefone</p>
                </div>
              </div>
            )}

            {profile?.ponto_focal && (
              <div className="p-4 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                <div className="flex items-center gap-2 text-yellow-600">
                  <Star className="h-5 w-5" />
                  <p className="font-medium">Você é o Ponto Focal</p>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Como ponto focal, você é o contato principal da sua empresa com a Linkou.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
