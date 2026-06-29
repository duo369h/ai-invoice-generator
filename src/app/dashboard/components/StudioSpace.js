'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
// Telemetry layer purged - UI is pure render only
const trackEvent = () => {};

export default function StudioSpace({
  clients = [],
  invoices = [],
  quotes = [],
  leads = [],
  getCurrencySymbol,
  onCopyPortalLink,
  triggerToast,
  isSandbox = false,
  isStudioPreview = false,
  onUpgrade,
  onTabChange,
  businessModeBadge,

  // Brand System props passed from Dashboard.js
  cpLogoUrl = '',
  setCpLogoUrl,
  cpBrandColor = '#4f46e5',
  setCpBrandColor,
  cpBrandSecondary = '#06b6d4',
  setCpBrandSecondary,
  cpFontFamily = 'Inter',
  setCpFontFamily,
  cpThemePreference = 'dark',
  setCpThemePreference,
  cpName = '',
  cpTitle = '',
  handleSaveCardProfile,
  isSaving = false,
  cpPortfolio = [],

  // Client creation/deletion props
  newClientName = '',
  setNewClientName,
  newClientEmail = '',
  setNewClientEmail,
  newClientAddress = '',
  setNewClientAddress,
  handleSaveClient,
  handleDeleteClient,
  formError = '',
  formSuccess = '',

  // Quick actions / navigation
  initCreateInvoice,
  setInvClientName,
  setInvClientEmail,
  setInvClientAddress,
  initCreateQuote,
  setQClientName,
  setQClientEmail,
  setQClientAddress,
  handleDashboardTabChange,
}) {
  const [activeSubTab, setActiveSubTab] = useState('dashboard'); // dashboard, pipeline, directory, overdue, reminders, brand-system
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState('overview'); // overview, proposal, invoice, deliverables, notes, files
  const [brandActiveSubTab, setBrandActiveSubTab] = useState('assets'); // assets, templates, case-studies
  const [activities, setActivities] = useState([]);

  // Client metadata state (timezone, SLA, health)
  const [clientMeta, setClientMeta] = useState({ health: 'Healthy', timezone: 'EST (UTC-5)', sla: '< 24 hours' });

  // Deliverables checklist state
  const [deliverablesData, setDeliverablesData] = useState({
    status: 'Discovery',
    milestones: []
  });

  // Notes state
  const [notesText, setNotesText] = useState('');

  // Files state
  const [filesList, setFilesList] = useState([]);
  const [newFileTitle, setNewFileTitle] = useState('');
  const [newFileUrl, setNewFileUrl] = useState('');
  const [newFileCategory, setNewFileCategory] = useState('Design');

  // Milestone/Deliverable inputs
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [newDeliverableTitle, setNewDeliverableTitle] = useState({}); // milestoneId -> title
  const [newDeliverableDueDate, setNewDeliverableDueDate] = useState({}); // milestoneId -> date

  // Load client details whenever active workspace changes
  useEffect(() => {
    if (selectedClientId) {
      // 1. Load custom metadata (SLA, Timezone, Health)
      const rawMeta = window.localStorage.getItem(`corvioz_client_metadata_${selectedClientId}`);
      if (rawMeta) {
        try {
          setClientMeta(JSON.parse(rawMeta));
        } catch (e) {
          setClientMeta({ health: 'Healthy', timezone: 'EST (UTC-5)', sla: '< 24 hours' });
        }
      } else {
        setClientMeta({ health: 'Healthy', timezone: 'EST (UTC-5)', sla: '< 24 hours' });
      }

      // 2. Load deliverables data
      const rawDelivery = window.localStorage.getItem(`corvioz_client_delivery_${selectedClientId}`);
      if (rawDelivery) {
        try {
          setDeliverablesData(JSON.parse(rawDelivery));
        } catch (e) {
          setDeliverablesData({ status: 'Discovery', milestones: [] });
        }
      } else {
        // Seed default milestones for standard user experience
        const defaultDelivery = {
          status: 'Discovery',
          milestones: [
            {
              id: 'm1',
              title: 'Project Initiation & Scoping',
              deliverables: [
                { id: 'd1', title: 'Requirement gathering workshop', completed: true, dueDate: getTodayString() },
                { id: 'd2', title: 'Architecture design document', completed: false, dueDate: getFutureDateString(7) }
              ]
            }
          ]
        };
        setDeliverablesData(defaultDelivery);
        window.localStorage.setItem(`corvioz_client_delivery_${selectedClientId}`, JSON.stringify(defaultDelivery));
      }

      // 3. Load notes
      setNotesText(window.localStorage.getItem(`corvioz_client_notes_${selectedClientId}`) || '');

      // 4. Load files
      const rawFiles = window.localStorage.getItem(`corvioz_client_files_${selectedClientId}`);
      if (rawFiles) {
        try {
          setFilesList(JSON.parse(rawFiles));
        } catch (e) {
          setFilesList([]);
        }
      } else {
        const defaultFiles = [
          { id: 'f1', title: 'Figma Design Board', url: 'https://figma.com/sample-board', category: 'Design' },
          { id: 'f2', title: 'Project SOW Contract', url: 'https://drive.google.com/sample-sow', category: 'Contract' }
        ];
        setFilesList(defaultFiles);
        window.localStorage.setItem(`corvioz_client_files_${selectedClientId}`, JSON.stringify(defaultFiles));
      }
    }
  }, [selectedClientId]);

  // Save client metadata helper
  const handleSaveClientMeta = (updatedMeta) => {
    setClientMeta(updatedMeta);
    window.localStorage.setItem(`corvioz_client_metadata_${selectedClientId}`, JSON.stringify(updatedMeta));
    triggerToast('Client workspace metadata updated successfully.', 'success');
  };

  // Helper date generators
  const getTodayString = () => new Date().toISOString().substring(0, 10);
  const getFutureDateString = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().substring(0, 10);
  };

  useEffect(() => {
    setActivities([]);
  }, [invoices, quotes]);

  const getFriendlyTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const diffMs = Date.now() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffSec < 60) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDay === 1) return 'yesterday';
    return `${diffDay}d ago`;
  };

  // States for follow-up reminders
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('soft'); // soft, firm, urgent
  const [reminderText, setReminderText] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Parse overdue invoices
  const overdueInvoices = invoices.filter(inv => {
    if (inv.status === 'paid' || !inv.due_date) return false;
    const dueDate = new Date(inv.due_date);
    return dueDate < new Date();
  }).map(inv => {
    const daysOverdue = Math.floor((Date.now() - new Date(inv.due_date).getTime()) / (1000 * 3600 * 24));
    return {
      ...inv,
      daysOverdue: daysOverdue > 0 ? daysOverdue : 0
    };
  }).sort((a, b) => b.daysOverdue - a.daysOverdue);

  // Helper to load client metadata health in lists
  const getClientMetadata = (id) => {
    if (typeof window === 'undefined') return { health: 'Healthy', timezone: 'EST (UTC-5)', sla: '< 24 hours' };
    const raw = window.localStorage.getItem(`corvioz_client_metadata_${id}`);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (e) {}
    }
    return { health: 'Healthy', timezone: 'EST (UTC-5)', sla: '< 24 hours' };
  };

  // Parse clients list with LTV and stats
  const clientProfiles = clients.map(cli => {
    const clientInvoices = invoices.filter(inv => inv.client_name === cli.name || inv.client_id === cli.id);
    const clientQuotes = quotes.filter(q => q.client_name === cli.name);

    const paidInvoices = clientInvoices.filter(inv => inv.status === 'paid');
    const ltv = paidInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0) / 100;
    const unpaidAmt = clientInvoices.filter(inv => inv.status !== 'paid').reduce((sum, inv) => sum + (inv.total || 0), 0) / 100;

    // Status check
    let currentStatus = 'No active work';
    const hasOverdue = clientInvoices.some(inv => {
      if (inv.status === 'paid' || !inv.due_date) return false;
      return new Date(inv.due_date) < new Date();
    });
    if (hasOverdue) {
      currentStatus = 'Invoice Overdue';
    } else if (clientInvoices.some(inv => ['pending', 'sent'].includes(inv.status))) {
      currentStatus = 'Active Project';
    } else if (clientQuotes.some(q => q.status === 'sent')) {
      currentStatus = 'Proposal Pending';
    } else if (clientQuotes.some(q => q.status === 'approved')) {
      currentStatus = 'Ready to Bill';
    }

    const meta = getClientMetadata(cli.id);

    return {
      ...cli,
      ltv,
      unpaidAmt,
      quotesCount: clientQuotes.length,
      invoicesCount: clientInvoices.length,
      currentStatus,
      health: meta.health || 'Healthy',
      timezone: meta.timezone || 'EST (UTC-5)',
      sla: meta.sla || '< 24 hours'
    };
  }).sort((a, b) => b.ltv - a.ltv);

  // Workflow Stages calculations
  const pipelineStages = {
    inbound: leads.filter(l => ['new', 'contacted'].includes(l.status)),
    proposal: quotes.filter(q => q.status === 'sent'),
    active: [
      ...quotes.filter(q => q.status === 'approved').map(q => ({ ...q, type: 'quote' })),
      ...invoices.filter(inv => ['pending', 'sent'].includes(inv.status) && !(inv.due_date && new Date(inv.due_date) < new Date())).map(inv => ({ ...inv, type: 'invoice' }))
    ],
    overdue: overdueInvoices,
    completed: invoices.filter(inv => inv.status === 'paid')
  };

  // Reminder templates logic
  useEffect(() => {
    if (!selectedInvoiceId) {
      const firstOverdue = overdueInvoices[0] || invoices[0];
      if (firstOverdue) setSelectedInvoiceId(firstOverdue.id);
      return;
    }

    const inv = invoices.find(i => i.id === selectedInvoiceId);
    if (!inv) return;

    const days = inv.due_date ? Math.floor((Date.now() - new Date(inv.due_date).getTime()) / (1000 * 3600 * 24)) : 0;
    const daysStr = days > 0 ? `${days} days` : 'a few days';
    const amountStr = `${getCurrencySymbol(inv.currency)}${(inv.total / 100).toFixed(2)}`;

    let text = '';
    if (selectedTemplate === 'soft') {
      text = `Hi ${inv.client_name},\n\nHope you're having a great week! Just a friendly head's up that invoice #${inv.invoice_number} (${amountStr}) is now slightly past due. \n\nYou can review details and pay instantly via the client portal link: [Client Portal URL]\n\nLet me know if you have any questions or need alternative payment details. Thanks so much!\n\nBest regards,\n[Your Name]`;
    } else if (selectedTemplate === 'firm') {
      text = `Dear ${inv.client_name},\n\nThis is a follow-up reminder that invoice #${inv.invoice_number} is now ${daysStr} overdue. The outstanding balance is ${amountStr}, originally due on ${inv.due_date}.\n\nPlease arrange for payment as soon as possible. You can submit payment securely here: [Client Portal URL]\n\nIf you have already processed this transaction, please let me know so I can reconcile my ledger.\n\nSincerely,\n[Your Name]`;
    } else if (selectedTemplate === 'urgent') {
      text = `Hello ${inv.client_name},\n\nI am writing to notify you that invoice #${inv.invoice_number} is now significantly overdue (${daysStr}). The total due is ${amountStr}.\n\nThis payment is now critical to avoid project delays or milestone delivery halts. Please complete the transfer immediately via the secure client portal: [Client Portal URL]\n\nPlease reply with payment confirmation once processed.\n\nRegards,\n[Your Name]`;
    }

    setReminderText(text);
  }, [selectedInvoiceId, selectedTemplate, invoices, getCurrencySymbol]);

  const handleCopyReminder = () => {
    navigator.clipboard.writeText(reminderText);
    triggerToast('Reminder template copied to clipboard! Portal link is ready.', 'success');

    trackEvent('client_activity_event', {
      action: 'reminder_copied',
      invoice_id: selectedInvoiceId,
      template: selectedTemplate
    });
  };

  const handleSendReminder = async () => {
    if (!selectedInvoiceId) return;
    setIsSending(true);
    try {
      const response = await fetch('/api/invoices/remind', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: selectedInvoiceId,
          template: selectedTemplate,
          reminderText: reminderText
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to send reminder email');
      }

      triggerToast('📬 Payment reminder email sent successfully to client!', 'success');

      trackEvent('client_activity_event', {
        action: 'reminder_sent',
        invoice_id: selectedInvoiceId,
        template: selectedTemplate,
        source: 'studio_reminders_tab'
      });
    } catch (err) {
      console.error(err);
      triggerToast(err.message || 'Failed to send reminder email', 'error');
    } finally {
      setIsSending(false);
    }
  };

  const outstandingTotal = invoices.filter(inv => inv.status !== 'paid').reduce((sum, inv) => sum + (inv.total || 0), 0) / 100;
  const clientsCount = clients.length;
  const activeClientsCount = clientProfiles.filter(c => c.currentStatus !== 'No active work').length;
  const invoicesPendingCount = invoices.filter(inv => ['pending', 'sent'].includes(inv.status)).length;
  const overdueCount = overdueInvoices.length;

  const totalPaid = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + (inv.total || 0), 0) / 100;
  const totalUnpaid = invoices.filter(inv => ['pending', 'sent'].includes(inv.status) && !(inv.due_date && new Date(inv.due_date) < new Date())).reduce((sum, inv) => sum + (inv.total || 0), 0) / 100;
  const totalOverdue = overdueInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0) / 100;

  const totalInvoiced = totalPaid + totalUnpaid + totalOverdue;
  const paidPercent = totalInvoiced > 0 ? (totalPaid / totalInvoiced) * 100 : 0;
  const unpaidPercent = totalInvoiced > 0 ? (totalUnpaid / totalInvoiced) * 100 : 0;
  const overduePercent = totalInvoiced > 0 ? (totalOverdue / totalInvoiced) * 100 : 0;

  const pipelineValue = leads.reduce((sum, l) => sum + (l.lead_value || 0), 0);

  // Project Health State Aggregation
  const healthCounts = clientProfiles.reduce((acc, c) => {
    acc[c.health] = (acc[c.health] || 0) + 1;
    return acc;
  }, { Healthy: 0, 'At Risk': 0, Critical: 0 });

  // Upcoming Payments listing
  const upcomingPayments = invoices
    .filter(inv => ['pending', 'sent'].includes(inv.status) && inv.due_date)
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
    .slice(0, 4);

  const getDerivedActivities = () => {
    const list = [...activities];

    invoices.forEach(inv => {
      const hasSent = list.some(e => e.event_name === 'invoice_sent' && e.properties?.invoice_number === inv.invoice_number);
      if (!hasSent) {
        list.push({
          event_name: 'invoice_sent',
          created_at: inv.created_at || inv.due_date || new Date().toISOString(),
          properties: {
            invoice_number: inv.invoice_number,
            client_name: inv.client_name,
            total: inv.total
          }
        });
      }
      if (['sent', 'paid', 'overdue'].includes(inv.status)) {
        const hasViewed = list.some(e => e.event_name === 'invoice_viewed' && e.properties?.invoice_number === inv.invoice_number);
        if (!hasViewed) {
          list.push({
            event_name: 'invoice_viewed',
            created_at: inv.updated_at || inv.due_date || new Date().toISOString(),
            properties: {
              invoice_number: inv.invoice_number,
              client_name: inv.client_name,
              total: inv.total
            }
          });
        }
      }
      if (inv.status === 'paid') {
        const hasResponse = list.some(e => e.event_name === 'client_response_received' && e.properties?.invoice_number === inv.invoice_number);
        if (!hasResponse) {
          list.push({
            event_name: 'client_response_received',
            created_at: inv.updated_at || new Date().toISOString(),
            properties: {
              invoice_number: inv.invoice_number,
              client_name: inv.client_name,
              action: 'paid'
            }
          });
        }
      }
    });

    quotes.forEach(q => {
      const hasSent = list.some(e => e.event_name === 'quote_sent' && e.properties?.quote_number === q.quote_number);
      if (!hasSent) {
        list.push({
          event_name: 'quote_sent',
          created_at: q.created_at || new Date().toISOString(),
          properties: {
            quote_number: q.quote_number,
            client_name: q.client_name,
            total: q.total
          }
        });
      }
      if (q.status === 'approved' || q.status === 'rejected') {
        const hasResponse = list.some(e => e.event_name === 'client_response_received' && e.properties?.quote_number === q.quote_number);
        if (!hasResponse) {
          list.push({
            event_name: 'client_response_received',
            created_at: q.updated_at || new Date().toISOString(),
            properties: {
              quote_number: q.quote_number,
              client_name: q.client_name,
              action: q.status === 'approved' ? 'accepted' : 'rejected'
            }
          });
        }
      }
    });

    if (list.length === 0 && clients.length > 0) {
      const firstClient = clients[0].name;
      list.push({
        event_name: 'quote_sent',
        created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
        properties: { quote_number: 'QT-1001', client_name: firstClient, total: 120000 }
      });
      list.push({
        event_name: 'invoice_viewed',
        created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
        properties: { invoice_number: 'INV-1001', client_name: firstClient, total: 150000 }
      });
      list.push({
        event_name: 'client_response_received',
        created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
        properties: { invoice_number: 'INV-1001', client_name: firstClient, action: 'paid' }
      });
    }

    return list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  };

  const getClientLastActivity = (clientName) => {
    const sorted = getDerivedActivities();
    const match = sorted.find(e => e.properties?.client_name === clientName);
    if (!match) return 'Created profile';
    if (match.event_name === 'invoice_sent') return `Sent Invoice #${match.properties.invoice_number}`;
    if (match.event_name === 'invoice_viewed') return `Viewed Invoice #${match.properties.invoice_number}`;
    if (match.event_name === 'quote_sent') return `Sent Quote #${match.properties.quote_number}`;
    if (match.event_name === 'client_response_received') {
      const act = match.properties.action || 'updated';
      return `Response: ${act}`;
    }
    return match.event_name.replace(/_/g, ' ');
  };

  const getClientPressureStatus = (clientName, clientId) => {
    const clientInvoices = invoices.filter(inv => inv.client_name === clientName || inv.client_id === clientId);
    const clientQuotes = quotes.filter(q => q.client_name === clientName);

    const hasOverdue = clientInvoices.some(inv => {
      if (inv.status === 'paid' || !inv.due_date) return false;
      const dueDate = new Date(inv.due_date);
      return dueDate < new Date();
    });
    if (hasOverdue) return { label: 'High Pressure', color: 'var(--danger)', icon: '🔴' };

    const hasPendingQuote24h = clientQuotes.some(q => {
      if (q.status !== 'sent') return false;
      const createdTime = new Date(q.created_at);
      const diffHrs = (Date.now() - createdTime.getTime()) / (1000 * 3600);
      return diffHrs > 24;
    });
    if (hasPendingQuote24h) return { label: 'Medium Pressure', color: 'var(--warning)', icon: '🟡' };

    return { label: 'Low Pressure', color: 'var(--text-soft)', icon: '⚪' };
  };

  const activeInvoicesCount = invoices.filter(inv => inv.status !== 'paid').length;
  const workloadScore = (clientsCount * 1.5) + activeInvoicesCount;
  let workloadLevel = 'Low Load';
  let workloadColor = 'var(--success)';
  let workloadDescription = 'Your current freelance operations are light and easily manageable.';
  if (workloadScore > 7) {
    workloadLevel = 'High Workload';
    workloadColor = 'var(--danger)';
    workloadDescription = 'You are managing heavy client demands. Scaling pressure is high.';
  } else if (workloadScore > 3) {
    workloadLevel = 'Balanced Workload';
    workloadColor = 'var(--warning)';
    workloadDescription = 'Moderate activity. Perfect flow for active freelance operations.';
  }

  // -------------------------------------------------------------
  // CLIENT WORKSPACE PANEL RENDERING
  // -------------------------------------------------------------
  const renderClientWorkspacePanel = (clientId) => {
    const client = clientProfiles.find(c => c.id === clientId);
    if (!client) return null;

    const clientInvoices = invoices.filter(inv => inv.client_name === client.name || inv.client_id === client.id);
    const clientQuotes = quotes.filter(q => q.client_name === client.name);

    return (
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Back and Title Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={() => setSelectedClientId(null)}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.8rem', padding: '6px 12px' }}
            >
              ← Back to Directory
            </button>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
                {client.name} Workspace
              </h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {client.id}</span>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: '6px',
              backgroundColor: client.health === 'Healthy' ? 'rgba(16, 185, 129, 0.15)' : (client.health === 'At Risk' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 108, 108, 0.15)'),
              color: client.health === 'Healthy' ? 'var(--success)' : (client.health === 'At Risk' ? 'var(--warning)' : 'var(--danger)'),
              border: `1px solid ${client.health === 'Healthy' ? 'rgba(16, 185, 129, 0.3)' : (client.health === 'At Risk' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(239, 108, 108, 0.3)')}`,
              textTransform: 'uppercase'
            }}>
              Project Health: {client.health}
            </span>
          </div>
        </div>

        {/* Workspace Tab Nav */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border)', overflowX: 'auto', paddingBottom: '1px' }}>
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'proposal', label: 'Proposals' },
            { id: 'invoice', label: 'Invoices' },
            { id: 'deliverables', label: 'Deliverables Scope' },
            { id: 'notes', label: 'Internal Notes' },
            { id: 'files', label: 'Shared Assets & Files' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveWorkspaceTab(tab.id)}
              style={{
                padding: '10px 16px',
                background: 'transparent',
                border: 'none',
                borderBottom: activeWorkspaceTab === tab.id ? '2px solid var(--accent)' : '2px solid transparent',
                color: activeWorkspaceTab === tab.id ? 'var(--text-main)' : 'var(--text-muted)',
                fontWeight: activeWorkspaceTab === tab.id ? 700 : 500,
                fontSize: '0.82rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Workspace Content rendering */}
        <div style={{ minHeight: '350px' }}>
          {/* TAB 1: OVERVIEW */}
          {activeWorkspaceTab === 'overview' && (
            <div className="dashboard-grid-2fr-1fr animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
              <div className="card" style={{ padding: '24px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '16px' }}>Edit Workspace Settings</h3>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  // Trigger standard client update
                  if (handleSaveClient) {
                    const payload = {
                      id: client.id,
                      name: client.name,
                      email: client.email,
                      address: client.address
                    };
                    // Standard save client call
                    await handleSaveClient(e);
                  }
                }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="input-group">
                      <label className="input-label">Client Name</label>
                      <input type="text" className="form-input" value={client.name} disabled style={{ opacity: 0.7, background: 'var(--bg-surface)' }} />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Email Address</label>
                      <input type="email" className="form-input" value={client.email} disabled style={{ opacity: 0.7, background: 'var(--bg-surface)' }} />
                    </div>
                  </div>

                  <div className="input-group">
                    <label className="input-label">Billing Address</label>
                    <textarea className="form-textarea" value={client.address} disabled rows={2} style={{ opacity: 0.7, background: 'var(--bg-surface)' }} />
                  </div>

                  <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '8px 0' }} />

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="input-group">
                      <label className="input-label">Corporate SLA Response Time</label>
                      <select
                        className="form-select"
                        value={clientMeta.sla}
                        onChange={(e) => handleSaveClientMeta({ ...clientMeta, sla: e.target.value })}
                      >
                        <option value="< 2 hours">&lt; 2 Hours Priority SLA</option>
                        <option value="< 12 hours">&lt; 12 Hours Business SLA</option>
                        <option value="< 24 hours">&lt; 24 Hours Standard SLA</option>
                        <option value="< 48 hours">&lt; 48 Hours Basic SLA</option>
                      </select>
                    </div>

                    <div className="input-group">
                      <label className="input-label">Client Local Timezone</label>
                      <select
                        className="form-select"
                        value={clientMeta.timezone}
                        onChange={(e) => handleSaveClientMeta({ ...clientMeta, timezone: e.target.value })}
                      >
                        <option value="EST (UTC-5)">EST (UTC-5) - US East Coast</option>
                        <option value="CST (UTC-6)">CST (UTC-6) - US Central</option>
                        <option value="PST (UTC-8)">PST (UTC-8) - US West Coast</option>
                        <option value="GMT (UTC+0)">GMT (UTC+0) - Western Europe</option>
                        <option value="SGT (UTC+8)">SGT (UTC+8) - Singapore / Asia</option>
                      </select>
                    </div>
                  </div>

                  <div className="input-group">
                    <label className="input-label">Project Health Indicator</label>
                    <select
                      className="form-select"
                      value={clientMeta.health}
                      onChange={(e) => handleSaveClientMeta({ ...clientMeta, health: e.target.value })}
                      style={{
                        fontWeight: 700,
                        color: clientMeta.health === 'Healthy' ? 'var(--success)' : (clientMeta.health === 'At Risk' ? 'var(--warning)' : 'var(--danger)')
                      }}
                    >
                      <option value="Healthy" style={{ color: 'var(--success)', fontWeight: 700 }}>🟢 Healthy (Deliverables on track)</option>
                      <option value="At Risk" style={{ color: 'var(--warning)', fontWeight: 700 }}>🟡 At Risk (Milestone delays occurring)</option>
                      <option value="Critical" style={{ color: 'var(--danger)', fontWeight: 700 }}>🔴 Critical (Payment issue / Scope halt)</option>
                    </select>
                  </div>
                </form>
              </div>

              {/* Sidebar stats */}
              <div className="card" style={{ padding: '24px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>Business Ledger Summary</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ padding: '14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>LIFETIME VALUE (LTV)</span>
                    <h4 style={{ margin: '4px 0 0 0', fontSize: '1.25rem', fontWeight: 800, color: 'var(--success)' }}>
                      ${client.ltv.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </h4>
                  </div>
                  <div style={{ padding: '14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>OUTSTANDING</span>
                    <h4 style={{ margin: '4px 0 0 0', fontSize: '1.25rem', fontWeight: 800, color: client.unpaidAmt > 0 ? 'var(--warning)' : 'var(--text-muted)' }}>
                      ${client.unpaidAmt.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </h4>
                  </div>
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'grid', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}>
                    <span>Invoices generated:</span>
                    <strong style={{ color: 'var(--text-main)' }}>{clientInvoices.length}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}>
                    <span>Proposals submitted:</span>
                    <strong style={{ color: 'var(--text-main)' }}>{clientQuotes.length}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}>
                    <span>Active SLA standard:</span>
                    <strong style={{ color: 'var(--text-main)' }}>{clientMeta.sla}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Timezone coordinate:</span>
                    <strong style={{ color: 'var(--text-main)' }}>{clientMeta.timezone}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PROPOSALS */}
          {activeWorkspaceTab === 'proposal' && (
            <div className="card animate-fade-in" style={{ padding: '24px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>Client Proposals &amp; Estimates</h3>
                <button
                  onClick={() => {
                    initCreateQuote();
                    setQClientName(client.name);
                    setQClientEmail(client.email || '');
                    setQClientAddress(client.address || '');
                    handleDashboardTabChange('quotes', 'workspace_proposal_creator');
                  }}
                  className="btn btn-primary btn-sm"
                >
                  + Draft Proposal
                </button>
              </div>

              {clientQuotes.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', border: '1px dashed var(--border)', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No proposals submitted for this client. Click the button above to generate a scoped estimate.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', textAlign: 'left' }}>
                        <th style={{ padding: '10px 6px', fontWeight: 600 }}>Quote #</th>
                        <th style={{ padding: '10px 6px', fontWeight: 600 }}>Date Issued</th>
                        <th style={{ padding: '10px 6px', fontWeight: 600 }}>Status</th>
                        <th style={{ padding: '10px 6px', fontWeight: 600, textAlign: 'right' }}>Total Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientQuotes.map(q => (
                        <tr key={q.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '12px 6px', fontWeight: 700, color: 'var(--text-main)' }}>#{q.quote_number}</td>
                          <td style={{ padding: '12px 6px', color: 'var(--text-muted)' }}>{q.created_at ? new Date(q.created_at).toLocaleDateString() : q.date || 'N/A'}</td>
                          <td style={{ padding: '12px 6px' }}>
                            <span style={{
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: '4px',
                              textTransform: 'uppercase',
                              background: q.status === 'approved' ? 'var(--success-glow)' : (q.status === 'sent' ? 'var(--warning-glow)' : 'var(--btn-secondary-bg)'),
                              color: q.status === 'approved' ? 'var(--success)' : (q.status === 'sent' ? 'var(--warning)' : 'var(--text-muted)')
                            }}>
                              {q.status}
                            </span>
                          </td>
                          <td style={{ padding: '12px 6px', fontWeight: 800, color: 'var(--text-main)', textAlign: 'right' }}>
                            {getCurrencySymbol(q.currency)}{(q.total / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: INVOICES */}
          {activeWorkspaceTab === 'invoice' && (
            <div className="card animate-fade-in" style={{ padding: '24px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>Client Invoices &amp; Ledger</h3>
                <button
                  onClick={() => {
                    initCreateInvoice();
                    setInvClientName(client.name);
                    setInvClientEmail(client.email || '');
                    setInvClientAddress(client.address || '');
                    handleDashboardTabChange('invoices', 'workspace_invoice_creator');
                  }}
                  className="btn btn-primary btn-sm"
                >
                  + Create Invoice
                </button>
              </div>

              {clientInvoices.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', border: '1px dashed var(--border)', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No invoices generated for this client workspace. Click the button above to issue a professional receipt.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', textAlign: 'left' }}>
                        <th style={{ padding: '10px 6px', fontWeight: 600 }}>Invoice #</th>
                        <th style={{ padding: '10px 6px', fontWeight: 600 }}>Due Date</th>
                        <th style={{ padding: '10px 6px', fontWeight: 600 }}>Status</th>
                        <th style={{ padding: '10px 6px', fontWeight: 600, textAlign: 'right' }}>Total Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientInvoices.map(inv => {
                        const isOverdue = inv.status !== 'paid' && inv.due_date && new Date(inv.due_date) < new Date();
                        return (
                          <tr key={inv.id} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '12px 6px', fontWeight: 700, color: 'var(--text-main)' }}>#{inv.invoice_number}</td>
                            <td style={{ padding: '12px 6px', color: 'var(--text-muted)' }}>{inv.due_date || 'N/A'}</td>
                            <td style={{ padding: '12px 6px' }}>
                              <span style={{
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                padding: '2px 6px',
                                borderRadius: '4px',
                                textTransform: 'uppercase',
                                background: inv.status === 'paid' ? 'var(--success-glow)' : (isOverdue ? 'var(--danger-glow)' : 'var(--warning-glow)'),
                                color: inv.status === 'paid' ? 'var(--success)' : (isOverdue ? 'var(--danger)' : 'var(--warning)')
                              }}>
                                {inv.status === 'paid' ? 'Paid' : (isOverdue ? 'Overdue' : inv.status)}
                              </span>
                            </td>
                            <td style={{ padding: '12px 6px', fontWeight: 800, color: 'var(--text-main)', textAlign: 'right' }}>
                              {getCurrencySymbol(inv.currency)}{(inv.total / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: DELIVERABLES */}
          {activeWorkspaceTab === 'deliverables' && (
            <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
              <div className="card" style={{ padding: '24px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>Milestones &amp; Deliverables Checklist</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Active Project Status:</span>
                    <select
                      className="form-select"
                      style={{ fontSize: '0.8rem', padding: '4px 10px', width: 'auto' }}
                      value={deliverablesData.status || 'Discovery'}
                      onChange={(e) => {
                        const updated = { ...deliverablesData, status: e.target.value };
                        saveDeliverablesData(updated);
                        triggerToast(`Project status updated to ${e.target.value}.`, 'success');
                      }}
                    >
                      <option value="Discovery">Discovery &amp; Scoping</option>
                      <option value="Design">UI Design &amp; Prototype</option>
                      <option value="Development">Active Code Development</option>
                      <option value="QA / Review">QA / Review &amp; Acceptance</option>
                      <option value="Completed">Project Completed &amp; Handed Off</option>
                    </select>
                  </div>
                </div>

                {/* Milestones Listing */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {deliverablesData.milestones.length === 0 ? (
                    <div style={{ padding: '32px', textAlign: 'center', border: '1px dashed var(--border)', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                      No milestone groups configured. Create your first scope group below to organize task tracking.
                    </div>
                  ) : (
                    deliverablesData.milestones.map((milestone) => (
                      <div key={milestone.id} style={{ padding: '18px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}>
                          <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>📍 {milestone.title}</strong>
                          <button
                            onClick={() => {
                              const updatedMilestones = deliverablesData.milestones.filter(m => m.id !== milestone.id);
                              saveDeliverablesData({ ...deliverablesData, milestones: updatedMilestones });
                              triggerToast('Milestone group deleted.', 'info');
                            }}
                            style={{ color: 'var(--danger)', fontSize: '0.75rem', cursor: 'pointer', background: 'none', border: 'none' }}
                          >
                            Delete Group
                          </button>
                        </div>

                        {/* Deliverables checklist under this milestone */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                          {milestone.deliverables.length === 0 ? (
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-soft)', fontStyle: 'italic' }}>No deliverables listed under this milestone.</span>
                          ) : (
                            milestone.deliverables.map((item) => (
                              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', background: 'var(--bg-card)', borderRadius: '4px', border: '1px solid var(--border)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <input
                                    type="checkbox"
                                    checked={item.completed}
                                    onChange={(e) => {
                                      const updatedMilestones = deliverablesData.milestones.map(m => {
                                        if (m.id === milestone.id) {
                                          return {
                                            ...m,
                                            deliverables: m.deliverables.map(d => d.id === item.id ? { ...d, completed: e.target.checked } : d)
                                          };
                                        }
                                        return m;
                                      });
                                      saveDeliverablesData({ ...deliverablesData, milestones: updatedMilestones });
                                    }}
                                    style={{ cursor: 'pointer' }}
                                  />
                                  <span style={{
                                    fontSize: '0.8rem',
                                    color: item.completed ? 'var(--text-muted)' : 'var(--text-main)',
                                    textDecoration: item.completed ? 'line-through' : 'none'
                                  }}>
                                    {item.title}
                                  </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  {item.dueDate && (
                                    <span style={{ fontSize: '0.72rem', color: 'var(--text-soft)', background: 'var(--btn-secondary-bg)', padding: '2px 6px', borderRadius: '4px' }}>
                                      📅 Due: {item.dueDate}
                                    </span>
                                  )}
                                  <button
                                    onClick={() => {
                                      const updatedMilestones = deliverablesData.milestones.map(m => {
                                        if (m.id === milestone.id) {
                                          return {
                                            ...m,
                                            deliverables: m.deliverables.filter(d => d.id !== item.id)
                                          };
                                        }
                                        return m;
                                      });
                                      saveDeliverablesData({ ...deliverablesData, milestones: updatedMilestones });
                                      triggerToast('Deliverable removed.', 'info');
                                    }}
                                    style={{ background: 'none', border: 'none', color: 'var(--text-soft)', cursor: 'pointer', fontSize: '0.75rem' }}
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Add Deliverable Form */}
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <input
                            type="text"
                            placeholder="Add deliverable name (e.g. Design handoff)"
                            className="form-input"
                            style={{ flex: 1, fontSize: '0.78rem', padding: '6px 10px' }}
                            value={newDeliverableTitle[milestone.id] || ''}
                            onChange={(e) => setNewDeliverableTitle({ ...newDeliverableTitle, [milestone.id]: e.target.value })}
                          />
                          <input
                            type="date"
                            className="form-input"
                            style={{ width: '120px', fontSize: '0.78rem', padding: '6px 10px' }}
                            value={newDeliverableDueDate[milestone.id] || ''}
                            onChange={(e) => setNewDeliverableDueDate({ ...newDeliverableDueDate, [milestone.id]: e.target.value })}
                          />
                          <button
                            onClick={() => {
                              const title = newDeliverableTitle[milestone.id];
                              if (!title || !title.trim()) return;

                              const newD = {
                                id: 'd-' + Date.now(),
                                title: title.trim(),
                                completed: false,
                                dueDate: newDeliverableDueDate[milestone.id] || getTodayString()
                              };

                              const updatedMilestones = deliverablesData.milestones.map(m => {
                                if (m.id === milestone.id) {
                                  return { ...m, deliverables: [...m.deliverables, newD] };
                                }
                                return m;
                              });

                              saveDeliverablesData({ ...deliverablesData, milestones: updatedMilestones });
                              setNewDeliverableTitle({ ...newDeliverableTitle, [milestone.id]: '' });
                              setNewDeliverableDueDate({ ...newDeliverableDueDate, [milestone.id]: '' });
                              triggerToast('Deliverable task registered.', 'success');
                            }}
                            className="btn btn-primary btn-sm"
                            style={{ fontSize: '0.78rem', padding: '6px 12px' }}
                          >
                            + Add Task
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Milestone Form */}
                <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '20px 0' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label className="input-label" style={{ fontSize: '0.8rem' }}>Create Milestone Scope Group</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                      type="text"
                      className="form-input"
                      style={{ fontSize: '0.8rem' }}
                      placeholder="e.g. Phase 2: Frontend Implementation"
                      value={newMilestoneTitle}
                      onChange={(e) => setNewMilestoneTitle(e.target.value)}
                    />
                    <button
                      onClick={() => {
                        if (!newMilestoneTitle || !newMilestoneTitle.trim()) return;
                        const newM = {
                          id: 'm-' + Date.now(),
                          title: newMilestoneTitle.trim(),
                          deliverables: []
                        };
                        saveDeliverablesData({ ...deliverablesData, milestones: [...deliverablesData.milestones, newM] });
                        setNewMilestoneTitle('');
                        triggerToast('Milestone scope group created.', 'success');
                      }}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                    >
                      + Create Group
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: NOTES */}
          {activeWorkspaceTab === 'notes' && (
            <div className="card animate-fade-in" style={{ padding: '24px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>Internal Client Ledger Notes</h3>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-soft)', background: 'var(--btn-secondary-bg)', padding: '2px 8px', borderRadius: '4px' }}>
                  ✓ Changes auto-saved
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 16px 0', lineHeight: 1.45 }}>
                Record client timezone details, business expectations, SLA agreements, or meeting takeaways. Notes are preserved locally in the ledger cache.
              </p>
              <textarea
                className="form-textarea"
                rows={10}
                style={{ fontFamily: 'var(--font-sans)', fontSize: '0.85rem', lineHeight: 1.5, padding: '16px', background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
                value={notesText}
                onChange={(e) => {
                  setNotesText(e.target.value);
                  window.localStorage.setItem(`corvioz_client_notes_${selectedClientId}`, e.target.value);
                }}
                placeholder="Write business notes here..."
              />
            </div>
          )}

          {/* TAB 6: SHARED ASSETS & FILES */}
          {activeWorkspaceTab === 'files' && (
            <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
              {/* Attachments List */}
              <div className="card" style={{ padding: '24px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '16px' }}>Shared Asset Board</h3>
                
                {filesList.length === 0 ? (
                  <div style={{ padding: '32px', textAlign: 'center', border: '1px dashed var(--border)', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    No assets linked for this client workspace. Add shared file links in the right-side form.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {filesList.map((file) => (
                      <div key={file.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '0.65rem', background: 'var(--btn-secondary-bg)', color: 'var(--accent)', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>
                              {file.category}
                            </span>
                            <strong style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>{file.title}</strong>
                          </div>
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontSize: '0.75rem', color: 'var(--accent)', display: 'block', marginTop: '4px', textDecoration: 'none', hover: 'text-decoration: underline' }}
                          >
                            🔗 {file.url.length > 45 ? file.url.substring(0, 45) + '...' : file.url}
                          </a>
                        </div>
                        <button
                          onClick={() => {
                            const updated = filesList.filter(f => f.id !== file.id);
                            saveFilesList(updated);
                            triggerToast('Asset link removed.', 'info');
                          }}
                          style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.75rem' }}
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Attachment form */}
              <div className="card" style={{ padding: '24px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '12px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '16px' }}>Link Work Deliverable URL</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="input-group">
                    <label className="input-label">Asset Title</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Figma Brand Assets Board"
                      value={newFileTitle}
                      onChange={(e) => setNewFileTitle(e.target.value)}
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">Asset URL</label>
                    <input
                      type="url"
                      className="form-input"
                      placeholder="https://figma.com/..."
                      value={newFileUrl}
                      onChange={(e) => setNewFileUrl(e.target.value)}
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">Asset Category</label>
                    <select
                      className="form-select"
                      value={newFileCategory}
                      onChange={(e) => setNewFileCategory(e.target.value)}
                    >
                      <option value="Design">🎨 Design File</option>
                      <option value="Contract">⚖️ SOW / Contract</option>
                      <option value="Repo">💻 Code Repository</option>
                      <option value="Drive">📁 Shared Drive Folder</option>
                      <option value="Other">🔗 Reference URL</option>
                    </select>
                  </div>

                  <button
                    onClick={() => {
                      if (!newFileTitle || !newFileTitle.trim() || !newFileUrl || !newFileUrl.trim()) {
                        triggerToast('Please complete all asset link fields.', 'error');
                        return;
                      }

                      const newF = {
                        id: 'file-' + Date.now(),
                        title: newFileTitle.trim(),
                        url: newFileUrl.trim(),
                        category: newFileCategory
                      };

                      saveFilesList([...filesList, newF]);
                      setNewFileTitle('');
                      setNewFileUrl('');
                      triggerToast('Asset link attached successfully.', 'success');
                    }}
                    className="btn btn-primary"
                    style={{ marginTop: '8px' }}
                  >
                    Attach Asset Link
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', fontFamily: 'Outfit, sans-serif' }}>

      {isStudioPreview && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.15) 0%, rgba(147, 51, 234, 0.15) 100%)',
          border: '1px solid rgba(147, 51, 234, 0.3)',
          borderRadius: '12px',
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '280px' }}>
            <span style={{ fontSize: '1.5rem' }}>✨</span>
            <div>
              <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main, #f9fafb)' }}>
                Studio Command Center Preview Active
              </h4>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted, #9ca3af)', lineHeight: 1.4 }}>
                As your client operations scale past a single relationship, the Studio Space unlocks to provide centralized status tracking, overdue intelligence, and automated reminder sequences.
              </p>
            </div>
          </div>
          <button
            onClick={onUpgrade}
            className="btn btn-primary"
            style={{
              padding: '8px 16px',
              fontSize: '0.8rem',
              fontWeight: 700,
              background: 'linear-gradient(135deg, var(--primary, #4F46E5) 0%, #9333EA 100%)',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              cursor: 'pointer',
              boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.2)'
            }}
          >
            Unlock Studio Plan
          </button>
        </div>
      )}

      {/* Studio Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.7rem', fontWeight: 800, padding: '4px 12px', borderRadius: '99px', background: 'linear-gradient(90deg, var(--accent-glow) 0%, var(--primary-glow) 100%)', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '8px', border: '1px solid var(--border)' }}>
            🏢 Small Business Workspace
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span>Agency Operating System</span>
            {businessModeBadge && (
              <span style={{
                fontSize: '0.7rem',
                fontWeight: 800,
                padding: '4px 12px',
                borderRadius: '99px',
                background: businessModeBadge === 'Business Mode' ? 'linear-gradient(135deg, #9333EA 0%, #4F46E5 100%)' : 'var(--btn-secondary-bg)',
                color: businessModeBadge === 'Business Mode' ? '#fff' : 'var(--text-muted)',
                border: '1px solid var(--border)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                {businessModeBadge}
              </span>
            )}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>Professional command center for tracking active projects, client status boards, overdue accounts, and payment reminders.</p>
        </div>

        {isSandbox && (
          <div style={{ background: 'var(--success-glow)', border: '1px solid var(--success)', borderRadius: '8px', padding: '8px 16px', fontSize: '0.8rem', color: 'var(--success)', fontWeight: 600 }}>
            ⚡ Studio Sandbox Mode Active
          </div>
        )}
      </div>

      {/* Business Health Header */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
        <div className="metric-card" style={{ padding: '20px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Revenue (Total Paid)</span>
          <h3 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '8px 0 0 0', color: 'var(--success)' }}>${totalPaid.toLocaleString(undefined, { maximumFractionDigits: 0 })}</h3>
        </div>
        <div className="metric-card" style={{ padding: '20px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pipeline Value</span>
          <h3 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '8px 0 0 0', color: 'var(--accent)' }}>${pipelineValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</h3>
        </div>
        <div className="metric-card" style={{ padding: '20px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Clients</span>
          <h3 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '8px 0 0 0', color: 'var(--text-main)' }}>{activeClientsCount}</h3>
        </div>
        <div className="metric-card" style={{ padding: '20px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Project Health Summary</span>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '8px 0 0 0', color: 'var(--text-main)', lineHeight: '1.3' }}>
            Healthy: <span style={{ color: 'var(--success)' }}>{healthCounts.Healthy}</span><br />
            Issues: <span style={{ color: 'var(--warning)' }}>{(healthCounts['At Risk'] || 0) + (healthCounts.Critical || 0)}</span>
          </h3>
        </div>
      </div>

      {/* Sub Tabs Navigation */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', gap: '8px', overflowX: 'auto', paddingBottom: '1px' }}>
        {[
          { id: 'dashboard', label: 'Studio Command Center' },
          { id: 'pipeline', label: 'Client Status Board' },
          { id: 'directory', label: 'Client Tracking Directory' },
          { id: 'overdue', label: 'Overdue Tracker' },
          { id: 'reminders', label: 'Follow-up Reminders' },
          { id: 'brand-system', label: 'Brand System' }
        ].map(sub => (
          <button
            key={sub.id}
            onClick={() => setActiveSubTab(sub.id)}
            style={{
              padding: '12px 18px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeSubTab === sub.id ? '2px solid var(--accent)' : '2px solid transparent',
              color: activeSubTab === sub.id ? 'var(--text-main)' : 'var(--text-muted)',
              fontWeight: activeSubTab === sub.id ? 700 : 500,
              fontSize: '0.85rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s'
            }}
          >
            {sub.label}
          </button>
        ))}
      </div>

      {/* Sub Tab Panel Rendering */}
      <div style={{ minHeight: '400px' }}>

        {/* PANEL 0: STUDIO COMMAND CENTER */}
        {activeSubTab === 'dashboard' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Split layout: KPI List & Cash Flow progress */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
              
              {/* Left Column: Upcoming Payments & Project Health list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* Upcoming Payments Calendar */}
                <div className="card" style={{ padding: '20px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>Upcoming Payments Ledger</h3>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Collections Calendar</span>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {upcomingPayments.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        No pending collections scheduled.
                      </div>
                    ) : (
                      upcomingPayments.map(inv => (
                        <div key={inv.id} style={{ padding: '10px 14px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <strong style={{ fontSize: '0.82rem', color: 'var(--text-main)' }}>{inv.client_name}</strong>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                              INV #{inv.invoice_number} • Due: {inv.due_date}
                            </div>
                          </div>
                          <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-main)' }}>
                            {getCurrencySymbol(inv.currency)}{(inv.total / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Project Health Index */}
                <div className="card" style={{ padding: '20px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>Active Client Roster Health</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {clientProfiles.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '20px 10px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>No clients loaded.</div>
                    ) : (
                      clientProfiles.map(cli => (
                        <div key={cli.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '6px' }}>
                          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>{cli.name}</span>
                          <span style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            backgroundColor: cli.health === 'Healthy' ? 'rgba(16, 185, 129, 0.1)' : (cli.health === 'At Risk' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)'),
                            color: cli.health === 'Healthy' ? 'var(--success)' : (cli.health === 'At Risk' ? 'var(--warning)' : 'var(--danger)')
                          }}>
                            {cli.health}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

              {/* Right Column: Workload & Client Pressure & Timeline */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Cash Flow Panel */}
                <div className="card" style={{ padding: '20px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>Cash Flow Overview</h3>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Total: <strong>${(totalPaid + totalUnpaid + totalOverdue).toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong>
                    </span>
                  </div>

                  <div style={{ height: '20px', display: 'flex', borderRadius: '10px', overflow: 'hidden', background: 'var(--border)', marginBottom: '16px' }}>
                    {totalPaid > 0 && <div style={{ width: `${paidPercent}%`, backgroundColor: 'var(--success, #10B981)' }} />}
                    {totalUnpaid > 0 && <div style={{ width: `${unpaidPercent}%`, backgroundColor: 'var(--warning, #F59E0B)' }} />}
                    {totalOverdue > 0 && <div style={{ width: `${overduePercent}%`, backgroundColor: 'var(--danger, #EF4444)' }} />}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', fontSize: '0.78rem' }}>
                    <div>
                      <div style={{ color: 'var(--text-muted)' }}>Paid</div>
                      <strong style={{ color: 'var(--success)' }}>${totalPaid.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-muted)' }}>Unpaid</div>
                      <strong style={{ color: 'var(--warning)' }}>${totalUnpaid.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-muted)' }}>Overdue</div>
                      <strong style={{ color: 'var(--danger)' }}>${totalOverdue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong>
                    </div>
                  </div>
                </div>

                {/* Client Pressure Dashboard */}
                <div className="card" style={{ padding: '20px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>Client Pressure Dashboard</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '250px', overflowY: 'auto' }}>
                    {clientProfiles.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '20px 10px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        No active client profiles found.
                      </div>
                    ) : (
                      clientProfiles.map(cli => {
                        const pressure = getClientPressureStatus(cli.name, cli.id);
                        return (
                          <div key={cli.id} style={{ padding: '10px 14px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <strong style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>{cli.name}</strong>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                Activity: {getClientLastActivity(cli.name)}
                              </div>
                            </div>
                            <span style={{
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              padding: '3px 8px',
                              borderRadius: '4px',
                              backgroundColor: `${pressure.color}15`,
                              color: pressure.color,
                              border: `1px solid ${pressure.color}33`,
                              textTransform: 'uppercase'
                            }}>
                              {pressure.label}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* PANEL 1: CLIENT STATUS BOARD */}
        {activeSubTab === 'pipeline' && (
          <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', alignItems: 'start' }}>
            
            {/* Column 1: Inbound Lead */}
            <div style={{ background: 'var(--bg-surface)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid var(--border)', paddingBottom: '8px' }}>
                <span style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Inbound Leads</span>
                <span style={{ background: 'var(--primary-glow)', color: 'var(--primary)', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>{pipelineStages.inbound.length}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {pipelineStages.inbound.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px 10px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>No new inquiries.</div>
                ) : (
                  pipelineStages.inbound.map(lead => (
                    <div key={lead.id} style={{ padding: '12px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <strong style={{ fontSize: '0.8rem', color: 'var(--text-main)' }}>{lead.client_name || lead.name}</strong>
                      <span style={{ fontSize: '0.7rem', color: 'var(--accent)' }}>{lead.client_email || lead.email}</span>
                      {lead.lead_value > 0 && <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--success)' }}>${lead.lead_value}</span>}
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.7rem', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.3 }}>
                        {lead.message}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Column 2: Proposal Pending */}
            <div style={{ background: 'var(--bg-surface)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid var(--border)', paddingBottom: '8px' }}>
                <span style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Proposals Sent</span>
                <span style={{ background: 'var(--warning-glow)', color: 'var(--warning)', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>{pipelineStages.proposal.length}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {pipelineStages.proposal.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px 10px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>No pending quotes.</div>
                ) : (
                  pipelineStages.proposal.map(q => (
                    <div key={q.id} style={{ padding: '12px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <strong style={{ fontSize: '0.8rem', color: 'var(--text-main)' }}>{q.client_name}</strong>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)' }}>Quote #{q.quote_number}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>Total: {getCurrencySymbol(q.currency)}{(q.total / 100).toFixed(2)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Column 3: Active Project */}
            <div style={{ background: 'var(--bg-surface)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid var(--border)', paddingBottom: '8px' }}>
                <span style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active Work</span>
                <span style={{ background: 'var(--primary-glow)', color: 'var(--primary)', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>{pipelineStages.active.length}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {pipelineStages.active.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px 10px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>No active contracts.</div>
                ) : (
                  pipelineStages.active.map((item, idx) => (
                    <div key={idx} style={{ padding: '12px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <strong style={{ fontSize: '0.8rem', color: 'var(--text-main)' }}>{item.client_name}</strong>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {item.type === 'quote' ? `Approved Quote #${item.quote_number}` : `Pending Invoice #${item.invoice_number}`}
                      </span>
                      <span style={{ fontSize: '0.7rem', fontWeight: 650, color: 'var(--text-main)', marginTop: '2px' }}>
                        {getCurrencySymbol(item.currency)}{(item.total / 100).toFixed(2)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Column 4: Invoice Overdue */}
            <div style={{ background: 'var(--bg-surface)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid var(--border)', paddingBottom: '8px' }}>
                <span style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--danger)', textTransform: 'uppercase' }}>Overdue Accounts</span>
                <span style={{ background: 'var(--danger-glow)', color: 'var(--danger)', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>{pipelineStages.overdue.length}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {pipelineStages.overdue.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px 10px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>No overdue balances.</div>
                ) : (
                  pipelineStages.overdue.map(inv => (
                    <div key={inv.id} style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.04)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <strong style={{ fontSize: '0.8rem', color: 'var(--text-main)' }}>{inv.client_name}</strong>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--danger)' }}>INV #{inv.invoice_number}</span>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', marginTop: '2px', color: 'var(--text-muted)' }}>
                        <span>Overdue: {inv.daysOverdue} days</span>
                        <strong style={{ color: 'var(--text-main)' }}>{getCurrencySymbol(inv.currency)}{(inv.total / 100).toFixed(2)}</strong>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Column 5: Paid & Completed */}
            <div style={{ background: 'var(--bg-surface)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid var(--border)', paddingBottom: '8px' }}>
                <span style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--success)', textTransform: 'uppercase' }}>Paid &amp; Settled</span>
                <span style={{ background: 'var(--success-glow)', color: 'var(--success)', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>{pipelineStages.completed.length}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {pipelineStages.completed.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px 10px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>No payments processed yet.</div>
                ) : (
                  pipelineStages.completed.slice(0, 4).map(inv => (
                    <div key={inv.id} style={{ padding: '12px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <strong style={{ fontSize: '0.8rem', color: 'var(--text-main)' }}>{inv.client_name}</strong>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Invoice #{inv.invoice_number}</span>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--success)', fontWeight: 700, marginTop: '2px' }}>
                        <span>Paid ✓</span>
                        <span>{getCurrencySymbol(inv.currency)}{(inv.total / 100).toFixed(2)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}

        {/* PANEL 2: CLIENT TRACKING DIRECTORY & WORKSPACES */}
        {activeSubTab === 'directory' && (
          selectedClientId ? (
            renderClientWorkspacePanel(selectedClientId)
          ) : (
            <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '24px', alignItems: 'start' }}>
              {/* Directory List Card */}
              <div className="card" style={{ padding: '20px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: '0 0 16px 0', color: 'var(--text-main)' }}>Agency Roster &amp; Client Workspaces</h3>
                
                {clientProfiles.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', border: '1px dashed var(--border)', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    No corporate workspaces configured. Register a client using the form on the right to initialize their secure dashboard portal.
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', textAlign: 'left' }}>
                          <th style={{ padding: '12px 8px', fontWeight: 600 }}>Client Name</th>
                          <th style={{ padding: '12px 8px', fontWeight: 600 }}>Health</th>
                          <th style={{ padding: '12px 8px', fontWeight: 600 }}>Outstanding</th>
                          <th style={{ padding: '12px 8px', fontWeight: 600 }}>LTV</th>
                          <th style={{ padding: '12px 8px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {clientProfiles.map(cli => (
                          <tr key={cli.id} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '14px 8px' }}>
                              <div>
                                <strong style={{ color: 'var(--text-main)', display: 'block' }}>{cli.name}</strong>
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{cli.email}</span>
                              </div>
                            </td>
                            <td style={{ padding: '14px 8px' }}>
                              <span style={{
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                padding: '2px 6px',
                                borderRadius: '4px',
                                textTransform: 'uppercase',
                                backgroundColor: cli.health === 'Healthy' ? 'rgba(16, 185, 129, 0.15)' : (cli.health === 'At Risk' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)'),
                                color: cli.health === 'Healthy' ? 'var(--success)' : (cli.health === 'At Risk' ? 'var(--warning)' : 'var(--danger)')
                              }}>
                                {cli.health}
                              </span>
                            </td>
                            <td style={{ padding: '14px 8px', fontWeight: 600, color: cli.unpaidAmt > 0 ? 'var(--warning)' : 'var(--text-muted)' }}>
                              ${cli.unpaidAmt.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td style={{ padding: '14px 8px', fontWeight: 800, color: 'var(--success)' }}>
                              ${cli.ltv.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td style={{ padding: '14px 8px', textAlign: 'right' }}>
                              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                <button
                                  onClick={() => setSelectedClientId(cli.id)}
                                  className="btn btn-secondary btn-sm"
                                  style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                                >
                                  Open Workspace
                                </button>
                                <button
                                  onClick={() => handleDeleteClient(cli.id)}
                                  style={{ color: 'var(--danger)', fontSize: '0.75rem', background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px' }}
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Add Client Workspace Profile */}
              <div className="card" style={{ padding: '24px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '16px' }}>Register Client Workspace</h3>
                {formError && (
                  <div style={{ padding: '12px 16px', background: 'var(--danger-glow)', border: '1px solid var(--danger-border)', borderRadius: '6px', color: 'var(--danger-text)', marginBottom: '16px', fontSize: '0.85rem', fontWeight: 600 }}>
                    ⚠️ {formError}
                  </div>
                )}
                {formSuccess && (
                  <div style={{ padding: '12px 16px', background: 'var(--success-glow)', border: '1px solid var(--success-border)', borderRadius: '6px', color: 'var(--success-text)', marginBottom: '16px', fontSize: '0.85rem', fontWeight: 600 }}>
                    ✓ {formSuccess}
                  </div>
                )}
                
                <form onSubmit={handleSaveClient} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="input-group">
                    <label className="input-label">Corporate Client Name</label>
                    <input type="text" className="form-input" value={newClientName} onChange={e => setNewClientName(e.target.value)} required placeholder="e.g. Wayne Enterprises" />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Primary Billing Email</label>
                    <input type="email" className="form-input" value={newClientEmail} onChange={e => setNewClientEmail(e.target.value)} placeholder="e.g. Bruce@wayne.com" />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Corporate Address</label>
                    <textarea className="form-textarea" value={newClientAddress} onChange={e => setNewClientAddress(e.target.value)} placeholder="Corporate physical mailing address..." rows={2} />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }}>Register Client</button>
                </form>
              </div>
            </div>
          )
        )}

        {/* PANEL 3: OVERDUE INVOICE TRACKER */}
        {activeSubTab === 'overdue' && (
          <div className="animate-fade-in style-grid" style={{ display: 'grid', gap: '16px' }}>
            {overdueInvoices.length === 0 ? (
              <div style={{ padding: '48px', textAlign: 'center', border: '1px dashed var(--border)', borderRadius: '12px', background: 'var(--bg-card)' }}>
                <span style={{ fontSize: '2rem', display: 'block', marginBottom: '12px' }}>🎉</span>
                <h4 style={{ margin: 0, fontWeight: 700, color: 'var(--text-main)' }}>Outstanding Balances Reconciled!</h4>
                <p style={{ margin: '6px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>You have zero overdue client invoices. Excellent work keeping collections active.</p>
              </div>
            ) : (
              overdueInvoices.map(inv => (
                <div key={inv.id} style={{
                  padding: '20px',
                  background: 'var(--bg-card)',
                  border: '1.5px solid rgba(239, 68, 68, 0.2)',
                  borderRadius: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '16px',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', background: 'var(--danger-glow)', color: 'var(--danger)', fontWeight: 800, textTransform: 'uppercase' }}>
                        {inv.daysOverdue} Days Overdue
                      </span>
                      <strong style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>Invoice #{inv.invoice_number}</strong>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'auto auto', gap: '8px 16px', marginTop: '12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <span>Client: <strong style={{ color: 'var(--text-soft)' }}>{inv.client_name}</strong></span>
                      <span>Email: <span style={{ color: 'var(--accent)' }}>{inv.client_email}</span></span>
                      <span>Due Date: <strong style={{ color: 'var(--text-soft)' }}>{inv.due_date}</strong></span>
                      <span>Terms: <strong style={{ color: 'var(--text-soft)' }}>{inv.payment_terms}</strong></span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
                    <span style={{ fontSize: '1.25rem', fontWeight: 850, color: 'var(--danger)' }}>
                      {getCurrencySymbol(inv.currency)}{(inv.total / 100).toFixed(2)}
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => onCopyPortalLink(inv.id, 'invoice')}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                      >
                        🔗 Copy Portal Link
                      </button>
                      <button
                        onClick={() => {
                          setSelectedInvoiceId(inv.id);
                          setActiveSubTab('reminders');
                        }}
                        className="btn btn-primary btn-sm"
                        style={{ padding: '6px 12px', fontSize: '0.78rem', background: 'var(--danger)', borderColor: 'var(--danger)', color: '#fff' }}
                      >
                        🔔 Write Reminder
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* PANEL 4: FOLLOW-UP REMINDERS */}
        {activeSubTab === 'reminders' && (
          <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
            
            {/* Left Side: Template Editor */}
            <div className="card" style={{ padding: '24px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800 }}>Payment Reminder Template Composer</h4>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-soft)' }}>Manual Reminder Dispatcher</span>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="input-label">Select Overdue Invoice</label>
                  <select
                    className="form-input"
                    value={selectedInvoiceId}
                    onChange={(e) => setSelectedInvoiceId(e.target.value)}
                    style={{ background: 'var(--bg-surface)', color: 'var(--text-main)', border: '1px solid var(--border)' }}
                  >
                    {invoices.length === 0 ? (
                      <option value="">No invoices found</option>
                    ) : (
                      invoices.map(inv => (
                        <option key={inv.id} value={inv.id}>
                          #{inv.invoice_number} - {inv.client_name} (${(inv.total / 100).toFixed(2)})
                        </option>
                      ))
                    )}
                  </select>
                </div>
                <div>
                  <label className="input-label">Select Nudge Tone</label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {[
                      { id: 'soft', label: '😊 Soft' },
                      { id: 'firm', label: '⚖️ Firm' },
                      { id: 'urgent', label: '🚨 Urgent' }
                    ].map(tone => (
                      <button
                        key={tone.id}
                        onClick={() => setSelectedTemplate(tone.id)}
                        className={`btn ${selectedTemplate === tone.id ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                        style={{ flex: 1, padding: '8px 4px', fontSize: '0.75rem' }}
                      >
                        {tone.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="input-label">Email / Nudge Text Content</label>
                <textarea
                  className="form-input"
                  value={reminderText}
                  onChange={(e) => setReminderText(e.target.value)}
                  rows={10}
                  style={{ fontFamily: 'monospace', fontSize: '0.78rem', lineHeight: 1.5, background: 'var(--bg-surface)', color: 'var(--text-soft)', border: '1px solid var(--border)' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={handleCopyReminder}
                  disabled={!selectedInvoiceId}
                  className="btn btn-primary"
                  style={{ fontWeight: 700 }}
                >
                  📋 Copy Nudge &amp; Portal Link
                </button>
                <button
                  onClick={handleSendReminder}
                  disabled={!selectedInvoiceId || isSending}
                  className="btn btn-secondary"
                  style={{ fontWeight: 700, borderColor: 'var(--accent)', color: 'var(--accent)' }}
                >
                  {isSending ? 'Sending Reminder...' : '📬 Send Reminder Email'}
                </button>
              </div>
            </div>

            {/* Right Side: Features Guide / Value Prop */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="card" style={{ padding: '20px', background: 'rgba(99, 102, 241, 0.04)', border: '1px solid rgba(99, 102, 241, 0.2)', borderRadius: '12px' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>📬</span> Studio Communications Control
                </h4>
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  You are operating as a professional service business. Studio empowers you to send direct, payment-linked emails to clients and track outstanding workflows.
                </p>
                <ul style={{ margin: '10px 0 0 0', paddingLeft: '16px', fontSize: '0.78rem', color: 'var(--text-muted)', display: 'grid', gap: '6px' }}>
                  <li><strong>Real-time Dispatches:</strong> Trigger payment reminder emails with customized copy and portal links.</li>
                  <li><strong>Live Portal Tracking:</strong> Know exactly when clients view, comment, or approve your documents.</li>
                  <li><strong>Aggregated Ledger:</strong> Track total outstanding billing and overdue days in real-time.</li>
                </ul>
              </div>
            </div>

          </div>
        )}

        {/* PANEL 5: BRAND SYSTEM */}
        {activeSubTab === 'brand-system' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Brand Inner Tabs */}
            <div style={{ display: 'flex', gap: '6px', borderBottom: '1px solid var(--border)', paddingBottom: '1px' }}>
              {[
                { id: 'assets', label: '🎨 Brand Assets' },
                { id: 'templates', label: '📄 Document Templates' },
                { id: 'case-studies', label: '📈 Case Studies Library' }
              ].map(inner => (
                <button
                  key={inner.id}
                  onClick={() => setBrandActiveSubTab(inner.id)}
                  style={{
                    padding: '8px 14px',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: brandActiveSubTab === inner.id ? '2px solid var(--accent)' : '2px solid transparent',
                    color: brandActiveSubTab === inner.id ? 'var(--text-main)' : 'var(--text-muted)',
                    fontWeight: brandActiveSubTab === inner.id ? 700 : 500,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {inner.label}
                </button>
              ))}
            </div>

            {/* Brand Tab Content */}
            <div style={{ minHeight: '350px' }}>
              {/* BRAND ASSETS FORM */}
              {brandActiveSubTab === 'assets' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', alignItems: 'start' }}>
                  <div className="card" style={{ padding: '24px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>Configure Brand Assets</h3>
                    
                    <div className="input-group">
                      <label className="input-label">Agency Logo URL</label>
                      <input 
                        type="url" 
                        className="form-input" 
                        placeholder="https://..." 
                        value={cpLogoUrl} 
                        onChange={e => setCpLogoUrl(e.target.value)} 
                      />
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-soft)', marginTop: '4px' }}>Renders on public landing header and in invoice PDFs.</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div className="input-group">
                        <label className="input-label">Primary Color</label>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <input type="color" value={cpBrandColor || '#4f46e5'} onChange={e => setCpBrandColor(e.target.value)} style={{ width: '40px', height: '40px', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', padding: 0, background: 'none' }} />
                          <input type="text" className="form-input" value={cpBrandColor} onChange={e => setCpBrandColor(e.target.value)} style={{ flex: 1, fontFamily: 'monospace' }} />
                        </div>
                      </div>
                      <div className="input-group">
                        <label className="input-label">Secondary Color</label>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <input type="color" value={cpBrandSecondary || '#06b6d4'} onChange={e => setCpBrandSecondary(e.target.value)} style={{ width: '40px', height: '40px', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', padding: 0, background: 'none' }} />
                          <input type="text" className="form-input" value={cpBrandSecondary} onChange={e => setCpBrandSecondary(e.target.value)} style={{ flex: 1, fontFamily: 'monospace' }} />
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div className="input-group">
                        <label className="input-label">Typography Font</label>
                        <select className="form-select" value={cpFontFamily} onChange={e => setCpFontFamily(e.target.value)}>
                          <option value="Inter">Inter (Sans-Serif)</option>
                          <option value="Outfit">Outfit (Agency Clean)</option>
                          <option value="Playfair Display">Playfair Display (Premium Editorial)</option>
                        </select>
                      </div>
                      <div className="input-group">
                        <label className="input-label">Theme Preference</label>
                        <select className="form-select" value={cpThemePreference} onChange={e => setCpThemePreference(e.target.value)}>
                          <option value="dark">Sleek Dark Mode</option>
                          <option value="light">Crisp Light Mode</option>
                          <option value="glass">Glassmorphism Aesthetic</option>
                        </select>
                      </div>
                    </div>

                    <button
                      onClick={async () => {
                        if (handleSaveCardProfile) {
                          await handleSaveCardProfile();
                          triggerToast('Agency brand kit updated successfully.', 'success');
                        }
                      }}
                      disabled={isSaving}
                      className="btn btn-primary"
                      style={{ width: '100%', fontWeight: 700, padding: '12px', marginTop: '12px' }}
                    >
                      {isSaving ? 'Saving Assets...' : 'Apply Brand Settings'}
                    </button>
                  </div>

                  {/* Brand Preview panel */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'sticky', top: '24px' }}>
                    <div className="card" style={{
                      padding: '32px',
                      background: cpThemePreference === 'light' ? '#ffffff' : (cpThemePreference === 'glass' ? 'rgba(30, 41, 59, 0.4)' : '#0f172a'),
                      color: cpThemePreference === 'light' ? '#1e293b' : '#f8fafc',
                      border: '1px solid var(--border)',
                      borderRadius: '16px',
                      fontFamily: cpFontFamily === 'Outfit' ? '"Outfit", sans-serif' : (cpFontFamily === 'Playfair Display' ? '"Playfair Display", serif' : 'var(--font-sans)'),
                      backdropFilter: cpThemePreference === 'glass' ? 'blur(16px)' : 'none',
                      boxShadow: 'var(--shadow-lg)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '20px' }}>
                        <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.8, fontWeight: 700 }}>White-Label Web Preview</span>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: cpBrandColor || '#4f46e5' }}></span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                        {cpLogoUrl ? (
                          <img src={cpLogoUrl} alt="Logo" style={{ height: '40px', objectFit: 'contain' }} />
                        ) : (
                          <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: `linear-gradient(135deg, ${cpBrandColor || '#4f46e5'}, ${cpBrandSecondary || '#06b6d4'})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800 }}>A</div>
                        )}
                        <div>
                          <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>{cpName || 'Alpha Agency'}</h4>
                          <span style={{ fontSize: '0.72rem', color: cpThemePreference === 'light' ? '#64748b' : '#94a3b8' }}>{cpTitle || 'Studio Workspace'}</span>
                        </div>
                      </div>

                      <p style={{ fontSize: '0.85rem', lineHeight: '1.5', margin: '0 0 24px 0', opacity: 0.9 }}>
                        This live preview displays how your public landing page, milestone portals, and itemized client receipts will adapt to your agency brand colors, logo, and selected typography.
                      </p>

                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button style={{
                          flex: 1,
                          padding: '10px',
                          borderRadius: '8px',
                          border: 'none',
                          background: cpBrandColor || '#4f46e5',
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: '0.8rem'
                        }}>
                          Primary Button
                        </button>
                        <button style={{
                          flex: 1,
                          padding: '10px',
                          borderRadius: '8px',
                          border: `1px solid ${cpBrandColor || 'var(--border)'}`,
                          background: 'transparent',
                          color: cpThemePreference === 'light' ? cpBrandColor : '#fff',
                          fontWeight: 600,
                          fontSize: '0.8rem'
                        }}>
                          Outline CTA
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* DOCUMENT TEMPLATES */}
              {brandActiveSubTab === 'templates' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                  {/* MSA Card */}
                  <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                    <span style={{ fontSize: '1.5rem' }}>📄</span>
                    <h4 style={{ margin: 0, fontWeight: 800 }}>Master Services Agreement (MSA)</h4>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                      Standard boilerplate legal document defining project guidelines, payments liability, and intellectual property ownership boundaries.
                    </p>
                    <button
                      onClick={() => {
                        const msaText = `MASTER SERVICES AGREEMENT\n\nThis Master Services Agreement ("Agreement") is entered into by and between the Service Provider ("Agency") and the Client.\n\n1. SERVICES & WORK ORDERS\nAgency shall perform services described in individual Statements of Work (SOW) executed by both parties.\n\n2. PAYMENT TERMS\nPayments are due within thirty (30) days of invoice date. Late payments shall accrue interest at a rate of 1.5% per month.\n\n3. INTELLECTUAL PROPERTY\nUpon full payment of all outstanding invoices, all deliverables created specifically for Client shall be owned by Client.`;
                        navigator.clipboard.writeText(msaText);
                        triggerToast('MSA contract boilerplate copied to clipboard.', 'success');
                      }}
                      className="btn btn-secondary btn-sm"
                      style={{ marginTop: 'auto' }}
                    >
                      📋 Copy Template Text
                    </button>
                  </div>

                  {/* SOW Card */}
                  <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                    <span style={{ fontSize: '1.5rem' }}>📝</span>
                    <h4 style={{ margin: 0, fontWeight: 800 }}>Statement of Work (SOW)</h4>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                      Standard milestone scoping template outlining milestones, deliverables checklist, acceptances rules, and project-specific payment triggers.
                    </p>
                    <button
                      onClick={() => {
                        const sowText = `STATEMENT OF WORK (SOW)\n\nThis Statement of Work ("SOW") is subject to the terms of the Master Services Agreement.\n\n1. PROJECT SCOPE & OBJECTIVES\nDefine the specific business goals, features, and limits of the project.\n\n2. MILESTONES & DELIVERABLES\n- Milestone 1: Discovery & Strategy (Due: [Date], Fee: [Amount])\n- Milestone 2: UI Design & Prototyping (Due: [Date], Fee: [Amount])\n- Milestone 3: Core Implementation & QA (Due: [Date], Fee: [Amount])`;
                        navigator.clipboard.writeText(sowText);
                        triggerToast('SOW scope boilerplate copied to clipboard.', 'success');
                      }}
                      className="btn btn-secondary btn-sm"
                      style={{ marginTop: 'auto' }}
                    >
                      📋 Copy Template Text
                    </button>
                  </div>

                  {/* Payment reminder Sequence card */}
                  <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                    <span style={{ fontSize: '1.5rem' }}>📧</span>
                    <h4 style={{ margin: 0, fontWeight: 800 }}>Payment Reminder Sequences</h4>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                      Pre-written sequences for client billing communications. Tones range from friendly head's up, to formal notices, to critical payment collections.
                    </p>
                    <button
                      onClick={() => {
                        const reminderSequence = `1. FRIENDLY NUDGE (SOFT)\n"Hi [Client Name], Just a friendly head's up that invoice [Invoice #] is now slightly past due. You can review details and pay instantly via the client portal link: [Portal URL]"\n\n2. LEDGER NOTICE (FIRM)\n"Dear [Client Name], This is a follow-up reminder that invoice [Invoice #] is now past due. Outstanding balance is [Amount], originally due on [Date]. Please arrange for payment."`;
                        navigator.clipboard.writeText(reminderSequence);
                        triggerToast('Reminder email sequence copy text copied to clipboard.', 'success');
                      }}
                      className="btn btn-secondary btn-sm"
                      style={{ marginTop: 'auto' }}
                    >
                      📋 Copy Tone Sequence
                    </button>
                  </div>
                </div>
              )}

              {/* CASE STUDIES LIBRARY */}
              {brandActiveSubTab === 'case-studies' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ margin: 0, fontWeight: 800 }}>Agency Case Studies &amp; Outcomes</h4>
                    <button
                      onClick={() => handleDashboardTabChange('portfolio', 'brand_system_case_study')}
                      className="btn btn-primary btn-sm"
                    >
                      Configure Showcases
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                    {cpPortfolio.length === 0 ? (
                      <div style={{ gridColumn: '1 / -1', padding: '48px', textAlign: 'center', border: '1px dashed var(--border)', borderRadius: '12px', background: 'var(--bg-card)', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                        No case studies in library. Add featured work to showcase outcomes on the Portfolio tab.
                      </div>
                    ) : (
                      cpPortfolio.map((item, idx) => (
                        <div key={idx} className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase' }}>{item.category || 'General'}</span>
                          <h4 style={{ margin: 0, fontWeight: 800 }}>{item.title}</h4>
                          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{item.description}</p>
                          {item.results && (
                            <div style={{ padding: '8px 12px', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '6px', color: 'var(--success)', fontWeight: 700, fontSize: '0.8rem', marginTop: '6px' }}>
                              📈 Outcome: {item.results}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

      </div>

      <style>{`
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

    </div>
  );
}
