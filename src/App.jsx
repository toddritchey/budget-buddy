import { useState, useEffect } from "react";
import {
  Heart,
  Home,
  Receipt,
  PieChart,
  PiggyBank,
  Landmark,
  Plus,
  Trash2,
  ShieldCheck,
  TrendingUp,
  DollarSign,
  Palmtree,
  Car,
  LogOut,
} from "lucide-react";
import { supabase } from "./supabaseClient";
import Auth from "./Auth.jsx";
import Bank from "./Bank.jsx";

const BG = "#f5f1ea";
const STORAGE_KEY = "budget-buddy-data"; // fallback local key, unused once signed in

const DEFAULT_BUDGETS = [
  { id: "b1", name: "Dining Out", limit: 300 },
  { id: "b2", name: "Entertainment", limit: 150 },
  { id: "b3", name: "Groceries", limit: 600 },
  { id: "b4", name: "Healthcare", limit: 200 },
  { id: "b5", name: "Shopping", limit: 400 },
  { id: "b6", name: "Transport", limit: 200 },
  { id: "b7", name: "Utilities", limit: 250 },
];

const DEFAULT_EXPENSES = [
  { id: "e1", name: "Second grocery trip", category: "Groceries", amount: 89.75, date: "2026-07-09", payer: "Husband" },
  { id: "e2", name: "hi", category: "Shopping", amount: 5.0, date: "2026-07-09", payer: "Wife" },
  { id: "e3", name: "Gas station fill-up", category: "Transport", amount: 65.4, date: "2026-07-09", payer: "Husband" },
  { id: "e4", name: "Date night dinner", category: "Dining Out", amount: 87.0, date: "2026-07-07", payer: "Joint" },
  { id: "e5", name: "Electric bill", category: "Utilities", amount: 98.2, date: "2026-07-05", payer: "Joint" },
  { id: "e6", name: "Doctor visit copay", category: "Healthcare", amount: 45.0, date: "2026-07-03", payer: "Wife" },
];

const DEFAULT_DREAMS = [
  { id: "d1", name: "Family Vacation", icon: "palmtree", saved: 1200, target: 5000 },
  { id: "d2", name: "Emergency Fund", icon: "shield", saved: 4750, target: 10000 },
  { id: "d3", name: "New Car", icon: "car", saved: 6300, target: 20000 },
];

const DREAM_ICONS = {
  palmtree: <Palmtree size={20} className="text-orange-700" />,
  shield: <ShieldCheck size={20} className="text-sky-700" />,
  car: <Car size={20} className="text-blue-700" />,
};

function money(n) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

// Load this user's data from their private row in Supabase.
async function loadUserData(userId) {
  const { data, error } = await supabase
    .from("budget_data")
    .select("data")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    console.error("Load failed", error);
    return null;
  }
  return data ? data.data : null;
}

// Upsert this user's data into their private row.
async function saveUserData(userId, payload) {
  const { error } = await supabase
    .from("budget_data")
    .upsert({ user_id: userId, data: payload, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
  if (error) console.error("Save failed", error);
}

function NavItem({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[15px] transition-colors ${
        active ? "bg-[#c9603f] text-white font-medium" : "text-stone-600 hover:bg-stone-200/60"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function StatCard({ tone, icon, label, value, sub, progress }) {
  const tones = { peach: "bg-[#f7e2da]", sage: "bg-[#e3e6da]", white: "bg-white" };
  return (
    <div className={`${tones[tone]} rounded-2xl p-5 flex-1`}>
      <div className="flex items-center gap-2 text-sm text-stone-600 mb-2">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-2xl font-serif text-stone-800 mb-1">{value}</div>
      {sub && <div className="text-xs text-stone-500 mb-2">{sub}</div>}
      {progress !== undefined && (
        <div className="h-1.5 rounded-full bg-stone-900/10 overflow-hidden mt-2">
          <div className="h-full rounded-full bg-[#c9603f]" style={{ width: `${Math.min(progress * 100, 100)}%` }} />
        </div>
      )}
    </div>
  );
}

function ProgressRow({ label, spent, limit }) {
  const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
  return (
    <div className="mb-4 last:mb-0">
      <div className="flex justify-between items-baseline mb-1.5">
        <span className="text-stone-700 text-[15px]">{label}</span>
        <span className="text-sm text-stone-500">
          {money(spent)} / {money(limit)}
        </span>
      </div>
      <div className="h-2 rounded-full bg-stone-900/10 overflow-hidden">
        <div className="h-full rounded-full bg-[#c9603f]" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Overview({ expenses, budgets, dreams, goToExpenses }) {
  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
  const totalPlanned = budgets.reduce((s, b) => s + b.limit, 0);
  const totalSavedDreams = dreams.reduce((s, d) => s + d.saved, 0);
  const totalDreamTarget = dreams.reduce((s, d) => s + d.target, 0);

  const spendByCategory = {};
  expenses.forEach((e) => {
    spendByCategory[e.category] = (spendByCategory[e.category] || 0) + e.amount;
  });
  const topCategory = Object.entries(spendByCategory).sort((a, b) => b[1] - a[1])[0];

  const recent = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

  return (
    <div>
      <h1 className="text-4xl font-serif text-stone-800 mb-2">Hello there.</h1>
      <p className="text-stone-500 mb-6">Here's how your household is doing this month.</p>

      <div className="flex gap-4 mb-6">
        <StatCard
          tone="peach"
          icon={<DollarSign size={16} />}
          label="Spent so far"
          value={money(totalSpent)}
          sub={`of ${money(totalPlanned)} planned`}
          progress={totalPlanned > 0 ? totalSpent / totalPlanned : 0}
        />
        <StatCard
          tone="sage"
          icon={<PiggyBank size={16} />}
          label="Savings Dreams"
          value={money(totalSavedDreams)}
          sub={`towards ${money(totalDreamTarget)} total target`}
          progress={totalDreamTarget > 0 ? totalSavedDreams / totalDreamTarget : 0}
        />
        <StatCard
          tone="white"
          icon={<TrendingUp size={16} />}
          label="Top Category"
          value={topCategory ? topCategory[0] : "—"}
          sub="Highest spend area this month"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-5">
          <div className="flex justify-between items-start mb-1">
            <h2 className="font-serif text-lg text-stone-800">Budget Health</h2>
            <button className="text-[#c9603f] text-sm hover:underline">Edit Budgets</button>
          </div>
          <p className="text-sm text-stone-500 mb-4">How you're tracking against category limits</p>
          {budgets.map((b) => (
            <ProgressRow key={b.id} label={b.name} spent={spendByCategory[b.name] || 0} limit={b.limit} />
          ))}
        </div>

        <div className="bg-white rounded-2xl p-5">
          <div className="flex justify-between items-start mb-1">
            <h2 className="font-serif text-lg text-stone-800">Recent Entries</h2>
            <button onClick={goToExpenses} className="text-[#c9603f] text-sm hover:underline">
              View All
            </button>
          </div>
          <p className="text-sm text-stone-500 mb-4">Your latest household spending</p>
          {recent.length === 0 && <p className="text-sm text-stone-400">No expenses yet.</p>}
          {recent.map((e) => (
            <div key={e.id} className="flex justify-between items-center py-2.5 border-b border-stone-100 last:border-0">
              <div>
                <div className="text-stone-800 text-[15px]">{e.name}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full">{e.category}</span>
                  <span className="text-xs text-stone-400">
                    · {new Date(e.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium text-stone-800">{money(e.amount)}</div>
                <div className="text-xs text-stone-400">{e.payer}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Expenses({ expenses, addExpense, deleteExpense, categories, payers }) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState(categories[0] || "");
  const [amount, setAmount] = useState("");
  const [payer, setPayer] = useState(payers[0] || "Joint");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const sorted = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));

  function submit() {
    if (!name.trim() || !amount || isNaN(parseFloat(amount))) return;
    addExpense({ id: "e" + Date.now(), name: name.trim(), category, amount: parseFloat(amount), date, payer });
    setName("");
    setAmount("");
    setShowForm(false);
  }

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-4xl font-serif text-stone-800 mb-2">Expenses</h1>
          <p className="text-stone-500">Every dollar, tracked together.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-[#c9603f] text-white px-4 py-2.5 rounded-full font-medium hover:bg-[#b65334] transition-colors"
        >
          <Plus size={18} /> New Expense
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl p-5 mb-5 grid grid-cols-2 gap-3">
          <input
            placeholder="What was it for?"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border border-stone-200 rounded-xl px-3 py-2 col-span-2 outline-none focus:border-[#c9603f]"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border border-stone-200 rounded-xl px-3 py-2 outline-none focus:border-[#c9603f]"
          >
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="border border-stone-200 rounded-xl px-3 py-2 outline-none focus:border-[#c9603f]"
          />
          <select
            value={payer}
            onChange={(e) => setPayer(e.target.value)}
            className="border border-stone-200 rounded-xl px-3 py-2 outline-none focus:border-[#c9603f]"
          >
            {payers.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border border-stone-200 rounded-xl px-3 py-2 outline-none focus:border-[#c9603f]"
          />
          <button
            onClick={submit}
            className="col-span-2 bg-stone-800 text-white rounded-xl py-2.5 font-medium hover:bg-stone-700 transition-colors"
          >
            Add Expense
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl p-5">
        {sorted.length === 0 && <p className="text-sm text-stone-400 py-4 text-center">No expenses logged yet.</p>}
        {sorted.map((e) => (
          <div key={e.id} className="flex justify-between items-center py-3 border-b border-stone-100 last:border-0 group">
            <div>
              <div className="text-stone-800 text-[15px]">{e.name}</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full">{e.category}</span>
                <span className="text-xs text-stone-400">
                  · {new Date(e.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="font-medium text-stone-800">{money(e.amount)}</div>
                <div className="text-xs text-stone-400">{e.payer}</div>
              </div>
              <button
                onClick={() => deleteExpense(e.id)}
                className="opacity-0 group-hover:opacity-100 text-stone-300 hover:text-[#c9603f] transition-opacity"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Budgets({ budgets, expenses, addBudget, updateBudget, deleteBudget }) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [limit, setLimit] = useState("");

  const spendByCategory = {};
  expenses.forEach((e) => {
    spendByCategory[e.category] = (spendByCategory[e.category] || 0) + e.amount;
  });

  function submit() {
    if (!name.trim() || !limit || isNaN(parseFloat(limit))) return;
    addBudget({ id: "b" + Date.now(), name: name.trim(), limit: parseFloat(limit) });
    setName("");
    setLimit("");
    setShowForm(false);
  }

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-4xl font-serif text-stone-800 mb-2">Monthly Limits</h1>
          <p className="text-stone-500">Setting boundaries helps dreams grow.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-[#c9603f] text-white px-4 py-2.5 rounded-full font-medium hover:bg-[#b65334] transition-colors"
        >
          <Plus size={18} /> New Budget
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl p-5 mb-5 flex gap-3">
          <input
            placeholder="Category name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border border-stone-200 rounded-xl px-3 py-2 flex-1 outline-none focus:border-[#c9603f]"
          />
          <input
            type="number"
            placeholder="Monthly limit"
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            className="border border-stone-200 rounded-xl px-3 py-2 w-40 outline-none focus:border-[#c9603f]"
          />
          <button onClick={submit} className="bg-stone-800 text-white rounded-xl px-5 font-medium hover:bg-stone-700 transition-colors">
            Add
          </button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {budgets.map((b) => (
          <div key={b.id} className="bg-white rounded-2xl p-5 border-t-4 border-[#f0c4b3] group relative">
            <button
              onClick={() => deleteBudget(b.id)}
              className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 text-stone-300 hover:text-[#c9603f] transition-opacity"
            >
              <Trash2 size={16} />
            </button>
            <h3 className="font-serif text-lg text-stone-800 mb-1">{b.name}</h3>
            <p className="text-xs text-[#c98a5f] mb-2">Monthly Limit</p>
            <input
              type="number"
              value={b.limit}
              onChange={(e) => updateBudget(b.id, parseFloat(e.target.value) || 0)}
              className="text-2xl font-serif text-stone-800 w-full outline-none bg-transparent border-b border-transparent focus:border-stone-300"
            />
            <p className="text-xs text-stone-400 mt-2">Spent {money(spendByCategory[b.name] || 0)} so far</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Dreams({ dreams, addDream, addFunds, deleteDream }) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");

  function submit() {
    if (!name.trim() || !target || isNaN(parseFloat(target))) return;
    addDream({ id: "d" + Date.now(), name: name.trim(), icon: "shield", saved: 0, target: parseFloat(target) });
    setName("");
    setTarget("");
    setShowForm(false);
  }

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-4xl font-serif text-stone-800 mb-2">Our Dreams</h1>
          <p className="text-stone-500">What are we saving for?</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 border-2 border-[#7c9473] text-[#5d7256] px-4 py-2 rounded-full font-medium hover:bg-[#e3e6da] transition-colors"
        >
          <Heart size={16} /> New Dream
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl p-5 mb-5 flex gap-3">
          <input
            placeholder="Dream name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border border-stone-200 rounded-xl px-3 py-2 flex-1 outline-none focus:border-[#c9603f]"
          />
          <input
            type="number"
            placeholder="Target amount"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="border border-stone-200 rounded-xl px-3 py-2 w-44 outline-none focus:border-[#c9603f]"
          />
          <button onClick={submit} className="bg-stone-800 text-white rounded-xl px-5 font-medium hover:bg-stone-700 transition-colors">
            Add
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {dreams.map((d) => {
          const pct = d.target > 0 ? Math.min((d.saved / d.target) * 100, 100) : 0;
          return (
            <div key={d.id} className="bg-white rounded-2xl p-5">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center">
                    {DREAM_ICONS[d.icon] || DREAM_ICONS.shield}
                  </div>
                  <div>
                    <div className="font-serif text-stone-800">{d.name}</div>
                    <div className="text-xs text-stone-400">In progress</div>
                  </div>
                </div>
                <button onClick={() => deleteDream(d.id)} className="text-stone-300 hover:text-[#c9603f] transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="flex justify-between items-baseline mb-2">
                <span className="text-2xl font-serif text-stone-800">{money(d.saved)}</span>
                <span className="text-sm text-stone-400">of {money(d.target)}</span>
              </div>
              <div className="h-2 rounded-full bg-stone-900/10 overflow-hidden mb-1">
                <div className="h-full rounded-full bg-[#c9603f]" style={{ width: `${pct}%` }} />
              </div>
              <div className="text-right text-xs text-stone-400 mb-3">{pct.toFixed(1)}%</div>
              <button
                onClick={() => {
                  const amt = prompt(`Add funds to ${d.name}:`);
                  const n = parseFloat(amt);
                  if (!isNaN(n) && n > 0) addFunds(d.id, n);
                }}
                className="w-full border border-dashed border-stone-300 rounded-xl py-2.5 text-stone-600 hover:border-[#c9603f] hover:text-[#c9603f] transition-colors flex items-center justify-center gap-2"
              >
                <Heart size={14} /> Add Funds
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = still checking, null = signed out
  const [page, setPage] = useState("overview");
  const [appName] = useState("RitchFix");
  const [expenses, setExpenses] = useState([]);
  const [budgets, setBudgets] = useState(DEFAULT_BUDGETS);
  const [dreams, setDreams] = useState([]);
  const [payers] = useState(["Joint", "Husband", "Wife"]);
  const [loaded, setLoaded] = useState(false);

  // Track whether anyone is signed in.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setLoaded(false); // reload this user's data next
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  // Once we know who's signed in, load their private data.
  useEffect(() => {
    if (!session) return;
    (async () => {
      const saved = await loadUserData(session.user.id);
      if (saved) {
        if (saved.expenses) setExpenses(saved.expenses);
        if (saved.budgets) setBudgets(saved.budgets);
        if (saved.dreams) setDreams(saved.dreams);
      } else {
        // Brand new account — start with real-world-empty data, not sample content.
        // Category structure is kept so the expense form has something to select.
        setExpenses([]);
        setBudgets(DEFAULT_BUDGETS);
        setDreams([]);
      }
      setLoaded(true);
    })();
  }, [session]);

  // Save back to this user's row whenever their data changes.
  useEffect(() => {
    if (!loaded || !session) return;
    saveUserData(session.user.id, { expenses, budgets, dreams });
  }, [expenses, budgets, dreams, loaded, session]);

  if (session === undefined) {
    return (
      <div style={{ background: BG }} className="min-h-screen flex items-center justify-center text-stone-500">
        Loading…
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  const categories = budgets.map((b) => b.name);

  function addExpense(e) {
    setExpenses((prev) => [...prev, e]);
  }
  function deleteExpense(id) {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }
  function addBudget(b) {
    setBudgets((prev) => [...prev, b]);
  }
  function updateBudget(id, limit) {
    setBudgets((prev) => prev.map((b) => (b.id === id ? { ...b, limit } : b)));
  }
  function deleteBudget(id) {
    setBudgets((prev) => prev.filter((b) => b.id !== id));
  }
  function addDream(d) {
    setDreams((prev) => [...prev, d]);
  }
  function addFunds(id, amt) {
    setDreams((prev) => prev.map((d) => (d.id === id ? { ...d, saved: d.saved + amt } : d)));
  }
  function deleteDream(id) {
    setDreams((prev) => prev.filter((d) => d.id !== id));
  }
  function importPlaidTransactions(plaidTxns) {
    setExpenses((prev) => {
      const existingPlaidIds = new Set(prev.filter((e) => e.plaidId).map((e) => e.plaidId));
      const newOnes = plaidTxns
        .filter((t) => !existingPlaidIds.has(t.id))
        .map((t) => ({
          id: "plaid-" + t.id,
          plaidId: t.id,
          name: t.name,
          category: t.category,
          amount: t.amount,
          date: t.date,
          payer: t.institution,
        }));
      return [...prev, ...newOnes];
    });
    setPage("expenses");
  }

  const navItems = [
    { key: "overview", label: "Overview", icon: <Home size={18} /> },
    { key: "expenses", label: "Expenses", icon: <Receipt size={18} /> },
    { key: "budgets", label: "Budgets", icon: <PieChart size={18} /> },
    { key: "dreams", label: "Dreams", icon: <PiggyBank size={18} /> },
    { key: "bank", label: "Bank", icon: <Landmark size={18} /> },
  ];

  return (
    <div style={{ background: BG, minHeight: "100vh" }} className="flex font-sans">
      <div className="w-60 shrink-0 p-4 flex flex-col justify-between min-h-screen">
        <div>
          <div className="flex items-center gap-2 px-2 mb-6">
            <div className="w-8 h-8 rounded-full bg-[#fbe3da] flex items-center justify-center">
              <Heart size={16} className="text-[#c9603f]" fill="#c9603f" />
            </div>
            <span className="font-serif text-lg text-stone-800">{appName}</span>
          </div>
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <NavItem
                key={item.key}
                icon={item.icon}
                label={item.label}
                active={page === item.key}
                onClick={() => setPage(item.key)}
              />
            ))}
          </nav>
        </div>
        <div>
          <div className="bg-[#e3e6da] rounded-2xl p-4 text-center mb-3">
            <p className="text-sm italic text-stone-600">"A goal without a plan is just a wish."</p>
          </div>
          <button
            onClick={() => supabase.auth.signOut()}
            className="w-full flex items-center gap-2 justify-center text-sm text-stone-500 hover:text-[#c9603f] py-2 transition-colors"
          >
            <LogOut size={14} /> Sign out ({session.user.email})
          </button>
        </div>
      </div>

      <div className="flex-1 p-8">
        {page === "overview" && (
          <Overview expenses={expenses} budgets={budgets} dreams={dreams} goToExpenses={() => setPage("expenses")} />
        )}
        {page === "expenses" && (
          <Expenses expenses={expenses} addExpense={addExpense} deleteExpense={deleteExpense} categories={categories} payers={payers} />
        )}
        {page === "budgets" && (
          <Budgets budgets={budgets} expenses={expenses} addBudget={addBudget} updateBudget={updateBudget} deleteBudget={deleteBudget} />
        )}
        {page === "dreams" && <Dreams dreams={dreams} addDream={addDream} addFunds={addFunds} deleteDream={deleteDream} />}
        {page === "bank" && <Bank session={session} onImportTransactions={importPlaidTransactions} />}
      </div>
    </div>
  );
}
