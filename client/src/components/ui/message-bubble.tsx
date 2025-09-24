import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MediaMessage } from "@/components/media-message";
import type { Message, BoardMember } from "@shared/schema";

interface MessageBubbleProps {
  message: Message;
  member?: BoardMember;
  isUser?: boolean;
  className?: string;
}

export function MessageBubble({ message, member, isUser = false, className }: MessageBubbleProps) {
  const formatTime = (date: Date | string) => {
    const messageDate = new Date(date);
    return messageDate.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  if (isUser) {
    return (
      <div className={cn("flex justify-end", className)} data-testid="message-bubble-user">
        <div className="max-w-[70%]">
          <div className="chat-bubble-user rounded-2xl rounded-tr-md px-4 py-3 shadow-sm message-animation">
            {message.messageType === 'image' || message.messageType === 'audio' ? (
              <div className="space-y-2">
                <MediaMessage
                  fileUrl={(message.metadata as any)?.fileUrl || ''}
                  messageType={message.messageType}
                  metadata={message.metadata as any}
                />
                {message.content && (
                  <p className="text-sm leading-relaxed" data-testid="message-content">
                    {message.content}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm leading-relaxed" data-testid="message-content">
                {message.content}
              </p>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1 text-right px-2" data-testid="message-time">
            {message.createdAt ? formatTime(message.createdAt) : ''}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex items-start space-x-3", className)} data-testid="message-bubble-ai">
      <Avatar className="w-8 h-8 flex-shrink-0 mt-1" data-testid="member-avatar">
        <AvatarImage src={member?.avatarUrl || undefined} alt={member?.name} />
        <AvatarFallback className="gradient-primary text-white text-sm font-semibold">
          {member?.name?.charAt(0)}
        </AvatarFallback>
      </Avatar>
      <div className="max-w-[70%]">
        <div className="chat-bubble-ai rounded-2xl rounded-tl-md px-4 py-3 shadow-sm message-animation relative">
          <div className="flex items-center space-x-2 mb-2">
            <span className="font-semibold text-primary text-sm" data-testid="member-name">
              {member?.name}
            </span>
            <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full capitalize font-medium" data-testid="member-personality">
              {member?.personality}
            </span>
          </div>
          {message.messageType === 'image' || message.messageType === 'audio' ? (
            <div className="space-y-2">
              <MediaMessage
                fileUrl={(message.metadata as any)?.fileUrl || ''}
                messageType={message.messageType}
                metadata={message.metadata as any}
              />
              {message.content && (
                <p className="text-sm leading-relaxed text-foreground" data-testid="message-content">
                  {message.content}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm leading-relaxed text-foreground" data-testid="message-content">
              {message.content}
            </p>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1 px-2" data-testid="message-time">
          {message.createdAt ? formatTime(message.createdAt) : ''}
        </p>
      </div>
    </div>
  );
}
