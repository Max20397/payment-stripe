import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-07-30.basil',
});

// Mock database for demonstration purposes
const db = {
  users: {
    findById: async (id: string) => ({
      id,
      email: 'user@example.com',
      name: 'John Doe',
      stripeCustomerId: null as string | null, // Replace with actual data
    }),
    update: async (id: string, data: Record<string, string | null>) => {
      console.log(`User ${id} updated with`, data);
    },
  },
};

export async function POST(req: NextRequest) {
  const { priceId, userId } = await req.json();

  if (!priceId || !userId) {
    return NextResponse.json({ error: 'Missing priceId or userId' }, { status: 400 });
  }

  try {
    // Fetch user from database
    const user = await db.users.findById(userId);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user already has a Stripe Customer ID
    let customerId: string | null = user.stripeCustomerId;

    if (!customerId) {
      // Create a new Stripe Customer
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          userId: user.id.toString(),
        },
      });

      customerId = customer.id;

      // Update user in the database with the new Stripe Customer ID
      await db.users.update(userId, { stripeCustomerId: customerId });
    }

    // Create a Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.DOMAIN}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.DOMAIN}/subscription/canceled`,
      metadata: {
        userId: userId.toString(),
      },
    });

    // Return the Checkout Session URL
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
