import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, ArrowRight, Package, Search, SlidersHorizontal } from 'lucide-react';
import AdminWorkspace from '@/components/admin/AdminWorkspace';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getServerVerifiedAdmin } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase-admin';

const pageSize = 20;
const orderStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'] as const;
type OrderStatus = typeof orderStatuses[number];

function pageNumber(value: string | string[] | undefined) {
  const parsed = Number(Array.isArray(value) ? value[0] : value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 1;
}

function fmt(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency: currency.toUpperCase(), maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency.toUpperCase()} ${amount.toLocaleString('en-US')}`;
  }
}

function PaymentBadge({ status }: { status: string }) {
  if (status === 'paid') return <Badge variant="success"><span className="mr-1 size-1.5 rounded-full bg-emerald-500 inline-block" />Paid</Badge>;
  if (status === 'failed') return <Badge variant="destructive">Failed</Badge>;
  if (status === 'refunded') return <Badge variant="warning">Refunded</Badge>;
  return <Badge variant="secondary" className="capitalize">{status}</Badge>;
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'delivered') return <Badge variant="success">Delivered</Badge>;
  if (status === 'shipped') return <Badge variant="info">Shipped</Badge>;
  if (status === 'processing') return <Badge variant="purple">Processing</Badge>;
  if (status === 'pending') return <Badge variant="warning">Pending</Badge>;
  if (status === 'cancelled') return <Badge variant="destructive">Cancelled</Badge>;
  return <Badge variant="secondary" className="capitalize">{status}</Badge>;
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const [params, adminUser] = await Promise.all([searchParams, getServerVerifiedAdmin()]);
  if (!adminUser) notFound();

  const { status: reqStatus, q: reqQuery, page: reqPage } = params;
  const status = typeof reqStatus === 'string' && orderStatuses.includes(reqStatus as OrderStatus) ? reqStatus : '';
  const query = (typeof reqQuery === 'string' ? reqQuery : '').trim().slice(0, 80);
  const reqPageNum = pageNumber(reqPage);

  const admin = createAdminClient();
  let ordersQuery = admin
    .from('orders')
    .select(
      'id, order_number, user_id, status, payment_status, total_amount, currency, created_at, shipping_address',
      { count: 'exact' },
    )
    .order('created_at', { ascending: false });

  if (status) ordersQuery = ordersQuery.eq('status', status);
  if (query) ordersQuery = ordersQuery.ilike('order_number', `%${query.replace(/[\\%_]/g, '\\$&')}%`);

  const [ordersResult, allOrdersCountResult, statusCountResults] = await Promise.all([
    ordersQuery.range(
      (reqPageNum - 1) * pageSize,
      reqPageNum * pageSize - 1,
    ),
    admin.from('orders').select('id', { count: 'exact', head: true }),
    Promise.all(orderStatuses.map((orderStatus) =>
      admin.from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('status', orderStatus),
    )),
  ]);
  const { data: orders, count, error } = ordersResult;
  if (error) throw new Error('Unable to load the order queue.');
  if (allOrdersCountResult.error) {
    console.error('Admin all-orders count failed:', allOrdersCountResult.error.message);
    throw new Error('Unable to load order totals.');
  }
  statusCountResults.forEach((result, index) => {
    if (result.error) {
      console.error(`Admin order ${orderStatuses[index]} count failed:`, result.error.message);
      throw new Error('Unable to load order status counts.');
    }
  });

  const orderRows = orders ?? [];
  const customerIds = [...new Set(orderRows.flatMap((o) => (o.user_id ? [o.user_id] : [])))];
  const { data: profiles, error: profilesError } = customerIds.length
    ? await admin.from('user_profiles').select('id, full_name, email').in('id', customerIds)
    : { data: [], error: null };
  if (profilesError) {
    console.error('Admin order customer lookup failed:', profilesError.message);
    throw new Error('Unable to load order customers.');
  }

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / pageSize));
  const currentPage = Math.min(reqPageNum, totalPages);

  function pageUrl(page: number) {
    const p = new URLSearchParams();
    if (status) p.set('status', status);
    if (query) p.set('q', query);
    p.set('page', String(page));
    return `/admin/orders?${p.toString()}`;
  }
  if (count && currentPage !== reqPageNum) redirect(pageUrl(currentPage));

  // Page numbers to show (up to 5)
  const pagesToShow: number[] = [];
  const half = 2;
  let start = Math.max(1, currentPage - half);
  let end = Math.min(totalPages, currentPage + half);
  if (end - start < 4) {
    if (start === 1) end = Math.min(totalPages, start + 4);
    else start = Math.max(1, end - 4);
  }
  for (let i = start; i <= end; i++) pagesToShow.push(i);

  // Use exact database counts rather than downloading a capped set of every order.
  const statusCounts = Object.fromEntries(
    statusCountResults.map((result, index) => [orderStatuses[index], result.count ?? 0]),
  ) as Record<OrderStatus, number>;

  return (
    <AdminWorkspace email={adminUser.email ?? 'Authorized staff'} activePage="orders">
      {/* Header */}
      <div className="mb-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Store operations</p>
        <h1 className="mt-1 text-3xl font-black tracking-tight">Orders</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Review payment state and move paid orders through fulfillment.
        </p>
      </div>

      {/* Status quick-filter pills */}
      <div className="mb-4 flex flex-wrap gap-2">
        <Link
          href="/admin/orders"
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition
            ${!status ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'}`}
        >
          All
          <span className="rounded-full bg-primary-foreground/20 px-1.5 py-0.5 text-[10px] font-bold">{allOrdersCountResult.count ?? 0}</span>
        </Link>
        {orderStatuses.map((s) => (
          <Link
            key={s}
            href={`/admin/orders?status=${s}`}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold capitalize transition
              ${status === s ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'}`}
          >
            {s}
            {statusCounts?.[s] != null && (
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${status === s ? 'bg-primary-foreground/20' : 'bg-secondary'}`}>
                {statusCounts[s]}
              </span>
            )}
          </Link>
        ))}
      </div>

      {/* Search bar */}
      <form method="get" className="mb-5 flex gap-3">
        {status && <input type="hidden" name="status" value={status} />}
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            name="q"
            defaultValue={query}
            maxLength={80}
            placeholder="Search by order number…"
            className="w-full rounded-xl border border-input bg-card pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
        </div>
        <Button type="submit" variant="outline" size="default">
          <SlidersHorizontal size={15} /> Search
        </Button>
      </form>

      {/* Table card */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <p className="text-sm font-bold">
            {(count ?? 0).toLocaleString()} {status ? `${status} ` : ''}order{(count ?? 0) !== 1 ? 's' : ''}
          </p>
          <p className="text-xs text-muted-foreground">Page {currentPage} of {totalPages}</p>
        </div>

        {orderRows.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[52rem] text-left text-sm">
              <thead className="bg-secondary/40 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                <tr>
                  <th className="px-5 py-3.5 font-bold">Order</th>
                  <th className="px-4 py-3.5 font-bold">Customer</th>
                  <th className="px-4 py-3.5 font-bold">Date</th>
                  <th className="px-4 py-3.5 font-bold">Payment</th>
                  <th className="px-4 py-3.5 font-bold">Status</th>
                  <th className="px-5 py-3.5 text-right font-bold">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orderRows.map((order) => {
                  const profile = order.user_id ? profileById.get(order.user_id) : null;
                  const addr = order.shipping_address && typeof order.shipping_address === 'object'
                    ? order.shipping_address as Record<string, unknown> : {};
                  const email = profile?.email ?? (typeof addr.email === 'string' ? addr.email : '');
                  const name = profile?.full_name ?? (typeof addr.full_name === 'string' ? addr.full_name : 'Customer');
                  return (
                    <tr
                      key={order.id}
                      className="group transition-colors hover:bg-secondary/30"
                    >
                      <td className="px-5 py-4">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="font-bold text-foreground hover:text-primary transition-colors"
                        >
                          #{order.order_number}
                        </Link>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-medium">{name}</p>
                        {email && <p className="text-xs text-muted-foreground truncate max-w-[160px]">{email}</p>}
                      </td>
                      <td className="px-4 py-4 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-4">
                        <PaymentBadge status={order.payment_status} />
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-5 py-4 text-right text-sm font-bold tabular-nums">
                        {fmt(Number(order.total_amount), order.currency || 'ETB')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <span className="mb-4 rounded-2xl border border-border bg-secondary/60 p-4 text-muted-foreground">
              <Package size={24} />
            </span>
            <p className="font-bold">No orders found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {query ? 'No orders match that search.' : status ? `No ${status} orders.` : 'Orders will appear here once customers check out.'}
            </p>
            {(query || status) && (
              <Link href="/admin/orders" className="mt-4 text-sm font-semibold text-primary hover:underline">Clear filters</Link>
            )}
          </div>
        )}

        {/* Pagination */}
        <nav
          aria-label="Order pages"
          className="flex items-center justify-between border-t border-border px-5 py-4"
        >
          <Link
            aria-disabled={currentPage <= 1}
            href={pageUrl(Math.max(1, currentPage - 1))}
            className={`inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold transition
              ${currentPage <= 1 ? 'pointer-events-none opacity-40' : 'hover:border-primary/40 hover:text-primary'}`}
          >
            <ArrowLeft size={13} /> Previous
          </Link>

          <div className="flex items-center gap-1">
            {start > 1 && (
              <>
                <Link href={pageUrl(1)} className="flex size-8 items-center justify-center rounded-lg text-xs font-semibold text-muted-foreground hover:bg-secondary">1</Link>
                {start > 2 && <span className="px-1 text-xs text-muted-foreground">…</span>}
              </>
            )}
            {pagesToShow.map((p) => (
              <Link
                key={p}
                href={pageUrl(p)}
                className={`flex size-8 items-center justify-center rounded-lg text-xs font-semibold transition
                  ${p === currentPage ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}
              >
                {p}
              </Link>
            ))}
            {end < totalPages && (
              <>
                {end < totalPages - 1 && <span className="px-1 text-xs text-muted-foreground">…</span>}
                <Link href={pageUrl(totalPages)} className="flex size-8 items-center justify-center rounded-lg text-xs font-semibold text-muted-foreground hover:bg-secondary">{totalPages}</Link>
              </>
            )}
          </div>

          <Link
            aria-disabled={currentPage >= totalPages}
            href={pageUrl(Math.min(totalPages, currentPage + 1))}
            className={`inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold transition
              ${currentPage >= totalPages ? 'pointer-events-none opacity-40' : 'hover:border-primary/40 hover:text-primary'}`}
          >
            Next <ArrowRight size={13} />
          </Link>
        </nav>
      </div>
    </AdminWorkspace>
  );
}
