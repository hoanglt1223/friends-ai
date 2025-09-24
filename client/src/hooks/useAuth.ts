import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { AUTH_API } from "@/lib/apiRoutes";

export function useAuth() {
  const { data: user, isLoading } = useQuery({
    queryKey: [AUTH_API.getUser()],
    retry: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}
