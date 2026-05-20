import * as DialogPrimitive from "@radix-ui/react-dialog";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export const DialogContent = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />
    <DialogPrimitive.Content
      className={cn(
        "fixed left-1/2 top-1/2 z-50 w-[min(92vw,680px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 text-foreground",
        className
      )}
    >
      {children}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
);
