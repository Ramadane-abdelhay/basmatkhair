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
  FileText
} from 'lucide-react';

// --- 1. CONFIGURATION & SETUP ---

const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const appId = 'basmat-khair-app';

// --- 2. CONSTANTS & TRANSLATIONS ---

const BRAND = {
  main: '#2f7c32',   // Green
  second: '#f07012', // Orange
  bg: '#f8fafc',
  text: '#1e293b'
};

const TRANSLATIONS = {
  ar: {
    appTitle: "جمعية بسمة خير للأعمال الاجتماعية",
    dashboard: "لوحة التحكم",
    add: "إضافة تبرع",
    history: "سجل العمليات",
    members: "الأعضاء",
    signOut: "خروج",
    welcome: "مرحباً",
    guest: "فاعل خير",
    roleAdmin: "مسؤول",
    roleMember: "عضو",
    // Dashboard
    totalCollected: "إجمالي التبرعات",
    totalOps: "عدد العمليات",
    uniqueDonors: "عدد المتبرعين",
    collectedByMember: "المبالغ المحصلة حسب العضو",
    recentActivity: "آخر الأنشطة",
    noData: "لا توجد بيانات حاليا.",
    // Add Form
    recordTitle: "تسجيل تبرع جديد",
    donorName: "الاسم الكامل للمتبرع",
    amount: "المبلغ (درهم)",
    phone: "رقم الهاتف",
    method: "طريقة الدفع",
    bankDetails: "اسم البنك / رقم الحساب",
    description: "ملاحظات",
    memberResponsable: "المكلف بالعملية",
    dateFixed: "تاريخ العملية",
    btnRecord: "حفظ التبرع",
    btnSaving: "جاري المعالجة...",
    confirmTitle: "تأكيد معلومات التبرع",
    confirmMsg: "المرجو مراجعة المعلومات قبل الحفظ النهائي",
    btnConfirm: "تأكيد وحفظ",
    btnCancel: "تراجع",
    methods: {
      cash: "نقداً",
      transfer: "تحويل بنكي",
      check: "شيك",
      other: "أخرى"
    },
    errorAmount: "المرجو إدخال مبلغ صحيح",
    successMsg: "تم تسجيل التبرع بنجاح",
    // History & Receipt
    opNumber: "عملية رقم",
    receivedBy: "المستلم",
    printReceipt: "تحميل / طباعة الوصل",
    receiptTitle: "وصل أداء الانخراط",
    receiptAssocName: "جمعية بسمة خير للأعمال الاجتماعية",
    receiptFooter: "شكراً لانخراطكم ودعمكم لأنشطة الجمعية",
    receiptSignature: "إمضاء ممثل الجمعية",
    receiptName: "الاسم الكامل",
    receiptAmount: "المبلغ المؤدى",
    receiptDate: "تاريخ الأداء",
    receiptMethod: "طريقة الأداء",
    deleteConfirm: "هل أنت متأكد من حذف هذا التبرع؟",
    // Login
    loginTitle: "تسجيل الدخول",
    btnLogging: "جاري الاتصال...",
    authError: "خطأ في الاتصال. يرجى التحديث."
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
  return new Date(date).toLocaleDateString('ar-MA', {
    year: 'numeric', month: '2-digit', day: '2-digit'
  });
};

// --- 4. COMPONENTS ---

const ReceiptModal = ({ donation, onClose, logoPath }) => {
  if (!donation) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 print:p-0 print:bg-white print:static">
      <div className="bg-white w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden print:shadow-none print:w-full print:max-w-none print:rounded-none">
        
        {/* Toolbar (Hidden when printing) */}
        <div className="bg-slate-100 p-4 flex justify-between items-center border-b print:hidden">
          <h3 className="font-bold text-slate-700 flex items-center gap-2">
            <FileText size={20} className="text-orange-600" />
            معاينة الوصل
          </h3>
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition font-medium"
            >
              إغلاق
            </button>
            <button 
              onClick={handlePrint}
              className="px-4 py-2 bg-green-700 text-white hover:bg-green-800 rounded-lg shadow-md transition font-bold flex items-center gap-2"
            >
              <Printer size={18} />
              طباعة / تحميل PDF
            </button>
          </div>
        </div>

        {/* Receipt Content - This is what gets printed */}
        <div id="receipt-print-area" className="p-12 print:p-8 bg-white text-right" dir="rtl">
          {/* Header */}
          <div className="flex justify-between items-start mb-12 border-b-2 border-slate-100 pb-8">
            <div className="w-1/3">
              <img 
                src={logoPath} 
                alt="Logo" 
                className="w-32 h-auto object-contain"
                onError={(e) => {e.target.onerror = null; e.target.src = "https://placehold.co/200x200/2f7c32/ffffff?text=LOGO";}}
              />
            </div>
            <div className="w-2/3 text-left pt-2">
              <h1 className="text-2xl font-bold text-slate-800 mb-2">جمعية بسمة خير للأعمال الاجتماعية</h1>
              <p className="text-slate-500 text-sm">الرقم الوطني: 123456789</p>
              <p className="text-slate-500 text-sm">العنوان: شارع محمد الخامس، الرباط</p>
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-slate-900 inline-block px-8 py-2 border-2 border-slate-800 rounded-lg">
              وصل أداء الانخراط
            </h2>
            <p className="mt-4 text-slate-500">رقم العملية: {donation.operationNumber}</p>
          </div>

          {/* Details Body */}
          <div className="space-y-6 text-lg max-w-2xl mx-auto">
            <div className="flex items-baseline gap-4 border-b border-dashed border-slate-300 pb-2">
              <span className="font-bold text-slate-700 w-32 shrink-0">الاسم الكامل :</span>
              <span className="flex-1 font-semibold text-xl text-slate-900">{donation.donorName}</span>
            </div>

            <div className="flex items-baseline gap-4 border-b border-dashed border-slate-300 pb-2">
              <span className="font-bold text-slate-700 w-32 shrink-0">المبلغ المؤدى :</span>
              <span className="flex-1 font-bold text-xl text-slate-900">{formatMoney(donation.amount)}</span>
            </div>

            <div className="flex items-baseline gap-4 border-b border-dashed border-slate-300 pb-2">
              <span className="font-bold text-slate-700 w-32 shrink-0">تاريخ الأداء :</span>
              <span className="flex-1 font-medium text-slate-900">{formatDate(donation.date)}</span>
            </div>

            <div className="flex items-baseline gap-4 border-b border-dashed border-slate-300 pb-2">
              <span className="font-bold text-slate-700 w-32 shrink-0">طريقة الأداء :</span>
              <span className="flex-1 font-medium text-slate-900">
                 {TRANSLATIONS.ar.methods[donation.paymentMethod?.toLowerCase().replace(/\s/g, '')] || donation.paymentMethod}
                 {donation.bankDetails && ` (${donation.bankDetails})`}
              </span>
            </div>
          </div>

          {/* Footer & Signature */}
          <div className="mt-16 flex justify-between items-end">
             <div className="text-center">
                <p className="font-bold text-slate-800 mb-4 text-lg">إمضاء ممثل الجمعية :</p>
                <div className="h-24 w-48 border border-slate-200 rounded bg-slate-50 flex items-center justify-center text-slate-300">
                   (توقيع)
                </div>
                <p className="mt-2 text-sm font-semibold">{donation.memberName}</p>
             </div>
             
             <div className="text-left max-w-xs">
                <img src="/src/logo-receipt.png" alt="" className="w-16 h-16 opacity-50 mb-2 ml-auto hidden" />
                <p className="text-green-800 font-bold italic text-lg leading-relaxed border-t-2 border-green-700 pt-2">
                  "شكراً لانخراطكم ودعمكم لأنشطة الجمعية"
                </p>
             </div>
          </div>

          {/* Date Stamp */}
          <div className="mt-12 text-center text-xs text-slate-400">
             تم استخراج هذا الوصل بتاريخ {new Date().toLocaleString('ar-MA')}
          </div>
        </div>
      </div>
      
      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #receipt-print-area, #receipt-print-area * {
            visibility: visible;
          }
          #receipt-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 20px;
            background: white;
          }
          @page {
            size: A4;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
};

const ConfirmationModal = ({ data, onConfirm, onCancel, t }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
      <div className="bg-orange-500 p-4 text-white text-center">
         <h3 className="font-bold text-xl">{t.confirmTitle}</h3>
      </div>
      <div className="p-6 space-y-4">
        <p className="text-center text-slate-500 mb-4">{t.confirmMsg}</p>
        
        <div className="bg-slate-50 p-4 rounded-lg space-y-2 text-sm border border-slate-100">
           <div className="flex justify-between border-b border-slate-200 pb-2">
             <span className="text-slate-500">{t.donorName}:</span>
             <span className="font-bold text-slate-800">{data.donorName || t.guest}</span>
           </div>
           <div className="flex justify-between border-b border-slate-200 pb-2">
             <span className="text-slate-500">{t.amount}:</span>
             <span className="font-bold text-green-600 dir-ltr">{formatMoney(data.amount)}</span>
           </div>
           <div className="flex justify-between border-b border-slate-200 pb-2">
             <span className="text-slate-500">{t.method}:</span>
             <span className="font-bold text-slate-800">
                {t.methods[data.method.toLowerCase().replace(/\s/g, '')] || data.method}
             </span>
           </div>
           {data.method === 'Bank Transfer' && (
             <div className="flex justify-between border-b border-slate-200 pb-2">
               <span className="text-slate-500">البنك:</span>
               <span className="font-bold text-slate-800">{data.bankDetails}</span>
             </div>
           )}
           <div className="flex justify-between">
             <span className="text-slate-500">{t.memberResponsable}:</span>
             <span className="font-bold text-slate-800">{data.memberName}</span>
           </div>
        </div>

        <div className="flex gap-3 mt-6">
           <button 
             onClick={onCancel}
             className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
           >
             {t.btnCancel}
           </button>
           <button 
             onClick={onConfirm}
             className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg transition flex justify-center items-center gap-2"
           >
             <Check size={18} /> {t.btnConfirm}
           </button>
        </div>
      </div>
    </div>
  </div>
);

// --- 5. MAIN VIEWS ---

const Dashboard = ({ donations, t }) => {
  const total = donations.reduce((sum, d) => sum + d.amount, 0);
  const uniqueDonors = new Set(donations.filter(d => d.donorName).map(d => d.donorName)).size;
  
  // Member Stats
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
    <div className="p-6 space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto">
      {/* Header Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-3 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden" 
             style={{ background: `linear-gradient(135deg, ${BRAND.main}, #14532d)` }}>
          <div className="relative z-10">
            <p className="text-green-100 font-medium mb-1 text-lg">{t.totalCollected}</p>
            <h2 className="text-5xl font-extrabold tracking-tight dir-ltr text-right">{formatMoney(total)}</h2>
          </div>
          <Coins className="absolute left-6 top-1/2 -translate-y-1/2 text-white/10 w-40 h-40" />
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-sm font-medium">{t.totalOps}</p>
            <p className="text-3xl font-bold text-slate-800 mt-1">{donations.length}</p>
          </div>
          <div className="p-4 rounded-xl bg-orange-50 text-orange-600"><FileText size={28} /></div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-sm font-medium">{t.uniqueDonors}</p>
            <p className="text-3xl font-bold text-slate-800 mt-1">{uniqueDonors}</p>
          </div>
          <div className="p-4 rounded-xl bg-blue-50 text-blue-600"><Users size={28} /></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Members Leaderboard */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
              <Shield size={20} className="text-orange-600" />
              {t.collectedByMember}
            </h3>
          </div>
          <div className="flex-1 p-2">
            {memberStats.map(([name, amount], idx) => (
              <div key={name} className="p-4 flex items-center justify-between hover:bg-slate-50 rounded-xl transition mb-1">
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    idx === 0 ? 'bg-yellow-100 text-yellow-700' : 
                    idx === 1 ? 'bg-slate-100 text-slate-700' : 
                    idx === 2 ? 'bg-orange-50 text-orange-700' : 'bg-transparent text-slate-400'
                  }`}>
                    {idx + 1}
                  </div>
                  <span className="font-bold text-slate-700">{name}</span>
                </div>
                <span className="font-bold text-green-700">{formatMoney(amount)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
              <Calendar size={20} className="text-orange-600" />
              {t.recentActivity}
            </h3>
          </div>
          <div className="flex-1 p-2">
            {donations.slice(0, 5).map(d => (
              <div key={d.id} className="p-4 hover:bg-slate-50 rounded-xl transition mb-1 border-b border-dashed border-slate-100 last:border-0">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-slate-800">{d.donorName || t.guest}</span>
                  <span className="font-bold text-green-600 dir-ltr">+{formatMoney(d.amount)}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-400">
                  <span>{d.memberName}</span>
                  <span>{formatDate(d.date)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const DonationList = ({ donations, t, userId, isAdmin, onDelete, onPrint }) => (
  <div className="p-6 md:p-8 max-w-5xl mx-auto min-h-full">
    <div className="flex justify-between items-center mb-8">
      <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
        <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
          <ListIcon size={24} />
        </div>
        {t.history}
      </h2>
      <div className="bg-white px-4 py-2 rounded-lg shadow-sm text-sm text-slate-500 font-medium">
        {donations.length} {t.totalOps}
      </div>
    </div>
    
    <div className="space-y-4">
      {donations.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200">
          <div className="mx-auto w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
            <FileText size={32} />
          </div>
          <p className="text-slate-400 font-medium">{t.noData}</p>
        </div>
      ) : (
        donations.map((d) => (
          <div 
            key={d.id} 
            className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition group relative overflow-hidden"
          >
            {/* Color stripe based on payment method */}
            <div className={`absolute right-0 top-0 bottom-0 w-1 ${d.paymentMethod === 'Cash' ? 'bg-green-500' : 'bg-blue-500'}`}></div>

            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between pr-4">
              
              {/* Left Side: Basic Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                    #{d.operationNumber}
                  </span>
                  <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                     <Calendar size={12} /> {formatDate(d.date)}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">{d.donorName || t.guest}</h3>
                <div className="flex items-center gap-4 text-sm text-slate-500">
                  <span className="flex items-center gap-1">
                    <User size={14} /> {d.memberName}
                  </span>
                  {d.paymentMethod === 'Bank Transfer' && d.bankDetails && (
                     <span className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 rounded">
                       <Banknote size={14} /> {d.bankDetails}
                     </span>
                  )}
                </div>
              </div>

              {/* Right Side: Amount & Actions */}
              <div className="flex flex-col items-end gap-3 w-full md:w-auto">
                <div className="text-2xl font-extrabold text-green-700 dir-ltr">
                  {formatMoney(d.amount)}
                </div>
                
                <div className="flex items-center gap-2 w-full md:w-auto">
                   <button 
                     onClick={() => onPrint(d)}
                     className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-bold rounded-lg border border-slate-200 transition"
                   >
                     <Printer size={16} /> {t.printReceipt}
                   </button>
                   
                   {(isAdmin || d.createdBy === userId) && (
                    <button 
                      onClick={() => onDelete(d.id)}
                      className="p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
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
    if (!formData.amount || parseFloat(formData.amount) <= 0) return;
    setShowConfirm(true);
  };

  const handleFinalConfirm = () => {
    onAdd({
      ...formData,
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
    <div className="max-w-3xl mx-auto p-6 animate-in slide-in-from-bottom-4">
      
      {showConfirm && (
        <ConfirmationModal 
          data={{...formData, memberName: userDisplayName}} 
          onConfirm={handleFinalConfirm}
          onCancel={() => setShowConfirm(false)}
          t={t}
        />
      )}

      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
          <div>
             <h2 className="text-xl font-bold flex items-center gap-2">
               <Plus className="text-green-400" /> {t.recordTitle}
             </h2>
             <p className="text-slate-400 text-sm mt-1">{t.memberResponsable}: {userDisplayName}</p>
          </div>
          <div className="text-left bg-white/10 px-3 py-1 rounded text-sm font-mono">
            {currentDate}
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">{t.donorName}</label>
              <div className="relative">
                <User className="absolute right-3 top-3 text-slate-400" size={18} />
                <input 
                  type="text" required 
                  className="w-full pr-10 pl-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
                  value={formData.donorName}
                  onChange={e => setFormData({...formData, donorName: e.target.value})}
                  placeholder="الاسم الكامل"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">{t.phone}</label>
              <div className="relative">
                <Phone className="absolute right-3 top-3 text-slate-400" size={18} />
                <input 
                  type="tel" 
                  className="w-full pr-10 pl-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  placeholder="06XXXXXXXX"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">{t.amount}</label>
              <div className="relative">
                 <div className="absolute left-3 top-3 text-slate-500 font-bold text-sm bg-slate-100 px-2 rounded">MAD</div>
                 <input 
                  type="number" step="0.01" required 
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none font-bold text-xl text-green-700"
                  value={formData.amount}
                  onChange={e => setFormData({...formData, amount: e.target.value})}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">{t.method}</label>
              <select 
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none bg-white"
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

          {/* Conditional Input for Bank Transfer */}
          {formData.method === 'Bank Transfer' && (
            <div className="animate-in fade-in slide-in-from-top-2">
              <label className="block text-sm font-bold text-slate-700 mb-2 text-blue-600">{t.bankDetails}</label>
              <div className="relative">
                 <CreditCard className="absolute right-3 top-3 text-blue-400" size={18} />
                 <input 
                  type="text" required
                  className="w-full pr-10 pl-4 py-3 border border-blue-200 bg-blue-50/50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-blue-800"
                  value={formData.bankDetails}
                  onChange={e => setFormData({...formData, bankDetails: e.target.value})}
                  placeholder="اسم البنك / رقم التحويل"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">{t.description}</label>
            <textarea 
              rows="3"
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              placeholder="وصف إضافي (اختياري)"
            ></textarea>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 rounded-xl font-bold text-white text-lg shadow-lg hover:shadow-xl hover:bg-green-700 transition transform active:scale-[0.98]"
            style={{ backgroundColor: BRAND.second }}
          >
            {loading ? t.btnSaving : t.btnRecord}
          </button>
        </form>
      </div>
    </div>
  );
};


// --- 6. APP SHELL ---

export default function App() {
  const t = TRANSLATIONS.ar; // Force Arabic as per requirements
  const [userId, setUserId] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [view, setView] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [donations, setDonations] = useState([]);
  const [memberData, setMemberData] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [printDonation, setPrintDonation] = useState(null);

  const logoPath = '/assets/logo-ar.png'; // Standard path

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
      setLoading(false);
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
      const nextOpNumber = donations.length > 0 ? Math.max(...donations.map(d=>d.operationNumber)) + 1 : 1; 
      await addDoc(collection(db, `artifacts/${appId}/public/data/donations`), {
        operationNumber: nextOpNumber,
        donorName: data.donorName,
        phone: data.phone,
        amount: parseFloat(data.amount),
        paymentMethod: data.method,
        bankDetails: data.bankDetails || '',
        description: data.description,
        createdBy: userId,
        memberName: data.memberName,
        timestamp: serverTimestamp()
      });
      setView('list');
      callback(true);
    } catch (err) {
      console.error(err);
      callback(false);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if(confirm(t.deleteConfirm)) {
      await deleteDoc(doc(db, `artifacts/${appId}/public/data/donations`, id));
    }
  };

  if (!authReady) return <div className="min-h-screen flex items-center justify-center text-slate-500">{t.btnLogging}</div>;
  
  const displayMemberName = memberData?.name || t.guest;

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800 dir-rtl">
      
      {/* Receipt Modal */}
      {printDonation && (
        <ReceiptModal 
          donation={printDonation} 
          onClose={() => setPrintDonation(null)} 
          logoPath={logoPath}
        />
      )}

      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-72 bg-white shadow-xl z-30 sticky top-0 h-screen border-l border-slate-100 print:hidden">
        <div className="p-8 flex flex-col items-center border-b border-slate-100 bg-slate-50/50">
          <div className="w-20 h-20 mb-4 bg-white rounded-full p-2 shadow-sm border border-slate-100 flex items-center justify-center text-green-700">
             <img src={logoPath} alt="Logo" className="w-full h-full object-contain" onError={(e) => {e.target.style.display='none'}} />
             <Shield className="w-10 h-10" style={{display: 'none'}} /> 
          </div>
          <h1 className="text-xl font-black text-center text-slate-800 leading-tight">{t.appTitle}</h1>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto mt-4">
          <NavItem active={view === 'dashboard'} onClick={() => setView('dashboard')} icon={LayoutDashboard} label={t.dashboard} />
          <NavItem active={view === 'add'} onClick={() => setView('add')} icon={Plus} label={t.add} highlight />
          <NavItem active={view === 'list'} onClick={() => setView('list')} icon={ListIcon} label={t.history} />
        </nav>

        <div className="p-6 border-t border-slate-100 bg-slate-50">
           <div className="flex items-center gap-3 mb-4">
             <div className="w-12 h-12 rounded-full text-white flex items-center justify-center font-bold text-lg shadow-lg bg-gradient-to-br from-green-600 to-green-800">
               {displayMemberName.charAt(0)}
             </div>
             <div className="overflow-hidden">
               <p className="text-sm font-bold text-slate-900 truncate">{displayMemberName}</p>
               <p className="text-xs text-slate-500 flex items-center gap-1">
                 <div className="w-2 h-2 rounded-full bg-green-500"></div>
                 {isAdmin ? t.roleAdmin : t.roleMember}
               </p>
             </div>
           </div>
           
           <button onClick={() => signOut(auth)} className="flex items-center justify-center gap-2 text-red-500 text-sm font-bold w-full py-2 hover:bg-red-50 rounded-lg transition">
             <LogOut size={16} /> {t.signOut}
           </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white z-40 p-4 shadow-md flex justify-between items-center print:hidden">
        <h1 className="font-bold text-slate-800">{t.appTitle}</h1>
        <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 bg-slate-100 rounded">
          <Menu size={24} />
        </button>
      </div>

      {/* Main Content */}
      <main className="flex-1 h-screen overflow-y-auto print:h-auto print:overflow-visible pt-20 md:pt-0">
         {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 bg-white z-50 p-6 flex flex-col md:hidden">
            <div className="flex justify-between items-center mb-8 border-b pb-4">
               <h2 className="text-xl font-bold">{t.appTitle}</h2>
               <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-red-50 text-red-500 rounded"><X /></button>
            </div>
            <nav className="space-y-4 flex-1">
              <MobileNavItem onClick={() => { setView('dashboard'); setIsMobileMenuOpen(false); }} label={t.dashboard} active={view === 'dashboard'} />
              <MobileNavItem onClick={() => { setView('add'); setIsMobileMenuOpen(false); }} label={t.add} active={view === 'add'} />
              <MobileNavItem onClick={() => { setView('list'); setIsMobileMenuOpen(false); }} label={t.history} active={view === 'list'} />
            </nav>
          </div>
        )}

        {view === 'dashboard' && <Dashboard donations={donations} t={t} />}
        {view === 'add' && <AddDonation onAdd={handleAdd} loading={loading} t={t} userDisplayName={displayMemberName} />}
        {view === 'list' && <DonationList donations={donations} t={t} userId={userId} isAdmin={isAdmin} onDelete={handleDelete} onPrint={setPrintDonation} />}
      </main>
    </div>
  );
}

const NavItem = ({ active, onClick, icon: Icon, label, highlight }) => (
  <button
    onClick={onClick}
    className={`flex items-center w-full p-4 rounded-xl transition-all duration-200 group relative overflow-hidden ${
      active 
        ? 'bg-green-50 text-green-800 shadow-sm' 
        : highlight 
          ? 'bg-orange-50 text-orange-700 hover:bg-orange-100'
          : 'text-slate-500 hover:bg-white hover:text-slate-800 hover:shadow-sm'
    } ${active ? 'font-bold' : 'font-medium'}`}
  >
    {active && <div className="absolute right-0 top-0 bottom-0 w-1 bg-green-600 rounded-l"></div>}
    <Icon size={22} className={`${active ? 'text-green-600' : highlight ? 'text-orange-500' : 'text-slate-400 group-hover:text-slate-600'} ml-4`} />
    <span className="text-base">{label}</span>
  </button>
);

const MobileNavItem = ({ onClick, label, active }) => (
  <button 
    onClick={onClick} 
    className={`w-full text-right p-4 rounded-xl text-lg font-bold transition ${active ? 'bg-green-600 text-white shadow-lg' : 'bg-slate-50 text-slate-600'}`}
  >
    {label}
  </button>
);
