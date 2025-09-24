import { VercelRequest, VercelResponse } from '@vercel/node';
import { handleCors } from '../_shared/cors';
import { requireAuth, getAuthenticatedUserData } from '../_shared/auth';
import { storage } from '../_shared/storage';
import { createCheckoutVN } from '../_shared/checkout';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  const corsResult = handleCors(req, res);
  if (corsResult) return corsResult;

  try {
    if (req.method === 'GET') {
      // Get subscription status
      const user = await getAuthenticatedUserData(req);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const userData = await storage.getUser(user.id);
      if (!userData) {
        return res.status(404).json({ error: 'User not found' });
      }

      // If no subscription exists
      if (!userData.checkoutVnOrderId) {
        return res.json({
          hasSubscription: false,
          status: 'none',
          planType: null,
          amount: null,
        });
      }

      // Check current payment status with checkout.vn
      let currentStatus = userData.subscriptionStatus || 'pending';
      
      try {
        const checkoutVN = createCheckoutVN();
        const isCompleted = await checkoutVN.isPaymentCompleted(userData.checkoutVnOrderId);
        
        if (isCompleted && currentStatus !== 'active') {
          currentStatus = 'active';
          await storage.updateUser(user.id, {
            subscriptionStatus: 'active',
            lastPaymentUpdate: new Date().toISOString(),
          });
        } else if (!isCompleted && currentStatus === 'active') {
          currentStatus = 'expired';
          await storage.updateUser(user.id, {
            subscriptionStatus: 'expired',
            lastPaymentUpdate: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
      }

      return res.json({
        hasSubscription: true,
        status: currentStatus,
        planType: userData.subscriptionPlan || 'premium',
        amount: userData.subscriptionAmount || 99000,
        currency: 'VND',
        orderId: userData.checkoutVnOrderId,
        lastPaymentStatus: userData.lastPaymentStatus,
        lastPaymentUpdate: userData.lastPaymentUpdate,
      });

    } else if (req.method === 'POST') {
      // Create or get subscription
      const user = await getAuthenticatedUserData(req);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { planType = 'premium' } = req.body;

      // Check if user already has an active subscription
      const existingUser = await storage.getUser(user.id);
      if (existingUser?.checkoutVnOrderId && existingUser?.subscriptionStatus === 'active') {
        try {
          const checkoutVN = createCheckoutVN();
          const isActive = await checkoutVN.isPaymentCompleted(existingUser.checkoutVnOrderId);
          if (isActive) {
            return res.json({
              orderId: existingUser.checkoutVnOrderId,
              status: 'active',
              planType: existingUser.subscriptionPlan || planType,
            });
          }
        } catch (error) {
          console.error('Error checking existing subscription:', error);
        }
      }

      // Define subscription plans
      const plans = {
        premium: {
          name: 'Premium Plan',
          amount: 99000,
          description: 'Premium subscription with unlimited board members and conversations',
        },
        pro: {
          name: 'Pro Plan',
          amount: 199000,
          description: 'Pro subscription with advanced features and priority support',
        },
      };

      const selectedPlan = plans[planType as keyof typeof plans] || plans.premium;
      const checkoutVN = createCheckoutVN();

      const transaction = await checkoutVN.createSubscriptionPayment({
        userId: user.id,
        planName: selectedPlan.name,
        amount: selectedPlan.amount,
        customerName: user.name,
        customerEmail: user.email,
        successUrl: `${process.env.FRONTEND_URL}/subscription/success`,
        cancelUrl: `${process.env.FRONTEND_URL}/subscription/cancel`,
      });

      if (transaction.error) {
        throw new Error(transaction.msg || 'Failed to create payment transaction');
      }

      await storage.updateUser(user.id, { 
        checkoutVnOrderId: transaction.id?.toString(),
        subscriptionPlan: planType,
        subscriptionStatus: 'pending',
        subscriptionAmount: selectedPlan.amount,
      });

      return res.json({
        orderId: transaction.id,
        paymentUrl: transaction.payment_url,
        status: 'pending',
        planType,
        amount: selectedPlan.amount,
        currency: 'VND',
        description: selectedPlan.description,
      });

    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Subscription error:', error);
    return res.status(500).json({ 
      error: 'Failed to process subscription request',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}