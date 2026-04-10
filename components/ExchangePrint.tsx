
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
    <div className={`${isScreenPreview ? 'block w-[210mm] mx-auto shadow-2xl p-8 my-8' : 'hidden print:block w-[210mm] h-[297mm] mx-auto p-0'} bg-white font-sans font-bold`}>
      <style>{`
        @media print {
          @page { margin: 0; size: A4 portrait; }
          body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; font-weight: 500 !important; }
          .no-print { display: none !important; }
          * { font-size: 11pt; color: #1a1a1a !important; }
          h1 { font-size: 36pt !important; color: #c5a059 !important; }
          .text-xs { font-size: 8pt !important; color: #1a1a1a !important; }
          .luxury-gold { color: #c5a059 !important; }
        }

        .luxury-serif { font-family: 'serif'; font-weight: 900; }
        .luxury-gold { color: #c5a059; }
        
        .exchange-a4-container {
          width: 210mm;
          height: 297mm;
          padding: 6mm;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          background: #fff;
          color: #1a1a1a;
        }

        .luxury-border-box {
          border: 4px solid #1a1a1a;
          padding: 6mm 10mm;
          min-height: calc(297mm - 12mm - 2px);
          display: flex;
          flex-direction: column;
          position: relative;
          box-sizing: border-box;
        }

        .inner-accent-border {
          position: absolute;
          top: 4px;
          left: 4px;
          right: 4px;
          bottom: 4px;
          border: 1px solid #c5a059;
          pointer-events: none;
        }

        .header-section {
          text-align: center;
          margin-bottom: 2mm;
        }

        .voucher-title {
          font-family: 'serif';
          font-style: italic;
          font-size: 18pt;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          margin: 2mm 0;
          border-bottom: 1px solid #f0f0f0;
          display: inline-block;
          padding-bottom: 1mm;
          color: #c5a059;
          font-weight: 900;
        }

        .info-grid {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 6mm;
          margin-bottom: 4mm;
          border-bottom: 1px solid #f0f0f0;
          padding-bottom: 2mm;
        }

        .info-label {
          font-size: 7.5pt;
          text-transform: uppercase;
          color: #999;
          letter-spacing: 1px;
          margin-bottom: 1px;
          font-weight: 800;
        }

        .info-value {
          font-size: 13pt;
          font-weight: 800;
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
          font-size: 8.5pt;
          text-transform: uppercase;
          letter-spacing: 1px;
          background: #f9f9f9;
        }

        .exchange-table td {
          border: 2px solid #1a1a1a;
          padding: 10px 10px;
          font-size: 11.5pt;
        }

        .amount-section {
          margin-top: auto;
          display: flex;
          justify-content: flex-end;
          padding: 2mm 0;
        }

        .grand-total-box {
          border-bottom: 5px double #1a1a1a;
          padding: 2px 0;
        }

        .signature-row {
          display: flex;
          justify-content: space-between;
          margin-top: 10mm;
          padding: 0 4mm;
        }

        .sig-box {
          border-top: 1px solid #e5e7eb;
          width: 50mm;
          text-align: center;
          padding-top: 1mm;
          font-size: 8.5pt;
          color: #999;
          text-transform: uppercase;
          font-weight: 800;
          letter-spacing: 0.5px;
        }
      `}</style>

      <div className="exchange-a4-container">
        <div className="luxury-border-box">
          <div className="inner-accent-border"></div>

          {/* TOP LOGO ACCENT */}
          <div className="flex justify-center mb-1">
            <div className="w-10 h-10">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
          </div>

          <div className="header-section">
            <h1 className="luxury-serif text-[40pt] luxury-gold tracking-[0.05em] uppercase leading-none mb-1">GAUTHAM JEWELLERS</h1>
            <div className="text-center font-bold text-charcoal-900 leading-tight">
               <p className="text-[10pt] uppercase tracking-tight"># 27/134, Tannery Road, Near Periyarnagar Circle, Bangalore - 560 005</p>
               <p className="text-[11pt] mt-0.5 font-bold">Ph: 080-25465873, 9740415457</p>
               <p className="text-[10pt] mt-0.5"><span className="border-b-2 border-charcoal-900 pb-0.5">GSTIN: 29AATPU7315B1ZA</span></p>
            </div>
            <div className="voucher-title">Exchange Voucher</div>
          </div>

          {/* CUSTOMER & VOUCHER INFO */}
          <div className="info-grid">
            <div className="info-item">
              <div className="info-label">Customer Name</div>
              <div className="info-value font-serif font-bold uppercase tracking-tight">{customerName}</div>
              <div className="text-xs font-mono opacity-60 mt-1">{customer?.phone || 'NO CONTACT PROVIDED'}</div>
            </div>
            <div className="flex flex-col gap-4">
               <div className="info-item flex justify-between items-end">
                  <div className="flex flex-col">
                    <div className="info-label">Voucher Number</div>
                    <div className="info-value font-mono font-bold">{voucherNo}</div>
                  </div>
                  <div className="flex flex-col text-right">
                    <div className="info-label">Date</div>
                    <div className="info-value font-mono font-bold">{formatDate(date)}</div>
                  </div>
               </div>
            </div>
          </div>

          {/* EXCHANGE TABLE */}
          <table className="exchange-table">
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
                <td style={{ height: '40mm', verticalAlign: 'top' }}>
                  <div className="font-bold text-xl uppercase mb-2">{exchangeData.particulars || 'OLD GOLD ORNAMENTS'}</div>
                  <div className="text-xs italic opacity-60">Verified exchange of precious metal ornaments.</div>
                </td>
                <td className="text-center font-mono">{finalHsnCode}</td>
                <td className="text-center font-mono font-bold text-2xl">{formatWeight(exchangeData.weight)}g</td>
                <td className="text-center font-bold text-xl">{exchangeData.purity || '-'}</td>
                <td className="text-right font-mono font-bold text-xl">₹ {formatRate(exchangeData.rate)}</td>
              </tr>
            </tbody>
          </table>

          {/* FINAL SETTLEMENT */}
          <div className="amount-section">
             <div className="text-right">
                <div className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-1 leading-none">Total Exchange Value</div>
                <div className="grand-total-box">
                   <div className="flex items-baseline justify-end gap-2">
                      <span className="luxury-serif luxury-gold text-2xl uppercase">INR</span>
                      <span className="luxury-serif text-5xl text-charcoal-900 leading-none">{formatAmount(exchangeData.total)}</span>
                   </div>
                </div>
                <div className="text-[10px] italic font-bold uppercase mt-2 opacity-40 tracking-widest leading-none">
                   Valuation based on daily certified metal rates.
                </div>
             </div>
          </div>

          {/* TERMS */}
          <div className="mt-8 border-t border-gray-100 pt-6">
             <div className="text-[9px] text-gray-400 leading-relaxed text-justify px-4 font-bold italic">
                <p><b>Declaration:</b> We hereby certify that the above mentioned precious metal/ornaments have been exchanged/purchased as Old Gold from the customer after due verification. The valuation is strictly as per the prevailing market rates and purity standards. This voucher is valid for settlement against new purchases within one week from the date of issue.</p>
             </div>
          </div>

          {/* SIGNATURES */}
          <div className="flex justify-between items-end mt-20 px-4">
              <div className="text-center w-56 border-t border-gray-200 pt-2">
                 <p className="text-[8px] uppercase font-bold text-gray-400 tracking-widest leading-loose">Customer Signature</p>
              </div>
              <div className="text-center w-56">
                 <p className="font-bold text-[10px] uppercase text-charcoal-900 mb-1 tracking-tighter">GAUTHAM JEWELLERS</p>
                 <div className="border-t border-gray-200 pt-2 text-[9px] uppercase font-bold text-charcoal-900 tracking-widest italic leading-none">Authorized Signature</div>
              </div>
          </div>

          <div className="mt-auto text-center pt-8">
             <div className="text-[10px] text-gray-300 uppercase tracking-[1em] font-light italic">
                Luxury Redefined • Est 2024
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
