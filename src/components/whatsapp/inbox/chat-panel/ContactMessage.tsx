"use client";

import { UserCircle, Send, MessageSquare } from "lucide-react";
import { Button } from "../../../ui/button";
import { cn } from "../../../../lib/utils";

export default function ContactMessage({ text }: { text: string }) {
  let contacts: any[] = [];
  try {
    const data = typeof text === "string" ? JSON.parse(text) : text;
    contacts = Array.isArray(data) ? data : [data];
  } catch {
    return (
      <div className="erix-p-2 erix-bg-red-50 erix-text-red-500 erix-text-xs erix-rounded-md">
        Invalid contact data
      </div>
    );
  }

  if (contacts.length === 0) return null;

  return (
    <div className="erix-min-w-[220px] erix-max-w-[280px] erix-overflow-hidden erix-rounded-md erix-border erix-border-black/5 erix-bg-white/40">
      <div className="erix-p-3 erix-space-y-3">
        {contacts.map((contact, idx) => (
          <div key={idx} className="erix-flex erix-items-center erix-gap-3">
            <div className="erix-h-12 erix-w-12 erix-rounded-full erix-bg-primary/10 erix-text-primary erix-flex erix-items-center erix-justify-center erix-shrink-0">
              <UserCircle className="erix-h-8 erix-w-8 erix-opacity-80" />
            </div>
            <div className="erix-flex-1 erix-min-w-0">
              <h4 className="erix-text-sm erix-font-bold erix-truncate erix-text-foreground">
                {contact.name || contact.first_name || "Shared Contact"}
              </h4>
              <p className="erix-text-[11px] erix-text-muted-foreground erix-truncate erix-font-medium">
                {contact.phones?.[0]?.phone ||
                  contact.phone ||
                  "No phone listed"}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Action Area */}
      <div className="erix-border-t erix-border-black/5 erix-grid erix-grid-cols-1 erix-divide-y erix-divide-black/5">
        <Button
          variant="ghost"
          className="erix-h-10 erix-w-full erix-rounded-none erix-text-primary erix-text-xs erix-font-bold hover:erix-bg-black/5 erix-gap-2"
          onClick={() => {
            const phone = contacts[0].phones?.[0]?.phone || contacts[0].phone;
            if (phone) window.open(`tel:${phone}`);
          }}
        >
          <MessageSquare className="erix-h-3.5 erix-w-3.5" />
          Message
        </Button>
      </div>
    </div>
  );
}
