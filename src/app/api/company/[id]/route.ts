import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;
    const id = pathname.split('/').pop();
    if (!id) return NextResponse.json({ error: 'ID não informado' }, { status: 400 });

    const steps = [
      { name: 'Desvincular usuários', fn: () => prisma.user.updateMany({ where: { companyId: id }, data: { companyId: null } }) },
      { name: 'Remover funcionários', fn: () => prisma.employee.deleteMany({ where: { companyId: id } }) },
      { name: 'Remover registros de ponto', fn: () => prisma.timeRecord.deleteMany({ where: { companyId: id } }) },
      { name: 'Remover pagamentos', fn: () => prisma.payment.deleteMany({ where: { companyId: id } }) },
      { name: 'Remover agendamentos de relatório', fn: () => prisma.reportSchedule.deleteMany({ where: { companyId: id } }) },
      { name: 'Remover configs de relatório', fn: () => prisma.reportFormatConfig.deleteMany({ where: { companyId: id } }) },
      { name: 'Remover advanced schedules', fn: () => prisma.advancedReportSchedule.deleteMany({ where: { companyId: id } }) },
      { name: 'Remover assinaturas', fn: () => prisma.subscription.deleteMany({ where: { companyId: id } }) },
      { name: 'Remover notificações', fn: () => prisma.notification.deleteMany({ where: { companyId: id } }) },
      { name: 'Remover notification preferences', fn: () => prisma.notificationPreference.deleteMany({ where: { companyId: id } }) },
      // { name: 'Remover recibos', fn: () => prisma.timeRecordReceipt.deleteMany({ where: { companyId: id } }) },
      // { name: 'Remover redundâncias', fn: () => prisma.dataRedundancy.deleteMany({ where: { companyId: id } }) },
      // { name: 'Remover data integrity checks', fn: () => prisma.dataIntegrityCheck.deleteMany({ where: { companyId: id } }) },
      // { name: 'Remover data purges', fn: () => prisma.dataPurge.deleteMany({ where: { companyId: id } }) },
      // { name: 'Remover retention policies', fn: () => prisma.retentionPolicy.deleteMany({ where: { companyId: id } }) },
      // { name: 'Remover restore operations', fn: () => prisma.restoreOperation.deleteMany({ where: { companyId: id } }) },
      // { name: 'Remover AFD exports', fn: () => prisma.aFDExport.deleteMany({ where: { companyId: id } }) },
      // { name: 'Remover generated reports', fn: () => prisma.generatedReport.deleteMany({ where: { companyId: id } }) },
      // { name: 'Remover report templates', fn: () => prisma.reportTemplate.deleteMany({ where: { companyId: id } }) },
      // { name: 'Remover data exports', fn: () => prisma.dataExport.deleteMany({ where: { companyId: id } }) },
      // { name: 'Remover BI integrations', fn: () => prisma.bIIntegration.deleteMany({ where: { companyId: id } }) },
      // { name: 'Remover webhooks', fn: () => prisma.webhook.deleteMany({ where: { companyId: id } }) },
      // { name: 'Remover AI models', fn: () => prisma.aIModel.deleteMany({ where: { companyId: id } }) },
      // { name: 'Remover anomaly detections', fn: () => prisma.anomalyDetection.deleteMany({ where: { companyId: id } }) },
      // { name: 'Remover ML datasets', fn: () => prisma.mLDataset.deleteMany({ where: { companyId: id } }) },
      // { name: 'Remover ML features', fn: () => prisma.mLFeature.deleteMany({ where: { companyId: id } }) },
      // { name: 'Remover ML experiments', fn: () => prisma.mLExperiment.deleteMany({ where: { companyId: id } }) },
      // { name: 'Remover AI insights', fn: () => prisma.aIInsight.deleteMany({ where: { companyId: id } }) },
      // { name: 'Remover AI configs', fn: () => prisma.aIConfig.deleteMany({ where: { companyId: id } }) },
      // { name: 'Remover privacy consents', fn: () => prisma.privacyConsent.deleteMany({ where: { companyId: id } }) },
    ];

    for (const step of steps) {
      try {
        // eslint-disable-next-line no-console
        console.log(`Executando: ${step.name}`);
        await step.fn();
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(`Erro em: ${step.name}`, err);
        return NextResponse.json({ error: `Erro em: ${step.name}`, details: String(err) }, { status: 500 });
      }
    }

    // Por fim, remove a empresa
    try {
      await prisma.company.delete({ where: { id } });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Erro ao deletar empresa', err);
      return NextResponse.json({ error: 'Erro ao deletar empresa', details: String(err) }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Erro inesperado', error);
    return NextResponse.json({ error: 'Erro inesperado', details: String(error) }, { status: 500 });
  }
} 