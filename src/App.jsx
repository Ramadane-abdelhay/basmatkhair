import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithCustomToken,
  signInWithEmailAndPassword,
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
  orderBy,
  getDoc,
  setDoc
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
  Phone,
  Printer,
  Check,
  FileText,
  MoreVertical,
  Download,
  Eye,
  Search,
  ChevronDown,
  LogIn,
  Lock
} from 'lucide-react';

// ==========================
//  Secure App (Email Auth)
// ==========================

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

// ✔️ Your logo from GitHub
const logoPath =
  "https://raw.githubusercontent.com/Ramadane-abdelhay/basmatkhair/refs/heads/main/logo-basmat.png";

// --- Minimal translations ---
const TRANSLATIONS = {
  en: {
    dir: 'ltr',
    appTitle: 'Basmat Khair',
    loginTitle: 'Member Portal',
    loginSub: 'Sign in to continue',
    btnEnter: 'Sign in',
    email: 'Email',
    password: 'Password',
    invalidCreds: 'Invalid email or password',
    signOut: 'Sign Out',
    memberResponsable: 'Member',
    editProfile: 'Edit Profile',
    save: 'Save'
  },
  ar: {
    dir: 'rtl',
    appTitle: 'جمعية بسمة خير',
    loginTitle: 'بوابة الأعضاء',
    loginSub: 'تسجيل الدخول للمتابعة',
    btnEnter: 'دخول النظام',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    invalidCreds: 'خطاء في البريد أو كلمة المرور',
    signOut: 'تسجيل الخروج',
    memberResponsable: 'المكلف',
    editProfile: 'تعديل الملف',
    save: 'حفظ'
  }
};

// --- Utilities ---
const formatMoney = (amount, currency = 'MAD', locale = 'ar-MA') =>
  new Intl.NumberFormat(locale, { style: 'currency', currency, minimumFractionDigits: 2 }).format(amount);

const formatDate = (date, locale = 'ar-MA') => {
  if (!date) return '';
  const dateObj = date.toDate ? date.toDate() : new Date(date);
  return dateObj.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const SimpleInput = ({ label, value, onChange, type = 'text' }) => (
  <div className="space-y-1">
    <label className="text-sm font-medium text-slate-700">{label}</label>
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full px-4 py-2 rounded-lg border border-slate-200"
    />
  </div>
);

// =======================================================================
//  MAIN APP
// =======================================================================

export default function App() {
  const [lang, setLang] = useState('ar');
  const t = TRANSLATIONS[lang];

  const [userId, setUserId] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('dashboard');

  // login form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [donations, setDonations] = useState([]);
  const [memberData, setMemberData] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);

  useEffect(() => {
    document.title = t.appTitle;
    document.documentElement.dir = t.dir;
  }, [lang]);

  useEffect(() => {
    const init = async () => {
      try {
        await setPersistence(auth, browserSessionPersistence);
      } catch (e) {
        console.warn("Persistence error:", e);
      }

      const unsub = onAuthStateChanged(auth, async (u) => {
        setUserId(u?.uid || null);
        setAuthReady(true);
        setLoading(false);

        if (u) {
          // load member profile
          const memberRef = doc(db, `artifacts/${appId}/public/data/members`, u.uid);
          const snap = await getDoc(memberRef);

          if (!snap.exists()) {
            const defaultName = u.email?.split('@')[0] || 'Member';
            await setDoc(memberRef, { name: defaultName, isAdmin: false });
            setMemberData({ name: defaultName, isAdmin: false });
            setIsAdmin(false);
          } else {
            const data = snap.data();
            setMemberData(data);
            setIsAdmin(!!data.isAdmin);
          }

          // donations listener
          const q = query(collection(db, `artifacts/${appId}/public/data/donations`));
          const unsubDon = onSnapshot(q, (snapshots) => {
            const list = snapshots.docs.map(d => ({
              id: d.id,
              ...d.data(),
              date: d.data().timestamp?.toDate?.() || d.data().timestamp
            }));
            list.sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0));
            setDonations(list);
          });

          u.__unsubDonations = unsubDon;

        } else {
          setMemberData(null);
          setIsAdmin(false);
          setDonations([]);
        }
      });

      return () => unsub();
    };

    init();
  }, []);

  // LOGIN (Email + Password)
  const handleSignIn = async () => {
    setLoading(true);
    setErrorMsg("");

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      setEmail("");
      setPassword("");
    } catch (err) {
      console.error(err);
      setErrorMsg(t.invalidCreds);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      if (userId && auth.currentUser?.__unsubDonations)
        auth.currentUser.__unsubDonations();
    } catch (_) {}
    await signOut(auth);
  };

  const handleAddDonation = async (data, cb) => {
    setLoading(true);
    try {
      const nextOp = donations.length
        ? Math.max(...donations.map(d => d.operationNumber || 0)) + 1
        : 1;

      await addDoc(collection(db, `artifacts/${appId}/public/data/donations`), {
        operationNumber: nextOp,
        donorName: data.donorName,
        phone: data.phone || '',
        amount: data.amount,
        paymentMethod: data.method || 'Cash',
        bankDetails: data.bankDetails || '',
        description: data.description || '',
        createdBy: userId,
        memberName: memberData?.name || email.split('@')[0],
        timestamp: serverTimestamp()
      });

      cb(true);

    } catch (e) {
      console.error(e);
      cb(false);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this record?")) return;

    try {
      await deleteDoc(doc(db, `artifacts/${appId}/public/data/donations`, id));
    } catch (e) {
      console.error(e);
    }
  };

  const updateProfileName = async (newName) => {
    if (!userId) return;

    const ref = doc(db, `artifacts/${appId}/public/data/members`, userId);
    try {
      await setDoc(ref, { ...memberData, name: newName }, { merge: true });
      setMemberData(prev => ({ ...prev, name: newName }));
    } catch (e) {
      console.error(e);
    }
  };

  // ==================================================================================
  //  LOGIN SCREEN
  // ==================================================================================

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 overflow-hidden relative" dir={t.dir}>

        {/* Blurry Backgrounds */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-600/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2"></div>

        {/* Card */}
        <div className="relative z-10 bg-white/5 backdrop-blur-xl border border-white/10 p-12 rounded-3xl max-w-md w-full text-center shadow-2xl">

          {/* Logo Section */}
          <div className="w-24 h-24 bg-white rounded-full mx-auto mb-8 flex items-center justify-center shadow-lg shadow-emerald-900/50 overflow-hidden">
            <img
              src={logoPath}
              alt="Logo"
              className="w-20 h-20 object-contain"
            />
          </div>

          <h1 className="text-3xl font-bold text-white mb-2">{t.appTitle}</h1>
          <p className="text-emerald-200/80 mb-8 font-light">{t.loginSub}</p>

          {/* Email/Password Inputs */}
          <div className="space-y-4">

            <input
              type="email"
              placeholder={t.email}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:ring-2 focus:ring-emerald-500 outline-none"
            />

            <input
              type="password"
              placeholder={t.password}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:ring-2 focus:ring-emerald-500 outline-none"
            />

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

            {/* Language Selector */}
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

  // ==================================================================================
  // MAIN APP LAYOUT
  // ==================================================================================

  const displayMemberName =
    memberData?.name || (auth.currentUser?.email?.split('@')[0] ?? 'Member');

  return (
    <div className="min-h-screen flex" dir={t.dir}>

      {/* Sidebar */}
      <aside className="w-72 bg-white border-r p-6 hidden md:block">
        <h2 className="font-bold text-xl mb-2">{t.appTitle}</h2>
        <p className="text-sm text-slate-500 mb-4">{t.loginSub}</p>

        <div className="mb-4">
          <div className="font-medium">{displayMemberName}</div>
          <div className="text-xs text-slate-400">{isAdmin ? "Admin" : "Member"}</div>
        </div>

        <nav className="space-y-2">
          <button
            onClick={() => setView('dashboard')}
            className={`w-full text-left py-2 px-3 rounded ${view === 'dashboard' ? 'bg-slate-100' : ''}`}
          >
            Dashboard
          </button>

          <button
            onClick={() => setView('add')}
            className={`w-full text-left py-2 px-3 rounded ${view === 'add' ? 'bg-slate-100' : ''}`}
          >
            New Donation
          </button>

          <button
            onClick={() => setView('list')}
            className={`w-full text-left py-2 px-3 rounded ${view === 'list' ? 'bg-slate-100' : ''}`}
          >
            History
          </button>
        </nav>

        <div className="mt-6">
          <button
            onClick={handleSignOut}
            className="w-full py-2 rounded bg-red-50 text-red-600 font-bold flex items-center justify-center gap-2"
          >
            <LogOut size={14} /> {t.signOut}
          </button>
        </div>

        <div className="mt-6">
          <label className="text-xs text-slate-400">Language</label>
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            className="w-full mt-2 p-2 border rounded"
          >
            <option value="ar">العربية</option>
            <option value="en">English</option>
          </select>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6">

        {view === 'dashboard' && (
          <div>
            <h3 className="text-2xl font-bold mb-4">Dashboard</h3>
            <div className="bg-white p-6 rounded shadow">
              Total donations:{" "}
              {formatMoney(
                donations.reduce((sum, d) => sum + (d.amount || 0), 0)
              )}
            </div>
          </div>
        )}

        {view === 'add' && (
          <div>
            <h3 className="text-2xl font-bold mb-4">Record Donation</h3>
            <AddDonation
              onAdd={handleAddDonation}
              loading={loading}
              memberName={displayMemberName}
            />
          </div>
        )}

        {view === 'list' && (
          <div>
            <h3 className="text-2xl font-bold mb-4">Donations</h3>
            <DonationList donations={donations} onDelete={handleDelete} />
          </div>
        )}

        {/* Profile */}
        <div className="mt-8 bg-white p-4 rounded shadow">
          <h4 className="font-bold mb-2">Profile</h4>
          <ProfileEditor
            currentName={displayMemberName}
            onSave={updateProfileName}
          />
        </div>
      </main>
    </div>
  );
}

// =======================================================================
//  SUBCOMPONENTS
// =======================================================================

const AddDonation = ({ onAdd, loading, memberName }) => {
  const [form, setForm] = useState({
    donorName: '',
    phone: '',
    amount: '',
    method: 'Cash',
    bankDetails: '',
    description: ''
  });

  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setConfirmOpen(true);
  };

  const handleConfirm = () => {
    const amt = parseFloat(form.amount);
    if (!amt || amt <= 0) return alert("Invalid amount");

    onAdd({ ...form, amount: amt, memberName }, (ok) => {
      if (ok) {
        setForm({
          donorName: '',
          phone: '',
          amount: '',
          method: 'Cash',
          bankDetails: '',
          description: ''
        });
        setConfirmOpen(false);
      }
    });
  };

  return (
    <div className="bg-white p-6 rounded shadow">
      <form onSubmit={handleSubmit} className="space-y-4">

        <SimpleInput
          label="Donor Name"
          value={form.donorName}
          onChange={(v) => setForm({ ...form, donorName: v })}
        />

        <SimpleInput
          label="Amount"
          type="number"
          value={form.amount}
          onChange={(v) => setForm({ ...form, amount: v })}
        />

        <div className="flex gap-2">
          <button
            type="submit"
            className="px-4 py-2 rounded bg-emerald-600 text-white"
          >
            Save
          </button>

          <div className="text-slate-500 px-4 py-2">
            Recorded by: <strong>{memberName}</strong>
          </div>
        </div>
      </form>

      {confirmOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30">
          <div className="bg-white p-6 rounded shadow">
            <p className="mb-4">Confirm saving donation?</p>

            <div className="flex gap-2">
              <button
                onClick={handleConfirm}
                className="px-4 py-2 rounded bg-emerald-600 text-white"
              >
                Confirm
              </button>

              <button
                onClick={() => setConfirmOpen(false)}
                className="px-4 py-2 rounded border"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const DonationList = ({ donations, onDelete }) => (
  <div className="space-y-3">
    {donations.length === 0 && (
      <div className="text-slate-400">No donations yet.</div>
    )}

    {donations.map((d) => (
      <div
        key={d.id}
        className="bg-white p-3 rounded shadow flex justify-between items-center"
      >
        <div>
          <div className="font-bold">{d.donorName}</div>

          <div className="text-xs text-slate-400">
            By: {d.memberName} — {formatDate(d.date)}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="font-bold">{formatMoney(d.amount)}</div>

          <button
            onClick={() => onDelete(d.id)}
            className="text-red-600"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    ))}
  </div>
);

const ProfileEditor = ({ currentName, onSave }) => {
  const [name, setName] = useState(currentName);

  useEffect(() => setName(currentName), [currentName]);

  return (
    <div className="flex gap-2 items-center">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="p-2 border rounded"
      />

      <button
        onClick={() => onSave(name)}
        className="px-3 py-2 bg-emerald-600 text-white rounded"
      >
        Save
      </button>
    </div>
  );
};
