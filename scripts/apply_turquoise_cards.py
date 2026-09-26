from pathlib import Path
path = Path("client/src/pages/Home.tsx")
text = path.read_text()
agent_old = 'rounded-[1.5rem] border border-[#d2e0d8] bg-[#b6c9bf]/80 p-6 md:p-7 text-[#143f35] shadow-[0_16px_40px_rgba(71,126,119,0.12)] backdrop-blur-xl'
agent_new = 'rounded-[1.5rem] border border-[#16aeb2] bg-[#20C5C9] p-6 md:p-7 text-[#143f35] shadow-[0_16px_40px_rgba(32,197,201,0.22)]'
if agent_old not in text:
    raise SystemExit("agent card class not found")
text = text.replace(agent_old, agent_new, 1)

highlight_old = 'border border-[#d2e0d8] bg-[#b6c9bf]/80 text-[#143f35] shadow-[0_16px_40px_rgba(71,126,119,0.12)] backdrop-blur-xl'
highlight_new = 'border border-[#16aeb2] bg-[#20C5C9] text-[#143f35] shadow-[0_16px_40px_rgba(32,197,201,0.22)]'
if highlight_old not in text:
    raise SystemExit("Today highlight class not found")
text = text.replace(highlight_old, highlight_new, 1)
text = text.replace('dark ? "bg-white/10 text-[#527064] hover:bg-white/20"', 'dark ? "bg-white/25 text-[#143f35] hover:bg-white/40"', 1)
path.write_text(text)
print("Updated Today and agent sales cards to #20C5C9")
