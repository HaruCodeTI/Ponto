// Tipos auxiliares para campos específicos

/** Tipos de jornada de trabalho */
export type WorkSchedule = 'PRESENCIAL' | 'HOME_OFFICE' | 'HYBRID';

/** Jornada semanal simplificada: dias e horários (ex: { segunda: '08:00-17:00', ... }) */
export type WeeklySchedule = Record<string, string>;

/** Tipos de regra de trabalho */
export type WorkRule = 'CLT' | 'PJ' | 'ESTAGIO' | 'OUTRO';

/** Interface principal do funcionário */
export interface Employee {
  id: string;
  cpf: string;
  position: string;
  salary: number;
  workSchedule: WorkSchedule;
  toleranceMinutes: number;
  bankHours: number;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  userId: string;
  companyId: string;
  weeklySchedule?: WeeklySchedule; // Novo campo opcional para jornada semanal
  workRule?: WorkRule; // Novo campo opcional para regra de trabalho
} 