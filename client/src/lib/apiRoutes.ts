/**
 * Centralized API endpoint configuration for the Friends AI application
 * This file contains all API endpoints to prevent hardcoded URLs and ensure consistency
 */

export const API_ENDPOINTS = {
  // Authentication
  AUTH: '/api/auth',
  
  // Board Members (consolidated endpoint)
  BOARD_MEMBERS: '/api/board-members',
  
  // Conversations (consolidated endpoint)
  CONVERSATIONS: '/api/conversations',
  
  // Chat
  CHAT_SEND: '/api/chat/send',
  
  // Subscription
  SUBSCRIPTION: '/api/subscription',
  SUBSCRIPTION_WEBHOOK: '/api/subscription/webhook',
  
  // Admin
  ADMIN_SETTINGS: '/api/admin/settings',
  
  // Translation
  TRANSLATE: '/api/translate',
  
  // Upload
  UPLOAD: '/api/upload',
} as const;

export type ApiEndpointKey = keyof typeof API_ENDPOINTS;
export type ApiEndpointValue = typeof API_ENDPOINTS[ApiEndpointKey];

/**
 * Helper function to get an API endpoint by key
 */
export const getApiEndpoint = (key: ApiEndpointKey): ApiEndpointValue => {
  return API_ENDPOINTS[key];
};

/**
 * Helper function to build API URLs with query parameters
 */
export const buildApiUrl = (
  endpoint: string,
  params?: Record<string, string | number | boolean>
): string => {
  if (!params || Object.keys(params).length === 0) {
    return endpoint;
  }
  
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    searchParams.append(key, String(value));
  });
  
  return `${endpoint}?${searchParams.toString()}`;
};

/**
 * Helper function to build API URLs with path parameters
 */
export const buildApiUrlWithPath = (
  endpoint: ApiEndpointValue,
  pathSegments: (string | number)[],
  params?: Record<string, string | number | boolean>
): string => {
  const pathUrl = `${endpoint}/${pathSegments.join('/')}`;
  return params ? buildApiUrl(pathUrl, params) : pathUrl;
};

/**
 * Auth API helpers
 */
export const AUTH_API = {
  getUser: () => API_ENDPOINTS.AUTH,
} as const;

/**
 * Chat API helpers
 */
export const CHAT_API = {
  send: () => API_ENDPOINTS.CHAT_SEND,
} as const;

/**
 * Upload API helpers
 */
export const UPLOAD_API = {
  upload: () => API_ENDPOINTS.UPLOAD,
} as const;

/**
 * Board Members API helpers
 */
export const BOARD_MEMBERS_API = {
  list: () => API_ENDPOINTS.BOARD_MEMBERS,
  create: () => API_ENDPOINTS.BOARD_MEMBERS,
  update: (id: string) => buildApiUrl(API_ENDPOINTS.BOARD_MEMBERS, { id }),
  delete: (id: string) => buildApiUrl(API_ENDPOINTS.BOARD_MEMBERS, { id }),
  initialize: () => buildApiUrl(API_ENDPOINTS.BOARD_MEMBERS, { action: 'initialize' }),
} as const;

/**
 * Conversations API helpers
 */
export const CONVERSATIONS_API = {
  list: () => API_ENDPOINTS.CONVERSATIONS,
  create: () => API_ENDPOINTS.CONVERSATIONS,
  getMessages: (id: string) => buildApiUrl(API_ENDPOINTS.CONVERSATIONS, { id, resource: 'messages' }),
  update: (id: string) => buildApiUrl(API_ENDPOINTS.CONVERSATIONS, { id }),
  delete: (id: string) => buildApiUrl(API_ENDPOINTS.CONVERSATIONS, { id }),
} as const;

/**
 * Subscription API helpers
 */
export const SUBSCRIPTION_API = {
  getOrCreate: () => buildApiUrl(API_ENDPOINTS.SUBSCRIPTION, { action: 'get-or-create' }),
  status: () => buildApiUrl(API_ENDPOINTS.SUBSCRIPTION, { action: 'status' }),
  webhook: () => API_ENDPOINTS.SUBSCRIPTION_WEBHOOK,
} as const;

/**
 * Admin API helpers
 */
export const ADMIN_API = {
  settings: () => API_ENDPOINTS.ADMIN_SETTINGS,
  analytics: () => '/api/admin/analytics',
  updateSetting: (key: string) => buildApiUrlWithPath(API_ENDPOINTS.ADMIN_SETTINGS, [key]),
} as const;