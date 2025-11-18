import { useState, useCallback, useRef, useEffect } from 'react';
import { SSEClient } from '../lib/sseClient';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface UseChatStreamOptions {
  sessionId?: string;
  apiUrl?: string;
}

export function useChatStream(options: UseChatStreamOptions = {}) {
  const { sessionId = 'default', apiUrl = '/api/chat' } = options;
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sseClientRef = useRef<SSEClient | null>(null);
  const currentMessageRef = useRef<string>('');
  const currentMessageIdRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      sseClientRef.current?.close();
    };
  }, []);

  const sendMessage = useCallback(
    async (message: string) => {
      if (!message.trim() || isLoading) {
        return;
      }

      // Add user message
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: message.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setError(null);

      // Create assistant message placeholder
      const assistantMessageId = `assistant-${Date.now()}`;
      currentMessageIdRef.current = assistantMessageId;
      currentMessageRef.current = '';

      const assistantMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Create SSE client
      const sseClient = new SSEClient();
      sseClientRef.current = sseClient;

      // Set up event listeners BEFORE connecting to avoid missing early events
      // Handle token events
      sseClient.on('token', (data: string) => {
        console.log('[Token received]', data); // Debug log
        // Accept any data including empty strings (tokens can be spaces/newlines)
        if (data !== null && data !== undefined) {
          currentMessageRef.current += data;
          console.log('[Current content]', currentMessageRef.current.substring(0, 100)); // Debug log
          
          setMessages((prev) => {
            const updated = prev.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, content: currentMessageRef.current }
                : msg
            );
            console.log('[Updated messages count]', updated.length, 'Assistant ID:', assistantMessageId); // Debug log
            return updated;
          });
        }
      });

      // Handle tool calls
      sseClient.on('tool_call', (data: string) => {
        try {
          const toolData = JSON.parse(data);
          console.log('Tool called:', toolData);
        } catch (e) {
          console.error('Error parsing tool_call:', e);
        }
      });

      // Handle tool results
      sseClient.on('tool_result', (data: string) => {
        console.log('Tool result:', data);
      });

      // Handle errors
      sseClient.on('error', (data: string) => {
        try {
          const errorData = JSON.parse(data);
          setError(errorData.error || 'An error occurred');
          setIsLoading(false);
        } catch (e) {
          setError(data || 'An error occurred');
          setIsLoading(false);
        }
      });

      // Handle completion
      sseClient.on('done', () => {
        setIsLoading(false);
        sseClient.clearListeners();
        sseClientRef.current = null;
      });

      // Connect to SSE endpoint AFTER setting up listeners
      sseClient.connect(apiUrl, {
        message: userMessage.content,
        sessionId,
      });
    },
    [isLoading, sessionId, apiUrl]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    sseClientRef.current?.clearListeners();
    sseClientRef.current = null;
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
  };
}

