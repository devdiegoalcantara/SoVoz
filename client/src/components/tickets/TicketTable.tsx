import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

type Ticket = {
  id: number;
  title: string;
  type: string;
  department: string;
  status: string;
  createdAt: string;
};

type FilterOptions = {
  type: string;
  status: string;
};

export default function TicketTable() {
  const [, setLocation] = useLocation();
  const [filters, setFilters] = useState<FilterOptions>({
    type: "",
    status: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch tickets
  const { data, isLoading, error } = useQuery({
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

  // Filter and search tickets
  const filteredTickets = data?.tickets.filter((ticket) => {
    const matchesType = filters.type ? ticket.type === filters.type : true;
    const matchesStatus = filters.status ? ticket.status === filters.status : true;
    const matchesSearch = searchQuery
      ? ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.department.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    
    return matchesType && matchesStatus && matchesSearch;
  }) || [];

  // Pagination
  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredTickets.length);
  const displayedTickets = filteredTickets.slice(startIndex, endIndex);

  // Handle view ticket
  const handleViewTicket = (id: number) => {
    setLocation(`/ticket/${id}`);
  };

  // Handle edit ticket
  const handleEditTicket = (id: number) => {
    setLocation(`/ticket/${id}`);
  };

  // Get type badge styling
  const getTypeBadge = (type: string) => {
    switch (type) {
      case "Bug":
        return {
          bgColor: "bg-red-100",
          textColor: "text-red-800",
          icon: "fas fa-bug",
        };
      case "Sugestão":
        return {
          bgColor: "bg-blue-100",
          textColor: "text-blue-800",
          icon: "fas fa-lightbulb",
        };
      case "Feedback":
        return {
          bgColor: "bg-purple-100",
          textColor: "text-purple-800",
          icon: "fas fa-comment",
        };
      default:
        return {
          bgColor: "bg-gray-100",
          textColor: "text-gray-800",
          icon: "fas fa-question",
        };
    }
  };

  // Get status badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Novo":
        return "bg-blue-100 text-blue-800";
      case "Em andamento":
        return "bg-yellow-100 text-yellow-800";
      case "Resolvido":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
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

  if (isLoading) {
    return <div className="text-center p-4">Carregando tickets...</div>;
  }

  if (error) {
    return <div className="text-center text-error p-4">Erro ao carregar tickets. Tente novamente.</div>;
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 space-y-4 md:space-y-0">
        <div>
          <h1 className="text-xl font-bold text-text">Lista de Tickets</h1>
          <p className="text-gray-500 text-sm">Gerencie os tickets enviados pelos usuários</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <select
              className="appearance-none bg-white border border-gray-300 rounded-md pl-3 pr-8 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm"
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            >
              <option value="">Todos os tipos</option>
              <option value="Bug">Bug</option>
              <option value="Sugestão">Sugestão</option>
              <option value="Feedback">Feedback</option>
            </select>
            <i className="fas fa-chevron-down absolute right-3 top-2 text-gray-400 pointer-events-none"></i>
          </div>
          
          <div className="relative">
            <select
              className="appearance-none bg-white border border-gray-300 rounded-md pl-3 pr-8 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">Todos os status</option>
              <option value="Novo">Novo</option>
              <option value="Em andamento">Em andamento</option>
              <option value="Resolvido">Resolvido</option>
            </select>
            <i className="fas fa-chevron-down absolute right-3 top-2 text-gray-400 pointer-events-none"></i>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Título</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Órgão</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {displayedTickets.map((ticket) => {
                const typeBadge = getTypeBadge(ticket.type);
                
                return (
                  <tr key={ticket.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{ticket.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{ticket.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeBadge.bgColor} ${typeBadge.textColor}`}>
                        <i className={`${typeBadge.icon} mr-1 text-xs`}></i>
                        {ticket.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{ticket.department}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(ticket.status)}`}>
                        {ticket.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{formatDate(ticket.createdAt)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        className="text-primary hover:text-primary/80 mr-3"
                        onClick={() => handleViewTicket(ticket.id)}
                        aria-label="View ticket"
                      >
                        <i className="fas fa-eye"></i>
                      </button>
                      <button
                        className="text-primary hover:text-primary/80"
                        onClick={() => handleEditTicket(ticket.id)}
                        aria-label="Edit ticket"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                    </td>
                  </tr>
                );
              })}
              
              {displayedTickets.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                    Nenhum ticket encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {totalPages > 1 && (
          <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-700">
              Mostrando <span className="font-medium">{startIndex + 1}</span> a <span className="font-medium">{endIndex}</span> de <span className="font-medium">{filteredTickets.length}</span> resultados
            </p>
            <div className="flex items-center space-x-2">
              <button
                className={`px-3 py-1 rounded-md border border-gray-300 text-sm font-medium ${
                  currentPage === 1
                    ? "text-gray-500 bg-gray-100 cursor-not-allowed"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <i className="fas fa-chevron-left"></i>
              </button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={i}
                    className={`px-3 py-1 rounded-md text-sm font-medium ${
                      currentPage === pageNum
                        ? "bg-primary text-white"
                        : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button
                className={`px-3 py-1 rounded-md border border-gray-300 text-sm font-medium ${
                  currentPage === totalPages
                    ? "text-gray-500 bg-gray-100 cursor-not-allowed"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
