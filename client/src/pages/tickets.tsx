import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import TicketTable from "@/components/tickets/TicketTable";

export default function TicketsPage() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  
  useEffect(() => {
    // Redirect if not authenticated
    if (!isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, setLocation]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <Sidebar />
      <main className="flex-1 flex flex-col transition-all duration-300">
        <Header title="Chamados" onSearch={setSearchQuery} />
        <div className="container mx-auto p-4 md:p-6 flex-1">
          <TicketTable searchQuery={searchQuery} />
        </div>
      </main>
    </div>
  );
}
