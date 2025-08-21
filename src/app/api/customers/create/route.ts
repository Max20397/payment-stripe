import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-07-30.basil',
});

// Mock database for demonstration purposes
interface User {
  id: string;
  email: string;
  name: string;
  stripeCustomerId: string | null;
  phone?: string;
  address?: {
    street: string;
    city: string;
    zip: string;
    country: string;
  };
}

const db = {
  users: {
    findById: async (id: string): Promise<User> => ({
      id,
      email: 'user@example.com',
      name: 'John Doe',
      stripeCustomerId: null,
      phone: '123456789',
      address: {
        street: '123 Main St',
        city: 'Hometown',
        zip: '12345',
        country: 'US',
      },
    }),
    update: async (id: string, data: Record<string, string | null>) => {
      console.log(`User ${id} updated with`, data);
    },
  },
};

async function getOrCreateStripeCustomer(user: User): Promise<string> {
  try {
    if (user.stripeCustomerId) {
      try {
        const customer = await stripe.customers.retrieve(user.stripeCustomerId);
        if ((customer as Stripe.DeletedCustomer).deleted) {
          throw new Error('Customer has been deleted');
        }
        return customer.id;
      } catch {
        console.log(`Invalid customer ID for user ${user.id}, creating a new one...`);
      }
    }

    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      phone: user.phone,
      address: user.address
        ? {
            line1: user.address.street,
            city: user.address.city,
            postal_code: user.address.zip,
            country: user.address.country,
          }
        : undefined,
      metadata: {
        userId: user.id.toString(),
        createdAt: new Date().toISOString(),
        source: 'your_application_name',
      },
      description: `User ${user.id} - ${user.email}`,
    });

    await db.users.update(user.id, { stripeCustomerId: customer.id });

    return customer.id;
  } catch (error) {
    console.error('Error creating Stripe Customer:', error);
    throw new Error(`Unable to create Stripe Customer: ${(error as Error).message}`);
  }
}

export async function POST(req: NextRequest) {
  const { userId } = await req.json();

  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
  }

  try {
    const user = await db.users.findById(userId);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const customerId = await getOrCreateStripeCustomer(user);

    return NextResponse.json({ customerId });
  } catch (error) {
    console.error('Error in create-customer API:', error);
    return NextResponse.json({ error: 'Failed to create or retrieve customer' }, { status: 500 });
  }
}
