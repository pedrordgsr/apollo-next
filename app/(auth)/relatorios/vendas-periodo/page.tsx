"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Download, Printer } from "lucide-react";
import * as XLSX from "xlsx";

interface PedidoDetalhado {
  idPedido: number;
  tipo: string;
  status: string;
  dataEmissao: string;
  nomePessoa: string;
  nomeFuncionario: string;
  totalCusto: number;
  totalVenda: number;
  formaPagamento: string;
}

export default function VendasPeriodoPage() {
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [pedidos, setPedidos] = useState<PedidoDetalhado[]>([]);
  const [loading, setLoading] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const convertDateToAPI = (date: string) => {
    const [year, month, day] = date.split("-");
    return `${day}/${month}/${year}`;
  };

  const handleBuscar = async () => {
    if (!dataInicio || !dataFim) {
      toast.error("Por favor, preencha as datas de início e fim");
      return;
    }

    setLoading(true);
    try {
      // Buscar clientes do período
      const clientesResponse = await api.get("/relatorios/clientes", {
        params: {
          dataInicio: convertDateToAPI(dataInicio),
          dataFim: convertDateToAPI(dataFim),
        },
      });

      // Para cada cliente, buscar seus pedidos
      const todosPedidos: PedidoDetalhado[] = [];
      for (const cliente of clientesResponse.data) {
        const detalhesResponse = await api.get(
          `/relatorios/clientes/${cliente.idPessoa}/detalhes`,
          {
            params: {
              dataInicio: convertDateToAPI(dataInicio),
              dataFim: convertDateToAPI(dataFim),
            },
          }
        );
        todosPedidos.push(...detalhesResponse.data);
      }

      setPedidos(todosPedidos);
      toast.success("Dados carregados com sucesso!");
    } catch (error) {
      console.error("Erro ao buscar pedidos:", error);
      toast.error("Erro ao buscar pedidos");
    } finally {
      setLoading(false);
    }
  };

  const handleExportar = () => {
    const dadosExport = pedidos.map((p) => {
      const lucro = p.totalVenda - p.totalCusto;
      const margem = p.totalVenda > 0 ? (lucro / p.totalVenda) * 100 : 0;
      return {
        "ID Pedido": p.idPedido,
        Tipo: p.tipo,
        Status: p.status,
        "Data Emissão": formatDate(p.dataEmissao),
        Cliente: p.nomePessoa,
        Funcionário: p.nomeFuncionario,
        "Total Custo": p.totalCusto,
        "Total Venda": p.totalVenda,
        Lucro: lucro,
        "Margem (%)": margem.toFixed(2),
        "Forma de Pagamento": p.formaPagamento,
      };
    });

    const ws = XLSX.utils.json_to_sheet(dadosExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Vendas");
    XLSX.writeFile(wb, `vendas_periodo_${dataInicio}_${dataFim}.xlsx`);
  };

  const handleImprimir = () => {
    window.print();
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      ORCAMENTO: "secondary",
      FATURADO: "default",
      CANCELADO: "destructive",
      NOTA_CANCELADA: "destructive",
      // Mapeamentos antigos (retrocompatibilidade)
      CONCLUIDO: "default",
      PENDENTE: "secondary",
    };
    const statusLabel = status === "NOTA_CANCELADA" ? "NOTA CANCELADA" : status;
    return (
      <Badge variant={variants[status] || "outline"}>
        {statusLabel}
      </Badge>
    );
  };

  const totais = pedidos.reduce(
    (acc, p) => ({
      totalVendas: acc.totalVendas + p.totalVenda,
      totalCustos: acc.totalCustos + p.totalCusto,
      lucro: acc.lucro + (p.totalVenda - p.totalCusto),
    }),
    { totalVendas: 0, totalCustos: 0, lucro: 0 }
  );

  const ticketMedio = pedidos.length > 0 ? totais.totalVendas / pedidos.length : 0;
  const margemPercentual = totais.totalVendas > 0 ? (totais.lucro / totais.totalVendas) * 100 : 0;

  return (
    <div className="flex flex-1 flex-col py-4 md:py-6 px-4 lg:px-6 space-y-6">
      <div className="print:hidden">
        <h1 className="text-3xl font-bold tracking-tight">Vendas por Período</h1>
        <p className="text-muted-foreground">
          Visualize todos os pedidos de venda em um período específico
        </p>
      </div>

      <Card className="print:hidden">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Selecione o período para visualizar as vendas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="dataInicio">Data de Início</Label>
              <Input
                id="dataInicio"
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dataFim">Data de Fim</Label>
              <Input
                id="dataFim"
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleBuscar} disabled={loading} className="w-full">
                {loading ? "Buscando..." : "Buscar"}
              </Button>
            </div>
            {pedidos.length > 0 && (
              <>
                <div className="flex items-end">
                  <Button onClick={handleExportar} variant="outline" className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Exportar Excel
                  </Button>
                </div>
                <div className="flex items-end">
                  <Button onClick={handleImprimir} variant="outline" className="w-full">
                    <Printer className="mr-2 h-4 w-4" />
                    Imprimir
                  </Button>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {pedidos.length > 0 && (
        <>
          {/* Cabeçalho para Impressão */}
          <div className="hidden print:block text-center space-y-2 mb-8">
            <h1 className="text-2xl font-bold">RELATÓRIO DE VENDAS POR PERÍODO</h1>
            <p className="text-muted-foreground">
              Período: {new Date(dataInicio).toLocaleDateString("pt-BR")} até {new Date(dataFim).toLocaleDateString("pt-BR")}
            </p>
            <p className="text-sm text-muted-foreground">
              Data de Emissão: {new Date().toLocaleDateString("pt-BR")}
            </p>
          </div>

          {/* Indicadores Detalhados para Impressão */}
          <div className="hidden print:block mb-8 space-y-4">
            <h2 className="text-xl font-bold border-b pb-2">Indicadores de Performance</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Vendas</p>
                <p className="text-lg font-bold text-green-600">{formatCurrency(totais.totalVendas)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Custos</p>
                <p className="text-lg font-bold text-red-600">{formatCurrency(totais.totalCustos)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Lucro Bruto</p>
                <p className="text-lg font-bold text-blue-600">{formatCurrency(totais.lucro)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Margem de Lucro</p>
                <p className="text-lg font-bold">{margemPercentual.toFixed(2)}%</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ticket Médio</p>
                <p className="text-lg font-bold">{formatCurrency(ticketMedio)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Quantidade de Pedidos</p>
                <p className="text-lg font-bold">{pedidos.length}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-5 print:hidden">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(totais.totalVendas)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total de Custos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(totais.totalCustos)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Lucro</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(totais.lucro)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Margem</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {margemPercentual.toFixed(2)}%
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(ticketMedio)}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="print:shadow-none print:border-0">
            <CardHeader className="print:px-0">
              <CardTitle>Pedidos ({pedidos.length})</CardTitle>
            </CardHeader>
            <CardContent className="print:px-0">
              <div className="rounded-md border print:border-gray-300">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="print:w-[8%]">ID</TableHead>
                      <TableHead className="print:w-[12%]">Data</TableHead>
                      <TableHead className="print:w-[20%]">Cliente</TableHead>
                      <TableHead className="print:w-[15%]">Funcionário</TableHead>
                      <TableHead className="print:hidden">Status</TableHead>
                      <TableHead className="text-right print:w-[13%]">Custo</TableHead>
                      <TableHead className="text-right print:w-[13%]">Venda</TableHead>
                      <TableHead className="text-right print:w-[13%]">Lucro</TableHead>
                      <TableHead className="print:w-[12%]">Pagamento</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pedidos.map((pedido) => (
                      <TableRow key={pedido.idPedido}>
                        <TableCell className="font-medium print:text-xs">{pedido.idPedido}</TableCell>
                        <TableCell className="print:text-xs print:whitespace-normal">{formatDate(pedido.dataEmissao)}</TableCell>
                        <TableCell className="print:text-xs print:whitespace-normal print:wrap-break-word">{pedido.nomePessoa}</TableCell>
                        <TableCell className="print:text-xs print:whitespace-normal print:wrap-break-word">{pedido.nomeFuncionario}</TableCell>
                        <TableCell className="print:hidden">{getStatusBadge(pedido.status)}</TableCell>
                        <TableCell className="text-right print:text-xs print:whitespace-nowrap">
                          {formatCurrency(pedido.totalCusto)}
                        </TableCell>
                        <TableCell className="text-right print:text-xs print:whitespace-nowrap">
                          {formatCurrency(pedido.totalVenda)}
                        </TableCell>
                        <TableCell className="text-right font-semibold print:text-xs print:whitespace-nowrap">
                          {formatCurrency(pedido.totalVenda - pedido.totalCusto)}
                        </TableCell>
                        <TableCell className="print:text-xs print:whitespace-normal">{pedido.formaPagamento}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
