import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { IconLoader2 } from "@tabler/icons-react"

interface PedidoResumoCardProps {
  itemsCount: number
  total: number
  canEdit: boolean
  isEditing: boolean
  isSubmitting: boolean
  onSubmit: () => void
  onCancel: () => void
}

export function PedidoResumoCard({
  itemsCount,
  total,
  canEdit,
  isEditing,
  isSubmitting,
  onSubmit,
  onCancel,
}: PedidoResumoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumo</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Itens</span>
            <span className="font-medium">{itemsCount}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="font-bold text-lg">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(total)}
            </span>
          </div>
        </div>
      </CardContent>
      {canEdit && (
        <CardFooter className="flex flex-col gap-2">
          <Button
            type="button"
            className="w-full"
            disabled={isSubmitting}
            onClick={onSubmit}
          >
            {isSubmitting && (
              <IconLoader2 className="mr-2 size-4 animate-spin" />
            )}
            {isEditing ? "Salvar Alterações" : "Criar Pedido"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
