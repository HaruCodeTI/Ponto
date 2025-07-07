'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert } from '@/components/ui/alert';
import { 
  CreditCard, 
  Plus, 
  Trash2, 
  Loader2, 
  AlertTriangle
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

interface PaymentMethod {
  id: string;
  type: string;
  last4: string;
  brand: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

interface PaymentMethodsProps {
  onRefresh?: () => void;
}

export function PaymentMethods({ onRefresh }: PaymentMethodsProps) {
  const { data: session } = useSession();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user?.companyId) {
      loadPaymentMethods();
    }
  }, [session?.user?.companyId]);

  const loadPaymentMethods = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/subscription/payment-methods');
      if (response.ok) {
        const data = await response.json();
        setPaymentMethods(data.paymentMethods || []);
      }
    } catch (error) {
      console.error('Erro ao carregar métodos de pagamento:', error);
      toast.error('Erro ao carregar métodos de pagamento');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPaymentMethod = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    if (!session?.user?.companyId) {
      toast.error('Empresa não encontrada');
      return;
    }

    setIsAdding(true);
    try {
      const formData = new FormData(event.currentTarget);
      const cardNumber = formData.get('cardNumber') as string;
      const expMonth = formData.get('expMonth') as string;
      const expYear = formData.get('expYear') as string;
      const setAsDefault = formData.get('setAsDefault') === 'on';

      // Simular adição de método de pagamento
      // Em produção, você integraria com Stripe Elements
      const paymentMethod = {
        id: `pm_${Date.now()}`,
        type: 'card',
        last4: cardNumber.slice(-4),
        brand: 'visa',
        expMonth: parseInt(expMonth),
        expYear: parseInt(expYear),
        isDefault: setAsDefault
      };

      const response = await fetch('/api/subscription/payment-methods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentMethodId: paymentMethod.id,
          setAsDefault
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao adicionar método de pagamento');
      }

      toast.success('Método de pagamento adicionado com sucesso');
      setShowAddDialog(false);
      loadPaymentMethods();
      onRefresh?.();
    } catch (error) {
      console.error('Erro ao adicionar método de pagamento:', error);
      toast.error('Erro ao adicionar método de pagamento');
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemovePaymentMethod = async (paymentMethodId: string) => {
    if (!session?.user?.companyId) {
      toast.error('Empresa não encontrada');
      return;
    }

    setIsRemoving(paymentMethodId);
    try {
      const response = await fetch(`/api/subscription/payment-methods?id=${paymentMethodId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erro ao remover método de pagamento');
      }

      toast.success('Método de pagamento removido com sucesso');
      loadPaymentMethods();
      onRefresh?.();
    } catch (error) {
      console.error('Erro ao remover método de pagamento:', error);
      toast.error('Erro ao remover método de pagamento');
    } finally {
      setIsRemoving(null);
    }
  };

  const getCardBrandIcon = (brand: string) => {
    switch (brand.toLowerCase()) {
      case 'visa':
        return '💳';
      case 'mastercard':
        return '💳';
      case 'amex':
        return '💳';
      default:
        return '💳';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Carregando métodos de pagamento...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Métodos de Pagamento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Métodos de Pagamento
          </CardTitle>
          <CardDescription>
            Gerencie seus cartões de crédito e débito para pagamentos automáticos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {paymentMethods.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum método de pagamento cadastrado</p>
              <p className="text-sm">Adicione um cartão para facilitar os pagamentos</p>
            </div>
          ) : (
            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">
                      {getCardBrandIcon(method.brand)}
                    </div>
                    <div>
                      <div className="font-medium">
                        {method.brand.toUpperCase()} •••• {method.last4}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Expira em {method.expMonth.toString().padStart(2, '0')}/{method.expYear}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {method.isDefault && (
                      <Badge variant="secondary">Padrão</Badge>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemovePaymentMethod(method.id)}
                      disabled={isRemoving === method.id}
                    >
                      {isRemoving === method.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Separator />

          {/* Adicionar Novo Método */}
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Método de Pagamento
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Cartão</DialogTitle>
                <DialogDescription>
                  Adicione um novo cartão de crédito ou débito para pagamentos automáticos
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddPaymentMethod} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cardNumber">Número do Cartão</Label>
                  <Input
                    id="cardNumber"
                    name="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    required
                    maxLength={19}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expMonth">Mês</Label>
                    <Input
                      id="expMonth"
                      name="expMonth"
                      placeholder="MM"
                      required
                      maxLength={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expYear">Ano</Label>
                    <Input
                      id="expYear"
                      name="expYear"
                      placeholder="YYYY"
                      required
                      maxLength={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cvc">CVC</Label>
                    <Input
                      id="cvc"
                      name="cvc"
                      placeholder="123"
                      required
                      maxLength={4}
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="setAsDefault"
                    name="setAsDefault"
                    className="rounded"
                  />
                  <Label htmlFor="setAsDefault">Definir como método padrão</Label>
                </div>
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <div className="text-sm">
                    <strong>Segurança:</strong> Seus dados de pagamento são criptografados e seguros.
                  </div>
                </Alert>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddDialog(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isAdding}>
                    {isAdding && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Adicionar Cartão
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
} 