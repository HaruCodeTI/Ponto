import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, 
  QrCode, 
  Search, 
  FileText, 
  AlertTriangle,
  CheckCircle,
  XCircle
} from "lucide-react";

export default function VerificacaoPage() {
  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Verificação de Registros</h1>
        <p className="text-gray-600">
          Verifique a autenticidade e integridade dos registros de ponto
        </p>
      </div>

      <Tabs defaultValue="search" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="search" className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            Buscar Registro
          </TabsTrigger>
          <TabsTrigger value="qr" className="flex items-center gap-2">
            <QrCode className="w-4 h-4" />
            QR Code
          </TabsTrigger>
          <TabsTrigger value="batch" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Lote
          </TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Buscar Registro por ID
              </CardTitle>
              <CardDescription>
                Digite o ID do registro para verificar sua autenticidade
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="recordId">ID do Registro</Label>
                <div className="flex gap-2">
                  <Input
                    id="recordId"
                    placeholder="Digite o ID do registro..."
                    className="flex-1"
                  />
                  <Button>
                    <Search className="w-4 h-4 mr-2" />
                    Buscar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="qr" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="w-5 h-5" />
                Verificar via QR Code
              </CardTitle>
              <CardDescription>
                Escaneie ou cole o código QR para verificar um registro
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="qrData">Dados do QR Code</Label>
                <div className="flex gap-2">
                  <Input
                    id="qrData"
                    placeholder="Cole aqui os dados do QR Code..."
                    className="flex-1"
                  />
                  <Button>
                    <Shield className="w-4 h-4 mr-2" />
                    Verificar
                  </Button>
                </div>
              </div>
              
              <div className="text-center py-8">
                <QrCode className="w-24 h-24 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">
                  Posicione a câmera sobre o QR Code ou cole os dados manualmente
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="batch" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Verificação em Lote
              </CardTitle>
              <CardDescription>
                Faça upload de um arquivo CSV com IDs de registros para verificação em massa
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="batchFile">Arquivo CSV</Label>
                <Input
                  id="batchFile"
                  type="file"
                  accept=".csv"
                  className="flex-1"
                />
                <p className="text-xs text-gray-500">
                  O arquivo deve conter uma coluna "record_id" com os IDs dos registros
                </p>
              </div>
              
              <Button className="w-full">
                <Shield className="w-4 h-4 mr-2" />
                Verificar Lote
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Área de Resultados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Resultados da Verificação
          </CardTitle>
          <CardDescription>
            Resultados das verificações realizadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Shield className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p>Nenhuma verificação realizada ainda</p>
            <p className="text-sm">Use uma das opções acima para verificar registros</p>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-gray-600">Registros Válidos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <XCircle className="w-8 h-8 text-red-600" />
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-gray-600">Registros Inválidos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-8 h-8 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-gray-600">Com Avisos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 