import { useState } from "react";
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  ExternalLink,
  Wrench,
  Loader2,
} from "lucide-react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { cn } from "@/shared/lib/cn";
import { runDoctorFix, type DoctorCheck } from "@/shared/api/doctor";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";

interface DoctorCheckRowProps {
  check: DoctorCheck;
  onFixed?: () => void;
}

const STATUS_ICON = {
  pass: CheckCircle,
  warn: AlertTriangle,
  fail: XCircle,
} as const;

const STATUS_COLOR = {
  pass: "text-text-success",
  warn: "text-text-warning",
  fail: "text-text-danger",
} as const;

export function DoctorCheckRow({ check, onFixed }: DoctorCheckRowProps) {
  const [showFixDialog, setShowFixDialog] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [fixError, setFixError] = useState<string | null>(null);

  const Icon = STATUS_ICON[check.status];

  async function confirmFix() {
    if (!check.fixType) return;
    setFixing(true);
    setFixError(null);
    try {
      await runDoctorFix(check.id, check.fixType);
      setShowFixDialog(false);
      onFixed?.();
    } catch (e) {
      setFixError(String(e));
    } finally {
      setFixing(false);
    }
  }

  return (
    <>
      <div className="flex items-center gap-2.5 rounded-lg bg-background-default px-3.5 py-2.5">
        <Icon
          className={cn("h-4 w-4 flex-shrink-0", STATUS_COLOR[check.status])}
        />

        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-sm font-medium">{check.label}</span>
          <span className="break-words text-xs text-text-muted">
            {check.message}
          </span>
          {check.path && (
            <span className="break-words font-mono text-[10px] text-text-alt">
              {check.path}
            </span>
          )}
          {check.bridgePath && (
            <span className="break-words font-mono text-[10px] text-text-alt">
              {check.bridgePath}
            </span>
          )}
        </div>

        {check.fixType && check.status !== "pass" && (
          <button
            type="button"
            onClick={() => {
              setFixError(null);
              setFixing(false);
              setShowFixDialog(true);
            }}
            className="flex flex-shrink-0 items-center gap-1 rounded-md border border-border-default px-2 py-1 text-xs text-text-muted transition-colors hover:bg-background-alt hover:text-text-default"
          >
            <Wrench className="h-3.5 w-3.5" />
            Fix
          </button>
        )}

        {check.fixUrl && check.status !== "pass" && (
          <button
            type="button"
            onClick={() => {
              if (check.fixUrl) void openUrl(check.fixUrl);
            }}
            aria-label="Open fix URL"
            className="flex flex-shrink-0 items-center justify-center rounded-md p-1 text-text-muted transition-colors hover:bg-background-alt hover:text-text-default"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <AlertDialog
        open={showFixDialog}
        onOpenChange={(open) => {
          if (!open && !fixing) setShowFixDialog(false);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Run fix command?</AlertDialogTitle>
            <AlertDialogDescription className="break-all font-mono">
              {check.fixCommand}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {fixError && <p className="text-xs text-text-danger">{fixError}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={fixing}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmFix} disabled={fixing}>
              {fixing && <Loader2 className="h-3 w-3 animate-spin mr-1.5" />}
              {fixing ? "Running" : fixError ? "Retry" : "Run"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
