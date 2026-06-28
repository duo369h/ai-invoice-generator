import { NextResponse } from 'next/server';
import { recordProductAnalyticsEvent } from '../../../lib/product-analytics-server';

function cleanString(value, max = 500) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, max);
}

export async function POST(request) {
  try {
    const body = await request.json();
    const eventName = cleanString(body.event_name || body.event || '', 120);
    const properties = body.properties && typeof body.properties === 'object' ? body.properties : {};

    const result = await recordProductAnalyticsEvent({
      eventName,
      userId: null,
      sessionId: properties.session_id,
      pagePath: properties.page_path,
      pageLocation: properties.page_location,
      source: properties.source,
      properties,
    });

    const status = result.reason === 'invalid_event' ? 400 : 202;
    return NextResponse.json(result, { status });
  } catch (error) {
    console.error('Failed to record product analytics event:', error);
    return NextResponse.json({ error: 'Failed to record product analytics event' }, { status: 500 });
  }
}
