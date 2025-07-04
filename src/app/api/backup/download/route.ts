import { NextRequest, NextResponse } from "next/server";
import { getBackupPath } from "@/lib/backup";
import fs from "fs";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get("fileName");
    
    if (!fileName) {
      return NextResponse.json(
        { success: false, error: "Nome do arquivo é obrigatório" },
        { status: 400 }
      );
    }
    
    const filePath = getBackupPath(fileName);
    
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { success: false, error: "Arquivo não encontrado" },
        { status: 404 }
      );
    }
    
    const fileBuffer = fs.readFileSync(filePath);
    
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": fileBuffer.length.toString(),
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Erro ao baixar arquivo" },
      { status: 500 }
    );
  }
} 