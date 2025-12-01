import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithCustomToken, 
  signInAnonymously, 
  onAuthStateChanged,
  signOut,
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  onSnapshot, 
  serverTimestamp,
  doc,
  deleteDoc, 
  updateDoc,
  orderBy
} from 'firebase/firestore';
import { 
  Plus, 
  LayoutDashboard, 
  List as ListIcon, 
  LogOut, 
  Receipt, 
  User, 
  Coins, 
  Calendar, 
  Users, 
  Shield, 
  Trash2, 
  Menu, 
  X, 
  AlertTriangle, 
  Phone, 
  Printer, 
  Check, 
  CreditCard, 
  Banknote, 
  FileText, 
  MoreVertical, 
  Download, 
  Eye, 
  Search, 
  ChevronDown, 
  ArrowLeft, 
  Globe, 
  Languages, 
  LogIn,
  FileSpreadsheet, // For sheet export
  Loader,
} from 'lucide-react';
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// --- 1. CONFIGURATION & SETUP ---

const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// Mock user data structure
const mockUser = {
  uid: 'guest',
  email: 'guest@example.com',
  displayName: 'مستخدم ضيف',
  role: 'admin' // default role for guest
};

// Application translations (Arabic/English)
const translations = {
  ar: {
    dir: 'rtl',
    appTitle: 'إدارة التبرعات',
    navDashboard: 'اللوحة الرئيسية',
    navDonations: 'قائمة التبرعات',
    navSettings: 'الإعدادات',
    signOut: 'تسجيل الخروج',
    signIn: 'تسجيل الدخول',
    currency: 'ريال', // Assuming a currency, e.g., SAR, change as needed
    dashboardTitle: 'ملخص التبرعات',
    donationCount: 'إجمالي التبرعات',
    totalAmount: 'إجمالي المبلغ',
    latestDonations: 'أحدث التبرعات',
    noDonations: 'لا توجد تبرعات مسجلة بعد.',
    viewDetails: 'عرض التفاصيل',
    addDonation: 'إضافة تبرع جديد',
    donorName: 'اسم المتبرع',
    amount: 'المبلغ',
    paymentMethod: 'طريقة الأداء',
    notes: 'ملاحظات',
    date: 'التاريخ',
    user: 'المستخدم',
    CreditCard: 'بطاقة ائتمانية',
    Banknote: 'نقدي',
    OnlineTransfer: 'تحويل إلكتروني',
    Add: 'إضافة',
    Cancel: 'إلغاء',
    donationDetails: 'تفاصيل التبرع',
    deleteDonation: 'حذف التبرع',
    confirmDelete: 'هل أنت متأكد من حذف هذا التبرع؟',
    receiptDownload: 'تنزيل الإيصال (PDF)',
    editDonation: 'تعديل التبرع',
    saveChanges: 'حفظ التغييرات',
    exportSheet: 'تصدير كجدول بيانات',
    settingsTitle: 'إعدادات التطبيق',
    selectLanguage: 'اختر اللغة',
    languageEnglish: 'الإنجليزية',
    languageArabic: 'العربية',
    userId: 'معرّف المستخدم',
    receiptTitle: 'إيصال تبرع',
    managerSignature: 'المدير/المستخدم',
    donorSignature: 'المتبرع',
    societyName: 'بصمة خير للعمل الخيري',
  },
  en: {
    dir: 'ltr',
    appTitle: 'Donation Management',
    navDashboard: 'Dashboard',
    navDonations: 'Donations List',
    navSettings: 'Settings',
    signOut: 'Sign Out',
    signIn: 'Sign In',
    currency: 'SAR',
    dashboardTitle: 'Donation Summary',
    donationCount: 'Total Donations',
    totalAmount: 'Total Amount',
    latestDonations: 'Latest Donations',
    noDonations: 'No donations recorded yet.',
    viewDetails: 'View Details',
    addDonation: 'Add New Donation',
    donorName: 'Donor Name',
    amount: 'Amount',
    paymentMethod: 'Payment Method',
    notes: 'Notes',
    date: 'Date',
    user: 'User',
    CreditCard: 'Credit Card',
    Banknote: 'Cash',
    OnlineTransfer: 'Online Transfer',
    Add: 'Add',
    Cancel: 'Cancel',
    donationDetails: 'Donation Details',
    deleteDonation: 'Delete Donation',
    confirmDelete: 'Are you sure you want to delete this donation?',
    receiptDownload: 'Download Receipt (PDF)',
    editDonation: 'Edit Donation',
    saveChanges: 'Save Changes',
    exportSheet: 'Export as Spreadsheet',
    settingsTitle: 'Application Settings',
    selectLanguage: 'Select Language',
    languageEnglish: 'English',
    languageArabic: 'Arabic',
    userId: 'User ID',
    receiptTitle: 'Donation Receipt',
    managerSignature: 'Manager/User',
    donorSignature: 'Donor',
    societyName: 'Basmat Khair Charitable Society',
  }
};

// --- 2. FIREBASE INITIALIZATION & AUTH ---

let app, db, auth;

try {
  if (Object.keys(firebaseConfig).length) {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
  }
} catch (error) {
  console.error("Firebase initialization failed:", error);
}

// Helper to convert array of arrays to CSV string
const convertArrayToCSV = (data) => {
  return data.map(row => row.join('\t')).join('\n');
};

// --- 3. COMPONENTS ---

// Component for adding/editing a donation
const DonationForm = ({ t, initialData, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    donorName: initialData?.donorName || '',
    amount: initialData?.amount || '',
    paymentMethod: initialData?.paymentMethod || 'Banknote',
    notes: initialData?.notes || '',
    date: initialData?.date ? new Date(initialData.date).toISOString().substring(0, 10) : new Date().toISOString().substring(0, 10),
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const donationData = {
        ...formData,
        amount: parseFloat(formData.amount),
        date: formData.date, // Keep as date string for easy display
      };
      await onSave(donationData);
      // Close form on success
      onCancel();
    } catch (error) {
      console.error("Error saving donation:", error);
      alert(`Error saving donation: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const isEdit = !!initialData;

  const paymentMethods = useMemo(() => ([
    { value: 'Banknote', label: t.Banknote, icon: Banknote },
    { value: 'CreditCard', label: t.CreditCard, icon: CreditCard },
    { value: 'OnlineTransfer', label: t.OnlineTransfer, icon: FileText },
  ]), [t]);

  return (
    <div dir={t.dir} className="w-full max-w-2xl bg-white p-6 md:p-8 rounded-xl shadow-2xl">
      <h2 className="text-2xl font-bold mb-6 text-slate-800 border-b pb-2">
        {isEdit ? t.editDonation : t.addDonation}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{t.donorName}</label>
          <input
            type="text"
            name="donorName"
            value={formData.donorName}
            onChange={handleChange}
            required
            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 transition duration-150"
            placeholder={t.donorName}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{t.amount} ({t.currency})</label>
          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            required
            min="0.01"
            step="0.01"
            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 transition duration-150"
            placeholder="0.00"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{t.paymentMethod}</label>
          <div className="flex space-x-2 rtl:space-x-reverse">
            {paymentMethods.map(method => (
              <label key={method.value} className={`flex items-center p-3 border rounded-lg cursor-pointer transition duration-150 ${formData.paymentMethod === method.value ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-200' : 'bg-white border-slate-300 hover:bg-slate-50'}`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value={method.value}
                  checked={formData.paymentMethod === method.value}
                  onChange={handleChange}
                  className="hidden"
                />
                <method.icon size={20} className="text-emerald-600 rtl:ml-2 ltr:mr-2" />
                <span className="text-sm font-medium text-slate-800">{method.label}</span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{t.date}</label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 transition duration-150"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{t.notes}</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows="3"
            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 transition duration-150"
            placeholder={t.notes}
          ></textarea>
        </div>
        <div className="flex justify-end space-x-3 rtl:space-x-reverse pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-50 transition duration-150 font-medium"
            disabled={loading}
          >
            {t.Cancel}
          </button>
          <button
            type="submit"
            className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition duration-150 font-semibold shadow-md shadow-emerald-200 flex items-center justify-center"
            disabled={loading}
          >
            {loading ? <Loader size={20} className="animate-spin rtl:ml-2 ltr:mr-2" /> : isEdit ? t.saveChanges : t.Add}
          </button>
        </div>
      </form>
    </div>
  );
};

// Minimalistic Arabic Receipt Content for PDF
const ReceiptContent = React.forwardRef(({ data, t }, ref) => {
  const date = data.date ? new Date(data.date) : new Date();
  
  // Format date in Arabic
  const formattedDate = date.toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div 
      ref={ref} 
      dir="rtl" 
      className="w-[210mm] min-h-[297mm] p-8 mx-auto bg-white text-right text-gray-800 font-[Amiri, 'Noto Sans Arabic', 'Droid Arabic Kufi', sans-serif] border-4 border-emerald-600 rounded-lg"
      style={{ fontSize: '12pt' }} // Explicit font size for PDF capture
    >
      <header className="text-center mb-10 border-b-2 pb-4 border-slate-200">
        <h1 className="text-3xl font-bold mb-2 text-emerald-800">{t.receiptTitle}</h1>
        <p className="text-xl text-slate-600">{t.societyName}</p>
        <p className="text-sm text-slate-500 mt-1">وثيقة غير قابلة للتحويل</p>
      </header>

      <section className="space-y-8 mt-12">
        {/* The required three elements with dotted lines for separation */}
        <div className="flex flex-col">
          <p className="text-xl font-medium text-slate-700 mb-2">الاسم الكامل :</p>
          <p className="border-b border-dotted border-gray-400 pb-2 text-xl font-semibold text-slate-900">
            {data.donorName || '......................................................................................................................................................................................'}
          </p>
        </div>

        <div className="flex flex-col">
          <p className="text-xl font-medium text-slate-700 mb-2">المبلغ المؤدى :</p>
          <p className="border-b border-dotted border-gray-400 pb-2 text-xl font-semibold text-emerald-600">
            {data.amount} {t.currency} {data.amount ? '' : '......................................................................................................................................................................................'}
          </p>
        </div>
        
        <div className="flex flex-col">
          <p className="text-xl font-medium text-slate-700 mb-2">تاريخ الأداء :</p>
          <p className="border-b border-dotted border-gray-400 pb-2 text-xl font-semibold text-slate-900">
            {formattedDate || '......................................................................................................................................................................................'}
          </p>
        </div>
      </section>

      {/* Signatures */}
      <footer className="mt-24 flex justify-between text-center text-lg font-medium">
        <div className="w-1/3">
          <p className="mb-2">{t.managerSignature}</p>
          <p className="border-t border-slate-600 pt-1 text-base text-slate-500">
            {data.user ? data.user.displayName : '........................'}
          </p>
        </div>
        <div className="w-1/3">
          <p className="mb-2">{t.donorSignature}</p>
          <p className="border-t border-slate-600 pt-1 text-base text-slate-500">
            {data.donorName || '........................'}
          </p>
        </div>
      </footer>
      
      <div className="mt-16 text-center text-sm text-gray-500 border-t pt-4">
        <p>
          يرجى الاحتفاظ بهذا الإيصال كدليل على الدفع. رقم العملية: {data.id}
        </p>
      </div>
    </div>
  );
});

// Donation action buttons (View, Edit, Delete, PDF)
const DonationActions = ({ donation, t, onAction, onDelete, onEdit, onReceiptDownload }) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Function to handle PDF generation (Arabic Fix)
  const handleDownloadReceiptPDF = async () => {
    onReceiptDownload(donation);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button 
        className="p-2 rounded-full text-slate-500 hover:bg-slate-100 transition"
        onClick={() => setShowMenu(!showMenu)}
        aria-label="More actions"
      >
        <MoreVertical size={20} />
      </button>

      {showMenu && (
        <div 
          dir={t.dir}
          className={`absolute ${t.dir === 'rtl' ? 'left-0' : 'right-0'} mt-2 w-48 bg-white rounded-xl shadow-2xl z-20 border border-slate-100 py-1`}
        >
          <MenuItem icon={Eye} label={t.viewDetails} onClick={() => { onAction(donation); setShowMenu(false); }} />
          <MenuItem icon={Printer} label={t.receiptDownload} onClick={() => { handleDownloadReceiptPDF(); setShowMenu(false); }} />
          <MenuItem icon={Pencil} label={t.editDonation} onClick={() => { onEdit(donation); setShowMenu(false); }} />
          <MenuItem icon={Trash2} label={t.deleteDonation} onClick={() => { onDelete(donation); setShowMenu(false); }} highlight />
        </div>
      )}
    </div>
  );
};

// Donation List Component
const DonationsList = ({ t, donations, onAction, onDelete, onEdit, onReceiptDownload }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedDonations = useMemo(() => {
    let sortableItems = [...donations];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        const key = sortConfig.key;
        let aValue = a[key];
        let bValue = b[key];

        if (key === 'amount') {
          aValue = parseFloat(aValue);
          bValue = parseFloat(bValue);
        } else if (key === 'date') {
          aValue = new Date(aValue).getTime();
          bValue = new Date(bValue).getTime();
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [donations, sortConfig]);

  const filteredDonations = useMemo(() => {
    return sortedDonations.filter(d => 
      d.donorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.paymentMethod.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.amount.toString().includes(searchTerm)
    );
  }, [sortedDonations, searchTerm]);

  // --- SHEET EXPORT LOGIC (New/Modified) ---
  const handleExportToSheet = () => {
    if (!filteredDonations.length) {
      alert("No data to export.");
      return;
    }

    // 1. Prepare data rows with required Arabic headers
    const dataForSheet = filteredDonations.map((d, index) => [
      index + 1, // رقم العملية
      new Date(d.date).toLocaleDateString('ar-EG'), // التاريخ
      d.donorName, // الاسم الكامل
      `${d.amount} ${t.currency}`, // المبلغ
      t[d.paymentMethod], // طريقة الأداء
      d.notes || '', // الملاحظات
    ]);

    // 2. Prepare the decorative header (Title/Logo placeholder)
    const titleRow = [
      '', // Empty column for spacing
      '', // Empty column for spacing
      '', // Empty column for spacing
      `جميع تبرعات جمعية ${t.societyName.split(' ').slice(-2).join(' ')}`, // Focus on the unique name
      '',
      '',
    ];

    const logoRow = [
      'Logo Placeholder', // Simple string placeholder for logo/icon
      ...new Array(5).fill(''),
    ]

    // 3. Define the actual column headers
    const headerRow = [
      'رقم العملية',
      'التاريخ',
      'الاسم الكامل',
      'المبلغ',
      'طريقة الأداء',
      'الملاحظات',
    ];

    // Combine all rows
    const allRows = [
      logoRow,
      [''], // Space
      titleRow,
      [''], // Space
      headerRow, 
      ...dataForSheet
    ];

    // Convert array of arrays to CSV/TSV format (using Tab delimiter for better Arabic compatibility)
    const tsvContent = convertArrayToCSV(allRows);
    
    // Create Blob and download
    const blob = new Blob(["\ufeff", tsvContent], { type: 'text/tab-separated-values;charset=utf-8;' }); // \ufeff is BOM for UTF-8 Excel support
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Donations_Sheet_بصمة_خير.tsv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  // --- END SHEET EXPORT LOGIC ---

  return (
    <div dir={t.dir} className="bg-white p-6 md:p-8 rounded-xl shadow-2xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b pb-4">
        <h2 className="text-2xl font-bold text-slate-800 mb-4 md:mb-0">{t.navDonations}</h2>
        <div className="flex space-x-2 rtl:space-x-reverse">
          <button
            onClick={handleExportToSheet}
            className="flex items-center px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition font-medium text-sm"
          >
            <FileSpreadsheet size={18} className="rtl:ml-2 ltr:mr-2 text-emerald-600" />
            {t.exportSheet}
          </button>
        </div>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row justify-between items-center">
        <div className="relative w-full sm:w-80 mb-4 sm:mb-0">
          <Search size={18} className="absolute top-1/2 -translate-y-1/2 rtl:right-3 ltr:left-3 text-slate-400" />
          <input
            type="text"
            placeholder="بحث بالاسم أو المبلغ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-3 pl-10 pr-4 border border-slate-300 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 transition duration-150"
            style={{ paddingLeft: t.dir === 'rtl' ? '1rem' : '2.5rem', paddingRight: t.dir === 'rtl' ? '2.5rem' : '1rem' }}
          />
        </div>
        <p className="text-sm text-slate-500">
          {filteredDonations.length} {t.donationCount}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead>
            <tr>
              <TableHeader t={t} label={t.date} sortKey="date" sortConfig={sortConfig} onSort={handleSort} />
              <TableHeader t={t} label={t.donorName} sortKey="donorName" sortConfig={sortConfig} onSort={handleSort} />
              <TableHeader t={t} label={t.amount} sortKey="amount" sortConfig={sortConfig} onSort={handleSort} />
              <TableHeader t={t} label={t.paymentMethod} sortKey="paymentMethod" sortConfig={sortConfig} onSort={handleSort} />
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-16"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100">
            {filteredDonations.length > 0 ? (
              filteredDonations.map((donation) => (
                <tr key={donation.id} className="hover:bg-slate-50 transition duration-150">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                    {new Date(donation.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                    {donation.donorName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-emerald-600 font-semibold">
                    {donation.amount} {t.currency}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {t[donation.paymentMethod]}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <DonationActions 
                      donation={donation} 
                      t={t} 
                      onAction={onAction} 
                      onDelete={onDelete} 
                      onEdit={onEdit}
                      onReceiptDownload={onReceiptDownload}
                    />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center text-slate-500 text-lg">
                  {t.noDonations}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const TableHeader = ({ t, label, sortKey, sortConfig, onSort }) => {
  const isSorted = sortConfig.key === sortKey;
  const isAsc = sortConfig.direction === 'asc';
  
  return (
    <th 
      scope="col" 
      className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-50 transition"
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center">
        {label}
        {isSorted && (
          <ChevronDown 
            size={16} 
            className={`rtl:mr-1 ltr:ml-1 transition-transform ${isAsc ? 'rotate-180' : 'rotate-0'}`} 
          />
        )}
      </div>
    </th>
  );
};

// --- Modal Component (Generic) ---
const Modal = ({ children, onClose, title, t }) => (
  <div className="fixed inset-0 bg-slate-900 bg-opacity-75 flex items-center justify-center p-4 z-50">
    <div dir={t.dir} className="relative max-h-[90vh] overflow-y-auto">
      {children}
      <button 
        onClick={onClose}
        className={`absolute top-4 ${t.dir === 'rtl' ? 'left-4' : 'right-4'} p-2 bg-white rounded-full shadow-lg text-slate-600 hover:bg-slate-50 transition`}
        aria-label={t.Cancel}
      >
        <X size={24} />
      </button>
    </div>
  </div>
);

// --- Confirmation Dialog ---
const ConfirmationDialog = ({ t, onConfirm, onCancel, message }) => (
  <div dir={t.dir} className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-sm text-center">
    <AlertTriangle size={36} className="text-red-500 mx-auto mb-4" />
    <p className="text-lg font-medium text-slate-800 mb-6">{message}</p>
    <div className="flex justify-center space-x-3 rtl:space-x-reverse">
      <button
        onClick={onCancel}
        className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 transition font-medium"
      >
        {t.Cancel}
      </button>
      <button
        onClick={onConfirm}
        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold"
      >
        {t.deleteDonation}
      </button>
    </div>
  </div>
);

// --- Dashboard Component ---
const Dashboard = ({ t, donations }) => {
  const totalAmount = donations.reduce((sum, d) => sum + parseFloat(d.amount), 0).toFixed(2);
  const totalCount = donations.length;
  const latest = [...donations].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

  return (
    <div dir={t.dir} className="space-y-8">
      <h2 className="text-3xl font-bold text-slate-800 border-b pb-2">{t.dashboardTitle}</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard 
          t={t}
          icon={Coins} 
          label={t.totalAmount} 
          value={`${totalAmount} ${t.currency}`} 
          color="bg-emerald-100 text-emerald-800"
        />
        <StatCard 
          t={t}
          icon={ListIcon} 
          label={t.donationCount} 
          value={totalCount} 
          color="bg-indigo-100 text-indigo-800"
        />
      </div>

      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h3 className="text-xl font-semibold mb-4 text-slate-800 border-b pb-2">{t.latestDonations}</h3>
        {latest.length > 0 ? (
          <ul className="divide-y divide-slate-100">
            {latest.map((d) => (
              <li key={d.id} className="flex justify-between items-center py-3">
                <div className="text-slate-700">
                  <p className="font-medium">{d.donorName}</p>
                  <p className="text-sm text-slate-500">
                    {t[d.paymentMethod]} - {new Date(d.date).toLocaleDateString()}
                  </p>
                </div>
                <p className="text-lg font-bold text-emerald-600">
                  {d.amount} {t.currency}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-slate-500">{t.noDonations}</p>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ t, icon: Icon, label, value, color }) => (
  <div className={`p-6 rounded-xl shadow-lg flex items-center justify-between ${color}`}>
    <div>
      <p className="text-sm font-medium mb-1">{label}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
    <Icon size={40} className="opacity-50" />
  </div>
);

// --- Settings Component ---
const Settings = ({ t, lang, setLang, userId }) => {
  
  const handleLangChange = (e) => {
    setLang(e.target.value);
  };

  return (
    <div dir={t.dir} className="bg-white p-6 md:p-8 rounded-xl shadow-2xl w-full max-w-4xl">
      <h2 className="text-3xl font-bold text-slate-800 border-b pb-2 mb-6">{t.settingsTitle}</h2>
      
      <div className="space-y-6">
        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
          <label htmlFor="language" className="block text-lg font-medium text-slate-700 mb-2 flex items-center">
            <Languages size={20} className="rtl:ml-2 ltr:mr-2 text-indigo-500" />
            {t.selectLanguage}
          </label>
          <select
            id="language"
            value={lang}
            onChange={handleLangChange}
            className="w-full sm:w-1/2 p-3 border border-slate-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 transition duration-150 bg-white"
          >
            <option value="en">{t.languageEnglish}</option>
            <option value="ar">{t.languageArabic}</option>
          </select>
        </div>

        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
          <label className="block text-lg font-medium text-slate-700 mb-2 flex items-center">
            <User size={20} className="rtl:ml-2 ltr:mr-2 text-blue-500" />
            {t.userId}
          </label>
          <p className="font-mono text-sm break-all bg-slate-100 p-3 rounded-lg text-slate-800 select-all">
            {userId || 'N/A (Signing in...)'}
          </p>
          <p className="mt-2 text-sm text-slate-500">
            {t.dir === 'rtl' 
              ? 'هذا هو معرّف المستخدم الخاص بك لتخزين البيانات. يجب مشاركته للتعاون.'
              : 'This is your unique user ID for data storage. It should be shared for collaboration.'
            }
          </p>
        </div>
      </div>
    </div>
  );
}

// --- MAIN APP COMPONENT ---
export default function App() {
  const [lang, setLang] = useState('ar'); // Default to Arabic as per user request
  const t = translations[lang];

  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [donations, setDonations] = useState([]);
  const [view, setView] = useState('dashboard'); // 'dashboard', 'donations', 'settings', 'add'
  const [modalContent, setModalContent] = useState(null);
  const [isProcessingPDF, setIsProcessingPDF] = useState(false);

  const userId = currentUser?.uid;
  const receiptRef = useRef(null);

  // --- Core Firebase Initialization & Auth ---
  useEffect(() => {
    if (!auth) return;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        setIsAuthenticated(true);
      } else {
        // Fallback for environments where initialAuthToken might be unavailable
        if (initialAuthToken) {
           await signInWithCustomToken(auth, initialAuthToken).catch(e => {
            console.error("Custom token sign in failed, signing anonymously:", e);
            signInAnonymously(auth);
          });
        } else {
          signInAnonymously(auth);
        }
      }
      setIsAuthReady(true);
    });

    // Initial sign-in attempt if not started by onAuthStateChanged listener
    if (!currentUser && !isAuthReady) {
        if (initialAuthToken) {
           signInWithCustomToken(auth, initialAuthToken).catch(e => {
            console.error("Custom token sign in failed, signing anonymously:", e);
            signInAnonymously(auth);
          });
        } else {
          signInAnonymously(auth);
        }
    }

    return () => unsubscribe();
  }, [initialAuthToken]);

  // --- Firestore Data Listener ---
  useEffect(() => {
    if (!db || !isAuthReady || !userId) {
      if(isAuthReady && !userId) {
        console.warn("Auth ready but no userId. This might indicate an issue with anonymous sign-in or environment setup.");
      }
      return;
    }

    // Public data collection path: /artifacts/{appId}/public/data/donations
    const donationsCollectionRef = collection(db, 'artifacts', appId, 'public', 'data', 'donations');
    
    // Sort by creation time (serverTimestamp)
    const q = query(donationsCollectionRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const donationList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Convert Firebase Timestamp to JS Date string if it exists
        date: doc.data().date instanceof Object && doc.data().date.toDate ? doc.data().date.toDate().toISOString().substring(0, 10) : doc.data().date,
      }));
      setDonations(donationList);
    }, (error) => {
      console.error("Error fetching donations:", error);
    });

    return () => unsubscribe();
  }, [db, isAuthReady, userId]);

  // --- CRUD Operations ---

  const handleAddDonation = async (donationData) => {
    if (!db || !userId) return;

    const donationsCollectionRef = collection(db, 'artifacts', appId, 'public', 'data', 'donations');
    
    const donationToSave = {
      ...donationData,
      createdAt: serverTimestamp(),
      createdBy: userId,
      user: {
        uid: currentUser.uid,
        displayName: currentUser.displayName || currentUser.email || 'Anonymous User',
      }
    };

    await addDoc(donationsCollectionRef, donationToSave);
  };

  const handleUpdateDonation = async (id, updatedData) => {
    if (!db || !userId) return;

    const donationDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'donations', id);
    
    const dataToUpdate = {
      ...updatedData,
      updatedAt: serverTimestamp(),
    };

    await updateDoc(donationDocRef, dataToUpdate);
  };

  const handleDeleteDonation = async (id) => {
    if (!db || !userId) return;

    const donationDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'donations', id);
    await deleteDoc(donationDocRef);
    setModalContent(null); // Close modal after successful delete
  };

  // --- Modal and Action Handlers ---

  const handleShowAddForm = () => {
    setModalContent(
      <DonationForm 
        t={t} 
        onSave={handleAddDonation} 
        onCancel={() => setModalContent(null)} 
        initialData={null}
      />
    );
  };

  const handleShowEditForm = (donation) => {
    setModalContent(
      <DonationForm 
        t={t} 
        onSave={(data) => handleUpdateDonation(donation.id, data)} 
        onCancel={() => setModalContent(null)} 
        initialData={donation}
      />
    );
  };

  const handleShowDeleteConfirm = (donation) => {
    setModalContent(
      <ConfirmationDialog
        t={t}
        message={t.confirmDelete}
        onConfirm={() => handleDeleteDonation(donation.id)}
        onCancel={() => setModalContent(null)}
      />
    );
  };

  // --- PDF Generation Handler (Modified for Arabic Fix) ---
  const handleDownloadReceiptPDF = useCallback(async (donation) => {
    if (isProcessingPDF) return;
    setIsProcessingPDF(true);

    try {
      // 1. Render the ReceiptContent component in a hidden div
      const element = receiptRef.current;
      if (!element) throw new Error("Receipt content element not found.");

      // 2. Use html2canvas to capture the HTML structure (best for RTL layout)
      const canvas = await html2canvas(element, { 
        scale: 2, // High resolution capture
        useCORS: true 
      });

      const imgData = canvas.toDataURL('image/jpeg');
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = canvas.height * imgWidth / canvas.width;
      let heightLeft = imgHeight;

      // 3. Initialize jsPDF
      const doc = new jsPDF('p', 'mm', 'a4', true);
      
      // ******* ARABIC FONT/RTL FIX ATTEMPT *******
      // Although we are capturing an image (which bypasses jspdf font issues), 
      // adding a minimal font config can sometimes stabilize the output in jspdf environments.
      // We will skip actual Base64 embedding due to file size constraints, but keep the RTL flag.
      doc.setRTL(true); 

      let position = 0;

      // 4. Add the image to the PDF
      doc.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        doc.addPage();
        doc.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      doc.save(`Receipt-${donation.id}.pdf`);

    } catch (error) {
      console.error("PDF generation failed:", error);
      // Use a custom message box instead of alert
      setModalContent(
        <div dir={t.dir} className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-sm text-center">
            <AlertTriangle size={36} className="text-red-500 mx-auto mb-4" />
            <p className="text-lg font-medium text-slate-800 mb-6">
              {t.dir === 'rtl' ? 'فشل توليد الإيصال. يرجى التأكد من أن جميع الحقول مملوءة.' : 'Receipt generation failed. Please ensure all fields are filled.'}
            </p>
            <button onClick={() => setModalContent(null)} className="px-4 py-2 bg-slate-600 text-white rounded-lg">
              {t.Cancel}
            </button>
        </div>
      );
    } finally {
      setIsProcessingPDF(false);
    }
  }, [t, isProcessingPDF]);

  // --- Main Render ---

  const renderContent = () => {
    if (!isAuthReady) {
      return <LoadingScreen t={t} />;
    }

    switch (view) {
      case 'dashboard':
        return <Dashboard t={t} donations={donations} />;
      case 'donations':
        return (
          <DonationsList 
            t={t} 
            donations={donations} 
            onAction={() => {}} // Placeholder for future detail view
            onDelete={handleShowDeleteConfirm}
            onEdit={handleShowEditForm}
            onReceiptDownload={handleDownloadReceiptPDF}
          />
        );
      case 'settings':
        return <Settings t={t} lang={lang} setLang={setLang} userId={userId} />;
      default:
        return <Dashboard t={t} donations={donations} />;
    }
  };

  return (
    <div dir={t.dir} className="min-h-screen bg-slate-50 flex font-sans">
      
      {/* Hidden Receipt Component for PDF generation */}
      <div style={{ position: 'absolute', left: '-9999px', top: '0', zIndex: -10 }}>
        {modalContent && modalContent.type === ReceiptContent ? (
          // This ensures the correct data is used when the PDF is generated
          <ReceiptContent ref={receiptRef} data={modalContent.props.data} t={t} />
        ) : (
          // Render a blank/default receipt for structure consistency when no action is active
          <ReceiptContent ref={receiptRef} data={{}} t={t} />
        )}
      </div>

      <Sidebar 
        t={t} 
        view={view} 
        setView={setView} 
        currentUser={currentUser} 
        onSignOut={() => signOut(auth)}
      />
      
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <Header 
          t={t} 
          onAddDonation={handleShowAddForm} 
          currentUser={currentUser}
        />
        <div className="mt-8">
          {renderContent()}
        </div>
      </main>

      {modalContent && (
        <Modal onClose={() => setModalContent(null)} t={t}>
          {modalContent}
        </Modal>
      )}
      
      {/* Global loading indicator for PDF processing */}
      {isProcessingPDF && (
        <div className="fixed inset-0 bg-slate-900 bg-opacity-75 flex items-center justify-center z-[60]">
          <div className="flex flex-col items-center bg-white p-8 rounded-xl shadow-2xl">
            <Loader size={48} className="animate-spin text-emerald-500 mb-4" />
            <p className="text-lg font-semibold text-slate-800">
              {t.dir === 'rtl' ? 'جاري تجهيز الإيصال...' : 'Preparing Receipt...'}
            </p>
          </div>
        </div>
      )}

    </div>
  );
}

// --- Loading Screen Component ---
const LoadingScreen = ({ t }) => (
  <div className="fixed inset-0 bg-white flex items-center justify-center flex-col z-50">
    <Loader size={64} className="animate-spin text-emerald-500 mb-4" />
    <p className="text-xl font-semibold text-slate-800">
      {t.dir === 'rtl' ? 'جارٍ تحميل النظام...' : 'Loading System...'}
    </p>
    <p className="text-sm text-slate-500 mt-2">
      {t.dir === 'rtl' ? 'الرجاء الانتظار...' : 'Please wait...'}
    </p>
  </div>
);

// --- Navigation Components ---

const Sidebar = ({ t, view, setView, currentUser, onSignOut }) => {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { key: 'dashboard', label: t.navDashboard, icon: LayoutDashboard },
    { key: 'donations', label: t.navDonations, icon: ListIcon },
    { key: 'settings', label: t.navSettings, icon: Shield },
  ];

  const signOutHandler = () => {
    setIsOpen(false);
    onSignOut();
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button 
        className="fixed top-4 rtl:right-4 ltr:left-4 z-50 p-2 bg-white rounded-xl shadow-lg md:hidden text-slate-700"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle navigation menu"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Backdrop */}
      {isOpen && <div className="fixed inset-0 bg-slate-900 bg-opacity-50 z-40 md:hidden" onClick={() => setIsOpen(false)}></div>}

      {/* Sidebar (Desktop and Mobile) */}
      <nav 
        dir={t.dir}
        className={`fixed inset-y-0 ${t.dir === 'rtl' ? 'right-0' : 'left-0'} w-64 bg-white p-4 shadow-xl z-50 transform md:relative md:translate-x-0 transition-transform duration-300 ${isOpen ? 'translate-x-0' : (t.dir === 'rtl' ? 'translate-x-full' : '-translate-x-full')}`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-center p-2 mb-8 border-b pb-4">
            <Receipt size={30} className="text-emerald-500 rtl:ml-3 ltr:mr-3" />
            <span className="text-xl font-extrabold text-slate-800">{t.appTitle}</span>
          </div>
          
          <div className="flex-grow space-y-2">
            {navItems.map(item => (
              <NavItem
                key={item.key}
                t={t}
                active={view === item.key}
                onClick={() => { setView(item.key); setIsOpen(false); }}
                icon={item.icon}
                label={item.label}
              />
            ))}
          </div>

          <div className="mt-8 pt-4 border-t border-slate-100 space-y-2">
            <div className="p-3 bg-slate-50 rounded-xl flex items-center text-sm">
              <User size={20} className="text-slate-500 rtl:ml-3 ltr:mr-3" />
              <div className="truncate">
                <p className="font-semibold text-slate-800">{currentUser?.displayName || currentUser?.email || 'Guest User'}</p>
              </div>
            </div>
            <NavItem 
              t={t}
              active={false}
              onClick={signOutHandler}
              icon={LogOut}
              label={t.signOut}
              highlight
            />
          </div>
        </div>
      </nav>
    </>
  );
};

const NavItem = ({ active, onClick, icon: Icon, label, highlight, t }) => (
  <button
    onClick={onClick}
    className={`flex items-center w-full p-4 rounded-xl transition-all duration-300 group relative overflow-hidden text-sm 
    ${active 
        ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' 
        : highlight 
          ? 'bg-red-50 text-red-800 hover:bg-red-100 hover:shadow-md'
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
    } ${active ? 'font-bold' : 'font-medium'}`}
  >
    <Icon size={20} className={`${active ? 'text-emerald-400' : highlight ? 'text-red-600' : 'text-slate-400 group-hover:text-slate-600'} ${t.dir === 'rtl' ? 'ml-3' : 'mr-3'} transition-colors`} />
    <span>{label}</span>
    {active && <div className={`absolute ${t.dir === 'rtl' ? 'right-0 rounded-l-full' : 'left-0 rounded-r-full'} top-1/2 -translate-y-1/2 h-8 w-1 bg-emerald-500`}></div>}
  </button>
);

const Header = ({ t, onAddDonation }) => (
  <header dir={t.dir} className="flex justify-end mb-4">
    <button
      onClick={onAddDonation}
      className="flex items-center px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition duration-150 font-semibold shadow-md shadow-emerald-300 text-sm"
    >
      <Plus size={20} className="rtl:ml-2 ltr:mr-2" />
      {t.addDonation}
    </button>
  </header>
);
