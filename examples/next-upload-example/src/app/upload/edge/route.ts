import { NextRequest } from 'next/server';
import { nup } from './nup';

export const POST = (request: NextRequest) => nup.handler(request);

export const dynamic = 'force-dynamic';

export const runtime = 'edge';
