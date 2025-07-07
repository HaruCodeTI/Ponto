import { AdjustmentManager } from "@/components/time-record/adjustment-manager";

export default function AjustesPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Sistema de Justificativas de Ajustes
        </h1>
        <p className="text-gray-600">
          Gerenciamento de ajustes de registro de ponto com compliance legal
        </p>
      </div>

      <div className="space-y-6">
        {/* Informações sobre compliance */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-3">
            Compliance com Portaria 671/2021
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div>
              <h3 className="font-medium mb-2">Registro Original Preservado</h3>
              <ul className="space-y-1">
                <li>• Registro original nunca é modificado</li>
                <li>• Hash criptográfico garante imutabilidade</li>
                <li>• Audit trail completo de todas as mudanças</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-2">Sistema de Justificativas</h3>
              <ul className="space-y-1">
                <li>• Justificativa obrigatória para cada ajuste</li>
                <li>• Evidências documentais quando necessário</li>
                <li>• Aprovação por gestor responsável</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Gerenciador de Ajustes */}
        <AdjustmentManager companyId="1" />
      </div>
    </div>
  );
} 