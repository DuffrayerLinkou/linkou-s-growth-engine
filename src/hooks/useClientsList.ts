import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Client {
  id: string;
  name: string;
}

interface UseClientsListOptions {
  status?: string;
  enabled?: boolean;
}

export function useClientsList(options?: UseClientsListOptions) {
  return useQuery({
    queryKey: ["clients-list", options?.status],
    queryFn: async () => {
      let query = supabase
        .from("clients")
        .select("id, name")
        .order("name");
      
      if (options?.status) {
        query = query.eq("status", options.status);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Client[];
    },
    enabled: options?.enabled !== false,
  });
}
