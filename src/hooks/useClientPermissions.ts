import { useAuth } from "@/hooks/useAuth";

export function useClientPermissions() {
  const { profile } = useAuth();

  const userType = (profile?.user_type || "operator") as "operator" | "manager";
  const isPontoFocal = profile?.ponto_focal === true;

  return {
    userType,
    isPontoFocal,
    canApprove: isPontoFocal,
    canUploadFiles: isPontoFocal || userType === "manager",
    canViewFinancials: userType === "manager",
    canEditMetrics: isPontoFocal,
  };
}
