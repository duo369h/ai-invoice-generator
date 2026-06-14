import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'db.json');

// Helper to read all DB data
function readData() {
  try {
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading database:', error);
    return { users: [], invoices: [], clients: [] };
  }
}

// Helper to write all DB data
function writeData(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing database:', error);
    throw new Error('Database write failure');
  }
}

export function getInvoices() {
  return readData().invoices || [];
}

export function saveInvoice(invoice) {
  const data = readData();
  if (!data.invoices) data.invoices = [];
  data.invoices.unshift(invoice);
  writeData(data);
  return invoice;
}

export function updateInvoiceStatus(id, status) {
  const data = readData();
  const index = data.invoices.findIndex(inv => inv.id === id);
  if (index !== -1) {
    data.invoices[index].status = status;
    writeData(data);
    return data.invoices[index];
  }
  return null;
}

export function getUsers() {
  return readData().users || [];
}

export function getUserById(id) {
  const users = getUsers();
  return users.find(u => u.id === id) || null;
}

export function saveUser(user) {
  const data = readData();
  if (!data.users) data.users = [];
  data.users.push(user);
  writeData(data);
  return user;
}

export function updateUserPlan(userId, plan) {
  const data = readData();
  const index = data.users.findIndex(u => u.id === userId);
  if (index !== -1) {
    data.users[index].plan = plan;
    writeData(data);
    return data.users[index];
  }
  return null;
}

export function getClients() {
  return readData().clients || [];
}

export function saveClient(client) {
  const data = readData();
  if (!data.clients) data.clients = [];
  
  const index = data.clients.findIndex(c => c.id === client.id);
  if (index !== -1) {
    data.clients[index] = client;
  } else {
    data.clients.unshift(client);
  }
  writeData(data);
  return client;
}

export function deleteClient(id) {
  const data = readData();
  if (!data.clients) return false;
  const initialLength = data.clients.length;
  data.clients = data.clients.filter(c => c.id !== id);
  if (data.clients.length !== initialLength) {
    writeData(data);
    return true;
  }
  return false;
}

// Card Profiles
export function getCardProfiles() {
  return readData().card_profiles || [];
}

export function getCardProfileByUsername(username) {
  const profiles = getCardProfiles();
  return profiles.find(p => p.username === username) || null;
}

export function getCardProfileByUserId(userId) {
  const profiles = getCardProfiles();
  return profiles.find(p => p.user_id === userId) || null;
}

export function saveCardProfile(profile) {
  const data = readData();
  if (!data.card_profiles) data.card_profiles = [];
  
  const index = data.card_profiles.findIndex(p => p.user_id === profile.user_id || p.username === profile.username);
  if (index !== -1) {
    data.card_profiles[index] = { ...data.card_profiles[index], ...profile, updated_at: new Date().toISOString() };
  } else {
    data.card_profiles.unshift({
      id: profile.id || `cp_${Math.random().toString(36).substring(2, 14)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...profile
    });
  }
  writeData(data);
  return profile;
}

// Leads
export function getLeads() {
  return readData().leads || [];
}

export function getLeadsByUserId(userId) {
  const leads = getLeads();
  return leads.filter(l => l.freelancer_id === userId);
}

export function saveLead(lead) {
  const data = readData();
  if (!data.leads) data.leads = [];
  
  const newLead = {
    id: lead.id || `lead_${Math.random().toString(36).substring(2, 14)}`,
    status: lead.status || 'new',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...lead
  };
  
  data.leads.unshift(newLead);
  writeData(data);
  return newLead;
}

export function updateLeadDetails(id, updates) {
  const data = readData();
  if (!data.leads) return null;
  
  const index = data.leads.findIndex(l => l.id === id);
  if (index !== -1) {
    data.leads[index] = {
      ...data.leads[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    writeData(data);
    return data.leads[index];
  }
  return null;
}

export function updateLeadStatus(id, status) {
  return updateLeadDetails(id, { status });
}

// Quotes
export function getQuotes() {
  return readData().quotes || [];
}

export function getQuotesByUserId(userId) {
  const quotes = getQuotes();
  return quotes.filter(q => q.user_id === userId);
}

export function saveQuote(quote) {
  const data = readData();
  if (!data.quotes) data.quotes = [];
  
  const index = data.quotes.findIndex(q => q.id === quote.id);
  const quoteData = {
    ...quote,
    updated_at: new Date().toISOString()
  };
  
  if (index !== -1) {
    data.quotes[index] = { ...data.quotes[index], ...quoteData };
  } else {
    quoteData.id = quote.id || `quote_${Math.random().toString(36).substring(2, 14)}`;
    quoteData.created_at = new Date().toISOString();
    data.quotes.unshift(quoteData);
  }
  
  writeData(data);
  return quoteData;
}

export function updateQuoteStatus(id, status) {
  const data = readData();
  if (!data.quotes) return null;
  
  const index = data.quotes.findIndex(q => q.id === id);
  if (index !== -1) {
    data.quotes[index].status = status;
    data.quotes[index].updated_at = new Date().toISOString();
    writeData(data);
    return data.quotes[index];
  }
  return null;
}

export function savePortalToken(tokenRecord) {
  const data = readData();
  if (!data.portal_tokens) data.portal_tokens = [];

  const record = {
    id: tokenRecord.id || `pt_${Math.random().toString(36).substring(2, 14)}`,
    created_at: new Date().toISOString(),
    ...tokenRecord
  };

  data.portal_tokens.unshift(record);
  writeData(data);
  return record;
}

export function getPortalTokenByHash(tokenHash) {
  const tokens = readData().portal_tokens || [];
  const now = new Date();
  return tokens.find((token) => {
    if (token.token_hash !== tokenHash) return false;
    if (token.revoked_at) return false;
    if (token.expires_at && new Date(token.expires_at) <= now) return false;
    return true;
  }) || null;
}
