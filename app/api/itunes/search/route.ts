import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const term = searchParams.get('term');
  const country = searchParams.get('country') || 'in';
  const entity = searchParams.get('entity') || 'song';
  const limit = searchParams.get('limit') || '15';

  if (!term) {
    return NextResponse.json({ error: 'term is required' }, { status: 400 });
  }

  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&country=${encodeURIComponent(country)}&entity=${encodeURIComponent(entity)}&limit=${encodeURIComponent(limit)}`;

  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json({ results: [] }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('iTunes proxy error:', error);
    return NextResponse.json({ results: [] }, { status: 502 });
  }
}
