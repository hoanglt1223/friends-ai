import { VercelRequest, VercelResponse } from '@vercel/node';
import { handleCors } from '../_shared/cors';
import { storage } from '../_shared/storage';
import { createCheckoutVN } from '../_shared/checkout';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  const corsResult = handleCors(req, res);
  if (corsResult) return corsResult;

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { order_id, payment_status, website_id } = req.body;

    if (!order_id || !payment_status) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify the webhook is from checkout.vn by checking payment status
    const checkoutVN = createCheckoutVN();
    const paymentStatus = await checkoutVN.getPaymentStatus(order_id);

    if (!paymentStatus || paymentStatus.error) {
      return res.status(400).json({ error: 'Invalid payment verification' });
    }

    // Find user by order ID
    const users = await storage.getAllUsers();
    const user = users.find(u => u.checkoutVnOrderId === order_id.toString());

    if (!user) {
      console.error('User not found for order ID:', order_id);
      return res.status(404).json({ error: 'User not found' });
    }

    // Update subscription status based on payment status
    let subscriptionStatus = 'pending';
    
    if (payment_status === 'success' || payment_status === 'completed') {
      subscriptionStatus = 'active';
    } else if (payment_status === 'failed' || payment_status === 'cancelled') {
      subscriptionStatus = 'cancelled';
    }

    // Update user subscription status
    await storage.updateUser(user.id, {
      subscriptionStatus,
      lastPaymentStatus: payment_status,
      lastPaymentUpdate: new Date().toISOString(),
    });

    return res.json({ 
      success: true, 
      message: 'Webhook processed successfully',
      orderId: order_id,
      status: subscriptionStatus,
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ 
      error: 'Failed to process webhook',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}