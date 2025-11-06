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

import { Button } from "@/components/ui/button"
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

interface Fornecedor {
  id: number
  status: string
  nome: string
  categoria: string
  tipoPessoa: string
  cpfCnpj: string
  ie: string | null
  email: string
  telefone: number
  endereco: string
  bairro: string
  cidade: string
  uf: string
  cep: number
  dataCadastro: string
  tipoFornecedor: string
}

interface FornecedorActionsProps {
  fornecedor: Fornecedor
  onRefresh: () => void
}

function FornecedorActions({ fornecedor, onRefresh }: FornecedorActionsProps) {
  const [isToggling, setIsToggling] = React.useState(false)

  const handleToggleStatus = async () => {
    setIsToggling(true)
    try {
      await api.put(`/fornecedores/status/${fornecedor.id}`)
      toast.success(
        `Fornecedor ${fornecedor.status === "ATIVO" ? "inativado" : "ativado"} com sucesso!`
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
          toast.error("Erro ao alterar status do fornecedor")
        }
      } else {
        toast.error("Erro ao alterar status do fornecedor")
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
        title={fornecedor.status === "ATIVO" ? "Inativar fornecedor" : "Ativar fornecedor"}
      >
        {fornecedor.status === "ATIVO" ? (
          <IconToggleRight className="size-4 text-green-600" />
        ) : (
          <IconToggleLeft className="size-4 text-gray-400" />
        )}
        <span className="sr-only">
          {fornecedor.status === "ATIVO" ? "Inativar" : "Ativar"} fornecedor
        </span>
      </Button>
      <Button asChild variant="ghost" size="sm">
        <Link href={`/fornecedores/cadastrar?id=${fornecedor.id}`}>
          <IconPencil className="size-4" />
          <span className="sr-only">Editar fornecedor</span>
        </Link>
      </Button>
    </div>
  )
}

const createColumns = (onRefresh: () => void): ColumnDef<Fornecedor>[] => [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => (
      <div className="w-16 font-medium">{row.getValue("id")}</div>
    ),
    filterFn: (row, id, value) => {
      const fornecedorId = row.getValue(id)?.toString() || ""
      return fornecedorId.startsWith(value)
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
    accessorKey: "tipoPessoa",
    header: "Tipo",
    cell: ({ row }) => {
      const tipo = row.getValue("tipoPessoa") as string
      return (
        <Badge variant="secondary" className="px-2">
          {tipo === "FISICA" ? "Física" : tipo === "JURIDICA" ? "Jurídica" : tipo}
        </Badge>
      )
    },
  },
  {
    accessorKey: "cpfCnpj",
    header: "CPF/CNPJ",
    cell: ({ row }) => {
      const cpfCnpj = row.getValue("cpfCnpj") as string
      const tipoPessoa = row.original.tipoPessoa
      
      if (cpfCnpj && typeof cpfCnpj === "string") {
        const cleaned = cpfCnpj.replace(/\D/g, "")
        
        // Se for pessoa física (CPF - 11 dígitos)
        if (tipoPessoa === "FISICA" && cleaned.length === 11) {
          const formatted = cleaned.replace(
            /(\d{3})(\d{3})(\d{3})(\d{2})/,
            "$1.$2.$3-$4"
          )
          return <div className="font-medium">{formatted}</div>
        }
        
        // Se for pessoa jurídica (CNPJ - 14 dígitos)
        if (tipoPessoa === "JURIDICA" && cleaned.length === 14) {
          const formatted = cleaned.replace(
            /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
            "$1.$2.$3/$4-$5"
          )
          return <div className="font-medium">{formatted}</div>
        }
        
        return <div className="font-medium">{cleaned || cpfCnpj}</div>
      }
      return <div className="font-medium">{cpfCnpj || "-"}</div>
    },
  },
  {
    accessorKey: "tipoFornecedor",
    header: "Tipo Fornecedor",
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("tipoFornecedor") || "-"}</div>
    ),
  },
  {
    accessorKey: "email",
    header: "E-mail",
    cell: ({ row }) => (
      <div className="max-w-md truncate">{row.getValue("email") || "-"}</div>
    ),
  },
  {
    accessorKey: "telefone",
    header: "Telefone",
    cell: ({ row }) => {
      const telefone = row.getValue("telefone")
      
      if (telefone) {
        const telefoneStr = telefone.toString()
        const cleaned = telefoneStr.replace(/\D/g, "")
        
        if (cleaned.length === 11) {
          const formatted = cleaned.replace(
            /(\d{2})(\d{5})(\d{4})/,
            "($1) $2-$3"
          )
          return <div className="font-medium">{formatted}</div>
        } else if (cleaned.length === 10) {
          const formatted = cleaned.replace(
            /(\d{2})(\d{4})(\d{4})/,
            "($1) $2-$3"
          )
          return <div className="font-medium">{formatted}</div>
        }
        return <div className="font-medium">{telefoneStr}</div>
      }
      return <div className="font-medium">-</div>
    },
  },
  {
    accessorKey: "cidade",
    header: "Cidade/UF",
    cell: ({ row }) => {
      const cidade = row.getValue("cidade") as string
      const uf = row.original.uf
      return (
        <div className="font-medium">
          {cidade && uf ? `${cidade}/${uf}` : cidade || uf || "-"}
        </div>
      )
    },
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
    id: "acoes",
    header: () => <div className="text-center">Ações</div>,
    cell: ({ row }) => {
      const fornecedor = row.original
      return <FornecedorActions fornecedor={fornecedor} onRefresh={onRefresh} />
    },
  },
]

interface FornecedoresDataTableProps {
  data: Fornecedor[]
  currentPage: number
  totalPages: number
  totalElements: number
  isLoading: boolean
  onPageChange: (page: number) => void
  onRefresh: () => void
}

export function FornecedoresDataTable({
  data,
  currentPage,
  totalPages,
  totalElements,
  isLoading,
  onPageChange,
  onRefresh,
}: FornecedoresDataTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "id", desc: false }
  ])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})

  const columns = React.useMemo(() => createColumns(onRefresh), [onRefresh])

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
          <div className="relative flex-1 max-w-sm">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Filtrar por nome..."
              value={(table.getColumn("nome")?.getFilterValue() as string) ?? ""}
              onChange={(event) =>
                table.getColumn("nome")?.setFilterValue(event.target.value)
              }
              className="pl-9"
            />
          </div>
          <div className="relative flex-1 max-w-[200px]">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Filtrar por CPF/CNPJ..."
              value={(table.getColumn("cpfCnpj")?.getFilterValue() as string) ?? ""}
              onChange={(event) =>
                table.getColumn("cpfCnpj")?.setFilterValue(event.target.value)
              }
              className="pl-9"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild size="sm">
            <Link href="/fornecedores/cadastrar">
              <IconPlus className="mr-2 size-4" />
              Novo Fornecedor
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
                  Nenhum fornecedor encontrado.
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
              {totalElements} fornecedores
            </>
          ) : (
            "Nenhum fornecedor encontrado"
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
