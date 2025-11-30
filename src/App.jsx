import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  initializeApp, 
} from 'firebase/app';
import { 
  getAuth, 
  signInWithCustomToken, 
  signInAnonymously, 
  onAuthStateChanged,
  signOut,
  setPersistence,
  browserSessionPersistence
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
  ArrowLeft
} from 'lucide-react';

// --- 1. CONFIGURATION & SETUP ---

const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-basmat-khair-app';

// --- 2. CONSTANTS & TRANSLATIONS ---

const BRAND = {
  main: '#047857',   // Emerald 700
  dark: '#064e3b',   // Emerald 900
  light: '#d1fae5',  // Emerald 100
  accent: '#d97706', // Amber 600
  bg: '#f8fafc',
  text: '#1e293b'
};

const TRANSLATIONS = {
  ar: {
    appTitle: "جمعية بسمة خير",
    subTitle: "للأعمال الاجتماعية والخيرية",
    dashboard: "الرئيسية",
    add: "تبرع جديد",
    history: "الأرشيف",
    members: "الأعضاء",
    signOut: "خروج",
    welcome: "مرحباً بك",
    guest: "فاعل خير",
    roleAdmin: "مسؤول النظام",
    roleMember: "عضو نشيط",
    // Dashboard
    totalCollected: "المجموع المحصل",
    totalOps: "عدد العمليات",
    uniqueDonors: "المتبرعون",
    collectedByMember: "أداء الأعضاء",
    recentActivity: "أحدث التبرعات",
    noData: "لا توجد بيانات متاحة للعرض",
    // Add Form
    recordTitle: "تسجيل تبرع جديد",
    donorName: "اسم المتبرع",
    amount: "المبلغ",
    phone: "الهاتف",
    method: "طريقة الأداء",
    bankDetails: "بيانات البنك / الشيك",
    description: "ملاحظات إضافية",
    memberResponsable: "المكلف بالعملية",
    dateFixed: "تاريخ العملية",
    btnRecord: "حفظ ومتابعة",
    btnSaving: "جاري المعالجة...",
    confirmTitle: "مراجعة وتأكيد",
    confirmMsg: "يرجى التحقق من صحة البيانات قبل الحفظ النهائي",
    btnConfirm: "تأكيد العملية",
    btnCancel: "تعديل",
    searchPlaceholder: "بحث باسم المتبرع أو المبلغ...",
    methods: {
      cash: "نقداً",
      transfer: "تحويل بنكي",
      check: "شيك",
      other: "أخرى"
    },
    errorAmount: "المرجو إدخال مبلغ صحيح",
    successMsg: "تمت العملية بنجاح",
    // Actions
    actions: "إجراءات",
    viewReceipt: "معاينة الوصل",
    downloadPdf: "تحميل PDF",
    printReceipt: "طباعة الوصل",
    delete: "حذف",
    // Receipt
    opNumber: "رقم العملية",
    receivedBy: "المستلم",
    receiptTitle: "وصل أداء",
    receiptAssocName: "جمعية بسمة خير للأعمال الاجتماعية",
    receiptFooter: "شكراً لانخراطكم ودعمكم لأنشطة الجمعية",
    receiptSignature: "توقيع المستلم",
    receiptName: "الاسم الكامل",
    receiptAmount: "المبلغ",
    receiptDate: "التاريخ",
    receiptMethod: "طريقة الأداء",
    deleteConfirm: "هل أنت متأكد من حذف هذا السجل نهائياً؟",
    // Login
    loginTitle: "بوابة الأعضاء",
    loginSub: "يرجى الانتظار، جاري تحميل النظام...",
    btnLogging: "جاري الاتصال...",
  }
};

// --- 3. UTILITIES ---

const formatMoney = (amount) => 
  new Intl.NumberFormat('ar-MA', { 
    style: 'currency', 
    currency: 'MAD',
    minimumFractionDigits: 2
  }).format(amount);

const formatDate = (date) => {
  if (!date) return '';
  const dateObj = date.toDate ? date.toDate() : new Date(date);
  return dateObj.toLocaleDateString('ar-MA', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
};

// --- 4. COMPONENTS ---

/**
 * Enhanced Receipt Modal
 */
const ReceiptModal = ({ donation, onClose, logoPath, autoPrint = false }) => {
  const t = TRANSLATIONS.ar;
  const printRef = useRef(null);

  useEffect(() => {
    if (autoPrint) {
      setTimeout(() => {
        window.print();
      }, 500); // Small delay to ensure rendering
    }
  }, [autoPrint]);

  const handlePrint = () => {
    window.print();
  };

  if (!donation) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4 print:p-0 print:bg-white print:static print:z-auto print:block">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden print:shadow-none print:w-full print:max-w-none print:rounded-none">
        
        {/* Toolbar (Hidden when printing) */}
        <div className="bg-slate-50 p-4 flex justify-between items-center border-b print:hidden">
          <div className="flex items-center gap-2 text-slate-700 font-bold">
            <Receipt size={20} className="text-emerald-600" />
            <span>{t.viewReceipt}</span>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handlePrint}
              className="px-4 py-2 bg-slate-800 text-white hover:bg-slate-900 rounded-lg shadow-sm transition font-bold flex items-center gap-2 text-sm"
            >
              <Printer size={16} />
              {t.printReceipt} / {t.downloadPdf}
            </button>
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Receipt Content */}
        <div id="receipt-print-area" className="p-10 print:p-0 bg-white text-right relative" dir="rtl">
          
          {/* Watermark */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none print:opacity-[0.05]">
             <img src={logoPath} className="w-96 h-96 object-contain grayscale" />
          </div>

          <div className="relative z-10 border-2 border-slate-800 p-8 print:border-2 print:border-black h-full">
            
            {/* Header */}
            <div className="flex justify-between items-start mb-8 border-b-2 border-slate-100 pb-6">
              <div className="w-1/3">
                <img 
                  src={logoPath} 
                  alt="Logo" 
                  className="w-24 h-auto object-contain"
                  onError={(e) => {e.target.onerror = null; e.target.src = "assets/logo-receipt.png";}}
                />
              </div>
              <div className="w-2/3 text-left pt-1">
                <h1 className="text-xl font-bold text-slate-900 mb-1">{t.receiptAssocName}</h1>
                <p className="text-slate-500 text-xs font-medium">الأعمال الاجتماعية والخيرية</p>
                <div className="mt-2 text-[10px] text-slate-400">
                  <p>الرقم الوطني: 123-456</p>
                  <p>الهاتف: 0537000000</p>
                </div>
              </div>
            </div>

            {/* Title & Meta */}
            <div className="flex justify-between items-end mb-10">
              <div>
                 <span className="block text-xs text-slate-400 mb-1">{t.dateFixed}</span>
                 <span className="font-bold text-slate-800">{formatDate(donation.date)}</span>
              </div>
              <div className="text-center">
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-wide border-b-4 border-emerald-500 pb-1 inline-block">
                  {t.receiptTitle}
                </h2>
                <p className="mt-2 text-sm font-mono text-slate-500">N° {String(donation.operationNumber).padStart(6, '0')}</p>
              </div>
            </div>

            {/* Details Table */}
            <div className="bg-slate-50/50 rounded-lg p-6 border border-slate-100 print:bg-transparent print:border-slate-200 space-y-5">
              
              <div className="flex items-center">
                <span className="w-32 text-slate-500 font-bold text-sm">{t.receiptName}</span>
                <span className="flex-1 font-bold text-lg text-slate-900 border-b border-dashed border-slate-300 pb-1">
                  {donation.donorName || t.guest}
                </span>
              </div>

              <div className="flex items-center">
                <span className="w-32 text-slate-500 font-bold text-sm">{t.receiptAmount}</span>
                <span className="flex-1 font-bold text-xl text-emerald-700 dir-ltr border-b border-dashed border-slate-300 pb-1">
                  {formatMoney(donation.amount)}
                </span>
              </div>

              <div className="flex items-center">
                <span className="w-32 text-slate-500 font-bold text-sm">{t.receiptMethod}</span>
                <span className="flex-1 font-medium text-slate-800 border-b border-dashed border-slate-300 pb-1">
                  {t.methods[donation.paymentMethod?.toLowerCase().replace(/\s/g, '')] || donation.paymentMethod}
                  {donation.bankDetails && <span className="text-sm text-slate-500 mx-2">({donation.bankDetails})</span>}
                </span>
              </div>

              {donation.description && (
                <div className="flex items-start mt-2">
                  <span className="w-32 text-slate-500 font-bold text-sm mt-1">ملاحظات</span>
                  <p className="flex-1 text-sm text-slate-600 italic bg-white p-2 rounded border border-slate-100">
                    {donation.description}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="mt-12 flex justify-between items-end">
               <div className="text-center w-40">
                  <p className="font-bold text-slate-800 text-sm mb-3">{t.receiptSignature}</p>
                  <div className="h-20 w-full border-b border-slate-300 flex items-end justify-center pb-2">
                     <span className="font-script text-2xl text-slate-400 opacity-50 font-medium">{donation.memberName}</span>
                  </div>
               </div>
               
               <div className="text-left max-w-[200px]">
                  <p className="text-emerald-800/80 font-bold italic text-sm leading-relaxed border-l-4 border-emerald-500 pl-3">
                    "{t.receiptFooter}"
                  </p>
               </div>
            </div>
            
            {/* Cut Line */}
            <div className="mt-12 border-t border-dashed border-slate-300 pt-2 flex justify-between text-[10px] text-slate-300 print:flex hidden">
               <span>نسخة المتبرع</span>
               <span>{appId}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Print Specific CSS */}
      <style>{`
        @media print {
          @page { size: A5 landscape; margin: 0; }
          body * { visibility: hidden; }
          #receipt-print-area, #receipt-print-area * { visibility: visible; }
          #receipt-print-area {
            position: fixed;
            left: 0; top: 0; width: 100%; height: 100%;
            margin: 0; padding: 20px;
            background: white;
            display: flex;
            flex-direction: column;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

const ConfirmationModal = ({ data, onConfirm, onCancel, t }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
    <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden transform transition-all scale-100">
      <div className="bg-emerald-600 p-6 text-white text-center relative overflow-hidden">
         <div className="absolute top-0 left-0 w-full h-full bg-white/10 opacity-30 transform -skew-y-6 origin-top-left scale-150"></div>
         <Check className="w-12 h-12 mx-auto mb-2 relative z-10" />
         <h3 className="font-bold text-xl relative z-10">{t.confirmTitle}</h3>
      </div>
      
      <div className="p-6 space-y-4">
        <p className="text-center text-slate-500 text-sm">{t.confirmMsg}</p>
        
        <div className="bg-slate-50 p-4 rounded-xl space-y-3 text-sm border border-slate-100 shadow-inner">
           <div className="flex justify-between items-center">
             <span className="text-slate-400">{t.donorName}</span>
             <span className="font-bold text-slate-800">{data.donorName || t.guest}</span>
           </div>
           <div className="flex justify-between items-center">
             <span className="text-slate-400">{t.amount}</span>
             <span className="font-bold text-emerald-600 text-lg dir-ltr">{formatMoney(data.amount)}</span>
           </div>
           <div className="w-full h-px bg-slate-200 my-2"></div>
           <div className="flex justify-between items-center">
             <span className="text-slate-400">{t.method}</span>
             <span className="font-medium text-slate-700">
                {t.methods[data.method.toLowerCase().replace(/\s/g, '')] || data.method}
             </span>
           </div>
        </div>

        <div className="flex gap-3 mt-6">
           <button 
             onClick={onCancel}
             className="flex-1 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl transition"
           >
             {t.btnCancel}
           </button>
           <button 
             onClick={onConfirm}
             className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 transition"
           >
             {t.btnConfirm}
           </button>
        </div>
      </div>
    </div>
  </div>
);

// --- 5. MAIN VIEWS ---

const Dashboard = ({ donations, t }) => {
  const total = donations.reduce((sum, d) => sum + d.amount, 0);
  const uniqueDonors = new Set(donations.filter(d => d.donorName && d.donorName !== t.guest).map(d => d.donorName)).size;
  
  const memberStats = useMemo(() => {
    const stats = {};
    donations.forEach(d => {
      const name = d.memberName || t.guest;
      if (!stats[name]) stats[name] = 0;
      stats[name] += d.amount;
    });
    return Object.entries(stats).sort((a, b) => b[1] - a[1]);
  }, [donations, t.guest]);

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-24">
      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Card */}
        <div className="md:col-span-3 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden bg-gradient-to-br from-emerald-800 to-emerald-600">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-black/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-end md:items-center">
            <div>
              <p className="text-emerald-100 font-medium mb-2 flex items-center gap-2">
                <Coins size={18} /> {t.totalCollected}
              </p>
              <h2 className="text-5xl md:text-6xl font-black tracking-tight dir-ltr text-right md:text-left drop-shadow-sm">{formatMoney(total)}</h2>
            </div>
            <div className="mt-6 md:mt-0 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
              <p className="text-xs text-emerald-100 mb-1">{t.recentActivity}</p>
              <p className="text-xl font-bold">+{donations.filter(d => new Date(d.date) > new Date(Date.now() - 86400000)).length} اليوم</p>
            </div>
          </div>
        </div>

        {/* Small Stats */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md transition">
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">{t.totalOps}</p>
            <p className="text-3xl font-bold text-slate-800 mt-2">{donations.length}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center">
            <FileText size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md transition">
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">{t.uniqueDonors}</p>
            <p className="text-3xl font-bold text-slate-800 mt-2">{uniqueDonors}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users size={24} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Members Leaderboard */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
          <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
              <Shield size={20} className="text-emerald-600" />
              {t.collectedByMember}
            </h3>
          </div>
          <div className="flex-1 p-2">
            {memberStats.map(([name, amount], idx) => (
              <div key={name} className="p-4 flex items-center justify-between hover:bg-slate-50 rounded-2xl transition mb-1 group">
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                    idx === 0 ? 'bg-yellow-100 text-yellow-700 ring-4 ring-yellow-50' : 
                    idx === 1 ? 'bg-slate-200 text-slate-700' : 
                    idx === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-50 text-slate-400'
                  }`}>
                    {idx + 1}
                  </div>
                  <span className="font-bold text-slate-700 group-hover:text-emerald-700 transition">{name}</span>
                </div>
                <span className="font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg text-sm">{formatMoney(amount)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
          <div className="p-6 border-b border-slate-50 bg-slate-50/50">
            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
              <Calendar size={20} className="text-emerald-600" />
              {t.recentActivity}
            </h3>
          </div>
          <div className="flex-1 p-2">
            {donations.slice(0, 5).map(d => (
              <div key={d.id} className="p-4 hover:bg-slate-50 rounded-2xl transition mb-1 border-b border-dashed border-slate-100 last:border-0 last:mb-0">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-slate-800">{d.donorName || t.guest}</span>
                  <span className="font-bold text-emerald-600 dir-ltr text-sm">+{formatMoney(d.amount)}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-400 mt-2">
                  <span className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-full"><User size={10} /> {d.memberName}</span>
                  <span>{formatDate(d.date)}</span>
                </div>
              </div>
            ))}
            {donations.length === 0 && (
                 <p className="text-center py-12 text-slate-400 font-medium text-sm">{t.noData}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Donation List with Dropdown & Search ---
const DonationList = ({ donations, t, userId, isAdmin, onDelete, onAction }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [openMenu, setOpenMenu] = useState(null);

  // Filter donations
  const filteredDonations = useMemo(() => {
    return donations.filter(d => 
      (d.donorName && d.donorName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (d.amount && d.amount.toString().includes(searchTerm))
    );
  }, [donations, searchTerm]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenMenu(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const toggleMenu = (e, id) => {
    e.stopPropagation();
    setOpenMenu(openMenu === id ? null : id);
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto min-h-full pb-24">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
             <ListIcon className="text-emerald-600" />
             {t.history}
          </h2>
          <p className="text-slate-400 text-sm mt-1">{filteredDonations.length} {t.totalOps}</p>
        </div>
        
        <div className="relative w-full md:w-96">
           <Search className="absolute right-4 top-3.5 text-slate-400" size={18} />
           <input 
             type="text" 
             placeholder={t.searchPlaceholder}
             className="w-full pr-11 pl-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none shadow-sm transition"
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
           />
        </div>
      </div>
      
      <div className="space-y-4">
        {filteredDonations.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <div className="mx-auto w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
              <Search size={32} />
            </div>
            <p className="text-slate-500 font-medium">{t.noData}</p>
          </div>
        ) : (
          filteredDonations.map((d) => (
            <div 
              key={d.id} 
              className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition group relative overflow-visible"
            >
              {/* Payment Method Indicator */}
              <div className={`absolute right-0 top-6 bottom-6 w-1 rounded-l-full ${
                d.paymentMethod === 'Cash' ? 'bg-emerald-500' : 
                d.paymentMethod === 'Bank Transfer' ? 'bg-blue-500' : 'bg-orange-500'
              }`}></div>

              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between pr-4">
                
                {/* Left Side: Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                      #{d.operationNumber}
                    </span>
                    <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                       <Calendar size={12} /> {formatDate(d.date)}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-1">{d.donorName || t.guest}</h3>
                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    <span className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded text-xs">
                      <User size={12} /> {d.memberName}
                    </span>
                    {d.paymentMethod === 'Bank Transfer' && d.bankDetails && (
                       <span className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-xs">
                         <Banknote size={12} /> {d.bankDetails}
                       </span>
                    )}
                  </div>
                </div>

                {/* Right Side: Amount & Menu */}
                <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end mt-4 md:mt-0">
                  <div className="text-2xl font-black text-emerald-700 dir-ltr">
                    {formatMoney(d.amount)}
                  </div>
                  
                  {/* Dropdown Menu */}
                  <div className="relative">
                    <button 
                      onClick={(e) => toggleMenu(e, d.id)}
                      className={`p-2 rounded-lg transition ${openMenu === d.id ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
                    >
                      <MoreVertical size={20} />
                    </button>
                    
                    {/* Dropdown Content */}
                    {openMenu === d.id && (
                      <div className="absolute left-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-20 py-1 animate-in fade-in zoom-in-95 origin-top-left">
                         <button 
                           onClick={() => onAction('view', d)}
                           className="w-full text-right px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 hover:text-emerald-700 flex items-center gap-3 font-medium transition"
                         >
                           <Eye size={16} /> {t.viewReceipt}
                         </button>
                         <button 
                           onClick={() => onAction('download', d)}
                           className="w-full text-right px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 hover:text-emerald-700 flex items-center gap-3 font-medium transition"
                         >
                           <Download size={16} /> {t.downloadPdf}
                         </button>
                         <button 
                           onClick={() => onAction('print', d)}
                           className="w-full text-right px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 hover:text-emerald-700 flex items-center gap-3 font-medium transition"
                         >
                           <Printer size={16} /> {t.printReceipt}
                         </button>
                         {(isAdmin || d.createdBy === userId) && (
                           <>
                             <div className="h-px bg-slate-100 my-1"></div>
                             <button 
                               onClick={() => onDelete(d.id)}
                               className="w-full text-right px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 font-medium transition"
                             >
                               <Trash2 size={16} /> {t.delete}
                             </button>
                           </>
                         )}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// --- Add Donation Form ---
const AddDonation = ({ onAdd, loading, t, userDisplayName }) => {
  const [formData, setFormData] = useState({
    donorName: '',
    phone: '',
    amount: '',
    method: 'Cash',
    bankDetails: '',
    description: ''
  });
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const amountFloat = parseFloat(formData.amount);
    if (!formData.amount || amountFloat <= 0 || isNaN(amountFloat)) return;
    setShowConfirm(true);
  };

  const handleFinalConfirm = () => {
    onAdd({
      ...formData,
      amount: parseFloat(formData.amount),
      memberName: userDisplayName
    }, (success) => {
      if (success) {
        setFormData({ donorName: '', phone: '', amount: '', method: 'Cash', bankDetails: '', description: '' });
        setShowConfirm(false);
      }
    });
  };

  const currentDate = new Date().toLocaleDateString('ar-MA', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 animate-in slide-in-from-bottom-4 pb-24">
      
      {showConfirm && (
        <ConfirmationModal 
          data={{...formData, memberName: userDisplayName}} 
          onConfirm={handleFinalConfirm}
          onCancel={() => setShowConfirm(false)}
          t={t}
        />
      )}

      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="p-8 bg-slate-900 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
          
          <div className="relative z-10">
             <h2 className="text-2xl font-bold flex items-center gap-3">
               <div className="p-2 bg-emerald-600 rounded-xl"><Plus className="text-white" size={20} /></div>
               {t.recordTitle}
             </h2>
             <p className="text-slate-400 text-sm mt-2 flex items-center gap-2">
                <User size={14} /> {t.memberResponsable}: <span className="text-white font-bold">{userDisplayName}</span>
             </p>
          </div>
          <div className="relative z-10 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl text-sm font-mono border border-white/10">
            {currentDate}
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">{t.donorName}</label>
              <div className="relative group">
                <User className="absolute right-4 top-3.5 text-slate-400 group-focus-within:text-emerald-500 transition" size={18} />
                <input 
                  type="text" required 
                  className="w-full pr-12 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition font-medium"
                  value={formData.donorName}
                  onChange={e => setFormData({...formData, donorName: e.target.value})}
                  placeholder="الاسم الكامل"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">{t.phone}</label>
              <div className="relative group">
                <Phone className="absolute right-4 top-3.5 text-slate-400 group-focus-within:text-emerald-500 transition" size={18} />
                <input 
                  type="tel" 
                  className="w-full pr-12 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition font-medium dir-ltr text-right"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  placeholder="06XXXXXXXX"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">{t.amount}</label>
              <div className="relative group">
                 <div className="absolute left-4 top-3.5 text-slate-400 font-bold text-xs bg-slate-200 px-2 py-0.5 rounded">MAD</div>
                 <input 
                  type="number" step="0.01" required 
                  className="w-full px-4 py-3 bg-emerald-50/50 border border-emerald-100 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-black text-2xl text-emerald-800 dir-ltr text-right transition"
                  value={formData.amount}
                  onChange={e => setFormData({...formData, amount: e.target.value})}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">{t.method}</label>
              <div className="relative">
                <ChevronDown className="absolute left-4 top-4 text-slate-400 pointer-events-none" size={16} />
                <select 
                  className="w-full pr-4 pl-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none appearance-none font-medium cursor-pointer"
                  value={formData.method}
                  onChange={e => setFormData({...formData, method: e.target.value})}
                >
                  <option value="Cash">{t.methods.cash}</option>
                  <option value="Bank Transfer">{t.methods.transfer}</option>
                  <option value="Check">{t.methods.check}</option>
                  <option value="Other">{t.methods.other}</option>
                </select>
              </div>
            </div>
          </div>

          {formData.method === 'Bank Transfer' && (
            <div className="animate-in fade-in slide-in-from-top-2 space-y-2">
              <label className="text-sm font-bold text-blue-600">{t.bankDetails}</label>
              <div className="relative group">
                 <CreditCard className="absolute right-4 top-3.5 text-blue-400 group-focus-within:text-blue-600 transition" size={18} />
                 <input 
                  type="text" required
                  className="w-full pr-12 pl-4 py-3 bg-blue-50/30 border border-blue-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-blue-900 font-medium transition"
                  value={formData.bankDetails}
                  onChange={e => setFormData({...formData, bankDetails: e.target.value})}
                  placeholder="اسم البنك / رقم التحويل"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">{t.description}</label>
            <textarea 
              rows="3"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition"
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              placeholder="وصف إضافي (اختياري)"
            ></textarea>
          </div>

          <div className="pt-4">
            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-4 rounded-xl font-bold text-white text-lg shadow-xl hover:shadow-2xl hover:bg-emerald-700 hover:-translate-y-1 transition-all duration-300 disabled:opacity-70 disabled:hover:translate-y-0"
              style={{ backgroundColor: BRAND.main }}
            >
              {loading ? t.btnSaving : t.btnRecord}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- 6. MAIN APP SHELL ---

export default function App() {
  const t = TRANSLATIONS.ar;
  const [userId, setUserId] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [view, setView] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [donations, setDonations] = useState([]);
  const [memberData, setMemberData] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Receipt State
  const [receiptData, setReceiptData] = useState(null);
  const [autoPrint, setAutoPrint] = useState(false);

  const logoPath = 'assets/logo-ar.png'; 

  useEffect(() => {
    document.title = t.appTitle;
    document.documentElement.dir = 'rtl';
    
    const initAuth = async () => {
      try {
        await setPersistence(auth, browserSessionPersistence);
        const token = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
        if (token) await signInWithCustomToken(auth, token);
        else await signInAnonymously(auth);
      } catch (err) {
         console.error(err);
      }
    };
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserId(user ? user.uid : null);
      setAuthReady(true);
      if(!user) setLoading(false);
    });

    initAuth();
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (authReady && userId) {
      const memberRef = doc(db, `artifacts/${appId}/public/data/members`, userId);
      const unsubMember = onSnapshot(memberRef, (snap) => {
         if (snap.exists()) {
           setMemberData(snap.data());
           setIsAdmin(snap.data().isAdmin || false);
         } else {
            setMemberData({ name: t.guest, isAdmin: false });
         }
         setLoading(false);
       });

      const q = query(collection(db, `artifacts/${appId}/public/data/donations`));
      const unsubDonations = onSnapshot(q, (snap) => {
        const list = snap.docs.map(d => ({ 
          id: d.id, 
          ...d.data(),
          date: d.data().timestamp?.toDate ? d.data().timestamp.toDate() : d.data().timestamp
        }));
        list.sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0));
        setDonations(list);
      });
      return () => { unsubMember(); unsubDonations(); };
    }
  }, [authReady, userId]);

  const handleAdd = async (data, callback) => {
    setLoading(true);
    try {
      const nextOpNumber = donations.length > 0 ? Math.max(...donations.map(d=>d.operationNumber).filter(n => typeof n === 'number')) + 1 : 1; 
      const newDoc = await addDoc(collection(db, `artifacts/${appId}/public/data/donations`), {
        operationNumber: nextOpNumber,
        donorName: data.donorName,
        phone: data.phone,
        amount: data.amount,
        paymentMethod: data.method,
        bankDetails: data.bankDetails || '',
        description: data.description,
        createdBy: userId,
        memberName: data.memberName,
        timestamp: serverTimestamp()
      });
      
      setView('list');
      callback(true);
      
      // OPTIONAL: Automatically open receipt after adding
      // setReceiptData({...data, operationNumber: nextOpNumber, date: new Date()});
    } catch (err) {
      console.error(err);
      callback(false);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if(confirm(t.deleteConfirm)) { 
      try {
        await deleteDoc(doc(db, `artifacts/${appId}/public/data/donations`, id));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleAction = (type, data) => {
    if (type === 'delete') handleDelete(data.id);
    if (type === 'view') {
      setAutoPrint(false);
      setReceiptData(data);
    }
    if (type === 'print' || type === 'download') {
      setAutoPrint(true);
      setReceiptData(data);
    }
  };

  // --- PREMIUM LOGIN SCREEN ---
  if (!authReady || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 overflow-hidden relative" dir="rtl">
         {/* Abstract Shapes */}
         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-600/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
         <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2"></div>

         <div className="relative z-10 bg-white/5 backdrop-blur-xl border border-white/10 p-12 rounded-3xl text-center max-w-sm w-full shadow-2xl">
            <div className="w-24 h-24 bg-white rounded-full mx-auto mb-8 flex items-center justify-center shadow-lg shadow-emerald-900/50">
               <img src={logoPath} alt="Logo" className="w-16 h-16 object-contain" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">{t.appTitle}</h1>
            <p className="text-emerald-200/80 mb-8 font-light">{t.loginSub}</p>
            
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-emerald-500 border-t-transparent"></div>
            </div>
            <p className="mt-4 text-sm text-slate-400">{t.btnLogging}</p>
         </div>
      </div>
    );
  }

  const displayMemberName = memberData?.name || t.guest;

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800 dir-rtl selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* Receipt Modal */}
      {receiptData && (
        <ReceiptModal 
          donation={receiptData} 
          onClose={() => setReceiptData(null)} 
          logoPath={logoPath}
          autoPrint={autoPrint}
        />
      )}

      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex flex-col w-80 bg-white shadow-2xl z-30 sticky top-0 h-screen border-l border-slate-100 print:hidden">
        <div className="p-10 flex flex-col items-center border-b border-slate-50 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 via-emerald-600 to-emerald-800"></div>
          <div className="w-24 h-24 mb-6 bg-white rounded-full p-2 shadow-lg border border-slate-100 flex items-center justify-center">
             <img src={logoPath} alt="شعار الجمعية" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-black text-center text-slate-900 leading-none">{t.appTitle}</h1>
          <p className="text-xs text-slate-400 mt-2 font-medium tracking-wide text-center">{t.subTitle}</p>
        </div>

        <nav className="flex-1 p-6 space-y-3 overflow-y-auto">
          <NavItem active={view === 'dashboard'} onClick={() => setView('dashboard')} icon={LayoutDashboard} label={t.dashboard} />
          <NavItem active={view === 'add'} onClick={() => setView('add')} icon={Plus} label={t.add} highlight />
          <NavItem active={view === 'list'} onClick={() => setView('list')} icon={ListIcon} label={t.history} />
        </nav>

        <div className="p-6 bg-slate-50 m-6 rounded-2xl border border-slate-100 shadow-inner">
           <div className="flex items-center gap-4 mb-4">
             <div className="w-12 h-12 rounded-full text-white flex items-center justify-center font-bold text-lg shadow-lg bg-gradient-to-br from-emerald-600 to-emerald-800 ring-2 ring-white">
               {displayMemberName.charAt(0)}
             </div>
             <div className="overflow-hidden">
               <p className="text-sm font-bold text-slate-900 truncate">{displayMemberName}</p>
               <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold mt-1">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></div>
                 {isAdmin ? t.roleAdmin : t.roleMember}
               </span>
             </div>
           </div>
           
           <button onClick={() => signOut(auth)} className="flex items-center justify-center gap-2 text-slate-500 hover:text-red-600 text-sm font-bold w-full py-3 bg-white hover:bg-red-50 rounded-xl transition shadow-sm border border-slate-100">
             <LogOut size={16} /> {t.signOut}
           </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-40 px-4 py-3 shadow-sm border-b border-slate-100 flex justify-between items-center print:hidden">
        <div className="flex items-center gap-2">
           <img src={logoPath} className="w-8 h-8 object-contain" />
           <h1 className="font-bold text-slate-800">{t.appTitle}</h1>
        </div>
        <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 bg-slate-100 rounded-lg text-slate-600 hover:bg-slate-200 transition">
          <Menu size={24} />
        </button>
      </div>

      {/* Main Content */}
      <main className="flex-1 h-screen overflow-y-auto print:h-auto print:overflow-visible pt-20 md:pt-0 scroll-smooth">
         {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
            <div className="relative w-64 h-full bg-white shadow-2xl flex flex-col p-6 animate-in slide-in-from-left">
               <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-4">
                 <span className="font-bold text-lg text-slate-800">{t.appTitle}</span>
                 <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-slate-100 text-slate-500 rounded-lg"><X size={20} /></button>
               </div>
               <nav className="space-y-2 flex-1">
                <MobileNavItem onClick={() => { setView('dashboard'); setIsMobileMenuOpen(false); }} label={t.dashboard} icon={LayoutDashboard} active={view === 'dashboard'} />
                <MobileNavItem onClick={() => { setView('add'); setIsMobileMenuOpen(false); }} label={t.add} icon={Plus} active={view === 'add'} />
                <MobileNavItem onClick={() => { setView('list'); setIsMobileMenuOpen(false); }} label={t.history} icon={ListIcon} active={view === 'list'} />
              </nav>
              <button onClick={() => signOut(auth)} className="flex items-center gap-2 text-red-500 font-bold mt-4 p-4 bg-red-50 rounded-xl">
                <LogOut size={18} /> {t.signOut}
              </button>
            </div>
          </div>
        )}

        {view === 'dashboard' && <Dashboard donations={donations} t={t} />}
        {view === 'add' && <AddDonation onAdd={handleAdd} loading={loading} t={t} userDisplayName={displayMemberName} />}
        {view === 'list' && <DonationList donations={donations} t={t} userId={userId} isAdmin={isAdmin} onDelete={handleDelete} onAction={handleAction} />}
      </main>
    </div>
  );
}

// --- Navigation Components ---

const NavItem = ({ active, onClick, icon: Icon, label, highlight }) => (
  <button
    onClick={onClick}
    className={`flex items-center w-full p-4 rounded-xl transition-all duration-300 group relative overflow-hidden ${
      active 
        ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' 
        : highlight 
          ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 hover:shadow-md'
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
    } ${active ? 'font-bold' : 'font-medium'}`}
  >
    <Icon size={22} className={`${active ? 'text-emerald-400' : highlight ? 'text-emerald-600' : 'text-slate-400 group-hover:text-slate-600'} ml-4 transition-colors`} />
    <span className="text-base">{label}</span>
    {active && <div className="absolute right-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-emerald-500 rounded-l-full"></div>}
  </button>
);

const MobileNavItem = ({ onClick, label, active, icon: Icon }) => (
  <button 
    onClick={onClick} 
    className={`w-full flex items-center gap-4 text-right p-4 rounded-xl text-lg font-bold transition ${active ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
  >
    <Icon size={20} className={active ? 'text-emerald-400' : 'text-slate-400'} />
    {label}
  </button>
);
