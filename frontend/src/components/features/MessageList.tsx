"use client";

import React, { useEffect, useRef } from "react";
import { useChatStore } from "@/store/chatStore";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { User, Bot } from "lucide-react";

export function MessageList() {
  const { messages, isThinking } = useChatStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, isThinking]);

  return (
    <ScrollArea className="h-full pr-4" ref={scrollRef}>
      <div className="flex flex-col gap-6 py-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex gap-3",
              message.role === "USER" ? "flex-row-reverse" : "flex-row"
            )}
          >
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border shadow-sm",
                message.role === "USER" ? "bg-primary text-primary-foreground" : "bg-muted"
              )}
            >
              {message.role === "USER" ? (
                <User className="h-4 w-4" />
              ) : (
                <Bot className="h-4 w-4" />
              )}
            </div>
            <Card
              className={cn(
                "px-4 py-2 max-w-[80%] text-sm shadow-sm",
                message.role === "USER"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background"
              )}
            >
              {message.content}
            </Card>
          </div>
        ))}

        {isThinking && (
          <div className="flex gap-3 flex-row">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border bg-muted shadow-sm">
              <Bot className="h-4 w-4" />
            </div>
            <Card className="px-4 py-2 bg-background text-sm shadow-sm italic text-muted-foreground">
              Thinking...
            </Card>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
