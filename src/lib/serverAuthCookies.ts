import { NextRequest, NextResponse } from 'next/server';

import type { AuthSession, JwtPayload, LoginResponse } from '@/src/types/auth.types';

export const AUTH_TOKEN_COOKIE = 'teethTechJwt';
export const AUTH_USER_COOKIE = 'teethTechUser';

const DEFAULT_SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;
const MAX_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export function isSecureRequest(request: NextRequest) {
    const forwardedProto = request.headers
        .get('x-forwarded-proto')
        ?.split(',', 1)[0]
        .trim()
        .toLowerCase();

    return forwardedProto
        ? forwardedProto === 'https'
        : request.nextUrl.protocol === 'https:';
}

function base64UrlEncode(value: string) {
    return Buffer.from(value, 'utf8')
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/u, '');
}

function base64UrlDecode(value: string) {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(
        normalized.length + ((4 - (normalized.length % 4)) % 4),
        '='
    );

    return Buffer.from(padded, 'base64').toString('utf8');
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

function parseJwtPayload(token: string): Record<string, unknown> | null {
    const [, payload] = token.split('.');

    if (!payload) return null;

    try {
        return JSON.parse(base64UrlDecode(payload)) as Record<string, unknown>;
    } catch {
        return null;
    }
}

function isUuid(value: unknown): value is string {
    return typeof value === 'string' && UUID_PATTERN.test(value);
}

function normalizeJwtRoles(value: unknown) {
    const roles = typeof value === 'string'
        ? [value]
        : Array.isArray(value)
            ? value.filter((role): role is string => typeof role === 'string')
            : [];

    return [...new Set(roles.map((role) => role.trim()).filter(Boolean))];
}

/**
 * Decodes only the non-sensitive JWT metadata needed by the UI session. Token
 * signature and resource authorization are always validated by the backend.
 */
export function getJwtPayload(token: string): JwtPayload | null {
    const payload = parseJwtPayload(token);

    if (!payload || !isUuid(payload.sub) || !isUuid(payload.organizationId)) {
        return null;
    }

    const expiration = payload.exp;
    if (typeof expiration !== 'number' || !Number.isFinite(expiration)) {
        return null;
    }

    if (payload.iat !== undefined && (
        typeof payload.iat !== 'number' || !Number.isFinite(payload.iat)
    )) {
        return null;
    }

    const role = payload.role;
    if (
        role !== undefined &&
        (
            (typeof role !== 'string' && !Array.isArray(role)) ||
            (Array.isArray(role) && !role.every((item) => typeof item === 'string'))
        )
    ) {
        return null;
    }

    return {
        sub: payload.sub,
        organizationId: payload.organizationId,
        role: typeof role === 'string' || Array.isArray(role)
            ? normalizeJwtRoles(role)
            : undefined,
        ...(payload.iat !== undefined ? { iat: payload.iat } : {}),
        exp: expiration,
    };
}

export function getJwtMaxAgeSeconds(token: string) {
    const payload = parseJwtPayload(token);
    const exp = payload?.exp;

    if (typeof exp !== 'number') return DEFAULT_SESSION_MAX_AGE_SECONDS;

    const secondsUntilExpiration = Math.floor(exp - Date.now() / 1000);

    if (secondsUntilExpiration <= 0) return 0;

    return Math.min(secondsUntilExpiration, MAX_SESSION_MAX_AGE_SECONDS);
}

export function isJwtExpired(token: string) {
    return getJwtMaxAgeSeconds(token) === 0;
}

export function createAuthSession(loginResponse: LoginResponse): AuthSession {
    const token = loginResponse.token;
    const payload = token ? getJwtPayload(token) : null;
    const expiration = payload?.exp;

    if (
        !payload ||
        typeof expiration !== 'number' ||
        expiration * 1000 <= Date.now()
    ) {
        throw new Error('Invalid multi-tenant JWT');
    }

    return {
        // `sub` is the stable user UUID. Never treat it as an email address.
        id: payload.sub,
        email: loginResponse.email,
        roles: Array.isArray(payload.role) ? payload.role : [],
        organizationId: payload.organizationId,
        expiration,
    };
}

export function encodeAuthSession(session: AuthSession) {
    return base64UrlEncode(JSON.stringify(session));
}

export function decodeAuthSession(value: string): AuthSession | null {
    try {
        const parsed = JSON.parse(base64UrlDecode(value)) as Partial<AuthSession>;

        if (
            typeof parsed.id !== 'string' ||
            typeof parsed.email !== 'string' ||
            !Array.isArray(parsed.roles) ||
            !isUuid(parsed.organizationId) ||
            typeof parsed.expiration !== 'number' ||
            !Number.isFinite(parsed.expiration)
        ) {
            return null;
        }

        return {
            id: parsed.id,
            email: parsed.email,
            roles: parsed.roles.filter((role): role is string => typeof role === 'string'),
            organizationId: parsed.organizationId,
            expiration: parsed.expiration,
        };
    } catch {
        return null;
    }
}

export function setAuthCookies(
    response: NextResponse,
    token: string,
    session: AuthSession,
    secure: boolean,
) {
    const maxAge = getJwtMaxAgeSeconds(token);

    response.cookies.set(AUTH_TOKEN_COOKIE, token, {
        httpOnly: true,
        sameSite: 'lax',
        secure,
        path: '/',
        maxAge,
    });

    response.cookies.set(AUTH_USER_COOKIE, encodeAuthSession(session), {
        httpOnly: true,
        sameSite: 'lax',
        secure,
        path: '/',
        maxAge,
    });
}

export function clearAuthCookies(response: NextResponse) {
    response.cookies.set(AUTH_TOKEN_COOKIE, '', {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 0,
    });

    response.cookies.set(AUTH_USER_COOKIE, '', {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 0,
    });
}
