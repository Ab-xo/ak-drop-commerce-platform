import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase-admin';
import { getStripeClient } from '@/lib/stripe';
import { sendOrderConfirmationEmail } from '@/lib/order-email';

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!webhookSecret) {
    console.error('Stripe webhook is not configured: STRIPE_WEBHOOK_SECRET is missing.');
    return NextResponse.json({ error: 'Webhook is not configured.' }, { status: 503 });
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing Stripe signature.' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripeClient();
    event = stripe.webhooks.constructEvent(await request.text(), signature, webhookSecret);
  } catch (error) {
    console.error('Stripe webhook signature verification failed:', error);
    return NextResponse.json({ error: 'Invalid webhook signature.' }, { status: 400 });
  }

  if (
    event.type !== 'checkout.session.completed' &&
    event.type !== 'checkout.session.expired'
  ) {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const orderId = session.metadata?.orderId;
  const userId = session.metadata?.userId;
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (
    session.mode !== 'payment' ||
    !orderId ||
    !uuidPattern.test(orderId) ||
    !userId ||
    !uuidPattern.test(userId) ||
    session.client_reference_id !== userId ||
    session.currency !== 'usd' ||
    session.amount_total === null
  ) {
    console.error('Stripe webhook contained incomplete or mismatched Checkout metadata.');
    return NextResponse.json({ error: 'Invalid Checkout session metadata.' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed' && session.payment_status !== 'paid') {
    return NextResponse.json({ received: true });
  }

  const paymentIntentId = typeof session.payment_intent === 'string'
    ? session.payment_intent
    : session.payment_intent?.id ?? null;
  const billingAddress = session.customer_details
    ? {
        name: session.customer_details.name,
        email: session.customer_details.email,
        phone: session.customer_details.phone,
        address: session.customer_details.address,
      }
    : null;

  try {
    const admin = createAdminClient();
    const { error } = await admin.rpc('resolve_stripe_checkout', {
      p_checkout_session_id: session.id,
      p_payment_intent_id: paymentIntentId,
      p_outcome: event.type === 'checkout.session.completed' ? 'paid' : 'cancelled',
      p_billing_address: billingAddress,
      p_amount_total: session.amount_total,
      p_currency: session.currency,
      p_metadata_order_id: orderId,
      p_metadata_user_id: userId,
      p_client_reference_id: session.client_reference_id,
    });

    if (error) {
      console.error('Stripe webhook could not update the order:', error.message);
      return NextResponse.json({ error: 'Unable to update payment status.' }, { status: 500 });
    }

    // Send order confirmation email (best-effort — don't fail webhook if email fails)
    if (event.type === 'checkout.session.completed') {
      try {
        const admin = createAdminClient();
        const { data: order } = await admin
          .from('orders')
          .select('id, order_number, subtotal_amount, currency, shipping_address')
          .eq('id', orderId)
          .maybeSingle();

        const { data: items } = await admin
          .from('order_items')
          .select('product_name, product_sku, quantity, unit_price, size, color')
          .eq('order_id', orderId);

        const { data: profile } = await admin
          .from('user_profiles')
          .select('full_name, email')
          .eq('id', userId)
          .maybeSingle();

        if (order && items?.length && profile?.email) {
          const addr = order.shipping_address as Record<string, string> | null;
          await sendOrderConfirmationEmail({
            orderNumber: order.order_number,
            orderId: order.id,
            customerName: profile.full_name || addr?.full_name || 'Customer',
            customerEmail: profile.email,
            items: items.map((i) => ({
              product_name: i.product_name,
              product_sku: i.product_sku,
              quantity: i.quantity,
              unit_price: Number(i.unit_price),
              size: i.size,
              color: i.color,
            })),
            subtotalEtb: Number(order.subtotal_amount),
            shippingAddress: addr ?? {},
            currency: order.currency,
          });
        }
      } catch (emailError) {
        console.error('Order confirmation email failed (non-fatal):', emailError instanceof Error ? emailError.message : emailError);
      }
    }
  } catch (error) {
    console.error('Stripe webhook processing failed:', error);
    return NextResponse.json({ error: 'Unable to process payment event.' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
