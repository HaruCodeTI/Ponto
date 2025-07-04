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
import { Calendar, Mail, Clock, FileText, Users, Settings, Trash2, Save } from "lucide-react";
import { toast } from "sonner";

interface EmailSchedulerProps {
  companyId: string;
}

interface EmailConfig {
  id?: string;
  companyId: string;
  frequency: "DAILY" | "WEEKLY" | "MONTHLY";
  recipients: string[];
  format: "EXCEL" | "CSV" | "BOTH";
  filters?: any;
  isActive: boolean;
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
];

const frequencies = [
  { value: "DAILY", label: "Diário" },
  { value: "WEEKLY", label: "Semanal" },
  { value: "MONTHLY", label: "Mensal" },
];

const formats = [
  { value: "EXCEL", label: "Excel (.xlsx)" },
  { value: "CSV", label: "CSV (.csv)" },
  { value: "BOTH", label: "Ambos" },
];

export function EmailScheduler({ companyId }: EmailSchedulerProps) {
  const [config, setConfig] = useState<EmailConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<EmailConfig>>({
    companyId,
    frequency: "MONTHLY",
    recipients: [],
    format: "EXCEL",
    isActive: true,
  });
  const [newEmail, setNewEmail] = useState("");
  const [selectedReportType, setSelectedReportType] = useState("monthly");

  useEffect(() => {
    loadConfig();
  }, [companyId]);

  const loadConfig = async () => {
    try {
      const response = await fetch(`/api/reports/email?companyId=${companyId}`);
      const data = await response.json();
      
      if (data.success && data.data) {
        setConfig(data.data);
        setFormData(data.data);
      }
    } catch (error) {
      console.error("Erro ao carregar configuração:", error);
    }
  };

  const handleSave = async () => {
    if (!formData.recipients || formData.recipients.length === 0) {
      toast.error("Adicione pelo menos um destinatário");
      return;
    }

    if (!formData.frequency) {
      toast.error("Selecione uma frequência");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/reports/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          reportType: selectedReportType,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success("Configuração salva com sucesso!");
        setConfig(data.data);
        setIsEditing(false);
        await loadConfig();
      } else {
        toast.error(data.error || "Erro ao salvar configuração");
      }
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro interno do servidor");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Tem certeza que deseja remover a configuração de envio automático?")) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/reports/email?companyId=${companyId}`, {
        method: "DELETE",
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success("Configuração removida com sucesso!");
        setConfig(null);
        setFormData({
          companyId,
          frequency: "MONTHLY",
          recipients: [],
          format: "EXCEL",
          isActive: true,
        });
        setIsEditing(false);
      } else {
        toast.error(data.error || "Erro ao remover configuração");
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

  const getFrequencyLabel = (frequency: string) => {
    return frequencies.find(f => f.value === frequency)?.label || frequency;
  };

  const getFormatLabel = (format: string) => {
    return formats.find(f => f.value === format)?.label || format;
  };

  if (!config && !isEditing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Envio Automático por Email
          </CardTitle>
          <CardDescription>
            Configure o envio automático de relatórios por email
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              Nenhuma configuração de envio automático encontrada
            </p>
            <Button onClick={() => setIsEditing(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Configurar Envio Automático
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Envio Automático por Email
            </CardTitle>
            <CardDescription>
              Configure o envio automático de relatórios por email
            </CardDescription>
          </div>
          {config && !isEditing && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                <Settings className="h-4 w-4 mr-2" />
                Editar
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
                <Trash2 className="h-4 w-4 mr-2" />
                Remover
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {config && !isEditing ? (
          // Visualização da configuração
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Frequência</Label>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{getFrequencyLabel(config.frequency)}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Formato</Label>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span>{getFormatLabel(config.format)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Destinatários</Label>
              <div className="flex flex-wrap gap-2">
                {config.recipients.map((email, index) => (
                  <Badge key={index} variant="secondary">
                    <Users className="h-3 w-3 mr-1" />
                    {email}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch checked={config.isActive} disabled />
              <Label>Envio ativo</Label>
            </div>

            {config.createdAt && (
              <div className="text-sm text-muted-foreground">
                Configurado em: {new Date(config.createdAt).toLocaleDateString("pt-BR")}
              </div>
            )}
          </div>
        ) : (
          // Formulário de edição
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="reportType">Tipo de Relatório</Label>
                <Select value={selectedReportType} onValueChange={setSelectedReportType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de relatório" />
                  </SelectTrigger>
                  <SelectContent>
                    {reportTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="frequency">Frequência de Envio</Label>
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

              <div>
                <Label htmlFor="format">Formato do Arquivo</Label>
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
                      {email} ×
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            <div className="flex items-center gap-2">
              <Switch 
                checked={formData.isActive} 
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
              />
              <Label>Ativar envio automático</Label>
            </div>

            <Alert>
              <Calendar className="h-4 w-4" />
              <AlertDescription>
                Os relatórios serão enviados automaticamente conforme a frequência configurada. 
                Para relatórios mensais, o envio será feito no primeiro dia útil do mês.
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={isLoading}>
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? "Salvando..." : "Salvar Configuração"}
              </Button>
              {config && (
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancelar
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 