import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, X } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { SUBSCRIPTION_API } from "@/lib/apiRoutes";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface SubscriptionPlansProps {
  onUpgrade?: () => void;
}

export function SubscriptionPlans({ onUpgrade }: SubscriptionPlansProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const upgradeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", SUBSCRIPTION_API.getOrCreate());
      return response.json();
    },
    onSuccess: (data) => {
      if (data.clientSecret) {
        // Redirect to Stripe checkout or handle subscription
        onUpgrade?.();
        toast({
          title: "Subscription Created",
          description: "Redirecting to payment...",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create subscription. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleUpgrade = () => {
    upgradeMutation.mutate();
  };

  const isPremium = (user as any)?.subscriptionTier === "premium";

  return (
    <div className="max-w-4xl mx-auto" data-testid="subscription-plans">
      <div className="text-center mb-12">
        <h2 className="font-display text-3xl font-bold text-foreground mb-4">Choose Your Plan</h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Start with our free plan or upgrade for more AI board members and advanced features
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Free Plan */}
        <Card className="relative" data-testid="plan-free">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold">Free Plan</CardTitle>
            <div className="text-4xl font-bold text-primary mb-2">$0</div>
            <p className="text-muted-foreground">Perfect for getting started</p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4 mb-8">
              <li className="flex items-center space-x-3">
                <Check className="w-5 h-5 text-green-500" />
                <span>2 AI board members</span>
              </li>
              <li className="flex items-center space-x-3">
                <Check className="w-5 h-5 text-green-500" />
                <span>Text-only conversations</span>
              </li>
              <li className="flex items-center space-x-3">
                <Check className="w-5 h-5 text-green-500" />
                <span>Preset personality templates</span>
              </li>
              <li className="flex items-center space-x-3">
                <Check className="w-5 h-5 text-green-500" />
                <span>Basic chat history</span>
              </li>
              <li className="flex items-center space-x-3 text-muted-foreground">
                <X className="w-5 h-5 text-red-400" />
                <span>Custom personalities</span>
              </li>
              <li className="flex items-center space-x-3 text-muted-foreground">
                <X className="w-5 h-5 text-red-400" />
                <span>Image & audio sharing</span>
              </li>
            </ul>
            <Button 
              variant="outline" 
              className="w-full"
              disabled={!isPremium}
              data-testid="button-free-plan"
            >
              {!isPremium ? "Current Plan" : "Downgrade"}
            </Button>
          </CardContent>
        </Card>

        {/* Premium Plan */}
        <Card className="relative border-2 border-primary shadow-2xl" data-testid="plan-premium">
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
            <Badge className="bg-gradient-to-r from-accent to-primary text-white px-6 py-2 text-sm font-medium">
              <Crown className="w-4 h-4 mr-2" />
              Most Popular
            </Badge>
          </div>
          <CardHeader className="text-center pb-4 pt-8">
            <CardTitle className="text-2xl font-bold">Premium Plan</CardTitle>
            <div className="text-4xl font-bold text-primary mb-2">
              $9.99<span className="text-lg text-muted-foreground">/month</span>
            </div>
            <p className="text-muted-foreground">Full AI board experience</p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4 mb-8">
              <li className="flex items-center space-x-3">
                <Check className="w-5 h-5 text-green-500" />
                <span><strong>5 AI board members</strong></span>
              </li>
              <li className="flex items-center space-x-3">
                <Check className="w-5 h-5 text-green-500" />
                <span><strong>Image & audio sharing</strong></span>
              </li>
              <li className="flex items-center space-x-3">
                <Check className="w-5 h-5 text-green-500" />
                <span><strong>Custom personality creation</strong></span>
              </li>
              <li className="flex items-center space-x-3">
                <Check className="w-5 h-5 text-green-500" />
                <span>Advanced chat history</span>
              </li>
              <li className="flex items-center space-x-3">
                <Check className="w-5 h-5 text-green-500" />
                <span>Priority support</span>
              </li>
              <li className="flex items-center space-x-3">
                <Check className="w-5 h-5 text-green-500" />
                <span>Theme customization</span>
              </li>
            </ul>
            <Button 
              onClick={handleUpgrade}
              disabled={isPremium || upgradeMutation.isPending}
              className="w-full bg-gradient-to-r from-primary to-secondary hover:shadow-lg transform hover:scale-105 transition-all"
              data-testid="button-premium-upgrade"
            >
              {isPremium ? "Current Plan" : upgradeMutation.isPending ? "Creating..." : "Start Premium Trial"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Feature Comparison */}
      <div className="mt-16 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-3xl p-8">
        <div className="text-center mb-8">
          <h3 className="font-display text-2xl font-bold text-foreground mb-4">
            Why Choose AI Board of Directors?
          </h3>
          <p className="text-lg text-muted-foreground">
            Experience the support of a close-knit circle, available 24/7
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-primary to-secondary rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <h4 className="font-display font-semibold text-lg mb-2">Always Available</h4>
            <p className="text-muted-foreground">
              Your AI board members are here 24/7, ready to listen and support you whenever you need them.
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-primary to-secondary rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-white" />
            </div>
            <h4 className="font-display font-semibold text-lg mb-2">Personalized Support</h4>
            <p className="text-muted-foreground">
              Each AI member has a unique personality, providing diverse perspectives and tailored advice.
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-primary to-secondary rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <h4 className="font-display font-semibold text-lg mb-2">Safe Space</h4>
            <p className="text-muted-foreground">
              Share your thoughts without judgment in a secure, private environment designed for your wellbeing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
