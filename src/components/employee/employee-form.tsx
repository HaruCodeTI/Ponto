"use client";

import { useForm, SubmitHandler } from "react-hook-form";
import { Employee } from "@/types/employee";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import * as React from "react";
import { isValidCPF } from "@/lib/utils";

interface EmployeeFormProps {
  onSubmit?: (data: Employee) => void;
  initialValues?: Partial<Employee>;
}

export function EmployeeForm({ onSubmit, initialValues }: EmployeeFormProps) {
  const form = useForm<Employee>({
    defaultValues: {
      cpf: initialValues?.cpf || "",
      position: initialValues?.position || "",
      salary: initialValues?.salary || 0,
      workSchedule: initialValues?.workSchedule || "PRESENCIAL",
      toleranceMinutes: initialValues?.toleranceMinutes || 15,
      bankHours: initialValues?.bankHours || 0,
      userId: initialValues?.userId || "",
      companyId: initialValues?.companyId || "",
      id: initialValues?.id || "",
      createdAt: initialValues?.createdAt || new Date().toISOString(),
      updatedAt: initialValues?.updatedAt || new Date().toISOString(),
    },
  });

  const handleSubmit: SubmitHandler<Employee> = (data) => {
    if (onSubmit) onSubmit(data);
  };

  const DIAS_SEMANA = [
    "Segunda-feira",
    "Terça-feira",
    "Quarta-feira",
    "Quinta-feira",
    "Sexta-feira",
    "Sábado",
    "Domingo",
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="grid gap-6 max-w-xl mx-auto w-full">
        <FormField
          control={form.control}
          name="cpf"
          rules={{
            required: "CPF é obrigatório",
            validate: (value) => isValidCPF(value) || "CPF inválido",
          }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>CPF</FormLabel>
              <FormControl>
                <Input placeholder="000.000.000-00" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="position"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cargo</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Analista" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="salary"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Salário</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" min={0} placeholder="0,00" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="workSchedule"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Jornada de Trabalho</FormLabel>
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
          name="toleranceMinutes"
          rules={{
            required: "Tolerância é obrigatória",
            min: { value: 0, message: "Valor mínimo é 0" },
            max: { value: 60, message: "Valor máximo é 60" },
          }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tolerância de Atraso (min)</FormLabel>
              <FormControl>
                <Input type="number" min={0} max={60} placeholder="15" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="bankHours"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Banco de Horas</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" min={0} placeholder="0" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Jornada semanal */}
        <FormField
          control={form.control}
          name="weeklySchedule"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Jornada Semanal</FormLabel>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {DIAS_SEMANA.map((dia) => (
                  <div key={dia} className="flex items-center gap-2">
                    <span className="w-28 text-xs text-muted-foreground">{dia}</span>
                    <Input
                      type="text"
                      placeholder="08:00-17:00"
                      value={field.value?.[dia] || ""}
                      onChange={(e) => {
                        field.onChange({
                          ...field.value,
                          [dia]: e.target.value,
                        });
                      }}
                    />
                  </div>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Regra de trabalho */}
        <FormField
          control={form.control}
          name="workRule"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Regra de Trabalho</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CLT">CLT</SelectItem>
                    <SelectItem value="PJ">PJ</SelectItem>
                    <SelectItem value="ESTAGIO">Estágio</SelectItem>
                    <SelectItem value="OUTRO">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Campos userId e companyId podem ser escondidos ou selecionados em contexto real */}
        <Button type="submit" className="w-full">Cadastrar Funcionário</Button>
      </form>
    </Form>
  );
} 