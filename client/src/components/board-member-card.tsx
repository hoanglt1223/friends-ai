import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Settings, Trash2, MessageCircle } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { BOARD_MEMBERS_API } from "@/lib/apiRoutes";
import type { BoardMember } from "@shared/schema";

interface BoardMemberCardProps {
  member: BoardMember;
  isSelected?: boolean;
  onSelect?: (member: BoardMember) => void;
  showActions?: boolean;
}

export function BoardMemberCard({ 
  member, 
  isSelected = false, 
  onSelect, 
  showActions = false 
}: BoardMemberCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(BOARD_MEMBERS_API.delete(id), {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete board member");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BOARD_MEMBERS_API.list()] });
      toast({
        title: "Board member removed",
        description: `${member.name} has been removed from your board.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove board member. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to remove ${member.name} from your board?`)) {
      deleteMutation.mutate(member.id);
    }
  };

  const personalityColors = {
    supportive: "bg-green-100 text-green-700",
    practical: "bg-blue-100 text-blue-700", 
    creative: "bg-purple-100 text-purple-700",
    wise: "bg-orange-100 text-orange-700",
    energetic: "bg-yellow-100 text-yellow-700"
  };

  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-lg ${
        isSelected ? 'ring-2 ring-primary' : ''
      }`}
      onClick={() => onSelect?.(member)}
      data-testid={`board-member-card-${member.id}`}
    >
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <div className="relative">
            <Avatar className="w-16 h-16" data-testid={`member-avatar-${member.id}`}>
              <AvatarImage src={member.avatarUrl || undefined} alt={member.name} />
              <AvatarFallback className="bg-accent text-accent-foreground text-lg">
                {member.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white"></div>
          </div>
          
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-display font-semibold text-lg text-foreground" data-testid={`member-name-${member.id}`}>
                {member.name}
              </h3>
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                Active
              </Badge>
            </div>
            
            <Badge 
              className={`mb-2 ${personalityColors[member.personality as keyof typeof personalityColors] || 'bg-gray-100 text-gray-700'}`}
              data-testid={`member-personality-${member.id}`}
            >
              {member.personality.charAt(0).toUpperCase() + member.personality.slice(1)}
            </Badge>
            
            <p className="text-sm text-muted-foreground mb-4" data-testid={`member-description-${member.id}`}>
              {member.description}
            </p>
            
            {showActions && (
              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  Created {member.createdAt ? new Date(member.createdAt).toLocaleDateString() : 'Unknown'}
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    data-testid={`button-configure-${member.id}`}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Configure
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending}
                    data-testid={`button-delete-${member.id}`}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remove
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
