"use client";

import React from "react";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { Sidebar } from "./Sidebar";

export function ChatLayout() {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar Component */}
      <Sidebar />

      {/* Main Chat Area */}
      <div className="flex flex-col flex-1 max-w-4xl mx-auto h-full px-4 md:px-6">
        <header className="flex items-center justify-between py-4 border-b shrink-0">
          <h1 className="text-xl font-bold tracking-tight">Agentic AI Command Center</h1>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Engine Online</span>
          </div>
        </header>

        <main className="flex-1 overflow-hidden">
          <MessageList />
        </main>

        <footer className="py-4 shrink-0">
          <MessageInput />
        </footer>
      </div>
    </div>
  );
}
