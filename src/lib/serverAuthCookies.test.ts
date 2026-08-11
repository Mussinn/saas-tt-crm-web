import { describe, expect, it } from 'vitest';

import {
    createAuthSession,
    decodeAuthSession,
    encodeAuthSession,
    getJwtPayload,
} from './serverAuthCookies';

const USER_ID = '11111111-1111-4111-8111-111111111111';
const ORGANIZATION_ID = '22222222-2222-4222-8222-222222222222';

function makeToken(payload: Record<string, unknown>) {
    const encode = (value: object) => Buffer.from(JSON.stringify(value))
        .toString('base64url');

    return `${encode({ alg: 'none', typ: 'JWT' })}.${encode(payload)}.signature`;
}

function validPayload(overrides: Record<string, unknown> = {}) {
    return {
        sub: USER_ID,
        organizationId: ORGANIZATION_ID,
        exp: Math.floor(Date.now() / 1000) + 3600,
        ...overrides,
    };
}

describe('multi-tenant JWT session metadata', () => {
    it('uses the UUID from sub and organizationId from the JWT', () => {
        const session = createAuthSession({
            id: 'legacy-response-id',
            email: 'admin@example.test',
            roles: ['ROLE_IGNORED'],
            token: makeToken(validPayload({ role: 'ROLE_ADMIN' })),
        });

        expect(session).toMatchObject({
            id: USER_ID,
            email: 'admin@example.test',
            organizationId: ORGANIZATION_ID,
            roles: ['ROLE_ADMIN'],
        });
    });

    it('normalizes roles from an array claim', () => {
        const payload = getJwtPayload(makeToken(validPayload({
            role: ['ROLE_ADMIN', 'ROLE_TECHNICIAN', 'ROLE_ADMIN'],
        })));

        expect(payload?.role).toEqual(['ROLE_ADMIN', 'ROLE_TECHNICIAN']);
    });

    it.each([
        ['missing organizationId', validPayload({ organizationId: undefined })],
        ['email as sub', validPayload({ sub: 'admin@example.test' })],
        ['missing expiration', validPayload({ exp: undefined })],
    ])('rejects a %s JWT', (_label, payload) => {
        expect(getJwtPayload(makeToken(payload))).toBeNull();
    });

    it('does not decode a legacy session cookie without tenant metadata', () => {
        const legacyCookie = Buffer.from(JSON.stringify({
            id: 'admin@example.test',
            email: 'admin@example.test',
            roles: ['ROLE_ADMIN'],
        })).toString('base64url');

        expect(decodeAuthSession(legacyCookie)).toBeNull();
    });

    it('round-trips only validated session metadata', () => {
        const session = createAuthSession({
            id: USER_ID,
            email: 'admin@example.test',
            roles: [],
            token: makeToken(validPayload()),
        });

        expect(decodeAuthSession(encodeAuthSession(session))).toEqual(session);
    });
});
