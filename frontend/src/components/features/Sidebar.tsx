"use client";

import React, { useEffect } from "react";
import { useChatStore } from "@/store/chatStore";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Plus, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

export function Sidebar() {
  const { conversations, conversationId, fetchConversations, fetchMessages, startNewChat } = useChatStore();

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return (
    <div className="flex flex-col h-full w-64 bg-muted/30 border-r">
      <div className="p-4">
        <Button 
          onClick={startNewChat} 
          className="w-full justify-start gap-2 shadow-sm" 
          variant="outline"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>
      
      <Separator />

      <ScrollArea className="flex-1 px-2 py-4">
        <div className="flex flex-col gap-1">
          <div className="px-2 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Recent Conversations
          </div>
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => fetchMessages(conv.id)}
              className={cn(
                "flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors text-left group",
                conversationId === conv.id 
                  ? "bg-secondary text-secondary-foreground font-medium" 
                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              <MessageSquare className="h-4 w-4 shrink-0" />
              <span className="truncate flex-1">
                {conv.title || "Untitled Conversation"}
              </span>
            </button>
          ))}
          {conversations.length === 0 && (
            <div className="px-3 py-4 text-xs text-muted-foreground italic">
              No history found.
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
