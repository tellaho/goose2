import { Search } from "lucide-react";
import { cn } from "@/shared/lib/cn";

interface SearchBarProps {
  /** Current search value (controlled) */
  value: string;
  /** Called when the search term changes */
  onChange: (term: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Optional className for the wrapper */
  className?: string;
}

export function SearchBar({
  value,
  onChange,
  placeholder,
  className,
}: SearchBarProps) {
  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted/60" />
      <input
        type="search"
        autoComplete="off"
        spellCheck={false}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-3 py-2 text-sm bg-background-alt border border-border-default/50 rounded-lg placeholder:text-text-muted/40 focus:outline-none focus:ring-1 focus:ring-ring focus:border-border-default transition-colors"
      />
    </div>
  );
}
