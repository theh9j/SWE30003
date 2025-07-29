  import { Switch, Route } from "wouter";
  import { queryClient } from "./lib/queryClient";
  import { QueryClientProvider, useQuery } from "@tanstack/react-query";
  import { Toaster } from "@/components/ui/toaster";
  import { TooltipProvider } from "@/components/ui/tooltip";
  import NotFound from "@/pages/not-found";
  import Layout from "@/components/layout/Layout";
  import Dashboard from "@/pages/Dashboard";
  import Inventory from "@/pages/Inventory";
  import Prescriptions from "@/pages/Prescriptions";
  import Customers from "@/pages/Customers";
  import Sales from "@/pages/Sales";
  import Reports from "@/pages/Reports";
  import Login from "@/pages/Login";
  import Register from "@/pages/Register";
  import Profile from "@/pages/Profile";

function AuthRouter() {
  const { data: user, isLoading } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const response = await fetch("/api/auth/me");
      if (!response.ok) return null;
      return response.json();
    },
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Switch>
        <Route path="/register" component={Register} />
        <Route component={Login} />
      </Switch>
    );
  }

  const isAdmin = user.username === "admin";
  const isPharmacist = user.role === "pharmacist";
  const isCustomer = user.role === "customer";

  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/dashboard" component={Dashboard} />
    
        {/* Shared access */}
        <Route path="/inventory" component={Inventory} />
        <Route path="/prescriptions" component={Prescriptions} />
        <Route path="/customers" component={Customers} />
        <Route path="/profile" component={Profile} />
        {/* Admin-only access */}
        {isAdmin && <Route path="/sales" component={Sales} />}
        {isAdmin && <Route path="/reports" component={Reports} />}

        {/* Block others from restricted pages */}
        {!isAdmin && (
          <>
            <Route path="/sales" component={NotFound} />
            <Route path="/reports" component={NotFound} />
          </>
        )}

        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}




  function App() {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <AuthRouter />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  export default App;
