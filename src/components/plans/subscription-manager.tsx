'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, CreditCard, Calendar, Users, CheckCircle, XCircle } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

interface SubscriptionData {
  id: string;
  plan: 'BASIC' | 'PROFESSIONAL' | 'PREMIUM';
  status: 'ACTIVE' | 'CANCELED' | 'PAST_DUE' | 'TRIAL' | 'EXPIRED';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialEnd?: string;
  cancelAtPeriodEnd: boolean;
  employeeCount: number;
  monthlyAmount: number;
}

interface SubscriptionManagerProps {
  currentSubscription?: SubscriptionData;
  onSubscriptionChange?: () => void;
}

export function SubscriptionManager({ currentSubscription }: SubscriptionManagerProps) {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);

  const handleSubscribe = async (plan: string, employeeCount: number) => {
    if (!session?.user?.companyId) {
      toast.error('Empresa não encontrada');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/subscription/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan,
          employeeCount,
          companyId: session.user.companyId,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao criar sessão de pagamento');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Erro ao iniciar checkout:', error);
      toast.error('Erro ao processar pagamento');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgrade = async (plan: string, employeeCount: number) => {
    if (!session?.user?.companyId) {
      toast.error('Empresa não encontrada');
      return;
    }

    setIsUpgrading(true);
    try {
      const response = await fetch('/api/subscription/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan,
          employeeCount,
          companyId: session.user.companyId,
          upgrade: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao criar sessão de upgrade');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Erro ao iniciar upgrade:', error);
      toast.error('Erro ao processar upgrade');
    } finally {
      setIsUpgrading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'TRIAL':
        return 'bg-blue-100 text-blue-800';
      case 'PAST_DUE':
        return 'bg-red-100 text-red-800';
      case 'CANCELED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircle className="w-4 h-4" />;
      case 'PAST_DUE':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  if (!currentSubscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Assinatura
          </CardTitle>
          <CardDescription>
            Você ainda não possui uma assinatura ativa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Escolha um plano para começar a usar o sistema completo.
            </p>
            <Button 
              onClick={() => handleSubscribe('BASIC', 1)}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Assinar Plano Básico
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Assinatura Atual
        </CardTitle>
        <CardDescription>
          Gerencie sua assinatura e pagamentos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status da Assinatura */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon(currentSubscription.status)}
            <span className="font-medium">Status</span>
          </div>
          <Badge className={getStatusColor(currentSubscription.status)}>
            {currentSubscription.status === 'ACTIVE' && 'Ativa'}
            {currentSubscription.status === 'TRIAL' && 'Período de Teste'}
            {currentSubscription.status === 'PAST_DUE' && 'Pagamento Pendente'}
            {currentSubscription.status === 'CANCELED' && 'Cancelada'}
            {currentSubscription.status === 'EXPIRED' && 'Expirada'}
          </Badge>
        </div>

        <Separator />

        {/* Detalhes do Plano */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Plano</span>
            <span className="font-medium">
              {currentSubscription.plan === 'BASIC' && 'Básico'}
              {currentSubscription.plan === 'PROFESSIONAL' && 'Profissional'}
              {currentSubscription.plan === 'PREMIUM' && 'Premium'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Funcionários</span>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span className="font-medium">{currentSubscription.employeeCount}</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Valor Mensal</span>
            <span className="font-medium">{formatCurrency(currentSubscription.monthlyAmount)}</span>
          </div>
        </div>

        <Separator />

        {/* Período da Assinatura */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Início do Período</span>
            <span className="font-medium">{formatDate(currentSubscription.currentPeriodStart)}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Fim do Período</span>
            <span className="font-medium">{formatDate(currentSubscription.currentPeriodEnd)}</span>
          </div>

          {currentSubscription.trialEnd && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Fim do Período de Teste</span>
              <span className="font-medium">{formatDate(currentSubscription.trialEnd)}</span>
            </div>
          )}
        </div>

        {currentSubscription.cancelAtPeriodEnd && (
          <>
            <Separator />
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                ⚠️ Sua assinatura será cancelada ao final do período atual.
              </p>
            </div>
          </>
        )}

        {/* Ações */}
        <div className="space-y-3">
          {currentSubscription.status === 'ACTIVE' && (
            <>
              {currentSubscription.plan === 'BASIC' && (
                <Button 
                  onClick={() => handleUpgrade('PROFESSIONAL', currentSubscription.employeeCount)}
                  disabled={isUpgrading}
                  variant="outline"
                  className="w-full"
                >
                  {isUpgrading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Fazer Upgrade para Profissional
                </Button>
              )}

              {currentSubscription.plan === 'PROFESSIONAL' && (
                <Button 
                  onClick={() => handleUpgrade('PREMIUM', currentSubscription.employeeCount)}
                  disabled={isUpgrading}
                  variant="outline"
                  className="w-full"
                >
                  {isUpgrading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Fazer Upgrade para Premium
                </Button>
              )}

              <Button 
                onClick={() => handleUpgrade(currentSubscription.plan, currentSubscription.employeeCount + 1)}
                disabled={isUpgrading}
                variant="outline"
                className="w-full"
              >
                {isUpgrading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Adicionar Funcionário
              </Button>
            </>
          )}

          {currentSubscription.status === 'PAST_DUE' && (
            <Button 
              onClick={() => handleSubscribe(currentSubscription.plan, currentSubscription.employeeCount)}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Renovar Assinatura
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 