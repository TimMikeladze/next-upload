import { NextRequest, NextResponse } from 'next/server';
import { nup } from '../upload/nup';

export const GET = async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  if (
    !process.env.CRON_KEY ||
    searchParams.get('key') !== process.env.CRON_KEY
  ) {
    return NextResponse.json(
      {
        error: 'Unauthorized',
      },
      { status: 401 }
    );
  }
  await nup.pruneAssets();
  return NextResponse.json({ success: true });
};

export const dynamic = 'force-dynamic';
