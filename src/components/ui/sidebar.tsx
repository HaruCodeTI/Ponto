"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  { href: "/logout", label: "Sair", icon: LogOut },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="fixed left-0 top-0 h-full w-56 bg-white border-r shadow-sm flex flex-col z-30">
      <div className="p-6 font-bold text-xl tracking-tight border-b">Ponto</div>
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
    </aside>
  );
} 