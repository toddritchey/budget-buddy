import { createClient } from "@supabase/supabase-js";

// Server-side only — uses the SERVICE ROLE key, which must never be sent to the browser.
// This client can bypass Row Level Security, which is exactly why it only lives here,
// in serverless functions, and reads its key from a server-only environment variable.
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Confirms the request really comes from a logged-in user, using the same
// access token the frontend gets from its own Supabase session, and returns
// their user id. Throws if the token is missing or invalid.
export async function requireUser(req) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace("Bearer ", "");
  if (!token) throw new Error("Missing auth token");

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) throw new Error("Invalid or expired session");

  return { userId: data.user.id, supabaseAdmin };
}
