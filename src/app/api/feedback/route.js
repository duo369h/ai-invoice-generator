import { NextResponse } from 'next/server';
import { createServiceSupabaseClient, getRequestUser, isSupabaseConfigured } from '../../lib/supabase';
import { sendFeedbackEmail } from '../../lib/email';
import { requireInternalAdmin } from '../../lib/internal-admin';
import { recordProductAnalyticsEvent } from '../../lib/product-analytics-server';

function cleanString(value, max = 1000) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, max);
}

const ALLOWED_CATEGORIES = [
  'Proposal',
  'Invoice',
  'Pricing',
  'Client Portal',
  'Dashboard',
  'AI',
  'Feature Request',
  'Bug'
];

const ALLOWED_PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const ALLOWED_STATUS = ['new', 'reviewing', 'planned', 'resolved', 'closed'];

export async function GET(request) {
  const admin = await requireInternalAdmin(request);
  if (admin.response) return admin.response;

  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ data: [] });
    }
    const supabase = createServiceSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ data: [] });
    }
    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    console.error('Failed to fetch feedback:', error);
    return NextResponse.json({ error: 'Failed to fetch feedback', data: [] }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const context = await getRequestUser(request);
    const message = cleanString(body.message, 2000);
    const category = cleanString(body.category, 100);
    const priority = cleanString(body.priority, 20) || 'medium';
    const status = cleanString(body.status, 20) || 'new';
    const email = cleanString(body.email, 254);
    const pageUrl = cleanString(body.page_url, 1000);
    const source = cleanString(body.source || 'feedback_widget', 120);

    if (!message || message.length < 3) {
      return NextResponse.json({ error: 'Feedback message is required.' }, { status: 400 });
    }

    if (!category || !ALLOWED_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: 'A valid feedback category is required.' }, { status: 400 });
    }
    if (!ALLOWED_PRIORITIES.includes(priority)) {
      return NextResponse.json({ error: 'A valid priority is required.' }, { status: 400 });
    }
    if (!ALLOWED_STATUS.includes(status)) {
      return NextResponse.json({ error: 'A valid status is required.' }, { status: 400 });
    }

    let stored = false;
    let reason = null;

    if (isSupabaseConfigured()) {
      const supabase = createServiceSupabaseClient();
      if (supabase) {
        const payload = {
          user_id: context?.user?.id || null,
          email: email || null,
          category,
          message,
          page_url: pageUrl || null,
          priority,
          status,
          source,
          metadata: {
            plan: cleanString(body.plan, 80) || 'free',
            country: cleanString(body.country, 120)
          }
        };

        const { error } = await supabase.from('feedback').insert(payload);
        if (error?.code === 'PGRST204' || error?.message?.includes('priority') || error?.message?.includes('metadata')) {
          const fallbackPayload = {
            email: email || null,
            category,
            message,
            page_url: pageUrl || null,
            status
          };
          const fallback = await supabase.from('feedback').insert(fallbackPayload);
          if (fallback.error) {
            console.error('Failed to store feedback in Supabase:', fallback.error);
            reason = 'supabase_insert_failed';
          } else {
            stored = true;
            reason = 'feedback_schema_not_applied';
          }
        } else if (error) {
          console.error('Failed to store feedback in Supabase:', error);
          reason = 'supabase_insert_failed';
        } else {
          stored = true;
        }
      } else {
        reason = 'service_role_not_configured';
      }
    } else {
      reason = 'supabase_not_configured';
    }

    // Always attempt to send email notification to support@corvioz.com, regardless of DB storage success
    const timestamp = new Date().toISOString();
    try {
      await sendFeedbackEmail({
        category,
        message,
        pageUrl,
        email,
        timestamp
      });
    } catch (emailErr) {
      console.error('Failed to send feedback email:', emailErr);
    }

    try {
      await recordProductAnalyticsEvent({
        eventName: 'Feedback Submitted',
        userId: context?.user?.id || null,
        pagePath: pageUrl,
        source,
        properties: {
          identity: context?.user?.id || email || 'anonymous',
          user_id: context?.user?.id || null,
          category,
          priority,
          status,
          plan: cleanString(body.plan, 80) || 'free',
          country: cleanString(body.country, 120),
          source,
          timestamp
        }
      });
    } catch (analyticsError) {
      console.error('Failed to record feedback analytics:', analyticsError);
    }

    return NextResponse.json({ stored, reason });
  } catch (error) {
    console.error('Failed to process feedback submission:', error);
    return NextResponse.json({ error: 'Failed to process feedback' }, { status: 500 });
  }
}
