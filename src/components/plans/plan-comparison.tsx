'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Star, Users, MapPin, Fingerprint, CreditCard, FileText, Mail, Code, Shield, Palette, Check } from 'lucide-react';
import { getPlanComparison, calculateMonthlyPrice, calculateYearlyPrice } from '@/content/plans';
import { PlanConfig } from '@/types/company';

interface PlanComparisonProps {
  currentEmployeeCount?: number;
  onSelectPlan?: (plan: PlanConfig) => void;
  showPricing?: boolean;
}

export function PlanComparison({ 
  currentEmployeeCount = 0, 
  onSelectPlan, 
  showPricing = true 
}: PlanComparisonProps) {
  const [isYearly, setIsYearly] = useState(false);
  
  const plans = getPlanComparison();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const getFeatureIcon = (feature: string) => {
    switch (feature) {
      case 'employees':
        return <Users className="h-4 w-4" />;
      case 'locations':
        return <MapPin className="h-4 w-4" />;
      case 'biometric':
        return <Fingerprint className="h-4 w-4" />;
      case 'nfc':
        return <CreditCard className="h-4 w-4" />;
      case 'reports':
        return <FileText className="h-4 w-4" />;
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'api':
        return <Code className="h-4 w-4" />;
      case 'audit':
        return <Shield className="h-4 w-4" />;
      case 'white_label':
        return <Palette className="h-4 w-4" />;
      default:
        return <Check className="h-4 w-4" />;
    }
  };

  // const getFeatureText = (enabled: boolean) => {
  //   return enabled ? 'Incluído' : 'Não incluído';
  // };

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4">Escolha o Plano Ideal</h2>
        <p className="text-muted-foreground mb-6">
          Compare os recursos e escolha o plano que melhor atende às necessidades da sua empresa
        </p>
        
        {showPricing && (
          <div className="flex items-center justify-center gap-4 mb-6">
            <span className={`text-sm ${!isYearly ? 'font-semibold' : 'text-muted-foreground'}`}>
              Mensal
            </span>
            <Switch
              checked={isYearly}
              onCheckedChange={setIsYearly}
            />
            <span className={`text-sm ${isYearly ? 'font-semibold' : 'text-muted-foreground'}`}>
              Anual <Badge variant="secondary" className="ml-2">2 meses grátis</Badge>
            </span>
          </div>
        )}
      </div>

      {/* Planos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const price = isYearly 
            ? calculateYearlyPrice(plan.id, currentEmployeeCount)
            : calculateMonthlyPrice(plan.id, currentEmployeeCount);
          
          const basePrice = isYearly 
            ? plan.pricing.yearlyPrice 
            : plan.pricing.monthlyPrice;

          return (
            <Card 
              key={plan.id} 
              className={`relative ${plan.popular ? 'border-primary shadow-lg scale-105' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-3 py-1">
                    <Star className="h-3 w-3 mr-1" />
                    Mais Popular
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription className="text-sm">
                  {plan.description}
                </CardDescription>
                
                {showPricing && (
                  <div className="mt-4">
                    <div className="text-3xl font-bold">
                      {formatPrice(price)}
                      <span className="text-sm font-normal text-muted-foreground">
                        /{isYearly ? 'ano' : 'mês'}
                      </span>
                    </div>
                    {price > basePrice && (
                      <p className="text-xs text-muted-foreground mt-1">
                        + {formatPrice(price - basePrice)} por funcionários extras
                      </p>
                    )}
                  </div>
                )}
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Funcionários */}
                <div className="flex items-center justify-between">
                  <span className="text-sm">Funcionários</span>
                  <span className="text-sm font-medium">
                    Até {plan.features.maxEmployees}
                  </span>
                </div>

                {/* Localizações */}
                <div className="flex items-center justify-between">
                  <span className="text-sm">Localizações</span>
                  <span className="text-sm font-medium">
                    {plan.features.maxLocations === 999 ? 'Ilimitadas' : plan.features.maxLocations}
                  </span>
                </div>

                {/* Recursos */}
                <div className="space-y-3 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Autenticação Biométrica</span>
                    {getFeatureIcon('biometric')}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Autenticação NFC</span>
                    {getFeatureIcon('nfc')}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Relatórios Avançados</span>
                    {getFeatureIcon('reports')}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Agendamento por Email</span>
                    {getFeatureIcon('email')}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">API de Integração</span>
                    {getFeatureIcon('api')}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Logs de Auditoria</span>
                    {getFeatureIcon('audit')}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Suporte Prioritário</span>
                    {getFeatureIcon('prioritySupport')}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Marca Personalizada</span>
                    {getFeatureIcon('customBranding')}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">White Label</span>
                    {getFeatureIcon('white_label')}
                  </div>
                </div>

                {/* Backup */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <span className="text-sm">Retenção de Backup</span>
                  <span className="text-sm font-medium">
                    {plan.features.backupRetention} dias
                  </span>
                </div>

                {/* Integrações */}
                <div className="pt-4 border-t">
                  <span className="text-sm font-medium block mb-2">Integrações</span>
                  <div className="flex flex-wrap gap-1">
                    {plan.features.integrations.map((integration) => (
                      <Badge key={integration} variant="outline" className="text-xs">
                        {integration}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Botão de ação */}
                {onSelectPlan && (
                  <Button 
                    className="w-full mt-6"
                    variant={plan.popular ? 'default' : 'outline'}
                    onClick={() => onSelectPlan(plan)}
                  >
                    {plan.id === 'BASIC' ? 'Começar Grátis' : 'Escolher Plano'}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Informações adicionais */}
      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>
          Todos os planos incluem: Controle de ponto básico, Geolocalização, 
          Relatórios essenciais, Suporte por email
        </p>
        <p className="mt-2">
          * Preços podem variar conforme o número de funcionários. 
          Entre em contato para planos customizados.
        </p>
      </div>
    </div>
  );
} 