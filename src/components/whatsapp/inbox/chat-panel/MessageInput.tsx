"use client";

import type { EmojiClickData } from "emoji-picker-react";
import { AnimatePresence, motion } from "framer-motion";
import dynamic from "next/dynamic";
import { useRef, useState, useEffect } from "react";
import {
  Smile,
  Plus,
  SendHorizontal,
  Mic,
  X,
  Image as ImageIcon,
  Video,
  FileText,
  Camera,
  Layout,
  Type,
  Link as LinkIcon,
  Phone,
  Check,
  Eye,
  Loader2,
  Trash2,
  Paperclip,
} from "lucide-react";
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
import { useErixClient } from "../../../../context/ErixProvider";
import { useErixToast } from "../../../../toast/useErixToast";
import { cn } from "../../../../lib/utils";

// Dynamic loading for Emoji Picker
const EmojiPicker = dynamic(() => import("emoji-picker-react"), {
  ssr: false,
  loading: () => (
    <div className="erix-flex erix-items-center erix-justify-center erix-p-8">
      <Loader2 className="erix-text-muted-foreground erix-h-8 erix-w-8 erix-animate-spin" />
    </div>
  ),
});

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
  const sdk = useErixClient();
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
            {
              type: "audio/webm",
            },
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
      const result = await sdk.whatsapp.templates.list<any>();
      if (!result.success)
        throw new Error(result.error || "Failed to fetch templates");
      const data = result.data?.data || result.data || [];
      setTemplates(data);
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

    const leadId = chat?.leadId || chat?.lead?.id || chat?.lead?._id;
    if (leadId && template.variablesCount > 0) {
      setIsResolvingVariables(true);
      try {
        const result = await sdk.whatsapp.templates.preview<any>(
          template.name,
          {
            lead: { leadId },
          },
        );

        if (result.success && result.data?.variables) {
          const resolved = result.data.variables;
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
        const formData = new FormData();
        formData.append("file", templateMedia);

        const result = await sdk.whatsapp.upload<any>(
          formData,
          templateMedia.name,
        );

        if (!result.success)
          throw new Error(result.error || "Failed to upload template media");
        const data = result.data?.data || result.data;
        finalMediaUrl = data.url;
        finalMediaType = data.type;
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

    const lastUserMsg = chat?.lastUserMessageAt
      ? new Date(chat.lastUserMessageAt).getTime()
      : 0;
    const now = Date.now();
    const msDiff = now - lastUserMsg;
    const hoursDiff = msDiff / (1000 * 60 * 60);

    if (hoursDiff > 24) {
      toast.warning(
        "24-hour active window has passed since the last user message.",
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
      const formData = new FormData();
      formData.append("file", item.filename);

      const result = await sdk.whatsapp.upload<any>(
        formData,
        item.filename.name,
      );

      if (!result.success) throw new Error(result.error || "Upload failed");
      const data = result.data?.data || result.data;

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
          m.id === item.id
            ? {
                ...m,
                isUploading: false,
                error: true,
              }
            : m,
        ),
      );
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (media.length + files.length > 10) {
      toast.error("Media files limit exceeded (max 10)");
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

  // Keyboard shortcut for templates
  useEffect(() => {
    if (messageInput === "/") {
      setIsTemplateOpen(true);
      fetchTemplates();
    }
  }, [messageInput]);

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
          <SheetHeader className="erix-bg-background erix-sticky erix-top-0 erix-z-4 erix-border-b erix-px-2 [.erix-border-b]:erix-pb-4">
            <SheetTitle className="erix-flex erix-items-center erix-gap-2">
              Send Template Message{" "}
              <Eye className="erix-h-4 erix-w-4 erix-text-muted-foreground" />
            </SheetTitle>
          </SheetHeader>
          {selectedTemplate && (
            <div className="erix-overflow-y-auto erix-p-2">
              <div className="erix-bg-muted/30 erix-relative erix-space-y-2 erix-p-4 erix-ring-1 erix-ring-black/5 erix-rounded-lg erix-mb-6">
                <div className="erix-flex erix-items-center erix-justify-between">
                  <span className="erix-text-muted-foreground erix-text-[10px] erix-font-bold erix-tracking-widest erix-uppercase">
                    Template Preview
                  </span>
                  <div className="erix-bg-primary/10 erix-text-primary erix-flex erix-items-center erix-gap-1 erix-rounded-full erix-px-2 erix-py-0.5 erix-text-[10px] erix-font-bold">
                    <Check className="erix-h-3 erix-w-3" />
                    APPROVED
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
                                animate={{
                                  scale: value ? [1, 1.05, 1] : 1,
                                }}
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
                        <Video className="erix-h-4 erix-w-4 erix-text-purple-500" />
                      )}
                      {selectedTemplate.headerType === "DOCUMENT" && (
                        <FileText className="erix-h-4 erix-w-4 erix-text-orange-500" />
                      )}
                      Header {selectedTemplate.headerType.toLowerCase()} will
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
                            animate={{
                              scale: value ? [1, 1.05, 1] : 1,
                            }}
                            className="erix-bg-primary/15 erix-text-primary erix-border-primary/20 erix-mx-0.5 erix-inline-flex erix-h-max erix-items-center erix-rounded erix-border erix-px-1 erix-text-[11px] erix-font-bold"
                          >
                            {value || part}
                          </motion.span>
                        );
                      }
                      return part;
                    })}
                </div>
              </div>

              <div className="erix-space-y-4 erix-pt-2">
                {isResolvingVariables && (
                  <div className="erix-flex erix-items-center erix-gap-2 erix-rounded-lg erix-bg-primary/5 erix-p-3 erix-border erix-border-primary/10 erix-animate-pulse">
                    <Loader2 className="erix-h-4 erix-w-4 erix-animate-spin erix-text-primary" />
                    <span className="erix-text-xs erix-font-bold erix-text-primary">
                      Autofilling variables...
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
                          placeholder="Enter value"
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
            </div>
          )}
          <SheetFooter className="erix-gap-2 erix-border-t erix-p-4 sm:erix-space-x-0">
            <div className="erix-grid erix-grid-cols-2 erix-flex-1 erix-w-full erix-gap-2">
              <Button
                variant="outline"
                onClick={() => setSelectedTemplate(null)}
                disabled={isSending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendFinalTemplate}
                disabled={
                  isSending ||
                  (selectedTemplate?.headerType !== "NONE" &&
                    selectedTemplate?.headerType !== "TEXT" &&
                    !templateMedia)
                }
              >
                {isSending && (
                  <Loader2 className="erix-mr-2 erix-h-4 erix-w-4 erix-animate-spin" />
                )}
                Send Template
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Replying To Panel */}
      <AnimatePresence>
        {replyingTo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="erix-bg-[#f0f2f5] erix-relative erix-overflow-hidden erix-rounded-t-lg erix-border-b erix-px-4 erix-py-2"
          >
            <div className="erix-border-primary erix-bg-background erix-flex erix-items-center erix-justify-between erix-rounded-md erix-border-l-4 erix-p-2 erix-shadow-sm">
              <div className="erix-min-w-0 erix-flex-1">
                <p className="erix-text-primary erix-text-[10px] erix-font-bold erix-uppercase">
                  {replyingTo.fromMe ? "You" : chat.name}
                </p>
                <p className="erix-text-muted-foreground erix-truncate erix-text-xs">
                  {replyingTo.body || replyingTo.caption || "Media message"}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="erix-h-6 erix-w-6"
                onClick={() => setReplyingTo(null)}
              >
                <X className="erix-h-3 erix-w-3" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Media Preview Row */}
      <AnimatePresence>
        {media.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            className="erix-flex erix-gap-2 erix-overflow-x-auto erix-pb-2 erix-pt-1"
          >
            {media.map((item, idx) => (
              <div
                key={item.id}
                className="erix-relative erix-h-16 erix-w-16 erix-flex-shrink-0"
              >
                {item.type === "image" ? (
                  <img
                    src={item.url}
                    alt="preview"
                    className="erix-h-full erix-w-full erix-rounded erix-object-cover"
                  />
                ) : (
                  <div className="erix-bg-muted erix-flex erix-h-full erix-w-full erix-flex-col erix-items-center erix-justify-center erix-rounded">
                    {item.type === "video" ? (
                      <Video className="erix-h-6 erix-w-6" />
                    ) : (
                      <FileText className="erix-h-6 erix-w-6" />
                    )}
                    <span className="erix-mt-1 erix-max-w-[50px] erix-truncate erix-text-[8px]">
                      {item.filename.name}
                    </span>
                  </div>
                )}
                <button
                  onClick={() => removeMedia(idx)}
                  className="erix-bg-destructive erix-absolute erix--erix-right-1 erix--erix-top-1 erix-flex erix-h-4 erix-w-4 erix-items-center erix-justify-center erix-rounded-full erix-text-white"
                >
                  <X className="erix-h-2 erix-w-2" />
                </button>
                {item.isUploading && (
                  <div className="erix-bg-black/20 erix-absolute erix-inset-0 erix-flex erix-items-center erix-justify-center">
                    <Loader2 className="erix-h-4 erix-w-4 erix-animate-spin erix-text-white" />
                  </div>
                )}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="erix-flex erix-items-end erix-gap-2">
        <div className="erix-flex erix-items-center erix-gap-1">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="erix-text-muted-foreground erix-h-9 erix-w-9"
              >
                <Smile className="erix-h-5 erix-w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              side="top"
              align="start"
              className="erix-w-auto erix-border-none erix-p-0"
            >
              <EmojiPicker onEmojiClick={onEmojiClick} />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="erix-text-muted-foreground erix-h-9 erix-w-9"
              >
                <Plus className="erix-h-5 erix-w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              side="top"
              align="start"
              className="erix-w-48 erix-p-1"
            >
              <div className="erix-grid erix-grid-cols-1 erix-gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="erix-justify-start erix-gap-2 erix-text-xs"
                  onClick={() => handleFileClick("image/*")}
                >
                  <ImageIcon className="erix-h-4 erix-w-4 erix-text-primary" />{" "}
                  Image
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="erix-justify-start erix-gap-2 erix-text-xs"
                  onClick={() => handleFileClick("video/*")}
                >
                  <Video className="erix-h-4 erix-w-4 erix-text-purple-500" />{" "}
                  Video
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="erix-justify-start erix-gap-2 erix-text-xs"
                  onClick={() => handleFileClick(".pdf,.doc,.docx,.xls,.xlsx")}
                >
                  <FileText className="erix-h-4 erix-w-4 erix-text-orange-500" />{" "}
                  Document
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="erix-justify-start erix-gap-2 erix-text-xs"
                  onClick={() => {
                    setIsTemplateOpen(true);
                    fetchTemplates();
                  }}
                >
                  <Layout className="erix-h-4 erix-w-4 erix-text-blue-500" />{" "}
                  Template
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <form
          onSubmit={handleSendMessage}
          className="erix-flex erix-1 erix-min-w-0 erix-items-center erix-gap-2 erix-w-full"
        >
          <div className="erix-bg-background erix-relative erix-flex erix-flex-1 erix-items-center erix-rounded-lg erix-px-3 erix-py-1">
            <Input
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="Type a message or use / for templates"
              className="erix-h-9 erix-border-none erix-bg-transparent erix-p-0 erix-shadow-none focus-visible:erix-ring-0"
              disabled={isRecording}
            />
          </div>

          <AnimatePresence mode="wait">
            {messageInput.trim() || media.length > 0 ? (
              <motion.div
                key="send"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                <Button
                  type="submit"
                  size="icon"
                  className="erix-h-9 erix-w-9 erix-rounded-full"
                  disabled={isSending}
                >
                  <SendHorizontal className="erix-h-5 erix-w-5" />
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="action"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                {isRecording ? (
                  <div className="erix-flex erix-items-center erix-gap-2">
                    <span className="erix-text-destructive erix-animate-pulse erix-text-xs erix-font-bold">
                      {formatTime(recordingTime)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="erix-text-destructive erix-h-9 erix-w-9"
                      onClick={cancelRecording}
                    >
                      <Trash2 className="erix-h-5 erix-w-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="erix-bg-primary erix-text-primary-foreground erix-h-9 erix-w-9 erix-rounded-full"
                      onClick={stopRecording}
                    >
                      <SendHorizontal className="erix-h-5 erix-w-5" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="erix-text-muted-foreground erix-h-9 erix-w-9"
                    onClick={startRecording}
                  >
                    <Mic className="erix-h-5 erix-w-5" />
                  </Button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </div>

      {/* Template Chooser Popover */}
      <AnimatePresence>
        {isTemplateOpen && (
          <div className="erix-absolute erix-bottom-full erix-left-0 erix-w-full erix-p-2">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="erix-bg-background erix-border erix-rounded-lg erix-shadow-xl erix-max-h-[300px] erix-flex erix-flex-col"
            >
              <div className="erix-border-b erix-p-2">
                <Input
                  autoFocus
                  placeholder="Search templates..."
                  value={templateSearch}
                  onChange={(e) => setTemplateSearch(e.target.value)}
                  className="erix-h-8"
                />
              </div>
              <ScrollArea className="erix-flex-1">
                <div className="erix-p-1">
                  {isLoadingTemplates ? (
                    <div className="erix-p-4 erix-text-center">
                      <Loader2 className="erix-h-4 erix-w-4 erix-animate-spin erix-mx-auto" />
                    </div>
                  ) : filteredTemplates.length === 0 ? (
                    <div className="erix-p-4 erix-text-center erix-text-xs erix-text-muted-foreground">
                      No templates found
                    </div>
                  ) : (
                    filteredTemplates.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => handleTemplateSelect(t)}
                        className="erix-flex erix-w-full erix-flex-col erix-items-start erix-rounded-md erix-p-2 erix-text-left hover:erix-bg-muted"
                      >
                        <span className="erix-text-xs erix-font-bold">
                          {t.name}
                        </span>
                        <span className="erix-text-muted-foreground erix-line-clamp-1 erix-text-[10px]">
                          {t.bodyText}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>
              <div className="erix-bg-muted/50 erix-flex erix-items-center erix-justify-between erix-px-3 erix-py-2 erix-border-t">
                <span className="erix-text-[10px] erix-font-medium text-muted-foreground">
                  Quick access templates
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="erix-h-5 erix-w-5"
                  onClick={() => setIsTemplateOpen(false)}
                >
                  <X className="erix-h-3 erix-w-3" />
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
