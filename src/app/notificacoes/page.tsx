import { NotificationCenter } from '@/components/notifications/notification-center';

export default function NotificacoesPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Sistema de Notificações</h1>
        <p className="text-muted-foreground">
          Gerencie notificações em tempo real, configure preferências e mantenha-se informado sobre eventos importantes do sistema.
        </p>
      </div>

      <NotificationCenter />
    </div>
  );
} 