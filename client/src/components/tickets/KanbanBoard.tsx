import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";

interface Ticket {
  id: number;
  title: string;
  description: string;
  type: string;
  department: string;
  status: string;
  createdAt: string;
}

export default function KanbanBoard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [draggedTicket, setDraggedTicket] = useState<Ticket | null>(null);

  // Fetch tickets
  const { data, isLoading, error } = useQuery<{ tickets: Ticket[] }>({
    queryKey: ["/api/tickets"],
  });

  // Update ticket status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await apiRequest("PATCH", `/api/tickets/${id}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      toast({
        title: "Status atualizado",
        description: "Ticket movido com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao mover ticket",
        description: "Não foi possível atualizar o status do ticket.",
        variant: "destructive",
      });
    },
  });

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy");
    } catch (e) {
      return "Data inválida";
    }
  };

  // Handle drag start
  const handleDragStart = (ticket: Ticket) => {
    setDraggedTicket(ticket);
  };

  // Handle drag end
  const handleDragEnd = () => {
    setDraggedTicket(null);
  };

  // Handle drop
  const handleDrop = async (status: string) => {
    if (!draggedTicket) return;

    // Don't update if status is the same
    if (draggedTicket.status === status) return;

    await updateStatusMutation.mutateAsync({
      id: draggedTicket.id,
      status,
    });
  };

  // Group tickets by status
  const newTickets = data?.tickets.filter(t => t.status === "Novo") || [];
  const inProgressTickets = data?.tickets.filter(t => t.status === "Em andamento") || [];
  const resolvedTickets = data?.tickets.filter(t => t.status === "Resolvido") || [];

  // Handle ticket click
  const handleTicketClick = (id: number) => {
    setLocation(`/ticket/${id}`);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-2xl text-primary mb-4"></i>
          <p>Carregando quadro Kanban...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 text-error">
        <i className="fas fa-exclamation-circle text-2xl mb-2"></i>
        <p>Erro ao carregar os tickets. Tente novamente.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text">Kanban</h1>
        <p className="text-gray-500 text-sm">Visualize e gerencie os tickets de forma visual</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Novo */}
        <div 
          className="bg-white rounded-lg shadow-sm"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleDrop("Novo");
          }}
        >
          <div className="p-4 border-b border-gray-200 bg-blue-50">
            <h3 className="font-medium text-blue-800 flex items-center">
              <i className="fas fa-circle text-xs mr-2"></i>
              Novo
              <span className="ml-auto bg-blue-200 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                {newTickets.length}
              </span>
            </h3>
          </div>

          <div className="p-4 space-y-4 min-h-[200px]">
            {newTickets.map((ticket, index) => (
              <div 
                key={ticket.id}
                className="bg-cardBg p-3 rounded-md border border-gray-200 shadow-sm cursor-move hover:shadow-md transition"
                draggable
                onDragStart={() => handleDragStart(ticket)}
                onDragEnd={handleDragEnd}
                onClick={() => handleTicketClick(ticket.id)}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-medium text-gray-500">#{index + 1}</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    ticket.type === "Bug" ? "bg-red-100 text-red-800" :
                    ticket.type === "Sugestão" ? "bg-blue-100 text-blue-800" :
                    "bg-purple-100 text-purple-800"
                  }`}>
                    <i className={`${
                      ticket.type === "Bug" ? "fas fa-bug" :
                      ticket.type === "Sugestão" ? "fas fa-lightbulb" :
                      "fas fa-comment"
                    } mr-1 text-xs`}></i>
                    {ticket.type}
                  </span>
                </div>
                <h4 className="font-medium text-text mb-2">{ticket.title}</h4>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">{ticket.department}</span>
                  <span className="text-xs text-gray-500">{formatDate(ticket.createdAt)}</span>
                </div>
              </div>
            ))}

            {newTickets.length === 0 && (
              <div className="text-center p-4 text-gray-400">
                <p>Nenhum ticket novo</p>
              </div>
            )}
          </div>
        </div>

        {/* Em andamento */}
        <div 
          className="bg-white rounded-lg shadow-sm"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleDrop("Em andamento");
          }}
        >
          <div className="p-4 border-b border-gray-200 bg-yellow-50">
            <h3 className="font-medium text-yellow-800 flex items-center">
              <i className="fas fa-circle text-xs mr-2"></i>
              Em andamento
              <span className="ml-auto bg-yellow-200 text-yellow-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                {inProgressTickets.length}
              </span>
            </h3>
          </div>

          <div className="p-4 space-y-4 min-h-[200px]">
            {inProgressTickets.map((ticket, index) => (
              <div 
                key={ticket.id}
                className="bg-cardBg p-3 rounded-md border border-gray-200 shadow-sm cursor-move hover:shadow-md transition"
                draggable
                onDragStart={() => handleDragStart(ticket)}
                onDragEnd={handleDragEnd}
                onClick={() => handleTicketClick(ticket.id)}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-medium text-gray-500">#{index + 1}</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    ticket.type === "Bug" ? "bg-red-100 text-red-800" :
                    ticket.type === "Sugestão" ? "bg-blue-100 text-blue-800" :
                    "bg-purple-100 text-purple-800"
                  }`}>
                    <i className={`${
                      ticket.type === "Bug" ? "fas fa-bug" :
                      ticket.type === "Sugestão" ? "fas fa-lightbulb" :
                      "fas fa-comment"
                    } mr-1 text-xs`}></i>
                    {ticket.type}
                  </span>
                </div>
                <h4 className="font-medium text-text mb-2">{ticket.title}</h4>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">{ticket.department}</span>
                  <span className="text-xs text-gray-500">{formatDate(ticket.createdAt)}</span>
                </div>
              </div>
            ))}

            {inProgressTickets.length === 0 && (
              <div className="text-center p-4 text-gray-400">
                <p>Nenhum ticket em andamento</p>
              </div>
            )}
          </div>
        </div>

        {/* Resolvido */}
        <div 
          className="bg-white rounded-lg shadow-sm"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleDrop("Resolvido");
          }}
        >
          <div className="p-4 border-b border-gray-200 bg-green-50">
            <h3 className="font-medium text-green-800 flex items-center">
              <i className="fas fa-circle text-xs mr-2"></i>
              Resolvido
              <span className="ml-auto bg-green-200 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                {resolvedTickets.length}
              </span>
            </h3>
          </div>

          <div className="p-4 space-y-4 min-h-[200px]">
            {resolvedTickets.map((ticket, index) => (
              <div 
                key={ticket.id}
                className="bg-cardBg p-3 rounded-md border border-gray-200 shadow-sm cursor-move hover:shadow-md transition"
                draggable
                onDragStart={() => handleDragStart(ticket)}
                onDragEnd={handleDragEnd}
                onClick={() => handleTicketClick(ticket.id)}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-medium text-gray-500">#{index + 1}</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    ticket.type === "Bug" ? "bg-red-100 text-red-800" :
                    ticket.type === "Sugestão" ? "bg-blue-100 text-blue-800" :
                    "bg-purple-100 text-purple-800"
                  }`}>
                    <i className={`${
                      ticket.type === "Bug" ? "fas fa-bug" :
                      ticket.type === "Sugestão" ? "fas fa-lightbulb" :
                      "fas fa-comment"
                    } mr-1 text-xs`}></i>
                    {ticket.type}
                  </span>
                </div>
                <h4 className="font-medium text-text mb-2">{ticket.title}</h4>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">{ticket.department}</span>
                  <span className="text-xs text-gray-500">{formatDate(ticket.createdAt)}</span>
                </div>
              </div>
            ))}

            {resolvedTickets.length === 0 && (
              <div className="text-center p-4 text-gray-400">
                <p>Nenhum ticket resolvido</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}