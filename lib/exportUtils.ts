import { Order } from '@/types';

export function exportOrdersToCSV(orders: Order[]) {
  const headers = [
    'Order Number', 'Date', 'Customer Name',
    'Customer Email', 'Customer Phone',
    'Status', 'Payment Status', 'Payment Method',
    'Subtotal', 'Shipping Fee', 'Discount', 'Total',
    'City', 'State', 'Items'
  ];

  const rows = orders.map(order => [
    order.orderNumber,
    new Date(order.createdAt).toLocaleDateString('en-NG'),
    order.customerName,
    order.customerEmail,
    order.customerPhone,
    order.status,
    order.paymentStatus,
    order.paymentMethod,
    order.subtotal,
    order.shippingFee,
    order.discount,
    order.total,
    order.shippingAddress?.city ?? '',
    order.shippingAddress?.state ?? '',
    order.items.map(i =>
      `${i.productName} x${i.quantity}`
    ).join(' | ')
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row =>
      row.map(cell =>
        typeof cell === 'string' && cell.includes(',')
          ? `"${cell}"`
          : cell
      ).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], {
    type: 'text/csv;charset=utf-8;'
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `vendify-orders-${
    new Date().toISOString().split('T')[0]
  }.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportOrderToPrint(order: Order) {
  const items = order.items.map(item => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #eee">
        ${item.productName}
        ${item.variantInfo
          ? `<br><small>${item.variantInfo}</small>`
          : ''}
      </td>
      <td style="padding:8px;border-bottom:1px solid #eee;
        text-align:center">${item.quantity}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;
        text-align:right">
        ₦${item.unitPrice.toLocaleString()}
      </td>
      <td style="padding:8px;border-bottom:1px solid #eee;
        text-align:right">
        ₦${item.totalPrice.toLocaleString()}
      </td>
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Invoice - ${order.orderNumber}</title>
      <style>
        body { font-family: Arial, sans-serif;
          max-width: 800px; margin: 40px auto;
          padding: 0 20px; color: #333; }
        .header { display: flex; justify-content: space-between;
          margin-bottom: 40px; }
        .logo { font-size: 28px; font-weight: 800;
          color: #7c3aed; }
        .invoice-title { font-size: 14px; color: #666; }
        .order-number { font-size: 24px; font-weight: bold; }
        .section { margin-bottom: 24px; }
        .section-title { font-size: 12px; font-weight: bold;
          text-transform: uppercase; color: #666;
          margin-bottom: 8px; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #f5f5f5; padding: 10px 8px;
          text-align: left; font-size: 12px; }
        .totals { margin-top: 16px; }
        .total-row { display: flex;
          justify-content: space-between;
          padding: 6px 0; font-size: 14px; }
        .grand-total { font-size: 18px; font-weight: bold;
          color: #7c3aed; border-top: 2px solid #eee;
          padding-top: 12px; margin-top: 8px; }
        .footer { margin-top: 40px; padding-top: 20px;
          border-top: 1px solid #eee; color: #999;
          font-size: 12px; text-align: center; }
        @media print { button { display: none; } }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="logo">Vendify</div>
          <div class="invoice-title">INVOICE</div>
        </div>
        <div style="text-align:right">
          <div class="order-number">
            ${order.orderNumber}
          </div>
          <div style="color:#666;font-size:14px;margin-top:4px">
            ${new Date(order.createdAt)
              .toLocaleDateString('en-NG', {
                day: 'numeric', month: 'long', year: 'numeric'
              })}
          </div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;
        gap:24px;margin-bottom:32px">
        <div class="section">
          <div class="section-title">Bill To</div>
          <strong>${order.customerName}</strong><br>
          ${order.customerEmail}<br>
          ${order.customerPhone}
        </div>
        <div class="section">
          <div class="section-title">Ship To</div>
          ${order.shippingAddress.fullName}<br>
          ${order.shippingAddress.addressLine1}<br>
          ${order.shippingAddress.city},
          ${order.shippingAddress.state}<br>
          ${order.shippingAddress.country}
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th style="text-align:center">Qty</th>
            <th style="text-align:right">Unit Price</th>
            <th style="text-align:right">Total</th>
          </tr>
        </thead>
        <tbody>${items}</tbody>
      </table>

      <div class="totals">
        <div class="total-row">
          <span style="color:#666">Subtotal</span>
          <span>₦${order.subtotal.toLocaleString()}</span>
        </div>
        ${order.shippingFee > 0 ? `
          <div class="total-row">
            <span style="color:#666">Shipping</span>
            <span>₦${order.shippingFee.toLocaleString()}</span>
          </div>
        ` : ''}
        ${order.discount > 0 ? `
          <div class="total-row">
            <span style="color:#16a34a">
              Discount${order.couponCode
                ? ` (${order.couponCode})` : ''}
            </span>
            <span style="color:#16a34a">
              -₦${order.discount.toLocaleString()}
            </span>
          </div>
        ` : ''}
        <div class="total-row grand-total">
          <span>Total</span>
          <span>₦${order.total.toLocaleString()}</span>
        </div>
      </div>

      ${order.paymentReference ? `
        <div style="margin-top:24px;padding:12px;
          background:#f5f5f5;border-radius:8px;font-size:13px">
          <strong>Payment Reference:</strong>
          ${order.paymentReference}
          · <strong>Status:</strong> ${order.paymentStatus}
        </div>
      ` : ''}

      ${order.trackingNumber ? `
        <div style="margin-top:12px;padding:12px;
          background:#ede9fe;border-radius:8px;font-size:13px">
          <strong>Tracking Number:</strong>
          ${order.trackingNumber}
        </div>
      ` : ''}

      <div class="footer">
        Generated by Vendify · Thank you for your business!
      </div>

      <script>window.onload = () => window.print();</script>
    </body>
    </html>
  `;

  const win = window.open('', '_blank');
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}