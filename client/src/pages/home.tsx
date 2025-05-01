import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import TicketForm from "@/components/tickets/TicketForm";
import Header from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isAdmin } = useAuth();
  
  useEffect(() => {
    // Redirect authenticated users to their appropriate page
    if (isAuthenticated) {
      if (isAdmin) {
        setLocation("/dashboard");
      } else {
        setLocation("/tickets");
      }
    }
  }, [isAuthenticated, isAdmin, setLocation]);

  return (
    <div className="min-h-screen bg-gray-100">
      <Header title="SoVoz - Sistema de Atendimento" showSearch={false} />
      
      <main className="container mx-auto p-4 md:p-6">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-primary">Bem-vindo ao SoVoz</h1>
          <p className="mt-2 text-gray-600">Sistema de Atendimento do SoGov para reporte de bugs, sugestões e feedbacks</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
          <Card>
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <div className="inline-flex justify-center items-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
                  <i className="fas fa-comment-dots text-3xl"></i>
                </div>
                <h2 className="text-xl font-semibold mb-2">Envie um Ticket</h2>
                <p className="text-gray-600">
                  Reporte problemas, envie sugestões ou compartilhe um feedback sobre o sistema SoGov
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <i className="fas fa-bug"></i>
                  </div>
                  <div>
                    <h3 className="font-medium">Reportar Bugs</h3>
                    <p className="text-sm text-gray-600">Encontrou um problema no sistema? Conte-nos.</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <i className="fas fa-lightbulb"></i>
                  </div>
                  <div>
                    <h3 className="font-medium">Sugestões</h3>
                    <p className="text-sm text-gray-600">Tem uma ideia para melhorar o sistema? Compartilhe conosco.</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <i className="fas fa-comment"></i>
                  </div>
                  <div>
                    <h3 className="font-medium">Feedback</h3>
                    <p className="text-sm text-gray-600">Sua opinião é importante para nós.</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex flex-col md:flex-row gap-4 justify-center">
                <Button onClick={() => setLocation("/new-ticket")} className="flex-1">
                  Enviar Ticket
                </Button>
                <Button onClick={() => setLocation("/login")} variant="outline" className="flex-1">
                  Fazer Login
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <div className="inline-flex justify-center items-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
                  <i className="fas fa-info-circle text-3xl"></i>
                </div>
                <h2 className="text-xl font-semibold mb-2">Sobre o SoVoz</h2>
                <p className="text-gray-600">
                  Um sistema desenvolvido para facilitar a comunicação entre usuários e a equipe do SoGov
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium mb-2">Como funciona?</h3>
                  <ol className="list-decimal list-inside text-sm text-gray-600 space-y-2">
                    <li>Envie um ticket detalhando seu problema ou sugestão</li>
                    <li>Nossa equipe analisa e categoriza seu ticket</li>
                    <li>Acompanhe o status do seu ticket</li>
                    <li>Receba feedbacks sobre a resolução</li>
                  </ol>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium mb-2">Benefícios</h3>
                  <ul className="list-disc list-inside text-sm text-gray-600 space-y-2">
                    <li>Comunicação direta com a equipe de desenvolvimento</li>
                    <li>Acompanhamento transparente das solicitações</li>
                    <li>Contribua para a melhoria contínua do sistema</li>
                    <li>Interface intuitiva e fácil de usar</li>
                  </ul>
                </div>
              </div>
              
              <div className="mt-6">
                <Button onClick={() => setLocation("/register")} className="w-full">
                  Criar uma Conta
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
