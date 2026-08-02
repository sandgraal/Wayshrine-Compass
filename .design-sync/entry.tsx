// Design-system entry for design-sync.
//
// Wayshrine Compass is a Next.js app rather than a published component package,
// so there is no dist/ barrel to bundle. This file is that barrel: it re-exports
// the real components from src/ — nothing is reimplemented here.
//
// Compound sub-parts (CardHeader, SelectItem, TableRow, …) are exported so the
// design agent can compose them; .design-sync/config.json's componentSrcMap
// keeps them out of the per-component card list.

export { Badge, badgeVariants } from "../src/components/ui/badge";
export { Button, buttonVariants } from "../src/components/ui/button";
export { Input } from "../src/components/ui/input";
export { Label } from "../src/components/ui/label";

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
} from "../src/components/ui/card";

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "../src/components/ui/select";

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from "../src/components/ui/table";

export { BuildGuidance } from "../src/components/build-guidance";
export { FreshnessBadge } from "../src/components/freshness-badge";
export { PlatformProvider, usePlatform } from "../src/components/platform-provider";
export { PlatformToggle } from "../src/components/platform-toggle";
