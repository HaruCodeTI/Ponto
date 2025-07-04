import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyId, employeeId, startDate, endDate } = body;

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: "ID da empresa é obrigatório" },
        { status: 400 }
      );
    }

    if (!employeeId) {
      return NextResponse.json(
        { success: false, error: "ID do funcionário é obrigatório" },
        { status: 400 }
      );
    }

    // Verificar se o funcionário pertence à empresa
    const employee = await prisma.employee.findFirst({
      where: {
        id: employeeId,
        companyId: companyId,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!employee) {
      return NextResponse.json(
        { success: false, error: "Funcionário não encontrado" },
        { status: 404 }
      );
    }

    let whereClause: any = {
      employeeId: employeeId,
      location: {
        not: null,
      },
    };

    // Filtro por período
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setDate(end.getDate() + 1); // Incluir o dia final

      whereClause.createdAt = {
        gte: start,
        lt: end,
      };
    } else {
      // Se nenhum período foi fornecido, usar os últimos 30 dias
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      whereClause.createdAt = {
        gte: thirtyDaysAgo,
      };
    }

    // Buscar registros de ponto com localização
    const timeRecords = await prisma.timeRecord.findMany({
      where: whereClause,
      orderBy: {
        createdAt: "asc",
      },
    });

    // Processar localizações
    const locationHistory = processLocationHistory(timeRecords, employee);

    // Calcular estatísticas
    const statistics = calculateLocationStatistics(locationHistory);

    // Determinar período do relatório
    const reportPeriod = startDate && endDate
      ? `${new Date(startDate).toLocaleDateString("pt-BR")} a ${new Date(endDate).toLocaleDateString("pt-BR")}`
      : "Últimos 30 dias";

    const response = {
      success: true,
      data: {
        employee: {
          id: employee.id,
          name: employee.user.name,
          email: employee.user.email,
          position: employee.position,
          workSchedule: employee.workSchedule,
        },
        period: {
          startDate: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate: endDate || new Date().toISOString().split('T')[0],
          reportPeriod,
        },
        locationHistory,
        statistics,
        summary: {
          totalRecords: timeRecords.length,
          totalLocations: locationHistory.locations.length,
          totalDays: statistics.totalDays,
          averageRecordsPerDay: statistics.averageRecordsPerDay,
          mostFrequentLocation: statistics.mostFrequentLocation,
          totalDistance: statistics.totalDistance,
          averageDistancePerDay: statistics.averageDistancePerDay,
        },
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Erro ao gerar relatório de localizações:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

function processLocationHistory(timeRecords: any[], _employee: any) {
  const locationMap = new Map();
  const dailyMap = new Map();

  timeRecords.forEach(record => {
    if (!record.location) return;

    const date = new Date(record.createdAt);
    const dateKey = date.toISOString().split('T')[0];
    const locationKey = `${record.location.latitude},${record.location.longitude}`;

    // Agrupar por localização
    if (!locationMap.has(locationKey)) {
      locationMap.set(locationKey, {
        latitude: record.location.latitude,
        longitude: record.location.longitude,
        address: record.location.address || "Endereço não disponível",
        records: [],
        totalVisits: 0,
        firstVisit: record.createdAt,
        lastVisit: record.createdAt,
        averageTimeSpent: 0,
        totalTimeSpent: 0,
      });
    }

    const locationData = locationMap.get(locationKey);
    locationData.records.push({
      id: record.id,
      type: record.type,
      timestamp: record.createdAt,
      date: dateKey,
      time: date.toLocaleTimeString("pt-BR", { 
        hour: "2-digit", 
        minute: "2-digit" 
      }),
      device: record.device,
      ipAddress: record.ipAddress,
    });
    locationData.totalVisits++;
    locationData.lastVisit = record.createdAt;

    // Agrupar por dia
    if (!dailyMap.has(dateKey)) {
      dailyMap.set(dateKey, {
        date: dateKey,
        dateFormatted: date.toLocaleDateString("pt-BR"),
        dayOfWeek: date.toLocaleDateString("pt-BR", { weekday: "long" }),
        locations: [],
        totalRecords: 0,
        uniqueLocations: 0,
        totalDistance: 0,
      });
    }

    const dayData = dailyMap.get(dateKey);
    dayData.totalRecords++;
    
    if (!dayData.locations.includes(locationKey)) {
      dayData.locations.push(locationKey);
      dayData.uniqueLocations = dayData.locations.length;
    }
  });

  // Calcular tempo gasto em cada localização
  const locationHistory = Array.from(locationMap.values()).map(location => {
    const sortedRecords = location.records.sort((a: any, b: any) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    let totalTimeSpent = 0;
    for (let i = 0; i < sortedRecords.length - 1; i++) {
      const current = new Date(sortedRecords[i].timestamp);
      const next = new Date(sortedRecords[i + 1].timestamp);
      const timeDiff = Math.floor((next.getTime() - current.getTime()) / (1000 * 60)); // em minutos
      
      // Considerar apenas se a diferença for menor que 4 horas (para evitar viagens)
      if (timeDiff < 240) {
        totalTimeSpent += timeDiff;
      }
    }

    const averageTimeSpent = location.totalVisits > 1 
      ? Math.round(totalTimeSpent / (location.totalVisits - 1))
      : 0;

    return {
      ...location,
      totalTimeSpent,
      averageTimeSpent,
      totalTimeSpentFormatted: formatMinutes(totalTimeSpent),
      averageTimeSpentFormatted: formatMinutes(averageTimeSpent),
      records: location.records.sort((a: any, b: any) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ),
    };
  });

  // Calcular distâncias entre localizações
  const dailyHistory = Array.from(dailyMap.values()).map(day => {
    let totalDistance = 0;
    const dayLocations = day.locations.map((locKey: string) => {
      const [lat, lng] = locKey.split(',').map(Number);
      return { latitude: lat, longitude: lng };
    });

    for (let i = 0; i < dayLocations.length - 1; i++) {
      const distance = calculateDistance(
        dayLocations[i].latitude,
        dayLocations[i].longitude,
        dayLocations[i + 1].latitude,
        dayLocations[i + 1].longitude
      );
      totalDistance += distance;
    }

    return {
      ...day,
      totalDistance,
      totalDistanceFormatted: formatDistance(totalDistance),
    };
  });

  return {
    locations: locationHistory.sort((a, b) => b.totalVisits - a.totalVisits),
    daily: dailyHistory.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
  };
}

function calculateLocationStatistics(locationHistory: any) {
  const { locations, daily } = locationHistory;

  const totalDays = daily.length;
  const totalRecords = daily.reduce((sum: number, day: any) => sum + day.totalRecords, 0);
  const averageRecordsPerDay = totalDays > 0 ? Math.round(totalRecords / totalDays) : 0;

  const mostFrequentLocation = locations.length > 0 ? locations[0] : null;

  const totalDistance = daily.reduce((sum: number, day: any) => sum + day.totalDistance, 0);
  const averageDistancePerDay = totalDays > 0 ? totalDistance / totalDays : 0;

  return {
    totalDays,
    totalRecords,
    averageRecordsPerDay,
    mostFrequentLocation,
    totalDistance,
    averageDistancePerDay,
    totalDistanceFormatted: formatDistance(totalDistance),
    averageDistancePerDayFormatted: formatDistance(averageDistancePerDay),
  };
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}min`;
}

function formatDistance(distance: number): string {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  }
  return `${distance.toFixed(2)}km`;
} 