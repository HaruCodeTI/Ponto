"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

export function useAuth() {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  const login = useCallback(async (email: string, password: string) => {
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        // Se o erro indica que 2FA é necessário, retorna erro específico
        if (result.error.includes("requiresTwoFactor")) {
          return { success: false, error: "REQUIRES_2FA" };
        }
        return { success: false, error: result.error };
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Erro desconhecido" 
      };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await signOut({ redirect: false });
      router.push("/auth/signin");
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Erro desconhecido" 
      };
    }
  }, [router]);

  const isAuthenticated = status === "authenticated";
  const isLoading = status === "loading";
  const user = session?.user;

  const hasRole = useCallback((requiredRole: "ADMIN" | "MANAGER" | "EMPLOYEE") => {
    if (!user?.role) return false;

    const roleHierarchy = {
      ADMIN: 3,
      MANAGER: 2,
      EMPLOYEE: 1,
    };

    const userRoleLevel = roleHierarchy[user.role as keyof typeof roleHierarchy] || 0;
    const requiredRoleLevel = roleHierarchy[requiredRole];

    return userRoleLevel >= requiredRoleLevel;
  }, [user?.role]);

  const isAdmin = hasRole("ADMIN");
  const isManager = hasRole("MANAGER");
  const isEmployee = hasRole("EMPLOYEE");

  return {
    // Estado
    session,
    user,
    isAuthenticated,
    isLoading,
    status,

    // Ações
    login,
    logout,
    update,

    // Verificações de role
    hasRole,
    isAdmin,
    isManager,
    isEmployee,
  };
} 