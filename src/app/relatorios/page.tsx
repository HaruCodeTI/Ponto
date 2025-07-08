import { Metadata } from 'next';
import { TimeRecordReportTable } from "@/components/time-record/time-record-report-table";
import { MonthlyReport } from "@/components/reports/monthly-report";
import { HoursReport } from "@/components/reports/hours-report";
import { IndividualReport } from "@/components/reports/individual-report";
import { LocationHistory } from "@/components/reports/location-history";
import { WorkScheduleAnalysis } from "@/components/reports/work-schedule-analysis";
import { ReportScheduler } from "@/components/reports/report-scheduler";
import { ProductivityReport } from "@/components/reports/productivity-report";
import { AFDReport } from "@/components/reports/afd-report";
import { EmailScheduler } from "@/components/reports/email-scheduler";
import { FormatConfig } from "@/components/reports/format-config";
import { AdvancedScheduler } from "@/components/reports/advanced-scheduler";
import { TimeSheetMirrorViewer } from "@/components/time-sheet-mirror/time-sheet-mirror-viewer";
import { AFDExportViewer } from "@/components/afd-export/afd-export-viewer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const metadata: Metadata = {
  title: 'Relatórios | Sistema de Ponto',
  description: 'Gerencie relatórios, agendamentos e configurações de formato',
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

      <Tabs defaultValue="individual" className="space-y-6">
        <TabsList className="grid w-full grid-cols-13">
          <TabsTrigger value="individual">Individual</TabsTrigger>
          <TabsTrigger value="monthly">Mensal</TabsTrigger>
          <TabsTrigger value="hours">Horas</TabsTrigger>
          <TabsTrigger value="locations">Localizações</TabsTrigger>
          <TabsTrigger value="work-schedule">Jornada</TabsTrigger>
          <TabsTrigger value="productivity">Produtividade</TabsTrigger>
          <TabsTrigger value="mirror">Espelho de Ponto</TabsTrigger>
          <TabsTrigger value="afd">AFD</TabsTrigger>
          <TabsTrigger value="afd-export">Exportação AFD</TabsTrigger>
          <TabsTrigger value="scheduler">Agendamento</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="format">Formatos</TabsTrigger>
          <TabsTrigger value="advanced">Avançado</TabsTrigger>
        </TabsList>

        <TabsContent value="individual" className="space-y-6">
          <IndividualReport companyId="1" />
        </TabsContent>

        <TabsContent value="monthly" className="space-y-6">
          <MonthlyReport companyId="1" />
        </TabsContent>

        <TabsContent value="hours" className="space-y-6">
          <HoursReport companyId="1" />
        </TabsContent>

        <TabsContent value="locations" className="space-y-6">
          <LocationHistory companyId="1" />
        </TabsContent>

        <TabsContent value="work-schedule" className="space-y-6">
          <WorkScheduleAnalysis companyId="1" />
        </TabsContent>

        <TabsContent value="productivity" className="space-y-6">
          <ProductivityReport companyId="1" />
        </TabsContent>

        <TabsContent value="mirror" className="space-y-6">
          <TimeSheetMirrorViewer />
        </TabsContent>

        <TabsContent value="afd" className="space-y-6">
          <AFDReport companyId="1" />
        </TabsContent>

        <TabsContent value="afd-export" className="space-y-6">
          <AFDExportViewer />
        </TabsContent>

        <TabsContent value="scheduler" className="space-y-6">
          <ReportScheduler companyId="1" />
        </TabsContent>

        <TabsContent value="email" className="space-y-6">
          <EmailScheduler companyId="1" />
        </TabsContent>

        <TabsContent value="format" className="space-y-6">
          <FormatConfig companyId="1" />
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <AdvancedScheduler companyId="1" />
        </TabsContent>
      </Tabs>

      <TimeRecordReportTable />
    </div>
  );
} 