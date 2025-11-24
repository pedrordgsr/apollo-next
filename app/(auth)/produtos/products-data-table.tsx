"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconDownload,
  IconLayoutColumns,
  IconPencil,
  IconPlus,
  IconSearch,
  IconToggleLeft,
  IconToggleRight,
} from "@tabler/icons-react"
import Link from "next/link"
import { toast } from "sonner"
import { api } from "@/lib/api"
import { exportToExcel } from "@/lib/exportToExcel"

import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

interface Produto {
  id: number
  status: string
  nome: string
  descricao: string
  qntdEstoque: number
  precoCusto: number
  precoVenda: number
}

interface StockCellProps {
  produto: Produto
  onRefresh: () => void
}

function StockCell({ produto, onRefresh }: StockCellProps) {
  const [isEditing, setIsEditing] = React.useState(false)
  const [newQuantity, setNewQuantity] = React.useState(produto.qntdEstoque.toString())
  const [showConfirmDialog, setShowConfirmDialog] = React.useState(false)
  const [isUpdating, setIsUpdating] = React.useState(false)

  const handleClick = () => {
    setIsEditing(true)
    setNewQuantity(produto.qntdEstoque.toString())
  }

  const handleBlur = () => {
    const quantity = parseInt(newQuantity)
    if (!isNaN(quantity) && quantity !== produto.qntdEstoque) {
      setShowConfirmDialog(true)
    } else {
      setIsEditing(false)
      setNewQuantity(produto.qntdEstoque.toString())
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      const quantity = parseInt(newQuantity)
      if (!isNaN(quantity) && quantity !== produto.qntdEstoque) {
        setShowConfirmDialog(true)
      }
    } else if (e.key === "Escape") {
      setIsEditing(false)
      setNewQuantity(produto.qntdEstoque.toString())
    }
  }

  const handleConfirm = async () => {
    const quantity = parseInt(newQuantity)
    if (isNaN(quantity) || quantity < 0) {
      toast.error("Quantidade inválida")
      return
    }

    setIsUpdating(true)
    try {
      const currentStock = produto.qntdEstoque
      const difference = quantity - currentStock

      if (difference === 0) {
        setShowConfirmDialog(false)
        setIsEditing(false)
        return
      }

      const endpoint = difference > 0 ? "add" : "sub"
      const amount = Math.abs(difference)

      const response = await api.put(
        `/produtos/${endpoint}/${produto.id}`,
        amount
      )

      toast.success(response.data || "Estoque atualizado com sucesso!")
      setShowConfirmDialog(false)
      setIsEditing(false)
      onRefresh()
    } catch (err) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosError = err as {
          response?: { status?: number; data?: { message?: string } }
        }
        if (axiosError.response?.status === 401) {
          toast.error("Sessão expirada. Faça login novamente.")
        } else {
          toast.error(axiosError.response?.data?.message || "Erro ao atualizar estoque")
        }
      } else {
        toast.error("Erro ao atualizar estoque")
      }
      setNewQuantity(produto.qntdEstoque.toString())
    } finally {
      setIsUpdating(false)
    }
  }

  const handleCancel = () => {
    setShowConfirmDialog(false)
    setIsEditing(false)
    setNewQuantity(produto.qntdEstoque.toString())
  }

  const quantity = parseInt(newQuantity)
  const currentStock = produto.qntdEstoque
  const difference = !isNaN(quantity) ? quantity - currentStock : 0
  const amount = Math.abs(difference)

  return (
    <>
      <div className="text-right">
        {isEditing ? (
          <Input
            type="number"
            min="0"
            value={newQuantity}
            onChange={(e) => setNewQuantity(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="w-20 h-8 text-right"
            autoFocus
          />
        ) : (
          <button
            onClick={handleClick}
            className="font-medium hover:underline cursor-pointer"
            title="Clique para editar"
          >
            {produto.qntdEstoque}
          </button>
        )}
      </div>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar alteração de estoque</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-2">
                <div>
                  <strong>Produto:</strong> {produto.nome}
                </div>
                <div>
                  <strong>Estoque atual:</strong> {currentStock} unidades
                </div>
                <div>
                  <strong>Novo estoque:</strong> {quantity} unidades
                </div>
                <div className="text-base font-semibold mt-4">
                  {difference > 0 ? (
                    <span className="text-green-600">
                      + Adicionar {amount} {amount === 1 ? "unidade" : "unidades"}
                    </span>
                  ) : (
                    <span className="text-red-600">
                      - Remover {amount} {amount === 1 ? "unidade" : "unidades"}
                    </span>
                  )}
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel} disabled={isUpdating}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={isUpdating}>
              {isUpdating ? "Atualizando..." : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

const createColumns = (onRefresh: () => void): ColumnDef<Produto>[] => [
  {
    accessorKey: "id",
    header: "SKU",
    cell: ({ row }) => (
      <div className="w-16 font-medium">{row.getValue("id")}</div>
    ),
    filterFn: (row, id, value) => {
      const sku = row.getValue(id)?.toString() || ""
      return sku.startsWith(value)
    },
  },
  {
    accessorKey: "nome",
    header: "Nome",
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("nome")}</div>
    ),
  },
  {
    accessorKey: "descricao",
    header: "Descrição",
    cell: ({ row }) => (
      <div className="max-w-md truncate">{row.getValue("descricao")}</div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return (
        <Badge
          variant={status === "ATIVO" ? "default" : "secondary"}
          className="px-2"
        >
          {status}
        </Badge>
      )
    },
  },
  {
    accessorKey: "qntdEstoque",
    header: () => <div className="text-right">Estoque</div>,
    cell: ({ row }) => {
      const produto = row.original
      return <StockCell produto={produto} onRefresh={onRefresh} />
    },
  },
  {
    accessorKey: "precoCusto",
    header: () => <div className="text-right">Preço Custo</div>,
    cell: ({ row }) => {
      const value = parseFloat(row.getValue("precoCusto"))
      const formatted = new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(value)

      return <div className="text-right font-medium">{formatted}</div>
    },
  },
  {
    accessorKey: "precoVenda",
    header: () => <div className="text-right">Preço Venda</div>,
    cell: ({ row }) => {
      const value = parseFloat(row.getValue("precoVenda"))
      const formatted = new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(value)

      return <div className="text-right font-medium">{formatted}</div>
    },
  },
  {
    accessorKey: "Margem",
    header: () => <div className="text-right">Margem</div>,
    cell: ({ row }) => {
      const value = parseFloat(row.getValue("precoVenda")) / parseFloat(row.getValue("precoCusto")) - 1
      const formatted = new Intl.NumberFormat("pt-BR", {
        style: "percent"
      }).format(value)

      return <div className="text-right font-medium">{formatted}</div>
    },
  },
  {
    id: "acoes",
    header: () => <div className="text-center">Ações</div>,
    cell: ({ row }) => {
      const produto = row.original
      return <ProductActions produto={produto} onRefresh={onRefresh} />
    },
  },
]

interface ProductActionsProps {
  produto: Produto
  onRefresh: () => void
}

function ProductActions({ produto, onRefresh }: ProductActionsProps) {
  const [isToggling, setIsToggling] = React.useState(false)

  const handleToggleStatus = async () => {
    setIsToggling(true)
    try {
      await api.post(`/produtos/status/${produto.id}`)
      toast.success(
        `Produto ${produto.status === "ATIVO" ? "inativado" : "ativado"} com sucesso!`
      )
      onRefresh()
    } catch (err) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosError = err as {
          response?: { status?: number; data?: { message?: string } }
        }
        if (axiosError.response?.status === 401) {
          toast.error("Sessão expirada. Faça login novamente.")
        } else {
          toast.error("Erro ao alterar status do produto")
        }
      } else {
        toast.error("Erro ao alterar status do produto")
      }
    } finally {
      setIsToggling(false)
    }
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleToggleStatus}
        disabled={isToggling}
        title={produto.status === "ATIVO" ? "Inativar produto" : "Ativar produto"}
      >
        {produto.status === "ATIVO" ? (
          <IconToggleRight className="size-4 text-green-600" />
        ) : (
          <IconToggleLeft className="size-4 text-gray-400" />
        )}
        <span className="sr-only">
          {produto.status === "ATIVO" ? "Inativar" : "Ativar"} produto
        </span>
      </Button>
      <Button asChild variant="ghost" size="sm">
        <Link href={`/produtos/cadastrar?id=${produto.id}`}>
          <IconPencil className="size-4" />
          <span className="sr-only">Editar produto</span>
        </Link>
      </Button>
    </div>
  )
}

interface ProductsDataTableProps {
  data: Produto[]
  currentPage: number
  totalPages: number
  totalElements: number
  isLoading: boolean
  onPageChange: (page: number) => void
  onRefresh: () => void
  onSearch: (term: string) => void
  searchTerm: string
  pageSize: number
  onPageSizeChange: (size: number) => void
}

export function ProductsDataTable({
  data,
  currentPage,
  totalPages,
  totalElements,
  isLoading,
  onPageChange,
  onRefresh,
  onSearch,
  searchTerm,
  pageSize,
  onPageSizeChange,
}: ProductsDataTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "id", desc: false }
  ])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [localSearchTerm, setLocalSearchTerm] = React.useState(searchTerm)

  // Debounce para a busca
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearchTerm !== searchTerm) {
        onSearch(localSearchTerm)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [localSearchTerm])

  // Sincronizar com searchTerm externo
  React.useEffect(() => {
    setLocalSearchTerm(searchTerm)
  }, [searchTerm])

  const columns = React.useMemo(() => createColumns(onRefresh), [onRefresh])

  const handleExportToExcel = () => {
    const dataToExport = data.map(produto => ({
      SKU: produto.id,
      Nome: produto.nome,
      Descrição: produto.descricao,
      "Quantidade em Estoque": produto.qntdEstoque,
      "Preço de Custo": produto.precoCusto,
      "Preço de Venda": produto.precoVenda,
      Status: produto.status,
    }))

    const success = exportToExcel(dataToExport, "produtos", "Produtos")
    if (success) {
      toast.success("Dados exportados com sucesso!")
    } else {
      toast.error("Erro ao exportar dados")
    }
  }

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    manualPagination: true,
    manualFiltering: true,
    pageCount: totalPages,
    state: {
      sorting,
      columnVisibility,
      pagination: {
        pageIndex: currentPage,
        pageSize: pageSize,
      },
    },
  })

  return (
    <div className="w-full space-y-4 px-4 lg:px-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Buscar produto por nome..."
              value={localSearchTerm}
              onChange={(event) => setLocalSearchTerm(event.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleExportToExcel}
            disabled={isLoading || data.length === 0}
          >
            <IconDownload className="mr-2 size-4" />
            Exportar
          </Button>
          <Button asChild size="sm">
            <Link href="/produtos/cadastrar">
              <IconPlus className="mr-2 size-4" />
              Novo Produto
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <IconLayoutColumns className="mr-2 size-4" />
                Colunas
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Carregando...
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Nenhum produto encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">Mostrar</p>
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => onPageSizeChange(Number(value))}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue>{pageSize}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="text-sm text-muted-foreground">
            {totalElements > 0 ? (
              <>
                Mostrando {currentPage * pageSize + 1} a{" "}
                {Math.min((currentPage + 1) * pageSize, totalElements)} de{" "}
                {totalElements} produtos
              </>
            ) : (
              "Nenhum produto encontrado"
            )}
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">Página</p>
            <Select
              value={currentPage.toString()}
              onValueChange={(value) => onPageChange(Number(value))}
            >
              <SelectTrigger className="h-8 w-16">
                <SelectValue>{currentPage + 1}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: totalPages }, (_, i) => (
                  <SelectItem key={i} value={i.toString()}>
                    {i + 1}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm font-medium">de {totalPages}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => onPageChange(0)}
              disabled={currentPage === 0}
            >
              <IconChevronsLeft className="size-4" />
              <span className="sr-only">Primeira página</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 0}
            >
              <IconChevronLeft className="size-4" />
              <span className="sr-only">Página anterior</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages - 1}
            >
              <IconChevronRight className="size-4" />
              <span className="sr-only">Próxima página</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => onPageChange(totalPages - 1)}
              disabled={currentPage >= totalPages - 1}
            >
              <IconChevronsRight className="size-4" />
              <span className="sr-only">Última página</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
