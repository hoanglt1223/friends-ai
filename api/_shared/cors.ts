import { VercelRequest, VercelResponse } from '@vercel/node';

export function enableCors(req: VercelRequest, res: VercelResponse): boolean {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }
  
  return false;
}

export function withCors(handler: (req: VercelRequest, res: VercelResponse) => Promise<any>) {
  return async (req: VercelRequest, res: VercelResponse) => {
    // Enable CORS
    if (enableCors(req, res)) {
      return; // Preflight request handled
    }
    
    try {
      return await handler(req, res);
    } catch (error) {
      console.error('API Error:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Internal Server Error' 
      });
    }
  };
}

// Legacy function name for backward compatibility
export function handleCors(req: VercelRequest, res: VercelResponse): boolean {
  return enableCors(req, res);
}

// Additional CORS helper functions
export function setCorsHeaders(res: VercelResponse): void {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
}

export function handleOptions(res: VercelResponse): void {
  res.status(200).end();
}