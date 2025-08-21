import { NextResponse } from 'next/server'
import Stripe from 'stripe'

export const runtime = 'nodejs' 

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
})

export async function POST(req: Request) {
  try {
    const { priceId, email } = await req.json()

    if (!priceId) {
      return NextResponse.json({ error: 'Price ID is required' }, { status: 400 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.DOMAIN
    if (!baseUrl) {
      return NextResponse.json({ error: 'Missing NEXT_PUBLIC_BASE_URL/DOMAIN' }, { status: 500 })
    }

    const session = await stripe.checkout.sessions.create(
      {
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${baseUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/subscription/canceled`,
        ...(email ? { customer_email: email } : {}),
        metadata: { source: 'website' },
      },
      {
        idempotencyKey: `create_session_${priceId}_${Date.now()}`,
      }
    )

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (err) {
    console.error('Error creating checkout session:', err)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
