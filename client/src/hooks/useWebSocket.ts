import { useEffect, useRef, useState, useCallback } from 'react';
import type { Message, BoardMember } from '@shared/schema';

interface WebSocketMessage {
  type: 'message_sent' | 'ai_response' | 'member_typing' | 'member_stop_typing' | 'error';
  message?: Message;
  member?: BoardMember;
  memberId?: string;
  memberName?: string;
  error?: string;
}

interface UseWebSocketProps {
  onMessage?: (message: Message) => void;
  onAIResponse?: (message: Message, member: BoardMember) => void;
  onMemberTyping?: (memberId: string, memberName: string) => void;
  onMemberStopTyping?: (memberId: string) => void;
  onError?: (error: string) => void;
}

export function useWebSocket({
  onMessage,
  onAIResponse,
  onMemberTyping,
  onMemberStopTyping,
  onError
}: UseWebSocketProps = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [typingMembers, setTypingMembers] = useState<Set<string>>(new Set());
  const wsRef = useRef<WebSocket | null>(null);

  // Stable references for callbacks
  const stableCallbacks = useRef({ onMessage, onAIResponse, onMemberTyping, onMemberStopTyping, onError });
  stableCallbacks.current = { onMessage, onAIResponse, onMemberTyping, onMemberStopTyping, onError };
  
  const connectRef = useRef<boolean>(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (connectRef.current) return;
    connectRef.current = true;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setConnectionError(null);
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      ws.onmessage = (event) => {
        try {
          const data: WebSocketMessage = JSON.parse(event.data);
          const callbacks = stableCallbacks.current;
          
          switch (data.type) {
            case 'message_sent':
              if (data.message && callbacks.onMessage) {
                callbacks.onMessage(data.message);
              }
              break;
              
            case 'ai_response':
              if (data.message && data.member && callbacks.onAIResponse) {
                callbacks.onAIResponse(data.message, data.member);
              }
              break;
              
            case 'member_typing':
              if (data.memberId && data.memberName) {
                setTypingMembers(prev => new Set(prev).add(data.memberId!));
                if (callbacks.onMemberTyping) {
                  callbacks.onMemberTyping(data.memberId, data.memberName);
                }
              }
              break;
              
            case 'member_stop_typing':
              if (data.memberId) {
                setTypingMembers(prev => {
                  const newSet = new Set(prev);
                  newSet.delete(data.memberId!);
                  return newSet;
                });
                if (callbacks.onMemberStopTyping) {
                  callbacks.onMemberStopTyping(data.memberId);
                }
              }
              break;
              
            case 'error':
              const errorMsg = data.error || 'WebSocket error';
              setConnectionError(errorMsg);
              if (callbacks.onError) {
                callbacks.onError(errorMsg);
              }
              break;
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        setIsConnected(false);
        connectRef.current = false;
        
        // Don't reconnect if it was a normal closure
        if (event.code !== 1000 && event.code !== 1001) {
          // Attempt to reconnect after a delay
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, 3000);
        }
      };

      ws.onerror = (error) => {
        setConnectionError('WebSocket connection error');
        console.error('WebSocket error:', error);
        connectRef.current = false;
      };

    } catch (error) {
      setConnectionError('Failed to create WebSocket connection');
      console.error('WebSocket creation error:', error);
      connectRef.current = false;
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      connectRef.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounting');
      }
    };
  }, [connect]);

  const sendMessage = useCallback((conversationId: string, content: string, userId: string, boardMemberIds: string[]) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'chat_message',
        conversationId,
        content,
        userId,
        boardMemberIds
      }));
    } else {
      console.error('WebSocket is not connected, current state:', wsRef.current?.readyState);
      if (!isConnected) {
        connect();
      }
    }
  }, [isConnected, connect]);

  return {
    isConnected,
    connectionError,
    typingMembers,
    sendMessage
  };
}
