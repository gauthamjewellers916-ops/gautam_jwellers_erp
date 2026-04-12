
import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Trash2, 
  Search, 
  ScanLine, 
  ChevronDown, 
  ChevronUp, 
  CreditCard,
  Printer,
  X,
  FileText,
  Eye,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import { Input, Button, Select, Card, toast } from '../components/UIComponents';
import { BillItem, PaymentRecord, Customer } from '../types';
import { supabase } from '../supabaseClient';
import { generateBillNo, createBill, createBillItems, updateBill, createCustomer, searchCustomers } from '../db';
import { InvoicePrint } from '../components/InvoicePrint';
import { ExchangePrint } from '../components/ExchangePrint';

// --- HELPERS ---

const formatCurrency = (amount: number) => 
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(amount);

const numberToWords = (num: number): string => {
  if (num === 0) return "Zero Rupees Only";
  return `Rupees ${num.toFixed(0)} Only`; 
};

const roundToWhole = (num: number) => Math.round(num);

const getLocalISODate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

interface SalesBillProps {
  billId?: string;
  onClearEdit?: () => void;
}

export const SalesBill: React.FC<SalesBillProps> = ({ billId, onClearEdit }) => {
  // --- AUTH / CONTEXT STATE ---
  const [staffId, setStaffId] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const userJson = localStorage.getItem('user');
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        if (user.id) setStaffId(user.id);
      } catch (err) {
        console.error('Error parsing user data:', err);
      }
    }
  }, []);

  const resetForm = () => {
    setBillNo('');
    setVoucherNo('');
    setBillDate(getLocalISODate());
    setCustomer(null);
    setItems([]);
    setOldGoldExchange({
      weight: 0, weightInput: '', purity: '', rate: 0, rateInput: '', total: 0, hsn_code: '7113', particulars: ''
    });
    setMcValueAdded({ weight: 0, weightInput: '', rate: 0, rateInput: '', total: 0 });
    setPaymentMethods([]);
    setAmountPayableInput('');
    setIsOldGoldOpen(false);
  };

  useEffect(() => {
    const loadBillData = async () => {
      if (!billId) {
        resetForm();
        try {
          const nextNo = await generateBillNo();
          setBillNo(nextNo);
          const nextVNo = await generateBillNo();
          setVoucherNo(nextVNo);
        } catch (err) {
          console.error("Error fetching bill number:", err);
        }
        return;
      }
      
      try {
        setLoading(true);
        // Load bill
        const { data: bill, error: billError } = await supabase
          .from('bills')
          .select('*, customers(*)')
          .eq('id', billId)
          .single();
        
        if (billError) throw billError;

        // Load items
        const { data: billItems, error: itemsError } = await supabase
          .from('bill_items')
          .select('*')
          .eq('bill_id', billId)
          .order('sl_no', { ascending: true });

        if (itemsError) throw itemsError;

        // Set state
        setBillNo(bill.bill_no);
        setBillDate(bill.bill_date);
        
        // Normalize sale type for UI compatibility
        const rawType = (bill.sale_type || '').toUpperCase();
        const normalizedType = (rawType === 'NOGST' || rawType === 'NONGST' || rawType === 'NON_GST') ? 'NON GST' : rawType;
        setSaleType(normalizedType as 'GST' | 'NON GST');

        setCustomer(bill.customers as Customer);
        
        // Handle items
        const formattedItems: BillItem[] = (billItems || [])
          .filter(item => item.item_name !== 'Value Added / MC')
          .map(item => ({
            id: item.id,
            barcode: item.barcode || '',
            item_name: item.item_name,
            weight: item.weight,
            rate: item.rate,
            making_charges: item.making_charges,
            gst_rate: 0,
            line_total: item.line_total,
            metal_type: item.metal_type,
            hsn_code: '711319',
            purity: 'Standard'
          }));
        setItems(formattedItems);

        // Handle Value Added / MC
        const mcItem = billItems?.find(item => item.item_name === 'Value Added / MC');
        if (mcItem) {
          setMcValueAdded({
            weight: mcItem.weight,
            weightInput: mcItem.weight?.toString() || '',
            rate: mcItem.rate,
            rateInput: mcItem.rate?.toString() || '',
            total: mcItem.line_total
          });
        }

        // Handle Payments
        if (bill.payment_method) {
          try {
            const payments = JSON.parse(bill.payment_method);
            setPaymentMethods(payments);
          } catch (e) {
            console.error("Error parsing payments", e);
          }
        }

        toast({ title: "Bill Loaded", description: `Editing ${bill.bill_no}` });
      } catch (err: any) {
        console.error("Error loading bill:", err);
        toast({ title: "Error", description: "Failed to load bill data", variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };

    loadBillData();
  }, [billId]);

  // --- PRINT / PREVIEW STATE ---
  const [activePrintView, setActivePrintView] = useState<'invoice' | 'exchange'>('invoice');
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // --- CUSTOMER STATE ---
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerMatches, setCustomerMatches] = useState<Customer[]>([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [showAddCustomerForm, setShowAddCustomerForm] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({ name: '', phone: '', address: '' });

  // --- METAL RATES STATE ---
  const [dailyGoldRate, setDailyGoldRate] = useState(0);
  const [allMetalRates, setAllMetalRates] = useState<Record<string, number>>({
    gold: 0,
    gold_916: 0,
    gold_750: 0,
    silver_92: 0,
    silver_70: 0,
    selam_silver: 0,
  });

  // --- BILL ITEM STATE ---
  const [items, setItems] = useState<BillItem[]>([]);
  const [newItem, setNewItem] = useState({
    barcode: '',
    item_name: '',
    huid: '',
    gross_weight: 0,
    grossWeightInput: '',
    net_weight: 0,
    netWeightInput: '',
    weight: 0,
    weightInput: '',
    rate: 0,
    rateInput: '',
    making_charges: 0,
    makingChargesInput: '',
    makingChargesAmount: '',
    makingChargesPercentage: '',
    purity: '',
    hsn_code: '711319',
    metal_type: 'gold',
  });
  const [isLoadingItem, setIsLoadingItem] = useState(false);

  // --- BILL META STATE ---
  const [billDate, setBillDate] = useState(getLocalISODate());
  const [billNo, setBillNo] = useState('');
  const [voucherNo, setVoucherNo] = useState('');
  const [saleType, setSaleType] = useState<'GST' | 'NON GST'>('GST');
  const GST_RATE = 0.03;
  
  // --- OLD GOLD STATE ---
  const [isOldGoldOpen, setIsOldGoldOpen] = useState(false);
  const [oldGoldExchange, setOldGoldExchange] = useState({
    weight: 0,
    weightInput: '',
    purity: '',
    rate: 0,
    rateInput: '',
    total: 0,
    hsn_code: '7113',
    particulars: '',
  });

  // --- VALUE ADDED / MC STATE ---
  const [mcValueAdded, setMcValueAdded] = useState({
    weight: 0, 
    weightInput: '',
    rate: 0, 
    rateInput: '',
    total: 0
  });

  // --- PAYMENT STATE ---
  const [paymentMethods, setPaymentMethods] = useState<PaymentRecord[]>([]);
  const [currentPayment, setCurrentPayment] = useState<{type: string, amount: string, reference: string}>({
    type: 'cash', amount: '', reference: ''
  });

  // --- TOTALS STATE ---
  const [amountPayableInput, setAmountPayableInput] = useState<string>(''); 
  const [calculatedTotals, setCalculatedTotals] = useState({
    goldSubtotal: 0,
    silverSubtotal: 0,
    itemsSubtotal: 0,
    baseTaxable: 0,
    gstAmount: 0,
    grandTotal: 0
  });

  const isReverseCalculating = useRef(false);

  // --- EFFECTS ---
  
  // 1. Sync initial rate when rates are loaded or item is reset
  useEffect(() => {
    const currentTypeRate = allMetalRates[newItem.metal_type] || 0;
    if (!newItem.rateInput && currentTypeRate > 0) {
      setNewItem(prev => ({
        ...prev,
        rateInput: currentTypeRate.toString(),
        rate: currentTypeRate
      }));
    }
  }, [allMetalRates, newItem.metal_type, newItem.rateInput]);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const { data, error } = await supabase
          .from('gold_rates')
          .select('*')
          .eq('effective_date', billDate);

        if (error) throw error;

        const ratesMap: Record<string, number> = { 
          gold: 0, gold_916: 0, gold_750: 0, 
          silver_92: 0, silver_70: 0, selam_silver: 0 
        };

        if (data && data.length > 0) {
          data.forEach(item => {
            ratesMap[item.metal_type] = parseFloat(item.rate_per_gram) || 0;
          });
          setAllMetalRates(ratesMap);
          setDailyGoldRate(ratesMap['gold'] || 0);
        } else {
          // FALLBACK: If no rates for today, fetch the absolute latest for each type
          console.log(`No rates for ${billDate}, fetching latest fallback...`);
          
          const { data: latestData, error: latestError } = await supabase
            .from('gold_rates')
            .select('*')
            .order('effective_date', { ascending: false });

          if (latestError) throw latestError;

          if (latestData && latestData.length > 0) {
            // Group by metal_type and take the first (latest) occurrence
            latestData.forEach(item => {
              if (ratesMap[item.metal_type] === 0) {
                ratesMap[item.metal_type] = parseFloat(item.rate_per_gram) || 0;
              }
            });
            setAllMetalRates(ratesMap);
            setDailyGoldRate(ratesMap['gold'] || 0);
            toast({ 
              title: "Rates Note", 
              description: `Showing latest available rates as none entered for ${billDate}.` 
            });
          } else {
            setAllMetalRates(ratesMap);
            setDailyGoldRate(0);
          }
        }
      } catch (err) {
        console.error('Error fetching rates:', err);
      }
    };
    fetchRates();
  }, [billDate]);

  useEffect(() => {
    if (!customerSearch.trim()) {
      setCustomerMatches([]);
      setShowCustomerDropdown(false);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const data = await searchCustomers(customerSearch);
        setCustomerMatches(data || []);
        setShowCustomerDropdown(true);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [customerSearch]);

  useEffect(() => {
    const barcode = newItem.barcode.trim();
    if (!barcode) return;

    const timer = setTimeout(async () => {
      setIsLoadingItem(true);
      try {
        const { data } = await supabase
          .from('items')
          .select('*')
          .eq('barcode', barcode)
          .single();

        if (data) {
          const mType = data.metal_type || 'gold';
          const applicableRate = allMetalRates[mType] || dailyGoldRate || 0;

          setNewItem(prev => ({
            ...prev,
            item_name: data.item_name || '',
            huid: data.huid || '',
            gross_weight: data.gross_weight || data.weight || 0,
            grossWeightInput: (data.gross_weight || data.weight)?.toString() || '',
            net_weight: data.net_weight || data.weight || 0,
            netWeightInput: (data.net_weight || data.weight)?.toString() || '',
            weight: data.net_weight || data.weight || 0,
            weightInput: (data.net_weight || data.weight)?.toString() || '',
            rate: applicableRate,
            rateInput: applicableRate > 0 ? applicableRate.toString() : '',
            making_charges: data.making_charges || 0,
            makingChargesInput: data.making_charges?.toString() || '',
            metal_type: mType,
            hsn_code: data.hsn_code || '711319'
          }));
          toast({ title: "Item Found", description: data.item_name });
        }
      } catch (err) {
        console.log("Item not found or error", err);
      } finally {
        setIsLoadingItem(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [newItem.barcode]);

  useEffect(() => {
    const weight = parseFloat(oldGoldExchange.weightInput) || 0;
    const rate = parseFloat(oldGoldExchange.rateInput) || (dailyGoldRate || 0);
    const total = weight * rate;
    
    setOldGoldExchange(prev => ({ ...prev, weight, rate, total }));
  }, [oldGoldExchange.weightInput, oldGoldExchange.rateInput, dailyGoldRate]);

  // --- CALCULATION ---

  useEffect(() => {
    if (isReverseCalculating.current) return;

    // Use total summation for subtotal to ensure all items are included
    const itemsSubtotal = items.reduce((sum, item) => sum + (Number(item.line_total) || 0), 0);
    
    // Separate display subtotals with more robust filtering
    const goldSubtotal = items
      .filter(i => (i.metal_type || '').toLowerCase().includes('gold'))
      .reduce((sum, item) => sum + (Number(item.line_total) || 0), 0);
    
    const silverSubtotal = items
      .filter(i => (i.metal_type || '').toLowerCase().includes('silver') || (i.metal_type || '').toLowerCase().includes('selam'))
      .reduce((sum, item) => sum + (Number(item.line_total) || 0), 0);

    const oldGoldValue = Number(oldGoldExchange.total) || 0;
    const valueAddedMC = Number(mcValueAdded.total) || 0;
    
    const baseTaxableWithoutMc = itemsSubtotal - oldGoldValue;
    const preGstTotal = baseTaxableWithoutMc + valueAddedMC;

    const gstRaw = saleType === 'GST' ? preGstTotal * GST_RATE : 0;
    const gstAmount = roundToWhole(gstRaw);
    
    const grandTotal = saleType === 'GST' ? preGstTotal + gstAmount : preGstTotal;

    setCalculatedTotals({
      goldSubtotal,
      silverSubtotal,
      itemsSubtotal,
      baseTaxable: preGstTotal, 
      gstAmount,
      grandTotal
    });

    if (Math.abs(grandTotal - (parseFloat(amountPayableInput) || 0)) > 1) {
       setAmountPayableInput(grandTotal > 0 ? grandTotal.toFixed(0) : '');
    }

  }, [items, oldGoldExchange.total, mcValueAdded.total, saleType]);

  const handleAmountPayableChange = (val: string) => {
    setAmountPayableInput(val);
    const targetAmount = parseFloat(val);

    if (isNaN(targetAmount) || targetAmount < 0) return;
    
    isReverseCalculating.current = true;

    const itemsSubtotal = items.reduce((sum, item) => sum + item.line_total, 0);
    const oldGoldValue = oldGoldExchange.total || 0;
    const baseTaxableWithoutMc = itemsSubtotal - oldGoldValue;

    let targetTaxable = saleType === 'GST' ? targetAmount / (1 + GST_RATE) : targetAmount;
    const requiredMcTotal = targetTaxable - baseTaxableWithoutMc;

    let newMcState = { ...mcValueAdded, total: 0 };
    
    if (requiredMcTotal > 0) {
      newMcState.total = roundToWhole(requiredMcTotal);
      const currentWeight = parseFloat(mcValueAdded.weightInput) || 0;
      const currentRate = parseFloat(mcValueAdded.rateInput) || 0;

      if (currentWeight > 0) {
        const derivedRate = requiredMcTotal / currentWeight;
        newMcState.rate = derivedRate;
        newMcState.rateInput = derivedRate.toFixed(2);
      } else if (currentRate > 0) {
        const derivedWeight = requiredMcTotal / currentRate;
        newMcState.weight = derivedWeight;
        newMcState.weightInput = derivedWeight.toFixed(3);
      }
    }

    setMcValueAdded(newMcState);

    const preGstTotal = baseTaxableWithoutMc + newMcState.total;
    const gstRaw = saleType === 'GST' ? preGstTotal * GST_RATE : 0;
    const gstAmount = roundToWhole(gstRaw);
    
    setCalculatedTotals(prev => ({
       ...prev,
       baseTaxable: preGstTotal,
       gstAmount,
       grandTotal: targetAmount 
    }));

    setTimeout(() => {
      isReverseCalculating.current = false;
    }, 100);
  };

  // --- ACTIONS ---

  const handleSelectCustomer = (cust: Customer) => {
    setCustomer(cust);
    setCustomerSearch('');
    setShowCustomerDropdown(false);
  };

  const handleAddNewCustomer = async () => {
    if (!newCustomerData.name || !newCustomerData.phone) return;
    try {
      const data = await createCustomer({ name: newCustomerData.name, phone: newCustomerData.phone, address: newCustomerData.address });
      if (data) {
        setCustomer(data as Customer);
        setShowAddCustomerForm(false);
        setNewCustomerData({ name: '', phone: '', address: '' });
        toast({ title: "Customer Added", description: data.name });
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to add customer", variant: 'destructive' });
    }
  };

  const handleRateUpdate = async (metalKey: string, value: string) => {
    // 1. Update UI
    const numValue = parseFloat(value);
    const rate = isNaN(numValue) ? 0 : numValue;
    
    setAllMetalRates(prev => ({ ...prev, [metalKey]: rate }));
    if (metalKey === 'gold') setDailyGoldRate(rate);

    // 2. Persist to DB
    if (!isNaN(numValue) && numValue > 0) {
      const { error } = await supabase
        .from('gold_rates')
        .upsert({
          effective_date: billDate,
          metal_type: metalKey,
          rate_per_gram: rate
        }, {
          onConflict: 'effective_date, metal_type'
        });

      if (error) {
        console.error("Failed to save rate:", error);
      }
    }
  };

  const handleAddItem = () => {
    const grossWeight = parseFloat(newItem.grossWeightInput) || 0;
    const netWeight = parseFloat(newItem.netWeightInput) || 0;
    if (!newItem.item_name || netWeight <= 0) {
      toast({ title: "Invalid Item", description: "Name and Net Weight are required", variant: 'destructive' });
      return;
    }
    const customRate = parseFloat(newItem.rateInput) || 0;
    const defaultRate = (newItem.metal_type.includes('gold') ? allMetalRates['gold'] : dailyGoldRate) || 0;
    const finalRate = customRate > 0 ? customRate : (defaultRate > 0 ? defaultRate : newItem.rate);

    if (finalRate <= 0) {
       toast({ title: "Rate Missing", description: "Please enter a rate", variant: 'destructive' });
       return;
    }

    let making = 0;
    if (newItem.makingChargesAmount) {
      making = parseFloat(newItem.makingChargesAmount) || 0;
    } else if (newItem.makingChargesPercentage) {
      making = (netWeight * finalRate) * (parseFloat(newItem.makingChargesPercentage) / 100);
    } else if (newItem.makingChargesInput) {
      making = newItem.makingChargesInput.includes('%') 
        ? (netWeight * finalRate) * (parseFloat(newItem.makingChargesInput.replace('%', '')) / 100)
        : parseFloat(newItem.makingChargesInput) || 0;
    }

    const lineTotal = (netWeight * finalRate) + making;
    setItems([...items, {
      id: Date.now().toString(),
      barcode: newItem.barcode,
      item_name: newItem.item_name,
      huid: newItem.huid,
      gross_weight: grossWeight,
      net_weight: netWeight,
      weight: netWeight, // Sync weight with net_weight
      rate: finalRate,
      making_charges: making,
      gst_rate: 0, line_total: lineTotal,
      metal_type: newItem.metal_type,
      hsn_code: newItem.hsn_code || '711319',
      purity: newItem.purity || 'Standard'
    }]);
    
    setNewItem({
      barcode: '', item_name: '', huid: '', gross_weight: 0, grossWeightInput: '', 
      net_weight: 0, netWeightInput: '', weight: 0, weightInput: '', rate: 0, rateInput: '',
      making_charges: 0, makingChargesInput: '', makingChargesAmount: '',
      makingChargesPercentage: '', purity: '', hsn_code: '711319', metal_type: 'gold'
    });
  };

  const handleRemoveItem = (id: string) => setItems(items.filter(i => i.id !== id));

  const handleAddPayment = () => {
    const amt = parseFloat(currentPayment.amount);
    if (isNaN(amt) || amt <= 0) {
      toast({ title: "Invalid Amount", description: "Please enter a valid payment amount", variant: 'destructive' });
      return;
    }
    setPaymentMethods([...paymentMethods, {
      id: Date.now().toString(),
      type: currentPayment.type as any,
      amount: currentPayment.amount,
      reference: currentPayment.reference
    }]);
    setCurrentPayment({ ...currentPayment, amount: '', reference: '' });
  };

  const handleRemovePayment = (id: string) => setPaymentMethods(paymentMethods.filter(p => p.id !== id));

  // --- PRINT / PREVIEW LOGIC ---
  
  const handleDirectPrint = (type: 'invoice' | 'exchange') => {
    setActivePrintView(type);
    setShowPreviewModal(false);
    // Short delay to ensure React state has updated the component visibility for the printer
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handleOpenPreview = (type: 'invoice' | 'exchange') => {
    setActivePrintView(type);
    setShowPreviewModal(true);
  };

  const handleActualPrint = () => {
    setShowPreviewModal(false);
    setTimeout(() => window.print(), 100);
  };

  const handleSaveBill = async () => {
    if (!customer || items.length === 0 || !staffId) {
      toast({ 
        title: "Error", 
        description: !staffId ? "Session expired. Please re-login." : "Please check items and customer details.", 
        variant: 'destructive' 
      });
      return;
    }
    setLoading(true);
    try {
      const billData = {
        bill_no: billNo || await generateBillNo(),
        bill_date: billDate,
        customer_id: customer.id,
        staff_id: staffId,
        sale_type: saleType === 'NON GST' ? 'nongst' : 'gst',
        subtotal: calculatedTotals.itemsSubtotal,
        gst_amount: calculatedTotals.gstAmount,
        grand_total: calculatedTotals.grandTotal,
        discount: 0,
        payment_method: JSON.stringify(paymentMethods),
        bill_status: 'final'
      };

      let savedBill;
      if (billId) {
        savedBill = await updateBill(parseInt(billId), billData);
        // Delete old items before re-inserting
        await supabase.from('bill_items').delete().eq('bill_id', billId);
      } else {
        savedBill = await createBill(billData);
        setBillNo(billData.bill_no);
      }
      
      const billItems = items.map((item, idx) => ({
        bill_id: savedBill.id, 
        barcode: item.barcode || null, 
        item_name: item.item_name,
        huid: item.huid || null,
        gross_weight: item.gross_weight,
        net_weight: item.net_weight,
        weight: item.weight, rate: item.rate, making_charges: item.making_charges,
        line_total: item.line_total, sl_no: idx + 1, metal_type: item.metal_type
      }));

      if (mcValueAdded.total > 0) {
         billItems.push({
           bill_id: savedBill.id, 
           barcode: null, 
           item_name: 'Value Added / MC',
           weight: parseFloat(mcValueAdded.weightInput) || 0, rate: parseFloat(mcValueAdded.rateInput) || 0,
           making_charges: 0, line_total: mcValueAdded.total, sl_no: billItems.length + 1, metal_type: 'service'
         });
      }
      await createBillItems(savedBill.id, billItems);
      toast({ title: "Success", description: billId ? "Bill updated successfully!" : "Bill saved successfully!" });
      handleDirectPrint('invoice');
    } catch (err: any) {
      toast({ title: "Error Saving", description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const totalPaid = paymentMethods.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  const balanceDue = calculatedTotals.grandTotal - totalPaid;

  return (
    <div className="flex h-full bg-app-bg relative">
      
      {/* 1. PRINT COMPONENTS (STRICTLY FOR PRINTER) */}
      <div className="print-block">
        {activePrintView === 'invoice' && (
          <InvoicePrint 
            billNo={billNo} billDate={billDate} saleType={saleType}
            customer={customer} items={items} allMetalRates={allMetalRates}
            totals={calculatedTotals} mcValueAdded={mcValueAdded} paymentMethods={paymentMethods}
            oldGold={{
               weight: parseFloat(oldGoldExchange.weightInput) || 0,
               rate: parseFloat(oldGoldExchange.rateInput) || 0,
               total: oldGoldExchange.total, purity: oldGoldExchange.purity,
               description: oldGoldExchange.particulars
            }}
          />
        )}
        {activePrintView === 'exchange' && (
          <ExchangePrint 
            voucherNo={voucherNo} date={billDate} customer={customer}
            exchangeData={{
               particulars: oldGoldExchange.particulars, weight: parseFloat(oldGoldExchange.weightInput) || 0,
               rate: parseFloat(oldGoldExchange.rateInput) || 0, purity: oldGoldExchange.purity,
               hsn_code: oldGoldExchange.hsn_code, total: oldGoldExchange.total
            }}
          />
        )}
      </div>

      {/* 2. ON-SCREEN PREVIEW MODAL */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-[100] bg-charcoal-900/80 backdrop-blur-md flex items-center justify-center p-8 print:hidden">
           <div className="bg-gray-100 w-full max-w-[1000px] h-full rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-white/20">
              <div className="bg-charcoal-900 px-8 py-5 flex justify-between items-center text-white shrink-0 shadow-lg">
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-gold-500 text-charcoal-900 flex items-center justify-center font-bold">
                     <Eye size={20}/>
                   </div>
                   <div>
                     <h3 className="font-bold text-lg tracking-wide uppercase">Print Preview</h3>
                     <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Verifying details before final print</p>
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
                    <button onClick={() => setShowPreviewModal(false)} className="p-2 text-gray-400 hover:text-white transition-colors bg-white/10 rounded-full">
                       <X size={24}/>
                    </button>
                 </div>
              </div>
              <div className="flex-1 overflow-auto bg-gray-200 p-8 custom-scrollbar">
                <div className="scale-90 origin-top">
                  {activePrintView === 'invoice' ? (
                    <InvoicePrint 
                      isScreenPreview
                      billNo={billNo} billDate={billDate} saleType={saleType}
                      customer={customer} items={items} allMetalRates={allMetalRates}
                      totals={calculatedTotals} mcValueAdded={mcValueAdded} paymentMethods={paymentMethods}
                      oldGold={{
                        weight: parseFloat(oldGoldExchange.weightInput) || 0,
                        rate: parseFloat(oldGoldExchange.rateInput) || 0,
                        total: oldGoldExchange.total, purity: oldGoldExchange.purity,
                        description: oldGoldExchange.particulars
                      }}
                    />
                  ) : (
                    <ExchangePrint 
                      isScreenPreview
                      voucherNo={voucherNo} date={billDate} customer={customer}
                      exchangeData={{
                        particulars: oldGoldExchange.particulars, weight: parseFloat(oldGoldExchange.weightInput) || 0,
                        rate: parseFloat(oldGoldExchange.rateInput) || 0, purity: oldGoldExchange.purity,
                        hsn_code: oldGoldExchange.hsn_code, total: oldGoldExchange.total
                      }}
                    />
                  )}
                </div>
              </div>
              <div className="p-4 bg-white border-t border-gray-200 text-center">
                 <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2">
                    <CheckCircle size={12} className="text-green-500"/> Final verification check required before sealing the bill
                 </p>
              </div>
           </div>
        </div>
      )}
      
      {/* 3. MAIN WORKSPACE */}
      <div className="flex-1 p-6 overflow-y-auto pb-32 space-y-6 print:hidden">
        {/* Metal Rates */}
        <div className="bg-white px-4 py-3 rounded-lg shadow-sm border border-gray-300 flex justify-between items-center gap-4">
          <div className="flex items-center gap-2 border-r border-gray-300 pr-4">
             <span className="text-gold-500 font-bold uppercase text-xs tracking-wider">Today's Rates</span>
          </div>
          <div className="flex-1 grid grid-cols-6 gap-4">
            {Object.entries({
              'Gold (Std)': 'gold', 'Gold (22k)': 'gold_916', 'Gold (18k)': 'gold_750',
              'Silver (925)': 'silver_92', 'Silver (70)': 'silver_70', 'Selam': 'selam_silver'
            }).map(([label, key]) => (
              <div key={key} className="text-center">
                <label className="block text-[10px] uppercase text-gray-500 font-bold mb-1">{label}</label>
                <input 
                  type="number" 
                  className="w-full text-center font-mono font-bold text-charcoal-900 bg-gray-50 rounded border-none outline-none focus:bg-white focus:ring-1 focus:ring-gold-500"
                  value={allMetalRates[key] || ''}
                  onChange={(e) => handleRateUpdate(key, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-6">
          <Card className="shadow-sm">
             {!showAddCustomerForm ? (
               <div className="flex items-end gap-3 relative">
                  <div className="flex-1 relative">
                    <Input 
                      label="Search Customer" 
                      icon={isSearching ? <div className="animate-spin w-4 h-4 border-2 border-gold-500 rounded-full border-t-transparent"/> : <Search size={16} />} 
                      placeholder="Phone or Name..."
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      onFocus={() => setShowCustomerDropdown(true)}
                    />
                    {showCustomerDropdown && customerMatches.length > 0 && (
                      <div className="absolute top-full left-0 w-full bg-white border border-gray-200 shadow-lg rounded-md mt-1 z-50 max-h-48 overflow-auto">
                        {customerMatches.map(cust => (
                          <div key={cust.id} className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0" onClick={() => handleSelectCustomer(cust)}>
                            <div className="flex justify-between items-center">
                              <p className="font-bold text-sm text-charcoal-900">{cust.name}</p>
                              {cust.customer_code && <span className="text-[10px] bg-charcoal-900 text-gold-500 px-1.5 py-0.5 rounded font-bold">{cust.customer_code}</span>}
                            </div>
                            <p className="text-xs text-gray-500">{cust.phone}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button variant="secondary" onClick={() => setShowAddCustomerForm(true)} className="mb-[1px]">+ New</Button>
               </div>
             ) : (
               <div className="space-y-3 p-1">
                 <h4 className="text-xs font-bold uppercase text-gold-600">Add New Customer</h4>
                 <div className="flex gap-2">
                   <Input placeholder="Name" value={newCustomerData.name} onChange={e => setNewCustomerData({...newCustomerData, name: e.target.value})} />
                   <Input placeholder="Phone" value={newCustomerData.phone} onChange={e => setNewCustomerData({...newCustomerData, phone: e.target.value})} />
                 </div>
                 <Input placeholder="Address (Optional)" value={newCustomerData.address} onChange={e => setNewCustomerData({...newCustomerData, address: e.target.value})} />
                 <div className="flex gap-2">
                   <Button size="sm" onClick={handleAddNewCustomer}>Save</Button>
                   <Button size="sm" variant="ghost" onClick={() => setShowAddCustomerForm(false)}>Cancel</Button>
                 </div>
               </div>
             )}
             {customer && !showAddCustomerForm && (
               <div className="mt-3 p-3 bg-gold-100/50 rounded border border-gold-500/20 flex justify-between items-center">
                 <div>
                   <p className="font-bold text-charcoal-900">{customer.name}</p>
                   <p className="text-xs text-gray-600 font-mono">{customer.phone}</p>
                 </div>
                 <button onClick={() => setCustomer(null)} className="text-xs text-red-500 hover:underline">Change</button>
               </div>
             )}
          </Card>
          <Card className="shadow-sm">
              <div className="flex gap-4">
                <div className="flex-1"><Input type="date" label="Bill Date" value={billDate} isMonospaced onChange={(e) => setBillDate(e.target.value)} /></div>
                <div className="flex-1"><Select label="Sale Type" value={saleType} onChange={(e) => setSaleType(e.target.value as any)} options={[{ value: 'GST', label: 'GST (3%)' }, { value: 'NON GST', label: 'Non-GST' }]} /></div>
              </div>
          </Card>
        </div>

        {/* Add Items */}
        <Card title="Add New Item">
          <div className="grid grid-cols-12 gap-3 items-end mb-6">
            <div className="col-span-2"><Input label="Barcode" icon={isLoadingItem ? <div className="animate-spin w-3 h-3 border border-gray-400 rounded-full"/> : <ScanLine size={16} />} isMonospaced value={newItem.barcode} onChange={(e) => setNewItem({...newItem, barcode: e.target.value})} /></div>
            <div className="col-span-2"><Input label="Item Name" value={newItem.item_name} onChange={(e) => setNewItem({...newItem, item_name: e.target.value})} /></div>
            <div className="col-span-1"><Input label="HUID" isMonospaced value={newItem.huid} onChange={(e) => setNewItem({...newItem, huid: e.target.value})} /></div>
            <div className="col-span-1"><Input label="HSN" isMonospaced value={newItem.hsn_code} onChange={(e) => setNewItem({...newItem, hsn_code: e.target.value})} /></div>
            <div className="col-span-1"><Input label="Gross Wt" type="number" isMonospaced value={newItem.grossWeightInput} onChange={(e) => setNewItem({...newItem, grossWeightInput: e.target.value})} /></div>
            <div className="col-span-1"><Input label="Net Wt" type="number" isMonospaced value={newItem.netWeightInput} onChange={(e) => setNewItem({...newItem, netWeightInput: e.target.value})} /></div>
            <div className="col-span-1">
               <Select label="Metal Type" value={newItem.metal_type} options={[{ value: 'gold', label: 'Gold (Std)' }, { value: 'gold_916', label: 'Gold (22k)' }, { value: 'gold_750', label: 'Gold (18k)' }, { value: 'silver_92', label: 'Silver (92.5)' }, { value: 'silver_70', label: 'Silver (70)' }, { value: 'selam_silver', label: 'Selam' }]} onChange={e => setNewItem({...newItem, metal_type: e.target.value, rateInput: (allMetalRates[e.target.value]||0).toString()})}/>
            </div>
            <div className="col-span-2"><Input label="Rate/Gm" type="number" isMonospaced placeholder={dailyGoldRate.toString()} value={newItem.rateInput} onChange={(e) => setNewItem({...newItem, rateInput: e.target.value})} /></div>
            <div className="col-span-1">
              <label className="block text-xs font-bold text-charcoal-700 mb-1.5 uppercase">MC</label>
              <div className="flex gap-1">
                 <input type="number" placeholder="Amt" className="w-1/2 bg-white border border-gray-300 rounded focus:border-gold-500 outline-none p-2 text-sm" value={newItem.makingChargesAmount} onChange={e => setNewItem({...newItem, makingChargesAmount: e.target.value, makingChargesPercentage: ''})} />
                 <input type="number" placeholder="%" className="w-1/2 bg-white border border-gray-300 rounded focus:border-gold-500 outline-none p-2 text-sm" value={newItem.makingChargesPercentage} onChange={e => setNewItem({...newItem, makingChargesPercentage: e.target.value, makingChargesAmount: ''})} />
              </div>
            </div>
            <div className="col-span-1 flex justify-end"><Button onClick={handleAddItem} className="!px-3 bg-charcoal-900 text-white hover:bg-black"><Plus size={20} /></Button></div>
          </div>
          <div className="border border-gray-200 rounded-md overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-charcoal-900 text-white font-bold uppercase text-xs">
                <tr>
                  <th className="py-3 px-4">Item</th>
                  <th className="py-3 px-4">HUID</th>
                  <th className="py-3 px-4">HSN</th>
                  <th className="py-3 px-4 text-right">Gross Wt</th>
                  <th className="py-3 px-4 text-right">Net Wt</th>
                  <th className="py-3 px-4 text-right">Rate</th>
                  <th className="py-3 px-4 text-right">Making</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors text-charcoal-900 font-medium">
                    <td className="py-3 px-4">{item.item_name}</td>
                    <td className="py-3 px-4 font-mono text-xs">{item.huid || '-'}</td>
                    <td className="py-3 px-4 text-center font-mono text-[10px] text-gray-400">{item.hsn_code || '7113'}</td>
                    <td className="py-3 px-4 text-right font-mono text-gray-400">{item.gross_weight?.toFixed(3) || '0.000'}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold">{item.net_weight?.toFixed(3) || '0.000'}</td>
                    <td className="py-3 px-4 text-right font-mono">{item.rate.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right font-mono text-gray-600">{item.making_charges.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold">{item.line_total.toLocaleString()}</td>
                    <td className="py-3 px-4 text-center"><button onClick={() => handleRemoveItem(item.id)} className="text-gray-400 hover:text-red-600 p-1"><Trash2 size={16} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Old Gold Section */}
        <div className={`rounded-lg border transition-all duration-200 overflow-hidden ${isOldGoldOpen ? 'border-pink-300 ring-1 ring-pink-200' : 'border-gray-300'}`}>
           <div onClick={() => setIsOldGoldOpen(!isOldGoldOpen)} className={`flex items-center justify-between p-4 cursor-pointer ${isOldGoldOpen ? 'bg-pink-50' : 'bg-white hover:bg-gray-50'}`}>
             <div className="flex items-center gap-4">
                <h3 className={`font-bold uppercase tracking-wide text-sm ${isOldGoldOpen ? 'text-pink-700' : 'text-charcoal-700'}`}>Old Gold Exchange (Deduction)</h3>
                {oldGoldExchange.total > 0 && (
                  <button onClick={(e) => { e.stopPropagation(); handleOpenPreview('exchange'); }} className="flex items-center gap-1.5 px-3 py-1 bg-pink-600 text-white text-[10px] font-bold uppercase rounded-full shadow-sm hover:bg-pink-700 transition-colors">
                      <Eye size={12} /> Preview Exchange
                  </button>
                )}
             </div>
             {isOldGoldOpen ? <ChevronUp size={20} className="text-pink-600"/> : <ChevronDown size={20} className="text-gray-500"/>}
           </div>
           {isOldGoldOpen && (
             <div className="p-5 bg-white border-t border-pink-100 grid grid-cols-12 gap-4">
                <div className="col-span-4"><Input label="Particulars" value={oldGoldExchange.particulars} onChange={e => setOldGoldExchange({...oldGoldExchange, particulars: e.target.value})} /></div>
                <div className="col-span-2"><Input label="HSN" value={oldGoldExchange.hsn_code} isMonospaced onChange={e => setOldGoldExchange({...oldGoldExchange, hsn_code: e.target.value})} /></div>
                <div className="col-span-2"><Input label="Wt (g)" type="number" isMonospaced value={oldGoldExchange.weightInput} onChange={e => setOldGoldExchange({...oldGoldExchange, weightInput: e.target.value})} /></div>
                <div className="col-span-2"><Input label="Purity %" type="number" isMonospaced value={oldGoldExchange.purity} onChange={e => setOldGoldExchange({...oldGoldExchange, purity: parseFloat(e.target.value)||0})} /></div>
                <div className="col-span-2"><Input label="Rate" type="number" isMonospaced value={oldGoldExchange.rateInput} onChange={e => setOldGoldExchange({...oldGoldExchange, rateInput: e.target.value})} /></div>
                <div className="col-span-12 flex justify-end mt-2"><div className="bg-pink-50 px-4 py-2 rounded text-pink-700 font-bold border border-pink-200">Value: - {formatCurrency(oldGoldExchange.total)}</div></div>
             </div>
           )}
        </div>
      </div>

      {/* Action Panel */}
      <div className="w-[420px] bg-white border-l border-gray-300 flex flex-col z-40 h-full shadow-lg print:hidden">
        <div className="p-5 border-b border-gray-200 bg-charcoal-900 text-white font-bold uppercase tracking-wider text-sm flex justify-between items-center">
          <span>{billId ? `Editing Bill: ${billNo}` : 'Summary'}</span>
          {billId && (
            <button 
              onClick={onClearEdit}
              className="text-[10px] bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded transition-colors"
            >
              Cancel Edit
            </button>
          )}
        </div>
        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
          <div className="space-y-3 pb-6 border-b border-gray-200 text-sm">
            <div className="flex justify-between items-center"><span className="text-gray-500 font-medium">Subtotal</span><span className="font-mono font-bold">{formatCurrency(calculatedTotals.itemsSubtotal)}</span></div>
            {oldGoldExchange.total > 0 && <div className="flex justify-between items-center py-2 bg-pink-50 px-2 rounded -mx-2 font-bold text-pink-700"><span>Less: Old Gold</span><span className="font-mono">- {formatCurrency(oldGoldExchange.total)}</span></div>}
            <div className="bg-gold-50/50 border border-gold-100 rounded p-3 my-2">
               <span className="text-[10px] font-bold text-gold-600 uppercase mb-2 block">Value Added (MC)</span>
               <div className="grid grid-cols-3 gap-2">
                 <Input placeholder="Wt" isMonospaced className="!py-1 text-xs" value={mcValueAdded.weightInput} onChange={e => setMcValueAdded({...mcValueAdded, weightInput: e.target.value, weight: parseFloat(e.target.value)||0, total: roundToWhole((parseFloat(e.target.value)||0) * (mcValueAdded.rate))})}/>
                 <Input placeholder="Rate" isMonospaced className="!py-1 text-xs" value={mcValueAdded.rateInput} onChange={e => setMcValueAdded({...mcValueAdded, rateInput: e.target.value, rate: parseFloat(e.target.value)||0, total: roundToWhole((mcValueAdded.weight) * (parseFloat(e.target.value)||0))})}/>
                 <div className="flex items-center justify-end font-mono font-bold text-sm">{formatCurrency(mcValueAdded.total)}</div>
               </div>
            </div>
            <div className="border-t border-dashed border-gray-300 pt-2 mt-2">
               <div className="flex justify-between items-center text-xs text-gray-400"><span>Taxable</span><span className="font-mono">{formatCurrency(calculatedTotals.baseTaxable)}</span></div>
               <div className="flex justify-between items-center font-bold"><span>GST ({saleType==='GST'?'3%':'0%'})</span><span className="font-mono">{formatCurrency(calculatedTotals.gstAmount)}</span></div>
            </div>
          </div>
          <div className="bg-charcoal-900 rounded p-6 text-center shadow-md">
            <p className="text-xs text-gold-500 font-bold uppercase mb-4">Net Payable</p>
            <div className="inline-flex items-center border-b border-gray-700 pb-2 px-4 gap-3"><span className="text-2xl text-gold-500 opacity-60">₹</span><input type="number" className="bg-transparent text-center text-4xl text-white font-bold outline-none w-64" value={amountPayableInput} onChange={e => handleAmountPayableChange(e.target.value)}/></div>
            <p className="text-[10px] text-gray-400 mt-4 uppercase">{numberToWords(calculatedTotals.grandTotal)}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded border border-gray-200">
             <h4 className="text-xs font-bold uppercase mb-3 flex items-center gap-2"><CreditCard size={14}/> Add Payment</h4>
             <div className="grid grid-cols-2 gap-3 mb-3">
               <Select value={currentPayment.type} onChange={e => setCurrentPayment({...currentPayment, type: e.target.value})} options={[{ value: 'cash', label: 'Cash' }, { value: 'upi', label: 'UPI' }, { value: 'card', label: 'Card' }]} />
               <Input type="number" placeholder="Amount" value={currentPayment.amount} onChange={e => setCurrentPayment({...currentPayment, amount: e.target.value})} />
             </div>
             <Button onClick={handleAddPayment} className="w-full bg-gold-500 text-white shadow-md">Add Payment</Button>
          </div>
          {paymentMethods.length > 0 && (
            <div className="border border-gray-200 rounded overflow-hidden">
               <table className="w-full text-xs divide-y divide-gray-100">
                 {paymentMethods.map(p => (<tr key={p.id} className="bg-white"><td className="p-2 font-bold uppercase">{p.type}</td><td className="p-2 text-right font-mono font-bold">{formatCurrency(parseFloat(p.amount))}</td><td className="p-2 text-center w-8"><button onClick={() => handleRemovePayment(p.id)} className="text-gray-400 hover:text-red-500"><X size={14}/></button></td></tr>))}
                 <tr className="bg-gray-50 font-bold border-t"> <td className="p-2">Paid:</td><td className="p-2 text-right">{formatCurrency(totalPaid)}</td><td></td></tr>
               </table>
            </div>
          )}
          <div className={`p-3 rounded border flex justify-between items-center font-bold uppercase text-xs ${balanceDue > 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
             <span>{balanceDue > 0.9 ? 'Balance' : 'Complete'}</span><span className="font-mono text-sm">{formatCurrency(Math.max(0, balanceDue))}</span>
          </div>
        </div>
        <div className="p-6 bg-white border-t border-gray-200 space-y-3">
           <div className="grid grid-cols-2 gap-2 mb-2">
              <Button variant="secondary" size="sm" onClick={() => handleDirectPrint('exchange')} className="text-xs border-pink-200 text-pink-600 hover:bg-pink-50"><Printer size={16} className="mr-2"/> Print Exchange</Button>
              <Button variant="secondary" size="sm" onClick={() => handleDirectPrint('invoice')} className="text-xs border-gray-200 text-gray-600 hover:bg-gray-50"><Printer size={16} className="mr-2"/> Print Invoice</Button>
           </div>
           <Button fullWidth onClick={handleSaveBill} className="h-14 text-base shadow-lg" disabled={loading}>
             {loading ? <RefreshCw className="animate-spin mr-2" size={20} /> : <Printer size={20} className="mr-2" />}
             {billId ? 'UPDATE & PRINT' : 'SAVE & PRINT BILL'}
           </Button>
        </div>
      </div>
    </div>
  );
};
