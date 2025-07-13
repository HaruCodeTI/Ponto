"use client";

import { LocationPicker } from "@/components/map/location-picker";

export default function TesteMapaPage() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;
  
  console.log("TesteMapaPage: Renderizando");
  console.log("API Key:", apiKey);
  
  if (!apiKey) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4 text-red-500">Erro: API Key não encontrada</h1>
        <p>Verifique se NEXT_PUBLIC_GOOGLE_MAPS_API_KEY está definida no arquivo .env</p>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Teste do Mapa</h1>
      <div className="bg-blue-50 p-4 rounded mb-4">
        <p><strong>API Key:</strong> {apiKey.substring(0, 10)}...</p>
        <p><strong>Status:</strong> Carregando mapa...</p>
      </div>
      <LocationPicker
        apiKey={apiKey}
        onLocationSelect={(location) => {
          console.log("Localização selecionada:", location);
        }}
      />
    </div>
  );
} 