import type { ButtonHTMLAttributes, InputHTMLAttributes, LabelHTMLAttributes, TextareaHTMLAttributes } from "react";

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const buttonBase =
  "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-[10px] px-5 py-3 text-sm font-bold whitespace-nowrap transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 disabled:pointer-events-none";

const buttonVariants = {
  primary: "bg-gold text-ink hover:bg-gold-dark active:scale-[0.98] transition-transform",
  secondary: "bg-charcoal text-paper border border-graphite hover:border-mist font-medium",
  danger: "bg-transparent text-alert border border-alert/40 hover:bg-alert/10 font-medium",
  ghost: "bg-transparent text-mist hover:text-paper font-medium",
};

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof buttonVariants }) {
  return (
    <button className={cx(buttonBase, buttonVariants[variant], className)} {...props} />
  );
}

const fieldBase =
  "w-full rounded-[10px] border border-transparent bg-graphite px-3 py-2.5 text-sm text-paper placeholder:text-mist focus:border-gold focus:outline-none";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cx(fieldBase, className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cx(fieldBase, className)} {...props} />;
}

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={cx("mb-1 block text-sm font-medium text-mist", className)} {...props} />
  );
}

export function Field({ children }: { children: React.ReactNode }) {
  return <div className="mb-4">{children}</div>;
}

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cx(
        "rounded-[20px] bg-charcoal p-6 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function ErrorText({ children }: { children?: string | null }) {
  if (!children) return null;
  return <p className="mt-1 text-sm text-alert">{children}</p>;
}
