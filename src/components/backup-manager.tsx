"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Download, Upload, Trash2, Database, Clock, HardDrive } from "lucide-react";

interface BackupFile {
  fileName: string;
  size: number;
  createdAt: string;
}

export function BackupManager() {
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchBackups = async () => {
    try {
      const response = await fetch("/api/backup");
      const data = await response.json();
      
      if (data.success) {
        setBackups(data.backups);
      } else {
        setMessage({ type: "error", text: "Erro ao carregar backups" });
      }
    } catch {
      setMessage({ type: "error", text: "Erro de conexão" });
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const createBackup = async () => {
    setLoading(true);
    setMessage(null);
    
    try {
      const response = await fetch("/api/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create" }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessage({ type: "success", text: "Backup criado com sucesso!" });
        fetchBackups();
      } else {
        setMessage({ type: "error", text: data.error || "Erro ao criar backup" });
      }
    } catch {
      setMessage({ type: "error", text: "Erro de conexão" });
    } finally {
      setLoading(false);
    }
  };

  const restoreBackup = async (fileName: string) => {
    if (!confirm(`Tem certeza que deseja restaurar o backup "${fileName}"? Esta ação irá sobrescrever os dados atuais.`)) {
      return;
    }
    
    setLoading(true);
    setMessage(null);
    
    try {
      const response = await fetch("/api/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restore", fileName }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessage({ type: "success", text: "Backup restaurado com sucesso!" });
      } else {
        setMessage({ type: "error", text: data.error || "Erro ao restaurar backup" });
      }
    } catch {
      setMessage({ type: "error", text: "Erro de conexão" });
    } finally {
      setLoading(false);
    }
  };

  const deleteBackup = async (fileName: string) => {
    if (!confirm(`Tem certeza que deseja deletar o backup "${fileName}"?`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/backup?fileName=${encodeURIComponent(fileName)}`, {
        method: "DELETE",
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessage({ type: "success", text: "Backup deletado com sucesso!" });
        fetchBackups();
      } else {
        setMessage({ type: "error", text: data.error || "Erro ao deletar backup" });
      }
    } catch {
      setMessage({ type: "error", text: "Erro de conexão" });
    }
  };

  const downloadBackup = async (fileName: string) => {
    try {
      const response = await fetch(`/api/backup/download?fileName=${encodeURIComponent(fileName)}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        setMessage({ type: "error", text: "Erro ao baixar backup" });
      }
    } catch {
      setMessage({ type: "error", text: "Erro de conexão" });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("pt-BR");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Sistema de Backup e Restauração
          </CardTitle>
          <CardDescription>
            Gerencie backups do banco de dados para garantir a segurança dos dados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {message && (
            <Alert className={message.type === "success" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
              <AlertDescription className={message.type === "success" ? "text-green-800" : "text-red-800"}>
                {message.text}
              </AlertDescription>
            </Alert>
          )}
          
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Backups Disponíveis</h3>
              <p className="text-sm text-muted-foreground">
                {backups.length} backup{backups.length !== 1 ? "s" : ""} encontrado{backups.length !== 1 ? "s" : ""}
              </p>
            </div>
            <Button 
              onClick={createBackup} 
              disabled={loading}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Criar Backup
            </Button>
          </div>
          
          <Separator />
          
          {backups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <HardDrive className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum backup encontrado</p>
              <p className="text-sm">Crie seu primeiro backup para começar</p>
            </div>
          ) : (
            <div className="space-y-3">
              {backups.map((backup) => (
                <Card key={backup.fileName} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Database className="h-4 w-4 text-blue-500" />
                        <span className="font-medium">{backup.fileName}</span>
                        <Badge variant="secondary" className="text-xs">
                          {formatFileSize(backup.size)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(backup.createdAt)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadBackup(backup.fileName)}
                        className="flex items-center gap-1"
                      >
                        <Download className="h-3 w-3" />
                        Baixar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => restoreBackup(backup.fileName)}
                        className="flex items-center gap-1"
                      >
                        <Upload className="h-3 w-3" />
                        Restaurar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteBackup(backup.fileName)}
                        className="flex items-center gap-1 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                        Deletar
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 