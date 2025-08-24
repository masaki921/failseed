import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { User, LoginUser, InsertUser } from "@shared/schema";

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/current-user"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/auth/current-user", {
          credentials: "include"
        });
        if (response.status === 401) {
          return null; // 認証されていない場合はnullを返す
        }
        if (!response.ok) {
          throw new Error(`${response.status}: ${response.statusText}`);
        }
        return await response.json();
      } catch (error) {
        console.error("Auth check failed:", error);
        return null;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginUser) => {
      const response = await apiRequest("POST", "/api/auth/login", credentials);
      return response.json();
    },
    onSuccess: (userData) => {
      queryClient.setQueryData(["/api/auth/current-user"], userData);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/current-user"] });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: InsertUser) => {
      const response = await apiRequest("POST", "/api/auth/register", userData);
      return response.json();
    },
    onSuccess: (userData) => {
      queryClient.setQueryData(["/api/auth/current-user"], userData);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/current-user"] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/auth/logout");
      return response.json();
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/current-user"], null);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/current-user"] });
      // Clear all cached data after logout
      queryClient.clear();
    },
  });

  return {
    user: user as User | undefined,
    isLoading,
    isAuthenticated: !!user && !error,
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout: logoutMutation.mutate,
    loginError: loginMutation.error,
    registerError: registerMutation.error,
    logoutError: logoutMutation.error,
    isLoginPending: loginMutation.isPending,
    isRegisterPending: registerMutation.isPending,
    isLogoutPending: logoutMutation.isPending,
  };
}