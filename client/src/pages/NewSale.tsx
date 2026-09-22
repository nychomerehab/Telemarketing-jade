import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, ChevronLeft, Loader2, ReceiptText, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

const currency = (value: number | string | null | undefined) => new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", minimumFractionDigits: 2 }).format(Number(value ?? 0));
const localDate = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(new Date());
const displayDate = (value: string) => new Date(`${value}T12:00:00`).toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" });

const moneyFields = [
  ["landingPageInitialOrder", "LANDING PAGE INITIAL ORDER"],
  ["resellerDistributorPackage", "RESELLER/DISTRIBUTOR PACKAGE"],
  ["messaging", "MESSAGING"],
  ["warmLeadsOutboundCalls", "WARM LEADS/OUTBOUND CALLS"],
  ["advancedPayment", "ADVANCED PAYMENT"],
  ["hotleadsUpsellCalls", "HOTLEADS/UPSELL CALLS"],
] as const;

type FormState = { saleDate: string; customerName: string; categoryId: string; landingPageInitialOrder: string; resellerDistributorPackage: string; messaging: string; warmLeadsOutboundCalls: string; advancedPayment: string; hotleadsUpsellCalls: string };
const initialForm = (): FormState => ({ saleDate: localDate(), customerName: "", categoryId: "", landingPageInitialOrder: "0.00", resellerDistributorPackage: "0.00", messaging: "0.00", warmLeadsOutboundCalls: "0.00", advancedPayment: "0.00", hotleadsUpsellCalls: "0.00" });
const parseAmount = (value: string) => Number(value.replace(/,/g, "")) || 0;

export default function NewSale() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [form, setForm] = useState<FormState>(initialForm);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [success, setSuccess] = useState(false);
  const { data: categories, isLoading: categoriesLoading } = trpc.categories.list.useQuery();
  const utils = trpc.useUtils();
  const createSale = trpc.sales.create.useMutation({
    onSuccess: () => { setConfirmOpen(false); setSuccess(true); utils.sales.dashboard.invalidate(); utils.sales.mine.invalidate(); toast.success("Sale successfully recorded."); },
    onError: (error) => toast.error(error.message),
  });

  const total = useMemo(() => [form.landingPageInitialOrder, form.resellerDistributorPackage, form.messaging, form.warmLeadsOutboundCalls, form.hotleadsUpsellCalls].reduce((sum, value) => sum + parseAmount(value), 0), [form]);
  const selectedCategory = categories?.find((category) => String(category.id) === form.categoryId);
  const update = (key: keyof FormState, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const canReview = form.customerName.trim().length > 0 && Boolean(form.categoryId) && !categoriesLoading;

  const review = (event: React.FormEvent) => { event.preventDefault(); if (!form.customerName.trim()) return toast.error("Customer name is required."); if (!form.categoryId) return toast.error("Choose a sales category."); setConfirmOpen(true); };
  const submit = () => createSale.mutate({ ...form, categoryId: Number(form.categoryId) });
  const reset = () => { setForm(initialForm()); setSuccess(false); };

  if (success) return <div className="min-h-screen px-5 py-12 md:px-10 max-w-3xl mx-auto flex items-center"><div className="w-full rounded-[2rem] bg-white border border-[#e3ebe6] p-8 md:p-12 text-center shadow-[0_18px_50px_rgba(20,63,53,0.08)]"><div className="mx-auto h-16 w-16 rounded-full bg-[#d7eee4] flex items-center justify-center text-[#143f35]"><CheckCircle2 className="h-8 w-8" /></div><p className="mt-6 text-xs font-semibold uppercase tracking-[0.22em] text-[#ef7b55]">Recorded</p><h1 className="mt-2 text-4xl font-semibold tracking-[-0.04em] text-[#143f35]">Sale successfully recorded.</h1><p className="mt-3 text-[#6b7c73]">The entry is now part of your sales history.</p><div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center"><Button onClick={reset} className="rounded-xl bg-[#143f35] hover:bg-[#0f3029] h-11 px-6">Add another sale</Button><Link href="/my-sales" className="inline-flex items-center justify-center rounded-xl border border-[#dbe6df] px-6 h-11 text-sm font-semibold text-[#143f35] hover:bg-[#f6f7f5]">View my sales</Link></div></div></div>;

  return <div className="min-h-screen px-5 py-7 md:px-10 md:py-10 max-w-5xl mx-auto"><div className="mb-8"><Link href="/" className="inline-flex items-center gap-1 text-sm font-medium text-[#6b7c73] hover:text-[#143f35]"><ChevronLeft className="h-4 w-4" /> Back to overview</Link><div className="mt-6 flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#ef7b55]">Sales encoding</p><h1 className="mt-2 text-4xl md:text-5xl font-semibold tracking-[-0.05em] text-[#143f35]">New sale</h1><p className="mt-2 text-[#6b7c73]">Capture the details while the conversation is still fresh.</p></div><div className="hidden md:flex items-center gap-2 rounded-full bg-[#e8f3ed] px-4 py-2 text-xs font-semibold text-[#527064]"><ShieldCheck className="h-4 w-4" /> Agent identity locked</div></div></div>
    <form onSubmit={review} className="space-y-5">
      <section className="rounded-[1.5rem] bg-white border border-[#e3ebe6] p-6 md:p-8"><SectionTitle eyebrow="Sale information" title="When and who" /><div className="grid gap-5 md:grid-cols-2"><Field label="DATE"><Input type="date" value={form.saleDate} onChange={(e) => update("saleDate", e.target.value)} className="h-12 rounded-xl bg-[#fbfcfb]" required /></Field><Field label="AGENT NAME"><div className="h-12 rounded-xl bg-[#edf5f0] px-4 flex items-center text-sm font-semibold text-[#143f35]">{user?.name || "Current agent"}<span className="ml-auto text-xs font-medium text-[#7c9186]">Auto-filled</span></div></Field></div></section>
      <section className="rounded-[1.5rem] bg-white border border-[#e3ebe6] p-6 md:p-8"><SectionTitle eyebrow="Customer information" title="Who did you speak with?" /><Field label="CUSTOMER'S NAME"><Input value={form.customerName} onChange={(e) => update("customerName", e.target.value)} placeholder="e.g. Juan Dela Cruz" className="h-12 rounded-xl bg-[#fbfcfb]" required /></Field></section>
      <section className="rounded-[1.5rem] bg-white border border-[#e3ebe6] p-6 md:p-8"><SectionTitle eyebrow="Sales breakdown" title="Break the sale down" /><div className="grid gap-5 md:grid-cols-2">{moneyFields.map(([key, label]) => <Field key={key} label={label}>{key === "advancedPayment" ? <AmountInput value={form[key]} onChange={(value) => update(key, value)} /> : <AmountInput value={form[key]} onChange={(value) => update(key, value)} />}</Field>)}<Field label="SALES CATEGORY"><select value={form.categoryId} onChange={(e) => update("categoryId", e.target.value)} className="h-12 w-full rounded-xl border border-[#dbe6df] bg-[#fbfcfb] px-4 text-sm text-[#143f35] outline-none focus:ring-2 focus:ring-[#ef7b55]/30" required><option value="">{categoriesLoading ? "Loading categories…" : "Select a category"}</option>{categories?.filter((category) => category.isActive === 1).map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select></Field></div><p className="mt-5 text-xs text-[#8a9d92]">Advanced payment is tracked separately and is not included in Total POS Sales.</p></section>
      <section className="rounded-[1.5rem] bg-[#143f35] p-6 md:p-8 text-white flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6"><div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#a9d8c4]">Total</p><h2 className="mt-2 text-2xl font-semibold tracking-tight">TOTAL POS SALES</h2><p className="mt-1 text-sm text-[#b7d8cb]">Calculated from five sale amount fields.</p></div><p className="text-4xl md:text-5xl font-semibold tracking-[-0.05em] text-[#f6fbf8]">{currency(total)}</p></section>
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3"><Button type="button" variant="outline" onClick={() => setForm(initialForm())} className="h-12 rounded-xl border-[#dbe6df] text-[#527064]">Clear form</Button><Button type="submit" disabled={!canReview} className="h-12 rounded-xl bg-[#ef7b55] hover:bg-[#d96845] text-white px-7"><ReceiptText className="h-4 w-4 mr-2" />Review & confirm</Button></div>
    </form>
    {confirmOpen && <ConfirmModal form={form} total={total} agentName={user?.name || "Current agent"} categoryName={selectedCategory?.name || "—"} pending={createSale.isPending} onBack={() => setConfirmOpen(false)} onConfirm={submit} />}
  </div>;
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) { return <div className="mb-6"><p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#ef7b55]">{eyebrow}</p><h2 className="mt-1 text-xl font-semibold tracking-tight text-[#143f35]">{title}</h2></div>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div><Label className="mb-2 block text-[11px] font-semibold tracking-[0.14em] text-[#6b7c73]">{label}</Label>{children}</div>; }
function AmountInput({ value, onChange }: { value: string; onChange: (value: string) => void }) { return <div className="relative"><span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-[#8a9d92]">₱</span><Input type="text" inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value.replace(/[^0-9.,]/g, ""))} onFocus={(e) => onChange(e.target.value.replace(/,/g, ""))} onBlur={(e) => { const numeric = parseAmount(e.target.value); onChange(numeric.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })); }} className="h-12 rounded-xl bg-[#fbfcfb] pl-9 text-right font-medium" aria-label="Amount in Philippine pesos" /> </div>; }

function ConfirmModal({ form, total, agentName, categoryName, pending, onBack, onConfirm }: { form: FormState; total: number; agentName: string; categoryName: string; pending: boolean; onBack: () => void; onConfirm: () => void }) {
  const rows: Array<[string, string]> = [["Date", displayDate(form.saleDate)], ["Agent", agentName], ["Customer", form.customerName], ["Landing Page Initial Order", currency(parseAmount(form.landingPageInitialOrder))], ["Reseller / Distributor Package", currency(parseAmount(form.resellerDistributorPackage))], ["Messaging", currency(parseAmount(form.messaging))], ["Sales Category", categoryName], ["Warm Leads / Outbound Calls", currency(parseAmount(form.warmLeadsOutboundCalls))], ["Advanced Payment", currency(parseAmount(form.advancedPayment))], ["Hotleads / Upsell Calls", currency(parseAmount(form.hotleadsUpsellCalls))]];
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#143f35]/45 p-4 backdrop-blur-sm"><div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-[1.5rem] bg-white shadow-2xl"><div className="border-b border-[#e3ebe6] p-6"><p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#ef7b55]">One last look</p><h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#143f35]">Confirm sales entry</h2><p className="mt-1 text-sm text-[#6b7c73]">Review the values before saving them permanently.</p></div><div className="p-6 space-y-3">{rows.map(([label, value]) => <div key={label} className="flex items-start justify-between gap-5 text-sm"><span className="text-[#7c9186]">{label}</span><span className={`text-right font-medium ${label === "Sales Category" ? "text-[#ef7b55]" : "text-[#143f35]"}`}>{value}</span></div>)}<div className="mt-5 rounded-xl bg-[#e8f3ed] p-4 flex items-end justify-between"><span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#527064]">Total POS Sales</span><span className="text-2xl font-semibold text-[#143f35]">{currency(total)}</span></div></div><div className="flex flex-col-reverse sm:flex-row justify-end gap-3 border-t border-[#e3ebe6] p-6"><Button variant="outline" onClick={onBack} disabled={pending} className="h-11 rounded-xl border-[#dbe6df]">Back / edit</Button><Button onClick={onConfirm} disabled={pending} className="h-11 rounded-xl bg-[#143f35] hover:bg-[#0f3029]">{pending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}Confirm & submit</Button></div></div></div>;
}
