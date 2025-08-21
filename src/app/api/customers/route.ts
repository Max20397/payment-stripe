import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-07-30.basil',
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const email = searchParams.get('email');
  const created = searchParams.get('created') ? parseInt(searchParams.get('created') || '', 10) : undefined;
  const startingAfter = searchParams.get('starting_after');
  const endingBefore = searchParams.get('ending_before');

  try {
    const params: Stripe.CustomerListParams = {
      limit,
      expand: ['data.subscriptions'],
    };

    if (email) params.email = email;
    if (created) params.created = created;
    if (startingAfter) params.starting_after = startingAfter;
    if (endingBefore) params.ending_before = endingBefore;

    const customers = await stripe.customers.list(params);

    return NextResponse.json({
      customers: customers.data,
      hasMore: customers.has_more,
      totalCount: customers.data.length,
      lastId: customers.data.length > 0 ? customers.data[customers.data.length - 1].id : null,
    });
  } catch (error) {
    console.error('Error fetching Stripe customers:', error);
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
  }
}
