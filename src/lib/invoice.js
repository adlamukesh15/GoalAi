import { formatINR, usdToInr } from './currency.js';

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
}

function dateLabel(value) {
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(value));
}

export function createInvoiceHtml(order) {
  const rate = Number(order.exchangeRate) || 1;
  const rows = order.items.map(({ product, quantity }) => {
    const unit = formatINR(usdToInr(product.price, rate));
    const line = formatINR(usdToInr(product.price * quantity, rate));
    return `<tr><td>${escapeHtml(product.title)}</td><td>${quantity}</td><td>${unit}</td><td>${line}</td></tr>`;
  }).join('');
  const total = formatINR(usdToInr(order.total, rate));
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>GoalAI demo invoice ${escapeHtml(order.id)}</title>
<style>
:root{font-family:Arial,sans-serif;color:#243127;background:#f5f5ef}body{margin:0;padding:32px}.invoice{max-width:760px;margin:auto;padding:40px;background:#fffefa;border:1px solid #e2e4dc;border-radius:8px}.top{display:flex;justify-content:space-between;gap:20px;align-items:flex-start;border-bottom:1px solid #dfe3d9;padding-bottom:24px}.brand{font-size:22px;font-weight:700}.brand span{font-weight:400;color:#728565}.muted{color:#748073;font-size:13px;line-height:1.6}.meta{margin:26px 0;display:grid;grid-template-columns:1fr 1fr;gap:20px}.meta strong{display:block;margin-bottom:8px}table{width:100%;border-collapse:collapse;font-size:13px}th,td{padding:12px 8px;border-bottom:1px solid #e5e7df;text-align:left}th{color:#667261;font-size:11px;text-transform:uppercase;letter-spacing:.08em}.total{text-align:right;font-size:18px;font-weight:700;margin-top:20px}.notice{padding:12px 14px;margin-top:25px;background:#f1f4e8;border-radius:5px;color:#6b7765;font-size:12px;line-height:1.5}@media(max-width:600px){body{padding:12px}.invoice{padding:20px}.top{display:block}.meta{grid-template-columns:1fr}table{font-size:11px}th,td{padding:8px 4px}}
</style>
</head>
<body>
<main class="invoice">
<header class="top"><div><div class="brand">Goal<span>AI</span></div><p class="muted">A demo order invoice · No payment processed</p></div><div><strong>ORDER INVOICE</strong><p class="muted">Order ${escapeHtml(order.id)}<br>Placed ${dateLabel(order.orderDate)}</p></div></header>
<section class="meta"><div><strong>Deliver to</strong><div>${escapeHtml(order.name)}<br>${escapeHtml(order.email)}<br>${escapeHtml(order.shippingAddress)}</div></div><div><strong>Order details</strong><div>Payment: ${escapeHtml(order.paymentMethod)}<br>Status: ${escapeHtml(order.status)}<br>Expected delivery: ${dateLabel(order.expectedDeliveryDate)}</div></div></section>
<table><thead><tr><th>Product</th><th>Qty</th><th>Unit price</th><th>Line total</th></tr></thead><tbody>${rows}</tbody></table>
<div class="total">Order total: ${total}</div>
<p class="muted">Sample USD catalog prices are shown as INR reference conversions at ₹${rate.toFixed(2)} per USD. This document is a frontend demo invoice, not a tax invoice or proof of payment.</p>
<div class="notice">GoalAI demo only: no payment was taken, no real fulfillment was requested, and this invoice is generated entirely in your browser.</div>
</main>
</body>
</html>`;
}

export function downloadInvoice(order) {
  const blob = new Blob([createInvoiceHtml(order)], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `goalai-invoice-${order.id}.html`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
