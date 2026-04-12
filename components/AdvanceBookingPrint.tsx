
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
  oldGold?: {
    particulars: string;
    weight: number;
    rate: number;
  };
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
  isScreenPreview = false,
  oldGold
}) => {
  return (
    <div className={`${isScreenPreview ? 'block w-[148mm] mx-auto shadow-2xl p-6 my-8' : 'hidden print:block w-[148mm] h-[210mm] mx-auto p-8'} bg-white text-charcoal-900 font-sans font-bold flex flex-col`}>
      <style>{`
        @media print {
          @page { margin: 0; size: A5 portrait; }
          body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; font-weight: 500 !important; overflow: hidden !important; }
          .no-print { display: none !important; }
          * { font-size: 7.5pt; color: #1a1a1a !important; }
          h1 { font-size: 18pt !important; color: #b08d4a !important; line-height: 1.1 !important; margin-bottom: 1.5mm !important; }
          .text-xs { font-size: 6.5pt !important; color: #1a1a1a !important; }
          .text-lg { font-size: 8.5pt !important; color: #1a1a1a !important; }
          .text-[10px] { font-size: 6pt !important; color: #1a1a1a !important; }
          .bg-charcoal-900 { background-color: white !important; color: #1a1a1a !important; border: 1.5px solid #1a1a1a !important; }
          .text-white { color: #1a1a1a !important; }
          .text-gold-500 { color: #1a1a1a !important; font-weight: 900 !important; }
          .bg-green-50, .bg-red-50, .bg-charcoal-50 { background-color: white !important; }
          .border-gold-500, .border-green-200, .border-red-200 { border-color: #1a1a1a !important; border-width: 1.5px !important; }
        }
      `}</style>

      {/* TOP LOGO ACCENT */}
      <div className="flex justify-center mb-2">
         <div className="w-12 h-12">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
         </div>
      </div>

      {/* BRANDING SECTION */}
      <div className="text-center mb-2">
        <h1 className="luxury-serif text-[18pt] luxury-gold tracking-[0.05em] uppercase leading-none mb-0.5">GAUTAM JEWELLERS</h1>
        
        <div className="space-y-0 text-charcoal-900 font-bold">
          <p className="text-[8.5pt] uppercase tracking-tight">
            # 27/134, Tannery Road, Near Periyarnagar Circle, Bangalore - 560 005
          </p>
          <p className="text-[9.5pt]">
            Ph: 080-25465873, 9740415457
          </p>
          <p className="text-[8.5pt]">
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
      <div className="flex justify-between items-center border-2 border-charcoal-900 px-3 py-1 mb-1 rounded-sm">
         <h3 className="text-xs font-black tracking-[0.1em] uppercase text-charcoal-900">Order Receipt</h3>
         <div className="flex gap-4 font-mono text-[8px] uppercase items-center font-bold">
            <span className="border border-charcoal-900 px-1.5 py-0.5 rounded text-[7px] tracking-widest">{saleType === 'gst' || saleType === 'GST' ? 'GST' : 'NON-GST'}</span>
            <p>No: <span className="text-[9pt]">{bookingNo}</span></p>
            <p>Date: <span className="text-[9pt]">{formatDate(bookingDate)}</span></p>
         </div>
      </div>

      {/* CUSTOMER & DELIVERY INFO */}
      <div className="grid grid-cols-2 gap-4 mb-3 border-2 border-charcoal-900 p-3 rounded-sm">
        <div className="border-l-4 border-gold-500 pl-4 py-0.5">
          <h3 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5 italic opacity-60">Customer Information</h3>
          <div className="text-xs">
            <p className="font-bold font-serif text-xl text-charcoal-900 tracking-tight mb-0.5">{customerName}</p>
            <p className="font-mono text-charcoal-700 text-sm">{customerPhone}</p>
          </div>
        </div>
        
        <div className="bg-gold-50 p-3 rounded-sm flex flex-col items-end justify-center border border-gold-100 shadow-sm">
            <p className="text-[9px] font-bold text-gold-600 uppercase tracking-widest mb-0.5 opacity-60">Expected Delivery</p>
            <p className="font-mono text-xl font-bold text-charcoal-900">{formatDate(deliveryDate)}</p>
        </div>
      </div>

      {/* ITEMS TABLE */}
      <div className="mb-2">
        <h3 className="text-[8px] font-bold text-charcoal-900 uppercase tracking-[0.2em] mb-1 border-b border-charcoal-900 pb-0.5">Specifications</h3>
        {items && items.length > 0 ? (
          <table className="w-full text-left text-[10px] border-collapse border border-charcoal-900 font-bold">
            <thead>
              <tr className="bg-charcoal-50">
                <th className="py-0.5 px-2 font-bold uppercase tracking-wider text-charcoal-900 w-6 border border-charcoal-900 text-center">#</th>
                <th className="py-0.5 px-2 font-bold uppercase tracking-wider text-charcoal-900 border border-charcoal-900">Description</th>
                <th className="py-0.5 px-2 font-bold uppercase tracking-wider text-charcoal-900 text-center border border-charcoal-900">HSN</th>
                <th className="py-0.5 px-2 font-bold uppercase tracking-wider text-charcoal-900 text-right border border-charcoal-900">Wt</th>
                <th className="py-0.5 px-2 font-bold uppercase tracking-wider text-charcoal-900 text-right border border-charcoal-900">Rate</th>
                <th className="py-0.5 px-2 font-bold uppercase tracking-wider text-charcoal-900 text-right border border-charcoal-900">Total</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {items.map((item, idx) => (
                <tr key={item.id} className="border-b border-charcoal-100">
                  <td className="py-0.5 px-1 text-charcoal-500 border border-charcoal-900 text-center text-[8px]">{idx + 1}</td>
                  <td className="py-0.5 px-2 font-sans font-bold border border-charcoal-900">
                    <span className="font-bold text-charcoal-900 block tracking-tight uppercase text-[9px] mb-0">{item.name}</span>
                    <span className="text-[6.5px] text-charcoal-500 uppercase tracking-widest italic">{item.metalType} • {item.purity}</span>
                  </td>
                  <td className="py-0.5 px-1 text-center text-charcoal-500 border border-charcoal-900 text-[8px] font-mono">7113</td>
                  <td className="py-0.5 px-1 text-right text-charcoal-900 border border-charcoal-900 text-[9px]">{item.weight.toFixed(3)}g</td>
                  <td className="py-0.5 px-1 text-right text-charcoal-900 border border-charcoal-900 text-[9px]">{item.rate.toLocaleString()}</td>
                  <td className="py-0.5 px-1 text-right text-charcoal-900 font-bold border border-charcoal-900 text-[10px]">{formatCurrency(item.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-4 bg-charcoal-50 rounded-sm border border-charcoal-900 italic shadow-inner">
             <p className="text-[8px] text-gray-400 font-bold uppercase tracking-[0.2em] mb-2 not-italic opacity-60">Description:</p>
            <p className="text-base text-charcoal-800 font-bold leading-relaxed whitespace-pre-wrap">
              {itemDescription || 'Details in final invoice.'}
            </p>
          </div>
        )}
      </div>

      {/* OLD GOLD EXCHANGE SECTION */}
      {oldGold && oldGold.weight > 0 && (
        <div className="mb-2 border-2 border-charcoal-900 border-dashed p-2 rounded-sm bg-gray-50/30">
          <div className="flex justify-between items-center mb-1">
            <h3 className="text-[8px] font-black text-charcoal-900 uppercase tracking-widest italic leading-none">Old Gold Exchange (Pink Slip Details)</h3>
            <span className="text-[7px] bg-charcoal-900 text-white px-1.5 font-bold leading-none">DEDUCTION</span>
          </div>
          <table className="w-full text-left text-[8px]">
            <thead className="border-b border-charcoal-200 text-charcoal-400 font-black uppercase">
              <tr>
                <th className="py-0.5">Particulars</th>
                <th className="py-0.5 text-right">Weight</th>
                <th className="py-0.5 text-right">Rate</th>
                <th className="py-0.5 text-right">Value</th>
              </tr>
            </thead>
            <tbody>
              <tr className="font-bold text-charcoal-900">
                <td className="py-1">{oldGold.particulars || 'Old Gold Ornament'}</td>
                <td className="py-1 text-right font-mono">{oldGold.weight.toFixed(3)}g</td>
                <td className="py-1 text-right font-mono">{oldGold.rate.toLocaleString()}</td>
                <td className="py-1 text-right font-mono text-red-700">-{formatCurrency(oldGold.weight * oldGold.rate)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* FINANCIAL SUMMARY */}
      <div className="grid grid-cols-3 gap-3 mb-2 text-center mt-auto">
        <div className="border-2 border-charcoal-900 p-1.5 rounded-sm">
          <p className="text-[8px] uppercase font-black text-charcoal-400 tracking-widest mb-0.5 leading-none">Total Amount</p>
          <p className="text-lg font-mono font-black border-t border-charcoal-100 mt-1 pt-1">{formatCurrency(totalAmount)}</p>
        </div>
        <div className="border-2 border-charcoal-900 p-1.5 rounded-sm">
          <p className="text-[8px] uppercase font-black text-green-700 tracking-widest mb-0.5 leading-none">Advance Paid</p>
          <p className="text-lg font-mono font-black text-green-700 border-t border-charcoal-100 mt-1 pt-1">{formatCurrency(advanceAmount)}</p>
        </div>
        <div className="border-2 border-charcoal-900 p-1.5 rounded-sm">
          <p className="text-[8px] uppercase font-black text-red-700 tracking-widest mb-0.5 leading-none">Balance Due</p>
          <p className="text-lg font-mono font-black text-red-700 border-t border-charcoal-100 mt-1 pt-1">{formatCurrency(balanceDue)}</p>
        </div>
      </div>

      {/* NOTES */}
      {notes && (
        <div className="mb-4 p-4 bg-charcoal-50 rounded-sm border border-charcoal-900 shadow-sm overflow-hidden relative mt-2">
           <div className="absolute top-0 right-0 bg-charcoal-900 text-white text-[7px] px-2 py-0.5 font-bold uppercase tracking-widest">Customer Notes</div>
           <p className="text-xs text-charcoal-700 italic font-bold leading-relaxed whitespace-pre-wrap">{notes}</p>
        </div>
      )}

      {/* FOOTER */}
      <div className="border-t border-charcoal-900 pt-2 mt-auto">
          <div className="grid grid-cols-2 gap-6 mb-2">
             <div className="text-[8.5px] text-charcoal-900 leading-tight bg-charcoal-50 p-2 rounded-sm border border-charcoal-100 italic">
                <p className="font-bold uppercase mb-1 text-charcoal-900 tracking-widest border-b border-charcoal-200 pb-0.5 not-italic">Order Terms:</p>
                <p>• Prices are subject to gold market fluctuations.</p>
                <p>• Expected delivery dates are estimates.</p>
             </div>
             <div className="text-right flex flex-col justify-center p-2">
                <p className="text-[8px] font-black text-charcoal-400 uppercase tracking-widest leading-none mb-1">Status</p>
                <div className="text-sm font-black uppercase tracking-widest px-2 py-1 border border-charcoal-900 inline-block">
                    CONFIRMED
                </div>
             </div>
          </div>

          <div className="flex justify-between items-end mt-4 mb-1 px-4">
              <div className="text-center w-36 border-t border-charcoal-900 pt-1">
                 <p className="text-[8px] uppercase font-bold text-charcoal-900 tracking-widest">Customer</p>
              </div>
              <div className="text-center w-40 border-t border-charcoal-900 pt-1">
                  <p className="font-bold text-[7px] uppercase text-charcoal-900 mb-0 tracking-tighter">GAUTAM JEWELLERS</p>
                 <p className="text-[8px] uppercase font-bold text-charcoal-900 tracking-wider">Authorized Signatory</p>
              </div>
          </div>
      </div>
    </div>
  );
};
