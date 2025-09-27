import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { MessageBubble } from "@/components/ui/message-bubble";
import { TypingIndicator } from "@/components/ui/typing-indicator";
import { BoardMemberCard } from "./board-member-card";
import { MediaUpload } from "@/components/media-upload";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Send, Paperclip, Smile } from "lucide-react";
import { BOARD_MEMBERS_API, CONVERSATIONS_API, CHAT_API } from "@/lib/apiRoutes";
import type { Message, BoardMember, Conversation } from "@shared/schema";

export function ChatInterface() {
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [currentConversation, setCurrentConversation] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingMembers, setTypingMembers] = useState<Map<string, BoardMember>>(new Map());
  const [showMediaUpload, setShowMediaUpload] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch board members
  const { data: boardMembers = [], isLoading: membersLoading } = useQuery<BoardMember[]>({
    queryKey: [BOARD_MEMBERS_API.list()],
    queryFn: () => fetch(BOARD_MEMBERS_API.list()).then(res => res.json()),
    enabled: !!user,
  });

  // Fetch conversations
  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: [CONVERSATIONS_API.list()],
    queryFn: () => fetch(CONVERSATIONS_API.list()).then(res => res.json()),
    enabled: !!user,
  });

  // Create conversation mutation
  const createConversationMutation = useMutation({
    mutationFn: async (title: string) => {
      const response = await fetch(CONVERSATIONS_API.create(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!response.ok) throw new Error("Failed to create conversation");
      return response.json();
    },
    onSuccess: (newConversation) => {
      queryClient.invalidateQueries({ queryKey: [CONVERSATIONS_API.list()] });
      setCurrentConversation(newConversation.id);
    },
  });

  // Fetch messages for current conversation
  const { data: fetchedMessages = [] } = useQuery<Message[]>({
    queryKey: [CONVERSATIONS_API.getMessages(currentConversation || "")],
    queryFn: async () => {
      const response = await apiRequest("GET", CONVERSATIONS_API.getMessages(currentConversation!));
      return await response.json();
    },
    enabled: !!currentConversation && !!user,
  });

  // WebSocket handlers - fallback to REST API for Vercel compatibility
  const [isConnected, setIsConnected] = useState(true); // Always consider connected for REST API

  // Send message mutation using REST API
  const sendMessageMutation = useMutation({
    mutationFn: async ({ conversationId, content, boardMemberIds, messageType, fileUrl, metadata }: {
      conversationId: string;
      content: string;
      boardMemberIds: string[];
      messageType?: 'text' | 'image' | 'audio';
      fileUrl?: string;
      metadata?: any;
    }) => {
      const response = await apiRequest("POST", CHAT_API.send(), {
        conversationId,
        content,
        boardMemberIds,
        messageType: messageType || 'text',
        fileUrl,
        metadata
      });
      return response.json();
    },
    onSuccess: (data) => {
      // Add user message to the UI immediately
      if (data.userMessage) {
        setMessages(prev => [...prev, data.userMessage]);
      }
      
      // Simulate typing indicators for AI responses
      if (data.aiResponses && data.aiResponses.length > 0) {
        data.aiResponses.forEach((response: any, index: number) => {
          const member = boardMembers.find(m => m.id === response.member.id);
          if (member) {
            // Show typing indicator
            setTypingMembers(prev => new Map(prev).set(member.id, member));
            
            // Add AI response after a delay
            setTimeout(() => {
              setMessages(prev => [...prev, response.message]);
              setTypingMembers(prev => {
                const newMap = new Map(prev);
                newMap.delete(member.id);
                return newMap;
              });
            }, (index + 1) * 1500); // Stagger responses
          }
        });
      }
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: [CONVERSATIONS_API.getMessages(String(currentConversation))] });
    },
    onError: (error) => {
      toast({
        title: "Failed to send message",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  // Initialize default board members on first load
  useEffect(() => {
    if (user && boardMembers.length === 0 && !membersLoading) {
      apiRequest("POST", BOARD_MEMBERS_API.initialize())
        .then(() => {
          queryClient.invalidateQueries({ queryKey: [BOARD_MEMBERS_API.list()] });
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
    const messageCountChanged = fetchedMessages?.length !== lastMessageCountRef.current;
    
    if (currentConversation && fetchedMessages && (conversationChanged || messageCountChanged)) {
      setMessages(fetchedMessages);
      lastConversationRef.current = currentConversation;
      lastMessageCountRef.current = fetchedMessages.length;
    } else if (!currentConversation && lastConversationRef.current !== null) {
      setMessages([]);
      lastConversationRef.current = null;
      lastMessageCountRef.current = 0;
    }
  }, [currentConversation, fetchedMessages?.length]); // Only depend on length, not full array

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingMembers]);

  const handleSendMessage = () => {
    if (!messageInput.trim() || !currentConversation || !(user as any)?.id || sendMessageMutation.isPending) return;
    
    if (selectedMembers.length === 0) {
      toast({
        title: "No board members selected",
        description: "Please select at least one board member to chat with.",
        variant: "destructive",
      });
      return;
    }

    sendMessageMutation.mutate({
      conversationId: currentConversation,
      content: messageInput.trim(),
      boardMemberIds: selectedMembers
    });
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

  const handleMediaUploadSuccess = (fileUrl: string, messageType: 'image' | 'audio', metadata: any) => {
    if (!currentConversation || !(user as any)?.id) return;
    
    // Send media message
    sendMessageMutation.mutate({
      conversationId: currentConversation,
      content: `Shared ${messageType === 'image' ? 'an image' : 'an audio file'}: ${metadata.originalName}`,
      boardMemberIds: selectedMembers,
      messageType,
      fileUrl,
      metadata
    });
    
    setShowMediaUpload(false);
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
          messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                // @ts-ignore
                isUser={message.senderId === user?.id}
                member={
                  // @ts-ignore
                  message.senderId === user?.id 
                    ? undefined 
                    : boardMembers.find(m => m.id === message.senderId)
                }
              />
            ))
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
                onClick={() => setShowMediaUpload(!showMediaUpload)}
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

          {/* Enhanced Quick Suggestions - only show when no messages */}
          {messages.length === 0 && (
            <div className="flex space-x-2 mt-4 overflow-x-auto scrollbar-hide justify-center">
              {[
                { text: "How's your day going?", emoji: "😊" },
                { text: "I need some advice", emoji: "💭" },
                { text: "Celebrating a win!", emoji: "🎉" },
                { text: "Feeling stressed", emoji: "😰" },
                { text: "What should I do about...", emoji: "🤔" }
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
          )}
          
          {/* Media Upload Component */}
          {showMediaUpload && (
            <div className="mt-4">
              <MediaUpload
                onUploadSuccess={handleMediaUploadSuccess}
                onCancel={() => setShowMediaUpload(false)}
              />
            </div>
          )}
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
