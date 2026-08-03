"use client";

import { useEffect, useState } from "react";

/**
 * Ambient wayshrine loop behind the home hero. Decorative only.
 *
 * The poster image is always rendered as the base layer, so no-JS visitors and
 * anyone with prefers-reduced-motion get a static scene. The <video> mounts
 * only after a client-side media-query check — which also guarantees the
 * element is created with its muted property already set, keeping mobile and
 * Safari autoplay policies satisfied (SSR-serialized muted attributes are
 * unreliable in React).
 */
export function HeroVideo() {
  const [motionOk, setMotionOk] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: no-preference)");
    const update = () => setMotionOk(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 select-none">
      {/* eslint-disable-next-line @next/next/no-img-element -- fixed decorative backdrop; next/image adds nothing here */}
      <img
        src="/hero/wayshrine-poster.jpg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-center"
      />
      {motionOk && (
        <video
          // Autoplay attributes alone are unreliable on elements mounted after
          // hydration, so playback is kicked explicitly (allowed: muted), with
          // a canplay retry for mounts that race media loading.
          ref={(el) => {
            if (!el) return;
            const kick = () => {
              el.muted = true;
              if (el.paused) el.play().catch(() => {});
            };
            kick();
            el.addEventListener("canplay", kick, { once: true });
            // Hidden pages defer media loading entirely; resume when shown.
            document.addEventListener("visibilitychange", kick);
            const timer = setTimeout(kick, 400);
            return () => {
              clearTimeout(timer);
              document.removeEventListener("visibilitychange", kick);
            };
          }}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          tabIndex={-1}
          poster="/hero/wayshrine-poster.jpg"
          className="absolute inset-0 h-full w-full object-cover object-center"
        >
          <source src="/hero/wayshrine-loop.mp4" type="video/mp4" />
        </video>
      )}
      {/* Legibility scrim: hero copy sits on the left, so darken hardest there. */}
      <div className="absolute inset-0 bg-gradient-to-r from-background/85 via-background/45 to-background/20" />
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-b from-transparent to-background/80" />
    </div>
  );
}
