"use client";
/**
 * components/crm/CreateLeadModal.tsx
 */
import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePipelines } from "@/hooks/crm/usePipeline";
import { useLeads } from "@/hooks/crm/useLeads";
import { ErixSpinner } from "@/components/ui/erix-spinner";
import type { LeadSource } from "@/types/platform";

interface CreateLeadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultStageId?: string;
  defaultPipelineId?: string;
}

export const CreateLeadModal: React.FC<CreateLeadModalProps> = ({
  open,
  onOpenChange,
  defaultStageId,
  defaultPipelineId,
}) => {
  const { pipelines, loading: pipelinesLoading } = usePipelines();
  const { create } = useLeads();

  const [submitting, setSubmitting] = React.useState(false);
  const [formData, setFormData] = React.useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    pipelineId: defaultPipelineId || "",
    stageId: defaultStageId || "",
    source: "website" as LeadSource,
    value: 0,
  });

  // Sync defaults when they change or pipelines load
  React.useEffect(() => {
    if (defaultPipelineId)
      setFormData((prev) => ({ ...prev, pipelineId: defaultPipelineId }));
    if (defaultStageId)
      setFormData((prev) => ({ ...prev, stageId: defaultStageId }));

    if (!defaultPipelineId && pipelines?.length) {
      setFormData((prev) => ({
        ...prev,
        pipelineId: prev.pipelineId || pipelines[0]._id,
        stageId: prev.stageId || pipelines[0].stages[0]._id,
      }));
    }
  }, [defaultPipelineId, defaultStageId, pipelines]);

  const selectedPipeline = pipelines?.find(
    (p) => p._id === formData.pipelineId,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.firstName ||
      !formData.phone ||
      !formData.pipelineId ||
      !formData.stageId
    )
      return;

    setSubmitting(true);
    try {
      await create({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        pipelineId: formData.pipelineId,
        stageId: formData.stageId,
        source: formData.source,
        value: formData.value,
      });
      onOpenChange(false);
      // Reset form
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        pipelineId: defaultPipelineId || pipelines?.[0]?._id || "",
        stageId: defaultStageId || pipelines?.[0]?.stages[0]?._id || "",
        source: "website",
        value: 0,
      });
    } catch (error) {
      console.error("Failed to create lead:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:erix-max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Lead</DialogTitle>
          <DialogDescription>
            Add a new lead to your CRM pipeline.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="erix-space-y-4 erix-py-4">
          <div className="erix-grid erix-grid-cols-2 erix-gap-4">
            <div className="erix-space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                required
                placeholder="John"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, firstName: e.target.value }))
                }
              />
            </div>
            <div className="erix-space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                placeholder="Doe"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, lastName: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="erix-space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              required
              placeholder="+1234567890"
              value={formData.phone}
              onChange={(e) =>
                setFormData((p) => ({ ...p, phone: e.target.value }))
              }
            />
          </div>

          <div className="erix-space-y-2">
            <Label htmlFor="email">Email (Optional)</Label>
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              value={formData.email}
              onChange={(e) =>
                setFormData((p) => ({ ...p, email: e.target.value }))
              }
            />
          </div>

          <div className="erix-grid erix-grid-cols-2 erix-gap-4">
            <div className="erix-space-y-2">
              <Label>Pipeline</Label>
              <Select
                value={formData.pipelineId}
                onValueChange={(val) => {
                  const pipe = pipelines?.find((p) => p._id === val);
                  setFormData((p) => ({
                    ...p,
                    pipelineId: val,
                    stageId: pipe?.stages[0]?._id || "",
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select pipeline" />
                </SelectTrigger>
                <SelectContent>
                  {pipelines?.map((p) => (
                    <SelectItem key={p._id} value={p._id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="erix-space-y-2">
              <Label>Stage</Label>
              <Select
                value={formData.stageId}
                onValueChange={(val) =>
                  setFormData((p) => ({ ...p, stageId: val }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent>
                  {selectedPipeline?.stages.map((s) => (
                    <SelectItem key={s._id} value={s._id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="erix-space-y-2">
            <Label htmlFor="value">Lead Value</Label>
            <Input
              id="value"
              type="number"
              placeholder="0"
              value={formData.value}
              onChange={(e) =>
                setFormData((p) => ({ ...p, value: Number(e.target.value) }))
              }
            />
          </div>

          <DialogFooter className="erix-pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <ErixSpinner size="sm" className="erix-mr-2" />
              ) : null}
              Create Lead
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
