"use client";

import React, { useState, useEffect } from "react";
import { NFCReader } from "@/components/nfc/nfc-reader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CreditCard, User, Building } from "lucide-react";
import { toast } from "sonner";

interface NFCCard {
  id: string;
  cardNumber: string;
  employeeId: string;
  isActive: boolean;
  lastUsed?: Date;
  employee?: {
    user: {
      name: string;
      email: string;
    };
  };
}

export default function NFCPage() {
  const [cards, setCards] = useState<NFCCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState<NFCCard | null>(null);

  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    try {
      const response = await fetch("/api/auth/nfc/cards");
      if (response.ok) {
        const data = await response.json();
        setCards(data.cards || []);
      }
    } catch {
      console.error("Erro ao carregar cartões NFC");
      toast.error("Erro ao carregar cartões NFC");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCardScanned = (cardNumber: string) => {
    const card = cards.find(c => c.cardNumber === cardNumber);
    if (card) {
      setSelectedCard(card);
      toast.success(`Cartão de ${card.employee?.user.name} lido!`);
    }
  };

  const handleScanResult = (result: { success: boolean; error?: string; cardNumber?: string; employeeId?: string; message?: string }) => {
    console.log("Resultado do scan:", result);
  };

  const createTestCard = async () => {
    try {
      const response = await fetch("/api/auth/nfc/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          employeeId: "1", // ID do primeiro funcionário
          cardNumber: undefined // Será gerado automaticamente
        }),
      });

      if (response.ok) {
        toast.success("Cartão NFC de teste criado!");
        loadCards(); // Recarrega a lista
      } else {
        toast.error("Erro ao criar cartão NFC");
      }
    } catch {
      toast.error("Erro ao criar cartão NFC");
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Teste de Autenticação NFC</h1>
        <p className="text-gray-600">
          Teste a funcionalidade de leitura de cartões NFC
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leitor NFC */}
        <div>
          <NFCReader
            onCardScanned={handleCardScanned}
            onScanResult={handleScanResult}
            className="w-full"
          />
        </div>

        {/* Informações do Cartão Selecionado */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Cartão Selecionado
              </CardTitle>
              <CardDescription>
                Informações do último cartão lido
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedCard ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Número:</span>
                    <Badge variant="outline" className="font-mono">
                      {selectedCard.cardNumber}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Status:</span>
                    <Badge variant={selectedCard.isActive ? "default" : "destructive"}>
                      {selectedCard.isActive ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>

                  {selectedCard.employee?.user && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Funcionário:</span>
                        <span className="text-sm flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {selectedCard.employee.user.name}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Email:</span>
                        <span className="text-sm">{selectedCard.employee.user.email}</span>
                      </div>
                    </>
                  )}

                  {selectedCard.lastUsed && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Último uso:</span>
                      <span className="text-sm">
                        {new Date(selectedCard.lastUsed).toLocaleString('pt-BR')}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  Nenhum cartão selecionado
                </p>
              )}
            </CardContent>
          </Card>

          {/* Cartões Disponíveis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                Cartões Disponíveis
              </CardTitle>
              <CardDescription>
                {cards.length} cartão(s) cadastrado(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {cards.length > 0 ? (
                  cards.map((card) => (
                    <div
                      key={card.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedCard?.id === card.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => setSelectedCard(card)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-mono text-sm">{card.cardNumber}</p>
                          {card.employee?.user && (
                            <p className="text-xs text-gray-600">
                              {card.employee.user.name}
                            </p>
                          )}
                        </div>
                        <Badge variant={card.isActive ? "default" : "destructive"}>
                          {card.isActive ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    Nenhum cartão NFC cadastrado
                  </p>
                )}
              </div>

              <Button
                onClick={createTestCard}
                className="w-full mt-4"
                variant="outline"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Criar Cartão de Teste
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 