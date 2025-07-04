import fs from "fs";
import path from "path";
import { exec } from "child_process";

export interface BackupResult {
  success: boolean;
  filePath?: string;
  error?: string;
}

export interface RestoreResult {
  success: boolean;
  error?: string;
}

const BACKUP_DIR = path.resolve(process.cwd(), "backups");

export function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

export async function generateDatabaseBackup(): Promise<BackupResult> {
  ensureBackupDir();
  const fileName = `backup_${new Date().toISOString().replace(/[:.]/g, "-")}.sql`;
  const filePath = path.join(BACKUP_DIR, fileName);
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return { success: false, error: "DATABASE_URL não definida" };

  // Exemplo para PostgreSQL (ajuste conforme seu banco)
  return new Promise((resolve) => {
    exec(`pg_dump ${dbUrl} > ${filePath}`, (error) => {
      if (error) {
        resolve({ success: false, error: error.message });
      } else {
        resolve({ success: true, filePath });
      }
    });
  });
}

export async function restoreDatabaseBackup(filePath: string): Promise<RestoreResult> {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return { success: false, error: "DATABASE_URL não definida" };
  if (!fs.existsSync(filePath)) return { success: false, error: "Arquivo de backup não encontrado" };

  // Exemplo para PostgreSQL (ajuste conforme seu banco)
  return new Promise((resolve) => {
    exec(`psql ${dbUrl} < ${filePath}`, (error) => {
      if (error) {
        resolve({ success: false, error: error.message });
      } else {
        resolve({ success: true });
      }
    });
  });
}

export function listBackups(): string[] {
  ensureBackupDir();
  return fs.readdirSync(BACKUP_DIR).filter(f => f.endsWith(".sql"));
}

export function getBackupPath(fileName: string): string {
  return path.join(BACKUP_DIR, fileName);
} 