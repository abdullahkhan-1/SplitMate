import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { Sidebar } from "@/components/layout/Sidebar";
import { AuthPage } from "@/components/auth/AuthPage";
import { DashboardPage } from "@/components/dashboard/DashboardPage";
import { WalletPage } from "@/components/wallet/WalletPage";
import { ExpensesPage } from "@/components/expenses/ExpensesPage";
import { DebtsPage } from "@/components/debts/DebtsPage";
import { FriendsPage } from "@/components/friends/FriendsPage";

function App() {
  const { user, loading, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<AuthPage />} />
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-gray-950">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/wallet" element={<WalletPage />} />
            <Route path="/expenses" element={<ExpensesPage />} />
            <Route path="/debts" element={<DebtsPage />} />
            <Route path="/friends" element={<FriendsPage />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;