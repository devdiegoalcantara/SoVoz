import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import TicketForm from "@/components/tickets/TicketForm";

export default function NewTicketPage() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  
  // No redirect here because anonymous users can also create tickets
  
  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      {isAuthenticated && <Sidebar />}
      <main className="flex-1 flex flex-col transition-all duration-300">
        <Header title="Novo Ticket" showSearch={false} />
        <div className="container mx-auto p-4 md:p-6 flex-1">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-text">Novo Ticket</h1>
            <p className="text-gray-500 text-sm">Criar um novo ticket no sistema</p>
          </div>
          
          <TicketForm />
        </div>
      </main>
    </div>
  );
}
