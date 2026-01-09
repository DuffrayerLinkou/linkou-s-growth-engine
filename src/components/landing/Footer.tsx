import { Link } from "react-router-dom";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-card/50">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">L</span>
              </div>
              <span className="font-bold text-xl tracking-tight">Linkou</span>
            </Link>
            <p className="text-muted-foreground text-sm max-w-sm mb-4">
              Ecossistemas de tráfego e vendas que aprendem. Performance, transparência 
              e autonomia para seu negócio.
            </p>
            <p className="text-sm text-muted-foreground">
              Performance · Tráfego · Vendas
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold mb-4">Navegação</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="#resultados"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Resultados
                </a>
              </li>
              <li>
                <a
                  href="#metodo"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Método
                </a>
              </li>
              <li>
                <a
                  href="#entregas"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Entregas
                </a>
              </li>
              <li>
                <a
                  href="#faq"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  FAQ
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
                  to="/login"
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
