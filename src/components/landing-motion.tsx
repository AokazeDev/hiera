"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef } from "react";

gsap.registerPlugin(ScrollTrigger);

export function LandingMotion({ children }: { children: React.ReactNode }) {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!root.current) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches) return;

    const context = gsap.context(() => {
      const sections = gsap.utils.toArray<HTMLElement>("[data-reveal-section]");
      sections.forEach((section) => {
        gsap.fromTo(
          section,
          { autoAlpha: 0, y: 22 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.62,
            ease: "power3.out",
            scrollTrigger: {
              trigger: section,
              start: "top 84%",
              once: true,
            },
          },
        );
      });
    }, root);

    return () => context.revert();
  }, []);

  return <main ref={root}>{children}</main>;
}
