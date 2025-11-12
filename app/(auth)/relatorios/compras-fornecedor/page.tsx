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

interface FornecedorRelatorio {
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
  totalVenda: number | null;
  formaPagamento: string;
}

interface Fornecedor {
  id: number;
  nome: string;
  cpfCnpj: string;
}

export default function ComprasFornecedorPage() {
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [fornecedorId, setFornecedorId] = useState("");
  const [todosFornecedores, setTodosFornecedores] = useState<Fornecedor[]>([]);
  const [pedidosFornecedor, setPedidosFornecedor] = useState<PedidoDetalhado[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingFornecedores, setLoadingFornecedores] = useState(false);

  useEffect(() => {
    carregarTodosFornecedores();
  }, []);

  const carregarTodosFornecedores = async () => {
    setLoadingFornecedores(true);
    try {
      const response = await api.get("/fornecedores?page=0&size=1000");
      const fornecedoresFiltrados = response.data.content || [];
      setTodosFornecedores(fornecedoresFiltrados);
    } catch (error) {
      console.error("Erro ao carregar fornecedores:", error);
      toast.error("Erro ao carregar lista de fornecedores");
    } finally {
      setLoadingFornecedores(false);
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
    if (!fornecedorId) {
      toast.error("Por favor, selecione um fornecedor");
      return;
    }

    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (dataInicio && dataFim) {
        params.dataInicio = convertDateToAPI(dataInicio);
        params.dataFim = convertDateToAPI(dataFim);
      }

      // Buscar dados do fornecedor específico
      const response = await api.get("/api/relatorios/fornecedores", { params });
      const fornecedorData = response.data.find(
        (f: FornecedorRelatorio) => f.idPessoa === parseInt(fornecedorId)
      );

      if (fornecedorData) {
        // Buscar detalhes dos pedidos
        const detalhesResponse = await api.get(
          `/api/relatorios/fornecedores/${fornecedorData.idPessoa}/detalhes`,
          { params }
        );
        setPedidosFornecedor(detalhesResponse.data);
        
        toast.success("Dados carregados com sucesso!");
      } else {
        setPedidosFornecedor([]);
        toast.info("Nenhum dado encontrado para este fornecedor no período selecionado");
      }
    } catch (error) {
      console.error("Erro ao buscar dados do fornecedor:", error);
      toast.error("Erro ao buscar dados do fornecedor");
    } finally {
      setLoading(false);
    }
  };

  const handleExportar = () => {
    const dadosExport = pedidosFornecedor.map((p) => ({
      "ID Pedido": p.idPedido,
      Tipo: p.tipo,
      Status: p.status,
      "Data Emissão": formatDate(p.dataEmissao),
      Fornecedor: p.nomePessoa,
      Funcionário: p.nomeFuncionario,
      "Total Compra": p.totalCusto,
      "Forma de Pagamento": p.formaPagamento,
    }));

    const ws = XLSX.utils.json_to_sheet(dadosExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Fornecedor");
    XLSX.writeFile(wb, `compras_fornecedor_${fornecedorId}.xlsx`);
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

  const totalCompras = pedidosFornecedor.reduce((acc, p) => acc + p.totalCusto, 0);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Relatório por Fornecedor</h1>
        <p className="text-muted-foreground">
          Visualize o histórico e estatísticas de compras por fornecedor
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Selecione um fornecedor e opcionalmente um período</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="fornecedor">Fornecedor *</Label>
              <Select value={fornecedorId} onValueChange={setFornecedorId}>
                <SelectTrigger id="fornecedor">
                  <SelectValue placeholder="Selecione um fornecedor" />
                </SelectTrigger>
                <SelectContent>
                  {loadingFornecedores ? (
                    <SelectItem value="loading" disabled>
                      Carregando...
                    </SelectItem>
                  ) : todosFornecedores.length === 0 ? (
                    <SelectItem value="empty" disabled>
                      Nenhum fornecedor cadastrado
                    </SelectItem>
                  ) : (
                    todosFornecedores.map((fornecedor) => (
                      <SelectItem key={fornecedor.id} value={fornecedor.id.toString()}>
                        {fornecedor.nome} - {fornecedor.cpfCnpj}
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
              <Button onClick={handleBuscar} disabled={loading || loadingFornecedores} className="w-full">
                {loading ? "Buscando..." : "Buscar"}
              </Button>
            </div>
          </div>
          {pedidosFornecedor.length > 0 && (
            <div className="mt-4">
              <Button onClick={handleExportar} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Exportar Excel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {pedidosFornecedor.length > 0 && (
        <>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total de Compras</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(totalCompras)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {pedidosFornecedor.length} pedido(s) de compra
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pedidos ({pedidosFornecedor.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Fornecedor</TableHead>
                      <TableHead>Funcionário</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Pagamento</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pedidosFornecedor.map((pedido) => (
                      <TableRow key={pedido.idPedido}>
                        <TableCell className="font-medium">{pedido.idPedido}</TableCell>
                        <TableCell>{formatDate(pedido.dataEmissao)}</TableCell>
                        <TableCell>{pedido.nomePessoa}</TableCell>
                        <TableCell>{pedido.nomeFuncionario}</TableCell>
                        <TableCell>{getStatusBadge(pedido.status)}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(pedido.totalCusto)}
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
