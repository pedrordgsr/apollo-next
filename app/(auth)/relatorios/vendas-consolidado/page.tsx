"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { FileText, TrendingUp, DollarSign, ShoppingCart, Percent } from "lucide-react";
import { toast } from "sonner";

interface RelatorioVendas {
  dataInicio: string;
  dataFim: string;
  quantidadePedidos: number;
  totalVendas: number;
  totalCusto: number;
  lucro: number;
  ticketMedio: number;
}

export default function VendasConsolidadoPage() {
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [relatorio, setRelatorio] = useState<RelatorioVendas | null>(null);
  const [loading, setLoading] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR");
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const convertDateToAPI = (date: string) => {
    // Converte de YYYY-MM-DD para DD/MM/YYYY
    const [year, month, day] = date.split("-");
    return `${day}/${month}/${year}`;
  };

  const handleGerarRelatorio = async () => {
    if (!dataInicio || !dataFim) {
      toast.error("Por favor, preencha as datas de início e fim");
      return;
    }

    setLoading(true);
    try {
      const response = await api.get("/api/relatorios/vendas/periodo", {
        params: {
          dataInicio: convertDateToAPI(dataInicio),
          dataFim: convertDateToAPI(dataFim),
        },
      });
      setRelatorio(response.data);
      toast.success("Relatório gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
      toast.error("Erro ao gerar relatório");
    } finally {
      setLoading(false);
    }
  };

  const handleImprimir = () => {
    window.print();
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Relatório de Vendas Consolidado</h1>
        <p className="text-muted-foreground">
          Visualize o consolidado de todas as vendas por período
        </p>
      </div>

      <Card className="print:hidden">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Selecione o período para gerar o relatório</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
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
            <div className="flex items-end space-x-2">
              <Button onClick={handleGerarRelatorio} disabled={loading} className="flex-1">
                {loading ? "Gerando..." : "Gerar Relatório"}
              </Button>
              {relatorio && (
                <Button onClick={handleImprimir} variant="outline">
                  Imprimir
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {relatorio && (
        <div className="space-y-6 print:space-y-8">
          {/* Cabeçalho do Relatório */}
          <div className="text-center space-y-2 print:mb-8">
            <h2 className="text-2xl font-bold">RELATÓRIO DE VENDAS CONSOLIDADO</h2>
            <p className="text-muted-foreground">
              Período: {formatDate(relatorio.dataInicio)} até {formatDate(relatorio.dataFim)}
            </p>
            <p className="text-sm text-muted-foreground">
              Data de Emissão: {new Date().toLocaleDateString("pt-BR")}
            </p>
          </div>

          {/* Cards de Resumo */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 print:hidden">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{relatorio.quantidadePedidos}</div>
                <p className="text-xs text-muted-foreground">pedidos realizados</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(relatorio.totalVendas)}
                </div>
                <p className="text-xs text-muted-foreground">valor total vendido</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Custos</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(relatorio.totalCusto)}
                </div>
                <p className="text-xs text-muted-foreground">custo dos produtos</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Lucro</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(relatorio.lucro)}
                </div>
                <p className="text-xs text-muted-foreground">lucro bruto</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(relatorio.ticketMedio)}</div>
                <p className="text-xs text-muted-foreground">por pedido</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Margem de Lucro</CardTitle>
                <Percent className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {relatorio.totalVendas > 0
                    ? ((relatorio.lucro / relatorio.totalVendas) * 100).toFixed(2)
                    : 0}
                  %
                </div>
                <p className="text-xs text-muted-foreground">margem bruta</p>
              </CardContent>
            </Card>
          </div>

          {/* Análise Detalhada */}
          <Card>
            <CardHeader>
              <CardTitle>Análise Detalhada</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h3 className="font-semibold">Resumo de Vendas</h3>
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="font-medium">Período Analisado:</span>{" "}
                      {formatDate(relatorio.dataInicio)} a {formatDate(relatorio.dataFim)}
                    </p>
                    <p>
                      <span className="font-medium">Quantidade de Pedidos:</span>{" "}
                      {relatorio.quantidadePedidos}
                    </p>
                    <p>
                      <span className="font-medium">Valor Total em Vendas:</span>{" "}
                      {formatCurrency(relatorio.totalVendas)}
                    </p>
                    <p>
                      <span className="font-medium">Custo Total dos Produtos:</span>{" "}
                      {formatCurrency(relatorio.totalCusto)}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">Indicadores de Performance</h3>
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="font-medium">Lucro Bruto:</span>{" "}
                      {formatCurrency(relatorio.lucro)}
                    </p>
                    <p>
                      <span className="font-medium">Margem de Lucro:</span>{" "}
                      {relatorio.totalVendas > 0
                        ? ((relatorio.lucro / relatorio.totalVendas) * 100).toFixed(2)
                        : 0}
                      %
                    </p>
                    <p>
                      <span className="font-medium">Ticket Médio por Pedido:</span>{" "}
                      {formatCurrency(relatorio.ticketMedio)}
                    </p>
                    <p>
                      <span className="font-medium">Custo Médio por Pedido:</span>{" "}
                      {formatCurrency(
                        relatorio.quantidadePedidos > 0
                          ? relatorio.totalCusto / relatorio.quantidadePedidos
                          : 0
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
