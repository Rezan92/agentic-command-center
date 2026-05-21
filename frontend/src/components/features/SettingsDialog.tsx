"use client";

import React, { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useChatStore } from "@/store/chatStore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Calendar, Database, CheckCircle2, XCircle, Link2, ExternalLink } from "lucide-react";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { connections, fetchConnections } = useChatStore();

  useEffect(() => {
    if (open) {
      fetchConnections();
    }
  }, [open, fetchConnections]);

  const notionConnection = connections.find(c => c.provider === 'NOTION');
  const googleConnection = connections.find(c => c.provider === 'GOOGLE');

  const API_URL = 'http://localhost:3001/api';

  const handleConnect = (provider: string) => {
    // Redirect to backend OAuth route
    window.location.href = `${API_URL}/auth/${provider.toLowerCase()}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] h-[500px] flex flex-col p-0 gap-0 overflow-hidden font-sans">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-2xl font-bold tracking-tight">Settings</DialogTitle>
          <DialogDescription>
            Manage your account preferences and tool integrations.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="connections" className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 border-b">
            <TabsList className="bg-transparent border-b-0 h-12 p-0 gap-6">
              <TabsTrigger 
                value="general" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 h-12"
              >
                General
              </TabsTrigger>
              <TabsTrigger 
                value="appearance" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 h-12"
              >
                Appearance
              </TabsTrigger>
              <TabsTrigger 
                value="connections" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 h-12"
              >
                Connections
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <TabsContent value="general" className="m-0 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base font-semibold">Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive alerts about agent actions and results.
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base font-semibold">Auto-execute Tools</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow agents to run safe tools without confirmation.
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="appearance" className="m-0">
              <p className="text-sm text-muted-foreground">
                Theme settings are available in the sidebar menu.
              </p>
            </TabsContent>

            <TabsContent value="connections" className="m-0 space-y-6">
              <div className="grid gap-4">
                {/* Notion Card */}
                <div className="flex items-center justify-between p-4 border rounded-xl bg-card/50 hover:bg-card transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-black flex items-center justify-center text-white shrink-0">
                      <Database className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base">Notion</span>
                        {notionConnection?.isConnected ? (
                          <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/20 gap-1 font-bold">
                            <CheckCircle2 className="h-3 w-3" />
                            Connected
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground gap-1 font-semibold">
                            <XCircle className="h-3 w-3" />
                            Disconnected
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Sync pages, databases, and meeting notes.
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant={notionConnection?.isConnected ? "outline" : "default"}
                    size="sm"
                    className="font-bold"
                    onClick={() => handleConnect('NOTION')}
                  >
                    {notionConnection?.isConnected ? "Manage" : "Connect"}
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </div>

                {/* Google Calendar Card */}
                <div className="flex items-center justify-between p-4 border rounded-xl bg-card/50 hover:bg-card transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base">Google Calendar</span>
                        {googleConnection?.isConnected ? (
                          <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/20 gap-1 font-bold">
                            <CheckCircle2 className="h-3 w-3" />
                            Connected
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground gap-1 font-semibold">
                            <XCircle className="h-3 w-3" />
                            Disconnected
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Manage events, meetings, and schedules.
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant={googleConnection?.isConnected ? "outline" : "default"}
                    size="sm"
                    className="font-bold"
                    onClick={() => handleConnect('GOOGLE')}
                  >
                    {googleConnection?.isConnected ? "Manage" : "Connect"}
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg border border-dashed border-muted-foreground/30">
                <div className="flex items-start gap-3">
                  <Link2 className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold">Security Note</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      We use OAuth 2.0 to securely access your data. We never see your passwords, 
                      and you can revoke access at any time from your provider settings.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
