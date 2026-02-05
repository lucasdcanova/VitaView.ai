
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, DollarSign, Activity, Users, ChevronDown, ChevronRight } from "lucide-react";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface CostLogEntry {
    userId: number;
    username: string;
    taskType: string;
    totalInput: number;
    totalOutput: number;
    totalCost: number;
    requestCount: number;
}

interface UserGroup {
    userId: number;
    username: string;
    totalCost: number;
    totalRequests: number;
    tasks: CostLogEntry[];
}

export default function AdminAICosts() {
    const [selectedMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [expandedUsers, setExpandedUsers] = useState<Record<number, boolean>>({});

    const { data: costs, isLoading } = useQuery<CostLogEntry[]>({
        queryKey: ["/api/admin/ai-costs", selectedMonth],
        queryFn: async () => {
            const res = await fetch(`/api/admin/ai-costs?month=${selectedMonth}`);
            if (!res.ok) throw new Error("Failed to fetch costs");
            return res.json();
        }
    });

    const userGroups = useMemo(() => {
        if (!costs) return [];
        const groups: Record<number, UserGroup> = {};

        costs.forEach(log => {
            if (!groups[log.userId]) {
                groups[log.userId] = {
                    userId: log.userId,
                    username: log.username,
                    totalCost: 0,
                    totalRequests: 0,
                    tasks: []
                };
            }
            groups[log.userId].totalCost += Number(log.totalCost);
            groups[log.userId].totalRequests += Number(log.requestCount);
            groups[log.userId].tasks.push(log);
        });

        return Object.values(groups).sort((a, b) => b.totalCost - a.totalCost);
    }, [costs]);

    const totalCost = costs?.reduce((acc, curr) => acc + Number(curr.totalCost), 0) || 0;
    const totalRequests = costs?.reduce((acc, curr) => acc + Number(curr.requestCount), 0) || 0;

    const toggleUser = (userId: number) => {
        setExpandedUsers(prev => ({ ...prev, [userId]: !prev[userId] }));
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Auditoria de Custos de IA</h1>
                    <p className="text-muted-foreground">Detalhamento de custos por usuário e por ação</p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Custo Total (Mês)</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${totalCost.toFixed(4)}</div>
                        <p className="text-xs text-muted-foreground">USD estimado</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Requisições Totais</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalRequests}</div>
                        <p className="text-xs text-muted-foreground">Chamadas à API</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{userGroups.length}</div>
                        <p className="text-xs text-muted-foreground">Utilizando recursos de IA</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Detalhamento por Usuário</CardTitle>
                    <CardDescription>Clique no usuário para ver o custo por tipo de ação</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]"></TableHead>
                                <TableHead>Usuário</TableHead>
                                <TableHead>Requisições</TableHead>
                                <TableHead className="text-right">Custo Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {userGroups.map((group) => (
                                <>
                                    <TableRow
                                        key={group.userId}
                                        className="cursor-pointer hover:bg-muted/50"
                                        onClick={() => toggleUser(group.userId)}
                                    >
                                        <TableCell>
                                            {expandedUsers[group.userId] ? (
                                                <ChevronDown className="h-4 w-4" />
                                            ) : (
                                                <ChevronRight className="h-4 w-4" />
                                            )}
                                        </TableCell>
                                        <TableCell className="font-medium">{group.username}</TableCell>
                                        <TableCell><Badge variant="outline">{group.totalRequests}</Badge></TableCell>
                                        <TableCell className="text-right font-bold text-green-600">
                                            ${group.totalCost.toFixed(4)}
                                        </TableCell>
                                    </TableRow>
                                    {expandedUsers[group.userId] && (
                                        <TableRow className="bg-muted/30">
                                            <TableCell colSpan={4} className="p-0">
                                                <Table className="ml-8 border-l border-muted">
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead className="text-xs">Ação (Task)</TableHead>
                                                            <TableHead className="text-xs">Qtd</TableHead>
                                                            <TableHead className="text-xs">Tokens (In/Out)</TableHead>
                                                            <TableHead className="text-xs text-right">Custo</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {group.tasks.map((task, idx) => (
                                                            <TableRow key={`${group.userId}-${task.taskType}-${idx}`}>
                                                                <TableCell className="text-sm font-medium">
                                                                    {task.taskType || "Desconhecido"}
                                                                </TableCell>
                                                                <TableCell className="text-sm">{task.requestCount}</TableCell>
                                                                <TableCell className="text-sm text-muted-foreground">
                                                                    {task.totalInput} / {task.totalOutput}
                                                                </TableCell>
                                                                <TableCell className="text-sm text-right">
                                                                    ${Number(task.totalCost).toFixed(4)}
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </>
                            ))}
                            {userGroups.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                                        Nenhum registro encontrado para este período.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
