/**
 * Centralized route configuration for the Friends AI application
 * This file contains all application routes to prevent hardcoded URLs
 */

export const ROUTES = {
  // Public routes
  HOME: '/',
  LANDING: '/',
  
  // Protected routes
  DASHBOARD: '/',
  ADMIN: '/admin',
  SUBSCRIBE: '/subscribe',
  NOT_FOUND: '/404',
  
  // Authentication routes
  AUTH: '/api/auth',
  LOGOUT: '/',
  
  // External routes (for redirects)
  LOGIN_REDIRECT: '/',
} as const;

export type RouteKey = keyof typeof ROUTES;
export type RouteValue = typeof ROUTES[RouteKey];

/**
 * Helper function to get a route by key
 */
export const getRoute = (key: RouteKey): RouteValue => {
  return ROUTES[key];
};

/**
 * Helper function to check if a route exists
 */
export const isValidRoute = (route: string): boolean => {
  return Object.values(ROUTES).includes(route as RouteValue);
};