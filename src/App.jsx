import React, { useState, useEffect, useMemo } from 'react';
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
  setDoc,
  deleteDoc
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
  CheckCircle,
  Users,
  Shield,
  Trash2,
  Globe,
  Menu,
  X,
  AlertTriangle 
} from 'lucide-react';

// --- 1. CONFIGURATION & SETUP ---

// --- 1. CONFIGURATION & SETUP ---

// Use Vite/Vercel standard environment variables
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

// Use a fixed string for your App ID 
const appId = 'basmat-khair-app';

// --- 2. TRANSLATIONS & BRANDING ---

const BRAND = {
  main: '#2f7c32',   // Green
  second: '#f07012', // Orange
};

const TRANSLATIONS = {
  ar: {
    appTitle: "جمعية بسمة خير : التبرعات",
    dashboard: "لوحة التحكم",
    add: "إضافة تبرع",
    history: "سجل التبرعات",
    members: "الأعضاء",
    signOut: "تسجيل الخروج",
    welcome: "مرحباً",
    guest: "زائر",
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
    amount: "المبلغ (درهم مغربي)",
    method: "طريقة الدفع",
    description: "ملاحظات / وصف",
    btnRecord: "حفظ التبرع",
    btnSaving: "جاري الحفظ...",
    methods: {
      cash: "نقداً",
      transfer: "تحويل بنكي",
      check: "شيك",
      other: "أخرى"
    },
    errorAmount: "المرجو إدخال مبلغ صحيح أكبر من 0",
    successMsg: "تم تسجيل التبرع بنجاح",
    // History List
    opNumber: "رقم العملية",
    receivedBy: "استلمها",
    deleteConfirm: "اكتب 'DELETE' لتأكيد حذف هذا التبرع.",
    // Login
    loginTitle: "تسجيل الدخول",
    emailLabel: "البريد الإلكتروني",
    passLabel: "كلمة المرور",
    btnLogin: "دخول",
    btnLogging: "جاري التحقق...",
    loginFooter: "نظام محمي - جمعية بسمة خير",
    authError: "خطأ في الاتصال أو المصادقة. يرجى التحقق من المفاتيح أو محاولة تحديث الصفحة."
  },
  fr: {
    appTitle: "Basmat Khair : Donations",
    dashboard: "Tableau de bord",
    add: "Ajouter un don",
    history: "Historique",
    members: "Membres",
    signOut: "Déconnexion",
    welcome: "Bienvenue",
    guest: "Invité",
    roleAdmin: "Admin",
    roleMember: "Membre",
    // Dashboard
    totalCollected: "Total Collecté",
    totalOps: "Opérations",
    uniqueDonors: "Donateurs Uniques",
    collectedByMember: "Collecté par Membre",
    recentActivity: "Activité Récente",
    noData: "Aucune donnée disponible.",
    // Add Form
    recordTitle: "Enregistrer un nouveau don",
    donorName: "Nom complet du donateur",
    amount: "Montant (MAD)",
    method: "Méthode de paiement",
    description: "Description / Notes",
    btnRecord: "Enregistrer",
    btnSaving: "Enregistrement...",
    methods: {
      cash: "Espèces",
      transfer: "Virement Bancaire",
      check: "Chèque",
      other: "Autre"
    },
    errorAmount: "Veuillez entrer un montant valide supérieur à 0",
    successMsg: "Don enregistré avec succès",
    // History List
    opNumber: "Opération N°",
    receivedBy: "Reçu par",
    deleteConfirm: "Tapez 'DELETE' pour confirmer la suppression.",
    // Login
    loginTitle: "Connexion",
    emailLabel: "Email",
    passLabel: "Mot de passe",
    btnLogin: "Se connecter",
    btnLogging: "Vérification...",
    loginFooter: "Système protégé - Association Basmat Khair",
    authError: "Erreur de connexion ou d'authentification. Veuillez vérifier les clés ou actualiser la page."
  },
  en: {
    appTitle: "Basmat Khair : Donations",
    dashboard: "Dashboard",
    add: "Add Donation",
    history: "History",
    members: "Members",
    signOut: "Sign Out",
    welcome: "Welcome",
    guest: "Guest",
    roleAdmin: "Admin",
    roleMember: "Member",
    // Dashboard
    totalCollected: "Total Collected",
    totalOps: "Operations",
    uniqueDonors: "Unique Donors",
    collectedByMember: "Collected by Member",
    recentActivity: "Recent Activity",
    noData: "No data available.",
    // Add Form
    recordTitle: "Record New Donation",
    donorName: "Donor Full Name",
    amount: "Amount (MAD)",
    method: "Payment Method",
    description: "Description / Notes",
    btnRecord: "Save Donation",
    btnSaving: "Saving...",
    methods: {
      cash: "Cash",
      transfer: "Bank Transfer",
      check: "Check",
      other: "Other"
    },
    errorAmount: "Please enter a valid amount greater than 0",
    successMsg: "Donation recorded successfully",
    // History List
    opNumber: "Operation #",
    receivedBy: "Received By",
    deleteConfirm: "Type 'DELETE' to confirm deletion.",
    // Login
    loginTitle: "Sign In",
    emailLabel: "Email Address",
    passLabel: "Password",
    btnLogin: "Login",
    btnLogging: "Verifying...",
    loginFooter: "Protected System - Basmat Khair Association",
    authError: "Connection or authentication error. Please check keys or try refreshing the page."
  }
};

// --- 3. SUB-COMPONENTS ---

// --- Logo Path Resolver (NEW FUNCTION) ---
const getLogoPath = (lang) => {
    // Use Arabic logo for Arabic language, default logo for others
    return lang === 'ar' ? '/assets/logo-ar.png' : '/assets/logo.png';
};


// --- Language Switcher ---
const LangSwitcher = ({ current, onChange }) => (
  <div className="flex gap-2">
    {['ar', 'fr', 'en'].map(lang => (
      <button
        key={lang}
        onClick={() => onChange(lang)}
        className={`px-2 py-1 text-xs font-bold rounded uppercase transition ${
          current === lang 
          ? 'text-white shadow-sm' 
          : 'bg-white/50 text-slate-600 hover:bg-white'
        }`}
        style={{ backgroundColor: current === lang ? BRAND.second : '' }}
      >
        {lang}
      </button>
    ))}
  </div>
);

// --- Login/Loading Component ---
const InitialScreen = ({ loading, error, lang, setLang, t }) => {
    // Uses the new dynamic path function
    const logoPath = getLogoPath(lang);
    
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            <div className="w-full max-w-sm bg-white p-8 rounded-2xl shadow-2xl border-t-4" style={{ borderColor: BRAND.main }}>
                
                {/* Logo Area */}
                <div className="text-center mb-8">
                    {/* This container defines the maximum size (w-48 h-16) */}
                    <div className="mx-auto w-48 h-16 mb-4 relative flex items-center justify-center">
                        {/* Image tag with scaling classes: w-full h-full object-contain */}
                        <img 
                            src={logoPath} 
                            alt="Basmat Khair Logo" 
                            className="w-full h-full object-contain" 
                            onError={(e) => {e.target.onerror = null; e.target.src = "https://placehold.co/1080x350/2f7c32/ffffff?text=Logo";}} 
                        />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800">{t.appTitle}</h2>
                    <div className="mt-4 flex justify-center">
                        <LangSwitcher current={lang} onChange={setLang} />
                    </div>
                </div>
                
                {error ? (
                    <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-6 text-sm text-center border border-red-100 flex items-center justify-center gap-2">
                        <AlertTriangle size={18} /> {t.authError}
                    </div>
                ) : (
                    <div className="text-center text-slate-500 font-medium">
                        <div className="animate-spin inline-block w-8 h-8 border-4 border-t-4 border-slate-200 rounded-full" style={{ borderTopColor: BRAND.main }}></div>
                        <p className="mt-4">{loading ? t.btnLogging : "Initializing..."}</p>
                    </div>
                )}
                
                <p className="mt-8 text-center text-xs text-slate-400">{t.loginFooter}</p>
            </div>
        </div>
    );
};

// --- Dashboard Component ---
const Dashboard = ({ donations, memberData, t, lang }) => {
  const total = donations.reduce((sum, d) => sum + d.amount, 0);
  // Get unique donor names, but only count donations that have a non-empty name
  const uniqueDonors = new Set(donations.filter(d => d.donorName).map(d => d.donorName)).size;
  
  // Calculate Member Stats
  const memberStats = useMemo(() => {
    const stats = {};
    donations.forEach(d => {
      const name = d.memberName || t.guest;
      if (!stats[name]) stats[name] = 0;
      stats[name] += d.amount;
    });
    return Object.entries(stats).sort((a, b) => b[1] - a[1]);
  }, [donations, t.guest]);

  const recentDonations = donations.slice(0, 5);
  
  const formatMoney = (amount) => 
    new Intl.NumberFormat(lang === 'ar' ? 'ar-MA' : 'fr-MA', { 
      style: 'currency', 
      currency: 'MAD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-500">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Collected - Main Card */}
        <div className="md:col-span-3 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden" 
             style={{ background: `linear-gradient(135deg, ${BRAND.main}, ${BRAND.second})` }}>
          <div className="relative z-10">
            <p className="text-white/80 font-medium mb-1 text-lg">{t.totalCollected}</p>
            <h2 className="text-5xl font-extrabold tracking-tight">{formatMoney(total)}</h2>
          </div>
          <Coins className="absolute right-4 bottom-4 text-white/20 w-32 h-32 transform rotate-12" />
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-sm font-medium">{t.totalOps}</p>
            <p className="text-2xl font-bold text-slate-800">{donations.length}</p>
          </div>
          <div className="p-3 rounded-full bg-blue-50 text-blue-600"><Receipt size={24} /></div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-sm font-medium">{t.uniqueDonors}</p>
            <p className="text-2xl font-bold text-slate-800">{uniqueDonors}</p>
          </div>
          <div className="p-3 rounded-full bg-purple-50 text-purple-600"><Users size={24} /></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Member Performance Tab */}
        <div className="bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
              <Shield size={20} style={{ color: BRAND.second }} />
              {t.collectedByMember}
            </h3>
          </div>
          <div className="divide-y divide-slate-100">
            {memberStats.length === 0 ? (
               <div className="p-8 text-center text-slate-400">{t.noData}</div>
            ) : (
              memberStats.map(([name, amount], idx) => (
                <div key={name} className="p-4 flex items-center justify-between hover:bg-slate-50 transition">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${idx < 3 ? 'text-white' : 'bg-slate-100 text-slate-500'}`}
                         style={{ backgroundColor: idx < 3 ? BRAND.main : '' }}>
                      {idx + 1}
                    </div>
                    <span className="font-medium text-slate-700">{name}</span>
                  </div>
                  <span className="font-bold" style={{ color: BRAND.main }}>{formatMoney(amount)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
              <Calendar size={20} style={{ color: BRAND.second }} />
              {t.recentActivity}
            </h3>
          </div>
          <div className="divide-y divide-slate-100">
            {recentDonations.length === 0 ? (
               <div className="p-8 text-center text-slate-400">{t.noData}</div>
            ) : (
              recentDonations.map(d => (
                <div key={d.id} className="p-4 hover:bg-slate-50 transition">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-slate-800">{d.donorName || t.guest}</span>
                    <span className="font-bold text-sm" style={{ color: BRAND.main }}>+{formatMoney(d.amount)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-500">
                    <span>{t.receivedBy}: {d.memberName}</span>
                    <span>{d.date ? new Date(d.date).toLocaleDateString(lang === 'ar' ? 'ar-MA' : 'fr-FR') : ''}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Donation List Component (Redesigned) ---
const DonationList = ({ donations, t, lang, userId, isAdmin, onDelete }) => {
  const formatMoney = (amount) => 
    new Intl.NumberFormat(lang === 'ar' ? 'ar-MA' : 'fr-MA', { 
      style: 'currency', 
      currency: 'MAD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);

  return (
    <div className="p-6 md:p-8 bg-slate-100 min-h-full">
      <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <ListIcon style={{ color: BRAND.second }} />
        {t.history}
      </h2>
      
      <div className="space-y-5">
        {donations.length === 0 ? (
          <div className="text-center py-12 text-slate-400 bg-white rounded-xl border border-dashed border-slate-300">
            {t.noData}
          </div>
        ) : (
          donations.map((d, index) => (
            <div 
              key={d.id} 
              // Older donations are at the bottom, so use index to represent relative age
              className="bg-white rounded-xl p-6 shadow-md border-l-4 relative"
              style={{ 
                borderLeftColor: d.paymentMethod === 'Cash' ? BRAND.main : BRAND.second,
                marginBottom: index < donations.length - 1 ? '20px' : undefined // 20px separator
              }}
            >
              {/* Top Row: Op Number & Date */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.opNumber} #{d.operationNumber}</span>
                  <h3 className="text-xl font-bold text-slate-800 mt-1">{d.donorName || t.guest}</h3>
                </div>
                <div className="text-right">
                   <div className="font-bold text-xl" style={{ color: BRAND.main }}>
                     {formatMoney(d.amount)}
                   </div>
                   <span className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-600 font-medium inline-block mt-1">
                     {t.methods[d.paymentMethod.toLowerCase().replace(/\s/g, '')] || d.paymentMethod}
                   </span>
                </div>
              </div>

              {/* Middle Row: Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <User size={16} className="text-slate-400" />
                  <span>
                    <span className="font-semibold">{t.receivedBy}: </span> 
                    {d.memberName}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-slate-400" />
                  <span>
                    {d.date ? new Date(d.date).toLocaleDateString(lang === 'ar' ? 'ar-MA' : 'fr-FR', {
                      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                    }) : ''}
                  </span>
                </div>
                {d.description && (
                  <div className="flex items-center gap-2 md:col-span-2">
                    <Receipt size={16} className="text-slate-400" />
                    <span className="italic">{d.description}</span>
                  </div>
                )}
              </div>

              {/* Delete Button (If Admin or Creator) */}
              {(isAdmin || d.createdBy === userId) && (
                <button 
                  onClick={() => onDelete(d.id)}
                  className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 transition"
                  title="Delete Donation"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// --- Add Donation Form ---
const AddDonation = ({ onAdd, loading, t, lang }) => {
  const [formData, setFormData] = useState({
    donorName: '',
    amount: '',
    method: 'Cash',
    description: ''
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    const amountFloat = parseFloat(formData.amount);
    
    if (isNaN(amountFloat) || amountFloat <= 0) {
      setMessage({ type: 'error', text: t.errorAmount });
      return;
    }
    onAdd(formData, (success) => {
      if (success) {
        setMessage({ type: 'success', text: t.successMsg });
        setFormData({ donorName: '', amount: '', method: 'Cash', description: '' });
      } else {
        setMessage({ type: 'error', text: "Error saving donation." });
      }
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-6 animate-in slide-in-from-bottom-4">
      <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
        <div className="p-6 text-white text-center" style={{ backgroundColor: BRAND.main }}>
          <Plus className="mx-auto h-12 w-12 mb-2 opacity-80" />
          <h2 className="text-2xl font-bold">{t.recordTitle}</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {message.text && (
            <div className={`p-3 rounded text-sm text-center ${message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
              {message.text}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">{t.donorName}</label>
            <input 
              type="text" required 
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 outline-none"
              style={{ '--tw-ring-color': BRAND.main }}
              value={formData.donorName}
              onChange={e => setFormData({...formData, donorName: e.target.value})}
              placeholder={t.guest}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">{t.amount}</label>
              <div className="relative">
                 <input 
                  type="number" step="0.01" required 
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 outline-none font-mono text-lg"
                  style={{ '--tw-ring-color': BRAND.main }}
                  value={formData.amount}
                  onChange={e => setFormData({...formData, amount: e.target.value})}
                  min="0.01"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">{t.method}</label>
              <select 
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 outline-none bg-white"
                style={{ '--tw-ring-color': BRAND.main }}
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

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">{t.description}</label>
            <textarea 
              rows="3"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 outline-none"
              style={{ '--tw-ring-color': BRAND.main }}
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              placeholder={t.description}
            ></textarea>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 rounded-xl font-bold text-white text-lg shadow-lg hover:shadow-xl transition transform active:scale-[0.98]"
            style={{ backgroundColor: BRAND.second }}
          >
            {loading ? t.btnSaving : t.btnRecord}
          </button>
        </form>
      </div>
    </div>
  );
};


// --- 4. MAIN APP COMPONENT ---
export default function App() {
  const [lang, setLang] = useState(localStorage.getItem('app_lang') || 'ar');
  const [userId, setUserId] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [view, setView] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [donations, setDonations] = useState([]);
  const [memberData, setMemberData] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [authError, setAuthError] = useState(false);

  // Helper to get current translation
  const t = TRANSLATIONS[lang];
  // Uses the new dynamic path function
  const logoPath = getLogoPath(lang);

  // --- Effects ---

  // 1. Branding & Head Tags
  useEffect(() => {
    // Set Title
    document.title = t.appTitle;
    localStorage.setItem('app_lang', lang);
    
    // Set RTL/LTR direction
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang, t.appTitle]);

  // 2. Auth Initialization (Runs once)
  useEffect(() => {
    const initAuth = async () => {
      try {
        await setPersistence(auth, browserSessionPersistence);
        const token = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
        
        if (token) {
          await signInWithCustomToken(auth, token);
        } else {
          // Fallback to anonymous sign-in if no token is provided
          await signInAnonymously(auth);
        }
      } catch (err) {
         console.error("Firebase Auth initialization error:", err);
         setAuthError(true);
      }
    };
    
    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
      }
      setAuthReady(true);
      setLoading(false);
    });

    initAuth();
    return () => unsubscribe();
  }, []);

  // 3. Member Data (Runs when auth is ready)
  useEffect(() => {
    if (authReady && userId) {
      // Look up member data in the public collection
      const memberDocRef = doc(db, `artifacts/${appId}/public/data/members`, userId);
       const unsub = onSnapshot(memberDocRef, (snap) => {
         if (snap.exists()) {
           setMemberData(snap.data());
           setIsAdmin(snap.data().isAdmin || false);
         } else {
            // For new users or if member data is missing, use a default
            setMemberData({ name: t.guest, isAdmin: false });
            setIsAdmin(false);
         }
       });
       return () => unsub();
    }
  }, [authReady, userId, t.guest]);

  // 4. Donations Data (Runs when auth is ready)
  useEffect(() => {
    if (authReady && userId) {
      const q = query(collection(db, `artifacts/${appId}/public/data/donations`));
      const unsub = onSnapshot(q, (snap) => {
        const list = snap.docs.map(d => ({ 
          id: d.id, 
          ...d.data(),
          // Convert Firestore Timestamp to Date object, fall back gracefully
          date: d.data().timestamp?.toDate ? d.data().timestamp.toDate() : d.data().timestamp
        }));
        // Sort DESC by timestamp (Newest First) in memory
        list.sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0));
        setDonations(list);
      });
      return () => unsub();
    }
  }, [authReady, userId]);

  // --- Handlers ---

  const handleSignOut = () => {
    signOut(auth).then(() => {
      // After sign out, the onAuthStateChanged listener handles the state change
      setView('dashboard');
    }).catch((error) => {
      console.error("Sign Out Error:", error);
    });
  };


  const handleAdd = async (data, callback) => {
    setLoading(true);
    try {
      // Get the next operation number
      const nextOpNumber = donations.length > 0 ? donations[0].operationNumber + 1 : 1; 
      
      await addDoc(collection(db, `artifacts/${appId}/public/data/donations`), {
        operationNumber: nextOpNumber,
        donorName: data.donorName || t.guest,
        amount: parseFloat(data.amount),
        paymentMethod: data.method,
        description: data.description,
        createdBy: userId,
        memberName: memberData?.name || t.guest,
        timestamp: serverTimestamp()
      });
      setView('list');
      callback(true);
    } catch (err) {
      console.error("Error adding donation:", err);
      callback(false);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if(confirm(t.deleteConfirm)) {
      try {
        await deleteDoc(doc(db, `artifacts/${appId}/public/data/donations`, id));
      } catch(err) {
        console.error("Error deleting donation:", err);
      }
    }
  };

  // --- Render ---
  if (loading || !authReady || authError) {
    return <InitialScreen loading={loading} error={authError} lang={lang} setLang={setLang} t={t} />;
  }
  
  // Use a fallback member name if not fully loaded/set
  const displayMemberName = memberData?.name || t.guest;

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex flex-col w-72 bg-white shadow-xl z-20 sticky top-0 h-screen">
        <div className="p-6 flex flex-col items-center border-b border-slate-100">
          <div className="mx-auto w-48 h-16 mb-3 relative flex items-center justify-center">
            {/* Logo Image - Scaled down to fit container */}
            <img 
              src={logoPath} 
              alt="Logo" 
              className="w-full h-full object-contain" 
              onError={(e) => {e.target.onerror = null; e.target.src = "https://placehold.co/1080x350/2f7c32/ffffff?text=Logo";}}
            />
          </div>
          <h1 className="text-lg font-bold text-center text-slate-800 leading-tight">{t.appTitle}</h1>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <NavItem active={view === 'dashboard'} onClick={() => setView('dashboard')} icon={LayoutDashboard} label={t.dashboard} color={BRAND.main} />
          <NavItem active={view === 'add'} onClick={() => setView('add')} icon={Plus} label={t.add} color={BRAND.second} />
          <NavItem active={view === 'list'} onClick={() => setView('list')} icon={ListIcon} label={t.history} color={BRAND.main} />
        </nav>

        <div className="p-4 border-t border-slate-100 bg-slate-50">
           <div className="flex items-center gap-3 mb-4">
             <div className="w-10 h-10 rounded-full text-white flex items-center justify-center font-bold text-sm" style={{ backgroundColor: BRAND.second }}>
               {displayMemberName.charAt(0)}
             </div>
             <div>
               <p className="text-sm font-bold text-slate-800">{displayMemberName}</p>
               <p className="text-xs text-slate-500">{isAdmin ? t.roleAdmin : t.roleMember}</p>
             </div>
           </div>
           
           <LangSwitcher current={lang} onChange={setLang} />
           
           <button onClick={handleSignOut} className="flex items-center gap-2 text-red-500 text-sm font-bold mt-4 hover:bg-red-50 p-2 rounded w-full transition">
             <LogOut size={16} /> {t.signOut}
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden bg-white p-4 shadow-sm flex justify-between items-center z-20">
           {/* Logo Image for Mobile Header */}
           <img 
              src={logoPath} 
              alt="Logo" 
              className="h-10 w-auto" // Use w-auto here to respect aspect ratio in the small header
              onError={(e) => {e.target.onerror = null; e.target.src = "https://placehold.co/100x35/2f7c32/ffffff?text=Logo";}}
            />
           <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
             {isMobileMenuOpen ? <X /> : <Menu />}
           </button>
        </header>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 bg-white z-50 p-6 flex flex-col md:hidden">
            <div className="flex justify-between items-center mb-8">
               <h2 className="text-xl font-bold">{t.appTitle}</h2>
               <button onClick={() => setIsMobileMenuOpen(false)}><X /></button>
            </div>
            <nav className="space-y-4 flex-1">
              <MobileNavItem onClick={() => { setView('dashboard'); setIsMobileMenuOpen(false); }} label={t.dashboard} active={view === 'dashboard'} />
              <MobileNavItem onClick={() => { setView('add'); setIsMobileMenuOpen(false); }} label={t.add} active={view === 'add'} />
              <MobileNavItem onClick={() => { setView('list'); setIsMobileMenuOpen(false); }} label={t.history} active={view === 'list'} />
            </nav>
            <div className="mt-auto pt-8 border-t">
              <LangSwitcher current={lang} onChange={setLang} />
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto bg-slate-100">
          {view === 'dashboard' && <Dashboard donations={donations} memberData={memberData} t={t} lang={lang} />}
          {view === 'add' && <AddDonation onAdd={handleAdd} loading={loading} t={t} lang={lang} />}
          {view === 'list' && <DonationList donations={donations} t={t} lang={lang} userId={userId} isAdmin={isAdmin} onDelete={handleDelete} />}
        </div>
      </main>

    </div>
  );
}

// --- Helper Components ---
const NavItem = ({ active, onClick, icon: Icon, label, color }) => (
  <button
    onClick={onClick}
    className={`flex items-center w-full p-3 rounded-xl transition-all duration-200 ${
      active ? 'bg-white shadow-md font-bold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
    }`}
    style={active ? { color: color, borderLeft: `4px solid ${color}` } : {}}
  >
    <Icon size={20} className={active ? '' : 'text-slate-400'} style={active ? { marginInlineStart: '8px' } : { margin: '0 8px' }} />
    <span className="mx-2">{label}</span>
  </button>
);

const MobileNavItem = ({ onClick, label, active }) => (
  <button 
    onClick={onClick} 
    className={`w-full text-start p-4 rounded-lg text-lg font-bold ${active ? 'bg-slate-100 text-slate-900' : 'text-slate-500'}`}
  >
    {label}
  </button>
);