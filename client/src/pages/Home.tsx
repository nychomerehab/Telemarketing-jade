import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { ArrowUpRight, CalendarDays, ClipboardList, CreditCard, Flame, Loader2, Package, PhoneCall, Plus, Send, ShoppingBag, Sparkles, Users } from "lucide-react";
import { useMemo, useState } from "react";

const currency = (value: number | string | null | undefined) => new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", minimumFractionDigits: 2 }).format(Number(value ?? 0));
const whole = (value: number | string | null | undefined) => new Intl.NumberFormat("en-PH").format(Number(value ?? 0));
const localDate = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(new Date());
const formatDate = (value: string) => new Date(`${value}T12:00:00`).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });

const metrics = [
  ["Total POS Sales", "totalPosSales", CreditCard, "accent"],
  ["Total Orders", "orders", ClipboardList, "neutral"],
  ["Landing Page Sales", "landingPage", ShoppingBag, "neutral"],
  ["Reseller / Distributor", "reseller", Package, "neutral"],
  ["Messaging Sales", "messaging", Send, "neutral"],
  ["Warm Leads / Outbound", "warmLeads", PhoneCall, "neutral"],
  ["Landing Page With Upsell", "hotleads", Flame, "neutral"],
  ["Advance Payments", "initialPayments", Sparkles, "warm"],
] as const;

export default function Home() {
  const { user } = useAuth();
  if (user?.role === "admin") return <AdminHome />;
  return <AgentHome />;
}

function AgentHome() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(localDate);
  const queryInput = useMemo(() => ({ date: selectedDate }), [selectedDate]);
  const { data, isLoading, error } = trpc.sales.dashboard.useQuery(queryInput);
  return (
    <div className="min-h-screen px-5 py-7 md:px-10 md:py-10 max-w-[1440px] mx-auto">
      <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between mb-9">
        <div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#ef7b55]">Agent workspace</p><h1 className="mt-2 text-4xl md:text-5xl font-semibold tracking-[-0.05em] text-[#143f35]">Good day, {user?.name?.split(" ")[0] || "there"}.</h1><p className="mt-2 text-[#6b7c73]">Here’s how your sales floor is moving.</p></div>
        <Link href="/new-sale" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#143f35] px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(20,63,53,0.18)] hover:bg-[#0f3029] transition-colors"><Plus className="h-4 w-4" /> New sale</Link>
      </header>
      {isLoading ? <LoadingState /> : error ? <ErrorState message="Could not load your dashboard." /> : <DashboardSections data={data} selectedDate={selectedDate} onDateChange={setSelectedDate} />}
    </div>
  );
}

function AdminHome() {
  const [selectedDate, setSelectedDate] = useState(localDate);
  const queryInput = useMemo(() => ({ date: selectedDate }), [selectedDate]);
  const { data, isLoading, error } = trpc.admin.overview.useQuery(queryInput);
  return (
    <div className="min-h-screen px-5 py-7 md:px-10 md:py-10 max-w-[1440px] mx-auto">
      <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between mb-9"><div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#ef7b55]">Super admin workspace</p><h1 className="mt-2 text-4xl md:text-5xl font-semibold tracking-[-0.05em] text-[#143f35]">BELIEVE 信じる</h1><p className="mt-2 text-[#6b7c73]">Monitor today’s pace and keep your team’s data clean.</p></div><Link href="/team" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white border border-[#dbe6df] px-5 py-3 text-sm font-semibold text-[#143f35] hover:border-[#143f35] transition-colors"><Users className="h-4 w-4" /> View team sales</Link></header>
      {isLoading ? <LoadingState /> : error ? <ErrorState message="Could not load the team dashboard." /> : <DashboardSections data={data} admin selectedDate={selectedDate} onDateChange={setSelectedDate} />}
    </div>
  );
}

function DashboardSections({ data, admin = false, selectedDate, onDateChange }: { data: any; admin?: boolean; selectedDate: string; onDateChange: (value: string) => void }) {
  return <>
    <div className="grid gap-4 xl:grid-cols-2 mb-8"><KpiPanel label="TODAY" icon={CalendarDays} data={data?.today} highlight selectedDate={selectedDate} onDateChange={onDateChange} /><KpiPanel label="THIS MONTH" icon={CalendarDays} data={data?.month} selectedDate={selectedDate} onDateChange={onDateChange} /></div>
    {admin ? <><AgentPerformanceCards agents={data?.agentPerformance || []} selectedDate={selectedDate} onDateChange={onDateChange} /><AdminSnapshot data={data} /></> : <div className="rounded-[1.5rem] bg-[#e8f3ed] p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-5"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#527064]">Keep the momentum</p><h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#143f35]">Your next sale is one call away.</h2><p className="mt-2 text-sm text-[#6b7c73]">Encode it while the details are fresh.</p></div><Link href="/new-sale" className="inline-flex items-center gap-2 self-start rounded-xl bg-[#ef7b55] px-5 py-3 text-sm font-semibold text-white hover:bg-[#d96845] transition-colors">New sale <ArrowUpRight className="h-4 w-4" /></Link></div>}
  </>;
}

function AgentPerformanceCards({ agents, selectedDate, onDateChange }: { agents: any[]; selectedDate: string; onDateChange: (value: string) => void }) {
  return <section className="mb-8"><div className="flex items-end justify-between mb-4"><div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#ef7b55]">AGENT PERFORMANCE</p><h2 className="mt-1 text-2xl font-semibold tracking-tight text-[#143f35]">Category performance by agent</h2></div><Link href="/team" className="text-sm font-semibold text-[#ef7b55] hover:underline">Open full report</Link></div><div className="grid gap-4 xl:grid-cols-2">{agents.map((agent) => <AgentCard key={agent.username} agent={agent} selectedDate={selectedDate} onDateChange={onDateChange} />)}</div></section>;
}

function AgentCard({ agent, selectedDate, onDateChange }: { agent: any; selectedDate: string; onDateChange: (value: string) => void }) {
  return <article className="rounded-[1.5rem] bg-[#143f35] p-6 md:p-7 text-white shadow-[0_16px_40px_rgba(20,63,53,0.14)]"><div className="flex items-center justify-between mb-6"><div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#a9d8c4]">{agent.name}</p><p className="mt-1 text-sm text-[#d2e9df]">{formatDate(selectedDate)} · sales performance</p></div><div className="flex items-center gap-2"><span className="hidden sm:inline rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#b7d8cb]">This month {currency(agent.month?.totalPosSales)}</span><DatePicker value={selectedDate} onChange={onDateChange} dark /></div></div><div className="grid grid-cols-2 md:grid-cols-4 gap-x-5 gap-y-6">{metrics.map(([name, key, MetricIcon]) => <div key={key}><div className="flex min-h-[2.5rem] items-start gap-1.5 text-xs leading-4 text-[#b7d8cb]"><MetricIcon className="h-3.5 w-3.5" />{name}</div><p className="mt-1.5 text-xl font-semibold tracking-tight text-white">{key === "orders" ? whole(agent.today?.[key]) : currency(agent.today?.[key])}</p></div>)}</div></article>;
}

function KpiPanel({ label, icon: Icon, data, highlight = false, selectedDate, onDateChange }: { label: string; icon: any; data: any; highlight?: boolean; selectedDate: string; onDateChange: (value: string) => void }) {
  return <section className={`rounded-[1.5rem] p-6 md:p-7 ${highlight ? "bg-[#143f35] text-white shadow-[0_16px_40px_rgba(20,63,53,0.16)]" : "bg-white border border-[#e3ebe6]"}`}><div className="flex items-center justify-between mb-6"><div><p className={`text-xs font-semibold uppercase tracking-[0.22em] ${highlight ? "text-[#a9d8c4]" : "text-[#8a9d92]"}`}>{label}</p><p className={`mt-1 text-sm ${highlight ? "text-[#d2e9df]" : "text-[#6b7c73]"}`}>{label === "TODAY" ? formatDate(selectedDate) : "Sales performance"}</p></div><DatePicker value={selectedDate} onChange={onDateChange} dark={highlight} /></div><div className="grid grid-cols-2 md:grid-cols-4 gap-x-5 gap-y-6">{metrics.map(([name, key, MetricIcon]) => <div key={key}><div className={`flex min-h-[2.5rem] items-start gap-1.5 text-xs leading-4 ${highlight ? "text-[#b7d8cb]" : "text-[#7c9186]"}`}><MetricIcon className="h-3.5 w-3.5" />{name}</div><p className={`mt-1.5 text-xl font-semibold tracking-tight ${highlight ? "text-white" : "text-[#143f35]"}`}>{key === "orders" ? whole(data?.[key]) : currency(data?.[key])}</p></div>)}</div></section>;
}

function DatePicker({ value, onChange, dark = false }: { value: string; onChange: (value: string) => void; dark?: boolean }) {
  return <label className={`relative h-10 w-10 rounded-xl flex items-center justify-center cursor-pointer ${dark ? "bg-white/10 text-[#a9d8c4] hover:bg-white/20" : "bg-[#edf5f0] text-[#ef7b55] hover:bg-[#dfeee6]"}`} title={`Choose date (currently ${formatDate(value)})`}><CalendarDays className="h-5 w-5" /><input type="date" value={value} onChange={(event) => event.target.value && onChange(event.target.value)} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" aria-label="Choose dashboard date" /></label>;
}

function AdminSnapshot({ data }: { data: any }) {
  return <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]"><section className="rounded-[1.5rem] bg-white border border-[#e3ebe6] p-6"><div className="flex items-center justify-between mb-5"><div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a9d92]">TOP AGENTS</p><h2 className="mt-1 text-xl font-semibold text-[#143f35]">This month’s pace</h2></div><Link href="/team" className="text-sm font-semibold text-[#ef7b55] hover:underline">Open report</Link></div><div className="space-y-4">{(data?.agents || []).slice(0, 4).map((agent: any, index: number) => <div key={`${agent.name}-${index}`} className="flex items-center gap-3"><div className="h-9 w-9 rounded-full bg-[#d7eee4] text-[#143f35] flex items-center justify-center text-sm font-semibold">{index + 1}</div><div className="flex-1 min-w-0"><p className="font-semibold text-sm text-[#143f35] truncate">{agent.name}</p><p className="text-xs text-[#8a9d92]">{whole(agent.orders)} orders</p></div><p className="font-semibold text-sm text-[#143f35]">{currency(agent.total)}</p></div>)}{!data?.agents?.length && <p className="text-sm text-[#8a9d92] py-6">No sales recorded this month yet.</p>}</div></section><section className="rounded-[1.5rem] bg-[#fff1ea] p-6"><p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#b75a3d]">DATA HYGIENE</p><h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#7b3b29]">Categories stay in your hands.</h2><p className="mt-3 text-sm leading-6 text-[#9b5c47]">Activate the labels your team needs and keep the sales dropdown focused.</p><Link href="/categories" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#b75a3d] hover:underline">Manage categories <ArrowUpRight className="h-4 w-4" /></Link></section></div>;
}

function LoadingState() { return <div className="flex items-center justify-center rounded-[1.5rem] bg-white border border-[#e3ebe6] min-h-72 text-[#6b7c73]"><Loader2 className="h-5 w-5 animate-spin mr-2" />Loading your workspace…</div>; }
function ErrorState({ message }: { message: string }) { return <div className="rounded-[1.5rem] border border-[#f2c8b9] bg-[#fff1ea] p-6 text-[#9b5c47]">{message}</div>; }
