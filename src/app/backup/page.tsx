import { Metadata } from 'next';
import { BackupManager } from '@/components/backup/backup-manager';

export const metadata: Metadata = {
  title: 'Sistema de Backup e Restauração | Ponto',
  description: 'Gerencie backups automáticos, restaurações e agendamentos do sistema de ponto eletrônico',
};

export default function BackupPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Dashboard</span>
        <span>/</span>
        <span>Backup e Restauração</span>
      </div>

      <BackupManager />
    </div>
  );
} 