import { memo, ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LucideIcon } from "lucide-react";

interface DashboardKPICardProps {
  title: string;
  value: ReactNode;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
  isLoading?: boolean;
  onClick?: () => void;
  className?: string;
}

function DashboardKPICardComponent({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = "text-primary",
  iconBgColor = "bg-primary/10",
  isLoading = false,
  onClick,
  className = "",
}: DashboardKPICardProps) {
  return (
    <Card 
      className={`${onClick ? "cursor-pointer hover:shadow-md hover:border-primary/50 transition-all" : ""} ${className}`}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
        <CardTitle className="text-xs sm:text-sm font-medium">{title}</CardTitle>
        <div className={`p-1.5 sm:p-2 rounded-lg ${iconBgColor}`}>
          <Icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${iconColor}`} />
        </div>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 pt-0">
        {isLoading ? (
          <Skeleton className="h-6 sm:h-8 w-12 sm:w-16" />
        ) : (
          <>
            <div className="text-xl sm:text-2xl font-bold">{value}</div>
            {subtitle && (
              <p className="text-[10px] sm:text-xs text-muted-foreground">{subtitle}</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export const DashboardKPICard = memo(DashboardKPICardComponent);