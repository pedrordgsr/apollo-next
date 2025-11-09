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
import { useAuth } from "@/lib/useAuth"

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

interface Usuario {
  username: string
  email: string
  idUsuario: string
  idPessoa: string
  status: string
  nome: string
  cargo: string
}

interface UsuarioActionsProps {
  usuario: Usuario
  onRefresh: () => void
}

function UsuarioActions({ usuario, onRefresh }: UsuarioActionsProps) {
  const [isToggling, setIsToggling] = React.useState(false)
  const { user } = useAuth()

  const isCurrentUser = user?.usuarioId === parseInt(usuario.idUsuario)

  const handleToggleStatus = async () => {
    // Validação: impede desativar o usuário atual
    if (isCurrentUser && usuario.status === "ATIVO") {
      toast.error("Você não pode desativar seu próprio usuário!")
      return
    }

    setIsToggling(true)
    try {
      // Determina o novo status baseado no status atual
      const novoStatus = usuario.status === "ATIVO" ? "INATIVO" : "ATIVO"
      
      // Chama a API com o método PUT e o parâmetro status na query string
      await api.put(`/usuarios/${usuario.idUsuario}/status?status=${novoStatus}`)
      
      toast.success(
        `Usuário ${usuario.status === "ATIVO" ? "inativado" : "ativado"} com sucesso!`
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
          toast.error("Erro ao alterar status do usuário")
        }
      } else {
        toast.error("Erro ao alterar status do usuário")
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
        disabled={isToggling || (isCurrentUser && usuario.status === "ATIVO")}
        title={
          isCurrentUser && usuario.status === "ATIVO"
            ? "Você não pode desativar seu próprio usuário"
            : usuario.status === "ATIVO" 
            ? "Inativar usuário" 
            : "Ativar usuário"
        }
      >
        {usuario.status === "ATIVO" ? (
          <IconToggleRight className={`size-4 ${isCurrentUser ? "text-gray-400" : "text-green-600"}`} />
        ) : (
          <IconToggleLeft className="size-4 text-gray-400" />
        )}
        <span className="sr-only">
          {usuario.status === "ATIVO" ? "Inativar" : "Ativar"} usuário
        </span>
      </Button>
      <Button asChild variant="ghost" size="sm">
        <Link href={`/usuarios/cadastrar?id=${usuario.idUsuario}`}>
          <IconPencil className="size-4" />
          <span className="sr-only">Editar usuário</span>
        </Link>
      </Button>
    </div>
  )
}

const createColumns = (onRefresh: () => void): ColumnDef<Usuario>[] => [
  {
    accessorKey: "idUsuario",
    header: "ID",
    cell: ({ row }) => (
      <div className="w-16 font-medium">{row.getValue("idUsuario")}</div>
    ),
    filterFn: (row, id, value) => {
      const usuarioId = row.getValue(id)?.toString() || ""
      return usuarioId.startsWith(value)
    },
  },
  {
    accessorKey: "username",
    header: "Nome de Usuário",
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("username")}</div>
    ),
  },
  {
    accessorKey: "nome",
    header: "Nome",
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("nome")}</div>
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
    accessorKey: "cargo",
    header: "Cargo",
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("cargo") || "-"}</div>
    ),
  },
  {
    accessorKey: "idPessoa",
    header: "ID Funcionário",
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("idPessoa")}</div>
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
    id: "acoes",
    header: () => <div className="text-center">Ações</div>,
    cell: ({ row }) => {
      const usuario = row.original
      return <UsuarioActions usuario={usuario} onRefresh={onRefresh} />
    },
  },
]

interface UsuariosDataTableProps {
  data: Usuario[]
  currentPage: number
  totalPages: number
  totalElements: number
  isLoading: boolean
  onPageChange: (page: number) => void
  onRefresh: () => void
}

export function UsuariosDataTable({
  data,
  currentPage,
  totalPages,
  totalElements,
  isLoading,
  onPageChange,
  onRefresh,
}: UsuariosDataTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "idUsuario", desc: false }
  ])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})

  const columns = React.useMemo(() => createColumns(onRefresh), [onRefresh])

  const handleExportToExcel = () => {
    const dataToExport = data.map(usuario => ({
      "ID Usuário": usuario.idUsuario,
      "Nome de Usuário": usuario.username,
      Nome: usuario.nome,
      Email: usuario.email,
      Cargo: usuario.cargo,
      "ID Funcionário": usuario.idPessoa,
      Status: usuario.status,
    }))

    const success = exportToExcel(dataToExport, "usuarios", "Usuários")
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
          <div className="relative flex-1 max-w-sm">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Filtrar por nome de usuário..."
              value={(table.getColumn("username")?.getFilterValue() as string) ?? ""}
              onChange={(event) =>
                table.getColumn("username")?.setFilterValue(event.target.value)
              }
              className="pl-9"
            />
          </div>
          <div className="relative flex-1 max-w-[200px]">
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
            <Link href="/usuarios/cadastrar">
              <IconPlus className="mr-2 size-4" />
              Novo Usuário
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
                  Nenhum usuário encontrado.
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
              {totalElements} usuários
            </>
          ) : (
            "Nenhum usuário encontrado"
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
