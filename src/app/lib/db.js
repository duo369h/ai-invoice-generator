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
    return { users: [], invoices: [] };
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
