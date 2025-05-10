import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface HeaderProps {
  title: string;
  showSearch?: boolean;
  onSearch?: (query: string) => void;
}

export default function Header({ title, showSearch = true, onSearch }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (onSearch) {
      onSearch(e.target.value);
    }
  };

  const handleNewTicket = () => {
    setLocation("/new-ticket");
  };

  return (
    <header className="bg-white shadow-sm p-4">
      <div className="container mx-auto flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
        <div className="flex items-center space-x-4">
          {showSearch && (
            <div className="relative">
              <Input
                type="text"
                placeholder="Pesquisar..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="pl-8 pr-4 py-1 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm"
              />
              <i className="fas fa-search absolute left-2.5 top-2 text-gray-400 text-sm"></i>
            </div>
          )}
          
          {isAuthenticated ? (
            <Button 
              onClick={handleNewTicket}
              className="bg-primary hover:bg-primary/90 text-white px-4 py-1 rounded-md text-sm font-medium flex items-center space-x-1 transition"
            >
              <i className="fas fa-plus text-xs"></i>
              <span>Novo Chamado</span>
            </Button>
          ) : (
            <Link href="/login">
              <Button className="bg-primary hover:bg-primary/90 text-white px-4 py-1 rounded-md text-sm font-medium transition">
                Entrar
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
