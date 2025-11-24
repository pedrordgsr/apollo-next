import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { FieldLabel } from "@/components/ui/field"
import { toast } from "sonner"
import type { Produto } from "./types"

interface ProdutoSelectorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  produtos: Produto[]
  tipo: "COMPRA" | "VENDA"
  onConfirm: (produto: Produto, quantidade: number, preco: number) => void
}

export function ProdutoSelectorDialog({
  open,
  onOpenChange,
  produtos,
  tipo,
  onConfirm,
}: ProdutoSelectorDialogProps) {
  const [searchProduto, setSearchProduto] = useState("")
  const [selectedProduto, setSelectedProduto] = useState<Produto | null>(null)
  const [quantidade, setQuantidade] = useState(1)
  const [preco, setPreco] = useState(0)

  const handleSelectProduto = (produto: Produto) => {
    // Não permite selecionar produtos inativos
    if (produto.status !== "ATIVO") {
      toast.error("Este produto está inativo e não pode ser selecionado")
      return
    }
    setSelectedProduto(produto)
    setQuantidade(1)
    setPreco(tipo === "COMPRA" ? produto.precoCusto : produto.precoVenda)
  }

  const handleConfirm = () => {
    if (!selectedProduto) {
      toast.error("Selecione um produto")
      return
    }

    if (quantidade <= 0) {
      toast.error("Quantidade deve ser maior que zero")
      return
    }

    if (tipo === "VENDA" && quantidade > selectedProduto.qntdEstoque) {
      toast.error(`Estoque insuficiente! Disponível: ${selectedProduto.qntdEstoque}`)
      return
    }

    if (preco <= 0) {
      toast.error("Preço deve ser maior que zero")
      return
    }

    onConfirm(selectedProduto, quantidade, preco)
    
    // Reset state
    setSearchProduto("")
    setSelectedProduto(null)
    setQuantidade(1)
    setPreco(0)
  }

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen)
    if (!newOpen) {
      // Reset state on close
      setSearchProduto("")
      setSelectedProduto(null)
      setQuantidade(1)
      setPreco(0)
    }
  }

  const produtosFiltrados = produtos.filter((produto) =>
    produto.nome.toLowerCase().includes(searchProduto.toLowerCase())
  )

  const margem = selectedProduto && preco > 0
    ? ((preco - selectedProduto.precoCusto) / preco * 100).toFixed(2)
    : "0.00"

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="max-w-6xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        <AlertDialogHeader>
          <AlertDialogTitle>Selecionar Produto</AlertDialogTitle>
        </AlertDialogHeader>

        <div className="space-y-4 overflow-y-auto flex-1">
          {/* Campo de Busca */}
          <div>
            <Input
              placeholder="Buscar produto..."
              value={searchProduto}
              onChange={(e) => setSearchProduto(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Tabela de Produtos */}
          <div className="border rounded-lg overflow-auto max-h-[300px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead className="text-right">Preço Custo</TableHead>
                  <TableHead className="text-right">Preço Venda</TableHead>
                  <TableHead className="text-right">Estoque</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {produtosFiltrados.length > 0 ? (
                  produtosFiltrados.map((produto) => {
                    const isInativo = produto.status !== "ATIVO"
                    return (
                      <TableRow
                        key={produto.id}
                        className={`${
                          isInativo
                            ? "text-muted-foreground cursor-not-allowed opacity-60"
                            : "cursor-pointer hover:bg-muted"
                        } ${
                          selectedProduto?.id === produto.id ? "bg-muted" : ""
                        }`}
                        onClick={() => handleSelectProduto(produto)}
                      >
                        <TableCell className="font-medium">
                          {produto.nome}
                          {isInativo && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                              INATIVO
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          R$ {produto.precoCusto.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          R$ {produto.precoVenda.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant={
                              produto.qntdEstoque > 0 ? "default" : "destructive"
                            }
                          >
                            {produto.qntdEstoque}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center py-8 text-muted-foreground"
                    >
                      Nenhum produto encontrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Inputs de Quantidade e Preço */}
          {selectedProduto && (
            <div className="space-y-4 pt-4 border-t">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel>Quantidade</FieldLabel>
                  <Input
                    type="number"
                    min="1"
                    value={quantidade}
                    onChange={(e) => setQuantidade(Number(e.target.value))}
                  />
                  {tipo === "VENDA" &&
                    quantidade > selectedProduto.qntdEstoque && (
                      <div className="text-sm text-destructive mt-1">
                        ⚠️ Quantidade maior que estoque disponível (
                        {selectedProduto.qntdEstoque})
                      </div>
                    )}
                </div>
                <div>
                  <FieldLabel>
                    {tipo === "COMPRA" ? "Preço de Compra" : "Preço de Venda"}
                  </FieldLabel>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={preco}
                    onChange={(e) => setPreco(Number(e.target.value))}
                  />
                </div>
              </div>

              {/* Exibir Margem Calculada - apenas para pedidos de VENDA */}
              {tipo === "VENDA" && preco > 0 && (
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="text-sm font-medium">Margem de Lucro:</span>
                  <Badge
                    variant={Number(margem) > 0 ? "default" : "destructive"}
                    className="text-base"
                  >
                    {margem}%
                  </Badge>
                </div>
              )}
            </div>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={
              !selectedProduto ||
              quantidade <= 0 ||
              (tipo === "VENDA" &&
                selectedProduto &&
                quantidade > selectedProduto.qntdEstoque)
            }
          >
            Adicionar ao Pedido
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
