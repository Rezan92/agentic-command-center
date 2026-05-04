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
      // For MVP, we fetch the first conversation found or default to none
      const convRes = await fetch(`${API_URL}/conversations`);
      const conversations = await convRes.json();
      
      if (conversations.length > 0) {
        const activeConv = conversations[0];
        const msgRes = await fetch(`${API_URL}/conversations/${activeConv.id}/messages`);
        const messages = await msgRes.json();
        set({ messages, conversationId: activeConv.id });
      }
    } catch (error) {
      console.error('Failed to fetch chat history:', error);
    }
  },

  sendMessage: async (content) => {
    const { conversationId, messages } = get();
    
    // Optimistically add user message (with temporary ID)
    const tempUserMsg: Message = {
      id: Date.now().toString(),
      role: 'USER',
      content,
      createdAt: new Date().toISOString(),
    };
    
    set({ messages: [...messages, tempUserMsg], isThinking: true });

    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content, conversationId }),
      });

      const data = await response.json();
      
      if (data.message) {
        set((state) => ({
          messages: [...state.messages.filter(m => m.id !== tempUserMsg.id), tempUserMsg, data.message],
          conversationId: data.conversationId,
          isThinking: false,
        }));
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      set({ isThinking: false });
    }
  },

  setThinking: (thinking) => set({ isThinking: thinking }),
}));
