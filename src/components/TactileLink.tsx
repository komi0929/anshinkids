"use client";

import Link, { LinkProps } from "next/link";
import React from "react";

interface TactileLinkProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps>, LinkProps {
  children: React.ReactNode;
}

export function TactileLink({ children, onPointerDown, ...props }: TactileLinkProps) {
  const handlePointerDown = (e: React.PointerEvent<HTMLAnchorElement>) => {
    // Catnose UX: Provide physical feedback to brain before navigation latency
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      try {
        navigator.vibrate(10);
      } catch (err) {
        // Ignore on unsupporting devices
      }
    }
    if (onPointerDown) {
      onPointerDown(e);
    }
  };

  return (
    <Link {...props} onPointerDown={handlePointerDown} prefetch={props.prefetch ?? true}>
      {children}
    </Link>
  );
}
