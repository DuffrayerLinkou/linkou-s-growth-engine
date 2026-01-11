import { memo, ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

interface DashboardSectionProps {
  title: string;
  description?: string;
  linkTo?: string;
  linkLabel?: string;
  icon?: LucideIcon;
  isLoading?: boolean;
  emptyIcon?: LucideIcon;
  emptyMessage?: string;
  isEmpty?: boolean;
  children: ReactNode;
  className?: string;
}

function DashboardSectionComponent({
  title,
  description,
  linkTo,
  linkLabel = "Ver todos",
  isLoading = false,
  emptyIcon: EmptyIcon,
  emptyMessage = "Nenhum item encontrado",
  isEmpty = false,
  children,
  className = "",
}: DashboardSectionProps) {
  return (
    <Card className={`h-full ${className}`}>
      <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3">
        <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-base sm:text-lg">
          <span>{title}</span>
          {linkTo && (
            <Link to={linkTo}>
              <Button variant="ghost" size="sm" className="gap-1 text-xs h-7 px-2">
                {linkLabel} <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          )}
        </CardTitle>
        {description && (
          <CardDescription className="text-xs sm:text-sm">{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="p-3 sm:p-4 pt-0">
        {isLoading ? (
          <div className="space-y-2 sm:space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 sm:h-12 w-full" />
            ))}
          </div>
        ) : isEmpty && EmptyIcon ? (
          <div className="text-center py-6 text-muted-foreground">
            <EmptyIcon className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{emptyMessage}</p>
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}

export const DashboardSection = memo(DashboardSectionComponent);