"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, Send } from "lucide-react";
import { Badge } from "../../../ui/badge";
import { Button } from "../../../ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../ui/dialog";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";
import { ScrollArea } from "../../../ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../ui/select";
import { useErixClient } from "../../../../context/ErixProvider";
import { useErixToast } from "../../../../toast/useErixToast";

interface BroadcastDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: string[];
  conversations: any[];
  onSuccess: () => void;
}

export function BroadcastDialog({
  open,
  onOpenChange,
  selectedIds,
  conversations,
  onSuccess,
}: BroadcastDialogProps) {
  const sdk = useErixClient();
  const toast = useErixToast();
  const [templates, setTemplates] = useState<any[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [broadcastName, setBroadcastName] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [variables, setVariables] = useState<Record<string, string>>({});

  const fetchTemplates = useCallback(async () => {
    setIsLoadingTemplates(true);
    try {
      const result = await sdk.whatsapp.templates.list<any>({
        status: "APPROVED",
        category: "MARKETING",
      } as any);
      if (result.success) {
        setTemplates(result.data?.data || result.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch templates:", error);
    } finally {
      setIsLoadingTemplates(false);
    }
  }, [sdk]);

  useEffect(() => {
    if (open) {
      fetchTemplates();
      setBroadcastName(
        `Broadcast - ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
      );
      setSelectedTemplate("");
      setVariables({});
    }
  }, [open, fetchTemplates]);

  const getRequiredVariables = (): string[] => {
    const tmpl = templates.find((t) => t.name === selectedTemplate);
    if (!tmpl || !tmpl.bodyText) return [];
    const matches = tmpl.bodyText.match(/\{\{(\d+)\}\}/g) || [];
    const uniqueVars: string[] = Array.from(
      new Set(matches.map((m: string) => m.replace(/\D/g, ""))),
    );
    return uniqueVars.sort(
      (a: string, b: string) => parseInt(a, 10) - parseInt(b, 10),
    );
  };

  const requiredVariables = getRequiredVariables();

  const handleSendBroadcast = async () => {
    if (!selectedTemplate) {
      toast.error("Please select a template");
      return;
    }

    setIsSending(true);
    try {
      const selectedContacts = conversations.filter((c) =>
        selectedIds.includes(String(c.id || c._id)),
      );

      const recipients = selectedContacts.map((c) => {
        const isUnnamed = !c.name || /^\+?\d+$/.test(c.name);
        const displayName = isUnnamed ? "Customer" : c.name;
        const resolvedVariables = requiredVariables.map((vNum: string) => {
          const rawVal = variables[vNum] || "";
          return rawVal.replace(/\{name\}/gi, displayName);
        });
        return { phone: c.phone, variables: resolvedVariables };
      });

      const result = await sdk.whatsapp.broadcasts.create<any>({
        name: broadcastName,
        templateName: selectedTemplate,
        recipients,
      });

      if (result.success) {
        toast.success("Broadcast campaign started!");
        onSuccess();
        onOpenChange(false);
      } else {
        throw new Error(result.error || "Failed to start broadcast");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to start broadcast");
    } finally {
      setIsSending(false);
    }
  };

  const currentTemplate = templates.find((t) => t.name === selectedTemplate);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:erix-max-w-[500px] erix-flex erix-flex-col erix-p-0 erix-overflow-hidden erix-max-h-[85vh]">
        <DialogHeader className="erix-px-6 erix-py-4 erix-border-b erix-shrink-0 erix-bg-background erix-z-10">
          <div className="erix-flex erix-items-center erix-justify-between">
            <DialogTitle>Broadcast Message</DialogTitle>
            <Badge variant="secondary" className="erix-font-mono">
              {selectedIds.length} recipients
            </Badge>
          </div>
        </DialogHeader>

        <ScrollArea className="erix-flex-1 erix-min-h-0">
          <div className="erix-p-6 erix-space-y-6">
            <div className="erix-space-y-4">
              <div className="erix-space-y-1.5">
                <Label
                  htmlFor="broadcastName"
                  className="erix-text-xs erix-uppercase erix-text-muted-foreground erix-font-semibold"
                >
                  Campaign Name
                </Label>
                <Input
                  id="broadcastName"
                  value={broadcastName}
                  onChange={(e) => setBroadcastName(e.target.value)}
                  placeholder="Campaign name"
                  className="erix-h-9"
                />
              </div>

              <div className="erix-space-y-1.5">
                <Label
                  htmlFor="template"
                  className="erix-text-xs erix-uppercase erix-text-muted-foreground erix-font-semibold"
                >
                  Template
                </Label>
                <Select
                  value={selectedTemplate}
                  onValueChange={setSelectedTemplate}
                >
                  <SelectTrigger
                    id="template"
                    className="erix-h-9 erix-text-sm"
                  >
                    <SelectValue
                      placeholder={
                        isLoadingTemplates ? "Loading..." : "Select template"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((tmpl) => (
                      <SelectItem key={tmpl._id || tmpl.name} value={tmpl.name}>
                        {tmpl.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedTemplate && (
              <div className="erix-space-y-4 erix-animate-in erix-fade-in erix-duration-300">
                <div className="erix-rounded-lg erix-border erix-bg-muted/30 erix-p-3 erix-space-y-1">
                  <p className="erix-text-[10px] erix-uppercase erix-text-muted-foreground erix-font-bold erix-leading-none">
                    Preview
                  </p>
                  <p className="erix-text-sm erix-whitespace-pre-wrap erix-leading-relaxed">
                    {currentTemplate?.bodyText || "No preview"}
                  </p>
                  {currentTemplate?.footerText && (
                    <p className="erix-text-[11px] erix-text-muted-foreground erix-pt-1 erix-opacity-70 erix-italic erix-border-t erix-mt-2">
                      {currentTemplate.footerText}
                    </p>
                  )}
                </div>

                {requiredVariables.length > 0 && (
                  <div className="erix-space-y-3 erix-pt-2">
                    <Label className="erix-text-xs erix-uppercase erix-text-muted-foreground erix-font-semibold">
                      Variables
                    </Label>
                    <div className="erix-grid erix-gap-3">
                      {requiredVariables.map((vNum: string) => (
                        <div key={vNum} className="erix-space-y-1.5">
                          <Label className="erix-text-[10px] erix-text-muted-foreground erix-font-medium">
                            Variable {`{{${vNum}}}`}
                          </Label>
                          <div className="erix-flex erix-gap-2">
                            <Input
                              value={variables[vNum as string] || ""}
                              onChange={(e) =>
                                setVariables((prev) => ({
                                  ...prev,
                                  [vNum as string]: e.target.value,
                                }))
                              }
                              placeholder="Value..."
                              className="erix-h-8 erix-text-xs erix-flex-1"
                            />
                            <Button
                              variant="erix-outline"
                              size="sm"
                              className="erix-h-8 erix-px-2 erix-text-[10px] erix-shrink-0"
                              onClick={() =>
                                setVariables((prev) => ({
                                  ...prev,
                                  [vNum as string]: `${prev[vNum as string] || ""}{name}`,
                                }))
                              }
                            >
                              + Name
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="erix-text-[10px] erix-text-muted-foreground erix-italic erix-leading-tight erix-px-1">
                      * Use{" "}
                      <span className="erix-text-primary erix-font-semibold">
                        {"{name}"}
                      </span>{" "}
                      to personalize.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="erix-px-6 erix-py-4 erix-border-t erix-bg-muted/10 erix-shrink-0">
          <div className="erix-flex erix-justify-end erix-gap-3 erix-w-full">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSendBroadcast}
              disabled={isSending || !selectedTemplate}
              className="erix-min-w-[100px]"
            >
              {isSending ? (
                <Loader2 className="erix-h-4 erix-w-4 erix-animate-spin" />
              ) : (
                "Send Now"
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
