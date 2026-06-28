export function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || 'https://www.corvioz.com';
}

export function getSupportEmail() {
  return process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@corvioz.com';
}
