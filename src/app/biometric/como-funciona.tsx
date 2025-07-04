import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { 
  Fingerprint, 
  User, 
  Shield, 
  Clock, 
  Smartphone, 
  Monitor, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Info,
  Lock,
  Zap,
  ShieldCheck
} from "lucide-react";
import Link from "next/link";

export default function BiometricInfoPage() {
  const biometricMethods = [
    {
      id: 'fingerprint',
      name: 'Digital',
      icon: Fingerprint,
      description: 'Reconhecimento de impressão digital',
      supported: ['Mobile', 'Desktop'],
      security: 'Alta',
      speed: 'Rápida'
    },
    {
      id: 'face',
      name: 'Face ID',
      icon: User,
      description: 'Reconhecimento facial',
      supported: ['Mobile', 'Desktop'],
      security: 'Alta',
      speed: 'Muito rápida'
    },
    {
      id: 'webauthn',
      name: 'WebAuthn',
      icon: Shield,
      description: 'Padrão web para autenticação',
      supported: ['Desktop', 'Mobile'],
      security: 'Muito alta',
      speed: 'Média'
    },
    {
      id: 'pin',
      name: 'PIN',
      icon: Clock,
      description: 'Código numérico de segurança',
      supported: ['Mobile', 'Desktop'],
      security: 'Média',
      speed: 'Rápida'
    }
  ];

  const benefits = [
    {
      icon: Lock,
      title: "Segurança Avançada",
      description: "Proteção baseada em características únicas do usuário"
    },
    {
      icon: Zap,
      title: "Acesso Rápido",
      description: "Autenticação em segundos sem necessidade de senhas"
    },
    {
      icon: ShieldCheck,
      title: "Anti-Fraude",
      description: "Dificulta tentativas de falsificação e roubo de identidade"
    },
    {
      icon: Smartphone,
      title: "Multi-Dispositivo",
      description: "Funciona em smartphones, tablets e computadores"
    }
  ];

  const compatibility = [
    {
      device: "Smartphones",
      fingerprint: true,
      face: true,
      webauthn: true,
      pin: true
    },
    {
      device: "Tablets",
      fingerprint: true,
      face: true,
      webauthn: true,
      pin: true
    },
    {
      device: "Laptops",
      fingerprint: false,
      face: true,
      webauthn: true,
      pin: true
    },
    {
      device: "Desktops",
      fingerprint: false,
      face: false,
      webauthn: true,
      pin: true
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4 flex items-center justify-center">
          <Fingerprint className="h-8 w-8 mr-3 text-blue-600" />
          Autenticação Biométrica
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Sistema de autenticação avançado que utiliza características únicas do usuário 
          para garantir segurança e praticidade no controle de ponto.
        </p>
      </div>

      {/* Métodos de Autenticação */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 flex items-center">
          <Shield className="h-6 w-6 mr-2 text-blue-600" />
          Métodos Disponíveis
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {biometricMethods.map((method) => (
            <Card key={method.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <method.icon className="h-5 w-5 mr-2 text-blue-600" />
                  {method.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-gray-600">{method.description}</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-xs">
                    Segurança: {method.security}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Velocidade: {method.speed}
                  </Badge>
                </div>
                <div className="text-sm text-gray-500">
                  <span className="font-medium">Suportado em:</span> {method.supported.join(', ')}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Benefícios */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 flex items-center">
          <CheckCircle className="h-6 w-6 mr-2 text-green-600" />
          Benefícios
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {benefits.map((benefit, index) => (
            <Card key={index} className="border-l-4 border-l-blue-500">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-3">
                  <benefit.icon className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-2">{benefit.title}</h3>
                    <p className="text-gray-600 text-sm">{benefit.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Compatibilidade */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 flex items-center">
          <Monitor className="h-6 w-6 mr-2 text-purple-600" />
          Compatibilidade
        </h2>
        <Card>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold">Dispositivo</th>
                    <th className="text-center py-3 px-4 font-semibold">Digital</th>
                    <th className="text-center py-3 px-4 font-semibold">Face ID</th>
                    <th className="text-center py-3 px-4 font-semibold">WebAuthn</th>
                    <th className="text-center py-3 px-4 font-semibold">PIN</th>
                  </tr>
                </thead>
                <tbody>
                  {compatibility.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-3 px-4 font-medium">{item.device}</td>
                      <td className="py-3 px-4 text-center">
                        {item.fingerprint ? (
                          <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500 mx-auto" />
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {item.face ? (
                          <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500 mx-auto" />
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {item.webauthn ? (
                          <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500 mx-auto" />
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {item.pin ? (
                          <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500 mx-auto" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Informações Técnicas */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 flex items-center">
          <Info className="h-6 w-6 mr-2 text-orange-600" />
          Informações Técnicas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Segurança</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-green-500" />
                <span className="text-sm">Criptografia de ponta a ponta</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-green-500" />
                <span className="text-sm">Armazenamento seguro local</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-green-500" />
                <span className="text-sm">Proteção contra ataques de força bruta</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-green-500" />
                <span className="text-sm">Validação de integridade</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Privacidade</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2">
                <Lock className="h-4 w-4 text-blue-500" />
                <span className="text-sm">Dados biométricos não saem do dispositivo</span>
              </div>
              <div className="flex items-center space-x-2">
                <Lock className="h-4 w-4 text-blue-500" />
                <span className="text-sm">Conformidade com LGPD</span>
              </div>
              <div className="flex items-center space-x-2">
                <Lock className="h-4 w-4 text-blue-500" />
                <span className="text-sm">Auditoria completa de acesso</span>
              </div>
              <div className="flex items-center space-x-2">
                <Lock className="h-4 w-4 text-blue-500" />
                <span className="text-sm">Controle total do usuário</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Avisos Importantes */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 flex items-center">
          <AlertTriangle className="h-6 w-6 mr-2 text-yellow-600" />
          Avisos Importantes
        </h2>
        <div className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <div className="ml-3">
              <h3 className="font-semibold">Configuração Necessária</h3>
              <p className="text-sm text-gray-600 mt-1">
                A autenticação biométrica deve ser configurada previamente no dispositivo 
                do usuário para funcionar corretamente.
              </p>
            </div>
          </Alert>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <div className="ml-3">
              <h3 className="font-semibold">Dispositivo Pessoal</h3>
              <p className="text-sm text-gray-600 mt-1">
                Por questões de segurança, a autenticação biométrica só funciona 
                no dispositivo pessoal do usuário.
              </p>
            </div>
          </Alert>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <div className="ml-3">
              <h3 className="font-semibold">Backup de Acesso</h3>
              <p className="text-sm text-gray-600 mt-1">
                Mantenha sempre um método alternativo de acesso (senha, PIN) 
                caso a biometria não esteja disponível.
              </p>
            </div>
          </Alert>
        </div>
      </section>

      {/* Call to Action */}
      <section className="text-center">
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="pt-8 pb-8">
            <h2 className="text-2xl font-bold mb-4">Experimente Agora</h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Teste a autenticação biométrica em seu dispositivo e veja como é 
              simples e seguro bater o ponto.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
                <Link href="/biometric">
                  Testar Biometria
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/bater-ponto">
                  Voltar ao Ponto
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
} 