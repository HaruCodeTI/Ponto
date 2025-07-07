"use client";
import { Suspense, useState } from "react";
import { LocationValidator } from "@/components/time-record/location-validator";
import { IPValidator } from "@/components/time-record/ip-validator";
import { PhotoCapture } from "@/components/time-record/photo-capture";
import { DeviceValidator } from "@/components/time-record/device-validator";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Location } from "@/lib/geolocation";
import { LocationValidation, DeviceValidation, PhotoCaptureResult, WorkTimeValidation } from "@/types/time-record";
import { DEFAULT_PHOTO_CONFIG } from "@/lib/photo-capture";
import { useRouter } from "next/navigation";
import { Clock, MapPin, Wifi, Camera, CheckCircle, XCircle, Smartphone } from "lucide-react";
import { NFCReader } from "@/components/nfc/nfc-reader";
import { BiometricAuth } from "@/components/biometric/biometric-auth";
import { WorkTimeValidator } from "@/components/time-record/work-time-validator";
import Link from "next/link";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

// Mock: dados da empresa e funcionário (substituir por dados reais do contexto)
const companyLocation: Location = {
  latitude: -23.5505,
  longitude: -46.6333,
};

type OperationType = "PRESENCIAL" | "HOME_OFFICE" | "HYBRID";
const operationType: OperationType = "PRESENCIAL";
const isWorkingFromHome = false;
const employeeId = "1";
const companyId = "1";

export default function BaterPontoMobilePage() {
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

  const handleRegister = async () => {
    setLoading(true);
    setError(null);
    try {
      // Monta payload para registro de ponto
      const payload = {
        type: "ENTRY",
        userId: "1",
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
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  const getStepStatus = (step: number) => {
    if (step === 1) return locationValidation?.isValid ? "completed" : "current";
    if (step === 2) {
      if (operationType === "HOME_OFFICE" || (operationType === "HYBRID" && isWorkingFromHome)) {
        return ipValidation?.isValid ? "completed" : "current";
      }
      return "skipped";
    }
    if (step === 3) return photoResult?.success ? "completed" : "current";
    return "pending";
  };

  const getStepIcon = (step: number) => {
    const status = getStepStatus(step);
    if (status === "completed") return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (status === "current") return <Clock className="h-5 w-5 text-blue-500" />;
    if (status === "skipped") return <XCircle className="h-5 w-5 text-gray-400" />;
    return <Clock className="h-5 w-5 text-gray-400" />;
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
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
      {/* Header */}
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Bater Ponto</h1>
        <p className="text-gray-600">Registre sua entrada ou saída</p>
        <div className="mt-4 flex justify-center space-x-2">
          <Badge variant="outline" className="text-sm">
            <MapPin className="h-3 w-3 mr-1" />
            {operationType === "PRESENCIAL" ? "Presencial" : 
             operationType === "HOME_OFFICE" ? "Home Office" : "Híbrido"}
          </Badge>
          <Badge variant="outline" className="text-sm">
            <Clock className="h-3 w-3 mr-1" />
            {new Date().toLocaleTimeString('pt-BR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </Badge>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getStepIcon(1)}
            <span className={`text-sm font-medium ${
              getStepStatus(1) === "completed" ? "text-green-600" :
              getStepStatus(1) === "current" ? "text-blue-600" : "text-gray-500"
            }`}>
              Localização
            </span>
          </div>
          <div className="flex-1 h-px bg-gray-300 mx-4"></div>
          <div className="flex items-center space-x-2">
            {getStepIcon(2)}
            <span className={`text-sm font-medium ${
              getStepStatus(2) === "completed" ? "text-green-600" :
              getStepStatus(2) === "current" ? "text-blue-600" : "text-gray-500"
            }`}>
              IP
            </span>
          </div>
          <div className="flex-1 h-px bg-gray-300 mx-4"></div>
          <div className="flex items-center space-x-2">
            {getStepIcon(3)}
            <span className={`text-sm font-medium ${
              getStepStatus(3) === "completed" ? "text-green-600" :
              getStepStatus(3) === "current" ? "text-blue-600" : "text-gray-500"
            }`}>
              Foto
            </span>
          </div>
        </div>
      </div>

      {/* Step 1: Location Validation */}
      <Card className="mb-4 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-lg">
            <MapPin className="h-5 w-5 mr-2 text-blue-600" />
            Validação de Localização
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Carregando localização...</span>
            </div>
          }>
            <LocationValidator
              companyLocation={companyLocation}
              operationType={operationType}
              isWorkingFromHome={isWorkingFromHome}
              onValidationChange={setLocationValidation}
            />
          </Suspense>
        </CardContent>
      </Card>

      {/* Step 2: IP Validation (conditional) */}
      {(operationType === "HOME_OFFICE" || (operationType === "HYBRID" && isWorkingFromHome)) && (
        <Card className="mb-4 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg">
              <Wifi className="h-5 w-5 mr-2 text-green-600" />
              Validação por IP
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense fallback={
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                <span className="ml-2 text-gray-600">Validando IP...</span>
              </div>
            }>
              <IPValidator homeLocation={companyLocation} onValidationChange={setIPValidation} />
            </Suspense>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Work Time Validation */}
      <Card className="mb-4 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-lg">
            <Clock className="h-5 w-5 mr-2 text-orange-600" />
            Validação de Horário
          </CardTitle>
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

      {/* Step 4: Device Validation */}
      <Card className="mb-4 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-lg">
            <Smartphone className="h-5 w-5 mr-2 text-indigo-600" />
            Validação de Dispositivo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DeviceValidator onValidationChange={setDeviceValidation} />
        </CardContent>
      </Card>

      {/* Step 5: Photo Capture */}
      <Card className="mb-6 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-lg">
            <Camera className="h-5 w-5 mr-2 text-purple-600" />
            Captura de Foto (Opcional)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PhotoCapture config={DEFAULT_PHOTO_CONFIG} onPhotoCapture={setPhotoResult} />
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Action Button */}
      <div className="sticky bottom-4">
        <Button
          onClick={handleRegister}
          disabled={!canRegister || loading}
          className="w-full h-14 text-lg font-semibold shadow-lg"
          size="lg"
        >
          {loading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Registrando...
            </div>
          ) : (
            "Bater Ponto"
          )}
        </Button>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <Button variant="outline" className="h-12" onClick={() => router.push("/funcionarios")}>
          Histórico
        </Button>
        <Button variant="outline" className="h-12" onClick={() => router.push("/")}>
          Voltar
        </Button>
      </div>
    </main>
  );
} 