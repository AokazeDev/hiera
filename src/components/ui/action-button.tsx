import type { ButtonHTMLAttributes, ReactNode } from "react";

type ActionButtonVariant = "primary" | "secondary" | "quiet" | "danger";

type ActionButtonProps = {
  children: ReactNode;
  variant?: ActionButtonVariant;
  className?: string;
  href?: string;
  external?: boolean;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children">;

export function ActionButton({
  children,
  variant = "secondary",
  className = "",
  href,
  external = false,
  disabled,
  type = "button",
  ...props
}: ActionButtonProps) {
  const classes = `action-button action-button--${variant}${className ? ` ${className}` : ""}`;

  if (href) {
    return (
      <a
        className={classes}
        href={href}
        aria-disabled={disabled || undefined}
        {...(external ? { target: "_blank", rel: "noreferrer" } : undefined)}
      >
        {children}
      </a>
    );
  }

  return (
    <button className={classes} disabled={disabled} type={type} {...props}>
      {children}
    </button>
  );
}
