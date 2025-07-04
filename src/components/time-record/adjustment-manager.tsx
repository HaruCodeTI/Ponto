"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  User, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Calendar
} from "lucide-react";
import { AdjustmentJustification } from "@/lib/immutable-records";

interface AdjustmentManagerProps {
  employeeId?: string;
  companyId?: string;
  onAdjustmentUpdate?: () => void;
}

interface AdjustmentActionProps {
  adjustment: AdjustmentJustification;
  onApprove: (adjustmentId: string) => void;
  onReject: (adjustmentId: string, reason: string) => void;
}

function AdjustmentAction({ adjustment, onApprove, onReject }: AdjustmentActionProps) {
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  if (adjustment.status !== "PENDING") {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={() => onApprove(adjustment.id)}
          className="flex-1"
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Aprovar
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowRejectForm(!showRejectForm)}
          className="flex-1"
        >
          <XCircle className="w-4 h-4 mr-2" />
          Rejeitar
        </Button>
      </div>

      {showRejectForm && (
        <div className="space-y-2">
          <textarea
            placeholder="Motivo da rejeição..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            className="w-full p-2 border rounded-md text-sm"
            rows={3}
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="destructive"
              onClick={() => {
                if (rejectionReason.trim()) {
                  onReject(adjustment.id, rejectionReason);
                  setRejectionReason("");
                  setShowRejectForm(false);
                }
              }}
              disabled={!rejectionReason.trim()}
            >
              Confirmar Rejeição
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setRejectionReason("");
                setShowRejectForm(false);
              }}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function AdjustmentCard({ adjustment }: { adjustment: AdjustmentJustification }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING": return "bg-yellow-100 text-yellow-800";
      case "APPROVED": return "bg-green-100 text-green-800";
      case "REJECTED": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getReasonLabel = (reason: string) => {
    switch (reason) {
      case "CORRECTION": return "Correção";
      case "SYSTEM_ERROR": return "Erro do Sistema";
      case "HUMAN_ERROR": return "Erro Humano";
      case "TECHNICAL_ISSUE": return "Problema Técnico";
      case "OTHER": return "Outro";
      default: return reason;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("pt-BR");
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Ajuste #{adjustment.id}</CardTitle>
            <CardDescription>
              Registro: {adjustment.originalRecordId}
            </CardDescription>
          </div>
          <Badge className={getStatusColor(adjustment.status)}>
            {adjustment.status === "PENDING" && "Pendente"}
            {adjustment.status === "APPROVED" && "Aprovado"}
            {adjustment.status === "REJECTED" && "Rejeitado"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Informações básicas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4" />
              <span className="font-medium">Solicitante:</span>
              <span>{adjustment.requestedBy}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4" />
              <span className="font-medium">Data:</span>
              <span>{formatDate(adjustment.requestedAt)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <FileText className="w-4 h-4" />
              <span className="font-medium">Motivo:</span>
              <span>{getReasonLabel(adjustment.reason)}</span>
            </div>
          </div>

          {adjustment.approvedBy && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4" />
                <span className="font-medium">Aprovado por:</span>
                <span>{adjustment.approvedBy}</span>
              </div>
              {adjustment.approvedAt && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4" />
                  <span className="font-medium">Data:</span>
                  <span>{formatDate(adjustment.approvedAt)}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <Separator />

        {/* Descrição */}
        <div>
          <h4 className="font-medium mb-2">Descrição</h4>
          <p className="text-sm text-gray-600">{adjustment.description}</p>
        </div>

        {/* Mudanças */}
        <div>
          <h4 className="font-medium mb-2">Mudanças Propostas</h4>
          <div className="space-y-2">
            {Object.entries(adjustment.auditTrail.changes).map(([field, change]) => (
              <div key={field} className="flex items-center gap-2 text-sm">
                <span className="font-medium capitalize">{field}:</span>
                <span className="text-gray-500">{String(change.from)}</span>
                <span>→</span>
                <span className="text-blue-600 font-medium">{String(change.to)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Evidência */}
        {adjustment.evidence && (
          <div>
            <h4 className="font-medium mb-2">Evidência</h4>
            <a
              href={adjustment.evidence}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline text-sm"
            >
              Ver arquivo de evidência
            </a>
          </div>
        )}

        {/* Motivo da rejeição */}
        {adjustment.rejectionReason && (
          <Alert>
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Motivo da rejeição:</strong> {adjustment.rejectionReason}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

export function AdjustmentManager({ 
  employeeId, 
  companyId, 
  onAdjustmentUpdate 
}: AdjustmentManagerProps) {
  const [adjustments, setAdjustments] = useState<AdjustmentJustification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAdjustments = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (employeeId) params.append("employeeId", employeeId);
      if (companyId) params.append("companyId", companyId);

      const response = await fetch(`/api/time-record/adjustments?${params}`);
      const data = await response.json();

      if (data.success) {
        setAdjustments(data.data.adjustments);
      } else {
        setError(data.error);
      }
    } catch {
      setError("Erro ao carregar ajustes");
    } finally {
      setLoading(false);
    }
  }, [employeeId, companyId]);

  useEffect(() => {
    fetchAdjustments();
  }, [fetchAdjustments]);

  const handleApprove = async (adjustmentId: string) => {
    try {
      const response = await fetch(`/api/time-record/adjustments/${adjustmentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "approve",
          approvedBy: "current_user", // Em produção, seria o usuário logado
        }),
      });

      const data = await response.json();
      if (data.success) {
        await fetchAdjustments();
        onAdjustmentUpdate?.();
      } else {
        setError(data.error);
      }
    } catch {
      setError("Erro ao aprovar ajuste");
    }
  };

  const handleReject = async (adjustmentId: string, reason: string) => {
    try {
      const response = await fetch(`/api/time-record/adjustments/${adjustmentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reject",
          rejectedBy: "current_user", // Em produção, seria o usuário logado
          rejectionReason: reason,
        }),
      });

      const data = await response.json();
      if (data.success) {
        await fetchAdjustments();
        onAdjustmentUpdate?.();
      } else {
        setError(data.error);
      }
    } catch {
      setError("Erro ao rejeitar ajuste");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (adjustments.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum ajuste encontrado
          </h3>
          <p className="text-gray-500">
            Não há solicitações de ajuste pendentes ou aprovadas.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gerenciamento de Ajustes</h2>
          <p className="text-gray-600">
            Aprove ou rejeite solicitações de ajuste de registros de ponto
          </p>
        </div>
        <Badge variant="outline">
          {adjustments.length} ajuste{adjustments.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      <div className="grid gap-6">
        {adjustments.map((adjustment) => (
          <div key={adjustment.id} className="space-y-4">
            <AdjustmentCard adjustment={adjustment} />
            <AdjustmentAction
              adjustment={adjustment}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          </div>
        ))}
      </div>
    </div>
  );
} 