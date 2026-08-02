import * as React from "react";
import { Label, Input } from "wayshrine-compass";

const Surface = ({ children }: { children: React.ReactNode }) => (
  <div className="-m-6 bg-background p-6 text-foreground">{children}</div>
);

export const WithInput = () => (
  <Surface>
    <div className="flex max-w-sm flex-col gap-2">
      <Label htmlFor="set-search">Gear set</Label>
      <Input id="set-search" placeholder="Search sets…" />
    </div>
  </Surface>
);

export const WithCheckbox = () => (
  <Surface>
    <div className="flex flex-col gap-3">
      <Label htmlFor="console" className="gap-2">
        <input
          id="console"
          type="checkbox"
          defaultChecked
          className="size-4 accent-[var(--primary)]"
        />
        Hide addon-dependent guidance
      </Label>
      <Label htmlFor="dlc" className="gap-2">
        <input id="dlc" type="checkbox" className="size-4 accent-[var(--primary)]" />
        Only sets I can farm without DLC
      </Label>
    </div>
  </Surface>
);

export const Disabled = () => (
  <Surface>
    <div className="group flex max-w-sm flex-col gap-2" data-disabled="true">
      <Label htmlFor="locked">Patch verified</Label>
      <Input id="locked" defaultValue="U50" disabled className="peer" />
      <Label htmlFor="locked" className="peer-disabled:opacity-50 text-xs font-normal">
        Locked while the ingest run is in progress
      </Label>
    </div>
  </Surface>
);
