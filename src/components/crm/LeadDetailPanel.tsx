"use client";
// packages/erix-react/src/components/crm/LeadDetailPanel.tsx
import * as React from "react";
import {
  X,
  Phone,
  Mail,
  Globe,
  Calendar,
  MessageSquare,
  Plus,
  Trash2,
  Star,
  Clock,
  History,
  FileText,
  User,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ErixSpinner } from "@/components/ui/erix-spinner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useLead } from "@/hooks/crm/useLeads";
import { useLeadActivities, useLeadNotes } from "@/hooks/crm/useLeadActivity";
import type { Lead } from "@/types/platform";

export interface LeadDetailPanelProps {
  leadId: string | null;
  onClose: () => void;
}

export function LeadDetailPanel({ leadId, onClose }: LeadDetailPanelProps) {
  const { lead, loading: leadLoading } = useLead(leadId);
  const { activities, loading: activitiesLoading } = useLeadActivities(leadId);
  const { notes, createNote, loading: notesLoading } = useLeadNotes(leadId);
  const [newNote, setNewNote] = React.useState("");

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    await createNote(newNote);
    setNewNote("");
  };

  if (!leadId) return null;

  return (
    <Sheet open={!!leadId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="erix-w-full sm:erix-max-w-md erix-p-0 erix-overflow-hidden erix-flex erix-flex-col"
      >
        <SheetHeader className="erix-sr-only">
          <SheetTitle>
            {lead ? `${lead.firstName} ${lead.lastName}` : "Lead Details"}
          </SheetTitle>
          <SheetDescription>
            View and manage lead activities, notes, and contact information.
          </SheetDescription>
        </SheetHeader>

        {leadLoading ? (
          <div className="erix-flex erix-flex-1 erix-items-center erix-justify-center">
            <ErixSpinner size="lg" />
          </div>
        ) : lead ? (
          <>
            <div className="erix-p-6 erix-border-b erix-border-border erix-bg-muted/20">
              <div className="erix-flex erix-items-center erix-gap-4">
                <div className="erix-flex erix-size-12 erix-items-center erix-justify-center erix-rounded-2xl erix-bg-primary erix-text-primary-foreground erix-text-lg erix-font-bold">
                  {lead.firstName[0]}
                  {lead.lastName?.[0] || ""}
                </div>
                <div className="erix-flex erix-flex-col">
                  <h3 className="erix-text-xl erix-font-bold erix-text-foreground">
                    {lead.firstName} {lead.lastName}
                  </h3>
                  <div className="erix-flex erix-items-center erix-gap-2">
                    <Badge
                      variant="secondary"
                      className="erix-text-[10px] erix-uppercase erix-tracking-tighter erix-rounded-lg"
                    >
                      {lead.status}
                    </Badge>
                    <span className="erix-text-xs erix-text-muted-foreground erix-flex erix-items-center erix-gap-1">
                      <Star className="erix-size-3 erix-text-amber-400 erix-fill-current" />
                      Score:{" "}
                      {typeof lead.score === "object"
                        ? (lead.score as any).total
                        : lead.score || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="erix-flex-1 erix-overflow-hidden erix-flex erix-flex-col">
              <Tabs
                defaultValue="activity"
                className="erix-flex-1 erix-flex erix-flex-col"
              >
                <div className="erix-px-6 erix-pt-4 erix-border-b erix-border-border">
                  <TabsList
                    variant="line"
                    className="erix-w-full erix-justify-start"
                  >
                    <TabsTrigger value="activity" className="erix-gap-2">
                      <History className="erix-size-3.5" />
                      Activity
                    </TabsTrigger>
                    <TabsTrigger value="notes" className="erix-gap-2">
                      <FileText className="erix-size-3.5" />
                      Notes
                    </TabsTrigger>
                    <TabsTrigger value="details" className="erix-gap-2">
                      <User className="erix-size-3.5" />
                      Details
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div className="erix-flex-1 erix-overflow-y-auto erix-p-6">
                  <TabsContent value="activity" className="erix-m-0">
                    <div className="erix-space-y-6">
                      {activitiesLoading ? (
                        <div className="erix-flex erix-justify-center py-8">
                          <ErixSpinner />
                        </div>
                      ) : activities.length === 0 ? (
                        <p className="erix-text-center erix-text-sm erix-text-muted-foreground py-8">
                          No activity yet.
                        </p>
                      ) : (
                        activities.map((act, i) => (
                          <div
                            key={act._id}
                            className="erix-relative erix-flex erix-gap-4"
                          >
                            {i !== activities.length - 1 && (
                              <div className="erix-absolute erix-left-[15px] erix-top-8 erix-bottom-0 erix-w-0.5 erix-bg-border" />
                            )}
                            <div className="erix-flex erix-size-8 erix-shrink-0 erix-items-center erix-justify-center erix-rounded-full erix-bg-muted erix-z-10">
                              <Clock className="erix-size-4 erix-text-muted-foreground" />
                            </div>
                            <div className="erix-flex erix-flex-col erix-gap-1">
                              <p className="erix-text-sm erix-font-medium">
                                {act.title}
                              </p>
                              {act.body && (
                                <p className="erix-text-xs erix-text-muted-foreground">
                                  {act.body}
                                </p>
                              )}
                              <p className="erix-text-[10px] erix-text-muted-foreground erix-mt-1">
                                {new Date(act.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent
                    value="notes"
                    className="erix-m-0 erix-space-y-6"
                  >
                    <form onSubmit={handleAddNote} className="erix-space-y-3">
                      <Textarea
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Add a private note..."
                        className="erix-min-h-[100px] erix-rounded-xl erix-bg-muted/20"
                      />
                      <Button
                        type="submit"
                        className="erix-w-full erix-gap-2 erix-rounded-xl erix-font-bold"
                      >
                        <Plus className="erix-size-4" />
                        Add Note
                      </Button>
                    </form>

                    <div className="erix-space-y-4">
                      {notesLoading ? (
                        <div className="erix-flex erix-justify-center py-4">
                          <ErixSpinner />
                        </div>
                      ) : (
                        notes.map((note) => (
                          <div
                            key={note._id}
                            className="erix-p-4 erix-rounded-xl erix-bg-muted/30 erix-border erix-border-border erix-group"
                          >
                            <div className="erix-flex erix-items-start erix-justify-between erix-gap-2 mb-2">
                              <p className="erix-text-xs erix-text-muted-foreground">
                                {new Date(note.createdAt).toLocaleString()}
                              </p>
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                className="erix-opacity-0 group-hover:erix-opacity-100 transition-opacity"
                              >
                                <Trash2 className="erix-size-3.5 erix-text-destructive" />
                              </Button>
                            </div>
                            <p className="erix-text-sm erix-whitespace-pre-wrap">
                              {note.content}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent
                    value="details"
                    className="erix-m-0 erix-space-y-6"
                  >
                    <div className="erix-grid erix-gap-6">
                      <section className="erix-space-y-4">
                        <h4 className="erix-text-xs erix-font-bold erix-uppercase erix-tracking-wider erix-text-muted-foreground">
                          Contact Info
                        </h4>
                        <div className="erix-space-y-3">
                          <div className="erix-flex erix-items-center erix-gap-3 erix-p-3 erix-rounded-xl erix-bg-muted/30 erix-border erix-border-border">
                            <Phone className="erix-size-4 erix-text-muted-foreground" />
                            <div className="erix-flex erix-flex-col">
                              <span className="erix-text-[10px] erix-text-muted-foreground">
                                Phone
                              </span>
                              <span className="erix-text-sm erix-font-medium">
                                {lead.phone}
                              </span>
                            </div>
                          </div>
                          {lead.email && (
                            <div className="erix-flex erix-items-center erix-gap-3 erix-p-3 erix-rounded-xl erix-bg-muted/30 erix-border erix-border-border">
                              <Mail className="erix-size-4 erix-text-muted-foreground" />
                              <div className="erix-flex erix-flex-col">
                                <span className="erix-text-[10px] erix-text-muted-foreground">
                                  Email
                                </span>
                                <span className="erix-text-sm erix-font-medium">
                                  {lead.email}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </section>

                      <section className="erix-space-y-4">
                        <h4 className="erix-text-xs erix-font-bold erix-uppercase erix-tracking-wider erix-text-muted-foreground">
                          Lead Source
                        </h4>
                        <div className="erix-flex erix-items-center erix-gap-3 erix-p-3 erix-rounded-xl erix-bg-muted/30 erix-border erix-border-border">
                          <Globe className="erix-size-4 erix-text-muted-foreground" />
                          <div className="erix-flex erix-flex-col">
                            <span className="erix-text-[10px] erix-text-muted-foreground">
                              Acquisition Channel
                            </span>
                            <span className="erix-text-sm erix-font-medium erix-capitalize">
                              {lead.source || "Unknown"}
                            </span>
                          </div>
                        </div>
                      </section>

                      {(lead as any)?.metadata?.extra?.message && (
                        <section className="erix-space-y-4">
                          <h4 className="erix-text-xs erix-font-bold erix-uppercase erix-tracking-wider erix-text-muted-foreground">
                            Initial Message
                          </h4>
                          <div className="erix-p-4 erix-rounded-xl erix-bg-primary/5 erix-border erix-border-primary/10">
                            <p className="erix-text-sm erix-italic erix-text-foreground/80">
                              "{(lead as any).metadata.extra.message as string}"
                            </p>
                          </div>
                        </section>
                      )}
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </div>

            <div className="erix-p-6 erix-border-t erix-border-border erix-bg-muted/10 erix-flex erix-gap-3">
              <button className="erix-flex-1 erix-flex erix-items-center erix-justify-center erix-gap-2 erix-bg-emerald-500 erix-text-white erix-py-2.5 erix-rounded-xl erix-text-sm erix-font-bold hover:erix-bg-emerald-600 transition-colors">
                <ChevronRight className="erix-size-4" />
                Next Stage
              </button>
              <button className="erix-p-2.5 erix-rounded-xl erix-border erix-border-border hover:erix-bg-muted transition-colors">
                <MessageSquare className="erix-size-4 erix-text-muted-foreground" />
              </button>
            </div>
          </>
        ) : (
          <div className="erix-p-12 erix-text-center erix-text-muted-foreground">
            Lead not found
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
