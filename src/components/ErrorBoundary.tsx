import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 sm:p-6 space-y-3">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <h3 className="font-semibold text-sm sm:text-base">
              {this.props.fallbackTitle || "Algo deu errado ao carregar este conteúdo"}
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground break-words">
            {this.state.error?.message || "Erro desconhecido"}
          </p>
          <Button size="sm" variant="outline" onClick={this.reset}>
            <RefreshCw className="h-3 w-3 mr-1.5" />
            Tentar novamente
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}