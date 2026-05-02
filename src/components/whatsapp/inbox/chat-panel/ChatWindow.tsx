"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  MoreVertical,
  UserPlus,
  RefreshCcw,
  Search,
  Trash2,
  Loader2,
  AlertCircle,
  Phone,
  Mail,
  User,
  RotateCcw,
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

const AVATAR_COLORS = [
  "erix-bg-red-100 erix-text-red-600",
  "erix-bg-blue-100 erix-text-blue-600",
  "erix-bg-green-100 erix-text-green-600",
  "erix-bg-yellow-100 erix-text-yellow-700",
  "erix-bg-purple-100 erix-text-purple-600",
  "erix-bg-pink-100 erix-text-pink-600",
  "erix-bg-indigo-100 erix-text-indigo-600",
  "erix-bg-orange-100 erix-text-orange-600",
  "erix-bg-teal-100 erix-text-teal-600",
  "erix-bg-emerald-100 erix-text-emerald-600",
];

function getAvatarColor(id: string) {
  if (!id) return AVATAR_COLORS[0];
  const hash = id.split("").reduce((acc, c) => c.charCodeAt(0) + acc, 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
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
      if (!isConvertOpen || !chat?.phone) return;
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
  }, [isConvertOpen, chat?.phone, sdk]);

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
      toast.success(isStarred ? "Message starred" : "Message unstarred");
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
      <div className="erix-bg-white erix-flex erix-h-[60px] erix-items-center erix-justify-between erix-px-4 erix-py-2 erix-shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
        <div className="erix-flex erix-items-center erix-gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="erix-ml-2 lg:erix-hidden"
            onClick={onBack}
          >
            <ArrowLeft className="erix-h-5 erix-w-5" />
          </Button>
          <div className="erix-relative">
            <Avatar className="erix-h-10 erix-w-10 erix-ring-1 erix-ring-black/[0.06]">
              <AvatarImage src={chat.profilePicture} alt={chat.name} />
              <AvatarFallback
                className={cn(
                  "erix-font-bold erix-text-sm",
                  getAvatarColor(String(chat.id || chat._id || "")),
                )}
              >
                {(chat.name || "U").slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {chat.isOnline && (
              <span className="erix-absolute erix-bottom-0 erix-right-0 erix-h-3 erix-w-3 erix-rounded-full erix-bg-[#25D366] erix-ring-2 erix-ring-white" />
            )}
          </div>
          <div className="erix-flex erix-flex-col erix-justify-center erix-min-w-0">
            <div className="erix-flex erix-items-center erix-gap-2">
              <h2 className="erix-text-sm erix-leading-none erix-font-semibold erix-truncate">
                {chat.name}
              </h2>
              {chat.leadId && (
                <div className="erix-bg-primary/10 erix-text-primary erix-text-[8px] erix-px-1.5 erix-py-0.5 erix-rounded erix-font-bold erix-uppercase erix-tracking-tighter">
                  CRM
                </div>
              )}
            </div>
            <p className="erix-text-[11px] erix-leading-none erix-truncate erix-font-normal erix-mt-1">
              {chat.isOnline ? (
                <span className="erix-text-[#25D366] erix-font-medium">
                  online
                </span>
              ) : (
                <span className="erix-text-[#667781]">{chat.phone}</span>
              )}
            </p>
          </div>
        </div>

        <div className="erix-flex erix-items-center erix-gap-1">
          <TooltipButton
            variant="ghost"
            size="icon"
            className="erix-text-[#54656f] erix-h-9 erix-w-9"
            tooltip="Search"
          >
            <Search className="erix-h-5 erix-w-5" />
          </TooltipButton>

          <TooltipButton
            variant="ghost"
            size="icon"
            className="erix-text-[#54656f] erix-h-9 erix-w-9"
            tooltip={isLoading ? "Refreshing..." : "Refresh messages"}
            onClick={onRefresh}
            disabled={isLoading}
          >
            <RotateCcw
              className={cn(
                "erix-h-4 erix-w-4",
                isLoading && "erix-animate-spin",
              )}
            />
          </TooltipButton>

          <DropdownMenu>
            <DropdownMenuTrigger
              asChild
              className="data-[state=open]:erix-bg-accent/40 focus-visible:erix-ring-0 focus-visible:erix-outline-0 erix-ring-0 erix-outline-0"
            >
              <TooltipButton
                variant="ghost"
                size="icon"
                className="erix-text-muted-foreground erix-h-9 erix-w-9"
                tooltip="More actions"
              >
                <MoreVertical className="erix-h-4 erix-w-4" />
              </TooltipButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="erix-w-56">
              <DropdownMenuLabel>Conversation Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {!chat.leadId && (
                <DropdownMenuItem
                  onClick={() => setIsConvertOpen(true)}
                  className="erix-gap-2"
                >
                  <UserPlus className="erix-h-4 erix-w-4" />
                  <span>Convert to CRM Lead</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={onRefresh} className="erix-gap-2">
                <RefreshCcw className="erix-h-4 erix-w-4" />
                <span>Sync with Server</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setIsDeleteOpen(true)}
                className="erix-gap-2 erix-text-destructive focus:erix-text-destructive"
              >
                <Trash2 className="erix-h-4 erix-w-4" />
                <span>Delete Forever</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
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
        <DialogContent className="erix-sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>CRM Integration</DialogTitle>
          </DialogHeader>
          {isCheckingLead ? (
            <div className="erix-flex erix-h-40 erix-flex-col erix-items-center erix-justify-center erix-gap-3">
              <Loader2 className="erix-h-8 erix-w-8 erix-animate-spin erix-text-primary" />
              <p className="erix-text-sm erix-text-muted-foreground erix-font-medium">
                Scanning lead database...
              </p>
            </div>
          ) : existingLead ? (
            <div className="erix-space-y-6 erix-py-2">
              <div className="erix-rounded-lg erix-bg-amber-50 erix-border erix-border-amber-200 erix-p-4 erix-space-y-2">
                <div className="erix-flex erix-items-center erix-gap-2 erix-text-amber-800 erix-font-bold erix-text-sm">
                  <AlertCircle className="erix-h-4 erix-w-4" />
                  Exact Match Found
                </div>
                <p className="erix-text-xs erix-text-amber-700 erix-leading-relaxed">
                  The number{" "}
                  <span className="erix-font-bold">{chat.phone}</span> belongs
                  to an existing lead.
                </p>
              </div>

              <div className="erix-flex erix-items-center erix-gap-3 erix-p-4 erix-rounded-xl erix-border erix-bg-muted/50">
                <Avatar className="erix-h-12 erix-w-12">
                  <AvatarFallback className="erix-bg-primary/20 erix-text-primary erix-font-bold text-lg">
                    {(existingLead.firstName?.[0] || "") +
                      (existingLead.lastName?.[0] || "")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="erix-text-sm erix-font-bold">
                    {existingLead.firstName} {existingLead.lastName}
                  </h4>
                  <p className="erix-text-xs erix-text-muted-foreground">
                    {existingLead.email || "No email"}
                  </p>
                </div>
              </div>

              <div className="erix-grid erix-grid-cols-1 erix-gap-2">
                <Button
                  onClick={() => handleConvertToLead(null, existingLead._id)}
                  disabled={isConverting}
                >
                  {isConverting && (
                    <Loader2 className="erix-mr-2 erix-h-4 erix-w-4 erix-animate-spin" />
                  )}
                  Merge Workspace
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsConvertOpen(false)}
                  disabled={isConverting}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <form
              onSubmit={(e) => handleConvertToLead(e)}
              className="erix-space-y-4"
            >
              <div className="erix-space-y-2">
                <Label className="erix-text-[10px] erix-font-bold erix-uppercase erix-tracking-widest erix-text-muted-foreground">
                  Full Name
                </Label>
                <div className="erix-relative">
                  <User className="erix-absolute erix-left-3 erix-top-2.5 erix-h-4 erix-w-4 erix-text-muted-foreground" />
                  <Input
                    value={leadName}
                    onChange={(e) => setLeadName(e.target.value)}
                    placeholder="John Doe"
                    className="erix-pl-9"
                    required
                  />
                </div>
              </div>
              <div className="erix-space-y-2">
                <Label className="erix-text-[10px] erix-font-bold erix-uppercase erix-tracking-widest erix-text-muted-foreground">
                  Email
                </Label>
                <div className="erix-relative">
                  <Mail className="erix-absolute erix-left-3 erix-top-2.5 erix-h-4 erix-w-4 erix-text-muted-foreground" />
                  <Input
                    value={leadEmail}
                    onChange={(e) => setLeadEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="erix-pl-9"
                    type="email"
                  />
                </div>
              </div>
              <DialogFooter className="erix-pt-4">
                <Button
                  type="submit"
                  disabled={isConverting}
                  className="erix-w-full"
                >
                  {isConverting && (
                    <Loader2 className="erix-mr-2 erix-h-4 erix-w-4 erix-animate-spin" />
                  )}
                  Link to CRM
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
            <DialogTitle>Permanent Deletion</DialogTitle>
          </DialogHeader>
          <div className="erix-py-4 erix-text-sm erix-text-muted-foreground erix-leading-relaxed">
            This will permanently remove the conversation with{" "}
            <span className="erix-font-bold erix-text-foreground">
              {chat.name}
            </span>
            . All message history, media, and attachments will be scrubbed from
            our systems.
            <span className="erix-block erix-mt-2 erix-font-bold erix-text-destructive">
              This cannot be undone.
            </span>
          </div>
          <DialogFooter className="erix-gap-2 sm:erix-gap-0">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Abort
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
              {isDeleting ? (
                <Loader2 className="erix-h-4 erix-w-4 erix-animate-spin" />
              ) : (
                "Confirm Deletion"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
