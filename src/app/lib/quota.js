import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'db.json');

function readData() {
  try {
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return { users: [], invoices: [], usage: [] };
  }
}

function writeData(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing database:', error);
  }
}

export function checkQuota(userId) {
  const data = readData();
  const user = (data.users || []).find(u => u.id === userId) || { id: userId, plan: 'free' };
  
  // Normalise plan names: treat 'Professional' or 'pro' as 'pro', everything else as 'free'
  const plan = (user.plan || 'free').toLowerCase();
  const isPro = plan === 'pro' || plan === 'professional';

  const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
  
  // 1. Count invoices created in the current month
  const invoices = data.invoices || [];
  const invoicesThisMonth = invoices.filter(inv => {
    const matchesUser = inv.user_id === userId || (!inv.user_id && userId === 'usr_demo123');
    if (!matchesUser) return false;
    
    const createdAt = inv.created_at || new Date().toISOString();
    return createdAt.substring(0, 7) === currentMonth;
  }).length;

  // 2. Get AI parses count from usage
  const usageList = data.usage || [];
  const userUsage = usageList.find(u => u.user_id === userId && u.month === currentMonth) || {
    user_id: userId,
    month: currentMonth,
    invoices_created: invoicesThisMonth,
    ai_parses_used: 0
  };

  const limits = {
    free: { invoices: 5, ai: 3 },
    pro: { invoices: 999999, ai: 100 }
  };

  const currentLimits = limits[isPro ? 'pro' : 'free'];

  return {
    plan: isPro ? 'pro' : 'free',
    invoicesUsed: invoicesThisMonth,
    invoicesLimit: currentLimits.invoices,
    invoicesAllowed: invoicesThisMonth < currentLimits.invoices,
    aiUsed: userUsage.ai_parses_used || 0,
    aiLimit: currentLimits.ai,
    aiAllowed: (userUsage.ai_parses_used || 0) < currentLimits.ai
  };
}

export function incrementAiUsage(userId) {
  const data = readData();
  if (!data.usage) data.usage = [];
  
  const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
  let usageEntryIndex = data.usage.findIndex(u => u.user_id === userId && u.month === currentMonth);
  
  if (usageEntryIndex === -1) {
    const invoices = data.invoices || [];
    const invoicesThisMonth = invoices.filter(inv => {
      const matchesUser = inv.user_id === userId || (!inv.user_id && userId === 'usr_demo123');
      if (!matchesUser) return false;
      const createdAt = inv.created_at || new Date().toISOString();
      return createdAt.substring(0, 7) === currentMonth;
    }).length;

    data.usage.push({
      user_id: userId,
      month: currentMonth,
      invoices_created: invoicesThisMonth,
      ai_parses_used: 1
    });
  } else {
    data.usage[usageEntryIndex].ai_parses_used = (data.usage[usageEntryIndex].ai_parses_used || 0) + 1;
  }
  
  writeData(data);
}
