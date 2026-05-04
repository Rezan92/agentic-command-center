import { create } from 'zustand';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: Date;
}

interface ChatState {
  messages: Message[];
  isThinking: boolean;
  addMessage: (message: Omit<Message, 'id' | 'createdAt'>) => void;
  setThinking: (thinking: boolean) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I am your AI Command Center. How can I help you today?',
      createdAt: new Date(),
    },
  ],
  isThinking: false,
  addMessage: (msg) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          ...msg,
          id: Math.random().toString(36).substring(7),
          createdAt: new Date(),
        },
      ],
    })),
  setThinking: (thinking) => set({ isThinking: thinking }),
}));
