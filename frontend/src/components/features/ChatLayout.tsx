"use client";

import React from "react";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";

export function ChatLayout() {
  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto p-4 md:p-6">
      <header className="flex items-center justify-between py-4 border-b">
        <h1 className="text-xl font-bold tracking-tight">Agentic AI Command Center</h1>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Engine Online</span>
        </div>
      </header>

      <main className="flex-1 overflow-hidden py-4">
        <MessageList />
      </main>

      <footer className="pt-4">
        <MessageInput />
      </footer>
    </div>
  );
}
