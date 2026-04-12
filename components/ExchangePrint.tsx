
import React from 'react';
import { Customer } from '../types';

interface ExchangePrintProps {
  voucherNo: string;
  date: string;
  customer: Customer | null;
  exchangeData: {
    particulars: string;
    weight: number;
    purity: number | string;
    rate: number;
    total: number;
    hsn_code: string;
  };
  isScreenPreview?: boolean;
}

export const ExchangePrint: React.FC<ExchangePrintProps> = ({
  voucherNo,
  date,
  customer,
  exchangeData,
  isScreenPreview = false
}) => {
  // Format date from ISO string to DD/MM/YY
  const formatDate = (dateStr: string) => {
    if (!dateStr) return new Date().toLocaleDateString('en-GB').replace(/-/g, '/');
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = String(d.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  };

  // Format weight to show 3 decimal places
  const formatWeight = (weight: number) => {
    return weight.toFixed(3);
  };

  // Format rate (no decimals if whole number, otherwise 2 decimals, with commas)
  const formatRate = (rate: number) => {
    if (rate % 1 === 0) {
      return rate.toLocaleString('en-IN');
    }
    return rate.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Format amount (with commas, 2 decimals)
  const formatAmount = (amount: number) => {
    return amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const customerName = customer?.name || 'N/A';
  const finalHsnCode = exchangeData.hsn_code || '7113';

  return (
    <div className={`${isScreenPreview ? 'block w-[148mm] mx-auto shadow-2xl p-6 my-8' : 'hidden print:block w-[148mm] h-[210mm] mx-auto p-0'} bg-white font-sans font-bold`}>
      <style>{`
        @media print {
          @page { margin: 0; size: A5 portrait; }
          body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; font-weight: 500 !important; overflow: hidden !important; }
          .no-print { display: none !important; }
          * { font-size: 7.5pt; color: #1a1a1a !important; }
          h1 { font-size: 18pt !important; color: #c5a059 !important; line-height: 1 !important; margin-bottom: 1.5mm !important; }
          .text-xs { font-size: 6.5pt !important; color: #1a1a1a !important; }
          .luxury-gold { color: #c09a50 !important; }
        }

        .luxury-serif { font-family: 'serif'; font-weight: 900; }
        .luxury-gold { color: #c5a059; }
        
        .exchange-a4-container {
          width: 148mm;
          height: 210mm;
          padding: 8mm;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          background: #fff;
          color: #1a1a1a;
        }

        .luxury-border-box {
          border: 2px solid #1a1a1a;
          padding: 6mm;
          min-height: calc(210mm - 16mm);
          display: flex;
          flex-direction: column;
          position: relative;
          box-sizing: border-box;
          border-radius: 4px;
        }

        .header-section {
          text-align: center;
          margin-bottom: 2mm;
        }

        .voucher-title-box {
          border: 2px solid #1a1a1a;
          padding: 4px 12px;
          display: inline-block;
          margin-top: 4px;
          border-radius: 2px;
          background: #f9f9f9;
        }

        .voucher-title {
          font-family: 'serif';
          font-style: italic;
          font-size: 14pt;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: #1a1a1a;
          font-weight: 900;
          line-height: 1;
        }

        .info-grid {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 4mm;
          margin-bottom: 3mm;
          border: 2px solid #1a1a1a;
          padding: 10px;
          border-radius: 2px;
        }

        .info-label {
          font-size: 7.5pt;
          text-transform: uppercase;
          color: #999;
          letter-spacing: 1px;
          margin-bottom: 1px;
          font-weight: 900;
        }

        .info-value {
          font-size: 11pt;
          font-weight: 900;
          color: #1a1a1a;
        }

        .exchange-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 4mm;
        }

        .exchange-table th {
          border: 2px solid #1a1a1a;
          padding: 6px;
          font-size: 7.5pt;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          background: #f9f9f9;
        }

        .exchange-table td {
          border: 2px solid #1a1a1a;
          padding: 8px;
          font-size: 10pt;
          font-weight: 900;
        }

        .amount-section {
          margin-top: auto;
          display: flex;
          justify-content: flex-end;
          padding: 2mm 0;
        }

        .grand-total-box {
          border: 2px solid #1a1a1a;
          padding: 8px 16px;
          border-radius: 2px;
          background: #f9f9f9;
        }
      `}</style>

      <div className="exchange-a4-container">
        <div className="luxury-border-box">
          {/* TOP LOGO ACCENT */}
          <div className="flex justify-center mb-1">
            <div className="w-10 h-10">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
          </div>

          <div className="header-section">
            <h1 className="luxury-serif text-[18pt] luxury-gold tracking-[0.05em] uppercase leading-none mb-0.5">GAUTAM JEWELLERS</h1>
            <div className="text-center font-bold text-charcoal-900 leading-tight">
               <p className="text-[8.5pt] uppercase tracking-tight"># 27/134, Tannery Road, Near Periyarnagar Circle, Bangalore - 560 005</p>
               <p className="text-[9pt] mt-0.5 font-bold">Ph: 080-25465873, 9740415457</p>
               <p className="text-[8.5pt] mt-0.5"><span className="border-b-2 border-charcoal-900 pb-0.5">GSTIN: 29AATPU7315B1ZA</span></p>
            </div>
            <div className="voucher-title-box">
              <div className="voucher-title">Exchange Voucher</div>
            </div>
          </div>

          {/* CUSTOMER & VOUCHER INFO */}
          <div className="info-grid mt-4">
            <div className="info-item border-r border-charcoal-100 pr-4">
              <div className="info-label">Customer Name</div>
              <div className="info-value font-serif font-black uppercase tracking-tight text-xl">{customerName}</div>
              <div className="text-sm font-mono font-black text-charcoal-700 mt-1">{customer?.phone || 'NO CONTACT PROVIDED'}</div>
            </div>
            <div className="flex flex-col gap-4 pl-4">
               <div className="info-item flex justify-between items-end">
                  <div className="flex flex-col">
                    <div className="info-label">Voucher No</div>
                    <div className="info-value font-mono font-black">{voucherNo}</div>
                  </div>
                  <div className="flex flex-col text-right">
                    <div className="info-label">Date</div>
                    <div className="info-value font-mono font-black">{formatDate(date)}</div>
                  </div>
               </div>
            </div>
          </div>

          {/* EXCHANGE TABLE */}
          <table className="exchange-table mt-2">
            <thead>
              <tr>
                <th style={{ width: '45%' }}>Particulars of Exchange</th>
                <th style={{ width: '10%' }}>HSN</th>
                <th style={{ width: '15%' }}>Net Weight</th>
                <th style={{ width: '10%' }}>Purity</th>
                <th style={{ width: '20%' }}>Market Rate</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ height: '30mm', verticalAlign: 'top' }}>
                  <div className="font-black text-lg uppercase mb-1">{exchangeData.particulars || 'OLD GOLD ORNAMENTS'}</div>
                  <div className="text-[8pt] italic opacity-60 font-black">Verified exchange of precious metal ornaments.</div>
                </td>
                <td className="text-center font-mono font-black text-xs">{finalHsnCode}</td>
                <td className="text-center font-mono font-black text-xl">{formatWeight(exchangeData.weight)}g</td>
                <td className="text-center font-black text-lg">{exchangeData.purity || '-'}</td>
                <td className="text-right font-mono font-black text-lg px-2">₹ {formatRate(exchangeData.rate)}</td>
              </tr>
            </tbody>
          </table>

          {/* FINAL SETTLEMENT */}
          <div className="amount-section">
             <div className="text-right">
                <div className="text-[8px] uppercase font-black text-charcoal-400 tracking-widest mb-1 leading-none">Total Value Information</div>
                <div className="grand-total-box">
                   <div className="flex items-baseline justify-end gap-3 text-charcoal-900">
                      <span className="text-sm font-black uppercase opacity-60">Total Value:</span>
                      <span className="font-black text-4xl mb-[-4px]">{formatAmount(exchangeData.total)}</span>
                   </div>
                </div>
             </div>
          </div>

          {/* TERMS */}
          <div className="mt-6 border-t border-charcoal-900 pt-4">
             <div className="text-[9px] text-charcoal-600 leading-tight text-center px-4 font-black italic">
                <p><b>Declaration:</b> We hereby certify that the above mentioned precious metal/ornaments have been exchanged/purchased as Old Gold from the customer after due verification. The valuation is strictly as per the prevailing market rates and purity standards.</p>
             </div>
          </div>

          {/* SIGNATURES */}
          <div className="flex justify-between items-end mt-12 px-8 italic font-black">
              <div className="text-center w-52 border-t border-charcoal-900 pt-2 font-black">
                 <p className="text-[8px] uppercase font-black text-charcoal-500 tracking-widest">Customer Signature</p>
              </div>
              <div className="text-center w-56 font-black">
                 <p className="font-black text-[9px] uppercase text-charcoal-900 mb-0.5 tracking-tighter">GAUTAM JEWELLERS</p>
                 <div className="border-t border-charcoal-900 pt-2 text-[8.5px] uppercase font-black text-charcoal-900 tracking-widest leading-none">Authorized Signatory</div>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};
