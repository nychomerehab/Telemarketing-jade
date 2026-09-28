import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { ArrowUpRight, CalendarDays, ClipboardList, CreditCard, Flame, Loader2, Package, Percent, PhoneCall, Plus, Send, ShoppingBag, Sparkles, Users } from "lucide-react";
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
  ["Commission", "commission", Percent, "neutral"],
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
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(localDate);
  const queryInput = useMemo(() => ({ date: selectedDate }), [selectedDate]);
  const { data, isLoading, error } = trpc.admin.overview.useQuery(queryInput, { enabled: user?.role === "admin" });
  return (
    <div className="min-h-screen px-5 py-7 md:px-10 md:py-10 max-w-[1440px] mx-auto">
      <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between mb-9"><div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#ef7b55]">Super admin workspace</p><h1 className="mt-2 text-4xl md:text-5xl font-semibold tracking-[-0.05em] text-[#143f35]">Good day, {user?.name?.split(" ")[0]?.toUpperCase() || "THERE"}.</h1><p className="mt-2 text-[#6b7c73]">BELIEVE 信じる · Monitor today’s pace and keep your team’s data clean.</p></div><Link href="/team" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white border border-[#dbe6df] px-5 py-3 text-sm font-semibold text-[#143f35] hover:border-[#143f35] transition-colors"><Users className="h-4 w-4" /> View team sales</Link></header>
      {isLoading ? <LoadingState /> : error ? <ErrorState message="Could not load the team dashboard." /> : <DashboardSections data={data} admin selectedDate={selectedDate} onDateChange={setSelectedDate} />}
    </div>
  );
}

function DashboardSections({ data, admin = false, selectedDate, onDateChange }: { data: any; admin?: boolean; selectedDate: string; onDateChange: (value: string) => void }) {
  return <>
    <div className="grid gap-4 xl:grid-cols-2 mb-8"><KpiPanel label="TODAY" icon={CalendarDays} data={data?.today} highlight selectedDate={selectedDate} onDateChange={onDateChange} admin={admin} /><KpiPanel label="THIS MONTH" icon={CalendarDays} data={data?.month} selectedDate={selectedDate} onDateChange={onDateChange} admin={admin} /></div>
    {admin ? <><AgentPerformanceCards agents={data?.agentPerformance || []} selectedDate={selectedDate} onDateChange={onDateChange} /><AdminSnapshot data={data} /></> : <div className="rounded-[1.5rem] bg-[#e8f3ed] p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-5"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#527064]">Keep the momentum</p><h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#143f35]">Your next sale is one call away.</h2><p className="mt-2 text-sm text-[#6b7c73]">Encode it while the details are fresh.</p></div><Link href="/new-sale" className="inline-flex items-center gap-2 self-start rounded-xl bg-[#ef7b55] px-5 py-3 text-sm font-semibold text-white hover:bg-[#d96845] transition-colors">New sale <ArrowUpRight className="h-4 w-4" /></Link></div>}
  </>;
}

function AgentPerformanceCards({ agents, selectedDate, onDateChange }: { agents: any[]; selectedDate: string; onDateChange: (value: string) => void }) {
  return <section className="mb-8"><div className="flex items-end justify-between mb-4"><div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#ef7b55]">AGENT PERFORMANCE</p><h2 className="mt-1 text-2xl font-semibold tracking-tight text-[#143f35]">Category performance by agent</h2></div><Link href="/team" className="text-sm font-semibold text-[#ef7b55] hover:underline">Open full report</Link></div><div className="grid gap-4 xl:grid-cols-2">{agents.map((agent) => <AgentCard key={agent.username} agent={agent} selectedDate={selectedDate} onDateChange={onDateChange} />)}</div></section>;
}

function AgentCard({ agent, selectedDate, onDateChange }: { agent: any; selectedDate: string; onDateChange: (value: string) => void }) {
  return <article className="rounded-[1.5rem] bg-[#143f35] p-6 md:p-7 text-white shadow-[0_16px_40px_rgba(20,63,53,0.14)]"><div className="flex items-center justify-between mb-6"><div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#a9d8c4]">{agent.name}</p><p className="mt-1 text-sm text-[#d2e9df]">{formatDate(selectedDate)} · sales performance</p></div><div className="flex items-center gap-2"><span className="hidden sm:inline rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#b7d8cb]">This month {currency(agent.month?.totalPosSales)}</span><DatePicker value={selectedDate} onChange={onDateChange} dark /></div></div><div className="grid grid-cols-2 md:grid-cols-4 gap-x-5 gap-y-6">{metrics.map(([name, key, MetricIcon]) => <div key={key}><div className="flex min-h-[2.5rem] items-start gap-1.5 text-xs leading-4 text-[#b7d8cb]"><MetricIcon className="h-3.5 w-3.5" />{name}</div><p className="mt-1.5 text-xl font-semibold tracking-tight text-white">{key === "orders" ? whole(agent.today?.[key]) : currency(agent.today?.[key])}</p></div>)}</div></article>;
}

function KpiPanel({ label, icon: Icon, data, highlight = false, selectedDate, onDateChange, admin = false }: { label: string; icon: any; data: any; highlight?: boolean; selectedDate: string; onDateChange: (value: string) => void; admin?: boolean }) { const [activeMetric, setActiveMetric] = useState<string | null>(null); const period = label === "TODAY" ? "today" : "month"; const drilldown = trpc.admin.drilldown.useQuery({ metric: (activeMetric || "totalPosSales") as any, period, date: selectedDate }, { enabled: Boolean(activeMetric) && admin }); return <><section className={`rounded-[1.5rem] p-6 md:p-7 ${highlight ? "bg-[#143f35] text-white shadow-[0_16px_40px_rgba(20,63,53,0.16)]" : "bg-white border border-[#e3ebe6]"}`}><div className="flex items-center justify-between mb-6"><div><p className={`text-xs font-semibold uppercase tracking-[0.22em] ${highlight ? "text-[#a9d8c4]" : "text-[#8a9d92]"}`}>{label}</p><p className={`mt-1 text-sm ${highlight ? "text-[#d2e9df]" : "text-[#6b7c73]"}`}>{label === "TODAY" ? formatDate(selectedDate) : "Sales performance"}</p></div><DatePicker value={selectedDate} onChange={onDateChange} dark={highlight} /></div><div className="grid grid-cols-2 md:grid-cols-4 gap-x-5 gap-y-6">{metrics.map(([name, key, MetricIcon]) => <button type="button" key={key} onClick={() => admin && setActiveMetric(key)} disabled={!admin} className={`text-left ${admin ? "cursor-pointer rounded-xl p-2 -m-2 transition-all hover:bg-white/10 hover:shadow-lg" : "cursor-default"}`}><div className={`flex min-h-[2.5rem] items-start gap-1.5 text-xs leading-4 ${highlight ? "text-[#b7d8cb]" : "text-[#7c9186]"}`}><MetricIcon className="h-3.5 w-3.5" />{name}</div><p className={`mt-1.5 text-xl font-semibold tracking-tight ${highlight ? "text-white" : "text-[#143f35]"}`}>{key === "orders" ? whole(data?.[key]) : currency(data?.[key])}</p>{admin && <span className={`text-[10px] ${highlight ? "text-[#a9d8c4]" : "text-[#ef7b55]"}`}>View report →</span>}</button>)}</div></section>{activeMetric && <KpiReportModal title={metrics.find((item) => item[1] === activeMetric)?.[0] || "KPI"} period={period} data={drilldown.data} loading={drilldown.isLoading} onClose={() => setActiveMetric(null)} />}</>;
}

function DatePicker({ value, onChange, dark = false }: { value: string; onChange: (value: string) => void; dark?: boolean }) {
  return <label className={`relative h-10 w-10 rounded-xl flex items-center justify-center cursor-pointer ${dark ? "bg-white/10 text-[#a9d8c4] hover:bg-white/20" : "bg-[#edf5f0] text-[#ef7b55] hover:bg-[#dfeee6]"}`} title={`Choose date (currently ${formatDate(value)})`}><CalendarDays className="h-5 w-5" /><input type="date" value={value} onChange={(event) => event.target.value && onChange(event.target.value)} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" aria-label="Choose dashboard date" /></label>;
}

function AdminSnapshot({ data }: { data: any }) {
  return <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]"><section className="rounded-[1.5rem] bg-white border border-[#e3ebe6] p-6"><div className="flex items-center justify-between mb-5"><div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a9d92]">TOP AGENTS</p><h2 className="mt-1 text-xl font-semibold text-[#143f35]">This month’s pace</h2></div><Link href="/team" className="text-sm font-semibold text-[#ef7b55] hover:underline">Open report</Link></div><div className="space-y-4">{(data?.agents || []).slice(0, 4).map((agent: any, index: number) => <div key={`${agent.name}-${index}`} className="flex items-center gap-3"><div className="h-9 w-9 rounded-full bg-[#d7eee4] text-[#143f35] flex items-center justify-center text-sm font-semibold">{index + 1}</div><div className="flex-1 min-w-0"><p className="font-semibold text-sm text-[#143f35] truncate">{agent.name}</p><p className="text-xs text-[#8a9d92]">{whole(agent.orders)} orders</p></div><p className="font-semibold text-sm text-[#143f35]">{currency(agent.total)}</p></div>)}{!data?.agents?.length && <p className="text-sm text-[#8a9d92] py-6">No sales recorded this month yet.</p>}</div></section><section className="rounded-[1.5rem] bg-[#fff1ea] p-6"><p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#b75a3d]">DATA HYGIENE</p><h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#7b3b29]">Categories stay in your hands.</h2><p className="mt-3 text-sm leading-6 text-[#9b5c47]">Activate the labels your team needs and keep the sales dropdown focused.</p><Link href="/categories" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#b75a3d] hover:underline">Manage categories <ArrowUpRight className="h-4 w-4" /></Link></section></div>;
}

function LoadingState() { return <div className="flex items-center justify-center rounded-[1.5rem] bg-white border border-[#e3ebe6] min-h-72 text-[#6b7c73]"><Loader2 className="h-5 w-5 animate-spin mr-2" />Loading your workspace…</div>; }
function ErrorState({ message }: { message: string }) { return <div className="rounded-[1.5rem] border border-[#f2c8b9] bg-[#fff1ea] p-6 text-[#9b5c47]">{message}</div>; }

function KpiReportModal({ title, period, data, loading, onClose }: { title: string; period: string; data: any; loading: boolean; onClose: () => void }) { return <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#143f35]/45 p-4 backdrop-blur-sm"><div className="max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-[1.5rem] bg-white shadow-2xl"><div className="flex items-start justify-between border-b border-[#e3ebe6] p-6"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#ef7b55]">Detailed KPI report · {period}</p><h2 className="mt-2 text-2xl font-semibold text-[#143f35]">{title} Report</h2><div className="mt-3 flex gap-5 text-sm text-[#527064]"><span>Total: <strong>{currency(data?.total)}</strong></span><span>Orders: <strong>{whole(data?.orders)}</strong></span><span>Agents: <strong>{whole(data?.agents)}</strong></span></div></div><button type="button" onClick={onClose} className="rounded-xl border border-[#dbe6df] px-4 py-2 text-sm font-semibold text-[#527064]">Close</button></div><div className="max-h-[65vh] overflow-auto p-6">{loading ? <div className="py-12 text-center text-[#6b7c73]">Loading report…</div> : <table className="w-full text-left"><thead className="border-b border-[#e3ebe6] text-[10px] uppercase tracking-[0.14em] text-[#8a9d92]"><tr>{["Date", "Customer", "Agent", "Category", "Landing Page", "Upsell", "Total POS", "Status"].map((heading) => <th key={heading} className="px-3 py-3 whitespace-nowrap">{heading}</th>)}</tr></thead><tbody className="divide-y divide-[#edf2ee]">{(data?.rows || []).map((row: any) => <tr key={row.sale.id}><td className="px-3 py-3 text-sm text-[#6b7c73] whitespace-nowrap">{formatDate(row.sale.saleDate)}</td><td className="px-3 py-3 text-sm font-semibold text-[#143f35] whitespace-nowrap">{row.sale.customerName}</td><td className="px-3 py-3 text-sm text-[#527064] whitespace-nowrap">{row.agentName || "—"}</td><td className="px-3 py-3 text-sm text-[#ef7b55] whitespace-nowrap">{row.categoryName}</td><td className="px-3 py-3 text-sm text-[#527064] whitespace-nowrap">{currency(row.sale.landingPageInitialOrder)}</td><td className="px-3 py-3 text-sm text-[#527064] whitespace-nowrap">{currency(row.sale.hotleadsUpsellCalls)}</td><td className="px-3 py-3 text-sm font-semibold text-[#143f35] whitespace-nowrap">{currency(row.sale.totalPosSales)}</td><td className="px-3 py-3 text-sm text-[#527064] whitespace-nowrap">{row.sale.clientStatus || "NO STATUS"}</td></tr>)}</tbody></table>}</div></div></div>; }
