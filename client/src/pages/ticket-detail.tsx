import { useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import TicketDetail from "@/components/tickets/TicketDetail";

export default function TicketDetailPage() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const params = useParams();
  
  useEffect(() => {
    // Redirect if not authenticated
    if (!isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, setLocation]);

  if (!isAuthenticated) {
    return null;
  }

  // Get ticket ID from URL params
  const { id } = params;
  console.log("TicketDetailPage - id do params:", id);

  if (!id) {
    return (
      <div className="flex flex-col md:flex-row min-h-screen">
        <Sidebar />
        <main className="flex-1 flex flex-col transition-all duration-300">
          <Header title="Detalhes do Ticket" showSearch={false} />
          <div className="container mx-auto p-4 md:p-6 flex-1">
            <div className="text-center p-8">
              <div className="text-error mb-4">
                <i className="fas fa-exclamation-circle text-4xl"></i>
              </div>
              <h3 className="text-xl font-bold mb-2">Ticket não encontrado</h3>
              <p className="text-gray-600">O ID do ticket não foi fornecido.</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <Sidebar />
      <main className="flex-1 flex flex-col transition-all duration-300">
        <Header title="Detalhes do Ticket" showSearch={false} />
        <div className="container mx-auto p-4 md:p-6 flex-1">
          <TicketDetail ticketId={id} />
        </div>
      </main>
    </div>
  );
}
