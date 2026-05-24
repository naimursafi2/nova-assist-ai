import { Users, CreditCard, Activity, BrainCircuit } from "lucide-react";

const stats = [
  {
    title: "Total Users",
    value: "12,480",
    icon: Users,
  },
  {
    title: "Revenue",
    value: "$8,420",
    icon: CreditCard,
  },
  {
    title: "AI Requests",
    value: "94K",
    icon: Activity,
  },
  {
    title: "Memory Sessions",
    value: "1,204",
    icon: BrainCircuit,
  },
];

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <h1 className="text-5xl font-black tracking-tight bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
            Aura AI Admin Dashboard
          </h1>
          <p className="text-zinc-400 mt-3 text-lg">
            Manage users, payments, AI memory, analytics and realtime systems.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {stats.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-2xl"
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-zinc-400 text-sm">{item.title}</p>
                    <h2 className="text-3xl font-bold mt-2">{item.value}</h2>
                  </div>
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
                    <Icon className="h-7 w-7" />
                  </div>
                </div>

                <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
                  <div className="h-full w-3/4 bg-gradient-to-r from-cyan-400 to-purple-500" />
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-8">
          <div className="xl:col-span-2 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl min-h-[420px]">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold">Realtime Analytics</h2>
              <span className="px-4 py-2 rounded-full bg-emerald-500/20 text-emerald-400 text-sm">
                Live
              </span>
            </div>

            <div className="h-[280px] rounded-3xl border border-dashed border-white/10 flex items-center justify-center text-zinc-500 text-lg">
              Analytics chart system ready
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl min-h-[420px]">
            <h2 className="text-2xl font-bold mb-6">System Status</h2>

            <div className="space-y-5">
              {[
                "MongoDB Connected",
                "Socket Server Running",
                "AI Memory Enabled",
                "Voice AI Ready",
                "Payments Active",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center justify-between rounded-2xl bg-black/30 border border-white/5 px-4 py-4"
                >
                  <span>{item}</span>
                  <span className="h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.8)]" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
