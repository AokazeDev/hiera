"use client";

import gsap from "gsap";
import { Flip } from "gsap/Flip";
import { useLayoutEffect, useRef } from "react";

gsap.registerPlugin(Flip);

export function usePermissionGroupingFlip() {
  const root = useRef<HTMLDivElement>(null);
  const pendingState = useRef<ReturnType<typeof Flip.getState> | null>(null);

  function prepareGroupingTransition() {
    if (
      !root.current ||
      !window.matchMedia("(prefers-reduced-motion: no-preference)").matches
    ) {
      return;
    }
    pendingState.current = Flip.getState(
      root.current.querySelectorAll("[data-permission-flip-item]"),
    );
  }

  useLayoutEffect(() => {
    const state = pendingState.current;
    pendingState.current = null;
    if (!state) return;
    const animation = Flip.from(state, {
      absolute: true,
      duration: 0.22,
      ease: "power2.inOut",
      nested: true,
      prune: true,
    });
    return () => {
      animation.kill();
    };
  });

  return { root, prepareGroupingTransition };
}
