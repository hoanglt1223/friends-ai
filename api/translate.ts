import type { VercelRequest, VercelResponse } from '@vercel/node';
import { setCorsHeaders, handleOptions } from './_shared/cors';
import { handleError } from './_shared/error-handler';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  
  if (req.method === 'OPTIONS') {
    return handleOptions(res);
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { words } = req.body;
    if (!words || !Array.isArray(words)) {
      return res.status(400).json({ message: "Words array is required" });
    }

    // Get DeepL translations
    const { deeplService } = await import('./_shared/deepl-service');
    const translations = await deeplService.translateChineseToVietnamese(words);
    return res.json({ translations });
  } catch (error: any) {
    return handleError(res, error, 'Translation API');
  }
}
