import * as React from "react";
import { Input, Label } from "wayshrine-compass";

const Surface = ({ children }: { children: React.ReactNode }) => (
  <div className="-m-6 bg-background p-6 text-foreground">{children}</div>
);

export const States = () => (
  <Surface>
    <div className="flex max-w-sm flex-col gap-4">
      <Input placeholder="Search sets…" />
      <Input defaultValue="Deadly Strike" />
      <Input placeholder="Disabled" disabled />
      <Input defaultValue="not-a-patch" aria-invalid />
    </div>
  </Surface>
);

export const WithLabel = () => (
  <Surface>
    <div className="flex max-w-sm flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="build-name">Build name</Label>
        <Input id="build-name" defaultValue="Sorcerer DPS" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="patch">Patch verified</Label>
        <Input id="patch" defaultValue="U50" className="font-mono" />
        <p className="text-xs text-muted-foreground">
          The patch this build was last checked against.
        </p>
      </div>
    </div>
  </Surface>
);

export const Types = () => (
  <Surface>
    <div className="flex max-w-sm flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="cp">Champion points</Label>
        <Input id="cp" type="number" defaultValue={1600} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="q">Filter skills</Label>
        <Input id="q" type="search" placeholder="Crystal Shard" />
      </div>
    </div>
  </Surface>
);
