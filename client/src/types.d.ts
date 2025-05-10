declare module '@/hooks/useAuth' {
  export function useAuth(): {
    isAuthenticated: boolean;
    user: any;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
  };
}

declare module '@/components/Sidebar' {
  const Sidebar: React.FC;
  export default Sidebar;
}

declare module '@/components/Header' {
  interface HeaderProps {
    title: string;
    showSearch?: boolean;
    onSearch?: (query: string) => void;
  }
  const Header: React.FC<HeaderProps>;
  export default Header;
}

declare module '@/components/tickets/TicketDetail' {
  interface TicketDetailProps {
    ticketId: string;
  }
  const TicketDetail: React.FC<TicketDetailProps>;
  export default TicketDetail;
}

declare module '@/components/tickets/TicketTable' {
  interface TicketTableProps {
    searchQuery: string;
  }
  const TicketTable: React.FC<TicketTableProps>;
  export default TicketTable;
} 