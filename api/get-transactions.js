import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";
import { requireUser } from "./_supabaseAdmin.js";

const plaidClient = new PlaidApi(
  new Configuration({
    basePath: PlaidEnvironments[process.env.PLAID_ENV || "sandbox"],
    baseOptions: {
      headers: {
        "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID,
        "PLAID-SECRET": process.env.PLAID_SECRET,
      },
    },
  })
);

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { userId, supabaseAdmin } = await requireUser(req);

    const { data: items, error } = await supabaseAdmin
      .from("plaid_items")
      .select("access_token, institution_name")
      .eq("user_id", userId);
    if (error) throw error;

    if (!items || items.length === 0) {
      return res.status(200).json({ banks: [], transactions: [] });
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    const start = startDate.toISOString().slice(0, 10);
    const end = new Date().toISOString().slice(0, 10);

    let allTransactions = [];
    for (const item of items) {
      const response = await plaidClient.transactionsGet({
        access_token: item.access_token,
        start_date: start,
        end_date: end,
        options: { count: 100 },
      });
      const txns = response.data.transactions.map((t) => ({
        id: t.transaction_id,
        name: t.name,
        amount: t.amount,
        date: t.date,
        category: (t.personal_finance_category?.primary || t.category?.[0] || "Other")
          .toLowerCase()
          .replace(/_/g, " "),
        institution: item.institution_name,
      }));
      allTransactions = allTransactions.concat(txns);
    }

    res.status(200).json({
      banks: items.map((i) => i.institution_name),
      transactions: allTransactions,
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message || "Failed to fetch transactions" });
  }
}
