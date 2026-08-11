import { NextRequest, NextResponse } from 'next/server';

import {
    AUTH_TOKEN_COOKIE,
    AUTH_USER_COOKIE,
    clearAuthCookies,
    decodeAuthSession,
    isJwtExpired,
} from '@/src/lib/serverAuthCookies';

export const dynamic = 'force-dynamic';

function unauthorized() {
    const response = NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    clearAuthCookies(response);

    return response;
}

export async function GET(request: NextRequest) {
    const token = request.cookies.get(AUTH_TOKEN_COOKIE)?.value;
    const encodedSession = request.cookies.get(AUTH_USER_COOKIE)?.value;

    if (!token || !encodedSession || isJwtExpired(token)) {
        return unauthorized();
    }

    const session = decodeAuthSession(encodedSession);

    if (!session) {
        return unauthorized();
    }

    return NextResponse.json(session);
}
