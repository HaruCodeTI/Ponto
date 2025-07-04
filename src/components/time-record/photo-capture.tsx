"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { 
  PhotoCaptureConfig, 
  PhotoCaptureResult, 
  capturePhotoFromCamera, 
  capturePhotoFromFile,
  validateFaceInImage,
  cleanupPhotoUrl,
  DEFAULT_PHOTO_CONFIG 
} from "@/lib/photo-capture";
import { Camera, Upload, Trash2, CheckCircle, XCircle, AlertTriangle, RefreshCw } from "lucide-react";

interface PhotoCaptureProps {
  config?: PhotoCaptureConfig;
  onPhotoCapture: (result: PhotoCaptureResult) => void;
  className?: string;
}

export function PhotoCapture({
  config = DEFAULT_PHOTO_CONFIG,
  onPhotoCapture,
  className,
}: PhotoCaptureProps) {
  const [photoResult, setPhotoResult] = useState<PhotoCaptureResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Limpa URL da foto quando componente é desmontado
  useEffect(() => {
    return () => {
      if (photoResult?.photoUrl) {
        cleanupPhotoUrl(photoResult.photoUrl);
      }
    };
  }, [photoResult?.photoUrl]);

  // Captura foto via câmera
  const handleCameraCapture = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await capturePhotoFromCamera(config);
      setPhotoResult(result);
      onPhotoCapture(result);

      if (result.success && config.requireFace) {
        const hasFace = await validateFaceInImage(result.photoUrl!);
        if (!hasFace) {
          setError("Nenhum rosto detectado na foto");
        }
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao capturar foto";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [config, onPhotoCapture]);

  // Captura foto via upload
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const result = await capturePhotoFromFile(file, config);
      setPhotoResult(result);
      onPhotoCapture(result);

      if (result.success && config.requireFace) {
        const hasFace = await validateFaceInImage(result.photoUrl!);
        if (!hasFace) {
          setError("Nenhum rosto detectado na foto");
        }
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao processar arquivo";
      setError(errorMessage);
    } finally {
      setLoading(false);
      // Limpa o input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [config, onPhotoCapture]);

  // Remove foto atual
  const handleRemovePhoto = useCallback(() => {
    if (photoResult?.photoUrl) {
      cleanupPhotoUrl(photoResult.photoUrl);
    }
    setPhotoResult(null);
    setError(null);
    onPhotoCapture({ success: false });
  }, [photoResult?.photoUrl, onPhotoCapture]);

  const getStatusIcon = () => {
    if (loading) return <RefreshCw className="h-4 w-4 animate-spin" />;
    if (!photoResult) return <Camera className="h-4 w-4" />;
    return photoResult.success ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  const getStatusBadge = () => {
    if (loading) return <Badge variant="secondary">Capturando...</Badge>;
    if (!photoResult) return <Badge variant="outline">Sem foto</Badge>;
    return photoResult.success ? (
      <Badge variant="default" className="bg-green-500">Capturada</Badge>
    ) : (
      <Badge variant="destructive">Erro</Badge>
    );
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          Captura de Foto
          {getStatusBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Configurações */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="font-medium">Configurações:</span>
          </div>
          <div className="text-sm text-muted-foreground">
            <p>Tamanho máximo: {Math.round(config.maxSize / 1024 / 1024)}MB</p>
            <p>Dimensões: {config.maxWidth}x{config.maxHeight}px</p>
            <p>Formato: {config.format.toUpperCase()}</p>
            <p>Rosto obrigatório: {config.requireFace ? "Sim" : "Não"}</p>
          </div>
        </div>

        {/* Preview da foto */}
        {photoResult?.success && photoResult.photoUrl && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-medium">Foto Capturada:</span>
            </div>
            <div className="relative">
              <img
                src={photoResult.photoUrl}
                alt="Foto capturada"
                className="w-full max-w-md h-auto rounded-md border"
              />
              <Button
                onClick={handleRemovePhoto}
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            {photoResult.metadata && (
              <div className="text-xs text-muted-foreground">
                <p>Dimensões: {photoResult.metadata.width}x{photoResult.metadata.height}px</p>
                <p>Tamanho: {Math.round(photoResult.metadata.size / 1024)}KB</p>
                <p>Formato: {photoResult.metadata.format.toUpperCase()}</p>
                <p>Capturada em: {new Date(photoResult.metadata.timestamp).toLocaleString()}</p>
              </div>
            )}
          </div>
        )}

        {/* Botões de captura */}
        {!photoResult?.success && (
          <div className="space-y-3">
            <Button
              onClick={handleCameraCapture}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  Capturando...
                </>
              ) : (
                <>
                  <Camera className="h-4 w-4 mr-2" />
                  Capturar com Câmera
                </>
              )}
            </Button>

            <div className="relative">
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                Escolher Arquivo
              </Button>
              <Input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>
        )}

        {/* Erro */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Informações adicionais */}
        {config.requireFace && (
          <Alert>
            <AlertDescription>
              ⚠️ A detecção de rosto é obrigatória. Certifique-se de que sua face esteja visível na foto.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
} 