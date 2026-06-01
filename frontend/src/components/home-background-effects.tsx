import type { CSSProperties } from "react";

import { getHomeBackgroundEffectTargets, type HomeBackgroundEffectTarget } from "@/lib/home-background-effect-layout";
import { homeStageLayout } from "@/lib/home-action-layout";
import { cn } from "@/lib/styles";

function getPositionStyle(target: HomeBackgroundEffectTarget): CSSProperties {
  return {
    left: `calc(${target.x}% + var(--home-effect-x-offset, 0px))`,
    top: `calc(${target.y}% + var(--home-effect-y-offset, 0px))`,
    width: `${target.size}px`,
    height: `${target.size}px`,
  };
}

function getAnimationStyle(target: HomeBackgroundEffectTarget): CSSProperties {
  return {
    animationDelay: target.delay,
  };
}

function getEffectClassName(target: HomeBackgroundEffectTarget) {
  return cn(
    "home-live-effect block h-full w-full",
    target.type === "flame" && "home-live-flame",
    target.type === "orb" && "home-live-orb",
    target.type === "smoke" && "home-live-smoke",
    target.type === "twinkle" && "home-live-twinkle",
    target.tone === "violet" && "home-live-violet",
    target.tone === "white" && "home-live-white",
    target.tone === "rose" && "home-live-rose",
    target.tone === "gold" && "home-live-gold",
    target.tone === "cool" && "home-live-cool",
  );
}

export function HomeBackgroundEffects({ className, readerId }: { className?: string; readerId?: string }) {
  const targets = getHomeBackgroundEffectTargets(readerId);
  const stageLabel = `${homeStageLayout.design.width}x${homeStageLayout.design.height}`;

  return (
    <div
      className={cn("home-effect-stage pointer-events-none absolute inset-0 overflow-hidden", className)}
      aria-hidden="true"
      data-home-effect-stage={stageLabel}
    >
      {targets.map((target) => (
        <span
          key={target.name}
          data-home-effect={target.name}
          className="home-effect-target absolute"
          style={getPositionStyle(target)}
        >
          <span className={getEffectClassName(target)} style={getAnimationStyle(target)} />
        </span>
      ))}
    </div>
  );
}
