'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  CheckCircle, 
  Users, 
  MapPin, 
  FileText, 
  Settings,
  TrendingUp,
  Zap
} from 'lucide-react';
import { PlanConfig } from '@/types/company';
import { 
  validatePlanLimits, 
  calculateUsagePercentage, 
  getUpgradeRecommendations,
  PlanUsage
} from '@/lib/plan-limits';
import { getPlanConfig } from '@/content/plans';

interface PlanLimitsDisplayProps {
  plan: PlanConfig;
  usage: PlanUsage;
  onUpgrade?: (plan: PlanConfig) => void;
  showRecommendations?: boolean;
}

export function PlanLimitsDisplay({
  plan,
  usage,
  onUpgrade,
  showRecommendations = true
}: PlanLimitsDisplayProps) {
  const validation = validatePlanLimits(plan.id, usage);
  const recommendations = getUpgradeRecommendations(plan.id, usage);

  const getUsageIcon = (percentage: number, hasError: boolean) => {
    if (hasError) return <AlertTriangle className="h-4 w-4 text-destructive" />;
    if (percentage > 80) return <AlertTriangle className="h-4 w-4 text-warning" />;
    if (percentage > 50) return <TrendingUp className="h-4 w-4 text-blue-500" />;
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  const getUsageColor = (percentage: number, hasError: boolean) => {
    if (hasError) return 'text-destructive';
    if (percentage > 80) return 'text-warning';
    if (percentage > 50) return 'text-blue-500';
    return 'text-green-500';
  };

  return (
    <div className="space-y-6">
      {/* Status Geral */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Status dos Limites do Plano
          </CardTitle>
          <CardDescription>
            Monitoramento do uso dos recursos do seu plano {plan.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <Badge variant={validation.isValid ? 'default' : 'destructive'}>
              {validation.isValid ? 'Dentro dos Limites' : 'Limites Excedidos'}
            </Badge>
            {validation.warnings.length > 0 && (
              <Badge variant="secondary">Atenção</Badge>
            )}
          </div>

          {!validation.isValid && (
            <Alert className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1">
                  {validation.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {validation.warnings.length > 0 && (
            <Alert className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1">
                  {validation.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Limites de Recursos */}
      <Card>
        <CardHeader>
          <CardTitle>Limites de Recursos</CardTitle>
          <CardDescription>
            Uso atual vs limites do seu plano
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Funcionários */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="font-medium">Funcionários</span>
              </div>
              <div className="flex items-center gap-2">
                {getUsageIcon(
                  calculateUsagePercentage(usage.employees, plan.features.maxEmployees),
                  !!validation.exceededLimits.employees
                )}
                <span className={`text-sm ${getUsageColor(
                  calculateUsagePercentage(usage.employees, plan.features.maxEmployees),
                  !!validation.exceededLimits.employees
                )}`}>
                  {usage.employees} / {plan.features.maxEmployees === 999 ? 'Ilimitado' : plan.features.maxEmployees}
                </span>
              </div>
            </div>
            <Progress 
              value={calculateUsagePercentage(usage.employees, plan.features.maxEmployees)} 
              className="h-2"
            />
            {validation.exceededLimits.employees && (
              <p className="text-xs text-destructive">
                {validation.exceededLimits.employees.extra} funcionários extras
              </p>
            )}
          </div>

          {/* Localizações */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span className="font-medium">Localizações</span>
              </div>
              <div className="flex items-center gap-2">
                {getUsageIcon(
                  calculateUsagePercentage(usage.locations, plan.features.maxLocations),
                  !!validation.exceededLimits.locations
                )}
                <span className={`text-sm ${getUsageColor(
                  calculateUsagePercentage(usage.locations, plan.features.maxLocations),
                  !!validation.exceededLimits.locations
                )}`}>
                  {usage.locations} / {plan.features.maxLocations === 999 ? 'Ilimitado' : plan.features.maxLocations}
                </span>
              </div>
            </div>
            <Progress 
              value={calculateUsagePercentage(usage.locations, plan.features.maxLocations)} 
              className="h-2"
            />
            {validation.exceededLimits.locations && (
              <p className="text-xs text-destructive">
                {validation.exceededLimits.locations.extra} localizações extras
              </p>
            )}
          </div>

          {/* Registros de Ponto */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="font-medium">Registros de Ponto</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {usage.timeRecords.toLocaleString()} registros
              </span>
            </div>
          </div>

          {/* Relatórios */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                <span className="font-medium">Relatórios Gerados</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {usage.reports} relatórios
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Funcionalidades Disponíveis */}
      <Card>
        <CardHeader>
          <CardTitle>Funcionalidades Disponíveis</CardTitle>
          <CardDescription>
            Recursos incluídos no seu plano atual
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Autenticação Biométrica</span>
                <Badge variant={plan.features.biometricAuth ? 'default' : 'secondary'}>
                  {plan.features.biometricAuth ? 'Disponível' : 'Não incluído'}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Autenticação NFC</span>
                <Badge variant={plan.features.nfcAuth ? 'default' : 'secondary'}>
                  {plan.features.nfcAuth ? 'Disponível' : 'Não incluído'}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Relatórios Avançados</span>
                <Badge variant={plan.features.advancedReports ? 'default' : 'secondary'}>
                  {plan.features.advancedReports ? 'Disponível' : 'Não incluído'}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Agendamento por Email</span>
                <Badge variant={plan.features.emailScheduling ? 'default' : 'secondary'}>
                  {plan.features.emailScheduling ? 'Disponível' : 'Não incluído'}
                </Badge>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">API de Integração</span>
                <Badge variant={plan.features.apiAccess ? 'default' : 'secondary'}>
                  {plan.features.apiAccess ? 'Disponível' : 'Não incluído'}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Logs de Auditoria</span>
                <Badge variant={plan.features.auditLogs ? 'default' : 'secondary'}>
                  {plan.features.auditLogs ? 'Disponível' : 'Não incluído'}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Suporte Prioritário</span>
                <Badge variant={plan.features.prioritySupport ? 'default' : 'secondary'}>
                  {plan.features.prioritySupport ? 'Disponível' : 'Não incluído'}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Marca Personalizada</span>
                <Badge variant={plan.features.customBranding ? 'default' : 'secondary'}>
                  {plan.features.customBranding ? 'Disponível' : 'Não incluído'}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recomendações de Upgrade */}
      {showRecommendations && recommendations.recommended !== plan.id && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Recomendação de Upgrade
            </CardTitle>
            <CardDescription>
              Baseado no seu uso atual, recomendamos um upgrade
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="default">
                  Plano {recommendations.recommended} Recomendado
                </Badge>
              </div>
              
              {recommendations.reasons.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Motivos:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    {recommendations.reasons.map((reason, index) => (
                      <li key={index}>{reason}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {onUpgrade && (
                <Button 
                  onClick={() => {
                    const recommendedPlan = getPlanConfig(recommendations.recommended);
                    if (recommendedPlan) {
                      onUpgrade(recommendedPlan);
                    }
                  }}
                  className="w-full"
                >
                  Fazer Upgrade para {recommendations.recommended}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 