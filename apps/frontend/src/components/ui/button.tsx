import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-xl text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-white hover:opacity-90",
        ghost: "bg-transparent text-foreground hover:bg-muted",
        outline: "border border-border bg-card text-foreground hover:bg-muted",
      },
      size: {
        default: "h-10 px-4 py-2",
        lg: "h-11 px-6",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>;

export const Button = ({ className, variant, size, ...props }: ButtonProps) => {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
};
