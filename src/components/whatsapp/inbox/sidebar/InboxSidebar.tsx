"use client";

import { useState } from "react";
import {
  Search,
  Trash2,
  Send,
  Plus,
  MessageSquare,
  Loader2,
  Check,
  CheckCheck,
  ChevronDown,
  Image as ImageIcon,
  Video,
  Mic,
  FileText,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../../../ui/avatar";
import { Button } from "../../../ui/button";
import { Checkbox } from "../../../ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../ui/dialog";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";
import { StyledPhoneInput } from "../../../ui/phone-input";
import { ScrollArea } from "../../../ui/scroll-area";
import { TooltipButton } from "../../../ui/tooltip-button";
import { useErixClient } from "../../../../context/ErixProvider";
import { useErixToast } from "../../../../toast/useErixToast";
import { useErixNavigate } from "../../../../routing/RouterContext";
import { cn } from "../../../../lib/utils";
import { BroadcastDialog } from "./BroadcastDialog";

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
  const hash = id.split("").reduce((acc, char) => char.charCodeAt(0) + acc, 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

interface InboxSidebarProps {
  conversations: any[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  className?: string;
  isLoading?: boolean;
  isNewChatOpen?: boolean;
  setIsNewChatOpen?: (open: boolean) => void;
  hasMoreConversations?: boolean;
  isFetchingMoreConversations?: boolean;
  onLoadMoreConversations?: () => void;
}

function FormattedText({ text }: { text: string }) {
  if (!text) return null;

  const parts = text.split(/(\*[^*]+\*)/g);

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("*") && part.endsWith("*")) {
          return (
            <strong key={i} className="erix-font-bold">
              {part.slice(1, -1)}
            </strong>
          );
        }
        return part;
      })}
    </>
  );
}

export function InboxSidebar({
  conversations,
  selectedId,
  onSelect,
  className,
  isLoading,
  isNewChatOpen = false,
  setIsNewChatOpen,
  hasMoreConversations = false,
  isFetchingMoreConversations = false,
  onLoadMoreConversations,
}: InboxSidebarProps) {
  const navigate = useErixNavigate();
  const sdk = useErixClient();
  const toast = useErixToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [newChatPhone, setNewChatPhone] = useState("");
  const [newChatName, setNewChatName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const filteredConversations = conversations.filter((c) =>
    (c.name || "").toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleCreateChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatPhone) {
      toast.error("Phone number is required");
      return;
    }

    setIsCreating(true);
    try {
      const result = await sdk.whatsapp.conversations.create<any>({
        phone: newChatPhone,
        name: newChatName,
      });

      if (!result.success) {
        throw new Error((result as any).error || "Failed to create chat");
      }
      const data = result.data?.data || result.data;

      onSelect(data._id || data.id);
      setIsNewChatOpen?.(false);
      setNewChatPhone("");
      setNewChatName("");
      toast.success("Conversation started");
    } catch (error: any) {
      toast.error(error.message || "Failed to start conversation");
    } finally {
      setIsCreating(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;

    setIsDeleting(true);
    try {
      const result =
        await sdk.whatsapp.conversations.bulkDelete<any>(selectedIds);

      if (!result.success) {
        throw new Error(
          (result as any).error || "Failed to delete conversations",
        );
      }

      toast.success(`${selectedIds.length} conversations deleted`);
      setSelectedIds([]);
      setIsBulkMode(false);
      setIsDeleteDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Deletion failed");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className={cn(
        "erix-bg-background erix-h-full erix-w-full erix-shrink-0 erix-flex erix-flex-col erix-overflow-hidden erix-border-r erix-border-[#e9edef] erix-transition-[width] erix-duration-300 erix-ease-in-out md:erix-w-56 lg:erix-w-80",
        className,
      )}
    >
      <div className="erix-flex erix-h-[60px] erix-items-center erix-justify-between erix-bg-background erix-px-3 erix-py-2">
        <div className="erix-relative erix-flex-1 erix-flex erix-items-center erix-gap-2">
          <Checkbox
            checked={
              filteredConversations.length > 0 &&
              selectedIds.length === filteredConversations.length
                ? true
                : selectedIds.length > 0
                  ? "indeterminate"
                  : false
            }
            onCheckedChange={(checked) => {
              if (checked === true) {
                setSelectedIds(
                  filteredConversations.map((c) => String(c.id || c._id)),
                );
                setIsBulkMode(true);
              } else {
                setSelectedIds([]);
                setIsBulkMode(false);
              }
            }}
            className="data-[state=indeterminate]:erix-bg-primary data-[state=indeterminate]:erix-text-white data-[state=indeterminate]:erix-border-primary"
          />
          <div className="erix-relative erix-flex-1">
            <Search className="erix-text-muted-foreground erix-absolute erix-left-2 erix-top-1/2 -erix-translate-y-1/2 erix-h-4 erix-w-4" />
            <Input
              placeholder="Search chats..."
              className="erix-bg-muted/50 erix-h-8 erix-pl-8 erix-w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {selectedIds.length > 0 ? (
            <div className="erix-flex erix-items-center erix-gap-1">
              <TooltipButton
                variant="ghost"
                size="icon"
                className="erix-shrink-0 erix-h-8 erix-w-8 erix-text-destructive hover:erix-bg-destructive/10"
                tooltip="Delete Selected"
                onClick={() => setIsDeleteDialogOpen(true)}
                pointer
              >
                <Trash2 className="erix-h-4 erix-w-4" />
              </TooltipButton>
              <TooltipButton
                variant="default"
                size="icon"
                className="erix-shrink-0 erix-h-8 erix-w-8"
                tooltip="Send Broadcast"
                pointer
                onClick={() => setIsBroadcastOpen(true)}
              >
                <Send className="erix-h-4 erix-w-4" />
              </TooltipButton>
            </div>
          ) : (
            <TooltipButton
              variant="ghost"
              size="icon"
              className="erix-shrink-0 erix-h-8 erix-w-8"
              tooltip="New Chat"
              pointer
              onClick={() => setIsNewChatOpen?.(true)}
            >
              <Plus className="erix-h-4 erix-w-4" />
            </TooltipButton>
          )}
        </div>
      </div>
      <ScrollArea className="erix-flex-1 erix-overflow-y-auto">
        {isLoading ? (
          <div className="erix-p-4 erix-space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="erix-flex erix-items-center erix-gap-3">
                <div className="erix-bg-muted erix-h-10 erix-w-10 erix-animate-pulse erix-rounded-full" />
                <div className="erix-flex-1 erix-space-y-2">
                  <div className="erix-bg-muted erix-h-3 erix-w-24 erix-animate-pulse erix-rounded" />
                  <div className="erix-bg-muted erix-h-2 erix-w-full erix-animate-pulse erix-rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="erix-flex erix-flex-col erix-items-center erix-justify-center erix-p-8 erix-text-center">
            <div className="erix-bg-muted erix-mb-4 erix-flex erix-h-12 erix-w-12 erix-items-center erix-justify-center erix-rounded-full">
              <MessageSquare className="erix-text-muted-foreground erix-h-6 erix-w-6" />
            </div>
            <p className="erix-text-muted-foreground erix-text-sm">
              No conversations found
            </p>
            <Button
              size="default"
              variant="default"
              className="erix-mt-4 erix-rounded-full"
              onClick={() => setIsNewChatOpen?.(true)}
            >
              <Plus className="erix-mr-2 erix-h-4 erix-w-4" />
              Start New Chat
            </Button>
          </div>
        ) : (
          <div className="erix-flex erix-flex-col">
            {filteredConversations.map((chat) => (
              <div
                key={chat.id || chat._id}
                role="button"
                tabIndex={0}
                draggable
                onDragStart={(e: React.DragEvent) => {
                  e.dataTransfer.setData(
                    "conversationId",
                    String(chat.id || chat._id),
                  );
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    if (isBulkMode) {
                      const id = String(chat.id || chat._id);
                      setSelectedIds((prev) =>
                        prev.includes(id)
                          ? prev.filter((i) => i !== id)
                          : [...prev, id],
                      );
                    } else {
                      onSelect(chat.id || chat._id);
                    }
                  }
                }}
                onClick={() => {
                  if (isBulkMode) {
                    const id = String(chat.id || chat._id);
                    setSelectedIds((prev) =>
                      prev.includes(id)
                        ? prev.filter((i) => i !== id)
                        : [...prev, id],
                    );
                  } else {
                    onSelect(chat.id || chat._id);
                  }
                }}
                className={cn(
                  "erix-flex erix-flex-col erix-gap-1 erix-px-3 erix-py-2.5 erix-text-left erix-transition-all erix-duration-150 erix-relative erix-group erix-cursor-pointer erix-outline-none erix-border-l-[3px] erix-border-l-transparent",
                  !isBulkMode && selectedId === (chat.id || chat._id)
                    ? "erix-bg-[#f0f2f5] erix-border-l-[#25D366]"
                    : "hover:erix-bg-[#f5f6f6]",
                  isBulkMode &&
                    selectedIds.includes(String(chat.id || chat._id)) &&
                    "erix-bg-[#dcf8c6]/30 erix-border-l-[#25D366]",
                )}
              >
                <div className="erix-flex erix-items-center erix-gap-3">
                  {isBulkMode && (
                    <div
                      className="erix-flex erix-items-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        checked={selectedIds.includes(
                          String(chat.id || chat._id),
                        )}
                        onCheckedChange={() => {
                          const id = String(chat.id || chat._id);
                          setSelectedIds((prev) =>
                            prev.includes(id)
                              ? prev.filter((i) => i !== id)
                              : [...prev, id],
                          );
                        }}
                      />
                    </div>
                  )}
                  <div className="erix-relative">
                    {(() => {
                      const colors = getAvatarColor(
                        String(chat.id || chat._id),
                      );
                      return (
                        <Avatar className="erix-h-[46px] erix-w-[46px] erix-ring-1 erix-ring-black/[0.06]">
                          <AvatarImage
                            src={chat.profilePicture}
                            alt={chat.name}
                          />
                          <AvatarFallback
                            className={cn(
                              "erix-text-xs erix-font-semibold erix-uppercase",
                              colors,
                            )}
                          >
                            {chat.name?.slice(0, 2) || (
                              <MessageSquare className="erix-h-4 erix-w-4" />
                            )}
                          </AvatarFallback>
                        </Avatar>
                      );
                    })()}
                    {chat.isOnline && (
                      <span className="erix-absolute erix-bottom-0 erix-right-0 erix-h-2.5 erix-w-2.5 erix-rounded-full erix-bg-[#25D366] erix-ring-2 erix-ring-white" />
                    )}
                  </div>
                  <div className="erix-flex-1 erix-overflow-hidden">
                    <div className="erix-flex erix-items-center erix-justify-between">
                      <span className="erix-text-sm erix-font-semibold erix-truncate">
                        {chat.name}
                      </span>
                      <span className="erix-text-[11px] erix-text-[#667781] erix-whitespace-nowrap">
                        {chat.time}
                      </span>
                    </div>
                    <div className="erix-text-muted-foreground erix-flex erix-min-w-0 erix-items-center erix-gap-1 erix-text-xs">
                      <span className="erix-flex erix-items-center erix-gap-1">
                        {chat.lastMessageSender === "admin" &&
                          (chat.lastMessageStatus === "read" ? (
                            <CheckCheck className="erix-h-3 erix-w-3 erix-shrink-0 erix-text-primary" />
                          ) : chat.lastMessageStatus === "delivered" ? (
                            <CheckCheck className="erix-h-3 erix-w-3 erix-shrink-0 erix-text-gray-500" />
                          ) : (
                            <Check className="erix-h-3 erix-w-3 erix-shrink-0 erix-text-gray-400" />
                          ))}
                      </span>
                      <span className="erix-flex erix-items-center erix-gap-1 erix-truncate">
                        {chat.lastMessageType === "image" ? (
                          <>
                            <ImageIcon className="erix-h-3 erix-w-3" /> Image
                          </>
                        ) : chat.lastMessageType === "video" ? (
                          <>
                            <Video className="erix-h-3 erix-w-3" /> Video
                          </>
                        ) : chat.lastMessageType === "audio" ? (
                          <>
                            <Mic className="erix-h-3 erix-w-3" /> Audio
                          </>
                        ) : chat.lastMessageType === "document" ? (
                          <>
                            <FileText className="erix-h-3 erix-w-3" /> Document
                          </>
                        ) : (
                          <FormattedText
                            text={
                              (chat.lastMessage || "").length > 30
                                ? `${chat.lastMessage.slice(0, 30)}...`
                                : chat.lastMessage || ""
                            }
                          />
                        )}
                      </span>
                    </div>
                  </div>
                  {chat.unread > 0 && (
                    <span className="erix-bg-primary erix-text-primary-foreground erix-flex erix-h-5 erix-w-5 erix-items-center erix-justify-center erix-rounded-full erix-text-[10px] erix-font-medium">
                      {chat.unread}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {hasMoreConversations && (
              <button
                type="button"
                onClick={onLoadMoreConversations}
                disabled={isFetchingMoreConversations}
                className="erix-text-muted-foreground hover:erix-text-foreground erix-flex erix-w-full erix-items-center erix-justify-center erix-gap-2 erix-py-3 erix-text-xs erix-transition-colors disabled:erix-opacity-50"
              >
                {isFetchingMoreConversations ? (
                  <Loader2 className="erix-h-3 erix-w-3 erix-animate-spin" />
                ) : (
                  <ChevronDown className="erix-h-3 erix-w-3" />
                )}
                {isFetchingMoreConversations ? "Loading..." : "Load more"}
              </button>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Start Chat Dialog */}
      <Dialog
        open={isNewChatOpen}
        onOpenChange={(v) => {
          setIsNewChatOpen?.(v);
          if (!v) {
            setNewChatPhone("");
            setNewChatName("");
          }
        }}
      >
        <DialogContent className="sm:erix-max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Start New Conversation</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={handleCreateChat}
            className="erix-space-y-4 erix-py-4"
          >
            <div className="erix-space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <StyledPhoneInput
                value={newChatPhone}
                onChange={setNewChatPhone}
                placeholder="Enter phone number"
              />
            </div>
            <div className="erix-space-y-2">
              <Label htmlFor="name">Name (Optional)</Label>
              <Input
                id="name"
                value={newChatName}
                onChange={(e) => setNewChatName(e.target.value)}
                placeholder="e.g. John Doe"
              />
            </div>
            <DialogFooter className="erix-pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsNewChatOpen?.(false)}
                className="erix-px-6 erix-cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isCreating}
                className="erix-px-6 erix-cursor-pointer"
              >
                {isCreating && (
                  <Loader2 className="erix-mr-2 erix-h-4 erix-w-4 erix-animate-spin" />
                )}
                Start Chat
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <BroadcastDialog
        open={isBroadcastOpen}
        onOpenChange={setIsBroadcastOpen}
        selectedIds={selectedIds}
        conversations={conversations}
        onSuccess={() => {
          setIsBulkMode(false);
          setSelectedIds([]);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:erix-max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Conversations</DialogTitle>
          </DialogHeader>
          <div className="erix-py-4">
            <p className="erix-text-muted-foreground erix-text-sm">
              Are you sure you want to delete {selectedIds.length} selected
              conversations? This will also remove all messages associated with
              them. This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
              pointer
              size="sm"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={isDeleting}
              pointer
              size="sm"
              className="erix-gap-2"
            >
              {isDeleting ? (
                <Loader2 className="erix-h-4 erix-w-4 erix-animate-spin" />
              ) : (
                <Trash2 className="erix-h-4 erix-w-4" />
              )}
              Delete Conversations
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
