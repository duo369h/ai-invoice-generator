'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { generatePDF } from '../lib/pdf';
import { createBrowserSupabaseClient } from '../lib/supabase-client';
import { getSupportEmail } from '../lib/config';
import ThemeToggle from '../components/ThemeToggle';

// Helper functions for random generation to maintain purity in render
const generateRandomId = (prefix) => `${prefix}_${Math.random().toString(36).substring(2, 14)}`;
const generateRandomNumberString = (prefix) => `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
const generateRandomPdfUrl = () => `/dashboard/print?id=${Math.random().toString(36).substring(2, 14)}`;

// Helpers to serialize/deserialize custom metadata in the text notes column
const serializeInvoiceNotes = (baseNotes, metadata) => {
  return `${baseNotes || ''}\n\n---METADATA---\n${JSON.stringify(metadata)}`;
};

const deserializeInvoiceNotes = (fullNotes) => {
  if (!fullNotes) return { notes: '', billing_type: 'standard', late_fee: 0, auto_reminder: false };
  const parts = fullNotes.split('\n\n---METADATA---\n');
  if (parts.length > 1) {
    try {
      const meta = JSON.parse(parts[1]);
      return {
        notes: parts[0],
        billing_type: meta.billing_type || 'standard',
        late_fee: meta.late_fee || 0,
        auto_reminder: !!meta.auto_reminder
      };
    } catch (e) {
      // Ignore JSON parse error, return as plain notes
    }
  }
  return { notes: fullNotes, billing_type: 'standard', late_fee: 0, auto_reminder: false };
};

// Render interactive invoice payment status timeline
const renderInvoiceTimeline = (status) => {
  const stages = [
    { key: 'created', label: 'Created', done: true, active: status === 'draft' },
    { key: 'viewed', label: 'Sent', done: ['pending', 'sent', 'paid', 'overdue'].includes(status), active: status === 'pending' },
    { key: 'opened', label: 'Opened', done: ['sent', 'paid', 'overdue'].includes(status), active: status === 'sent' },
    { key: 'paid', label: 'Paid', done: status === 'paid', active: status === 'paid', overdue: status === 'overdue' }
  ];

  return (
    <div style={{ marginBottom: '28px', padding: '16px 20px', background: 'var(--btn-secondary-bg)', borderRadius: '12px', border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', width: '100%', maxWidth: '500px', margin: '0 auto' }}>
        
        {/* Connecting line */}
        <div style={{ position: 'absolute', top: '15px', left: '10%', right: '10%', height: '2px', backgroundColor: 'var(--border)', zIndex: 1 }} />
        <div style={{
          position: 'absolute',
          top: '15px',
          left: '10%',
          width: status === 'paid' ? '80%' : (status === 'sent' || status === 'overdue' ? '53%' : (status === 'pending' ? '26%' : '0%')),
          height: '2px',
          backgroundColor: status === 'overdue' ? 'var(--danger)' : 'var(--success)',
          zIndex: 1,
          transition: 'width 0.4s ease'
        }} />

        {stages.map((stage, idx) => {
          let dotBg = 'var(--background-card)';
          let dotBorder = '2px solid var(--border)';
          let textColor = 'var(--text-muted)';
          let fontWeight = 400;

          if (stage.done) {
            dotBg = stage.overdue ? 'var(--danger)' : 'var(--success)';
            dotBorder = `2px solid ${stage.overdue ? 'var(--danger)' : 'var(--success)'}`;
            textColor = stage.overdue ? 'var(--danger)' : 'var(--text-main)';
            fontWeight = 700;
          } else if (stage.active) {
            dotBg = 'var(--accent)';
            dotBorder = '2px solid var(--accent)';
            textColor = 'var(--accent)';
            fontWeight = 700;
          }

          return (
            <div key={stage.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, position: 'relative', width: '60px' }}>
              <div style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                backgroundColor: dotBg,
                border: dotBorder,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                color: stage.done ? '#000' : 'var(--text-main)',
                fontWeight: 800,
                boxShadow: stage.active ? '0 0 12px var(--accent)' : 'none',
                transition: 'all 0.3s ease'
              }}>
                {stage.done && !stage.overdue ? '✓' : (stage.overdue ? '!' : idx + 1)}
              </div>
              <span style={{ fontSize: '0.7rem', marginTop: '6px', color: textColor, fontWeight, whiteSpace: 'nowrap' }}>
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function Dashboard() {
  const router = useRouter();
  const supportEmail = getSupportEmail();

  // Navigation / Tabs
  const [activeTab, setActiveTab] = useState('overview'); // overview, leads, quotes, invoices, clients, profile
  const [session, setSession] = useState(null);
  const [supabaseClient, setSupabaseClient] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  // User details
  const [user, setUser] = useState({
    id: '',
    email: '',
    name: 'Guest User',
    plan: 'free',
    quota: null
  });

  // DB collections
  const [leads, setLeads] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [cardProfile, setCardProfile] = useState(null);

  // Local storage sandboxed fallbacks for Guest/Mock mode
  const [sandboxLeads, setSandboxLeads] = useState([]);
  const [sandboxQuotes, setSandboxQuotes] = useState([]);
  const [sandboxInvoices, setSandboxInvoices] = useState([]);
  const [sandboxClients, setSandboxClients] = useState([]);
  const [sandboxProfile, setSandboxProfile] = useState(null);

  // Interactive Task List state for the Business Overview tab
  const [upcomingTasks, setUpcomingTasks] = useState([
    { id: 1, text: 'Review inbound lead from Bruce Wayne', done: false },
    { id: 2, text: 'Draft milestone proposal for Wayne Enterprises', done: false },
    { id: 3, text: 'Set up custom Stripe invoice checkout link', done: true },
    { id: 4, text: 'Follow up with Tony Stark on pending invoice', done: false }
  ]);
  const [newTaskText, setNewTaskText] = useState('');

  const toggleTask = (id) => {
    setUpcomingTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const addTask = (e) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    setUpcomingTasks(prev => [
      ...prev,
      { id: Date.now(), text: newTaskText.trim(), done: false }
    ]);
    setNewTaskText('');
  };

  const deleteTask = (id) => {
    setUpcomingTasks(prev => prev.filter(t => t.id !== id));
  };

  // Interactive View Toggles
  const [quoteView, setQuoteView] = useState('list'); // list, create, edit
  const [invoiceView, setInvoiceView] = useState('list'); // list, create, edit
  const [isParsingLead, setIsParsingLead] = useState(null); // ID of lead parsing
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // Quote Editor State
  const [qId, setQId] = useState('');
  const [qNumber, setQNumber] = useState('');
  const [qClientName, setQClientName] = useState('');
  const [qClientEmail, setQClientEmail] = useState('');
  const [qClientAddress, setQClientAddress] = useState('');
  const [qItems, setQItems] = useState([{ description: '', quantity: 1, unitPrice: 0 }]);
  const [qTaxRate, setQTaxRate] = useState(0);
  const [qDiscountRate, setQDiscountRate] = useState(0);
  const [qCurrency, setQCurrency] = useState('USD');
  const [qNotes, setQNotes] = useState('');
  const [qDate, setQDate] = useState('');
  const [qStatus, setQStatus] = useState('draft');

  // Invoice Editor State
  const [invId, setInvId] = useState('');
  const [invNumber, setInvNumber] = useState('');
  const [invClientName, setInvClientName] = useState('');
  const [invClientEmail, setInvClientEmail] = useState('');
  const [invClientAddress, setInvClientAddress] = useState('');
  const [invItems, setInvItems] = useState([{ description: '', quantity: 1, unitPrice: 0 }]);
  const [invTaxRate, setInvTaxRate] = useState(0);
  const [invDiscountRate, setInvDiscountRate] = useState(0);
  const [invCurrency, setInvCurrency] = useState('USD');
  const [invNotes, setInvNotes] = useState('');
  const [invDate, setInvDate] = useState('');
  const [invDueDate, setInvDueDate] = useState('');
  const [invPaymentTerms, setInvPaymentTerms] = useState('Net 30');
  const [invStatus, setInvStatus] = useState('pending');
  const [invPaymentLink, setInvPaymentLink] = useState('');
  const [invQuoteId, setInvQuoteId] = useState(null);
  const [invBillingType, setInvBillingType] = useState('standard');
  const [invLateFee, setInvLateFee] = useState(0);
  const [invAutoReminder, setInvAutoReminder] = useState(false);

  // Copilot State
  const [copilotTool, setCopilotTool] = useState('proposal'); // proposal, scope, pricing, followup, contract
  const [copilotPrompt, setCopilotPrompt] = useState('');
  const [copilotOutput, setCopilotOutput] = useState('');
  const [isGeneratingCopilot, setIsGeneratingCopilot] = useState(false);
  const [copilotClient, setCopilotClient] = useState('');
  const [copilotRole, setCopilotRole] = useState('Developer');
  const [copilotExtra, setCopilotExtra] = useState('Medium');

  // Client editor state
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientAddress, setNewClientAddress] = useState('');

  // Card Profile Editor State
  const [cpUsername, setCpUsername] = useState('');
  const [cpName, setCpName] = useState('');
  const [cpTitle, setCpTitle] = useState('');
  const [cpBio, setCpBio] = useState('');
  const [cpTags, setCpTags] = useState('');
  const [cpEmail, setCpEmail] = useState('');
  const [cpPhone, setCpPhone] = useState('');
  const [cpTwitter, setCpTwitter] = useState('');
  const [cpLinkedin, setCpLinkedin] = useState('');
  const [cpGithub, setCpGithub] = useState('');
  const [cpWebsite, setCpWebsite] = useState('');
  const [cpServices, setCpServices] = useState([]);
  const [cpPortfolio, setCpPortfolio] = useState([]);
  // New card profile attributes
  const [cpCoverBanner, setCpCoverBanner] = useState('');
  const [cpAvatarUrl, setCpAvatarUrl] = useState('');
  const [cpLocation, setCpLocation] = useState('');
  const [cpTimezone, setCpTimezone] = useState('');
  const [cpLanguages, setCpLanguages] = useState('');
  const [cpAvailabilityStatus, setCpAvailabilityStatus] = useState('Available for contract');
  const [cpResponseTime, setCpResponseTime] = useState('< 2 hours');
  const [cpStartingPrice, setCpStartingPrice] = useState('$1,000');
  const [cpCalendlyLink, setCpCalendlyLink] = useState('');
  const [cpVerifiedBadge, setCpVerifiedBadge] = useState(true);
  const [cpTopRatedBadge, setCpTopRatedBadge] = useState(false);
  const [cpFastResponseBadge, setCpFastResponseBadge] = useState(false);
  const [cpTestimonials, setCpTestimonials] = useState([]);

  // Temp service/portfolio/testimonials add inputs
  const [tmpSrvName, setTmpSrvName] = useState('');
  const [tmpSrvDesc, setTmpSrvDesc] = useState('');
  const [tmpSrvType, setTmpSrvType] = useState('fixed');
  const [tmpSrvAmount, setTmpSrvAmount] = useState(0);
  
  const [tmpProjTitle, setTmpProjTitle] = useState('');
  const [tmpProjDesc, setTmpProjDesc] = useState('');
  const [tmpProjLink, setTmpProjLink] = useState('');

  const [tmpClientName, setTmpClientName] = useState('');
  const [tmpClientProject, setTmpClientProject] = useState('');
  const [tmpClientFeedback, setTmpClientFeedback] = useState('');

  // Lead CRM Editor panel states
  const [selectedLead, setSelectedLead] = useState(null);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [leadPipelineStatus, setLeadPipelineStatus] = useState('New');
  const [leadValue, setLeadValue] = useState(0);
  const [leadSource, setLeadSource] = useState('');
  const [leadTags, setLeadTags] = useState('');
  const [leadLastContactDate, setLeadLastContactDate] = useState('');
  const [leadNotes, setLeadNotes] = useState('');
  const [leadReminderDate, setLeadReminderDate] = useState('');

  // Quote AI Scope Expansion prompt
  const [quotePrompt, setQuotePrompt] = useState('');
  const [isExpandingQuote, setIsExpandingQuote] = useState(false);
  // Modals
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [selectedInvoiceForReminder, setSelectedInvoiceForReminder] = useState(null);
  const [activeReminderTemplate, setActiveReminderTemplate] = useState('7');
  const [reminderCopied, setReminderCopied] = useState(false);

  const getCurrencySymbol = (cur) => {
    switch (String(cur).toUpperCase()) {
      case 'EUR': return '€';
      case 'GBP': return '£';
      case 'CNY': return '¥';
      case 'JPY': return '¥';
      default: return '$';
    }
  };

  const isPro = user?.plan === 'pro' || user?.plan === 'professional' || user?.plan === 'Professional';
  const isFree = !isPro;

  // Dates helpers
  const getTodayString = () => new Date().toISOString().substring(0, 10);
  const getFutureDateString = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().substring(0, 10);
  };

  // Adjust due dates based on payment terms
  const updateDueDateFromTerms = (terms, dateStr) => {
    const baseDate = dateStr ? new Date(dateStr) : new Date();
    if (isNaN(baseDate.getTime())) return;
    if (terms === 'Due on Receipt') setInvDueDate(dateStr);
    else if (terms === 'Net 15') {
      const d = new Date(baseDate);
      d.setDate(d.getDate() + 15);
      setInvDueDate(d.toISOString().substring(0, 10));
    } else if (terms === 'Net 30') {
      const d = new Date(baseDate);
      d.setDate(d.getDate() + 30);
      setInvDueDate(d.toISOString().substring(0, 10));
    } else if (terms === 'Net 60') {
      const d = new Date(baseDate);
      d.setDate(d.getDate() + 60);
      setInvDueDate(d.toISOString().substring(0, 10));
    }
  };

  const initProfileStates = (parsed) => {
    if (!parsed) return;
    setCardProfile(parsed);
    setCpUsername(parsed.username || '');
    setCpName(parsed.name || '');
    setCpTitle(parsed.title || '');
    setCpBio(parsed.bio || '');
    setCpTags(Array.isArray(parsed.tags) ? parsed.tags.join(', ') : (typeof parsed.tags === 'string' ? JSON.parse(parsed.tags || '[]').join(', ') : ''));
    setCpEmail(parsed.contact_email || parsed.email || '');
    setCpPhone(parsed.contact_phone || '');
    const links = parsed.social_links || {};
    setCpTwitter(links.twitter || '');
    setCpLinkedin(links.linkedin || '');
    setCpGithub(links.github || '');
    setCpWebsite(links.website || '');
    setCpServices(Array.isArray(parsed.services) ? parsed.services : JSON.parse(parsed.services || '[]'));
    setCpPortfolio(Array.isArray(parsed.portfolio) ? parsed.portfolio : JSON.parse(parsed.portfolio || '[]'));
    
    // Sleek new details
    setCpCoverBanner(parsed.cover_banner || '');
    setCpAvatarUrl(parsed.avatar_url || '');
    setCpLocation(parsed.location || '');
    setCpTimezone(parsed.timezone || '');
    setCpLanguages(parsed.languages || '');
    setCpAvailabilityStatus(parsed.availability_status || 'Available for contract');
    setCpResponseTime(parsed.response_time || '< 2 hours');
    setCpStartingPrice(parsed.starting_price || '$1,000');
    setCpCalendlyLink(parsed.calendly_link || '');
    setCpVerifiedBadge(parsed.verified_badge !== false);
    setCpTopRatedBadge(parsed.top_rated_badge === true);
    setCpFastResponseBadge(parsed.fast_response_badge === true);
    setCpTestimonials(Array.isArray(parsed.testimonials) ? parsed.testimonials : JSON.parse(parsed.testimonials || '[]'));
  };

  // Sync state helpers
  const saveSandboxLeads = (list) => {
    setSandboxLeads(list);
    localStorage.setItem('sandbox_leads', JSON.stringify(list));
  };
  const saveSandboxQuotes = (list) => {
    setSandboxQuotes(list);
    localStorage.setItem('sandbox_quotes', JSON.stringify(list));
  };
  const saveSandboxInvoices = (list) => {
    setSandboxInvoices(list);
    localStorage.setItem('sandbox_invoices', JSON.stringify(list));
  };
  const saveSandboxClients = (list) => {
    setSandboxClients(list);
    localStorage.setItem('sandbox_clients', JSON.stringify(list));
  };
  const saveSandboxProfile = (profileObj) => {
    setSandboxProfile(profileObj);
    localStorage.setItem('sandbox_profile', JSON.stringify(profileObj));
  };

  // Load localStorage on client mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedLeads = localStorage.getItem('sandbox_leads');
      const storedQuotes = localStorage.getItem('sandbox_quotes');
      const storedInvoices = localStorage.getItem('sandbox_invoices');
      const storedClients = localStorage.getItem('sandbox_clients');
      const storedProfile = localStorage.getItem('sandbox_profile');

      setTimeout(async () => {
        if (storedLeads) {
          setSandboxLeads(JSON.parse(storedLeads));
        } else if (!session) {
          try {
            const res = await fetch('/api/leads');
            if (res.ok) {
              const d = await res.json();
              if (d.data) saveSandboxLeads(d.data);
            }
          } catch (e) {}
        }

        if (storedQuotes) {
          setSandboxQuotes(JSON.parse(storedQuotes));
        } else if (!session) {
          try {
            const res = await fetch('/api/quotes');
            if (res.ok) {
              const d = await res.json();
              if (d.data) saveSandboxQuotes(d.data);
            }
          } catch (e) {}
        }

        if (storedInvoices) {
          setSandboxInvoices(JSON.parse(storedInvoices));
        } else if (!session) {
          try {
            const res = await fetch('/api/invoices');
            if (res.ok) {
              const d = await res.json();
              if (d.data) saveSandboxInvoices(d.data);
            }
          } catch (e) {}
        }

        if (storedClients) {
          setSandboxClients(JSON.parse(storedClients));
        } else if (!session) {
          try {
            const res = await fetch('/api/clients');
            if (res.ok) {
              const d = await res.json();
              if (d.data) saveSandboxClients(d.data);
            }
          } catch (e) {}
        }

        if (storedProfile) {
          const parsed = JSON.parse(storedProfile);
          setSandboxProfile(parsed);
          initProfileStates(parsed);
        }
      }, 0);
    }
  }, [session]);

  const getAuthHeaders = (token) => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchData = useCallback(async (token) => {
    // Guest/sandbox loading from localStorage
    if (!token && typeof window !== 'undefined') {
      const storedLeads = localStorage.getItem('sandbox_leads');
      const storedQuotes = localStorage.getItem('sandbox_quotes');
      const storedInvoices = localStorage.getItem('sandbox_invoices');
      const storedClients = localStorage.getItem('sandbox_clients');
      const storedProfile = localStorage.getItem('sandbox_profile');

      if (storedLeads) {
        setSandboxLeads(JSON.parse(storedLeads));
      }
      
      // Fetch visitor inquiries submitted to /card/demo which are stored in db.json on the server
      (async () => {
        try {
          const res = await fetch('/api/leads');
          if (res.ok) {
            const d = await res.json();
            if (d.data && d.data.length > 0) {
              const currentList = storedLeads ? JSON.parse(storedLeads) : [];
              const merged = [...currentList];
              let modified = false;
              for (let i = d.data.length - 1; i >= 0; i--) {
                const item = d.data[i];
                if (!merged.some(l => l.id === item.id)) {
                  merged.unshift(item);
                  modified = true;
                }
              }
              if (modified) {
                saveSandboxLeads(merged);
              }
            }
          }
        } catch (err) {
          console.error('Guest leads sync failed:', err);
        }
      })();
      if (storedQuotes) setSandboxQuotes(JSON.parse(storedQuotes));
      if (storedInvoices) setSandboxInvoices(JSON.parse(storedInvoices));
      if (storedClients) setSandboxClients(JSON.parse(storedClients));
      if (storedProfile) {
        const cpData = JSON.parse(storedProfile);
        setSandboxProfile(cpData);
        initProfileStates(cpData);
      }
      
      try {
        const userRes = await fetch('/api/user');
        if (userRes.ok) {
          const userData = await userRes.json();
          setUser(userData);
        }
      } catch (e) {}
      return;
    }

    try {
      const authHeaders = getAuthHeaders(token);

      // User Profile details
      const userRes = await fetch('/api/user', { headers: authHeaders });
      if (userRes.ok) {
        const userData = await userRes.json();
        setUser(userData);
      }

      // Invoices
      const invRes = await fetch('/api/invoices', { headers: authHeaders });
      if (invRes.ok) {
        const invData = await invRes.json();
        setInvoices(invData.data || []);
      }

      // Clients
      const cliRes = await fetch('/api/clients', { headers: authHeaders });
      if (cliRes.ok) {
        const cliData = await cliRes.json();
        setClients(cliData.data || []);
      }

      // Leads
      const leadsRes = await fetch('/api/leads', { headers: authHeaders });
      if (leadsRes.ok) {
        const leadsData = await leadsRes.json();
        setLeads(leadsData.data || []);
      }

      // Quotes
      const quotesRes = await fetch('/api/quotes', { headers: authHeaders });
      if (quotesRes.ok) {
        const quotesData = await quotesRes.json();
        setQuotes(quotesData.data || []);
      }

      // Card profile setup
      const cpRes = await fetch('/api/card-profile', { headers: authHeaders });
      if (cpRes.ok) {
        const cpData = await cpRes.json();
        initProfileStates(cpData);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
  }, []);

  // Auth initialization
  useEffect(() => {
    const timer = setTimeout(() => {
      const mockSess = (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') ? localStorage.getItem('mock_session') : null;
      if (mockSess) {
        const parsed = JSON.parse(mockSess);
        setSession(parsed);
        fetchData(parsed.access_token);
        setAuthChecked(true);
        return;
      }

      const client = createBrowserSupabaseClient();
      setSupabaseClient(client);
      setAuthChecked(true);
      if (!client) fetchData();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchData]);

  useEffect(() => {
    if (!supabaseClient) return;

    supabaseClient.auth.getSession().then(({ data }) => {
      if (process.env.NODE_ENV !== 'development' || !localStorage.getItem('mock_session')) {
        setSession(data.session || null);
        fetchData(data.session?.access_token);
      }
    });

    const { data: listener } = supabaseClient.auth.onAuthStateChange((_event, nextSession) => {
      if (process.env.NODE_ENV !== 'development' || !localStorage.getItem('mock_session')) {
        setSession(nextSession);
        fetchData(nextSession?.access_token);
      }
    });

    return () => listener?.subscription?.unsubscribe();
  }, [fetchData, supabaseClient]);

  // Dev simulation helpers
  const loginSimulatedUser = (planType = 'free') => {
    if (process.env.NODE_ENV !== 'development') return;
    const mockUser = {
      id: 'usr_mock123',
      email: 'freelancer@example.com',
      name: 'Simulated Freelancer',
      plan: planType,
      created_at: new Date().toISOString()
    };
    const mockSess = {
      access_token: 'mock_freelancer_token',
      user: mockUser
    };
    localStorage.setItem('mock_session', JSON.stringify(mockSess));
    setSession(mockSess);
    fetchData('mock_freelancer_token');
  };

  const logoutSimulatedUser = () => {
    if (process.env.NODE_ENV === 'development') {
      localStorage.removeItem('mock_session');
    }
    setSession(null);
    if (supabaseClient) supabaseClient.auth.signOut();
    setUser({
      id: '',
      email: '',
      name: 'Guest User',
      plan: 'free',
      quota: null
    });
    setLeads([]);
    setQuotes([]);
    setInvoices([]);
    setClients([]);
    setCardProfile(null);
  };

  // Switch plans helper
  const changeMockUserPlan = async (planType) => {
    if (process.env.NODE_ENV !== 'development') return;
    if (!session) return;
    try {
      const res = await fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders(session.access_token) },
        body: JSON.stringify({ plan: planType })
      });
      if (res.ok) {
        fetchData(session.access_token);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // AI Generate Quote From Lead
  const handleAiQuoteGeneration = async (lead) => {
    if (isFree && getActiveQuotes().length >= 5) {
      setShowUpgradeModal(true);
      return;
    }
    setIsParsingLead(lead.id);
    try {
      const res = await fetch('/api/quotes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message_text: lead.message })
      });

      if (res.ok) {
        const { parsed_data } = await res.json();
        if (parsed_data) {
          // Pre-populate Quote Editor states
          setQId('');
          setQNumber(generateRandomNumberString('QT'));
          setQClientName(parsed_data.client_name || lead.name || '');
          setQClientEmail(parsed_data.client_email || lead.email || '');
          setQClientAddress(parsed_data.client_address || '');
          setQCurrency(parsed_data.currency || 'USD');
          setQNotes(parsed_data.notes || `Based on request: "${lead.message.substring(0, 50)}..."`);
          setQDate(getTodayString());
          setQStatus('draft');
          
          if (parsed_data.items && parsed_data.items.length > 0) {
            setQItems(parsed_data.items.map(i => ({
              description: i.description,
              quantity: i.quantity || 1,
              unitPrice: i.unitPrice || 0
            })));
          } else {
            setQItems([{ description: `Consulting: ${lead.message.substring(0, 30)}...`, quantity: 1, unitPrice: 1000 }]);
          }

          // Move to quote tab and open editor
          setActiveTab('quotes');
          setQuoteView('create');

          // Update Lead Status to 'quote_generated'
          if (session) {
            await fetch('/api/leads', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json', ...getAuthHeaders(session.access_token) },
              body: JSON.stringify({ id: lead.id, status: 'quote_generated' })
            });
            fetchData(session.access_token);
          } else {
            const updated = sandboxLeads.map(l => l.id === lead.id ? { ...l, status: 'quote_generated' } : l);
            saveSandboxLeads(updated);
          }
          alert('AI successfully parsed visitor inquiry into a Quote draft!');
        }
      } else {
        alert('Failed to generate Quote using AI. You can write the Quote manually.');
      }
    } catch (error) {
      console.error(error);
      alert('Error during AI Quote parsing.');
    } finally {
      setIsParsingLead(null);
    }
  };

  // Convert approved Quote to Invoice
  const handleConvertQuoteToInvoice = (quote) => {
    if (isFree && getActiveInvoices().length >= 5) {
      setShowUpgradeModal(true);
      return;
    }
    // Fill Invoice state
    setInvId('');
    setInvNumber(generateRandomNumberString('INV'));
    setInvClientName(quote.client_name);
    setInvClientEmail(quote.client_email || '');
    setInvClientAddress(quote.client_address || '');
    setInvCurrency(quote.currency || 'USD');
    setInvNotes(quote.notes || '');
    setInvDate(getTodayString());
    setInvDueDate(getFutureDateString(30));
    setInvPaymentTerms('Net 30');
    setInvStatus('pending');
    setInvQuoteId(quote.id);
    setInvPaymentLink(''); // Allow freelancer to set their stripe link

    const parsedItems = Array.isArray(quote.items) ? quote.items : (typeof quote.items === 'string' ? JSON.parse(quote.items) : []);
    setInvItems(parsedItems.map(item => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice || (item.unit_price || 0) / 100
    })));

    setInvTaxRate(Number(quote.tax_rate || 0));
    setInvDiscountRate(Number(quote.discount_rate || 0));

    // Change quote status to accepted/converted
    const handleStatusUpdate = async () => {
      if (session) {
        await fetch('/api/quotes', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders(session.access_token) },
          body: JSON.stringify({ id: quote.id, status: 'converted' })
        });
        fetchData(session.access_token);
      } else {
        const updated = sandboxQuotes.map(q => q.id === quote.id ? { ...q, status: 'converted' } : q);
        saveSandboxQuotes(updated);
      }
    };
    handleStatusUpdate();

    // Navigate to Invoice editor
    setActiveTab('invoices');
    setInvoiceView('create');
    alert('Quote loaded into Invoice builder! Add your Stripe, PayPal, or LemonSqueezy payment link and click save.');
  };

  // Quote templates & AI helper definitions
  const quoteTemplates = {
    'Web Design': [
      { description: 'Figma UI/UX Mockup & Interactive Prototypes (Desktop & Mobile)', quantity: 1, unitPrice: 1500 },
      { description: 'Design tokens compilation & client revision sprints', quantity: 1, unitPrice: 800 }
    ],
    'Web Development': [
      { description: 'Next.js Frontend Architecture & Clean React Setup', quantity: 1, unitPrice: 3200 },
      { description: 'Database setup & secure API integration endpoints', quantity: 1, unitPrice: 1800 },
      { description: 'Staging deployment, SEO audits & page speed tuning report', quantity: 1, unitPrice: 1000 }
    ],
    'Mobile App': [
      { description: 'React Native Cross-Platform iOS & Android Core Engineering', quantity: 1, unitPrice: 6500 },
      { description: 'Push notification services & apple/google store submission support', quantity: 1, unitPrice: 1500 }
    ],
    'Consulting': [
      { description: 'System Architectural Audit & Tech Stack Recommendation Sprints', quantity: 10, unitPrice: 150 }
    ],
    'Marketing': [
      { description: 'SaaS Growth SEO Expansion strategy & Competitor audit report', quantity: 1, unitPrice: 1200 },
      { description: 'Email copywriting automation & lead capture campaigns setup', quantity: 1, unitPrice: 800 }
    ],
    'Design': [
      { description: 'Corporate Brand Identity System & Logo design files transfer', quantity: 1, unitPrice: 1500 }
    ]
  };

  const handleApplyQuoteTemplate = (templateName) => {
    const items = quoteTemplates[templateName];
    if (items) {
      setQItems(items.map(item => ({ ...item })));
      alert(`Applied "${templateName}" template presets!`);
    }
  };

  const handleAiScopeExpansion = () => {
    if (!quotePrompt) return;
    setIsExpandingQuote(true);
    
    setTimeout(() => {
      setQItems([
        { description: `Milestone 1: Project Alignment & UI Wireframes for "${quotePrompt}"`, quantity: 1, unitPrice: 1350 },
        { description: 'Milestone 2: Frontend Engineering & Staging integration', quantity: 1, unitPrice: 1800 },
        { description: 'Milestone 3: Final transfer, Domain routing & 14-day support', quantity: 1, unitPrice: 1350 }
      ]);
      setQNotes(`Project Scope details auto-expanded based on specifications: "${quotePrompt}". Term details: Standard 5% late fee policy applies. Active delivery over Net 30.`);
      setIsExpandingQuote(false);
      setQuotePrompt('');
      alert('AI Scope Expansion complete! Project milestones and pricing have been loaded.');
    }, 1200);
  };

  const handleGenerateCopilot = () => {
    if (!copilotPrompt && ['scope', 'pricing', 'contract'].includes(copilotTool)) {
      alert('Please enter project specifications or details first.');
      return;
    }
    setIsGeneratingCopilot(true);
    setCopilotOutput('');
    
    setTimeout(() => {
      let outputText = '';
      if (copilotTool === 'proposal') {
        outputText = `PROPOSAL PITCH FOR: ${copilotClient || 'Wayne Enterprises'}\nROLE: ${copilotRole}\nDATE: ${getTodayString()}\n\nDear ${copilotClient || 'Team'},\n\nI am writing to pitch my services for your upcoming project: "${copilotPrompt || 'Creative Product Design Layout Audit'}". As a senior ${copilotRole}, my focus is on delivering high-performance layouts, stable API engineering, and clean visual solutions.\n\nPROPOSED PHASES:\n1. Discovery & Strategy Blueprint\n2. Design Sprint & UI Prototype (Figma)\n3. Custom Development & API Buildout\n4. Testing, Launch & Net 30 support\n\nWhy work with me:\n- Verified Top Rated feedback on Freelancer Business OS.\n- Timely milestone execution and transparent updates.\n\nLet me know if we can schedule a quick 15-minute sync on Calendly to align on terms.\n\nSincerely,\n${cpName || 'Independent Freelancer'}`;
      } else if (copilotTool === 'scope') {
        outputText = `PROJECT ROADMAP & MILESTONES\nSPECIFICATIONS: "${copilotPrompt || 'Mobile e-commerce application'}"\n\nMILESTONE 1: Project Alignment & Architecture Layout\n- Deliverables: UI Wireframes, database design schemas.\n- Duration: 5 business days.\n- Estimated pricing: $1,200 USD.\n\nMILESTONE 2: Core Engineering Sprints\n- Deliverables: Interactive frontend screens, API integrations.\n- Duration: 10 business days.\n- Estimated pricing: $2,500 USD.\n\nMILESTONE 3: Quality Audits, Handoff & Training\n- Deliverables: Live server deployment, page speed reports, Figma source files transfer.\n- Duration: 5 business days.\n- Estimated pricing: $1,300 USD.\n\nTERMS: Milestone payments are processed via the freelancer's payment link upon signed clearance. Work begins on subsequent stages once prior clearances clear.`;
      } else if (copilotTool === 'pricing') {
        outputText = `VALUE-BASED PRICING RECOMMENDATION\nPROJECT: "${copilotPrompt || 'Custom Next.js SaaS app'}"\nBUSINESS IMPACT: ${copilotExtra || 'Medium'}\n\n1. Fixed Project Pricing Model (Recommended)\n- Base Value Rate: $4,500 USD.\n- Reasoning: Based on business outcome and the target audience conversion impact, hourly billing would penalize your experience.\n\n2. Retainer Framework Option\n- Monthly Rate: $1,500 USD/month (Up to 15 hours priority support).\n- Advantage: Guarantees recurring predictable income while reserving bandwidth for the client.\n\n3. Proposed Deposit Layout\n- Upfront Deposit: 50% ($2,250 USD) due prior to kickoff.\n- Final Milestone: 50% ($2,250 USD) due upon handoff.`;
      } else if (copilotTool === 'followup') {
        outputText = `LATE-PAYMENT FOLLOW-UP NOTIFICATION\nCLIENT: ${copilotClient || 'Wayne Enterprises'}\nTONE: ${copilotExtra || 'Firm'}\n\nSubject: Important: Invoice Overdue Notice\n\nDear ${copilotClient || 'Team'},\n\nI hope you are doing well.\n\nThis is a friendly reminder that the milestone balance for your invoice is now past due. As per our initial agreement, a standard late payment policy fee has been applied.\n\nPlease clear the balance of outstanding funds via the secure client portal link below to resume our active support sprint:\n\n[Client Portal link: ${window.location.origin}/portal/inv_mock]\n\nIf you have any questions or require custom terms, let me know.\n\nBest regards,\n${cpName || 'Independent Freelancer'}`;
      } else if (copilotTool === 'contract') {
        outputText = `INDEPENDENT CONTRACTOR SERVICE AGREEMENT\n\nCLIENT: ${copilotClient || 'Client Name'}\nCONTRACTOR: ${cpName || 'Independent Freelancer'}\nEFFECTIVE DATE: ${getTodayString()}\n\n1. SCOPE OF SERVICES\nContractor agrees to perform services detailed in proposal document "${copilotPrompt || 'Product Layout Audit'}" under Fixed Rate Milestone terms.\n\n2. FEES & REIMBURSEMENTS\nClient agrees to clear milestone balances upon signoff via the freelancer's payment link (Stripe, PayPal, or LemonSqueezy). Overdue accounts are subject to late fee policies.\n\n3. INTELLECTUAL PROPERTY RIGHTS\nUpon full clearance of invoice balances, all visual design layouts, Figma boards, and custom engineering source code are fully released and licensed to the Client.\n\n4. TERMINATION FOR CONVENIENCE\nEither party may terminate this agreement with 7 days written notice. Contractor retains deposit fees as cancellation kill fees.\n\nCLIENT SIGNATURE: ____________________\nCONTRACTOR SIGNATURE: __________________`;
      }
      setCopilotOutput(outputText);
      setIsGeneratingCopilot(false);
      alert('AI Copilot generation complete! Scroll down to view/copy output.');
    }, 1000);
  };

  // Save Quote
  const handleSaveQuote = async () => {
    if (!qClientName || !qItems.length) {
      alert('Please enter a client name and add items.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        id: qId || undefined,
        quote_number: qNumber,
        client_name: qClientName,
        client_email: qClientEmail,
        client_address: qClientAddress,
        items: qItems,
        discount_rate: qDiscountRate,
        tax_rate: qTaxRate,
        currency: qCurrency,
        notes: qNotes,
        status: qStatus
      };

      if (session) {
        const res = await fetch('/api/quotes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders(session.access_token) },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          fetchData(session.access_token);
          setQuoteView('list');
          alert('Quote saved successfully!');
        } else {
          alert('Failed to save quote.');
        }
      } else {
        // Sandbox Local
        const savedItem = {
          ...payload,
          id: qId || generateRandomId('quote'),
          user_id: 'guest',
          status: qStatus,
          total: Math.round(
            qItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0) * (1 - qDiscountRate / 100) * (1 + qTaxRate / 100) * 100
          ),
          created_at: new Date().toISOString()
        };

        let newList;
        if (qId) {
          newList = sandboxQuotes.map(q => q.id === qId ? savedItem : q);
        } else {
          newList = [savedItem, ...sandboxQuotes];
        }
        saveSandboxQuotes(newList);
        setQuoteView('list');
        alert('Quote saved to Demo Sandbox!');
      }
    } catch (e) {
      console.error(e);
      alert('Network error when saving quote.');
    } finally {
      setIsSaving(false);
    }
  };

  // Save Invoice
  const handleSaveInvoice = async () => {
    if (!invClientName || !invItems.length) {
      alert('Please fill out client name and items.');
      return;
    }

    setIsSaving(true);
    try {
      const notesWithMeta = serializeInvoiceNotes(invNotes, {
        billing_type: invBillingType,
        late_fee: invLateFee,
        auto_reminder: invAutoReminder
      });

      const payload = {
        id: invId || undefined,
        client_name: invClientName,
        client_email: invClientEmail,
        client_address: invClientAddress,
        currency: invCurrency,
        items: invItems,
        discount_rate: invDiscountRate,
        tax_rate: invTaxRate,
        invoice_number: invNumber,
        payment_terms: invPaymentTerms,
        notes: notesWithMeta,
        invoice_date: invDate || getTodayString(),
        due_date: invDueDate || getFutureDateString(30),
        doc_type: 'invoice',
        stripe_payment_link: invPaymentLink,
        payment_link: invPaymentLink
      };

      if (session) {
        const res = await fetch('/api/invoices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders(session.access_token) },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          fetchData(session.access_token);
          setInvoiceView('list');
          alert('Invoice saved successfully!');
        } else {
          const errData = await res.json();
          if (errData.code === 'QUOTA_EXCEEDED') {
            setShowUpgradeModal(true);
          } else {
            alert(errData.error || 'Failed to save invoice.');
          }
        }
      } else {
        // Sandbox Local
        const savedItem = {
          ...payload,
          id: invId || generateRandomId('inv'),
          user_id: 'guest',
          object: 'invoice',
          status: invStatus,
          total: Math.round(
            invItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0) * (1 - invDiscountRate / 100) * (1 + invTaxRate / 100) * 100
          ),
          pdf_url: generateRandomPdfUrl(),
          created_at: new Date().toISOString()
        };

        let newList;
        if (invId) {
          newList = sandboxInvoices.map(i => i.id === invId ? savedItem : i);
        } else {
          newList = [savedItem, ...sandboxInvoices];
        }
        saveSandboxInvoices(newList);
        setInvoiceView('list');
        alert('Invoice saved to Demo Sandbox!');
      }
    } catch (e) {
      console.error(e);
      alert('Network error when saving invoice.');
    } finally {
      setIsSaving(false);
    }
  };

  // Save Card Profile
  const handleSaveCardProfile = async () => {
    if (!cpUsername) {
      alert('Please specify a profile username.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        username: cpUsername.toLowerCase().trim(),
        name: cpName,
        title: cpTitle,
        bio: cpBio,
        tags: cpTags.split(',').map(t => t.trim()).filter(Boolean),
        contact_email: cpEmail,
        contact_phone: cpPhone,
        social_links: {
          twitter: cpTwitter,
          linkedin: cpLinkedin,
          github: cpGithub,
          website: cpWebsite
        },
        services: cpServices,
        portfolio: cpPortfolio,
        cover_banner: cpCoverBanner,
        avatar_url: cpAvatarUrl,
        location: cpLocation,
        timezone: cpTimezone,
        languages: cpLanguages,
        availability_status: cpAvailabilityStatus,
        response_time: cpResponseTime,
        starting_price: cpStartingPrice,
        calendly_link: cpCalendlyLink,
        verified_badge: cpVerifiedBadge,
        top_rated_badge: cpTopRatedBadge,
        fast_response_badge: cpFastResponseBadge,
        testimonials: cpTestimonials
      };

      if (session) {
        const res = await fetch('/api/card-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders(session.access_token) },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          fetchData(session.access_token);
          alert('Public profile updated successfully!');
        } else {
          const err = await res.json();
          alert(err.error || 'Failed to save profile.');
        }
      } else {
        const localCp = {
          ...payload,
          id: sandboxProfile?.id || generateRandomId('cp'),
          user_id: 'guest',
          created_at: sandboxProfile?.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        saveSandboxProfile(localCp);
        alert('Public profile updated in Demo Sandbox!');
      }
    } catch (e) {
      console.error(e);
      alert('Error updating profile card.');
    } finally {
      setIsSaving(false);
    }
  };

  // Lead CRM Helper & Handlers
  const getLeadPipelineStatus = (lead) => {
    if (lead.pipeline_status) return lead.pipeline_status;
    const utm = typeof lead.source_utm === 'object' ? lead.source_utm : JSON.parse(lead.source_utm || '{}');
    if (utm.pipeline_status) return utm.pipeline_status;
    
    // Fallbacks
    if (lead.status === 'new') return 'New';
    if (lead.status === 'contacted') return 'Qualified';
    if (lead.status === 'quote_generated') return 'Proposal Sent';
    if (lead.status === 'archived') return 'Won';
    return 'New';
  };

  const getLeadCRMFields = (lead) => {
    const utm = typeof lead.source_utm === 'object' ? lead.source_utm : JSON.parse(lead.source_utm || '{}');
    return {
      value: lead.lead_value || utm.lead_value || 0,
      source: lead.source || utm.source || utm.utm_source || utm.ref || 'Direct',
      tags: lead.tags || utm.tags || '',
      lastContactDate: lead.last_contact_date || utm.last_contact_date || '',
      notes: lead.notes || utm.notes || '',
      reminderDate: lead.reminder_date || utm.reminder_date || ''
    };
  };

  const handleSaveLeadCRMDetails = async (leadId, updates) => {
    setIsSaving(true);
    try {
      if (session) {
        const res = await fetch('/api/leads', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders(session.access_token) },
          body: JSON.stringify({ id: leadId, ...updates })
        });
        if (res.ok) {
          fetchData(session.access_token);
        } else {
          alert('Failed to update lead details.');
        }
      } else {
        const updatedList = sandboxLeads.map(l => {
          if (l.id === leadId) {
            return {
              ...l,
              ...updates,
              updated_at: new Date().toISOString()
            };
          }
          return l;
        });
        saveSandboxLeads(updatedList);
        setSandboxLeads(updatedList);
      }
      setShowLeadModal(false);
      setSelectedLead(null);
    } catch (err) {
      console.error(err);
      alert('Error updating lead details.');
    } finally {
      setIsSaving(false);
    }
  };

  // Save Client Details
  const handleSaveClient = async (e) => {
    e.preventDefault();
    if (!newClientName) return;

    if (isFree && getActiveClients().length >= 3) {
      setShowUpgradeModal(true);
      return;
    }

    try {
      const payload = {
        name: newClientName,
        email: newClientEmail,
        address: newClientAddress
      };

      if (session) {
        const res = await fetch('/api/clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders(session.access_token) },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          fetchData(session.access_token);
          setNewClientName('');
          setNewClientEmail('');
          setNewClientAddress('');
          alert('Client created successfully!');
        }
      } else {
        const savedCli = {
          ...payload,
          id: generateRandomId('cli'),
          user_id: 'guest',
          created_at: new Date().toISOString()
        };
        saveSandboxClients([savedCli, ...sandboxClients]);
        setNewClientName('');
        setNewClientEmail('');
        setNewClientAddress('');
        alert('Client added to sandbox!');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteClient = async (id) => {
    if (!confirm('Are you sure you want to delete this client?')) return;
    if (session) {
      const res = await fetch(`/api/clients?id=${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(session.access_token)
      });
      if (res.ok) fetchData(session.access_token);
    } else {
      saveSandboxClients(sandboxClients.filter(c => c.id !== id));
    }
  };

  // PDF download trigger
  const handlePdfDownload = async (elementId, name) => {
    setIsDownloadingPdf(true);
    try {
      await generatePDF(elementId, `${name}.pdf`, isPro);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // Copy customized reminder
  const openReminderModalFor = (invoice) => {
    setSelectedInvoiceForReminder(invoice);
    setActiveReminderTemplate('7');
    setReminderCopied(false);
    setShowReminderModal(true);
  };

  const getReminderEmailContent = () => {
    if (!selectedInvoiceForReminder) return { subject: '', body: '' };
    const inv = selectedInvoiceForReminder;
    const invNo = inv.invoice_number;
    const amountStr = `${getCurrencySymbol(inv.currency)}${(inv.total / 100).toFixed(2)}`;
    const cliName = inv.client_name;
    const bName = inv.business_name || user.name || 'Freelancer';
    const due = inv.due_date || 'Receipt';

    if (activeReminderTemplate === '7') {
      return {
        subject: `Friendly Reminder: Invoice #${invNo} is overdue`,
        body: `Hi ${cliName},\n\nHope you are doing well.\n\nThis is a quick friendly reminder that invoice #${invNo} for ${amountStr} was due on ${due} and is now a week overdue.\n\nCould you please check on the payment status and let me know when we can expect it? If you need another copy of the invoice or the payment link, feel free to reply.\n\nThank you for your business!\n\nBest regards,\n${bName}`
      };
    } else if (activeReminderTemplate === '14') {
      return {
        subject: `Urgent Follow-up: Invoice #${invNo} is 14 days overdue`,
        body: `Hi ${cliName},\n\nI am writing to follow up on invoice #${invNo} for ${amountStr} which was due on ${due}. It is now 14 days past due.\n\nWe would appreciate it if you could process this payment as soon as possible. Please confirm when the payment has been initiated, or let me know if there are any billing issues preventing payment.\n\nThank you for your prompt attention to this matter.\n\nRegards,\n${bName}`
      };
    } else {
      return {
        subject: `FINAL NOTICE: Overdue Invoice #${invNo} - Action Required`,
        body: `Hi ${cliName},\n\nThis is a final notice regarding invoice #${invNo} of ${amountStr} which was due on ${due}. This invoice is now 30 days past due.\n\nPlease remit payment immediately using the payment link or instructions provided. If payment is not received, we may have to pause any current work or escalate this matter.\n\nRegards,\n${bName}`
      };
    }
  };

  // Form items handlers
  const handleItemChange = (editorType, index, field, value) => {
    if (editorType === 'quote') {
      const newItems = [...qItems];
      newItems[index][field] = value;
      setQItems(newItems);
    } else {
      const newItems = [...invItems];
      newItems[index][field] = value;
      setInvItems(newItems);
    }
  };

  const addItem = (editorType) => {
    if (editorType === 'quote') {
      setQItems([...qItems, { description: '', quantity: 1, unitPrice: 0 }]);
    } else {
      setInvItems([...invItems, { description: '', quantity: 1, unitPrice: 0 }]);
    }
  };

  const removeItem = (editorType, index) => {
    if (editorType === 'quote') {
      if (qItems.length > 1) setQItems(qItems.filter((_, i) => i !== index));
    } else {
      if (invItems.length > 1) setInvItems(invItems.filter((_, i) => i !== index));
    }
  };

  // Render components based on auth status and tabs
  const getActiveLeads = () => (session ? leads : sandboxLeads);
  const getActiveQuotes = () => (session ? quotes : sandboxQuotes);
  const getActiveInvoices = () => (session ? invoices : sandboxInvoices);
  const getActiveClients = () => (session ? clients : sandboxClients);
  const getActiveProfile = () => (session ? cardProfile : sandboxProfile);

  // Income computations
  const currentInvoices = getActiveInvoices();
  const totalPaid = currentInvoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + (i.total || 0), 0) / 100;
  const totalPending = currentInvoices.filter(i => i.status === 'pending' || i.status === 'sent' || i.status === 'unpaid').reduce((sum, i) => sum + (i.total || 0), 0) / 100;
  const totalOverdue = currentInvoices.filter(i => i.status === 'overdue').reduce((sum, i) => sum + (i.total || 0), 0) / 100;
  const totalVolume = totalPaid + totalPending + totalOverdue;

  // Init blank Quote
  const initCreateQuote = () => {
    if (isFree && getActiveQuotes().length >= 5) {
      setShowUpgradeModal(true);
      return;
    }
    setQId('');
    setQNumber(generateRandomNumberString('QT'));
    setQClientName('');
    setQClientEmail('');
    setQClientAddress('');
    setQItems([{ description: '', quantity: 1, unitPrice: 0 }]);
    setQTaxRate(0);
    setQDiscountRate(0);
    setQCurrency('USD');
    setQNotes('');
    setQDate(getTodayString());
    setQStatus('draft');
    setQuoteView('create');
  };

  // Init blank Invoice
  const initCreateInvoice = () => {
    if (isFree && getActiveInvoices().length >= 5) {
      setShowUpgradeModal(true);
      return;
    }
    setInvId('');
    setInvNumber(generateRandomNumberString('INV'));
    setInvClientName('');
    setInvClientEmail('');
    setInvClientAddress('');
    setInvItems([{ description: '', quantity: 1, unitPrice: 0 }]);
    setInvTaxRate(0);
    setInvDiscountRate(0);
    setInvCurrency('USD');
    setInvNotes('');
    setInvDate(getTodayString());
    setInvDueDate(getFutureDateString(30));
    setInvPaymentTerms('Net 30');
    setInvStatus('pending');
    setInvPaymentLink('');
    setInvQuoteId(null);
    setInvBillingType('standard');
    setInvLateFee(0);
    setInvAutoReminder(false);
    setInvoiceView('create');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--background-dark)', display: 'flex', color: 'var(--text-main)' }}>
      
      {/* Sidebar navigation */}
      <aside style={{ width: '260px', borderRight: '1px solid var(--border)', background: 'var(--background-card)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '24px' }}>
        <div>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem', fontWeight: 800, marginBottom: '32px', letterSpacing: '-0.02em' }}>
            <svg style={{width:'20px', height:'20px', color: 'var(--primary)'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="9" y1="9" x2="15" y2="9" />
              <line x1="9" y1="13" x2="15" y2="13" />
              <line x1="9" y1="17" x2="13" y2="17" />
            </svg>
            <span style={{ background: 'linear-gradient(135deg, var(--text-main), var(--text-muted))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Freelancer Business OS</span>
          </div>

          {/* Navigation Links */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {[
              { id: 'overview', label: 'Overview', icon: 'M3 12l9-9 9 9M5 10v10a1 1 0 001 1h3m10-11v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
              { id: 'leads', label: 'Leads', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
              { id: 'quotes', label: 'Quotes', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
              { id: 'invoices', label: 'Invoices', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
              { id: 'profile', label: 'Public Card', icon: 'M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
              { id: 'copilot', label: 'AI Copilot', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8.5px 12px',
                  borderRadius: '6px',
                  width: '100%',
                  textAlign: 'left',
                  cursor: 'pointer',
                  backgroundColor: activeTab === tab.id ? 'var(--btn-secondary-bg)' : 'transparent',
                  color: activeTab === tab.id ? 'var(--text-main)' : 'var(--text-muted)',
                  border: activeTab === tab.id ? '1px solid var(--border)' : '1px solid transparent',
                  fontSize: '0.85rem',
                  fontWeight: activeTab === tab.id ? 600 : 500,
                  transition: 'var(--transition)'
                }}
              >
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{ opacity: activeTab === tab.id ? 1 : 0.6 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
                </svg>
                {tab.label}
              </button>
            ))}

            {/* Divider & Secondary Clients link */}
            <div style={{ margin: '12px 0', borderTop: '1px solid var(--border)' }} />
            <button
              onClick={() => setActiveTab('clients')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '6px 12px',
                borderRadius: '6px',
                width: '100%',
                textAlign: 'left',
                cursor: 'pointer',
                backgroundColor: activeTab === 'clients' ? 'var(--btn-secondary-bg)' : 'transparent',
                color: activeTab === 'clients' ? 'var(--text-main)' : 'var(--text-muted)',
                border: 'none',
                fontSize: '0.8rem',
                opacity: 0.7,
                fontWeight: activeTab === 'clients' ? 600 : 500
              }}
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{ opacity: activeTab === 'clients' ? 1 : 0.6 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20H7m0-3a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Clients
            </button>
          </nav>
        </div>

        {/* Footer info & Dev simulated users */}
        <div>
          {process.env.NODE_ENV === 'development' && (
            <div style={{ padding: '10px', backgroundColor: 'var(--btn-secondary-bg)', border: '1px solid var(--border)', borderRadius: '6px', marginBottom: '16px', fontSize: '0.7rem' }}>
              <p style={{ color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600 }}>SIMULATOR CONTROLS</p>
              {!session ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <button onClick={() => loginSimulatedUser('free')} style={{ color: 'var(--accent)', cursor: 'pointer', textAlign: 'left' }}>Login Mock Free</button>
                  <button onClick={() => loginSimulatedUser('pro')} style={{ color: 'var(--success)', cursor: 'pointer', textAlign: 'left' }}>Login Mock Pro</button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Status: <span style={{color:'var(--text-main)', fontWeight: 'bold'}}>{user.plan}</span></span>
                  {user.id === 'usr_mock123' && (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '2px' }}>
                      <button onClick={() => changeMockUserPlan('free')} style={{ color: 'var(--accent)', cursor: 'pointer' }}>To Free</button>
                      <button onClick={() => changeMockUserPlan('pro')} style={{ color: 'var(--success)', cursor: 'pointer' }}>To Pro</button>
                    </div>
                  )}
                  <button onClick={logoutSimulatedUser} style={{ color: 'var(--danger)', cursor: 'pointer', textAlign: 'left', marginTop: '6px', fontWeight: 'bold' }}>Sign Out Mock</button>
                </div>
              )}
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <ThemeToggle />
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <p>Logged account:</p>
            <p style={{ color: 'var(--text-main)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', fontWeight: 500 }}>
              {session ? session.user.email : 'Local Sandbox (Guest)'}
            </p>
          </div>
        </div>
      </aside>

      {/* Main dashboard content */}
      <main style={{ flex: 1, padding: '40px 48px', overflowY: 'auto' }}>
          {/* TAB 1: OVERVIEW CONTROL CENTER */}
        {activeTab === 'overview' && (
          <div className="animate-fade-in" style={{ maxWidth: '1000px' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '24px', letterSpacing: '-0.02em' }}>Business Overview</h1>
            
            {/* Minimal flat metrics cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '32px' }}>
              <div className="card" style={{ padding: '16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', boxShadow: 'var(--shadow-sm)' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Profile Views</span>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '4px', color: 'var(--text-main)' }}>
                  {cardProfile || sandboxProfile ? (148 + getActiveLeads().length * 3) : 84}
                </h3>
              </div>
              <div className="card" style={{ padding: '16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', boxShadow: 'var(--shadow-sm)' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Leads Received</span>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '4px', color: 'var(--accent)' }}>
                  {getActiveLeads().length}
                </h3>
              </div>
              <div className="card" style={{ padding: '16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', boxShadow: 'var(--shadow-sm)' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Quotes Sent</span>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '4px', color: 'var(--warning)' }}>
                  {getActiveQuotes().filter(q => q.status !== 'draft').length}
                </h3>
              </div>
              <div className="card" style={{ padding: '16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', boxShadow: 'var(--shadow-sm)' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Invoices Sent</span>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '4px', color: 'var(--primary)' }}>
                  {currentInvoices.length}
                </h3>
              </div>
              <div className="card" style={{ padding: '16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', boxShadow: 'var(--shadow-sm)' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Revenue Settled</span>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '4px', color: 'var(--success)' }}>
                  ${totalPaid.toFixed(2)}
                </h3>
              </div>
            </div>

            {/* Split layout: Tables & Lists on left, Tasks & Actions on right */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '24px' }}>
              
              {/* Left Column: Recent Activities */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* Recent Leads */}
                <div className="card" style={{ padding: '24px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px' }}>
                  <h2 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '16px', color: 'var(--text-main)' }}>Recent Leads</h2>
                  {getActiveLeads().length === 0 ? (
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No leads captured yet.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {getActiveLeads().slice(0, 3).map(lead => (
                        <div key={lead.id} style={{ padding: '12px', background: 'var(--btn-secondary-bg)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.8rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, marginBottom: '4px' }}>
                            <span>{lead.name}</span>
                            <span style={{ color: 'var(--accent)' }}>{lead.email}</span>
                          </div>
                          <p style={{ color: 'var(--text-muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Quotes */}
                <div className="card" style={{ padding: '24px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px' }}>
                  <h2 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '16px', color: 'var(--text-main)' }}>Recent Quotes</h2>
                  {getActiveQuotes().length === 0 ? (
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No quotes drafted yet.</p>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                            <th style={{ padding: '8px 0' }}>Quote #</th>
                            <th style={{ padding: '8px 0' }}>Client</th>
                            <th style={{ padding: '8px 0' }}>Amount</th>
                            <th style={{ padding: '8px 0', textAlign: 'right' }}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getActiveQuotes().slice(0, 3).map(q => (
                            <tr key={q.id} style={{ borderBottom: '1px solid var(--border)' }}>
                              <td style={{ padding: '8px 0', fontWeight: 700 }}>{q.quote_number}</td>
                              <td style={{ padding: '8px 0' }}>{q.client_name}</td>
                              <td style={{ padding: '8px 0', fontWeight: 600 }}>{getCurrencySymbol(q.currency)}{(q.total / 100).toFixed(2)}</td>
                              <td style={{ padding: '8px 0', textAlign: 'right' }}>
                                <span style={{ fontSize: '0.7rem', padding: '2px 6px', background: 'var(--btn-secondary-bg)', borderRadius: '4px' }}>{q.status}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Recent Invoices */}
                <div className="card" style={{ padding: '24px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px' }}>
                  <h2 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '16px', color: 'var(--text-main)' }}>Recent Invoices</h2>
                  {currentInvoices.length === 0 ? (
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No invoices sent yet.</p>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                            <th style={{ padding: '8px 0' }}>Invoice #</th>
                            <th style={{ padding: '8px 0' }}>Client</th>
                            <th style={{ padding: '8px 0' }}>Amount</th>
                            <th style={{ padding: '8px 0', textAlign: 'right' }}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentInvoices.slice(0, 3).map(inv => (
                            <tr key={inv.id} style={{ borderBottom: '1px solid var(--border)' }}>
                              <td style={{ padding: '8px 0', fontWeight: 700 }}>{inv.invoice_number}</td>
                              <td style={{ padding: '8px 0' }}>{inv.client_name}</td>
                              <td style={{ padding: '8px 0', fontWeight: 600 }}>{getCurrencySymbol(inv.currency)}{(inv.total).toFixed(2)}</td>
                              <td style={{ padding: '8px 0', textAlign: 'right' }}>
                                <span style={{ 
                                  fontSize: '0.7rem', 
                                  padding: '2px 6px', 
                                  background: inv.status === 'paid' ? 'var(--success-glow)' : 'var(--btn-secondary-bg)', 
                                  color: inv.status === 'paid' ? 'var(--success)' : 'var(--text-main)',
                                  borderRadius: '4px',
                                  border: '1px solid var(--border)'
                                }}>
                                  {inv.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

              </div>

              {/* Right Column: Interactive Tasks & Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* Upcoming Tasks Checklist */}
                <div className="card" style={{ padding: '24px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px' }}>
                  <h2 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '16px', color: 'var(--text-main)' }}>Upcoming Tasks</h2>
                  
                  {/* Task list */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                    {upcomingTasks.map(task => (
                      <div key={task.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', fontSize: '0.8rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', flex: 1, textDecoration: task.done ? 'line-through' : 'none', color: task.done ? 'var(--text-muted)' : 'var(--text-main)' }}>
                          <input 
                            type="checkbox" 
                            checked={task.done} 
                            onChange={() => toggleTask(task.id)}
                            style={{ cursor: 'pointer' }}
                          />
                          <span>{task.text}</span>
                        </label>
                        <button 
                          onClick={() => deleteTask(task.id)} 
                          style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', padding: '0 4px' }}
                          title="Delete task"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add task form */}
                  <form onSubmit={addTask} style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Add task item..." 
                      value={newTaskText} 
                      onChange={e => setNewTaskText(e.target.value)}
                      style={{ fontSize: '0.75rem', padding: '6px 10px', background: 'var(--form-input-bg)', border: '1px solid var(--border)', borderRadius: '6px' }}
                    />
                    <button type="submit" className="btn btn-primary btn-sm" style={{ fontWeight: 600, padding: '0 12px' }}>Add</button>
                  </form>
                </div>

                {/* Quick actions panel */}
                <div className="card" style={{ padding: '24px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px' }}>
                  <h2 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '16px', color: 'var(--text-main)' }}>Quick Actions</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button onClick={initCreateQuote} className="btn btn-primary" style={{ width: '100%' }}>Create Quote</button>
                    <button onClick={initCreateInvoice} className="btn btn-secondary" style={{ width: '100%' }}>Create Invoice</button>
                    {getActiveProfile() ? (
                      <a 
                        href={`/card/${getActiveProfile().username}`} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="btn btn-secondary" 
                        style={{ width: '100%', textAlign: 'center' }}
                      >
                        Open Profile Card
                      </a>
                    ) : (
                      <button onClick={() => setActiveTab('profile')} className="btn btn-secondary" style={{ width: '100%' }}>Configure Card</button>
                    )}
                  </div>
                </div>

                <div className="card" style={{ padding: '24px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>Platform Referrals</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.5', margin: 0 }}>
                    Your card page footer automatically references Freelancer Business OS, generating organic referrals. Keep 100% of your earnings.
                  </p>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* TAB 2: LEADS INBOX (Kanban CRM Board) */}
        {activeTab === 'leads' && (
          <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>Leads Pipeline CRM</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
                  Track client inquiry cycles and project valuations. Total Pipeline Value: <strong style={{ color: 'var(--accent)' }}>
                    ${getActiveLeads().reduce((sum, l) => sum + Number(getLeadCRMFields(l).value || 0), 0).toLocaleString()}
                  </strong>
                </p>
              </div>
            </div>

            {getActiveLeads().length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                <p style={{ fontSize: '1rem', marginBottom: '4px', color: 'var(--text-main)', fontWeight: 600 }}>Inquiry Inbox Empty</p>
                <p style={{ fontSize: '0.85rem' }}>Captured inquiries from your public card profile page will appear here automatically.</p>
              </div>
            ) : (
              <div className="kanban-board">
                {[
                  { id: 'New', title: 'New', color: '#6366f1' },
                  { id: 'Qualified', title: 'Qualified', color: '#06b6d4' },
                  { id: 'Proposal Sent', title: 'Proposal Sent', color: '#818cf8' },
                  { id: 'Negotiation', title: 'Negotiation', color: 'var(--warning)' },
                  { id: 'Won', title: 'Won', color: '#10b981' },
                  { id: 'Lost', title: 'Lost', color: '#f43f5e' }
                ].map(col => {
                  const colLeads = getActiveLeads().filter(l => getLeadPipelineStatus(l) === col.id);
                  return (
                    <div key={col.id} className="kanban-column">
                      <div className="kanban-column-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: col.color }}></span>
                          <span className="kanban-column-title">{col.title}</span>
                        </div>
                        <span className="kanban-column-count">{colLeads.length}</span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', flex: 1, paddingBottom: '10px' }}>
                        {colLeads.map(lead => {
                          return (
                            <div key={lead.id} className="kanban-card" style={{ borderLeft: `3px solid ${col.color}` }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                                <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-main)' }}>{lead.name}</span>
                                <span style={{ fontSize: '0.7rem', color: 'var(--accent)', fontWeight: 600 }}>${Number(crm.value || 0).toLocaleString()}</span>
                              </div>
                              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '12px', lineHeight: '1.4', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                {lead.message}
                              </p>

                              {/* Tags */}
                              {crm.tags && (
                                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '12px' }}>
                                  {crm.tags.split(',').map((t, idx) => (
                                    <span key={idx} style={{ fontSize: '0.6rem', padding: '1px 5px', background: 'var(--btn-secondary-bg)', border: '1px solid var(--border)', borderRadius: '3px', color: 'var(--text-muted)' }}>{t.trim()}</span>
                                  ))}
                                </div>
                              )}

                              {/* Reminder Notification */}
                              {crm.reminderDate && (
                                <div style={{ fontSize: '0.65rem', color: 'var(--warning-text, #fbbf24)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '12px' }}>
                                  <span>📅 Reminder: {new Date(crm.reminderDate).toLocaleDateString()}</span>
                                </div>
                              )}

                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '8px' }}>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                  <button 
                                    onClick={() => {
                                      setSelectedLead(lead);
                                      setLeadPipelineStatus(col.id);
                                      setLeadValue(crm.value);
                                      setLeadSource(crm.source);
                                      setLeadTags(crm.tags);
                                      setLeadLastContactDate(crm.lastContactDate);
                                      setLeadNotes(crm.notes);
                                      setLeadReminderDate(crm.reminderDate);
                                      setShowLeadModal(true);
                                    }}
                                    className="btn btn-secondary btn-sm"
                                    style={{ fontSize: '0.65rem', padding: '2px 6px' }}
                                    title="Edit Lead CRM details"
                                  >
                                    Edit
                                  </button>
                                  {(col.id === 'New' || col.id === 'Qualified') && (
                                    <button
                                      disabled={isParsingLead === lead.id}
                                      onClick={() => handleAiQuoteGeneration(lead)}
                                      className="btn btn-secondary btn-sm"
                                      style={{ fontSize: '0.65rem', padding: '2px 6px', color: 'var(--accent)' }}
                                      title="AI Generate Quote Draft"
                                    >
                                      {isParsingLead === lead.id ? '⌛' : 'AI Proposal'}
                                    </button>
                                  )}
                                </div>

                                {/* Quick columns toggle */}
                                <div style={{ display: 'flex', gap: '2px' }}>
                                  {col.id !== 'New' && (
                                    <button 
                                      onClick={() => {
                                        const colIds = ['New', 'Qualified', 'Proposal Sent', 'Negotiation', 'Won', 'Lost'];
                                        const prevIdx = colIds.indexOf(col.id) - 1;
                                        handleSaveLeadCRMDetails(lead.id, { pipeline_status: colIds[prevIdx] });
                                      }}
                                      style={{ padding: '2px 4px', fontSize: '0.65rem', background: 'var(--btn-secondary-bg)', border: '1px solid var(--border)', borderRadius: '3px', cursor: 'pointer' }}
                                      title="Move Left"
                                    >
                                      ◀
                                    </button>
                                  )}
                                  {col.id !== 'Lost' && (
                                    <button 
                                      onClick={() => {
                                        const colIds = ['New', 'Qualified', 'Proposal Sent', 'Negotiation', 'Won', 'Lost'];
                                        const nextIdx = colIds.indexOf(col.id) + 1;
                                        handleSaveLeadCRMDetails(lead.id, { pipeline_status: colIds[nextIdx] });
                                      }}
                                      style={{ padding: '2px 4px', fontSize: '0.65rem', background: 'var(--btn-secondary-bg)', border: '1px solid var(--border)', borderRadius: '3px', cursor: 'pointer' }}
                                      title="Move Right"
                                    >
                                      ▶
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Lead CRM Details Modal */}
            {showLeadModal && selectedLead && (
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(5, 5, 8, 0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)' }}>
                <div className="card animate-fade-in" style={{ maxWidth: '520px', width: '90%', padding: '32px', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>CRM Lead: {selectedLead.name}</h3>
                    <button onClick={() => { setShowLeadModal(false); setSelectedLead(null); }} style={{ fontSize: '1.5rem', color: 'var(--text-muted)', cursor: 'pointer', background: 'none', border: 'none' }}>&times;</button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', padding: '12px', background: 'var(--btn-secondary-bg)', border: '1px solid var(--border)', borderRadius: '6px', lineHeight: '1.5' }}>
                      <strong>Original Inquiry Brief:</strong>
                      <div style={{ marginTop: '4px', fontStyle: 'italic' }}>&quot;{selectedLead.message}&quot;</div>
                      <div style={{ marginTop: '8px', fontSize: '0.75rem', display: 'flex', justifySelf: 'flex-start', gap: '10px' }}>
                        <span>Email: <strong>{selectedLead.email}</strong></span>
                        <span>IP: <strong>{selectedLead.visitor_ip || 'unknown'}</strong></span>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div className="input-group">
                        <label className="input-label">Pipeline Status</label>
                        <select className="form-select" value={leadPipelineStatus} onChange={e => setLeadPipelineStatus(e.target.value)}>
                          <option value="New">New</option>
                          <option value="Qualified">Qualified</option>
                          <option value="Proposal Sent">Proposal Sent</option>
                          <option value="Negotiation">Negotiation</option>
                          <option value="Won">Won</option>
                          <option value="Lost">Lost</option>
                        </select>
                      </div>
                      <div className="input-group">
                        <label className="input-label">Lead Value ($)</label>
                        <input type="number" className="form-input" placeholder="Budget value e.g. 2500" value={leadValue} onChange={e => setLeadValue(Number(e.target.value))} />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div className="input-group">
                        <label className="input-label">Inbound Traffic Source</label>
                        <input type="text" className="form-input" placeholder="e.g. Twitter, SEO, Direct" value={leadSource} onChange={e => setLeadSource(e.target.value)} />
                      </div>
                      <div className="input-group">
                        <label className="input-label">Category Tags</label>
                        <input type="text" className="form-input" placeholder="e.g. Web Design, React" value={leadTags} onChange={e => setLeadTags(e.target.value)} />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div className="input-group">
                        <label className="input-label">Last Contact Date</label>
                        <input type="date" className="form-input" value={leadLastContactDate} onChange={e => setLeadLastContactDate(e.target.value)} />
                      </div>
                      <div className="input-group">
                        <label className="input-label">Follow-up Reminder Date</label>
                        <input type="date" className="form-input" value={leadReminderDate} onChange={e => setLeadReminderDate(e.target.value)} />
                      </div>
                    </div>

                    <div className="input-group">
                      <label className="input-label">CRM Follow-up Notes & Backlog</label>
                      <textarea className="form-textarea" placeholder="Record feedback, alignment notes, and next follow-up agenda..." value={leadNotes} onChange={e => setLeadNotes(e.target.value)} style={{ minHeight: '80px', lineHeight: '1.4' }} />
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                      <button 
                        onClick={() => handleSaveLeadCRMDetails(selectedLead.id, {
                          pipeline_status: leadPipelineStatus,
                          lead_value: leadValue,
                          source: leadSource,
                          tags: leadTags,
                          last_contact_date: leadLastContactDate,
                          notes: leadNotes,
                          reminder_date: leadReminderDate
                        })}
                        className="btn btn-primary"
                        style={{ flex: 1, padding: '10px', fontWeight: 600 }}
                      >
                        Save CRM details
                      </button>
                      <button 
                        onClick={() => { setShowLeadModal(false); setSelectedLead(null); }}
                        className="btn btn-secondary"
                        style={{ flex: 1, padding: '10px' }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: QUOTES */}
        {activeTab === 'quotes' && (
          <div className="animate-fade-in">
            {quoteView === 'list' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>Quotes Estimates</h1>
                  <button onClick={initCreateQuote} className="btn btn-primary">New Quote</button>
                </div>

                {getActiveQuotes().length === 0 ? (
                  <div className="card" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                    <p style={{ fontSize: '1rem', marginBottom: '4px', color: 'var(--text-main)', fontWeight: 600 }}>No Quotes Drafted</p>
                    <p style={{ fontSize: '0.85rem' }}>Quotes are estimates. You can convert them to invoices upon acceptance.</p>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--background-card)' }}>
                    <table>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--btn-secondary-bg)' }}>
                          <th style={{ padding: '14px 18px' }}>Quote #</th>
                          <th style={{ padding: '14px 18px' }}>Recipient Client</th>
                          <th style={{ padding: '14px 18px' }}>Financial Total</th>
                          <th style={{ padding: '14px 18px' }}>Status</th>
                          <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getActiveQuotes().map((q) => (
                          <tr key={q.id} style={{ borderBottom: '1px solid var(--border)' }} className="table-row-hover">
                            <td style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--text-main)' }}>{q.quote_number}</td>
                            <td style={{ padding: '14px 18px' }}>
                              <div style={{ fontWeight: 600 }}>{q.client_name}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{q.client_email}</div>
                            </td>
                            <td style={{ padding: '14px 18px', fontWeight: 600 }}>
                              {getCurrencySymbol(q.currency)}{(q.total / 100).toFixed(2)}
                            </td>
                            <td style={{ padding: '14px 18px' }}>
                              <span 
                                className="badge" 
                                style={{ 
                                  fontSize: '0.7rem',
                                  backgroundColor: q.status === 'converted' ? 'var(--success-glow)' : 'var(--btn-secondary-bg)', 
                                  color: q.status === 'converted' ? 'var(--success-text)' : 'var(--text-muted)' 
                                }}
                              >
                                {q.status}
                              </span>
                            </td>
                            <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                <button 
                                  onClick={() => {
                                    setQId(q.id);
                                    setQNumber(q.quote_number);
                                    setQClientName(q.client_name);
                                    setQClientEmail(q.client_email || '');
                                    setQClientAddress(q.client_address || '');
                                    setQCurrency(q.currency || 'USD');
                                    setQNotes(q.notes || '');
                                    setQTaxRate(Number(q.tax_rate || 0));
                                    setQDiscountRate(Number(q.discount_rate || 0));
                                    const itemsParsed = Array.isArray(q.items) ? q.items : JSON.parse(q.items || '[]');
                                    setQItems(itemsParsed.map(i => ({
                                      description: i.description,
                                      quantity: i.quantity,
                                      unitPrice: i.unitPrice || (i.unit_price || 0) / 100
                                    })));
                                    setQStatus(q.status);
                                    setQuoteView('edit');
                                  }} 
                                  className="btn btn-secondary btn-sm"
                                >
                                  Edit
                                </button>
                                {q.status !== 'converted' && (
                                  <button onClick={() => handleConvertQuoteToInvoice(q)} className="btn btn-primary btn-sm">
                                    Bill Loop
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Quote Create / Edit View */}
            {(quoteView === 'create' || quoteView === 'edit') && (
              <div className="card animate-fade-in" style={{ background: 'var(--background-card)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                    {quoteView === 'create' ? 'Create Quote estimate' : `Edit Quote ${qNumber}`}
                  </h2>
                  <button onClick={() => setQuoteView('list')} className="btn btn-secondary btn-sm">Cancel</button>
                </div>

                {/* Quick Presets & AI Scope Expansion */}
                <div className="card glass-panel" style={{ padding: '20px', marginBottom: '28px', border: '1px solid var(--border)' }}>
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '12px', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>✨</span> AI Scope Expansion & Design Presets
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                    Quickly apply industry-standard freelancer project templates, or type your project details to let AI automatically generate milestones, deliverables, pricing, and notes.
                  </p>
                  
                  {/* Presets Grid */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
                    {Object.keys(quoteTemplates).map((templateName) => (
                      <button
                        key={templateName}
                        type="button"
                        onClick={() => handleApplyQuoteTemplate(templateName)}
                        className="btn btn-secondary btn-sm"
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}
                      >
                        {templateName === 'Web Design' && '🎨'}
                        {templateName === 'Web Development' && '💻'}
                        {templateName === 'Mobile App' && '📱'}
                        {templateName === 'Consulting' && '💼'}
                        {templateName === 'Marketing' && '📈'}
                        {templateName === 'Design' && '✏️'}
                        {templateName} Preset
                      </button>
                    ))}
                  </div>

                  {/* AI Prompt Input */}
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Describe your project (e.g. 'SaaS dashboard with Figma UI + custom payment link + Next.js build')..."
                        value={quotePrompt}
                        onChange={(e) => setQuotePrompt(e.target.value)}
                        style={{ paddingRight: '100px' }}
                      />
                      <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        AI Writer
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleAiScopeExpansion}
                      disabled={isExpandingQuote || !quotePrompt}
                      className="btn btn-primary btn-sm"
                      style={{ height: '42px', padding: '0 20px', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      {isExpandingQuote ? 'Expanding...' : '🪄 Generate Scope'}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '32px' }}>
                  {/* Left Form */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      <div className="input-group">
                        <label className="input-label">Quote Number</label>
                        <input type="text" className="form-input" value={qNumber} onChange={e => setQNumber(e.target.value)} required />
                      </div>
                      <div className="input-group">
                        <label className="input-label">Currency</label>
                        <select className="form-select" value={qCurrency} onChange={e => setQCurrency(e.target.value)}>
                          <option value="USD">USD ($)</option>
                          <option value="EUR">EUR (€)</option>
                          <option value="GBP">GBP (£)</option>
                          <option value="CNY">CNY (¥)</option>
                        </select>
                      </div>
                    </div>

                    <div className="card" style={{ padding: '20px', background: 'var(--btn-secondary-bg)', border: '1px solid var(--border)' }}>
                      <h3 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '12px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Client Specifications</h3>
                      <div className="input-group">
                        <label className="input-label">Client Name</label>
                        <input type="text" className="form-input" value={qClientName} onChange={e => setQClientName(e.target.value)} required placeholder="e.g. Wayne Enterprises" />
                      </div>
                      <div className="input-group">
                        <label className="input-label">Client Email</label>
                        <input type="email" className="form-input" value={qClientEmail} onChange={e => setQClientEmail(e.target.value)} placeholder="e.g. billing@wayne.com" />
                      </div>
                      <div className="input-group">
                        <label className="input-label">Billing Address</label>
                        <input type="text" className="form-input" value={qClientAddress} onChange={e => setQClientAddress(e.target.value)} placeholder="e.g. 1007 Mountain Dr, Gotham" />
                      </div>
                    </div>

                    {/* Line Items */}
                    <div>
                      <h3 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '12px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Line Items</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {qItems.map((item, index) => (
                          <div key={index} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1.5fr 0.5fr', gap: '10px', alignItems: 'center' }}>
                            <input type="text" className="form-input" placeholder="Service / Deliverable description" value={item.description} onChange={e => handleItemChange('quote', index, 'description', e.target.value)} required />
                            <input type="number" className="form-input" placeholder="Qty" value={item.quantity} onChange={e => handleItemChange('quote', index, 'quantity', Number(e.target.value))} required />
                            <input type="number" className="form-input" placeholder="Rate" value={item.unitPrice} onChange={e => handleItemChange('quote', index, 'unitPrice', Number(e.target.value))} required />
                            <button onClick={() => removeItem('quote', index)} style={{ color: 'var(--danger)', fontSize: '1.25rem', cursor: 'pointer' }}>&times;</button>
                          </div>
                        ))}
                      </div>
                      <button onClick={() => addItem('quote')} className="btn btn-secondary btn-sm" style={{ marginTop: '12px' }}>+ Add Item</button>
                    </div>
                  </div>

                  {/* Right Summary Card */}
                  <div>
                    <div className="card" style={{ padding: '24px', background: 'var(--btn-secondary-bg)', border: '1px solid var(--border)' }}>
                      <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '16px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Financial Summary</h3>
                      <div className="input-group">
                        <label className="input-label">Tax Rate (%)</label>
                        <input type="number" className="form-input" value={qTaxRate} onChange={e => setQTaxRate(Number(e.target.value))} />
                      </div>
                      <div className="input-group">
                        <label className="input-label">Discount Rate (%)</label>
                        <input type="number" className="form-input" value={qDiscountRate} onChange={e => setQDiscountRate(Number(e.target.value))} />
                      </div>
                      <div className="input-group" style={{ marginBottom: '20px' }}>
                        <label className="input-label">Quote Status</label>
                        <select className="form-select" value={qStatus} onChange={e => setQStatus(e.target.value)}>
                          <option value="draft">Draft</option>
                          <option value="sent">Sent</option>
                          <option value="approved">Approved</option>
                          <option value="declined">Declined</option>
                        </select>
                      </div>

                      {/* Calculations */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--border)', paddingTop: '16px', fontSize: '0.85rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Subtotal:</span>
                          <span>{getCurrencySymbol(qCurrency)}{(qItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)).toFixed(2)}</span>
                        </div>
                        {qDiscountRate > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--danger)' }}>
                            <span>Discount ({qDiscountRate}%):</span>
                            <span>-{getCurrencySymbol(qCurrency)}{(qItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0) * qDiscountRate / 100).toFixed(2)}</span>
                          </div>
                        )}
                        {qTaxRate > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Tax ({qTaxRate}%):</span>
                            <span>{getCurrencySymbol(qCurrency)}{(qItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0) * (1 - qDiscountRate / 100) * qTaxRate / 100).toFixed(2)}</span>
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.1rem', marginTop: '8px', borderTop: '1px solid var(--border)', paddingTop: '12px', color: 'var(--accent)' }}>
                          <span>Total:</span>
                          <span>{getCurrencySymbol(qCurrency)}{(qItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0) * (1 - qDiscountRate / 100) * (1 + qTaxRate / 100)).toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="input-group" style={{ marginTop: '20px' }}>
                        <label className="input-label">Quote Notes</label>
                        <textarea className="form-textarea" value={qNotes} onChange={e => setQNotes(e.target.value)} placeholder="Proposed payment stages, terms of valid options..." />
                      </div>

                      <button onClick={handleSaveQuote} disabled={isSaving} className="btn btn-primary" style={{ width: '100%', marginTop: '20px' }}>
                        {isSaving ? 'Saving...' : 'Save Quote'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: INVOICES */}
        {activeTab === 'invoices' && (
          <div className="animate-fade-in">
            {invoiceView === 'list' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>Invoices Management</h1>
                  <button onClick={initCreateInvoice} className="btn btn-primary">New Invoice</button>
                </div>

                {getActiveInvoices().length === 0 ? (
                  <div className="card" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                    <p style={{ fontSize: '1rem', marginBottom: '4px', color: 'var(--text-main)', fontWeight: 600 }}>No Invoices Generated</p>
                    <p style={{ fontSize: '0.85rem' }}>Create a formal invoice to bill clients with integrated card payment links.</p>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--background-card)' }}>
                    <table>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--btn-secondary-bg)' }}>
                          <th style={{ padding: '14px 18px' }}>Invoice #</th>
                          <th style={{ padding: '14px 18px' }}>Recipient Client</th>
                          <th style={{ padding: '14px 18px' }}>Issue & Due dates</th>
                          <th style={{ padding: '14px 18px' }}>Financial Total</th>
                          <th style={{ padding: '14px 18px' }}>Status</th>
                          <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getActiveInvoices().map((inv) => (
                          <tr key={inv.id} style={{ borderBottom: '1px solid var(--border)' }} className="table-row-hover">
                            <td style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--text-main)' }}>{inv.invoice_number}</td>
                            <td style={{ padding: '14px 18px' }}>
                              <div style={{ fontWeight: 600 }}>{inv.client_name}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{inv.client_email}</div>
                            </td>
                            <td style={{ padding: '14px 18px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              <div>Issued: {new Date(inv.invoice_date || inv.created_at).toLocaleDateString()}</div>
                              <div style={{ marginTop: '2px' }}>Due: {new Date(inv.due_date).toLocaleDateString()}</div>
                            </td>
                            <td style={{ padding: '14px 18px', fontWeight: 600 }}>
                              {getCurrencySymbol(inv.currency)}{(inv.total / 100).toFixed(2)}
                            </td>
                            <td style={{ padding: '14px 18px' }}>
                              <span 
                                className="badge" 
                                style={{ 
                                  fontSize: '0.7rem',
                                  backgroundColor: inv.status === 'paid' ? 'var(--success-glow)' : (inv.status === 'overdue' ? 'var(--danger-glow)' : 'var(--btn-secondary-bg)'), 
                                  color: inv.status === 'paid' ? 'var(--success-text)' : (inv.status === 'overdue' ? 'var(--danger-text)' : 'var(--text-muted)') 
                                }}
                              >
                                {inv.status}
                              </span>
                            </td>
                            <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                <button 
                                  onClick={() => {
                                    setInvId(inv.id);
                                    setInvNumber(inv.invoice_number);
                                    setInvClientName(inv.client_name);
                                    setInvClientEmail(inv.client_email || '');
                                    setInvClientAddress(inv.client_address || '');
                                    setInvCurrency(inv.currency || 'USD');
                                    const deserialized = deserializeInvoiceNotes(inv.notes);
                                    setInvNotes(deserialized.notes);
                                    setInvBillingType(deserialized.billing_type);
                                    setInvLateFee(Number(deserialized.late_fee));
                                    setInvAutoReminder(deserialized.auto_reminder);
                                    setInvTaxRate(Number(inv.tax_rate || 0));
                                    setInvDiscountRate(Number(inv.discount_rate || 0));
                                    setInvDate(inv.invoice_date || getTodayString());
                                    setInvDueDate(inv.due_date || getFutureDateString(30));
                                    setInvPaymentTerms(inv.payment_terms || 'Net 30');
                                    setInvPaymentLink(inv.payment_link || inv.stripe_payment_link || '');
                                    setInvQuoteId(inv.quote_id || null);
                                    const itemsParsed = Array.isArray(inv.items) ? inv.items : JSON.parse(inv.items || '[]');
                                    setInvItems(itemsParsed.map(i => ({
                                      description: i.description,
                                      quantity: i.quantity,
                                      unitPrice: i.unitPrice || (i.unit_price || 0) / 100
                                    })));
                                    setInvStatus(inv.status);
                                    setInvoiceView('edit');
                                  }} 
                                  className="btn btn-secondary btn-sm"
                                >
                                  Edit
                                </button>
                                {inv.status !== 'paid' && (
                                  <button onClick={() => openReminderModalFor(inv)} className="btn btn-secondary btn-sm">Reminder</button>
                                )}
                                {(inv.payment_link || inv.stripe_payment_link) && (
                                  <a href={inv.payment_link || inv.stripe_payment_link} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ color: 'var(--accent)' }}>Pay Link</a>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Invoice Create / Edit View */}
            {(invoiceView === 'create' || invoiceView === 'edit') && (
              <div className="card animate-fade-in" style={{ background: 'var(--background-card)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                    {invoiceView === 'create' ? 'Create Formal Invoice' : `Edit Invoice ${invNumber}`}
                  </h2>
                  <button onClick={() => setInvoiceView('list')} className="btn btn-secondary btn-sm">Cancel</button>
                </div>

                {/* Visual Timeline Tracking */}
                {renderInvoiceTimeline(invStatus)}

                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '32px' }}>
                  {/* Left Form */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      <div className="input-group">
                        <label className="input-label">Invoice Number</label>
                        <input type="text" className="form-input" value={invNumber} onChange={e => setInvNumber(e.target.value)} required />
                      </div>
                      <div className="input-group">
                        <label className="input-label">Currency</label>
                        <select className="form-select" value={invCurrency} onChange={e => setInvCurrency(e.target.value)}>
                          <option value="USD">USD ($)</option>
                          <option value="EUR">EUR (€)</option>
                          <option value="GBP">GBP (£)</option>
                          <option value="CNY">CNY (¥)</option>
                        </select>
                      </div>
                    </div>

                    <div className="card" style={{ padding: '20px', background: 'var(--btn-secondary-bg)', border: '1px solid var(--border)' }}>
                      <h3 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '12px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Client Specifications</h3>
                      <div className="input-group">
                        <label className="input-label">Client Name</label>
                        <input type="text" className="form-input" value={invClientName} onChange={e => setInvClientName(e.target.value)} required placeholder="e.g. Tony Stark" />
                      </div>
                      <div className="input-group">
                        <label className="input-label">Client Email</label>
                        <input type="email" className="form-input" value={invClientEmail} onChange={e => setInvClientEmail(e.target.value)} placeholder="e.g. tony@stark.com" />
                      </div>
                      <div className="input-group">
                        <label className="input-label">Billing Address</label>
                        <input type="text" className="form-input" value={invClientAddress} onChange={e => setInvClientAddress(e.target.value)} placeholder="e.g. Malibu Malibu, CA" />
                      </div>
                    </div>

                    {/* Line Items */}
                    <div>
                      <h3 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '12px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Line Items</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {invItems.map((item, index) => (
                          <div key={index} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1.5fr 0.5fr', gap: '10px', alignItems: 'center' }}>
                            <input type="text" className="form-input" placeholder="Service description" value={item.description} onChange={e => handleItemChange('invoice', index, 'description', e.target.value)} required />
                            <input type="number" className="form-input" placeholder="Qty" value={item.quantity} onChange={e => handleItemChange('invoice', index, 'quantity', Number(e.target.value))} required />
                            <input type="number" className="form-input" placeholder="Rate" value={item.unitPrice} onChange={e => handleItemChange('invoice', index, 'unitPrice', Number(e.target.value))} required />
                            <button onClick={() => removeItem('invoice', index)} style={{ color: 'var(--danger)', fontSize: '1.25rem', cursor: 'pointer' }}>&times;</button>
                          </div>
                        ))}
                      </div>
                      <button onClick={() => addItem('invoice')} className="btn btn-secondary btn-sm" style={{ marginTop: '12px' }}>+ Add Item</button>
                    </div>

                    {/* Stripe/LemonSqueezy Checkout Links */}
                    <div className="card" style={{ padding: '20px', background: 'var(--btn-secondary-bg)', border: '1px solid var(--border)' }}>
                      <h3 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent)', textTransform: 'uppercase' }}>
                        Payment Link
                      </h3>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                        Add your Stripe, PayPal, or LemonSqueezy payment link.
                      </p>
                      <input 
                        type="url" 
                        className="form-input" 
                        placeholder="https://checkout.stripe.com/... or https://buy.lemonsqueezy.com/..." 
                        value={invPaymentLink} 
                        onChange={e => setInvPaymentLink(e.target.value)} 
                      />
                      {process.env.NODE_ENV === 'development' && (
                        <div style={{ marginTop: '10px', fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '10px' }}>
                          <button type="button" onClick={() => setInvPaymentLink(`https://checkout.stripe.com/c/pay/mock_cs_${invNumber.toLowerCase()}`)} style={{ color: 'var(--accent)', cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}>Set Mock Stripe link</button>
                          <button type="button" onClick={() => setInvPaymentLink(`https://buy.lemonsqueezy.com/checkout/mock_${invNumber.toLowerCase()}`)} style={{ color: 'var(--accent)', cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}>Set Mock LemonSqueezy link</button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Summary Card */}
                  <div>
                    <div className="card" style={{ padding: '24px', background: 'var(--btn-secondary-bg)', border: '1px solid var(--border)' }}>
                      <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '16px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Financial Summary</h3>
                      <div className="input-group">
                        <label className="input-label">Payment Terms</label>
                        <select 
                          className="form-select" 
                          value={invPaymentTerms} 
                          onChange={e => {
                            setInvPaymentTerms(e.target.value);
                            updateDueDateFromTerms(e.target.value, invDate);
                          }}
                        >
                          <option value="Due on Receipt">Due on Receipt</option>
                          <option value="Net 15">Net 15</option>
                          <option value="Net 30">Net 30</option>
                          <option value="Net 60">Net 60</option>
                        </select>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div className="input-group">
                          <label className="input-label">Issue Date</label>
                          <input type="date" className="form-input" value={invDate} onChange={e => { setInvDate(e.target.value); updateDueDateFromTerms(invPaymentTerms, e.target.value); }} />
                        </div>
                        <div className="input-group">
                          <label className="input-label">Due Date</label>
                          <input type="date" className="form-input" value={invDueDate} onChange={e => setInvDueDate(e.target.value)} />
                        </div>
                      </div>
                      
                      <div className="input-group">
                        <label className="input-label">Tax Rate (%)</label>
                        <input type="number" className="form-input" value={invTaxRate} onChange={e => setInvTaxRate(Number(e.target.value))} />
                      </div>
                      <div className="input-group">
                        <label className="input-label">Discount Rate (%)</label>
                        <input type="number" className="form-input" value={invDiscountRate} onChange={e => setInvDiscountRate(Number(e.target.value))} />
                      </div>
                      <div className="input-group" style={{ marginBottom: '20px' }}>
                        <label className="input-label">Invoice Status</label>
                        <select className="form-select" value={invStatus} onChange={e => setInvStatus(e.target.value)}>
                          <option value="pending">Unpaid/Pending</option>
                          <option value="paid">Paid</option>
                          <option value="overdue">Overdue</option>
                        </select>
                      </div>

                      {/* Billing Settings */}
                      <div className="card glass-panel" style={{ padding: '16px', marginTop: '16px', marginBottom: '16px', background: 'var(--btn-secondary-bg)', border: '1px solid var(--border)' }}>
                        <h4 style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '12px' }}>Billing Settings</h4>
                        
                        <div className="input-group" style={{ marginBottom: '12px' }}>
                          <label className="input-label">Billing Type</label>
                          <select className="form-select" value={invBillingType} onChange={e => setInvBillingType(e.target.value)}>
                            <option value="standard">Standard / Milestone</option>
                            <option value="deposit">Deposit Invoice</option>
                            <option value="retainer">Retainer Invoice</option>
                            <option value="recurring">Recurring Subscription</option>
                          </select>
                        </div>

                        <div className="input-group" style={{ marginBottom: '12px' }}>
                          <label className="input-label">Late Fee Policy</label>
                          <select className="form-select" value={invLateFee} onChange={e => setInvLateFee(Number(e.target.value))}>
                            <option value={0}>No Late Fees</option>
                            <option value={2}>2% monthly late fee</option>
                            <option value={5}>5% monthly late fee</option>
                            <option value={10}>10% monthly late fee</option>
                          </select>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px' }}>
                          <input 
                            type="checkbox" 
                            id="invAutoReminder"
                            checked={invAutoReminder} 
                            onChange={e => setInvAutoReminder(e.target.checked)} 
                            style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                          />
                          <label htmlFor="invAutoReminder" style={{ fontSize: '0.8rem', cursor: 'pointer', color: 'var(--text-main)' }}>
                            Enable late-payment reminders
                          </label>
                        </div>
                      </div>

                      {/* Calculations */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--border)', paddingTop: '16px', fontSize: '0.85rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Subtotal:</span>
                          <span>{getCurrencySymbol(invCurrency)}{(invItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)).toFixed(2)}</span>
                        </div>
                        {invDiscountRate > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--danger)' }}>
                            <span>Discount ({invDiscountRate}%):</span>
                            <span>-{getCurrencySymbol(invCurrency)}{(invItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0) * invDiscountRate / 100).toFixed(2)}</span>
                          </div>
                        )}
                        {invTaxRate > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Tax ({invTaxRate}%):</span>
                            <span>{getCurrencySymbol(invCurrency)}{(invItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0) * (1 - invDiscountRate / 100) * invTaxRate / 100).toFixed(2)}</span>
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.1rem', marginTop: '8px', borderTop: '1px solid var(--border)', paddingTop: '12px', color: 'var(--accent)' }}>
                          <span>Total:</span>
                          <span>{getCurrencySymbol(invCurrency)}{(invItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0) * (1 - invDiscountRate / 100) * (1 + invTaxRate / 100)).toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="input-group" style={{ marginTop: '20px' }}>
                        <label className="input-label">Payment Notes</label>
                        <textarea className="form-textarea" value={invNotes} onChange={e => setInvNotes(e.target.value)} placeholder="Bank details, wire instructions..." />
                      </div>

                      <button onClick={handleSaveInvoice} disabled={isSaving} className="btn btn-primary" style={{ width: '100%', marginTop: '20px' }}>
                        {isSaving ? 'Saving...' : 'Save Invoice'}
                      </button>

                      {/* PDF render target (hidden preview for html2pdf screenshot) */}
                      <div style={{ display: 'none' }}>
                        <div id="printable-invoice" style={{ padding: '40px', background: '#fff', color: '#1e293b', fontFamily: 'monospace', width: '794px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #cbd5e1', paddingBottom: '15px', marginBottom: '15px' }}>
                            <div>
                              <h2 style={{ margin: 0, fontSize: '1.6rem', color: '#0f172a' }}>INVOICE</h2>
                              <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Generated via Freelancer Business OS</p>
                            </div>
                            <div style={{ textAlign: 'right', fontSize: '0.85rem' }}>
                              <p style={{ margin: 0, fontWeight: 'bold' }}>#{invNumber}</p>
                              <p style={{ margin: '3px 0 0 0' }}>Date: {invDate}</p>
                              <p style={{ margin: '3px 0 0 0' }}>Due Date: {invDueDate}</p>
                            </div>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px', fontSize: '0.9rem' }}>
                            <div>
                              <h5 style={{ margin: '0 0 4px 0', textTransform: 'uppercase', color: '#94a3b8', fontSize: '0.75rem' }}>Billed To:</h5>
                              <p style={{ margin: 0, fontWeight: 'bold' }}>{invClientName}</p>
                              <p style={{ margin: 0 }}>{invClientEmail}</p>
                              <p style={{ margin: 0 }}>{invClientAddress}</p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <h5 style={{ margin: '0 0 4px 0', textTransform: 'uppercase', color: '#94a3b8', fontSize: '0.75rem' }}>From:</h5>
                              <p style={{ margin: 0, fontWeight: 'bold' }}>{user.name || 'Freelancer'}</p>
                              <p style={{ margin: 0 }}>{user.email}</p>
                            </div>
                          </div>

                          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '0.9rem' }}>
                            <thead>
                              <tr style={{ borderBottom: '1px solid #cbd5e1', textAlign: 'left', color: '#64748b' }}>
                                <th style={{ padding: '8px 0' }}>Description</th>
                                <th style={{ padding: '8px 0', textAlign: 'center', width: '10%' }}>Qty</th>
                                <th style={{ padding: '8px 0', textAlign: 'right', width: '20%' }}>Rate</th>
                                <th style={{ padding: '8px 0', textAlign: 'right', width: '20%' }}>Amount</th>
                              </tr>
                            </thead>
                            <tbody>
                              {invItems.map((item, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', color: '#334155' }}>
                                  <td style={{ padding: '10px 0' }}>{item.description}</td>
                                  <td style={{ padding: '10px 0', textAlign: 'center' }}>{item.quantity}</td>
                                  <td style={{ padding: '10px 0', textAlign: 'right' }}>
                                    {getCurrencySymbol(invCurrency)}{Number(item.unitPrice || 0).toFixed(2)}
                                  </td>
                                  <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: 'bold', color: '#0f172a' }}>
                                    {getCurrencySymbol(invCurrency)}{(item.quantity * Number(item.unitPrice || 0)).toFixed(2)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>

                          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', fontSize: '0.9rem' }}>
                            <div>
                              {invNotes && (
                                <>
                                  <h6 style={{ margin: '0 0 4px 0', textTransform: 'uppercase', color: '#94a3b8', fontSize: '0.7rem' }}>Payment Notes:</h6>
                                  <p style={{ margin: 0, fontSize: '0.8rem', lineHeight: '1.4' }}>{invNotes}</p>
                                </>
                              )}
                              {invPaymentLink && (
                                <div style={{ marginTop: '15px', padding: '10px', background: 'var(--btn-secondary-bg)', border: '1px dashed var(--border)', borderRadius: '4px' }}>
                                  <span style={{ fontSize: '0.75rem', fontWeight: 'bold', display: 'block', color: '#64748b', textTransform: 'uppercase', marginBottom: '2px' }}>Online Checkout URL:</span>
                                  <a href={invPaymentLink} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', color: '#4f46e5', textDecoration: 'underline', wordBreak: 'break-all' }}>{invPaymentLink}</a>
                                </div>
                              )}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', textAlign: 'right' }}>
                              <div style={{ width: '100%', maxWidth: '200px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                                  <span>Subtotal:</span>
                                  <span>{getCurrencySymbol(invCurrency)}{(invItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)).toFixed(2)}</span>
                                </div>
                                {invDiscountRate > 0 && (
                                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#e11d48' }}>
                                    <span>Discount ({invDiscountRate}%):</span>
                                    <span>-{getCurrencySymbol(invCurrency)}{(invItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0) * invDiscountRate / 100).toFixed(2)}</span>
                                  </div>
                                )}
                                {invTaxRate > 0 && (
                                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                                    <span>Tax ({invTaxRate}%):</span>
                                    <span>{getCurrencySymbol(invCurrency)}{(invItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0) * (1 - invDiscountRate / 100) * invTaxRate / 100).toFixed(2)}</span>
                                  </div>
                                )}
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '2px solid #0f172a', fontWeight: 'bold', fontSize: '1.05rem', color: '#0f172a' }}>
                                  <span>Total:</span>
                                  <span>{getCurrencySymbol(invCurrency)}{(invItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0) * (1 - invDiscountRate / 100) * (1 + invTaxRate / 100)).toFixed(2)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {invId && (
                        <button 
                          onClick={() => handlePdfDownload('printable-invoice', `invoice_${invNumber}`)} 
                          disabled={isDownloadingPdf} 
                          className="btn btn-secondary" 
                          style={{ width: '100%', marginTop: '12px' }}
                        >
                          {isDownloadingPdf ? 'Generating PDF...' : 'Download PDF Document'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: CLIENT DIRECTORY */}
        {activeTab === 'clients' && (
          <div className="animate-fade-in">
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '24px', letterSpacing: '-0.02em' }}>Client Directory</h1>
            
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
              {/* Directory List */}
              <div>
                {getActiveClients().length === 0 ? (
                  <div className="card" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                    <p style={{ fontSize: '1rem', marginBottom: '4px', color: 'var(--text-main)', fontWeight: 600 }}>Directory Empty</p>
                    <p style={{ fontSize: '0.85rem' }}>Save client addresses and emails on the right to autocomplete invoices instantly.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {getActiveClients().map((cli) => (
                      <div key={cli.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', background: 'var(--background-card)', border: '1px solid var(--border)' }}>
                        <div>
                          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>{cli.name}</h3>
                          <p style={{ fontSize: '0.85rem', color: 'var(--accent)', marginTop: '2px' }}>{cli.email}</p>
                          {cli.address && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>{cli.address}</p>}
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button 
                            onClick={() => {
                              initCreateInvoice();
                              setInvClientName(cli.name);
                              setInvClientEmail(cli.email || '');
                              setInvClientAddress(cli.address || '');
                              setActiveTab('invoices');
                            }} 
                            className="btn btn-secondary btn-sm"
                          >
                            Bill
                          </button>
                          <button onClick={() => handleDeleteClient(cli.id)} style={{ color: 'var(--danger)', fontSize: '0.85rem', padding: '0 8px', cursor: 'pointer' }}>Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Client Card */}
              <div>
                <div className="card" style={{ padding: '24px', background: 'var(--background-card)', border: '1px solid var(--border)' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px', letterSpacing: '-0.01em' }}>Save Client Profile</h3>
                  <form onSubmit={handleSaveClient} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="input-group">
                      <label className="input-label">Client Name</label>
                      <input type="text" className="form-input" value={newClientName} onChange={e => setNewClientName(e.target.value)} required placeholder="e.g. Wayne Enterprises" />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Client Email</label>
                      <input type="email" className="form-input" value={newClientEmail} onChange={e => setNewClientEmail(e.target.value)} placeholder="e.g. Bruce@wayne.com" />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Billing Address</label>
                      <textarea className="form-textarea" value={newClientAddress} onChange={e => setNewClientAddress(e.target.value)} placeholder="Mailing / Corporate billing address..." />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }}>Save Client</button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: PUBLIC PROFILE CARD CONFIGURATION */}
        {activeTab === 'profile' && (
          <div className="animate-fade-in">
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '24px', letterSpacing: '-0.02em' }}>Public Profile Setup</h1>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '32px' }}>
              
              {/* Card Profile Fields */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* Public Link Generator */}
                <div className="card" style={{ padding: '24px', background: 'var(--background-card)', border: '1px solid var(--border)' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px' }}>Shareable URL</h3>
                  {cpUsername ? (
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <input 
                        type="text" 
                        readOnly 
                        className="form-input" 
                        style={{ background: 'var(--btn-secondary-bg)', color: 'var(--accent)', fontWeight: 600 }}
                        value={`${typeof window !== 'undefined' ? window.location.origin : ''}/card/${cpUsername}`} 
                      />
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/card/${cpUsername}`);
                          alert('Profile Card Link copied!');
                        }}
                        className="btn btn-secondary btn-sm"
                        style={{ whiteSpace: 'nowrap' }}
                      >
                        Copy URL
                      </button>
                    </div>
                  ) : (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Select a username below to initialize your public business landing page URL.</p>
                  )}
                       {/* Profile Details Card */}
                <div className="card" style={{ padding: '32px', background: 'var(--background-card)', border: '1px solid var(--border)' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '20px' }}>Landing Page Attributes</h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      <div className="input-group">
                        <label className="input-label">Username (URL Slug)</label>
                        <input type="text" className="form-input" placeholder="e.g. alex-morgan" value={cpUsername} onChange={e => setCpUsername(e.target.value)} required />
                      </div>
                      <div className="input-group">
                        <label className="input-label">Display Name</label>
                        <input type="text" className="form-input" placeholder="e.g. Alex Morgan" value={cpName} onChange={e => setCpName(e.target.value)} />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      <div className="input-group">
                        <label className="input-label">Cover Banner CSS Background</label>
                        <input type="text" className="form-input" placeholder="e.g. linear-gradient(135deg, #6366f1, #06b6d4)" value={cpCoverBanner} onChange={e => setCpCoverBanner(e.target.value)} />
                      </div>
                      <div className="input-group">
                        <label className="input-label">Avatar Image URL</label>
                        <input type="text" className="form-input" placeholder="e.g. https://example.com/avatar.jpg" value={cpAvatarUrl} onChange={e => setCpAvatarUrl(e.target.value)} />
                      </div>
                    </div>

                    <div className="input-group">
                      <label className="input-label">Professional Subtitle</label>
                      <input type="text" className="form-input" placeholder="e.g. Full-Stack Developer & SaaS Designer" value={cpTitle} onChange={e => setCpTitle(e.target.value)} />
                    </div>

                    <div className="input-group">
                      <label className="input-label">Value Proposition (Bio)</label>
                      <textarea className="form-textarea" placeholder="Detail your experience, value proposition, and availability..." value={cpBio} onChange={e => setCpBio(e.target.value)} />
                    </div>

                    <div className="input-group">
                      <label className="input-label">Expertise Tags (Comma separated)</label>
                      <input type="text" className="form-input" placeholder="React, Node.js, Figma, UI/UX" value={cpTags} onChange={e => setCpTags(e.target.value)} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                      <div className="input-group">
                        <label className="input-label">Location</label>
                        <input type="text" className="form-input" placeholder="e.g. Remote / London" value={cpLocation} onChange={e => setCpLocation(e.target.value)} />
                      </div>
                      <div className="input-group">
                        <label className="input-label">Timezone</label>
                        <input type="text" className="form-input" placeholder="e.g. GMT+1" value={cpTimezone} onChange={e => setCpTimezone(e.target.value)} />
                      </div>
                      <div className="input-group">
                        <label className="input-label">Languages</label>
                        <input type="text" className="form-input" placeholder="e.g. English, French" value={cpLanguages} onChange={e => setCpLanguages(e.target.value)} />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                      <div className="input-group">
                        <label className="input-label">Starting Price</label>
                        <input type="text" className="form-input" placeholder="e.g. $1,500" value={cpStartingPrice} onChange={e => setCpStartingPrice(e.target.value)} />
                      </div>
                      <div className="input-group">
                        <label className="input-label">Avg Response Time</label>
                        <input type="text" className="form-input" placeholder="e.g. < 2 hours" value={cpResponseTime} onChange={e => setCpResponseTime(e.target.value)} />
                      </div>
                      <div className="input-group">
                        <label className="input-label">Availability Status</label>
                        <select className="form-select" value={cpAvailabilityStatus} onChange={e => setCpAvailabilityStatus(e.target.value)}>
                          <option value="Available for contract">Available for contract</option>
                          <option value="High availability">High availability</option>
                          <option value="Busy / Retainer only">Busy / Retainer only</option>
                          <option value="Vacation / Offline">Vacation / Offline</option>
                        </select>
                      </div>
                    </div>

                    <div className="input-group">
                      <label className="input-label">Calendly Booking Link URL</label>
                      <input type="url" className="form-input" placeholder="e.g. https://calendly.com/your-username" value={cpCalendlyLink} onChange={e => setCpCalendlyLink(e.target.value)} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      <div className="input-group">
                        <label className="input-label">Contact Email</label>
                        <input type="email" className="form-input" value={cpEmail} onChange={e => setCpEmail(e.target.value)} />
                      </div>
                      <div className="input-group">
                        <label className="input-label">Contact Phone</label>
                        <input type="text" className="form-input" value={cpPhone} onChange={e => setCpPhone(e.target.value)} />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      <div className="input-group">
                        <label className="input-label">GitHub Username</label>
                        <input type="text" className="form-input" value={cpGithub} onChange={e => setCpGithub(e.target.value)} />
                      </div>
                      <div className="input-group">
                        <label className="input-label">Twitter Username</label>
                        <input type="text" className="form-input" value={cpTwitter} onChange={e => setCpTwitter(e.target.value)} />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      <div className="input-group">
                        <label className="input-label">LinkedIn Username</label>
                        <input type="text" className="form-input" value={cpLinkedin} onChange={e => setCpLinkedin(e.target.value)} />
                      </div>
                      <div className="input-group">
                        <label className="input-label">Website URL</label>
                        <input type="url" className="form-input" value={cpWebsite} onChange={e => setCpWebsite(e.target.value)} />
                      </div>
                    </div>

                    {/* Trust Badges Config */}
                    <div className="card" style={{ padding: '16px', background: 'var(--btn-secondary-bg)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <span className="input-label" style={{ fontSize: '0.65rem' }}>Profile Badges</span>
                      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '0.85rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                          <input type="checkbox" checked={cpVerifiedBadge} onChange={e => setCpVerifiedBadge(e.target.checked)} />
                          Verified badge
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                          <input type="checkbox" checked={cpTopRatedBadge} onChange={e => setCpTopRatedBadge(e.target.checked)} />
                          Top Rated badge
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                          <input type="checkbox" checked={cpFastResponseBadge} onChange={e => setCpFastResponseBadge(e.target.checked)} />
                          Fast Response badge
                        </label>
                      </div>
                    </div>

                    <button onClick={handleSaveCardProfile} disabled={isSaving} className="btn btn-primary" style={{ marginTop: '12px', width: '100%' }}>
                      {isSaving ? 'Updating...' : 'Save Public Card Profile'}
                    </button>
                  </div>           </div>
                </div>
              </div>

              {/* Card Services & Portfolios Builders */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* Services Section */}
                <div className="card" style={{ padding: '24px', background: 'var(--background-card)', border: '1px solid var(--border)' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px', letterSpacing: '-0.01em' }}>Services List</h3>
                  
                  {/* Service list */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                    {cpServices.map((srv, idx) => (
                      <div key={idx} style={{ padding: '10px 12px', background: 'var(--btn-secondary-bg)', border: '1px solid var(--border)', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{srv.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>${srv.rate_amount} / {srv.rate_type}</div>
                        </div>
                        <button 
                          onClick={() => setCpServices(cpServices.filter((_, i) => i !== idx))} 
                          style={{ color: 'var(--danger)', cursor: 'pointer', fontSize: '0.8rem' }}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add service form */}
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <input type="text" className="form-input" placeholder="Service Name (e.g. Next.js Development)" value={tmpSrvName} onChange={e => setTmpSrvName(e.target.value)} />
                    <input type="text" className="form-input" placeholder="Service description..." value={tmpSrvDesc} onChange={e => setTmpSrvDesc(e.target.value)} />
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px' }}>
                      <input type="number" className="form-input" placeholder="Amount (e.g. 1500)" value={tmpSrvAmount} onChange={e => setTmpSrvAmount(Number(e.target.value))} />
                      <select className="form-select" value={tmpSrvType} onChange={e => setTmpSrvType(e.target.value)}>
                        <option value="fixed">Fixed</option>
                        <option value="hourly">Hourly</option>
                      </select>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => {
                        if (!tmpSrvName || tmpSrvAmount <= 0) return;
                        setCpServices([...cpServices, { id: `srv_${Date.now()}`, name: tmpSrvName, description: tmpSrvDesc, rate_type: tmpSrvType, rate_amount: tmpSrvAmount }]);
                        setTmpSrvName('');
                        setTmpSrvDesc('');
                        setTmpSrvAmount(0);
                      }}
                      className="btn btn-secondary btn-sm"
                    >
                      + Add Service
                    </button>
                  </div>
                </div>

                {/* Portfolio Section */}
                <div className="card" style={{ padding: '24px', background: 'var(--background-card)', border: '1px solid var(--border)' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px', letterSpacing: '-0.01em' }}>Portfolio Showcase</h3>
                  
                  {/* Portfolio List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                    {cpPortfolio.map((p, idx) => (
                      <div key={idx} style={{ padding: '10px 12px', background: 'var(--btn-secondary-bg)', border: '1px solid var(--border)', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{p.title}</div>
                        </div>
                        <button 
                          onClick={() => setCpPortfolio(cpPortfolio.filter((_, i) => i !== idx))} 
                          style={{ color: 'var(--danger)', cursor: 'pointer', fontSize: '0.8rem' }}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add portfolio form */}
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <input type="text" className="form-input" placeholder="Project Title" value={tmpProjTitle} onChange={e => setTmpProjTitle(e.target.value)} />
                    <input type="text" className="form-input" placeholder="Project description..." value={tmpProjDesc} onChange={e => setTmpProjDesc(e.target.value)} />
                    <input type="url" className="form-input" placeholder="Project URL Link" value={tmpProjLink} onChange={e => setTmpProjLink(e.target.value)} />
                    <button 
                      type="button" 
                      onClick={() => {
                        if (!tmpProjTitle) return;
                        setCpPortfolio([...cpPortfolio, { title: tmpProjTitle, description: tmpProjDesc, link: tmpProjLink }]);
                        setTmpProjTitle('');
                        setTmpProjDesc('');
                        setTmpProjLink('');
                      }}
                      className="btn btn-secondary btn-sm"
                    >
                      + Add Project
                    </button>
                  </div>
                </div>

                {/* Testimonials Section */}
                <div className="card" style={{ padding: '24px', background: 'var(--background-card)', border: '1px solid var(--border)' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px', letterSpacing: '-0.01em' }}>Testimonials / Client Reviews</h3>
                  
                  {/* Testimonial List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                    {cpTestimonials.map((t, idx) => (
                      <div key={idx} style={{ padding: '10px 12px', background: 'var(--btn-secondary-bg)', border: '1px solid var(--border)', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{t.client_name} ({t.client_project})</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>&quot;{t.feedback}&quot;</div>
                        </div>
                        <button 
                          onClick={() => setCpTestimonials(cpTestimonials.filter((_, i) => i !== idx))} 
                          style={{ color: 'var(--danger)', cursor: 'pointer', fontSize: '0.8rem' }}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add testimonial form */}
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <input type="text" className="form-input" placeholder="Client Name (e.g. Pepper Potts)" value={tmpClientName} onChange={e => setTmpClientName(e.target.value)} />
                    <input type="text" className="form-input" placeholder="Project Name (e.g. Stark Staging Audit)" value={tmpClientProject} onChange={e => setTmpClientProject(e.target.value)} />
                    <textarea className="form-textarea" placeholder="Client feedback details..." value={tmpClientFeedback} onChange={e => setTmpClientFeedback(e.target.value)} style={{ minHeight: '60px' }} />
                    <button 
                      type="button" 
                      onClick={() => {
                        if (!tmpClientName || !tmpClientFeedback) return;
                        setCpTestimonials([...cpTestimonials, { client_name: tmpClientName, client_project: tmpClientProject, feedback: tmpClientFeedback }]);
                        setTmpClientName('');
                        setTmpClientProject('');
                        setTmpClientFeedback('');
                      }}
                      className="btn btn-secondary btn-sm"
                    >
                      + Add Testimonial
                    </button>
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* TAB 7: AI COPILOT HUB */}
        {activeTab === 'copilot' && (
          <div className="animate-fade-in">
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '8px', letterSpacing: '-0.02em' }}>Freelancer AI Copilot</h1>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
              Your dedicated partner for client proposals, deliverables roadmapping, value pricing frameworks, service contracts, and late invoice follow-ups.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '32px' }}>
              
              {/* Left Panel: Selector & Inputs */}
              <div className="card glass-panel" style={{ padding: '24px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '20px', height: 'fit-content' }}>
                <div className="input-group">
                  <label className="input-label">Select Copilot Tool</label>
                  <select className="form-select" value={copilotTool} onChange={e => { setCopilotTool(e.target.value); setCopilotOutput(''); }}>
                    <option value="proposal">AI Proposal Pitch Writer</option>
                    <option value="scope">AI Scope & Roadmap Builder</option>
                    <option value="pricing">AI Value Pricing Assistant</option>
                    <option value="followup">AI Invoice Follow-up Draft</option>
                    <option value="contract">AI Service Contract Draft</option>
                  </select>
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Client Name Input */}
                  {['proposal', 'followup', 'contract'].includes(copilotTool) && (
                    <div className="input-group">
                      <label className="input-label">Client Name</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="e.g. Wayne Enterprises" 
                        value={copilotClient} 
                        onChange={e => setCopilotClient(e.target.value)} 
                      />
                    </div>
                  )}

                  {/* Freelancer Role */}
                  {['proposal'].includes(copilotTool) && (
                    <div className="input-group">
                      <label className="input-label">Your Professional Role</label>
                      <select className="form-select" value={copilotRole} onChange={e => setCopilotRole(e.target.value)}>
                        <option value="Developer">Web Developer</option>
                        <option value="Designer">UI/UX Designer</option>
                        <option value="Consultant">Fractional Consultant</option>
                        <option value="Marketer">Growth Marketer</option>
                      </select>
                    </div>
                  )}

                  {/* Pricing / Follow-up Tone */}
                  {['pricing', 'followup'].includes(copilotTool) && (
                    <div className="input-group">
                      <label className="input-label">
                        {copilotTool === 'pricing' ? 'Target Business Value' : 'Reminder Mood'}
                      </label>
                      <select className="form-select" value={copilotExtra} onChange={e => setCopilotExtra(e.target.value)}>
                        {copilotTool === 'pricing' ? (
                          <>
                            <option value="High (Enterprise SaaS)">High (Enterprise SaaS)</option>
                            <option value="Medium (Local Business)">Medium (Local SMB)</option>
                            <option value="Low (Personal Portfolio)">Low (Personal Web)</option>
                          </>
                        ) : (
                          <>
                            <option value="Polite (Soft Follow-up)">Polite & Casual</option>
                            <option value="Firm (Standard Penalty Warning)">Firm & Professional</option>
                            <option value="Urgent (Final Notice before pausing)">Urgent & Final</option>
                          </>
                        )}
                      </select>
                    </div>
                  )}

                  {/* Primary prompt input */}
                  <div className="input-group">
                    <label className="input-label">
                      {copilotTool === 'proposal' && 'Project Objectives'}
                      {copilotTool === 'scope' && 'Product Specifications'}
                      {copilotTool === 'pricing' && 'List of Scope Deliverables'}
                      {copilotTool === 'followup' && 'Overdue Milestone Info'}
                      {copilotTool === 'contract' && 'Service Scopes Details'}
                    </label>
                    <textarea 
                      className="form-textarea" 
                      placeholder={
                        copilotTool === 'proposal' ? "e.g. Figma wireframes + Next.js buildout for local restaurant platform..." :
                        copilotTool === 'scope' ? "e.g. iOS/Android React Native mobile commerce app with payment links..." :
                        copilotTool === 'pricing' ? "e.g. 5 layouts, custom payment links, SEO audit report..." :
                        copilotTool === 'followup' ? "e.g. Milestone 2 design sign-off overdue by 12 days..." :
                        "e.g. Custom Next.js SaaS audit and 3-month ongoing support terms..."
                      }
                      value={copilotPrompt} 
                      onChange={e => setCopilotPrompt(e.target.value)}
                      style={{ minHeight: '100px' }}
                    />
                  </div>
                </div>

                <button 
                  onClick={handleGenerateCopilot} 
                  disabled={isGeneratingCopilot} 
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '10px' }}
                >
                  {isGeneratingCopilot ? 'Generating Blueprint...' : '🪄 Generate Copilot Output'}
                </button>
              </div>

              {/* Right Panel: Output display */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="card" style={{ padding: '24px', background: 'var(--background-card)', border: '1px solid var(--border)', flex: 1, minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px', color: 'var(--accent)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Generated Blueprint</span>
                    {copilotOutput && (
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(copilotOutput);
                          alert('Copied to clipboard!');
                        }}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                      >
                        Copy Block
                      </button>
                    )}
                  </h3>

                  {copilotOutput ? (
                    <pre style={{ 
                      whiteSpace: 'pre-wrap', 
                      fontFamily: 'monospace', 
                      fontSize: '0.85rem', 
                      color: 'var(--text-main)', 
                      margin: 0, 
                      lineHeight: 1.5,
                      flex: 1
                    }}>
                      {copilotOutput}
                    </pre>
                  ) : (
                    <div style={{ display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', textAlign: 'center', padding: '40px 20px' }}>
                      <span style={{ fontSize: '2rem', marginBottom: '12px' }}>💡</span>
                      <p style={{ margin: 0, fontSize: '0.85rem' }}>
                        Configure the left parameters and click &quot;Generate&quot; to let AI draft a premium freelancer business template instantly.
                      </p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

      </main>

      {/* Reminder Text Copy Modal */}
      {showReminderModal && selectedInvoiceForReminder && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(5px)' }}>
          <div className="card animate-fade-in" style={{ maxWidth: '600px', width: '90%', padding: '32px', background: 'var(--background-card)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>Send Overdue Reminder</h3>
              <button onClick={() => setShowReminderModal(false)} style={{ fontSize: '1.5rem', color: 'var(--text-muted)', cursor: 'pointer' }}>&times;</button>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              {[
                { id: '7', label: '7 Days Overdue' },
                { id: '14', label: '14 Days Overdue' },
                { id: '30', label: '30 Days Overdue' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => { setActiveReminderTemplate(t.id); setReminderCopied(false); }}
                  className="btn btn-secondary btn-sm"
                  style={{
                    backgroundColor: activeReminderTemplate === t.id ? 'var(--primary)' : 'rgba(255,255,255,0.02)',
                    borderColor: activeReminderTemplate === t.id ? 'var(--primary)' : 'var(--border)'
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div style={{ padding: '16px', background: 'var(--btn-secondary-bg)', border: '1px solid var(--border)', borderRadius: '6px', fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '20px', whiteSpace: 'pre-wrap', maxHeight: '300px', overflowY: 'auto' }}>
              <div style={{ fontWeight: 'bold', borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '12px' }}>
                Subject: {getReminderEmailContent().subject}
              </div>
              <div>{getReminderEmailContent().body}</div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => {
                  const content = `Subject: ${getReminderEmailContent().subject}\n\n${getReminderEmailContent().body}`;
                  navigator.clipboard.writeText(content);
                  setReminderCopied(true);
                }} 
                className="btn btn-primary" 
                style={{ flex: 1 }}
              >
                {reminderCopied ? 'Copied Content!' : 'Copy to Clipboard'}
              </button>
              <button onClick={() => setShowReminderModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Pro Modal */}
      {showUpgradeModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(5px)' }}>
          <div className="card animate-fade-in" style={{ maxWidth: '500px', width: '90%', padding: '32px', background: 'var(--background-card)', border: '1px solid var(--border)', textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '12px' }}>Unlock Unlimited Access</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px', lineHeight: '1.5' }}>
              Upgrade to the Pro Beta Plan to unlock: unlimited clients, quotes & invoices, custom public card, watermark-free PDFs, AI quote generator, and payment reminders.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <Link href="/pricing" onClick={() => setShowUpgradeModal(false)} className="btn btn-primary" style={{ flex: 1 }}>View Pricing Plans</Link>
              <button onClick={() => setShowUpgradeModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
