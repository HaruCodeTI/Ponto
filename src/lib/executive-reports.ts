import { prisma } from './prisma';
import { 
  ExecutiveDashboard, 
  DashboardWidget, 
  BusinessKPI, 
  KPIValue,
  ReportTemplate,
  GeneratedReport,
  DataExport,
  BIIntegration,
  ExecutiveStats,
  KPITrend,
  DashboardData
} from '@/types';

export async function createExecutiveDashboard(
  data: {
    companyId: string;
    name: string;
    description?: string;
    isDefault?: boolean;
    isPublic?: boolean;
    layout?: any;
    filters?: any;
    refreshInterval?: number;
    createdBy: string;
  }
): Promise<ExecutiveDashboard> {
  const defaultLayout = {
    grid: {
      columns: 12,
      rows: 8,
      gap: 16
    },
    theme: {
      primary: '#3B82F6',
      secondary: '#6B7280',
      background: '#FFFFFF',
      text: '#1F2937'
    },
    responsive: {
      mobile: true,
      tablet: true,
      desktop: true
    }
  };

  const defaultFilters = {
    dateRange: {
      start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      end: new Date()
    }
  };

  return await prisma.executiveDashboard.create({
    data: {
      companyId: data.companyId,
      name: data.name,
      description: data.description,
      isDefault: data.isDefault || false,
      isPublic: data.isPublic || false,
      layout: data.layout || defaultLayout,
      filters: data.filters || defaultFilters,
      refreshInterval: data.refreshInterval,
      createdBy: data.createdBy
    }
  });
}

export async function findExecutiveDashboards(
  filters: {
    companyId?: string;
    createdBy?: string;
    isDefault?: boolean;
    isPublic?: boolean;
  },
  page = 1,
  limit = 50
): Promise<{ data: ExecutiveDashboard[]; total: number; page: number; totalPages: number }> {
  const whereClause: any = {};
  
  if (filters.companyId) whereClause.companyId = filters.companyId;
  if (filters.createdBy) whereClause.createdBy = filters.createdBy;
  if (filters.isDefault !== undefined) whereClause.isDefault = filters.isDefault;
  if (filters.isPublic !== undefined) whereClause.isPublic = filters.isPublic;

  const [data, total] = await Promise.all([
    prisma.executiveDashboard.findMany({
      where: whereClause,
      include: {
        widgets: {
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.executiveDashboard.count({ where: whereClause })
  ]);

  return {
    data,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
}

export async function createDashboardWidget(
  data: {
    dashboardId: string;
    widgetType: DashboardWidget['widgetType'];
    title: string;
    description?: string;
    position: any;
    size: any;
    config: any;
    dataSource: string;
    refreshInterval?: number;
    order: number;
  }
): Promise<DashboardWidget> {
  return await prisma.dashboardWidget.create({
    data: {
      dashboardId: data.dashboardId,
      widgetType: data.widgetType,
      title: data.title,
      description: data.description,
      position: data.position,
      size: data.size,
      config: data.config,
      dataSource: data.dataSource,
      refreshInterval: data.refreshInterval,
      order: data.order,
      isVisible: true
    }
  });
}

export async function createBusinessKPI(
  data: {
    companyId: string;
    name: string;
    description?: string;
    category: BusinessKPI['category'];
    formula: string;
    unit?: string;
    target?: number;
    threshold?: number;
    dataSource: string;
    refreshInterval?: number;
    metadata?: any;
  }
): Promise<BusinessKPI> {
  const defaultMetadata = {
    calculation: {
      method: 'SQL',
      parameters: {},
      dependencies: []
    },
    display: {
      format: 'number',
      precision: 2,
      prefix: '',
      suffix: ''
    },
    alerting: {
      enabled: false,
      conditions: []
    },
    history: {
      retentionDays: 365,
      aggregation: 'daily'
    }
  };

  return await prisma.businessKPI.create({
    data: {
      companyId: data.companyId,
      name: data.name,
      description: data.description,
      category: data.category,
      formula: data.formula,
      unit: data.unit,
      target: data.target,
      threshold: data.threshold,
      dataSource: data.dataSource,
      refreshInterval: data.refreshInterval || 60,
      metadata: data.metadata || defaultMetadata,
      isActive: true,
      isVisible: true
    }
  });
}

export async function calculateKPIValue(
  kpiId: string,
  period: string
): Promise<KPIValue> {
  const kpi = await prisma.businessKPI.findUnique({
    where: { id: kpiId }
  });

  if (!kpi) {
    throw new Error('KPI não encontrado');
  }

  // TODO: Implementar cálculo real baseado na fórmula
  // Por enquanto, simular cálculo
  const value = Math.random() * 100;
  const target = kpi.target;
  const threshold = kpi.threshold;

  const kpiValue = await prisma.kPIValue.create({
    data: {
      kpiId,
      value,
      target,
      threshold,
      period,
      metadata: {
        calculation: {
          startTime: new Date(),
          endTime: new Date(),
          duration: 0,
          recordsProcessed: 1000
        },
        context: {
          filters: {},
          parameters: {}
        },
        quality: {
          confidence: 0.95,
          dataQuality: 0.98,
          completeness: 0.99
        }
      }
    }
  });

  return kpiValue;
}

export async function findBusinessKPIs(
  filters: {
    companyId?: string;
    category?: string;
    isActive?: boolean;
  },
  page = 1,
  limit = 50
): Promise<{ data: BusinessKPI[]; total: number; page: number; totalPages: number }> {
  const whereClause: any = {};
  
  if (filters.companyId) whereClause.companyId = filters.companyId;
  if (filters.category) whereClause.category = filters.category;
  if (filters.isActive !== undefined) whereClause.isActive = filters.isActive;

  const [data, total] = await Promise.all([
    prisma.businessKPI.findMany({
      where: whereClause,
      include: {
        values: {
          orderBy: { timestamp: 'desc' },
          take: 10
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.businessKPI.count({ where: whereClause })
  ]);

  return {
    data,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
}

export async function getKPITrend(
  kpiId: string,
  periods: number = 12
): Promise<KPITrend> {
  const kpi = await prisma.businessKPI.findUnique({
    where: { id: kpiId }
  });

  if (!kpi) {
    throw new Error('KPI não encontrado');
  }

  const values = await prisma.kPIValue.findMany({
    where: { kpiId },
    orderBy: { timestamp: 'desc' },
    take: periods
  });

  const trendValues = values.reverse().map(v => ({
    period: v.period,
    value: v.value,
    target: v.target,
    threshold: v.threshold
  }));

  // Calcular tendência
  const recentValues = values.slice(-3);
  const olderValues = values.slice(-6, -3);
  
  const recentAvg = recentValues.reduce((sum, v) => sum + v.value, 0) / recentValues.length;
  const olderAvg = olderValues.reduce((sum, v) => sum + v.value, 0) / olderValues.length;
  
  const percentage = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;
  const direction = percentage > 5 ? 'up' : percentage < -5 ? 'down' : 'stable';

  return {
    kpiId,
    kpiName: kpi.name,
    values: trendValues,
    trend: {
      direction,
      percentage: Math.abs(percentage),
      period: '3 months'
    }
  };
}

export async function createReportTemplate(
  data: {
    companyId: string;
    name: string;
    description?: string;
    type: ReportTemplate['type'];
    format: ReportTemplate['format'];
    schedule?: any;
    config: any;
    createdBy: string;
  }
): Promise<ReportTemplate> {
  return await prisma.reportTemplate.create({
    data: {
      companyId: data.companyId,
      name: data.name,
      description: data.description,
      type: data.type,
      format: data.format,
      schedule: data.schedule,
      config: data.config,
      createdBy: data.createdBy,
      isActive: true
    }
  });
}

export async function generateReport(
  data: {
    companyId: string;
    templateId?: string;
    name: string;
    type: ReportTemplate['type'];
    format: ReportTemplate['format'];
    generatedBy: string;
  }
): Promise<GeneratedReport> {
  const report = await prisma.generatedReport.create({
    data: {
      companyId: data.companyId,
      templateId: data.templateId,
      name: data.name,
      type: data.type,
      format: data.format,
      status: 'GENERATING',
      generatedBy: data.generatedBy,
      metadata: {
        generation: {
          startTime: new Date(),
          progress: 0
        },
        content: {
          pages: 0,
          sections: 0,
          charts: 0,
          tables: 0
        },
        quality: {
          resolution: 'high',
          compression: 'none',
          fileFormat: data.format
        },
        access: {
          downloadCount: 0
        }
      }
    }
  });

  // TODO: Implementar geração real do relatório
  // Por enquanto, simular conclusão
  setTimeout(async () => {
    await prisma.generatedReport.update({
      where: { id: report.id },
      data: {
        status: 'COMPLETED',
        filePath: `/reports/${report.id}.${data.format.toLowerCase()}`,
        fileSize: 1024 * 1024, // 1MB
        downloadUrl: `/api/reports/${report.id}/download`,
        metadata: {
          ...report.metadata,
          generation: {
            startTime: report.metadata.generation.startTime,
            endTime: new Date(),
            duration: 2000,
            progress: 100
          },
          content: {
            pages: 5,
            sections: 3,
            charts: 2,
            tables: 1
          }
        }
      }
    });
  }, 2000);

  return report;
}

export async function findGeneratedReports(
  filters: {
    companyId?: string;
    type?: string;
    status?: string;
  },
  page = 1,
  limit = 50
): Promise<{ data: GeneratedReport[]; total: number; page: number; totalPages: number }> {
  const whereClause: any = {};
  
  if (filters.companyId) whereClause.companyId = filters.companyId;
  if (filters.type) whereClause.type = filters.type;
  if (filters.status) whereClause.status = filters.status;

  const [data, total] = await Promise.all([
    prisma.generatedReport.findMany({
      where: whereClause,
      orderBy: { generatedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.generatedReport.count({ where: whereClause })
  ]);

  return {
    data,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
}

export async function createDataExport(
  data: {
    companyId: string;
    name: string;
    description?: string;
    dataSource: string;
    filters: any;
    columns: string[];
    format: DataExport['format'];
    requestedBy: string;
  }
): Promise<DataExport> {
  const export_ = await prisma.dataExport.create({
    data: {
      companyId: data.companyId,
      name: data.name,
      description: data.description,
      dataSource: data.dataSource,
      filters: data.filters,
      columns: data.columns,
      format: data.format,
      status: 'PENDING',
      requestedBy: data.requestedBy,
      metadata: {
        processing: {
          startTime: new Date(),
          recordsProcessed: 0,
          recordsExported: 0
        },
        file: {
          encoding: 'UTF-8',
          delimiter: data.format === 'CSV' ? ',' : undefined
        },
        access: {
          downloadCount: 0
        }
      }
    }
  });

  // TODO: Implementar exportação real
  // Por enquanto, simular conclusão
  setTimeout(async () => {
    await prisma.dataExport.update({
      where: { id: export_.id },
      data: {
        status: 'COMPLETED',
        filePath: `/exports/${export_.id}.${data.format.toLowerCase()}`,
        fileSize: 512 * 1024, // 512KB
        downloadUrl: `/api/exports/${export_.id}/download`,
        completedAt: new Date(),
        metadata: {
          ...export_.metadata,
          processing: {
            startTime: export_.metadata.processing.startTime,
            endTime: new Date(),
            duration: 1500,
            recordsProcessed: 5000,
            recordsExported: 5000
          }
        }
      }
    });
  }, 1500);

  return export_;
}

export async function getExecutiveStats(companyId?: string): Promise<ExecutiveStats> {
  const whereClause = companyId ? { companyId } : {};

  const [
    totalDashboards,
    activeKPIs,
    totalReports,
    recentExports,
    biIntegrations
  ] = await Promise.all([
    prisma.executiveDashboard.count({ where: whereClause }),
    prisma.businessKPI.count({ where: { ...whereClause, isActive: true } }),
    prisma.generatedReport.count({ where: whereClause }),
    prisma.dataExport.count({ 
      where: { 
        ...whereClause, 
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }
    }),
    prisma.bIIntegration.count({ where: { ...whereClause, isActive: true } })
  ]);

  // Buscar KPIs principais
  const topKPIs = await prisma.businessKPI.findMany({
    where: { ...whereClause, isActive: true },
    include: {
      values: {
        orderBy: { timestamp: 'desc' },
        take: 1
      }
    },
    take: 5
  });

  // Buscar relatórios recentes
  const recentReports = await prisma.generatedReport.findMany({
    where: whereClause,
    orderBy: { generatedAt: 'desc' },
    take: 5
  });

  return {
    totalDashboards,
    activeKPIs,
    totalReports,
    recentExports,
    biIntegrations,
    topKPIs: topKPIs.map(kpi => ({
      id: kpi.id,
      name: kpi.name,
      value: kpi.values[0]?.value || 0,
      target: kpi.target,
      trend: Math.random() * 20 - 10 // Simular tendência
    })),
    recentReports,
    systemHealth: {
      dataQuality: 95,
      performance: 98,
      availability: 99.9,
      compliance: 92
    }
  };
}

export async function getDashboardData(dashboardId: string): Promise<DashboardData> {
  const dashboard = await prisma.executiveDashboard.findUnique({
    where: { id: dashboardId },
    include: {
      widgets: {
        orderBy: { order: 'asc' }
      }
    }
  });

  if (!dashboard) {
    throw new Error('Dashboard não encontrado');
  }

  // Buscar dados dos widgets
  const widgetsData = await Promise.all(
    dashboard.widgets.map(async (widget) => {
      let data: any = {};

      switch (widget.widgetType) {
        case 'KPI_CARD':
          // Buscar valor do KPI
          const kpiValue = await prisma.kPIValue.findFirst({
            where: { kpiId: widget.dataSource },
            orderBy: { timestamp: 'desc' }
          });
          data = { value: kpiValue?.value || 0 };
          break;

        case 'LINE_CHART':
        case 'BAR_CHART':
          // Simular dados de gráfico
          data = {
            labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
            datasets: [{
              label: widget.title,
              data: Array.from({ length: 6 }, () => Math.random() * 100)
            }]
          };
          break;

        case 'TABLE':
          // Simular dados de tabela
          data = {
            headers: ['Coluna 1', 'Coluna 2', 'Coluna 3'],
            rows: Array.from({ length: 5 }, () => [
              Math.random().toString(36).substring(7),
              Math.random().toString(36).substring(7),
              Math.random().toString(36).substring(7)
            ])
          };
          break;

        default:
          data = { message: 'Widget em desenvolvimento' };
      }

      return {
        widget,
        data,
        lastUpdated: new Date()
      };
    })
  );

  // Buscar KPIs ativos
  const kpis = await prisma.businessKPI.findMany({
    where: { companyId: dashboard.companyId, isActive: true }
  });

  // Simular alertas
  const alerts = [
    {
      type: 'KPI',
      message: 'KPI de produtividade abaixo da meta',
      severity: 'warning',
      timestamp: new Date()
    }
  ];

  return {
    dashboard,
    widgets: widgetsData,
    kpis,
    alerts
  };
} 