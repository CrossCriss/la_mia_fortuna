import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "ghost";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-white hover:bg-accent-dark disabled:bg-ink/10 disabled:text-ink/30 disabled:hover:bg-ink/10",
  secondary:
    "border border-ink bg-transparent text-ink hover:bg-ink hover:text-background disabled:border-ink/15 disabled:text-ink/30 disabled:hover:bg-transparent disabled:hover:text-ink/30",
  ghost:
    "bg-secondary/40 text-ink hover:bg-secondary/60 disabled:bg-ink/10 disabled:text-ink/30",
};

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", className, disabled, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type="button"
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center gap-2 px-8 py-3.5 text-sm font-bold tracking-wide transition duration-150 ease-out disabled:cursor-not-allowed",
        VARIANT_CLASSES[variant],
        className
      )}
      {...props}
    />
  );
});
