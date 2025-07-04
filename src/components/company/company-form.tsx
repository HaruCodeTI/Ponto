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

  const handleSubmit: SubmitHandler<Company> = (data) => {
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
          render={({ field }) => (
            <FormItem>
              <FormLabel>Endereço</FormLabel>
              <FormControl>
                <Textarea placeholder="Rua, número, bairro, cidade, UF" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
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
                  <Input type="number" step="any" placeholder="Latitude" {...field} />
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
                  <Input type="number" step="any" placeholder="Longitude" {...field} />
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
        <Button type="submit" className="w-full">Cadastrar Empresa</Button>
      </form>
    </Form>
  );
} 