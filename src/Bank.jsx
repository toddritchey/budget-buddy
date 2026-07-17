import { useState, useEffect, useCallback } from "react";
import { usePlaidLink } from "react-plaid-link";
import { Plus, Landmark, ShieldCheck, Trash2, RefreshCw } from "lucide-react";

async function api(path, session, options = {}) {
  const res = await fetch(`/api/${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
      ...(options.headers || {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export default function Bank({ session, onImportTransactions }) {
  const [linkToken, setLinkToken] = useState(null);
  const [connectedBanks, setConnectedBanks] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [syncing, setSyncing] = useState(false);

  const loadTransactions = useCallback(async () => {
    try {
      setSyncing(true);
      const data = await api("get-transactions", session);
      setConnectedBanks(data.banks || []);
      setTransactions(data.transactions || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setSyncing(false);
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  async function getLinkToken() {
    try {
      const data = await api("create-link-token", session, { method: "POST" });
      setLinkToken(data.link_token);
    } catch (err) {
      setError(err.message);
    }
  }

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: async (public_token, metadata) => {
      try {
        await api("exchange-public-token", session, {
          method: "POST",
          body: JSON.stringify({
            public_token,
            institution_name: metadata.institution?.name,
          }),
        });
        setLinkToken(null);
        await loadTransactions();
      } catch (err) {
        setError(err.message);
      }
    },
  });

  useEffect(() => {
    if (linkToken && ready) open();
  }, [linkToken, ready, open]);

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-4xl font-serif text-stone-800 mb-2">Connected Banks</h1>
          <p className="text-stone-500">Automatically sync your household expenses.</p>
        </div>
        <button
          onClick={getLinkToken}
          className="flex items-center gap-2 bg-[#c9603f] text-white px-4 py-2.5 rounded-full font-medium hover:bg-[#b65334] transition-colors"
        >
          <Plus size={18} /> Add Bank Account
        </button>
      </div>

      <div className="bg-[#fbeae3] rounded-2xl p-4 flex items-start gap-3 mb-5">
        <ShieldCheck size={20} className="text-[#c9603f] mt-0.5" />
        <div>
          <div className="font-medium text-[#c9603f] text-sm">Bank-level security</div>
          <div className="text-sm text-[#c98a5f]">
            We use Plaid to connect to your bank. Your login credentials are never stored or seen by us.
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm rounded-xl p-3 mb-5">{error}</div>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl p-16 text-center text-stone-400">Loading…</div>
      ) : connectedBanks.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-full bg-stone-100 flex items-center justify-center mb-4">
            <Landmark size={22} className="text-[#5d7256]" />
          </div>
          <h3 className="font-serif text-xl text-stone-800 mb-2">No banks connected</h3>
          <p className="text-stone-500 text-sm mb-5 max-w-sm">
            Link your bank accounts to automatically track and categorize your household spending.
          </p>
          <button
            onClick={getLinkToken}
            className="bg-stone-100 text-stone-700 px-5 py-2.5 rounded-xl font-medium hover:bg-stone-200 transition-colors"
          >
            Add your first bank
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-5">
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm text-stone-500">
              Connected: {connectedBanks.join(", ")}
            </div>
            <button
              onClick={loadTransactions}
              disabled={syncing}
              className="flex items-center gap-2 text-sm text-[#c9603f] hover:underline disabled:opacity-50"
            >
              <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
              {syncing ? "Syncing…" : "Sync now"}
            </button>
          </div>

          <p className="text-sm text-stone-500 mb-3">
            Transactions from the last 30 days. Pick which ones to bring into your Expenses.
          </p>

          {transactions.length === 0 ? (
            <p className="text-sm text-stone-400 py-4 text-center">
              No transactions found in the last 30 days.
            </p>
          ) : (
            <>
              {transactions.map((t) => (
                <div
                  key={t.id}
                  className="flex justify-between items-center py-3 border-b border-stone-100 last:border-0"
                >
                  <div>
                    <div className="text-stone-800 text-[15px]">{t.name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full capitalize">
                        {t.category}
                      </span>
                      <span className="text-xs text-stone-400">
                        · {new Date(t.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                  </div>
                  <div className="font-medium text-stone-800">${t.amount.toFixed(2)}</div>
                </div>
              ))}
              <button
                onClick={() => onImportTransactions(transactions)}
                className="w-full mt-4 bg-stone-800 text-white rounded-xl py-2.5 font-medium hover:bg-stone-700 transition-colors"
              >
                Import all into Expenses
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
