"use client";
/**
 * routing/ErixLink.tsx
 *
 * A drop-in replacement for <a href> that uses Erix's window-based router.
 * Behaves like <Link> from react-router-dom.
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { useErixNavigate } from "./RouterContext";

export interface ErixLinkProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  /** Absolute path to navigate to */
  to: string;
  /** Replace the current history entry instead of pushing a new one */
  replace?: boolean;
  /** Class applied when this link's path matches the current URL */
  activeClass?: string;
  /** Only apply activeClass on an exact match */
  exact?: boolean;
}

export const ErixLink: React.FC<ErixLinkProps> = ({
  to,
  replace = false,
  activeClass,
  exact = false,
  children,
  className,
  onClick,
  ...rest
}) => {
  const navigate = useErixNavigate();

  const isActive = React.useMemo(() => {
    if (typeof window === "undefined") return false;
    const { pathname } = window.location;
    return exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");
  }, [to, exact]);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Let browser handle modifier keys (open in new tab etc.)
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    onClick?.(e);
    navigate(to, replace);
  };

  return (
    <a
      href={to}
      onClick={handleClick}
      className={cn(className, isActive && activeClass)}
      aria-current={isActive ? "page" : undefined}
      {...rest}
    >
      {children}
    </a>
  );
};
