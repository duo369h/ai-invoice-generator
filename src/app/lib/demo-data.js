import { createServiceSupabaseClient } from './supabase';
import { crypto } from './supabase'; // we can generate random hashes
import md5 from 'crypto';

/**
 * Generates a SHA-256 hash representing a secure portal token
 */
function generateMockHash() {
  const bytes = md5.randomBytes(32);
  return bytes.toString('base64url');
}

function hashToken(token) {
  return md5.createHash('sha256').update(token).digest('hex');
}

/**
 * Explicit server-only utility for isolated demo accounts.
 * Never call this from signup or profile creation.
 */
export async function seedDemoData({ userId, email, name }) {
  try {
    if (!String(email || '').toLowerCase().endsWith('@example.invalid')) {
      throw new Error('Demo seed only supports isolated test accounts');
    }

    console.log(`[SEEDING] Initializing demo data seeding for user: ${userId} (${email})`);

    const seederClient = createServiceSupabaseClient();
    if (!seederClient) {
      throw new Error('Demo seed requires SUPABASE_SERVICE_ROLE_KEY');
    }

    // 1. Check if card profile already exists
    const { data: existingProfile } = await seederClient
      .from('card_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (existingProfile) {
      console.log(`[SEEDING] Demo data already exists for user ${userId}. Skipping.`);
      return;
    }

    // 2. Generate unique username
    let baseUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (baseUsername.length < 3) baseUsername = `user-${userId.slice(0, 8)}`;
    let username = baseUsername.slice(0, 30);

    const { data: existingCp } = await seederClient
      .from('card_profiles')
      .select('username')
      .eq('username', username)
      .maybeSingle();

    if (existingCp) {
      username = `${username}-${userId.slice(0, 4)}`;
    }

    // 3. Create Bento Card Profile
    const freelancerName = name || 'Alex Morgan';
    const { data: cardProfile, error: cardError } = await seederClient
      .from('card_profiles')
      .insert({
        user_id: userId,
        username,
        name: freelancerName,
        title: 'SaaS UX Designer & Next.js Developer',
        bio: 'I help early-stage tech teams design clean design systems, build fast Next.js apps, and configure collaborative client portals.',
        location: 'Toronto, Canada',
        timezone: 'EST',
        languages: 'English, French',
        availability_status: 'available',
        response_time: 'within a few hours',
        starting_price: '$2,500',
        tags: ['Figma', 'Next.js', 'TailwindCSS', 'Webflow', 'Brand Systems'],
        services: [
          {
            name: 'SaaS Design System Setup',
            description: 'Establish standard typography scaling, dark mode variables, and reusable Figma components for your engineering team.',
            type: 'fixed',
            amount: 3500
          },
          {
            name: 'Responsive Web Design & Next.js Implementation',
            description: 'High-converting website built from scratch with premium micro-animations and Google Lighthouse speed tuning.',
            type: 'fixed',
            amount: 5000
          }
        ],
        portfolio: [],
        social_links: {
          twitter: 'https://x.com/corvioz',
          github: 'https://github.com/corvioz'
        },
        verified_badge: true,
        top_rated_badge: true,
        fast_response_badge: true,
        testimonials: [
          {
            id: 't_demo_1',
            name: 'Sarah Jenkins',
            role: 'Founder, TechPulse',
            text: 'Alex completely transformed our onboarding page. The split-screen portal made billing and timelines absolutely seamless.',
            stars: 5
          }
        ],
        is_public: true
      })
      .select('*')
      .single();

    if (cardError) throw cardError;
    console.log(`[SEEDING] Bento Card Profile created at /profile/${username}`);

    // 4. Create Sample Client
    const { data: client, error: clientError } = await seederClient
      .from('clients')
      .insert({
        user_id: userId,
        name: 'TechPulse Inc',
        email: 'billing@techpulse.io',
        address: '456 Innovation Way, Suite 100, Boston, MA 02111'
      })
      .select('*')
      .single();

    if (clientError) throw clientError;
    console.log(`[SEEDING] Sample Client created: ${client.name}`);

    // 5. Create Sample Quote
    const { data: quote, error: quoteError } = await seederClient
      .from('quotes')
      .insert({
        user_id: userId,
        quote_number: 'QT-2026-001',
        client_name: 'TechPulse Inc',
        client_email: 'billing@techpulse.io',
        client_address: '456 Innovation Way, Suite 100, Boston, MA 02111',
        items: [
          { description: 'Phase 1: Brand Strategy & Figma Layouts', quantity: 1, unitPrice: 2000 },
          { description: 'Phase 2: High-Fidelity UI Design Mockups', quantity: 1, unitPrice: 3000 }
        ],
        subtotal: 500000,
        discount_rate: 10, // 10% discount ($500)
        discount_amount: 50000,
        tax_rate: 5, // 5% tax on $4,500 ($225)
        tax_amount: 22500,
        total: 472500,
        currency: 'USD',
        notes: 'Approved via secure client portal. Deliverables start upon signing.',
        status: 'approved'
      })
      .select('*')
      .single();

    if (quoteError) throw quoteError;
    console.log(`[SEEDING] Sample Quote created: ${quote.quote_number}`);

    // 6. Create Sample Invoice (linked to Quote)
    const { data: invoice, error: invoiceError } = await seederClient
      .from('invoices')
      .insert({
        user_id: userId,
        invoice_number: 'INV-2026-001',
        doc_type: 'invoice',
        client_id: client.id,
        client_name: 'TechPulse Inc',
        client_email: 'billing@techpulse.io',
        client_address: '456 Innovation Way, Suite 100, Boston, MA 02111',
        business_name: `${freelancerName} Studio`,
        business_email: email,
        currency: 'USD',
        items: [
          { description: 'Phase 1: Brand Strategy & Figma Layouts', quantity: 1, unit_price: 200000, amount: 200000 },
          { description: 'Phase 2: High-Fidelity UI Design Mockups (Pending)', quantity: 1, unit_price: 300000, amount: 300000 }
        ],
        subtotal: 500000,
        discount_rate: 10,
        discount_amount: 50000,
        tax_rate: 5,
        tax_amount: 22500,
        total: 472500,
        invoice_date: new Date().toISOString().substring(0, 10),
        due_date: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().substring(0, 10),
        payment_terms: 'Net 14',
        payment_link: 'https://paypal.me/corvioz',
        notes: 'Thank you for your business. Standard portal timelines apply.',
        status: 'pending',
        quote_id: quote.id
      })
      .select('*')
      .single();

    if (invoiceError) throw invoiceError;
    console.log(`[SEEDING] Sample Invoice created: ${invoice.invoice_number}`);

    // 7. Create Portal Tokens
    const quoteRawToken = generateMockHash();
    const invoiceRawToken = generateMockHash();

    const expiresAt = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();

    const { error: ptError } = await seederClient
      .from('portal_tokens')
      .insert([
        {
          token_hash: hashToken(quoteRawToken),
          owner_id: userId,
          resource_type: 'quote',
          resource_id: quote.id,
          expires_at: expiresAt,
          scope: 'view:comment'
        },
        {
          token_hash: hashToken(invoiceRawToken),
          owner_id: userId,
          resource_type: 'invoice',
          resource_id: invoice.id,
          expires_at: expiresAt,
          scope: 'view:comment'
        }
      ]);

    if (ptError) throw ptError;
    console.log(`[SEEDING] Portal Tokens generated securely`);

    // 8. Create Sample Leads in Leads Inbox
    const { error: leadsError } = await seederClient
      .from('leads')
      .insert([
        {
          card_profile_id: cardProfile.id,
          freelancer_id: userId,
          name: 'Marcus Vance',
          email: 'marcus@cloudvent.io',
          message: 'Hi Alex! I saw your Public Profile. We are launching a newsletter dashboard next month and need a frontend UI consult. What is your availability like?',
          status: 'new',
          visitor_ip: '127.0.0.1',
          source_utm: { source: 'bento-profile' }
        },
        {
          card_profile_id: cardProfile.id,
          freelancer_id: userId,
          name: 'Sophia Patel',
          email: 'sophia@creativehub.com',
          message: 'Are you available for a 3-week design system sprint starting next Monday?',
          status: 'contacted',
          visitor_ip: '127.0.0.1',
          source_utm: { source: 'freelancer-directory' }
        }
      ]);

    if (leadsError) throw leadsError;
    console.log(`[SEEDING] Sample Leads seeded successfully`);
    console.log(`[SEEDING] Completed successfully for ${userId}`);
    
  } catch (err) {
    console.error(`[SEEDING ERROR] Failed to seed demo data:`, err);
    throw err;
  }
}
