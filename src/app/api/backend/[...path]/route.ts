import { NextRequest, NextResponse } from 'next/server'

import { defaultLocale, isLocale, localeCookieName } from '@/src/i18n/config'
import {
	AUTH_TOKEN_COOKIE,
	clearAuthCookies,
	createAuthSession,
	getJwtMaxAgeSeconds,
	getJwtPayload,
	isSecureRequest,
	setAuthCookies
} from '@/src/lib/serverAuthCookies'
import enMessages from '@/src/messages/en/apiNotifications'
import kkMessages from '@/src/messages/kk/apiNotifications'
import ruMessages from '@/src/messages/ru/apiNotifications'
import type { LoginResponse } from '@/src/types/auth.types'

export const dynamic = 'force-dynamic'

type RouteContext = {
	params: Promise<{
		path?: string[]
	}>
}

// ============================================
// ⭐ КОНФИГУРАЦИЯ URL ДЛЯ ПРОКСИ (ИСПРАВЛЕНО)
// ============================================

/**
 * Определяет базовый URL для API бэкенда
 * Приоритет:
 * 1. BACKEND_API_BASE_URL - для продакшена (Docker)
 * 2. NEXT_PUBLIC_API_URL - для разработки
 * 3. Дефолт - localhost:8081
 */
function getBackendApiBaseUrl(): string {
	// 1. Для продакшена (Docker) - используем BACKEND_API_BASE_URL
	if (process.env.BACKEND_API_BASE_URL) {
		return process.env.BACKEND_API_BASE_URL
	}

	// 2. Для разработки - используем NEXT_PUBLIC_API_URL
	if (process.env.NEXT_PUBLIC_API_URL) {
		return process.env.NEXT_PUBLIC_API_URL
	}

	// 3. Дефолт для локальной разработки
	return 'http://localhost:8081/api/v1'
}

/**
 * Определяет базовый URL для WebSocket
 */
function getBackendWsBaseUrl(): string {
	if (process.env.BACKEND_WS_BASE_URL) {
		return process.env.BACKEND_WS_BASE_URL
	}

	if (process.env.NEXT_PUBLIC_WS_URL) {
		return process.env.NEXT_PUBLIC_WS_URL
	}

	const apiUrl = getBackendApiBaseUrl()
	return `${apiUrl.replace(/\/+$/u, '')}/ws-crm`
}

const BACKEND_API_BASE_URL = getBackendApiBaseUrl()
const BACKEND_WS_BASE_URL = getBackendWsBaseUrl()

// Логирование для отладки (только в development)
if (process.env.NODE_ENV === 'development') {
	console.log('🔧 [Proxy] Backend API URL:', BACKEND_API_BASE_URL)
	console.log('🔧 [Proxy] Backend WS URL:', BACKEND_WS_BASE_URL)
}

// ============================================
// КОНСТАНТЫ
// ============================================

const BODYLESS_METHODS = new Set(['GET', 'HEAD'])
const BODYLESS_STATUSES = new Set([204, 304])
const REQUEST_HEADERS_TO_SKIP = new Set([
	'accept-encoding',
	'connection',
	'content-length',
	'cookie',
	'host',
	'origin',
	'referer',
	// The proxy authenticates only with its HttpOnly cookie, never with a
	// browser-supplied Authorization header.
	'authorization',
	// Tenant context comes only from the signed JWT. Never proxy a caller-set
	// header that could be interpreted as a tenant selector by the backend.
	'x-organization-id'
])
const RESPONSE_HEADERS_TO_SKIP = new Set([
	'connection',
	'content-encoding',
	'content-length',
	'set-cookie',
	'transfer-encoding'
])

// ============================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================

function getProxyMessages(request: NextRequest) {
	const savedLocale = request.cookies.get(localeCookieName)?.value
	const locale = isLocale(savedLocale) ? savedLocale : defaultLocale
	return { ru: ruMessages, en: enMessages, kk: kkMessages }[locale].proxy
}

export function buildBackendUrl(path: string[], request: NextRequest) {
	const isSockJsRequest = path[0] === 'ws-crm'
	const targetPath = isSockJsRequest ? path.slice(1) : path
	const encodedPath = targetPath
		.map(segment => encodeURIComponent(segment))
		.join('/')
	const baseUrl = (
		isSockJsRequest ? BACKEND_WS_BASE_URL : BACKEND_API_BASE_URL
	).replace(/\/+$/u, '')
	const targetUrl = new URL(`${baseUrl}/${encodedPath}`)

	request.nextUrl.searchParams.forEach((value, key) => {
		if (key.toLowerCase() !== 'organizationid') {
			targetUrl.searchParams.append(key, value)
		}
	})

	return targetUrl
}

export function buildRequestHeaders(request: NextRequest) {
	const headers = new Headers()

	request.headers.forEach((value, key) => {
		const normalizedKey = key.toLowerCase()

		if (
			REQUEST_HEADERS_TO_SKIP.has(normalizedKey) ||
			normalizedKey.startsWith('sec-fetch-')
		) {
			return
		}

		headers.set(key, value)
	})

	const token = request.cookies.get(AUTH_TOKEN_COOKIE)?.value

	if (token) {
		headers.set('Authorization', `Bearer ${token}`)
	}

	return headers
}

function isMultipartRequest(request: NextRequest) {
	return (
		request.headers
			.get('content-type')
			?.toLowerCase()
			.startsWith('multipart/form-data') ?? false
	)
}

function buildResponseHeaders(headers: Headers) {
	const responseHeaders = new Headers()

	headers.forEach((value, key) => {
		if (!RESPONSE_HEADERS_TO_SKIP.has(key.toLowerCase())) {
			responseHeaders.set(key, value)
		}
	})

	return responseHeaders
}

function makeProxyResponse(
	body: ArrayBuffer,
	backendResponse: Response,
	request: NextRequest
) {
	const responseBody =
		BODYLESS_STATUSES.has(backendResponse.status) || request.method === 'HEAD'
			? null
			: body

	return new NextResponse(responseBody, {
		status: backendResponse.status,
		statusText: backendResponse.statusText,
		headers: buildResponseHeaders(backendResponse.headers)
	})
}

function parseLoginResponse(body: ArrayBuffer): LoginResponse | null {
	try {
		return JSON.parse(new TextDecoder().decode(body)) as LoginResponse
	} catch {
		return null
	}
}

async function getRequestBody(request: NextRequest) {
	if (BODYLESS_METHODS.has(request.method)) return undefined

	if (isMultipartRequest(request)) {
		return request.formData()
	}

	return request.arrayBuffer()
}

// ============================================
// ОСНОВНАЯ ФУНКЦИЯ ПРОКСИ
// ============================================

async function proxyRequest(request: NextRequest, context: RouteContext) {
	const proxyMessages = getProxyMessages(request)
	const { path = [] } = await context.params
	const isLoginRequest =
		request.method === 'POST' && path.join('/') === 'auth/login'
	const targetUrl = buildBackendUrl(path, request)
	const headers = buildRequestHeaders(request)

	if (isLoginRequest) {
		headers.delete('authorization')
	}

	if (isMultipartRequest(request)) {
		headers.delete('content-type')
	}

	try {
		const backendResponse = await fetch(targetUrl, {
			method: request.method,
			headers,
			body: await getRequestBody(request),
			cache: 'no-store',
			redirect: 'manual'
		})
		const responseBody = await backendResponse.arrayBuffer()

		if (isLoginRequest && backendResponse.ok) {
			const loginResponse = parseLoginResponse(responseBody)

			if (!loginResponse?.token) {
				return NextResponse.json(
					{ message: proxyMessages.tokenMissing },
					{ status: 502 }
				)
			}

			if (
				getJwtMaxAgeSeconds(loginResponse.token) <= 0 ||
				!getJwtPayload(loginResponse.token)
			) {
				const response = NextResponse.json(
					{ message: proxyMessages.tokenExpired },
					{ status: 422 }
				)
				clearAuthCookies(response)
				return response
			}

			let session
			try {
				session = createAuthSession(loginResponse)
			} catch {
				const response = NextResponse.json(
					{ message: proxyMessages.tokenExpired },
					{ status: 422 }
				)
				clearAuthCookies(response)
				return response
			}
			const response = NextResponse.json(session, {
				status: backendResponse.status
			})

			setAuthCookies(
				response,
				loginResponse.token,
				session,
				isSecureRequest(request)
			)

			return response
		}

		const response = makeProxyResponse(responseBody, backendResponse, request)

		if (backendResponse.status === 401) {
			clearAuthCookies(response)
		}

		return response
	} catch (error) {
		console.error('❌ [Proxy] Backend request failed:', {
			method: request.method,
			pathname: targetUrl.pathname,
			error: error instanceof Error ? error.message : String(error)
		})
		return NextResponse.json(
			{ message: proxyMessages.unavailable },
			{ status: 502 }
		)
	}
}

// ============================================
// ЭКСПОРТЫ HTTP МЕТОДОВ
// ============================================

export async function GET(request: NextRequest, context: RouteContext) {
	return proxyRequest(request, context)
}

export async function POST(request: NextRequest, context: RouteContext) {
	return proxyRequest(request, context)
}

export async function PUT(request: NextRequest, context: RouteContext) {
	return proxyRequest(request, context)
}

export async function PATCH(request: NextRequest, context: RouteContext) {
	return proxyRequest(request, context)
}

export async function DELETE(request: NextRequest, context: RouteContext) {
	return proxyRequest(request, context)
}

export async function HEAD(request: NextRequest, context: RouteContext) {
	return proxyRequest(request, context)
}
