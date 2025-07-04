"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, Check, X, AlertTriangle, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Notification, NotificationType } from "@/lib/notifications";

interface NotificationBellProps {
  userId: string;
  className?: string;
}

export function NotificationBell({ userId, className }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/notifications?userId=${userId}&limit=10`);
      const data = await response.json();

      if (data.success) {
        setNotifications(data.data.notifications);
        setUnreadCount(data.data.unreadCount);
      }
    } catch (error) {
      console.error("Erro ao buscar notificações:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId }),
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId ? { ...n, read: true } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Erro ao marcar notificação como lida:", error);
    }
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'TIME_RECORD_SUCCESS':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'TIME_RECORD_FAILED':
        return <X className="w-4 h-4 text-red-600" />;
      case 'ADJUSTMENT_REQUEST':
      case 'ADJUSTMENT_APPROVED':
      case 'ADJUSTMENT_REJECTED':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'COMPLIANCE_WARNING':
      case 'SYSTEM_ALERT':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      default:
        return <Bell className="w-4 h-4 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-100 text-red-800';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800';
      case 'MEDIUM':
        return 'bg-blue-100 text-blue-800';
      case 'LOW':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Agora';
    if (diffInMinutes < 60) return `${diffInMinutes}m atrás`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h atrás`;
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <div className={`relative ${className}`}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border z-50">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                Notificações
                {unreadCount > 0 && (
                  <Badge variant="secondary">
                    {unreadCount} nova{unreadCount !== 1 ? 's' : ''}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>

            <CardContent className="p-0">
              {loading ? (
                <div className="p-4 text-center text-gray-500">
                  Carregando notificações...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  Nenhuma notificação
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto">
                  {notifications.map((notification, index) => (
                    <div key={notification.id}>
                      <div className={`p-3 hover:bg-gray-50 ${!notification.read ? 'bg-blue-50' : ''}`}>
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-0.5">
                            {getNotificationIcon(notification.type)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="text-sm font-medium text-gray-900 truncate">
                                {notification.title}
                              </h4>
                              <div className="flex items-center gap-1">
                                <Badge 
                                  className={`text-xs ${getPriorityColor(notification.priority)}`}
                                >
                                  {notification.priority}
                                </Badge>
                                {!notification.read && (
                                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                )}
                              </div>
                            </div>
                            
                            <p className="text-sm text-gray-600 mb-2">
                              {notification.message}
                            </p>
                            
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500">
                                {formatTime(notification.createdAt)}
                              </span>
                              
                              <div className="flex items-center gap-2">
                                {notification.actionUrl && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      window.location.href = notification.actionUrl!;
                                      setIsOpen(false);
                                    }}
                                  >
                                    {notification.actionText || 'Ver'}
                                  </Button>
                                )}
                                
                                {!notification.read && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => markAsRead(notification.id)}
                                  >
                                    <Check className="w-3 h-3" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {index < notifications.length - 1 && <Separator />}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Overlay para fechar ao clicar fora */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
} 