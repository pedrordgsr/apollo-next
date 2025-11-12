import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

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
}

interface SectionCardsProps {
  data: DashboardData;
}

export function SectionCards({ data }: SectionCardsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value.toFixed(1)}%`;
  };

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Faturado</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatCurrency(data.totalFaturado)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {data.tendenciaFaturamento >= 0 ? <IconTrendingUp /> : <IconTrendingDown />}
              {formatPercentage(data.tendenciaFaturamento)}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Tendência de {data.tendenciaFaturamento >= 0 ? "alta" : "baixa"} este mês{" "}
            {data.tendenciaFaturamento >= 0 ? (
              <IconTrendingUp className="size-4" />
            ) : (
              <IconTrendingDown className="size-4" />
            )}
          </div>
          <div className="text-muted-foreground">
            No mês passado: {formatCurrency(data.faturadoMesAnterior)}
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total de Pedidos</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {data.totalPedidos}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {data.tendenciaPedidos >= 0 ? <IconTrendingUp /> : <IconTrendingDown />}
              {formatPercentage(data.tendenciaPedidos)}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Tendência de {data.tendenciaPedidos >= 0 ? "alta" : "baixa"} neste mês{" "}
            {data.tendenciaPedidos >= 0 ? (
              <IconTrendingUp className="size-4" />
            ) : (
              <IconTrendingDown className="size-4" />
            )}
          </div>
          <div className="text-muted-foreground">
            No mês passado: {data.pedidosMesAnterior}
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Ticket Médio</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatCurrency(data.ticketMedio)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {data.tendenciaTicketMedio >= 0 ? <IconTrendingUp /> : <IconTrendingDown />}
              {formatPercentage(data.tendenciaTicketMedio)}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Tendência de {data.tendenciaTicketMedio >= 0 ? "alta" : "baixa"} este mês{" "}
            {data.tendenciaTicketMedio >= 0 ? (
              <IconTrendingUp className="size-4" />
            ) : (
              <IconTrendingDown className="size-4" />
            )}
          </div>
          <div className="text-muted-foreground">
            No mês passado: {formatCurrency(data.ticketMedioMesAnterior)}
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Gasto com Compras</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatCurrency(data.totalCompras)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {data.tendenciaCompras >= 0 ? <IconTrendingUp /> : <IconTrendingDown />}
              {formatPercentage(data.tendenciaCompras)}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Tendência de {data.tendenciaCompras >= 0 ? "alta" : "baixa"} este mês{" "}
            {data.tendenciaCompras >= 0 ? (
              <IconTrendingUp className="size-4" />
            ) : (
              <IconTrendingDown className="size-4" />
            )}
          </div>
          <div className="text-muted-foreground">
            No mês passado: {formatCurrency(data.comprasMesAnterior)}
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
