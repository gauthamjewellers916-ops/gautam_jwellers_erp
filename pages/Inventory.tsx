
'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Search, 
  Save, 
  X, 
  Edit2, 
  Trash2, 
  Package, 
  Filter, 
  ScanLine,
  MapPin,
  Tag,
  Info,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
  Plus,
  RefreshCw,
  Printer
} from 'lucide-react';
import { Button, Input, Select, Card, toast } from '../components/UIComponents';
import { InventoryItem, StockStatus } from '../types';
import { 
  getInventoryItems, 
  createInventoryItem, 
  updateInventoryItem, 
  deleteInventoryItem 
} from '../db';

export const Inventory: React.FC = () => {
  // --- STATE ---
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const initialFormState: Partial<InventoryItem> = {
    barcode: '', 
    huid: '', 
    item_name: '', 
    category: 'Ring', 
    stone_type: '',
    gross_weight: 0, 
    net_weight: 0, 
    weight: 0, 
    metal_type: 'Gold', 
    purity: '22K', 
    hsn_code: '7113', 
    location: '',
    making_charges: 0, 
    gst_rate: 3, 
    price_per_gram: 0, 
    net_price: 0, 
    stock_status: 'in_stock', 
    remarks: '',
    quantity: 1
  };
  const [formData, setFormData] = useState(initialFormState);
  
  // Refs for shortcuts
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // --- FETCH DATA ---
  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getInventoryItems();
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      toast({ title: 'Error', description: 'Failed to load inventory items.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- SHORTCUTS ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt + N to Open Modal
      if (e.altKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleOpenModal();
      }
      
      // Shortcuts active only when modal is open
      if (isModalOpen) {
        // Alt + B to focus Barcode
        if (e.altKey && e.key.toLowerCase() === 'b') {
          e.preventDefault();
          barcodeInputRef.current?.focus();
        }
        // Ctrl + S to Save
        if (e.ctrlKey && e.key.toLowerCase() === 's') {
          e.preventDefault();
          handleSave();
        }
        // Escape to Close
        if (e.key === 'Escape') {
            setIsModalOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, formData]);

  // Focus barcode when modal opens
  useEffect(() => {
    if (isModalOpen) {
      setTimeout(() => {
        barcodeInputRef.current?.focus();
      }, 100);
    }
  }, [isModalOpen]);

  // --- HANDLERS ---
  
  const handleInputChange = (field: keyof InventoryItem, value: any) => {
    const newData = { ...formData, [field]: value };
    
    // Auto-calculate Net Price
    if (['gross_weight', 'net_weight', 'price_per_gram', 'making_charges', 'gst_rate', 'quantity'].includes(field)) {
      const w = Number(newData.net_weight || 0);
      const rate = Number(newData.price_per_gram || 0);
      const making = Number(newData.making_charges || 0);
      const gst = Number(newData.gst_rate || 0);
      const qty = Number(newData.quantity || 1);
      
      const base = ((w * rate) + making) * qty;
      const total = base + (base * (gst / 100));
      newData.net_price = Math.round(total);
    }

    setFormData(newData);
  };

  const handleSave = async () => {
    if (!formData.barcode || !formData.item_name || !formData.net_weight) {
      toast({ title: 'Validation Error', description: 'Please fill required fields (Barcode, Name, Net Weight)', variant: 'destructive' });
      return;
    }

    try {
      const itemToSave = {
        ...formData,
        weight: formData.net_weight || 0 // Sync weight with net_weight
      };

      if (editingId) {
        await updateInventoryItem(editingId, itemToSave);
        toast({ title: 'Item Updated', description: `${formData.item_name} has been updated.` });
      } else {
        await createInventoryItem(itemToSave);
        toast({ title: 'Item Saved', description: `${formData.item_name} added to inventory.` });
      }
      
      setIsModalOpen(false);
      setEditingId(null);
      setFormData(initialFormState);
      fetchData();
    } catch (error: any) {
      console.error('Error saving item:', error);
      toast({ title: 'Error', description: error.message || 'Failed to save item.', variant: 'destructive' });
    }
  };

  const handlePrint = (item: InventoryItem) => {
    // Basic item details print with branding
    const printContent = `
      <html>
        <head>
          <title>Item Detail - ${item.barcode}</title>
          <style>
            @media print {
              @page { size: A5 portrait; margin: 0; }
              body { margin: 0; padding: 20mm; font-weight: bold !important; -webkit-print-color-adjust: exact; }
              * { font-weight: bold !important; }
            }
            body { font-family: sans-serif; padding: 40px; font-weight: bold; }
            .header { text-align: center; border-bottom: 4px solid black; margin-bottom: 30px; padding-bottom: 20px; display: flex; flex-direction: column; align-items: center; }
            .logo { width: 100px; height: 100px; object-fit: contain; margin-bottom: 10px; }
            .shop-name { font-size: 32px; font-weight: 900; margin: 0; }
            .sub-header { font-size: 14px; color: #444; margin-top: 5px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 5px; font-size: 18px; }
            .label { color: #666; text-transform: uppercase; font-size: 12px; }
            .value { text-transform: uppercase; }
            .footer { margin-top: 50px; text-align: center; font-size: 10px; color: #888; letter-spacing: 2px; }
          </style>
        </head>
        <body>
          <div class="header">
            <img src="/logo.png" class="logo" />
            <h1 class="shop-name">GAUTHAM JEWELLERS</h1>
            <p class="sub-header">Inventory Record - ${item.barcode}</p>
          </div>
          <div class="row"><span class="label">Barcode:</span> <span class="value">${item.barcode}</span></div>
          <div class="row"><span class="label">Item Name:</span> <span class="value">${item.item_name}</span></div>
          <div class="row"><span class="label">HUID:</span> <span class="value">${item.huid || '-'}</span></div>
          <div class="row"><span class="label">Category:</span> <span class="value">${item.category}</span></div>
          <div class="row"><span class="label">Metal:</span> <span class="value">${item.metal_type} (${item.purity})</span></div>
          <div class="row"><span class="label">Gross Weight:</span> <span class="value">${item.gross_weight?.toFixed(3)}g</span></div>
          <div class="row"><span class="label">Net Weight:</span> <span class="value">${item.net_weight?.toFixed(3)}g</span></div>
          <div class="row"><span class="label">Quantity:</span> <span class="value">${item.quantity || 1}</span></div>
          <div class="row"><span class="label">Location:</span> <span class="value">${item.location || '-'}</span></div>
        </body>
      </html>
    `;
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(printContent);
      win.document.close();
      win.focus();
      setTimeout(() => {
        win.print();
        win.close();
      }, 500);
    }
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingId(item.id);
    setFormData({ ...item });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      await deleteInventoryItem(id);
      toast({ title: 'Item Deleted', description: 'Inventory record removed.' });
      fetchData();
    } catch (error: any) {
      console.error('Error deleting item:', error);
      toast({ title: 'Error', description: error.message || 'Failed to delete item.', variant: 'destructive' });
    }
  };

  const handleOpenModal = () => {
      setEditingId(null);
      setFormData(initialFormState);
      setIsModalOpen(true);
  };

  // --- DERIVED STATE ---
  
  const filteredItems = useMemo(() => {
    const lowerTerm = searchTerm.toLowerCase();
    return items.filter(item => 
      item.item_name.toLowerCase().includes(lowerTerm) || 
      item.barcode.toLowerCase().includes(lowerTerm) ||
      (item.category && item.category.toLowerCase().includes(lowerTerm))
    );
  }, [items, searchTerm]);

  // --- RENDER ---

  return (
    <div className="h-full flex flex-col bg-white text-charcoal-900 relative overflow-hidden font-sans">
      
      {/* 1. HEADER & TOOLBAR */}
      <div className="bg-white border-b border-gray-200 px-8 py-5 flex justify-between items-center shadow-sm z-10">
         <div className="flex items-center gap-4">
             <div className="w-10 h-10 rounded-full bg-charcoal-900 text-gold-500 flex items-center justify-center shadow-md">
                 <Package size={20} />
             </div>
             <div>
                 <h2 className="text-xl font-bold text-charcoal-900 tracking-tight leading-none">Inventory Management</h2>
                 <p className="text-xs text-gray-500 font-medium mt-1">
                    Total Items: <span className="font-mono font-bold text-charcoal-700">{items.length}</span>
                 </p>
             </div>
         </div>

         <div className="flex items-center gap-4">
            <div className="relative w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gold-500" size={16} />
                <input 
                   type="text"
                   placeholder="Search inventory..."
                   className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-md text-charcoal-900 placeholder-gray-400 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 shadow-sm transition-all text-sm"
                   value={searchTerm}
                   onChange={e => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="h-8 w-px bg-gray-300 mx-2"></div>
            <Button onClick={handleOpenModal} className="bg-gradient-to-r from-gold-500 to-gold-600 shadow-lg hover:shadow-gold-500/20 gap-2 px-6">
                <Plus size={18} /> Add New Item
            </Button>
         </div>
      </div>

      {/* 2. TABLE SECTION */}
      <div className="flex-1 overflow-hidden flex flex-col p-8 bg-gray-50/50">
         <div className="flex-1 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden flex flex-col">
            <div className="overflow-auto flex-1">
               <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200 text-charcoal-700 font-bold uppercase text-[11px] tracking-wider sticky top-0 z-10">
                     <tr>
                        <th className="py-4 px-6">Barcode</th>
                        <th className="py-4 px-6">HUID</th>
                        <th className="py-4 px-6">Item Name</th>
                        <th className="py-4 px-6">Category</th>
                        <th className="py-4 px-6 text-right">Gross Wt</th>
                        <th className="py-4 px-6 text-right">Net Wt</th>
                        <th className="py-4 px-6 text-center">Qty</th>
                        <th className="py-4 px-6 text-right">Price/g</th>
                        <th className="py-4 px-6">Location</th>
                        <th className="py-4 px-6 text-center">Actions</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                     {loading ? (
                        <tr>
                           <td colSpan={10} className="py-20 text-center text-gray-400">
                              <RefreshCw className="animate-spin mx-auto mb-2" size={24}/>
                              <span className="text-xs font-bold uppercase tracking-widest">Loading Inventory...</span>
                           </td>
                        </tr>
                     ) : filteredItems.map(item => (
                        <tr key={item.id} className="hover:bg-gold-50/10 transition-colors group">
                           <td className="py-3 px-6 font-mono font-medium text-charcoal-800">{item.barcode}</td>
                           <td className="py-3 px-6 font-mono text-xs text-gold-600 font-bold">{item.huid || '-'}</td>
                           <td className="py-3 px-6">
                              <span className="font-bold text-charcoal-900">{item.item_name}</span>
                              {item.stock_status === 'out_of_stock' && (
                                <span className="ml-2 inline-block w-2 h-2 rounded-full bg-red-500" title="Out of Stock"/>
                              )}
                           </td>
                           <td className="py-3 px-6 text-gray-500">{item.category}</td>
                           <td className="py-3 px-6 text-right font-mono text-gray-400">{item.gross_weight?.toFixed(3) || '0.000'}</td>
                           <td className="py-3 px-6 text-right font-mono font-bold text-charcoal-900">{item.net_weight?.toFixed(3) || '0.000'}</td>
                           <td className="py-3 px-6 text-center font-mono font-bold text-gold-600">{item.quantity || 1}</td>
                           <td className="py-3 px-6 text-right font-mono text-gray-500">{item.price_per_gram?.toLocaleString() || '0'}</td>
                           <td className="py-3 px-6 text-xs uppercase text-gray-400 font-bold">{item.location}</td>
                           <td className="py-3 px-6 text-center">
                              <div className="flex items-center justify-center gap-3">
                                 <button 
                                    className="p-1.5 hover:bg-gold-50 rounded text-gold-600 transition-colors"
                                    title="Print Details"
                                    onClick={() => handlePrint(item)}
                                 >
                                    <Printer size={16} />
                                 </button>
                                 <button 
                                    className="p-1.5 hover:bg-blue-50 rounded text-blue-600 transition-colors"
                                    title="Edit Item"
                                    onClick={() => handleEdit(item)}
                                 >
                                    <Edit2 size={16} />
                                 </button>
                                 <button 
                                    className="p-1.5 hover:bg-red-50 rounded text-red-500 transition-colors"
                                    title="Delete Item"
                                    onClick={() => handleDelete(item.id)}
                                 >
                                    <Trash2 size={16} />
                                 </button>
                              </div>
                           </td>
                        </tr>
                     ))}
                     {!loading && filteredItems.length === 0 && (
                        <tr>
                           <td colSpan={10} className="py-20 text-center text-gray-400 italic">
                              No items found matching your criteria.
                           </td>
                        </tr>
                     )}
                  </tbody>
               </table>
            </div>
            
            {/* Table Footer */}
            <div className="bg-gray-50 border-t border-gray-200 p-3 flex justify-between items-center text-xs text-gray-500">
               <span>Showing {filteredItems.length} records</span>
               <span className="flex items-center gap-2">
                   <span className="bg-white px-2 py-1 rounded border border-gray-200 font-mono">Alt + N</span> to Add Item
               </span>
            </div>
         </div>
      </div>

      {/* 3. ADD ITEM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-charcoal-900/60 backdrop-blur-sm flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-6xl rounded-lg shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-hidden">
              
              {/* Modal Header */}
              <div className="bg-charcoal-900 text-white px-6 py-4 flex justify-between items-center shrink-0">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gold-500 text-charcoal-900 flex items-center justify-center font-bold">
                      {editingId ? <Edit2 size={20}/> : <Plus size={20}/>}
                    </div>
                    <h3 className="font-sans font-bold text-lg tracking-wide">{editingId ? 'Edit Item' : 'Add New Item'}</h3>
                 </div>
                 <div className="flex items-center gap-4">
                    <div className="flex gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        <span className="bg-charcoal-800 px-2 py-1 rounded border border-charcoal-700">Alt + B : Scan</span>
                        <span className="bg-charcoal-800 px-2 py-1 rounded border border-charcoal-700">Ctrl + S : Save</span>
                    </div>
                    <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                      <X size={24}/>
                    </button>
                 </div>
              </div>

              {/* Modal Body: Command Center Grid */}
              <div className="flex-1 overflow-auto bg-gray-50/50 p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* GROUP 1: IDENTITY */}
                    <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm space-y-4">
                        <h3 className="text-xs font-bold text-gold-600 uppercase tracking-widest border-b border-gray-100 pb-2 mb-2 flex items-center gap-2">
                        <ScanLine size={14}/> Identity
                        </h3>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <Input 
                                    ref={barcodeInputRef}
                                    label="Barcode / SKU" 
                                    placeholder="Scan..." 
                                    isMonospaced 
                                    value={formData.barcode}
                                    onChange={e => handleInputChange('barcode', e.target.value)}
                                    icon={<ScanLine size={14}/>}
                                />
                                <Input 
                                    label="HUID Number" 
                                    placeholder="e.g. H123456" 
                                    isMonospaced 
                                    value={formData.huid}
                                    onChange={e => handleInputChange('huid', e.target.value)}
                                />
                            </div>
                            <Input 
                                label="Item Name" 
                                placeholder="e.g. Diamond Necklace" 
                                value={formData.item_name}
                                onChange={e => handleInputChange('item_name', e.target.value)}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <Select 
                                    label="Category" 
                                    value={formData.category}
                                    onChange={e => handleInputChange('category', e.target.value)}
                                    options={[
                                        {value: 'Ring', label: 'Ring'},
                                        {value: 'Necklace', label: 'Necklace'},
                                        {value: 'Bangles', label: 'Bangles'},
                                        {value: 'Earrings', label: 'Earrings'},
                                        {value: 'Pendant', label: 'Pendant'},
                                        {value: 'Chain', label: 'Chain'},
                                    ]}
                                />
                                <Input 
                                    label="Stone Type" 
                                    placeholder="None" 
                                    value={formData.stone_type}
                                    onChange={e => handleInputChange('stone_type', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* GROUP 2: SPECIFICATIONS */}
                    <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm space-y-4">
                        <h3 className="text-xs font-bold text-gold-600 uppercase tracking-widest border-b border-gray-100 pb-2 mb-2 flex items-center gap-2">
                        <Tag size={14}/> Specifications
                        </h3>
                        <div className="space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                                <Input 
                                    label="Gross Weight (g)" 
                                    type="number" 
                                    isMonospaced 
                                    value={formData.gross_weight || ''}
                                    onChange={e => handleInputChange('gross_weight', parseFloat(e.target.value))}
                                />
                                <Input 
                                    label="Net Weight (g)" 
                                    type="number" 
                                    isMonospaced 
                                    value={formData.net_weight || ''}
                                    onChange={e => handleInputChange('net_weight', parseFloat(e.target.value))}
                                />
                                <Input 
                                    label="Quantity" 
                                    type="number" 
                                    isMonospaced 
                                    value={formData.quantity || ''}
                                    onChange={e => handleInputChange('quantity', parseInt(e.target.value, 10))}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <Input 
                                    label="HSN Code" 
                                    isMonospaced 
                                    value={formData.hsn_code}
                                    onChange={e => handleInputChange('hsn_code', e.target.value)}
                                />
                                <Input 
                                    label="Location / Tray" 
                                    placeholder="e.g. Counter 1, Tray A" 
                                    value={formData.location}
                                    onChange={e => handleInputChange('location', e.target.value)}
                                    icon={<MapPin size={14}/>}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <Select 
                                    label="Metal Type"
                                    value={formData.metal_type}
                                    onChange={e => handleInputChange('metal_type', e.target.value)}
                                    options={[
                                    {value: 'Gold', label: 'Gold'},
                                    {value: 'Silver', label: 'Silver'},
                                    {value: 'Platinum', label: 'Platinum'},
                                    {value: 'Rose Gold', label: 'Rose Gold'},
                                    ]}
                                />
                                <Select 
                                    label="Purity"
                                    value={formData.purity}
                                    onChange={e => handleInputChange('purity', e.target.value)}
                                    options={[
                                    {value: '24K', label: '24K'},
                                    {value: '22K', label: '22K'},
                                    {value: '18K', label: '18K'},
                                    {value: '14K', label: '14K'},
                                    {value: '925', label: '925 (Silver)'},
                                    ]}
                                />
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                <Select 
                                    label="Status"
                                    value={formData.stock_status}
                                    onChange={e => handleInputChange('stock_status', e.target.value)}
                                    options={[
                                    {value: 'in_stock', label: 'In Stock'},
                                    {value: 'out_of_stock', label: 'Out of Stock'},
                                    {value: 'sold', label: 'Sold'},
                                    ]}
                                />
                            </div>
                            <Input 
                                label="Remarks" 
                                placeholder="Optional notes" 
                                value={formData.remarks}
                                onChange={e => handleInputChange('remarks', e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Financials Hidden but values preserved in state for auto-calc if needed, 
                        though user said financials not needed. I will remove the UI section. */}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-5 bg-gray-50 border-t border-gray-200 flex justify-end gap-3 shrink-0">
                  <Button variant="outline" onClick={() => setIsModalOpen(false)} className="border-gray-300 hover:bg-white">
                      Cancel
                  </Button>
                  <Button onClick={handleSave} className="bg-gradient-to-r from-gold-500 to-gold-600 text-white shadow-lg hover:shadow-gold-500/20 px-8">
                      <Save size={18} className="mr-2"/> {editingId ? 'Update Item' : 'Save Item'}
                  </Button>
              </div>

           </div>
        </div>
      )}

    </div>
  );
};
