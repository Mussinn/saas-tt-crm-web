import { NextRequest, NextResponse } from 'next/server';

import {
    AUTH_TOKEN_COOKIE,
    AUTH_USER_COOKIE,
    clearAuthCookies,
    decodeAuthSession,
    getJwtPayload,
    isJwtExpired,
} from '@/src/lib/serverAuthCookies';

export const dynamic = 'force-dynamic';

function unauthorized(reason?: 'legacy_session') {
    const response = NextResponse.json(
        { message: 'Unauthorized', ...(reason ? { reason } : {}) },
        { status: 401 },
    );
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
    const payload = getJwtPayload(token);

    if (!session || !payload) {
        return unauthorized('legacy_session');
    }

    // Never reuse metadata from a prior token after the backend rotates it.
    if (
        session.id !== payload.sub ||
        session.organizationId !== payload.organizationId ||
        session.expiration !== payload.exp
    ) {
        return unauthorized('legacy_session');
    }

    return NextResponse.json(session);
}
