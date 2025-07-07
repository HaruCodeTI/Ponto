"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Home,
  Clock,
  Users,
  Building,
  FileText,
  Settings,
  LogOut,
  Shield,
  BarChart2
} from "lucide-react";

const navItems = [
  { href: "/empresa/dashboard", label: "Dashboard", icon: Home },
  { href: "/bater-ponto", label: "Bater Ponto", icon: Clock },
  { href: "/funcionarios", label: "Funcionários", icon: Users },
  { href: "/empresa/configuracoes", label: "Empresa", icon: Building },
  { href: "/relatorios", label: "Relatórios", icon: FileText },
  { href: "/empresa/ajustes", label: "Ajustes", icon: Settings },
  { href: "/logs", label: "Logs", icon: BarChart2 },
  { href: "/compliance", label: "Compliance", icon: Shield },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout, isAdmin, isManager, isEmployee } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  const getUserRoleLabel = () => {
    if (isAdmin) return "Administrador";
    if (isManager) return "Gerente";
    if (isEmployee) return "Funcionário";
    return "Usuário";
  };

  const getUserRoleColor = () => {
    if (isAdmin) return "bg-red-100 text-red-800";
    if (isManager) return "bg-blue-100 text-blue-800";
    if (isEmployee) return "bg-green-100 text-green-800";
    return "bg-gray-100 text-gray-800";
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-56 bg-white border-r shadow-sm flex flex-col z-30">
      {/* Header */}
      <div className="p-6 font-bold text-xl tracking-tight border-b">Ponto</div>
      
      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-1 p-2">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-4 py-2 rounded-md font-medium transition-colors
              ${pathname === href ? "bg-gray-100 text-primary" : "text-gray-700 hover:bg-gray-50"}`}
          >
            <Icon className="w-5 h-5" />
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      {/* User Profile */}
      <div className="border-t p-4">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user?.image || ""} />
            <AvatarFallback>
              {user?.name?.charAt(0) || user?.email?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.name || "Usuário"}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user?.email}
            </p>
          </div>
        </div>
        
        {/* Role Badge */}
        <div className="mb-3">
          <Badge variant="outline" className={`text-xs ${getUserRoleColor()}`}>
            {getUserRoleLabel()}
          </Badge>
        </div>

        {/* Logout Button */}
        <Button
          onClick={handleLogout}
          variant="outline"
          size="sm"
          className="w-full justify-start"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sair
        </Button>
      </div>
    </aside>
  );
} 