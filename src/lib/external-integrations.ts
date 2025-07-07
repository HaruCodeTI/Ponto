import { prisma } from './prisma';
import { 
  ExternalAPI, 
  APIEndpoint, 
  APIRequest, 
  Webhook, 
  WebhookDelivery,
  DataSync,
  APIMonitoring,
  IntegrationLog,
  IntegrationStats,
  APITestResult,
  IntegrationConfig
} from '@/types';
import crypto from 'crypto';

// Configuração global de integração
const defaultConfig: IntegrationConfig = {
  global: {
    defaultTimeout: 30000,
    maxRetries: 3,
    rateLimitEnabled: true,
    monitoringEnabled: true,
    loggingLevel: 'INFO'
  },
  security: {
    encryptionEnabled: true,
    sslVerification: true,
    ipWhitelist: [],
    apiKeyRotation: false
  },
  monitoring: {
    alerting: true,
    metricsRetention: 30,
    logRetention: 90,
    performanceThresholds: {
      responseTime: 5000,
      errorRate: 5,
      availability: 99.5
    }
  }
};

// Função para criptografar credenciais
function encryptCredentials(credentials: any, secret: string): string {
  const cipher = crypto.createCipher('aes-256-cbc', secret);
  let encrypted = cipher.update(JSON.stringify(credentials), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

// Função para descriptografar credenciais
function decryptCredentials(encryptedCredentials: string, secret: string): any {
  const decipher = crypto.createDecipher('aes-256-cbc', secret);
  let decrypted = decipher.update(encryptedCredentials, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return JSON.parse(decrypted);
}

export async function createExternalAPI(
  data: {
    companyId: string;
    name: string;
    description?: string;
    provider: string;
    apiType: ExternalAPI['apiType'];
    baseUrl: string;
    version: string;
    config: any;
    credentials: any;
    syncInterval?: number;
    metadata?: any;
  }
): Promise<ExternalAPI> {
  const defaultConfig = {
    authentication: {
      type: 'API_KEY',
      method: 'header'
    },
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'PontoSystem/1.0'
    },
    timeout: 30000,
    retry: {
      attempts: 3,
      backoff: 'exponential',
      maxDelay: 60000
    },
    rateLimiting: {
      enabled: true,
      requestsPerMinute: 60,
      burstLimit: 10
    },
    security: {
      sslVerify: true,
      certificateValidation: true
    }
  };

  const defaultMetadata = {
    documentation: {
      url: '',
      version: '1.0',
      lastUpdated: new Date()
    },
    monitoring: {
      enabled: true,
      metrics: ['response_time', 'error_rate', 'availability'],
      alerts: true
    },
    compliance: {
      gdpr: false,
      sox: false,
      hipaa: false
    }
  };

  // Criptografar credenciais
  const encryptionSecret = process.env.ENCRYPTION_SECRET || 'default-secret';
  const encryptedCredentials = encryptCredentials(data.credentials, encryptionSecret);

  return await prisma.externalAPI.create({
    data: {
      companyId: data.companyId,
      name: data.name,
      description: data.description,
      provider: data.provider,
      apiType: data.apiType,
      baseUrl: data.baseUrl,
      version: data.version,
      config: data.config || defaultConfig,
      credentials: encryptedCredentials,
      syncInterval: data.syncInterval || 60,
      metadata: data.metadata || defaultMetadata,
      isActive: true
    }
  });
}

export async function findExternalAPIs(
  filters: {
    companyId?: string;
    provider?: string;
    apiType?: string;
    isActive?: boolean;
  },
  page = 1,
  limit = 50
): Promise<{ data: ExternalAPI[]; total: number; page: number; totalPages: number }> {
  const whereClause: any = {};
  
  if (filters.companyId) whereClause.companyId = filters.companyId;
  if (filters.provider) whereClause.provider = filters.provider;
  if (filters.apiType) whereClause.apiType = filters.apiType;
  if (filters.isActive !== undefined) whereClause.isActive = filters.isActive;

  const [data, total] = await Promise.all([
    prisma.externalAPI.findMany({
      where: whereClause,
      include: {
        endpoints: {
          where: { isActive: true }
        },
        requests: {
          orderBy: { requestedAt: 'desc' },
          take: 10
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.externalAPI.count({ where: whereClause })
  ]);

  return {
    data,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
}

export async function createAPIEndpoint(
  data: {
    apiId: string;
    name: string;
    path: string;
    method: APIEndpoint['method'];
    description?: string;
    parameters?: any;
    headers?: Record<string, string>;
    response?: any;
    timeout?: number;
    retryConfig?: any;
  }
): Promise<APIEndpoint> {
  const defaultRetryConfig = {
    maxAttempts: 3,
    backoffStrategy: 'exponential',
    initialDelay: 1000,
    maxDelay: 30000,
    retryableStatusCodes: [408, 429, 500, 502, 503, 504]
  };

  return await prisma.aPIEndpoint.create({
    data: {
      apiId: data.apiId,
      name: data.name,
      path: data.path,
      method: data.method,
      description: data.description,
      parameters: data.parameters || {},
      headers: data.headers || {},
      response: data.response || {
        success: { statusCode: 200, schema: {}, examples: [] },
        error: { statusCode: 400, schema: {}, examples: [] }
      },
      timeout: data.timeout || 30000,
      retryConfig: data.retryConfig || defaultRetryConfig,
      isActive: true
    }
  });
}

export async function makeAPIRequest(
  apiId: string,
  endpointId: string,
  data: {
    method: APIRequest['method'];
    url: string;
    headers?: Record<string, string>;
    body?: any;
  }
): Promise<APIRequest> {
  const api = await prisma.externalAPI.findUnique({
    where: { id: apiId },
    include: {
      endpoints: {
        where: { id: endpointId }
      }
    }
  });

  if (!api) {
    throw new Error('API não encontrada');
  }

  const endpoint = api.endpoints[0];
  if (!endpoint) {
    throw new Error('Endpoint não encontrado');
  }

  // Criar registro da requisição
  const request = await prisma.aPIRequest.create({
    data: {
      apiId,
      endpointId,
      method: data.method,
      url: data.url,
      headers: data.headers || {},
      body: data.body,
      status: 'PENDING',
      metadata: {
        userAgent: 'PontoSystem/1.0',
        ipAddress: '127.0.0.1',
        correlationId: crypto.randomUUID(),
        tags: ['external-api'],
        priority: 'normal'
      }
    }
  });

  // TODO: Implementar requisição real
  // Por enquanto, simular requisição
  setTimeout(async () => {
    const success = Math.random() > 0.1; // 90% de sucesso
    const responseTime = Math.random() * 2000 + 100; // 100-2100ms

    await prisma.aPIRequest.update({
      where: { id: request.id },
      data: {
        status: success ? 'COMPLETED' : 'FAILED',
        responseCode: success ? 200 : 500,
        responseBody: success ? { success: true, data: {} } : { error: 'Internal server error' },
        errorMessage: success ? null : 'Request failed',
        duration: Math.round(responseTime),
        completedAt: new Date()
      }
    });

    // Registrar métrica de monitoramento
    await prisma.aPIMonitoring.create({
      data: {
        apiId,
        metric: 'response_time',
        value: responseTime,
        metadata: {
          tags: ['endpoint', endpoint.name],
          unit: 'ms',
          aggregation: 'avg'
        }
      }
    });
  }, 1000);

  return request;
}

export async function createWebhook(
  data: {
    companyId: string;
    name: string;
    description?: string;
    url: string;
    events: string[];
    headers?: Record<string, string>;
    timeout?: number;
    retryConfig?: any;
    metadata?: any;
  }
): Promise<Webhook> {
  const secret = crypto.randomBytes(32).toString('hex');
  
  const defaultRetryConfig = {
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    retryableStatusCodes: [408, 429, 500, 502, 503, 504]
  };

  const defaultMetadata = {
    security: {
      signatureVerification: true,
      ipWhitelist: [],
      userAgentValidation: false
    },
    monitoring: {
      enabled: true,
      alertOnFailure: true,
      alertThreshold: 3
    },
    performance: {
      timeout: 30000,
      maxPayloadSize: 1048576, // 1MB
      compression: true
    }
  };

  return await prisma.webhook.create({
    data: {
      companyId: data.companyId,
      name: data.name,
      description: data.description,
      url: data.url,
      events: data.events,
      secret,
      headers: data.headers || {},
      timeout: data.timeout || 30000,
      retryConfig: data.retryConfig || defaultRetryConfig,
      metadata: data.metadata || defaultMetadata,
      isActive: true
    }
  });
}

export async function deliverWebhook(
  webhookId: string,
  event: string,
  payload: any
): Promise<WebhookDelivery> {
  const webhook = await prisma.webhook.findUnique({
    where: { id: webhookId }
  });

  if (!webhook) {
    throw new Error('Webhook não encontrado');
  }

  // Criar registro da entrega
  const delivery = await prisma.webhookDelivery.create({
    data: {
      webhookId,
      event,
      payload,
      status: 'PENDING'
    }
  });

  // TODO: Implementar entrega real
  // Por enquanto, simular entrega
  setTimeout(async () => {
    const success = Math.random() > 0.15; // 85% de sucesso
    const responseTime = Math.random() * 1000 + 50; // 50-1050ms

    await prisma.webhookDelivery.update({
      where: { id: delivery.id },
      data: {
        status: success ? 'DELIVERED' : 'FAILED',
        responseCode: success ? 200 : 500,
        responseBody: success ? 'OK' : 'Delivery failed',
        errorMessage: success ? null : 'Webhook delivery failed',
        duration: Math.round(responseTime),
        deliveredAt: success ? new Date() : null
      }
    });
  }, 500);

  return delivery;
}

export async function createDataSync(
  data: {
    companyId: string;
    apiId: string;
    name: string;
    description?: string;
    sourceTable: string;
    targetTable: string;
    mapping: any[];
    schedule: any;
    metadata?: any;
  }
): Promise<DataSync> {
  const defaultMetadata = {
    lastSyncDetails: {
      startTime: new Date(),
      recordsProcessed: 0,
      recordsSynced: 0,
      errors: []
    },
    performance: {
      avgSyncTime: 0,
      avgRecordsPerSecond: 0,
      peakMemoryUsage: 0
    },
    monitoring: {
      alerts: true,
      failureThreshold: 3,
      successThreshold: 5
    }
  };

  return await prisma.dataSync.create({
    data: {
      companyId: data.companyId,
      apiId: data.apiId,
      name: data.name,
      description: data.description,
      sourceTable: data.sourceTable,
      targetTable: data.targetTable,
      mapping: data.mapping,
      schedule: data.schedule,
      status: 'IDLE',
      metadata: data.metadata || defaultMetadata,
      isActive: true
    }
  });
}

export async function executeDataSync(syncId: string): Promise<DataSync> {
  const sync = await prisma.dataSync.findUnique({
    where: { id: syncId }
  });

  if (!sync) {
    throw new Error('Sincronização não encontrada');
  }

  // Atualizar status para executando
  await prisma.dataSync.update({
    where: { id: syncId },
    data: {
      status: 'RUNNING',
      lastSync: new Date()
    }
  });

  // TODO: Implementar sincronização real
  // Por enquanto, simular sincronização
  setTimeout(async () => {
    const success = Math.random() > 0.1; // 90% de sucesso
    const recordsSynced = Math.floor(Math.random() * 1000) + 100;
    const errorCount = success ? 0 : Math.floor(Math.random() * 10) + 1;

    await prisma.dataSync.update({
      where: { id: syncId },
      data: {
        status: success ? 'COMPLETED' : 'FAILED',
        recordsSynced,
        errorCount,
        metadata: {
          ...sync.metadata,
          lastSyncDetails: {
            startTime: sync.lastSync,
            endTime: new Date(),
            duration: 5000,
            recordsProcessed: recordsSynced + errorCount,
            recordsSynced,
            errors: []
          }
        }
      }
    });
  }, 5000);

  return sync;
}

export async function logIntegrationEvent(
  data: {
    companyId: string;
    apiId?: string;
    webhookId?: string;
    level: IntegrationLog['level'];
    message: string;
    details?: any;
  }
): Promise<IntegrationLog> {
  return await prisma.integrationLog.create({
    data: {
      companyId: data.companyId,
      apiId: data.apiId,
      webhookId: data.webhookId,
      level: data.level,
      message: data.message,
      details: data.details,
      timestamp: new Date()
    }
  });
}

export async function getIntegrationStats(companyId?: string): Promise<IntegrationStats> {
  const whereClause = companyId ? { companyId } : {};

  const [
    totalAPIs,
    activeAPIs,
    totalWebhooks,
    activeWebhooks,
    totalRequests,
    successfulRequests,
    failedRequests
  ] = await Promise.all([
    prisma.externalAPI.count({ where: whereClause }),
    prisma.externalAPI.count({ where: { ...whereClause, isActive: true } }),
    prisma.webhook.count({ where: whereClause }),
    prisma.webhook.count({ where: { ...whereClause, isActive: true } }),
    prisma.aPIRequest.count({ where: whereClause }),
    prisma.aPIRequest.count({ where: { ...whereClause, status: 'COMPLETED' } }),
    prisma.aPIRequest.count({ where: { ...whereClause, status: 'FAILED' } })
  ]);

  // Calcular tempo médio de resposta
  const responseTimes = await prisma.aPIMonitoring.findMany({
    where: { metric: 'response_time' },
    orderBy: { timestamp: 'desc' },
    take: 100
  });

  const averageResponseTime = responseTimes.length > 0
    ? responseTimes.reduce((sum, rt) => sum + rt.value, 0) / responseTimes.length
    : 0;

  // Buscar APIs mais utilizadas
  const topAPIs = await prisma.externalAPI.findMany({
    where: whereClause,
    include: {
      _count: {
        select: { requests: true }
      },
      requests: {
        where: { status: 'COMPLETED' },
        select: { duration: true }
      }
    },
    take: 5,
    orderBy: {
      requests: {
        _count: 'desc'
      }
    }
  });

  // Buscar erros recentes
  const recentErrors = await prisma.integrationLog.findMany({
    where: { ...whereClause, level: { in: ['ERROR', 'CRITICAL'] } },
    orderBy: { timestamp: 'desc' },
    take: 10
  });

  return {
    totalAPIs,
    activeAPIs,
    totalWebhooks,
    activeWebhooks,
    totalRequests,
    successfulRequests,
    failedRequests,
    averageResponseTime,
    topAPIs: topAPIs.map(api => ({
      id: api.id,
      name: api.name,
      requestCount: api._count.requests,
      successRate: api.requests.length > 0 
        ? (api.requests.filter(r => r.duration).length / api.requests.length) * 100 
        : 0,
      avgResponseTime: api.requests.length > 0
        ? api.requests.reduce((sum, r) => sum + (r.duration || 0), 0) / api.requests.length
        : 0
    })),
    recentErrors,
    systemHealth: {
      availability: totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 100,
      performance: averageResponseTime < 1000 ? 100 : Math.max(0, 100 - (averageResponseTime - 1000) / 10),
      reliability: totalRequests > 0 ? (1 - (failedRequests / totalRequests)) * 100 : 100,
      security: 95 // Simulado
    }
  };
}

export async function testAPIEndpoint(
  apiId: string,
  endpointId: string
): Promise<APITestResult> {
  const api = await prisma.externalAPI.findUnique({
    where: { id: apiId },
    include: {
      endpoints: {
        where: { id: endpointId }
      }
    }
  });

  if (!api || !api.endpoints[0]) {
    throw new Error('API ou endpoint não encontrado');
  }

  const endpoint = api.endpoints[0];
  const startTime = Date.now();

  try {
    // TODO: Implementar teste real
    // Por enquanto, simular teste
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 100));
    
    const success = Math.random() > 0.2; // 80% de sucesso
    const responseTime = Date.now() - startTime;

    return {
      success,
      responseCode: success ? 200 : 500,
      responseTime,
      responseBody: success ? { success: true } : { error: 'Test failed' },
      error: success ? undefined : 'Endpoint test failed',
      timestamp: new Date(),
      endpoint: endpoint.path,
      method: endpoint.method
    };
  } catch (error) {
    return {
      success: false,
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date(),
      endpoint: endpoint.path,
      method: endpoint.method
    };
  }
} 