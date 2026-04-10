
import React from 'react';
import { BillItem, Customer, PaymentRecord } from '../types';

interface InvoicePrintProps {
  billNo: string;
  billDate: string;
  saleType: 'GST' | 'NON GST';
  customer: Customer | null;
  items: BillItem[];
  allMetalRates: Record<string, number>;
  totals: {
    itemsSubtotal: number;
    baseTaxable: number;
    gstAmount: number;
    grandTotal: number;
  };
  oldGold: {
    weight: number;
    purity: number | string;
    rate: number;
    total: number;
    description?: string;
  };
  mcValueAdded: {
    weight: number;
    rate: number;
    total: number;
  };
  paymentMethods: PaymentRecord[];
  isScreenPreview?: boolean;
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return new Date().toLocaleDateString('en-GB');
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatCurrency = (amount: number) => 
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(amount);

const numberToWords = (num: number): string => {
  return `Rupees ${num.toFixed(0)} Only`;
};

const metalLabels: Record<string, string> = {
  'gold': 'Std Gold',
  'gold_916': '22k Gold',
  'gold_750': '18k Gold',
  'silver_92': 'Silver 925',
  'silver_70': 'Silver 70',
  'selam_silver': 'Selam',
  'service': 'Service'
};

export const InvoicePrint: React.FC<InvoicePrintProps> = ({
  billNo,
  billDate,
  saleType,
  customer,
  items,
  allMetalRates,
  totals,
  oldGold,
  mcValueAdded,
  paymentMethods,
  isScreenPreview = false
}) => {
  
  const cgst = saleType === 'GST' ? totals.gstAmount / 2 : 0;
  const sgst = saleType === 'GST' ? totals.gstAmount / 2 : 0;

  // Map internal metal_type to display labels and database rate keys as used in SalesBill
  const getRateKey = (mType: string) => {
    const type = (mType || '').toLowerCase();
    if (type.includes('916') || type.includes('22k')) return 'gold_916';
    if (type.includes('750') || type.includes('18k')) return 'gold_750';
    if (type.includes('925') || type.includes('92')) return 'silver_92';
    if (type.includes('70')) return 'silver_70';
    if (type.includes('selam')) return 'selam_silver';
    if (type.includes('gold')) return 'gold';
    return type;
  };

  // Only show rates for metals present in the bill
  const activeMetals = Array.from(new Set(items.map(i => i.metal_type).filter(m => m && m !== 'service'))) as string[];

  return (
    <div className={`${isScreenPreview ? 'block w-[210mm] mx-auto shadow-2xl p-8 my-8' : 'hidden print:block w-[210mm] h-[297mm] mx-auto p-6'} bg-white text-charcoal-900 font-sans flex flex-col`}>
      <style>{`
        @media print {
          @page { margin: 0; size: A4 portrait; }
          body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; font-weight: 500 !important; }
          .no-print { display: none !important; }
          * { font-size: 9.5pt; color: #1a1a1a !important; }
          h1 { font-size: 32pt !important; color: #c5a059 !important; }
          .text-xs { font-size: 7.5pt !important; color: #1a1a1a !important; }
          .text-[10px] { font-size: 7pt !important; color: #1a1a1a !important; }
          .luxury-gold { color: #c5a059 !important; }
        }

        .luxury-serif { font-family: 'serif'; font-weight: 900; }
        .luxury-gold { color: #c5a059; }
        .invoice-table th { border-bottom: 2px solid #1a1a1a; padding: 6px 4px; text-transform: uppercase; font-size: 7.5pt; letter-spacing: 1px; }
        .invoice-table td { padding: 10px 4px; border-bottom: 1px solid #f0f0f0; font-size: 9.5pt; }
        .footer-label { font-size: 7.5pt; font-weight: 800; letter-spacing: 1px; color: #666; margin-bottom: 3px; display: block; }
      `}</style>

      {/* TOP LOGO ACCENT */}
      <div className="flex justify-center mb-1">
         <div className="w-10 h-10">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
         </div>
      </div>

      {/* BRANDING SECTION */}
      <div className="text-center mb-4">
        <h1 className="luxury-serif text-[38pt] luxury-gold tracking-[0.05em] uppercase leading-none mb-1">GAUTHAM JEWELLERS</h1>
        
        <div className="space-y-0.5 text-charcoal-900 font-bold">
          <p className="text-[10pt] uppercase tracking-tight">
            # 27/134, Tannery Road, Near Periyarnagar Circle, Bangalore - 560 005
          </p>
          <p className="text-[11pt]">
            Ph: 080-25465873, 9740415457
          </p>
          {saleType === 'GST' && (
            <p className="text-[10pt]">
              <span className="border-b-2 border-charcoal-900 pb-0.5">GSTIN: 29AATPU7315B1ZA</span>
            </p>
          )}
        </div>
      </div>

      {/* INVOICE HEADER */}
      <div className="flex justify-between items-baseline border-b border-gray-100 pb-1 mb-3">
        <h2 className="luxury-serif italic text-lg uppercase tracking-widest">{saleType === 'GST' ? 'TAX INVOICE' : 'INVOICE'}</h2>
        <div className="flex gap-10 font-mono text-[9px] font-bold">
          <div className="flex flex-col items-end">
            <span className="text-[7px] text-gray-400 uppercase tracking-widest leading-none mb-1">Invoice No</span>
            <span className="text-xs">{billNo}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[7px] text-gray-400 uppercase tracking-widest leading-none mb-1">Date</span>
            <span className="text-xs">{formatDate(billDate)}</span>
          </div>
        </div>
      </div>

      {/* VALUED CLIENT SECTION */}
      <div className="grid grid-cols-2 gap-8 mb-6">
        <div className="border-l-2 border-gold-400 pl-4 py-1">
          <span className="footer-label uppercase">Valued Client</span>
          <p className="font-bold text-base uppercase tracking-tight">{customer?.name || 'Walk-in Customer'}</p>
          <p className="text-[10px] font-mono text-gray-500 mt-0.5">{customer?.phone || '-'}</p>
        </div>
        
        <div className="flex flex-col items-end justify-center">
           {activeMetals.length > 0 && (
             <div className="flex gap-6 uppercase font-bold text-[9px] text-gray-400">
                {activeMetals.map((m) => {
                  const rateKey = getRateKey(m);
                  return (
                    <div key={m} className="text-right">
                      <span className="block mb-0.5 tracking-widest">{metalLabels[m] || m} RATE</span>
                      <span className="text-xs text-charcoal-900 font-mono">₹{Number(allMetalRates[rateKey] || allMetalRates[m] || 0).toLocaleString()}</span>
                    </div>
                  );
                })}
             </div>
           )}
        </div>
      </div>

      {/* ITEMS TABLE */}
      <div className="flex-1 mb-6">
        <table className="w-full text-left invoice-table">
          <thead>
            <tr className="text-gray-400 font-bold">
              <th className="w-10 text-center">#</th>
              <th>Description</th>
              <th className="text-center">HUID</th>
              <th className="text-right">Gross</th>
              <th className="text-right">Net</th>
              <th className="text-right">Rate</th>
              <th className="text-right">MC</th>
              <th className="text-right">Total</th>
            </tr>
          </thead>
          <tbody className="font-bold">
            {items.map((item, idx) => (
              <tr key={item.id}>
                <td className="text-center text-gray-300 font-mono text-xs">{idx + 1}</td>
                <td className="uppercase text-sm tracking-tight">{item.item_name}</td>
                <td className="text-center font-mono text-[9px] text-gray-400">{item.huid || '-'}</td>
                <td className="text-right font-mono text-xs">{item.gross_weight?.toFixed(3) || item.weight.toFixed(3)}g</td>
                <td className="text-right font-mono text-sm text-charcoal-900 border-b border-gold-100">{item.net_weight?.toFixed(3) || item.weight.toFixed(3)}g</td>
                <td className="text-right font-mono text-xs text-gray-400">{item.rate.toLocaleString()}</td>
                <td className="text-right font-mono text-xs text-gray-400">{item.making_charges.toLocaleString()}</td>
                <td className="text-right font-mono text-sm">{item.line_total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              </tr>
            ))}
            
            {mcValueAdded.total > 0 && (
              <tr>
                 <td className="text-center text-xs text-gray-300">•</td>
                 <td colSpan={6} className="uppercase text-xs tracking-widest opacity-60 italic">Value Added / Working Charges</td>
                 <td className="text-right font-mono text-sm">{mcValueAdded.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              </tr>
            )}
            
            {/* Minimal Spacer rows */}
            {[...Array(Math.max(0, 5 - items.length))].map((_, i) => (
              <tr key={`spacer-${i}`} className="h-8 opacity-0">
                <td colSpan={8}>&nbsp;</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* FINANCIAL SUMMARY */}
      <div className="grid grid-cols-[1fr,320px] gap-12 mt-4 border-t border-gray-100 pt-8">
         <div>
           <div className="mb-4">
              <span className="footer-label uppercase">Settlement Mode</span>
              <div className="flex flex-wrap gap-4 mt-2">
                 {paymentMethods.map((pm, idx) => (
                   (parseFloat(pm.amount) || 0) > 0 && (
                     <div key={idx} className="bg-gray-50 border border-gray-100 px-3 py-1 rounded-sm text-[10px] uppercase font-bold tracking-widest">
                        {pm.type}
                     </div>
                   )
                 ))}
                 {oldGold.total > 0 && (
                    <div className="bg-red-50 border border-red-100 px-3 py-1 rounded-sm text-[10px] uppercase font-bold tracking-widest text-red-600">
                      Gold Exchange
                    </div>
                 )}
              </div>
           </div>
           
           {oldGold.total > 0 && (
             <div className="mb-4 mt-6 bg-red-50 border border-red-100 p-3 rounded-sm w-[200px]">
                <span className="footer-label uppercase text-red-800">Old Gold Exchange Details</span>
                <div className="mt-2 text-[9px] text-red-900 font-mono space-y-1">
                   <div className="flex justify-between">
                      <span className="font-bold">Particulars:</span>
                      <span>{oldGold.description || 'Old Gold'}</span>
                   </div>
                   <div className="flex justify-between">
                      <span className="font-bold">Weight:</span>
                      <span>{oldGold.weight.toFixed(3)}g</span>
                   </div>
                   <div className="flex justify-between">
                      <span className="font-bold">Rate:</span>
                      <span>₹{oldGold.rate.toLocaleString()}</span>
                   </div>
                   <div className="flex justify-between mt-1 pt-1 border-t border-red-200">
                      <span className="font-bold uppercase tracking-widest text-xs">Total Value:</span>
                      <span className="font-bold text-xs">₹{oldGold.total.toLocaleString()}</span>
                   </div>
                </div>
             </div>
           )}
        </div>

        <div className="space-y-3">
           <div className="flex justify-between text-xs font-bold text-gray-400">
              <span className="uppercase tracking-[0.2em]">Subtotal</span>
              <span className="font-mono text-charcoal-900">₹ {(totals.itemsSubtotal + (mcValueAdded.total || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
           </div>

           <div className="flex justify-between text-xs font-bold text-charcoal-400">
              <span className="uppercase tracking-[0.2em]">Taxable Amount</span>
              <span className="font-mono text-charcoal-900">₹ {totals.baseTaxable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
           </div>

           {oldGold.total > 0 && (
             <div className="flex justify-between text-[11px] font-bold text-red-600 border-t border-gray-100 pt-2 mt-2">
                <span className="uppercase tracking-[0.1em]">Less: Old Gold Exchange</span>
                <span className="font-mono">- ₹ {oldGold.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
             </div>
           )}

           {saleType === 'GST' && (
             <>
               <div className="flex justify-between text-[10px] font-bold text-gray-400 pl-4 border-l border-gray-100">
                  <span className="uppercase tracking-widest">Central GST (1.5%)</span>
                  <span className="font-mono">₹ {(totals.gstAmount / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
               </div>
               <div className="flex justify-between text-[10px] font-bold text-gray-400 pl-4 border-l border-gray-100">
                  <span className="uppercase tracking-widest">State GST (1.5%)</span>
                  <span className="font-mono">₹ {(totals.gstAmount / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
               </div>
             </>
           )}

           <div className="flex flex-col items-end pt-4 mt-4 border-t-2 border-charcoal-900">
              <div className="flex justify-between items-baseline w-full">
                 <span className="luxury-serif luxury-gold uppercase text-xl leading-none">Grand Total</span>
                 <span className="text-serif font-bold text-4xl text-charcoal-900 leading-none">₹ {totals.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="mt-4 text-[9px] font-bold uppercase tracking-widest italic text-charcoal-900 text-right w-full">
                 {numberToWords(totals.grandTotal)}
              </div>
           </div>
        </div>
      </div>

      {/* FOOTER: TERMS & PROTOCOL */}
      <div className="mt-auto border-t border-gray-200 pt-8 pb-4">
          <div className="grid grid-cols-[1.5fr,1fr] gap-12 mb-8">
            <div className="space-y-4">
                <span className="footer-label uppercase opacity-20">Terms of Sale</span>
                <div className="text-[8.5px] font-bold text-gray-400 leading-relaxed italic space-y-1.5 list-none">
                  <p>• Returns & Exchanges honored within 7 days in original condition.</p>
                  <p>• Nose pin will be No Exchange.</p>
                  <p>• Buy-back policy: 5% deduction from current market gold rate.</p>
                  <p>• Purity Guaranteed: 22k (916) & 18k (750) BIS Hallmarked ornaments.</p>
                  <p>• Advance rate bookings valid for a period of 7 days only.</p>
                </div>
             </div>
             <div className="text-right">
                <span className="footer-label uppercase opacity-20">Store Protocol</span>
                <div className="text-[8.5px] font-bold text-gray-400 leading-relaxed space-y-1 mt-2">
                  <p>Hours: 10:00 to 2:30 and 4:00pm to 9:00pm (Monday through Saturday)</p>
                  <p>Sunday: 10:00 to 7:00pm</p>
                  <p>Accepted: UPI, Major Credit/Debit Cards, Bank Transfer</p>
                  <p>Location: Shivaji Nagar, Bengaluru</p>
                </div>
             </div>
          </div>

          <div className="flex justify-between items-end mt-16 px-4">
              <div className="text-center w-56 border-t border-gray-200 pt-2">
                 <p className="text-[8px] uppercase font-bold text-gray-400 tracking-widest leading-loose">Client Acknowledgement</p>
              </div>
              <div className="text-center w-56">
                 <p className="font-bold text-[10px] uppercase text-charcoal-900 mb-1 tracking-tighter">GAUTHAM JEWELLERS</p>
                 <div className="border-t border-gray-200 pt-2 text-[9px] uppercase font-bold text-charcoal-900 tracking-widest italic leading-none">Authorized Signature</div>
              </div>
          </div>
      </div>
    </div>
  );
};
