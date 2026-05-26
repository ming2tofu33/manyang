import Image from "next/image";
import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { cn } from "@/lib/styles";

type AssetIconButtonProps = {
  src: string;
  label: string;
  href?: string;
  title?: string;
  size?: "default" | "header";
  className?: string;
  imageClassName?: string;
  onClick?: ComponentPropsWithoutRef<"button">["onClick"];
  type?: ComponentPropsWithoutRef<"button">["type"];
};

export function AssetIconButton({
  src,
  label,
  href,
  title,
  size = "default",
  className,
  imageClassName,
  onClick,
  type = "button",
}: AssetIconButtonProps) {
  const sizeClassName = size === "header" ? "h-11 w-11" : "h-[3.25rem] w-[3.25rem]";
  const content = (
    <>
      <Image
        src={src}
        alt=""
        fill
        sizes="52px"
        unoptimized
        className={cn("object-contain transition duration-200 group-hover:brightness-110", imageClassName)}
      />
      <span className="sr-only">{label}</span>
    </>
  );
  const classes = cn(
    "group relative grid shrink-0 place-items-center rounded-full transition focus:outline-none focus:ring-2 focus:ring-[#d799ff]",
    sizeClassName,
    className,
  );

  if (href) {
    return (
      <Link href={href} className={classes} aria-label={label} title={title}>
        {content}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} className={classes} aria-label={label} title={title}>
      {content}
    </button>
  );
}

type AssetTextButtonProps = {
  frame: string;
  children: ReactNode;
  href?: string;
  iconSrc?: string;
  type?: ComponentPropsWithoutRef<"button">["type"];
  onClick?: ComponentPropsWithoutRef<"button">["onClick"];
  disabled?: boolean;
  ariaLabel?: string;
  ariaPressed?: ComponentPropsWithoutRef<"button">["aria-pressed"];
  className?: string;
  contentClassName?: string;
  iconClassName?: string;
  style?: ComponentPropsWithoutRef<"button">["style"];
};

type AssetImageTextButtonProps = {
  frame: string;
  children: ReactNode;
  width: number;
  height: number;
  href?: string;
  sizes?: string;
  type?: ComponentPropsWithoutRef<"button">["type"];
  onClick?: ComponentPropsWithoutRef<"button">["onClick"];
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
  imageClassName?: string;
  contentClassName?: string;
  style?: ComponentPropsWithoutRef<"button">["style"];
};

export function AssetImageTextButton({
  frame,
  children,
  width,
  height,
  href,
  sizes = "382px",
  type = "button",
  onClick,
  disabled,
  ariaLabel,
  className,
  imageClassName,
  contentClassName,
  style,
}: AssetImageTextButtonProps) {
  const accessibleLabel = ariaLabel ?? (typeof children === "string" ? children : undefined);
  const content = (
    <>
      <Image
        src={frame}
        alt=""
        width={width}
        height={height}
        sizes={sizes}
        unoptimized
        className={cn("pointer-events-none h-auto w-full select-none object-contain", imageClassName)}
      />
      <span
        className={cn(
          "pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-8 text-center font-semibold leading-none tracking-normal text-[#ffc978] [text-shadow:0_2px_2px_rgba(34,10,20,0.88),0_0_14px_rgba(255,198,104,0.26)]",
          contentClassName,
        )}
      >
        {children}
      </span>
    </>
  );
  const classes = cn(
    "relative block transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-[#f7d58b] disabled:cursor-wait disabled:opacity-70",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={classes} style={style} aria-label={accessibleLabel}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={classes}
      style={style}
      aria-label={accessibleLabel}
    >
      {content}
    </button>
  );
}

export function AssetTextButton({
  frame,
  children,
  href,
  iconSrc,
  type = "button",
  onClick,
  disabled,
  ariaLabel,
  ariaPressed,
  className,
  contentClassName,
  iconClassName,
  style,
}: AssetTextButtonProps) {
  const content = (
    <>
      <Image
        src={frame}
        alt=""
        fill
        sizes="382px"
        unoptimized
        className="pointer-events-none object-fill"
      />
      <span
        className={cn(
          "relative z-10 flex min-h-[3.75rem] items-center justify-center gap-2 px-5 py-3 text-center text-base font-bold text-[#f2c27d]",
          contentClassName,
        )}
      >
        {iconSrc ? (
          <span className={cn("relative h-8 w-8 shrink-0", iconClassName)} aria-hidden="true">
            <Image src={iconSrc} alt="" fill sizes="32px" unoptimized className="object-contain" />
          </span>
        ) : null}
        {children}
      </span>
    </>
  );
  const classes = cn(
    "manyang-button-glow-soft relative block w-full overflow-visible rounded-full transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-[#f7d58b] disabled:cursor-wait disabled:opacity-70",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={classes} style={style} aria-label={ariaLabel}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={classes}
      style={style}
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
    >
      {content}
    </button>
  );
}
