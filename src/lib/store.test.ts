import { describe, expect, it } from 'vitest';

import { setChats } from '@/src/features/chat/chatSlice';
import { logout, setUser } from '@/src/features/auth/authSlice';
import { makeStore } from './store';

const userA = {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'a@example.test',
    role: 'ADMIN' as const,
    roles: ['ROLE_ADMIN'],
    organizationId: '22222222-2222-4222-8222-222222222222',
    expiration: 1_900_000_000,
};

const userB = {
    ...userA,
    id: '33333333-3333-4333-8333-333333333333',
    organizationId: '44444444-4444-4444-8444-444444444444',
};

describe('session cache isolation', () => {
    it('clears chat business state before another organization session is stored', () => {
        const store = makeStore();
        store.dispatch(setUser(userA));
        store.dispatch(setChats([{
            id: 'conversation-a',
            type: 'DIRECT',
            title: 'Tenant A',
            lastMessage: 'private',
            lastMessageAt: '2026-01-01T00:00:00Z',
            unreadCount: 0,
        }]));

        store.dispatch(setUser(userB));

        expect(store.getState().chat.chats).toEqual([]);
        expect(store.getState().auth.organizationId).toBe(userB.organizationId);
    });

    it('clears tenant business state on logout', () => {
        const store = makeStore();
        store.dispatch(setUser(userA));
        store.dispatch(setChats([{
            id: 'conversation-a',
            type: 'DIRECT',
            title: 'Tenant A',
            lastMessage: 'private',
            lastMessageAt: '2026-01-01T00:00:00Z',
            unreadCount: 0,
        }]));

        store.dispatch(logout());

        expect(store.getState().chat.chats).toEqual([]);
        expect(store.getState().auth.organizationId).toBeNull();
    });
});
