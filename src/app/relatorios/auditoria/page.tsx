import { Metadata } from "next";
import { TimeRecordAuditLogTable } from "@/components/time-record/time-record-audit-log-table";

export const metadata: Metadata = {
  title: "Logs de Auditoria - Sistema de Ponto",
  description: "Visualize logs de auditoria de registro de ponto com detalhes de tentativas, autenticação e validações.",
};

export default function AuditoriaPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Logs de Auditoria</h1>
        <p className="text-muted-foreground">
          Visualize e analise todos os logs de auditoria de registro de ponto, incluindo tentativas de autenticação, 
          validações e detalhes de segurança.
        </p>
      </div>

      <TimeRecordAuditLogTable 
        showFilters={true}
        showStats={true}
        limit={50}
      />
    </div>
  );
} 