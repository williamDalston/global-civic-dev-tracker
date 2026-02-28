import { NextRequest, NextResponse } from 'next/server';
import { safeQuery } from '@/lib/db/safe-query';
import { getCityBySlug } from '@/lib/db/queries/cities';
import { countContractorsInCity } from '@/lib/db/queries/contractors';

export async function GET(request: NextRequest) {
  try {
    const citySlug = request.nextUrl.searchParams.get('city');

    if (!citySlug) {
      return NextResponse.json({ count: 0 });
    }

    const city = await safeQuery(() => getCityBySlug(citySlug));
    if (!city) {
      return NextResponse.json({ count: 0 });
    }

    const count = await safeQuery(() => countContractorsInCity(city.id));

    return NextResponse.json({
      count: count ?? 0,
      city: city.name,
    });
  } catch (error) {
    console.error('[contractor-count] Unexpected error:', error);
    return NextResponse.json({ count: 0 });
  }
}
