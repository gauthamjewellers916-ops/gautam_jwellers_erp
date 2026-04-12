
import React from 'react';

interface LayawayTransaction {
  id: string;
  date: string;
  amount: number;
  mode: string;
  reference?: string;
  notes?: string;
}

interface LayawayStatementPrintProps {
  billNo: string;
  billDate: string;
  customerName: string;
  customerPhone: string;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  transactions: LayawayTransaction[];
  isScreenPreview?: boolean;
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatCurrency = (amount: number) => 
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(amount);

export const LayawayStatementPrint: React.FC<LayawayStatementPrintProps> = ({
  billNo,
  billDate,
  customerName,
  customerPhone,
  totalAmount,
  paidAmount,
  balance,
  transactions,
  isScreenPreview = false
}) => {
  return (
    <div className={`${isScreenPreview ? 'block w-[148mm] mx-auto shadow-2xl p-6 my-8' : 'hidden print:block w-[148mm] h-[210mm] mx-auto p-10'} bg-white text-charcoal-900 font-sans flex flex-col`}>
      <style>{`
        @media print {
          @page { margin: 0; size: A5 portrait; }
          body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; font-weight: 500 !important; overflow: hidden !important; }
          .no-print { display: none !important; }
          * { font-size: 7.5pt; color: #1a1a1a !important; }
          h1 { font-size: 18pt !important; color: #c5a059 !important; line-height: 1 !important; margin-bottom: 1.5mm !important; }
          .text-xs { font-size: 6.5pt !important; color: #1a1a1a !important; }
          .text-[10px] { font-size: 6pt !important; color: #1a1a1a !important; }
          .luxury-gold { color: #c09a50 !important; }
        }

        .luxury-serif { font-family: 'serif'; font-weight: 900; }
        .luxury-gold { color: #c5a059; }
        .statement-table th { border: 2px solid #1a1a1a; padding: 6px; text-transform: uppercase; font-size: 7.5pt; letter-spacing: 0.5px; background: #f9f9f9; }
        .statement-table td { padding: 8px 6px; border: 2px solid #1a1a1a; font-size: 9pt; font-weight: 800; }
        .summary-box { border: 2px solid #1a1a1a; padding: 10px; border-radius: 2px; text-align: center; }
        .footer-label { font-size: 7pt; font-weight: 900; letter-spacing: 0.5px; color: #1a1a1a; text-transform: uppercase; margin-bottom: 2px; display: block; opacity: 0.6; }
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

      {/* STATEMENT HEADER BOX */}
      <div className="flex justify-between items-center border-2 border-charcoal-900 px-3 py-1 mb-2 rounded-sm bg-white shadow-sm">
        <h2 className="luxury-serif italic text-sm uppercase tracking-widest text-charcoal-900 leading-none">Layaway Statement</h2>
        <div className="flex gap-4 font-mono text-[8px] font-bold uppercase items-center">
            <div className="flex flex-col items-end">
                <span className="text-[6.5px] text-charcoal-400 uppercase tracking-widest leading-none mb-0.5 opacity-60">Bill No</span>
                <span className="text-[10pt] text-charcoal-900 font-mono font-black">{billNo}</span>
            </div>
            <div className="w-px h-6 bg-charcoal-200 mx-1"></div>
            <div className="flex flex-col items-end">
                <span className="text-[6.5px] text-charcoal-400 uppercase tracking-widest leading-none mb-0.5 opacity-60">Date</span>
                <span className="text-[10pt] text-charcoal-900 font-mono font-black">{formatDate(new Date().toISOString())}</span>
            </div>
        </div>
      </div>

      {/* VALUED CLIENT SECTION */}
      <div className="grid grid-cols-2 gap-4 mb-3 border-2 border-charcoal-900 p-2 rounded-sm">
        <div className="border-l-4 border-charcoal-900 pl-4 py-0.5">
          <span className="text-[7pt] font-black text-charcoal-400 uppercase tracking-widest mb-0.5 italic leading-none block">Valued Client</span>
          <p className="font-bold text-lg uppercase tracking-tight text-charcoal-900 leading-none mt-1">{customerName}</p>
          <p className="text-[10.5pt] font-mono text-charcoal-900 font-black mt-1">{customerPhone}</p>
        </div>
        
        <div className="flex flex-col items-end justify-center pr-2 border-l border-charcoal-100">
            <div className="text-right">
              <span className="footer-label opacity-40">Account Status</span>
              <span className={`text-sm font-black uppercase tracking-widest px-2 py-0.5 border-2 ${balance <= 0 ? 'text-green-700 border-green-700' : 'text-red-700 border-red-700'}`}>
                {balance <= 0 ? 'SETTLED' : 'PAYMENT PENDING'}
              </span>
            </div>
        </div>
      </div>

      {/* FINANCIAL OVERVIEW */}
      <div className="grid grid-cols-3 gap-3 mb-4 text-center">
        <div className="summary-box">
          <span className="footer-label">Total Outstanding</span>
          <p className="text-xl font-mono font-black border-t border-charcoal-100 mt-1 pt-1">{formatCurrency(totalAmount)}</p>
        </div>
        <div className="summary-box bg-green-50/10">
          <span className="footer-label text-green-700 opacity-100">Amount Paid</span>
          <p className="text-xl font-mono font-black text-green-700 border-t border-charcoal-100 mt-1 pt-1">{formatCurrency(paidAmount)}</p>
        </div>
        <div className="summary-box bg-red-50/10">
          <span className="footer-label text-red-700 opacity-100">Balance Due</span>
          <p className={`text-xl font-mono font-black text-red-700 border-t border-charcoal-100 mt-1 pt-1`}>{formatCurrency(balance)}</p>
        </div>
      </div>

      {/* TRANSACTION TABLE */}
      <div className="flex-1 mb-6">
        <table className="w-full text-left statement-table">
          <thead>
            <tr className="text-gray-400 font-bold">
              <th className="w-10 text-center">#</th>
              <th>Date</th>
              <th>Payment Reference / Mode</th>
              <th className="text-right">Amount Paid</th>
            </tr>
          </thead>
          <tbody className="font-bold">
            {transactions.length === 0 ? (
                <tr>
                    <td colSpan={4} className="py-12 text-center text-gray-300 italic">No payments recorded in the ledger.</td>
                </tr>
            ) : (
                transactions.map((tx, idx) => (
                    <tr key={tx.id}>
                      <td className="text-center text-gray-300 font-mono text-xs">{idx + 1}</td>
                      <td className="text-sm">{formatDate(tx.date)}</td>
                      <td>
                        <span className="uppercase text-xs tracking-widest block">{tx.mode}</span>
                        <span className="text-[10px] text-gray-400 font-mono italic block mt-1">{tx.reference || '-'}</span>
                      </td>
                      <td className="text-right font-mono text-sm text-green-700">{formatCurrency(tx.amount)}</td>
                    </tr>
                ))
            )}
          </tbody>
        </table>
      </div>

      {/* FOOTER: TERMS & PROTOCOL */}
      <div className="mt-auto border-t border-gray-200 pt-2 pb-2">
          <div className="grid grid-cols-[1.5fr,1fr] gap-8 mb-4">
             <div className="space-y-1">
                <span className="footer-label uppercase opacity-20">Statement Note</span>
                <div className="text-[7.5px] font-bold text-gray-400 leading-tight italic space-y-0.5">
                  <p>• Final ornament delivery is subject to full balance clearance.</p>
                </div>
             </div>
             <div className="text-right">
                <span className="footer-label uppercase opacity-20">Protocol</span>
                <div className="text-[7.5px] font-bold text-gray-400 leading-tight space-y-0.5 mt-1">
                  <p>11:00 AM — 8:30 PM (Daily)</p>
                </div>
             </div>
          </div>

          <div className="flex justify-between items-end mt-12 px-8 italic font-black">
              <div className="text-center w-52 border-t border-charcoal-900 pt-2 font-black">
                 <p className="text-[8px] uppercase font-black text-charcoal-500 tracking-widest leading-none">Customer Acknowledgement</p>
              </div>
              <div className="text-center w-56 font-black">
                 <p className="font-black text-[9px] uppercase text-charcoal-900 mb-0.5 tracking-tighter">GAUTAM JEWELLERS</p>
                 <div className="border-t border-charcoal-900 pt-2 text-[8.5px] uppercase font-black text-charcoal-900 tracking-widest leading-none">Authorized Signatory</div>
              </div>
          </div>
      </div>

    </div>
  );
};
