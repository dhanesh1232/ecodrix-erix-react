"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  MoreVertical,
  UserPlus,
  RefreshCcw,
  Trash2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../../../ui/avatar";
import { Button } from "../../../ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../../ui/dropdown-menu";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";
import { TooltipButton } from "../../../ui/tooltip-button";
import { useErixClient } from "../../../../context/ErixProvider";
import { useErixToast } from "../../../../toast/useErixToast";
import { cn } from "../../../../lib/utils";
import { MessageInput } from "./MessageInput";
import { MessageList } from "./MessageList";

interface ChatWindowProps {
  chat: any;
  messages: any[];
  onBack: () => void;
  className?: string;
  onSendMessage?: (
    text?: string,
    mediaUrl?: string,
    mediaType?: string,
    templateName?: string,
    templateLanguage?: string,
    variables?: any[],
    replyToId?: string,
  ) => Promise<void>;
  conversations: any[];
  onForwardMessage?: (
    message: any,
    targetConversationId: string,
  ) => Promise<void>;
  onDeleteConversation?: (id: string) => Promise<void>;
  onStartNewChat?: () => void;
  hasMore?: boolean;
  isFetchingMore?: boolean;
  onLoadMore?: () => void;
  isLoading?: boolean;
  onRefresh?: () => Promise<void>;
}

export function ChatWindow({
  chat,
  messages,
  onBack,
  className,
  onSendMessage,
  conversations,
  onForwardMessage,
  onDeleteConversation,
  onStartNewChat,
  hasMore,
  isFetchingMore,
  onLoadMore,
  isLoading,
  onRefresh,
}: ChatWindowProps) {
  const sdk = useErixClient();
  const toast = useErixToast();
  const [isSending, setIsSending] = useState(false);
  const [isConvertOpen, setIsConvertOpen] = useState(false);
  const [leadName, setLeadName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [isConverting, setIsConverting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [existingLead, setExistingLead] = useState<any>(null);
  const [isCheckingLead, setIsCheckingLead] = useState(false);

  useEffect(() => {
    async function checkLead() {
      if (!isConvertOpen || !chat.phone) return;
      setIsCheckingLead(true);
      try {
        const result = await sdk.crm.leads.retrieveByPhone<any>(chat.phone);
        if (result.success && result.data) {
          setExistingLead(result.data);
        } else {
          setExistingLead(null);
        }
      } catch (err) {
        setExistingLead(null);
      } finally {
        setIsCheckingLead(false);
      }
    }
    checkLead();
  }, [isConvertOpen, chat.phone, sdk]);

  useEffect(() => {
    if (isConvertOpen && chat) {
      setLeadName((chat.name || "").startsWith("Name-") ? "" : chat.name || "");
      setLeadEmail("");
    }
  }, [isConvertOpen, chat]);

  const handleConvertToLead = async (
    e: React.FormEvent | null,
    mergeLeadId?: string,
  ) => {
    e?.preventDefault?.();
    setIsConverting(true);
    try {
      const chatId = chat.id || chat._id;
      const result = await sdk.whatsapp.conversations.linkLead<any>(
        chatId,
        mergeLeadId || "",
        mergeLeadId ? undefined : { name: leadName, email: leadEmail },
      );

      if (!result.success) throw new Error(result.error || "Failed");

      toast.success(
        mergeLeadId
          ? "Conversation merged into existing lead"
          : "Converted to lead successfully",
      );
      setIsConvertOpen(false);
      onRefresh?.();
    } catch (err: any) {
      toast.error(err.message || "Failed to convert");
    } finally {
      setIsConverting(false);
    }
  };

  const handleToggleStar = async (message: any) => {
    try {
      const isStarred = !message.isStarred;
      const result = await sdk.whatsapp.messages.star<any>(
        message.id || message._id,
        isStarred,
      );
      if (!result.success)
        throw new Error(result.error || "Failed to toggle star");
      const data = result.data?.data || result.data;
      toast.success(data.isStarred ? "Message starred" : "Message unstarred");
    } catch (err: any) {
      toast.error(err.message || "Failed to update star");
    }
  };

  const handleReactMessage = async (message: any, reaction: string) => {
    try {
      const result = await sdk.whatsapp.messages.react<any>(
        message.id || message._id,
        reaction,
      );
      if (!result.success) throw new Error(result.error || "Failed to react");
      toast.success("Reaction updated");
    } catch (err: any) {
      toast.error(err.message || "Failed to send reaction");
    }
  };

  if (!chat) return null;

  return (
    <div
      className={cn(
        "erix-bg-[#f0f2f5] erix-flex erix-flex-1 erix-flex-col erix-max-h-full erix-min-w-0 erix-group",
        className,
      )}
    >
      {/* Chat Header */}
      <div className="erix-border-border erix-bg-[#f0f2f5] erix-flex erix-h-[60px] erix-items-center erix-justify-between erix-border-b erix-p-3">
        <div className="erix-flex erix-items-center erix-gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="erix--erix-ml-2 lg:erix-hidden"
            onClick={onBack}
          >
            <ArrowLeft className="erix-h-5 erix-w-5" />
          </Button>
          <Avatar className="erix-h-10 erix-w-10">
            <AvatarImage src={chat.profilePicture} alt={chat.name} />
            <AvatarFallback className="erix-bg-primary/10 erix-text-primary">
              {chat.avatar || (chat.name || "U").slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="erix-flex erix-flex-col erix-justify-center erix-min-w-0">
            <h2 className="erix-text-sm erix-leading-none erix-font-semibold erix-truncate">
              {chat.name}
            </h2>
            <p className="erix-text-muted-foreground erix-mt-1 erix-text-[10px] erix-leading-none erix-truncate">
              {chat.phone}
            </p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger
            asChild
            className="data-[state=open]:erix-bg-accent/40 focus-visible:erix-ring-0 focus-visible:erix-outline-0 erix-ring-0 erix-outline-0"
          >
            <TooltipButton
              variant="ghost"
              size="icon"
              className="erix-text-muted-foreground"
              tooltip="More actions"
              aria-label={`More actions for ${chat.name}`}
            >
              <MoreVertical className="erix-h-4 erix-w-4" />
            </TooltipButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="erix-w-48">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {!chat.leadId && (
              <DropdownMenuItem
                onClick={() => setIsConvertOpen(true)}
                className="erix-gap-2"
              >
                <UserPlus className="erix-h-4 erix-w-4" />
                <span>Convert to Lead</span>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={onRefresh} className="erix-gap-2">
              <RefreshCcw className="erix-h-4 erix-w-4" />
              <span>Refresh</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => setIsDeleteOpen(true)}
              className="erix-gap-2 erix-text-destructive focus:erix-text-destructive"
            >
              <Trash2 className="erix-h-4 erix-w-4" />
              <span>Delete Conversation</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Chat Messages */}
      <MessageList
        messages={messages}
        chat={chat}
        setReplyingTo={setReplyingTo}
        onSendMessage={onSendMessage}
        onToggleStar={handleToggleStar}
        onReactMessage={handleReactMessage}
        isSending={isSending}
        conversations={conversations}
        onForwardMessage={onForwardMessage}
        hasMore={hasMore}
        isFetchingMore={isFetchingMore}
        onLoadMore={onLoadMore}
        isLoading={isLoading}
      />

      <MessageInput
        chat={chat}
        onSendMessage={onSendMessage}
        replyingTo={replyingTo}
        setReplyingTo={setReplyingTo}
        isSending={isSending}
        setIsSending={setIsSending}
      />

      {/* Dialogs */}
      <Dialog open={isConvertOpen} onOpenChange={setIsConvertOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convert to Lead</DialogTitle>
          </DialogHeader>
          {isCheckingLead ? (
            <div className="erix-flex erix-h-40 erix-flex-col erix-items-center erix-justify-center erix-gap-3">
              <Loader2 className="erix-h-8 erix-w-8 erix-animate-spin erix-text-primary" />
              <p className="erix-text-sm erix-text-muted-foreground erix-font-medium">
                Checking for existing lead...
              </p>
            </div>
          ) : existingLead ? (
            <div className="erix-space-y-6 erix-py-2">
              <div className="erix-rounded-lg erix-bg-amber-50 erix-border erix-border-amber-200 erix-p-4 erix-space-y-2">
                <div className="erix-flex erix-items-center erix-gap-2 erix-text-amber-800 erix-font-semibold erix-text-sm">
                  <AlertCircle className="erix-h-4 erix-w-4" />
                  Lead Already Exists
                </div>
                <p className="erix-text-xs erix-text-amber-700 erix-leading-relaxed">
                  A lead with the phone number{" "}
                  <span className="erix-font-bold">{chat.phone}</span> is
                  already registered in your CRM.
                </p>
              </div>

              <div className="erix-space-y-3">
                <div className="erix-flex erix-items-center erix-gap-3 erix-p-3 erix-rounded-md erix-border erix-border-border erix-bg-muted/30">
                  <div className="erix-h-10 erix-w-10 erix-rounded-full erix-bg-primary/10 erix-text-primary erix-flex erix-items-center erix-justify-center erix-font-bold erix-text-sm">
                    {(existingLead.firstName?.[0] || "") +
                      (existingLead.lastName?.[0] || "")}
                  </div>
                  <div>
                    <h4 className="erix-text-sm erix-font-bold erix-text-foreground">
                      {existingLead.firstName} {existingLead.lastName}
                    </h4>
                    <p className="erix-text-xs erix-text-muted-foreground">
                      {existingLead.email || "No email provided"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="erix-flex erix-flex-col erix-gap-2">
                <Button
                  onClick={() => handleConvertToLead(null, existingLead._id)}
                  disabled={isConverting}
                  className="erix-w-full erix-h-11"
                >
                  {isConverting && (
                    <Loader2 className="erix-mr-2 erix-h-4 erix-w-4 erix-animate-spin" />
                  )}
                  Merge Conversation into Lead
                </Button>
                <Button
                  variant="erix-outline"
                  onClick={() => setIsConvertOpen(false)}
                  disabled={isConverting}
                  className="erix-w-full erix-h-11"
                >
                  Skip & Close
                </Button>
              </div>
              <p className="erix-text-[10px] erix-text-center erix-text-muted-foreground erix-uppercase erix-tracking-widest erix-font-medium">
                You cannot create duplicate leads with the same number
              </p>
            </div>
          ) : (
            <form
              onSubmit={(e) => handleConvertToLead(e)}
              className="erix-space-y-4"
            >
              <div className="erix-space-y-2">
                <Label htmlFor="leadName">Full Name</Label>
                <Input
                  id="leadName"
                  value={leadName}
                  placeholder="Enter contact name"
                  onChange={(e) => setLeadName(e.target.value)}
                  required
                />
              </div>
              <div className="erix-space-y-2">
                <Label htmlFor="leadEmail">Email (Optional)</Label>
                <Input
                  id="leadEmail"
                  type="email"
                  placeholder="email@example.com"
                  value={leadEmail}
                  onChange={(e) => setLeadEmail(e.target.value)}
                />
              </div>
              <DialogFooter className="erix-pt-2">
                <Button
                  type="button"
                  variant="erix-outline"
                  onClick={() => setIsConvertOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isConverting}>
                  {isConverting && (
                    <Loader2 className="erix-mr-2 erix-h-4 erix-w-4 erix-animate-spin" />
                  )}
                  Save & Link Lead
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Conversation</DialogTitle>
          </DialogHeader>
          <div className="erix-py-4 erix-text-sm erix-text-muted-foreground">
            Are you sure you want to delete this conversation with{" "}
            <span className="erix-font-semibold erix-text-foreground">
              {chat.name}
            </span>
            ? This action cannot be undone and all messages will be permanently
            removed.
          </div>
          <DialogFooter>
            <Button variant="erix-outline" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={isDeleting}
              onClick={async () => {
                setIsDeleting(true);
                try {
                  await onDeleteConversation?.(chat.id || chat._id);
                  setIsDeleteOpen(false);
                } finally {
                  setIsDeleting(false);
                }
              }}
            >
              {isDeleting && (
                <Loader2 className="erix-mr-2 erix-h-4 erix-w-4 erix-animate-spin" />
              )}
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
