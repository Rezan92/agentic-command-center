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

    console.log('Sending message to backend...');

    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content, conversationId }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server Error (${response.status}): ${errorText}`);
      }

      console.log('Stream connection established. Reading chunks...');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';

      if (!reader) throw new Error('Response body has no reader');

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log('Stream complete.');
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        console.log('Received chunk:', chunk);
        accumulatedText += chunk;

        set((state) => ({
          messages: state.messages.map((m) =>
            m.id === assistantId ? { ...m, content: accumulatedText } : m
          ),
          // We don't set isThinking to false here yet, 
          // because we want to wait for the first chunk or completion
        }));
      }

      // 3. Reset thinking state after stream finishes
      set({ isThinking: false });

      // 4. Final sync with backend to get real database IDs
      get().fetchHistory();

    } catch (error) {
      console.error('Frontend Chat Error:', error);
      // Rollback UI
      set((state) => ({
        messages: state.messages.filter(m => m.id !== tempUserId && m.id !== assistantId),
        isThinking: false
      }));
      alert(`Chat Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  setThinking: (thinking) => set({ isThinking: thinking }),
}));
