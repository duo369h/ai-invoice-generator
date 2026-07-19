'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { saveDashboardDocument } from './dashboard-document-save';
// Telemetry layer purged - UI is pure render only
const trackEvent = () => {};

const MOCK_USER = {
  id: 'mock-user-123',
  email: 'hello@corvioz.com',
  name: 'Jane Doe',
  plan: 'free',
  quota: null
};

const MOCK_LEADS = [
  {
    id: 'lead-1',
    client_name: 'Stark Industries',
    client_email: 'pepper@stark.com',
    lead_value: 5000,
    pipeline_status: 'Qualified',
    message: 'Looking for a freelance developer to audit and polish our client onboarding portal.',
    created_at: '2026-06-18T10:00:00Z'
  },
  {
    id: 'lead-2',
    client_name: 'Acme Corporation',
    client_email: 'wile@acme.com',
    lead_value: 2500,
    pipeline_status: 'New',
    message: 'Need a professional estimate quote for a Next.js landing page design and setup.',
    created_at: '2026-06-19T14:30:00Z'
  }
];

const MOCK_QUOTES = [
  {
    id: 'qt-1',
    quote_number: 'QT-2026-001',
    client_name: 'Oscorp',
    total: 480000,
    currency: 'USD',
    status: 'sent',
    created_at: '2026-06-16T09:00:00Z'
  },
  {
    id: 'qt-2',
    quote_number: 'QT-2026-002',
    client_name: 'Gringotts',
    total: 120000,
    currency: 'USD',
    status: 'draft',
    created_at: '2026-06-17T11:00:00Z'
  },
  {
    id: 'qt-3',
    quote_number: 'QT-2026-003',
    client_name: 'Tyrell Corp',
    total: 650000,
    currency: 'USD',
    status: 'sent',
    created_at: '2026-06-18T15:00:00Z'
  }
];

const MOCK_INVOICES = [
  {
    id: 'inv-1',
    invoice_number: 'INV-2026-001',
    client_name: 'Stark Industries',
    total: 250000,
    currency: 'USD',
    status: 'paid',
    created_at: '2026-06-01T08:00:00Z'
  },
  {
    id: 'inv-2',
    invoice_number: 'INV-2026-002',
    client_name: 'Wayne Enterprises',
    total: 192000,
    currency: 'USD',
    status: 'paid',
    created_at: '2026-06-05T10:00:00Z'
  },
  {
    id: 'inv-3',
    invoice_number: 'INV-2026-003',
    client_name: 'Acme Corp',
    total: 150000,
    currency: 'USD',
    status: 'paid',
    created_at: '2026-06-10T09:30:00Z'
  },
  {
    id: 'inv-4',
    invoice_number: 'INV-2026-004',
    client_name: 'Wayne Enterprises',
    total: 250000,
    currency: 'USD',
    status: 'paid',
    created_at: '2026-06-12T14:00:00Z'
  },
  {
    id: 'inv-5',
    invoice_number: 'INV-2026-005',
    client_name: 'Wayne Enterprises',
    total: 320000,
    currency: 'USD',
    status: 'sent',
    created_at: '2026-06-15T11:00:00Z'
  },
  {
    id: 'inv-6',
    invoice_number: 'INV-2026-006',
    client_name: 'LexCorp',
    total: 145000,
    currency: 'USD',
    status: 'overdue',
    created_at: '2026-05-18T13:00:00Z'
  }
];

const MOCK_CLIENTS = [
  { id: 'cli-1', name: 'Wayne Enterprises', email: 'billing@wayne.com', address: '1007 Mountain Dr, Gotham' },
  { id: 'cli-2', name: 'Stark Industries', email: 'pepper@stark.com', address: '10880 Wilshire Blvd, Los Angeles' },
  { id: 'cli-3', name: 'Acme Corp', email: 'roadrunner@acme.com', address: '123 Desert Trail, Arizona' }
];

const MOCK_PROFILE = {
  username: 'guest',
  name: 'Jane Doe',
  title: 'SaaS Designer & Developer',
  bio: 'I build premium products for early stage startups.',
  tags: ['React', 'Next.js', 'Figma', 'UI/UX'],
  email: 'hello@corvioz.com',
  services: [],
  portfolio: [],
  testimonials: [],
  cover_banner: '',
  avatar_url: '',
  location: 'Remote',
  timezone: 'EST',
  languages: 'English',
  availability_status: 'Available for contract',
  starting_price: '$1,500',
  verified_badge: true,
  top_rated_badge: true,
  is_public: true
};

export async function loadDashboardResources({
  token,
  fetchImpl,
  getAuthHeaders,
  setUser,
  setInvoices,
  setClients,
  setLeads,
  setQuotes,
  setCardProfile,
  onQuotesSettled = () => {},
  consoleImpl = console,
}) {
  const authHeaders = getAuthHeaders(token);
  const createNormalizedResourceTask = ({ url, label, selectData }) => {
    return (async () => {
      let response;
      try {
        response = await fetchImpl(url, { headers: authHeaders });
      } catch (error) {
        consoleImpl.error(`Failed to fetch ${label}:`, error);
        return { status: 'network_error', error };
      }

      if (!response.ok) {
        consoleImpl.error(`Failed to fetch ${label}:`, response.status);
        return { status: 'http_error', httpStatus: response.status };
      }

      try {
        const body = await response.json();
        return { status: 'success', data: selectData(body) };
      } catch (error) {
        consoleImpl.error(`Failed to fetch ${label}:`, error);
        return { status: 'parse_error', error };
      }
    })();
  };

  const resourceTasks = {
    user: createNormalizedResourceTask({
      url: '/api/user',
      label: 'user',
      selectData: (body) => body,
    }),
    invoices: createNormalizedResourceTask({
      url: '/api/invoices',
      label: 'invoices',
      selectData: (body) => body.data || [],
    }),
    clients: createNormalizedResourceTask({
      url: '/api/clients',
      label: 'clients',
      selectData: (body) => body.data || [],
    }),
    leads: createNormalizedResourceTask({
      url: '/api/leads',
      label: 'leads',
      selectData: (body) => body.data || [],
    }),
    quotes: createNormalizedResourceTask({
      url: '/api/quotes',
      label: 'quotes',
      selectData: (body) => body.data || [],
    }),
    cardProfile: createNormalizedResourceTask({
      url: '/api/card-profile',
      label: 'card profile',
      selectData: (body) => body,
    }),
  };

  const userDecisionTask = resourceTasks.user.then((result) => {
    if (result.status !== 'success') {
      return { status: 'error', user: null, error: result.error || result };
    }

    const userData = result.data;
    setUser(userData);
    if (!userData?.hasActivated) {
      return { status: 'unactivated', user: userData };
    }

    return { status: 'activated', user: userData };
  });

  const consumeListResource = async ({ resultTask, setData }) => {
    const [userDecision, result] = await Promise.all([userDecisionTask, resultTask]);
    if (userDecision.status !== 'activated') return result;
    if (result.status === 'success') setData(result.data);
    else if (result.status === 'http_error') setData([]);
    return result;
  };

  const invoicesTask = consumeListResource({
    resultTask: resourceTasks.invoices,
    setData: setInvoices,
  });
  const clientsTask = consumeListResource({
    resultTask: resourceTasks.clients,
    setData: setClients,
  });
  const leadsTask = consumeListResource({
    resultTask: resourceTasks.leads,
    setData: setLeads,
  });
  const quotesTask = consumeListResource({
    resultTask: resourceTasks.quotes,
    setData: setQuotes,
  }).finally(() => {
    onQuotesSettled();
  });
  const cardProfileTask = (async () => {
    const [userDecision, result] = await Promise.all([userDecisionTask, resourceTasks.cardProfile]);
    if (userDecision.status !== 'activated') return result;
    if (result.status === 'success') setCardProfile(result.data);
    else if (result.status === 'http_error') setCardProfile(null);
    return result;
  })();

  const [userDecision] = await Promise.all([
    userDecisionTask,
    invoicesTask,
    clientsTask,
    leadsTask,
    quotesTask,
    cardProfileTask,
  ]);
  if (userDecision.status === 'error') {
    return { user: null, error: userDecision.error };
  }
  return { user: userDecision.user };
}

export function useDashboardData(mode, session = null) {
  const isLive = mode === 'live';
  const isDemo = mode === 'demo';
  const isPreview = mode === 'preview';

  // State initialization based on mode
  const [user, setUser] = useState(() => (isLive ? {} : MOCK_USER));
  const [leads, setLeads] = useState(() => (isLive ? [] : MOCK_LEADS));
  const [quotes, setQuotes] = useState(() => (isLive ? [] : MOCK_QUOTES));
  const [invoices, setInvoices] = useState(() => (isLive ? [] : MOCK_INVOICES));
  const [clients, setClients] = useState(() => (isLive ? [] : MOCK_CLIENTS));
  const [cardProfile, setCardProfile] = useState(() => (isLive ? null : MOCK_PROFILE));

  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(isLive);
  const [isQuotesLoading, setIsQuotesLoading] = useState(isLive);
  const isInitialLoadRef = useRef(isLive);
  const dashboardLoadVersionRef = useRef(0);

  const getAuthHeaders = useCallback((token) => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const fetchData = useCallback(async (token) => {
    if (!isLive) return;
    const loadVersion = dashboardLoadVersionRef.current + 1;
    dashboardLoadVersionRef.current = loadVersion;
    const setIfCurrent = (setter) => (value) => {
      if (dashboardLoadVersionRef.current === loadVersion) setter(value);
    };
    
    // Dashboard API Guard: Prevent calls if no session and no explicit token
    if (!token && !session) {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsInitialLoad(false);
      setIsQuotesLoading(false);
      return { user: null, error: 'no_session' };
    }

    setIsRefreshing(true);
    if (isInitialLoadRef.current) setIsQuotesLoading(true);
    const finishQuotesInitialLoad = () => {
      if (dashboardLoadVersionRef.current !== loadVersion) return;
      isInitialLoadRef.current = false;
      setIsQuotesLoading(false);
    };

    try {
      return await loadDashboardResources({
        token,
        fetchImpl: fetch,
        getAuthHeaders,
        setUser: setIfCurrent(setUser),
        setInvoices: setIfCurrent(setInvoices),
        setClients: setIfCurrent(setClients),
        setLeads: setIfCurrent(setLeads),
        setQuotes: setIfCurrent(setQuotes),
        setCardProfile: setIfCurrent(setCardProfile),
        onQuotesSettled: finishQuotesInitialLoad,
        consoleImpl: console,
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      finishQuotesInitialLoad();
      return { user: null, error };
    } finally {
      if (dashboardLoadVersionRef.current === loadVersion) {
        setIsLoading(false);
        setIsRefreshing(false);
        setIsInitialLoad(false);
      }
    }
  }, [isLive, getAuthHeaders]);

  const invalidateDashboardData = useCallback(({
    updateState = true,
    resetQuotesInitialLoad = true,
  } = {}) => {
    dashboardLoadVersionRef.current += 1;
    isInitialLoadRef.current = resetQuotesInitialLoad;
    if (!updateState) return;
    setIsLoading(false);
    setIsRefreshing(false);
    setIsInitialLoad(false);
    setIsQuotesLoading(false);
  }, []);

  // Reset demo back to baseline mock data
  const resetDemoData = useCallback(() => {
    if (!isDemo) return;
    setUser(MOCK_USER);
    setLeads(MOCK_LEADS);
    setQuotes(MOCK_QUOTES);
    setInvoices(MOCK_INVOICES);
    setClients(MOCK_CLIENTS);
    setCardProfile(MOCK_PROFILE);
    trackEvent('demo_reset', {});
  }, [isDemo]);

  // Save Quote Action
  const saveQuote = useCallback(async (payload, token = null) => {
    return saveDashboardDocument({
      documentType: 'quote', endpoint: '/api/quotes', payload, token, isDemo, isPreview,
      setDocuments: setQuotes, fetchData, getAuthHeaders,
    });
  }, [isDemo, isPreview, fetchData, getAuthHeaders]);

  // Save Invoice Action
  const saveInvoice = useCallback(async (payload, token = null) => {
    return saveDashboardDocument({
      documentType: 'invoice', endpoint: '/api/invoices', payload, token, isDemo, isPreview,
      setDocuments: setInvoices, fetchData, getAuthHeaders,
    });
  }, [isDemo, isPreview, fetchData, getAuthHeaders]);

  // Save Card Profile Action
  const saveCardProfile = useCallback(async (payload, token = null) => {
    if (isPreview) return { success: true };

    if (isDemo) {
      setCardProfile(prev => ({ ...prev, ...payload }));
      return { success: true };
    }

    try {
      const res = await fetch('/api/card-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders(token) },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        await fetchData(token);
        return { success: true };
      }
      const err = await res.json().catch(() => ({}));
      return { success: false, error: err.error || 'Failed to save card profile' };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }, [isDemo, isPreview, fetchData, getAuthHeaders]);

  // Delete Quote
  const deleteQuote = useCallback(async (id, token = null) => {
    if (isPreview) return { success: true };

    if (isDemo) {
      setQuotes(prev => prev.filter(q => q.id !== id));
      return { success: true };
    }

    try {
      const res = await fetch(`/api/quotes?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: getAuthHeaders(token)
      });
      if (res.ok) {
        await fetchData(token);
        return { success: true };
      }
      const data = await res.json().catch(() => ({}));
      return { success: false, error: data.error || 'Failed to delete quote' };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }, [isDemo, isPreview, fetchData, getAuthHeaders]);

  // Delete Invoice
  const deleteInvoice = useCallback(async (id, token = null) => {
    if (isPreview) return { success: true };

    if (isDemo) {
      setInvoices(prev => prev.filter(i => i.id !== id));
      return { success: true };
    }

    try {
      const res = await fetch(`/api/invoices?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: getAuthHeaders(token)
      });
      if (res.ok) {
        await fetchData(token);
        return { success: true };
      }
      const err = await res.json().catch(() => ({}));
      return { success: false, error: err.error || 'Failed to delete invoice' };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }, [isDemo, isPreview, fetchData, getAuthHeaders]);

  // Save Client Action
  const saveClient = useCallback(async (payload, token = null) => {
    if (isPreview) return { success: true };

    if (isDemo) {
      const clientId = payload.id || 'mock-cli-' + Date.now();
      const newClient = {
        id: clientId,
        ...payload,
        created_at: new Date().toISOString()
      };
      
      setClients(prev => {
        const idx = prev.findIndex(c => c.id === clientId);
        if (idx > -1) {
          const next = [...prev];
          next[idx] = newClient;
          return next;
        }
        return [...prev, newClient];
      });
      return { success: true, data: newClient };
    }

    // Live mode API request
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders(token) },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        await fetchData(token);
        return { success: true };
      }
      const err = await res.json().catch(() => ({}));
      return { success: false, error: err.error || 'Failed to save client' };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }, [isDemo, isPreview, fetchData, getAuthHeaders]);

  // Delete Client
  const deleteClient = useCallback(async (id, token = null) => {
    if (isPreview) return { success: true };

    if (isDemo) {
      setClients(prev => prev.filter(c => c.id !== id));
      return { success: true };
    }

    try {
      const res = await fetch(`/api/clients?id=${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(token)
      });
      if (res.ok) {
        await fetchData(token);
        return { success: true };
      }
      return { success: false, error: 'Failed to delete client' };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }, [isDemo, isPreview, fetchData, getAuthHeaders]);

  // Save/Update Lead
  const saveLead = useCallback(async (payload, token = null) => {
    if (isPreview) return { success: true };

    if (isDemo) {
      setLeads(prev => prev.map(l => l.id === payload.id ? { ...l, ...payload } : l));
      return { success: true };
    }

    try {
      const res = await fetch('/api/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders(token) },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        await fetchData(token);
        return { success: true };
      }
      const err = await res.json().catch(() => ({}));
      return { success: false, error: err.error || 'Failed to update lead' };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }, [isDemo, isPreview, fetchData, getAuthHeaders]);

  return {
    user,
    setUser,
    leads,
    setLeads,
    quotes,
    setQuotes,
    invoices,
    setInvoices,
    clients,
    setClients,
    cardProfile,
    setCardProfile,
    isLoading,
    isRefreshing,
    isQuotesLoading,
    invalidateDashboardData,
    fetchData,
    resetDemoData,
    saveQuote,
    saveInvoice,
    saveCardProfile,
    deleteQuote,
    deleteInvoice,
    saveClient,
    deleteClient,
    saveLead
  };
}
