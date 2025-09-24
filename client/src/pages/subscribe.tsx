import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Check, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { isUnauthorizedError } from "@/lib/authUtils";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY 
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  : null;

const SubscribeForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin,
      },
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Payment Successful",
        description: "Welcome to Premium! You now have access to all features.",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" data-testid="subscribe-form">
      <PaymentElement />
      <Button 
        type="submit" 
        disabled={!stripe || !elements}
        className="w-full bg-gradient-to-r from-primary to-secondary hover:shadow-lg transform hover:scale-105 transition-all"
        size="lg"
        data-testid="button-submit-payment"
      >
        <Crown className="w-5 h-5 mr-2" />
        Subscribe to Premium
      </Button>
    </form>
  );
};

export default function Subscribe() {
  const [clientSecret, setClientSecret] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }

    if ((user as any)?.subscriptionTier === 'premium') {
      toast({
        title: "Already Premium",
        description: "You already have a premium subscription!",
      });
      return;
    }

    // Create subscription as soon as the page loads
    apiRequest("POST", "/api/get-or-create-subscription")
      .then((res) => res.json())
      .then((data) => {
        setClientSecret(data.clientSecret);
        setIsLoading(false);
      })
      .catch((error) => {
        if (isUnauthorizedError(error)) {
          toast({
            title: "Unauthorized",
            description: "You are logged out. Logging in again...",
            variant: "destructive",
          });
          setTimeout(() => {
            window.location.href = "/api/login";
          }, 500);
          return;
        }
        
        toast({
          title: "Error",
          description: "Failed to initialize subscription. Please try again.",
          variant: "destructive",
        });
        setIsLoading(false);
      });
  }, [user, isAuthenticated, toast]);

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Authenticating...</p>
        </div>
      </div>
    );
  }

  if ((user as any)?.subscriptionTier === 'premium') {
    return (
      <div className="min-h-screen bg-background" data-testid="already-premium">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-6">
              <Crown className="w-10 h-10 text-white" />
            </div>
            <h1 className="font-display text-3xl font-bold text-foreground mb-4">
              You're Already Premium!
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              You have access to all premium features including 5 AI board members, custom personalities, and advanced chat features.
            </p>
            <Link href="/">
              <Button className="bg-gradient-to-r from-primary to-secondary" data-testid="button-back-home">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!stripePromise) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Payment Unavailable</h1>
          <p className="text-muted-foreground mb-8">Payment processing is currently unavailable. Please try again later.</p>
          <Link href="/">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading || !clientSecret) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" aria-label="Loading"/>
          <p className="text-muted-foreground">Setting up your subscription...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-testid="subscribe-page">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary to-secondary text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Crown className="w-8 h-8 text-white" />
              <div>
                <h1 className="font-display text-2xl font-bold">Upgrade to Premium</h1>
                <p className="text-white/80">Unlock the full AI Board experience</p>
              </div>
            </div>
            <Link href="/">
              <Button variant="ghost" className="text-white hover:bg-white/10" data-testid="button-back">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Plan Details */}
          <div>
            <Card className="border-2 border-primary shadow-2xl">
              <CardHeader className="text-center pb-4">
                <Badge className="bg-gradient-to-r from-accent to-primary text-white mx-auto mb-4 px-4 py-2">
                  <Crown className="w-4 h-4 mr-2" />
                  Premium Plan
                </Badge>
                <CardTitle className="text-3xl font-bold">$9.99<span className="text-lg text-muted-foreground">/month</span></CardTitle>
                <p className="text-muted-foreground">Everything you need for the complete AI Board experience</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  <li className="flex items-center space-x-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span><strong>5 AI board members</strong> (up from 2)</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span><strong>Custom personality creation</strong> - Design unique AI companions</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span><strong>Image & audio sharing</strong> - Rich media conversations</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span><strong>Advanced chat history</strong> - Never lose important conversations</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span><strong>Priority support</strong> - Get help when you need it</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span><strong>Theme customization</strong> - Personalize your experience</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span><strong>Cancel anytime</strong> - No long-term commitment</span>
                  </li>
                </ul>

                <div className="mt-8 p-4 bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg">
                  <h4 className="font-semibold text-foreground mb-2">What our users say:</h4>
                  <p className="text-sm text-muted-foreground italic">
                    "Having 5 different AI personalities has completely transformed my support system. 
                    Each one brings something unique to help me through different challenges."
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">- Sarah K., Premium User</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Form */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Crown className="w-5 h-5 mr-2 text-primary" />
                  Complete Your Upgrade
                </CardTitle>
                <p className="text-muted-foreground">
                  Start your premium subscription today and unlock all features immediately.
                </p>
              </CardHeader>
              <CardContent>
                {/* Make SURE to wrap the form in <Elements> which provides the stripe context. */}
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <SubscribeForm />
                </Elements>

                <div className="mt-6 text-center">
                  <p className="text-xs text-muted-foreground">
                    Secure payment powered by Stripe. Your payment information is encrypted and secure.
                  </p>
                </div>

                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2 text-green-700">
                    <Check className="w-4 h-4" />
                    <span className="text-sm font-medium">30-day money-back guarantee</span>
                  </div>
                  <p className="text-xs text-green-600 mt-1">
                    Not satisfied? Get a full refund within 30 days, no questions asked.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Security & Trust */}
            <div className="mt-6 text-center">
              <div className="flex justify-center items-center space-x-6 text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                  <span className="text-xs">SSL Secured</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                  <span className="text-xs">GDPR Compliant</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
                  <span className="text-xs">SOC 2 Certified</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
