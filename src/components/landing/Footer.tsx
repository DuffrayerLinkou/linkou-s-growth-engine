import { Link } from "react-router-dom";
import { Instagram } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import logoRoxo from "@/assets/logo-linkou-horizontal-roxo.png";
import logoBranca from "@/assets/logo-linkou-horizontal-branca.png";

export function Footer() {
  const currentYear = new Date().getFullYear();
  const { theme } = useTheme();

  return (
    <footer className="border-t bg-card/50">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center mb-4">
              <img 
                src={theme === "dark" ? logoBranca : logoRoxo} 
                alt="Linkou"
                className="block w-[140px] md:w-[160px] h-auto max-w-none object-contain"
              />
            </Link>
            <p className="text-muted-foreground text-sm max-w-sm mb-4">
              Ecossistemas de tráfego e vendas que aprendem. Performance, transparência 
              e autonomia para seu negócio.
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Performance · Tráfego · Vendas
            </p>
            <div className="flex gap-3">
              <a
                href="https://www.instagram.com/linkou.solucaodigital/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold mb-4">Serviços</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="#servicos"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Auditoria e Consultoria
                </a>
              </li>
              <li>
                <a
                  href="#servicos"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Produção de Mídia
                </a>
              </li>
              <li>
                <a
                  href="#servicos"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Gestão de Tráfego
                </a>
              </li>
              <li>
                <a
                  href="#servicos"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Design Digital
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/privacidade"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Política de Privacidade
                </Link>
              </li>
              <li>
                <Link
                  to="/termos"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Termos de Uso
                </Link>
              </li>
              <li>
                <Link
                  to="/auth"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Login
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {currentYear} Agência Linkou. Todos os direitos reservados.
          </p>
          <p className="text-sm text-muted-foreground">
            Feito com ❤️ para quem leva vendas a sério.
          </p>
        </div>
      </div>
    </footer>
  );
}
