import { Metadata } from "next";
import { TimeRecordReportTable } from "@/components/time-record/time-record-report-table";

export const metadata: Metadata = {
  title: "Relatórios de Ponto - Sistema de Ponto",
  description: "Gere, visualize e exporte relatórios completos de ponto, presença, horas extras, atrasos e mais.",
};

export default function RelatoriosPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Relatórios de Ponto</h1>
        <p className="text-muted-foreground">
          Gere, visualize e exporte relatórios completos de ponto, presença, horas extras, atrasos, saídas antecipadas e ausências.
        </p>
      </div>
      <TimeRecordReportTable />
    </div>
  );
} 