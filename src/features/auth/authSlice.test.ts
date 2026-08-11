import { describe, expect, it } from 'vitest';

import reducer, { logout, setUser } from './authSlice';

const session = {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'admin@example.test',
    role: 'ADMIN' as const,
    roles: ['ROLE_ADMIN'],
    organizationId: '22222222-2222-4222-8222-222222222222',
    expiration: 1_900_000_000,
};

describe('auth tenant metadata', () => {
    it('stores organizationId as session metadata and clears it on logout', () => {
        const authenticated = reducer(undefined, setUser(session));

        expect(authenticated).toMatchObject({
            id: session.id,
            organizationId: session.organizationId,
            expiration: session.expiration,
            isAuthenticated: true,
        });
        expect(reducer(authenticated, logout())).toMatchObject({
            id: null,
            organizationId: null,
            expiration: null,
            roles: [],
            isAuthenticated: false,
        });
    });
});
