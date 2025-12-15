/**
 * CORS configuration for Supabase Edge Functions
 * Production-ready with configurable allowed origins
 */

// Allowed origins - configure based on your deployment
const ALLOWED_ORIGINS = [
  'http://localhost:8080',
  'http://localhost:3000',
  // Add your production domain here
  // 'https://your-app.com',
];

/**
 * Get CORS headers based on request origin
 */
export function getCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('Origin') || '';

  // In development, allow all origins
  const isDevelopment = Deno.env.get('ENVIRONMENT') !== 'production';

  // Check if origin is allowed
  const isAllowed = isDevelopment || ALLOWED_ORIGINS.includes(origin) || origin.endsWith('.lovable.app');

  return {
    'Access-Control-Allow-Origin': isAllowed ? origin || '*' : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
  };
}

/**
 * Handle CORS preflight request
 */
export function handleCorsPreflightRequest(request: Request): Response {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(request),
  });
}

/**
 * Create a JSON response with CORS headers
 */
export function createJsonResponse(
  request: Request,
  data: unknown,
  status: number = 200
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...getCorsHeaders(request),
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Create an error response with CORS headers
 */
export function createErrorResponse(
  request: Request,
  message: string,
  status: number = 500
): Response {
  return createJsonResponse(request, { error: message }, status);
}
