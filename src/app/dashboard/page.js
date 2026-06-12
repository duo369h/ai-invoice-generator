'use client';

import React, { useState, useEffect, useCallback, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { generatePDF } from '../lib/pdf';
import { createBrowserSupabaseClient } from '../lib/supabase';

// Client-only mount detection without SSR mismatch
const emptySubscribe = () => () => {};
function useIsMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

export default function Dashboard() {
  const [docType, setDocType] = useState('invoice');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  
  // Business details
  const [businessName, setBusinessName] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [logoPreview, setLogoPreview] = useState(null);
  
  // Document metadata
  const [invoiceNumber, setInvoiceNumber] = useState('');
  
  const getTodayString = () => new Date().toISOString().substring(0, 10);
  const getFutureDateString = (days) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().substring(0, 10);
  };

  const [invoiceDate, setInvoiceDate] = useState(getTodayString());
  const [dueDate, setDueDate] = useState(getFutureDateString(30));
  const [paymentTerms, setPaymentTerms] = useState('Net 30');
  
  // Financial parameters
  const [currency, setCurrency] = useState('USD');
  const [items, setItems] = useState([{ description: '', quantity: 1, unitPrice: 0 }]);
  const [taxRate, setTaxRate] = useState(0);
  const [discountRate, setDiscountRate] = useState(0);
  const [notes, setNotes] = useState('');

  // UI state
  const [aiPrompt, setAiPrompt] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [showBusinessDetails, setShowBusinessDetails] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);
  const [session, setSession] = useState(null);
  const [supabaseClient, setSupabaseClient] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const authConfigured = Boolean(supabaseClient);
  
  const mounted = useIsMounted();
  
  // User profile state
  const [user, setUser] = useState({
    id: '',
    email: '',
    name: 'Loading...',
    plan: 'free',
    quota: null
  });

  // Saved invoices from database
  const [savedInvoices, setSavedInvoices] = useState([]);

  const getAuthHeaders = (token) => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Fetch user profile and invoices
  const fetchData = useCallback(async (token) => {
    try {
      const authHeaders = getAuthHeaders(token);
      const userRes = await fetch('/api/user', { headers: authHeaders });
      if (userRes.ok) {
        const userData = await userRes.json();
        setUser(userData);
      }
      
      const invRes = await fetch('/api/invoices', { headers: authHeaders });
      if (invRes.ok) {
        const invData = await invRes.json();
        setSavedInvoices(invData.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch data', error);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      const client = createBrowserSupabaseClient();
      setSupabaseClient(client);
      setAuthChecked(true);

      if (!client) {
        fetchData();
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [fetchData]);

  useEffect(() => {
    if (!supabaseClient) return;

    supabaseClient.auth.getSession().then(({ data }) => {
      setSession(data.session || null);
      fetchData(data.session?.access_token);
    });

    const { data: listener } = supabaseClient.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      fetchData(nextSession?.access_token);
    });

    return () => listener?.subscription?.unsubscribe();
  }, [fetchData, supabaseClient]);

  // Helper to adjust due date based on payment terms
  const updateDueDate = (terms, dateStr) => {
    const baseDate = dateStr ? new Date(dateStr) : new Date();
    if (isNaN(baseDate.getTime())) return;

    if (terms === 'Due on Receipt') {
      setDueDate(dateStr);
    } else if (terms === 'Net 15') {
      const d = new Date(baseDate);
      d.setDate(d.getDate() + 15);
      setDueDate(d.toISOString().substring(0, 10));
    } else if (terms === 'Net 30') {
      const d = new Date(baseDate);
      d.setDate(d.getDate() + 30);
      setDueDate(d.toISOString().substring(0, 10));
    } else if (terms === 'Net 60') {
      const d = new Date(baseDate);
      d.setDate(d.getDate() + 60);
      setDueDate(d.toISOString().substring(0, 10));
    }
  };

  // Auto-generate invoice number on client mount
  useEffect(() => {
    if (mounted && !invoiceNumber) {
      const timer = setTimeout(() => {
        setInvoiceNumber(`INV-${Math.floor(1000 + Math.random() * 9000)}`);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [mounted, invoiceNumber]);

  // Handle upgrade query param from landing page
  useEffect(() => {
    if (mounted) {
      const params = new URLSearchParams(window.location.search);
      if (params.get('upgrade') === 'true') {
        const timer = setTimeout(() => {
          setShowUpgradeModal(true);
        }, 0);
        return () => clearTimeout(timer);
      }
    }
  }, [mounted]);

  // Handlers for items
  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0 }]);
  };

  const removeItem = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 800000) {
        alert('Logo image is too large. Please select a logo under 800KB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Run AI parsing on raw text
  const handleAiParse = async () => {
    if (!aiPrompt.trim()) return;
    setIsParsing(true);
    try {
      const res = await fetch('/api/invoices/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders(session?.access_token) },
        body: JSON.stringify({ raw_text: aiPrompt, type: docType })
      });
      
      if (res.ok) {
        const { parsed_data } = await res.json();
        if (parsed_data) {
          if (parsed_data.client_name) setClientName(parsed_data.client_name);
          if (parsed_data.client_email) setClientEmail(parsed_data.client_email);
          if (parsed_data.client_address) setClientAddress(parsed_data.client_address);
          if (parsed_data.business_name) setBusinessName(parsed_data.business_name);
          if (parsed_data.business_email) setBusinessEmail(parsed_data.business_email);
          if (parsed_data.business_address) setBusinessAddress(parsed_data.business_address);
          if (parsed_data.invoice_number) setInvoiceNumber(parsed_data.invoice_number);
          if (parsed_data.currency) setCurrency(parsed_data.currency.toUpperCase());
          if (parsed_data.tax_rate !== undefined) setTaxRate(parsed_data.tax_rate);
          if (parsed_data.discount_rate !== undefined) setDiscountRate(parsed_data.discount_rate);
          if (parsed_data.payment_terms) setPaymentTerms(parsed_data.payment_terms);
          if (parsed_data.notes) setNotes(parsed_data.notes);
          if (parsed_data.due_date) {
            setDueDate(parsed_data.due_date);
          } else if (parsed_data.payment_terms) {
            updateDueDate(parsed_data.payment_terms, parsed_data.invoice_date || invoiceDate);
          }
          
          if (parsed_data.items && parsed_data.items.length > 0) {
            setItems(parsed_data.items.map(item => ({
              description: item.description,
              quantity: item.quantity || 1,
              unitPrice: (item.unit_price || 0) / 100
            })));
          }
          fetchData(session?.access_token); // Refresh quota counts
        }
      } else if (res.status === 403) {
        const err = await res.json();
        alert(err.error || 'AI Parsing quota exceeded.');
        setShowUpgradeModal(true);
      } else {
        alert('AI Parsing failed. Check your API configuration.');
      }
    } catch (e) {
      console.error(e);
      alert('An error occurred during AI parsing.');
    } finally {
      setIsParsing(false);
    }
  };

  // Save invoice to database
  const handleSaveInvoice = async () => {
    if (!clientName) {
      alert('Please fill out the client name.');
      return;
    }
    setIsSaving(true);
    try {
      const formattedItems = items.map(item => ({
        description: item.description,
        quantity: Number(item.quantity),
        unit_price: Math.round(Number(item.unitPrice) * 100)
      }));

      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders(session?.access_token) },
        body: JSON.stringify({
          doc_type: docType,
          invoice_number: invoiceNumber,
          client_name: clientName,
          client_email: clientEmail,
          client_address: clientAddress,
          business_name: businessName,
          business_email: businessEmail,
          business_address: businessAddress,
          logo_url: logoPreview || '',
          currency: currency,
          items: formattedItems,
          discount_rate: discountRate,
          tax_rate: taxRate,
          payment_terms: paymentTerms,
          notes: notes,
          invoice_date: invoiceDate,
          due_date: dueDate
        })
      });

      if (res.ok) {
        alert('Saved successfully!');
        fetchData(session?.access_token); // Refresh list & quota
      } else if (res.status === 403) {
        const err = await res.json();
        alert(err.error || 'Invoice quota exceeded.');
        setShowUpgradeModal(true);
      } else {
        alert('Failed to save document.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  // Mark as paid
  const markAsPaid = async (invoice) => {
    try {
      const res = await fetch('/api/invoices', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders(session?.access_token) },
        body: JSON.stringify({ id: invoice.id, status: 'paid' })
      });
      if (res.ok) {
        alert('Invoice marked as paid!');
        fetchData(session?.access_token);
      } else {
        alert('Failed to update invoice status.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Calculations for active/displayed form
  const subtotal = items.reduce((acc, item) => acc + (Number(item.quantity) * Number(item.unitPrice || 0)), 0);
  const discountAmount = subtotal * (Number(discountRate || 0) / 100);
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = taxableAmount * (Number(taxRate || 0) / 100);
  const total = taxableAmount + taxAmount;

  // Real PDF Download
  const handlePdfDownload = async () => {
    const fileName = `${docType}-${invoiceNumber || 'document'}.pdf`;
    setIsDownloadingPdf(true);
    try {
      await generatePDF('printable-invoice', fileName);
    } catch (e) {
      console.error(e);
      alert('Failed to generate PDF. You can still use the Print option.');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // Browser Print
  const triggerPrint = () => {
    window.print();
  };

  // Currency symbols mapping helper
  const getCurrencySymbol = (code) => {
    const symbols = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      CNY: '¥',
      JPY: '¥'
    };
    return symbols[code.toUpperCase()] || code.toUpperCase();
  };

  const currencySymbol = getCurrencySymbol(currency);

  const handleSignOut = async () => {
    if (!supabaseClient) return;
    await supabaseClient.auth.signOut();
    setSession(null);
    fetchData();
  };

  return (
    <div className="no-print" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header className="navbar" style={{ padding: '0 24px' }}>
        <div className="logo-container">
          <svg style={{width:'24px', height:'24px'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="9" y1="9" x2="15" y2="9" />
            <line x1="9" y1="13" x2="15" y2="13" />
            <line x1="9" y1="17" x2="13" y2="17" />
          </svg>
          <Link href="/">InvoiceAI</Link>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {user.quota && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.8rem', background: 'rgba(255, 255, 255, 0.03)', padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}>
              <span>
                Invoices: <strong>{user.quota.invoicesUsed}</strong>/{user.quota.plan === 'pro' ? '∞' : user.quota.invoicesLimit}
              </span>
              <span style={{ color: 'var(--border)' }}>|</span>
              <span>
                AI Parses: <strong>{user.quota.aiUsed}</strong>/{user.quota.plan === 'pro' ? '100' : user.quota.aiLimit}
              </span>
            </div>
          )}
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            User: <strong style={{ color: 'var(--text-main)' }}>{user.name}</strong> ({user.email}) | Plan: <span className="badge" style={{ backgroundColor: user.plan === 'pro' || user.plan === 'Professional' ? '#4f46e5' : 'var(--primary-glow)', color: '#ffffff' }}>{user.plan}</span>
            {session ? (
              <span style={{ color: 'var(--success)', fontWeight: 'bold' }}> | Cloud Sync</span>
            ) : (
              <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}> | Demo Sandbox</span>
            )}
          </div>
          {authChecked && authConfigured && (
            session ? (
              <button onClick={handleSignOut} className="btn btn-secondary btn-sm">
                Sign out
              </button>
            ) : (
              <Link href="/auth" className="btn btn-secondary btn-sm">
                Sign in
              </Link>
            )
          )}
          {user.plan !== 'pro' && user.plan !== 'Professional' && (
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="badge"
              style={{
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                color: '#818cf8',
                cursor: 'pointer',
                fontSize: '0.75rem',
                border: '1px solid rgba(99, 102, 241, 0.2)'
              }}
            >
              Upgrade to Pro
            </button>
          )}
          <Link href="/" className="btn btn-secondary btn-sm">Home</Link>
        </div>
      </header>

      {/* Main Grid Workspace */}
      <main className="container" style={{ flex: 1, padding: '30px 24px', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '30px' }} className="grid-container-2col">
          
          {/* Left Panel: Inputs & AI */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* AI Generator Box */}
            <div className="card" style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: 'var(--accent)' }}>✨</span> AI Autofill generator
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                Paste your raw billing details below. The AI will parse them and populate the fields.
              </p>
              <textarea 
                className="form-textarea" 
                value={aiPrompt} 
                onChange={(e) => setAiPrompt(e.target.value)} 
                placeholder="Example: Send an invoice to John Doe (john@example.com) for 3 custom websites at $450 each. Tax is 8%."
                style={{ fontSize: '0.9rem', marginBottom: '12px' }}
              />
              <button 
                onClick={handleAiParse}
                disabled={isParsing} 
                className="btn btn-primary btn-sm" 
                style={{ alignSelf: 'flex-start' }}
              >
                {isParsing ? 'Processing with AI...' : 'Parse & Auto-fill'}
              </button>
            </div>

            {/* Document Form configuration */}
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Document Details</h3>
                <div style={{ display: 'flex', gap: '4px', background: '#090a0f', padding: '4px', borderRadius: '6px' }}>
                  <button 
                    onClick={() => setDocType('invoice')}
                    style={{ padding: '4px 12px', borderRadius: '4px', fontSize: '0.8rem', background: docType === 'invoice' ? 'var(--primary)' : 'transparent', fontWeight: 600 }}
                  >
                    Invoice
                  </button>
                  <button 
                    onClick={() => setDocType('receipt')}
                    style={{ padding: '4px 12px', borderRadius: '4px', fontSize: '0.8rem', background: docType === 'receipt' ? 'var(--primary)' : 'transparent', fontWeight: 600 }}
                  >
                    Receipt
                  </button>
                </div>
              </div>

              {/* Collapsible Business details */}
              <div style={{ marginBottom: '15px' }}>
                <button 
                  onClick={() => setShowBusinessDetails(!showBusinessDetails)}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    width: '100%', 
                    padding: '12px', 
                    background: 'rgba(255, 255, 255, 0.02)', 
                    border: '1px solid var(--border)', 
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: 600
                  }}
                >
                  <span>🏢 Business Details & Logo</span>
                  <span>{showBusinessDetails ? '▲' : '▼'}</span>
                </button>
                
                {showBusinessDetails && (
                  <div style={{ 
                    marginTop: '10px', 
                    padding: '16px', 
                    border: '1px solid var(--border)', 
                    borderRadius: '8px', 
                    background: 'rgba(255,255,255,0.01)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}>
                    {/* Logo Upload */}
                    <div className="input-group">
                      <label className="input-label">Business Logo</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
	                        {logoPreview ? (
	                          <div style={{ position: 'relative' }}>
	                            {/* eslint-disable-next-line @next/next/no-img-element -- User-uploaded data URL previews are not compatible with Next Image optimization. */}
	                            <img src={logoPreview} alt="Logo preview" style={{ height: '50px', maxWidth: '120px', borderRadius: '4px', objectFit: 'contain', background: '#fff', padding: '2px' }} />
	                            <button 
                              onClick={() => setLogoPreview(null)}
                              style={{ 
                                position: 'absolute', 
                                top: '-8px', 
                                right: '-8px', 
                                background: 'var(--danger)', 
                                color: '#fff', 
                                borderRadius: '50%', 
                                width: '18px', 
                                height: '18px', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                fontSize: '0.65rem',
                                border: 'none',
                                cursor: 'pointer'
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div style={{ 
                            width: '50px', 
                            height: '50px', 
                            border: '1px dashed var(--border)', 
                            borderRadius: '4px', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            fontSize: '0.7rem',
                            color: 'var(--text-muted)'
                          }}>
                            No Logo
                          </div>
                        )}
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleLogoUpload} 
                          style={{ display: 'none' }} 
                          id="logo-upload-input"
                        />
                        <label 
                          htmlFor="logo-upload-input" 
                          className="btn btn-secondary btn-sm"
                          style={{ cursor: 'pointer' }}
                        >
                          Upload Logo
                        </label>
                      </div>
                    </div>

                    <div className="input-group">
                      <label className="input-label">Business Name</label>
                      <input 
                        type="text" 
                        value={businessName} 
                        onChange={(e) => setBusinessName(e.target.value)} 
                        className="form-input" 
                        placeholder="e.g. Acme Inc." 
                      />
                    </div>

                    <div className="input-group">
                      <label className="input-label">Business Email</label>
                      <input 
                        type="email" 
                        value={businessEmail} 
                        onChange={(e) => setBusinessEmail(e.target.value)} 
                        className="form-input" 
                        placeholder="e.g. billing@acme.com" 
                      />
                    </div>

                    <div className="input-group">
                      <label className="input-label">Business Address</label>
                      <textarea 
                        value={businessAddress} 
                        onChange={(e) => setBusinessAddress(e.target.value)} 
                        className="form-textarea" 
                        placeholder="e.g. 123 Enterprise Way, San Francisco, CA"
                        style={{ minHeight: '60px' }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Invoice Number, Dates and Terms */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div className="input-group">
                  <label className="input-label">Document #</label>
                  <input 
                    type="text" 
                    value={invoiceNumber} 
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className="form-input" 
                    placeholder="e.g. INV-1001" 
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Payment Terms</label>
                  <select 
                    className="form-select" 
                    value={paymentTerms} 
                    onChange={(e) => {
                      const value = e.target.value;
                      setPaymentTerms(value);
                      updateDueDate(value, invoiceDate);
                    }}
                  >
                    <option value="Net 30">Net 30</option>
                    <option value="Net 15">Net 15</option>
                    <option value="Net 60">Net 60</option>
                    <option value="Due on Receipt">Due on Receipt</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div className="input-group">
                  <label className="input-label">Issue Date</label>
                  <input 
                    type="date" 
                    value={invoiceDate} 
                    onChange={(e) => {
                      const value = e.target.value;
                      setInvoiceDate(value);
                      updateDueDate(paymentTerms, value);
                    }}
                    className="form-input" 
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Due Date</label>
                  <input 
                    type="date" 
                    value={dueDate} 
                    onChange={(e) => setDueDate(e.target.value)}
                    className="form-input" 
                    disabled={paymentTerms !== 'Custom'}
                  />
                </div>
              </div>

              {/* Client Info */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '15px', marginTop: '10px' }}>
                <div className="input-group">
                  <label className="input-label">Client Name</label>
                  <input 
                    type="text" 
                    value={clientName} 
                    onChange={(e) => setClientName(e.target.value)}
                    className="form-input" 
                    placeholder="e.g. Acme Corp" 
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Client Email</label>
                  <input 
                    type="email" 
                    value={clientEmail} 
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="form-input" 
                    placeholder="e.g. hello@acme.com" 
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Client Address</label>
                  <textarea 
                    value={clientAddress} 
                    onChange={(e) => setClientAddress(e.target.value)}
                    className="form-textarea" 
                    placeholder="e.g. 456 client St, New York, NY"
                    style={{ minHeight: '60px' }}
                  />
                </div>
              </div>

              {/* Currency, Tax & Discount */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', borderTop: '1px solid var(--border)', paddingTop: '15px' }}>
                <div className="input-group">
                  <label className="input-label">Currency</label>
                  <select 
                    className="form-select" 
                    value={currency} 
                    onChange={(e) => setCurrency(e.target.value)}
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="CNY">CNY (¥)</option>
                    <option value="JPY">JPY (¥)</option>
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Tax (%)</label>
                  <input 
                    type="number" 
                    value={taxRate} 
                    onChange={(e) => setTaxRate(Math.max(0, Number(e.target.value)))}
                    className="form-input" 
                    min="0"
                    max="100"
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Discount (%)</label>
                  <input 
                    type="number" 
                    value={discountRate} 
                    onChange={(e) => setDiscountRate(Math.max(0, Math.min(100, Number(e.target.value))))}
                    className="form-input" 
                    min="0"
                    max="100"
                  />
                </div>
              </div>

              {/* Items Section */}
              <div style={{ marginTop: '10px', borderTop: '1px solid var(--border)', paddingTop: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <label className="input-label">Line Items</label>
                  <button onClick={addItem} style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 'bold', cursor: 'pointer' }}>+ Add Item</button>
                </div>

                {items.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '10px', alignItems: 'center' }}>
                    <input 
                      type="text" 
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                      className="form-input" 
                      style={{ flex: 2 }}
                    />
                    <input 
                      type="number" 
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                      className="form-input" 
                      style={{ flex: 0.6 }}
                      min="1"
                    />
                    <input 
                      type="number" 
                      placeholder="Price"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(idx, 'unitPrice', Number(e.target.value))}
                      className="form-input" 
                      style={{ flex: 1 }}
                      min="0"
                    />
                    <button 
                      onClick={() => removeItem(idx)}
                      style={{ color: 'var(--danger)', background: 'transparent', border: 'none', cursor: 'pointer', padding: '0 8px' }}
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>

              {/* Notes */}
              <div className="input-group" style={{ marginTop: '15px' }}>
                <label className="input-label">Notes / Payment Terms Details</label>
                <textarea 
                  value={notes} 
                  onChange={(e) => setNotes(e.target.value)} 
                  placeholder="e.g. Bank transfer instructions: ACME Bank, Acc: 1234-5678-90, Swift: ACMEUS33"
                  className="form-textarea"
                  style={{ minHeight: '60px' }}
                />
              </div>

              {/* Actions */}
              <div style={{ marginTop: '25px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {user.quota && !user.quota.invoicesAllowed && user.plan !== 'pro' ? (
                  <button 
                    onClick={() => setShowUpgradeModal(true)} 
                    className="btn btn-primary" 
                    style={{ width: '100%', background: 'linear-gradient(135deg, var(--accent), #e11d48)' }}
                  >
                    🚀 Limit Reached — Upgrade to Pro to Save
                  </button>
                ) : (
                  <button onClick={handleSaveInvoice} disabled={isSaving} className="btn btn-primary" style={{ width: '100%' }}>
                    {isSaving
                      ? (session ? 'Saving to Cloud...' : 'Saving to Sandbox...')
                      : (session ? 'Save Document' : 'Save Document (Sandbox)')}
                  </button>
                )}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    onClick={handlePdfDownload} 
                    disabled={isDownloadingPdf}
                    className="btn btn-secondary" 
                    style={{ flex: 1 }}
                  >
                    {isDownloadingPdf ? 'Generating PDF...' : 'Download PDF'}
                  </button>
                  <button onClick={triggerPrint} className="btn btn-secondary" style={{ flex: 1 }}>
                    Print Page
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* Right Panel: Interactive Live Preview */}
          <div style={{ position: 'sticky', top: '100px', alignSelf: 'start' }}>
            <div id="printable-invoice" style={{
              background: '#ffffff',
              color: '#1e293b',
              padding: '40px',
              borderRadius: '12px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              minHeight: '700px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              fontFamily: 'monospace'
            }}>
              <div>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #e2e8f0', paddingBottom: '20px', marginBottom: '20px' }}>
                  <div>
	                    {logoPreview && (
	                      <div style={{ marginBottom: '15px' }}>
	                        {/* eslint-disable-next-line @next/next/no-img-element -- User-uploaded data URL previews are rendered directly for PDF capture. */}
	                        <img src={logoPreview} alt="Business logo" style={{ maxHeight: '50px', maxWidth: '150px', objectFit: 'contain' }} />
	                      </div>
                    )}
                    <h2 style={{ margin: 0, fontSize: '1.6rem', color: '#0f172a' }}>{docType.toUpperCase()}</h2>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Generated via InvoiceAI</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, fontWeight: 'bold', color: '#0f172a', fontSize: '1rem' }}>#{invoiceNumber || 'TMP'}</p>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>Date: {invoiceDate || getTodayString()}</p>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>Due Date: {dueDate || 'On Receipt'}</p>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>Terms: {paymentTerms}</p>
                  </div>
                </div>

                {/* Client / Business Details */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                  <div>
                    <h5 style={{ margin: '0 0 5px 0', textTransform: 'uppercase', color: '#94a3b8', fontSize: '0.75rem' }}>Billed To:</h5>
                    <p style={{ margin: 0, fontWeight: 'bold', fontSize: '0.95rem', color: '#0f172a' }}>{clientName || 'Client Name'}</p>
                    {clientEmail && <p style={{ margin: 0, fontSize: '0.85rem' }}>{clientEmail}</p>}
                    {clientAddress && <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', whiteSpace: 'pre-line', color: '#475569' }}>{clientAddress}</p>}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <h5 style={{ margin: '0 0 5px 0', textTransform: 'uppercase', color: '#94a3b8', fontSize: '0.75rem' }}>From:</h5>
                    <p style={{ margin: 0, fontWeight: 'bold', fontSize: '0.95rem', color: '#0f172a' }}>{businessName || 'Your Business Name'}</p>
                    {businessEmail && <p style={{ margin: 0, fontSize: '0.85rem' }}>{businessEmail}</p>}
                    {businessAddress && <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', whiteSpace: 'pre-line', color: '#475569' }}>{businessAddress}</p>}
                  </div>
                </div>

                {/* Line Items Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #cbd5e1', textAlign: 'left' }}>
                      <th style={{ padding: '8px 0', fontSize: '0.8rem', color: '#64748b' }}>Item & Description</th>
                      <th style={{ padding: '8px 0', fontSize: '0.8rem', color: '#64748b', textAlign: 'center' }}>Qty</th>
                      <th style={{ padding: '8px 0', fontSize: '0.8rem', color: '#64748b', textAlign: 'right' }}>Rate</th>
                      <th style={{ padding: '8px 0', fontSize: '0.8rem', color: '#64748b', textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 0', fontSize: '0.9rem', color: '#334155' }}>{item.description || 'Consulting Services'}</td>
                        <td style={{ padding: '12px 0', fontSize: '0.9rem', textAlign: 'center', color: '#334155' }}>{item.quantity}</td>
                        <td style={{ padding: '12px 0', fontSize: '0.9rem', textAlign: 'right', color: '#334155' }}>
                          {currencySymbol}{Number(item.unitPrice || 0).toFixed(2)}
                        </td>
                        <td style={{ padding: '12px 0', fontSize: '0.9rem', textAlign: 'right', fontWeight: 'bold', color: '#0f172a' }}>
                          {currencySymbol}{(Number(item.quantity) * Number(item.unitPrice || 0)).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals & Notes */}
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', marginBottom: '20px' }}>
                  {/* Notes display */}
                  <div style={{ fontSize: '0.8rem', color: '#475569' }}>
                    {notes && (
                      <>
                        <h6 style={{ margin: '0 0 5px 0', textTransform: 'uppercase', color: '#94a3b8', fontSize: '0.7rem' }}>Notes & Instructions:</h6>
                        <p style={{ margin: 0, whiteSpace: 'pre-line' }}>{notes}</p>
                      </>
                    )}
                  </div>
                  
                  {/* Summary */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <div style={{ width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '0.85rem', color: '#475569' }}>
                        <span>Subtotal:</span>
                        <span>{currencySymbol}{subtotal.toFixed(2)}</span>
                      </div>
                      
                      {Number(discountRate) > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '0.85rem', color: '#e11d48' }}>
                          <span>Discount ({discountRate}%):</span>
                          <span>-{currencySymbol}{discountAmount.toFixed(2)}</span>
                        </div>
                      )}
                      
                      {Number(taxRate) > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '0.85rem', color: '#475569' }}>
                          <span>Tax ({taxRate}%):</span>
                          <span>{currencySymbol}{taxAmount.toFixed(2)}</span>
                        </div>
                      )}
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '2px solid #0f172a', fontWeight: 'bold', fontSize: '1rem', color: '#0f172a' }}>
                        <span>Total:</span>
                        <span>{currencySymbol}{total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '15px', fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center' }}>
                  Thank you for your business! Generated with InvoiceAI.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Panel: Saved Invoices */}
        <section style={{ marginTop: '50px', borderTop: '1px solid var(--border)', paddingTop: '40px' }}>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '20px' }}>
            {session ? 'Saved Documents' : 'Saved Documents (Demo Sandbox)'}
          </h3>
          {savedInvoices.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>
              {session
                ? 'No invoices saved yet. Fill out the details and click "Save Document".'
                : 'No invoices saved yet in this sandbox. Fill out the details and click "Save Document (Sandbox)".'}
            </p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {savedInvoices.map((inv) => (
                <div key={inv.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>#{inv.invoice_number || inv.id.substring(4, 10)}</span>
                      <span className="badge" style={{ 
                        backgroundColor: inv.status === 'paid' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)',
                        color: inv.status === 'paid' ? '#10b981' : '#f43f5e'
                      }}>
                        {inv.status}
                      </span>
                    </div>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '4px' }}>{inv.client_name}</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px' }}>{inv.client_email}</p>
                    <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>
                      {getCurrencySymbol(inv.currency)} {(inv.total / 100).toFixed(2)}
                    </p>
                  </div>
                  
                  {inv.status !== 'paid' && (
                    <button 
                      onClick={() => markAsPaid(inv)} 
                      className="btn btn-secondary btn-sm" 
                      style={{ marginTop: '16px', display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Mark as Paid
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(9, 10, 15, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="card" style={{ maxWidth: '500px', width: '100%', padding: '30px', position: 'relative', border: '1px solid #3f445e' }}>
            <button 
              onClick={() => setShowUpgradeModal(false)}
              style={{ position: 'absolute', top: '15px', right: '15px', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer', background: 'none', border: 'none' }}
            >
              ✕
            </button>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '15px', background: 'linear-gradient(135deg, var(--primary), var(--accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Upgrade to InvoiceAI Pro (Coming Soon)
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
              We are building the next generation of AI-powered invoicing. Join the waitlist to get early access when Pro launches!
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px 0', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.9rem' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: 'var(--success)' }}>✓</span> <strong>Secure Cloud Database Sync</strong> (Save & access invoices anywhere via Supabase)
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: 'var(--success)' }}>✓</span> <strong>Personalized Accounts</strong> & Secure Login (Supabase Auth)
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: 'var(--success)' }}>✓</span> <strong>Unlimited</strong> invoices & receipts
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: 'var(--success)' }}>✓</span> <strong>100</strong> AI Auto-fills per month
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: 'var(--success)' }}>✓</span> Custom branding & logo uploads
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: 'var(--success)' }}>✓</span> High-quality PDF export (No watermarks)
              </li>
            </ul>
            
            {waitlistSubmitted ? (
              <div style={{ textAlign: 'center', padding: '15px', background: 'var(--success-glow)', border: '1px solid var(--success)', borderRadius: '8px', color: 'var(--success)' }}>
                🎉 You are on the list! We will email you when Pro goes live.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input 
                  type="email" 
                  value={waitlistEmail} 
                  onChange={(e) => setWaitlistEmail(e.target.value)} 
                  placeholder="Enter your email" 
                  className="form-input" 
                  required
                />
                <button 
                  onClick={() => {
                    if (waitlistEmail) {
                      setWaitlistSubmitted(true);
                    }
                  }} 
                  className="btn btn-primary"
                >
                  Join Waitlist (Pro Launching Soon)
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '30px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'center', gap: '24px', flexWrap: 'wrap' }}>
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/terms">Terms of Service</Link>
          <Link href="/contact">Contact</Link>
        </div>
        <p style={{ marginTop: '12px' }}>© 2026 InvoiceAI. All rights reserved.</p>
      </footer>
    </div>
  );
}
