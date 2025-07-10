"use client";
import { LocationPicker } from "@/components/map/location-picker";

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;

export default function TesteMapaPage() {
  console.log("Chave da API no teste:", GOOGLE_MAPS_API_KEY);
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-xl">
        <LocationPicker apiKey={GOOGLE_MAPS_API_KEY} onLocationSelect={(location) => {
          console.log("Localização selecionada:", location);
        }} />
      </div>
    </div>
  );
} 