import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithCustomToken, 
  signInWithEmailAndPassword, 
  onAuthStateChanged,
  signOut,
  setPersistence,
  browserSessionPersistence,
  browserLocalPersistence
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
  ArrowLeft, 
  Globe, 
  Languages, 
  LogIn,
  FileSpreadsheet,
  Tag
} from 'lucide-react';
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

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
  main: '#047857',   
  dark: '#064e3b',   
  light: '#d1fae5',  
  accent: '#d97706', 
  bg: '#f8fafc',
  text: '#1e293b'
};

const TRANSLATIONS = {
  ar: {
    dir: 'rtl',
    langName: "العربية",
    appTitle: "جمعية بصمة خير",
    subTitle: "نبادر لنعطي ونعطي لنأثر",
    dashboard: "الرئيسية",
    add: "تبرع جديد",
    history: "الأرشيف",
    members: "الأعضاء",
    signOut: "تسجيل الخروج",
    welcome: "مرحباً بك",
    guest: "فاعل خير",
    roleAdmin: "مسؤول النظام",
    roleMember: "عضو نشيط",
    totalCollected: "المجموع المحصل",
    totalOps: "عدد العمليات",
    uniqueDonors: "المتبرعون",
    collectedByMember: "أداء الأعضاء",
    recentActivity: "أحدث التبرعات",
    noData: "لا توجد بيانات متاحة للعرض",
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
    // NEW FIELDS
    contributionType: "طبيعة المساهمة",
    contributionTypes: {
      financial: "تبرع مالي",
      annual: "انخراط سنوي",
      activity: "المساهمة في نشاط"
    },
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    rememberMe: "تذكرني", 
    invalidCreds: "خطاء في البريد أو كلمة المرور",
    errorAmount: "المرجو إدخال مبلغ صحيح",
    successMsg: "تمت العملية بنجاح",
    actions: "إجراءات",
    viewReceipt: "معاينة الوصل",
    downloadPdf: "تحميل PDF",
    printReceipt: "طباعة الوصل",
    delete: "حذف",
    opNumber: "رقم العملية",
    receivedBy: "المستلم",
    receivedByTitle: "امين المال", // Treasurer
    receiptTitle: "وصل تبرع",
    receiptAssocName: "جمعية بصمة خير للأعمال الاجتماعية",
    receiptFooter: "هذا الوصل يثبت حصول الجمعية على المبلغ | شكراً لانخراطكم ودعمكم لأنشطة الجمعية",
    receiptSignature: "ختم الجمعية",
    receiptName: "الاسم الكامل",
    receiptAmount: "المبلغ المؤدى",
    receiptDate: "تاريخ الأداء",
    receiptMethod: "بواسطة",
    deleteConfirm: "هل أنت متأكد من حذف هذا السجل نهائياً؟",
    loginTitle: "بوابة الأعضاء",
    loginSub: "تسجيل الدخول للمتابعة",
    btnEnter: "دخول النظام",
    loginAsGuest: "دخول كضيف",
    selectLang: "اختر اللغة",
    exportSheet: "تصدير البيانات (Excel)",
    currency: "درهم"
  },
  en: {
    dir: 'ltr',
    langName: "English",
    appTitle: "Basmat Khair",
    subTitle: "We initiate to give, and give to impact",
    dashboard: "Dashboard",
    add: "New Donation",
    history: "History",
    members: "Members",
    signOut: "Sign Out",
    welcome: "Welcome",
    guest: "Benefactor",
    roleAdmin: "Admin",
    roleMember: "Member",
    totalCollected: "Total Collected",
    totalOps: "Total Operations",
    uniqueDonors: "Donors",
    collectedByMember: "Member Performance",
    recentActivity: "Recent Donations",
    noData: "No data available to display",
    recordTitle: "Record New Donation",
    donorName: "Donor Name",
    amount: "Amount",
    phone: "Phone",
    method: "Payment Method",
    bankDetails: "Bank/Check Details",
    description: "Additional Notes",
    memberResponsable: "Responsible Member",
    dateFixed: "Operation Date",
    btnRecord: "Save & Continue",
    btnSaving: "Processing...",
    confirmTitle: "Review & Confirm",
    confirmMsg: "Please verify data before final saving",
    btnConfirm: "Confirm",
    btnCancel: "Edit",
    searchPlaceholder: "Search by donor name or amount...",
    methods: {
      cash: "Cash",
      transfer: "Bank Transfer",
      check: "Check",
      other: "Other"
    },
    contributionType: "Contribution Type",
    contributionTypes: {
      financial: "Financial Donation",
      annual: "Annual Membership",
      activity: "Activity Contribution"
    },
    email: "Email",
    password: "Password",
    rememberMe: "Remember Me", 
    invalidCreds: "Invalid email or password",
    errorAmount: "Please enter a valid amount",
    successMsg: "Operation successful",
    actions: "Actions",
    viewReceipt: "View Receipt",
    downloadPdf: "Download PDF",
    printReceipt: "Print Receipt",
    delete: "Delete",
    opNumber: "Op Number",
    receivedBy: "Received By",
    receivedByTitle: "Treasurer",
    receiptTitle: "Donation Receipt",
    receiptAssocName: "Basmat Khair Association",
    receiptFooter: "This receipt proves the association received the amount | Thank you for your support",
    receiptSignature: "Association Stamp",
    receiptName: "Full Name",
    receiptAmount: "Amount Paid",
    receiptDate: "Payment Date",
    receiptMethod: "Via",
    deleteConfirm: "Are you sure you want to permanently delete this record?",
    loginTitle: "Member Portal",
    loginSub: "Please log in to continue",
    btnEnter: "Enter System",
    loginAsGuest: "Enter as Guest",
    selectLang: "Select Language",
    exportSheet: "Export Sheet (Excel)",
    currency: "MAD"
  },
  fr: {
    dir: 'ltr',
    langName: "Français",
    appTitle: "Basmat Khair",
    subTitle: "Nous initions pour donner, et donnons pour impacter",
    dashboard: "Tableau de bord",
    add: "Nouveau Don",
    history: "Historique",
    members: "Membres",
    signOut: "Déconnexion",
    welcome: "Bienvenue",
    guest: "Bienfaiteur",
    roleAdmin: "Administrateur",
    roleMember: "Membre",
    totalCollected: "Total Collecté",
    totalOps: "Opérations",
    uniqueDonors: "Donateurs",
    collectedByMember: "Performance Membres",
    recentActivity: "Dons Récents",
    noData: "Aucune donnée disponible",
    recordTitle: "Enregistrer un Don",
    donorName: "Nom du Donateur",
    amount: "Montant",
    phone: "Téléphone",
    method: "Méthode",
    bankDetails: "Détails Banque/Chèque",
    description: "Notes Supplémentaires",
    memberResponsable: "Membre Responsable",
    dateFixed: "Date d'Opération",
    btnRecord: "Sauvegarder",
    btnSaving: "Traitement...",
    confirmTitle: "Vérifier et Confirmer",
    confirmMsg: "Veuillez vérifier les données avant l'enregistrement",
    btnConfirm: "Confirmer",
    btnCancel: "Modifier",
    searchPlaceholder: "Chercher par nom ou montant...",
    methods: {
      cash: "Espèces",
      transfer: "Virement",
      check: "Chèque",
      other: "Autre"
    },
    contributionType: "Type de Contribution",
    contributionTypes: {
      financial: "Don Financier",
      annual: "Adhésion Annuelle",
      activity: "Contribution à une Activité"
    },
    email: "E-mail",
    password: "Mot de passe",
    rememberMe: "Se souvenir de moi",
    invalidCreds: "Email ou mot de passe incorrect",
    errorAmount: "Veuillez entrer un montant valide",
    successMsg: "Opération réussie",
    actions: "Actions",
    viewReceipt: "Voir Reçu",
    downloadPdf: "Télécharger PDF",
    printReceipt: "Imprimer Reçu",
    delete: "Supprimer",
    opNumber: "N° Opération",
    receivedBy: "Reçu Par",
    receivedByTitle: "Trésorier",
    receiptTitle: "Reçu de Don",
    receiptAssocName: "Association Basmat Khair",
    receiptFooter: "Ce reçu prouve la réception du montant | Merci pour votre soutien",
    receiptSignature: "Cachet de l'Association",
    receiptName: "Nom Complet",
    receiptAmount: "Montant Payé",
    receiptDate: "Date de Paiement",
    receiptMethod: "Par",
    deleteConfirm: "Êtes-vous sûr de vouloir supprimer cet enregistrement ?",
    loginTitle: "Portail Membres",
    loginSub: "Veuillez vous connecter",
    btnEnter: "Entrer au Système",
    loginAsGuest: "Entrer comme Invité",
    selectLang: "Choisir la Langue",
    exportSheet: "Exporter (Excel)",
    currency: "MAD"
  }
};

// --- 3. UTILITIES ---

const formatMoney = (amount, currency = 'MAD', locale = 'ar-MA') => 
  new Intl.NumberFormat(locale, { 
    style: 'currency', 
    currency: currency,
    minimumFractionDigits: 2
  }).format(amount);

const formatDate = (date, locale = 'ar-MA') => {
  if (!date) return '';
  const dateObj = date.toDate ? date.toDate() : new Date(date);
  return dateObj.toLocaleDateString(locale, {
    year: 'numeric', month: 'long', day: 'numeric'
  });
};

const formatTime = (date, locale = 'ar-MA') => {
  if (!date) return '';
  const dateObj = date.toDate ? date.toDate() : new Date(date);
  return dateObj.toLocaleTimeString(locale, {
    hour: '2-digit', minute: '2-digit'
  });
};

// --- 4. COMPONENTS ---

// New Preloader Component
const Preloader = () => (
  <div className="fixed inset-0 z-[200] bg-slate-50 flex flex-col items-center justify-center animate-in fade-in duration-300">
    <div className="relative w-24 h-24 mb-8">
      <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
      <div className="absolute inset-0 border-4 border-emerald-600 rounded-full border-t-transparent animate-spin"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-12 h-12 bg-emerald-600 rounded-full animate-pulse shadow-lg shadow-emerald-200"></div>
      </div>
    </div>
    <h2 className="text-2xl font-black text-slate-800 animate-pulse">جاري التحميل...</h2>
    <p className="text-slate-400 font-medium mt-2">يرجى الانتظار قليلاً</p>
  </div>
);

// Language Selector Component
const LanguageSelector = ({ currentLang, setLang, t, isOpen, setIsOpen, up = false }) => {
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef, setIsOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition w-full"
      >
        <Globe size={20} className="text-emerald-600" />
        <span className="text-sm font-bold">{TRANSLATIONS[currentLang].langName}</span>
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''} ml-auto`} />
      </button>

      {isOpen && (
        <div className={`absolute ${up ? 'bottom-full mb-2' : 'top-full mt-2'} right-0 w-full min-w-[140px] bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden`}>
          {Object.keys(TRANSLATIONS).map((langKey) => (
            <button
              key={langKey}
              onClick={() => {
                setLang(langKey);
                setIsOpen(false);
              }}
              className={`w-full text-start px-4 py-3 text-sm font-medium hover:bg-slate-50 transition flex items-center justify-between ${currentLang === langKey ? 'text-emerald-600 bg-emerald-50' : 'text-slate-700'}`}
            >
              <span>{TRANSLATIONS[langKey].langName}</span>
              {currentLang === langKey && <Check size={14} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};


const ReceiptModal = ({ 
  donation, 
  onClose, 
  logoPath, 
  autoPrint = false, 
  t = {}, 
  lang = "fr" 
}) => {
  const signatureUrl = "https://raw.githubusercontent.com/Ramadane-abdelhay/basmatkhair/refs/heads/main/singnature-basmat.png";
  const qrCodeUrl = "https://raw.githubusercontent.com/Ramadane-abdelhay/basmatkhair/refs/heads/main/basmat-qr-code.png";
  
  const printAreaRef = useRef(null);
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [libsLoaded, setLibsLoaded] = useState(false);

  // 1. Load PDF Libraries & Fonts Dynamically
  useEffect(() => {
    const loadScript = (src) => {
      return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
          resolve();
          return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.body.appendChild(script);
      });
    };

    const loadStyle = (href) => {
      if (!document.querySelector(`link[href="${href}"]`)) {
        const link = document.createElement('link');
        link.href = href;
        link.rel = 'stylesheet';
        document.head.appendChild(link);
      }
    };

    // Load Cairo Font for professional Arabic look
    loadStyle("https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap");

    Promise.all([
      loadScript("https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"),
      loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js")
    ]).then(() => {
      setLibsLoaded(true);
    }).catch(err => {
      console.error("Failed to load PDF libraries", err);
    });
  }, []);

  // 2. Dynamic Scaling Logic
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const parentWidth = containerRef.current.offsetWidth;
        const a4WidthPx = 794; // 210mm @ 96 DPI
        // Calculate scale to fit, with a max of 1.0
        const newScale = Math.min(1, (parentWidth - 32) / a4WidthPx);
        setScale(newScale);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 3. Auto Print Logic
  useEffect(() => {
    if (autoPrint) {
      const timer = setTimeout(() => window.print(), 800);
      return () => clearTimeout(timer);
    }
  }, [autoPrint]);

  if (!donation) return null;

  const handlePrint = () => window.print();

  const downloadPDF = async () => {
    if (!libsLoaded) {
      alert("Please wait for PDF tools to load...");
      return;
    }

    const original = printAreaRef.current;
    if (!original) return;

    setIsGenerating(true);

    try {
      const html2canvas = window.html2canvas;
      const { jsPDF } = window.jspdf;

      const wrapper = document.createElement("div");
      wrapper.id = "desktop-pdf-wrapper";
      wrapper.style.position = "fixed";
      wrapper.style.top = "-3000px";
      wrapper.style.left = "0";
      wrapper.style.width = "1200px";        
      wrapper.style.background = "white";
      wrapper.style.zIndex = "-999999";
      wrapper.style.opacity = "0";

      document.body.appendChild(wrapper);

      const clone = original.cloneNode(true);
      clone.style.transform = "none";
      clone.style.width = "210mm";          
      clone.style.height = "297mm";         
      clone.style.margin = "0";
      clone.style.fontFamily = "'Cairo', sans-serif";

      wrapper.appendChild(clone);

      const canvas = await html2canvas(clone, {
        scale: 3,            
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        windowWidth: 1200,    
        windowHeight: 1600,
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.78);
      const pdf = new jsPDF("p", "mm", "a4");
      pdf.addImage(imgData, "JPEG", 0, 0, 210, 297);

      pdf.save(
        `Receipt_${String(donation.operationNumber || "0000").padStart(4, "0")}.pdf`
      );

    } catch (err) {
      console.error("PDF Generation failed", err);
      alert("Error generating PDF. Please use the Print button fallback.");
    } finally {
      const temp = document.getElementById("desktop-pdf-wrapper");
      if (temp) temp.remove();
      setIsGenerating(false);
    }
  };

  const formatMoney = (v) => {
    try {
      return new Intl.NumberFormat(lang === "ar" ? "ar-MA" : "fr-FR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(Number(v));
    } catch (e) { return v; }
  };

  const formatDate = (d) => {
    try {
      return new Date(d).toLocaleDateString(lang === "ar" ? "ar-MA" : "fr-FR", {
        year: "numeric", month: "long", day: "numeric",
      });
    } catch (e) { return d; }
  };

  // Get localized contribution type
  const getContributionLabel = (typeKey) => {
    if (!typeKey) return "";
    return t.contributionTypes?.[typeKey] || typeKey;
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-slate-900/95 backdrop-blur-sm print:bg-white print:p-0 print:static print:block font-['Cairo',_sans-serif]">
      
      {/* --- Toolbar --- */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700 shadow-lg shrink-0 print:hidden" dir={t?.dir || "rtl"}>
        <div className="flex items-center gap-3 text-white">
          <div className="p-2 bg-slate-700 rounded-lg">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" className="text-emerald-400">
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base leading-tight font-sans">{t.viewReceipt || "Payment Receipt"}</h3>
            <p className="text-xs text-slate-400 font-sans">#{String(donation.operationNumber).padStart(4, "0")}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={downloadPDF} 
            disabled={isGenerating || !libsLoaded}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white transition-all rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {isGenerating ? (
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5-5 5 5M12 15V5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
            <span className="hidden sm:inline font-sans">{t.downloadPdf || "Download"}</span>
          </button>

          <button 
            onClick={handlePrint} 
            className="p-2 text-slate-300 transition-colors rounded-lg hover:bg-slate-700 hover:text-white"
            title={t.printReceipt || "Print"}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M6 14h12v8H6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          <div className="h-6 w-px bg-slate-600 mx-1"></div>

          <button 
            onClick={onClose} 
            className="p-2 text-slate-400 transition-colors rounded-lg hover:bg-red-500/10 hover:text-red-400"
          >
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* --- Viewport Area --- */}
<div 
  ref={containerRef}
  className="flex-1 overflow-auto bg-slate-900/50 p-4 md:p-8 flex justify-center items-start print:p-0 print:bg-white print:block print:overflow-visible"
  onClick={(e) => e.target === containerRef.current && onClose()}
>

  {/* FIX: wrapper to prevent downward shift */}
  <div style={{ overflow: "hidden", display: "flex", justifyContent: "center" }}>

    {/* Wrapper for Scaling */}
    <div 
      className="relative transition-transform duration-200 ease-out origin-top print:transform-none print:w-full"
      style={{ 
        transform: `scale(${scale})`,
        transformOrigin: "top center"
      }}
    >

      {/* ACTUAL A4 DOCUMENT */}
      <div
        ref={printAreaRef}
        id="receipt-print-area"
        className="bg-white shadow-2xl print:shadow-none"
        style={{
          width: "210mm",
          height: "297mm",
          position: "relative",
          direction: "rtl",
          fontFamily: "'Cairo', sans-serif"
        }}
      >

        <div className="w-full h-full p-[16mm] flex flex-col justify-between relative overflow-hidden box-border">
          
          {/* Watermark */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.06] pointer-events-none z-0">
            <img src={logoPath} className="w-[140mm] object-contain grayscale" alt="" />
          </div>

          {/* === RECEIPT CONTENT === */}
          <div className="relative z-10 flex flex-col h-full justify-between text-slate-900">
            
            {/* Header */}
            <header className="text-center border-b-2 border-slate-900 pb-8">

              {/* QR Code - Top Left */}
              <div className="absolute top-[-2rem] left-[-2rem]">
                <img
                  src={qrCodeUrl}
                  className="w-32 h-32 object-contain opacity-90"
                  alt="QR Code"
                />
              </div>

              <div className="flex justify-center mb-6">
                <img src={logoPath} className="h-[55mm] object-contain" alt="Logo" />
              </div>
              <p className="text-lg font-semibold text-slate-600">{t.subTitle}</p>
              
              {/* Receipt Number */}
              <div className="mt-8 flex items-center justify-center gap-3">
                <div className="bg-slate-900 text-white px-8 py-2 rounded-full shadow-md flex items-center gap-3">
                  <span className="text-xl font-bold pt-1">رقم الوصل:</span>
                  <span className="font-mono text-2xl font-bold tracking-widest bg-slate-800 px-2 rounded dir-ltr">
                    {String(donation.operationNumber).padStart(4, "0")}
                  </span>
                </div>
              </div>
            </header>

            {/* Body */}
            <main className="flex-1 py-12 flex flex-col gap-10 px-4">
              
              {/* Row 1: Name */}
              <div className="flex items-end gap-6">
                <div className="font-bold text-slate-900 text-xl min-w-[45mm] text-right pt-2">
                  {t.receiptName} :
                </div>
                <div className="flex-1 text-center border-b-[3px] border-dotted border-slate-300 pb-2 text-2xl font-bold text-slate-800">
                  {donation.donorName || t.guest}
                </div>
              </div>

              {/* Row 2: Contribution Type */}
              <div className="flex items-end gap-6">
                <div className="font-bold text-slate-900 text-xl min-w-[45mm] text-right pt-2">
                  {t.contributionType} :
                </div>
                <div className="flex-1 text-center border-b-[3px] border-dotted border-slate-300 pb-2 text-2xl font-bold text-slate-800">
                  {getContributionLabel(donation.contributionType)}
                </div>
              </div>

              {/* Row 3: Amount */}
              <div className="flex items-end gap-6">
                <div className="font-bold text-slate-900 text-xl min-w-[45mm] text-right pt-2">
                  {t.receiptAmount} :
                </div>
                <div className="flex-1 text-center border-b-[3px] border-dotted border-slate-300 pb-2 flex items-center justify-center gap-3">
                  <span className="text-4xl font-black text-slate-900 dir-ltr inline-block">
                    {formatMoney(donation.amount)}
                  </span>
                  <span className="text-xl text-slate-500 font-bold mt-2">({t.currency})</span>
                </div>
              </div>

              {/* Row 4: Date */}
              <div className="flex items-end gap-6">
                <div className="font-bold text-slate-900 text-xl min-w-[45mm] text-right pt-2">
                  {t.receiptDate} :
                </div>
                <div className="flex-1 text-center border-b-[3px] border-dotted border-slate-300 pb-2 text-2xl font-bold text-slate-800">
                  {formatDate(donation.date)}
                </div>
              </div>

            </main>

            {/* Footer */}
            <footer className="mt-auto">
              <div className="flex justify-between items-start mb-8 px-4">
                
                {/* Received By */}
                <div className="text-center w-5/12">
                  <p className="font-bold text-slate-900 text-xl underline decoration-2 underline-offset-8 mb-16">
                    {t.receivedBy}
                  </p>
                  <p className="text-xl text-slate-700 font-bold">
                     {t.receivedByTitle} : {donation.memberName}
                  </p>
                </div>

                {/* Signature */}
                <div className="text-center w-5/12">
                  <p className="font-bold text-slate-900 text-xl underline decoration-2 underline-offset-8 mb-4">
                    {t.receiptSignature}
                  </p>
                  <div className="h-[35mm] flex items-center justify-center relative">
                    <img 
                      src={signatureUrl} 
                      className="max-h-full object-contain -rotate-6 opacity-90 mix-blend-multiply absolute" 
                      alt="Signature"
                    />
                  </div>
                </div>
              </div>

              {/* Bottom Strip */}
              <div className="border-t-2 border-slate-100 pt-6 text-center">
                <p className="text-sm text-slate-400 font-semibold" dir="rtl">
                  {t.receiptFooter}
                </p>
              </div>
            </footer>

          </div>
        </div>

      </div> {/* closes ACTUAL A4 DOCUMENT */}
    </div> {/* closes Wrapper for Scaling */}
  </div> {/* closes FIX wrapper to prevent downward shift */}
</div> {/* closes Viewport Area */}

{/* Print Styles */}
<style>{`
  .dir-ltr { direction: ltr; unicode-bidi: isolate; }
  @media print {
    @page { size: A4; margin: 0; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; margin: 0; padding: 0; }
    #receipt-print-area { width: 210mm !important; height: 297mm !important; box-shadow: none !important; margin: 0 !important; page-break-after: always; }
    .fixed { position: static !important; display: block !important; }
  }
`}</style>


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
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-24" dir={t.dir}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-3 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden bg-gradient-to-br from-emerald-800 to-emerald-600">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-black/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-end md:items-center">
            <div className={t.dir === 'rtl' ? 'text-right' : 'text-left'}>
              <p className="text-emerald-100 font-medium mb-2 flex items-center gap-2">
                <Coins size={18} /> {t.totalCollected}
              </p>
              <h2 className="text-5xl md:text-6xl font-black tracking-tight dir-ltr drop-shadow-sm">{formatMoney(total)}</h2>
            </div>
            <div className="mt-6 md:mt-0 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
              <p className="text-xs text-emerald-100 mb-1">{t.recentActivity}</p>
              <p className="text-xl font-bold">+{donations.filter(d => new Date(d.date) > new Date(Date.now() - 86400000)).length}</p>
            </div>
          </div>
        </div>

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

const DonationList = ({ donations, t, userId, isAdmin, onDelete, onAction }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [openMenu, setOpenMenu] = useState(null);

  const filteredDonations = useMemo(() => {
    return donations.filter(d => 
      (d.donorName && d.donorName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (d.amount && d.amount.toString().includes(searchTerm))
    );
  }, [donations, searchTerm]);

  useEffect(() => {
    const handleClickOutside = () => setOpenMenu(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const toggleMenu = (e, id) => {
    e.stopPropagation();
    setOpenMenu(openMenu === id ? null : id);
  };

  // --- NEW: Professional Sheet Export ---
  const handleExportExcel = () => {
    
    // 1. Define the content using HTML Table (This supports colors and merged cells in Excel)
    let tableHTML = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="UTF-8">
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>تبرعات الجمعية</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayRightToLeft/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          body { font-family: 'Arial', sans-serif; }
          .header-title { font-size: 24px; font-weight: bold; color: #047857; text-align: center; height: 50px; }
          .header-sub { font-size: 16px; font-weight: bold; color: #555; text-align: center; }
          .table-head { background-color: #047857; color: #ffffff; font-weight: bold; text-align: center; border: 1px solid #000; }
          .row-even { background-color: #f3fcf8; }
          .row-odd { background-color: #ffffff; }
          .cell { text-align: center; vertical-align: middle; border: 1px solid #ccc; padding: 5px; }
          .amount { font-weight: bold; color: #047857; }
        </style>
      </head>
      <body>
        <table>
          <!-- Decorative Header -->
          <tr>
            <td colspan="6" class="header-title">جمعية بصمة خير للأعمال الاجتماعية</td>
          </tr>
          <tr>
            <td colspan="6" class="header-sub">جميع تبرعات الجمعية (سجل شامل)</td>
          </tr>
          <tr><td colspan="6"></td></tr> <!-- Spacer -->
          
          <!-- Column Headers -->
          <thead>
            <tr>
              <th class="table-head">رقم العملية</th>
              <th class="table-head">التاريخ</th>
              <th class="table-head">الاسم الكامل</th>
              <th class="table-head">طبيعة المساهمة</th>
              <th class="table-head">المبلغ (درهم)</th>
              <th class="table-head">طريقة الأداء</th>
              <th class="table-head">الملاحظات</th>
            </tr>
          </thead>
          
          <!-- Data Rows -->
          <tbody>
    `;

    // 2. Loop through data
    filteredDonations.forEach((d, index) => {
      const rowClass = index % 2 === 0 ? 'row-even' : 'row-odd';
      const contributionLabel = t.contributionTypes?.[d.contributionType] || d.contributionType || '-';
      
      tableHTML += `
        <tr class="${rowClass}">
          <td class="cell">#${d.operationNumber}</td>
          <td class="cell">${formatDate(d.date)}</td>
          <td class="cell" style="font-weight:bold;">${d.donorName || t.guest}</td>
          <td class="cell">${contributionLabel}</td>
          <td class="cell amount">${d.amount}</td>
          <td class="cell">${d.paymentMethod} ${d.bankDetails ? `(${d.bankDetails})` : ''}</td>
          <td class="cell">${d.description || '-'}</td>
        </tr>
      `;
    });

    tableHTML += `
          </tbody>
        </table>
      </body>
      </html>
    `;

    // 3. Create Blob and Download
    const blob = new Blob([tableHTML], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Basmat_Khair_Donations_${new Date().toISOString().slice(0,10)}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto min-h-full pb-24" dir={t.dir}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
             <ListIcon className="text-emerald-600" />
             {t.history}
          </h2>
          <p className="text-slate-400 text-sm mt-1">{filteredDonations.length} {t.totalOps}</p>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          {/* SEARCH BAR */}
          <div className="relative flex-1 md:w-80">
            <Search className={`absolute ${t.dir === 'rtl' ? 'right-4' : 'left-4'} top-3.5 text-slate-400`} size={18} />
            <input 
              type="text" 
              placeholder={t.searchPlaceholder}
              className={`w-full ${t.dir === 'rtl' ? 'pr-11 pl-4' : 'pl-11 pr-4'} py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none shadow-sm transition`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* EXPORT BUTTON */}
          <button 
            onClick={handleExportExcel}
            title={t.exportSheet}
            className="px-4 py-3 bg-white border border-slate-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-200 rounded-xl shadow-sm transition flex items-center gap-2 font-bold"
          >
            <FileSpreadsheet size={20} />
            <span className="hidden sm:inline">{t.exportSheet?.split(' ')[0] || "Export"}</span>
          </button>
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
              <div className={`absolute ${t.dir === 'rtl' ? 'right-0 rounded-l-full' : 'left-0 rounded-r-full'} top-6 bottom-6 w-1 ${
                d.paymentMethod === 'Cash' ? 'bg-emerald-500' : 
                d.paymentMethod === 'Bank Transfer' ? 'bg-blue-500' : 'bg-orange-500'
              }`}></div>

              <div className={`flex flex-col md:flex-row gap-4 items-start md:items-center justify-between ${t.dir === 'rtl' ? 'pr-4' : 'pl-4'}`}>
                
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
                    {d.contributionType && (
                      <span className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-xs">
                         <Tag size={12} /> {t.contributionTypes?.[d.contributionType] || d.contributionType}
                      </span>
                    )}
                    {d.paymentMethod === 'Bank Transfer' && d.bankDetails && (
                       <span className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-xs">
                         <Banknote size={12} /> {d.bankDetails}
                       </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end mt-4 md:mt-0">
                  <div className="text-2xl font-black text-emerald-700 dir-ltr">
                    {formatMoney(d.amount)}
                  </div>
                  
                  <div className="relative">
                    <button 
                      onClick={(e) => toggleMenu(e, d.id)}
                      className={`p-2 rounded-lg transition ${openMenu === d.id ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
                    >
                      <MoreVertical size={20} />
                    </button>
                    
                    {openMenu === d.id && (
                      <div className={`absolute ${t.dir === 'rtl' ? 'left-0 origin-top-left' : 'right-0 origin-top-right'} top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-20 py-1 animate-in fade-in zoom-in-95`}>
                         <button 
                           onClick={() => onAction('view', d)}
                           className={`w-full ${t.dir === 'rtl' ? 'text-right' : 'text-left'} px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 hover:text-emerald-700 flex items-center gap-3 font-medium transition`}
                         >
                           <Eye size={16} /> {t.viewReceipt}
                         </button>
                         <button 
                           onClick={() => onAction('download', d)}
                           className={`w-full ${t.dir === 'rtl' ? 'text-right' : 'text-left'} px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 hover:text-emerald-700 flex items-center gap-3 font-medium transition`}
                         >
                           <Download size={16} /> {t.downloadPdf}
                         </button>
                         <button 
                           onClick={() => onAction('print', d)}
                           className={`w-full ${t.dir === 'rtl' ? 'text-right' : 'text-left'} px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 hover:text-emerald-700 flex items-center gap-3 font-medium transition`}
                         >
                           <Printer size={16} /> {t.printReceipt}
                         </button>
                         {isAdmin && (
                           <>
                             <div className="h-px bg-slate-100 my-1"></div>
                             <button 
                               onClick={() => onDelete(d.id)}
                               className={`w-full ${t.dir === 'rtl' ? 'text-right' : 'text-left'} px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 font-medium transition`}
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

const AddDonation = ({ onAdd, loading, t, userDisplayName }) => {
  const [formData, setFormData] = useState({
    donorName: '',
    phone: '',
    amount: '',
    method: 'Cash',
    contributionType: 'financial', // Default value
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
        setFormData({ 
          donorName: '', 
          phone: '', 
          amount: '', 
          method: 'Cash', 
          contributionType: 'financial', 
          bankDetails: '', 
          description: '' 
        });
        setShowConfirm(false);
      }
    });
  };

  const currentDate = new Date().toLocaleDateString(t.dir === 'rtl' ? 'ar-MA' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  // Reusable confirmation modal for Add Donation
  const ConfirmModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95">
        <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={32} />
        </div>
        <h3 className="text-xl font-bold text-center text-slate-800 mb-2">{t.confirmTitle}</h3>
        <p className="text-center text-slate-500 mb-6">{t.confirmMsg}</p>
        
        <div className="bg-slate-50 p-4 rounded-xl mb-6 space-y-3">
          <div className="flex justify-between">
            <span className="text-slate-500">{t.donorName}:</span>
            <span className="font-bold text-slate-800">{formData.donorName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">{t.amount}:</span>
            <span className="font-bold text-emerald-700 text-lg dir-ltr">{formatMoney(formData.amount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">{t.contributionType}:</span>
            <span className="font-bold text-slate-800">{t.contributionTypes[formData.contributionType]}</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={() => setShowConfirm(false)}
            className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition"
          >
            {t.btnCancel}
          </button>
          <button 
            onClick={handleFinalConfirm}
            className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition shadow-lg hover:shadow-emerald-500/20"
          >
            {t.btnConfirm}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 animate-in slide-in-from-bottom-4 pb-24" dir={t.dir}>
      
      {showConfirm && <ConfirmModal />}

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
                <div className={`absolute ${t.dir === 'rtl' ? 'right-4' : 'left-4'} top-3.5 text-slate-400 group-focus-within:text-emerald-500 transition`}>
                   <User size={18} />
                </div>
                <input 
                  type="text" required 
                  className={`w-full ${t.dir === 'rtl' ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition font-medium`}
                  value={formData.donorName}
                  onChange={e => setFormData({...formData, donorName: e.target.value})}
                  placeholder={t.donorName}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">{t.phone}</label>
              <div className="relative group">
                <div className={`absolute ${t.dir === 'rtl' ? 'right-4' : 'left-4'} top-3.5 text-slate-400 group-focus-within:text-emerald-500 transition`}>
                   <Phone size={18} />
                </div>
                <input 
                  type="tel" 
                  className={`w-full ${t.dir === 'rtl' ? 'pr-12 pl-4 text-right' : 'pl-12 pr-4 text-left'} py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition font-medium dir-ltr`}
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
            
            {/* NEW CONTRIBUTION TYPE FIELD */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">{t.contributionType}</label>
              <div className="relative">
                <ChevronDown className={`absolute ${t.dir === 'rtl' ? 'left-4' : 'right-4'} top-4 text-slate-400 pointer-events-none`} size={16} />
                <select 
                  className={`w-full ${t.dir === 'rtl' ? 'pr-4 pl-10' : 'pl-4 pr-10'} py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none appearance-none font-medium cursor-pointer`}
                  value={formData.contributionType}
                  onChange={e => setFormData({...formData, contributionType: e.target.value})}
                >
                  <option value="financial">{t.contributionTypes.financial}</option>
                  <option value="annual">{t.contributionTypes.annual}</option>
                  <option value="activity">{t.contributionTypes.activity}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Payment Method & Bank Details Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">{t.method}</label>
              <div className="relative">
                <ChevronDown className={`absolute ${t.dir === 'rtl' ? 'left-4' : 'right-4'} top-4 text-slate-400 pointer-events-none`} size={16} />
                <select 
                  className={`w-full ${t.dir === 'rtl' ? 'pr-4 pl-10' : 'pl-4 pr-10'} py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none appearance-none font-medium cursor-pointer`}
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

            {formData.method === 'Bank Transfer' && (
              <div className="animate-in fade-in slide-in-from-top-2 space-y-2">
                <label className="text-sm font-bold text-blue-600">{t.bankDetails}</label>
                <div className="relative group">
                   <div className={`absolute ${t.dir === 'rtl' ? 'right-4' : 'left-4'} top-3.5 text-blue-400 group-focus-within:text-blue-600 transition`}>
                      <CreditCard size={18} />
                   </div>
                   <input 
                    type="text" required
                    className={`w-full ${t.dir === 'rtl' ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-3 bg-blue-50/30 border border-blue-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-blue-900 font-medium transition`}
                    value={formData.bankDetails}
                    onChange={e => setFormData({...formData, bankDetails: e.target.value})}
                    placeholder={t.bankDetails}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">{t.description}</label>
            <textarea 
              rows="3"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition"
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              placeholder={t.description}
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
  const [lang, setLang] = useState('ar');
  const t = TRANSLATIONS[lang];
  
  const [userId, setUserId] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [view, setView] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [donations, setDonations] = useState([]);
  const [memberData, setMemberData] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // --- LOGIN FORM STATE ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSignIn = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const persistenceType = rememberMe ? browserLocalPersistence : browserSessionPersistence;
      await setPersistence(auth, persistenceType);

      await signInWithEmailAndPassword(auth, email.trim(), password);
      setEmail('');
      setPassword('');
    } catch (err) {
      console.error('Sign-in error:', err);
      setErrorMsg(t.invalidCreds || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };
  
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);

  // Receipt State
  const [receiptData, setReceiptData] = useState(null);
  const [autoPrint, setAutoPrint] = useState(false);

  const logoPath = 'https://raw.githubusercontent.com/Ramadane-abdelhay/basmatkhair/refs/heads/main/logo-basmat.png'; 

  // --- Auth & Data Fetching ---
  useEffect(() => {
    document.title = t.appTitle;
    document.documentElement.dir = t.dir;
  }, [lang, t]);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
        if (token) {
          await signInWithCustomToken(auth, token);
        } else {
          setAuthReady(true);
          setLoading(false);
        }
      } catch (err) {
         console.error(err);
         setAuthReady(true);
         setLoading(false);
      }
    };
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserId(user ? user.uid : null);
      setCurrentUser(user);
      setAuthReady(true);
      if(!user) {
        setLoading(false);
        setMemberData(null);
      }
    });

    initAuth();
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (authReady && userId) {
      setLoading(true);
      const memberRef = doc(db, `artifacts/${appId}/public/data/members`, userId);
      const unsubMember = onSnapshot(memberRef, (snap) => {
         if (snap.exists()) {
           setMemberData(snap.data());
           setIsAdmin(snap.data().isAdmin || false);
         } else {
            setMemberData(null);
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

  const displayMemberName = useMemo(() => {
    if (memberData && memberData.name) return memberData.name;
    if (currentUser && currentUser.email) return currentUser.email.split('@')[0];
    return t.guest;
  }, [memberData, currentUser, t.guest]);

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
        contributionType: data.contributionType, // Saved field
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
      setAutoPrint(type === 'print');
      setReceiptData(data);
      if(type === 'download') {
         // The modal itself handles the download button now
      }
    }
  };

  // --- LOGIN SCREEN (If not logged in) ---
  if (!userId) {
     return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 overflow-hidden relative" dir={t.dir}>
         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-600/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
         <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2"></div>

         <div className="relative z-10 bg-white/5 backdrop-blur-xl border border-white/10 p-12 rounded-3xl text-center max-w-md w-full shadow-2xl">
            <div className="w-24 h-24 bg-white rounded-full mx-auto mb-8 flex items-center justify-center shadow-lg shadow-emerald-900/50 overflow-hidden">
               <img src={logoPath} alt="Logo" className="w-20 h-20 object-contain" />
            </div>

            <h1 className="text-3xl font-bold text-white mb-2">{t.appTitle}</h1>
            <p className="text-emerald-200/80 mb-8 font-light">{t.loginSub}</p>

            <div className="space-y-4">

              <input
                type="email"
                placeholder={t.email || 'Email'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:ring-2 focus:ring-emerald-500 outline-none"
              />

              <input
                type="password"
                placeholder={t.password || 'Password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:ring-2 focus:ring-emerald-500 outline-none"
              />

              <div className="flex items-center gap-3 px-2">
                 <input 
                   type="checkbox" 
                   id="rememberMe"
                   checked={rememberMe}
                   onChange={(e) => setRememberMe(e.target.checked)}
                   className="w-4 h-4 rounded border-white/20 bg-white/10 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                 />
                 <label htmlFor="rememberMe" className="text-sm text-emerald-100/80 font-medium cursor-pointer select-none">
                   {t.rememberMe}
                 </label>
              </div>

              {errorMsg && (
                <div className="text-red-300 text-sm font-medium">{errorMsg}</div>
              )}

              <button 
                onClick={handleSignIn}
                disabled={loading}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-emerald-500/20 transition flex items-center justify-center gap-3"
              >
                {loading ? (
                   <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                ) : (
                   <>
                     <LogIn size={20} />
                     {t.btnEnter}
                   </>
                )}
              </button>

              <div className="pt-6 border-t border-white/10 flex justify-center">
                 <div className="w-40">
                   <LanguageSelector 
                      currentLang={lang} 
                      setLang={setLang} 
                      t={t} 
                      isOpen={isLangMenuOpen} 
                      setIsOpen={setIsLangMenuOpen} 
                      up={true}
                   />
                 </div>
              </div>
            </div>
         </div>
      </div>
     );
  }

  // --- LOGGED IN APP ---
  return (
    <div className={`min-h-screen bg-slate-50 flex font-sans text-slate-800 selection:bg-emerald-100 selection:text-emerald-900`} dir={t.dir}>
      
      {loading && <Preloader />}

      {receiptData && (
        <ReceiptModal 
          donation={receiptData} 
          onClose={() => setReceiptData(null)} 
          logoPath={logoPath}
          autoPrint={autoPrint}
          t={t}
          lang={lang}
        />
      )}

      {/* Sidebar (Desktop) */}
      <aside className={`hidden md:flex flex-col w-80 bg-white shadow-2xl z-30 sticky top-0 h-screen border-${t.dir === 'rtl' ? 'l' : 'r'} border-slate-100 print:hidden`}>
        <div className="p-10 flex flex-col items-center border-b border-slate-50 relative overflow-hidden">
          <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 via-emerald-600 to-emerald-800`}></div>
          <div className="w-24 h-24 mb-6 bg-white rounded-full p-2 shadow-lg border border-slate-100 flex items-center justify-center">
             <img src={logoPath} alt="Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-black text-center text-slate-900 leading-none">{t.appTitle}</h1>
          <p className="text-xs text-slate-400 mt-2 font-medium tracking-wide text-center">{t.subTitle}</p>
        </div>

        <nav className="flex-1 p-6 space-y-3 overflow-y-auto">
          <NavItem active={view === 'dashboard'} onClick={() => setView('dashboard')} icon={LayoutDashboard} label={t.dashboard} t={t} />
          <NavItem active={view === 'add'} onClick={() => setView('add')} icon={Plus} label={t.add} highlight t={t} />
          <NavItem active={view === 'list'} onClick={() => setView('list')} icon={ListIcon} label={t.history} t={t} />
        </nav>

        <div className="p-6 bg-slate-50 m-6 rounded-2xl border border-slate-100 shadow-inner space-y-4">
           
           <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
             <LanguageSelector 
               currentLang={lang} 
               setLang={setLang} 
               t={t} 
               isOpen={isLangMenuOpen} 
               setIsOpen={setIsLangMenuOpen} 
               up={true}
             />
           </div>

           <div className="flex items-center gap-4 px-2">
             <div className="w-10 h-10 rounded-full text-white flex items-center justify-center font-bold text-lg shadow-lg bg-gradient-to-br from-emerald-600 to-emerald-800 ring-2 ring-white">
               {displayMemberName.charAt(0).toUpperCase()}
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
          <div className={`fixed inset-0 z-50 flex ${t.dir === 'rtl' ? 'justify-end' : 'justify-start'}`}>
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
            <div className={`relative w-72 h-full bg-white shadow-2xl flex flex-col p-6 animate-in ${t.dir === 'rtl' ? 'slide-in-from-right' : 'slide-in-from-left'}`}>
               <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-4">
                 <span className="font-bold text-lg text-slate-800">{t.appTitle}</span>
                 <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-slate-100 text-slate-500 rounded-lg"><X size={20} /></button>
               </div>
               
               <div className="mb-6">
                 <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">{t.selectLang}</label>
                 <div className="flex gap-2">
                   {Object.keys(TRANSLATIONS).map(l => (
                     <button 
                       key={l}
                       onClick={() => setLang(l)} 
                       className={`flex-1 py-2 rounded-lg text-sm font-bold border ${lang === l ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-50 text-slate-600 border-slate-200'}`}
                     >
                       {l.toUpperCase()}
                     </button>
                   ))}
                 </div>
               </div>

               <nav className="space-y-2 flex-1">
                <MobileNavItem onClick={() => { setView('dashboard'); setIsMobileMenuOpen(false); }} label={t.dashboard} icon={LayoutDashboard} active={view === 'dashboard'} t={t} />
                <MobileNavItem onClick={() => { setView('add'); setIsMobileMenuOpen(false); }} label={t.add} icon={Plus} active={view === 'add'} t={t} />
                <MobileNavItem onClick={() => { setView('list'); setIsMobileMenuOpen(false); }} label={t.history} icon={ListIcon} active={view === 'list'} t={t} />
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

const NavItem = ({ active, onClick, icon: Icon, label, highlight, t }) => (
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
    <Icon size={22} className={`${active ? 'text-emerald-400' : highlight ? 'text-emerald-600' : 'text-slate-400 group-hover:text-slate-600'} ${t.dir === 'rtl' ? 'ml-4' : 'mr-4'} transition-colors`} />
    <span className="text-base">{label}</span>
    {active && <div className={`absolute ${t.dir === 'rtl' ? 'right-0 rounded-l-full' : 'left-0 rounded-r-full'} top-1/2 -translate-y-1/2 h-8 w-1 bg-emerald-500`}></div>}
  </button>
);

const MobileNavItem = ({ onClick, label, active, icon: Icon, t }) => (
  <button 
    onClick={onClick} 
    className={`w-full flex items-center gap-4 ${t.dir === 'rtl' ? 'text-right' : 'text-left'} p-4 rounded-xl text-lg font-bold transition ${active ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
  >
    <Icon size={20} className={active ? 'text-emerald-400' : 'text-slate-400'} />
    {label}
  </button>
);
