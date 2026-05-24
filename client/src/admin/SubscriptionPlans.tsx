const plans = [
  {
    name: "Basic",
    price: "$9",
    features: ["50 AI messages/day", "Standard AI", "Basic memory"],
  },
  {
    name: "Advanced",
    price: "$29",
    features: ["200 AI messages/day", "Faster AI", "Voice AI"],
  },
  {
    name: "Pro",
    price: "$99",
    features: ["Unlimited usage", "Realtime AI", "Admin analytics"],
  },
];

export default function SubscriptionPlans() {
  async function handleCheckout(plan: string) {
    const response = await fetch("http://localhost:5000/api/payments/create-checkout-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ plan }),
    });

    const data = await response.json();

    if (data.url) {
      window.location.href = data.url;
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
            Choose your AI power level.
          </p>
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
                onClick={() => handleCheckout(plan.name.toLowerCase())}
                className="mt-10 w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-600 py-4 font-bold text-lg hover:scale-[1.02] transition-transform"
              >
                Subscribe Now
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
