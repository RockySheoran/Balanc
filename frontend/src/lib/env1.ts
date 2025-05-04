/**
 * Environment utility functions
 * Provides safe access to environment variables with fallbacks
 */

/**
 * Get the base URL for the application
 * Works in both browser and server environments
 */
export function getBaseUrl(): string {
    if (typeof window !== "undefined") return ""; // Browser should use relative path
    if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`; // SSR should use vercel url
    return `http://localhost:${process.env.PORT ?? 3000}`; // Dev SSR should use localhost
  }
  
  /**
   * Get safe environment variable with type checking
   */
  export function getEnv<T extends string = string>(
    key: string,
    defaultValue?: T
  ): T {
    const value = process.env[key] ?? defaultValue;
    if (value === undefined) {
      throw new Error(`Missing environment variable: ${key}`);
    }
    return value as T;
  }