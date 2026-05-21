"use client";

import React, { useEffect, useState } from "react";
import { useChatStore } from "@/store/chatStore";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button, buttonVariants } from "@/components/ui/button";
import { 
  Plus, 
  MessageSquare, 
  Settings, 
  Moon, 
  Sun, 
  Monitor, 
  Palette, 
  Pencil, 
  Trash2, 
  Check, 
  X,
  MoreVertical
} from "lucide-react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { SettingsDialog } from "./SettingsDialog";

export function Sidebar() {
  const { 
    conversations, 
    conversationId, 
    fetchConversations, 
    fetchMessages, 
    startNewChat,
    deleteConversation,
    updateConversationTitle 
  } = useChatStore();
  
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  
  // Delete State
  const [deleteId, setDeleteId] = useState<string | null>(null);

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

  const handleStartEdit = (id: string, currentTitle: string | null) => {
    setEditingId(id);
    setEditValue(currentTitle || "");
  };

  const handleSaveEdit = async (id: string) => {
    if (editValue.trim()) {
      await updateConversationTitle(id, editValue.trim());
    }
    setEditingId(null);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteConversation(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <div className="flex flex-col h-full w-64 bg-muted/30 border-r font-sans relative">
      {/* Top Header with New Chat and Settings */}
      <div className="p-4 flex flex-col gap-2 shrink-0">
        <Button 
          onClick={startNewChat} 
          className="w-full justify-start gap-2 shadow-sm font-semibold h-11" 
          variant="default"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </Button>

        <DropdownMenu modal={false}>
          <DropdownMenuTrigger 
            className={cn(
              buttonVariants({ variant: "outline" }), 
              "w-full justify-start gap-2 h-10 px-3 hover:bg-muted cursor-pointer font-medium border-border/50 shadow-sm"
            )}
          >
            <Settings className="h-4 w-4" />
            <span className="text-sm">Settings & Tools</span>
          </DropdownMenuTrigger>
          
          <DropdownMenuContent align="start" side="bottom" className="w-56 mt-1 p-1 font-sans">
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
                <Palette className="h-4 w-4 text-muted-foreground" />
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
      </div>
      
      <Separator />

      <ScrollArea className="flex-1 px-2 py-4">
        <div className="flex flex-col gap-1">
          <div className="px-2 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            History
          </div>
          {conversations.map((conv) => (
            <div key={conv.id} className="relative group">
              {editingId === conv.id ? (
                <div className="flex items-center gap-1 px-2 py-1 bg-secondary/50 rounded-md">
                  <Input 
                    value={editValue} 
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(conv.id)}
                    className="h-8 py-0 px-2 text-sm focus-visible:ring-1"
                    autoFocus
                  />
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleSaveEdit(conv.id)}>
                    <Check className="h-3 w-3 text-green-500" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingId(null)}>
                    <X className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              ) : (
                <button
                  onClick={() => fetchMessages(conv.id)}
                  className={cn(
                    "flex items-center gap-3 w-full px-3 py-2.5 text-sm rounded-md transition-all text-left pr-16",
                    conversationId === conv.id 
                      ? "bg-secondary text-secondary-foreground font-medium shadow-sm" 
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  <MessageSquare className="h-4 w-4 shrink-0 opacity-70" />
                  <span className="truncate flex-1">
                    {conv.title || "Untitled Chat"}
                  </span>
                </button>
              )}

              {/* Action Buttons on Hover */}
              {editingId !== conv.id && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-8 w-8 hover:bg-background/80"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartEdit(conv.id, conv.title);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive text-muted-foreground/60"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteId(conv.id);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
          ))}
          {conversations.length === 0 && (
            <div className="px-3 py-8 text-xs text-muted-foreground italic text-center font-medium">
              Start a new conversation to see it here.
            </div>
          )}
        </div>
      </ScrollArea>

      <Separator />

      {/* Footer Version Info */}
      <div className="p-4 text-[10px] text-muted-foreground/50 text-center font-medium">
        Agentic Command Center v0.1 • Alpha
      </div>

      {/* Dialogs */}
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="font-sans">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the chat history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
