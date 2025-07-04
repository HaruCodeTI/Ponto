'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, CheckCircle, XCircle, AlertTriangle, Calendar, Timer } from 'lucide-react';
import { 
  WorkTimeValidation, 
  WeeklyWorkSchedule, 
  WorkTimeValidationConfig,
  RecordType 
} from '@/types/time-record';
import { 
  validateWorkTime, 
  getCurrentTimeString, 
  getCurrentDayOfWeek, 
  generateMockWeeklySchedule,
  getDefaultValidationConfig,
  generateWorkTimeReport
} from '@/lib/work-time-validation';

interface WorkTimeValidatorProps {
  recordType: RecordType;
  employeeId?: string;
  onValidation?: (validation: WorkTimeValidation) => void;
  showDetails?: boolean;
  className?: string;
}

export function WorkTimeValidator({
  recordType,
  employeeId = 'mock-employee-id',
  onValidation,
  showDetails = true,
  className = ''
}: WorkTimeValidatorProps) {
  const [validation, setValidation] = useState<WorkTimeValidation | null>(null);
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklyWorkSchedule | null>(null);
  const [config] = useState<WorkTimeValidationConfig>(getDefaultValidationConfig());
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);

  // Atualiza o horário atual a cada minuto
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(getCurrentTimeString());
    };

    updateTime();
    const interval = setInterval(updateTime, 60000); // Atualiza a cada minuto

    return () => clearInterval(interval);
  }, []);

  // Carrega a jornada semanal do funcionário
  useEffect(() => {
    const loadSchedule = async () => {
      setIsLoading(true);
      try {
        // Simula carregamento da API
        await new Promise(resolve => setTimeout(resolve, 500));
        const schedule = generateMockWeeklySchedule(employeeId);
        setWeeklySchedule(schedule);
      } catch (error) {
        console.error('Erro ao carregar jornada:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSchedule();
  }, [employeeId]);

  // Executa validação quando os dados mudam
  useEffect(() => {
    if (weeklySchedule && currentTime) {
      const timestamp = new Date().toISOString();
      const result = validateWorkTime(recordType, timestamp, weeklySchedule, config);
      setValidation(result);
      onValidation?.(result);
    }
  }, [weeklySchedule, currentTime, recordType, config, onValidation]);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span>Carregando jornada de trabalho...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!validation || !weeklySchedule) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Não foi possível carregar a jornada de trabalho
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentDay = weeklySchedule.workDays.find(day => day.dayOfWeek === getCurrentDayOfWeek());
  const isWorkDay = currentDay?.isWorkDay || false;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Status Principal */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Validação de Horário</CardTitle>
            </div>
            <Badge variant={validation.isValid ? 'default' : 'destructive'}>
              {validation.isValid ? 'Válido' : 'Inválido'}
            </Badge>
          </div>
          <CardDescription>
            Verificação de horário de trabalho para {recordType.toLowerCase()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Informações do Dia */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{currentDay?.dayName || 'N/A'}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Timer className="h-4 w-4 text-muted-foreground" />
              <span className="font-mono">{currentTime}</span>
            </div>
          </div>

          {/* Status do Dia */}
          <div className="flex items-center space-x-2">
            {isWorkDay ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-700">Dia de trabalho</span>
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-700">Não é dia de trabalho</span>
              </>
            )}
          </div>

          {/* Horário Esperado */}
          {currentDay?.startTime && currentDay?.endTime && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-sm font-medium text-blue-900 mb-1">Horário Esperado</div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-blue-700">
                  {currentDay.startTime} - {currentDay.endTime}
                </span>
                <Badge variant="outline" className="text-xs">
                  ±{currentDay.toleranceMinutes}min
                </Badge>
              </div>
            </div>
          )}

          {/* Status de Validação */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Dentro do horário:</span>
              <Badge variant={validation.isWithinWorkHours ? 'default' : 'secondary'}>
                {validation.isWithinWorkHours ? 'Sim' : 'Não'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Dentro da tolerância:</span>
              <Badge variant={validation.isWithinTolerance ? 'default' : 'secondary'}>
                {validation.isWithinTolerance ? 'Sim' : 'Não'}
              </Badge>
            </div>
          </div>

          {/* Atrasos/Antecipações */}
          {(validation.delayMinutes || validation.earlyDepartureMinutes) && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {validation.delayMinutes && (
                  <div>Atraso de {validation.delayMinutes} minutos</div>
                )}
                {validation.earlyDepartureMinutes && (
                  <div>Saída antecipada em {validation.earlyDepartureMinutes} minutos</div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Avisos */}
          {validation.warnings.length > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  {validation.warnings.map((warning, index) => (
                    <div key={index} className="text-sm">• {warning}</div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Erros */}
          {validation.errors.length > 0 && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  {validation.errors.map((error, index) => (
                    <div key={index} className="text-sm">• {error}</div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Detalhes Expandidos */}
      {showDetails && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Detalhes da Jornada</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {weeklySchedule.workDays.map((day) => (
                <div
                  key={day.dayOfWeek}
                  className={`flex items-center justify-between p-2 rounded-lg border ${
                    day.dayOfWeek === getCurrentDayOfWeek()
                      ? 'bg-primary/5 border-primary/20'
                      : 'bg-muted/50'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium w-16">{day.dayName}</span>
                    <Badge variant={day.isWorkDay ? 'default' : 'secondary'} className="text-xs">
                      {day.isWorkDay ? 'Trabalho' : 'Folga'}
                    </Badge>
                  </div>
                  {day.isWorkDay && day.startTime && day.endTime && (
                    <div className="text-sm text-muted-foreground">
                      {day.startTime} - {day.endTime}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Configurações */}
            <div className="mt-4 pt-4 border-t">
              <div className="text-sm font-medium mb-2">Configurações</div>
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div>Total semanal: {weeklySchedule.totalWeeklyHours}h</div>
                <div>Flexível: {weeklySchedule.isFlexible ? 'Sim' : 'Não'}</div>
                <div>Máx. diário: {weeklySchedule.maxDailyHours}h</div>
                <div>Mín. diário: {weeklySchedule.minDailyHours}h</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botão para Relatório */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowReport(!showReport)}
        >
          {showReport ? 'Ocultar' : 'Ver'} Relatório
        </Button>
      </div>

      {/* Relatório Detalhado */}
      {showReport && validation && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Relatório de Validação</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto max-h-64">
              {generateWorkTimeReport(validation)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 