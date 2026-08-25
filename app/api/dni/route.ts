import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dni = searchParams.get('numero');

  if (!dni || dni.length !== 8) {
    return NextResponse.json({ error: 'DNI inválido' }, { status: 400 });
  }

  try {
    const res = await fetch(`https://api.apis.net.pe/v1/dni?numero=${dni}`, {
      headers: {
        'Accept': 'application/json',
      }
    });
    
    if (!res.ok) {
      return NextResponse.json({ error: 'No se encontró el DNI' }, { status: 404 });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("DNI Fetch Error:", error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
