
import React from 'react';

interface BookingItem {
  id: string;
  name: string;
  metalType: string;
  weight: number;
  purity: string;
  rate: number;
  makingCharges: number;
  lineTotal: number;
}

interface AdvanceBookingPrintProps {
  bookingNo: string;
  bookingDate: string;
  deliveryDate: string;
  customerName: string;
  customerPhone: string;
  items: BookingItem[];
  itemDescription?: string; // Added to support string descriptions from DB
  totalAmount: number;
  advanceAmount: number;
  balanceDue: number;
  notes?: string;
  saleType?: string;
  isScreenPreview?: boolean;
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatCurrency = (amount: number) => 
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(amount);

export const AdvanceBookingPrint: React.FC<AdvanceBookingPrintProps> = ({
  bookingNo,
  bookingDate,
  deliveryDate,
  customerName,
  customerPhone,
  items,
  itemDescription,
  totalAmount,
  advanceAmount,
  balanceDue,
  notes,
  saleType,
  isScreenPreview = false
}) => {
  return (
    <div className={`${isScreenPreview ? 'block w-[148mm] mx-auto shadow-2xl p-6 my-8' : 'hidden print:block w-[148mm] h-[210mm] mx-auto p-8'} bg-white text-charcoal-900 font-sans font-bold flex flex-col`}>
      <style>{`
        @media print {
          @page { margin: 0; size: A5 portrait; }
          body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; font-weight: 500 !important; }
          .no-print { display: none !important; }
          * { font-size: 8.5pt; color: #1a1a1a !important; }
          h1 { font-size: 28pt !important; color: #c5a059 !important; }
          .text-xs { font-size: 7.5pt !important; color: #1a1a1a !important; }
          .text-lg { font-size: 10pt !important; color: #1a1a1a !important; }
          .text-[10px] { font-size: 6.5pt !important; color: #1a1a1a !important; }
        }
      `}</style>

      {/* TOP LOGO ACCENT */}
      <div className="flex justify-center mb-2">
         <div className="w-12 h-12">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
         </div>
      </div>

      {/* BRANDING SECTION */}
      <div className="text-center mb-6">
        <h1 className="luxury-serif text-[28pt] luxury-gold tracking-[0.05em] uppercase leading-none mb-2">GAUTAM JEWELLERS</h1>
        
        <div className="space-y-1 text-charcoal-900 font-bold">
          <p className="text-[11pt] uppercase tracking-tight">
            # 27/134, Tannery Road, Near Periyarnagar Circle, Bangalore - 560 005
          </p>
          <p className="text-[12pt]">
            Ph: 080-25465873, 9740415457
          </p>
          <p className="text-[11pt]">
            <span className="border-b-2 border-charcoal-900 pb-0.5">GSTIN: 29AATPU7315B1ZA</span>
          </p>
        </div>
      </div>

      <div className="absolute top-8 right-8 print:top-12 print:right-12">
         <div className="w-14 h-14">
            <img src="/BIS_PNG.png" alt="BIS Hallmark" className="max-w-full max-h-full object-contain" />
         </div>
      </div>

      {/* INFO BAR */}
      <div className="flex justify-between items-center bg-charcoal-900 text-white px-6 py-2 mb-4 rounded-sm">
         <h3 className="text-base font-bold tracking-[0.2em] uppercase text-gold-500">Order Booking Receipt</h3>
         <div className="flex gap-4 font-mono text-sm uppercase items-center">
            <span className="bg-white/20 px-2 py-0.5 rounded text-xs tracking-widest">{saleType === 'gst' || saleType === 'GST' ? 'GST' : 'ESTIMATE / NON-GST'}</span>
            <p>Receipt No: {bookingNo}</p>
            <p>Booking Date: {formatDate(bookingDate)}</p>
         </div>
      </div>

      {/* CUSTOMER & DELIVERY INFO */}
      <div className="grid grid-cols-2 gap-4 mb-4 border-2 border-charcoal-900 p-4 rounded-sm">
        <div className="border-l-4 border-gold-500 pl-4 py-1">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 italic opacity-60">Customer Information</h3>
          <div className="text-sm">
            <p className="font-bold font-serif text-2xl text-charcoal-900 tracking-tight mb-0.5">{customerName}</p>
            <p className="font-mono text-charcoal-700 text-base">{customerPhone}</p>
          </div>
        </div>
        
        <div className="bg-gold-50 p-4 rounded-sm flex flex-col items-end justify-center border border-gold-100 shadow-sm">
            <p className="text-[10px] font-bold text-gold-600 uppercase tracking-widest mb-1 opacity-60">Expected Delivery</p>
            <p className="font-mono text-2xl font-bold text-charcoal-900">{formatDate(deliveryDate)}</p>
        </div>
      </div>

      {/* ITEMS TABLE */}
      <div className="flex-1 mb-6">
        <h3 className="text-[11px] font-bold text-charcoal-900 uppercase tracking-[0.3em] mb-4 border-b-2 border-charcoal-900 pb-2">Order Specifications</h3>
        {items && items.length > 0 ? (
          <table className="w-full text-left text-sm border-collapse border-2 border-charcoal-900 shadow-sm font-bold">
            <thead>
              <tr className="bg-charcoal-50">
                <th className="py-2 px-3 font-bold uppercase tracking-wider text-charcoal-900 w-8 border border-charcoal-900 text-center">Sn</th>
                <th className="py-2 px-3 font-bold uppercase tracking-wider text-charcoal-900 border border-charcoal-900">Description</th>
                <th className="py-2 px-3 font-bold uppercase tracking-wider text-charcoal-900 text-center border border-charcoal-900">HSN</th>
                <th className="py-2 px-3 font-bold uppercase tracking-wider text-charcoal-900 text-right border border-charcoal-900">Est. Wt</th>
                <th className="py-2 px-3 font-bold uppercase tracking-wider text-charcoal-900 text-right border border-charcoal-900">Locked Rate</th>
                <th className="py-2 px-3 font-bold uppercase tracking-wider text-charcoal-900 text-right border border-charcoal-900">Making</th>
                <th className="py-2 px-3 font-bold uppercase tracking-wider text-charcoal-900 text-right border border-charcoal-900">Est. Total</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {items.map((item, idx) => (
                <tr key={item.id} className="border-b border-charcoal-100">
                  <td className="py-2 px-3 text-charcoal-500 border border-charcoal-900 text-center">{String(idx + 1).padStart(2, '0')}</td>
                  <td className="py-2 px-3 font-sans font-bold border border-charcoal-900">
                    <span className="font-bold text-charcoal-900 block tracking-tight uppercase text-sm mb-0.5">{item.name}</span>
                    <span className="text-[8px] text-charcoal-500 uppercase tracking-widest italic">{item.metalType} • {item.purity}</span>
                  </td>
                  <td className="py-2 px-3 text-center text-charcoal-500 border border-charcoal-900 text-[10px] font-mono">7113</td>
                  <td className="py-2 px-3 text-right text-charcoal-900 border border-charcoal-900 text-sm">{item.weight.toFixed(3)}g</td>
                  <td className="py-2 px-3 text-right text-charcoal-900 border border-charcoal-900 text-sm">{item.rate.toLocaleString()}</td>
                  <td className="py-2 px-3 text-right text-charcoal-900 border border-charcoal-900 text-sm">{(item.makingCharges || 0).toLocaleString()}</td>
                  <td className="py-2 px-3 text-right text-charcoal-900 font-bold border border-charcoal-900 text-base">{formatCurrency(item.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-8 bg-charcoal-50 rounded-sm border-2 border-charcoal-900 italic shadow-inner">
             <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mb-4 not-italic opacity-60">Handwritten Description:</p>
            <p className="text-lg text-charcoal-800 font-bold leading-relaxed whitespace-pre-wrap">
              {itemDescription || 'Detailed items will be specified in the final invoice.'}
            </p>
          </div>
        )}
      </div>

      {/* FINANCIAL SUMMARY */}
      <div className="grid grid-cols-3 gap-4 mb-8 text-center">
        <div className="bg-charcoal-900 text-white p-4 rounded-sm ring-1 ring-charcoal-800 shadow-lg">
          <p className="text-[10px] uppercase font-bold text-gold-500 tracking-widest mb-2">Estimated Total</p>
          <p className="text-2xl font-mono font-bold">{formatCurrency(totalAmount)}</p>
        </div>
        <div className="bg-green-50 border-2 border-green-200 p-4 rounded-sm">
          <p className="text-[10px] uppercase font-bold text-green-600 tracking-widest mb-2">Advance Deposit</p>
          <p className="text-2xl font-mono font-bold text-green-700">{formatCurrency(advanceAmount)}</p>
        </div>
        <div className="bg-red-50 border-2 border-red-200 p-4 rounded-sm shadow-sm">
          <p className="text-[10px] uppercase font-bold text-red-600 tracking-widest mb-2">Balance Payable</p>
          <p className="text-2xl font-mono font-bold text-red-700">{formatCurrency(balanceDue)}</p>
        </div>
      </div>

      {/* NOTES */}
      {notes && (
        <div className="mb-8 p-6 bg-charcoal-50 rounded-sm border-2 border-charcoal-900 shadow-sm overflow-hidden relative">
           <div className="absolute top-0 right-0 bg-charcoal-900 text-white text-[8px] px-3 py-1 font-bold uppercase tracking-widest">Customer Notes</div>
           <p className="text-sm text-charcoal-700 italic font-bold leading-loose whitespace-pre-wrap">{notes}</p>
        </div>
      )}

      {/* FOOTER */}
      <div className="border-t-2 border-charcoal-900 pt-6 mt-auto">
          <div className="grid grid-cols-2 gap-8 mb-6">
             <div className="text-xs text-charcoal-900 leading-relaxed bg-charcoal-50 p-4 rounded-sm border border-charcoal-100 italic">
                <p className="font-bold uppercase mb-2 text-charcoal-900 tracking-widest border-b border-charcoal-200 pb-1 not-italic">Order Terms:</p>
                <p>• Prices are subject to gold market fluctuations unless the rate is locked at booking.</p>
                <p>• Expected delivery dates are estimates; variations in craftsmanship may occur.</p>
                <p>• Advance amount is non-refundable except in case of manufacturing default.</p>
             </div>
             <div className="text-right flex flex-col justify-center p-4">
                <p className="text-[10px] font-bold text-charcoal-400 uppercase tracking-[0.2em] mb-2">Current Order Status</p>
                <div className="text-2xl font-bold uppercase tracking-widest px-4 py-2 rounded inline-block bg-charcoal-900 text-white border-2 border-charcoal-900">
                    BOOKING CONFIRMED
                </div>
             </div>
          </div>

          <div className="flex justify-between items-end mt-12 mb-4 px-4">
              <div className="text-center w-48 border-t-2 border-charcoal-900 pt-2">
                 <p className="text-xs uppercase font-bold text-charcoal-900 tracking-widest">Customer Signature</p>
              </div>
              <div className="text-center w-64 border-t-2 border-charcoal-900 pt-2">
                  <p className="font-bold text-[10px] uppercase text-charcoal-900 mb-1 tracking-tighter">GAUTAM JEWELLERS</p>
                 <p className="text-sm uppercase font-bold text-charcoal-900 tracking-wider">Authorized Signatory</p>
              </div>
          </div>
      </div>
      
      <div className="mt-8 text-center text-[10px] text-gray-300 uppercase tracking-[0.8em] font-light italic border-t border-gray-100 pt-4">
         Luxury Redefined • Est 2024
      </div>
    </div>
  );
};
