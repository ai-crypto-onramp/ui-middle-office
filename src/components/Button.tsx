import type { ButtonHTMLAttributes, ReactNode } from "react";
import { classNames } from "@/utils";

type Variant = "default" | "primary" | "danger" | "success" | "warning";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: "sm" | "md";
  children: ReactNode;
};

export function Button({ variant = "default", size = "md", className, children, ...rest }: Props) {
  const variantClass = variant === "default" ? "" : `btn-${variant}`;
  return (
    <button className={classNames("btn", variantClass, size === "sm" && "btn-sm", className)} {...rest}>
      {children}
    </button>
  );
}