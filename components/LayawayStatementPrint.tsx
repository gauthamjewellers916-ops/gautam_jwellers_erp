
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
    <div className={`${isScreenPreview ? 'block w-[210mm] mx-auto shadow-2xl p-8 my-8' : 'hidden print:block w-[210mm] h-[297mm] mx-auto p-10'} bg-white text-charcoal-900 font-sans flex flex-col`}>
      <style>{`
        @media print {
          @page { margin: 0; size: A4 portrait; }
          body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; font-weight: 500 !important; }
          .no-print { display: none !important; }
          * { font-size: 10pt; color: #1a1a1a !important; }
          h1 { font-size: 36pt !important; color: #c5a059 !important; }
          .text-xs { font-size: 8pt !important; color: #1a1a1a !important; }
          .text-[10px] { font-size: 7.5pt !important; color: #1a1a1a !important; }
          .luxury-gold { color: #c5a059 !important; }
        }

        .shop-name {
          font-family: 'serif';
          font-size: 42pt;
          letter-spacing: 0.05em;
          line-height: 1;
          margin-bottom: 2mm;
          color: #c5a059;
          font-weight: 900;
          text-transform: uppercase;
        }
        .luxury-serif { font-family: 'serif'; font-weight: 900; }
        .luxury-gold { color: #c5a059; }
        .statement-table th { border-bottom: 2px solid #1a1a1a; padding: 8px 4px; text-transform: uppercase; font-size: 8pt; letter-spacing: 1px; }
        .statement-table td { padding: 12px 4px; border-bottom: 1px solid #f0f0f0; font-size: 10pt; }
        .footer-label { font-size: 8pt; font-weight: 800; letter-spacing: 1px; color: #666; margin-bottom: 4px; display: block; }
      `}</style>

      {/* TOP LOGO ACCENT */}
      <div className="flex justify-center mb-2">
         <div className="w-12 h-12">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
         </div>
      </div>

      {/* BRANDING SECTION */}
      <div className="text-center mb-6">
        <h1 className="luxury-serif text-[42pt] luxury-gold tracking-[0.05em] uppercase leading-none mb-2">GAUTHAM JEWELLERS</h1>
        
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

      {/* STATEMENT HEADER */}
      <div className="flex justify-between items-baseline border-b border-gray-100 pb-2 mb-4">
        <h2 className="luxury-serif italic text-xl uppercase tracking-widest luxury-dark opacity-60">Layaway Statement</h2>
        <div className="flex gap-12 font-mono text-[10px] font-bold">
          <div className="flex flex-col items-end">
            <span className="text-[8px] text-gray-400 uppercase tracking-widest leading-none mb-1">Bill No</span>
            <span className="text-sm">{billNo}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[8px] text-gray-400 uppercase tracking-widest leading-none mb-1">Date</span>
            <span className="text-sm">{formatDate(new Date().toISOString())}</span>
          </div>
        </div>
      </div>

      {/* VALUED CLIENT SECTION */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div className="border-l-2 border-gray-300 pl-4 py-1">
          <span className="footer-label uppercase">Valued Client</span>
          <p className="font-bold text-lg uppercase tracking-tight">{customerName}</p>
          <p className="text-xs font-mono text-gray-500 mt-1">{customerPhone}</p>
        </div>
        
        <div className="flex flex-col items-end justify-center">
            <div className="text-right">
              <span className="footer-label uppercase opacity-40">Account Status</span>
              <span className={`text-sm font-bold uppercase tracking-widest ${balance <= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {balance <= 0 ? 'SETTLED' : 'PAYMENT PENDING'}
              </span>
            </div>
        </div>
      </div>

      {/* FINANCIAL OVERVIEW */}
      <div className="grid grid-cols-3 gap-6 mb-8 text-center bg-gray-50 p-6 rounded-sm border border-gray-100">
        <div>
          <span className="footer-label uppercase opacity-60">Total Value</span>
          <p className="text-xl font-bold font-mono tracking-tight">{formatCurrency(totalAmount)}</p>
        </div>
        <div className="border-x border-gray-200">
          <span className="footer-label uppercase opacity-60">Total Paid</span>
          <p className="text-xl font-bold font-mono tracking-tight text-green-600">{formatCurrency(paidAmount)}</p>
        </div>
        <div>
          <span className="footer-label uppercase opacity-60">Balance Due</span>
          <p className={`text-xl font-bold font-mono tracking-tight ${balance > 0 ? 'text-red-600' : 'text-gray-400'}`}>{formatCurrency(balance)}</p>
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
      <div className="mt-auto border-t border-gray-200 pt-8 pb-4">
          <div className="grid grid-cols-[1.5fr,1fr] gap-12 mb-8">
             <div className="space-y-4">
                <span className="footer-label uppercase opacity-20">Statement Note</span>
                <div className="text-[8.5px] font-bold text-gray-400 leading-relaxed italic space-y-1.5">
                  <p>• This is an official statement of account for your installment purchase.</p>
                  <p>• Please maintain all individual receipts for final verification at delivery.</p>
                  <p>• Final ornament delivery is subject to full balance clearance.</p>
                </div>
             </div>
             <div className="text-right">
                <span className="footer-label uppercase opacity-20">Store Protocol</span>
                <div className="text-[8.5px] font-bold text-gray-400 leading-relaxed space-y-1 mt-2">
                  <p>Hours: 11:00 AM — 8:30 PM (Monday through Sunday)</p>
                  <p>Accepted: UPI, Major Credit/Debit Cards, Bank Transfer</p>
                  <p>Location: Shivaji Nagar, Bengaluru</p>
                </div>
             </div>
          </div>

          <div className="flex justify-between items-end mt-16 px-4">
              <div className="text-center w-56 border-t border-gray-200 pt-2">
                 <p className="text-[8px] uppercase font-bold text-gray-400 tracking-widest leading-loose">Customer Signature</p>
              </div>
              <div className="text-center w-56">
                 <p className="font-bold text-[10px] uppercase text-charcoal-900 mb-1 tracking-tighter">GAUTHAM JEWELLERS</p>
                 <div className="border-t border-gray-200 pt-2 text-[9px] uppercase font-bold luxury-dark tracking-widest italic leading-none">Authorized Signature</div>
              </div>
          </div>
      </div>

      <div className="mt-8 text-center text-[10px] text-gray-300 uppercase tracking-[0.8em] font-light italic border-t border-gray-100 pt-4">
         Luxury Redefined • Est 2024
      </div>
    </div>
  );
};
