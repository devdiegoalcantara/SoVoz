import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import RegisterForm from "@/components/authentication/RegisterForm";

export default function Register() {
  const { isAuthenticated, isAdmin } = useAuth();
  const [, setLocation] = useLocation();
  
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
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <RegisterForm />
    </div>
  );
}
