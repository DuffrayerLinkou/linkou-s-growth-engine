import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Download, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Link } from "react-router-dom";
import { useTheme } from "@/hooks/useTheme";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import logoRoxo from "@/assets/logo-linkou-horizontal-roxo.png";
import logoBranca from "@/assets/logo-linkou-horizontal-branca.png";

const navLinks = [
  { href: "#servicos", label: "Serviços" },
  { href: "#resultados", label: "Resultados" },
  { href: "#metodo", label: "Método" },
  { href: "#para-quem", label: "Para Quem" },
  { href: "#faq", label: "FAQ" },
];

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [iosDialogOpen, setIosDialogOpen] = useState(false);
  const { theme } = useTheme();
  const { canInstall, showIOSPrompt, isInstalled, promptInstall } = usePWAInstall();
  const showInstallButton = (canInstall || showIOSPrompt) && !isInstalled;

  const handleInstall = async () => {
    if (canInstall) {
      await promptInstall();
    } else if (showIOSPrompt) {
      setIosDialogOpen(true);
    }
  };

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setIsMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center shrink-0">
            <img 
              src={theme === "dark" ? logoBranca : logoRoxo} 
              alt="Linkou - Auditoria e Consultoria de Tráfego"
              className="block w-[120px] md:w-[140px] lg:w-[160px] h-auto shrink-0 max-w-none object-contain"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => scrollToSection(link.href)}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-3">
            {showInstallButton && (
              <Button variant="outline" size="sm" onClick={handleInstall} className="gap-1.5">
                <Download className="h-4 w-4" />
                Instalar App
              </Button>
            )}
            <ThemeToggle />
            <Link to="/auth">
              <Button variant="ghost" size="sm">
                Login
              </Button>
            </Link>
            <Button
              size="sm"
              onClick={() => scrollToSection("#contato")}
              className="font-semibold"
            >
              Fale conosco
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Menu"
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass border-t"
          >
            <nav className="container mx-auto px-4 py-4 flex flex-col gap-2">
              {navLinks.map((link) => (
                <button
                  key={link.href}
                  onClick={() => scrollToSection(link.href)}
                  className="text-left py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </button>
              ))}
              <div className="flex flex-col gap-2 pt-4 border-t">
                {showInstallButton && (
                  <Button variant="outline" onClick={handleInstall} className="w-full gap-1.5">
                    <Download className="h-4 w-4" />
                    Instalar App
                  </Button>
                )}
                <Link to="/auth" onClick={() => setIsMenuOpen(false)}>
                  <Button variant="outline" className="w-full">
                    Login
                  </Button>
                </Link>
                <Button
                  onClick={() => scrollToSection("#contato")}
                  className="w-full font-semibold"
                >
                  Fale conosco
                </Button>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* iOS instructions dialog */}
      <Dialog open={iosDialogOpen} onOpenChange={setIosDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Instalar no iPhone/iPad</DialogTitle>
            <DialogDescription>
              Siga os passos abaixo para adicionar o app à sua tela de início:
            </DialogDescription>
          </DialogHeader>
          <ol className="space-y-4 py-2 text-sm text-foreground">
            <li className="flex items-start gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">1</span>
              <span>
                Toque no ícone <Share className="inline h-4 w-4 text-primary -mt-0.5" /> <strong>Compartilhar</strong> na barra do Safari
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">2</span>
              <span>Role para baixo e toque em <strong>"Adicionar à Tela de Início"</strong></span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">3</span>
              <span>Confirme tocando em <strong>"Adicionar"</strong></span>
            </li>
          </ol>
          <Button onClick={() => setIosDialogOpen(false)} variant="secondary" className="w-full">
            Entendi
          </Button>
        </DialogContent>
      </Dialog>
    </header>
  );
}
