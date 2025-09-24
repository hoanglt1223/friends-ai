import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { MessageBubble } from "@/components/ui/message-bubble";
import { TypingIndicator } from "@/components/ui/typing-indicator";
import { BoardMemberCard } from "./board-member-card";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Send, Paperclip, Smile } from "lucide-react";
import type { Message, BoardMember, Conversation } from "@shared/schema";

export function ChatInterface() {
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [currentConversation, setCurrentConversation] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingMembers, setTypingMembers] = useState<Map<string, BoardMember>>(new Map());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch board members
  const { data: boardMembers = [], isLoading: membersLoading } = useQuery<BoardMember[]>({
    queryKey: ["/api/board-members"],
    enabled: !!user,
  });

  // Fetch conversations
  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ["/api/conversations"],
    enabled: !!user,
  });

  // Create conversation mutation
  const createConversationMutation = useMutation({
    mutationFn: async (title: string) => {
      const response = await apiRequest("POST", "/api/conversations", { title });
      return response.json();
    },
    onSuccess: (conversation: Conversation) => {
      setCurrentConversation(conversation.id);
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    },
  });

  // Fetch messages for current conversation
  const { data: conversationMessages = [] } = useQuery<Message[]>({
    queryKey: ["/api/conversations", currentConversation, "messages"],
    enabled: !!currentConversation,
  });

  // WebSocket handlers
  const { isConnected, sendMessage } = useWebSocket({
    onMessage: (message) => {
      if (message) {
        setMessages(prev => [...prev, message]);
      }
    },
    onAIResponse: (message, member) => {
      if (message && member) {
        setMessages(prev => [...prev, message]);
        // Remove typing indicator for this member
        setTypingMembers(prev => {
          const newMap = new Map(prev);
          newMap.delete(member.id);
          return newMap;
        });
      }
    },
    onMemberTyping: (memberId, memberName) => {
      const member = boardMembers.find(m => m.id === memberId);
      if (member) {
        setTypingMembers(prev => new Map(prev).set(memberId, member));
      }
    },
    onMemberStopTyping: (memberId) => {
      setTypingMembers(prev => {
        const newMap = new Map(prev);
        newMap.delete(memberId);
        return newMap;
      });
    },
    onError: (error) => {
      toast({
        title: "Connection Error",
        description: error,
        variant: "destructive",
      });
    },
  });

  // Initialize default board members on first load
  useEffect(() => {
    if (user && boardMembers.length === 0 && !membersLoading) {
      apiRequest("POST", "/api/board-members/initialize")
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ["/api/board-members"] });
        })
        .catch(console.error);
    }
  }, [user, boardMembers.length, membersLoading]); // Remove queryClient from deps

  // Auto-select first 2 board members and create conversation
  useEffect(() => {
    if (boardMembers.length > 0 && selectedMembers.length === 0) {
      const defaultMembers = boardMembers.slice(0, 2).map(m => m.id);
      setSelectedMembers(defaultMembers);
    }
  }, [boardMembers.length, selectedMembers.length]); // Simplified deps
  
  // Handle conversation creation and selection with stable refs
  const hasCreatedConversation = useRef(false);
  const lastSelectedMembersLength = useRef(0);
  const lastConversationsLength = useRef(0);
  
  useEffect(() => {
    const membersChanged = selectedMembers.length !== lastSelectedMembersLength.current;
    const conversationsChanged = conversations.length !== lastConversationsLength.current;
    
    if (selectedMembers.length > 0 && !currentConversation && !hasCreatedConversation.current) {
      if (conversations.length === 0) {
        hasCreatedConversation.current = true;
        createConversationMutation.mutate("My Board Conversation");
      } else {
        setCurrentConversation(conversations[0].id);
      }
    }
    
    lastSelectedMembersLength.current = selectedMembers.length;
    lastConversationsLength.current = conversations.length;
  }, [selectedMembers.length, currentConversation, conversations.length, createConversationMutation]); // Add mutation to deps

  // Update messages when conversation or messages change with deep comparison
  const lastConversationRef = useRef<string | null>(null);
  const lastMessageCountRef = useRef(0);
  
  useEffect(() => {
    const conversationChanged = currentConversation !== lastConversationRef.current;
    const messageCountChanged = conversationMessages?.length !== lastMessageCountRef.current;
    
    if (currentConversation && conversationMessages && (conversationChanged || messageCountChanged)) {
      setMessages(conversationMessages);
      lastConversationRef.current = currentConversation;
      lastMessageCountRef.current = conversationMessages.length;
    } else if (!currentConversation && lastConversationRef.current !== null) {
      setMessages([]);
      lastConversationRef.current = null;
      lastMessageCountRef.current = 0;
    }
  }, [currentConversation, conversationMessages?.length]); // Only depend on length, not full array

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingMembers]);

  const handleSendMessage = () => {
    if (!messageInput.trim() || !currentConversation || !(user as any)?.id || !isConnected) return;
    
    if (selectedMembers.length === 0) {
      toast({
        title: "No board members selected",
        description: "Please select at least one board member to chat with.",
        variant: "destructive",
      });
      return;
    }

    sendMessage(currentConversation, messageInput.trim(), (user as any)?.id!, selectedMembers);
    setMessageInput("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleMemberSelection = (member: BoardMember) => {
    setSelectedMembers(prev => {
      if (prev.includes(member.id)) {
        return prev.filter(id => id !== member.id);
      } else {
        return [...prev, member.id];
      }
    });
  };

  return (
    <div className="flex flex-col h-full w-full relative overflow-hidden" data-testid="chat-interface">
      {/* Animated Background */}
      <div className="absolute inset-0 gradient-mesh opacity-30 animate-float"></div>
      
      {/* Glass Header */}
      <div className="relative glass-navigation border-b border-white/10 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <div className="flex-1">
            <h2 className="font-display text-xl sm:text-3xl font-bold mb-1 sm:mb-2 text-gradient-primary animate-slide-in-up">
              Your AI Board
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base hidden sm:block opacity-80">
              Share your thoughts with your personalized support circle
            </p>
          </div>
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="flex -space-x-3">
              {selectedMembers.slice(0, 3).map((memberId, index) => {
                const member = boardMembers.find(m => m.id === memberId);
                return member ? (
                  <div 
                    key={member.id}
                    className="relative animate-slide-in-up"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <img 
                      src={member.avatarUrl || ''} 
                      alt={member.name} 
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-3 border-white/50 shadow-lg hover:scale-110 transition-all duration-300"
                      data-testid={`active-member-${member.id}`}
                    />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-accent rounded-full border-2 border-white animate-glow"></div>
                  </div>
                ) : null;
              })}
            </div>
            <div className="glass-card px-3 py-2 rounded-full">
              <span className="text-xs sm:text-sm font-medium" data-testid="active-members-count">
                {selectedMembers.length} active
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Board Members Selection */}
      <div className="relative px-4 sm:px-6 py-4 border-b border-white/10">
        <div className="flex space-x-3 sm:space-x-4 overflow-x-auto pb-2 scrollbar-hide">
          {boardMembers.map((member, index) => (
            <div 
              key={member.id} 
              className="flex-shrink-0 animate-slide-in-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div 
                className={`group cursor-pointer p-3 rounded-2xl transition-all duration-300 hover:scale-105 ${
                  selectedMembers.includes(member.id) 
                    ? 'glass-card-strong ring-2 ring-primary/50 shadow-glow' 
                    : 'glass-card hover:glass-card-strong'
                }`}
                onClick={() => toggleMemberSelection(member)}
                data-testid={`member-selector-${member.id}`}
              >
                <div className="text-center">
                  <div className="relative mb-2">
                    <img 
                      src={member.avatarUrl || ''} 
                      alt={member.name} 
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover mx-auto ring-2 ring-white/20 group-hover:ring-primary/30 transition-all duration-300"
                    />
                    {selectedMembers.includes(member.id) && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-accent rounded-full border-2 border-white animate-glow flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-foreground mb-1 max-w-[70px] truncate">{member.name}</p>
                  <p className="text-xs text-muted-foreground capitalize px-2 py-1 bg-white/10 rounded-full">
                    {member.personality}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Chat Messages Container */}
      <div className="flex-1 p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto chat-scroll min-h-[300px] sm:min-h-96 relative" data-testid="chat-messages">
        {messages.length === 0 ? (
          <div className="text-center py-16 animate-slide-in-up">
            <div className="relative mx-auto mb-6">
              <div className="w-20 h-20 glass-card-strong rounded-full flex items-center justify-center mx-auto animate-glow">
                <Send className="w-10 h-10 text-primary" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-accent rounded-full animate-bounce-subtle"></div>
            </div>
            <h3 className="font-display font-bold text-xl sm:text-2xl mb-3 text-gradient-primary">Start your conversation</h3>
            <p className="text-muted-foreground text-lg max-w-md mx-auto leading-relaxed">
              Share what's on your mind with your AI board members and receive personalized support
            </p>
          </div>
        ) : (
          messages.map((message) => {
            const member = boardMembers.find(m => m.id === message.senderId);
            return (
              <MessageBubble
                key={message.id}
                message={message}
                member={member}
                isUser={message.senderType === 'user'}
              />
            );
          })
        )}

        {/* Typing indicators */}
        {Array.from(typingMembers.values()).map(member => (
          <TypingIndicator key={member.id} member={member} />
        ))}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Floating Message Input */}
      <div className="relative p-4 sm:p-6">
        <div className="glass-card-strong rounded-2xl p-4 backdrop-blur-xl">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="hidden sm:flex space-x-2">
              <Button 
                variant="ghost" 
                size="sm"
                className="glass-input border-0 hover:bg-white/10"
                data-testid="button-attachment"
              >
                <Paperclip className="w-5 h-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                className="glass-input border-0 hover:bg-white/10"
                data-testid="button-emoji"
              >
                <Smile className="w-5 h-5" />
              </Button>
            </div>
            <div className="flex-1 relative">
              <Input
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Share what's on your mind..."
                className="glass-input border-white/20 bg-white/5 text-sm sm:text-base placeholder:text-muted-foreground/60 focus:bg-white/10 transition-all duration-300"
                data-testid="input-message"
              />
            </div>
            <Button 
              onClick={handleSendMessage}
              disabled={!messageInput.trim() || !isConnected}
              className="bg-gradient-primary hover:shadow-glow flex-shrink-0 transition-all duration-300 hover:scale-105"
              size="sm"
              data-testid="button-send"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>

          {/* Enhanced Quick Suggestions */}
          <div className="flex space-x-2 mt-4 overflow-x-auto scrollbar-hide">
            {[
              { text: "Tell me about your day", emoji: "🌟" },
              { text: "I need advice", emoji: "💭" },
              { text: "I'm feeling grateful for", emoji: "🙏" }
            ].map((suggestion, index) => (
              <Button 
                key={suggestion.text}
                variant="outline" 
                size="sm" 
                className="flex-shrink-0 glass-input border-white/20 hover:glass-card-strong transition-all duration-300 hover:scale-105"
                onClick={() => setMessageInput(suggestion.text)}
                data-testid={`quick-suggestion-${suggestion.text.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <span className="mr-2">{suggestion.emoji}</span>
                {suggestion.text}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Connection status */}
      {!isConnected && (
        <div className="px-4 py-2 bg-yellow-100 text-yellow-800 text-sm text-center">
          Connecting to chat...
        </div>
      )}
    </div>
  );
}
