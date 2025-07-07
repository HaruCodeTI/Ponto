'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Calculator, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle,
  AlertTriangle,
  Info,
  Zap
} from 'lucide-react';
import { 
  calculateEmployeeBilling,
  comparePlanCosts,
  generateBillingReport,
  formatCurrency
} from '@/lib/salary-calculations';

interface EmployeeBillingCalculatorProps {
  currentEmployeeCount?: number;
  currentPlan?: string;
  onPlanSelect?: (planId: string) => void;
  showRecommendations?: boolean;
}

export function EmployeeBillingCalculator({
  currentEmployeeCount = 0,
  currentPlan = 'BASIC',
  onPlanSelect,
  showRecommendations = true
}: EmployeeBillingCalculatorProps) {
  const [employeeCount, setEmployeeCount] = useState(currentEmployeeCount);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState(currentPlan);

  const billing = calculateEmployeeBilling(selectedPlan, employeeCount, billingPeriod);
  const breakdowns = comparePlanCosts(employeeCount, billingPeriod);
  const report = generateBillingReport(employeeCount, billingPeriod);
  const selectedPlanConfig = breakdowns.find(b => b.plan.id === selectedPlan)?.plan;

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
    onPlanSelect?.(planId);
  };

  const getPlanColor = (planId: string) => {
    switch (planId) {
      case 'BASIC': return 'bg-blue-100 text-blue-800';
      case 'PROFESSIONAL': return 'bg-purple-100 text-purple-800';
      case 'PREMIUM': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSavingsColor = (savings: number) => {
    if (savings > 0) return 'text-green-600';
    if (savings < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="space-y-6">
      {/* Calculadora */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Calculadora de Cobrança por Funcionário
          </CardTitle>
          <CardDescription>
            Calcule o custo baseado no número de funcionários e plano escolhido
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employeeCount">Número de Funcionários</Label>
              <Input
                id="employeeCount"
                type="number"
                min="1"
                value={employeeCount}
                onChange={(e) => setEmployeeCount(Number(e.target.value) || 0)}
                placeholder="Ex: 25"
              />
            </div>
            <div className="space-y-2">
              <Label>Período de Cobrança</Label>
              <Tabs value={billingPeriod} onValueChange={(value) => setBillingPeriod(value as 'monthly' | 'yearly')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="monthly">Mensal</TabsTrigger>
                  <TabsTrigger value="yearly">Anual</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {/* Resultado do Plano Selecionado */}
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Badge className={getPlanColor(selectedPlan)}>
                    {selectedPlanConfig?.name || selectedPlan}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {billingPeriod === 'monthly' ? 'Cobrança Mensal' : 'Cobrança Anual'}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">
                    {formatCurrency(billing.totalCost, billing.currency)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {billingPeriod === 'monthly' ? 'por mês' : 'por ano'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Preço Base</div>
                  <div className="font-medium">{formatCurrency(billing.basePrice, billing.currency)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Funcionários Extras</div>
                  <div className="font-medium">
                    {billing.extraEmployees > 0 ? (
                      <span className="text-orange-600">
                        +{billing.extraEmployees} ({formatCurrency(billing.extraCost, billing.currency)})
                      </span>
                    ) : (
                      <span className="text-green-600">0</span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Custo por Funcionário</div>
                  <div className="font-medium">
                    {formatCurrency(billing.totalCost / Math.max(employeeCount, 1), billing.currency)}
                  </div>
                </div>
              </div>

              {billing.extraEmployees > 0 && (
                <Alert className="mt-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Você tem {billing.extraEmployees} funcionários extras. 
                    Considere fazer upgrade para um plano com limite maior.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      {/* Comparação de Planos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Comparação de Planos
          </CardTitle>
          <CardDescription>
            Compare os custos entre todos os planos disponíveis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {breakdowns.map((breakdown) => (
              <Card 
                key={breakdown.plan.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedPlan === breakdown.plan.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => handlePlanSelect(breakdown.plan.id)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Badge className={getPlanColor(breakdown.plan.id)}>
                        {breakdown.plan.name}
                      </Badge>
                      {breakdown.plan.popular && (
                        <Badge variant="secondary">Mais Popular</Badge>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold">
                        {formatCurrency(breakdown.billing.totalCost, breakdown.billing.currency)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {billingPeriod === 'monthly' ? 'por mês' : 'por ano'}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Preço Base</div>
                      <div className="font-medium">
                        {formatCurrency(breakdown.billing.basePrice, breakdown.billing.currency)}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Funcionários Extras</div>
                      <div className="font-medium">
                        {breakdown.billing.extraEmployees > 0 ? (
                          <span className="text-orange-600">
                            +{breakdown.billing.extraEmployees}
                          </span>
                        ) : (
                          <span className="text-green-600">0</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {breakdown.savings.monthly !== 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <div className={`flex items-center gap-1 text-sm ${getSavingsColor(breakdown.savings.monthly)}`}>
                        {breakdown.savings.monthly > 0 ? (
                          <TrendingDown className="h-4 w-4" />
                        ) : (
                          <TrendingUp className="h-4 w-4" />
                        )}
                        <span>
                          {breakdown.savings.monthly > 0 ? 'Economia' : 'Custo adicional'} de{' '}
                          {formatCurrency(Math.abs(breakdown.savings.monthly), breakdown.billing.currency)}/mês
                          {breakdown.savings.percentage !== 0 && (
                            <span> ({breakdown.savings.percentage.toFixed(1)}%)</span>
                          )}
                        </span>
                      </div>
                    </div>
                  )}

                  {breakdown.recommendations.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="text-sm text-muted-foreground">
                        {breakdown.recommendations.map((rec, index) => (
                          <div key={index} className="flex items-center gap-1">
                            <Info className="h-3 w-3" />
                            {rec}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recomendações */}
      {showRecommendations && report.recommendations.mostEconomical && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Recomendações
            </CardTitle>
            <CardDescription>
              Análise baseada no seu número de funcionários
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-green-50 border-green-200">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-green-800">Mais Econômico</span>
                  </div>
                  <div className="text-lg font-bold text-green-800">
                    {report.recommendations.mostEconomical.plan.name}
                  </div>
                  <div className="text-sm text-green-600">
                    {formatCurrency(report.recommendations.mostEconomical.billing.totalCost, 'BRL')}/mês
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-800">Melhor Custo-Benefício</span>
                  </div>
                  <div className="text-lg font-bold text-blue-800">
                    {report.recommendations.bestValue?.plan.name || 'N/A'}
                  </div>
                  <div className="text-sm text-blue-600">
                    {report.recommendations.bestValue ? formatCurrency(report.recommendations.bestValue.billing.totalCost, 'BRL') : 'N/A'}/mês
                  </div>
                </CardContent>
              </Card>
            </div>

            {report.recommendations.warnings.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1">
                    {report.recommendations.warnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <div className="text-center">
              <Button 
                onClick={() => handlePlanSelect(report.recommendations.mostEconomical?.plan.id || 'BASIC')}
                className="w-full md:w-auto"
              >
                Selecionar Plano Recomendado
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 