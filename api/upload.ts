import { VercelRequest, VercelResponse } from '@vercel/node';
import { handleCors } from './_shared/cors';
import { getAuthenticatedUserData } from './_shared/auth.js';
import { z } from 'zod';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

// File upload validation schema
const uploadSchema = z.object({
  file: z.object({
    name: z.string(),
    type: z.string(),
    size: z.number(),
    data: z.string(), // base64 encoded file data
  }),
  messageType: z.enum(['image', 'audio']),
});

// Allowed file types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get authenticated user
    const user = await getAuthenticatedUserData(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user has premium subscription for media sharing
    const isPremium = user.subscriptionTier === 'premium' || 
                     user.subscriptionPlan === 'premium' || 
                     user.subscriptionPlan === 'pro';
    
    if (!isPremium) {
      return res.status(403).json({ 
        error: 'Premium subscription required for media sharing',
        upgradeRequired: true 
      });
    }

    // Validate request body
    const validation = uploadSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Invalid request data',
        details: validation.error.errors 
      });
    }

    const { file, messageType } = validation.data;

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return res.status(400).json({ 
        error: 'File too large. Maximum size is 10MB.' 
      });
    }

    // Validate file type
    const allowedTypes = messageType === 'image' ? ALLOWED_IMAGE_TYPES : ALLOWED_AUDIO_TYPES;
    if (!allowedTypes.includes(file.type)) {
      return res.status(400).json({ 
        error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}` 
      });
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop() || '';
    const uniqueFilename = `${randomUUID()}.${fileExtension}`;
    
    // Create upload directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'uploads', messageType);
    await mkdir(uploadDir, { recursive: true });
    
    // Save file
    const filePath = join(uploadDir, uniqueFilename);
    const fileBuffer = Buffer.from(file.data, 'base64');
    await writeFile(filePath, fileBuffer);

    // Return file URL and metadata
    const fileUrl = `/uploads/${messageType}/${uniqueFilename}`;
    const metadata = {
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      uploadedAt: new Date().toISOString(),
      uploadedBy: user.id,
    };

    res.status(200).json({
      success: true,
      fileUrl,
      metadata,
      messageType,
    });

  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ 
      error: 'Internal server error during file upload' 
    });
  }
}