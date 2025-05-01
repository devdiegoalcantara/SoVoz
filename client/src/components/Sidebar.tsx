import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useMediaQuery } from "@/hooks/use-mobile";

export default function Sidebar() {
  const [location] = useLocation();
  const { user, logout, isAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: "fas fa-chart-line", adminOnly: true },
    { href: "/tickets", label: "Tickets", icon: "fas fa-ticket-alt", adminOnly: false },
    { href: "/kanban", label: "Kanban", icon: "fas fa-columns", adminOnly: true },
    { href: "/statistics", label: "Estatísticas", icon: "fas fa-chart-pie", adminOnly: true },
  ];

  // Filter nav items based on user role
  const filteredNavItems = navItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <aside className="bg-sidebar text-white w-full md:w-64 md:min-h-screen flex flex-col transition-all duration-300">
      <div className="p-4 flex justify-between items-center md:justify-center">
        <div className="flex items-center space-x-2">
          <i className="fas fa-comment-dots text-2xl"></i>
          <h1 className="font-bold text-xl">SoVoz</h1>
        </div>
        <button onClick={toggleMobileMenu} className="md:hidden text-white">
          <i className="fas fa-bars"></i>
        </button>
      </div>
      
      {(!isMobile || mobileMenuOpen) && (
        <div className="md:block px-4 py-2">
          {user && (
            <div className="flex items-center space-x-3 mb-6 mt-2">
              <div className="bg-primary/30 h-10 w-10 rounded-full flex items-center justify-center">
                <i className="fas fa-user"></i>
              </div>
              <div>
                <p className="font-medium">{user.name}</p>
                <p className="text-xs text-gray-300">{user.role === 'admin' ? 'Administrador' : 'Usuário'}</p>
              </div>
            </div>
          )}
        </div>
      )}
      
      <nav className="flex-1">
        <ul className={`${isMobile && !mobileMenuOpen ? 'hidden' : 'flex'} flex-row justify-around md:flex-col px-2`}>
          {filteredNavItems.map((item) => (
            <li key={item.href}>
              <Link 
                href={item.href}
                className={`flex items-center space-x-2 py-2 px-4 rounded hover:bg-primary/20 text-center md:text-left transition ${
                  location === item.href ? 'bg-primary/30' : ''
                }`}
              >
                <i className={`${item.icon} w-5 md:w-auto`}></i>
                <span className="hidden md:inline">{item.label}</span>
              </Link>
            </li>
          ))}
          <li>
            <Link 
              href="/new-ticket"
              className={`flex items-center space-x-2 py-2 px-4 rounded hover:bg-primary/20 text-center md:text-left transition ${
                location === '/new-ticket' ? 'bg-primary/30' : ''
              }`}
            >
              <i className="fas fa-plus w-5 md:w-auto"></i>
              <span className="hidden md:inline">Novo Ticket</span>
            </Link>
          </li>
        </ul>
      </nav>
      
      {(!isMobile || mobileMenuOpen) && (
        <div className="p-4 mt-auto">
          <button 
            onClick={logout}
            className="flex items-center space-x-2 py-2 px-4 rounded hover:bg-primary/20 text-center md:text-left transition w-full"
          >
            <i className="fas fa-sign-out-alt"></i>
            <span className="hidden md:inline">Sair</span>
          </button>
        </div>
      )}
    </aside>
  );
}
