/**
 * Configurações para captura de foto
 */
export interface PhotoCaptureConfig {
  maxSize: number; // Tamanho máximo em bytes (ex: 5MB = 5 * 1024 * 1024)
  maxWidth: number; // Largura máxima em pixels
  maxHeight: number; // Altura máxima em pixels
  quality: number; // Qualidade da compressão (0-1)
  format: 'jpeg' | 'png' | 'webp'; // Formato da imagem
  requireFace: boolean; // Se é obrigatório detectar rosto
  requireLocation: boolean; // Se é obrigatório ter localização
}

/**
 * Resultado da captura de foto
 */
export interface PhotoCaptureResult {
  success: boolean;
  photoUrl?: string;
  photoBlob?: Blob;
  metadata?: {
    width: number;
    height: number;
    size: number;
    format: string;
    timestamp: string;
    location?: {
      latitude: number;
      longitude: number;
    };
  };
  error?: string;
}

/**
 * Configurações padrão para captura de foto
 */
export const DEFAULT_PHOTO_CONFIG: PhotoCaptureConfig = {
  maxSize: 5 * 1024 * 1024, // 5MB
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 0.8,
  format: 'jpeg',
  requireFace: false,
  requireLocation: false,
};

/**
 * Captura foto via câmera do dispositivo
 */
export async function capturePhotoFromCamera(
  config: PhotoCaptureConfig = DEFAULT_PHOTO_CONFIG,
): Promise<PhotoCaptureResult> {
  try {
    // Verifica se a câmera está disponível
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("Câmera não disponível neste dispositivo");
    }

    // Solicita acesso à câmera
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: config.maxWidth },
        height: { ideal: config.maxHeight },
        facingMode: "user", // Câmera frontal
      },
    });

    // Cria elemento de vídeo para captura
    const video = document.createElement("video");
    video.srcObject = stream;
    video.autoplay = true;

    // Aguarda o vídeo carregar
    await new Promise((resolve) => {
      video.onloadedmetadata = resolve;
    });

    // Cria canvas para captura
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Não foi possível criar contexto do canvas");
    }

    // Define dimensões do canvas
    canvas.width = Math.min(video.videoWidth, config.maxWidth);
    canvas.height = Math.min(video.videoHeight, config.maxHeight);

    // Captura frame do vídeo
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Para o stream da câmera
    stream.getTracks().forEach(track => track.stop());

    // Converte para blob
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else throw new Error("Erro ao converter imagem");
        },
        `image/${config.format}`,
        config.quality
      );
    });

    // Valida tamanho do arquivo
    if (blob.size > config.maxSize) {
      throw new Error(`Arquivo muito grande: ${Math.round(blob.size / 1024 / 1024)}MB (máximo: ${Math.round(config.maxSize / 1024 / 1024)}MB)`);
    }

    // Cria URL para preview
    const photoUrl = URL.createObjectURL(blob);

    // Obtém metadados
    const metadata = {
      width: canvas.width,
      height: canvas.height,
      size: blob.size,
      format: config.format,
      timestamp: new Date().toISOString(),
    };

    return {
      success: true,
      photoUrl,
      photoBlob: blob,
      metadata,
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Captura foto via upload de arquivo
 */
export async function capturePhotoFromFile(
  file: File,
  config: PhotoCaptureConfig = DEFAULT_PHOTO_CONFIG,
): Promise<PhotoCaptureResult> {
  try {
    // Valida tipo do arquivo
    if (!file.type.startsWith("image/")) {
      throw new Error("Arquivo deve ser uma imagem");
    }

    // Valida tamanho do arquivo
    if (file.size > config.maxSize) {
      throw new Error(`Arquivo muito grande: ${Math.round(file.size / 1024 / 1024)}MB (máximo: ${Math.round(config.maxSize / 1024 / 1024)}MB)`);
    }

    // Cria URL para preview
    const photoUrl = URL.createObjectURL(file);

    // Obtém dimensões da imagem
    const dimensions = await getImageDimensions(file);

    // Redimensiona se necessário
    let processedBlob: Blob = file;
    if (dimensions.width > config.maxWidth || dimensions.height > config.maxHeight) {
      processedBlob = await resizeImage(file, config.maxWidth, config.maxHeight, config.quality, config.format);
    }

    // Obtém metadados
    const metadata = {
      width: dimensions.width,
      height: dimensions.height,
      size: processedBlob.size,
      format: config.format,
      timestamp: new Date().toISOString(),
    };

    return {
      success: true,
      photoUrl,
      photoBlob: processedBlob,
      metadata,
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Obtém dimensões de uma imagem
 */
function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = () => {
      reject(new Error("Erro ao carregar imagem"));
    };
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Redimensiona uma imagem
 */
function resizeImage(
  file: File,
  maxWidth: number,
  maxHeight: number,
  quality: number,
  format: string,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Não foi possível criar contexto do canvas"));
        return;
      }

      // Calcula novas dimensões mantendo proporção
      const ratio = Math.min(maxWidth / img.width, maxHeight / img.height);
      const newWidth = img.width * ratio;
      const newHeight = img.height * ratio;

      canvas.width = newWidth;
      canvas.height = newHeight;

      // Desenha imagem redimensionada
      ctx.drawImage(img, 0, 0, newWidth, newHeight);

      // Converte para blob
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Erro ao redimensionar imagem"));
        },
        `image/${format}`,
        quality
      );
    };
    img.onerror = () => {
      reject(new Error("Erro ao carregar imagem"));
    };
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Valida se uma imagem contém rosto (simulação)
 * Em produção, seria integrado com API de detecção facial
 */
export async function validateFaceInImage(_photoUrl: string): Promise<boolean> {
  // Em produção, isso seria uma chamada para API de detecção facial
  // Por enquanto, retorna true (simulação)
  return true;
}

/**
 * Adiciona localização à foto (EXIF)
 */
export async function addLocationToPhoto(
  photoBlob: Blob,
  _latitude: number,
  _longitude: number,
): Promise<Blob> {
  // Em produção, isso seria feito com biblioteca de manipulação de EXIF
  // Por enquanto, retorna o blob original
  return photoBlob;
}

/**
 * Gera hash único para a foto
 */
export function generatePhotoHash(photoBlob: Blob, timestamp: string): string {
  const data = `${photoBlob.size}-${timestamp}-${photoBlob.type}`;
  return btoa(data).replace(/[^a-zA-Z0-9]/g, "");
}

/**
 * Limpa URLs de objetos criados
 */
export function cleanupPhotoUrl(photoUrl: string): void {
  URL.revokeObjectURL(photoUrl);
} 