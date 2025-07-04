"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Settings, Save, AlertTriangle, Clock, DollarSign, Calculator } from "lucide-react";

interface SalaryConfigProps {
  companyId?: string;
}

interface SalaryConfigData {
  workHoursPerDay: number;
  workDaysPerWeek: number;
  workDaysPerMonth: number;
  toleranceMinutes: number;
  discountPerAbsence: number;
  discountPerLate: number;
  discountPerEarlyDeparture: number;
  overtimeRate: number;
  nightShiftRate: number;
  maxOvertimePerDay: number;
  maxOvertimePerWeek: number;
  breakTimeMinutes: number;
  calculateNightShift: boolean;
  nightShiftStart: string;
  nightShiftEnd: string;
  flexibleSchedule: boolean;
}

export function SalaryConfig({ companyId: _companyId }: SalaryConfigProps) {
  const [config, setConfig] = useState<SalaryConfigData>({
    workHoursPerDay: 8,
    workDaysPerWeek: 5,
    workDaysPerMonth: 22,
    toleranceMinutes: 15,
    discountPerAbsence: 1,
    discountPerLate: 0.5,
    discountPerEarlyDeparture: 0.5,
    overtimeRate: 1.5,
    nightShiftRate: 1.2,
    maxOvertimePerDay: 2,
    maxOvertimePerWeek: 10,
    breakTimeMinutes: 60,
    calculateNightShift: false,
    nightShiftStart: "22:00",
    nightShiftEnd: "05:00",
    flexibleSchedule: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/salary/config");
      const result = await response.json();

      if (!result.success) {
        setError(result.error || "Erro ao carregar configurações");
        return;
      }

      setConfig(result.data);
    } catch {
      setError("Erro ao conectar com o servidor");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/salary/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.error || "Erro ao salvar configurações");
        return;
      }

      setSuccess("Configurações salvas com sucesso!");
      setConfig(result.data);
    } catch {
      setError("Erro ao conectar com o servidor");
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: keyof SalaryConfigData, value: string | number | boolean) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        Carregando configurações...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurações de Cálculo Salarial
          </CardTitle>
          <CardDescription>
            Configure as regras e parâmetros para cálculo de salários, horas extras e descontos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {/* Jornada de Trabalho */}
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <Clock className="h-4 w-4" />
              Jornada de Trabalho
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="workHoursPerDay">Horas por Dia</Label>
                <Input
                  id="workHoursPerDay"
                  type="number"
                  min="1"
                  max="24"
                  value={config.workHoursPerDay}
                  onChange={(e) => handleInputChange("workHoursPerDay", parseFloat(e.target.value) || 8)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="workDaysPerWeek">Dias por Semana</Label>
                <Input
                  id="workDaysPerWeek"
                  type="number"
                  min="1"
                  max="7"
                  value={config.workDaysPerWeek}
                  onChange={(e) => handleInputChange("workDaysPerWeek", parseFloat(e.target.value) || 5)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="workDaysPerMonth">Dias por Mês</Label>
                <Input
                  id="workDaysPerMonth"
                  type="number"
                  min="1"
                  max="31"
                  value={config.workDaysPerMonth}
                  onChange={(e) => handleInputChange("workDaysPerMonth", parseFloat(e.target.value) || 22)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Descontos */}
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <DollarSign className="h-4 w-4" />
              Descontos
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="discountPerAbsence">Desconto por Falta (dias)</Label>
                <Input
                  id="discountPerAbsence"
                  type="number"
                  step="0.1"
                  min="0"
                  value={config.discountPerAbsence}
                  onChange={(e) => handleInputChange("discountPerAbsence", parseFloat(e.target.value) || 1)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discountPerLate">Desconto por Atraso (dias)</Label>
                <Input
                  id="discountPerLate"
                  type="number"
                  step="0.1"
                  min="0"
                  value={config.discountPerLate}
                  onChange={(e) => handleInputChange("discountPerLate", parseFloat(e.target.value) || 0.5)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discountPerEarlyDeparture">Desconto por Saída Antecipada (dias)</Label>
                <Input
                  id="discountPerEarlyDeparture"
                  type="number"
                  step="0.1"
                  min="0"
                  value={config.discountPerEarlyDeparture}
                  onChange={(e) => handleInputChange("discountPerEarlyDeparture", parseFloat(e.target.value) || 0.5)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Horas Extras */}
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <Calculator className="h-4 w-4" />
              Horas Extras
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="overtimeRate">Taxa de Horas Extras</Label>
                <Input
                  id="overtimeRate"
                  type="number"
                  step="0.1"
                  min="1"
                  max="3"
                  value={config.overtimeRate}
                  onChange={(e) => handleInputChange("overtimeRate", parseFloat(e.target.value) || 1.5)}
                />
                <p className="text-sm text-muted-foreground">Ex: 1.5 = 50% adicional</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxOvertimePerDay">Máximo por Dia (horas)</Label>
                <Input
                  id="maxOvertimePerDay"
                  type="number"
                  min="0"
                  max="8"
                  value={config.maxOvertimePerDay}
                  onChange={(e) => handleInputChange("maxOvertimePerDay", parseFloat(e.target.value) || 2)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxOvertimePerWeek">Máximo por Semana (horas)</Label>
                <Input
                  id="maxOvertimePerWeek"
                  type="number"
                  min="0"
                  max="20"
                  value={config.maxOvertimePerWeek}
                  onChange={(e) => handleInputChange("maxOvertimePerWeek", parseFloat(e.target.value) || 10)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="toleranceMinutes">Tolerância (minutos)</Label>
                <Input
                  id="toleranceMinutes"
                  type="number"
                  min="0"
                  max="60"
                  value={config.toleranceMinutes}
                  onChange={(e) => handleInputChange("toleranceMinutes", parseFloat(e.target.value) || 15)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Adicional Noturno */}
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <Clock className="h-4 w-4" />
              Adicional Noturno
            </h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  id="calculateNightShift"
                  type="checkbox"
                  checked={config.calculateNightShift}
                  onChange={(e) => handleInputChange("calculateNightShift", e.target.checked)}
                  className="h-4 w-4"
                />
                <Label htmlFor="calculateNightShift">Calcular adicional noturno</Label>
              </div>
              
              {config.calculateNightShift && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nightShiftRate">Taxa do Adicional</Label>
                    <Input
                      id="nightShiftRate"
                      type="number"
                      step="0.1"
                      min="1"
                      max="2"
                      value={config.nightShiftRate}
                      onChange={(e) => handleInputChange("nightShiftRate", parseFloat(e.target.value) || 1.2)}
                    />
                    <p className="text-sm text-muted-foreground">Ex: 1.2 = 20% adicional</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nightShiftStart">Início (HH:MM)</Label>
                    <Input
                      id="nightShiftStart"
                      type="time"
                      value={config.nightShiftStart}
                      onChange={(e) => handleInputChange("nightShiftStart", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nightShiftEnd">Fim (HH:MM)</Label>
                    <Input
                      id="nightShiftEnd"
                      type="time"
                      value={config.nightShiftEnd}
                      onChange={(e) => handleInputChange("nightShiftEnd", e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Outras Configurações */}
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <Settings className="h-4 w-4" />
              Outras Configurações
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="breakTimeMinutes">Intervalo (minutos)</Label>
                <Input
                  id="breakTimeMinutes"
                  type="number"
                  min="0"
                  max="180"
                  value={config.breakTimeMinutes}
                  onChange={(e) => handleInputChange("breakTimeMinutes", parseFloat(e.target.value) || 60)}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  id="flexibleSchedule"
                  type="checkbox"
                  checked={config.flexibleSchedule}
                  onChange={(e) => handleInputChange("flexibleSchedule", e.target.checked)}
                  className="h-4 w-4"
                />
                <Label htmlFor="flexibleSchedule">Horário flexível</Label>
              </div>
            </div>
          </div>

          <Separator />

          {/* Botões */}
          <div className="flex justify-end gap-4">
            <Button onClick={loadConfig} variant="outline">
              Restaurar Padrões
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Salvando..." : "Salvar Configurações"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 