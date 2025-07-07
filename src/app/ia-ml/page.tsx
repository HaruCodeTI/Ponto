import { Metadata } from 'next';
import { AIDashboard } from '@/components/ai-ml/ai-dashboard';

export const metadata: Metadata = {
  title: 'IA & Machine Learning | Sistema de Ponto',
  description: 'Dashboard avançado de inteligência artificial e machine learning para análise preditiva e detecção de anomalias',
};

export default function IAMLPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">IA & Machine Learning</h1>
          <p className="text-muted-foreground">
            Dashboard inteligente com análise preditiva e detecção de anomalias
          </p>
        </div>
      </div>

      <AIDashboard />
    </div>
  );
} 