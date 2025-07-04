"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { CalendarIcon, Clock, AlertTriangle, CheckCircle } from "lucide-react";

interface ReportSchedulerProps {
  companyId?: string;
}

interface ScheduleData {
  id: string;
  companyId: string;
  frequency: "DAILY" | "WEEKLY" | "MONTHLY";
  dayOfMonth?: number;
  recipients: string[];
  format: "EXCEL" | "CSV" | "BOTH";
  includeFilters?: {
    position?: string;
    workSchedule?: string;
  };
  isActive: boolean;
  nextRun: string;
  createdAt: string;
  updatedAt: string;
}

export function ReportScheduler({ companyId }: ReportSchedulerProps) {
  const [schedule, setSchedule] = useState<ScheduleData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [frequency, setFrequency] = useState<"DAILY" | "WEEKLY" | "MONTHLY">("MONTHLY");
  const [dayOfMonth, setDayOfMonth] = useState<number>(1);
  const [recipients, setRecipients] = useState<string>("");
  const [format, setFormat] = useState<"EXCEL" | "CSV" | "BOTH">("EXCEL");
  const [position, setPosition] = useState<string>("");
  const [workSchedule, setWorkSchedule] = useState<string>("");
  const [isActive, setIsActive] = useState<boolean>(true);

  useEffect(() => {
    if (companyId) {
      loadSchedule();
    }
  }, [companyId]);

  const loadSchedule = async () => {
    if (!companyId) return;

    try {
      const response = await fetch(`/api/reports/schedule?companyId=${companyId}`);
      const result = await response.json();

      if (result.success && result.data) {
        setSchedule(result.data);
        // Preenche o formulário com os dados existentes
        setFrequency(result.data.frequency);
        setDayOfMonth(result.data.dayOfMonth || 1);
        setRecipients(result.data.recipients.join(", "));
        setFormat(result.data.format);
        setPosition(result.data.includeFilters?.position || "");
        setWorkSchedule(result.data.includeFilters?.workSchedule || "");
        setIsActive(result.data.isActive);
      }
    } catch {
      setError("Erro ao carregar agendamento");
    }
  };

  const handleSaveSchedule = async () => {
    if (!companyId) {
      setError("ID da empresa é obrigatório");
      return;
    }

    if (!recipients.trim()) {
      setError("Pelo menos um destinatário é obrigatório");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const recipientsList = recipients.split(",").map(email => email.trim()).filter(email => email);
      
      const response = await fetch("/api/reports/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId,
          frequency,
          dayOfMonth: frequency === "MONTHLY" ? dayOfMonth : undefined,
          recipients: recipientsList,
          format,
          includeFilters: {
            position: position || undefined,
            workSchedule: workSchedule || undefined,
          },
          isActive
        }),
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.error || "Erro ao salvar agendamento");
        return;
      }

      setSchedule(result.data);
      setSuccess("Agendamento salvo com sucesso!");
    } catch {
      setError("Erro ao conectar com o servidor");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSchedule = async () => {
    if (!companyId || !schedule) return;

    if (!confirm("Tem certeza que deseja remover este agendamento?")) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/reports/schedule?companyId=${companyId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.error || "Erro ao remover agendamento");
        return;
      }

      setSchedule(null);
      setSuccess("Agendamento removido com sucesso!");
      
      // Limpa o formulário
      setFrequency("MONTHLY");
      setDayOfMonth(1);
      setRecipients("");
      setFormat("EXCEL");
      setPosition("");
      setWorkSchedule("");
      setIsActive(true);
    } catch {
      setError("Erro ao conectar com o servidor");
    } finally {
      setIsLoading(false);
    }
  };

  const formatNextRun = (nextRun: string) => {
    return new Date(nextRun).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Agendamento de Relatórios
          </CardTitle>
          <CardDescription>
            Configure relatórios automáticos para serem enviados por email
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
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {/* Configurações Básicas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="frequency">Frequência</Label>
              <select
                id="frequency"
                className="w-full border rounded px-3 py-2"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as "DAILY" | "WEEKLY" | "MONTHLY")}
              >
                <option value="DAILY">Diário</option>
                <option value="WEEKLY">Semanal</option>
                <option value="MONTHLY">Mensal</option>
              </select>
            </div>

            {frequency === "MONTHLY" && (
              <div className="space-y-2">
                <Label htmlFor="dayOfMonth">Dia do Mês</Label>
                <Input
                  id="dayOfMonth"
                  type="number"
                  min="1"
                  max="31"
                  value={dayOfMonth}
                  onChange={(e) => setDayOfMonth(parseInt(e.target.value))}
                />
              </div>
            )}
          </div>

          {/* Destinatários */}
          <div className="space-y-2">
            <Label htmlFor="recipients">Destinatários (emails separados por vírgula)</Label>
            <Input
              id="recipients"
              type="text"
              placeholder="exemplo@empresa.com, gerente@empresa.com"
              value={recipients}
              onChange={(e) => setRecipients(e.target.value)}
            />
          </div>

          {/* Formato */}
          <div className="space-y-2">
            <Label htmlFor="format">Formato do Relatório</Label>
            <select
              id="format"
              className="w-full border rounded px-3 py-2"
              value={format}
                              onChange={(e) => setFormat(e.target.value as "EXCEL" | "CSV" | "BOTH")}
            >
              <option value="EXCEL">Excel (.xlsx)</option>
              <option value="CSV">CSV (.csv)</option>
              <option value="BOTH">Ambos</option>
            </select>
          </div>

          {/* Filtros Opcionais */}
          <div className="space-y-4">
            <Label>Filtros (Opcional)</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="position">Setor/Cargo</Label>
                <Input
                  id="position"
                  type="text"
                  placeholder="Ex: Técnico, Administrativo..."
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="workSchedule">Jornada</Label>
                <select
                  id="workSchedule"
                  className="w-full border rounded px-3 py-2"
                  value={workSchedule}
                  onChange={(e) => setWorkSchedule(e.target.value)}
                >
                  <option value="">Todas</option>
                  <option value="PRESENCIAL">Presencial</option>
                  <option value="HOME_OFFICE">Home Office</option>
                  <option value="HYBRID">Híbrida</option>
                </select>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
            <Label htmlFor="isActive">Agendamento Ativo</Label>
          </div>

          {/* Botões */}
          <div className="flex gap-2">
            <Button onClick={handleSaveSchedule} disabled={isLoading}>
              {isLoading ? "Salvando..." : schedule ? "Atualizar" : "Criar"} Agendamento
            </Button>
            {schedule && (
              <Button variant="destructive" onClick={handleDeleteSchedule} disabled={isLoading}>
                Remover Agendamento
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Status do Agendamento */}
      {schedule && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Status do Agendamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Status</div>
                <Badge variant={schedule.isActive ? "default" : "secondary"}>
                  {schedule.isActive ? "Ativo" : "Inativo"}
                </Badge>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Próxima Execução</div>
                <div className="font-medium">{formatNextRun(schedule.nextRun)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Destinatários</div>
                <div className="font-medium">{schedule.recipients.length} email(s)</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Formato</div>
                <div className="font-medium">{schedule.format}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 