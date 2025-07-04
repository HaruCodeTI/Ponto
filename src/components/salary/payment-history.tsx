"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, DollarSign, AlertTriangle, History, Filter } from "lucide-react";

interface PaymentHistoryProps {
  companyId?: string;
}

interface Payment {
  id: string;
  employeeId: string;
  companyId: string;
  month: string;
  amount: number;
  status: "PENDING" | "PAID" | "FAILED" | "CANCELED";
  paidAt: string | null;
  payrollRef: string | null;
  createdAt: string;
  updatedAt: string;
  employee: {
    user: {
      name: string;
    };
  };
}

export function PaymentHistory({ companyId }: PaymentHistoryProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filtros
  const [employeeId, setEmployeeId] = useState("");
  const [month, setMonth] = useState("");
  const [status, setStatus] = useState("");

  const loadPayments = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (companyId) params.append("companyId", companyId);
      if (employeeId) params.append("employeeId", employeeId);
      if (month) params.append("month", month);
      if (status) params.append("status", status);

      const response = await fetch(`/api/salary/payments?${params.toString()}`);
      const result = await response.json();

      if (!result.success) {
        setError(result.error || "Erro ao carregar pagamentos");
        return;
      }

      setPayments(result.data);
    } catch {
      setError("Erro ao conectar com o servidor");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, [companyId]);

  const handleFilter = () => {
    loadPayments();
  };

  const handleClearFilters = () => {
    setEmployeeId("");
    setMonth("");
    setStatus("");
    loadPayments();
  };

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("pt-BR");
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      PENDING: { variant: "secondary" as const, text: "Pendente" },
      PAID: { variant: "default" as const, text: "Pago" },
      FAILED: { variant: "destructive" as const, text: "Falhou" },
      CANCELED: { variant: "outline" as const, text: "Cancelado" },
    };
    const config = variants[status as keyof typeof variants] || variants.PENDING;
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  const calculateStats = () => {
    if (payments.length === 0) return null;

    return {
      totalPayments: payments.length,
      totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
      paidAmount: payments.filter(p => p.status === "PAID").reduce((sum, p) => sum + p.amount, 0),
      pendingAmount: payments.filter(p => p.status === "PENDING").reduce((sum, p) => sum + p.amount, 0),
      paidCount: payments.filter(p => p.status === "PAID").length,
      pendingCount: payments.filter(p => p.status === "PENDING").length,
    };
  };

  const stats = calculateStats();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Histórico de Pagamentos
          </CardTitle>
          <CardDescription>
            Visualize e gerencie o histórico de pagamentos realizados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="month">Mês</Label>
              <Input
                id="month"
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                placeholder="Filtrar por mês"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employeeId">Funcionário</Label>
              <Input
                id="employeeId"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="ID do funcionário"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="PENDING">Pendente</SelectItem>
                  <SelectItem value="PAID">Pago</SelectItem>
                  <SelectItem value="FAILED">Falhou</SelectItem>
                  <SelectItem value="CANCELED">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={handleFilter} disabled={isLoading} className="flex-1">
                <Filter className="h-4 w-4 mr-2" />
                Filtrar
              </Button>
              <Button onClick={handleClearFilters} variant="outline">
                Limpar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Estatísticas */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Resumo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {stats.totalPayments}
                </div>
                <div className="text-sm text-muted-foreground">Total de Pagamentos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(stats.totalAmount)}
                </div>
                <div className="text-sm text-muted-foreground">Valor Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(stats.paidAmount)}
                </div>
                <div className="text-sm text-muted-foreground">Valor Pago</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {formatCurrency(stats.pendingAmount)}
                </div>
                <div className="text-sm text-muted-foreground">Valor Pendente</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabela de Pagamentos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Pagamentos ({payments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : payments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum pagamento encontrado
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Funcionário</TableHead>
                    <TableHead>Mês</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data de Pagamento</TableHead>
                    <TableHead>Referência</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">
                        {payment.employee.user.name}
                      </TableCell>
                      <TableCell>
                        {formatMonth(payment.month)}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {formatCurrency(payment.amount)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(payment.status)}
                      </TableCell>
                      <TableCell>
                        {payment.paidAt ? formatDate(payment.paidAt) : "-"}
                      </TableCell>
                      <TableCell>
                        {payment.payrollRef || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 