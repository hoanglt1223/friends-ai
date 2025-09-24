import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { SubscriptionPlans } from "@/components/subscription-plans";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Crown, Check, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { ROUTES } from "@/lib/routes";
import { SUBSCRIPTION_API } from "@/lib/apiRoutes";

const SubscribeForm = ({ onSubscribe }: { onSubscribe: (plan: string) => void }) => {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSubscribe = async (planType: 'premium' | 'pro') => {
    setIsLoading(true);
    try {
      await onSubscribe(planType);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button 
        onClick={() => handleSubscribe('premium')} 
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-primary to-secondary text-white py-6 text-lg font-semibold"
        data-testid="subscribe-premium-button"
      >
        {isLoading ? (
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Processing...</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <CreditCard className="w-5 h-5" />
            <span>Subscribe to Premium - $9.99/month</span>
          </div>
        )}
      </Button>
      
      <Button 
        onClick={() => handleSubscribe('pro')} 
        disabled={isLoading}
        variant="outline"
        className="w-full py-6 text-lg font-semibold border-2"
        data-testid="subscribe-pro-button"
      >
        {isLoading ? (
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <span>Processing...</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <Crown className="w-5 h-5" />
            <span>Subscribe to Pro - $19.99/month</span>
          </div>
        )}
      </Button>
    </div>
  );
};

export default function Subscribe() {
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
        window.location.href = ROUTES.AUTH;
      }, 500);
      return;
    }

    if ((user as any)?.subscriptionTier === 'premium' || (user as any)?.subscriptionTier === 'pro') {
      toast({
        title: "Already Subscribed",
        description: "You already have an active subscription!",
      });
      return;
    }

    setIsLoading(false);
  }, [user, isAuthenticated, toast]);

  const handleSubscribe = async (planType: string) => {
    try {
      const response = await apiRequest("POST", SUBSCRIPTION_API.getOrCreate(), {
        planType
      });
      
      const data = await response.json();
      
      if (data.paymentUrl) {
        // Redirect to checkout.vn payment page
        window.location.href = data.paymentUrl;
      } else {
        throw new Error("No payment URL received");
      }
    } catch (error) {
      if (error instanceof Error && isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = ROUTES.AUTH;
        }, 500);
        return;
      }
      
      toast({
        title: "Error",
        description: "Failed to initialize subscription. Please try again.",
        variant: "destructive",
      });
    }
  };

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

  if ((user as any)?.subscriptionTier === 'premium' || (user as any)?.subscriptionTier === 'pro') {
    return (
      <div className="min-h-screen bg-background" data-testid="already-premium">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-6">
              <Crown className="w-10 h-10 text-white" />
            </div>
            <h1 className="font-display text-3xl font-bold text-foreground mb-4">
              You're Already Subscribed!
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" aria-label="Loading"/>
          <p className="text-muted-foreground">Loading subscription options...</p>
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

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Premium Plan */}
          <Card className="border-2 border-primary shadow-2xl">
            <CardHeader className="text-center pb-4">
              <Badge className="bg-gradient-to-r from-accent to-primary text-white mx-auto mb-4 px-4 py-2">
                <Crown className="w-4 h-4 mr-2" />
                Premium Plan
              </Badge>
              <CardTitle className="text-3xl font-bold">$9.99<span className="text-lg text-muted-foreground">/month</span></CardTitle>
              <p className="text-muted-foreground">Perfect for personal use</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span><strong>5 AI board members</strong></span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span><strong>Custom personalities</strong></span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span><strong>Image & audio sharing</strong></span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span><strong>Advanced chat history</strong></span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span><strong>Priority support</strong></span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Pro Plan */}
          <Card className="border-2 border-purple-500 shadow-2xl relative">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-purple-500 text-white px-4 py-1">Most Popular</Badge>
            </div>
            <CardHeader className="text-center pb-4 pt-6">
              <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white mx-auto mb-4 px-4 py-2">
                <Crown className="w-4 h-4 mr-2" />
                Pro Plan
              </Badge>
              <CardTitle className="text-3xl font-bold">$19.99<span className="text-lg text-muted-foreground">/month</span></CardTitle>
              <p className="text-muted-foreground">For power users and teams</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span><strong>Everything in Premium</strong></span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span><strong>10 AI board members</strong></span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span><strong>Team collaboration</strong></span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span><strong>Advanced analytics</strong></span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span><strong>API access</strong></span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span><strong>White-label options</strong></span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Payment Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="w-5 h-5 mr-2 text-primary" />
                Choose Your Plan
              </CardTitle>
              <p className="text-muted-foreground">
                Start your subscription today and unlock all features immediately.
              </p>
            </CardHeader>
            <CardContent>
              <SubscribeForm onSubscribe={handleSubscribe} />

              <div className="mt-6 text-center">
                <p className="text-xs text-muted-foreground">
                  Secure payment powered by checkout.vn. Your payment information is encrypted and secure.
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
        </div>

        {/* Security & Trust */}
        <div className="mt-12 text-center">
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
              <span className="text-xs">Vietnam Payment Gateway</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
