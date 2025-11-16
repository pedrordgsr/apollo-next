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
import { Download, Printer, Trophy } from "lucide-react";
import * as XLSX from "xlsx";

interface ProdutoRanking {
  idProduto: number;
  nome: string;
  descricao: string;
  quantidadeVendida: number;
  valorTotalVendido: number;
  lucroTotal: number;
  margemLucro: number;
  ticketMedio: number;
  posicaoRanking: number;
}

export default function ProdutosRankingPage() {
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [produtos, setProdutos] = useState<ProdutoRanking[]>([]);
  const [loading, setLoading] = useState(false);

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
      const response = await api.get("/relatorios/produtos/ranking", {
        params: {
          dataInicio: convertDateToAPI(dataInicio),
          dataFim: convertDateToAPI(dataFim),
        },
      });

      setProdutos(response.data);
      toast.success("Dados carregados com sucesso!");
    } catch (error) {
      console.error("Erro ao buscar ranking de produtos:", error);
      toast.error("Erro ao buscar ranking de produtos");
    } finally {
      setLoading(false);
    }
  };

  const handleExportar = () => {
    const dadosExport = produtos.map((p) => ({
      "Posição": p.posicaoRanking,
      "ID Produto": p.idProduto,
      "Nome": p.nome,
      "Descrição": p.descricao,
      "Quantidade Vendida": p.quantidadeVendida,
      "Valor Total Vendido": p.valorTotalVendido,
      "Lucro Total": p.lucroTotal,
      "Margem de Lucro (%)": p.margemLucro.toFixed(2),
      "Ticket Médio": p.ticketMedio,
    }));

    const ws = XLSX.utils.json_to_sheet(dadosExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ranking Produtos");
    XLSX.writeFile(wb, `ranking_produtos_${dataInicio}_${dataFim}.xlsx`);
  };

  const handleImprimir = () => {
    window.print();
  };

  const getRankingBadge = (posicao: number) => {
    if (posicao === 1) {
      return <Badge className="bg-yellow-500 hover:bg-yellow-600">1º Lugar</Badge>;
    } else if (posicao === 2) {
      return <Badge className="bg-gray-400 hover:bg-gray-500">2º Lugar</Badge>;
    } else if (posicao === 3) {
      return <Badge className="bg-amber-600 hover:bg-amber-700">3º Lugar</Badge>;
    } else {
      return <Badge variant="outline">{posicao}º</Badge>;
    }
  };

  const totais = produtos.reduce(
    (acc, p) => ({
      quantidadeTotal: acc.quantidadeTotal + p.quantidadeVendida,
      valorTotal: acc.valorTotal + p.valorTotalVendido,
      lucroTotal: acc.lucroTotal + p.lucroTotal,
    }),
    { quantidadeTotal: 0, valorTotal: 0, lucroTotal: 0 }
  );

  const margemMediaPonderada = totais.valorTotal > 0 ? (totais.lucroTotal / totais.valorTotal) * 100 : 0;
  const ticketMedioGeral = produtos.length > 0 ? totais.valorTotal / totais.quantidadeTotal : 0;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="print:hidden">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          Ranking de Produtos
        </h1>
        <p className="text-muted-foreground">
          Visualize os produtos mais vendidos e rentáveis por período
        </p>
      </div>

      <Card className="print:hidden">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Selecione o período para visualizar o ranking</CardDescription>
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
            {produtos.length > 0 && (
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

      {produtos.length > 0 && (
        <>
          {/* Cabeçalho para Impressão */}
          <div className="hidden print:block text-center space-y-2 mb-8">
            <h1 className="text-2xl font-bold">RANKING DE PRODUTOS MAIS VENDIDOS</h1>
            <p className="text-muted-foreground">
              Período: {new Date(dataInicio).toLocaleDateString("pt-BR")} até {new Date(dataFim).toLocaleDateString("pt-BR")}
            </p>
            <p className="text-sm text-muted-foreground">
              Data de Emissão: {new Date().toLocaleDateString("pt-BR")}
            </p>
          </div>

          {/* Indicadores Detalhados para Impressão */}
          <div className="hidden print:block mb-8 space-y-4">
            <h2 className="text-xl font-bold border-b pb-2">Indicadores Gerais</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Quantidade Total Vendida</p>
                <p className="text-lg font-bold">{totais.quantidadeTotal.toLocaleString("pt-BR")}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Valor Total Vendido</p>
                <p className="text-lg font-bold text-green-600">{formatCurrency(totais.valorTotal)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Lucro Total</p>
                <p className="text-lg font-bold text-blue-600">{formatCurrency(totais.lucroTotal)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Margem Média</p>
                <p className="text-lg font-bold">{margemMediaPonderada.toFixed(2)}%</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ticket Médio</p>
                <p className="text-lg font-bold">{formatCurrency(ticketMedioGeral)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Produtos</p>
                <p className="text-lg font-bold">{produtos.length}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-5 print:hidden">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Quantidade Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {totais.quantidadeTotal.toLocaleString("pt-BR")}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(totais.valorTotal)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Lucro Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(totais.lucroTotal)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Margem Média</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {margemMediaPonderada.toFixed(2)}%
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(ticketMedioGeral)}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="print:shadow-none print:border-0">
            <CardHeader className="print:px-0">
              <CardTitle>Ranking de Produtos ({produtos.length})</CardTitle>
            </CardHeader>
            <CardContent className="print:px-0">
              <div className="rounded-md border print:border-gray-300">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="print:w-[8%]">Posição</TableHead>
                      <TableHead className="print:w-[6%]">ID</TableHead>
                      <TableHead className="print:w-[18%]">Nome</TableHead>
                      <TableHead className="print:w-[15%]">Descrição</TableHead>
                      <TableHead className="text-right print:w-[10%]">Qtd. Vendida</TableHead>
                      <TableHead className="text-right print:w-[13%]">Valor Total</TableHead>
                      <TableHead className="text-right print:w-[13%]">Lucro</TableHead>
                      <TableHead className="text-right print:w-[10%]">Margem</TableHead>
                      <TableHead className="text-right print:w-[12%]">Ticket Médio</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {produtos.map((produto) => (
                      <TableRow key={produto.idProduto} className={produto.posicaoRanking <= 3 ? "bg-muted/50" : ""}>
                        <TableCell className="font-medium print:text-xs">
                          <span className="print:hidden">{getRankingBadge(produto.posicaoRanking)}</span>
                          <span className="hidden print:inline">{produto.posicaoRanking}º</span>
                        </TableCell>
                        <TableCell className="print:text-xs">{produto.idProduto}</TableCell>
                        <TableCell className="font-medium print:text-xs print:whitespace-normal">{produto.nome}</TableCell>
                        <TableCell className="text-muted-foreground print:text-xs print:whitespace-normal">{produto.descricao}</TableCell>
                        <TableCell className="text-right print:text-xs">
                          {produto.quantidadeVendida.toLocaleString("pt-BR")}
                        </TableCell>
                        <TableCell className="text-right print:text-xs print:whitespace-nowrap">
                          {formatCurrency(produto.valorTotalVendido)}
                        </TableCell>
                        <TableCell className="text-right font-semibold print:text-xs print:whitespace-nowrap">
                          {formatCurrency(produto.lucroTotal)}
                        </TableCell>
                        <TableCell className="text-right print:text-xs">
                          {produto.margemLucro.toFixed(2)}%
                        </TableCell>
                        <TableCell className="text-right print:text-xs print:whitespace-nowrap">
                          {formatCurrency(produto.ticketMedio)}
                        </TableCell>
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
