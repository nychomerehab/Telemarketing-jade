import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { useIsMobile } from "@/hooks/useMobile";
import { BarChart3, BookOpen, KeyRound, LayoutDashboard, Loader2, LogOut, PanelLeft, Percent, PlusCircle, Settings, Tags, UserCog } from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";

const agentMenu = [{ icon: LayoutDashboard, label: "Overview", path: "/" }, { icon: PlusCircle, label: "New Sale", path: "/new-sale" }, { icon: BookOpen, label: "My Sales", path: "/my-sales" }];
const adminMenu = [{ icon: LayoutDashboard, label: "Overview", path: "/" }, { icon: BarChart3, label: "Team Sales", path: "/team" }, { icon: Percent, label: "Commissions", path: "/commissions" }, { icon: Tags, label: "Categories", path: "/categories" }, { icon: Settings, label: "Settings", path: "/settings/user-management", section: true, children: [{ icon: UserCog, label: "User Management", path: "/settings/user-management" }] }];
const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 264;
const MIN_WIDTH = 220;
const MAX_WIDTH = 420;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarWidth, setSidebarWidth] = useState(() => { const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY); return saved ? parseInt(saved, 10) : DEFAULT_WIDTH; });
  const { loading, user } = useAuth();
  useEffect(() => localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString()), [sidebarWidth]);
  if (loading) return <DashboardLayoutSkeleton />;
  if (!user) return <LoginScreen />;
  return <SidebarProvider style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}><DashboardLayoutContent user={user} setSidebarWidth={setSidebarWidth}>{children}</DashboardLayoutContent></SidebarProvider>;
}

function LoginScreen() {
  const utils = trpc.useUtils();
  const [adminMode, setAdminMode] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const login = trpc.auth.login.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      toast.success(adminMode ? "Welcome, Super Admin." : "Welcome back.");
    },
    onError: (error) => toast.error(error.message),
  });

  const submitLogin = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    login.mutate({ username, password, role: adminMode ? "admin" : "user" });
  };

  const switchToAdmin = () => {
    setAdminMode(true);
    setUsername("");
    setPassword("");
  };

  const cancelAdmin = () => {
    setAdminMode(false);
    setUsername("");
    setPassword("");
  };

  return <div className="min-h-screen bg-[#fbfbfa] text-[#162033] flex items-center justify-center px-5 py-8">
    <div className="w-full max-w-[430px]">
      {!adminMode ? <>
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#8f824c]">Staff login</p>
        <h1 className="mt-4 text-[28px] font-semibold tracking-[-0.04em] text-[#111827]">Sign in to your tasks</h1>
        <p className="mt-4 text-[15px] leading-6 text-[#6b7280]">Use the username and password provided by your Super Admin.</p>
        <form onSubmit={submitLogin} className="mt-7 space-y-4">
          <div><Label className="mb-2 block text-sm font-medium text-[#172033]">Username</Label><Input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" placeholder="e.g. cj.lonzaga" className="h-12 rounded-2xl border-[#d8dce4] bg-[#eef3ff] px-4 text-[#172033] placeholder:text-[#9ca3af]" required /></div>
          <div><Label className="mb-2 block text-sm font-medium text-[#172033]">Password</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" placeholder="Enter your password" className="h-12 rounded-2xl border-[#d8dce4] bg-white px-4 text-[#172033] placeholder:text-[#9ca3af]" required /></div>
          <Button type="submit" disabled={login.isPending} className="h-12 w-full rounded-2xl bg-[#071426] text-white hover:bg-[#12233b]">{login.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}Sign in as staff</Button>
        </form>
        <div className="my-8 flex items-center gap-4 text-xs text-[#a3a7ae]"><div className="h-px flex-1 bg-[#e5e7eb]" /><span>or</span><div className="h-px flex-1 bg-[#e5e7eb]" /></div>
        <Button type="button" variant="outline" onClick={switchToAdmin} className="h-12 w-full rounded-2xl border-[#d9dce2] bg-white text-[#1f2937] hover:bg-[#f4f5f7]">Super Admin sign in</Button>
      </> : <>
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#8f824c]">Super Admin password login</p>
        <h1 className="mt-4 text-[28px] font-semibold tracking-[-0.04em] text-[#111827]">Administrator sign in</h1>
        <p className="mt-4 text-[15px] leading-6 text-[#6b7280]">Use the administrator username and password created for your department head account.</p>
        <form onSubmit={submitLogin} className="mt-7 rounded-2xl border border-[#e0e2e6] bg-white p-4 shadow-[0_8px_30px_rgba(15,23,42,0.04)] space-y-4">
          <div><Label className="mb-2 block text-sm font-medium text-[#172033]">Administrator username</Label><Input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" placeholder="Administrator username" className="h-12 rounded-2xl border-[#d8dce4] bg-white px-4 text-[#172033] placeholder:text-[#9ca3af]" required /></div>
          <div><Label className="mb-2 block text-sm font-medium text-[#172033]">Administrator password</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" placeholder="Administrator password" className="h-12 rounded-2xl border-[#d8dce4] bg-white px-4 text-[#172033] placeholder:text-[#9ca3af]" required /></div>
          <div className="flex gap-2"><Button type="button" variant="outline" onClick={cancelAdmin} className="h-11 flex-1 rounded-2xl border-[#d9dce2] bg-white text-[#4b5563]">Cancel</Button><Button type="submit" disabled={login.isPending} className="h-11 flex-1 rounded-2xl bg-[#071426] text-white hover:bg-[#12233b]">{login.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}Sign in</Button></div>
        </form>
      </>}
      <p className="mt-8 text-center text-xs leading-5 text-[#8b9098]">Contact your Super Admin if you need a username or a password reset.</p>
    </div>
  </div>;
}

function DashboardLayoutContent({ children, user, setSidebarWidth }: { children: React.ReactNode; user: NonNullable<ReturnType<typeof useAuth>["user"]>; setSidebarWidth: (width: number) => void }) {
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const { logout } = useAuth();
  const menuItems = user.role === "admin" ? adminMenu : agentMenu;
  const activeMenuItem = menuItems.find((item) => item.path === location) || adminMenu.flatMap((item: any) => item.children || []).find((item: any) => item.path === location);
  useEffect(() => { const handleMouseMove = (e: MouseEvent) => { if (!isResizing) return; const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0; const newWidth = e.clientX - sidebarLeft; if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) setSidebarWidth(newWidth); }; const handleMouseUp = () => setIsResizing(false); if (isResizing) { document.addEventListener("mousemove", handleMouseMove); document.addEventListener("mouseup", handleMouseUp); document.body.style.cursor = "col-resize"; document.body.style.userSelect = "none"; } return () => { document.removeEventListener("mousemove", handleMouseMove); document.removeEventListener("mouseup", handleMouseUp); document.body.style.cursor = ""; document.body.style.userSelect = ""; }; }, [isResizing, setSidebarWidth]);
  return <><div ref={sidebarRef} className="relative"><Sidebar collapsible="icon" className="border-r border-[#dbe6df] bg-[#edf5f0]" disableTransition={isResizing}><SidebarHeader className="h-[84px] justify-center border-b border-[#dbe6df]"><div className="flex items-center gap-3 px-2 w-full"><button onClick={toggleSidebar} className="h-9 w-9 flex shrink-0 items-center justify-center rounded-xl bg-[#143f35] text-[#e6f4ed] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ef7b55]" aria-label="Toggle navigation"><PanelLeft className="h-4 w-4" /></button>{!isCollapsed && <div className="min-w-0"><p className="font-bold tracking-tight text-[#143f35] truncate">SHINJIRU TELEMARKETING</p><p className="text-[11px] text-[#6b7c73]">Sales command center</p></div>}</div></SidebarHeader><SidebarContent className="gap-0 pt-5">{!isCollapsed && <p className="px-5 pb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8a9d92]">Workspace</p>}<SidebarMenu className="px-2 py-1">{menuItems.map((item: any) => { const isActive = location === item.path || item.children?.some((child: any) => child.path === location); return <SidebarMenuItem key={item.path}><SidebarMenuButton isActive={isActive} onClick={() => setLocation(item.path)} tooltip={item.label} className="h-11 rounded-xl font-medium text-[#527064] data-[active=true]:bg-white data-[active=true]:text-[#143f35] data-[active=true]:shadow-sm"><item.icon className={`h-4 w-4 ${isActive ? "text-[#ef7b55]" : ""}`} /><span>{item.label}</span></SidebarMenuButton>{item.children && !isCollapsed && <div className="ml-6 mt-1 space-y-1 border-l border-[#c7dbd0] pl-2">{item.children.map((child: any) => <button key={child.path} onClick={() => setLocation(child.path)} className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium ${location === child.path ? "bg-white text-[#143f35]" : "text-[#6b7c73] hover:bg-white/60"}`}><child.icon className="h-3.5 w-3.5" />{child.label}</button>)}</div>}</SidebarMenuItem>; })}</SidebarMenu></SidebarContent><SidebarFooter className="p-3 border-t border-[#dbe6df]"><DropdownMenu><DropdownMenuTrigger asChild><button className="flex items-center gap-3 rounded-xl p-2 hover:bg-white/70 w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ef7b55]"><Avatar className="h-9 w-9 border-2 border-white shadow-sm"><AvatarFallback className="bg-[#d7eee4] text-[#143f35] font-semibold">{user.name?.charAt(0).toUpperCase() || "U"}</AvatarFallback></Avatar><div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden"><p className="text-sm font-semibold truncate text-[#143f35]">{user.name || "Team member"}</p><p className="text-xs text-[#7c9186] truncate mt-0.5">{user.role === "admin" ? "Super admin" : "Sales agent"}</p></div></button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-48"><DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive"><LogOut className="mr-2 h-4 w-4" />Sign out</DropdownMenuItem></DropdownMenuContent></DropdownMenu></SidebarFooter></Sidebar><div className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-[#ef7b55]/30 transition-colors ${isCollapsed ? "hidden" : ""}`} onMouseDown={() => setIsResizing(true)} style={{ zIndex: 50 }} /></div><SidebarInset className="bg-[#f6f7f5">{isMobile && <div className="flex border-b border-[#dbe6df] h-14 items-center gap-2 bg-[#f6f7f5]/95 px-3 backdrop-blur sticky top-0 z-40"><SidebarTrigger className="h-9 w-9 rounded-lg" /><span className="font-semibold text-[#143f35]">{activeMenuItem?.label ?? "Menu"}</span></div>}<main className="flex-1 min-w-0">{children}</main></SidebarInset></>;
}
