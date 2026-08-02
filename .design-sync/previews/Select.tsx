import * as React from "react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  Label,
} from "wayshrine-compass";

const Surface = ({ children }: { children: React.ReactNode }) => (
  <div className="-m-6 bg-background p-6 text-foreground">{children}</div>
);

const Roles = () => (
  <SelectContent>
    <SelectGroup>
      <SelectLabel>Group content</SelectLabel>
      <SelectItem value="dps">Damage</SelectItem>
      <SelectItem value="tank">Tank</SelectItem>
      <SelectItem value="healer">Healer</SelectItem>
    </SelectGroup>
    <SelectSeparator />
    <SelectGroup>
      <SelectLabel>Solo</SelectLabel>
      <SelectItem value="leveling">Leveling</SelectItem>
    </SelectGroup>
  </SelectContent>
);

export const Triggers = () => (
  <Surface>
    <div className="flex flex-wrap items-center gap-3">
      <Select>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Select a role" />
        </SelectTrigger>
        <Roles />
      </Select>
      <Select defaultValue="tank">
        <SelectTrigger className="w-48">
          <SelectValue />
        </SelectTrigger>
        <Roles />
      </Select>
      <Select disabled defaultValue="dps">
        <SelectTrigger className="w-48">
          <SelectValue />
        </SelectTrigger>
        <Roles />
      </Select>
    </div>
  </Surface>
);

export const Sizes = () => (
  <Surface>
    <div className="flex flex-wrap items-center gap-3">
      <Select defaultValue="dps">
        <SelectTrigger size="sm" className="w-40">
          <SelectValue />
        </SelectTrigger>
        <Roles />
      </Select>
      <Select defaultValue="dps">
        <SelectTrigger size="default" className="w-40">
          <SelectValue />
        </SelectTrigger>
        <Roles />
      </Select>
    </div>
  </Surface>
);

export const InForm = () => (
  <Surface>
    <div className="flex max-w-xs flex-col gap-2">
      <Label htmlFor="role">Role</Label>
      <Select defaultValue="healer">
        <SelectTrigger id="role" className="w-full">
          <SelectValue />
        </SelectTrigger>
        <Roles />
      </Select>
      <p className="text-xs text-muted-foreground">
        Filters the build list to setups verified for this role.
      </p>
    </div>
  </Surface>
);
