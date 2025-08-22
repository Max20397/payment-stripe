import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import fs from 'fs';
import path from 'path';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2025-07-30.basil', 
});

async function getRawBody(req: Request): Promise<string> {
  const text = await req.text();
  return text;
}

export async function POST(req: Request) {
  try {
    const body = await getRawBody(req);
    const headersList = await headers();
    const sig = headersList.get('stripe-signature') as string;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET as string
      );
    } catch (err) {
      console.error(`⚠️ Webhook signature verification failed: ${(err as Error).message}`);
      return NextResponse.json({ error: (err as Error).message }, { status: 400 });
    }

    // Ensure the logs directory exists
    const logsDir = path.resolve(process.cwd(), 'src/logs'); // Update path to src/logs within the project
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    // Log the event to a file
    const logFilePath = path.join(logsDir, 'webhook-events.log');
    const customerId = (event.data.object as Stripe.Customer)?.id || 'N/A'; // Extract customer ID if available
    const logEntry = `${new Date().toISOString()} - Event: ${event.type} - ID: ${event.id} - Customer ID: ${customerId}\n`;

    try {
      fs.appendFileSync(logFilePath, logEntry);
    } catch (err) {
      if (err instanceof Error) {
        console.error(`Failed to write to log file: ${err.message}`);
      } else {
        console.error('Failed to write to log file: Unknown error');
      }
    }

    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session);
        break;

      case 'customer.subscription.created':
        const newSubscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCreated(newSubscription);
        break;

      case 'customer.subscription.updated':
        const updatedSubscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(updatedSubscription);
        break;

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(deletedSubscription);
        break;

      case 'invoice.payment_succeeded':
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentSucceeded(invoice);
        break;

      case 'invoice.payment_failed':
        const failedInvoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(failedInvoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Trả về thành công cho Stripe
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// IMPORTANT: Next.js Route Handlers mặc định là Edge Runtime
// Nếu bạn cần sử dụng Node.js APIs hoặc tính năng không hỗ trợ trong Edge,
// thì cần khai báo runtime
export const config = {
  runtime: 'nodejs',
};

// Các hàm xử lý sự kiện
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  if (!session.subscription) return;

  try {
    console.log(`Checkout completed for session: ${session.id}`);

    // Lấy subscription ID và customer ID từ session
    const subscriptionId = session.subscription as string;

    // Lấy thông tin chi tiết về subscription
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    // Lấy user ID từ metadata (nếu có)
    const userId = session.metadata?.userId;

    if (userId) {
      // Tạo record subscription trong database của bạn
      // Ví dụ với Prisma:
      // await prisma.subscription.create({
      //   data: {
      //     userId: userId,
      //     stripeCustomerId: customerId,
      //     stripeSubscriptionId: subscriptionId,
      //     stripePriceId: subscription.items.data[0].price.id,
      //     status: subscription.status,
      //     currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      //   }
      // });

      // Hoặc với mongoose:
      // await SubscriptionModel.create({
      //   userId,
      //   stripeCustomerId: customerId,
      //   stripeSubscriptionId: subscriptionId,
      //   stripePriceId: subscription.items.data[0].price.id,
      //   status: subscription.status,
      //   currentPeriodEnd: new Date(subscription.current_period_end * 1000)
      // });

      // Cấp quyền truy cập cho user
      if (subscription.status === 'active' || subscription.status === 'trialing') {
        await grantSubscriptionAccess(userId, subscription.items.data[0].price.id);
      }
    }
  } catch (error) {
    console.error('Error handling checkout completion:', error);
    // Chỉ ghi log lỗi, không throw để không gây lỗi webhook
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    console.log(`Subscription updated: ${subscription.id}`);

    // Tìm subscription trong database của bạn
    // Ví dụ với Prisma:
    // const dbSubscription = await prisma.subscription.findFirst({
    //   where: { stripeSubscriptionId: subscription.id }
    // });
    //
    // if (dbSubscription) {
    //   // Cập nhật trạng thái
    //   await prisma.subscription.update({
    //     where: { id: dbSubscription.id },
    //     data: {
    //       status: subscription.status,
    //       currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    //       cancelAtPeriodEnd: subscription.cancel_at_period_end
    //     }
    //   });
    //   // Cập nhật quyền truy cập
    //   if (subscription.status === 'active' || subscription.status === 'trialing') {
    //     await grantSubscriptionAccess(dbSubscription.userId, subscription.items.data[0].price.id);
    //   } else if (['canceled', 'unpaid', 'incomplete_expired'].includes(subscription.status)) {
    //     await revokeSubscriptionAccess(dbSubscription.userId);
    //   }
    // }
  } catch (error) {
    console.error('Error handling subscription update:', error);
  }
}

// Hàm cấp quyền truy cập
async function grantSubscriptionAccess(userId: string, priceId: string) {
  // Implement logic to grant access based on subscription
  // Ví dụ:
  // await prisma.user.update({
  //   where: { id: userId },
  //   data: { 
  //     subscriptionStatus: 'active',
  //     role: 'premium'
  //   }
  // });
  
  console.log(`Granted access for user ${userId} with price ${priceId}`);
}

// Các hàm xử lý sự kiện khác tương tự...
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log(`New subscription created: ${subscription.id}`);
  // Implement your logic
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log(`Subscription deleted: ${subscription.id}`);
  // Implement your logic
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log(`Payment succeeded for invoice: ${invoice.id}`);
  // Implement your logic
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log(`Payment failed for invoice: ${invoice.id}`);
  // Implement your logic
}