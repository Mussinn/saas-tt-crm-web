export type Login = {
    email: string;
    password: string;
}

export type LoginResponse = {
    id: string;
    email: string;
    token?: string;
    roles: string[];
}

/**
 * UI-only representation of the claims used by the application. The backend
 * remains the authority for access to every resource.
 */
export interface JwtPayload {
    sub: string;
    organizationId: string;
    role?: string | string[];
    iat?: number;
    exp?: number;
}

/**
 * Safe session metadata derived server-side from the HttpOnly access-token
 * cookie. The token itself is intentionally never exposed to Redux/browser
 * storage.
 */
export type AuthSession = {
    id: string;
    email: string;
    roles: string[];
    organizationId: string;
    expiration: number;
};

export type Register = {
    fullName: string;
    email: string;
    phone: string;
    role: string;
    password: string;
}
