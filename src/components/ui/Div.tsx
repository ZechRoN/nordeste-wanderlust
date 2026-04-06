import * as React from "react";
import { cn } from "@/lib/utils";

type Skin =
  | "panel"
  | "panel-header"
  | "panel-title-bar"
  | "panel-content"
  | "panel-footer"
  | "tabs"
  | "slot"
  | "none";

type DivProps = React.HTMLAttributes<HTMLDivElement> & { role?: React.AriaRole; skin?: Skin };

class FallbackBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch() {}
  render() {
    if (this.state.hasError) {
      return React.createElement("div", {}, this.props.children as React.ReactNode);
    }
    return this.props.children as React.ReactElement;
  }
}

export const Div = React.forwardRef<HTMLDivElement, DivProps>(function Div(props, ref) {
  const { children, className, skin = "none", ...rest } = props;
  const skinClass =
    skin === "panel"
      ? "rpg-panel flex flex-col"
      : skin === "panel-header"
      ? "rpg-panel-header"
      : skin === "panel-title-bar"
      ? "rpg-panel-title-bar"
      : skin === "panel-content"
      ? "rpg-panel-content"
      : skin === "panel-footer"
      ? "rpg-panel-footer"
      : skin === "tabs"
      ? "rpg-tabs"
      : skin === "slot"
      ? "rpg-slot"
      : undefined;
  return (
    <FallbackBoundary>
      {React.createElement(
        "div",
        { ref, className: cn(skinClass, className), ...rest },
        children as React.ReactNode
      )}
    </FallbackBoundary>
  );
});
