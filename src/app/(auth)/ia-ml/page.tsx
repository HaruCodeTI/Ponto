import { AIDashboard } from '@/components/ai-ml/ai-dashboard';
import { metadata } from './metadata';

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