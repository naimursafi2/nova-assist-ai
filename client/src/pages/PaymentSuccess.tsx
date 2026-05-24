import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const { user, updatePlan } = useAuth();
  const [saved, setSaved] = useState(false);
  const didSave = useRef(false);
  const plan = searchParams.get("plan") || "advanced";

  useEffect(() => {
    if (!user || didSave.current) return;
    didSave.current = true;
    updatePlan(plan).finally(() => setSaved(true));
  }, [plan, updatePlan, user]);

  return (
    <main className="min-h-screen gradient-bg flex items-center justify-center px-4">
      <section className="w-full max-w-md glass border border-border rounded-2xl p-6 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
        <h1 className="mt-4 text-2xl font-bold text-foreground">Payment successful</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your {plan} plan is {user ? (saved ? "active now." : "being activated.") : "ready. Please sign in to sync it."}
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center rounded-xl gradient-btn px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          Back to chat
        </Link>
      </section>
    </main>
  );
}
