import * as React from "react";
import { LayoutDashboard } from "lucide-react";

export default function IntegrationDemoPage() {
  return (
    <div className="erix-flex erix-h-full erix-flex-col erix-items-center erix-justify-center erix-gap-4 erix-text-muted-foreground erix-p-8 erix-text-center">
      <div className="erix-rounded-full erix-bg-muted erix-p-4 erix-shadow-sm border border-border">
        <LayoutDashboard className="erix-h-8 erix-w-8 erix-opacity-50" />
      </div>
      <div>
        <h3 className="erix-text-lg erix-font-semibold erix-text-foreground">
          Welcome to Acme Admin
        </h3>
        <p className="erix-mt-1 erix-text-sm erix-max-w-sm erix-mx-auto">
          Select an Erix module from the sidebar to see how the SDK seamlessly
          integrates into this content area.
        </p>
      </div>
    </div>
  );
}
