
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Printer, 
  Trash2, 
  X,
  RotateCcw,
  Clock,
  AlertCircle,
  Users,
  Wallet,
  PlusCircle,
  Eye,
  CheckCircle2,
  FileText,
  RefreshCw,
  TrendingUp,
  Edit2
} from 'lucide-react';
import { Button, Input, Select, Card, toast } from '../components/UIComponents';
import { supabase } from '../supabaseClient';
import { 
  createLayawayTransaction, 
  getLayawayTransactions, 
  updateLayawayTransaction, 
  deleteLayawayTransaction 
} from '../db';
import { LayawayStatementPrint } from '../components/LayawayStatementPrint';

// --- TYPES ---

type PaymentMode = 'Cash' | 'Card' | 'UPI' | 'Bank Transfer';

interface Transaction {
  id: string;
  bill_id: string;
  date: string;
  amount: number;
  mode: PaymentMode;
  reference?: string;
  notes?: string;
  customer_name: string; // Denormalized for UI
}

interface Bill {
  id: string;
  bill_no: string;
  customer_name: string;
  customer_phone: string;
  item_name: string; // Summary of items
  total_amount: number;
  paid_amount: number;
  last_payment_date?: string;
  created_at: string;
}

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

// --- COMPONENTS ---

export const Layaway: React.FC = () => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'closed'>('active');

  const fetchLayawayData = async () => {
    setLoading(true);
    try {
      // 1. Fetch all layaway transactions
      const { data: txns, error: txnsError } = await supabase
        .from('layaway_transactions')
        .select(`
          *,
          bills (
            *,
            customers (name, phone),
            bill_items (item_name)
          )
        `)
        .order('payment_date', { ascending: false });

      if (txnsError) throw txnsError;

      // 2. Process transactions into UI state
      const formattedTxns: Transaction[] = txns.map(t => {
        // Map DB snake_case/lowercase to UI labels
        let uiMode: PaymentMode = 'Cash';
        if (t.payment_method === 'upi') uiMode = 'UPI';
        else if (t.payment_method === 'card') uiMode = 'Card';
        else if (t.payment_method === 'bank_transfer') uiMode = 'Bank Transfer';
        
        return {
          id: t.id.toString(),
          bill_id: t.bill_id.toString(),
          date: t.payment_date,
          amount: parseFloat(t.amount),
          mode: uiMode,
          reference: t.reference_number,
          notes: t.notes,
          customer_name: t.bills?.customers?.name || 'Unknown'
        };
      });
      setTransactions(formattedTxns);

      // 3. Process bills from transactions (grouping)
      const billMap = new Map<string, Bill>();
      
      txns.forEach(t => {
        const b = t.bills;
        if (!b || billMap.has(b.id.toString())) {
          // If bill already in map, just add the transaction amount
          if (b && billMap.has(b.id.toString())) {
            const existing = billMap.get(b.id.toString())!;
            existing.paid_amount += parseFloat(t.amount);
            // Update last payment date if newer
            if (!existing.last_payment_date || t.payment_date > existing.last_payment_date) {
              existing.last_payment_date = t.payment_date;
            }
          }
          return;
        }

        const itemsSummary = b.bill_items?.map((bi: any) => bi.item_name).join(', ') || 'No Items';
        
        billMap.set(b.id.toString(), {
          id: b.id.toString(),
          bill_no: b.bill_no,
          customer_name: b.customers?.name || 'Walk-in Customer',
          customer_phone: b.customers?.phone || '-',
          item_name: itemsSummary,
          total_amount: parseFloat(b.grand_total),
          paid_amount: parseFloat(t.amount),
          last_payment_date: t.payment_date,
          created_at: b.bill_date
        });
      });

      setBills(Array.from(billMap.values()));
    } catch (err: any) {
      console.error('Error fetching layaway data:', err);
      toast({ title: 'Error', description: 'Failed to load layaway records.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLayawayData();
  }, []);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Modals
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null); // For Ledger View
  const [paymentBill, setPaymentBill] = useState<Bill | null>(null); // For Adding Payment
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null); // For Editing Existing
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false); // For Linking New Bill
  const [showStatementPreview, setShowStatementPreview] = useState(false); // For Statement Print Preview

  // Link Bill Form State
  const [linkForm, setLinkForm] = useState({
    searchBillNo: '',
    foundBill: null as Bill | null,
    searchError: '',
    paymentDate: getLocalISODate(),
    paymentAmount: '',
    paymentMode: 'Cash',
    reference: '',
    notes: ''
  });

  // Add Transaction Form State
  const [paymentForm, setPaymentForm] = useState({
    date: getLocalISODate(),
    amount: '',
    mode: 'Cash',
    reference: '',
    notes: ''
  });

  // --- LOGIC ---

  const { filteredBills, stats } = useMemo(() => {
    const totalTransactions = transactions.length;
    const totalTransactionAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
    const avgTransaction = totalTransactions > 0 ? totalTransactionAmount / totalTransactions : 0;

    const filtered = bills.filter(bill => {
      const remaining = bill.total_amount - bill.paid_amount;
      const isClosed = remaining <= 0;
      
      if (activeTab === 'active' && isClosed) return false;
      if (activeTab === 'closed' && !isClosed) return false;

      const searchMatch = 
        bill.bill_no.toLowerCase().includes(searchTerm.toLowerCase()) || 
        bill.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bill.customer_phone.includes(searchTerm);
      if (!searchMatch) return false;

      if (dateFrom && bill.created_at < dateFrom) return false;
      if (dateTo && bill.created_at > dateTo) return false;

      return true;
    });

    return { filteredBills: filtered, stats: { totalTransactions, totalTransactionAmount, avgTransaction } };
  }, [bills, transactions, activeTab, searchTerm, dateFrom, dateTo]);

  const clearFilters = () => {
    setSearchTerm('');
    setDateFrom('');
    setDateTo('');
  };

  // --- LINK BILL HANDLERS ---

  const handleSearchBill = async () => {
    if (!linkForm.searchBillNo) return;
    setLoading(true);
    try {
      const { data: bill, error } = await supabase
        .from('bills')
        .select('*, customers(name, phone), bill_items(item_name)')
        .eq('bill_no', linkForm.searchBillNo.trim())
        .single();
      
      if (error || !bill) {
        setLinkForm(prev => ({ ...prev, foundBill: null, searchError: 'Bill not found in sales records.' }));
        return;
      }

      // Process found bill into the local interface
      const itemsSummary = bill.bill_items?.map((bi: any) => bi.item_name).join(', ') || 'No Items';
      const found: Bill = {
        id: bill.id.toString(),
        bill_no: bill.bill_no,
        customer_name: bill.customers?.name || 'Walk-in Customer',
        customer_phone: bill.customers?.phone || '-',
        item_name: itemsSummary,
        total_amount: parseFloat(bill.grand_total),
        paid_amount: 0, // We will calculate this if we find transactions
        created_at: bill.bill_date
      };

      // Check if already in layaway (has transactions)
      const alreadyExists = bills.find(b => b.bill_no === found.bill_no);
      if (alreadyExists) {
         setLinkForm(prev => ({ ...prev, foundBill: null, searchError: 'Bill is already being tracked in Layaway.' }));
      } else {
         setLinkForm(prev => ({ ...prev, foundBill: found, searchError: '' }));
      }
    } catch (err) {
      setLinkForm(prev => ({ ...prev, foundBill: null, searchError: 'Error searching for bill.' }));
    } finally {
      setLoading(false);
    }
  };

  const handleLinkBillSubmit = async () => {
    if (!linkForm.foundBill) return;

    const amount = parseFloat(linkForm.paymentAmount) || 0;
    const bill = linkForm.foundBill;
    const remaining = bill.total_amount - bill.paid_amount;

    if (amount > remaining) {
      toast({ title: "Invalid Amount", description: "Payment exceeds remaining balance", variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      // 1. Add Transaction if amount > 0
      if (amount > 0) {
        await createLayawayTransaction({
          bill_id: parseInt(bill.id),
          payment_date: linkForm.paymentDate,
          amount: amount,
          payment_method: linkForm.paymentMode.toLowerCase().replace(' / gpay', '').replace(' ', '_'),
          reference_number: linkForm.reference,
          notes: linkForm.notes || 'Initial Tracking Payment'
        });
      } else {
        // If 0, we might need a dummy record to start tracking, 
        // but user's logic implies sum. Let's record a 0 payment if they really want to track.
        // Or just toast that they should add at least some payment.
        toast({ title: "Initial Payment Recommended", description: "Link a bill with at least some payment to start tracking." });
        setLoading(false);
        return;
      }

      toast({ title: "Bill Linked", description: `${bill.bill_no} added to Layaway tracking.` });
      fetchLayawayData();
      setIsLinkModalOpen(false);
      setLinkForm({
        searchBillNo: '',
        foundBill: null,
        searchError: '',
        paymentDate: getLocalISODate(),
        paymentAmount: '',
        paymentMode: 'Cash',
        reference: '',
        notes: ''
      });
    } catch (err: any) {
      console.error('Error linking bill:', err);
      toast({ title: "Error", description: "Failed to link bill.", variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // --- EXISTING ACTIONS HANDLERS ---

  const handleOpenPayment = (bill: Bill, e: React.MouseEvent) => {
    e.stopPropagation();
    setPaymentBill(bill);
    setPaymentForm({
      date: getLocalISODate(),
      amount: '',
      mode: 'Cash',
      reference: '',
      notes: ''
    });
  };
  
  const handleViewLedger = (bill: Bill, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedBill(bill);
  };

  const handleOpenStatementPreview = (bill: Bill, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedBill(bill);
    setShowStatementPreview(true);
  };

  const handleActualPrint = () => {
    setShowStatementPreview(false);
    setTimeout(() => window.print(), 100);
  };

  const handleDeleteBill = async (billId: string) => {
    if (!confirm('Are you sure you want to stop tracking this bill in Layaway? This will delete all associated layaway payment records.')) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('layaway_transactions')
        .delete()
        .eq('bill_id', parseInt(billId));
      
      if (error) throw error;
      
      toast({ title: "Layaway Tracking Removed", description: "The bill and its payment history have been removed from Layaway." });
      fetchLayawayData();
    } catch (err: any) {
      console.error('Error deleting layaway record:', err);
      toast({ title: "Error", description: "Failed to remove layaway record.", variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPayment = async () => {
    const targetBill = paymentBill || (editingTransaction ? bills.find(b => b.id === editingTransaction.bill_id) : null);
    if (!targetBill) return;

    const amount = parseFloat(paymentForm.amount);
    
    // For new payments, check overpayment. For edits, we need to consider the difference.
    const currentPaidForThisBill = transactions
      .filter(t => t.bill_id === targetBill.id && (!editingTransaction || t.id !== editingTransaction.id))
      .reduce((sum, t) => sum + t.amount, 0);
    
    const remaining = targetBill.total_amount - currentPaidForThisBill;

    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Invalid Amount", description: "Please enter a valid amount.", variant: 'destructive' });
      return;
    }
    if (amount > remaining + 0.01) { 
      toast({ title: "Overpayment", description: `Amount exceeds balance of ${formatCurrency(remaining)}`, variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const transactionData = {
        bill_id: parseInt(targetBill.id),
        payment_date: paymentForm.date,
        amount: amount,
        payment_method: paymentForm.mode.toLowerCase().replace(' / gpay', '').replace(' ', '_'),
        reference_number: paymentForm.reference,
        notes: paymentForm.notes
      };

      if (editingTransaction) {
        await updateLayawayTransaction(parseInt(editingTransaction.id), transactionData);
        toast({ title: "Payment Updated", description: "Transaction details updated successfully." });
      } else {
        await createLayawayTransaction(transactionData);
        toast({ title: "Payment Recorded", description: `${formatCurrency(amount)} received for ${targetBill.bill_no}` });
      }

      fetchLayawayData();
      setPaymentBill(null);
      setEditingTransaction(null);
    } catch (err: any) {
      console.error('Error submitting payment:', err);
      toast({ title: "Error", description: "Failed to record payment.", variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleEditTransaction = (tx: Transaction, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTransaction(tx);
    setPaymentForm({
      date: tx.date,
      amount: tx.amount.toString(),
      mode: tx.mode,
      reference: tx.reference || '',
      notes: tx.notes || ''
    });
  };

  const handleDeleteTransaction = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this transaction? This will affect the bill balance.')) return;
    
    setLoading(true);
    try {
      await deleteLayawayTransaction(parseInt(id));
      toast({ title: "Transaction Deleted", description: "The payment has been removed." });
      fetchLayawayData();
    } catch (err: any) {
      console.error('Error deleting transaction:', err);
      toast({ title: "Error", description: "Failed to delete transaction.", variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // --- MODAL: LEDGER HISTORY ---
  
  const LedgerModal = () => {
    if (!selectedBill) return null;
    const currentBill = bills.find(b => b.id === selectedBill.id) || selectedBill;
    const history = transactions.filter(t => t.bill_id === currentBill.id);
    const balance = currentBill.total_amount - currentBill.paid_amount;

    return (
      <div className="fixed inset-0 bg-charcoal-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden">
        <div className="bg-white w-full max-w-4xl rounded-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
          
          <div className="bg-slate-700 p-6 flex justify-between items-start text-white">
            <div className="flex gap-6 items-center">
               <div className="w-12 h-12 bg-slate-600 rounded-full flex items-center justify-center text-gold-500 font-bold border border-slate-500">
                  {currentBill.customer_name.charAt(0)}
               </div>
               <div>
                 <h2 className="text-xl font-bold tracking-wide">{currentBill.customer_name}</h2>
                 <div className="flex items-center gap-3 text-sm text-slate-300 font-mono mt-1">
                    <span>{currentBill.bill_no}</span>
                    <span className="w-1 h-1 bg-slate-400 rounded-full"/>
                    <span>{currentBill.customer_phone}</span>
                 </div>
               </div>
            </div>
            
            <div className="text-right flex flex-col items-end gap-2">
               <div>
                 <p className="text-xs uppercase font-bold text-slate-400 tracking-wider">Remaining Balance</p>
                 <p className={`text-3xl font-mono font-bold mt-1 ${balance > 0 ? "text-red-300" : "text-green-300"}`}>{formatCurrency(balance)}</p>
               </div>
               
               <div className="w-64 bg-slate-600/50 p-3 rounded-lg border border-slate-500/50">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[10px] font-bold text-gold-500 uppercase tracking-widest">
                      {Math.min(Math.round((currentBill.paid_amount / currentBill.total_amount) * 100), 100)}% Paid
                    </span>
                    <span className="text-[10px] font-mono text-slate-300">
                      {formatCurrency(currentBill.paid_amount)} / {formatCurrency(currentBill.total_amount)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden border border-slate-600">
                    <div 
                      className="bg-gold-500 h-full rounded-full transition-all duration-700 ease-out" 
                      style={{ width: `${Math.min(Math.round((currentBill.paid_amount / currentBill.total_amount) * 100), 100)}%` }}
                    />
                  </div>
               </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto bg-gray-50 p-6">
             <div className="bg-white border border-gray-200 rounded shadow-sm">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 text-charcoal-700 font-bold uppercase text-[11px] border-b border-gray-200">
                    <tr>
                      <th className="py-3 px-4 text-left">Date</th>
                      <th className="py-3 px-4 text-left">Reference</th>
                      <th className="py-3 px-4 text-left">Mode</th>
                      <th className="py-3 px-4 text-right">Amount Received</th>
                      <th className="py-3 px-4 text-center w-40">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {history.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-gray-400">No transactions recorded yet.</td>
                      </tr>
                    ) : (
                      history.map((tx) => (
                        <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4 font-mono text-charcoal-600">{formatDate(tx.date)}</td>
                          <td className="py-3 px-4 text-gray-500 font-mono text-xs">
                             <div className="flex flex-col">
                               <span>{tx.reference || '-'}</span>
                               {tx.notes && <span className="text-[10px] text-gray-400 italic truncate max-w-[120px]">{tx.notes}</span>}
                             </div>
                          </td>
                          <td className="py-3 px-4 font-medium text-charcoal-800">{tx.mode}</td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-green-700">
                            {formatCurrency(tx.amount)}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-center gap-2">
                              <button 
                                onClick={(e) => handleEditTransaction(tx, e)}
                                title="Edit Payment" 
                                className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button 
                                onClick={(e) => handleDeleteTransaction(tx.id, e)}
                                title="Delete Payment" 
                                className="p-1.5 text-red-300 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                              <button title="Print Receipt" className="p-1.5 text-gray-400 hover:text-charcoal-900 hover:bg-gray-100 rounded transition-colors">
                                <Printer size={16} />
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

          <div className="p-4 bg-white border-t border-gray-200 flex justify-end gap-3">
             <Button variant="ghost" onClick={() => setSelectedBill(null)}>Close Ledger</Button>
             <Button className="bg-slate-800 text-white hover:bg-slate-900" onClick={(e) => handleOpenStatementPreview(currentBill, e)}>
                <Printer size={16} className="mr-2"/> Print Full Statement
             </Button>
          </div>
        </div>
      </div>
    );
  };

  // --- RENDER MAIN ---

  return (
    <div className="h-full flex flex-col bg-app-bg relative overflow-hidden">
      
      <div className="flex-1 flex flex-col overflow-hidden print-hidden print:hidden">
        {/* 1. KPI DASHBOARD */}
        <div className="p-6 pb-2 grid grid-cols-3 gap-6 print:hidden">
        <Card className="border-l-4 border-l-gold-500 !p-4 flex items-center justify-between shadow-sm">
           <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Transactions</p>
              <h3 className="text-2xl font-bold text-charcoal-900 mt-1">{stats.totalTransactions}</h3>
           </div>
           <div className="w-10 h-10 bg-gold-50 rounded-full flex items-center justify-center text-gold-500">
             <FileText size={20} />
           </div>
        </Card>

        <Card className="border-l-4 border-l-green-500 !p-4 flex items-center justify-between shadow-sm">
           <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Amount Collected</p>
              <h3 className="text-2xl font-bold text-charcoal-900 mt-1">{formatCurrency(stats.totalTransactionAmount)}</h3>
           </div>
           <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-green-600">
             <Wallet size={20} />
           </div>
        </Card>

        <Card className="border-l-4 border-l-charcoal-700 !p-4 flex items-center justify-between shadow-sm">
           <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Avg. Transaction</p>
              <h3 className="text-2xl font-bold text-charcoal-900 mt-1">{formatCurrency(stats.avgTransaction)}</h3>
           </div>
           <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-charcoal-700">
             <TrendingUp size={20} />
           </div>
        </Card>
      </div>

      {/* 2. TABS & FILTER BAR */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 space-y-4 shadow-sm print:hidden">
        
        {/* Tabs */}
        <div className="flex gap-6 border-b border-gray-100">
          <button 
            onClick={() => setActiveTab('active')}
            className={`pb-3 text-sm font-bold uppercase tracking-wide transition-all border-b-2 ${activeTab === 'active' ? 'border-gold-500 text-charcoal-900' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
          >
            Active Bills ({bills.filter(b => (b.total_amount - b.paid_amount) > 0).length})
          </button>
          <button 
            onClick={() => setActiveTab('closed')}
            className={`pb-3 text-sm font-bold uppercase tracking-wide transition-all border-b-2 ${activeTab === 'closed' ? 'border-charcoal-900 text-charcoal-900' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
          >
            Closed Bills ({bills.filter(b => (b.total_amount - b.paid_amount) <= 0).length})
          </button>
        </div>

        {/* Global Command Bar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
             <input 
                type="text"
                placeholder="Bill No, Phone, or Name..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white text-charcoal-900 border border-gray-300 rounded-md text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none shadow-sm transition-all placeholder-gray-400"
             />
          </div>
          
          <div className="flex items-center gap-2 border-l border-gray-300 pl-3">
             <span className="text-xs font-bold text-gray-400 uppercase">Date:</span>
             <input 
               type="date" 
               value={dateFrom}
               onChange={(e) => setDateFrom(e.target.value)}
               className="text-xs bg-white text-charcoal-900 border border-gray-300 rounded px-2 py-1.5 outline-none focus:border-gold-500"
             />
             <span className="text-gray-300">-</span>
             <input 
               type="date" 
               value={dateTo}
               onChange={(e) => setDateTo(e.target.value)}
               className="text-xs bg-white text-charcoal-900 border border-gray-300 rounded px-2 py-1.5 outline-none focus:border-gold-500"
             />
          </div>

          {(searchTerm || dateFrom || dateTo) && (
            <button 
              onClick={clearFilters}
              className="flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-red-500 transition-colors ml-2"
            >
              <RotateCcw size={12}/> Clear
            </button>
          )}

          <div className="flex-1"></div>
          
          {/* New Layaway Button */}
          <Button onClick={() => setIsLinkModalOpen(true)} className="shadow-lg gap-2">
            <Plus size={18}/> New Layaway
          </Button>
        </div>
      </div>

      {/* 3. MAIN BILLS TABLE */}
      <div className="flex-1 overflow-auto p-6 print:hidden">
        <div className="bg-white border border-gray-200 rounded-lg shadow-card overflow-hidden">
           <table className="w-full text-left text-sm">
             <thead className="bg-gray-50 border-b border-gray-200 text-charcoal-700 font-bold uppercase text-[11px] tracking-wider sticky top-0 z-10">
               <tr>
                 <th className="py-4 px-6">Bill No</th>
                 <th className="py-4 px-6">Customer Details</th>
                 <th className="py-4 px-6">Bill Date</th>
                 <th className="py-4 px-6">Progress</th>
                 <th className="py-4 px-6 text-right">Total Amount</th>
                 <th className="py-4 px-6 text-right">Total Paid</th>
                 <th className="py-4 px-6 text-right">Remaining</th>
                 <th className="py-4 px-6 text-center">Status</th>
                 <th className="py-4 px-6 text-center w-32">Actions</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-gray-100">
               {loading && bills.length === 0 ? (
                 <tr>
                    <td colSpan={8} className="py-20 text-center text-gray-400">
                      <div className="flex flex-col items-center gap-2">
                        <RefreshCw className="animate-spin text-gold-500" size={24} />
                        <span className="text-xs uppercase font-bold tracking-wide">Retrieving Records...</span>
                      </div>
                    </td>
                 </tr>
               ) : filteredBills.length === 0 ? (
                 <tr>
                   <td colSpan={8} className="py-12 text-center text-gray-400">
                     <div className="flex flex-col items-center gap-2">
                       <AlertCircle size={24} className="opacity-20"/>
                       <span>No bills found matching current filters.</span>
                     </div>
                   </td>
                 </tr>
               ) : (
                 filteredBills.map((bill) => {
                    const remaining = bill.total_amount - bill.paid_amount;
                    const isClosed = remaining <= 0;
                    
                    return (
                      <tr 
                        key={bill.id} 
                        className="hover:bg-gold-50/30 transition-colors group"
                      >
                        <td className="py-4 px-6 font-mono font-medium text-charcoal-700 text-xs">
                          {bill.bill_no}
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-bold text-charcoal-900">{bill.customer_name}</div>
                          <div className="text-[10px] text-gray-400 font-mono tracking-wide mt-0.5">{bill.customer_phone}</div>
                        </td>
                        <td className="py-4 px-6 text-gray-500 text-xs">
                          {formatDate(bill.created_at)}
                        </td>
                        <td className="py-4 px-6 min-w-[160px]">
                           {(() => {
                              const percent = Math.min(Math.round((bill.paid_amount / bill.total_amount) * 100), 100);
                              return (
                                <>
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="text-[10px] font-bold text-gold-600 uppercase tracking-tight">{percent}% Paid</span>
                                    <span className="text-[10px] font-mono text-gray-400 font-bold">{formatCurrency(bill.total_amount)}</span>
                                  </div>
                                  <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                    <div 
                                      className="bg-gold-600 h-full rounded-full transition-all duration-500" 
                                      style={{ width: `${percent}%` }}
                                    />
                                  </div>
                                </>
                              );
                           })()}
                        </td>
                        <td className="py-4 px-6 text-right font-mono text-gray-600 font-medium">
                          {formatCurrency(bill.total_amount)}
                        </td>
                        <td className="py-4 px-6 text-right font-mono font-bold text-green-700">
                          {formatCurrency(bill.paid_amount)}
                        </td>
                        <td className={`py-4 px-6 text-right font-mono font-bold ${remaining > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                          {formatCurrency(remaining)}
                        </td>
                        <td className="py-4 px-6 text-center">
                           {isClosed ? (
                             <span className="inline-flex items-center px-2 py-1 rounded bg-charcoal-100 text-charcoal-700 text-[10px] font-bold uppercase border border-charcoal-200">
                               Closed
                             </span>
                           ) : (
                             <span className="inline-flex items-center px-2 py-1 rounded bg-gold-50 text-gold-700 text-[10px] font-bold uppercase border border-gold-200">
                               Active
                             </span>
                           )}
                        </td>
                        <td className="py-4 px-6 text-center">
                           <div className="flex items-center justify-center gap-2">
                             {/* Record Payment (Update) */}
                             {!isClosed && (
                               <button 
                                 title="Add Transaction" 
                                 onClick={(e) => handleOpenPayment(bill, e)}
                                 className="p-1.5 hover:bg-green-50 rounded text-green-600 transition-colors"
                               >
                                 <PlusCircle size={18} />
                               </button>
                             )}
                             
                             {/* View History (Eye/Ledger) */}
                             <button 
                               title="View Ledger" 
                               onClick={(e) => handleViewLedger(bill, e)}
                               className="p-1.5 hover:bg-gold-50 rounded text-gold-600 transition-colors"
                             >
                               <Eye size={18} />
                             </button>

                             {/* Print Statement */}
                             <button 
                               title="Print Statement" 
                               onClick={(e) => handleOpenStatementPreview(bill, e)}
                               className="p-1.5 hover:bg-blue-50 rounded text-blue-600 transition-colors"
                             >
                               <Printer size={18} />
                             </button>

                             {/* Delete */}
                             <button 
                               title="Delete Layaway Tracking" 
                               onClick={(e) => { e.stopPropagation(); handleDeleteBill(bill.id); }}
                               className="p-1.5 hover:bg-red-50 rounded text-red-400 hover:text-red-600 transition-colors"
                             >
                               <Trash2 size={16} />
                             </button>
                           </div>
                        </td>
                      </tr>
                    );
                 })
               )}
             </tbody>
           </table>
        </div>
      </div>
      </div>

      {/* OVERLAYS */}
      {selectedBill && <LedgerModal />}
      
      {/* ADD / EDIT PAYMENT MODAL */}
      {(paymentBill || editingTransaction) && (
         <div className="fixed inset-0 z-50 bg-charcoal-900/60 backdrop-blur-sm flex items-center justify-center p-4 print:hidden" onClick={() => { setPaymentBill(null); setEditingTransaction(null); }}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
               {/* Modal Header */}
               <div className={`px-6 py-4 flex justify-between items-center text-white ${editingTransaction ? 'bg-blue-600' : 'bg-gold-500'}`}>
                 <div className="flex items-center gap-2">
                   {editingTransaction ? <Edit2 size={20}/> : <Wallet size={20}/>}
                   <h3 className="font-bold text-lg tracking-wide uppercase">{editingTransaction ? 'Edit Transaction' : 'Add Transaction'}</h3>
                 </div>
                 <button onClick={() => { setPaymentBill(null); setEditingTransaction(null); }} className="text-white/70 hover:text-white transition-colors">
                   <X size={20}/>
                 </button>
               </div>

               <div className="p-6">
                 {/* Summary Card */}
                 <div className="bg-gray-50 border border-gray-200 rounded p-4 mb-6">
                    {/* For edits, we need to find the bill details */}
                    {(() => {
                      const bill = paymentBill || (editingTransaction ? bills.find(b => b.id === editingTransaction.bill_id) : null);
                      if (!bill) return null;
                      return (
                        <>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-bold text-gray-500 uppercase">Bill No</span>
                            <span className="text-sm font-mono font-bold text-charcoal-900">{bill.bill_no}</span>
                          </div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-bold text-gray-500 uppercase">Customer</span>
                            <span className="text-sm font-bold text-charcoal-900">{bill.customer_name}</span>
                          </div>
                          <div className="border-t border-gray-200 my-2 pt-2 flex justify-between items-center">
                            <span className="text-sm font-bold text-charcoal-700">Bill Total</span>
                            <span className="text-lg font-mono font-bold text-charcoal-900">
                              {formatCurrency(bill.total_amount)}
                            </span>
                          </div>
                        </>
                      );
                    })()}
                 </div>

                 {/* Form Fields */}
                 <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                       <Input 
                         label="Payment Date" 
                         type="date" 
                         value={paymentForm.date}
                         onChange={(e) => setPaymentForm({...paymentForm, date: e.target.value})}
                       />
                       <Select 
                          label="Mode"
                          value={paymentForm.mode}
                          onChange={(e) => setPaymentForm({...paymentForm, mode: e.target.value})}
                          options={[
                            { value: 'Cash', label: 'Cash' },
                            { value: 'UPI', label: 'UPI / GPay' },
                            { value: 'Card', label: 'Card' },
                            { value: 'Bank Transfer', label: 'Bank Transfer' },
                          ]}
                       />
                    </div>
                    <div>
                      <Input 
                        label="Amount Received" 
                        placeholder="0.00"
                        isMonospaced
                        className="text-lg font-bold"
                        value={paymentForm.amount}
                        onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})}
                        icon={<span className="text-gray-400 font-bold">₹</span>}
                      />
                    </div>
                    <div>
                      <Input 
                        label="Reference / Transaction ID" 
                        placeholder="Optional"
                        value={paymentForm.reference}
                        onChange={(e) => setPaymentForm({...paymentForm, reference: e.target.value})}
                      />
                    </div>
                    <div>
                       <label className="block text-xs font-bold text-charcoal-700 mb-1.5 uppercase tracking-wide">Notes</label>
                       <textarea 
                         className="w-full bg-white border border-gray-300 rounded-md p-3 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none resize-none"
                         rows={2}
                         placeholder="Additional remarks..."
                         value={paymentForm.notes}
                         onChange={(e) => setPaymentForm({...paymentForm, notes: e.target.value})}
                       />
                    </div>
                 </div>
               </div>
               
               {/* Modal Footer */}
               <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                  <Button variant="ghost" onClick={() => { setPaymentBill(null); setEditingTransaction(null); }}>Cancel</Button>
                  <Button onClick={handleSubmitPayment} className="shadow-lg" disabled={loading}>
                    {loading ? <RefreshCw className="animate-spin mr-2" size={16}/> : null}
                    {editingTransaction ? 'Save Changes' : 'Confirm Payment'}
                  </Button>
               </div>
            </div>
         </div>
      )}

      {/* NEW LAYAWAY (LINK BILL) MODAL */}
      {isLinkModalOpen && (
         <div className="fixed inset-0 z-50 bg-charcoal-900/60 backdrop-blur-sm flex items-center justify-center p-4 print:hidden" onClick={() => setIsLinkModalOpen(false)}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
               
               {/* Header */}
               <div className="bg-charcoal-900 px-6 py-4 flex justify-between items-center text-white">
                 <div className="flex items-center gap-2">
                   <Plus className="text-gold-500" size={20}/>
                   <h3 className="font-bold text-lg tracking-wide">New Layaway / Link Bill</h3>
                 </div>
                 <button onClick={() => setIsLinkModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                   <X size={20}/>
                 </button>
               </div>

               {/* Body */}
               <div className="p-6 space-y-6">
                 
                 {/* Step 1: Search */}
                 <div className="flex gap-2 items-end">
                   <div className="flex-1">
                     <Input 
                        label="Enter Bill Number" 
                        placeholder="e.g. MK-20240115-0001" 
                        isMonospaced
                        value={linkForm.searchBillNo}
                        onChange={e => setLinkForm({...linkForm, searchBillNo: e.target.value, searchError: ''})}
                     />
                   </div>
                   <Button onClick={handleSearchBill} className="bg-charcoal-800 hover:bg-black">
                     <Search size={18}/>
                   </Button>
                 </div>
                 
                 {linkForm.searchError && (
                   <p className="text-red-500 text-xs font-bold mt-1 flex items-center gap-1">
                     <AlertCircle size={12}/> {linkForm.searchError}
                   </p>
                 )}

                 {/* Step 2: Result & Payment */}
                 {linkForm.foundBill && (
                   <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                      <div className="bg-gold-50 border border-gold-200 rounded p-4 mb-6">
                        <div className="flex justify-between items-start mb-2">
                           <div>
                              <p className="text-xs font-bold text-gray-500 uppercase">Customer</p>
                              <p className="font-bold text-charcoal-900">{linkForm.foundBill.customer_name}</p>
                              <p className="text-xs text-gray-500">{linkForm.foundBill.customer_phone}</p>
                           </div>
                           <div className="text-right">
                              <p className="text-xs font-bold text-gray-500 uppercase">Bill Total</p>
                              <p className="font-mono font-bold text-lg text-charcoal-900">{formatCurrency(linkForm.foundBill.total_amount)}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gold-700 bg-gold-100/50 p-2 rounded">
                          <CheckCircle2 size={14}/>
                          <span>Bill found. Add initial payment to start tracking.</span>
                        </div>
                      </div>

                      <h4 className="text-xs font-bold text-charcoal-700 uppercase mb-3 border-b border-gray-100 pb-2">Initial Transaction</h4>
                      
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <Input 
                            label="Date" 
                            type="date"
                            value={linkForm.paymentDate}
                            onChange={e => setLinkForm({...linkForm, paymentDate: e.target.value})}
                          />
                           <Select 
                              label="Mode"
                              value={linkForm.paymentMode}
                              onChange={(e) => setLinkForm({...linkForm, paymentMode: e.target.value})}
                              options={[
                                { value: 'Cash', label: 'Cash' },
                                { value: 'UPI', label: 'UPI / GPay' },
                                { value: 'Card', label: 'Card' },
                                { value: 'Bank Transfer', label: 'Bank Transfer' },
                              ]}
                           />
                        </div>
                        <Input 
                          label="Amount (Optional)" 
                          placeholder="0.00"
                          isMonospaced
                          value={linkForm.paymentAmount}
                          onChange={e => setLinkForm({...linkForm, paymentAmount: e.target.value})}
                        />
                        <Input 
                          label="Reference / Notes" 
                          placeholder="Check No / Transaction ID"
                          value={linkForm.reference}
                          onChange={e => setLinkForm({...linkForm, reference: e.target.value})}
                        />
                      </div>
                   </div>
                 )}
               </div>

               {/* Footer */}
               {linkForm.foundBill && (
                 <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                    <Button variant="ghost" onClick={() => setIsLinkModalOpen(false)}>Cancel</Button>
                    <Button onClick={handleLinkBillSubmit} className="shadow-lg">Link & Save</Button>
                 </div>
               )}
            </div>
         </div>
      )}

      {/* 4. PRINT COMPONENTS (STRICTLY FOR PRINTER) */}
      <div className="hidden print:block print-block">
        {selectedBill && (
          <LayawayStatementPrint 
            billNo={selectedBill.bill_no}
            billDate={selectedBill.created_at}
            customerName={selectedBill.customer_name}
            customerPhone={selectedBill.customer_phone}
            totalAmount={selectedBill.total_amount}
            paidAmount={selectedBill.paid_amount}
            balance={selectedBill.total_amount - selectedBill.paid_amount}
            transactions={transactions.filter(t => t.bill_id === selectedBill.id)}
          />
        )}
      </div>

      {/* 5. ON-SCREEN PREVIEW MODAL */}
      {showStatementPreview && selectedBill && (
        <div className="fixed inset-0 z-[100] bg-charcoal-900/80 backdrop-blur-md flex items-center justify-center p-8 print:hidden">
           <div className="bg-gray-100 w-full max-w-[1000px] h-full rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-white/20">
              <div className="bg-charcoal-900 px-8 py-5 flex justify-between items-center text-white shrink-0 shadow-lg">
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-gold-500 text-charcoal-900 flex items-center justify-center font-bold">
                     <Eye size={20}/>
                   </div>
                   <div>
                     <h3 className="font-bold text-lg tracking-wide uppercase">Statement Preview</h3>
                     <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Verifying layaway payments before printing</p>
                   </div>
                 </div>
                 <div className="flex gap-4">
                    <Button 
                       onClick={handleActualPrint} 
                       variant="secondary"
                       className="bg-gold-500 text-charcoal-900 border-none hover:bg-gold-600 shadow-xl"
                    >
                       <Printer size={18} className="mr-2"/> Send to Printer
                    </Button>
                    <button onClick={() => setShowStatementPreview(false)} className="p-2 text-gray-400 hover:text-white transition-colors bg-white/10 rounded-full">
                       <X size={24}/>
                    </button>
                 </div>
              </div>
              <div className="flex-1 overflow-auto bg-gray-200 p-8 custom-scrollbar">
                <div className="scale-90 origin-top">
                    <LayawayStatementPrint 
                      isScreenPreview
                      billNo={selectedBill.bill_no}
                      billDate={selectedBill.created_at}
                      customerName={selectedBill.customer_name}
                      customerPhone={selectedBill.customer_phone}
                      totalAmount={selectedBill.total_amount}
                      paidAmount={selectedBill.paid_amount}
                      balance={selectedBill.total_amount - selectedBill.paid_amount}
                      transactions={transactions.filter(t => t.bill_id === selectedBill.id)}
                    />
                </div>
              </div>
           </div>
        </div>
      )}
    
    </div>
  );
};
