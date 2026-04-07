"use client";

import React, { useRef, useState, useEffect, lazy, Suspense } from "react";
import type { EmojiClickData } from "emoji-picker-react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Smile,
  Paperclip,
  FileText,
  Image as ImageIcon,
  Video as VideoIcon,
  Volume2,
  Search,
  Loader2,
  Check,
  Link as LinkIcon,
  Layout,
  Type,
  Send,
  Mic,
  StopCircle,
  Trash2,
  X,
  RefreshCw,
  Play,
  Reply as ReplyIcon,
  Eye,
  Phone,
} from "lucide-react";
import { useErixClient } from "../../../../context/ErixProvider";
import { useErixToast } from "../../../../toast/useErixToast";
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "../../../ui/popover";
import { ScrollArea, ScrollBar } from "../../../ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "../../../ui/sheet";
import { cn } from "../../../../lib/utils";

// Lazy loading for Emoji Picker to stay framework agnostic and light
const EmojiPicker = lazy(() => import("emoji-picker-react"));

interface MessageInputProps {
  chat: any;
  onSendMessage?: (
    text?: string,
    mediaUrl?: string,
    mediaType?: string,
    templateName?: string,
    templateLanguage?: string,
    variables?: any[],
    replyToId?: string,
    filename?: string,
  ) => Promise<void>;
  replyingTo: any;
  setReplyingTo: (val: any) => void;
  isSending: boolean;
  setIsSending: (val: boolean) => void;
}

export function MessageInput({
  chat,
  onSendMessage,
  replyingTo,
  setReplyingTo,
  isSending,
  setIsSending,
}: MessageInputProps) {
  const client = useErixClient();
  const toast = useErixToast();
  const [messageInput, setMessageInput] = useState("");
  const [media, setMedia] = useState<
    {
      id: string;
      filename: File;
      type: string;
      url: string;
      success: boolean;
      isUploading: boolean;
      error?: boolean;
    }[]
  >([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Template State
  const [templates, setTemplates] = useState<any[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [isTemplateOpen, setIsTemplateOpen] = useState(false);
  const [templateSearch, setTemplateSearch] = useState("");

  // Selected Template & Form State
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [templateVariables, setTemplateVariables] = useState<string[]>([]);
  const [templateMedia, setTemplateMedia] = useState<File | null>(null);
  const [isResolvingVariables, setIsResolvingVariables] = useState(false);

  // Voice Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isCancelRecording = useRef(false);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        if (audioBlob.size > 0 && !isCancelRecording.current) {
          const file = new File(
            [audioBlob],
            `voice-message-${Date.now()}.webm`,
            { type: "audio/webm" },
          );

          const newItem = {
            id: Math.random().toString(36).substring(7) + Date.now(),
            filename: file,
            type: "audio",
            url: URL.createObjectURL(file),
            success: false,
            isUploading: true,
          };

          setMedia((prev) => [...prev, newItem]);
          internalUploadFile(newItem);
        }
        stream.getTracks().forEach((track) => track.stop());
        cleanupRecording();
      };

      isCancelRecording.current = false;
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast.error("Could not access microphone");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  };

  const cancelRecording = () => {
    isCancelRecording.current = true;
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      cleanupRecording();
    }
  };

  const cleanupRecording = () => {
    setIsRecording(false);
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const fetchTemplates = async () => {
    if (templates.length > 0) return;
    setIsLoadingTemplates(true);
    try {
      const result = await client.whatsapp.templates.list();
      setTemplates(
        Array.isArray(result) ? result : (result as any)?.data || [],
      );
    } catch (error) {
      console.error(error);
      toast.error("Failed to load templates");
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  const filteredTemplates = templates.filter((t) => {
    if (t.status !== "APPROVED") return false;
    const searchString = messageInput.startsWith("/")
      ? messageInput.slice(1)
      : templateSearch;
    return t.name.toLowerCase().includes(searchString.toLowerCase());
  });

  const handleTemplateSelect = async (template: any) => {
    setSelectedTemplate(template);
    setTemplateVariables(new Array(template.variablesCount || 0).fill(""));
    setTemplateMedia(null);
    setIsTemplateOpen(false);

    if (messageInput.startsWith("/")) {
      setMessageInput("");
    }

    // Smart Resolve Variables if lead exists
    const leadId = chat?.leadId || chat?.lead?.id || chat?.lead?._id;
    if (leadId && template.variablesCount > 0) {
      setIsResolvingVariables(true);
      try {
        const result = await client.whatsapp.templates.preview(template.name, {
          lead: leadId,
        });
        if (result && (result as any).variables) {
          const resolved = (result as any).variables;
          setTemplateVariables((prev) => {
            const next = [...prev];
            resolved.forEach((v: any) => {
              if (v.position <= next.length) {
                next[v.position - 1] = v.value;
              }
            });
            return next;
          });
        }
      } catch (error) {
        console.error("Failed to resolve variables", error);
      } finally {
        setIsResolvingVariables(false);
      }
    }
  };

  const handleSendFinalTemplate = async () => {
    if (!selectedTemplate) return;
    if (isSending) return;

    setIsSending(true);
    let finalMediaUrl;
    let finalMediaType;

    const prevTemplate = selectedTemplate;
    const prevVars = templateVariables;
    const prevMedia = templateMedia;

    try {
      if (selectedTemplate.headerType !== "NONE" && templateMedia) {
        const result =
          await client.whatsapp.messages.upload<any>(templateMedia);
        finalMediaUrl = result.data?.url || (result as any)?.url!;
        finalMediaType = result.data?.type || (result as any)?.type!;
      }

      setSelectedTemplate(null);
      setTemplateVariables([]);
      setTemplateMedia(null);

      await onSendMessage?.(
        "",
        finalMediaUrl,
        finalMediaType,
        selectedTemplate.name,
        selectedTemplate.language,
        templateVariables,
        undefined,
        templateMedia?.name,
      );
    } catch (error) {
      console.error("Failed to send template", error);
      setSelectedTemplate(prevTemplate);
      setTemplateVariables(prevVars);
      setTemplateMedia(prevMedia);
      toast.error("Failed to send template");
    } finally {
      setIsSending(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!messageInput.trim() && media.length === 0) || isSending) return;

    // WhatsApp 24-hour window check
    const lastUserMsg = chat?.lastUserMessageAt
      ? new Date(chat.lastUserMessageAt).getTime()
      : 0;
    const now = Date.now();
    const msDiff = now - lastUserMsg;
    const hoursDiff = msDiff / (1000 * 60 * 60);

    if (hoursDiff > 24) {
      toast.warning(
        "This message might fail if it is not a pre-approved template.",
      );
    }

    setIsSending(true);
    const prevInput = messageInput;
    const prevMedia = media;
    const prevReplyingTo = replyingTo;

    try {
      setMessageInput("");
      setMedia([]);
      setReplyingTo(null);

      if (prevMedia.length > 0) {
        for (let i = 0; i < prevMedia.length; i++) {
          const item = prevMedia[i];
          const caption = i === 0 ? prevInput : "";
          await onSendMessage?.(
            caption,
            item.url,
            item.type,
            undefined,
            undefined,
            undefined,
            prevReplyingTo?.id || prevReplyingTo?._id,
            item.filename.name,
          );
        }
      } else {
        await onSendMessage?.(
          prevInput,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          prevReplyingTo?.id || prevReplyingTo?._id,
          undefined,
        );
      }
    } catch (error) {
      console.error("Failed to send", error);
      setMessageInput(prevInput);
      setMedia(prevMedia);
      setReplyingTo(prevReplyingTo);
    } finally {
      setIsSending(false);
    }
  };

  const internalUploadFile = async (item: {
    id: string;
    filename: File;
    type: string;
    url: string;
  }) => {
    try {
      const result = await client.whatsapp.messages.upload<any>(item.filename);
      const data = result.data || result;
      setMedia((prev) =>
        prev.map((m) =>
          m.id === item.id
            ? {
                ...m,
                url: data.url,
                type: data.type,
                success: true,
                isUploading: false,
                error: false,
              }
            : m,
        ),
      );
    } catch (error) {
      console.error("File upload error:", error);
      toast.error(`Failed to upload ${item.filename.name}`);
      setMedia((prev) =>
        prev.map((m) =>
          m.id === item.id ? { ...m, isUploading: false, error: true } : m,
        ),
      );
    }
  };

  const handleRetryUpload = (id: string) => {
    const item = media.find((m) => m.id === id);
    if (!item) return;

    setMedia((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, isUploading: true, error: false } : m,
      ),
    );

    internalUploadFile(item);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (media.length + files.length > 30) {
      toast.error("Media files are exceeded (max 30)");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const newItems = Array.from(files).map((file) => {
      let type = "document";
      if (file.type.startsWith("image/")) type = "image";
      else if (file.type.startsWith("video/")) type = "video";
      else if (file.type.startsWith("audio/")) type = "audio";

      return {
        id: Math.random().toString(36).substring(7) + Date.now(),
        filename: file,
        type,
        url: URL.createObjectURL(file),
        success: false,
        isUploading: true,
      };
    });

    setMedia((prev) => [...prev, ...newItems]);
    if (fileInputRef.current) fileInputRef.current.value = "";
    newItems.forEach((item) => internalUploadFile(item));
  };

  const removeMedia = (index: number) => {
    setMedia((prev) => prev.filter((_, i) => i !== index));
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setMessageInput((prev) => prev + emojiData.emoji);
  };

  const handleFileClick = (filter?: string, capture?: string) => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = filter || "*/*";
      if (capture) {
        fileInputRef.current.setAttribute("capture", capture);
      } else {
        fileInputRef.current.removeAttribute("capture");
      }
      fileInputRef.current.click();
    }
  };

  return (
    <div className="erix-border-border erix-bg-[#f0f2f5] erix-relative erix-z-40 erix-border-t erix-p-3">
      <input
        type="file"
        multiple
        ref={fileInputRef}
        className="erix-hidden"
        onChange={handleFileChange}
      />

      {/* Template Preview Sheet */}
      <Sheet
        open={!!selectedTemplate}
        onOpenChange={(open) => !open && setSelectedTemplate(null)}
      >
        <SheetContent className="erix-w-full erix-gap-0 sm:erix-max-w-md">
          <SheetHeader className="erix-bg-background erix-sticky erix-top-0 erix-z-4 erix-border-b erix-px-2 [.border-b]:erix-pb-4">
            <SheetTitle className="erix-flex erix-items-center erix-gap-2">
              Send Template Message
            </SheetTitle>
          </SheetHeader>
          {selectedTemplate && (
            <div className="erix-overflow-y-auto erix-p-2">
              <div className="erix-bg-muted/30 erix-relative erix-space-y-2 erix-p-4 erix-ring-1 erix-ring-black/3">
                <div className="erix-flex erix-items-center erix-justify-between">
                  <span className="erix-text-muted-foreground erix-text-[10px] erix-font-bold erix-tracking-widest erix-uppercase">
                    Template Preview
                  </span>
                  <div className="erix-bg-primary/10 erix-text-primary erix-flex erix-items-center erix-gap-1 erix-rounded-full erix-px-2 erix-py-0.5 erix-text-[10px] erix-font-bold">
                    <Check className="erix-h-3 erix-w-3" />
                    APPROVE
                  </div>
                </div>

                {selectedTemplate.headerType !== "NONE" &&
                  (selectedTemplate.headerType === "TEXT" ? (
                    <div className="erix-text-foreground/90 erix-mb-2 erix-text-sm erix-font-bold erix-leading-tight">
                      {(selectedTemplate.headerText || "")
                        .split(/({{[0-9]+}})/g)
                        .map((part: string, i: number) => {
                          const match = part.match(/{{([0-9]+)}}/);
                          if (match) {
                            const varIndex = parseInt(match[1], 10) - 1;
                            const value = templateVariables[varIndex];
                            return (
                              <motion.span
                                key={`${i}-${value}`}
                                animate={{ scale: value ? [1, 1.1, 1] : 1 }}
                                className="erix-bg-primary/15 erix-text-primary erix-border-primary/20 erix-mx-0.5 erix-inline-flex erix-h-max erix-items-center erix-rounded erix-border erix-px-1 erix-text-[11px] erix-font-bold"
                              >
                                {value || part}
                              </motion.span>
                            );
                          }
                          return part;
                        })}
                    </div>
                  ) : (
                    <div className="erix-bg-background erix-text-muted-foreground erix-mb-2 erix-flex erix-items-center erix-gap-2 erix-rounded-lg erix-border erix-border-dashed erix-p-3 erix-text-xs erix-font-medium erix-italic">
                      {selectedTemplate.headerType === "IMAGE" && (
                        <ImageIcon className="erix-h-4 erix-w-4 erix-text-primary" />
                      )}
                      {selectedTemplate.headerType === "VIDEO" && (
                        <VideoIcon className="erix-h-4 erix-w-4 erix-text-purple-500" />
                      )}
                      {selectedTemplate.headerType === "DOCUMENT" && (
                        <FileText className="erix-h-4 erix-w-4 erix-text-orange-500" />
                      )}
                      Header {selectedTemplate.headerType?.toLowerCase()} will
                      appear here
                    </div>
                  ))}

                <div className="erix-text-foreground/90 erix-text-sm erix-whitespace-pre-wrap erix-leading-relaxed">
                  {(selectedTemplate.bodyText || "")
                    .split(/({{[0-9]+}})/g)
                    .map((part: string, i: number) => {
                      const match = part.match(/{{([0-9]+)}}/);
                      if (match) {
                        const varIndex = parseInt(match[1], 10) - 1;
                        const value = templateVariables[varIndex];
                        return (
                          <motion.span
                            key={`${i}-${value}`}
                            animate={{ scale: value ? [1, 1.1, 1] : 1 }}
                            className="erix-bg-primary/15 erix-text-primary erix-border-primary/20 erix-mx-0.5 erix-inline-flex erix-h-max erix-items-center erix-rounded erix-border erix-px-1 erix-text-[11px] erix-font-bold"
                          >
                            {value || part}
                          </motion.span>
                        );
                      }
                      return part;
                    })}
                </div>

                {selectedTemplate.footerText && (
                  <p className="erix-text-muted-foreground/60 erix-text-[11px] erix-italic">
                    {selectedTemplate.footerText}
                  </p>
                )}

                {selectedTemplate.buttons?.length > 0 && (
                  <div className="erix-mt-2 erix-flex erix-flex-col erix-gap-1.5 erix-border-t erix-border-dashed erix-pt-2">
                    {selectedTemplate.buttons.map((btn: any, idx: number) => (
                      <div
                        key={idx}
                        className="erix-bg-background erix-group hover:erix-bg-muted/50 erix-flex erix-items-center erix-justify-center erix-gap-2 erix-rounded-lg erix-border erix-py-2 erix-text-xs erix-font-semibold erix-text-primary-dark erix-transition-colors"
                      >
                        {btn.type === "URL" && (
                          <LinkIcon className="erix-h-3 erix-w-3 erix-opacity-70" />
                        )}
                        {btn.type === "PHONE_NUMBER" && (
                          <Phone className="erix-h-3 erix-w-3 erix-opacity-70" />
                        )}
                        {btn.text}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="erix-space-y-4 erix-pt-2">
                {isResolvingVariables && (
                  <div className="erix-flex erix-items-center erix-gap-2 erix-rounded-lg erix-bg-primary/5 erix-p-3 erix-border erix-border-primary/10 erix-animate-pulse">
                    <Loader2 className="erix-h-4 erix-w-4 erix-animate-spin erix-text-primary" />
                    <span className="erix-text-xs erix-font-bold erix-text-primary">
                      Autofilling variables from lead info...
                    </span>
                  </div>
                )}

                {selectedTemplate.headerType !== "NONE" &&
                  selectedTemplate.headerType !== "TEXT" && (
                    <div className="erix-space-y-2">
                      <Label>
                        Header Media ({selectedTemplate.headerType})
                      </Label>
                      <Input
                        type="file"
                        accept={
                          selectedTemplate.headerType === "IMAGE"
                            ? "image/*"
                            : selectedTemplate.headerType === "VIDEO"
                              ? "video/*"
                              : ".pdf"
                        }
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setTemplateMedia(file);
                        }}
                      />
                    </div>
                  )}

                {selectedTemplate.variablesCount > 0 && (
                  <div className="erix-grid erix-grid-cols-1 erix-gap-4 erix-py-2 sm:erix-grid-cols-2">
                    {Array.from({
                      length: selectedTemplate.variablesCount,
                    }).map((_, i) => (
                      <div
                        key={i}
                        className="erix-flex erix-flex-col erix-gap-1.5"
                      >
                        <Label className="erix-text-muted-foreground erix-text-[10px] erix-font-bold erix-tracking-widest erix-uppercase">
                          Variable {i + 1}
                        </Label>
                        <Input
                          placeholder="Value"
                          value={templateVariables[i] || ""}
                          onChange={(e) => {
                            const newVars = [...templateVariables];
                            newVars[i] = e.target.value;
                            setTemplateVariables(newVars);
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <SheetFooter className="erix-gap-2 erix-border-t sm:erix-space-x-0">
                <div className="erix-grid erix-grid-cols-2 erix-flex-1 erix-w-full erix-gap-2">
                  <Button
                    variant="erix-outline"
                    size="sm"
                    onClick={() => setSelectedTemplate(null)}
                    disabled={isSending}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSendFinalTemplate}
                    disabled={isSending}
                  >
                    {isSending && (
                      <Loader2 className="erix-mr-2 erix-h-4 erix-w-4 erix-animate-spin" />
                    )}
                    Send
                  </Button>
                </div>
              </SheetFooter>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <div className="erix-mx-auto erix-flex erix-w-full erix-max-w-7xl erix-flex-col erix-gap-2 erix-overflow-hidden erix-min-w-0">
        <AnimatePresence>
          {replyingTo && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="erix-w-full erix-overflow-hidden"
            >
              <div className="erix-bg-muted/60 erix-border-primary erix-ring-border/50 erix-mb-1 erix-flex erix-w-full erix-items-center erix-gap-2 erix-rounded-lg erix-border-l-4 erix-p-2 erix-px-3 erix-shadow-sm erix-ring-1 erix-backdrop-blur-sm">
                <div className="erix-min-w-0 erix-flex-1">
                  <p className="erix-text-primary erix-flex erix-min-w-0 erix-items-center erix-gap-1.5 erix-text-[10px] erix-font-bold erix-uppercase">
                    <ReplyIcon className="erix-h-3 erix-w-3 erix-shrink-0" />
                    <span className="erix-truncate erix-flex-1">
                      Replying to{" "}
                      {replyingTo.direction === "outbound" ? "You" : chat.name}
                    </span>
                  </p>
                  <p className="erix-text-muted-foreground erix-truncate erix-text-xs erix-italic">
                    {replyingTo.text || `Shared ${replyingTo.type}`}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="erix-h-7 erix-w-7 erix-shrink-0 erix-rounded-full"
                  onClick={() => setReplyingTo(null)}
                >
                  <X className="erix-h-4 erix-w-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {media.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="erix-overflow-hidden erix-min-w-0"
            >
              <ScrollArea className="erix-bg-muted/40 erix-border-border erix-mb-1 erix-w-full erix-rounded-md erix-border erix-p-1 erix-shadow-inner">
                <div className="erix-flex erix-w-max erix-space-x-2 erix-p-1">
                  {media.map((m, i) => (
                    <div
                      key={i}
                      className="erix-group erix-border-border erix-bg-background erix-relative erix-w-10 erix-h-10 lg:erix-h-16 lg:erix-w-16 erix-shrink-0 erix-overflow-hidden erix-rounded-md erix-border erix-shadow-sm"
                    >
                      {m.type === "image" ? (
                        <img
                          src={m.url}
                          className="erix-h-full erix-w-full erix-object-cover"
                        />
                      ) : (
                        <div className="erix-bg-muted/20 erix-flex erix-h-full erix-w-full erix-flex-col erix-items-center erix-justify-center erix-p-1">
                          <FileText className="erix-h-4 erix-w-4 erix-opacity-50" />
                          <span className="erix-w-full erix-truncate erix-text-[8px] erix-font-medium erix-uppercase">
                            {m.type}
                          </span>
                        </div>
                      )}
                      <button
                        onClick={() => removeMedia(i)}
                        className="erix-bg-destructive/90 erix-absolute erix-top-0.5 erix-right-0.5 erix-z-20 erix-rounded-full erix-p-0.5 erix-text-white erix-opacity-0 group-hover:erix-opacity-100"
                      >
                        <X className="erix-h-2.5 erix-w-2.5" />
                      </button>
                      {m.isUploading && (
                        <div className="erix-absolute erix-inset-0 erix-z-10 erix-flex erix-items-center erix-justify-center erix-bg-black/40 erix-backdrop-blur-[1px]">
                          <Loader2 className="erix-h-4 erix-w-4 erix-animate-spin erix-text-white" />
                        </div>
                      )}
                      {m.error && !m.isUploading && (
                        <div className="erix-absolute erix-inset-0 erix-z-10 erix-flex erix-items-center erix-justify-center erix-bg-destructive/20">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="erix-h-6 erix-w-6 erix-text-white hover:erix-bg-white/20"
                            onClick={() => handleRetryUpload(m.id)}
                          >
                            <RefreshCw className="erix-h-3 erix-w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" className="erix-h-1.5" />
              </ScrollArea>
            </motion.div>
          )}
        </AnimatePresence>

        <form
          onSubmit={handleSendMessage}
          className="erix-bg-[#f0f2f5] erix-flex erix-h-12 erix-w-full erix-items-center erix-gap-1.5 erix-min-w-0"
        >
          <div className="erix-flex erix-items-center">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="erix-text-muted-foreground hover:erix-text-primary erix-shrink-0"
                >
                  <Smile className="erix-h-4 erix-w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                side="top"
                align="start"
                className="erix-z-[100] erix-w-auto erix-border-none erix-p-0 erix-shadow-xl"
              >
                <Suspense
                  fallback={
                    <div className="erix-p-4">
                      <Loader2 className="erix-animate-spin" />
                    </div>
                  }
                >
                  <EmojiPicker onEmojiClick={onEmojiClick} />
                </Suspense>
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="erix-text-[#54656f] hover:erix-bg-black/5 erix-shrink-0"
                >
                  <Paperclip className="erix-h-4 erix-w-4 erix-rotate-45" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                side="top"
                align="start"
                sideOffset={15}
                className="erix-w-auto erix-p-2 erix-pb-3 erix-mb-2 erix-rounded-md erix-border-none erix-shadow-md erix-bg-white/95 erix-backdrop-blur-md erix-ring-1 erix-ring-black/5"
              >
                <div className="erix-flex erix-flex-col erix-gap-1.5 erix-min-w-[160px]">
                  <Button
                    variant="ghost"
                    onClick={() =>
                      handleFileClick(
                        ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt",
                      )
                    }
                    className="erix-flex erix-items-center erix-justify-start erix-gap-3 erix-px-3 erix-py-6 erix-rounded-md hover:erix-bg-black/5"
                  >
                    <div className="erix-flex erix-h-9 erix-w-9 erix-items-center erix-justify-center erix-rounded-full erix-bg-primary erix-text-white">
                      <FileText className="erix-h-4 erix-w-4" />
                    </div>
                    <span className="erix-text-sm erix-font-medium">
                      Document
                    </span>
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => handleFileClick("image/*,video/*")}
                    className="erix-flex erix-items-center erix-justify-start erix-gap-3 erix-px-3 erix-py-6 erix-rounded-md hover:erix-bg-black/5"
                  >
                    <div className="erix-flex erix-h-9 erix-w-9 erix-items-center erix-justify-center erix-rounded-full erix-bg-pink-500 erix-text-white">
                      <ImageIcon className="erix-h-4 erix-w-4" />
                    </div>
                    <span className="erix-text-sm erix-font-medium">
                      Photos & Videos
                    </span>
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            <Popover
              open={isTemplateOpen}
              onOpenChange={(open) => {
                setIsTemplateOpen(open);
                if (open) fetchTemplates();
              }}
            >
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="erix-text-muted-foreground hover:erix-text-primary erix-shrink-0"
                >
                  <FileText className="erix-h-4 erix-w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                side="top"
                align="start"
                sideOffset={15}
                alignOffset={-14}
                className="erix-border-border erix-bg-background/95 erix-z-[100] erix-w-80 erix-overflow-hidden erix-rounded-lg erix-p-0 erix-shadow-md erix-ring-1 erix-ring-black/5 erix-backdrop-blur-xl"
              >
                <div className="erix-bg-muted/40 erix-flex erix-flex-col erix-gap-2 erix-border-b erix-p-3">
                  <div className="erix-relative">
                    <Search className="erix-text-muted-foreground/60 erix-absolute erix-top-1/2 erix-left-3 erix-h-4 erix-w-4 erix--erix-translate-y-1/2" />
                    <Input
                      placeholder="Search templates..."
                      value={templateSearch}
                      onChange={(e) => setTemplateSearch(e.target.value)}
                      className="erix-bg-background erix-h-9 erix-rounded-lg erix-border-none erix-pl-9 erix-text-xs erix-ring-1 erix-ring-border/50"
                    />
                  </div>
                </div>
                <ScrollArea className="erix-h-[280px]">
                  {isLoadingTemplates ? (
                    <div className="erix-flex erix-h-48 erix-flex-col erix-items-center erix-justify-center erix-gap-3 erix-p-4">
                      <Loader2 className="erix-h-7 erix-w-7 erix-animate-spin erix-text-primary/40" />
                    </div>
                  ) : filteredTemplates.length === 0 ? (
                    <div className="erix-text-muted-foreground erix-flex erix-h-40 erix-flex-col erix-items-center erix-justify-center erix-p-8 erix-text-center erix-text-xs erix-italic erix-opacity-60">
                      No matching templates found.
                    </div>
                  ) : (
                    <div className="erix-grid erix-gap-1 erix-p-1.5">
                      {filteredTemplates.map((template, i) => (
                        <button
                          key={i}
                          onClick={() => handleTemplateSelect(template)}
                          className="hover:erix-bg-primary/5 erix-group erix-flex erix-flex-col erix-items-start erix-gap-1 erix-rounded-md erix-p-2.5 erix-text-left erix-transition-all active:erix-scale-[0.98]"
                        >
                          <span className="group-hover:erix-text-primary erix-truncate erix-text-xs erix-font-bold">
                            {template.name}
                          </span>
                          <p className="erix-text-muted-foreground erix-line-clamp-1 erix-text-[10px] erix-opacity-60">
                            {template.components?.find(
                              (c: any) => c.type === "BODY",
                            )?.text || "No preview"}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </PopoverContent>
            </Popover>
          </div>

          <div className="erix-flex-1 erix-relative erix-flex erix-items-center erix-min-w-0">
            <AnimatePresence mode="wait">
              {isRecording ? (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="erix-bg-white erix-flex erix-h-9 erix-flex-1 erix-items-center erix-justify-between erix-rounded-full erix-px-4 erix-text-sm erix-shadow-sm lg:erix-h-10 erix-border erix-border-primary/10"
                >
                  <div className="erix-flex erix-items-center erix-gap-3">
                    <motion.div
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="erix-bg-destructive erix-h-2.5 erix-w-2.5 erix-rounded-full"
                    />
                    <span className="erix-font-mono erix-text-sm erix-font-medium">
                      {formatTime(recordingTime)}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="erix-text-muted-foreground/60 hover:erix-text-destructive erix-h-8 erix-w-8 erix-rounded-full"
                    onClick={cancelRecording}
                  >
                    <Trash2 className="erix-h-4 erix-w-4" />
                  </Button>
                </motion.div>
              ) : (
                <Input
                  placeholder="Type a message..."
                  value={messageInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    setMessageInput(val);
                    if (val.startsWith("/")) {
                      if (!isTemplateOpen) {
                        setIsTemplateOpen(true);
                        fetchTemplates();
                      }
                    } else if (isTemplateOpen && !val.includes("/")) {
                      setIsTemplateOpen(false);
                    }
                  }}
                  className="erix-bg-white erix-border-none focus-visible:erix-ring-0 erix-h-9 erix-flex-1 erix-rounded-full erix-px-4 erix-text-sm erix-shadow-sm lg:erix-h-10 placeholder:erix-text-muted-foreground/50"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                />
              )}
            </AnimatePresence>
          </div>

          <Button
            type={messageInput.trim() || media.length > 0 ? "submit" : "button"}
            size="icon"
            onClick={() => {
              if (isRecording) stopRecording();
              else if (!messageInput.trim() && media.length === 0)
                startRecording();
            }}
            className={cn(
              "erix-h-9 erix-w-9 erix-shrink-0 erix-rounded-full lg:erix-h-10 lg:erix-w-10 erix-shadow-sm erix-transition-all",
              messageInput.trim() || media.length > 0 || isRecording
                ? "erix-bg-[#00a884] hover:erix-bg-[#008f6f]"
                : "erix-bg-transparent hover:erix-bg-black/5 erix-text-muted-foreground",
            )}
            disabled={media.some((m) => m.isUploading || m.error) || isSending}
          >
            {isSending ? (
              <Loader2 className="erix-h-4 erix-w-4 erix-animate-spin" />
            ) : isRecording ? (
              <StopCircle className="erix-h-4 erix-w-4 lg:erix-h-5 lg:erix-w-5 erix-text-white erix-fill-current" />
            ) : messageInput.trim() || media.length > 0 ? (
              <Send className="erix-h-4 erix-w-4 lg:erix-h-5 lg:erix-w-5 erix-ml-0.5 erix-text-white" />
            ) : (
              <Mic className="erix-h-4 erix-w-4 lg:erix-h-5 lg:erix-w-5" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
