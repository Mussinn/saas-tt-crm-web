import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';

import { buildBackendUrl, buildRequestHeaders } from './[...path]/route';

describe('tenant request guard', () => {
    it('does not forward a caller-supplied organization header', () => {
        const request = new NextRequest('http://localhost/api/backend/orders', {
            headers: { 'X-Organization-Id': '22222222-2222-4222-8222-222222222222' },
        });

        expect(buildRequestHeaders(request).has('X-Organization-Id')).toBe(false);
    });

    it('does not forward a caller-supplied authorization header', () => {
        const request = new NextRequest('http://localhost/api/backend/orders', {
            headers: { Authorization: 'Bearer manually-substituted-token' },
        });

        expect(buildRequestHeaders(request).has('Authorization')).toBe(false);
    });

    it('does not forward organizationId as a tenant query selector', () => {
        const request = new NextRequest(
            'http://localhost/api/backend/orders?page=0&organizationId=22222222-2222-4222-8222-222222222222',
        );
        const url = buildBackendUrl(['orders'], request);

        expect(url.searchParams.get('page')).toBe('0');
        expect(url.searchParams.has('organizationId')).toBe(false);
    });
});
