import { create } from 'zustand';

export interface Message {
  id: string;
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  content: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  title: string | null;
  updatedAt: string;
}

export interface Connection {
  provider: 'GOOGLE' | 'NOTION';
  isConnected: boolean;
}

interface ChatState {
  messages: Message[];
  conversations: Conversation[];
  conversationId: string | null;
  connections: Connection[];
  isThinking: boolean;
  
  // Actions
  fetchConversations: () => Promise<void>;
  fetchMessages: (id: string) => Promise<void>;
  fetchConnections: () => Promise<void>;
  startNewChat: () => void;
  sendMessage: (content: string) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  updateConversationTitle: (id: string, title: string) => Promise<void>;
  setThinking: (thinking: boolean) => void;
}

const API_URL = 'http://localhost:3001/api';

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  conversations: [],
  conversationId: null,
  connections: [
    { provider: 'GOOGLE', isConnected: false },
    { provider: 'NOTION', isConnected: false },
  ],
  isThinking: false,

  fetchConversations: async () => {
    try {
      const res = await fetch(`${API_URL}/conversations`);
      if (!res.ok) throw new Error('Failed to fetch conversations');
      const data = await res.json();
      set({ conversations: data });
      
      // If we don't have an active conversation but there are some, load the first one
      if (!get().conversationId && data.length > 0) {
        get().fetchMessages(data[0].id);
      }
    } catch (error) {
      console.error('Fetch conversations error:', error);
    }
  },

  fetchMessages: async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/conversations/${id}/messages`);
      if (!res.ok) throw new Error('Failed to fetch messages');
      const messages = await res.json();
      set({ messages, conversationId: id });
    } catch (error) {
      console.error('Fetch messages error:', error);
    }
  },

  fetchConnections: async () => {
    try {
      const res = await fetch(`${API_URL}/auth/status`);
      if (!res.ok) throw new Error('Failed to fetch connections');
      const data = await res.json();
      set({ connections: data });
    } catch (error) {
      console.error('Fetch connections error:', error);
    }
  },

  startNewChat: () => {
    set({ messages: [], conversationId: null });
  },

  deleteConversation: async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/conversations/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete conversation');
      
      const { conversationId } = get();
      if (conversationId === id) {
        set({ conversationId: null, messages: [] });
      }
      
      await get().fetchConversations();
    } catch (error) {
      console.error('Delete conversation error:', error);
    }
  },

  updateConversationTitle: async (id: string, title: string) => {
    try {
      const res = await fetch(`${API_URL}/conversations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) throw new Error('Failed to update conversation title');
      
      await get().fetchConversations();
    } catch (error) {
      console.error('Update title error:', error);
    }
  },

  sendMessage: async (content) => {
    const { conversationId, messages } = get();
    
    // 1. Add User Message (Optimistic)
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

          const chunk = decoder.decode(value, { stream: true });
          accumulatedText += chunk;

          set((state) => ({
            messages: state.messages.map((m) =>
              m.id === assistantId ? { ...m, content: accumulatedText } : m
            ),
          }));
        }
      }

      set({ isThinking: false });
      
      // Refresh conversations list (in case a new one was created)
      get().fetchConversations();
      
      // If it was a new chat, we need to capture the real conversationId from the first message
      // Note: Backend returns { conversationId, message } in Epic 2, but v3 stream changed this.
      // We'll rely on fetchConversations and fetchMessages for full sync.

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
