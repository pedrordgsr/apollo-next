"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

interface ClienteRelatorio {
  idPessoa: number;
  nome: string;
  cpfCnpj: string;
  tipo: string;
  quantidadePedidos: number;
  totalValor: number;
  ticketMedio: number;
  ultimoPedido: string;
}

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

interface Cliente {
  id: number;
  nome: string;
  cpfCnpj: string;
}

export default function VendasClientePage() {
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [clienteId, setClienteId] = useState("");
  const [todosClientes, setTodosClientes] = useState<Cliente[]>([]);
  const [pedidosCliente, setPedidosCliente] = useState<PedidoDetalhado[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingClientes, setLoadingClientes] = useState(false);

  useEffect(() => {
    carregarTodosClientes();
  }, []);

  const carregarTodosClientes = async () => {
    setLoadingClientes(true);
    try {
      const response = await api.get("/clientes?page=0&size=1000");
      const clientesFiltrados = response.data.content || [];
      setTodosClientes(clientesFiltrados);
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
      toast.error("Erro ao carregar lista de clientes");
    } finally {
      setLoadingClientes(false);
    }
  };

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
    if (!clienteId) {
      toast.error("Por favor, selecione um cliente");
      return;
    }

    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (dataInicio && dataFim) {
        params.dataInicio = convertDateToAPI(dataInicio);
        params.dataFim = convertDateToAPI(dataFim);
      }

      // Buscar dados do cliente específico
      const response = await api.get("/api/relatorios/clientes", { params });
      const clienteData = response.data.find(
        (c: ClienteRelatorio) => c.idPessoa === parseInt(clienteId)
      );

      if (clienteData) {
        // Buscar detalhes dos pedidos
        const detalhesResponse = await api.get(
          `/api/relatorios/clientes/${clienteData.idPessoa}/detalhes`,
          { params }
        );
        setPedidosCliente(detalhesResponse.data);
        
        toast.success("Dados carregados com sucesso!");
      } else {
        setPedidosCliente([]);
        toast.info("Nenhum dado encontrado para este cliente no período selecionado");
      }
    } catch (error) {
      console.error("Erro ao buscar dados do cliente:", error);
      toast.error("Erro ao buscar dados do cliente");
    } finally {
      setLoading(false);
    }
  };

  const handleExportar = () => {
    const dadosExport = pedidosCliente.map((p) => {
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
    XLSX.utils.book_append_sheet(wb, ws, "Cliente");
    XLSX.writeFile(wb, `vendas_cliente_${clienteId}.xlsx`);
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

  const totais = pedidosCliente.reduce(
    (acc, p) => ({
      totalVendas: acc.totalVendas + p.totalVenda,
      totalCustos: acc.totalCustos + p.totalCusto,
      lucro: acc.lucro + (p.totalVenda - p.totalCusto),
    }),
    { totalVendas: 0, totalCustos: 0, lucro: 0 }
  );

  const ticketMedio = pedidosCliente.length > 0 ? totais.totalVendas / pedidosCliente.length : 0;
  const margemPercentual = totais.totalVendas > 0 ? (totais.lucro / totais.totalVendas) * 100 : 0;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Relatório por Cliente</h1>
        <p className="text-muted-foreground">
          Visualize o histórico e estatísticas de vendas por cliente
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Selecione um cliente e opcionalmente um período</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="cliente">Cliente *</Label>
              <Select value={clienteId} onValueChange={setClienteId}>
                <SelectTrigger id="cliente">
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  {loadingClientes ? (
                    <SelectItem value="loading" disabled>
                      Carregando...
                    </SelectItem>
                  ) : todosClientes.length === 0 ? (
                    <SelectItem value="empty" disabled>
                      Nenhum cliente cadastrado
                    </SelectItem>
                  ) : (
                    todosClientes.map((cliente) => (
                      <SelectItem key={cliente.id} value={cliente.id.toString()}>
                        {cliente.nome} - {cliente.cpfCnpj}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
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
              <Button onClick={handleBuscar} disabled={loading || loadingClientes} className="w-full">
                {loading ? "Buscando..." : "Buscar"}
              </Button>
            </div>
          </div>
          {pedidosCliente.length > 0 && (
            <div className="mt-4">
              <Button onClick={handleExportar} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Exportar Excel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {pedidosCliente.length > 0 && (
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
              <CardTitle>Pedidos ({pedidosCliente.length})</CardTitle>
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
                    {pedidosCliente.map((pedido) => (
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
