import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  ArrowLeft,
  Download,
  PackageOpen,
  Loader2,
  MapPin,
  ShoppingBag,
  Receipt,
  CheckCircle2,
  Truck,
  Clock,
} from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { Order, api, formatCurrency, getAssetUrl } from '../lib/api';
import { escapeHtml } from '../lib/escape-html';

// ─── Status helpers ────────────────────────────────────────────────────────────

function StatusIcon({ status }: { status: Order['status'] }) {
  if (status === 'Delivered') return <CheckCircle2 className="h-5 w-5 text-success" />;
  if (status === 'Shipped') return <Truck className="h-5 w-5 text-primary" />;
  return <Clock className="h-5 w-5 text-warning" />;
}

function statusClass(status: string) {
  if (status === 'Delivered') return 'bg-success text-success-foreground';
  if (status === 'Shipped') return 'bg-primary text-primary-foreground';
  return 'bg-warning text-warning-foreground';
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

// ─── Invoice generator (pure browser, no external deps) ───────────────────────

function generateInvoiceHTML(order: Order): string {
  const logoText = 'SportEquip';
  const orderId = order._id.slice(-8).toUpperCase();
  const orderDate = formatDate(order.createdAt);
  const shipping = order.shippingInfo;

  const itemRows = order.orderItems
    .map(
      (item) => `
        <tr>
          <td style="padding:10px 8px;border-bottom:1px solid #e2e8f0;">${escapeHtml(item.name)}</td>
          <td style="padding:10px 8px;border-bottom:1px solid #e2e8f0;text-align:center;">${escapeHtml(item.quantity)}</td>
          <td style="padding:10px 8px;border-bottom:1px solid #e2e8f0;text-align:right;">₹${escapeHtml(item.price.toLocaleString('en-IN'))}</td>
          <td style="padding:10px 8px;border-bottom:1px solid #e2e8f0;text-align:right;">₹${escapeHtml((item.price * item.quantity).toLocaleString('en-IN'))}</td>
        </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Invoice – ${orderId}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0;}
    body{font-family:'Segoe UI',Arial,sans-serif;color:#0a0a0a;background:#fff;padding:40px;}
    .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:40px;}
    .brand{font-size:28px;font-weight:700;color:#2563eb;letter-spacing:-1px;}
    .brand span{color:#f97316;}
    .invoice-meta{text-align:right;font-size:13px;color:#64748b;}
    .invoice-meta h2{font-size:22px;font-weight:700;color:#0a0a0a;margin-bottom:4px;}
    .section{margin-bottom:28px;}
    .section-title{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#64748b;margin-bottom:10px;}
    .address-box{background:#f8fafc;border-radius:8px;padding:14px 18px;font-size:14px;line-height:1.7;color:#334155;}
    table{width:100%;border-collapse:collapse;font-size:14px;}
    thead th{background:#f1f5f9;padding:10px 8px;text-align:left;font-weight:600;color:#475569;font-size:12px;text-transform:uppercase;letter-spacing:.05em;}
    thead th:not(:first-child){text-align:right;}
    thead th:nth-child(2){text-align:center;}
    .totals{margin-left:auto;margin-top:20px;width:280px;}
    .totals tr td{padding:6px 0;font-size:14px;color:#475569;}
    .totals tr td:last-child{text-align:right;font-weight:500;color:#0a0a0a;}
    .totals .total-row td{font-size:17px;font-weight:700;color:#2563eb;padding-top:12px;border-top:2px solid #2563eb;}
    .badge{display:inline-block;padding:3px 10px;border-radius:100px;font-size:12px;font-weight:600;}
    .badge-processing{background:#fef9c3;color:#854d0e;}
    .badge-shipped{background:#dbeafe;color:#1d4ed8;}
    .badge-delivered{background:#dcfce7;color:#166534;}
    .footer{margin-top:48px;padding-top:20px;border-top:1px solid #e2e8f0;font-size:12px;color:#94a3b8;text-align:center;}
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">Sport<span>Equip</span></div>
      <div style="font-size:13px;color:#64748b;margin-top:4px;">Your premium sports store</div>
    </div>
    <div class="invoice-meta">
      <h2>INVOICE</h2>
      <div>#${orderId}</div>
      <div>${orderDate}</div>
      <div style="margin-top:6px;">
        <span class="badge badge-${order.status.toLowerCase()}">${order.status}</span>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Shipping Address</div>
    <div class="address-box">
      ${escapeHtml(shipping.address)}<br/>
      ${escapeHtml(shipping.city)}, ${escapeHtml(shipping.state)} – ${escapeHtml(shipping.pinCode)}<br/>
      ${escapeHtml(shipping.country)}
    </div>
  </div>

  <div class="section">
    <div class="section-title">Order Items</div>
    <table>
      <thead>
        <tr>
          <th>Product</th>
          <th style="text-align:center;">Qty</th>
          <th style="text-align:right;">Unit Price</th>
          <th style="text-align:right;">Total</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>
  </div>

  <table class="totals">
    <tr><td>Subtotal</td><td>₹${order.subtotal.toLocaleString('en-IN')}</td></tr>
    <tr><td>Tax (GST)</td><td>₹${order.tax.toLocaleString('en-IN')}</td></tr>
    <tr><td>Shipping</td><td>₹${order.shippingCharges.toLocaleString('en-IN')}</td></tr>
    ${order.discount > 0 ? `<tr><td>Discount</td><td style="color:#16a34a;">–₹${order.discount.toLocaleString('en-IN')}</td></tr>` : ''}
    <tr class="total-row"><td>Grand Total</td><td>₹${order.total.toLocaleString('en-IN')}</td></tr>
  </table>

  <div class="footer">
    Thank you for shopping with SportEquip! For support, contact support@sportequip.in<br/>
    This is a computer-generated invoice and does not require a signature.
  </div>
</body>
</html>`;
}

function downloadInvoice(order: Order) {
  const html = generateInvoiceHTML(order);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const printWin = window.open(url, '_blank', 'width=900,height=700');
  if (printWin) {
    printWin.addEventListener('load', () => {
      printWin.print();
      URL.revokeObjectURL(url);
    });
  } else {
    // Fallback: direct download as .html
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${order._id.slice(-8).toUpperCase()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function OrderDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    setError('');

    api
      .getOrder(id)
      .then(({ order }) => setOrder(order))
      .catch((err) =>
        setError(err instanceof Error ? err.message : 'Could not load order details.')
      )
      .finally(() => setIsLoading(false));
  }, [id]);

  // ── Loading state ────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <main className="flex-1 container mx-auto px-4 py-16 flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium">Loading order details…</p>
      </main>
    );
  }

  // ── Error state ──────────────────────────────────────────────────────────────
  if (error || !order) {
    return (
      <main className="flex-1 container mx-auto px-4 py-16">
        <Card className="border-destructive/30 bg-destructive/5 max-w-md mx-auto">
          <CardContent className="flex flex-col items-center p-8 text-center gap-4">
            <PackageOpen className="h-12 w-12 text-destructive" />
            <p className="text-destructive font-medium">{error || 'Order not found.'}</p>
            <Button variant="outline" onClick={() => navigate('/orders')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to My Orders
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const totalQty = order.orderItems.reduce((s, i) => s + i.quantity, 0);
  const orderId = order._id.slice(-8).toUpperCase();

  return (
    <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
      {/* ── Top bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <Button
            variant="ghost"
            size="sm"
            className="mb-2 -ml-2 text-muted-foreground hover:text-foreground"
            onClick={() => navigate('/orders')}
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back to My Orders
          </Button>
          <h1 className="flex items-center gap-3">
            <ShoppingBag className="h-6 w-6 text-primary" />
            Order #{orderId}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Placed on {formatDate(order.createdAt)} · {totalQty} item{totalQty !== 1 ? 's' : ''}
          </p>
        </div>

        <Button
          onClick={() => downloadInvoice(order)}
          className="bg-gradient-to-r from-primary to-accent hover:opacity-90 shrink-0 gap-2"
        >
          <Download className="h-4 w-4" />
          Download Invoice
        </Button>
      </div>

      <div className="grid gap-6" ref={invoiceRef}>
        {/* ── Status banner ── */}
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-primary to-accent" />
          <CardContent className="flex items-center gap-3 p-5">
            <StatusIcon status={order.status} />
            <div className="flex-1">
              <p className="font-semibold text-sm">Order Status</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {order.status === 'Processing' && 'Your order is being processed and will be shipped soon.'}
                {order.status === 'Shipped' && 'Your order is on its way! Track it with the details below.'}
                {order.status === 'Delivered' && 'Your order has been delivered. Enjoy your purchase!'}
              </p>
            </div>
            <Badge className={`${statusClass(order.status)} border-0 text-sm px-3 py-1`}>
              {order.status}
            </Badge>
          </CardContent>
        </Card>

        {/* ── Order items ── */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShoppingBag className="h-4 w-4 text-primary" />
              Order Items
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="pl-6">Product</TableHead>
                  <TableHead className="text-center">Qty</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right pr-6">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.orderItems.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-3">
                        <img
                          src={getAssetUrl(item.photo, item.name)}
                          alt={item.name}
                          className="h-12 w-12 object-cover rounded-lg border bg-muted flex-shrink-0"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src =
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&background=e2e8f0&color=64748b&size=48`;
                          }}
                        />
                        <div>
                          <p className="font-medium text-sm">{item.name}</p>
                          <p className="text-xs text-muted-foreground">ID: {item.productId}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-medium">{item.quantity}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                    <TableCell className="text-right pr-6 font-semibold">
                      {formatCurrency(item.price * item.quantity)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* ── Shipping info ── */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="h-4 w-4 text-primary" />
                Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 text-sm">
              <p className="font-medium">{order.shippingInfo.address}</p>
              <p className="text-muted-foreground">
                {order.shippingInfo.city}, {order.shippingInfo.state} – {order.shippingInfo.pinCode}
              </p>
              <p className="text-muted-foreground">{order.shippingInfo.country}</p>
            </CardContent>
          </Card>

          {/* ── Pricing breakdown ── */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Receipt className="h-4 w-4 text-primary" />
                Price Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax (GST)</span>
                <span>{formatCurrency(order.tax)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span>
                  {order.shippingCharges === 0 ? (
                    <span className="text-success font-medium">Free</span>
                  ) : (
                    formatCurrency(order.shippingCharges)
                  )}
                </span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-success">
                  <span>Discount</span>
                  <span>– {formatCurrency(order.discount)}</span>
                </div>
              )}
              <Separator className="my-2" />
              <div className="flex justify-between font-bold text-base">
                <span>Total Paid</span>
                <span className="text-primary">{formatCurrency(order.total)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
