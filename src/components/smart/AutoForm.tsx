"use client";

import * as React from "react";
import type { ResourceManifest, FieldManifest } from "@ecodrix/erix-api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Props for the AutoForm component.
 */
export interface AutoFormProps {
  /** The manifest (blueprint) of the resource to render a form for. */
  manifest: ResourceManifest;
  /** Initial values for the form fields. */
  initialValues?: Record<string, any>;
  /** Callback when the form is submitted. */
  onSubmit: (data: Record<string, any>) => void | Promise<void>;
  /** Optional loading state for the submit button. */
  submitting?: boolean;
  /** Custom label for the submit button. */
  submitLabel?: string;
  /** CSS class for the form container. */
  className?: string;
}

/**
 * A "Smart Component" that automatically generates a fully functional form
 * from an SDK ResourceManifest.
 */
export function AutoForm({
  manifest,
  initialValues = {},
  onSubmit,
  submitting = false,
  submitLabel = "Save Changes",
  className,
}: AutoFormProps) {
  const [formData, setFormData] =
    React.useState<Record<string, any>>(initialValues);

  const handleChange = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void onSubmit(formData);
  };

  // Group fields by their designated category
  const groups = manifest.fields.reduce(
    (acc, field) => {
      const group = field.group || "General";
      if (!acc[group]) acc[group] = [];
      acc[group].push(field);
      return acc;
    },
    {} as Record<string, FieldManifest[]>,
  );

  const renderField = (field: FieldManifest) => {
    const value = formData[field.key] ?? "";

    switch (field.type) {
      case "select":
      case "multi-select":
        return (
          <Select
            value={String(value)}
            onValueChange={(val) => handleChange(field.key, val)}
          >
            <SelectTrigger id={field.key} className="erix-w-full">
              <SelectValue placeholder={`Select ${field.label}...`} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((opt) => (
                <SelectItem key={String(opt.value)} value={String(opt.value)}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "textarea":
      case "richtext":
        return (
          <Textarea
            id={field.key}
            value={value}
            onChange={(e) => handleChange(field.key, e.target.value)}
            placeholder={field.description}
            required={field.required}
          />
        );

      default:
        return (
          <Input
            id={field.key}
            type={field.type === "number" ? "number" : "text"}
            value={value}
            onChange={(e) => handleChange(field.key, e.target.value)}
            placeholder={field.description}
            required={field.required}
            readOnly={field.readOnly}
          />
        );
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn("erix-space-y-6", className)}>
      <div className="erix-space-y-8">
        {Object.entries(groups).map(([groupName, fields]) => (
          <div key={groupName} className="erix-space-y-4">
            {groupName !== "General" && (
              <h3 className="erix-text-sm erix-font-semibold erix-text-muted-foreground erix-uppercase erix-tracking-wider">
                {groupName}
              </h3>
            )}
            <div className="erix-grid erix-grid-cols-1 md:erix-grid-cols-2 erix-gap-4">
              {fields.map((field) => (
                <div
                  key={field.key}
                  className={cn(
                    "erix-space-y-2",
                    field.type === "textarea" && "erix-col-span-full",
                  )}
                >
                  <Label
                    htmlFor={field.key}
                    className="erix-text-sm erix-font-medium"
                  >
                    {field.label}{" "}
                    {field.required && (
                      <span className="erix-text-destructive">*</span>
                    )}
                  </Label>
                  {renderField(field)}
                  {field.description && (
                    <p className="erix-text-xs erix-text-muted-foreground">
                      {field.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="erix-pt-4">
        <Button
          type="submit"
          className="erix-w-full md:erix-w-auto"
          disabled={submitting}
          style={{ backgroundColor: manifest.uiHints?.primaryColor }}
        >
          {submitting ? "Processing..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
