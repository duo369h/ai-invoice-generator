import React from "react";

/**
 * Recursive UI tree validator to enforce Corvioz design system rules.
 * Throws an Error immediately if any design system or layout boundary violation is detected.
 */
export function validateUI(node: any) {
  if (!node) return;

  if (Array.isArray(node)) {
    node.forEach(child => validateUI(child));
    return;
  }

  // React element check
  if (React.isValidElement(node)) {
    const props: any = node.props || {};
    const type: any = node.type;
    
    // Resolve element or component name
    let typeName = "";
    if (typeof type === "string") {
      typeName = type;
    } else if (type && typeof type === "object") {
      typeName = type.displayName || type.name || "";
    } else if (typeof type === "function") {
      typeName = type.displayName || type.name || "";
    }

    // 1. INLINE STYLE CHECK (style={{ ... }} in /app UI layer)
    if (props.style) {
      const styleKeys = Object.keys(props.style);
      if (styleKeys.length > 0) {
        // Properties that must be declared in CSS sheets instead of inline styles
        const forbiddenStyleKeys = [
          "background",
          "backgroundColor",
          "color",
          "border",
          "borderColor",
          "borderWidth",
          "borderStyle",
          "margin",
          "padding",
          "position",
          "transform",
          "zIndex",
          "boxShadow",
          "borderRadius"
        ];

        for (const key of styleKeys) {
          const val = props.style[key];
          
          // Hex color block inside inline styles
          if (typeof val === "string") {
            const hexRegex = /#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/;
            if (hexRegex.test(val)) {
              throw new Error(`[UI_GATE] Direct color hex code usage "${val}" is forbidden in inline style. Use design tokens.`);
            }
            if (val.includes("!important")) {
              throw new Error(`[UI_GATE] "!important" flag is forbidden inside inline styles.`);
            }
          }

          // Strict block of layout/design inline overrides
          if (forbiddenStyleKeys.includes(key)) {
            // Exclude dynamic engine tokens (variables) and allowed positioning for mockups/tooltips/modals
            const isMockupOrModal = 
              typeName.toLowerCase().includes("mockup") ||
              typeName.toLowerCase().includes("modal") ||
              typeName.toLowerCase().includes("tooltip") ||
              typeName.toLowerCase().includes("dialog") ||
              typeName.toLowerCase().includes("popup") ||
              typeName.toLowerCase().includes("overlay") ||
              (props.className && (
                props.className.includes("mockup") ||
                props.className.includes("modal") ||
                props.className.includes("tooltip") ||
                props.className.includes("dialog") ||
                props.className.includes("popup") ||
                props.className.includes("overlay")
              ));

            // Exclude card components for transforms
            const isCard = 
              typeName.toLowerCase().includes("card") ||
              typeName.toLowerCase().includes("pricing") ||
              (props.className && (
                props.className.includes("card") ||
                props.className.includes("pricing")
              ));

            // Exclude position: absolute for mockups, tooltips, modals
            if (key === "position" && val === "absolute" && !isMockupOrModal) {
              throw new Error(`[UI_GATE] position: absolute is forbidden outside mockups/modals. Found in element: ${typeName}`);
            }

            // Exclude transform for card elements or simple rotations
            if (key === "transform" && !isCard && !(typeof val === "string" && val.includes("rotate"))) {
              throw new Error(`[UI_GATE] transform is forbidden in non-card components. Found in: ${typeName}`);
            }

            // Direct CSS inline rule violation
            if (key !== "position" && key !== "transform" && !key.startsWith("--")) {
              throw new Error(`[UI_GATE] Inline style property "${key}" is forbidden in the /app UI layer. Use CSS classes.`);
            }
          }
        }
      }
    }

    // 2. Direct padding/margin overrides on <section> tags
    if (typeName === "section" && props.style) {
      if (props.style.padding !== undefined || props.style.margin !== undefined) {
        throw new Error(`[UI_GATE] Direct padding/margin style overrides on <section> tags are forbidden.`);
      }
    }

    // 3. ARCHITECTURE BREAKS: Pricing calculation or UI decision logic inside page/non-pricing components
    if (
      !typeName.toLowerCase().includes("pricing") && 
      !typeName.toLowerCase().includes("checkout") && 
      !typeName.toLowerCase().includes("payment")
    ) {
      const forbiddenProps = ["priceMonthly", "priceYearly", "calculatePrice"];
      for (const prop of forbiddenProps) {
        if (props[prop] !== undefined) {
          throw new Error(`[UI_GATE] Pricing calculation prop "${prop}" found in non-pricing component "${typeName}". Pricing logic is restricted to the pricing module.`);
        }
      }
    }

    // Recursive traversal of children
    if (props.children) {
      React.Children.forEach(props.children, child => {
        validateUI(child);
      });
    }
  }
}
