import { Toaster as Sonner, type ToasterProps } from "sonner";
import type { CSSProperties } from "react";

const Toaster = (props: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      style={{
        "--normal-bg": "var(--background)",
        "--normal-text": "var(--foreground)",
        "--normal-border": "var(--border)",
        "--border-radius": "var(--radius)",
      } as CSSProperties}
      {...props}
    />
  );
};

export { Toaster };
