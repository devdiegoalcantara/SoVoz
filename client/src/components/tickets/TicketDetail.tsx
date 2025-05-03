import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";

interface TicketDetailProps {
  ticketId: string;
}

export default function TicketDetail({ ticketId }: TicketDetailProps) {
  console.log("TicketDetail - ticketId recebido:", ticketId);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAdmin, user } = useAuth();
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [comentario, setComentario] = useState("");
  const [comentarioLoading, setComentarioLoading] = useState(false);
  const [comentarioErro, setComentarioErro] = useState("");
  const imgRef = useRef<HTMLImageElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Fetch ticket details using the original ID
  const { data, isLoading, error } = useQuery<{ ticket: any }>({
    queryKey: [`/api/tickets/${ticketId}`],
    queryFn: async () => {
      const response = await fetch(`/api/tickets/${ticketId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) {
        throw new Error('Erro ao carregar ticket');
      }
      return response.json();
    }
  });

  // Update ticket status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ status }: { status: string }) => {
      return await apiRequest("PATCH", `/api/tickets/${ticketId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tickets/${ticketId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      toast({
        title: "Status atualizado",
        description: "O status do ticket foi atualizado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar o status do ticket.",
        variant: "destructive",
      });
    },
  });

  const handleBack = () => {
    setLocation("/tickets");
  };

  const handleStatusChange = (status: string) => {
    setSelectedStatus(status);
  };

  const handleUpdateStatus = async () => {
    if (!selectedStatus) return;
    await updateStatusMutation.mutateAsync({ status: selectedStatus });
  };

  // Função para enviar comentário integrado ao backend
  const handleEnviarComentario = async () => {
    setComentarioLoading(true);
    setComentarioErro("");
    try {
      const response = await fetch(`/api/tickets/${ticketId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ author: user?.name || "Usuário", text: comentario })
      });
      if (!response.ok) throw new Error("Erro ao enviar comentário");
      // Buscar ticket atualizado do backend
      const updatedTicketRes = await fetch(`/api/tickets/${ticketId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (updatedTicketRes.ok && data) {
        const updatedTicketData = await updatedTicketRes.json();
        data.ticket.comments = updatedTicketData.ticket.comments;
      }
      await queryClient.invalidateQueries({ queryKey: [`/api/tickets/${ticketId}`] });
      setComentario("");
    } catch (err) {
      setComentarioErro("Erro ao enviar comentário");
    } finally {
      setComentarioLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy");
    } catch (e) {
      return "Data inválida";
    }
  };

  useEffect(() => {
    if (data && data.ticket.attachment) {
      const loadAttachment = async () => {
        try {
          const response = await fetch(`/api/tickets/${ticketId}/attachment`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          
          if (data.ticket.attachment.contentType?.startsWith('image/') && imgRef.current) {
            imgRef.current.src = url;
          } else if (data.ticket.attachment.contentType === 'video/mp4' && videoRef.current) {
            videoRef.current.src = url;
          }
        } catch (error) {
          console.error('Erro ao carregar anexo:', error);
        }
      };

      loadAttachment();
    }
  }, [data, ticketId]);

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-2xl text-primary mb-4"></i>
          <p>Carregando informações do ticket...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center p-8">
        <div className="text-error mb-4">
          <i className="fas fa-exclamation-circle text-4xl"></i>
        </div>
        <h3 className="text-xl font-bold mb-2">Erro ao carregar ticket</h3>
        <p className="text-gray-600">Não foi possível carregar as informações do ticket.</p>
        <Button 
          onClick={handleBack} 
          className="mt-4"
          variant="outline"
        >
          Voltar
        </Button>
      </div>
    );
  }

  if (!data) return null;
  const ticket = data.ticket;
  const token = localStorage.getItem('token');
  const attachmentUrl = `/api/tickets/${ticketId}/attachment`;
  const attachmentIsImage = ticket.attachment && ticket.attachment.contentType?.startsWith('image/');
  const attachmentIsVideo = ticket.attachment && ticket.attachment.contentType === 'video/mp4';

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-text">Detalhes do Ticket</h1>
          <p className="text-gray-500 text-sm">Informações completas sobre o ticket</p>
        </div>
        <Button 
          onClick={handleBack} 
          variant="outline"
          className="px-3 py-1.5 flex items-center space-x-1"
        >
          <i className="fas fa-arrow-left"></i>
          <span>Voltar</span>
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-lg font-semibold text-text">{ticket.title}</h2>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
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
              
              <div className="prose max-w-none mb-6">
                <p className="text-gray-700 whitespace-pre-line">{ticket.description}</p>
              </div>
              
              {ticket.attachment && (
                <div className="mt-6 border-t pt-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Anexo</h3>
                  {attachmentIsImage && (
                    <div className="mt-2">
                      <img 
                        ref={imgRef}
                        alt="Anexo" 
                        className="max-w-full max-h-96 rounded-lg"
                      />
                    </div>
                  )}
                  {attachmentIsVideo && (
                    <div className="mt-2">
                      <video 
                        ref={videoRef}
                        controls 
                        className="max-w-full max-h-96 rounded-lg"
                      />
                    </div>
                  )}
                  <div className="bg-gray-100 rounded-lg p-2 inline-block mt-2">
                    <div className="flex items-center space-x-2">
                      <i className={`${
                        attachmentIsImage ? "fas fa-image" :
                        attachmentIsVideo ? "fas fa-video" :
                        "fas fa-file"
                      } text-gray-500`}></i>
                      <span className="text-sm text-gray-700">{ticket.attachment.filename}</span>
                      <a 
                        href="#" 
                        target="_blank" 
                        className="text-primary hover:text-primary-dark text-sm"
                        onClick={(e) => {
                          e.preventDefault();
                          fetch(attachmentUrl, {
                            headers: {
                              'Authorization': `Bearer ${token}`
                            }
                          })
                            .then(response => response.blob())
                            .then(blob => {
                              const url = URL.createObjectURL(blob);
                              window.open(url, '_blank');
                            })
                            .catch(error => {
                              console.error('Erro ao carregar anexo:', error);
                            });
                        }}
                      >
                        Visualizar
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-6 space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Informações</h3>
                <div className="bg-gray-50 p-3 rounded-md">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">ID do Ticket</p>
                      <p className="font-medium text-text">#{ticket.id}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Status</p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        ticket.status === "Novo" ? "bg-blue-100 text-blue-800" :
                        ticket.status === "Em andamento" ? "bg-yellow-100 text-yellow-800" :
                        "bg-green-100 text-green-800"
                      }`}>
                        {ticket.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-gray-500">Data de Criação</p>
                      <p className="font-medium text-text">{formatDate(ticket.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Órgão</p>
                      <p className="font-medium text-text">{ticket.department}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {(ticket.submitterName || ticket.submitterEmail) && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Enviado por</h3>
                  <div className="flex items-center space-x-3">
                    <div className="bg-gray-200 h-10 w-10 rounded-full flex items-center justify-center">
                      <i className="fas fa-user text-gray-500"></i>
                    </div>
                    <div>
                      <p className="font-medium text-text">{ticket.submitterName || "Usuário anônimo"}</p>
                      {ticket.submitterEmail && (
                        <p className="text-sm text-gray-500">{ticket.submitterEmail}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {isAdmin && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Atualizar status</h3>
                  <Select
                    value={selectedStatus || ticket.status}
                    onValueChange={handleStatusChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={ticket.status} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Novo">Novo</SelectItem>
                      <SelectItem value="Em andamento">Em andamento</SelectItem>
                      <SelectItem value="Resolvido">Resolvido</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    className="mt-3 w-full"
                    onClick={handleUpdateStatus}
                    disabled={!selectedStatus || selectedStatus === ticket.status || updateStatusMutation.isPending}
                  >
                    {updateStatusMutation.isPending ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        Atualizando...
                      </>
                    ) : "Atualizar"}
                  </Button>
                </div>
              )}
              {/* Comentários reais */}
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Comentários</h3>
                {ticket.comments && ticket.comments.length > 0 ? (
                  <div className="space-y-2">
                    {ticket.comments.map((c: any, idx: number) => (
                      <div key={idx} className="bg-gray-100 rounded p-2 text-xs">
                        <span className="font-semibold">{c.author}:</span> {c.text}
                        <span className="ml-2 text-gray-400 text-[10px]">{formatDate(c.createdAt)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-gray-500">Nenhum comentário ainda</div>
                )}
                {/* Campo para adicionar comentário */}
                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    className="flex-1 border rounded px-2 py-1 text-xs"
                    placeholder="Digite seu comentário..."
                    value={comentario}
                    onChange={e => setComentario(e.target.value)}
                    disabled={comentarioLoading}
                  />
                  <Button
                    onClick={handleEnviarComentario}
                    disabled={!comentario || comentarioLoading}
                  >
                    {comentarioLoading ? <i className="fas fa-spinner fa-spin"></i> : "Enviar"}
                  </Button>
                </div>
                {comentarioErro && <div className="text-red-600 text-xs mt-1">{comentarioErro}</div>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
