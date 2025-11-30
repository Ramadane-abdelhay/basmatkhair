import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithCustomToken, 
  signInAnonymously, 
  onAuthStateChanged,
  signOut
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  onSnapshot, 
  orderBy, 
  serverTimestamp,
  doc,
  setDoc,
  getDoc,
  deleteDoc
} from 'firebase/firestore';
import { 
  Plus, 
  LayoutDashboard, 
  List as ListIcon, 
  LogOut, 
  Receipt, 
  User, 
  DollarSign, 
  Calendar, 
  CheckCircle,
  Search,
  Users,
  Shield,
  Trash2
} from 'lucide-react';

// --- Firebase Configuration & Initialization ---
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD6dXQhZxE2XZLIhE4tmKE9GWNkQXmcdOU",
  authDomain: "basmatkhair.firebaseapp.com",
  projectId: "basmatkhair",
  storageBucket: "basmatkhair.firebasestorage.app",
  messagingSenderId: "360924883660",
  appId: "1:360924883660:web:846d5689c60a728b747069"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'my-nonprofit-tracker'; // Use a simple string here

// --- Components ---

// 1. Login Component
const Login = ({ onLogin, loading, error }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email && password) {
      onLogin(email, password);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-slate-200">
        <div className="text-center mb-8">
          <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <DollarSign className="text-white w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Non-Profit Tracker</h1>
          <p className="text-slate-500">Member Access Only</p>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
            <input 
              type="email" 
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              placeholder="member@org.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input 
              type="password" 
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition duration-200 flex items-center justify-center gap-2"
          >
            {loading ? 'Verifying...' : 'Secure Login'}
          </button>
        </form>
        <div className="mt-6 text-center text-xs text-slate-400">
          Protected System. Unauthorized access is prohibited.
        </div>
      </div>
    </div>
  );
};

// 2. Receipt Component (Print View)
const ReceiptView = ({ donation, onClose }) => {
  if (!donation) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-8 print:p-0" id="receipt-area">
          <div className="text-center border-b pb-6 mb-6">
            <h2 className="text-2xl font-bold text-slate-800">OFFICIAL RECEIPT</h2>
            <p className="text-slate-500">Non-Profit Organization Inc.</p>
            <p className="text-xs text-slate-400 mt-1">Receipt #{donation.operationNumber}</p>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-slate-500">Date Received:</span>
              <span className="font-medium">{new Date(donation.date).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Donor Name:</span>
              <span className="font-bold text-lg">{donation.donorFirstName} {donation.donorLastName}</span>
            </div>
            <div className="flex justify-between items-center py-4 border-y border-dashed border-slate-300 my-4">
              <span className="text-slate-500">Amount Received:</span>
              <span className="text-3xl font-bold text-green-600">${parseFloat(donation.amount).toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Payment Method:</span>
              <span className="font-medium capitalize">{donation.paymentMethod}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Received By:</span>
              <span className="font-medium">{donation.memberName}</span>
            </div>
            {donation.comment && (
              <div className="bg-slate-50 p-3 rounded text-sm text-slate-600 italic">
                "{donation.comment}"
              </div>
            )}
          </div>

          <div className="mt-8 text-center pt-6 border-t">
            <p className="text-sm font-semibold text-slate-800">Thank you for your generous support!</p>
            <p className="text-xs text-slate-400 mt-2">This is an electronically generated receipt.</p>
          </div>
        </div>

        <div className="bg-slate-50 p-4 flex justify-end gap-3 border-t">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition"
          >
            Close
          </button>
          <button 
            onClick={() => {
              const printContent = document.getElementById('receipt-area').innerHTML;
              const originalContent = document.body.innerHTML;
              document.body.innerHTML = `<div style="padding: 40px; max-width: 600px; margin: 0 auto;">${printContent}</div>`;
              window.print();
              document.body.innerHTML = originalContent;
              window.location.reload(); 
            }}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg flex items-center gap-2 transition"
          >
            <Receipt size={18} /> Print PDF
          </button>
        </div>
      </div>
    </div>
  );
};

// 3. Main Application
export default function App() {
  const [user, setUser] = useState(null); // Firebase Auth User
  const [appUser, setAppUser] = useState(null); // App Member Profile (from Firestore)
  const [view, setView] = useState('login'); // login, dashboard, add, list, members
  const [donations, setDonations] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  const [activeReceipt, setActiveReceipt] = useState(null);

  // Form States
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    amount: '',
    method: 'Cash',
    comment: ''
  });

  const [memberForm, setMemberForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'member' // 'admin' or 'member'
  });

  // --- 1. Initial Setup & Auth ---
  useEffect(() => {
    // We use a simplified Auth flow here:
    // 1. App authenticates anonymously to Firebase to get database access.
    // 2. User "logs in" by checking credentials against a 'members' collection in Firestore.
    // This allows custom member management without needing a complex backend server.
    
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Auth error:", err);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      
      // Auto-login from local storage (session persistence)
      const savedMember = localStorage.getItem('donation_app_member');
      if (savedMember) {
        const memberData = JSON.parse(savedMember);
        setAppUser(memberData);
        setView('dashboard');
      }

      // Initialize Admin if not exists (First Run Only)
      if (u) {
        const adminRef = doc(db, 'artifacts', appId, 'public', 'data', 'members', 'admin@org.com');
        const adminSnap = await getDoc(adminRef);
        if (!adminSnap.exists()) {
           await setDoc(adminRef, {
             name: 'System Admin',
             email: 'admin@org.com',
             password: 'admin123', // In a real app, hash this!
             role: 'admin',
             createdAt: serverTimestamp()
           });
           console.log("Default admin created");
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- 2. Data Listeners ---
  useEffect(() => {
    if (!user) return;

    // Fetch Donations
    const qDonations = query(collection(db, 'artifacts', appId, 'public', 'data', 'donations'));
    const unsubDonations = onSnapshot(qDonations, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate() || new Date()
      }));
      data.sort((a, b) => b.date - a.date);
      setDonations(data);
    });

    // Fetch Members (Only strictly needed for Admin, but getting all for list display)
    const qMembers = query(collection(db, 'artifacts', appId, 'public', 'data', 'members'));
    const unsubMembers = onSnapshot(qMembers, (snapshot) => {
       const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
       setMembers(data);
    });

    return () => {
      unsubDonations();
      unsubMembers();
    };
  }, [user]);

  // --- 3. Handlers ---

  const handleLogin = async (email, password) => {
    setLoading(true);
    setAuthError('');
    
    try {
      // Look up user in Firestore
      const userRef = doc(db, 'artifacts', appId, 'public', 'data', 'members', email);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        if (userData.password === password) {
          // Success
          const profile = {
            name: userData.name,
            email: userData.email,
            role: userData.role,
            id: userSnap.id
          };
          setAppUser(profile);
          localStorage.setItem('donation_app_member', JSON.stringify(profile));
          setView('dashboard');
        } else {
          setAuthError('Incorrect password.');
        }
      } else {
        setAuthError('Member email not found.');
      }
    } catch (err) {
      console.error(err);
      setAuthError('System error. Please try again.');
    }
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('donation_app_member');
    setAppUser(null);
    setView('login');
  };

  const handleAddDonation = async (e) => {
    e.preventDefault();
    if (!appUser || !formData.amount) return;

    try {
      const newOpNumber = donations.length + 1;
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'donations'), {
        operationNumber: newOpNumber,
        donorFirstName: formData.firstName,
        donorLastName: formData.lastName,
        amount: parseFloat(formData.amount),
        paymentMethod: formData.method,
        comment: formData.comment,
        memberEmail: appUser.email,
        memberName: appUser.name,
        date: serverTimestamp(),
      });
      setFormData({ firstName: '', lastName: '', amount: '', method: 'Cash', comment: '' });
      setView('list'); 
    } catch (err) {
      alert("Failed to save.");
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (appUser.role !== 'admin') return;

    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'members', memberForm.email), {
        name: memberForm.name,
        email: memberForm.email,
        password: memberForm.password,
        role: memberForm.role,
        createdAt: serverTimestamp()
      });
      setMemberForm({ name: '', email: '', password: '', role: 'member' });
      alert("Member added successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to add member.");
    }
  };
  
  const handleDeleteMember = async (email) => {
      if(!confirm("Are you sure you want to remove this member?")) return;
      try {
          await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'members', email));
      } catch(err) {
          alert("Error removing member");
      }
  }

  // --- 4. Stats Calculation ---
  const stats = useMemo(() => {
    const totalCollected = donations.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);
    const memberTotals = {};
    donations.forEach(d => {
      const name = d.memberName || 'Unknown';
      if (!memberTotals[name]) memberTotals[name] = 0;
      memberTotals[name] += (parseFloat(d.amount) || 0);
    });
    const memberList = Object.entries(memberTotals)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total);
    return { totalCollected, memberList };
  }, [donations]);


  // --- Render ---

  if (view === 'login') {
    return <Login onLogin={handleLogin} loading={loading} error={authError} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-20 md:pb-0">
      
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('dashboard')}>
              <div className="bg-blue-600 rounded p-1">
                <DollarSign size={20} className="text-white" />
              </div>
              <span className="font-bold text-lg tracking-tight">NonProfit<span className="text-blue-600">Track</span></span>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:block text-right">
                <div className="text-sm font-medium flex items-center justify-end gap-1">
                  {appUser?.name} 
                  {appUser?.role === 'admin' && <Shield size={14} className="text-blue-600" />}
                </div>
                <div className="text-xs text-slate-500 capitalize">{appUser?.role}</div>
              </div>
              <button onClick={handleLogout} className="text-slate-500 hover:text-red-600 transition">
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* VIEW: DASHBOARD */}
        {view === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-800">Overview</h2>
              <div className="flex gap-2">
                {appUser.role === 'admin' && (
                  <button 
                    onClick={() => setView('members')}
                    className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow-sm transition"
                  >
                    <Users size={18} /> Manage Members
                  </button>
                )}
                <button 
                  onClick={() => setView('add')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow-sm transition active:scale-95"
                >
                  <Plus size={18} /> Add Donation
                </button>
              </div>
            </div>

            {/* Total Card */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg">
              <p className="text-blue-100 font-medium mb-1">Total Funds Collected</p>
              <h1 className="text-5xl font-bold tracking-tight">
                ${stats.totalCollected.toLocaleString('en-US', {minimumFractionDigits: 2})}
              </h1>
              <div className="mt-4 flex items-center gap-2 text-sm text-blue-100 bg-white/10 w-fit px-3 py-1 rounded-full">
                <CheckCircle size={14} />
                <span>{donations.length} total operations recorded</span>
              </div>
            </div>

            {/* Member Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <User size={20} className="text-slate-400" />
                  Performance by Member
                </h3>
                <div className="space-y-4">
                  {stats.memberList.length === 0 ? (
                    <p className="text-slate-400 text-sm">No data yet.</p>
                  ) : (
                    stats.memberList.map((m, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded transition">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-600'}`}>
                            {idx + 1}
                          </div>
                          <span className="font-medium">{m.name}</span>
                        </div>
                        <span className="font-bold text-slate-700">${m.total.toLocaleString()}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <Calendar size={20} className="text-slate-400" />
                    Recent Activity
                  </h3>
                  <button onClick={() => setView('list')} className="text-blue-600 text-sm font-medium hover:underline">View All</button>
                </div>
                <div className="space-y-3">
                  {donations.slice(0, 5).map(d => (
                    <div key={d.id} className="text-sm border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                      <div className="flex justify-between">
                        <span className="font-medium text-slate-800">{d.donorFirstName} {d.donorLastName}</span>
                        <span className="text-green-600 font-bold">+${d.amount}</span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-500 mt-1">
                        <span>via {d.memberName}</span>
                        <span>{new Date(d.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW: ADD DONATION */}
        {view === 'add' && (
          <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
            <button onClick={() => setView('dashboard')} className="mb-4 text-slate-500 hover:text-slate-800 flex items-center gap-1 text-sm font-medium">
              &larr; Back to Dashboard
            </button>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 p-6 border-b border-slate-100">
                <h2 className="text-xl font-bold text-slate-800">Record New Donation</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Recorded by: <span className="font-medium text-slate-700">{appUser.name}</span> • {new Date().toLocaleDateString()}
                </p>
              </div>
              <form onSubmit={handleAddDonation} className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Donor First Name</label>
                    <input required type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Donor Last Name</label>
                    <input required type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Donation Amount ($)</label>
                  <input required type="number" step="0.01" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium text-lg"
                      value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Payment Method</label>
                  <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    value={formData.method} onChange={e => setFormData({...formData, method: e.target.value})}>
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Check">Check</option>
                    <option value="Online / Card">Online / Card</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Comment (Optional)</label>
                  <textarea rows="3" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.comment} onChange={e => setFormData({...formData, comment: e.target.value})}></textarea>
                </div>
                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setView('dashboard')} className="flex-1 px-4 py-3 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition">Cancel</button>
                  <button type="submit" className="flex-1 px-4 py-3 text-white bg-green-600 hover:bg-green-700 rounded-lg font-medium shadow-md transition">Confirm Donation</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* VIEW: DONATION LIST */}
        {view === 'list' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
             <div className="flex justify-between items-center mb-6">
               <button onClick={() => setView('dashboard')} className="text-slate-500 hover:text-slate-800 flex items-center gap-1 text-sm font-medium">
                 &larr; Back to Dashboard
               </button>
               <button onClick={() => setView('add')} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm">
                  <Plus size={16} /> New Entry
                </button>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 font-medium">Date</th>
                    <th className="px-6 py-3 font-medium">Donor</th>
                    <th className="px-6 py-3 font-medium">Amount</th>
                    <th className="px-6 py-3 font-medium">Member</th>
                    <th className="px-6 py-3 font-medium text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {donations.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4">{new Date(d.date).toLocaleDateString()}</td>
                      <td className="px-6 py-4 font-medium">{d.donorFirstName} {d.donorLastName}</td>
                      <td className="px-6 py-4 text-green-600 font-bold">${parseFloat(d.amount).toLocaleString()}</td>
                      <td className="px-6 py-4"><span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">{d.memberName}</span></td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => setActiveReceipt(d)} className="text-slate-600 hover:text-blue-600 p-2"><Receipt size={18} /></button>
                      </td>
                    </tr>
                  ))}
                  {donations.length === 0 && <tr><td colSpan="5" className="p-6 text-center text-slate-400">No donations.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VIEW: ADMIN MEMBERS MANAGEMENT */}
        {view === 'members' && appUser.role === 'admin' && (
           <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
             <button onClick={() => setView('dashboard')} className="mb-4 text-slate-500 hover:text-slate-800 flex items-center gap-1 text-sm font-medium">
               &larr; Back to Dashboard
             </button>
             
             <div className="grid md:grid-cols-3 gap-6">
                {/* Form */}
                <div className="md:col-span-1">
                    <div className="bg-slate-800 text-white p-6 rounded-xl shadow-lg">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                            <Shield size={18} /> Add Member
                        </h3>
                        <form onSubmit={handleAddMember} className="space-y-4">
                            <div>
                                <label className="text-xs text-slate-400">Full Name</label>
                                <input required className="w-full bg-slate-700 border-slate-600 rounded p-2 text-sm mt-1 focus:ring-1 focus:ring-blue-400 outline-none"
                                value={memberForm.name} onChange={e => setMemberForm({...memberForm, name: e.target.value})} />
                            </div>
                            <div>
                                <label className="text-xs text-slate-400">Email (Login)</label>
                                <input required type="email" className="w-full bg-slate-700 border-slate-600 rounded p-2 text-sm mt-1 focus:ring-1 focus:ring-blue-400 outline-none"
                                value={memberForm.email} onChange={e => setMemberForm({...memberForm, email: e.target.value})} />
                            </div>
                            <div>
                                <label className="text-xs text-slate-400">Password</label>
                                <input required type="text" className="w-full bg-slate-700 border-slate-600 rounded p-2 text-sm mt-1 focus:ring-1 focus:ring-blue-400 outline-none"
                                value={memberForm.password} onChange={e => setMemberForm({...memberForm, password: e.target.value})} />
                            </div>
                            <div>
                                <label className="text-xs text-slate-400">Role</label>
                                <select className="w-full bg-slate-700 border-slate-600 rounded p-2 text-sm mt-1 outline-none"
                                value={memberForm.role} onChange={e => setMemberForm({...memberForm, role: e.target.value})}>
                                    <option value="member">Member</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 py-2 rounded font-medium mt-2">Create Account</button>
                        </form>
                    </div>
                </div>

                {/* List */}
                <div className="md:col-span-2">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-4 border-b border-slate-100 font-bold text-lg">Current Staff</div>
                        <div className="divide-y divide-slate-100">
                            {members.map(m => (
                                <div key={m.id} className="p-4 flex justify-between items-center hover:bg-slate-50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                                            {m.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="font-medium text-slate-800 flex items-center gap-2">
                                                {m.name}
                                                {m.role === 'admin' && <span className="text-[10px] bg-slate-800 text-white px-1.5 py-0.5 rounded">ADMIN</span>}
                                            </div>
                                            <div className="text-xs text-slate-400">{m.email}</div>
                                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">Pw: {m.password}</div>
                                        </div>
                                    </div>
                                    {m.email !== 'admin@org.com' && (
                                        <button onClick={() => handleDeleteMember(m.id)} className="text-slate-300 hover:text-red-600 p-2">
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
             </div>
           </div>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around p-3 z-40 pb-safe">
        <button onClick={() => setView('dashboard')} className={`flex flex-col items-center ${view === 'dashboard' ? 'text-blue-600' : 'text-slate-400'}`}>
          <LayoutDashboard size={24} />
          <span className="text-[10px] mt-1 font-medium">Home</span>
        </button>
        <button onClick={() => setView('add')} className={`flex flex-col items-center -mt-6`}>
           <div className="bg-blue-600 text-white p-4 rounded-full shadow-lg border-4 border-slate-50">
            <Plus size={24} />
           </div>
        </button>
        <button onClick={() => setView('list')} className={`flex flex-col items-center ${view === 'list' ? 'text-blue-600' : 'text-slate-400'}`}>
          <ListIcon size={24} />
          <span className="text-[10px] mt-1 font-medium">History</span>
        </button>
      </div>

      {activeReceipt && (
        <ReceiptView donation={activeReceipt} onClose={() => setActiveReceipt(null)} />
      )}
    </div>
  );
}