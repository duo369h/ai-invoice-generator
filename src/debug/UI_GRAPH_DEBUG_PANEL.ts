import { getDashboardUI } from "../core/ui/GET_DASHBOARD_UI.ts";

export interface UIGraphDebugPanel {
  title: string;
  generated_at: string;
  tree: {
    revenueUI: any;
    leadsUI: any;
    invoicesUI: any;
    quotesUI: any;
    activityUI: any;
    actionsUI: any;
  };
  full_graph: any;
}

export function getUIGraphDebugPanel(data: any = {}): UIGraphDebugPanel {
  const graph = getDashboardUI(data);

  const getSectionProps = (type: string) => {
    return graph.sections.find((s) => s.type === type)?.props || null;
  };

  return {
    title: "UI Graph Debug Panel",
    generated_at: new Date(0).toISOString(),
    tree: {
      revenueUI: graph.revenueUI,
      leadsUI: getSectionProps("LEADS"),
      invoicesUI: getSectionProps("INVOICES"),
      quotesUI: getSectionProps("QUOTES"),
      activityUI: getSectionProps("ACTIVITY"),
      actionsUI: getSectionProps("ACTIONS"),
    },
    full_graph: graph,
  };
}

export function renderUIGraphDebugPanel(data: any = {}): string {
  const debugPanel = getUIGraphDebugPanel(data);
  return JSON.stringify(debugPanel, null, 2);
}
