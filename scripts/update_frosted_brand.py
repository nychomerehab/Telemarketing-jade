from pathlib import Path

layout = Path("client/src/components/DashboardLayout.tsx")
text = layout.read_text()
old = '<div className="min-w-0"><p className="font-bold tracking-tight text-[#143f35] truncate">SHINJIRU TELEMARKETING</p><p className="text-[11px] text-[#6b7c73]">Sales command center</p></div>'
new = '<div className="min-w-0 flex items-center gap-2"><img src="/manus-storage/shinjiru-logo_9113e2f3.png" alt="SHINJIRU" className="h-11 w-11 rounded-xl object-cover shadow-sm" /><div><p className="font-bold tracking-tight text-[#143f35] truncate">SHINJIRU TELEMARKETING</p><p className="text-[11px] text-[#6b7c73]">Sales command center</p></div></div>'
if old not in text:
    raise SystemExit("sidebar brand target not found")
layout.write_text(text.replace(old, new, 1))

home = Path("client/src/pages/Home.tsx")
text = home.read_text()
text = text.replace('rounded-[1.5rem] bg-[#143f35] p-6 md:p-7 text-white shadow-[0_16px_40px_rgba(20,63,53,0.14)]', 'rounded-[1.5rem] border border-white/70 bg-white/65 p-6 md:p-7 text-[#143f35] shadow-[0_16px_40px_rgba(71,126,119,0.12)] backdrop-blur-xl', 1)
text = text.replace('rounded-[1.5rem] p-6 md:p-7 ${highlight ? "bg-[#143f35] text-white shadow-[0_16px_40px_rgba(20,63,53,0.16)]" : "bg-white border border-[#e3ebe6]"}', 'rounded-[1.5rem] p-6 md:p-7 ${highlight ? "border border-white/70 bg-white/65 text-[#143f35] shadow-[0_16px_40px_rgba(71,126,119,0.12)] backdrop-blur-xl" : "bg-white/70 border border-white/80 shadow-[0_12px_32px_rgba(71,126,119,0.08)] backdrop-blur-xl"}', 1)
text = text.replace('text-[#a9d8c4]', 'text-[#527064]')
text = text.replace('text-[#d2e9df]', 'text-[#6b7c73]')
text = text.replace('bg-white/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#b7d8cb]', 'bg-[#e8f3ed] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#527064]')
text = text.replace('text-[#b7d8cb]', 'text-[#7c9186]')
text = text.replace('text-white', 'text-[#143f35]')
home.write_text(text)
