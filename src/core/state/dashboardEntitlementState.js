export const DASHBOARD_ENTITLEMENT_STATUS = Object.freeze({
  LOADING: 'LOADING',
  READY: 'READY',
  ERROR: 'ERROR',
});

export const EMPTY_DASHBOARD_ENTITLEMENTS = Object.freeze({
  invoice: false,
  export_pdf: false,
  client_portal: false,
  crm: false,
  automation: false,
  advanced_invoicing: false,
});

export function mapEntitlementRecord(record) {
  return {
    invoice: true,
    export_pdf: !!record?.export_pdf,
    client_portal: !!record?.client_portal,
    crm: !!record?.crm,
    automation: !!record?.automation,
    advanced_invoicing: !!record?.advanced_invoicing,
  };
}

export function buildDashboardEntitlementState({
  mode = 'live',
  session = null,
  authChecked = false,
  user = null,
  entitlementRecord = undefined,
  entitlementError = null,
  fallbackEntitlements = null,
  fallbackResolved = false,
} = {}) {
  if (entitlementError) {
    return {
      status: DASHBOARD_ENTITLEMENT_STATUS.ERROR,
      entitlements: null,
      error: entitlementError,
    };
  }

  if (mode !== 'live') {
    return {
      status: DASHBOARD_ENTITLEMENT_STATUS.READY,
      entitlements: fallbackEntitlements || EMPTY_DASHBOARD_ENTITLEMENTS,
      error: null,
    };
  }

  if (!authChecked) {
    return {
      status: DASHBOARD_ENTITLEMENT_STATUS.LOADING,
      entitlements: null,
      error: null,
    };
  }

  if (!session) {
    return {
      status: DASHBOARD_ENTITLEMENT_STATUS.READY,
      entitlements: fallbackEntitlements || EMPTY_DASHBOARD_ENTITLEMENTS,
      error: null,
    };
  }

  if (!user?.id) {
    return {
      status: DASHBOARD_ENTITLEMENT_STATUS.LOADING,
      entitlements: null,
      error: null,
    };
  }

  if (entitlementRecord && typeof entitlementRecord === 'object') {
    return {
      status: DASHBOARD_ENTITLEMENT_STATUS.READY,
      entitlements: mapEntitlementRecord(entitlementRecord),
      error: null,
    };
  }

  if (fallbackEntitlements && user.plan && fallbackResolved) {
    return {
      status: DASHBOARD_ENTITLEMENT_STATUS.READY,
      entitlements: fallbackEntitlements,
      error: null,
    };
  }

  if (entitlementRecord === undefined || fallbackEntitlements) {
    return {
      status: DASHBOARD_ENTITLEMENT_STATUS.LOADING,
      entitlements: null,
      error: null,
    };
  }

  return {
    status: DASHBOARD_ENTITLEMENT_STATUS.ERROR,
    entitlements: null,
    error: 'entitlement_unavailable',
  };
}
