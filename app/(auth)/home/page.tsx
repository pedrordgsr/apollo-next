"use client";

import { useEffect, useState } from "react";
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { SectionCards } from "@/components/section-cards"
import { api } from "@/lib/api";
import { toast } from "sonner";

interface DashboardData {
  totalFaturado: number;
  totalPedidos: number;
  ticketMedio: number;
  totalCompras: number;
  tendenciaFaturamento: number;
  tendenciaPedidos: number;
  tendenciaTicketMedio: number;
  tendenciaCompras: number;
  faturadoMesAnterior: number;
  pedidosMesAnterior: number;
  ticketMedioMesAnterior: number;
  comprasMesAnterior: number;
  chartData: Array<{ date: string; valor: number; quantidade: number }>;
}

export default function Page() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Buscar dados dos últimos 90 dias
        const hoje = new Date();
        const dataFim = hoje.toLocaleDateString("pt-BR", { 
          day: "2-digit", 
          month: "2-digit", 
          year: "numeric" 
        });

        // Buscar dados do mês atual
        const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        const dataInicioMes = primeiroDiaMes.toLocaleDateString("pt-BR", { 
          day: "2-digit", 
          month: "2-digit", 
          year: "numeric" 
        });

        // Buscar dados do mês anterior
        const primeiroDiaMesAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
        const ultimoDiaMesAnterior = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
        const dataInicioMesAnterior = primeiroDiaMesAnterior.toLocaleDateString("pt-BR", { 
          day: "2-digit", 
          month: "2-digit", 
          year: "numeric" 
        });
        const dataFimMesAnterior = ultimoDiaMesAnterior.toLocaleDateString("pt-BR", { 
          day: "2-digit", 
          month: "2-digit", 
          year: "numeric" 
        });

        // Buscar vendas do mês atual (apenas faturados)
        const responseVendasMes = await api.get("/relatorios/vendas/periodo", {
          params: {
            dataInicio: dataInicioMes,
            dataFim: dataFim,
          },
        });

        // Buscar vendas do mês anterior (apenas faturados)
        const responseVendasMesAnterior = await api.get("/relatorios/vendas/periodo", {
          params: {
            dataInicio: dataInicioMesAnterior,
            dataFim: dataFimMesAnterior,
          },
        });

        // Buscar compras do mês atual
        const responseComprasMes = await api.get("/relatorios/compras/periodo", {
          params: {
            dataInicio: dataInicioMes,
            dataFim: dataFim,
          },
        });

        // Buscar compras do mês anterior
        const responseComprasMesAnterior = await api.get("/relatorios/compras/periodo", {
          params: {
            dataInicio: dataInicioMesAnterior,
            dataFim: dataFimMesAnterior,
          },
        });

        const vendasMes = responseVendasMes.data;
        const vendasMesAnterior = responseVendasMesAnterior.data;
        const comprasMes = responseComprasMes.data;
        const comprasMesAnterior = responseComprasMesAnterior.data;

        // Calcular tendências
        const tendenciaFaturamento = vendasMesAnterior.totalVendas > 0
          ? ((vendasMes.totalVendas - vendasMesAnterior.totalVendas) / vendasMesAnterior.totalVendas) * 100
          : 0;

        const tendenciaPedidos = vendasMesAnterior.quantidadePedidos > 0
          ? ((vendasMes.quantidadePedidos - vendasMesAnterior.quantidadePedidos) / vendasMesAnterior.quantidadePedidos) * 100
          : 0;

        const tendenciaTicketMedio = vendasMesAnterior.ticketMedio > 0
          ? ((vendasMes.ticketMedio - vendasMesAnterior.ticketMedio) / vendasMesAnterior.ticketMedio) * 100
          : 0;

        const tendenciaCompras = comprasMesAnterior.totalCompras > 0
          ? ((comprasMes.totalCompras - comprasMesAnterior.totalCompras) / comprasMesAnterior.totalCompras) * 100
          : 0;

        // Buscar dados detalhados para o gráfico (últimos 90 dias)
        const data90DiasAtras = new Date(hoje);
        data90DiasAtras.setDate(hoje.getDate() - 90);
        const dataInicio90 = data90DiasAtras.toLocaleDateString("pt-BR", { 
          day: "2-digit", 
          month: "2-digit", 
          year: "numeric" 
        });

        // Buscar todos os clientes do período
        const clientesResponse = await api.get("/relatorios/clientes", {
          params: {
            dataInicio: dataInicio90,
            dataFim: dataFim,
          },
        });

        // Buscar detalhes dos pedidos
        interface PedidoDetalhado {
          idPedido: number;
          dataEmissao: string;
          totalVenda: number;
          status: string;
        }

        const todosPedidos: PedidoDetalhado[] = [];
        for (const cliente of clientesResponse.data) {
          try {
            const detalhesResponse = await api.get(
              `/relatorios/clientes/${cliente.idPessoa}/detalhes`,
              {
                params: {
                  dataInicio: dataInicio90,
                  dataFim: dataFim,
                },
              }
            );
            todosPedidos.push(...detalhesResponse.data);
          } catch (error) {
            console.error(`Erro ao buscar pedidos do cliente ${cliente.idPessoa}:`, error);
          }
        }

        // Agrupar pedidos faturados por data
        const pedidosPorData = new Map<string, { valor: number; quantidade: number }>();
        
        todosPedidos
          .filter(p => p.status === "FATURADO") // Apenas faturados
          .forEach(pedido => {
            const data = new Date(pedido.dataEmissao);
            const dataKey = data.toISOString().split('T')[0]; // YYYY-MM-DD
            
            if (!pedidosPorData.has(dataKey)) {
              pedidosPorData.set(dataKey, { valor: 0, quantidade: 0 });
            }
            
            const registro = pedidosPorData.get(dataKey)!;
            registro.valor += pedido.totalVenda;
            registro.quantidade += 1;
          });

        // Converter para array e ordenar por data
        const chartData = Array.from(pedidosPorData.entries())
          .map(([date, data]) => ({
            date,
            valor: data.valor,
            quantidade: data.quantidade,
          }))
          .sort((a, b) => a.date.localeCompare(b.date));
        
        setData({
          totalFaturado: vendasMes.totalVendas,
          totalPedidos: vendasMes.quantidadePedidos,
          ticketMedio: vendasMes.ticketMedio,
          totalCompras: comprasMes.totalCompras || 0,
          tendenciaFaturamento,
          tendenciaPedidos,
          tendenciaTicketMedio,
          tendenciaCompras,
          faturadoMesAnterior: vendasMesAnterior.totalVendas,
          pedidosMesAnterior: vendasMesAnterior.quantidadePedidos,
          ticketMedioMesAnterior: vendasMesAnterior.ticketMedio,
          comprasMesAnterior: comprasMesAnterior.totalCompras || 0,
          chartData,
        });
      } catch (error) {
        console.error("Erro ao carregar dados do dashboard:", error);
        toast.error("Erro ao carregar dados do dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center">
        <p className="text-muted-foreground">Carregando dados do dashboard...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center">
        <p className="text-muted-foreground">Nenhum dado disponível</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <SectionCards data={data} />
          <div className="px-4 lg:px-6">
            <ChartAreaInteractive data={data.chartData} />
          </div>
        </div>
      </div>
    </div>
  )
}
