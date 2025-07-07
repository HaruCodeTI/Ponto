'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Bell, 
  Check, 
  Archive, 
  Trash2, 
  Settings, 
  RefreshCw,
  AlertCircle,
  Info,
  CheckCircle,
  AlertTriangle,
  Clock,
  UserCheck,
  Zap
} from 'lucide-react';

interface Notification {
  id: string;
  companyId: string;
  userId?: string;
  employeeId?: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'ALERT' | 'REMINDER' | 'APPROVAL' | 'SYSTEM';
  title: string;
  message: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  category: string;
  metadata?: {
    actionUrl?: string;
    actionText?: string;
    icon?: string;
    badge?: string;
    data?: Record<string, any>;
  };
  isRead: boolean;
  isArchived: boolean;
  readAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface NotificationStats {
  total: number;
  unread: number;
  archived: number;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
  byCategory: Record<string, number>;
}

interface NotificationPreference {
  id: string;
  companyId: string;
  userId?: string;
  employeeId?: string;
  emailEnabled: boolean;
  pushEnabled: boolean;
  smsEnabled: boolean;
  inAppEnabled: boolean;
  categories: {
    ponto: boolean;
    relatorios: boolean;
    sistema: boolean;
    compliance: boolean;
    aprovacoes: boolean;
    alertas: boolean;
    lembretes: boolean;
  };
  frequency: 'IMMEDIATE' | 'HOURLY' | 'DAILY' | 'WEEKLY';
  createdAt: Date;
  updatedAt: Date;
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreference | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [showPreferences, setShowPreferences] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [notificationsRes, statsRes, preferencesRes] = await Promise.all([
        fetch('/api/notifications?limit=50'),
        fetch('/api/notifications/stats'),
        fetch('/api/notifications/preferences?companyId=sample-company-id')
      ]);

      if (notificationsRes.ok) setNotifications((await notificationsRes.json()).data);
      if (statsRes.ok) setStats(await statsRes.json());
      if (preferencesRes.ok) setPreferences(await preferencesRes.json());
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST'
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId 
              ? { ...n, isRead: true, readAt: new Date() }
              : n
          )
        );
        await loadData(); // Recarregar estatísticas
      }
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId: 'sample-company-id' })
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => ({ ...n, isRead: true, readAt: new Date() }))
        );
        await loadData();
      }
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
    }
  };

  const archiveNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/archive`, {
        method: 'POST'
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId 
              ? { ...n, isArchived: true }
              : n
          )
        );
        await loadData();
      }
    } catch (error) {
      console.error('Erro ao arquivar notificação:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        await loadData();
      }
    } catch (error) {
      console.error('Erro ao deletar notificação:', error);
    }
  };

  const updatePreferences = async (data: Partial<NotificationPreference>) => {
    try {
      const response = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: 'sample-company-id',
          ...data
        })
      });

      if (response.ok) {
        setPreferences(await response.json());
      }
    } catch (error) {
      console.error('Erro ao atualizar preferências:', error);
    }
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      INFO: <Info className="h-4 w-4" />,
      SUCCESS: <CheckCircle className="h-4 w-4" />,
      WARNING: <AlertTriangle className="h-4 w-4" />,
      ERROR: <AlertCircle className="h-4 w-4" />,
      ALERT: <Zap className="h-4 w-4" />,
      REMINDER: <Clock className="h-4 w-4" />,
      APPROVAL: <UserCheck className="h-4 w-4" />,
      SYSTEM: <Settings className="h-4 w-4" />
    };
    return icons[type as keyof typeof icons] || <Info className="h-4 w-4" />;
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      LOW: 'bg-gray-100 text-gray-800',
      NORMAL: 'bg-blue-100 text-blue-800',
      HIGH: 'bg-orange-100 text-orange-800',
      URGENT: 'bg-red-100 text-red-800'
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getTypeColor = (type: string) => {
    const colors = {
      INFO: 'text-blue-600',
      SUCCESS: 'text-green-600',
      WARNING: 'text-orange-600',
      ERROR: 'text-red-600',
      ALERT: 'text-purple-600',
      REMINDER: 'text-yellow-600',
      APPROVAL: 'text-indigo-600',
      SYSTEM: 'text-gray-600'
    };
    return colors[type as keyof typeof colors] || 'text-gray-600';
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'unread') return !n.isRead;
    if (activeTab === 'archived') return n.isArchived;
    return !n.isArchived;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Centro de Notificações</h2>
          <p className="text-muted-foreground">
            Gerencie suas notificações e preferências
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={() => setShowPreferences(!showPreferences)}>
            <Settings className="h-4 w-4 mr-2" />
            Preferências
          </Button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                notificações
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Não Lidas</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.unread}</div>
              <p className="text-xs text-muted-foreground">
                aguardando leitura
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Arquivadas</CardTitle>
              <Archive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.archived}</div>
              <p className="text-xs text-muted-foreground">
                notificações arquivadas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Categorias</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Object.keys(stats.byCategory).length}</div>
              <p className="text-xs text-muted-foreground">
                categorias ativas
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {showPreferences && preferences && (
        <Card>
          <CardHeader>
            <CardTitle>Preferências de Notificação</CardTitle>
            <CardDescription>
              Configure como e quando receber notificações
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium">Canais de Notificação</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="inApp">No Aplicativo</Label>
                    <Switch
                      id="inApp"
                      checked={preferences.inAppEnabled}
                      onCheckedChange={(checked) => 
                        updatePreferences({ inAppEnabled: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="email">Email</Label>
                    <Switch
                      id="email"
                      checked={preferences.emailEnabled}
                      onCheckedChange={(checked) => 
                        updatePreferences({ emailEnabled: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="push">Push</Label>
                    <Switch
                      id="push"
                      checked={preferences.pushEnabled}
                      onCheckedChange={(checked) => 
                        updatePreferences({ pushEnabled: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="sms">SMS</Label>
                    <Switch
                      id="sms"
                      checked={preferences.smsEnabled}
                      onCheckedChange={(checked) => 
                        updatePreferences({ smsEnabled: checked })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Categorias</h4>
                <div className="space-y-3">
                  {Object.entries(preferences.categories).map(([category, enabled]) => (
                    <div key={category} className="flex items-center justify-between">
                      <Label htmlFor={category} className="capitalize">
                        {category}
                      </Label>
                      <Switch
                        id={category}
                        checked={enabled}
                        onCheckedChange={(checked) => 
                          updatePreferences({
                            categories: {
                              ...preferences.categories,
                              [category]: checked
                            }
                          })
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Notificações</CardTitle>
              <CardDescription>
                Gerencie suas notificações recebidas
              </CardDescription>
            </div>
            <Button onClick={markAllAsRead} variant="outline" size="sm">
              <Check className="h-4 w-4 mr-2" />
              Marcar Todas como Lidas
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">Todas</TabsTrigger>
              <TabsTrigger value="unread">Não Lidas</TabsTrigger>
              <TabsTrigger value="archived">Arquivadas</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4 mt-6">
              {filteredNotifications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma notificação encontrada
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`border rounded-lg p-4 ${
                        !notification.isRead ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={getTypeColor(notification.type)}>
                            {getTypeIcon(notification.type)}
                          </div>
                          <span className="font-medium">
                            {notification.title}
                          </span>
                          <Badge className={getPriorityColor(notification.priority)}>
                            {notification.priority}
                          </Badge>
                          <Badge variant="outline">
                            {notification.category}
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          {!notification.isRead && (
                            <Button
                              onClick={() => markAsRead(notification.id)}
                              variant="outline"
                              size="sm"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            onClick={() => archiveNotification(notification.id)}
                            variant="outline"
                            size="sm"
                          >
                            <Archive className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => deleteNotification(notification.id)}
                            variant="outline"
                            size="sm"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {new Date(notification.createdAt).toLocaleString('pt-BR')}
                        </span>
                        {notification.metadata?.actionUrl && (
                          <Button variant="link" size="sm" className="p-0 h-auto">
                            {notification.metadata.actionText || 'Ver mais'}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 