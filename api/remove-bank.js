import { requireUser } from "./_supabaseAdmin.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { userId, supabaseAdmin } = await requireUser(req);
    const { item_id } = req.body;
    if (!item_id) return res.status(400).json({ error: "Missing item_id" });

    const { error } = await supabaseAdmin
      .from("plaid_items")
      .delete()
      .eq("user_id", userId)
      .eq("item_id", item_id);
    if (error) throw error;

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message || "Failed to remove bank" });
  }
}
