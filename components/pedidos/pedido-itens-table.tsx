import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { IconTrash } from "@tabler/icons-react"
import type { PedidoItem } from "./types"

interface PedidoItensTableProps {
  items: PedidoItem[]
  tipo: "COMPRA" | "VENDA"
  canEdit: boolean
  onRemoveItem: (index: number) => void
}

export function PedidoItensTable({
  items,
  tipo,
  canEdit,
  onRemoveItem,
}: PedidoItensTableProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhum item adicionado ao pedido
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Produto</TableHead>
            <TableHead className="text-right">Quantidade</TableHead>
            <TableHead className="text-right">Custo Unit.</TableHead>
            <TableHead className="text-right">Preço Unit.</TableHead>
            {tipo === "VENDA" && <TableHead className="text-right">Margem</TableHead>}
            <TableHead className="text-right">Subtotal</TableHead>
            {canEdit && <TableHead className="w-[60px]"></TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, index) => {
            const margem = item.precoCustoUN && item.precoVendaUN > 0
              ? ((item.precoVendaUN - item.precoCustoUN) / item.precoVendaUN * 100).toFixed(2)
              : "0.00"
            
            return (
              <TableRow key={index}>
                <TableCell className="font-medium">
                  {item.produtoNome || `Produto ${item.produtoId}`}
                </TableCell>
                <TableCell className="text-right">{item.qntd}</TableCell>
                <TableCell className="text-right">
                  {item.precoCustoUN ? (
                    new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(item.precoCustoUN)
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(item.precoVendaUN)}
                </TableCell>
                {tipo === "VENDA" && (
                  <TableCell className="text-right">
                    <Badge variant={Number(margem) > 0 ? 'default' : 'secondary'}>
                      {margem}%
                    </Badge>
                  </TableCell>
                )}
                <TableCell className="text-right font-medium">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(item.qntd * item.precoVendaUN)}
                </TableCell>
                {canEdit && (
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveItem(index)}
                    >
                      <IconTrash className="size-4 text-destructive" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
