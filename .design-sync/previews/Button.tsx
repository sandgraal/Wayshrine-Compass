import * as React from "react";
import { Button } from "wayshrine-compass";

const Surface = ({ children }: { children: React.ReactNode }) => (
  <div className="-m-6 bg-background p-6 text-foreground">{children}</div>
);

const Fork = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="18" r="3" />
    <circle cx="6" cy="6" r="3" />
    <circle cx="18" cy="6" r="3" />
    <path d="M18 9v2c0 .6-.4 1-1 1H7c-.6 0-1-.4-1-1V9M12 12v3" />
  </svg>
);

export const Variants = () => (
  <Surface>
    <div className="flex flex-wrap items-center gap-2">
      <Button>Fork in planner</Button>
      <Button variant="secondary">Compare</Button>
      <Button variant="destructive">Discard build</Button>
      <Button variant="outline">Export</Button>
      <Button variant="ghost">Cancel</Button>
      <Button variant="link">View patch notes</Button>
    </div>
  </Surface>
);

export const Sizes = () => (
  <Surface>
    <div className="flex flex-wrap items-center gap-2">
      <Button size="xs">Extra small</Button>
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
    </div>
  </Surface>
);

export const WithIcon = () => (
  <Surface>
    <div className="flex flex-wrap items-center gap-2">
      <Button>
        <Fork /> Fork in planner
      </Button>
      <Button variant="outline">
        <Fork /> Duplicate
      </Button>
      <Button size="icon" aria-label="Fork">
        <Fork />
      </Button>
      <Button size="icon-sm" variant="ghost" aria-label="Fork">
        <Fork />
      </Button>
    </div>
  </Surface>
);

export const Disabled = () => (
  <Surface>
    <div className="flex flex-wrap items-center gap-2">
      <Button disabled>Save build</Button>
      <Button variant="secondary" disabled>
        Compare
      </Button>
      <Button variant="outline" disabled>
        Export
      </Button>
    </div>
  </Surface>
);
