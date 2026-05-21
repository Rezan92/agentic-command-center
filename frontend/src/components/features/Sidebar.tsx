"use client";

import React, { useEffect, useState } from "react";
import { useChatStore } from "@/store/chatStore";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button, buttonVariants } from "@/components/ui/button";
import { Plus, MessageSquare, Settings, Moon, Sun, Monitor, Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { SettingsDialog } from "./SettingsDialog";

export function Sidebar() {
  const { conversations, conversationId, fetchConversations, fetchMessages, startNewChat } = useChatStore();
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchConversations();
  }, [fetchConversations]);

  if (!mounted) {
    return (
      <div className="flex flex-col h-full w-64 bg-muted/30 border-r animate-pulse">
        <div className="p-4"><div className="h-10 bg-muted rounded-md" /></div>
        <Separator />
        <div className="flex-1" />
      </div>
    );
  }

  const currentTheme = theme || 'system';

  return (
    <div className="flex flex-col h-full w-64 bg-muted/30 border-r font-sans">
      <div className="p-4">
        <Button 
          onClick={startNewChat} 
          className="w-full justify-start gap-2 shadow-sm font-medium" 
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
            <div className="px-3 py-4 text-xs text-muted-foreground italic text-center font-medium">
              No history found.
            </div>
          )}
        </div>
      </ScrollArea>

      <Separator />

      {/* Settings Section at Bottom */}
      <div className="p-4">
        <DropdownMenu modal={false}>
          {/* 
            FIX: We no longer use 'asChild' with shadcn Button.
            Instead, we style the DropdownMenuTrigger directly using buttonVariants.
            This guarantees only ONE <button> tag is rendered.
          */}
          <DropdownMenuTrigger 
            className={cn(
              buttonVariants({ variant: "ghost" }), 
              "w-full justify-start gap-2 h-10 px-3 hover:bg-muted cursor-pointer"
            )}
          >
            <Settings className="h-4 w-4" />
            <span className="text-sm">Settings</span>
          </DropdownMenuTrigger>
          
          <DropdownMenuContent align="start" side="top" className="w-56 mb-2 p-1 font-sans">
            {/* Using a div instead of DropdownMenuLabel to avoid missing Group context error */}
            <div className="px-2 py-2 text-sm font-bold text-foreground">User Settings</div>
            <DropdownMenuSeparator />
            
            <DropdownMenuItem 
              onClick={() => setSettingsOpen(true)}
              className="flex items-center gap-2 px-2 py-1.5 text-sm outline-none focus:bg-accent rounded-sm cursor-pointer font-medium"
            >
              <Settings className="h-4 w-4 text-muted-foreground" />
              <span>Integrations</span>
            </DropdownMenuItem>

            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="flex items-center gap-2 px-2 py-1.5 text-sm outline-none focus:bg-accent rounded-sm cursor-default">
                <Palette className="h-4 w-4" />
                <span>Appearance</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent className="p-1 font-sans">
                  <DropdownMenuItem onClick={() => setTheme("light")} className="flex items-center gap-2 px-2 py-1.5 text-sm outline-none focus:bg-accent rounded-sm cursor-pointer">
                    <Sun className="h-4 w-4" />
                    <span>Light Mode</span>
                    {currentTheme === "light" && <span className="ml-auto text-xs font-bold text-primary">✓</span>}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("dark")} className="flex items-center gap-2 px-2 py-1.5 text-sm outline-none focus:bg-accent rounded-sm cursor-pointer">
                    <Moon className="h-4 w-4" />
                    <span>Dark Mode</span>
                    {currentTheme === "dark" && <span className="ml-auto text-xs font-bold text-primary">✓</span>}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("system")} className="flex items-center gap-2 px-2 py-1.5 text-sm outline-none focus:bg-accent rounded-sm cursor-pointer">
                    <Monitor className="h-4 w-4" />
                    <span>System</span>
                    {currentTheme === "system" && <span className="ml-auto text-xs font-bold text-primary">✓</span>}
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>

            <DropdownMenuSeparator />
            <div className="px-2 py-1.5 text-[10px] text-muted-foreground uppercase tracking-widest font-semibold opacity-70">
              Agentic Command Center v0.1
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      </div>
    </div>
  );
}
