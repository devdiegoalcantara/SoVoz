import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import KanbanBoard from "@/components/tickets/KanbanBoard";

export default function KanbanPage() {
  const { isAuthenticated, isAdmin } = useAuth();
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    // Redirect if not authenticated or not admin
    if (!isAuthenticated) {
      setLocation("/login");
    } else if (!isAdmin) {
      setLocation("/tickets");
    }
  }, [isAuthenticated, isAdmin, setLocation]);

  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <Sidebar />
      <main className="flex-1 flex flex-col transition-all duration-300">
        <Header title="Kanban" showSearch={false} />
        <div className="container mx-auto p-4 md:p-6 flex-1">
          <KanbanBoard />
        </div>
      </main>
    </div>
  );
}
