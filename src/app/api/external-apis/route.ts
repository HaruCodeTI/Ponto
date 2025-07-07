import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { 
  createExternalAPI, 
  findExternalAPIs 
} from '@/lib/external-integrations';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      companyId, 
      name, 
      description, 
      provider, 
      apiType, 
      baseUrl, 
      version, 
      config, 
      credentials, 
      syncInterval, 
      metadata 
    } = body;

    if (!companyId || !name || !provider || !apiType || !baseUrl || !version) {
      return NextResponse.json(
        { error: 'companyId, name, provider, apiType, baseUrl e version são obrigatórios' }, 
        { status: 400 }
      );
    }

    const api = await createExternalAPI({
      companyId,
      name,
      description,
      provider,
      apiType,
      baseUrl,
      version,
      config,
      credentials,
      syncInterval,
      metadata
    });

    return NextResponse.json(api, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar API externa:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' }, 
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const provider = searchParams.get('provider');
    const apiType = searchParams.get('apiType');
    const isActive = searchParams.get('isActive');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const filters: any = {};
    if (companyId) filters.companyId = companyId;
    if (provider) filters.provider = provider;
    if (apiType) filters.apiType = apiType;
    if (isActive !== null) filters.isActive = isActive === 'true';

    const result = await findExternalAPIs(filters, page, limit);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Erro ao buscar APIs externas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' }, 
      { status: 500 }
    );
  }
} 