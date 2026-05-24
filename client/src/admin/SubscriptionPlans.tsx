import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const plans = [
  {
    name: "Basic",
    id: "basic",
    price: "$9",
    features: ["50 AI messages/day", "Standard AI", "Basic memory", "Free coupon supported"],
  },
  {
    name: "Advanced",
    id: "advanced",
    price: "$29",
    features: ["200 AI messages/day", "Faster AI", "Voice AI", "Priority support"],
  },
  {
    name: "Pro",
    id: "pro",
    price: "$99",
    features: ["Unlimited usage", "Realtime AI", "Admin analytics", "Team-ready tools"],
  },
];

export default function SubscriptionPlans() {
  const [coupon, setCoupon] = useState("NOVA-BASIC-FREE");
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  async function handleCheckout(plan: string) {
    setLoadingPlan(plan);
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/api/payments/create-checkout-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan,
          userId,
          email,
          coupon: plan === "basic" ? coupon : undefined,
        }),
      });

      const data = await response.json();

      if (data.free && data.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
      }

      if (data.url) {
        window.location.href = data.url;
        return;
      }

      setMessage(data.message || "Payment শুরু করা যায়নি");
    } catch {
      setMessage("Server connection failed");
    } finally {
      setLoadingPlan(null);
    }
  }

  async function applyBasicCoupon() {
    setLoadingPlan("basic-coupon");
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/api/payments/apply-basic-coupon`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, coupon }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage("Basic plan free activate হয়েছে ✅");
        return;
      }

      setMessage(data.message || "Coupon apply করা যায়নি");
    } catch {
      setMessage("Server connection failed");
    } finally {
      setLoadingPlan(null);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <h1 className="text-5xl font-black bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
            Aura AI Pricing
          </h1>
          <p className="text-zinc-400 mt-4 text-lg">
            Choose your AI power level. Use coupon for free Basic plan.
          </p>
        </div>

        <div className="mb-10 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="User ID"
              className="rounded-2xl bg-black/40 border border-white/10 px-4 py-4 outline-none focus:border-cyan-400"
            />
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email for Stripe checkout"
              className="rounded-2xl bg-black/40 border border-white/10 px-4 py-4 outline-none focus:border-cyan-400"
            />
            <input
              value={coupon}
              onChange={(e) => setCoupon(e.target.value)}
              placeholder="Coupon code"
              className="rounded-2xl bg-black/40 border border-white/10 px-4 py-4 outline-none focus:border-cyan-400"
            />
          </div>

          <div className="flex flex-col md:flex-row gap-3 mt-4 items-center justify-between">
            <p className="text-sm text-zinc-400">
              Free Basic coupon: <span className="text-cyan-300 font-bold">NOVA-BASIC-FREE</span>
            </p>
            <button
              onClick={applyBasicCoupon}
              disabled={!userId || !coupon || loadingPlan === "basic-coupon"}
              className="rounded-2xl bg-emerald-500 px-6 py-3 font-bold text-black disabled:opacity-50"
            >
              {loadingPlan === "basic-coupon" ? "Applying..." : "Apply Free Basic"}
            </button>
          </div>

          {message && (
            <p className="mt-4 rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-sm text-zinc-200">
              {message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl"
            >
              <h2 className="text-3xl font-bold">{plan.name}</h2>
              <p className="text-5xl font-black mt-6">{plan.price}</p>

              <div className="space-y-4 mt-8">
                {plan.features.map((feature) => (
                  <div
                    key={feature}
                    className="rounded-2xl bg-black/30 border border-white/5 px-4 py-3 text-zinc-300"
                  >
                    {feature}
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleCheckout(plan.id)}
                disabled={loadingPlan === plan.id}
                className="mt-10 w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-600 py-4 font-bold text-lg hover:scale-[1.02] transition-transform disabled:opacity-50"
              >
                {loadingPlan === plan.id ? "Loading..." : plan.id === "basic" ? "Get Basic / Use Coupon" : "Subscribe Now"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
