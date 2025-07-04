"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";


export default function Home() {
  return (
    <div className="bg-background min-h-screen p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Header */}
        <div className="space-y-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight">Sistema de Controle de Ponto</h1>
          <p className="text-muted-foreground text-xl">
            Sistema inteligente com geolocalização e NFC
          </p>
          <div className="flex justify-center gap-2">
            <Badge variant="default">Mobile</Badge>
            <Badge variant="secondary">Desktop</Badge>
            <Badge variant="outline">NFC</Badge>
            <Badge variant="outline">Geolocalização</Badge>
          </div>
        </div>

        {/* Cards de Funcionalidades */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Bater Ponto */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">⏰</span>
                Bater Ponto
              </CardTitle>
              <CardDescription>Registre entrada e saída com geolocalização</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/bater-ponto">Bater Ponto</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Gestão de Funcionários */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">👥</span>
                Funcionários
              </CardTitle>
              <CardDescription>Cadastre e gerencie colaboradores</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href="/funcionarios">Gerenciar</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Relatórios */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">📊</span>
                Relatórios
              </CardTitle>
              <CardDescription>Visualize dados e exporte relatórios</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href="/relatorios">Ver Relatórios</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Configurações */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">⚙️</span>
                Configurações
              </CardTitle>
              <CardDescription>Configure empresa e regras de ponto</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href="/empresa/configuracoes">Configurar</Link>
              </Button>
            </CardContent>
          </Card>

          {/* NFC */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">📱</span>
                NFC
              </CardTitle>
              <CardDescription>Autenticação por crachá digital</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href="/nfc">Configurar NFC</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Compliance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">⚖️</span>
                Compliance
              </CardTitle>
              <CardDescription>Portaria 671/2021 e LGPD</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href="/compliance">Verificar</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Footer com Avatar */}
        <div className="space-y-4 text-center">
          <div className="flex items-center justify-center gap-4">
            <Avatar>
              <AvatarImage src="/avatar.png" />
              <AvatarFallback>SP</AvatarFallback>
            </Avatar>
            <div className="text-left">
              <p className="font-medium">Sistema de Ponto</p>
              <p className="text-muted-foreground text-sm">Versão 1.0.0</p>
            </div>
          </div>
          <p className="text-muted-foreground text-sm">
            Desenvolvido com Next.js, TypeScript e Shadcn UI
          </p>
        </div>
      </div>
    </div>
  );
}
