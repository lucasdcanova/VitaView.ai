
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Sidebar from "@/components/layout/sidebar";
import MobileHeader from "@/components/layout/mobile-header";
import PatientHeader from "@/components/patient-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Loader2, TrendingUp, PieChart as PieChartIcon, Activity, FileText, Users, CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ReportsPage() {
    const [range, setRange] = useState("30d");
    const [customStartDate, setCustomStartDate] = useState<Date | undefined>(undefined);
    const [customEndDate, setCustomEndDate] = useState<Date | undefined>(undefined);
    const [isStartDateOpen, setIsStartDateOpen] = useState(false);
    const [isEndDateOpen, setIsEndDateOpen] = useState(false);

    const { data: analytics, isLoading } = useQuery({
        queryKey: ["/api/analytics", range, customStartDate?.toISOString(), customEndDate?.toISOString()],
        queryFn: async () => {
            // Build query params inside the function to avoid stale closure
            const params = range === "custom" && customStartDate && customEndDate
                ? `range=custom&startDate=${customStartDate.toISOString()}&endDate=${customEndDate.toISOString()}`
                : `range=${range}`;
            const res = await fetch(`/api/analytics?${params}`);
            if (!res.ok) throw new Error("Failed to fetch analytics");
            return res.json();
        },
        enabled: range !== "custom" || (!!customStartDate && !!customEndDate)
    });

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    const handleRangeChange = (value: string) => {
        setRange(value);
        if (value !== "custom") {
            setCustomStartDate(undefined);
            setCustomEndDate(undefined);
        }
    };

    return (
        <div className="flex h-screen bg-background">
            <Sidebar />
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                <MobileHeader />
                <main className="flex-1 overflow-y-auto bg-background">
                    <PatientHeader
                        title="Relatórios Gerenciais"
                        description="Controle financeiro e fluxo de pacientes."
                        showTitleAsMain={true}
                        fullWidth={true}
                        icon={<FileText className="h-6 w-6" />}
                    >
                        <div className="flex flex-wrap items-center gap-2">
                            <Select value={range} onValueChange={handleRangeChange}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Período" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="7d">Últimos 7 dias</SelectItem>
                                    <SelectItem value="30d">Últimos 30 dias</SelectItem>
                                    <SelectItem value="90d">Últimos 90 dias</SelectItem>
                                    <SelectItem value="1y">Último ano</SelectItem>
                                    <SelectItem value="custom">Personalizado</SelectItem>
                                </SelectContent>
                            </Select>

                            {range === "custom" && (
                                <div className="flex items-center gap-2">
                                    <Popover open={isStartDateOpen} onOpenChange={setIsStartDateOpen}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className={cn(
                                                    "w-[140px] justify-start text-left font-normal",
                                                    !customStartDate && "text-muted-foreground"
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {customStartDate ? format(customStartDate, "dd/MM/yyyy", { locale: ptBR }) : "Data inicial"}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={customStartDate}
                                                onSelect={(date) => {
                                                    setCustomStartDate(date);
                                                    setIsStartDateOpen(false);
                                                }}
                                                disabled={(date) => date > new Date() || (customEndDate ? date > customEndDate : false)}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>

                                    <span className="text-muted-foreground">até</span>

                                    <Popover open={isEndDateOpen} onOpenChange={setIsEndDateOpen}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className={cn(
                                                    "w-[140px] justify-start text-left font-normal",
                                                    !customEndDate && "text-muted-foreground"
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {customEndDate ? format(customEndDate, "dd/MM/yyyy", { locale: ptBR }) : "Data final"}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={customEndDate}
                                                onSelect={(date) => {
                                                    setCustomEndDate(date);
                                                    setIsEndDateOpen(false);
                                                }}
                                                disabled={(date) => date > new Date() || (customStartDate ? date < customStartDate : false)}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            )}
                        </div>
                    </PatientHeader>
                    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">

                        {isLoading ? (
                            <div className="flex items-center justify-center h-64">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : (
                            <>
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-sm font-medium">Total de Pacientes</CardTitle>
                                            <Users className="h-4 w-4 text-muted-foreground" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">{analytics?.summary?.totalPatients || 0}</div>
                                            <p className="text-xs text-muted-foreground">Pacientes cadastrados</p>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-sm font-medium">Procedimentos Realizados</CardTitle>
                                            <FileText className="h-4 w-4 text-muted-foreground" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">{analytics?.summary?.totalExams || 0}</div>
                                            <p className="text-xs text-muted-foreground">No período selecionado</p>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-sm font-medium">Faturamento Total</CardTitle>
                                            <span className="text-sm font-bold text-green-600">R$</span>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">
                                                {((analytics?.summary?.totalRevenue || 0) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </div>
                                            <p className="text-xs text-muted-foreground">Estimado (Consultas)</p>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
                                            <span className="text-sm font-bold text-blue-600">R$</span>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">
                                                {((analytics?.summary?.averageTicket || 0) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </div>
                                            <p className="text-xs text-muted-foreground">Por consulta paga</p>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-sm font-medium">Procedimento Mais Frequente</CardTitle>
                                            <Activity className="h-4 w-4 text-muted-foreground" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold truncate" title={analytics?.summary?.mostFrequentExam}>{analytics?.summary?.mostFrequentExam || "N/A"}</div>
                                            <p className="text-xs text-muted-foreground">Mais frequente</p>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Charts Grid */}
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">

                                    {/* Activity Bar Chart */}
                                    <Card className="col-span-4">
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <TrendingUp className="h-5 w-5 text-primary" />
                                                Atividade e Faturamento
                                            </CardTitle>
                                            <CardDescription>
                                                Procedimentos, pacientes e faturamento nos últimos meses
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="pl-2">
                                            <div className="h-[300px]">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={analytics?.activityData || []}>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                        <XAxis
                                                            dataKey="name"
                                                            stroke="#888888"
                                                            fontSize={12}
                                                            tickLine={false}
                                                            axisLine={false}
                                                        />
                                                        <YAxis
                                                            yAxisId="left"
                                                            stroke="#888888"
                                                            fontSize={12}
                                                            tickLine={false}
                                                            axisLine={false}
                                                            tickFormatter={(value) => `${value}`}
                                                        />
                                                        <YAxis
                                                            yAxisId="right"
                                                            orientation="right"
                                                            stroke="#888888"
                                                            fontSize={12}
                                                            tickLine={false}
                                                            axisLine={false}
                                                            tickFormatter={(value) => `R$ ${value}`}
                                                        />
                                                        <Tooltip
                                                            cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                            formatter={(value: any, name: any) => {
                                                                if (name === "Faturamento") return [`R$ ${value.toFixed(2)}`, name];
                                                                return [value, name];
                                                            }}
                                                        />
                                                        <Legend />
                                                        <Bar
                                                            yAxisId="left"
                                                            dataKey="exames"
                                                            name="Procedimentos"
                                                            fill="#0ea5e9"
                                                            radius={[4, 4, 0, 0]}
                                                            maxBarSize={30}
                                                        />
                                                        <Bar
                                                            yAxisId="left"
                                                            dataKey="pacientes"
                                                            name="Novos Pacientes"
                                                            fill="#10b981"
                                                            radius={[4, 4, 0, 0]}
                                                            maxBarSize={30}
                                                        />
                                                        <Bar
                                                            yAxisId="right"
                                                            dataKey="faturamento"
                                                            name="Faturamento"
                                                            fill="#8b5cf6"
                                                            radius={[4, 4, 0, 0]}
                                                            maxBarSize={30}
                                                        />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Exam Types Pie Chart */}
                                    <Card className="col-span-3">
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <PieChartIcon className="h-5 w-5 text-primary" />
                                                Procedimentos Realizados
                                            </CardTitle>
                                            <CardDescription>
                                                Distribuição por categoria
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="h-[300px] flex items-center justify-center">
                                                {analytics?.examsByType?.length > 0 ? (
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <PieChart>
                                                            <Pie
                                                                data={analytics?.examsByType}
                                                                cx="50%"
                                                                cy="50%"
                                                                innerRadius={60}
                                                                outerRadius={80}
                                                                paddingAngle={5}
                                                                dataKey="value"
                                                            >
                                                                {analytics?.examsByType.map((entry: any, index: number) => (
                                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                                ))}
                                                            </Pie>
                                                            <Tooltip />
                                                            <Legend />
                                                        </PieChart>
                                                    </ResponsiveContainer>
                                                ) : (
                                                    <div className="text-center text-gray-500">
                                                        <p>Sem dados suficientes para exibir o gráfico.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
