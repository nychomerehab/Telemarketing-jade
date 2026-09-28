import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import { useEffect } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import DashboardLayout from "./components/DashboardLayout";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAuth } from "./_core/hooks/useAuth";
import Home from "./pages/Home";
import NewSale from "./pages/NewSale";
import MySales from "./pages/MySales";
import AdminOverview from "./pages/AdminOverview";
import Categories from "./pages/Categories";
import UserManagement from "@/pages/UserManagement";
import Commissions from "@/pages/Commissions";

function AdminOnly({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && user?.role !== "admin") navigate("/");
  }, [loading, user?.role, navigate]);

  if (loading || !user || user.role !== "admin") return null;
  return <>{children}</>;
}

function TeamSalesRoute() { return <AdminOnly><AdminOverview /></AdminOnly>; }
function CommissionsRoute() { return <AdminOnly><Commissions /></AdminOnly>; }
function CategoriesRoute() { return <AdminOnly><Categories /></AdminOnly>; }
function UserManagementRoute() { return <AdminOnly><UserManagement /></AdminOnly>; }

function Router() {
  return <DashboardLayout><Switch><Route path="/" component={Home} /><Route path="/new-sale" component={NewSale} /><Route path="/my-sales" component={MySales} /><Route path="/team" component={TeamSalesRoute} /><Route path="/commissions" component={CommissionsRoute} /><Route path="/categories" component={CategoriesRoute} /><Route path="/settings/user-management" component={UserManagementRoute} /><Route path="/404" component={NotFound} /><Route component={NotFound} /></Switch></DashboardLayout>;
}

function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}

export default App;
