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
import { Download } from "lucide-react";
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
      const clientesResponse = await api.get("/api/relatorios/clientes", {
        params: {
          dataInicio: convertDateToAPI(dataInicio),
          dataFim: convertDateToAPI(dataFim),
        },
      });

      // Para cada cliente, buscar seus pedidos
      const todosPedidos: PedidoDetalhado[] = [];
      for (const cliente of clientesResponse.data) {
        const detalhesResponse = await api.get(
          `/api/relatorios/clientes/${cliente.idPessoa}/detalhes`,
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

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      CONCLUIDO: "default",
      PENDENTE: "secondary",
      CANCELADO: "destructive",
    };
    return (
      <Badge variant={variants[status] || "outline"}>
        {status}
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
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Vendas por Período</h1>
        <p className="text-muted-foreground">
          Visualize todos os pedidos de venda em um período específico
        </p>
      </div>

      <Card>
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
              <div className="flex items-end">
                <Button onClick={handleExportar} variant="outline" className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Exportar Excel
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {pedidos.length > 0 && (
        <>
          <div className="grid gap-4 md:grid-cols-5">
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

          <Card>
            <CardHeader>
              <CardTitle>Pedidos ({pedidos.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Funcionário</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Custo</TableHead>
                      <TableHead className="text-right">Venda</TableHead>
                      <TableHead className="text-right">Lucro</TableHead>
                      <TableHead>Pagamento</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pedidos.map((pedido) => (
                      <TableRow key={pedido.idPedido}>
                        <TableCell className="font-medium">{pedido.idPedido}</TableCell>
                        <TableCell>{formatDate(pedido.dataEmissao)}</TableCell>
                        <TableCell>{pedido.nomePessoa}</TableCell>
                        <TableCell>{pedido.nomeFuncionario}</TableCell>
                        <TableCell>{getStatusBadge(pedido.status)}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(pedido.totalCusto)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(pedido.totalVenda)}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(pedido.totalVenda - pedido.totalCusto)}
                        </TableCell>
                        <TableCell>{pedido.formaPagamento}</TableCell>
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
