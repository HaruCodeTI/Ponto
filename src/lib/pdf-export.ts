import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface MonthlyReportData {
  month: string;
  employees: Array<{
    name: string;
    position: string;
    workSchedule: string;
    monthlyCalculation: {
      workDays: number;
      completeDays: number;
      totalRegularFormatted: string;
      totalOvertimeFormatted: string;
      totalDelayFormatted: string;
      totalEarlyDepartureFormatted: string;
    };
  }>;
}

interface HoursReportData {
  period: { startDate: string; endDate: string };
  summary: { period: string };
  employees: Array<{
    name: string;
    position: string;
    workSchedule: string;
    periodCalculation: {
      workDays: number;
      totalRegularFormatted: string;
      totalOvertimeFormatted: string;
      totalDelayFormatted: string;
      totalEarlyDepartureFormatted: string;
    };
    bankHours: {
      initialBalanceFormatted: string;
      creditsFormatted: string;
      debitsFormatted: string;
      finalBalanceFormatted: string;
    };
  }>;
}

interface PayrollReportData {
  month: string;
  employees: Array<{
    name: string;
    position: string;
    salaryFormatted: string;
    hoursWorked: string;
    overtimeFormatted: string;
    nightShiftFormatted: string;
    deductionsFormatted: string;
    totalToReceiveFormatted: string;
  }>;
}

interface IndividualReportData {
  employee: {
    name: string;
    position: string;
    workSchedule: string;
  };
  period: {
    reportPeriod: string;
  };
  dailyRecords: Array<{
    dateFormatted: string;
    dayOfWeek: string;
    entryTime: string | null;
    exitTime: string | null;
    breakStartTime: string | null;
    breakEndTime: string | null;
    totalWorkFormatted: string;
    totalBreakFormatted: string;
    overtimeFormatted: string;
    delayFormatted: string;
    earlyDepartureFormatted: string;
    status: string;
  }>;
  summary: {
    totalWorkDays: number;
    totalRegularHours: string;
    totalOvertimeHours: string;
    attendanceRate: string;
  };
}

interface LocationHistoryData {
  employee: {
    name: string;
    position: string;
    workSchedule: string;
  };
  period: {
    reportPeriod: string;
  };
  locationHistory: {
    locations: Array<{
      address: string;
      latitude: number;
      longitude: number;
      totalVisits: number;
      totalTimeSpentFormatted: string;
      averageTimeSpentFormatted: string;
      firstVisit: string;
      lastVisit: string;
    }>;
    daily: Array<{
      dateFormatted: string;
      dayOfWeek: string;
      totalRecords: number;
      uniqueLocations: number;
      totalDistanceFormatted: string;
    }>;
  };
  statistics: {
    totalDistanceFormatted: string;
    averageDistancePerDayFormatted: string;
  };
  summary: {
    totalLocations: number;
    totalRecords: number;
  };
}

interface WorkScheduleAnalysisData {
  employee: {
    name: string;
    position: string;
    workSchedule: string;
    salary: number;
    toleranceMinutes: number;
  };
  period: {
    reportPeriod: string;
  };
  workScheduleAnalysis: {
    daily: Array<{
      dateFormatted: string;
      dayName: string;
      entryTime: string | null;
      exitTime: string | null;
      breakStartTime: string | null;
      breakEndTime: string | null;
      contractedHoursFormatted: string;
      totalWorkFormatted: string;
      deviationFormatted: string;
      status: string;
    }>;
    totalDays: number;
    workDays: number;
    complianceRate: number;
    totalContractedHoursFormatted: string;
    totalWorkedHoursFormatted: string;
    totalOvertimeFormatted: string;
    totalShortageFormatted: string;
  };
  summary: {
    totalDays: number;
    workDays: number;
    complianceRate: number;
    totalContractedHours: number;
    totalWorkedHours: number;
    totalOvertime: number;
    totalShortage: number;
  };
}

interface PDFExportOptions {
  title: string;
  subtitle?: string;
  companyName?: string;
  period?: string;
  data: string[][];
  headers: string[];
  filename: string;
  orientation?: "portrait" | "landscape";
}

export function exportToPDF(options: PDFExportOptions) {
  const { title, subtitle, companyName, period, data, headers, filename, orientation = "portrait" } = options;

  // Criar documento PDF
  const doc = new jsPDF(orientation);
  
  // Configurar fonte para suporte a caracteres especiais
  doc.setFont("helvetica");
  
  // Adicionar cabeçalho
  let yPosition = 20;
  
  // Título principal
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(title, 20, yPosition);
  yPosition += 10;
  
  // Subtítulo
  if (subtitle) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(subtitle, 20, yPosition);
    yPosition += 8;
  }
  
  // Nome da empresa
  if (companyName) {
    doc.setFontSize(10);
    doc.text(`Empresa: ${companyName}`, 20, yPosition);
    yPosition += 6;
  }
  
  // Período
  if (period) {
    doc.text(`Período: ${period}`, 20, yPosition);
    yPosition += 6;
  }
  
  // Data de geração
  const now = new Date();
  doc.text(`Gerado em: ${now.toLocaleDateString("pt-BR")} às ${now.toLocaleTimeString("pt-BR")}`, 20, yPosition);
  yPosition += 15;
  
  // Adicionar tabela
  autoTable(doc, {
    head: [headers],
    body: data,
    startY: yPosition,
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [66, 139, 202],
      textColor: 255,
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    margin: { top: 10 },
    didDrawPage: function (data: { pageNumber: number; settings: { margin: { left: number } } }) {
      // Adicionar número da página
      const pageCount = doc.getNumberOfPages();
      doc.setFontSize(8);
      doc.text(`Página ${data.pageNumber} de ${pageCount}`, data.settings.margin.left, doc.internal.pageSize.height - 10);
    },
  });
  
  // Salvar arquivo
  doc.save(filename);
}

// Função específica para relatório mensal
export function exportMonthlyReportToPDF(data: MonthlyReportData, companyName?: string) {
  const headers = [
    "Funcionário",
    "Setor",
    "Jornada",
    "Dias Trabalhados",
    "Horas Regulares",
    "Horas Extras",
    "Atrasos",
    "Saídas Antecipadas",
    "Taxa Presença"
  ];
  
  const tableData = data.employees.map((employee: any) => {
    const attendanceRate = employee.monthlyCalculation.workDays > 0
      ? ((employee.monthlyCalculation.completeDays / employee.monthlyCalculation.workDays) * 100).toFixed(1) + "%"
      : "0%";
    
    return [
      employee.name,
      employee.position,
      employee.workSchedule,
      employee.monthlyCalculation.workDays.toString(),
      employee.monthlyCalculation.totalRegularFormatted,
      employee.monthlyCalculation.totalOvertimeFormatted,
      employee.monthlyCalculation.totalDelayFormatted,
      employee.monthlyCalculation.totalEarlyDepartureFormatted,
      attendanceRate
    ];
  });
  
  exportToPDF({
    title: "Relatório Mensal Geral",
    subtitle: "Consolidado de Funcionários",
    companyName,
    period: data.month,
    data: tableData,
    headers,
    filename: `relatorio-mensal-${data.month}.pdf`,
    orientation: "landscape"
  });
}

// Função específica para relatório de horas
export function exportHoursReportToPDF(data: HoursReportData, companyName?: string) {
  const headers = [
    "Funcionário",
    "Setor",
    "Jornada",
    "Dias",
    "Horas Regulares",
    "Horas Extras",
    "Atrasos",
    "Saídas Antecipadas",
    "Saldo Inicial",
    "Créditos",
    "Débitos",
    "Saldo Final"
  ];
  
  const tableData = data.employees.map((employee: any) => [
    employee.name,
    employee.position,
    employee.workSchedule,
    employee.periodCalculation.workDays.toString(),
    employee.periodCalculation.totalRegularFormatted,
    employee.periodCalculation.totalOvertimeFormatted,
    employee.periodCalculation.totalDelayFormatted,
    employee.periodCalculation.totalEarlyDepartureFormatted,
    employee.bankHours.initialBalanceFormatted,
    employee.bankHours.creditsFormatted,
    employee.bankHours.debitsFormatted,
    employee.bankHours.finalBalanceFormatted
  ]);
  
  exportToPDF({
    title: "Relatório de Horas Trabalhadas, Extras e Banco de Horas",
    subtitle: "Consolidado por Período",
    companyName,
    period: data.summary.period,
    data: tableData,
    headers,
    filename: `relatorio-horas-${data.period.startDate}-${data.period.endDate}.pdf`,
    orientation: "landscape"
  });
}

// Função para relatório de folha de pagamento
export function exportPayrollReportToPDF(data: PayrollReportData, companyName?: string) {
  const headers = [
    "Funcionário",
    "Cargo",
    "Salário Base",
    "Horas Trabalhadas",
    "Horas Extras",
    "Adicional Noturno",
    "Descontos",
    "Total a Receber"
  ];
  
  const tableData = data.employees.map((employee: any) => [
    employee.name,
    employee.position,
    employee.salaryFormatted,
    employee.hoursWorked,
    employee.overtimeFormatted,
    employee.nightShiftFormatted,
    employee.deductionsFormatted,
    employee.totalToReceiveFormatted
  ]);
  
  exportToPDF({
    title: "Folha de Pagamento",
    subtitle: "Consolidado Mensal",
    companyName,
    period: data.month,
    data: tableData,
    headers,
    filename: `folha-pagamento-${data.month}.pdf`,
    orientation: "landscape"
  });
}

// Função para relatório individual
export function exportIndividualReportToPDF(data: IndividualReportData, companyName?: string) {
  const headers = [
    "Data",
    "Dia da Semana",
    "Entrada",
    "Saída",
    "Pausa Início",
    "Pausa Fim",
    "Horas Trabalhadas",
    "Horas de Pausa",
    "Horas Extras",
    "Atrasos",
    "Saídas Antecipadas",
    "Status"
  ];
  
  const tableData = data.dailyRecords.map((day) => [
    day.dateFormatted,
    day.dayOfWeek,
    day.entryTime || "-",
    day.exitTime || "-",
    day.breakStartTime || "-",
    day.breakEndTime || "-",
    day.totalWorkFormatted,
    day.totalBreakFormatted,
    day.overtimeFormatted,
    day.delayFormatted,
    day.earlyDepartureFormatted,
    day.status === "complete" ? "Completo" : day.status === "partial" ? "Parcial" : "Incompleto"
  ]);
  
  exportToPDF({
    title: "Relatório Individual Diário",
    subtitle: `${data.employee.name} - ${data.employee.position}`,
    companyName,
    period: data.period.reportPeriod,
    data: tableData,
    headers,
    filename: `relatorio-individual-${data.employee.name}-${data.period.reportPeriod}.pdf`,
    orientation: "landscape"
  });
}

// Função para histórico de localizações
export function exportLocationHistoryToPDF(data: LocationHistoryData, companyName?: string) {
  const headers = [
    "Endereço",
    "Coordenadas",
    "Visitas",
    "Tempo Total",
    "Tempo Médio",
    "Primeira Visita",
    "Última Visita"
  ];
  
  const tableData = data.locationHistory.locations.map((location) => [
    location.address,
    `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`,
    location.totalVisits.toString(),
    location.totalTimeSpentFormatted,
    location.averageTimeSpentFormatted,
    new Date(location.firstVisit).toLocaleDateString("pt-BR"),
    new Date(location.lastVisit).toLocaleDateString("pt-BR")
  ]);
  
  exportToPDF({
    title: "Histórico de Localizações",
    subtitle: `${data.employee.name} - ${data.employee.position}`,
    companyName,
    period: data.period.reportPeriod,
    data: tableData,
    headers,
    filename: `historico-localizacoes-${data.employee.name}-${data.period.reportPeriod}.pdf`,
    orientation: "landscape"
  });
}

// Função para análise de jornada contratada
export function exportWorkScheduleAnalysisToPDF(data: WorkScheduleAnalysisData, companyName?: string) {
  const headers = [
    "Data",
    "Dia da Semana",
    "Entrada",
    "Saída",
    "Pausa",
    "Horas Contratadas",
    "Horas Trabalhadas",
    "Desvio",
    "Status"
  ];

  const tableData = data.workScheduleAnalysis.daily.map((day) => [
    day.dateFormatted,
    day.dayName,
    day.entryTime || "-",
    day.exitTime || "-",
    day.breakStartTime && day.breakEndTime ? `${day.breakStartTime} - ${day.breakEndTime}` : "-",
    day.contractedHoursFormatted,
    day.totalWorkFormatted,
    day.deviationFormatted,
    day.status === "compliant" ? "Conforme" : day.status === "overtime" ? "Horas Extras" : day.status === "shortage" ? "Faltou" : "Incompleto"
  ]);

  exportToPDF({
    title: "Análise de Jornada Contratada",
    subtitle: `${data.employee.name} - ${data.employee.position}`,
    companyName,
    period: data.period.reportPeriod,
    data: tableData,
    headers,
    filename: `analise-jornada-${data.employee.name}-${data.period.reportPeriod}.pdf`,
    orientation: "landscape"
  });
} 