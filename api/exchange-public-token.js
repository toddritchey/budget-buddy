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
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { userId, supabaseAdmin } = await requireUser(req);
    const { public_token, institution_name } = req.body;
    if (!public_token) return res.status(400).json({ error: "Missing public_token" });

    const exchange = await plaidClient.itemPublicTokenExchange({ public_token });
    const { access_token, item_id } = exchange.data;

    // Store the access token server-side only. This table has Row Level Security
    // enabled with NO policies for normal users, so only this service-role client
    // (running in a serverless function, never in the browser) can read or write it.
    const { error } = await supabaseAdmin.from("plaid_items").upsert({
      user_id: userId,
      item_id,
      access_token,
      institution_name: institution_name || "Connected bank",
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message || "Failed to link account" });
  }
}
