"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, TrendingUp, Users, ShoppingCart, FileSpreadsheet, Building2, Package, Trophy } from "lucide-react";
import Link from "next/link";

export default function RelatoriosPage() {
  return (
    <div className="container mx-auto py-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
        <p className="text-muted-foreground">
          Visualize e exporte relatórios de vendas e compras
        </p>
      </div>

      {/* Seção de Vendas/Clientes */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            Vendas / Clientes
          </h2>
          <p className="text-sm text-muted-foreground">
            Relatórios relacionados a vendas e clientes
          </p>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Link href="/relatorios/vendas-consolidado" className="block transition-transform hover:scale-105">
            <Card className="h-full cursor-pointer hover:shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5" />
                  Relatório de Vendas Consolidado
                </CardTitle>
                <CardDescription>
                  Consolidado por período
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Visualize o consolidado de todas as vendas agrupadas por período específico
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/relatorios/vendas-periodo" className="block transition-transform hover:scale-105">
            <Card className="h-full cursor-pointer hover:shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Vendas por Período
                </CardTitle>
                <CardDescription>
                  Detalhamento por período
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Análise detalhada das vendas realizadas em um período específico
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/relatorios/vendas-cliente" className="block transition-transform hover:scale-105">
            <Card className="h-full cursor-pointer hover:shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Relatório por Cliente
                </CardTitle>
                <CardDescription>
                  Análise por cliente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Visualize o histórico e estatísticas de vendas por cliente
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* Seção de Compras/Fornecedores */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <ShoppingCart className="h-6 w-6" />
            Compras / Fornecedores
          </h2>
          <p className="text-sm text-muted-foreground">
            Relatórios relacionados a compras e fornecedores
          </p>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Link href="/relatorios/compras-consolidado" className="block transition-transform hover:scale-105">
            <Card className="h-full cursor-pointer hover:shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5" />
                  Relatório de Compras Consolidado
                </CardTitle>
                <CardDescription>
                  Consolidado por período
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Visualize o consolidado de todas as compras agrupadas por período específico
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/relatorios/compras-periodo" className="block transition-transform hover:scale-105">
            <Card className="h-full cursor-pointer hover:shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Compras por Período
                </CardTitle>
                <CardDescription>
                  Detalhamento por período
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Análise detalhada das compras realizadas em um período específico
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/relatorios/compras-fornecedor" className="block transition-transform hover:scale-105">
            <Card className="h-full cursor-pointer hover:shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Relatório por Fornecedor
                </CardTitle>
                <CardDescription>
                  Análise por fornecedor
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Visualize o histórico e estatísticas de compras por fornecedor
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* Seção de Produtos */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Package className="h-6 w-6" />
            Produtos
          </h2>
          <p className="text-sm text-muted-foreground">
            Relatórios e análises de produtos
          </p>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Link href="/relatorios/produtos-ranking" className="block transition-transform hover:scale-105">
            <Card className="h-full cursor-pointer hover:shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Ranking de Produtos
                </CardTitle>
                <CardDescription>
                  Produtos mais vendidos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Visualize os produtos mais vendidos e rentáveis por período com análise de performance
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
