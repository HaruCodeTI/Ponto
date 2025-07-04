import { NextRequest, NextResponse } from "next/server";
import { 
  generateDatabaseBackup, 
  restoreDatabaseBackup, 
  listBackups, 
  getBackupPath,
  BackupResult,
  RestoreResult 
} from "@/lib/backup";
import { createSystemAuditLog } from "@/lib/audit-logs";
import fs from "fs";

export async function GET() {
  try {
    const backups = listBackups();
    
    return NextResponse.json({
      success: true,
      backups: backups.map(file => ({
        fileName: file,
        size: fs.statSync(getBackupPath(file)).size,
        createdAt: fs.statSync(getBackupPath(file)).birthtime.toISOString(),
      })),
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Erro ao listar backups" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, fileName } = await request.json();
    
    if (action === "create") {
      const result: BackupResult = await generateDatabaseBackup();
      
      if (result.success) {
        await createSystemAuditLog({
          userId: "system",
          employeeId: "system", 
          companyId: "system",
          action: "BACKUP_COMPLETE",
          status: "SUCCESS",
          details: `Backup criado: ${result.filePath}`,
        });
        
        return NextResponse.json({
          success: true,
          message: "Backup criado com sucesso",
          filePath: result.filePath,
        });
      } else {
        await createSystemAuditLog({
          userId: "system",
          employeeId: "system",
          companyId: "system", 
          action: "BACKUP_START",
          status: "FAILED",
          details: `Erro ao criar backup: ${result.error}`,
        });
        
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 500 }
        );
      }
    }
    
    if (action === "restore" && fileName) {
      const result: RestoreResult = await restoreDatabaseBackup(getBackupPath(fileName));
      
      if (result.success) {
        await createSystemAuditLog({
          userId: "system",
          employeeId: "system",
          companyId: "system",
          action: "BACKUP_COMPLETE", 
          status: "SUCCESS",
          details: `Backup restaurado: ${fileName}`,
        });
        
        return NextResponse.json({
          success: true,
          message: "Backup restaurado com sucesso",
        });
      } else {
        await createSystemAuditLog({
          userId: "system",
          employeeId: "system",
          companyId: "system",
          action: "BACKUP_START",
          status: "FAILED", 
          details: `Erro ao restaurar backup: ${result.error}`,
        });
        
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json(
      { success: false, error: "Ação inválida" },
      { status: 400 }
    );
      } catch {
      return NextResponse.json(
        { success: false, error: "Erro interno do servidor" },
        { status: 500 }
      );
    }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get("fileName");
    
    if (!fileName) {
      return NextResponse.json(
        { success: false, error: "Nome do arquivo é obrigatório" },
        { status: 400 }
      );
    }
    
    const filePath = getBackupPath(fileName);
    
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { success: false, error: "Arquivo não encontrado" },
        { status: 404 }
      );
    }
    
    fs.unlinkSync(filePath);
    
    await createSystemAuditLog({
      userId: "system",
      employeeId: "system",
      companyId: "system",
      action: "BACKUP_COMPLETE",
      status: "SUCCESS", 
      details: `Backup deletado: ${fileName}`,
    });
    
    return NextResponse.json({
      success: true,
      message: "Backup deletado com sucesso",
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Erro ao deletar backup" },
      { status: 500 }
    );
  }
} 