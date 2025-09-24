import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { BoardMember } from "@shared/schema";

interface TypingIndicatorProps {
  member: BoardMember;
}

export function TypingIndicator({ member }: TypingIndicatorProps) {
  return (
    <div className="flex items-start space-x-3" data-testid="typing-indicator">
      <Avatar className="w-8 h-8 flex-shrink-0 mt-1">
        <AvatarImage src={member.avatarUrl || undefined} alt={member.name} />
        <AvatarFallback className="bg-accent text-accent-foreground">
          {member.name.charAt(0)}
        </AvatarFallback>
      </Avatar>
      <div className="max-w-[75%]">
        <div className="bg-accent/30 border border-border rounded-2xl rounded-tl-md px-4 py-3 shadow-sm">
          <div className="flex items-center space-x-2 mb-1">
            <span className="font-semibold text-primary text-sm">{member.name}</span>
            <span className="text-xs text-muted-foreground">is typing...</span>
          </div>
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
