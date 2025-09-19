import * as React from "react";
import { cn } from "@/lib/utils";

const PixelCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative bg-card text-card-foreground border-2 border-solid border-primary/30 shadow-lg",
      "pixel-border bg-gradient-to-br from-card to-card/90",
      "before:absolute before:inset-0 before:bg-gradient-to-br before:from-primary/10 before:to-transparent before:rounded-sm",
      className
    )}
    {...props}
  />
));
PixelCard.displayName = "PixelCard";

const PixelCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col space-y-1.5 p-4 border-b-2 border-primary/20",
      "bg-gradient-to-r from-primary/10 to-primary/5",
      className
    )}
    {...props}
  />
));
PixelCardHeader.displayName = "PixelCardHeader";

const PixelCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-lg font-bold leading-none tracking-tight text-primary pixel-text",
      "drop-shadow-sm",
      className
    )}
    {...props}
  />
));
PixelCardTitle.displayName = "PixelCardTitle";

const PixelCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground pixel-text", className)}
    {...props}
  />
));
PixelCardDescription.displayName = "PixelCardDescription";

const PixelCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-4", className)} {...props} />
));
PixelCardContent.displayName = "PixelCardContent";

const PixelCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center p-4 pt-0 border-t-2 border-primary/10",
      className
    )}
    {...props}
  />
));
PixelCardFooter.displayName = "PixelCardFooter";

export {
  PixelCard,
  PixelCardHeader,
  PixelCardFooter,
  PixelCardTitle,
  PixelCardDescription,
  PixelCardContent,
};