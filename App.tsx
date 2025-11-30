import React, { useState, useEffect } from 'react';
import { DEFAULT_INVOICE, InvoiceData, CURRENCIES } from './types';
import InvoiceEditor from './components/InvoiceEditor';
import InvoicePreview from './components/InvoicePreview';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Download, Printer, PieChart as PieIcon, Sun, Moon, LogOut, User as UserIcon, Eye, X, Mail, PlusCircle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const STORAGE_KEY = 'lumina_invoice_data';
const THEME_KEY = 'lumina_theme';
const AUTH_KEY = 'lumina_auth_user';
const INVOICE_SEQ_KEY = 'lumina_invoice_sequence';
const BUSINESS_PROFILE_KEY = 'lumina_business_profile';

interface User {
    email: string;
    name: string;
}

const LuminaLogo = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
        {/* Stylized Lotus */}
        <path d="M50 20 C50 20 35 45 35 60 C35 75 45 80 50 80 C55 80 65 75 65 60 C65 45 50 20 50 20 Z" fill="currentColor" fillOpacity="0.1" strokeWidth="2" />
        <path d="M50 80 C50 80 30 75 20 60 C15 50 20 35 35 45 C40 48 50 60 50 80" />
        <path d="M50 80 C50 80 70 75 80 60 C85 50 80 35 65 45 C60 48 50 60 50 80" />
        <path d="M50 80 C50 80 20 78 10 60 C5 50 15 40 25 50" strokeOpacity="0.8" />
        <path d="M50 80 C50 80 80 78 90 60 C95 50 85 40 75 50" strokeOpacity="0.8" />
        
        {/* Base line */}
        <path d="M35 85 L65 85" strokeWidth="3" />
        
        {/* Decorative Circle Segment */}
        <path d="M 50 10 A 40 40 0 0 0 10 50" strokeOpacity="0.3" strokeDasharray="4 4" />
        <path d="M 90 50 A 40 40 0 0 0 50 10" strokeOpacity="0.3" strokeDasharray="4 4" />
    </svg>
);

const AuthScreen = ({ onLogin, onGuest }: { onLogin: (u: User) => void, onGuest: () => void }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Simulating Backend
        if (email && password) {
            onLogin({ email, name: name || email.split('@')[0] });
        }
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] dark:bg-[#020617] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Decorative Mesh */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-500/20 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-md p-8 border border-white/20 dark:border-slate-700/50 relative z-10">
                <div className="text-center mb-8">
                    <div className="w-24 h-24 mx-auto mb-4 text-indigo-600 dark:text-indigo-400 drop-shadow-xl">
                        <LuminaLogo className="w-full h-full" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Free AI Invoice Generator</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm font-medium">Create professional PDF invoices in seconds.</p>
                </div>

                <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-xl mb-6">
                    <button 
                        onClick={() => setIsLogin(true)}
                        className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${isLogin ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                        Sign In
                    </button>
                    <button 
                        onClick={() => setIsLogin(false)}
                        className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${!isLogin ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                        Sign Up
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-1">Full Name</label>
                            <input 
                                type="text" 
                                required 
                                className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950/50 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                value={name}
                                onChange={e => setName(e.target.value)}
                            />
                        </div>
                    )}
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-1">Email Address</label>
                        <input 
                            type="email" 
                            required 
                            className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950/50 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                        />
                    </div>
                    <div className="space-y-1">
                         <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-1">Password</label>
                        <input 
                            type="password" 
                            required 
                            className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950/50 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                        />
                    </div>
                    
                    <button type="submit" className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/25 mt-2">
                        {isLogin ? 'Sign In to Dashboard' : 'Create Free Account'}
                    </button>
                </form>

                <div className="relative my-8">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-slate-700"></div></div>
                    <div className="relative flex justify-center text-xs uppercase font-semibold tracking-wider"><span className="bg-white/0 backdrop-blur-md px-2 text-slate-400">Or</span></div>
                </div>

                <button 
                    onClick={onGuest}
                    className="w-full py-3 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 group"
                >
                   <UserIcon size={18} className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-colors"/> 
                   Continue as Guest
                </button>
            </div>
        </div>
    );
}

const App = () => {
  const [data, setData] = useState<InvoiceData>(DEFAULT_INVOICE);
  const [isClient, setIsClient] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  // Initialize screen size directly to avoid layout thrashing and chart warnings
  const [isLargeScreen, setIsLargeScreen] = useState(() => typeof window !== 'undefined' ? window.innerWidth >= 1024 : false);

  // Initialize Data and Theme
  useEffect(() => {
    // Load invoice data
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            setData(JSON.parse(saved));
        }
    } catch (e) {
        console.error("Failed to parse saved invoice", e);
        localStorage.removeItem(STORAGE_KEY);
    }

    // Load theme
    const savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
    }

    // Load User
    try {
        const savedUser = localStorage.getItem(AUTH_KEY);
        if (savedUser) {
            setUser(JSON.parse(savedUser));
        }
    } catch (e) {
        console.error("Failed to parse user data", e);
        localStorage.removeItem(AUTH_KEY);
    }

    setIsClient(true);
    
    // Check screen size for chart rendering
    const checkScreen = () => setIsLargeScreen(window.innerWidth >= 1024);
    window.addEventListener('resize', checkScreen);
    return () => window.removeEventListener('resize', checkScreen);

  }, []);

  // Save invoice data safely
  useEffect(() => {
    if (isClient) {
      try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (e) {
          console.error("LocalStorage Quota Exceeded. Attempting to save without logo.", e);
          // Fallback: Try saving without the logo image to preserve textual data
          if (data.logo) {
              try {
                  const dataNoLogo = { ...data, logo: '' };
                  localStorage.setItem(STORAGE_KEY, JSON.stringify(dataNoLogo));
              } catch (retryError) {
                  console.error("Failed to save data even without logo.", retryError);
              }
          }
      }
    }
  }, [data, isClient]);

  // Apply theme class
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem(THEME_KEY, 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem(THEME_KEY, 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const handlePrint = () => {
    const original = document.getElementById('invoice-preview-capture');
    if (!original) return;

    // Create a specific container for print
    const printContainer = document.createElement('div');
    printContainer.className = 'print-mount-node';
    
    // Clone the invoice
    const clone = original.cloneNode(true) as HTMLElement;
    printContainer.appendChild(clone);
    document.body.appendChild(printContainer);

    // Print
    window.print();

    // Cleanup after print dialog closes
    const cleanup = () => {
        if (document.body.contains(printContainer)) {
            document.body.removeChild(printContainer);
        }
    };

    // Try standard event
    window.addEventListener('afterprint', cleanup, { once: true });

    // Fallback/Immediate cleanup
    setTimeout(cleanup, 1000);
  };

  const handleDownloadPdf = async () => {
    setIsExporting(true);
    let container: HTMLDivElement | null = null;
    
    try {
        // Find the original element
        const element = document.getElementById('invoice-preview-capture');
        if (!element) {
            throw new Error("Could not find invoice preview.");
        }

        // Create a temporary container off-screen
        container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.top = '-10000px';
        container.style.left = '0';
        container.style.width = '210mm'; 
        container.style.minHeight = '297mm'; 
        container.style.zIndex = '-1000';
        container.style.backgroundColor = '#ffffff';
        document.body.appendChild(container);

        // Clone the node
        const clone = element.cloneNode(true) as HTMLElement;
        clone.style.transform = 'scale(1)';
        clone.style.margin = '0';
        clone.style.boxShadow = 'none';
        container.appendChild(clone);

        // Small delay to ensure render
        await new Promise(resolve => setTimeout(resolve, 150));

        const canvas = await html2canvas(clone, {
            scale: 2, 
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff', 
            windowWidth: 1200, 
            scrollY: 0, // Ensure scroll doesn't affect capture
        });

        if (canvas.width === 0 || canvas.height === 0) {
             throw new Error("Canvas generation failed: 0 dimensions");
        }

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const imgWidth = 210; 
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
        pdf.save(`Invoice-${data.invoiceNumber}.pdf`);
    } catch (err) {
        console.error("PDF Export failed", err);
        alert("Failed to generate PDF. Please try printing to PDF instead using the Print button.");
    } finally {
        if (container && document.body.contains(container)) {
            document.body.removeChild(container);
        }
        setIsExporting(false);
    }
  };

  const getNextInvoiceNumber = () => {
    const stored = localStorage.getItem(INVOICE_SEQ_KEY);
    let seq = 1;
    if (stored) {
        seq = parseInt(stored, 10) + 1;
    } else {
        // If no sequence stored yet, we assume the user is starting fresh or after defaults.
        // Default is 1, so next is 2.
        seq = 2;
    }
    localStorage.setItem(INVOICE_SEQ_KEY, seq.toString());
    return `INV-${String(seq).padStart(3, '0')}`;
  };

  const resetInvoice = () => {
      if(confirm("Create new invoice? This will save your business profile but clear client details and generate a new invoice number.")) {
          const nextNumber = getNextInvoiceNumber();
          const today = new Date();
          const dueDate = new Date();
          dueDate.setDate(today.getDate() + 14);

          // Attempt to preserve business identity from saved profile or current data
          let senderDetails = {
              senderName: data.senderName,
              senderEmail: data.senderEmail,
              senderAddress: data.senderAddress,
              logo: data.logo,
              currency: data.currency,
              taxRate: data.taxRate,
              taxType: data.taxType
          };

          try {
              const savedProfile = localStorage.getItem(BUSINESS_PROFILE_KEY);
              if (savedProfile) {
                  const parsed = JSON.parse(savedProfile);
                  senderDetails = {
                      senderName: parsed.senderName || data.senderName,
                      senderEmail: parsed.senderEmail || data.senderEmail,
                      senderAddress: parsed.senderAddress || data.senderAddress,
                      logo: parsed.logo || data.logo,
                      currency: parsed.currency || data.currency,
                      taxRate: parsed.taxRate ?? data.taxRate,
                      taxType: parsed.taxType || data.taxType
                  };
              }
          } catch(e) {
              console.warn("Could not load saved business profile for new invoice", e);
          }

          const newInvoice: InvoiceData = {
              ...DEFAULT_INVOICE,
              ...senderDetails,
              invoiceNumber: nextNumber,
              date: today.toISOString().split('T')[0],
              dueDate: dueDate.toISOString().split('T')[0],
              // Resetting Client Details
              recipientName: '',
              recipientEmail: '',
              recipientAddress: '',
              // Resetting items to a blank state
              items: [
                { id: Date.now().toString(), description: 'New Service', quantity: 1, price: 0 }
              ],
              notes: '',
              ccEmail: '',
              bccEmail: ''
          };
          
          setData(newInvoice);
      }
  }

  const handleLogin = (u: User) => {
      setUser(u);
      localStorage.setItem(AUTH_KEY, JSON.stringify(u));
  };

  const handleLogout = () => {
      setUser(null);
      setIsGuest(false);
      localStorage.removeItem(AUTH_KEY);
  };
  
  const closePreview = () => setShowPreviewModal(false);

  // Chart Data Preparation
  const subtotal = data.items.reduce((acc, item) => acc + (item.quantity * item.price), 0);
  const taxAmount = (subtotal * data.taxRate) / 100;
  const totalAmount = subtotal + taxAmount;
  const currencySym = CURRENCIES.find(c => c.code === data.currency)?.symbol || '$';

  const chartData = [
      { name: 'Services/Items', value: subtotal },
      { name: 'Tax', value: taxAmount }
  ].filter(d => d.value > 0);
  const CHART_COLORS = ['#8b5cf6', '#94a3b8'];

  // Email Handler
  const handleSendEmail = () => {
    if (!data.recipientEmail) {
        alert("Please enter a recipient email address.");
        return;
    }

    const subject = `Invoice ${data.invoiceNumber} from ${data.senderName}`;
    const body = `Dear ${data.recipientName},\n\nPlease find attached invoice #${data.invoiceNumber} due on ${data.dueDate}.\n\nTotal Amount: ${currencySym}${totalAmount.toFixed(2)}\n\nNotes:\n${data.notes}\n\nTerms:\n${data.terms}\n\nRegards,\n${data.senderName}`;
    
    // Calculate available space safely
    const baseLink = `mailto:${data.recipientEmail}`;
    const params = [];
    if (data.ccEmail) params.push(`cc=${encodeURIComponent(data.ccEmail)}`);
    if (data.bccEmail) params.push(`bcc=${encodeURIComponent(data.bccEmail)}`);
    params.push(`subject=${encodeURIComponent(subject)}`);
    
    // Roughly estimate remaining length. 
    // Typical safe limit is ~2000 chars. We leave buffer.
    const currentLength = baseLink.length + params.join('&').length + 7; // +7 for ?body=
    const SAFE_LIMIT = 1800;
    const remainingChars = SAFE_LIMIT - currentLength;

    if (remainingChars > 100) {
         // Truncate the source string first, then encode. 
         // Encoding can expand characters (e.g. newline -> %0A), so we truncate conservatively.
         // A safe bet is to assume avg 1.5 chars expansion, so we take remaining / 1.5
         const safeBodyLength = Math.floor(remainingChars / 1.5);
         const bodyToEncode = body.length > safeBodyLength 
             ? body.slice(0, safeBodyLength) + "...\n[Email truncated]" 
             : body;
             
         params.push(`body=${encodeURIComponent(bodyToEncode)}`);
    } else {
         alert("Email body is too long for automatic generation. Opening email with subject only.");
    }
    
    const mailtoLink = `${baseLink}?${params.join('&')}`;
    window.location.href = mailtoLink;
  };


  if (!isClient) return null;

  if (!user && !isGuest) {
      return <AuthScreen onLogin={handleLogin} onGuest={() => setIsGuest(true)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 flex flex-col transition-colors duration-300 font-sans">
      {/* Header */}
      <header className="bg-slate-900/90 dark:bg-slate-900/80 backdrop-blur-md text-white p-4 shadow-xl sticky top-0 z-50 print-hide border-b border-white/10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 text-indigo-400">
                    <LuminaLogo className="w-full h-full" />
                </div>
                <div>
                    <h1 className="font-bold text-xl tracking-tight leading-none text-white">Lumina</h1>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider bg-indigo-500/20 px-1.5 py-0.5 rounded">
                            {user ? 'PRO' : 'TRIAL'}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                            {user ? user.name : 'Guest User'}
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2">
                 {/* Dark Mode Toggle */}
                 <button 
                    onClick={toggleTheme}
                    className="p-2.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                    title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                >
                    {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>
                
                 {/* New Invoice Button (Reset) */}
                 <button 
                    onClick={resetInvoice}
                    className="p-2.5 text-slate-400 hover:text-emerald-400 hover:bg-white/10 rounded-lg transition-all"
                    title="Create New Invoice"
                >
                    <PlusCircle size={20} />
                </button>

                {/* Logout */}
                <button 
                    onClick={handleLogout}
                    className="p-2.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                    title="Logout"
                >
                    <LogOut size={20} />
                </button>

                <div className="h-6 w-px bg-white/10 mx-2"></div>

                {/* Send Email Button */}
                <button 
                    onClick={handleSendEmail}
                    className="hidden sm:flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium text-sm transition-all border border-white/10"
                    title="Send via Email"
                >
                    <Mail size={18} /> <span className="hidden lg:inline">Email</span>
                </button>
                
                {/* Preview Button (Eye) */}
                 <button 
                    onClick={() => setShowPreviewModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-lg font-bold text-sm transition-all shadow-lg shadow-indigo-500/30"
                    title="Preview Invoice"
                >
                    <Eye size={18} /> 
                    <span>Preview & Download</span>
                </button>
            </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-8 print-show">
         
         {/* Editor */}
         <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             <InvoiceEditor data={data} onChange={setData} />
             
             {/* Cost Breakdown Chart */}
             <div className="mt-8 bg-white dark:bg-slate-800 rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 dark:border-slate-700 p-6 transition-colors">
                 <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 uppercase tracking-wider flex items-center gap-2">
                    <PieIcon size={16} className="text-slate-400"/> Breakdown
                 </h3>
                 <div className="h-48 w-full">
                    {/* Render Chart only on large screens to avoid zero-dimension warnings when hidden */}
                    {isLargeScreen && subtotal > 0 ? (
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={40}
                                    outerRadius={65}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                    cornerRadius={4}
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                  formatter={(value: number) => `$${value.toFixed(2)}`} 
                                  contentStyle={{ 
                                      backgroundColor: isDarkMode ? '#1e293b' : '#fff', 
                                      borderColor: isDarkMode ? '#334155' : '#e2e8f0', 
                                      color: isDarkMode ? '#fff' : '#0f172a',
                                      borderRadius: '8px',
                                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                  }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : !isLargeScreen && subtotal > 0 ? (
                         <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                             Chart available on desktop
                         </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs text-center">
                            <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-full mb-2"><PieIcon size={20}/></div>
                            Add items to view cost breakdown
                        </div>
                    )}
                 </div>
                 {subtotal > 0 && (
                     <div className="flex justify-center gap-6 text-xs font-medium text-slate-500 dark:text-slate-400 mt-4">
                         <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-violet-500"></div> Services</div>
                         <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-slate-400"></div> Tax</div>
                     </div>
                 )}
             </div>
         </div>

         {/* Off-screen Preview for Capture */}
         <div style={{ position: 'absolute', left: '-10000px', top: 0, width: '210mm', height: 'auto', overflow: 'hidden' }}>
             <InvoicePreview data={data} id="invoice-preview-capture" />
         </div>

      </main>

      {/* Footer / Feedback */}
      <footer className="max-w-4xl mx-auto w-full p-6 pt-0 text-center print-hide">
          <p className="text-sm text-slate-500 dark:text-slate-400">
              Feedback? Contact <a href="mailto:dhirajhagavane@gmail.com" className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium">dhirajhagavane@gmail.com</a>
          </p>
      </footer>

      {/* Preview Modal */}
      {showPreviewModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200" onClick={closePreview}>
              <div className="relative w-full max-w-[230mm] max-h-full overflow-y-auto flex flex-col items-center" onClick={e => e.stopPropagation()}>
                  <div className="absolute top-4 right-4 sm:right-0 sm:top-0 z-50 flex gap-2">
                        {/* Print Button (Modal) */}
                        <button 
                            onClick={handlePrint}
                            className="flex items-center gap-2 px-3 py-2 bg-slate-900 hover:bg-black text-white rounded-lg font-medium text-sm transition-all shadow-lg"
                        >
                            <Printer size={18} /> Print
                        </button>

                        {/* Download Button (Modal) */}
                        <button 
                            onClick={handleDownloadPdf}
                            disabled={isExporting}
                            className="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-sm transition-all shadow-lg disabled:opacity-70"
                        >
                            {isExporting ? <LoaderIcon /> : <Download size={18} />} 
                            <span>Download PDF</span>
                        </button>

                        <button 
                            onClick={closePreview} 
                            className="text-white/80 hover:text-white bg-slate-900/50 hover:bg-slate-900 p-2 rounded-full transition-all"
                        >
                            <X size={24}/>
                        </button>
                  </div>
                  
                  <div className="shadow-2xl shadow-black/50 rounded-sm overflow-hidden scale-[0.6] sm:scale-[0.85] md:scale-100 origin-top mt-16 sm:mt-12">
                      <InvoicePreview data={data} />
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

const LoaderIcon = () => (
    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

export default App;