import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-07-30.basil',
});

/**
 * Tạo subscription cho customer với price đã chọn
 * @param {string} customerId - Stripe Customer ID
 * @param {string} priceId - Stripe Price ID
 * @param {Object} options - Các tùy chọn bổ sung
 * @returns {Object} - Subscription object được tạo
 */
async function createSubscription(customerId: string, priceId: string, options: {
  paymentBehavior?: Stripe.SubscriptionCreateParams.PaymentBehavior;
  metadata?: Stripe.MetadataParam;
  trialPeriodDays?: number;
  billingCycleAnchor?: number;
  prorationBehavior?: Stripe.SubscriptionCreateParams.ProrationBehavior;
  promotionCode?: string;
  coupon?: string;
  taxRates?: string[];
} = {}) {
  try {
    // Tham số cơ bản cho subscription
    const subscriptionParams: Stripe.SubscriptionCreateParams = {
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: options.paymentBehavior || 'default_incomplete',
      expand: ['latest_invoice.payment_intent', 'customer'],
      metadata: options.metadata || {}
    };

    // Thêm các tùy chọn bổ sung
    if (options.trialPeriodDays) {
      subscriptionParams.trial_period_days = options.trialPeriodDays;
    }

    if (options.billingCycleAnchor) {
      subscriptionParams.billing_cycle_anchor = options.billingCycleAnchor;
      subscriptionParams.proration_behavior = options.prorationBehavior || 'create_prorations';
    }


    if (options.taxRates) {
      subscriptionParams.default_tax_rates = options.taxRates;
    }

    // Tạo subscription
    const subscription = await stripe.subscriptions.create(subscriptionParams);

    console.log(`Subscription ${subscription.id} created for customer ${customerId}`);
    return subscription;
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw new Error(`Could not create subscription: ${(error as Error).message}`);
  }
}

// API endpoint để tạo subscription
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      customerId, 
      priceId, 
      trialPeriodDays, 
      metadata,
      couponCode 
    }: {
      customerId: string;
      priceId: string;
      trialPeriodDays?: number;
      metadata?: Stripe.MetadataParam;
      couponCode?: string;
    } = body;

    // Validate input
    if (!customerId || !priceId) {
      return NextResponse.json({ 
        error: 'Customer ID và Price ID là bắt buộc' 
      }, { status: 400 });
    }

    // Nếu có mã giảm giá, xác thực trước
    let coupon = null;
    if (couponCode) {
      try {
        coupon = await stripe.coupons.retrieve(couponCode);
      } catch {
        return NextResponse.json({ 
          error: 'Mã giảm giá không hợp lệ hoặc đã hết hạn' 
        }, { status: 400 });
      }
    }

    // Tạo subscription
    const subscription = await createSubscription(customerId, priceId, {
      trialPeriodDays,
      metadata,
      coupon: coupon ? coupon.id : undefined,
      paymentBehavior: 'default_incomplete' // Để bắt đầu trong trạng thái incomplete
    });

    // Trả về kết quả với clientSecret để xác thực thanh toán nếu cần
    const latestInvoice = subscription.latest_invoice as (Stripe.Invoice & { payment_intent?: Stripe.PaymentIntent });
    return NextResponse.json({
      subscriptionId: subscription.id,
      status: subscription.status,
      clientSecret: latestInvoice.payment_intent?.client_secret,
      invoiceUrl: latestInvoice.hosted_invoice_url
    });
  } catch (error) {
    console.error('Error in create subscription API:', error);
    return NextResponse.json({ 
      error: 'Đã xảy ra lỗi khi tạo subscription' 
    }, { status: 500 });
  }
}
