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
  IconCheck,
  IconX,
  IconEye,
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

interface PedidoProduto {
  produtoId: number
  pedidoId: number
  precoVendaUN: number
  precoCustoUN: number
  qntd: number
}

interface Pedido {
  idPedido: number
  status: "ORCAMENTO" | "FATURADO" | "CANCELADO"
  tipo: "COMPRA" | "VENDA" | "DEVOLUCAO"
  dataEmissao: string
  vencimento: string | null
  totalCusto: number
  totalVenda: number
  formaPagamento: string
  idPessoa: number
  idFuncionario: number
  itens: PedidoProduto[]
  pessoaNome?: string
  funcionarioNome?: string
}

interface PedidoActionsProps {
  pedido: Pedido
  onRefresh: () => void
}

function PedidoActions({ pedido, onRefresh }: PedidoActionsProps) {
  const [showFaturarDialog, setShowFaturarDialog] = React.useState(false)
  const [showCancelarDialog, setShowCancelarDialog] = React.useState(false)
  const [isProcessing, setIsProcessing] = React.useState(false)

  const handleFaturar = async () => {
    setIsProcessing(true)
    try {
      await api.post(`/pedidos/invoice?pedidoId=${pedido.idPedido}`)
      toast.success("Pedido faturado com sucesso!")
      setShowFaturarDialog(false)
      onRefresh()
    } catch (err) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosError = err as {
          response?: { status?: number; data?: string }
        }
        if (axiosError.response?.status === 401) {
          toast.error("Sessão expirada. Faça login novamente.")
        } else {
          toast.error(axiosError.response?.data || "Erro ao faturar pedido")
        }
      } else {
        toast.error("Erro ao faturar pedido")
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCancelar = async () => {
    setIsProcessing(true)
    try {
      await api.post(`/pedidos/cancel?pedidoId=${pedido.idPedido}`)
      toast.success("Pedido cancelado com sucesso!")
      setShowCancelarDialog(false)
      onRefresh()
    } catch (err) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosError = err as {
          response?: { status?: number; data?: string }
        }
        if (axiosError.response?.status === 401) {
          toast.error("Sessão expirada. Faça login novamente.")
        } else {
          toast.error(axiosError.response?.data || "Erro ao cancelar pedido")
        }
      } else {
        toast.error("Erro ao cancelar pedido")
      }
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <>
      <div className="flex items-center justify-end gap-1">
        <Button asChild variant="ghost" size="sm" title="Ver detalhes">
          <Link href={`/pedidos/cadastrar?id=${pedido.idPedido}`}>
            <IconEye className="size-4" />
            <span className="sr-only">Ver detalhes</span>
          </Link>
        </Button>

        {pedido.status === "ORCAMENTO" && (
          <>
            <Button asChild variant="ghost" size="sm" title="Editar pedido">
              <Link href={`/pedidos/cadastrar?id=${pedido.idPedido}`}>
                <IconPencil className="size-4" />
                <span className="sr-only">Editar pedido</span>
              </Link>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFaturarDialog(true)}
              title="Faturar pedido"
            >
              <IconCheck className="size-4 text-green-600" />
              <span className="sr-only">Faturar pedido</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCancelarDialog(true)}
              title="Cancelar pedido"
            >
              <IconX className="size-4 text-red-600" />
              <span className="sr-only">Cancelar pedido</span>
            </Button>
          </>
        )}
      </div>

      {/* Dialog Faturar */}
      <AlertDialog open={showFaturarDialog} onOpenChange={setShowFaturarDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Faturar Pedido</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja realmente faturar o pedido #{pedido.idPedido}?
              <br />
              <br />
              Esta ação confirmará o pedido e o tornará oficial. Após faturar, o
              pedido não poderá mais ser editado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleFaturar} disabled={isProcessing}>
              {isProcessing ? "Faturando..." : "Faturar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog Cancelar */}
      <AlertDialog open={showCancelarDialog} onOpenChange={setShowCancelarDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Pedido</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja realmente cancelar o pedido #{pedido.idPedido}?
              <br />
              <br />
              Esta ação não poderá ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>
              Não
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelar}
              disabled={isProcessing}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isProcessing ? "Cancelando..." : "Sim, Cancelar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

const createColumns = (onRefresh: () => void): ColumnDef<Pedido>[] => [
  {
    accessorKey: "idPedido",
    header: "ID",
    cell: ({ row }) => (
      <div className="w-16 font-medium">{row.getValue("idPedido")}</div>
    ),
  },
  {
    accessorKey: "tipo",
    header: "Tipo",
    cell: ({ row }) => {
      const tipo = row.getValue("tipo") as string
      const tipoColors = {
        COMPRA: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
        VENDA: "bg-green-500/10 text-green-700 dark:text-green-400",
        DEVOLUCAO: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
      }
      return (
        <Badge className={tipoColors[tipo as keyof typeof tipoColors]}>
          {tipo}
        </Badge>
      )
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      const statusColors = {
        ORCAMENTO: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
        FATURADO: "bg-green-500/10 text-green-700 dark:text-green-400",
        CANCELADO: "bg-red-500/10 text-red-700 dark:text-red-400",
      }
      return (
        <Badge className={statusColors[status as keyof typeof statusColors]}>
          {status}
        </Badge>
      )
    },
  },
  {
    accessorKey: "pessoaNome",
    header: "Cliente/Fornecedor",
    cell: ({ row }) => (
      <div className="max-w-[200px] truncate font-medium">
        {row.getValue("pessoaNome")}
      </div>
    ),
  },
  {
    accessorKey: "funcionarioNome",
    header: "Funcionário",
    cell: ({ row }) => (
      <div className="max-w-[150px] truncate">
        {row.getValue("funcionarioNome")}
      </div>
    ),
  },
  {
    accessorKey: "dataEmissao",
    header: "Data Emissão",
    cell: ({ row }) => {
      const date = new Date(row.getValue("dataEmissao"))
      return (
        <div className="whitespace-nowrap">
          {date.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })}
        </div>
      )
    },
  },
  {
    accessorKey: "totalCusto",
    header: () => <div className="text-right">Custo</div>,
    cell: ({ row }) => {
      const value = parseFloat(row.getValue("totalCusto"))
      const formatted = new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(value)

      return <div className="text-right font-medium">{formatted}</div>
    },
  },
  {
    accessorKey: "totalVenda",
    header: () => <div className="text-right">Total</div>,
    cell: ({ row }) => {
      const value = parseFloat(row.getValue("totalVenda"))
      const formatted = new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(value)

      return <div className="text-right font-medium">{formatted}</div>
    },
  },
  {
    accessorKey: "margem",
    header: () => <div className="text-right">Margem</div>,
    cell: ({ row }) => {
      const custo = parseFloat(row.getValue("totalCusto"))
      const venda = parseFloat(row.getValue("totalVenda"))
      const margem = venda > 0 ? ((venda - custo) / venda) * 100 : 0
      
      return (
        <div className={`text-right font-medium ${margem >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {margem.toFixed(2)}%
        </div>
      )
    },
  },
  {
    id: "acoes",
    header: () => <div className="text-center">Ações</div>,
    cell: ({ row }) => {
      const pedido = row.original
      return <PedidoActions pedido={pedido} onRefresh={onRefresh} />
    },
  },
]

interface PedidosDataTableProps {
  data: Pedido[]
  currentPage: number
  totalPages: number
  totalElements: number
  isLoading: boolean
  onPageChange: (page: number) => void
  onRefresh: () => void
}

export function PedidosDataTable({
  data,
  currentPage,
  totalPages,
  totalElements,
  isLoading,
  onPageChange,
  onRefresh,
}: PedidosDataTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "idPedido", desc: true },
  ])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})

  const columns = React.useMemo(() => createColumns(onRefresh), [onRefresh])

  const handleExportToExcel = () => {
    const dataToExport = data.map((pedido) => {
      const custo = pedido.totalCusto
      const venda = pedido.totalVenda
      const margem = venda > 0 ? ((venda - custo) / venda) * 100 : 0
      
      return {
        ID: pedido.idPedido,
        Tipo: pedido.tipo,
        Status: pedido.status,
        "Cliente/Fornecedor": pedido.pessoaNome || `Pessoa ${pedido.idPessoa}`,
        "Funcionário": pedido.funcionarioNome || `Funcionário ${pedido.idFuncionario}`,
        "Data Emissão": new Date(pedido.dataEmissao).toLocaleDateString("pt-BR"),
        Vencimento: pedido.vencimento
          ? new Date(pedido.vencimento).toLocaleDateString("pt-BR")
          : "—",
        "Total Custo": custo,
        "Total Venda": venda,
        "Margem (%)": margem.toFixed(2),
        "Forma Pagamento": pedido.formaPagamento,
      }
    })

    const success = exportToExcel(dataToExport, "pedidos", "Pedidos")
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
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    manualPagination: true,
    pageCount: totalPages,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      pagination: {
        pageIndex: currentPage,
        pageSize: 10,
      },
    },
  })

  return (
    <div className="w-full space-y-4 px-4 lg:px-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-[200px]">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Filtrar por ID..."
              value={(table.getColumn("idPedido")?.getFilterValue() as string) ?? ""}
              onChange={(event) =>
                table.getColumn("idPedido")?.setFilterValue(event.target.value)
              }
              className="pl-9"
            />
          </div>
          <div className="relative flex-1 max-w-[200px]">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Filtrar por cliente..."
              value={(table.getColumn("pessoaNome")?.getFilterValue() as string) ?? ""}
              onChange={(event) =>
                table.getColumn("pessoaNome")?.setFilterValue(event.target.value)
              }
              className="pl-9"
            />
          </div>
          <div className="relative flex-1 max-w-[200px]">
            <Select
              value={(table.getColumn("status")?.getFilterValue() as string) ?? "todos"}
              onValueChange={(value) =>
                table.getColumn("status")?.setFilterValue(value === "todos" ? "" : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="ORCAMENTO">Orçamento</SelectItem>
                <SelectItem value="FATURADO">Faturado</SelectItem>
                <SelectItem value="CANCELADO">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="relative flex-1 max-w-[200px]">
            <Select
              value={(table.getColumn("tipo")?.getFilterValue() as string) ?? "todos"}
              onValueChange={(value) =>
                table.getColumn("tipo")?.setFilterValue(value === "todos" ? "" : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="COMPRA">Compra</SelectItem>
                <SelectItem value="VENDA">Venda</SelectItem>
                <SelectItem value="DEVOLUCAO">Devolução</SelectItem>
              </SelectContent>
            </Select>
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
            <Link href="/pedidos/cadastrar">
              <IconPlus className="mr-2 size-4" />
              Novo Pedido
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
                  Nenhum pedido encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {totalElements > 0 ? (
            <>
              Mostrando {currentPage * 10 + 1} a{" "}
              {Math.min((currentPage + 1) * 10, totalElements)} de{" "}
              {totalElements} pedidos
            </>
          ) : (
            "Nenhum pedido encontrado"
          )}
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
