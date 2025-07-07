'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CreditCard, 
  Calendar, 
  DollarSign, 
  Download, 
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

interface PaymentHistory {
  id: string;
  amount: number;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'CANCELED';
  date: string;
  description: string;
  invoiceUrl?: string;
  receiptUrl?: string;
}

interface SubscriptionHistoryItem {
  id: string;
  plan: string;
  status: string;
  startDate: string;
  endDate?: string;
  employeeCount: number;
  monthlyAmount: number;
  reason?: string;
}

interface SubscriptionHistoryProps {
  onRefresh?: () => void;
}

export function SubscriptionHistory({ onRefresh: _onRefresh }: SubscriptionHistoryProps) {
  const { data: session } = useSession();
  const [payments, setPayments] = useState<PaymentHistory[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('payments');

  useEffect(() => {
    if (session?.user?.companyId) {
      loadHistory();
    }
  }, [session?.user?.companyId]);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      // Carregar histórico de pagamentos
      const paymentsResponse = await fetch('/api/subscription/payments');
      if (paymentsResponse.ok) {
        const paymentsData = await paymentsResponse.json();
        setPayments(paymentsData.payments || []);
      }

      // Carregar histórico de assinaturas
      const subscriptionsResponse = await fetch('/api/subscription/history');
      if (subscriptionsResponse.ok) {
        const subscriptionsData = await subscriptionsResponse.json();
        setSubscriptions(subscriptionsData.subscriptions || []);
      }
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      toast.error('Erro ao carregar histórico');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadInvoice = async (paymentId: string) => {
    try {
      const response = await fetch(`/api/subscription/payments/${paymentId}/invoice`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${paymentId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Erro ao baixar fatura:', error);
      toast.error('Erro ao baixar fatura');
    }
  };

  const handleViewReceipt = async (paymentId: string) => {
    try {
      const response = await fetch(`/api/subscription/payments/${paymentId}/receipt`);
      if (response.ok) {
        const { url } = await response.json();
        window.open(url, '_blank');
      }
    } catch (error) {
      console.error('Erro ao visualizar recibo:', error);
      toast.error('Erro ao visualizar recibo');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      case 'CANCELED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PAID':
        return <CheckCircle className="w-4 h-4" />;
      case 'PENDING':
        return <Clock className="w-4 h-4" />;
      case 'FAILED':
        return <XCircle className="w-4 h-4" />;
      case 'CANCELED':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
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

  const calculateStats = () => {
    if (payments.length === 0) return null;

    return {
      totalPayments: payments.length,
      totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
      paidAmount: payments.filter(p => p.status === 'PAID').reduce((sum, p) => sum + p.amount, 0),
      pendingAmount: payments.filter(p => p.status === 'PENDING').reduce((sum, p) => sum + p.amount, 0),
      paidCount: payments.filter(p => p.status === 'PAID').length,
      pendingCount: payments.filter(p => p.status === 'PENDING').length,
    };
  };

  const stats = calculateStats();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Carregando histórico...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Resumo Financeiro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(stats.paidAmount)}
                </div>
                <div className="text-sm text-muted-foreground">Total Pago</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {formatCurrency(stats.pendingAmount)}
                </div>
                <div className="text-sm text-muted-foreground">Pendente</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {stats.paidCount}
                </div>
                <div className="text-sm text-muted-foreground">Pagamentos Realizados</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {stats.pendingCount}
                </div>
                <div className="text-sm text-muted-foreground">Pagamentos Pendentes</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Abas de Histórico */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Histórico Completo
          </CardTitle>
          <CardDescription>
            Visualize pagamentos e mudanças de assinatura
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="payments">Pagamentos</TabsTrigger>
              <TabsTrigger value="subscriptions">Assinaturas</TabsTrigger>
            </TabsList>

            <TabsContent value="payments" className="space-y-4">
              {payments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum pagamento encontrado</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>{formatDate(payment.date)}</TableCell>
                        <TableCell>{payment.description}</TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(payment.amount)}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(payment.status)}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(payment.status)}
                              {payment.status === 'PAID' && 'Pago'}
                              {payment.status === 'PENDING' && 'Pendente'}
                              {payment.status === 'FAILED' && 'Falhou'}
                              {payment.status === 'CANCELED' && 'Cancelado'}
                            </div>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {payment.invoiceUrl && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownloadInvoice(payment.id)}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            )}
                            {payment.receiptUrl && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewReceipt(payment.id)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="subscriptions" className="space-y-4">
              {subscriptions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma mudança de assinatura encontrada</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Plano</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Funcionários</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Motivo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscriptions.map((subscription) => (
                      <TableRow key={subscription.id}>
                        <TableCell>{formatDate(subscription.startDate)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {subscription.plan === 'BASIC' && 'Básico'}
                            {subscription.plan === 'PROFESSIONAL' && 'Profissional'}
                            {subscription.plan === 'PREMIUM' && 'Premium'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(subscription.status)}>
                            {subscription.status === 'ACTIVE' && 'Ativa'}
                            {subscription.status === 'CANCELED' && 'Cancelada'}
                            {subscription.status === 'PAST_DUE' && 'Vencida'}
                            {subscription.status === 'TRIAL' && 'Teste'}
                          </Badge>
                        </TableCell>
                        <TableCell>{subscription.employeeCount}</TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(subscription.monthlyAmount)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {subscription.reason || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 