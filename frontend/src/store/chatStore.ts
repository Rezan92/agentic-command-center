import { create } from 'zustand';

export interface Message {
  id: string;
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  content: string;
  createdAt: string;
}

interface ChatState {
  messages: Message[];
  conversationId: string | null;
  isThinking: boolean;
  fetchHistory: () => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  setThinking: (thinking: boolean) => void;
}

const API_URL = 'http://localhost:3001/api';

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  conversationId: null,
  isThinking: false,

  fetchHistory: async () => {
    try {
      const convRes = await fetch(`${API_URL}/conversations`);
      if (!convRes.ok) throw new Error('Failed to fetch conversations');
      
      const conversations = await convRes.json();
      
      if (conversations.length > 0) {
        const activeConv = conversations[0];
        const msgRes = await fetch(`${API_URL}/conversations/${activeConv.id}/messages`);
        if (!msgRes.ok) throw new Error('Failed to fetch messages');
        
        const messages = await msgRes.json();
        set({ messages, conversationId: activeConv.id });
      }
    } catch (error) {
      console.error('Chat history fetch error:', error);
    }
  },

  sendMessage: async (content) => {
    const { conversationId, messages } = get();
    
    // 1. Add User Message
    const tempUserId = `user-${Date.now()}`;
    const userMsg: Message = {
      id: tempUserId,
      role: 'USER',
      content,
      createdAt: new Date().toISOString(),
    };
    
    // 2. Prepare Assistant Placeholder
    const assistantId = `assistant-${Date.now()}`;
    const assistantMsg: Message = {
      id: assistantId,
      role: 'ASSISTANT',
      content: '',
      createdAt: new Date().toISOString(),
    };

    set({ 
      messages: [...messages, userMsg, assistantMsg], 
      isThinking: true 
    });

    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content, conversationId }),
      });

      if (!response.ok) throw new Error('Failed to send message');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          // DataStream format usually contains parts like '0:"hello "'
          // We'll use a simple regex to extract the text content from parts like 0:"..."
          const matches = chunk.matchAll(/0:"([^"]*)"/g);
          for (const match of matches) {
            accumulatedText += match[1].replace(/\\n/g, '\n');
          }

          set((state) => ({
            messages: state.messages.map((m) =>
              m.id === assistantId ? { ...m, content: accumulatedText } : m
            ),
            isThinking: false
          }));
        }
      }

      // Final sync with backend if needed (optional since we have stream)
      // But we should refresh to get the real IDs from DB eventually
      get().fetchHistory();

    } catch (error) {
      console.error('Stream Error:', error);
      set((state) => ({
        messages: state.messages.filter(m => m.id !== tempUserId && m.id !== assistantId),
        isThinking: false
      }));
    }
  },

  setThinking: (thinking) => set({ isThinking: thinking }),
}));
