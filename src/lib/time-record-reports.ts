import { 
  TimeRecord,
  TimeRecordReportFilters,
  TimeRecordReportResponse,
  TimeRecordAggregatedData,
  TimeRecordStats,
  DailyTimeRecordSummary,
  WeeklyTimeRecordSummary,
  MonthlyTimeRecordSummary,
  AttendanceAnalysis,
  OvertimeReport,
  LateArrivalsReport,
  EarlyDeparturesReport,
  AbsencesReport,
  ReportType
} from "@/types/time-record";

/**
 * Gera relatório de ponto baseado nos filtros fornecidos
 */
export async function generateTimeRecordReport(
  filters: TimeRecordReportFilters
): Promise<TimeRecordReportResponse> {
  // Em produção, buscaria dados reais do banco
  // Por enquanto, usa dados simulados
  const mockRecords = generateMockTimeRecords(filters);
  
  // Agrega dados por período
  const aggregatedData = aggregateTimeRecords(mockRecords, filters);
  
  // Calcula estatísticas
  const stats = calculateTimeRecordStats(aggregatedData);
  
  // Gera resumos baseados no tipo de relatório
  const summaries = generateSummaries(aggregatedData, filters.reportType);
  
  // Gera análises específicas
  const analyses = generateAnalyses(aggregatedData, filters.reportType);
  
  return {
    reportType: filters.reportType,
    filters,
    stats,
    data: aggregatedData,
    summaries,
    analyses,
    generatedAt: new Date().toISOString(),
    totalRecords: mockRecords.length,
  };
}

/**
 * Gera registros de ponto simulados para demonstração
 */
function generateMockTimeRecords(filters: TimeRecordReportFilters): TimeRecord[] {
  const records: TimeRecord[] = [];
  const startDate = new Date(filters.startDate);
  const endDate = new Date(filters.endDate);
  const employeeIds = filters.employeeId ? [filters.employeeId] : ['emp_1', 'emp_2', 'emp_3', 'emp_4', 'emp_5'];
  
  for (const employeeId of employeeIds) {
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      // Pula finais de semana (sábado = 6, domingo = 0)
      if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
        // Gera entrada (8h da manhã com variação)
        const entryHour = 8 + (Math.random() - 0.5) * 2; // 7h-9h
        const entryTime = new Date(currentDate);
        entryTime.setHours(Math.floor(entryHour), Math.floor((entryHour % 1) * 60), 0, 0);
        
        records.push({
          id: `record_${employeeId}_${currentDate.getTime()}_entry`,
          type: 'ENTRY',
          timestamp: entryTime.toISOString(),
          latitude: -23.5505 + (Math.random() - 0.5) * 0.01,
          longitude: -46.6333 + (Math.random() - 0.5) * 0.01,
          ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
          deviceInfo: Math.random() > 0.5 ? 'Mobile App' : 'Desktop Web',
          hash: `hash_${Math.random().toString(36).substring(2, 16)}`,
          createdAt: entryTime.toISOString(),
          userId: `user_${employeeId}`,
          employeeId,
          companyId: filters.companyId || '1',
        });
        
        // 50% de chance de ter pausa para almoço
        if (Math.random() > 0.5) {
          const breakStartHour = 12 + (Math.random() - 0.5) * 2; // 11h-13h
          const breakStartTime = new Date(currentDate);
          breakStartTime.setHours(Math.floor(breakStartHour), Math.floor((breakStartHour % 1) * 60), 0, 0);
          
          records.push({
            id: `record_${employeeId}_${currentDate.getTime()}_break_start`,
            type: 'BREAK_START',
            timestamp: breakStartTime.toISOString(),
            latitude: -23.5505 + (Math.random() - 0.5) * 0.01,
            longitude: -46.6333 + (Math.random() - 0.5) * 0.01,
            ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
            deviceInfo: Math.random() > 0.5 ? 'Mobile App' : 'Desktop Web',
            hash: `hash_${Math.random().toString(36).substring(2, 16)}`,
            createdAt: breakStartTime.toISOString(),
            userId: `user_${employeeId}`,
            employeeId,
            companyId: filters.companyId || '1',
          });
          
          const breakEndHour = breakStartHour + 1 + Math.random(); // 1-2h de pausa
          const breakEndTime = new Date(currentDate);
          breakEndTime.setHours(Math.floor(breakEndHour), Math.floor((breakEndHour % 1) * 60), 0, 0);
          
          records.push({
            id: `record_${employeeId}_${currentDate.getTime()}_break_end`,
            type: 'BREAK_END',
            timestamp: breakEndTime.toISOString(),
            latitude: -23.5505 + (Math.random() - 0.5) * 0.01,
            longitude: -46.6333 + (Math.random() - 0.5) * 0.01,
            ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
            deviceInfo: Math.random() > 0.5 ? 'Mobile App' : 'Desktop Web',
            hash: `hash_${Math.random().toString(36).substring(2, 16)}`,
            createdAt: breakEndTime.toISOString(),
            userId: `user_${employeeId}`,
            employeeId,
            companyId: filters.companyId || '1',
          });
        }
        
        // Gera saída (17h-19h, com variação)
        const exitHour = 17 + (Math.random() - 0.5) * 4; // 15h-19h
        const exitTime = new Date(currentDate);
        exitTime.setHours(Math.floor(exitHour), Math.floor((exitHour % 1) * 60), 0, 0);
        
        records.push({
          id: `record_${employeeId}_${currentDate.getTime()}_exit`,
          type: 'EXIT',
          timestamp: exitTime.toISOString(),
          latitude: -23.5505 + (Math.random() - 0.5) * 0.01,
          longitude: -46.6333 + (Math.random() - 0.5) * 0.01,
          ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
          deviceInfo: Math.random() > 0.5 ? 'Mobile App' : 'Desktop Web',
          hash: `hash_${Math.random().toString(36).substring(2, 16)}`,
          createdAt: exitTime.toISOString(),
          userId: `user_${employeeId}`,
          employeeId,
          companyId: filters.companyId || '1',
        });
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }
  
  return records.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

/**
 * Agrega registros de ponto por período
 */
function aggregateTimeRecords(records: TimeRecord[], _filters: TimeRecordReportFilters): TimeRecordAggregatedData[] {
  const aggregated: Record<string, TimeRecordAggregatedData> = {};
  
  // Agrupa registros por funcionário e data
  records.forEach(record => {
    const date = new Date(record.timestamp).toISOString().split('T')[0];
    const key = `${record.employeeId}_${date}`;
    
    if (!aggregated[key]) {
      aggregated[key] = {
        date,
        employeeId: record.employeeId,
        employeeName: `Funcionário ${record.employeeId}`,
        department: 'TI',
        totalHours: 0,
        regularHours: 0,
        overtimeHours: 0,
        breakHours: 0,
        isComplete: false,
        isLate: false,
        isEarlyDeparture: false,
        hasOvertime: false,
        records: [],
      };
    }
    
    aggregated[key].records.push(record);
  });
  
  // Calcula horas e status para cada agregação
  Object.values(aggregated).forEach(data => {
    const sortedRecords = data.records.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    // Encontra entrada e saída
    const entry = sortedRecords.find(r => r.type === 'ENTRY');
    const exit = sortedRecords.find(r => r.type === 'EXIT');
    const breakStart = sortedRecords.find(r => r.type === 'BREAK_START');
    const breakEnd = sortedRecords.find(r => r.type === 'BREAK_END');
    
    if (entry) {
      data.entryTime = entry.timestamp;
      data.location = {
        latitude: entry.latitude || 0,
        longitude: entry.longitude || 0,
      };
      
      // Verifica se chegou atrasado (após 8h30)
      const entryTime = new Date(entry.timestamp);
      const expectedEntry = new Date(entryTime);
      expectedEntry.setHours(8, 30, 0, 0);
      data.isLate = entryTime > expectedEntry;
    }
    
    if (exit) {
      data.exitTime = exit.timestamp;
      
      // Verifica se saiu antes (antes de 17h30)
      const exitTime = new Date(exit.timestamp);
      const expectedExit = new Date(exitTime);
      expectedExit.setHours(17, 30, 0, 0);
      data.isEarlyDeparture = exitTime < expectedExit;
    }
    
    // Calcula horas trabalhadas
    if (entry && exit) {
      data.isComplete = true;
      
      let totalMinutes = (new Date(exit.timestamp).getTime() - new Date(entry.timestamp).getTime()) / (1000 * 60);
      
      // Subtrai pausa se existir
      if (breakStart && breakEnd) {
        const breakMinutes = (new Date(breakEnd.timestamp).getTime() - new Date(breakStart.timestamp).getTime()) / (1000 * 60);
        totalMinutes -= breakMinutes;
        data.breakHours = breakMinutes / 60;
      }
      
      data.totalHours = totalMinutes / 60;
      data.regularHours = Math.min(data.totalHours, 8); // 8h regulares
      data.overtimeHours = Math.max(0, data.totalHours - 8); // Horas extras
      data.hasOvertime = data.overtimeHours > 0;
    }
  });
  
  return Object.values(aggregated);
}

/**
 * Calcula estatísticas gerais dos dados agregados
 */
function calculateTimeRecordStats(data: TimeRecordAggregatedData[]): TimeRecordStats {
  const totalEmployees = new Set(data.map(d => d.employeeId)).size;
  const totalDays = data.length;
  const totalHours = data.reduce((sum, d) => sum + d.totalHours, 0);
  const totalOvertime = data.reduce((sum, d) => sum + d.overtimeHours, 0);
  const totalLates = data.filter(d => d.isLate).length;
  const totalAbsences = 0; // Seria calculado baseado em funcionários esperados vs presentes
  
  return {
    totalEmployees,
    totalDays,
    totalHours,
    totalOvertime,
    totalLates,
    totalAbsences,
    averageHoursPerDay: totalDays > 0 ? totalHours / totalDays : 0,
    averageOvertimePerDay: totalDays > 0 ? totalOvertime / totalDays : 0,
    attendanceRate: totalDays > 0 ? (data.filter(d => d.isComplete).length / totalDays) * 100 : 0,
    punctualityRate: totalDays > 0 ? ((totalDays - totalLates) / totalDays) * 100 : 0,
    overtimeRate: totalHours > 0 ? (totalOvertime / totalHours) * 100 : 0,
  };
}

/**
 * Gera resumos baseados no tipo de relatório
 */
function generateSummaries(data: TimeRecordAggregatedData[], reportType: ReportType) {
  const summaries: Record<string, unknown> = {};
  
  if (reportType === 'DAILY_SUMMARY' || reportType === 'COMPANY_OVERVIEW') {
    summaries.daily = generateDailySummaries(data);
  }
  
  if (reportType === 'WEEKLY_SUMMARY') {
    summaries.weekly = generateWeeklySummaries(data);
  }
  
  if (reportType === 'MONTHLY_SUMMARY') {
    summaries.monthly = generateMonthlySummaries(data);
  }
  
  return summaries;
}

/**
 * Gera resumos diários
 */
function generateDailySummaries(data: TimeRecordAggregatedData[]): DailyTimeRecordSummary[] {
  const dailyMap: Record<string, DailyTimeRecordSummary> = {};
  
  data.forEach(item => {
    if (!dailyMap[item.date]) {
      dailyMap[item.date] = {
        date: item.date,
        totalEmployees: 0,
        presentEmployees: 0,
        absentEmployees: 0,
        lateEmployees: 0,
        earlyDepartures: 0,
        overtimeEmployees: 0,
        totalHours: 0,
        totalOvertime: 0,
        averageHours: 0,
        attendanceRate: 0,
        punctualityRate: 0,
      };
    }
    
    const summary = dailyMap[item.date];
    summary.totalEmployees++;
    summary.totalHours += item.totalHours;
    summary.totalOvertime += item.overtimeHours;
    
    if (item.isComplete) summary.presentEmployees++;
    if (item.isLate) summary.lateEmployees++;
    if (item.isEarlyDeparture) summary.earlyDepartures++;
    if (item.hasOvertime) summary.overtimeEmployees++;
  });
  
  // Calcula médias e taxas
  Object.values(dailyMap).forEach(summary => {
    summary.averageHours = summary.presentEmployees > 0 ? summary.totalHours / summary.presentEmployees : 0;
    summary.attendanceRate = summary.totalEmployees > 0 ? (summary.presentEmployees / summary.totalEmployees) * 100 : 0;
    summary.punctualityRate = summary.presentEmployees > 0 ? ((summary.presentEmployees - summary.lateEmployees) / summary.presentEmployees) * 100 : 0;
  });
  
  return Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Gera resumos semanais
 */
function generateWeeklySummaries(data: TimeRecordAggregatedData[]): WeeklyTimeRecordSummary[] {
  const weeklyMap: Record<string, WeeklyTimeRecordSummary> = {};
  
  data.forEach(item => {
    const date = new Date(item.date);
    const weekStart = getWeekStart(date);
    const weekKey = weekStart.toISOString().split('T')[0];
    
    if (!weeklyMap[weekKey]) {
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      weeklyMap[weekKey] = {
        weekStart: weekStart.toISOString(),
        weekEnd: weekEnd.toISOString(),
        weekNumber: getWeekNumber(date),
        totalEmployees: 0,
        totalDays: 0,
        totalHours: 0,
        totalOvertime: 0,
        totalLates: 0,
        totalAbsences: 0,
        averageHoursPerDay: 0,
        averageOvertimePerDay: 0,
        attendanceRate: 0,
        punctualityRate: 0,
        dailySummaries: [],
      };
    }
    
    const summary = weeklyMap[weekKey];
    summary.totalDays++;
    summary.totalHours += item.totalHours;
    summary.totalOvertime += item.overtimeHours;
    if (item.isLate) summary.totalLates++;
  });
  
  // Calcula médias e taxas
  Object.values(weeklyMap).forEach(summary => {
    summary.averageHoursPerDay = summary.totalDays > 0 ? summary.totalHours / summary.totalDays : 0;
    summary.averageOvertimePerDay = summary.totalDays > 0 ? summary.totalOvertime / summary.totalDays : 0;
    summary.attendanceRate = summary.totalDays > 0 ? ((summary.totalDays - summary.totalAbsences) / summary.totalDays) * 100 : 0;
    summary.punctualityRate = summary.totalDays > 0 ? ((summary.totalDays - summary.totalLates) / summary.totalDays) * 100 : 0;
  });
  
  return Object.values(weeklyMap).sort((a, b) => a.weekStart.localeCompare(b.weekStart));
}

/**
 * Gera resumos mensais
 */
function generateMonthlySummaries(data: TimeRecordAggregatedData[]): MonthlyTimeRecordSummary[] {
  const monthlyMap: Record<string, MonthlyTimeRecordSummary> = {};
  
  data.forEach(item => {
    const date = new Date(item.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!monthlyMap[monthKey]) {
      monthlyMap[monthKey] = {
        month: monthKey,
        year: date.getFullYear(),
        monthNumber: date.getMonth() + 1,
        totalEmployees: 0,
        totalDays: 0,
        totalHours: 0,
        totalOvertime: 0,
        totalLates: 0,
        totalAbsences: 0,
        averageHoursPerDay: 0,
        averageOvertimePerDay: 0,
        attendanceRate: 0,
        punctualityRate: 0,
        weeklySummaries: [],
      };
    }
    
    const summary = monthlyMap[monthKey];
    summary.totalDays++;
    summary.totalHours += item.totalHours;
    summary.totalOvertime += item.overtimeHours;
    if (item.isLate) summary.totalLates++;
  });
  
  // Calcula médias e taxas
  Object.values(monthlyMap).forEach(summary => {
    summary.averageHoursPerDay = summary.totalDays > 0 ? summary.totalHours / summary.totalDays : 0;
    summary.averageOvertimePerDay = summary.totalDays > 0 ? summary.totalOvertime / summary.totalDays : 0;
    summary.attendanceRate = summary.totalDays > 0 ? ((summary.totalDays - summary.totalAbsences) / summary.totalDays) * 100 : 0;
    summary.punctualityRate = summary.totalDays > 0 ? ((summary.totalDays - summary.totalLates) / summary.totalDays) * 100 : 0;
  });
  
  return Object.values(monthlyMap).sort((a, b) => a.month.localeCompare(b.month));
}

/**
 * Gera análises específicas baseadas no tipo de relatório
 */
function generateAnalyses(data: TimeRecordAggregatedData[], reportType: ReportType) {
  const analyses: Record<string, unknown> = {};
  
  if (reportType === 'ATTENDANCE_ANALYSIS' || reportType === 'COMPANY_OVERVIEW') {
    analyses.attendance = generateAttendanceAnalysis(data);
  }
  
  if (reportType === 'OVERTIME_REPORT') {
    analyses.overtime = generateOvertimeReport(data);
  }
  
  if (reportType === 'LATE_ARRIVALS') {
    analyses.lates = generateLateArrivalsReport(data);
  }
  
  if (reportType === 'EARLY_DEPARTURES') {
    analyses.earlyDepartures = generateEarlyDeparturesReport(data);
  }
  
  if (reportType === 'ABSENCES') {
    analyses.absences = generateAbsencesReport(data);
  }
  
  return analyses;
}

/**
 * Gera análise de presença
 */
function generateAttendanceAnalysis(data: TimeRecordAggregatedData[]): AttendanceAnalysis[] {
  const employeeMap: Record<string, AttendanceAnalysis> = {};
  
  data.forEach(item => {
    if (!employeeMap[item.employeeId]) {
      employeeMap[item.employeeId] = {
        employeeId: item.employeeId,
        employeeName: item.employeeName,
        department: item.department,
        totalDays: 0,
        presentDays: 0,
        absentDays: 0,
        lateDays: 0,
        earlyDepartureDays: 0,
        attendanceRate: 0,
        punctualityRate: 0,
        averageHoursPerDay: 0,
        totalOvertime: 0,
        patterns: {
          frequentLates: false,
          frequentEarlyDepartures: false,
          frequentOvertime: false,
          irregularPattern: false,
        },
      };
    }
    
    const analysis = employeeMap[item.employeeId];
    analysis.totalDays++;
    analysis.totalOvertime += item.overtimeHours;
    
    if (item.isComplete) analysis.presentDays++;
    if (item.isLate) analysis.lateDays++;
    if (item.isEarlyDeparture) analysis.earlyDepartureDays++;
  });
  
  // Calcula taxas e padrões
  Object.values(employeeMap).forEach(analysis => {
    analysis.attendanceRate = analysis.totalDays > 0 ? (analysis.presentDays / analysis.totalDays) * 100 : 0;
    analysis.punctualityRate = analysis.presentDays > 0 ? ((analysis.presentDays - analysis.lateDays) / analysis.presentDays) * 100 : 0;
    analysis.averageHoursPerDay = analysis.presentDays > 0 ? (data.filter(d => d.employeeId === analysis.employeeId).reduce((sum, d) => sum + d.totalHours, 0) / analysis.presentDays) : 0;
    
    // Identifica padrões
    analysis.patterns.frequentLates = analysis.lateDays > analysis.totalDays * 0.3;
    analysis.patterns.frequentEarlyDepartures = analysis.earlyDepartureDays > analysis.totalDays * 0.2;
    analysis.patterns.frequentOvertime = analysis.totalOvertime > analysis.totalDays * 2; // Mais de 2h extras por dia em média
    analysis.patterns.irregularPattern = analysis.patterns.frequentLates || analysis.patterns.frequentEarlyDepartures;
  });
  
  return Object.values(employeeMap);
}

/**
 * Gera relatório de horas extras
 */
function generateOvertimeReport(data: TimeRecordAggregatedData[]): OvertimeReport[] {
  const employeeMap: Record<string, OvertimeReport> = {};
  
  data.forEach(item => {
    if (!employeeMap[item.employeeId]) {
      employeeMap[item.employeeId] = {
        employeeId: item.employeeId,
        employeeName: item.employeeName,
        department: item.department,
        totalOvertime: 0,
        averageOvertimePerDay: 0,
        overtimeDays: 0,
        maxOvertimeInDay: 0,
        overtimeByDay: {},
        overtimeByWeek: {},
        overtimeByMonth: {},
        isExcessive: false,
        recommendations: [],
      };
    }
    
    const report = employeeMap[item.employeeId];
    report.totalOvertime += item.overtimeHours;
    report.overtimeByDay[item.date] = item.overtimeHours;
    report.maxOvertimeInDay = Math.max(report.maxOvertimeInDay, item.overtimeHours);
    
    if (item.overtimeHours > 0) {
      report.overtimeDays++;
    }
  });
  
  // Calcula médias e identifica excessos
  Object.values(employeeMap).forEach(report => {
    report.averageOvertimePerDay = report.overtimeDays > 0 ? report.totalOvertime / report.overtimeDays : 0;
    report.isExcessive = report.totalOvertime > 44; // Limite legal semanal
    
    if (report.isExcessive) {
      report.recommendations?.push('Horas extras excedem limite legal semanal');
    }
    if (report.averageOvertimePerDay > 2) {
      report.recommendations?.push('Média diária de horas extras muito alta');
    }
  });
  
  return Object.values(employeeMap);
}

/**
 * Gera relatório de atrasos
 */
function generateLateArrivalsReport(data: TimeRecordAggregatedData[]): LateArrivalsReport[] {
  const employeeMap: Record<string, LateArrivalsReport> = {};
  
  data.forEach(item => {
    if (!employeeMap[item.employeeId]) {
      employeeMap[item.employeeId] = {
        employeeId: item.employeeId,
        employeeName: item.employeeName,
        department: item.department,
        totalLates: 0,
        averageDelay: 0,
        maxDelay: 0,
        latesByDay: {},
        latesByWeek: {},
        latesByMonth: {},
        isFrequent: false,
        reasons: [],
      };
    }
    
    const report = employeeMap[item.employeeId];
    
    if (item.isLate && item.entryTime) {
      report.totalLates++;
      const entryTime = new Date(item.entryTime);
      const expectedEntry = new Date(entryTime);
      expectedEntry.setHours(8, 30, 0, 0);
      const delayMinutes = (entryTime.getTime() - expectedEntry.getTime()) / (1000 * 60);
      
      report.latesByDay[item.date] = delayMinutes;
      report.maxDelay = Math.max(report.maxDelay, delayMinutes);
    }
  });
  
  // Calcula médias e identifica frequência
  Object.values(employeeMap).forEach(report => {
    const delays = Object.values(report.latesByDay);
    report.averageDelay = delays.length > 0 ? delays.reduce((sum, delay) => sum + delay, 0) / delays.length : 0;
    report.isFrequent = report.totalLates > 5; // Mais de 5 atrasos
    
    if (report.isFrequent) {
      report.reasons?.push('Frequência alta de atrasos');
    }
    if (report.averageDelay > 30) {
      report.reasons?.push('Atrasos muito longos em média');
    }
  });
  
  return Object.values(employeeMap);
}

/**
 * Gera relatório de saídas antecipadas
 */
function generateEarlyDeparturesReport(data: TimeRecordAggregatedData[]): EarlyDeparturesReport[] {
  const employeeMap: Record<string, EarlyDeparturesReport> = {};
  
  data.forEach(item => {
    if (!employeeMap[item.employeeId]) {
      employeeMap[item.employeeId] = {
        employeeId: item.employeeId,
        employeeName: item.employeeName,
        department: item.department,
        totalEarlyDepartures: 0,
        averageEarlyDeparture: 0,
        maxEarlyDeparture: 0,
        earlyDeparturesByDay: {},
        earlyDeparturesByWeek: {},
        earlyDeparturesByMonth: {},
        isFrequent: false,
        reasons: [],
      };
    }
    
    const report = employeeMap[item.employeeId];
    
    if (item.isEarlyDeparture && item.exitTime) {
      report.totalEarlyDepartures++;
      const exitTime = new Date(item.exitTime);
      const expectedExit = new Date(exitTime);
      expectedExit.setHours(17, 30, 0, 0);
      const earlyMinutes = (expectedExit.getTime() - exitTime.getTime()) / (1000 * 60);
      
      report.earlyDeparturesByDay[item.date] = earlyMinutes;
      report.maxEarlyDeparture = Math.max(report.maxEarlyDeparture, earlyMinutes);
    }
  });
  
  // Calcula médias e identifica frequência
  Object.values(employeeMap).forEach(report => {
    const earlyDepartures = Object.values(report.earlyDeparturesByDay);
    report.averageEarlyDeparture = earlyDepartures.length > 0 ? earlyDepartures.reduce((sum, early) => sum + early, 0) / earlyDepartures.length : 0;
    report.isFrequent = report.totalEarlyDepartures > 3; // Mais de 3 saídas antecipadas
    
    if (report.isFrequent) {
      report.reasons?.push('Frequência alta de saídas antecipadas');
    }
    if (report.averageEarlyDeparture > 60) {
      report.reasons?.push('Saídas muito antecipadas em média');
    }
  });
  
  return Object.values(employeeMap);
}

/**
 * Gera relatório de ausências
 */
function generateAbsencesReport(data: TimeRecordAggregatedData[]): AbsencesReport[] {
  const employeeMap: Record<string, AbsencesReport> = {};
  
  data.forEach(item => {
    if (!employeeMap[item.employeeId]) {
      employeeMap[item.employeeId] = {
        employeeId: item.employeeId,
        employeeName: item.employeeName,
        department: item.department,
        totalAbsences: 0,
        justifiedAbsences: 0,
        unjustifiedAbsences: 0,
        absenceRate: 0,
        absencesByDay: {},
        absencesByWeek: {},
        absencesByMonth: {},
        consecutiveAbsences: 0,
        isExcessive: false,
        recommendations: [],
      };
    }
    
    const report = employeeMap[item.employeeId];
    
    if (!item.isComplete) {
      report.totalAbsences++;
      report.absencesByDay[item.date] = true;
      report.unjustifiedAbsences++; // Por simplicidade, considera todas injustificadas
    }
  });
  
  // Calcula taxas e identifica excessos
  Object.values(employeeMap).forEach(report => {
    const totalDays = Object.keys(report.absencesByDay).length + report.totalAbsences;
    report.absenceRate = totalDays > 0 ? (report.totalAbsences / totalDays) * 100 : 0;
    report.isExcessive = report.absenceRate > 10; // Mais de 10% de ausência
    
    if (report.isExcessive) {
      report.recommendations?.push('Taxa de ausência muito alta');
    }
    if (report.consecutiveAbsences > 3) {
      report.recommendations?.push('Muitas ausências consecutivas');
    }
  });
  
  return Object.values(employeeMap);
}

/**
 * Utilitários auxiliares
 */
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Ajusta para segunda-feira
  return new Date(d.setDate(diff));
}

function getWeekNumber(date: Date): number {
  const d = new Date(date.getTime());
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return weekNo;
}

/**
 * Exporta relatório em diferentes formatos
 */
export async function exportTimeRecordReport(
  report: TimeRecordReportResponse,
  config: { format: 'PDF' | 'EXCEL' | 'CSV' | 'JSON'; fileName?: string }
): Promise<string> {
  // Em produção, implementaria exportação real
  // Por enquanto, simula exportação
  // const _fileName = config.fileName || `relatorio_ponto_${new Date().toISOString().split('T')[0]}`;
  
  switch (config.format) {
    case 'JSON':
      return `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(report, null, 2))}`;
    case 'CSV':
      return generateCSVExport(report);
    case 'EXCEL':
      return `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8,${encodeURIComponent('Excel export would be here')}`;
    case 'PDF':
      return `data:application/pdf;charset=utf-8,${encodeURIComponent('PDF export would be here')}`;
    default:
      throw new Error('Formato de exportação não suportado');
  }
}

/**
 * Gera exportação CSV
 */
function generateCSVExport(report: TimeRecordReportResponse): string {
  const headers = ['Data', 'Funcionário', 'Departamento', 'Horas Totais', 'Horas Regulares', 'Horas Extras', 'Atraso', 'Saída Antecipada'];
  const rows = report.data.map(item => [
    item.date,
    item.employeeName,
    item.department || '',
    item.totalHours.toFixed(2),
    item.regularHours.toFixed(2),
    item.overtimeHours.toFixed(2),
    item.isLate ? 'Sim' : 'Não',
    item.isEarlyDeparture ? 'Sim' : 'Não',
  ]);
  
  const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
  return `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`;
}



 