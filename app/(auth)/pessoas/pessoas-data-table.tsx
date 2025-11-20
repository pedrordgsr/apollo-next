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
  IconSearch,
} from "@tabler/icons-react"
import { toast } from "sonner"
import { exportToExcel } from "@/lib/exportToExcel"

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

interface Pessoa {
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
}

const createColumns = (): ColumnDef<Pessoa>[] => [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => (
      <div className="w-16 font-medium">{row.getValue("id")}</div>
    ),
    filterFn: (row, id, value) => {
      const pessoaId = row.getValue(id)?.toString() || ""
      return pessoaId.startsWith(value)
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
    accessorKey: "categoria",
    header: "Categoria",
    cell: ({ row }) => {
      const categoria = row.getValue("categoria") as string
      const categoriaFormatada = categoria ? 
        categoria.charAt(0).toUpperCase() + categoria.slice(1).toLowerCase() : 
        "-"
      return (
        <Badge variant="outline" className="px-2">
          {categoriaFormatada}
        </Badge>
      )
    },
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
]

interface PessoasDataTableProps {
  data: Pessoa[]
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

export function PessoasDataTable({
  data,
  currentPage,
  totalPages,
  totalElements,
  isLoading,
  onPageChange,
  onSearch,
  searchTerm,
  pageSize,
  onPageSizeChange,
}: PessoasDataTableProps) {
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

  const columns = React.useMemo(() => createColumns(), [])

  const handleExportToExcel = () => {
    const dataToExport = data.map(pessoa => ({
      ID: pessoa.id,
      Nome: pessoa.nome,
      "Tipo Pessoa": pessoa.tipoPessoa,
      "CPF/CNPJ": pessoa.cpfCnpj,
      IE: pessoa.ie || "-",
      Email: pessoa.email,
      Telefone: pessoa.telefone,
      Endereço: pessoa.endereco,
      Bairro: pessoa.bairro,
      Cidade: pessoa.cidade,
      UF: pessoa.uf,
      CEP: pessoa.cep,
      Categoria: pessoa.categoria,
      Status: pessoa.status,
      "Data de Cadastro": pessoa.dataCadastro,
    }))

    const success = exportToExcel(dataToExport, "pessoas", "Pessoas")
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
              placeholder="Buscar pessoa por nome..."
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
                  Nenhuma pessoa encontrada.
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
                {totalElements} pessoas
              </>
            ) : (
              "Nenhuma pessoa encontrada"
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
