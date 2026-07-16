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
    const { userId } = await requireUser(req);

    const response = await plaidClient.linkTokenCreate({
      user: { client_user_id: userId },
      client_name: "Budget Buddy",
      products: ["transactions"],
      country_codes: ["US"],
      language: "en",
    });

    res.status(200).json({ link_token: response.data.link_token });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message || "Failed to create link token" });
  }
}
