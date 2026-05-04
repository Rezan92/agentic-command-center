"use client";

import React, { useState } from "react";
import { useChatStore } from "@/store/chatStore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

export function MessageInput() {
  const [value, setValue] = useState("");
  const { sendMessage, isThinking } = useChatStore();

  const handleSend = async () => {
    if (!value.trim() || isThinking) return;

    const content = value;
    setValue("");
    await sendMessage(content);
  };

  return (
    <div className="flex w-full items-center space-x-2">
      <Input
        type="text"
        placeholder="Type a command (e.g., 'Reschedule my 3pm meeting')..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSend()}
        disabled={isThinking}
        className="flex-1"
      />
      <Button 
        size="icon" 
        onClick={handleSend} 
        disabled={!value.trim() || isThinking}
        className="shrink-0"
      >
        <Send className="h-4 w-4" />
        <span className="sr-only">Send</span>
      </Button>
    </div>
  );
}
