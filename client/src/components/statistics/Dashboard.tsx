import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  XAxis,
  YAxis,
} from "recharts";

interface StatisticsData {
  totalTickets: number;
  resolvedTickets: number;
  resolvedPercentage: number;
  typeStats: { type: string; count: number }[];
  statusStats: { status: string; count: number }[];
  departmentStats: { department: string; count: number }[];
}

export default function Dashboard() {
  // Fetch statistics
  const { data, isLoading, error } = useQuery<StatisticsData>({
    queryKey: ["/api/statistics"],
    queryFn: async () => {
      const response = await fetch("/api/statistics", {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) {
        throw new Error('Erro ao carregar estatísticas');
      }
      return response.json();
    }
  });

  const typeColors = {
    "Bug": "#D9534F",
    "Sugestão": "#1B4DC2",
    "Feedback": "#9C27B0",
  };

  const statusColors = {
    "Novo": "#4285F4",
    "Em andamento": "#F4B400",
    "Resolvido": "#28A745",
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-2xl text-primary mb-4"></i>
          <p>Carregando estatísticas...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center p-8 text-error">
        <i className="fas fa-exclamation-circle text-2xl mb-2"></i>
        <p>Erro ao carregar as estatísticas. Tente novamente.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text">Estatísticas</h1>
        <p className="text-gray-500 text-sm">Informações gerais sobre os tickets</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Total de tickets</h3>
            <div className="flex items-end justify-between">
              <p className="text-3xl font-bold text-text">{data.totalTickets}</p>
              <span className="text-green-600 flex items-center text-sm">
                <i className="fas fa-ticket-alt mr-1"></i>
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Tickets resolvidos</h3>
            <div className="flex items-end justify-between">
              <p className="text-3xl font-bold text-text">{data.resolvedTickets}</p>
              <span className="text-sm font-medium text-success">{data.resolvedPercentage}%</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Taxa de resolução</h3>
            <div className="flex items-end justify-between">
              <p className="text-3xl font-bold text-text">{data.resolvedPercentage}%</p>
              <span className="text-sm text-gray-500">dos tickets</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-gray-500 mb-4">Tickets por tipo</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.typeStats}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="type"
                    label={({ type, percent }) => `${type}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {data.typeStats.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={typeColors[entry.type as keyof typeof typeColors] || `#${Math.floor(Math.random()*16777215).toString(16)}`} 
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value} tickets`, name]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-gray-500 mb-4">Tickets por status</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.statusStats}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="status"
                    label={({ status, percent }) => `${status}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {data.statusStats.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={statusColors[entry.status as keyof typeof statusColors] || `#${Math.floor(Math.random()*16777215).toString(16)}`} 
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value} tickets`, name]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-1 md:col-span-2">
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-gray-500 mb-4">Órgãos mais citados</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.departmentStats}
                  margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
                >
                  <XAxis 
                    dataKey="department" 
                    angle={-45} 
                    textAnchor="end" 
                    height={60}
                    interval={0}
                  />
                  <YAxis allowDecimals={false} />
                  <Tooltip formatter={(value) => [`${value} tickets`, "Quantidade"]} />
                  <Bar 
                    dataKey="count" 
                    fill="#1B4DC2" 
                    name="Tickets" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
