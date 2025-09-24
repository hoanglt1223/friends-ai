import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  BarChart, 
  Users, 
  MessageSquare, 
  Crown, 
  Settings, 
  Activity,
  TrendingUp,
  Brain,
  Save,
  ArrowLeft
} from "lucide-react";
import { isUnauthorizedError } from "@/lib/authUtils";
import { ROUTES } from "@/lib/routes";
import { ADMIN_API } from "@/lib/apiRoutes";

interface Analytics {
  totalUsers: number;
  todayMessages: number;
  premiumUsers: number;
  conversionRate: string;
}

interface SystemSetting {
  id: string;
  key: string;
  value: string;
  description?: string;
}

export default function Admin() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [settingUpdates, setSettingUpdates] = useState<Record<string, string>>({});

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      toast({
        title: "Unauthorized", 
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = ROUTES.LOGIN_REDIRECT;
      }, 500);
      return;
    }
  }, [user, isLoading, toast]);

  // Fetch analytics with error handling
  const { data: analytics, error: analyticsError } = useQuery<Analytics>({
    queryKey: [ADMIN_API.analytics()],
    enabled: !!user,
    retry: false,
  });

  // Fetch system settings with error handling
  const { data: settings = [], error: settingsError } = useQuery<SystemSetting[]>({
    queryKey: [ADMIN_API.settings()],
    enabled: !!user,
    retry: false,
  });

  // Handle unauthorized errors
  useEffect(() => {
    const errors = [analyticsError, settingsError].filter(Boolean);
    for (const error of errors) {
      if (error && isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = ROUTES.LOGIN_REDIRECT;
        }, 500);
        return;
      }
    }
  }, [analyticsError, settingsError, toast]);

  // Update setting mutation
  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      await apiRequest("PUT", ADMIN_API.updateSetting(key), { value });
    },
    onSuccess: (_, { key }) => {
      queryClient.invalidateQueries({ queryKey: [ADMIN_API.settings()] });
      toast({
        title: "Setting Updated",
        description: `${key} has been updated successfully.`,
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = ROUTES.LOGIN_REDIRECT;
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update setting. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSettingUpdate = (key: string) => {
    const value = settingUpdates[key];
    if (value !== undefined) {
      updateSettingMutation.mutate({ key, value });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-background" data-testid="admin-page">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary to-secondary text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Settings className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="font-display text-3xl font-bold">Admin Dashboard</h1>
                <p className="text-white/80">Manage AI personalities, system parameters, and analytics</p>
              </div>
            </div>
            <Badge className="bg-white/20 text-white px-4 py-2">
              Administrator
            </Badge>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Analytics Overview */}
        <div className="grid lg:grid-cols-4 gap-6 mb-8">
          <Card data-testid="analytics-total-users">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.totalUsers || 0}</div>
              <p className="text-xs text-muted-foreground">
                Active accounts
              </p>
            </CardContent>
          </Card>

          <Card data-testid="analytics-today-messages">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Messages</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.todayMessages || 0}</div>
              <p className="text-xs text-muted-foreground">
                Messages sent today
              </p>
            </CardContent>
          </Card>

          <Card data-testid="analytics-premium-users">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Premium Users</CardTitle>
              <Crown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.premiumUsers || 0}</div>
              <p className="text-xs text-muted-foreground">
                Paid subscriptions
              </p>
            </CardContent>
          </Card>

          <Card data-testid="analytics-conversion-rate">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.conversionRate || 0}%</div>
              <p className="text-xs text-muted-foreground">
                Free to premium
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* AI Personality Management */}
          <Card data-testid="personality-management">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Brain className="w-5 h-5 mr-2" />
                AI Personalities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: "Sarah (Supportive)", active: true },
                  { name: "Alex (Practical)", active: true },
                  { name: "Maya (Creative)", active: true },
                  { name: "Jordan (Wise)", active: true },
                  { name: "Chris (Energetic)", active: true }
                ].map((personality, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-accent/20 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${personality.active ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      <span className="font-medium">{personality.name}</span>
                    </div>
                    <Button variant="ghost" size="sm" data-testid={`edit-personality-${index}`}>
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button 
                  variant="outline" 
                  className="w-full border-dashed"
                  data-testid="add-personality"
                >
                  <Brain className="w-4 h-4 mr-2" />
                  Add Personality
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* System Settings */}
          <Card data-testid="system-settings">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                System Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {settings.map((setting) => (
                  <div key={setting.key} className="space-y-2">
                    <Label htmlFor={setting.key} className="text-sm font-medium">
                      {setting.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Label>
                    <div className="flex space-x-2">
                      <Input
                        id={setting.key}
                        value={settingUpdates[setting.key] ?? setting.value}
                        onChange={(e) => setSettingUpdates(prev => ({
                          ...prev,
                          [setting.key]: e.target.value
                        }))}
                        className="flex-1"
                        data-testid={`setting-input-${setting.key}`}
                      />
                      <Button 
                        size="sm"
                        onClick={() => handleSettingUpdate(setting.key)}
                        disabled={updateSettingMutation.isPending || settingUpdates[setting.key] === undefined}
                        data-testid={`setting-update-${setting.key}`}
                      >
                        Update
                      </Button>
                    </div>
                    {setting.description && (
                      <p className="text-xs text-muted-foreground">{setting.description}</p>
                    )}
                  </div>
                ))}
                
                {settings.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Settings className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No system settings configured</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card data-testid="recent-activity">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    type: "user",
                    message: "New user registered",
                    time: "2 min ago",
                    color: "bg-green-500"
                  },
                  {
                    type: "subscription",
                    message: "Premium subscription activated",
                    time: "5 min ago",
                    color: "bg-blue-500"
                  },
                  {
                    type: "personality",
                    message: "AI personality updated",
                    time: "12 min ago",
                    color: "bg-purple-500"
                  },
                  {
                    type: "system",
                    message: "System maintenance completed",
                    time: "1 hour ago",
                    color: "bg-orange-500"
                  }
                ].map((activity, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 hover:bg-accent/20 rounded-lg transition-colors">
                    <div className={`w-2 h-2 ${activity.color} rounded-full`}></div>
                    <div className="flex-1">
                      <span className="text-sm">{activity.message}</span>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Health */}
        <Card className="mt-8" data-testid="system-health">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart className="w-5 h-5 mr-2" />
              System Health & Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Database Performance</span>
                  <span className="font-semibold text-green-600">Excellent</span>
                </div>
                <div className="w-full bg-accent/30 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '95%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>API Response Time</span>
                  <span className="font-semibold text-green-600">120ms</span>
                </div>
                <div className="w-full bg-accent/30 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '88%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>AI Model Availability</span>
                  <span className="font-semibold text-green-600">99.9%</span>
                </div>
                <div className="w-full bg-accent/30 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '99%' }}></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
