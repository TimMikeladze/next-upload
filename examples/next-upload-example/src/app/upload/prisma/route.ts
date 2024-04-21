import { NextRequest } from 'next/server';

import { nup } from './nup';

export const POST = (request: NextRequest) => nup.handler(request);

export const dynamic = 'force-dynamic';

// Optionally, if your application supports it you can run next-upload in the Edge runtime.
export const runtime = 'edge';
