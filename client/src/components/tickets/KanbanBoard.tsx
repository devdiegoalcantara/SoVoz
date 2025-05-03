import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";

interface Ticket {
  id: string;
  title: string;
  description: string;
  type: string;
  department: string;
  status: string;
  createdAt: string;
  submitterName?: string;
  submitterEmail?: string;
  comments?: { author: string; text: string; createdAt: string }[];
}

export default function KanbanBoard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [draggedTicket, setDraggedTicket] = useState<Ticket | null>(null);
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState<{ [key: string]: string }>({});
  const [commentLoading, setCommentLoading] = useState<{ [key: string]: boolean }>({});
  const [commentSuccess, setCommentSuccess] = useState<{ [key: string]: boolean }>({});
  const [statusLoading, setStatusLoading] = useState<{ [key: string]: boolean }>({});
  const { user } = useAuth();
  // Estados para efeito visual de drag and drop
  const [dragOverStatus, setDragOverStatus] = useState<string | null>(null);

  // Fetch tickets
  const { data, isLoading, error } = useQuery<{ tickets: Ticket[] }>({
    queryKey: ["/api/tickets"],
    queryFn: async () => {
      const response = await fetch("/api/tickets", {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) {
        throw new Error('Erro ao carregar tickets');
      }
      const result = await response.json();
      return { tickets: result.tickets || [] };
    }
  });

  // Update ticket status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return await apiRequest("PATCH", `/api/tickets/${id}/status`, { status });
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

  // Função para expandir/recolher card
  const toggleExpand = (id: string) => {
    setExpandedTicketId(expandedTicketId === id ? null : id);
  };

  // Função para alterar status direto no card
  const handleStatusChange = async (ticket: Ticket, newStatus: string) => {
    setStatusLoading((prev) => ({ ...prev, [ticket.id]: true }));
    await updateStatusMutation.mutateAsync({ id: ticket.id, status: newStatus });
    setStatusLoading((prev) => ({ ...prev, [ticket.id]: false }));
  };

  // Função para enviar comentário (agora integrada ao backend)
  const handleSendComment = async (ticket: Ticket) => {
    setCommentLoading((prev) => ({ ...prev, [ticket.id]: true }));
    try {
      const response = await fetch(`/api/tickets/${ticket.id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ author: user?.name || "Usuário", text: commentText[ticket.id] })
      });
      if (!response.ok) throw new Error("Erro ao enviar comentário");
      const data = await response.json();
      // Buscar ticket atualizado do backend
      const updatedTicketRes = await fetch(`/api/tickets/${ticket.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (updatedTicketRes.ok) {
        const updatedTicketData = await updatedTicketRes.json();
        ticket.comments = updatedTicketData.ticket.comments;
      }
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      setCommentLoading((prev) => ({ ...prev, [ticket.id]: false }));
      setCommentSuccess((prev) => ({ ...prev, [ticket.id]: true }));
      setCommentText((prev) => ({ ...prev, [ticket.id]: "" }));
      toast({
        title: "Comentário enviado",
        description: "Sua resposta foi adicionada ao ticket.",
      });
      setTimeout(() => setCommentSuccess((prev) => ({ ...prev, [ticket.id]: false })), 2000);
    } catch (err) {
      setCommentLoading((prev) => ({ ...prev, [ticket.id]: false }));
      toast({
        title: "Erro ao enviar comentário",
        description: "Não foi possível enviar o comentário.",
        variant: "destructive",
      });
    }
  };

  // Handle ticket click
  const handleTicketClick = (id: string) => {
    toggleExpand(id);
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
        <h1 className="text-xl font-bold text-text">Gerenciamento de Tickets</h1>
        <p className="text-gray-500 text-sm">Visualize e gerencie os tickets de forma visual</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-x-auto">
        {/* Novo */}
        <div
          className={`rounded-lg shadow-sm min-w-[300px] transition-all duration-200 ${dragOverStatus === "Novo" ? "outline outline-4 outline-blue-400 bg-blue-50" : "border-2 border-transparent"} ${dragOverStatus !== "Novo" ? "bg-white" : ""}`}
          onDragOver={e => { e.preventDefault(); setDragOverStatus("Novo"); }}
          onDrop={() => { handleDrop("Novo"); setDragOverStatus(null); }}
          onDragEnter={e => { e.preventDefault(); setDragOverStatus("Novo"); }}
          onDragLeave={e => { e.preventDefault(); setDragOverStatus(null); }}
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
              <Card
                key={ticket.id}
                className={`transition-all duration-300 border-2 ${expandedTicketId === ticket.id ? "border-blue-400 shadow-lg" : "border-gray-200 shadow-sm"} ${draggedTicket?.id === ticket.id ? "opacity-50 scale-105 shadow-2xl" : ""}`}
                draggable={true}
                onDragStart={() => handleDragStart(ticket)}
                onDragEnd={handleDragEnd}
                onDragEnter={e => e.stopPropagation()}
                onDragOver={e => e.stopPropagation()}
              >
                <CardContent
                  className="p-4 cursor-pointer"
                  onClick={() => handleTicketClick(ticket.id)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ticket.type === "Bug" ? "bg-red-100 text-red-800" : ticket.type === "Sugestão" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"}`}>
                        <i className={`${ticket.type === "Bug" ? "fas fa-bug" : ticket.type === "Sugestão" ? "fas fa-lightbulb" : "fas fa-comment"} mr-1 text-xs`}></i>
                        {ticket.type}
                      </span>
                      <span className="ml-2 text-xs text-gray-500">{ticket.department}</span>
                    </div>
                    <button
                      className="ml-2 text-gray-400 hover:text-blue-600 focus:outline-none"
                      onClick={e => { e.stopPropagation(); toggleExpand(ticket.id); }}
                      aria-label={expandedTicketId === ticket.id ? "Recolher" : "Expandir"}
                    >
                      <i className={`fas fa-chevron-${expandedTicketId === ticket.id ? "up" : "down"}`}></i>
                    </button>
                  </div>
                  <h4 className="font-medium text-text mt-2 mb-1">{ticket.title}</h4>
                  <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
                    <span>Status: {ticket.status}</span>
                    <span>{formatDate(ticket.createdAt)}</span>
                  </div>
                  {/* Status buttons/dropdown */}
                  {expandedTicketId === ticket.id && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {[
                        "Novo",
                        "Em andamento",
                        "Resolvido"
                      ].map(statusOpt => (
                        <button
                          key={statusOpt}
                          className={`px-2 py-1 rounded text-xs font-semibold border max-w-full ${ticket.status === statusOpt ? (statusOpt === "Novo" ? "bg-blue-100 text-blue-800 border-blue-300" : statusOpt === "Em andamento" ? "bg-yellow-100 text-yellow-800 border-yellow-300" : "bg-green-100 text-green-800 border-green-300") : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"} ${statusLoading[ticket.id] ? "opacity-50 cursor-not-allowed" : ""}`}
                          onClick={e => { e.stopPropagation(); handleStatusChange(ticket, statusOpt); }}
                          disabled={ticket.status === statusOpt || statusLoading[ticket.id]}
                        >
                          {statusOpt}
                        </button>
                      ))}
                    </div>
                  )}
                  {/* Expansível: detalhes, descrição, submitter, comentários, resposta */}
                  {expandedTicketId === ticket.id && (
                    <div className="mt-2 animate-fade-in">
                      <div className="text-sm text-gray-700 mb-2 whitespace-pre-line">{ticket.description}</div>
                      {ticket.submitterName && (
                        <div className="text-xs text-gray-500 mb-1">Nome: {ticket.submitterName}</div>
                      )}
                      {ticket.submitterEmail && (
                        <div className="text-xs text-gray-500 mb-2">Email: {ticket.submitterEmail}</div>
                      )}
                      {/* Comentários reais */}
                      <div className="mb-2">
                        <span className="font-semibold text-xs text-gray-600">Comentários</span>
                        {ticket.comments && ticket.comments.length > 0 ? (
                          <div className="mt-1 space-y-1">
                            {ticket.comments.map((c, idx) => (
                              <div key={idx} className="text-xs text-gray-700 bg-gray-100 rounded p-1">
                                <span className="font-semibold">{c.author}:</span> {c.text}
                                <span className="ml-2 text-gray-400 text-[10px]">{formatDate(c.createdAt)}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-xs text-gray-500 mt-1">Nenhum comentário ainda</div>
                        )}
                      </div>
                      {/* Campo para resposta */}
                      <div className="flex flex-wrap gap-2 mt-2">
                        <input
                          type="text"
                          className="flex-1 min-w-0 border rounded px-2 py-1 text-xs"
                          placeholder="Digite sua resposta..."
                          value={commentText[ticket.id] || ""}
                          onChange={e => setCommentText(prev => ({ ...prev, [ticket.id]: e.target.value }))}
                          disabled={commentLoading[ticket.id]}
                          onClick={e => e.stopPropagation()}
                        />
                        <button
                          className="px-3 py-1 rounded bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 max-w-full"
                          onClick={e => { e.stopPropagation(); handleSendComment(ticket); }}
                          disabled={!commentText[ticket.id] || commentLoading[ticket.id]}
                        >
                          {commentLoading[ticket.id] ? <i className="fas fa-spinner fa-spin"></i> : "Enviar"}
                        </button>
                      </div>
                      {commentSuccess[ticket.id] && (
                        <div className="text-green-600 text-xs mt-1">Comentário enviado com sucesso!</div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
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
          className={`rounded-lg shadow-sm min-w-[300px] transition-all duration-200 ${dragOverStatus === "Em andamento" ? "outline outline-4 outline-yellow-400 bg-yellow-50" : "border-2 border-transparent"} ${dragOverStatus !== "Em andamento" ? "bg-white" : ""}`}
          onDragOver={e => { e.preventDefault(); setDragOverStatus("Em andamento"); }}
          onDrop={() => { handleDrop("Em andamento"); setDragOverStatus(null); }}
          onDragEnter={e => { e.preventDefault(); setDragOverStatus("Em andamento"); }}
          onDragLeave={e => { e.preventDefault(); setDragOverStatus(null); }}
        >
          <div className="p-4 border-b border-gray-200 bg-yellow-50">
            <h3 className="font-medium text-yellow-800 flex items-center">
              <i className="fas fa-circle text-xs mr-2"></i>
              Em Andamento
              <span className="ml-auto bg-yellow-200 text-yellow-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                {inProgressTickets.length}
              </span>
            </h3>
          </div>
          <div className="p-4 space-y-4 min-h-[200px]">
            {inProgressTickets.map((ticket, index) => (
              <Card
                key={ticket.id}
                className={`transition-all duration-300 border-2 ${expandedTicketId === ticket.id ? "border-yellow-400 shadow-lg" : "border-gray-200 shadow-sm"} ${draggedTicket?.id === ticket.id ? "opacity-50 scale-105 shadow-2xl" : ""}`}
                draggable={true}
                onDragStart={() => handleDragStart(ticket)}
                onDragEnd={handleDragEnd}
                onDragEnter={e => e.stopPropagation()}
                onDragOver={e => e.stopPropagation()}
              >
                <CardContent
                  className="p-4 cursor-pointer"
                  onClick={() => handleTicketClick(ticket.id)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ticket.type === "Bug" ? "bg-red-100 text-red-800" : ticket.type === "Sugestão" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"}`}>
                        <i className={`${ticket.type === "Bug" ? "fas fa-bug" : ticket.type === "Sugestão" ? "fas fa-lightbulb" : "fas fa-comment"} mr-1 text-xs`}></i>
                        {ticket.type}
                      </span>
                      <span className="ml-2 text-xs text-gray-500">{ticket.department}</span>
                    </div>
                    <button
                      className="ml-2 text-gray-400 hover:text-yellow-600 focus:outline-none"
                      onClick={e => { e.stopPropagation(); toggleExpand(ticket.id); }}
                      aria-label={expandedTicketId === ticket.id ? "Recolher" : "Expandir"}
                    >
                      <i className={`fas fa-chevron-${expandedTicketId === ticket.id ? "up" : "down"}`}></i>
                    </button>
                  </div>
                  <h4 className="font-medium text-text mt-2 mb-1">{ticket.title}</h4>
                  <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
                    <span>Status: {ticket.status}</span>
                    <span>{formatDate(ticket.createdAt)}</span>
                  </div>
                  {/* Status buttons/dropdown */}
                  {expandedTicketId === ticket.id && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {[
                        "Novo",
                        "Em andamento",
                        "Resolvido"
                      ].map(statusOpt => (
                        <button
                          key={statusOpt}
                          className={`px-2 py-1 rounded text-xs font-semibold border max-w-full ${ticket.status === statusOpt ? (statusOpt === "Novo" ? "bg-blue-100 text-blue-800 border-blue-300" : statusOpt === "Em andamento" ? "bg-yellow-100 text-yellow-800 border-yellow-300" : "bg-green-100 text-green-800 border-green-300") : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"} ${statusLoading[ticket.id] ? "opacity-50 cursor-not-allowed" : ""}`}
                          onClick={e => { e.stopPropagation(); handleStatusChange(ticket, statusOpt); }}
                          disabled={ticket.status === statusOpt || statusLoading[ticket.id]}
                        >
                          {statusOpt}
                        </button>
                      ))}
                    </div>
                  )}
                  {/* Expansível: detalhes, descrição, submitter, comentários, resposta */}
                  {expandedTicketId === ticket.id && (
                    <div className="mt-2 animate-fade-in">
                      <div className="text-sm text-gray-700 mb-2 whitespace-pre-line">{ticket.description}</div>
                      {ticket.submitterName && (
                        <div className="text-xs text-gray-500 mb-1">Nome: {ticket.submitterName}</div>
                      )}
                      {ticket.submitterEmail && (
                        <div className="text-xs text-gray-500 mb-2">Email: {ticket.submitterEmail}</div>
                      )}
                      {/* Comentários reais */}
                      <div className="mb-2">
                        <span className="font-semibold text-xs text-gray-600">Comentários</span>
                        {ticket.comments && ticket.comments.length > 0 ? (
                          <div className="mt-1 space-y-1">
                            {ticket.comments.map((c, idx) => (
                              <div key={idx} className="text-xs text-gray-700 bg-gray-100 rounded p-1">
                                <span className="font-semibold">{c.author}:</span> {c.text}
                                <span className="ml-2 text-gray-400 text-[10px]">{formatDate(c.createdAt)}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-xs text-gray-500 mt-1">Nenhum comentário ainda</div>
                        )}
                      </div>
                      {/* Campo para resposta */}
                      <div className="flex flex-wrap gap-2 mt-2">
                        <input
                          type="text"
                          className="flex-1 min-w-0 border rounded px-2 py-1 text-xs"
                          placeholder="Digite sua resposta..."
                          value={commentText[ticket.id] || ""}
                          onChange={e => setCommentText(prev => ({ ...prev, [ticket.id]: e.target.value }))}
                          disabled={commentLoading[ticket.id]}
                          onClick={e => e.stopPropagation()}
                        />
                        <button
                          className="px-3 py-1 rounded bg-yellow-600 text-white text-xs font-semibold hover:bg-yellow-700 disabled:opacity-50 max-w-full"
                          onClick={e => { e.stopPropagation(); handleSendComment(ticket); }}
                          disabled={!commentText[ticket.id] || commentLoading[ticket.id]}
                        >
                          {commentLoading[ticket.id] ? <i className="fas fa-spinner fa-spin"></i> : "Enviar"}
                        </button>
                      </div>
                      {commentSuccess[ticket.id] && (
                        <div className="text-green-600 text-xs mt-1">Comentário enviado com sucesso!</div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
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
          className={`rounded-lg shadow-sm min-w-[300px] transition-all duration-200 ${dragOverStatus === "Resolvido" ? "outline outline-4 outline-green-400 bg-green-50" : "border-2 border-transparent"} ${dragOverStatus !== "Resolvido" ? "bg-white" : ""}`}
          onDragOver={e => { e.preventDefault(); setDragOverStatus("Resolvido"); }}
          onDrop={() => { handleDrop("Resolvido"); setDragOverStatus(null); }}
          onDragEnter={e => { e.preventDefault(); setDragOverStatus("Resolvido"); }}
          onDragLeave={e => { e.preventDefault(); setDragOverStatus(null); }}
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
              <Card
                key={ticket.id}
                className={`transition-all duration-300 border-2 ${expandedTicketId === ticket.id ? "border-green-400 shadow-lg" : "border-gray-200 shadow-sm"} ${draggedTicket?.id === ticket.id ? "opacity-50 scale-105 shadow-2xl" : ""}`}
                draggable={true}
                onDragStart={() => handleDragStart(ticket)}
                onDragEnd={handleDragEnd}
                onDragEnter={e => e.stopPropagation()}
                onDragOver={e => e.stopPropagation()}
              >
                <CardContent
                  className="p-4 cursor-pointer"
                  onClick={() => handleTicketClick(ticket.id)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ticket.type === "Bug" ? "bg-red-100 text-red-800" : ticket.type === "Sugestão" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"}`}>
                        <i className={`${ticket.type === "Bug" ? "fas fa-bug" : ticket.type === "Sugestão" ? "fas fa-lightbulb" : "fas fa-comment"} mr-1 text-xs`}></i>
                        {ticket.type}
                      </span>
                      <span className="ml-2 text-xs text-gray-500">{ticket.department}</span>
                    </div>
                    <button
                      className="ml-2 text-gray-400 hover:text-green-600 focus:outline-none"
                      onClick={e => { e.stopPropagation(); toggleExpand(ticket.id); }}
                      aria-label={expandedTicketId === ticket.id ? "Recolher" : "Expandir"}
                    >
                      <i className={`fas fa-chevron-${expandedTicketId === ticket.id ? "up" : "down"}`}></i>
                    </button>
                  </div>
                  <h4 className="font-medium text-text mt-2 mb-1">{ticket.title}</h4>
                  <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
                    <span>Status: {ticket.status}</span>
                    <span>{formatDate(ticket.createdAt)}</span>
                  </div>
                  {/* Status buttons/dropdown */}
                  {expandedTicketId === ticket.id && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {[
                        "Novo",
                        "Em andamento",
                        "Resolvido"
                      ].map(statusOpt => (
                        <button
                          key={statusOpt}
                          className={`px-2 py-1 rounded text-xs font-semibold border max-w-full ${ticket.status === statusOpt ? (statusOpt === "Novo" ? "bg-blue-100 text-blue-800 border-blue-300" : statusOpt === "Em andamento" ? "bg-yellow-100 text-yellow-800 border-yellow-300" : "bg-green-100 text-green-800 border-green-300") : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"} ${statusLoading[ticket.id] ? "opacity-50 cursor-not-allowed" : ""}`}
                          onClick={e => { e.stopPropagation(); handleStatusChange(ticket, statusOpt); }}
                          disabled={ticket.status === statusOpt || statusLoading[ticket.id]}
                        >
                          {statusOpt}
                        </button>
                      ))}
                    </div>
                  )}
                  {/* Expansível: detalhes, descrição, submitter, comentários, resposta */}
                  {expandedTicketId === ticket.id && (
                    <div className="mt-2 animate-fade-in">
                      <div className="text-sm text-gray-700 mb-2 whitespace-pre-line">{ticket.description}</div>
                      {ticket.submitterName && (
                        <div className="text-xs text-gray-500 mb-1">Nome: {ticket.submitterName}</div>
                      )}
                      {ticket.submitterEmail && (
                        <div className="text-xs text-gray-500 mb-2">Email: {ticket.submitterEmail}</div>
                      )}
                      {/* Comentários reais */}
                      <div className="mb-2">
                        <span className="font-semibold text-xs text-gray-600">Comentários</span>
                        {ticket.comments && ticket.comments.length > 0 ? (
                          <div className="mt-1 space-y-1">
                            {ticket.comments.map((c, idx) => (
                              <div key={idx} className="text-xs text-gray-700 bg-gray-100 rounded p-1">
                                <span className="font-semibold">{c.author}:</span> {c.text}
                                <span className="ml-2 text-gray-400 text-[10px]">{formatDate(c.createdAt)}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-xs text-gray-500 mt-1">Nenhum comentário ainda</div>
                        )}
                      </div>
                      {/* Campo para resposta */}
                      <div className="flex flex-wrap gap-2 mt-2">
                        <input
                          type="text"
                          className="flex-1 min-w-0 border rounded px-2 py-1 text-xs"
                          placeholder="Digite sua resposta..."
                          value={commentText[ticket.id] || ""}
                          onChange={e => setCommentText(prev => ({ ...prev, [ticket.id]: e.target.value }))}
                          disabled={commentLoading[ticket.id]}
                          onClick={e => e.stopPropagation()}
                        />
                        <button
                          className="px-3 py-1 rounded bg-green-600 text-white text-xs font-semibold hover:bg-green-700 disabled:opacity-50 max-w-full"
                          onClick={e => { e.stopPropagation(); handleSendComment(ticket); }}
                          disabled={!commentText[ticket.id] || commentLoading[ticket.id]}
                        >
                          {commentLoading[ticket.id] ? <i className="fas fa-spinner fa-spin"></i> : "Enviar"}
                        </button>
                      </div>
                      {commentSuccess[ticket.id] && (
                        <div className="text-green-600 text-xs mt-1">Comentário enviado com sucesso!</div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
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