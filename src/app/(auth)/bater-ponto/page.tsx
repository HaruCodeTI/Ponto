"use client";
import { Suspense, useState } from "react";
import { LocationValidator } from "@/components/time-record/location-validator";
import { IPValidator } from "@/components/time-record/ip-validator";
import { PhotoCapture } from "@/components/time-record/photo-capture";
import { DeviceValidator } from "@/components/time-record/device-validator";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Location } from "@/lib/geolocation";
import { LocationValidation, DeviceValidation, PhotoCaptureResult, WorkTimeValidation } from "@/types/time-record";
import { DEFAULT_PHOTO_CONFIG } from "@/lib/photo-capture";
import { useRouter } from "next/navigation";
import { NFCReader } from "@/components/nfc/nfc-reader";
import { BiometricAuth } from "@/components/biometric/biometric-auth";
import { WorkTimeValidator } from "@/components/time-record/work-time-validator";
import Link from "next/link";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createTimeRecordAuditLog } from "@/lib/time-record";
import { AuthenticatedLayout } from "@/components/layouts/authenticated-layout";

// Mock: dados da empresa e funcionário (substituir por dados reais do contexto)
const companyLocation: Location = {
  latitude: -23.5505,
  longitude: -46.6333,
};
// Definir tipo para operationType
// const OPERATION_TYPES = ["PRESENCIAL", "HOME_OFFICE", "HYBRID"] as const;
type OperationType = "PRESENCIAL" | "HOME_OFFICE" | "HYBRID";
const operationType: OperationType = "PRESENCIAL";
const isWorkingFromHome = false;
const employeeId = "1";
const companyId = "1";
const userId = "1";

export default function BaterPontoPage() {
  const [locationValidation, setLocationValidation] = useState<LocationValidation | null>(null);
  const [ipValidation, setIPValidation] = useState<DeviceValidation | null>(null);
  const [deviceValidation, setDeviceValidation] = useState<DeviceValidation | null>(null);
  const [photoResult, setPhotoResult] = useState<PhotoCaptureResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [showNFC, setShowNFC] = useState(false);
  const [showBiometric, setShowBiometric] = useState(false);
  const [workTimeValidation, setWorkTimeValidation] = useState<WorkTimeValidation | null>(null);

  const canRegister =
    (operationType === "PRESENCIAL" && locationValidation?.isValid) ||
    (operationType === "HOME_OFFICE" && ipValidation?.isValid) ||
    (operationType === "HYBRID" && (isWorkingFromHome ? ipValidation?.isValid : locationValidation?.isValid)) &&
    workTimeValidation?.isValid &&
    deviceValidation?.isValid;

  // Log de tentativa de registro
  const logAttempt = async (status: 'SUCCESS' | 'FAILED', error?: string) => {
    try {
      await createTimeRecordAuditLog({
        userId,
        employeeId,
        companyId,
        action: 'TIME_RECORD_ATTEMPT',
        status,
        authenticationMethod: 'MANUAL',
        location: undefined,
        timeRecordData: {
          type: 'ENTRY',
          timestamp: new Date().toISOString(),
        },
        validations: {
          location: locationValidation || { isValid: false },
          device: deviceValidation || { isValid: false },
          time: { isValid: true, isWithinWorkHours: true, isWithinTolerance: true },
          isDuplicate: false,
          isValid: status === 'SUCCESS',
          errors: error ? [error] : [],
        },
        details: `Tentativa de registro de ponto ${operationType.toLowerCase()} - ${status}`,
        warnings: photoResult ? ['Foto capturada'] : undefined,
      });
    } catch (err) {
      console.error('Erro ao criar log de auditoria:', err);
    }
  };

  const handleRegister = async () => {
    setLoading(true);
    setError(null);
    try {
      // Log de tentativa
      await logAttempt('SUCCESS');
      // Monta payload para registro de ponto
      const payload = {
        type: "ENTRY",
        userId,
        employeeId,
        companyId,
        latitude: locationValidation?.distance !== undefined ? companyLocation.latitude : undefined,
        longitude: locationValidation?.distance !== undefined ? companyLocation.longitude : undefined,
        deviceInfo: navigator.userAgent,
        ipAddress: undefined,
        photoUrl: photoResult?.photoUrl,
      };
      const res = await fetch("/api/time-record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.status === 409) {
        const data = await res.json();
        setError(data.error || "Registro de ponto duplicado. Aguarde alguns minutos antes de tentar novamente.");
        return;
      }
      if (!res.ok) throw new Error("Erro ao registrar ponto");
      toast.success("Ponto registrado com sucesso!");
      router.push("/funcionarios");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
      setError(errorMessage);
      await logAttempt('FAILED', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthenticatedLayout>
      <main className="container mx-auto py-8 max-w-2xl">
        <h1 className="text-3xl font-bold mb-6 text-center">Bater Ponto</h1>
        <div className="flex justify-center mb-4 gap-2">
          <Dialog open={showNFC} onOpenChange={setShowNFC}>
            <DialogTrigger asChild>
              <Button variant="secondary" type="button">
                Autenticar por NFC
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Leitor de Crachá NFC</DialogTitle>
              </DialogHeader>
              <NFCReader />
            </DialogContent>
          </Dialog>
          <Dialog open={showBiometric} onOpenChange={setShowBiometric}>
            <DialogTrigger asChild>
              <Button variant="secondary" type="button">
                Autenticar por Biometria
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Autenticação Biométrica</DialogTitle>
              </DialogHeader>
              <BiometricAuth employeeId="1" />
            </DialogContent>
          </Dialog>
          <div className="flex flex-col gap-1">
            <Link href="/nfc/como-funciona" className="text-blue-600 underline text-sm flex items-center" target="_blank">
              Como funciona NFC?
            </Link>
            <Link href="/biometric/como-funciona" className="text-blue-600 underline text-sm flex items-center" target="_blank">
              Como funciona Biometria?
            </Link>
          </div>
        </div>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Etapa 1: Validação de Localização</CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<p>Carregando localização...</p>}>
              <LocationValidator
                companyLocation={companyLocation}
                operationType={operationType}
                isWorkingFromHome={isWorkingFromHome}
                onValidationChange={setLocationValidation}
              />
            </Suspense>
          </CardContent>
        </Card>
        {operationType === "HOME_OFFICE" || (operationType === "HYBRID" && isWorkingFromHome) ? (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Etapa 2: Validação por IP</CardTitle>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<p>Validando IP...</p>}>
                <IPValidator homeLocation={companyLocation} onValidationChange={setIPValidation} />
              </Suspense>
            </CardContent>
          </Card>
        ) : null}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Etapa 3: Validação de Horário</CardTitle>
          </CardHeader>
          <CardContent>
            <WorkTimeValidator
              recordType="ENTRY"
              employeeId={employeeId}
              onValidation={setWorkTimeValidation}
              showDetails={false}
            />
          </CardContent>
        </Card>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Etapa 4: Validação de Dispositivo</CardTitle>
          </CardHeader>
          <CardContent>
            <DeviceValidator onValidationChange={setDeviceValidation} />
          </CardContent>
        </Card>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Etapa 5: Captura de Foto (Opcional)</CardTitle>
          </CardHeader>
          <CardContent>
            <PhotoCapture config={DEFAULT_PHOTO_CONFIG} onPhotoCapture={setPhotoResult} />
          </CardContent>
        </Card>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Button
          onClick={handleRegister}
          disabled={!canRegister || loading}
          className="w-full mt-4"
          size="lg"
        >
          {loading ? "Registrando..." : "Bater Ponto"}
        </Button>
      </main>
    </AuthenticatedLayout>
  );
} 