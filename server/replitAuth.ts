import type { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { storage } from "./storage";

// Simple authentication system for Vercel deployment
// This replaces Replit Auth with a basic session-based system

export async function setupAuth(app: Express): Promise<void> {
  // Configure session middleware
  app.use(session({
    secret: process.env.SESSION_SECRET || 'dev-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Simple login endpoint for development
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, firstName, lastName } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }

      // Create or get user
      const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const user = await storage.upsertUser({
        id: userId,
        email,
        firstName: firstName || 'User',
        lastName: lastName || '',
        profileImageUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`
      });

      // Store user in session
      (req.session as any).user = {
        claims: { sub: user.id },
        ...user
      };

      res.json({ user, message: 'Logged in successfully' });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Login failed' });
    }
  });

  // Logout endpoint
  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: 'Logout failed' });
      }
      res.json({ message: 'Logged out successfully' });
    });
  });
}

export function isAuthenticated(req: Request, res: Response, next: NextFunction): void {
  // Check for development bypass
  if (process.env.VITE_SKIP_LOGIN === 'true' || process.env.NODE_ENV === 'development' && process.env.VITE_SKIP_AUTH === 'true') {
    // Create a mock user for development
    (req as any).user = {
      claims: { sub: "dev-user" },
      id: "dev-user",
      email: "developer@example.com",
      firstName: "Developer",
      lastName: "User"
    };
    return next();
  }

  // Check session
  const sessionUser = (req.session as any)?.user;
  if (!sessionUser) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  // Attach user to request
  (req as any).user = sessionUser;
  next();
}