import React, { useState, useRef, useEffect } from 'react';
import { InvoiceData, LineItem, CURRENCIES, TaxType } from '../types';
import { Plus, Trash2, Wand2, Sparkles, Loader2, Upload, Image as ImageIcon, X, Save, Download, UserCheck, Search, Mail } from 'lucide-react';
import { generateInvoiceTerms, generateThankYouNote, suggestItemDescription } from '../services/geminiService';

interface InvoiceEditorProps {
  data: InvoiceData;
  onChange: (data: InvoiceData) => void;
}

interface SavedClient {
    name: string;
    email: string;
    address: string;
}

interface BusinessProfile {
    senderName: string;
    senderEmail: string;
    senderAddress: string;
    logo?: string;
    currency?: string;
    taxRate?: number;
    taxType?: TaxType;
}

const InvoiceEditor: React.FC<InvoiceEditorProps> = ({ data, onChange }) => {
  const [loadingField, setLoadingField] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Client Autocomplete State
  const [savedClients, setSavedClients] = useState<SavedClient[]>([]);
  const [showClientSuggestions, setShowClientSuggestions] = useState(false);
  const [filteredClients, setFilteredClients] = useState<SavedClient[]>([]);

  // CC/BCC Toggle
  const [showCcBcc, setShowCcBcc] = useState(!!data.ccEmail || !!data.bccEmail);

  // Load saved clients on mount
  useEffect(() => {
      try {
          const stored = localStorage.getItem('lumina_saved_clients');
          if (stored) {
              setSavedClients(JSON.parse(stored));
          }
      } catch (e) {
          console.error("Failed to load saved clients", e);
          // Recover from corrupted storage
          localStorage.removeItem('lumina_saved_clients');
      }
  }, []);

  const updateField = (field: keyof InvoiceData, value: any) => {
    let safeValue = value;
    // Sanitize Tax Rate
    if (field === 'taxRate' && typeof value === 'number') {
         safeValue = Math.max(0, value);
    }
    onChange({ ...data, [field]: safeValue });
  };

  const updateItem = (id: string, field: keyof LineItem, value: any) => {
    let safeValue = value;
    
    // Sanitize Quantity and Price
    if ((field === 'quantity' || field === 'price') && typeof value === 'number') {
        safeValue = Math.max(0, value);
    }

    const newItems = data.items.map(item => 
      item.id === id ? { ...item, [field]: safeValue } : item
    );
    onChange({ ...data, items: newItems });
  };

  const addItem = () => {
    const newItem: LineItem = {
      id: Date.now().toString(),
      description: 'New Item',
      quantity: 1,
      price: 0,
    };
    onChange({ ...data, items: [...data.items, newItem] });
  };

  const removeItem = (id: string) => {
    onChange({ ...data, items: data.items.filter(item => item.id !== id) });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
          alert("Please upload a valid image file (JPG, PNG, etc).");
          if (fileInputRef.current) fileInputRef.current.value = '';
          return;
      }
      if (file.size > 2 * 1024 * 1024) {
          alert("File size too large. Please upload an image under 2MB.");
          if (fileInputRef.current) fileInputRef.current.value = '';
          return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        updateField('logo', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
      updateField('logo', '');
      if (fileInputRef.current) {
          fileInputRef.current.value = '';
      }
  };

  // --- Business Profile Logic ---
  const saveBusinessProfile = () => {
      const profile: BusinessProfile = {
          senderName: data.senderName,
          senderEmail: data.senderEmail,
          senderAddress: data.senderAddress,
          logo: data.logo,
          currency: data.currency,
          taxRate: data.taxRate,
          taxType: data.taxType
      };
      
      try {
          localStorage.setItem('lumina_business_profile', JSON.stringify(profile));
          alert("Business profile (Details, Logo, Currency, Tax settings) saved as default!");
      } catch (e) {
          console.error("Storage failed", e);
          alert("Failed to save profile. Your logo image might be too large for browser storage. Try a smaller image.");
      }
  };

  const loadBusinessProfile = () => {
      try {
          const stored = localStorage.getItem('lumina_business_profile');
          if (stored) {
              const profile: BusinessProfile = JSON.parse(stored);
              // Use nullish coalescing (??) to correctly allow loading empty strings if saved.
              onChange({
                  ...data,
                  senderName: profile.senderName ?? '',
                  senderEmail: profile.senderEmail ?? '',
                  senderAddress: profile.senderAddress ?? '',
                  logo: profile.logo ?? '', 
                  currency: profile.currency || 'USD',
                  taxRate: typeof profile.taxRate === 'number' ? profile.taxRate : data.taxRate,
                  taxType: profile.taxType || 'standard'
              });
              alert("Profile loaded successfully!");
          } else {
              alert("No saved profile found. Fill in your details and click 'Save Profile' first.");
          }
      } catch (e) {
          console.error(e);
          alert("Error loading profile. Data might be corrupted.");
      }
  };

  // --- Client Logic ---
  const handleClientNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      updateField('recipientName', val);
      
      if (val.trim().length > 0) {
          const matches = savedClients.filter(c => 
              c.name.toLowerCase().includes(val.toLowerCase())
          );
          setFilteredClients(matches);
          setShowClientSuggestions(matches.length > 0);
      } else {
          setShowClientSuggestions(false);
      }
  };

  const selectClient = (client: SavedClient) => {
      onChange({
          ...data,
          recipientName: client.name,
          recipientEmail: client.email,
          recipientAddress: client.address
      });
      setShowClientSuggestions(false);
  };

  const saveClient = () => {
      if (!data.recipientName.trim()) {
          alert("Please enter a client name.");
          return;
      }
      
      const newClient: SavedClient = {
          name: data.recipientName.trim(),
          email: data.recipientEmail.trim(),
          address: data.recipientAddress.trim()
      };

      // Check if exists and update, or add new
      const existingIndex = savedClients.findIndex(c => c.name.toLowerCase() === newClient.name.toLowerCase());
      let updatedList = [...savedClients];
      
      if (existingIndex >= 0) {
          updatedList[existingIndex] = newClient;
      } else {
          updatedList.push(newClient);
      }

      setSavedClients(updatedList);
      localStorage.setItem('lumina_saved_clients', JSON.stringify(updatedList));
      alert(`Client "${newClient.name}" saved!`);
  };


  const handleAiAction = async (action: 'terms' | 'notes' | 'item', itemId?: string) => {
    if (!process.env.API_KEY) {
        alert("Please configure your API_KEY in the environment to use AI features.");
        return;
    }

    setLoadingField(itemId ? `item-${itemId}` : action);
    
    try {
        if (action === 'terms') {
            const terms = await generateInvoiceTerms(data.senderName, data.items.map(i => i.description).join(', '));
            updateField('terms', terms);
        } else if (action === 'notes') {
            const notes = await generateThankYouNote(data.recipientName, data.senderName);
            updateField('notes', notes);
        } else if (action === 'item' && itemId) {
            const item = data.items.find(i => i.id === itemId);
            if (item) {
                const improvedDesc = await suggestItemDescription(item.description);
                updateItem(itemId, 'description', improvedDesc);
            }
        }
    } catch (e) {
        console.error(e);
        alert("AI Service unavailable. Please check your connection.");
    } finally {
        setLoadingField(null);
    }
  };

  // Styles
  const cardClass = "bg-white dark:bg-slate-800 rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] hover:shadow-[0_8px_30px_-5px_rgba(6,81,237,0.15)] border border-slate-100 dark:border-slate-700 p-6 transition-all duration-300";
  const inputClass = "w-full p-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all duration-200";
  const labelClass = "block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide";

  return (
    <div className="space-y-6 p-6 pb-24" onClick={() => setShowClientSuggestions(false)}>
        {/* Settings */}
        <div className={cardClass}>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-6 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"></span>
                Invoice Details
            </h3>
            <div className="grid grid-cols-2 gap-5">
                <div>
                    <label className={labelClass}>Invoice #</label>
                    <input 
                        type="text" 
                        value={data.invoiceNumber}
                        onChange={(e) => updateField('invoiceNumber', e.target.value)}
                        className={inputClass}
                    />
                </div>
                <div>
                    <label className={labelClass}>Currency</label>
                    <select 
                        value={data.currency}
                        onChange={(e) => updateField('currency', e.target.value)}
                        className={inputClass}
                    >
                        {CURRENCIES.map(c => (
                            <option key={c.code} value={c.code}>
                                {c.code} - {c.name} ({c.symbol})
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className={labelClass}>Date</label>
                    <input 
                        type="date" 
                        value={data.date}
                        onChange={(e) => updateField('date', e.target.value)}
                        className={inputClass}
                    />
                </div>
                <div>
                    <label className={labelClass}>Due Date</label>
                    <input 
                        type="date" 
                        value={data.dueDate}
                        onChange={(e) => updateField('dueDate', e.target.value)}
                        className={inputClass}
                    />
                </div>
            </div>
        </div>

        {/* Sender & Recipient */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={cardClass}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span> From (You)
                    </h3>
                    <div className="flex gap-2">
                        <button 
                            type="button"
                            onClick={saveBusinessProfile} 
                            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/30 rounded-lg transition-colors" 
                            title="Save current details as default"
                        >
                            <Save size={14} /> Save Profile
                        </button>
                        <button 
                            type="button"
                            onClick={loadBusinessProfile} 
                            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 rounded-lg transition-colors" 
                            title="Load saved default profile"
                        >
                            <Download size={14} /> Load Profile
                        </button>
                    </div>
                </div>
                
                {/* Logo Upload */}
                <div className="mb-5 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                    <label className={labelClass}>Business Logo</label>
                    <div className="flex items-center gap-4 mt-2">
                        {data.logo ? (
                            <div className="relative group w-16 h-16 rounded-lg border border-slate-200 dark:border-slate-600 overflow-hidden flex-shrink-0 bg-white flex items-center justify-center shadow-sm">
                                <img src={data.logo} alt="Logo" className="w-full h-full object-contain p-1" />
                                <button 
                                    onClick={removeLogo}
                                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-all backdrop-blur-[1px]"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        ) : (
                            <div className="w-16 h-16 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-400 flex-shrink-0 bg-slate-100 dark:bg-slate-800">
                                <ImageIcon size={24} />
                            </div>
                        )}
                        <div className="flex-1">
                            <input 
                                type="file" 
                                accept="image/*" 
                                onChange={handleLogoUpload} 
                                className="hidden" 
                                id="logo-upload"
                                ref={fileInputRef}
                            />
                            <label 
                                htmlFor="logo-upload"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 hover:border-emerald-400 dark:hover:border-emerald-500 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-semibold cursor-pointer transition-all shadow-sm hover:shadow"
                            >
                                <Upload size={14} /> Choose Image
                            </label>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2">Max 2MB. Square PNG/JPG recommended.</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <input placeholder="Business Name" className={inputClass} value={data.senderName} onChange={e => updateField('senderName', e.target.value)} autoComplete="organization" />
                    </div>
                    <div>
                        <input placeholder="Email Address" className={inputClass} value={data.senderEmail} onChange={e => updateField('senderEmail', e.target.value)} autoComplete="email" />
                    </div>
                    <div>
                        <textarea rows={3} placeholder="Full Address" className={`${inputClass} resize-none`} value={data.senderAddress} onChange={e => updateField('senderAddress', e.target.value)} autoComplete="street-address" />
                    </div>
                </div>
            </div>
            
            <div className={cardClass}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></span> To (Client)
                    </h3>
                     <button onClick={saveClient} className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors" title="Save Client Details">
                        <UserCheck size={16} />
                    </button>
                </div>
                <div className="space-y-4">
                    {/* Autocomplete Input */}
                    <div className="relative">
                        <input 
                            placeholder="Client Name" 
                            className={inputClass} 
                            value={data.recipientName} 
                            onChange={handleClientNameChange}
                            onFocus={(e) => handleClientNameChange(e)}
                            autoComplete="off"
                        />
                        {showClientSuggestions && (
                            <div className="absolute z-20 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl max-h-48 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
                                {filteredClients.map((client, idx) => (
                                    <div 
                                        key={idx}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            selectClient(client);
                                        }}
                                        className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer text-sm text-slate-700 dark:text-slate-200 flex flex-col border-b border-slate-100 dark:border-slate-700 last:border-0"
                                    >
                                        <span className="font-semibold">{client.name}</span>
                                        <span className="text-xs text-slate-400 truncate">{client.email}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div>
                         <input placeholder="Client Email" className={inputClass} value={data.recipientEmail} onChange={e => updateField('recipientEmail', e.target.value)} autoComplete="off"/>
                    </div>

                    {/* CC & BCC Toggle */}
                    <div className="flex justify-end">
                        <button 
                            type="button"
                            onClick={() => setShowCcBcc(!showCcBcc)} 
                            className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide transition-colors ${showCcBcc ? 'text-blue-500' : 'text-slate-400 hover:text-blue-500'}`}
                        >
                            <Mail size={12} /> {showCcBcc ? 'Hide CC/BCC' : 'Add CC/BCC'}
                        </button>
                    </div>

                    {showCcBcc && (
                        <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                             <div>
                                <label className={labelClass}>CC Email</label>
                                <input placeholder="cc@example.com" className={inputClass} value={data.ccEmail || ''} onChange={e => updateField('ccEmail', e.target.value)} autoComplete="off" />
                             </div>
                             <div>
                                <label className={labelClass}>BCC Email</label>
                                <input placeholder="bcc@example.com" className={inputClass} value={data.bccEmail || ''} onChange={e => updateField('bccEmail', e.target.value)} autoComplete="off" />
                             </div>
                        </div>
                    )}

                    <div>
                         <textarea rows={3} placeholder="Client Address" className={`${inputClass} resize-none`} value={data.recipientAddress} onChange={e => updateField('recipientAddress', e.target.value)} autoComplete="off" />
                    </div>
                </div>
            </div>
        </div>

        {/* Items */}
        <div className={cardClass}>
             <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-6 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.5)]"></span> Line Items
            </h3>
            <div className="space-y-3">
                {data.items.map((item) => (
                    <div key={item.id} className="flex flex-col md:flex-row gap-3 items-start md:items-center bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-transparent hover:border-violet-200 dark:hover:border-violet-900/50 transition-colors group">
                        <div className="flex-1 w-full relative">
                             <input 
                                placeholder="Description" 
                                className="w-full p-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none pr-9 transition-all" 
                                value={item.description} 
                                onChange={e => updateItem(item.id, 'description', e.target.value)} 
                             />
                             <button 
                                onClick={() => handleAiAction('item', item.id)}
                                disabled={loadingField === `item-${item.id}`}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 hover:text-violet-500 transition-colors"
                                title="AI Enhance Description"
                             >
                                {loadingField === `item-${item.id}` ? <Loader2 size={16} className="animate-spin text-violet-500"/> : <Sparkles size={16} />}
                             </button>
                        </div>
                        <div className="flex gap-3 w-full md:w-auto">
                            <div className="relative w-24">
                                <input 
                                    type="number" 
                                    min="0"
                                    placeholder="Qty" 
                                    className="w-full p-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none text-right" 
                                    value={item.quantity} 
                                    onChange={e => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)} 
                                />
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-medium pointer-events-none">QTY</span>
                            </div>
                            <div className="relative w-32">
                                <input 
                                    type="number" 
                                    min="0"
                                    step="0.01"
                                    placeholder="Price" 
                                    className="w-full p-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none text-right" 
                                    value={item.price} 
                                    onChange={e => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)} 
                                />
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-medium pointer-events-none">PRICE</span>
                            </div>
                            <button 
                                onClick={() => removeItem(item.id)}
                                className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-all shadow-sm hover:shadow"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}
                <button 
                    onClick={addItem}
                    className="w-full mt-4 flex items-center justify-center gap-2 text-sm font-semibold text-violet-600 dark:text-violet-400 hover:text-white dark:hover:text-white px-4 py-3 bg-violet-50 dark:bg-violet-900/20 hover:bg-violet-600 dark:hover:bg-violet-600 rounded-xl transition-all duration-300 border border-violet-100 dark:border-violet-900/50 hover:border-transparent hover:shadow-lg hover:shadow-violet-500/20"
                >
                    <Plus size={18} /> Add New Item
                </button>
            </div>
            
             <div className="mt-8 flex justify-end">
                <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                    <div className="flex flex-col">
                         <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Tax Type (GST)</label>
                         <select 
                            value={data.taxType || 'standard'} 
                            onChange={(e) => updateField('taxType', e.target.value)}
                            className="p-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none"
                        >
                            <option value="standard">Standard Tax</option>
                            <option value="cgst_sgst">CGST + SGST (Intra-state)</option>
                            <option value="igst">IGST (Inter-state)</option>
                         </select>
                    </div>
                    <div className="flex flex-col">
                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Rate (%)</label>
                        <input 
                            type="number" 
                            min="0"
                            step="0.01"
                            value={data.taxRate}
                            onChange={(e) => updateField('taxRate', parseFloat(e.target.value) || 0)}
                            className="w-24 p-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none text-right font-semibold"
                        />
                    </div>
                </div>
            </div>
        </div>

        {/* AI Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className={`${cardClass} relative overflow-hidden group`}>
                <div className="flex justify-between items-center mb-4">
                     <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">Note to Client</h3>
                     <button 
                        onClick={() => handleAiAction('notes')}
                        disabled={loadingField === 'notes'}
                        className="flex items-center gap-1.5 text-xs font-bold text-white bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 px-3 py-1.5 rounded-full shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 transition-all disabled:opacity-70 active:scale-95"
                     >
                        {loadingField === 'notes' ? <Loader2 size={12} className="animate-spin"/> : <Wand2 size={12} />}
                        AI Write
                     </button>
                </div>
                <textarea 
                    rows={4} 
                    className={`${inputClass} resize-none`}
                    value={data.notes}
                    onChange={(e) => updateField('notes', e.target.value)}
                />
            </div>

            <div className={`${cardClass} relative overflow-hidden group`}>
                <div className="flex justify-between items-center mb-4">
                     <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">Terms & Conditions</h3>
                     <button 
                        onClick={() => handleAiAction('terms')}
                        disabled={loadingField === 'terms'}
                        className="flex items-center gap-1.5 text-xs font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 px-3 py-1.5 rounded-full shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all disabled:opacity-70 active:scale-95"
                     >
                        {loadingField === 'terms' ? <Loader2 size={12} className="animate-spin"/> : <Wand2 size={12} />}
                        AI Generate
                     </button>
                </div>
                <textarea 
                    rows={4} 
                    className={`${inputClass} resize-none`}
                    value={data.terms}
                    onChange={(e) => updateField('terms', e.target.value)}
                />
            </div>
        </div>
    </div>
  );
};

export default InvoiceEditor;