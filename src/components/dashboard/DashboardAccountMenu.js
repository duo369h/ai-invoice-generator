'use client';

import React, { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

// Keep this small UI surface outside the rail's mobile overflow/stacking context.
export default function DashboardAccountMenu({ anchorRef, sidebarCollapsed, onClose, children }) {
  const menuRef = useRef(null);
  const [position, setPosition] = useState(null);
  const positioned = Boolean(position);

  useLayoutEffect(() => {
    const anchor = anchorRef.current;
    const menu = menuRef.current;
    if (!anchor || !menu) return;

    const updatePosition = () => {
      const trigger = anchor.getBoundingClientRect();
      // The existing Harbor mobile navigation shares accountMenuOpen.
      // Keep this desktop portal hidden when its own trigger is not rendered.
      if (!trigger.width || !trigger.height) { setPosition(null); return; }
      const rail = anchor.closest('.dashboard-sidebar-aside')?.getBoundingClientRect();
      const box = menu.getBoundingClientRect();
      const viewport = window.visualViewport;
      const leftEdge = viewport?.offsetLeft || 0;
      const topEdge = viewport?.offsetTop || 0;
      const width = viewport?.width || window.innerWidth;
      const height = viewport?.height || window.innerHeight;
      // Follow the rendered rail, including V2's own mobile breakpoint.
      const collapsed = sidebarCollapsed && rail?.width > 0 && rail.width <= 100;
      const preferredLeft = collapsed && rail ? rail.right + 8 : trigger.right - box.width;
      const preferredTop = collapsed ? trigger.bottom - box.height : trigger.top - box.height - 8;
      const next = {
        left: Math.max(leftEdge + 8, Math.min(preferredLeft, leftEdge + width - box.width - 8)),
        top: Math.max(topEdge + 8, Math.min(preferredTop, topEdge + height - box.height - 8)),
        width: Math.max(0, width - 16),
        height: Math.max(0, height - 16),
      };
      setPosition((current) => current && Object.keys(next).every((key) => current[key] === next[key]) ? current : next);
    };

    updatePosition();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(updatePosition);
    observer?.observe(anchor);
    observer?.observe(menu);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    window.visualViewport?.addEventListener('resize', updatePosition);
    window.visualViewport?.addEventListener('scroll', updatePosition);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
      window.visualViewport?.removeEventListener('resize', updatePosition);
      window.visualViewport?.removeEventListener('scroll', updatePosition);
    };
  }, [anchorRef, sidebarCollapsed]);

  useLayoutEffect(() => {
    if (positioned) menuRef.current?.querySelector('[role="menuitem"]')?.focus({ preventScroll: true });
  }, [positioned]);

  if (typeof document === 'undefined') return null;
  return createPortal(
    <div
      ref={menuRef}
      role="menu"
      aria-label="Account menu"
      className="dashboard-account-menu"
      data-positioned={positioned}
      style={position ? {
        '--account-menu-left': `${position.left}px`,
        '--account-menu-top': `${position.top}px`,
        '--account-menu-width': `${position.width}px`,
        '--account-menu-height': `${position.height}px`,
      } : undefined}
      onKeyDown={(event) => {
        if (event.key !== 'Escape') return;
        event.stopPropagation();
        onClose();
        anchorRef.current?.focus({ preventScroll: true });
      }}
    >
      {children}
    </div>,
    document.body,
  );
}
