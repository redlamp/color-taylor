import { Toaster as Sonner } from "sonner";

const Toaster = (props) => {
  return (
    <Sonner
      className="toaster group"
      style={{
        "--normal-bg": "var(--background)",
        "--normal-text": "var(--foreground)",
        "--normal-border": "var(--border)",
        "--border-radius": "var(--radius)",
      }}
      {...props}
    />
  );
};

export { Toaster };
