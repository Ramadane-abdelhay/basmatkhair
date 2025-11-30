import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
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

// --- Minimal translations (kept from original for simplicity) ---
const TRANSLATIONS = {
  en: { dir: 'ltr', appTitle: 'Basmat Khair', loginTitle: 'Member Portal', loginSub: 'Sign in to continue', btnEnter: 'Sign in', email: 'Email', password: 'Password', signOut: 'Sign Out', memberResponsable: 'Member', editProfile: 'Edit Profile', save: 'Save' },
  ar: { dir: 'rtl', appTitle: 'جمعية بسمة خير', loginTitle: 'بوابة الأعضاء', loginSub: 'تسجيل الدخول للمتابعة', btnEnter: 'دخول النظام', email: 'البريد الإلكتروني', password: 'كلمة المرور', signOut: 'تسجيل الخروج', memberResponsable: 'المكلف', editProfile: 'تعديل الملف', save: 'حفظ' }
};

// --- Utilities ---
const formatMoney = (amount, currency = 'MAD', locale = 'ar-MA') =>
  new Intl.NumberFormat(locale, { style: 'currency', currency, minimumFractionDigits: 2 }).format(amount);

const formatDate = (date, locale = 'ar-MA') => {
  if (!date) return '';
  const dateObj = date.toDate ? date.toDate() : new Date(date);
  return dateObj.toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });
};

// --- Small components for UI ---
const SimpleInput = ({ label, value, onChange, type = 'text' }) => (
  <div className="space-y-1">
    <label className="text-sm font-medium text-slate-700">{label}</label>
    <input type={type} value={value} onChange={e => onChange(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-slate-200" />
  </div>
);

// --- Main App ---
export default function App() {
  const [lang, setLang] = useState('ar');
  const t = TRANSLATIONS[lang];

  // Auth & app state
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('dashboard');

  // login form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // data
  const [donations, setDonations] = useState([]);
  const [memberData, setMemberData] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    document.title = t.appTitle;
    document.documentElement.dir = t.dir;
  }, [lang]);

  useEffect(() => {
    const init = async () => {
      try {
        await setPersistence(auth, browserSessionPersistence);
      } catch (e) {
        console.warn('Could not set persistence', e);
      }

      const unsub = onAuthStateChanged(auth, async (u) => {
        setUser(u);
        setAuthReady(true);
        setLoading(false);

        if (u) {
          // ensure member document exists and load it
          const memberRef = doc(db, `artifacts/${appId}/public/data/members`, u.uid);
          const snap = await getDoc(memberRef);
          if (!snap.exists()) {
            // create a minimal member profile so actions are labeled
            const defaultName = u.email ? u.email.split('@')[0] : 'Member';
            await setDoc(memberRef, { name: defaultName, isAdmin: false });
            setMemberData({ name: defaultName, isAdmin: false });
            setIsAdmin(false);
          } else {
            const data = snap.data();
            setMemberData(data);
            setIsAdmin(!!data.isAdmin);
          }

          // subscribe to donations
          const q = query(collection(db, `artifacts/${appId}/public/data/donations`));
          const unsubDon = onSnapshot(q, (snapshots) => {
            const list = snapshots.docs.map(d => ({ id: d.id, ...d.data(), date: d.data().timestamp?.toDate ? d.data().timestamp.toDate() : d.data().timestamp }));
            list.sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0));
            setDonations(list);
          });

          // store unsubscribe function on the user object so we can cleanup when user signs out
          (u as any).__unsubDonations = unsubDon;
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

  // sign in (email+password) - NO EMAIL VERIFICATION required
  const handleSignIn = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      setEmail(''); setPassword('');
    } catch (err) {
      console.error(err);
      setErrorMsg('Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      // cleanup donation subscription if present
      if (user && (user as any).__unsubDonations) {
        (user as any).__unsubDonations();
      }
    } catch (e) { }
    await signOut(auth);
  };

  const handleAddDonation = async (data, cb) => {
    setLoading(true);
    try {
      const nextOpNumber = donations.length > 0 ? Math.max(...donations.map(d=>d.operationNumber || 0)) + 1 : 1;
      await addDoc(collection(db, `artifacts/${appId}/public/data/donations`), {
        operationNumber: nextOpNumber,
        donorName: data.donorName,
        phone: data.phone || '',
        amount: data.amount,
        paymentMethod: data.method || 'Cash',
        bankDetails: data.bankDetails || '',
        description: data.description || '',
        createdBy: user.uid,
        memberName: memberData?.name || (user.email ? user.email.split('@')[0] : 'Member'),
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
    if (!confirm('Delete this record?')) return;
    try {
      await deleteDoc(doc(db, `artifacts/${appId}/public/data/donations`, id));
    } catch (e) { console.error(e); }
  };

  const updateProfileName = async (newName) => {
    if (!user) return;
    const memberRef = doc(db, `artifacts/${appId}/public/data/members`, user.uid);
    try {
      await setDoc(memberRef, { ...memberData, name: newName }, { merge: true });
      setMemberData(prev => ({ ...prev, name: newName }));
    } catch (e) { console.error(e); }
  };

  // LOGIN SCREEN
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-6" dir={t.dir}>
        <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-xl">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold">{t.loginTitle}</h1>
            <p className="text-sm text-slate-500">{t.loginSub}</p>
          </div>

          <div className="space-y-4">
            <SimpleInput label={t.email} value={email} onChange={setEmail} type="email" />
            <SimpleInput label={t.password} value={password} onChange={setPassword} type="password" />
            {errorMsg && <div className="text-red-600 text-sm">{errorMsg}</div>}
            <button onClick={handleSignIn} disabled={loading} className="w-full py-3 rounded-lg bg-emerald-600 text-white font-bold flex items-center justify-center gap-2">
              <Lock size={16} /> {loading ? 'Signing in...' : t.btnEnter}
            </button>
            <div className="text-xs text-slate-400 text-center">You (admin) must create user accounts in Firebase Authentication (Console)</div>
          </div>
        </div>
      </div>
    );
  }

  // MAIN APP LAYOUT (simplified for clarity)
  const displayMemberName = memberData?.name || (user.email ? user.email.split('@')[0] : 'Member');

  return (
    <div className="min-h-screen flex" dir={t.dir}>
      <aside className="w-72 bg-white border-r p-6 hidden md:block">
        <h2 className="font-bold text-xl mb-2">{t.appTitle}</h2>
        <p className="text-sm text-slate-500 mb-4">{t.loginSub}</p>

        <div className="mb-4">
          <div className="font-medium">{displayMemberName}</div>
          <div className="text-xs text-slate-400">{isAdmin ? 'Admin' : 'Member'}</div>
        </div>

        <nav className="space-y-2">
          <button onClick={() => setView('dashboard')} className={`w-full text-left py-2 px-3 rounded ${view==='dashboard'?'bg-slate-100':''}`}>Dashboard</button>
          <button onClick={() => setView('add')} className={`w-full text-left py-2 px-3 rounded ${view==='add'?'bg-slate-100':''}`}>New Donation</button>
          <button onClick={() => setView('list')} className={`w-full text-left py-2 px-3 rounded ${view==='list'?'bg-slate-100':''}`}>History</button>
        </nav>

        <div className="mt-6">
          <button onClick={handleSignOut} className="w-full py-2 rounded bg-red-50 text-red-600 font-bold flex items-center justify-center gap-2"><LogOut size={14}/> {t.signOut}</button>
        </div>

        <div className="mt-6">
          <label className="text-xs text-slate-400">Language</label>
          <select value={lang} onChange={(e)=>setLang(e.target.value)} className="w-full mt-2 p-2 border rounded">
            <option value="ar">العربية</option>
            <option value="en">English</option>
          </select>
        </div>

      </aside>

      <main className="flex-1 p-6">
        {view === 'dashboard' && (
          <div>
            <h3 className="text-2xl font-bold mb-4">Dashboard</h3>
            <div className="bg-white p-6 rounded shadow">Total donations: {formatMoney(donations.reduce((s, d) => s + (d.amount||0), 0))}</div>
          </div>
        )}

        {view === 'add' && (
          <div>
            <h3 className="text-2xl font-bold mb-4">Record Donation</h3>
            <AddDonation onAdd={handleAddDonation} loading={loading} memberName={displayMemberName} />
          </div>
        )}

        {view === 'list' && (
          <div>
            <h3 className="text-2xl font-bold mb-4">Donations</h3>
            <DonationList donations={donations} onDelete={handleDelete} />
          </div>
        )}

        <div className="mt-8 bg-white p-4 rounded shadow">
          <h4 className="font-bold mb-2">Profile</h4>
          <ProfileEditor currentName={displayMemberName} onSave={updateProfileName} />
        </div>

      </main>
    </div>
  );
}

// --- Small Subcomponents reused ---
const AddDonation = ({ onAdd, loading, memberName }) => {
  const [form, setForm] = useState({ donorName: '', phone: '', amount: '', method: 'Cash', bankDetails: '', description: '' });
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleSubmit = (e) => { e.preventDefault(); setConfirmOpen(true); };
  const handleConfirm = () => {
    const amt = parseFloat(form.amount);
    if (!amt || amt <= 0) return alert('Invalid amount');
    onAdd({ ...form, amount: amt, memberName }, (ok)=>{ if(ok){ setForm({ donorName: '', phone: '', amount: '', method: 'Cash', bankDetails: '', description: '' }); setConfirmOpen(false); } });
  };

  return (
    <div className="bg-white p-6 rounded shadow">
      <form onSubmit={handleSubmit} className="space-y-4">
        <SimpleInput label="Donor Name" value={form.donorName} onChange={(v)=>setForm({...form, donorName:v})} />
        <SimpleInput label="Amount" value={form.amount} onChange={(v)=>setForm({...form, amount:v})} type="number" />
        <div className="flex gap-2">
          <button type="submit" className="px-4 py-2 rounded bg-emerald-600 text-white">Save</button>
          <div className="text-slate-500 px-4 py-2">Recorded by: <strong>{memberName}</strong></div>
        </div>
      </form>

      {confirmOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30">
          <div className="bg-white p-6 rounded shadow">
            <p className="mb-4">Confirm saving donation?</p>
            <div className="flex gap-2">
              <button onClick={handleConfirm} className="px-4 py-2 rounded bg-emerald-600 text-white">Confirm</button>
              <button onClick={()=>setConfirmOpen(false)} className="px-4 py-2 rounded border">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const DonationList = ({ donations, onDelete }) => {
  return (
    <div className="space-y-3">
      {donations.length === 0 && <div className="text-slate-400">No donations yet.</div>}
      {donations.map(d => (
        <div key={d.id} className="bg-white p-3 rounded shadow flex justify-between items-center">
          <div>
            <div className="font-bold">{d.donorName}</div>
            <div className="text-xs text-slate-400">By: {d.memberName} — {formatDate(d.date)}</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="font-bold">{formatMoney(d.amount)}</div>
            <button onClick={()=>onDelete(d.id)} className="text-red-600"><Trash2 size={16} /></button>
          </div>
        </div>
      ))}
    </div>
  );
};

const ProfileEditor = ({ currentName, onSave }) => {
  const [name, setName] = useState(currentName);
  useEffect(()=>setName(currentName), [currentName]);
  return (
    <div className="flex gap-2 items-center">
      <input value={name} onChange={(e)=>setName(e.target.value)} className="p-2 border rounded" />
      <button onClick={()=>onSave(name)} className="px-3 py-2 bg-emerald-600 text-white rounded">Save</button>
    </div>
  );
};
