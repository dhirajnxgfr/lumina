export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
}

export type TaxType = 'standard' | 'cgst_sgst' | 'igst';

export interface InvoiceData {
  invoiceNumber: string;
  date: string;
  dueDate: string;
  senderName: string;
  senderEmail: string;
  senderAddress: string;
  recipientName: string;
  recipientEmail: string;
  recipientAddress: string;
  items: LineItem[];
  notes: string;
  terms: string;
  currency: string;
  taxRate: number;
  taxType: TaxType;
  logo?: string;
  ccEmail?: string;
  bccEmail?: string;
}

export const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CNY', symbol: 'CN¥', name: 'Chinese Yuan' },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
  { code: 'MXN', symbol: 'MX$', name: 'Mexican Peso' },
  { code: 'RUB', symbol: '₽', name: 'Russian Ruble' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won' },
  { code: 'TRY', symbol: '₺', name: 'Turkish Lira' },
  { code: 'SAR', symbol: 'SR', name: 'Saudi Riyal' },
  { code: 'THB', symbol: '฿', name: 'Thai Baht' },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah' },
  { code: 'VND', symbol: '₫', name: 'Vietnamese Dong' },
  { code: 'PHP', symbol: '₱', name: 'Philippine Peso' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit' },
];

export const DEFAULT_INVOICE: InvoiceData = {
  invoiceNumber: 'INV-001',
  date: new Date().toISOString().split('T')[0],
  dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  senderName: 'Your Business Name',
  senderEmail: 'you@example.com',
  senderAddress: '123 Business Rd, Tech City',
  recipientName: 'Client Name',
  recipientEmail: 'client@example.com',
  recipientAddress: '456 Client Ln, Market Town',
  items: [
    { id: '1', description: 'Professional Consultation', quantity: 2, price: 150 },
    { id: '2', description: 'Web Development Services', quantity: 10, price: 85 },
  ],
  notes: 'Thank you for your business!',
  terms: 'Payment is due within 14 days.',
  currency: 'USD',
  taxRate: 10,
  taxType: 'standard',
  logo: '',
  ccEmail: '',
  bccEmail: '',
};