import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "wouter";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

// Login form schema
const loginFormSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  rememberMe: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

export default function LoginForm() {
  const { login } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsSubmitting(true);
    try {
      await login(data.email, data.password);
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="bg-primary p-6 flex justify-center">
          <div className="text-center">
            <div className="flex justify-center items-center mb-2">
              <i className="fas fa-comment-dots text-white text-3xl"></i>
            </div>
            <h1 className="text-white text-xl font-bold">SoVoz</h1>
            <p className="text-blue-100 text-sm">Sistema de Atendimento ao SoGov</p>  </div>
        </div>
        
        <div className="p-6">
          <h2 className="text-xl font-bold text-text mb-6 text-center">Login</h2>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="Seu e-mail" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="Sua senha" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex items-center justify-between">
                <FormField
                  control={form.control}
                  name="rememberMe"
                  render={({ field }) => (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="remember-me"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                      <label
                        htmlFor="remember-me"
                        className="text-sm text-gray-700"
                      >
                        Lembrar-me
                      </label>
                    </div>
                  )}
                />
                
                <a href="#" className="text-sm font-medium text-primary hover:text-primary/80">
                  Esqueceu a senha?
                </a>
              </div>
              
              <Button 
                type="submit" 
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Entrando...
                  </>
                ) : "Entrar"}
              </Button>
            </form>
          </Form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Não tem uma conta? <Link href="/register"><a className="font-medium text-primary hover:text-primary/80">Cadastre-se</a></Link>
            </p>
          </div>
        </div>
      </div>
      
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500">Ou envie um ticket sem fazer login</p>
        <Link href="/new-ticket">
          <a className="mt-2 inline-block font-medium text-primary hover:text-primary/80 text-sm">
            Enviar ticket anônimo
          </a>
        </Link>
      </div>
    </div>
  );
}
