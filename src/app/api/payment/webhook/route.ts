import { NextResponse } from 'next/server';
import { applyPaymentEventToRevenueContext } from '../../../../core/entry/ENTRY_PAYMENT_BRIDGE';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const result = applyPaymentEventToRevenueContext(
    {
      type: body?.type,
      event_type: body?.event_type,
      event: body?.event,
    },
    body?.revenue_context,
  );

  return NextResponse.json({
    received: true,
    ...result,
  }, {
    status: result.processed ? 200 : 202,
  });
}
