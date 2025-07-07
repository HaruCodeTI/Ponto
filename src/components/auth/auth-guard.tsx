"use client";

import React from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: "ADMIN" | "MANAGER" | "EMPLOYEE";
  fallback?: React.ReactNode;
}

export function AuthGuard({ 
  children, 
  requiredRole, 
  fallback 
}: AuthGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    if (status === "authenticated" && session?.user) {
      // Verifica se tem role específico requerido
      if (requiredRole) {
        const userRole = session.user.role;
        
        // Hierarquia de roles: ADMIN > MANAGER > EMPLOYEE
        const roleHierarchy = {
          ADMIN: 3,
          MANAGER: 2,
          EMPLOYEE: 1,
        };

        const userRoleLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 0;
        const requiredRoleLevel = roleHierarchy[requiredRole];

        if (userRoleLevel >= requiredRoleLevel) {
          setIsAuthorized(true);
        } else {
          // Usuário não tem permissão suficiente
          router.push("/unauthorized");
        }
      } else {
        // Sem role específico requerido, apenas autenticado
        setIsAuthorized(true);
      }
    }
  }, [session, status, router, requiredRole]);

  // Loading state
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // Fallback customizado
  if (fallback && !isAuthorized) {
    return <>{fallback}</>;
  }

  // Renderiza children apenas se autorizado
  return isAuthorized ? <>{children}</> : null;
} 