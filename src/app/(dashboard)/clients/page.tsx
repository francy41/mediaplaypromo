"use client";
import { Search, Plus, Eye, MoreHorizontal, Users, DollarSign, TrendingUp, ArrowUpRight } from "lucide-react";

const clients = [
  { name: "Agencia CreativeFlow",  email: "info@creativeflow.com",   plan: "Agencia",    spend: "$1,240",  status: "Activo",  joined: "12 Ene 2025" },
  { name: "TechStartup MX",        email: "hello@techstartup.mx",    plan: "Pro",         spend: "$299",    status: "Activo",  joined: "18 Feb 2025" },
  { name: "Influencer Ana R.",     email: "ana@anarincon.com",       plan: "Pro",         spend: "$299",    status: "Activo",  joined: "03 Mar 2025" },
  { name: "MarketingPro LATAM",    email: "contact@mktpro.lat",      plan: "Enterprise",  spend: "$4,800",  status: "Activo",  joined: "22 Mar 2025" },
  { name: "Studio Digital",        email: "hola@studiodigital.co",   plan: "Agencia",    spend: "$1,240",  status: "Pendiente",joined: "01 Abr 2025" },
];

const statusStyle: Record<string, string> = {
  Activo:    "bg-green-500/15 text-green-400 border-green-500/20",
  Pendiente: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
};

export default function ClientsPage() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Clientes Totales", value: "5", icon: Users,      bg: "bg-cyan-500/20",   color: "text-cyan-400",   change: "+8%" },
          { label: "Ingresos MRR",     value: "$7,878",icon: DollarSign,bg:"bg-green-500/20", color: "text-green-400",  change: "+22%" },
          { label: "Tasa Retención",   value: "94%",  icon: TrendingUp,bg:"bg-purple-500/20", color: "text-purple-400", change: "+3%" },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-[#0f1219] border border-white/8 rounded-2xl p-5">
              <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <p className="text-white font-bold text-xl">{s.value}</p>
              <p className="text-white/40 text-xs mt-0.5">{s.label}</p>
              <div className="flex items-center gap-1 mt-2">
                <ArrowUpRight className="w-3 h-3 text-green-400" />
                <span className="text-green-400 text-xs">{s.change}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-[#0f1219] border border-white/8 rounded-2xl">
        <div className="flex items-center gap-3 p-5 border-b border-white/8">
          <h2 className="text-white font-semibold">Clientes</h2>
          <div className="relative ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25" />
            <input placeholder="Buscar cliente..." className="bg-white/5 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-white/25 focus:outline-none focus:border-orange-500/40 w-44 transition-all" />
          </div>
          <button className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-400 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all">
            <Plus className="w-3.5 h-3.5" /> Nuevo
          </button>
        </div>

        <div className="grid grid-cols-[2fr_1.5fr_0.8fr_0.8fr_0.7fr_0.5fr] gap-3 px-5 py-2.5 border-b border-white/5">
          {["Cliente","Email","Plan","Gasto","Estado",""].map(h => (
            <span key={h} className="text-white/25 text-[10px] font-bold uppercase tracking-wider">{h}</span>
          ))}
        </div>

        <div className="divide-y divide-white/5">
          {clients.map((c, i) => (
            <div key={c.email} className="grid grid-cols-[2fr_1.5fr_0.8fr_0.8fr_0.7fr_0.5fr] gap-3 px-5 py-3.5 hover:bg-white/2 transition-colors">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                  {c.name.split(" ").map(n=>n[0]).join("").slice(0,2)}
                </div>
                <div><p className="text-white text-xs font-semibold">{c.name}</p><p className="text-white/30 text-[10px]">{c.joined}</p></div>
              </div>
              <div className="flex items-center text-white/50 text-xs truncate">{c.email}</div>
              <div className="flex items-center"><span className="bg-purple-500/15 text-purple-400 border border-purple-500/20 text-[10px] font-semibold px-2 py-0.5 rounded-full">{c.plan}</span></div>
              <div className="flex items-center text-white/70 text-xs font-semibold">{c.spend}</div>
              <div className="flex items-center"><span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusStyle[c.status]}`}>{c.status}</span></div>
              <div className="flex items-center gap-1">
                <button className="w-6 h-6 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/30 hover:text-white transition-colors"><Eye className="w-3 h-3" /></button>
                <button className="w-6 h-6 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/30 hover:text-white transition-colors"><MoreHorizontal className="w-3 h-3" /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
