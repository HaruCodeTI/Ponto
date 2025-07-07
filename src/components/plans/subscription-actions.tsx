'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, 
  CreditCard, 
  AlertTriangle, 
  Loader2, 
  Calendar,
  Users,
  ArrowDown,
  XCircle,
  CheckCircle
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

interface SubscriptionActionsProps {
  currentSubscription: {
    id: string;
    plan: string;
    status: string;
    employeeCount: number;
    monthlyAmount: number;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
  };
  onActionComplete?: () => void;
}

export function SubscriptionActions({ currentSubscription, onActionComplete }: SubscriptionActionsProps) {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showDowngradeDialog, setShowDowngradeDialog] = useState(false);
  const [selectedDowngradePlan, setSelectedDowngradePlan] = useState<string>('');

  const handleCancelSubscription = async () => {
    if (!session?.user?.companyId) {
      toast.error('Empresa não encontrada');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/subscription', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao cancelar assinatura');
      }

      toast.success('Assinatura cancelada com sucesso');
      setShowCancelDialog(false);
      onActionComplete?.();
    } catch (error) {
      console.error('Erro ao cancelar assinatura:', error);
      toast.error('Erro ao cancelar assinatura');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDowngradeSubscription = async () => {
    if (!session?.user?.companyId || !selectedDowngradePlan) {
      toast.error('Dados inválidos');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/subscription', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan: selectedDowngradePlan,
          employeeCount: currentSubscription.employeeCount,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao fazer downgrade');
      }

      toast.success('Downgrade realizado com sucesso');
      setShowDowngradeDialog(false);
      onActionComplete?.();
    } catch (error) {
      console.error('Erro ao fazer downgrade:', error);
      toast.error('Erro ao fazer downgrade');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReactivateSubscription = async () => {
    if (!session?.user?.companyId) {
      toast.error('Empresa não encontrada');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/subscription', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cancelAtPeriodEnd: false,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao reativar assinatura');
      }

      toast.success('Assinatura reativada com sucesso');
      onActionComplete?.();
    } catch (error) {
      console.error('Erro ao reativar assinatura:', error);
      toast.error('Erro ao reativar assinatura');
    } finally {
      setIsLoading(false);
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

  const getPlanName = (plan: string) => {
    switch (plan) {
      case 'BASIC': return 'Básico';
      case 'PROFESSIONAL': return 'Profissional';
      case 'PREMIUM': return 'Premium';
      default: return plan;
    }
  };

  const getDowngradeOptions = () => {
    const currentPlanIndex = ['BASIC', 'PROFESSIONAL', 'PREMIUM'].indexOf(currentSubscription.plan);
    return ['BASIC', 'PROFESSIONAL', 'PREMIUM']
      .filter((_, index) => index < currentPlanIndex)
      .map(plan => ({
        id: plan,
        name: getPlanName(plan),
        description: `Downgrade para o plano ${getPlanName(plan)}`
      }));
  };

  const downgradeOptions = getDowngradeOptions();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Ações da Assinatura
        </CardTitle>
        <CardDescription>
          Gerencie sua assinatura e configurações de cobrança
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Atual */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Status Atual</span>
            <Badge className={
              currentSubscription.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
              currentSubscription.status === 'CANCELED' ? 'bg-red-100 text-red-800' :
              'bg-yellow-100 text-yellow-800'
            }>
              {currentSubscription.status === 'ACTIVE' && 'Ativa'}
              {currentSubscription.status === 'CANCELED' && 'Cancelada'}
              {currentSubscription.status === 'PAST_DUE' && 'Vencida'}
            </Badge>
          </div>

          {currentSubscription.cancelAtPeriodEnd && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Sua assinatura será cancelada em {formatDate(currentSubscription.currentPeriodEnd)}.
                Você pode reativá-la a qualquer momento.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <Separator />

        {/* Ações Disponíveis */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Ações Disponíveis</h4>
          
          {currentSubscription.status === 'ACTIVE' && !currentSubscription.cancelAtPeriodEnd && (
            <div className="space-y-2">
              {/* Downgrade */}
              {downgradeOptions.length > 0 && (
                <Dialog open={showDowngradeDialog} onOpenChange={setShowDowngradeDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <ArrowDown className="w-4 h-4 mr-2" />
                      Fazer Downgrade
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Fazer Downgrade</DialogTitle>
                      <DialogDescription>
                        Escolha o plano para qual deseja fazer downgrade. 
                        A mudança será aplicada no próximo período de cobrança.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                      {downgradeOptions.map((option) => (
                        <div
                          key={option.id}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedDowngradePlan === option.id
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          }`}
                          onClick={() => setSelectedDowngradePlan(option.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{option.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {option.description}
                              </div>
                            </div>
                            {selectedDowngradePlan === option.id && (
                              <CheckCircle className="w-5 h-5 text-primary" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setShowDowngradeDialog(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleDowngradeSubscription}
                        disabled={!selectedDowngradePlan || isLoading}
                      >
                        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Confirmar Downgrade
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}

              {/* Cancelamento */}
              <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                <DialogTrigger asChild>
                  <Button variant="destructive" className="w-full justify-start">
                    <XCircle className="w-4 h-4 mr-2" />
                    Cancelar Assinatura
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Cancelar Assinatura</DialogTitle>
                    <DialogDescription>
                      Tem certeza que deseja cancelar sua assinatura? 
                      Você continuará com acesso até {formatDate(currentSubscription.currentPeriodEnd)}.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3">
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Atenção:</strong> Após o cancelamento, você perderá acesso a funcionalidades premium.
                      </AlertDescription>
                    </Alert>
                    <div className="text-sm text-muted-foreground">
                      <p>• Sua assinatura será cancelada ao final do período atual</p>
                      <p>• Você pode reativar a qualquer momento</p>
                      <p>• Seus dados serão preservados</p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setShowCancelDialog(false)}
                    >
                      Manter Assinatura
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleCancelSubscription}
                      disabled={isLoading}
                    >
                      {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Confirmar Cancelamento
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}

          {/* Reativação */}
          {currentSubscription.cancelAtPeriodEnd && (
            <Button
              onClick={handleReactivateSubscription}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Reativar Assinatura
            </Button>
          )}

          {/* Renovação */}
          {currentSubscription.status === 'PAST_DUE' && (
            <Button
              onClick={() => window.location.href = '/planos'}
              className="w-full"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Renovar Assinatura
            </Button>
          )}
        </div>

        <Separator />

        {/* Informações da Assinatura */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Detalhes da Assinatura</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Plano:</span>
              <div className="font-medium">{getPlanName(currentSubscription.plan)}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Funcionários:</span>
              <div className="font-medium flex items-center gap-1">
                <Users className="w-4 h-4" />
                {currentSubscription.employeeCount}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Valor Mensal:</span>
              <div className="font-medium">{formatCurrency(currentSubscription.monthlyAmount)}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Próxima Cobrança:</span>
              <div className="font-medium flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDate(currentSubscription.currentPeriodEnd)}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 