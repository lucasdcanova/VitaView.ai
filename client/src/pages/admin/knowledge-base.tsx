
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

type Article = {
    id: number;
    title: string;
    category: string;
    content: string;
    updatedAt: string;
};

export default function KnowledgeBaseAdmin() {
    const [search, setSearch] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [editingArticle, setEditingArticle] = useState<Article | null>(null);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: articles, isLoading } = useQuery<Article[]>({
        queryKey: ["/api/support/articles"],
    });

    const createMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await apiRequest("POST", "/api/support/articles", data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/support/articles"] });
            setIsOpen(false);
            toast({ title: "Success", description: "Article saved successfully" });
        },
        onError: () => {
            toast({ title: "Error", description: "Failed to save article", variant: "destructive" });
        }
    });

    const filteredArticles = articles?.filter(a =>
        a.title.toLowerCase().includes(search.toLowerCase()) ||
        a.category.toLowerCase().includes(search.toLowerCase())
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const data = {
            title: formData.get("title"),
            category: formData.get("category"),
            content: formData.get("content"),
            isPublic: true,
            clinicId: null // Global for now
        };
        createMutation.mutate(data);
    };

    return (
        <div className="p-8 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Base de Conhecimento</h1>
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button><Plus className="mr-2 h-4 w-4" /> Novo Artigo</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle>Criar Artigo</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Título</Label>
                                <Input id="title" name="title" required placeholder="Ex: Como emitir nota fiscal" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="category">Categoria</Label>
                                <Input id="category" name="category" required placeholder="Ex: Faturamento" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="content">Conteúdo (Markdown)</Label>
                                <Textarea id="content" name="content" required className="min-h-[200px]" placeholder="# Título..." />
                            </div>
                            <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                                {createMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Salvar Artigo
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar artigos..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-sm"
                />
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Título</TableHead>
                            <TableHead>Categoria</TableHead>
                            <TableHead>Atualizado em</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center">Carregando...</TableCell>
                            </TableRow>
                        ) : filteredArticles?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center">Nenhum artigo encontrado.</TableCell>
                            </TableRow>
                        ) : (
                            filteredArticles?.map((article) => (
                                <TableRow key={article.id}>
                                    <TableCell className="font-medium">{article.title}</TableCell>
                                    <TableCell>{article.category}</TableCell>
                                    <TableCell>{new Date(article.updatedAt).toLocaleDateString()}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
