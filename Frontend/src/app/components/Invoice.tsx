import { Zap } from 'lucide-react';

const InvoicePage = () => {
  const invoiceData = {
    invoiceNumber: 'INV-2026-001',
    date: 'May 12, 2026',
    dueDate: 'May 26, 2026',
    items: [
      { product: 'Professional Tennis Racket', qty: 2, unitPrice: 249.99 },
      { product: 'Premium Running Shoes', qty: 1, unitPrice: 159.99 },
      { product: 'Yoga Mat Pro', qty: 3, unitPrice: 89.99 },
      { product: 'Sports Water Bottle', qty: 5, unitPrice: 24.99 },
    ],
    deliveryAddress: {
      name: 'John Anderson',
      street: '456 Athletic Avenue',
      city: 'San Francisco, CA 94102',
      country: 'United States',
    },
  };

  const subtotal = invoiceData.items.reduce(
    (sum, item) => sum + item.qty * item.unitPrice,
    0
  );
  const gst = subtotal * 0.1;
  const shipping = 25.00;
  const total = subtotal + gst + shipping;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8 flex items-center justify-center">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-orange-400 p-8 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-lg">SE</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold">SportEquip</h1>
                <p className="text-white/90 text-sm">Premium Sports Equipment</p>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-3xl font-bold">INVOICE</h2>
              <p className="text-white/90 text-sm mt-1">
                #{invoiceData.invoiceNumber}
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-6 text-sm">
            <div>
              <p className="text-white/80">Invoice Date</p>
              <p className="font-semibold mt-1">{invoiceData.date}</p>
            </div>
            <div>
              <p className="text-white/80">Due Date</p>
              <p className="font-semibold mt-1">{invoiceData.dueDate}</p>
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="mb-8 p-6 bg-slate-50 rounded-xl">
            <div className="flex items-start gap-2 mb-2">
              <Zap className="w-5 h-5 text-blue-500 mt-0.5" />
              <h3 className="font-semibold text-slate-800">Delivery Address</h3>
            </div>
            <div className="ml-7 text-slate-600">
              <p className="font-medium text-slate-800">
                {invoiceData.deliveryAddress.name}
              </p>
              <p>{invoiceData.deliveryAddress.street}</p>
              <p>{invoiceData.deliveryAddress.city}</p>
              <p>{invoiceData.deliveryAddress.country}</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-800 text-white">
                  <th className="text-left py-4 px-6">Product</th>
                  <th className="text-center py-4 px-6">Qty</th>
                  <th className="text-right py-4 px-6">Unit Price</th>
                  <th className="text-right py-4 px-6">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {invoiceData.items.map((item, index) => (
                  <tr
                    key={index}
                    className="border-b border-slate-200 hover:bg-slate-50 transition-colors"
                  >
                    <td className="py-4 px-6 text-slate-800">{item.product}</td>
                    <td className="py-4 px-6 text-center text-slate-600">
                      {item.qty}
                    </td>
                    <td className="py-4 px-6 text-right text-slate-600">
                      ${item.unitPrice.toFixed(2)}
                    </td>
                    <td className="py-4 px-6 text-right font-semibold text-slate-800">
                      ${(item.qty * item.unitPrice).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 flex justify-end">
            <div className="w-80 space-y-3">
              <div className="flex justify-between py-2 text-slate-700">
                <span>Subtotal</span>
                <span className="font-medium">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 text-slate-700">
                <span>Tax (GST 10%)</span>
                <span className="font-medium">${gst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 text-slate-700">
                <span>Shipping</span>
                <span className="font-medium">${shipping.toFixed(2)}</span>
              </div>
              <div className="border-t-2 border-slate-300 pt-3 flex justify-between text-lg">
                <span className="font-bold text-slate-800">Total Paid</span>
                <span className="font-bold bg-gradient-to-r from-blue-500 to-orange-400 bg-clip-text text-transparent">
                  ${total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-200 flex items-center justify-center gap-2 text-sm text-slate-500">
            <Zap className="w-4 h-4 text-blue-500" />
            <p>Thank you for your business! We appreciate your trust in SportEquip.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InvoicePage;