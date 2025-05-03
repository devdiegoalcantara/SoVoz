import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";

// Ticket form schema
const ticketFormSchema = z.object({
  title: z.string().min(3, "Título deve ter pelo menos 3 caracteres"),
  description: z.string().min(10, "Descrição deve ter pelo menos 10 caracteres"),
  type: z.string().min(1, "Selecione um tipo"),
  department: z.string().min(1, "Nome do órgão é obrigatório"),
  submitterName: z.string().optional(),
  submitterEmail: z.string().email("Email inválido").or(z.literal("")).optional(),
});

type TicketFormValues = z.infer<typeof ticketFormSchema>;

export default function TicketForm() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  const form = useForm<TicketFormValues>({
    resolver: zodResolver(ticketFormSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "",
      department: "",
      submitterName: user?.name || "",
      submitterEmail: user?.email || "",
    },
  });

  const createTicketMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/tickets", {
        method: "POST",
        body: formData,
        credentials: "include",
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error creating ticket");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      toast({
        title: "Ticket enviado com sucesso",
        description: "Seu ticket foi registrado e será analisado em breve.",
      });
      setLocation("/tickets");
    },
    onError: (error) => {
      toast({
        title: "Erro ao enviar ticket",
        description: error.message || "Ocorreu um erro. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      // Verificar tamanho total dos arquivos (máximo 20MB)
      const allFiles = [...selectedFiles, ...files];
      const totalSize = allFiles.reduce((acc, file) => acc + file.size, 0);
      if (totalSize > 20 * 1024 * 1024) {
        toast({
          title: "Arquivos muito grandes",
          description: "O tamanho total dos arquivos deve ser no máximo 20MB",
          variant: "destructive",
        });
        return;
      }
      // Verificar tipos de arquivo
      const validTypes = ["image/jpeg", "image/png", "video/mp4"];
      const invalidFiles = files.filter(file => !validTypes.includes(file.type));
      if (invalidFiles.length > 0) {
        toast({
          title: "Tipo de arquivo inválido",
          description: "Apenas JPG, PNG e MP4 são permitidos",
          variant: "destructive",
        });
        return;
      }
      // Remover duplicados pelo nome do arquivo
      const uniqueFiles = Array.from(new Map(allFiles.map(f => [f.name, f])).values());
      setSelectedFiles(uniqueFiles);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files) {
      const files = Array.from(e.dataTransfer.files);
      // Verificar tamanho total dos arquivos (máximo 20MB)
      const allFiles = [...selectedFiles, ...files];
      const totalSize = allFiles.reduce((acc, file) => acc + file.size, 0);
      if (totalSize > 20 * 1024 * 1024) {
        toast({
          title: "Arquivos muito grandes",
          description: "O tamanho total dos arquivos deve ser no máximo 20MB",
          variant: "destructive",
        });
        return;
      }
      // Verificar tipos de arquivo
      const validTypes = ["image/jpeg", "image/png", "video/mp4"];
      const invalidFiles = files.filter(file => !validTypes.includes(file.type));
      if (invalidFiles.length > 0) {
        toast({
          title: "Tipo de arquivo inválido",
          description: "Apenas JPG, PNG e MP4 são permitidos",
          variant: "destructive",
        });
        return;
      }
      // Remover duplicados pelo nome do arquivo
      const uniqueFiles = Array.from(new Map(allFiles.map(f => [f.name, f])).values());
      setSelectedFiles(uniqueFiles);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (values: TicketFormValues) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("title", values.title);
      formData.append("description", values.description);
      formData.append("type", values.type);
      formData.append("department", values.department);
      
      if (values.submitterName) {
        formData.append("submitterName", values.submitterName);
      }
      
      if (values.submitterEmail) {
        formData.append("submitterEmail", values.submitterEmail);
      }
      
      // Adicionar todos os arquivos selecionados
      selectedFiles.forEach(file => {
        formData.append("attachments", file);
      });
      
      await createTicketMutation.mutateAsync(formData);
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setLocation("/tickets");
  };

  return (
    <Card>
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input placeholder="Título do ticket" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Bug">Bug</SelectItem>
                        <SelectItem value="Melhoria">Melhoria</SelectItem>
                        <SelectItem value="Sugestão">Sugestão</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Órgão relacionado</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do órgão" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="submitterEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail (opcional)</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Seu e-mail" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva o problema ou sugestão"
                      rows={5}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div>
              <FormLabel className="block text-sm font-medium text-gray-700 mb-1">Anexos</FormLabel>
              <div 
                className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <div className="space-y-1 text-center">
                  <i className="fas fa-cloud-upload-alt mx-auto h-12 w-12 text-gray-400"></i>
                  <div className="flex text-sm text-gray-600">
                    <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary-dark focus-within:outline-none">
                      <span>Enviar arquivos</span>
                      <input
                        id="file-upload"
                        name="attachments"
                        type="file"
                        className="sr-only"
                        accept=".jpg,.png,.mp4"
                        multiple
                        onChange={handleFileChange}
                      />
                    </label>
                    <p className="pl-1">ou arraste e solte</p>
                  </div>
                  <p className="text-xs text-gray-500">JPG, PNG ou MP4 (máx. 20MB no total)</p>
                  
                  {selectedFiles.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <div className="flex items-center space-x-2">
                            <i className={`${
                              file.type.startsWith('image/') ? "fas fa-image" :
                              file.type === 'video/mp4' ? "fas fa-video" :
                              "fas fa-file"
                            } text-gray-500`}></i>
                            <span className="text-sm text-gray-700">{file.name}</span>
                            <span className="text-xs text-gray-500">
                              ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                disabled={isUploading || createTicketMutation.isPending}
              >
                {(isUploading || createTicketMutation.isPending) ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Enviando...
                  </>
                ) : "Salvar ticket"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
