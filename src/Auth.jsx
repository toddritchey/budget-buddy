import { useState } from "react";
import { Heart } from "lucide-react";
import { supabase } from "./supabaseClient";

export default function Auth() {
  const [mode, setMode] = useState("signin"); // "signin" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setNotice("Check your email to confirm your account, then sign in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ background: "#f5f1ea" }} className="min-h-screen flex items-center justify-center font-sans">
      <div className="w-full max-w-sm bg-white rounded-2xl p-8">
        <div className="flex items-center gap-2 mb-6 justify-center">
          <div className="w-9 h-9 rounded-full bg-[#fbe3da] flex items-center justify-center">
            <Heart size={18} className="text-[#c9603f]" fill="#c9603f" />
          </div>
          <span className="font-serif text-xl text-stone-800">Budget Buddy</span>
        </div>

        <h1 className="text-center text-stone-700 mb-6">
          {mode === "signin" ? "Sign in to your space" : "Create your own space"}
        </h1>

        <form onSubmit={submit} className="flex flex-col gap-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="border border-stone-200 rounded-xl px-3 py-2.5 outline-none focus:border-[#c9603f]"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="border border-stone-200 rounded-xl px-3 py-2.5 outline-none focus:border-[#c9603f]"
          />

          {error && <p className="text-sm text-red-600">{error}</p>}
          {notice && <p className="text-sm text-[#5d7256]">{notice}</p>}

          <button
            type="submit"
            disabled={loading}
            className="bg-[#c9603f] text-white rounded-xl py-2.5 font-medium hover:bg-[#b65334] transition-colors disabled:opacity-60"
          >
            {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <button
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError("");
            setNotice("");
          }}
          className="text-sm text-stone-500 hover:text-[#c9603f] mt-5 w-full text-center transition-colors"
        >
          {mode === "signin" ? "New here? Create your own space" : "Already have a space? Sign in"}
        </button>
      </div>
    </div>
  );
}
