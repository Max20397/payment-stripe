import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-07-30.basil',
});

/**
 * Fetch all customers from Stripe with pagination.
 * @param {number} maxCustomers - Maximum number of customers to fetch.
 * @returns {Promise<Array>} - List of all customers.
 */
async function getAllStripeCustomers(maxCustomers = 1000): Promise<Stripe.Customer[]> {
  try {
    const allCustomers: Stripe.Customer[] = [];
    let hasMore = true;
    let lastCustomerId: string | null = null;
    const limit = 100; // Maximum limit per request

    while (hasMore && allCustomers.length < maxCustomers) {
      const params: Stripe.CustomerListParams = {
        limit,
        ...(lastCustomerId && { starting_after: lastCustomerId }),
      };

      const customerList: Stripe.ApiList<Stripe.Customer> = await stripe.customers.list(params);
      allCustomers.push(...customerList.data);
      hasMore = customerList.has_more;

      if (customerList.data.length > 0) {
        lastCustomerId = customerList.data[customerList.data.length - 1].id;
      } else {
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log(`Fetched ${allCustomers.length} customers from Stripe`);
    return allCustomers;
  } catch (error) {
    console.error('Error fetching all customers from Stripe:', error);
    throw new Error(`Could not fetch all customers: ${(error as Error).message}`);
  }
}

export async function GET(req: NextRequest) {
  try {
    const maxCustomers = parseInt(req.nextUrl.searchParams.get('maxCustomers') || '1000', 10);
    const customers = await getAllStripeCustomers(maxCustomers);

    return NextResponse.json({
      customers,
      totalCount: customers.length,
    });
  } catch (error) {
    console.error('Error in API endpoint:', error);
    return NextResponse.json({ error: 'Failed to fetch all customers' }, { status: 500 });
  }
}
