import { BackupManager } from '@/components/backup/backup-manager';
import { metadata } from './metadata';

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