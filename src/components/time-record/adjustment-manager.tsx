"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TimeRecordAdjustment, 
  AdjustmentStats, 
  AdjustmentStatus 
} from "@/types/time-record";
import { toast } from "sonner";

interface AdjustmentManagerProps {
  companyId: string;
  employeeId?: string;
}

export function AdjustmentManager({ companyId, employeeId }: AdjustmentManagerProps) {
  const [adjustments, setAdjustments] = useState<TimeRecordAdjustment[]>([]);
  const [stats, setStats] = useState<AdjustmentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");

  // Carregar ajustes
  const loadAdjustments = async (status?: AdjustmentStatus) => {
    try {
      const params = new URLSearchParams({
        companyId,
        limit: "50",
        ...(employeeId && { employeeId }),
        ...(status && { approvalStatus: status }),
      });

      const response = await fetch(`/api/time-record/adjustments?${params}`);
      const data = await response.json();

      if (data.success) {
        setAdjustments(data.data.adjustments);
      } else {
        toast.error("Erro ao carregar ajustes");
      }
    } catch (error) {
      console.error("Erro ao carregar ajustes:", error);
      toast.error("Erro ao carregar ajustes");
    }
  };

  // Carregar estatísticas
  const loadStats = async () => {
    try {
      const params = new URLSearchParams({ companyId });
      const response = await fetch(`/api/time-record/adjustments/stats?${params}`);
      const data = await response.json();

      if (data.success) {
        setStats(data.data);
      } else {
        toast.error("Erro ao carregar estatísticas");
      }
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error);
      toast.error("Erro ao carregar estatísticas");
    }
  };

  // Aprovar/rejeitar ajuste
  const handleApproval = async (adjustmentId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      const response = await fetch(`/api/time-record/adjustments/${adjustmentId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          approvedBy: "current_user", // Em produção, viria do contexto de autenticação
          approvalStatus: status,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Ajuste ${status === 'APPROVED' ? 'aprovado' : 'rejeitado'} com sucesso`);
        loadAdjustments(activeTab as AdjustmentStatus);
        loadStats();
      } else {
        toast.error(data.error || "Erro ao processar aprovação");
      }
    } catch (error) {
      console.error("Erro ao processar aprovação:", error);
      toast.error("Erro ao processar aprovação");
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        loadAdjustments(activeTab as AdjustmentStatus),
        loadStats(),
      ]);
      setLoading(false);
    };

    loadData();
  }, [companyId, employeeId, activeTab]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle>Estatísticas de Ajustes</CardTitle>
            <CardDescription>
              Visão geral dos ajustes de registro de ponto
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.totalAdjustments}</div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{stats.pendingAdjustments}</div>
                <div className="text-sm text-gray-600">Pendentes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.approvedAdjustments}</div>
                <div className="text-sm text-gray-600">Aprovados</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{stats.rejectedAdjustments}</div>
                <div className="text-sm text-gray-600">Rejeitados</div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Tempo médio de processamento</div>
                  <div className="font-semibold">{stats.averageProcessingTime.toFixed(1)} horas</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Taxa de compliance</div>
                  <div className="font-semibold">{stats.complianceRate.toFixed(1)}%</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Ajustes */}
      <Card>
        <CardHeader>
          <CardTitle>Gerenciamento de Ajustes</CardTitle>
          <CardDescription>
            Aprove ou rejeite solicitações de ajuste de registro de ponto
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="pending">Pendentes</TabsTrigger>
              <TabsTrigger value="approved">Aprovados</TabsTrigger>
              <TabsTrigger value="rejected">Rejeitados</TabsTrigger>
              <TabsTrigger value="all">Todos</TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-4">
              {adjustments.filter(a => a.approvalStatus === 'PENDING').map((adjustment) => (
                <AdjustmentCard
                  key={adjustment.id}
                  adjustment={adjustment}
                  onApproval={handleApproval}
                  showActions={true}
                />
              ))}
              {adjustments.filter(a => a.approvalStatus === 'PENDING').length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Nenhum ajuste pendente
                </div>
              )}
            </TabsContent>

            <TabsContent value="approved" className="space-y-4">
              {adjustments.filter(a => a.approvalStatus === 'APPROVED').map((adjustment) => (
                <AdjustmentCard
                  key={adjustment.id}
                  adjustment={adjustment}
                  onApproval={handleApproval}
                  showActions={false}
                />
              ))}
              {adjustments.filter(a => a.approvalStatus === 'APPROVED').length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Nenhum ajuste aprovado
                </div>
              )}
            </TabsContent>

            <TabsContent value="rejected" className="space-y-4">
              {adjustments.filter(a => a.approvalStatus === 'REJECTED').map((adjustment) => (
                <AdjustmentCard
                  key={adjustment.id}
                  adjustment={adjustment}
                  onApproval={handleApproval}
                  showActions={false}
                />
              ))}
              {adjustments.filter(a => a.approvalStatus === 'REJECTED').length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Nenhum ajuste rejeitado
                </div>
              )}
            </TabsContent>

            <TabsContent value="all" className="space-y-4">
              {adjustments.map((adjustment) => (
                <AdjustmentCard
                  key={adjustment.id}
                  adjustment={adjustment}
                  onApproval={handleApproval}
                  showActions={adjustment.approvalStatus === 'PENDING'}
                />
              ))}
              {adjustments.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Nenhum ajuste encontrado
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

interface AdjustmentCardProps {
  adjustment: TimeRecordAdjustment;
  onApproval: (adjustmentId: string, status: 'APPROVED' | 'REJECTED') => void;
  showActions: boolean;
}

function AdjustmentCard({ adjustment, onApproval, showActions }: AdjustmentCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getComplianceReasonLabel = (reason?: string) => {
    const labels: Record<string, string> = {
      FORGOT_TO_REGISTER: "Esqueceu de registrar",
      TECHNICAL_FAILURE: "Falha técnica",
      SYSTEM_ERROR: "Erro do sistema",
      POWER_OUTAGE: "Falta de energia",
      NETWORK_ISSUE: "Problema de rede",
      DEVICE_MALFUNCTION: "Mal funcionamento do dispositivo",
      HUMAN_ERROR: "Erro humano",
      LEGAL_REQUIREMENT: "Requisito legal",
      MEDICAL_EMERGENCY: "Emergência médica",
      FAMILY_EMERGENCY: "Emergência familiar",
      PUBLIC_TRANSPORT_DELAY: "Atraso no transporte público",
      WEATHER_CONDITIONS: "Condições climáticas",
      OTHER: "Outro",
    };

    return labels[reason || 'OTHER'] || "Outro";
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h4 className="font-semibold">Ajuste #{adjustment.id.slice(-8)}</h4>
            <p className="text-sm text-gray-600">
              Registro original: {adjustment.originalRecordId.slice(-8)}
            </p>
          </div>
          <Badge className={
            adjustment.approvalStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
            adjustment.approvalStatus === 'APPROVED' ? 'bg-green-100 text-green-800' :
            'bg-red-100 text-red-800'
          }>
            {adjustment.approvalStatus === 'PENDING' && 'Pendente'}
            {adjustment.approvalStatus === 'APPROVED' && 'Aprovado'}
            {adjustment.approvalStatus === 'REJECTED' && 'Rejeitado'}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-sm font-medium text-gray-700">Horário Original</div>
            <div className="text-sm">{formatDate(adjustment.originalRecord.timestamp)}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-700">Horário Ajustado</div>
            <div className="text-sm">{formatDate(adjustment.adjustedTimestamp)}</div>
          </div>
        </div>

        <div className="mb-4">
          <div className="text-sm font-medium text-gray-700">Justificativa</div>
          <div className="text-sm bg-gray-50 p-3 rounded mt-1">{adjustment.reason}</div>
        </div>

        {adjustment.complianceReason && (
          <div className="mb-4">
            <div className="text-sm font-medium text-gray-700">Motivo de Compliance</div>
            <div className="text-sm">{getComplianceReasonLabel(adjustment.complianceReason)}</div>
          </div>
        )}

        {adjustment.evidence && (
          <div className="mb-4">
            <div className="text-sm font-medium text-gray-700">Evidência</div>
            <a 
              href={adjustment.evidence} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline"
            >
              Ver evidência
            </a>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-sm font-medium text-gray-700">Solicitado por</div>
            <div className="text-sm">{adjustment.requestedBy}</div>
            <div className="text-xs text-gray-500">{formatDate(adjustment.requestedAt)}</div>
          </div>
          {adjustment.approvalStatus !== 'PENDING' && (
            <div>
              <div className="text-sm font-medium text-gray-700">
                {adjustment.approvalStatus === 'APPROVED' ? 'Aprovado' : 'Rejeitado'} por
              </div>
              <div className="text-sm">{adjustment.approvedBy}</div>
              <div className="text-xs text-gray-500">{formatDate(adjustment.approvedAt)}</div>
            </div>
          )}
        </div>

        {showActions && (
          <div className="flex gap-2 pt-4 border-t">
            <Button
              size="sm"
              onClick={() => onApproval(adjustment.id, 'APPROVED')}
              className="bg-green-600 hover:bg-green-700"
            >
              Aprovar
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onApproval(adjustment.id, 'REJECTED')}
            >
              Rejeitar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 