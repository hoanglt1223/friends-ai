import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ChatInterface } from "@/components/chat-interface";
import { SubscriptionPlans } from "@/components/subscription-plans";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Crown, Settings, LogOut, Users } from "lucide-react";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Home() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
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
  }, [user, isLoading, toast]);

  // Fetch board members with error handling
  const { data: boardMembers = [], error: boardMembersError } = useQuery({
    queryKey: ["/api/board-members"],
    enabled: !!user,
    retry: false,
  });

  // Handle unauthorized errors
  useEffect(() => {
    if (boardMembersError && isUnauthorizedError(boardMembersError as Error)) {
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
  }, [boardMembersError, toast]);

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your AI board...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen gradient-background relative overflow-x-hidden" data-testid="home-page">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 gradient-mesh opacity-40 animate-float"></div>
      
      {/* Glass Navigation Header */}
      <header className="glass-navigation backdrop-blur-xl sticky top-0 z-50 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-12 h-12 glass-card-strong rounded-2xl flex items-center justify-center animate-glow">
                  <Users className="w-7 h-7 text-primary" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-accent rounded-full animate-bounce-subtle"></div>
              </div>
              <div>
                <h1 className="font-display font-bold text-xl sm:text-2xl text-gradient-primary">AI Board of Directors</h1>
                <p className="text-muted-foreground text-sm hidden sm:block">
                  Welcome back, {(user as any)?.firstName || (user as any)?.email?.split('@')[0]}! ✨
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 sm:space-x-4">
              {/* Enhanced Subscription Status */}
              <Badge 
                className={`glass-card px-3 py-2 border-0 font-semibold transition-all duration-300 hover:scale-105 ${
                  (user as any)?.subscriptionTier === 'premium' 
                    ? 'bg-gradient-accent text-white shadow-glow-accent' 
                    : 'bg-white/10 text-foreground'
                }`}
                data-testid="subscription-status"
              >
                {(user as any)?.subscriptionTier === 'premium' ? (
                  <>
                    <Crown className="w-4 h-4 mr-1" />
                    Premium
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 bg-muted-foreground rounded-full mr-2"></span>
                    Free
                  </>
                )}
              </Badge>
              
              {/* Modern Action Buttons */}
              <Button 
                variant="ghost" 
                size="sm" 
                className="glass-input border-0 hover:glass-card-strong transition-all duration-300"
                data-testid="button-settings"
              >
                <Settings className="w-5 h-5" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLogout}
                className="glass-input border-0 hover:glass-card-strong hover:text-destructive transition-all duration-300"
                data-testid="button-logout"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
        {/* Modern Stats Section */}
        <div className="mb-8 sm:mb-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Enhanced Stats Cards */}
            <Card className="glass-card-strong border-white/20 hover:shadow-glow transition-all duration-500 animate-slide-in-up group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Board Members</CardTitle>
                <div className="p-2 bg-gradient-primary-soft rounded-lg group-hover:animate-bounce-subtle">
                  <Users className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gradient-primary mb-1" data-testid="stats-board-members">
                  {(boardMembers as any[])?.length || 0}
                </div>
                <p className="text-xs text-muted-foreground font-medium">
                  of {(user as any)?.subscriptionTier === 'premium' ? '5' : '2'} available
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card-strong border-white/20 hover:shadow-glow-accent transition-all duration-500 animate-slide-in-up group" style={{ animationDelay: '0.1s' }}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Plan Status</CardTitle>
                <div className={`p-2 rounded-lg group-hover:animate-bounce-subtle ${
                  (user as any)?.subscriptionTier === 'premium' ? 'bg-gradient-accent' : 'bg-muted-dark'
                }`}>
                  <Crown className={`h-4 w-4 ${
                    (user as any)?.subscriptionTier === 'premium' ? 'text-white' : 'text-muted-foreground'
                  }`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold capitalize mb-1 ${
                  (user as any)?.subscriptionTier === 'premium' ? 'text-gradient-accent' : 'text-foreground'
                }`} data-testid="stats-plan-status">
                  {(user as any)?.subscriptionTier}
                </div>
                <p className="text-xs text-muted-foreground font-medium">
                  {(user as any)?.subscriptionTier === 'premium' ? 'All features unlocked' : 'Basic features'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Available Features</CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="stats-features">
                  {(user as any)?.subscriptionTier === 'premium' ? '6' : '3'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Features unlocked
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Support Level</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="stats-support-level">
                  24/7
                </div>
                <p className="text-xs text-muted-foreground">
                  Always available
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Enhanced Main Content */}
        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Floating Chat Interface */}
          <div className="lg:col-span-2 order-2 lg:order-1">
            <Card className="glass-card-strong border-white/20 h-[500px] sm:h-[650px] flex flex-col overflow-hidden shadow-glass animate-slide-in-up">
              <ChatInterface />
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6 order-1 lg:order-2">
            {/* Premium Upgrade Card */}
            {(user as any)?.subscriptionTier !== 'premium' && (
              <Card className="relative glass-card-strong border-white/20 overflow-hidden animate-slide-in-up group hover:shadow-glow-accent transition-all duration-500">
                <div className="absolute inset-0 bg-gradient-accent opacity-10 group-hover:opacity-20 transition-opacity duration-500"></div>
                <CardHeader className="relative pb-4">
                  <CardTitle className="flex items-center text-lg font-bold">
                    <div className="p-2 bg-gradient-accent rounded-xl mr-3 animate-glow">
                      <Crown className="w-5 h-5 text-white" />
                    </div>
                    Upgrade to Premium
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-sm">
                      <div className="w-2 h-2 bg-gradient-accent rounded-full mr-3"></div>
                      <span>3 more AI board members</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <div className="w-2 h-2 bg-gradient-accent rounded-full mr-3"></div>
                      <span>Custom personalities</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <div className="w-2 h-2 bg-gradient-accent rounded-full mr-3"></div>
                      <span>Image & media sharing</span>
                    </div>
                  </div>
                  <Button 
                    className="w-full bg-gradient-accent hover:shadow-glow-accent font-semibold transition-all duration-300 hover:scale-105"
                    data-testid="button-upgrade-sidebar"
                  >
                    ✨ Upgrade Now
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card className="hidden sm:block">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 sm:space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-sm"
                  size="sm"
                  data-testid="button-add-member"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Add Board Member
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-sm"
                  size="sm"
                  data-testid="button-conversation-history"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Conversation History
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-sm"
                  size="sm"
                  data-testid="button-member-settings"
                >
                  <Crown className="w-4 h-4 mr-2" />
                  Member Settings
                </Button>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="hidden lg:block">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-muted-foreground">Board members initialized</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-muted-foreground">Account created</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Subscription Plans Section for Free Users */}
        {(user as any)?.subscriptionTier !== 'premium' && (
          <div className="mt-8 sm:mt-12">
            <SubscriptionPlans />
          </div>
        )}
      </div>
    </div>
  );
}
