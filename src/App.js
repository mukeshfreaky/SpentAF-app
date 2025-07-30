import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

// --- Firebase Configuration ---
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAjXaIwB-raIRzCMlbMj3AbdhVjCuanCZc",
  authDomain: "spentaf-app.firebaseapp.com",
  projectId: "spentaf-app",
  storageBucket: "spentaf-app.firebasestorage.app",
  messagingSenderId: "515912557442",
  appId: "1:515912557442:web:d6126cd95ff51a9075259b",
  measurementId: "G-G4HJ3PX8D0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
};

// --- App Initialization ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const provider = new GoogleAuthProvider();

// --- Helper Functions ---
const formatDate = (date, format) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = d.toLocaleString('default', { month: 'long' });
    if (format === 'MMMM YYYY') return `${month} ${year}`;
    if (format === 'YYYY') return `${year}`;
    return d.toLocaleDateString();
};

// --- React Components ---

const LoginScreen = ({ onSignIn }) => (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100 mb-2">SpentAF</h1>
            <p className="text-gray-500 dark:text-gray-400">Sign in to securely access your finances on any device.</p>
        </div>
        <button onClick={onSignIn} className="bg-white hover:bg-gray-100 text-gray-800 font-semibold py-3 px-6 border border-gray-300 rounded-lg shadow-sm flex items-center space-x-3">
            <svg className="w-6 h-6" viewBox="0 0 48 48"><path fill="#4285F4" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"></path><path fill="#34A853" d="M6.306 14.691L22.99 29.385l-16.684 16.684C2.043 40.636 0 32.66 0 24C0 18.283 1.723 13.053 4.545 8.823l1.761 5.868z"></path><path fill="#FBBC05" d="M24 48c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 40.523 26.715 42 24 42c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 43.477 16.227 48 24 48z"></path><path fill="#EA4335" d="M43.611 20.083L42 20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l6.19 5.238C42.012 35.244 44 30.036 44 24c0-1.341-.138-2.65-.389-3.917z"></path></svg>
            <span>Sign in with Google</span>
        </button>
    </div>
);


const SettingsModal = ({ isOpen, onClose, user, appId }) => {
    const [categories, setCategories] = useState([]);
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [newCategory, setNewCategory] = useState('');
    const [newMethod, setNewMethod] = useState('');

    useEffect(() => {
        if (!isOpen || !user) return;
        const catUnsub = onSnapshot(collection(db, `artifacts/${appId}/users/${user.uid}/categories`), snapshot => {
            setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        const methodUnsub = onSnapshot(collection(db, `artifacts/${appId}/users/${user.uid}/paymentMethods`), snapshot => {
            setPaymentMethods(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => { catUnsub(); methodUnsub(); };
    }, [isOpen, user, appId]);

    const handleAdd = async (type, value) => {
        if (!value.trim() || !user) return;
        const collectionName = type === 'category' ? 'categories' : 'paymentMethods';
        await addDoc(collection(db, `artifacts/${appId}/users/${user.uid}/${collectionName}`), { name: value });
        if (type === 'category') setNewCategory(''); else setNewMethod('');
    };

    const handleDelete = async (type, id) => {
        if (!user) return;
        const collectionName = type === 'category' ? 'categories' : 'paymentMethods';
        await deleteDoc(doc(db, `artifacts/${appId}/users/${user.uid}/${collectionName}`, id));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">Settings</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h3 className="text-lg font-semibold mb-3 text-gray-700 dark:text-gray-200">Manage Categories</h3>
                        <div className="flex mb-4">
                            <input type="text" value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="New Category" className="shadow-sm appearance-none border rounded-l w-full py-2 px-3 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            <button onClick={() => handleAdd('category', newCategory)} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-r">Add</button>
                        </div>
                        <ul className="space-y-2">
                            {categories.map(cat => (
                                <li key={cat.id} className="flex justify-between items-center bg-gray-100 dark:bg-gray-700 p-2 rounded">
                                    <span className="text-gray-800 dark:text-gray-200">{cat.name}</span>
                                    <button onClick={() => handleDelete('category', cat.id)} className="text-red-500 hover:text-red-700 text-sm">Delete</button>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold mb-3 text-gray-700 dark:text-gray-200">Manage Payment Methods</h3>
                        <div className="flex mb-4">
                            <input type="text" value={newMethod} onChange={e => setNewMethod(e.target.value)} placeholder="New Payment Method" className="shadow-sm appearance-none border rounded-l w-full py-2 px-3 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            <button onClick={() => handleAdd('method', newMethod)} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-r">Add</button>
                        </div>
                        <ul className="space-y-2">
                            {paymentMethods.map(method => (
                                <li key={method.id} className="flex justify-between items-center bg-gray-100 dark:bg-gray-700 p-2 rounded">
                                    <span className="text-gray-800 dark:text-gray-200">{method.name}</span>
                                    <button onClick={() => handleDelete('method', method.id)} className="text-red-500 hover:text-red-700 text-sm">Delete</button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
                <div className="mt-8 text-right">
                    <button onClick={onClose} className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-100 font-bold py-2 px-4 rounded-lg">Close</button>
                </div>
            </div>
        </div>
    );
};


const AddTransactionModal = ({ isOpen, onClose, onAddTransaction, categories, paymentMethods }) => {
    const [item, setItem] = useState('');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [category, setCategory] = useState('');
    const [method, setMethod] = useState('');
    const [receipt, setReceipt] = useState(null);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!item || !amount || !date || !category || !method) {
            setError('Please fill in all required fields.');
            return;
        }
        setIsSubmitting(true);
        setError('');
        await onAddTransaction({ item, amount: parseFloat(amount), type: 'Expense', category, paymentMethod: method, date, receipt });
        setItem(''); setAmount(''); setDate(new Date().toISOString().split('T')[0]); setCategory(''); setMethod(''); setReceipt(null);
        setIsSubmitting(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">Add New Expense</h2>
                {error && <p className="text-red-500 mb-4">{error}</p>}
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Expense</label>
                        <input type="text" value={item} onChange={(e) => setItem(e.target.value)} className="shadow-sm appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g., Groceries" />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Amount (₹)</label>
                        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="shadow-sm appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="1500" />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Date</label>
                        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="shadow-sm appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Category</label>
                        <select value={category} onChange={(e) => setCategory(e.target.value)} className="shadow-sm appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="">Select a category</option>
                            {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Payment Method</label>
                        <select value={method} onChange={(e) => setMethod(e.target.value)} className="shadow-sm appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="">Select a method</option>
                            {paymentMethods.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                        </select>
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Receipt (Optional)</label>
                        <input type="file" onChange={(e) => setReceipt(e.target.files[0])} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/20 dark:file:text-blue-300 dark:hover:file:bg-blue-900/30"/>
                    </div>
                    <div className="flex items-center justify-end mt-6">
                        <button type="button" onClick={onClose} className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-100 font-bold py-2 px-4 rounded-lg mr-2">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg disabled:bg-blue-300">{isSubmitting ? 'Saving...' : 'Save Expense'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const SummaryCard = ({ title, income, expenses, netFlow }) => (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-t-lg">
            <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-100">{title}</h3>
        </div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div><p className="text-sm text-gray-500 dark:text-gray-400">Total Income</p><p className="text-2xl font-semibold text-green-600 dark:text-green-400">₹{income.toLocaleString('en-IN')}</p></div>
            <div><p className="text-sm text-gray-500 dark:text-gray-400">Total Expenses</p><p className="text-2xl font-semibold text-red-600 dark:text-red-400">₹{expenses.toLocaleString('en-IN')}</p></div>
            <div><p className="text-sm text-gray-500 dark:text-gray-400">Net Flow</p><p className={`text-2xl font-semibold ${netFlow >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>₹{netFlow.toLocaleString('en-IN')}</p></div>
        </div>
    </div>
);


const App = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [transactions, setTransactions] = useState([]);
    const [categories, setCategories] = useState([]);
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [darkMode, setDarkMode] = useState(false);
    
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

    useEffect(() => {
        const isDark = localStorage.getItem('darkMode') === 'true';
        setDarkMode(isDark);
        if(isDark) document.documentElement.classList.add('dark');
    }, []);

    const toggleDarkMode = () => {
        const newDarkMode = !darkMode;
        setDarkMode(newDarkMode);
        localStorage.setItem('darkMode', newDarkMode);
        document.documentElement.classList.toggle('dark');
    };

    useEffect(() => {
        const authCheck = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });
        return () => authCheck();
    }, []);

    useEffect(() => {
        if (user) {
            const unsubscribers = [
                onSnapshot(query(collection(db, `artifacts/${appId}/users/${user.uid}/transactions`), orderBy('date', 'desc')), snapshot => setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))),
                onSnapshot(collection(db, `artifacts/${appId}/users/${user.uid}/categories`), snapshot => setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))),
                onSnapshot(collection(db, `artifacts/${appId}/users/${user.uid}/paymentMethods`), snapshot => setPaymentMethods(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))))
            ];
            return () => unsubscribers.forEach(unsub => unsub());
        } else {
            setTransactions([]);
            setCategories([]);
            setPaymentMethods([]);
        }
    }, [user, appId]);

    const handleSignIn = async () => {
        try {
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error("Google Sign-In Error:", error);
        }
    };

    const handleSignOut = async () => {
        await signOut(auth);
    };

    const handleAddTransaction = async (transaction) => {
        if (!user) return;
        let receiptUrl = '';
        if (transaction.receipt) {
            const storageRef = ref(storage, `receipts/${user.uid}/${Date.now()}_${transaction.receipt.name}`);
            const snapshot = await uploadBytes(storageRef, transaction.receipt);
            receiptUrl = await getDownloadURL(snapshot.ref);
        }
        const { receipt, ...dataToSave } = transaction;
        await addDoc(collection(db, `artifacts/${appId}/users/${user.uid}/transactions`), { ...dataToSave, receiptUrl });
    };
    
    const summaries = useMemo(() => {
        const monthly = {}; const yearly = {};
        transactions.forEach(t => {
            const monthKey = formatDate(t.date, 'MMMM YYYY');
            const yearKey = formatDate(t.date, 'YYYY');
            if (!monthly[monthKey]) monthly[monthKey] = { income: 0, expenses: 0 };
            if (!yearly[yearKey]) yearly[yearKey] = { income: 0, expenses: 0 };
            if (t.type === 'Income') {
                monthly[monthKey].income += t.amount;
                yearly[yearKey].income += t.amount;
            } else {
                monthly[monthKey].expenses += t.amount;
                yearly[yearKey].expenses += t.amount;
            }
        });
        return { monthly, yearly };
    }, [transactions]);
    
    const categorySpendingThisMonth = useMemo(() => {
        const categoriesMap = {};
        const thisMonthKey = formatDate(new Date(), 'MMMM YYYY');
        transactions.filter(t => t.type === 'Expense' && formatDate(t.date, 'MMMM YYYY') === thisMonthKey)
            .forEach(t => {
                const category = t.category || 'Uncategorized';
                if (!categoriesMap[category]) categoriesMap[category] = 0;
                categoriesMap[category] += t.amount;
            });
        return Object.entries(categoriesMap).sort(([,a], [,b]) => b - a);
    }, [transactions]);

    if (loading) {
        return <div className="flex justify-center items-center h-screen bg-gray-50 dark:bg-gray-900"><p className="text-gray-800 dark:text-gray-200">Loading...</p></div>;
    }

    if (!user) {
        return <LoginScreen onSignIn={handleSignIn} />;
    }

    return (
        <div className="bg-gray-50 dark:bg-gray-900 min-h-screen p-4 sm:p-6 md:p-8 transition-colors duration-300">
            <AddTransactionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAddTransaction={handleAddTransaction} categories={categories} paymentMethods={paymentMethods} />
            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} user={user} appId={appId} />
            
            <div className="max-w-7xl mx-auto bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <header className="mb-8 flex justify-between items-center flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <img src={user.photoURL} alt="User" className="w-12 h-12 rounded-full" />
                        <div>
                            <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Welcome to SpentAF</h1>
                            <button onClick={handleSignOut} className="text-sm text-red-500 hover:underline">Sign Out</button>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2 sm:space-x-4">
                        <button onClick={toggleDarkMode} className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                            {darkMode ? '☀️' : '🌙'}
                        </button>
                        <button onClick={() => setIsSettingsOpen(true)} className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                            ⚙️
                        </button>
                        <button onClick={() => setIsModalOpen(true)} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg">
                            + New Expense
                        </button>
                    </div>
                </header>

                <section className="mb-10">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">🗓️ Monthly Summary</h2>
                    <div className="space-y-4">
                        {Object.keys(summaries.monthly).length > 0 ? Object.keys(summaries.monthly).sort((a, b) => new Date(b) - new Date(a)).map(month => (
                             <SummaryCard 
                                key={month} title={month} income={summaries.monthly[month].income} expenses={summaries.monthly[month].expenses}
                                netFlow={summaries.monthly[month].income - summaries.monthly[month].expenses}
                             />
                        )) : <p className="text-gray-500 dark:text-gray-400">No transactions yet. Add one to get started!</p>}
                    </div>
                </section>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-10">
                    <section className="lg:col-span-2">
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">📅 Yearly Summary</h2>
                        <div className="space-y-4">
                            {Object.keys(summaries.yearly).length > 0 ? Object.keys(summaries.yearly).sort((a,b) => b-a).map(year => (
                                 <SummaryCard 
                                    key={year} title={year} income={summaries.yearly[year].income} expenses={summaries.yearly[year].expenses}
                                    netFlow={summaries.yearly[year].income - summaries.yearly[year].expenses}
                                 />
                            )) : <p className="text-gray-500 dark:text-gray-400">No data for yearly summary yet.</p>}
                        </div>
                    </section>
                    <section>
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">📊 Spending by Category (This Month)</h2>
                        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
                            <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                {categorySpendingThisMonth.length > 0 ? categorySpendingThisMonth.map(([category, amount]) => (
                                    <div key={category} className="p-4 flex justify-between items-center">
                                        <p className="text-gray-700 dark:text-gray-300">{category}</p>
                                        <p className="font-medium text-gray-800 dark:text-gray-100">₹{amount.toLocaleString('en-IN')}</p>
                                    </div>
                                )) : <p className="p-4 text-gray-500 dark:text-gray-400">No expenses logged this month.</p>}
                            </div>
                        </div>
                    </section>
                </div>

                <section>
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">🧾 Full Transaction Log</h2>
                    <div className="overflow-x-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
                        <table className="w-full text-left">
                            <thead className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                                <tr>
                                    <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Expense</th>
                                    <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Amount</th>
                                    <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Date</th>
                                    <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Category</th>
                                    <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Payment Method</th>
                                    <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Receipt</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.filter(t => t.type === 'Expense').map(t => (
                                    <tr key={t.id} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                        <td className="p-4 text-gray-800 dark:text-gray-200">{t.item}</td>
                                        <td className="p-4 text-gray-600 dark:text-gray-300">₹{t.amount.toLocaleString('en-IN')}</td>
                                        <td className="p-4 text-gray-600 dark:text-gray-300">{new Date(t.date).toLocaleDateString('en-GB')}</td>
                                        <td className="p-4 text-gray-600 dark:text-gray-300">{t.category}</td>
                                        <td className="p-4 text-gray-600 dark:text-gray-300">{t.paymentMethod}</td>
                                        <td className="p-4 text-gray-600 dark:text-gray-300">
                                            {t.receiptUrl && <a href={t.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">View</a>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default App;
