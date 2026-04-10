
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  RotateCcw, 
  Trash2, 
  Printer, 
  Eye, 
  Scale, 
  Coins, 
  TrendingUp, 
  X,
  AlertCircle,
  FileText,
  Edit2,
  RefreshCw
} from 'lucide-react';
import { Button, Input, Select, Card, toast } from '../components/UIComponents';
import { getExchanges, createExchange, updateExchange, deleteExchange, generateBillNo } from '../db';
import { ExchangePrint } from '../components/ExchangePrint';
import { supabase } from '../supabaseClient';

// --- TYPES ---

interface ExchangeRecord {
  id: string;
  date: string;
  referenceNo: string;
  customerName: string;
  customerPhone: string;
  description: string;
  hsnCode: string;
  weight: number;
  purity: string;
  rate: number;
  totalValue: number;
}

// --- MOCK DATA ---

const MOCK_EXCHANGES: ExchangeRecord[] = [
  { 
    id: '1', 
    date: '2024-03-10', 
    referenceNo: 'MK-20240310-EX01', 
    customerName: 'Anjali Menon', 
    customerPhone: '9876543210', 
    description: 'Old Gold Chain (Damaged)', 
    hsnCode: '7113', 
    weight: 12.500, 
    purity: '22K', 
    rate: 6200, 
    totalValue: 77500 
  },
  { 
    id: '2', 
    date: '2024-03-12', 
    referenceNo: 'MK-20240312-EX02', 
    customerName: 'Rajesh Kumar', 
    customerPhone: '9988776655', 
    description: 'Gold Coin', 
    hsnCode: '7118', 
    weight: 5.000, 
    purity: '24K', 
    rate: 6800, 
    totalValue: 34000 
  },
  { 
    id: '3', 
    date: '2024-03-15', 
    referenceNo: 'MK-20240315-EX03', 
    customerName: 'Priya Sharma', 
    customerPhone: '8877665544', 
    description: 'Earrings Pair', 
    hsnCode: '7113', 
    weight: 8.250, 
    purity: '18K', 
    rate: 5100, 
    totalValue: 42075 
  },
];

// --- HELPERS ---

const formatCurrency = (val: number) => 
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(val);

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const getLocalISODate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const GoldExchange: React.FC = () => {
  // --- STATE ---
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Form State
  const initialForm = {
    customerName: '',
    customerPhone: '',
    description: '',
    hsnCode: '7113',
    weight: '',
    purity: '22K',
    rate: '',
    totalValue: 0
  };
  const [formData, setFormData] = useState(initialForm);

  // Print State
  const [selectedRecordForPrint, setSelectedRecordForPrint] = useState<any>(null);

  // --- FETCH DATA ---
  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getExchanges();
      setRecords(data || []);
    } catch (error) {
      console.error('Error fetching exchanges:', error);
      toast({ title: 'Error', description: 'Failed to load exchange records.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- LOGIC ---

  // Auto-calculate Total Value in Form
  useEffect(() => {
    const w = parseFloat(formData.weight) || 0;
    const r = parseFloat(formData.rate) || 0;
    setFormData(prev => ({ ...prev, totalValue: w * r }));
  }, [formData.weight, formData.rate]);

  const filteredRecords = useMemo(() => {
    return records.filter(rec => {
      const matchesSearch = 
        (rec.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        (rec.reference_no || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (rec.customer_phone || '').includes(searchTerm);
      
      const recDate = rec.date || rec.created_at?.split('T')[0];
      const matchesFrom = dateFrom ? recDate >= dateFrom : true;
      const matchesTo = dateTo ? recDate <= dateTo : true;

      return matchesSearch && matchesFrom && matchesTo;
    });
  }, [records, searchTerm, dateFrom, dateTo]);

  const stats = useMemo(() => {
    const totalCount = filteredRecords.length;
    const totalWeight = filteredRecords.reduce((sum, r) => sum + (parseFloat(r.weight) || 0), 0);
    const totalValue = filteredRecords.reduce((sum, r) => sum + (parseFloat(r.total_value) || 0), 0);
    return { totalCount, totalWeight, totalValue };
  }, [filteredRecords]);

  // --- HANDLERS ---

  const handleSave = async () => {
    if (!formData.customerName || !formData.weight || !formData.rate) {
      toast({ title: "Missing Fields", description: "Name, Weight and Rate are required.", variant: 'destructive' });
      return;
    }

    try {
      const recordData = {
        customer_name: formData.customerName,
        customer_phone: formData.customerPhone || 'N/A',
        description: formData.description || 'Old Gold',
        hsn_code: formData.hsnCode,
        weight: parseFloat(formData.weight),
        purity: formData.purity,
        rate: parseFloat(formData.rate),
        total_value: formData.totalValue,
        date: getLocalISODate()
      };

      if (editingId) {
        await updateExchange(editingId, recordData);
        toast({ title: "Record Updated", description: "Exchange record has been updated." });
      } else {
        const referenceNo = await generateBillNo();
        await createExchange({ ...recordData, reference_no: referenceNo });
        toast({ title: "Exchange Recorded", description: `Voucher created successfully.` });
      }

      setFormData(initialForm);
      setEditingId(null);
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving exchange:', error);
      toast({ title: "Error", description: "Failed to save exchange record.", variant: 'destructive' });
    }
  };

  const handleEdit = (rec: any) => {
    setEditingId(rec.id);
    setFormData({
      customerName: rec.customer_name,
      customerPhone: rec.customer_phone,
      description: rec.description,
      hsnCode: rec.hsn_code,
      weight: rec.weight.toString(),
      purity: rec.purity,
      rate: rec.rate.toString(),
      totalValue: rec.total_value
    });
    setIsModalOpen(true);
  };

  const handlePrint = (rec: any) => {
    setSelectedRecordForPrint(rec);
    setTimeout(() => {
      window.print();
      setSelectedRecordForPrint(null);
    }, 500);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this exchange record?')) {
      try {
        await deleteExchange(id);
        toast({ title: "Deleted", description: "Record removed successfully." });
        fetchData();
      } catch (error) {
        toast({ title: "Error", description: "Failed to delete record.", variant: 'destructive' });
      }
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setDateFrom('');
    setDateTo('');
  };

  // --- RENDER ---

  return (
    <div className="h-full flex flex-col bg-[#FDFBF7] text-[#2D2A26] relative overflow-hidden font-sans">
      
      {/* 1. KPI SUMMARY CARDS */}
      <div className="p-6 pb-2 grid grid-cols-3 gap-6 print:hidden">
         
         {/* Card 1: Total Count */}
         <Card className="border-t-4 border-t-[#2D2A26] !p-5 flex items-center justify-between shadow-sm bg-white hover:shadow-md transition-shadow">
            <div>
               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Total Exchanges</p>
               <h3 className="text-3xl font-serif font-bold text-[#2D2A26]">{stats.totalCount}</h3>
               <p className="text-xs text-gray-400 mt-1">Transactions found</p>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-[#2D2A26]">
               <RotateCcw size={20} />
            </div>
         </Card>

         {/* Card 2: Total Weight */}
         <Card className="border-t-4 border-t-[#C5A059] !p-5 flex items-center justify-between shadow-sm bg-gradient-to-br from-white to-[#FDFBF7] hover:shadow-md transition-shadow">
            <div>
               <p className="text-[10px] font-bold text-[#C5A059] uppercase tracking-wider mb-1">Total Gold Weight</p>
               <h3 className="text-3xl font-mono font-bold text-[#2D2A26]">{stats.totalWeight.toFixed(3)} <span className="text-lg text-gray-400 font-sans">g</span></h3>
               <p className="text-xs text-gray-400 mt-1">Net accumulated weight</p>
            </div>
            <div className="w-12 h-12 bg-[#C5A059]/10 rounded-full flex items-center justify-center text-[#C5A059]">
               <Scale size={20} />
            </div>
         </Card>

         {/* Card 3: Total Value */}
         <Card className="border-t-4 border-t-pink-500 !p-5 flex items-center justify-between shadow-sm bg-white hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="relative z-10">
               <p className="text-[10px] font-bold text-pink-500 uppercase tracking-wider mb-1">Total Exchange Value</p>
               <h3 className="text-3xl font-mono font-bold text-[#2D2A26]">{formatCurrency(stats.totalValue)}</h3>
               <p className="text-xs text-gray-400 mt-1">Cash outflow/Credit issued</p>
            </div>
            <div className="w-12 h-12 bg-pink-50 rounded-full flex items-center justify-center text-pink-500 relative z-10">
               <Coins size={20} />
            </div>
            {/* Decorative BG */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-pink-50 rounded-bl-full -z-0 opacity-50" />
         </Card>
      </div>

      {/* 2. COMMAND BAR */}
      <div className="px-6 py-4 flex items-center justify-between sticky top-0 z-20 bg-[#FDFBF7]/80 backdrop-blur-sm print:hidden">
         <div className="flex items-center gap-3 bg-white p-1.5 rounded-md border border-gray-200 shadow-sm">
            <div className="relative w-80">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#C5A059]" size={16} />
               <input 
                 type="text"
                 placeholder="Bill number, customer name, or phone..." 
                 className="w-full pl-9 pr-4 py-2 bg-transparent text-sm text-[#2D2A26] placeholder-gray-400 outline-none"
                 value={searchTerm}
                 onChange={e => setSearchTerm(e.target.value)}
               />
            </div>
            <div className="h-6 w-px bg-gray-200 mx-1"></div>
            <div className="flex items-center gap-2">
               <input 
                 type="date"
                 className="text-xs bg-gray-50 border border-gray-200 rounded px-2 py-2 outline-none focus:border-[#C5A059]"
                 value={dateFrom}
                 onChange={e => setDateFrom(e.target.value)}
               />
               <span className="text-gray-300">-</span>
               <input 
                 type="date"
                 className="text-xs bg-gray-50 border border-gray-200 rounded px-2 py-2 outline-none focus:border-[#C5A059]"
                 value={dateTo}
                 onChange={e => setDateTo(e.target.value)}
               />
            </div>
            {(searchTerm || dateFrom || dateTo) && (
              <button onClick={clearFilters} className="p-2 hover:bg-red-50 text-red-400 rounded transition-colors">
                <Trash2 size={16}/>
              </button>
            )}
         </div>

            <Button variant="outline" size="sm" onClick={fetchData} className="bg-white hover:bg-gray-50 mr-4">
               <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </Button>
            <Button 
               onClick={() => { setEditingId(null); setFormData(initialForm); setIsModalOpen(true); }}
               className="bg-gradient-to-r from-[#C5A059] to-[#B8860B] text-white shadow-lg hover:shadow-[#C5A059]/30 gap-2 px-6 h-12"
            >
            <Plus size={18} /> Record New Exchange
         </Button>
      </div>

      {/* 3. RECORDS TABLE */}
      <div className="flex-1 overflow-auto px-6 pb-6 print:hidden">
         <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden min-h-[400px]">
            <table className="w-full text-left text-sm">
               <thead className="bg-[#F9FAFB] border-b border-gray-200 text-gray-500 font-bold uppercase text-[11px] tracking-wider sticky top-0 z-10">
                  <tr>
                     <th className="py-4 px-6">Date</th>
                     <th className="py-4 px-6">Reference No</th>
                     <th className="py-4 px-6">Customer</th>
                     <th className="py-4 px-6">Description</th>
                     <th className="py-4 px-6 text-right">Weight (g)</th>
                     <th className="py-4 px-6 text-right">Rate (₹)</th>
                     <th className="py-4 px-6 text-right">Total Value</th>
                     <th className="py-4 px-6 text-center w-24">Action</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                  {loading ? (
                     <tr>
                        <td colSpan={8} className="py-20 text-center text-gray-400">
                           <RefreshCw className="animate-spin mx-auto mb-2" size={24}/>
                           <span className="text-xs font-bold uppercase tracking-widest">Loading Records...</span>
                        </td>
                     </tr>
                  ) : filteredRecords.length === 0 ? (
                     <tr>
                        <td colSpan={8} className="py-20 text-center text-gray-400 italic">
                           <div className="flex flex-col items-center gap-3">
                              <AlertCircle size={32} className="opacity-20"/>
                              <span>No exchange records found.</span>
                           </div>
                        </td>
                     </tr>
                  ) : (
                     filteredRecords.map(rec => (
                        <tr key={rec.id} className="hover:bg-[#FFF5F5]/50 transition-colors group border-b border-gray-50 last:border-0">
                           <td className="py-4 px-6 text-gray-500 text-xs font-mono">{formatDate(rec.date || rec.created_at)}</td>
                           <td className="py-4 px-6 font-bold text-[#C5A059] text-xs font-mono">{rec.reference_no}</td>
                           <td className="py-4 px-6">
                              <div className="font-bold text-[#2D2A26]">{rec.customer_name}</div>
                              <div className="text-[10px] text-gray-400 font-mono">{rec.customer_phone}</div>
                           </td>
                           <td className="py-4 px-6 text-gray-600 max-w-xs truncate" title={rec.description}>{rec.description}</td>
                           <td className="py-4 px-6 text-right font-mono font-bold text-[#2D2A26]">{parseFloat(rec.weight).toFixed(3)}</td>
                           <td className="py-4 px-6 text-right font-mono text-gray-500">{parseFloat(rec.rate).toLocaleString()}</td>
                           <td className="py-4 px-6 text-right font-mono font-bold text-pink-700 bg-pink-50/30">
                              {formatCurrency(parseFloat(rec.total_value))}
                           </td>
                           <td className="py-4 px-6 text-center">
                              <div className="flex items-center justify-center gap-3">
                                 <button 
                                   className="p-1.5 hover:bg-gold-50 rounded text-gold-600 transition-colors"
                                   title="Print Voucher"
                                   onClick={() => handlePrint(rec)}
                                 >
                                   <Printer size={16}/>
                                 </button>
                                 <button 
                                   className="p-1.5 hover:bg-blue-50 rounded text-blue-600 transition-colors"
                                   title="Edit Record"
                                   onClick={() => handleEdit(rec)}
                                 >
                                   <Edit2 size={16}/>
                                 </button>
                                 <button 
                                    className="p-1.5 hover:bg-red-50 rounded text-red-500 transition-colors"
                                    title="Delete Record"
                                    onClick={() => handleDelete(rec.id)}
                                 >
                                    <Trash2 size={16}/>
                                 </button>
                              </div>
                           </td>
                        </tr>
                     ))
                  )}
               </tbody>
            </table>
         </div>
      </div>

      {/* 4. PINK SLIP MODAL */}
      {isModalOpen && (
         <div className="fixed inset-0 z-50 bg-[#2D2A26]/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl rounded-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
               
               {/* Modal Header */}
               <div className="bg-pink-600 text-white px-6 py-4 flex justify-between items-center shadow-md z-10">
                  <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-full bg-white text-pink-600 flex items-center justify-center font-bold shadow-inner">
                        {editingId ? <Edit2 size={18}/> : <FileText size={18}/>}
                     </div>
                     <div>
                        <h3 className="font-serif text-lg font-bold tracking-wide">{editingId ? 'Edit Exchange Record' : 'Record Gold Exchange'}</h3>
                        <p className="text-[10px] text-pink-100 uppercase tracking-widest font-medium">Issue Pink Slip Voucher</p>
                     </div>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="text-pink-200 hover:text-white transition-colors">
                     <X size={24}/>
                  </button>
               </div>

               {/* Modal Body: Pink Theme */}
               <div className="p-8 bg-[#FFF5F5] overflow-y-auto flex-1">
                  
                  {/* Customer Section */}
                  <div className="bg-white p-5 rounded-lg border border-pink-100 shadow-sm mb-6">
                     <h4 className="text-xs font-bold text-pink-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        Client Details
                     </h4>
                     <div className="grid grid-cols-2 gap-4">
                        <Input 
                           label="Customer Name" 
                           placeholder="Full Name" 
                           value={formData.customerName} 
                           onChange={e => setFormData({...formData, customerName: e.target.value})}
                        />
                        <Input 
                           label="Phone Number" 
                           placeholder="Mobile No" 
                           value={formData.customerPhone} 
                           onChange={e => setFormData({...formData, customerPhone: e.target.value})}
                        />
                     </div>
                  </div>

                  {/* Item Section */}
                  <div className="bg-white p-5 rounded-lg border border-pink-100 shadow-sm">
                     <h4 className="text-xs font-bold text-pink-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        Item Specifications
                     </h4>
                     <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                           <div className="col-span-2">
                              <Input 
                                 label="Particulars / Description" 
                                 placeholder="e.g. Old Gold Chain" 
                                 value={formData.description} 
                                 onChange={e => setFormData({...formData, description: e.target.value})}
                              />
                           </div>
                           <div className="col-span-1">
                              <Input 
                                 label="HSN Code" 
                                 value={formData.hsnCode} 
                                 isMonospaced
                                 onChange={e => setFormData({...formData, hsnCode: e.target.value})}
                              />
                           </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                           <Input 
                              label="Weight (g)" 
                              type="number"
                              placeholder="0.000"
                              isMonospaced
                              value={formData.weight} 
                              onChange={e => setFormData({...formData, weight: e.target.value})}
                           />
                           <Select 
                              label="Purity"
                              options={[
                                 {value: '22K', label: '22K (916)'},
                                 {value: '18K', label: '18K (750)'},
                                 {value: '14K', label: '14K (585)'},
                                 {value: '24K', label: '24K (999)'},
                                 {value: 'Other', label: 'Other'},
                              ]}
                              value={formData.purity} 
                              onChange={e => setFormData({...formData, purity: e.target.value})}
                           />
                           <Input 
                              label="Rate / gm (₹)" 
                              type="number"
                              isMonospaced
                              placeholder="0.00"
                              value={formData.rate} 
                              onChange={e => setFormData({...formData, rate: e.target.value})}
                           />
                        </div>
                     </div>
                  </div>
               </div>

               {/* Modal Footer: Calculation */}
               <div className="bg-white p-5 border-t border-gray-200 flex justify-between items-center z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                  <div>
                     <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Exchange Value</p>
                     <p className="text-3xl font-mono font-bold text-pink-600 tracking-tight">
                        {formatCurrency(formData.totalValue)}
                     </p>
                  </div>
                  <div className="flex gap-3">
                     <Button variant="outline" onClick={() => { setIsModalOpen(false); setEditingId(null); setFormData(initialForm); }}>Cancel</Button>
                     <Button 
                        onClick={handleSave} 
                        className="bg-pink-600 hover:bg-pink-700 text-white shadow-lg shadow-pink-200 px-8"
                     >
                        {editingId ? 'Update Exchange' : 'Confirm Exchange'}
                     </Button>
                  </div>
               </div>

            </div>
         </div>
      )}

      {/* 5. PRINT COMPONENT */}
      <div className="hidden print:block">
        {selectedRecordForPrint && (
          <ExchangePrint 
            voucherNo={selectedRecordForPrint.reference_no}
            date={selectedRecordForPrint.date || selectedRecordForPrint.created_at}
            customer={{ name: selectedRecordForPrint.customer_name, phone: selectedRecordForPrint.customer_phone } as any}
            exchangeData={{
              particulars: selectedRecordForPrint.description,
              weight: parseFloat(selectedRecordForPrint.weight),
              purity: selectedRecordForPrint.purity,
              rate: parseFloat(selectedRecordForPrint.rate),
              total: parseFloat(selectedRecordForPrint.total_value),
              hsn_code: selectedRecordForPrint.hsn_code
            }}
          />
        )}
      </div>

    </div>
  );
};
