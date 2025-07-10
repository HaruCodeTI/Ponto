"use client";

import { useForm, SubmitHandler } from "react-hook-form";
import { Company } from "@/types/company";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import * as React from "react";
import { isValidCNPJ } from "@/lib/utils";
import { LocationPicker } from "@/components/map/location-picker";

interface CompanyFormProps {
  onSubmit?: (data: Company) => void;
  initialValues?: Partial<Company>;
}

const UF_LIST = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'
];

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;

export function CompanyForm({ onSubmit, initialValues }: CompanyFormProps) {
  const form = useForm<Company>({
    defaultValues: {
      name: initialValues?.name || "",
      cnpj: initialValues?.cnpj || "",
      address: initialValues?.address || "",
      latitude: initialValues?.latitude,
      longitude: initialValues?.longitude,
      operationType: initialValues?.operationType || "PRESENCIAL",
      employeeCount: initialValues?.employeeCount || 0,
      plan: initialValues?.plan || "BASIC",
      createdAt: initialValues?.createdAt || new Date().toISOString(),
      updatedAt: initialValues?.updatedAt || new Date().toISOString(),
      id: initialValues?.id || "",
    },
  });

  const [street, setStreet] = React.useState("");
  const [number, setNumber] = React.useState("");
  const [neighborhood, setNeighborhood] = React.useState("");
  const [city, setCity] = React.useState("");
  const [uf, setUf] = React.useState("");

  React.useEffect(() => {
    if (initialValues?.address) {
      const parts = initialValues.address.split(",");
      setStreet(parts[0]?.trim() || "");
      setNumber(parts[1]?.trim() || "");
      setNeighborhood(parts[2]?.trim() || "");
      setCity(parts[3]?.trim() || "");
      setUf(parts[4]?.trim() || "");
    }
  }, [initialValues?.address]);

  // Sincronizar campos de endereço com RHF
  React.useEffect(() => {
    const address = `${street}, ${number}, ${neighborhood}, ${city}, ${uf}`;
    form.setValue('address', address);
  }, [street, number, neighborhood, city, uf]);

  // Buscar lat/lng automaticamente ao preencher endereço
  React.useEffect(() => {
    const fetchLatLng = async () => {
      if (isEnderecoCompleto) {
        const addressStr = `${street}, ${number}, ${neighborhood}, ${city}, ${uf}, Brasil`;
        try {
          const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(addressStr)}&key=${GOOGLE_MAPS_API_KEY}`);
          const data = await res.json();
          if (data.status === 'OK' && data.results[0]) {
            const location = data.results[0].geometry.location;
            form.setValue('latitude', location.lat);
            form.setValue('longitude', location.lng);
          }
        } catch {
          // nada a fazer
        }
      }
    };
    fetchLatLng();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [street, number, neighborhood, city, uf]);

  const isEnderecoCompleto = street && number && neighborhood && city && uf;

  const handleSubmit: SubmitHandler<Company> = (data) => {
    data.address = `${street}, ${number}, ${neighborhood}, ${city}, ${uf}`;
    if (onSubmit) onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="grid gap-6 max-w-xl mx-auto w-full">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da Empresa</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Acme Ltda" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="cnpj"
          rules={{
            required: "CNPJ é obrigatório",
            validate: (value) => isValidCNPJ(value) || "CNPJ inválido",
          }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>CNPJ</FormLabel>
              <FormControl>
                <Input placeholder="00.000.000/0000-00" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="address"
          render={() => (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
              <div className="md:col-span-2">
                <FormLabel>Rua</FormLabel>
                <Input placeholder="Rua" value={street ?? ""} onChange={e => setStreet(e.target.value)} />
              </div>
              <div>
                <FormLabel>Número</FormLabel>
                <Input placeholder="Número" value={number ?? ""} onChange={e => setNumber(e.target.value)} />
              </div>
              <div>
                <FormLabel>Bairro</FormLabel>
                <Input placeholder="Bairro" value={neighborhood ?? ""} onChange={e => setNeighborhood(e.target.value)} />
              </div>
              <div>
                <FormLabel>Cidade</FormLabel>
                <Input placeholder="Cidade" value={city ?? ""} onChange={e => setCity(e.target.value)} />
              </div>
              <div>
                <FormLabel>UF</FormLabel>
                <select className="w-full border rounded h-10 px-2" value={uf ?? ""} onChange={e => setUf(e.target.value)}>
                  <option value="">UF</option>
                  {UF_LIST.map(ufOpt => (
                    <option key={ufOpt} value={ufOpt}>{ufOpt}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="latitude"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Latitude</FormLabel>
                <FormControl>
                  <Input type="number" step="any" placeholder="Latitude" value={field.value !== undefined ? field.value : ""} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="longitude"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Longitude</FormLabel>
                <FormControl>
                  <Input type="number" step="any" placeholder="Longitude" value={field.value !== undefined ? field.value : ""} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="mb-4">
          <LocationPicker
            apiKey={GOOGLE_MAPS_API_KEY}
            initialLocation={form.getValues("latitude") && form.getValues("longitude") ? { latitude: Number(form.getValues("latitude")), longitude: Number(form.getValues("longitude")) } : undefined}
            onLocationSelect={(location) => {
              form.setValue("latitude", location.latitude);
              form.setValue("longitude", location.longitude);
            }}
          />
        </div>
        <FormField
          control={form.control}
          name="operationType"
          rules={{ required: "Selecione o tipo de operação" }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Operação</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRESENCIAL">Presencial</SelectItem>
                    <SelectItem value="HOME_OFFICE">Home Office</SelectItem>
                    <SelectItem value="HYBRID">Híbrido</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="employeeCount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nº de Funcionários</FormLabel>
              <FormControl>
                <Input type="number" min={0} placeholder="0" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="plan"
          rules={{ required: "Selecione o plano" }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Plano</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BASIC">Básico</SelectItem>
                    <SelectItem value="PROFESSIONAL">Profissional</SelectItem>
                    <SelectItem value="PREMIUM">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting || !form.formState.isDirty}>
          Salvar Alterações
        </Button>
      </form>
    </Form>
  );
} 