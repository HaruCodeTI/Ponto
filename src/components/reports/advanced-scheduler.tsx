"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Clock, Save, Trash2, CheckCircle, XCircle, Users } from "lucide-react";
import { toast } from "sonner";

interface AdvancedSchedulerProps {
  companyId: string;
}

interface AdvancedSchedule {
  id?: string;
  companyId: string;
  reportType: string;
  scheduleType: "simple" | "advanced";
  frequency: "daily" | "weekly" | "monthly" | "custom";
  time: string;
  daysOfWeek?: number[];
  dayOfMonth?: number;
  months?: number[];
  recipients: string[];
  format: "EXCEL" | "CSV" | "PDF" | "AFD";
  isActive: boolean;
  customCronExpression?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

const reportTypes = [
  { value: "monthly", label: "Relatório Mensal Geral" },
  { value: "individual", label: "Relatório Individual Diário" },
  { value: "productivity", label: "Relatório de Produtividade" },
  { value: "locations", label: "Histórico de Localizações" },
  { value: "work-schedule", label: "Análise de Jornada Contratada" },
  { value: "mirror", label: "Espelho de Ponto Mensal" },
  { value: "afd", label: "Arquivo AFD" },
  { value: "hours", label: "Relatório de Horas" },
];

const frequencies = [
  { value: "daily", label: "Diário" },
  { value: "weekly", label: "Semanal" },
  { value: "monthly", label: "Mensal" },
  { value: "custom", label: "Personalizado" },
];

const daysOfWeek = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Segunda-feira" },
  { value: 2, label: "Terça-feira" },
  { value: 3, label: "Quarta-feira" },
  { value: 4, label: "Quinta-feira" },
  { value: 5, label: "Sexta-feira" },
  { value: 6, label: "Sábado" },
];

const months = [
  { value: 0, label: "Janeiro" },
  { value: 1, label: "Fevereiro" },
  { value: 2, label: "Março" },
  { value: 3, label: "Abril" },
  { value: 4, label: "Maio" },
  { value: 5, label: "Junho" },
  { value: 6, label: "Julho" },
  { value: 7, label: "Agosto" },
  { value: 8, label: "Setembro" },
  { value: 9, label: "Outubro" },
  { value: 10, label: "Novembro" },
  { value: 11, label: "Dezembro" },
];

const formats = [
  { value: "EXCEL", label: "Excel (.xlsx)" },
  { value: "CSV", label: "CSV (.csv)" },
  { value: "PDF", label: "PDF (.pdf)" },
  { value: "AFD", label: "AFD (.afd)" },
];

export function AdvancedScheduler({ companyId }: AdvancedSchedulerProps) {
  const [schedules, setSchedules] = useState<AdvancedSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState("monthly");
  const [formData, setFormData] = useState<Partial<AdvancedSchedule>>({
    companyId,
    reportType: "monthly",
    scheduleType: "simple",
    frequency: "monthly",
    time: "08:00",
    recipients: [],
    format: "EXCEL",
    isActive: true,
  });
  const [newEmail, setNewEmail] = useState("");

  useEffect(() => {
    loadSchedules();
  }, [companyId]);

  useEffect(() => {
    const currentSchedule = schedules.find(s => s.reportType === selectedReportType);
    if (currentSchedule) {
      setFormData(currentSchedule);
    } else {
      setFormData({
        companyId,
        reportType: selectedReportType,
        scheduleType: "simple",
        frequency: "monthly",
        time: "08:00",
        recipients: [],
        format: "EXCEL",
        isActive: true,
      });
    }
  }, [selectedReportType, schedules]);

  const loadSchedules = async () => {
    try {
      const response = await fetch(`/api/reports/advanced-schedule?companyId=${companyId}`);
      const data = await response.json();
      
      if (data.success) {
        setSchedules(data.data || []);
      }
    } catch (error) {
      console.error("Erro ao carregar agendamentos:", error);
    }
  };

  const handleSave = async () => {
    if (!formData.recipients || formData.recipients.length === 0) {
      toast.error("Adicione pelo menos um destinatário");
      return;
    }

    if (!formData.time) {
      toast.error("Defina um horário para o agendamento");
      return;
    }

    if (formData.frequency === "weekly" && (!formData.daysOfWeek || formData.daysOfWeek.length === 0)) {
      toast.error("Selecione pelo menos um dia da semana");
      return;
    }

    if (formData.frequency === "monthly" && !formData.dayOfMonth) {
      toast.error("Selecione um dia do mês");
      return;
    }

    if (formData.frequency === "custom" && (!formData.months || formData.months.length === 0)) {
      toast.error("Selecione pelo menos um mês");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/reports/advanced-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success("Agendamento salvo com sucesso!");
        await loadSchedules();
      } else {
        toast.error(data.error || "Erro ao salvar agendamento");
      }
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro interno do servidor");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Tem certeza que deseja remover o agendamento?")) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/reports/advanced-schedule?companyId=${companyId}&reportType=${selectedReportType}`, {
        method: "DELETE",
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success("Agendamento removido com sucesso!");
        await loadSchedules();
      } else {
        toast.error(data.error || "Erro ao remover agendamento");
      }
    } catch (error) {
      console.error("Erro ao remover:", error);
      toast.error("Erro interno do servidor");
    } finally {
      setIsLoading(false);
    }
  };

  const addEmail = () => {
    if (!newEmail.trim()) return;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      toast.error("Email inválido");
      return;
    }

    if (formData.recipients?.includes(newEmail)) {
      toast.error("Email já adicionado");
      return;
    }

    setFormData(prev => ({
      ...prev,
      recipients: [...(prev.recipients || []), newEmail.trim()],
    }));
    setNewEmail("");
  };

  const removeEmail = (email: string) => {
    setFormData(prev => ({
      ...prev,
      recipients: prev.recipients?.filter(e => e !== email) || [],
    }));
  };

  const toggleDayOfWeek = (day: number) => {
    const currentDays = formData.daysOfWeek || [];
    let newDays: number[];

    if (currentDays.includes(day)) {
      newDays = currentDays.filter(d => d !== day);
    } else {
      newDays = [...currentDays, day];
    }

    setFormData(prev => ({
      ...prev,
      daysOfWeek: newDays,
    }));
  };

  const toggleMonth = (month: number) => {
    const currentMonths = formData.months || [];
    let newMonths: number[];

    if (currentMonths.includes(month)) {
      newMonths = currentMonths.filter(m => m !== month);
    } else {
      newMonths = [...currentMonths, month];
    }

    setFormData(prev => ({
      ...prev,
      months: newMonths,
    }));
  };

  const getFrequencyLabel = (frequency: string) => {
    return frequencies.find(f => f.value === frequency)?.label || frequency;
  };

  const getFormatLabel = (format: string) => {
    return formats.find(f => f.value === format)?.label || format;
  };

  const getDayOfWeekLabel = (day: number) => {
    return daysOfWeek.find(d => d.value === day)?.label || `Dia ${day}`;
  };

  const getMonthLabel = (month: number) => {
    return months.find(m => m.value === month)?.label || `Mês ${month}`;
  };

  const hasSchedule = (reportType: string) => {
    return schedules.some(s => s.reportType === reportType);
  };



  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Agendamento Avançado
        </CardTitle>
        <CardDescription>
          Configure agendamentos detalhados para envio automático de relatórios
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs value={selectedReportType} onValueChange={setSelectedReportType} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            {reportTypes.map((type) => (
              <TabsTrigger key={type.value} value={type.value} className="text-xs">
                {type.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {reportTypes.map((type) => (
            <TabsContent key={type.value} value={type.value} className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{type.label}</h3>
                  <p className="text-sm text-muted-foreground">
                    Configure o agendamento para este relatório
                  </p>
                </div>
                {hasSchedule(type.value) && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Agendado
                  </Badge>
                )}
              </div>

              <Separator />

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="scheduleType">Tipo de Agendamento</Label>
                    <Select 
                      value={formData.scheduleType} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, scheduleType: value as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="simple">Simples</SelectItem>
                        <SelectItem value="advanced">Avançado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="frequency">Frequência</Label>
                    <Select 
                      value={formData.frequency} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, frequency: value as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a frequência" />
                      </SelectTrigger>
                      <SelectContent>
                        {frequencies.map((frequency) => (
                          <SelectItem key={frequency.value} value={frequency.value}>
                            {frequency.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="time">Horário</Label>
                    <Input
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="format">Formato</Label>
                    <Select 
                      value={formData.format} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, format: value as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o formato" />
                      </SelectTrigger>
                      <SelectContent>
                        {formats.map((format) => (
                          <SelectItem key={format.value} value={format.value}>
                            {format.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {formData.frequency === "weekly" && (
                  <div>
                    <Label className="text-sm font-medium">Dias da Semana</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                      {daysOfWeek.map((day) => (
                        <div key={day.value} className="flex items-center space-x-2">
                          <Switch
                            checked={formData.daysOfWeek?.includes(day.value)}
                            onCheckedChange={() => toggleDayOfWeek(day.value)}
                          />
                          <Label className="text-sm">{day.label}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {formData.frequency === "monthly" && (
                  <div>
                    <Label htmlFor="dayOfMonth">Dia do Mês</Label>
                    <Select 
                      value={formData.dayOfMonth?.toString()} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, dayOfMonth: parseInt(value) }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o dia" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                          <SelectItem key={day} value={day.toString()}>
                            {day}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {formData.frequency === "custom" && (
                  <div>
                    <Label className="text-sm font-medium">Meses</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                      {months.map((month) => (
                        <div key={month.value} className="flex items-center space-x-2">
                          <Switch
                            checked={formData.months?.includes(month.value)}
                            onCheckedChange={() => toggleMonth(month.value)}
                          />
                          <Label className="text-sm">{month.label}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Separator />

                <div className="space-y-4">
                  <div>
                    <Label>Destinatários</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        type="email"
                        placeholder="Digite o email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && addEmail()}
                      />
                      <Button type="button" onClick={addEmail} variant="outline">
                        Adicionar
                      </Button>
                    </div>
                  </div>

                  {formData.recipients && formData.recipients.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.recipients.map((email, index) => (
                        <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeEmail(email)}>
                          <Users className="h-3 w-3 mr-1" />
                          {email} ×
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="description">Descrição (opcional)</Label>
                  <Textarea
                    placeholder="Descreva o propósito deste agendamento..."
                    value={formData.description || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Switch 
                    checked={formData.isActive} 
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                  />
                  <Label>Agendamento ativo</Label>
                </div>

                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Próxima execução:</strong> {formData.time} {getFrequencyLabel(formData.frequency || "")}
                    {formData.frequency === "weekly" && formData.daysOfWeek && (
                      <span> nos dias: {formData.daysOfWeek.map(d => getDayOfWeekLabel(d)).join(", ")}</span>
                    )}
                    {formData.frequency === "monthly" && formData.dayOfMonth && (
                      <span> no dia {formData.dayOfMonth} de cada mês</span>
                    )}
                    {formData.frequency === "custom" && formData.months && (
                      <span> nos meses: {formData.months.map(m => getMonthLabel(m)).join(", ")}</span>
                    )}
                  </AlertDescription>
                </Alert>

                <div className="flex gap-2">
                  <Button onClick={handleSave} disabled={isLoading}>
                    <Save className="h-4 w-4 mr-2" />
                    {isLoading ? "Salvando..." : "Salvar Agendamento"}
                  </Button>
                  {hasSchedule(type.value) && (
                    <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remover
                    </Button>
                  )}
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <Separator />

        <div className="space-y-4">
          <h4 className="text-sm font-medium">Resumo dos Agendamentos</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reportTypes.map((type) => {
              const schedule = schedules.find(s => s.reportType === type.value);
              return (
                <div key={type.value} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{type.label}</span>
                    {schedule ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                  {schedule ? (
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>Frequência: {getFrequencyLabel(schedule.frequency)}</div>
                      <div>Horário: {schedule.time}</div>
                      <div>Formato: {getFormatLabel(schedule.format)}</div>
                      <div>Destinatários: {schedule.recipients.length}</div>
                      {schedule.description && (
                        <div>Descrição: {schedule.description}</div>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground">
                      Nenhum agendamento configurado
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 