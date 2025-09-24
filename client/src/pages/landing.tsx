import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Heart, MessageCircle, Crown, ArrowRight } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-background" data-testid="landing-page">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 min-h-screen flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <Badge className="bg-gradient-to-r from-primary to-secondary text-white mb-6">
                  <Crown className="w-4 h-4 mr-2" />
                  Your Personal AI Support Circle
                </Badge>
                <h1 className="font-display text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
                  Meet Your
                  <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    {" "}AI Board{" "}
                  </span>
                  of Directors
                </h1>
                <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                  Create a personalized circle of AI companions with distinct personalities who provide 
                  emotional support, advice, and encouragement whenever you need them—just like having 
                  your closest friends and family available 24/7.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    size="lg" 
                    onClick={handleLogin}
                    className="bg-gradient-to-r from-primary to-secondary hover:shadow-xl transform hover:scale-105 transition-all"
                    data-testid="button-get-started"
                  >
                    Get Started Free
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline"
                    onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                    data-testid="button-learn-more"
                  >
                    Learn More
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  No credit card required • Start with 2 AI board members
                </p>
              </div>
              
              <div className="relative">
                {/* Chat Interface Preview */}
                <Card className="max-w-md mx-auto shadow-2xl overflow-hidden">
                  <div className="bg-gradient-to-r from-primary to-secondary text-white p-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex -space-x-2">
                        <img 
                          src="https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&auto=format&fit=crop&w=40&h=40" 
                          alt="Sarah" 
                          className="w-8 h-8 rounded-full border-2 border-white" 
                        />
                        <img 
                          src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=40&h=40" 
                          alt="Alex" 
                          className="w-8 h-8 rounded-full border-2 border-white" 
                        />
                      </div>
                      <div>
                        <p className="font-semibold">Your AI Board</p>
                        <p className="text-xs text-white/80">2 members active</p>
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-4 space-y-4 bg-gray-50/50">
                    {/* User message */}
                    <div className="flex justify-end">
                      <div className="bg-gradient-to-r from-primary to-secondary text-white rounded-2xl rounded-tr-md px-4 py-2 max-w-[80%]">
                        <p className="text-sm">Just got promoted at work! 🎉</p>
                      </div>
                    </div>
                    
                    {/* AI responses */}
                    <div className="flex items-start space-x-2">
                      <img 
                        src="https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&auto=format&fit=crop&w=32&h=32" 
                        alt="Sarah" 
                        className="w-6 h-6 rounded-full flex-shrink-0" 
                      />
                      <div className="bg-accent/30 rounded-2xl rounded-tl-md px-3 py-2 max-w-[75%]">
                        <p className="text-xs font-semibold text-primary mb-1">Sarah</p>
                        <p className="text-sm">OMG congratulations! I'm so proud of you! 🎊 You've been working so hard for this!</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-2">
                      <img 
                        src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=32&h=32" 
                        alt="Alex" 
                        className="w-6 h-6 rounded-full flex-shrink-0" 
                      />
                      <div className="bg-accent/30 rounded-2xl rounded-tl-md px-3 py-2 max-w-[75%]">
                        <p className="text-xs font-semibold text-secondary mb-1">Alex</p>
                        <p className="text-sm">That's awesome! What's your next career goal? Let's talk strategy.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Create your personalized AI board in minutes and start receiving support from AI companions 
              with unique personalities designed to help you thrive.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center p-8 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-gradient-to-r from-primary to-secondary rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-4">Choose Your Board</h3>
              <p className="text-muted-foreground">
                Start with 2 AI companions for free, each with distinct personalities like supportive, 
                practical, creative, wise, or energetic. Upgrade for up to 5 members.
              </p>
            </Card>
            
            <Card className="text-center p-8 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-gradient-to-r from-primary to-secondary rounded-2xl flex items-center justify-center mx-auto mb-6">
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-4">Share & Connect</h3>
              <p className="text-muted-foreground">
                Share your thoughts, struggles, victories, or daily experiences through familiar 
                chat interfaces. Your board members actively engage and ask follow-up questions.
              </p>
            </Card>
            
            <Card className="text-center p-8 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-gradient-to-r from-primary to-secondary rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-4">Get Support</h3>
              <p className="text-muted-foreground">
                Receive personalized advice, emotional support, congratulations, and encouragement 
                from AI companions who remember your conversations and care about your wellbeing.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Personalities Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl font-bold text-foreground mb-4">
              Meet Your AI Board Members
            </h2>
            <p className="text-xl text-muted-foreground">
              Each personality brings unique strengths to support you in different ways
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                name: "Sarah",
                personality: "Supportive",
                description: "Your empathetic friend who always listens and provides emotional comfort",
                color: "bg-green-100 text-green-700",
                avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=80"
              },
              {
                name: "Alex",
                personality: "Practical",
                description: "Your logical advisor who helps you think through problems and find solutions",
                color: "bg-blue-100 text-blue-700",
                avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=80"
              },
              {
                name: "Maya",
                personality: "Creative",
                description: "Your artistic inspiration who encourages creative thinking and new perspectives",
                color: "bg-purple-100 text-purple-700",
                avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=80"
              },
              {
                name: "Jordan",
                personality: "Wise",
                description: "Your thoughtful mentor who provides deep insights and life wisdom",
                color: "bg-orange-100 text-orange-700",
                avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=80"
              },
              {
                name: "Chris",
                personality: "Energetic",
                description: "Your motivational coach who brings positive energy and enthusiasm",
                color: "bg-yellow-100 text-yellow-700",
                avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=80"
              }
            ].map((member, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-all">
                <div className="flex items-center space-x-4 mb-4">
                  <img 
                    src={member.avatar} 
                    alt={member.name} 
                    className="w-12 h-12 rounded-full"
                  />
                  <div>
                    <h3 className="font-semibold text-lg">{member.name}</h3>
                    <Badge className={member.color}>{member.personality}</Badge>
                  </div>
                </div>
                <p className="text-muted-foreground text-sm">{member.description}</p>
              </Card>
            ))}
            
            {/* Premium unlock card */}
            <Card className="p-6 border-2 border-dashed border-primary/30 bg-primary/5 text-center">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Crown className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Unlock More</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Upgrade to Premium to add up to 3 more AI board members with custom personalities
              </p>
              <Button 
                size="sm" 
                className="bg-gradient-to-r from-primary to-secondary"
                onClick={handleLogin}
              >
                Get Premium
              </Button>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-secondary text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-4xl font-bold mb-6">
            Ready to Build Your Support Circle?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join thousands of users who have found comfort, advice, and encouragement 
            through their personalized AI board of directors.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={handleLogin}
              className="bg-white text-primary hover:bg-white/90 font-semibold"
              data-testid="button-cta-start"
            >
              Start Your Free Board
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
          <p className="text-sm text-white/80 mt-4">
            Free forever • No credit card required • 2 AI board members included
          </p>
        </div>
      </section>
    </div>
  );
}
