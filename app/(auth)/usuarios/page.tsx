"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/useAuth"
import { UsuariosDataTable } from "./usuarios-data-table"
import { api } from "@/lib/api"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Usuario {
  username: string
  email: string
  idUsuario: string
  idPessoa: string
  status: string
  nome: string
  cargo: string
}

interface PaginatedResponse {
  content: Usuario[]
  pageable: {
    pageNumber: number
    pageSize: number
    offset: number
  }
  last: boolean
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  numberOfElements: number
  empty: boolean
}

export default function UsuariosPage() {
  const { isAuthenticated, loading, user } = useAuth()
  const router = useRouter()
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAccessDenied, setShowAccessDenied] = useState(false)

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/")
    } else if (!loading && isAuthenticated && user && !user.isAdmin) {
      setShowAccessDenied(true)
    }
  }, [loading, isAuthenticated, user, router])

  const handleAccessDeniedClose = () => {
    setShowAccessDenied(false)
    router.push("/home")
  }

  useEffect(() => {
    if (isAuthenticated && user?.isAdmin) {
      fetchUsuarios(page)
    }
  }, [page, isAuthenticated, user])

  const fetchUsuarios = async (pageNumber: number) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await api.get<PaginatedResponse>(
        `/usuarios?page=${pageNumber}&size=10`
      )

      setUsuarios(response.data.content)
      setTotalPages(response.data.totalPages)
      setTotalElements(response.data.totalElements)
    } catch (err) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { status?: number; data?: { message?: string } } }
        if (axiosError.response?.status === 401) {
          setError("Sessão expirada. Faça login novamente.")
        } else {
          setError(axiosError.response?.data?.message || "Erro ao carregar usuários")
        }
      } else {
        setError("Erro ao carregar usuários")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = () => {
    fetchUsuarios(page)
  }

  if (loading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Carregando...</p>
      </div>
    )
  }

  return (
    <>
      <AlertDialog open={showAccessDenied} onOpenChange={setShowAccessDenied}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Acesso Negado</AlertDialogTitle>
            <AlertDialogDescription>
              Você não tem permissão para acessar esta página. Apenas administradores podem gerenciar usuários.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleAccessDeniedClose}>
              Voltar para Home
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {user?.isAdmin && (
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <h1 className="text-3xl font-bold tracking-tight">Usuários</h1>
                <p className="text-muted-foreground mt-2">
                  Gerencie o cadastro de usuários
                </p>
              </div>
              
              {error && (
                <div className="mx-4 lg:mx-6 rounded-lg bg-destructive/15 p-4 text-destructive">
                  {error}
                </div>
              )}

              <UsuariosDataTable
                data={usuarios}
                currentPage={page}
                totalPages={totalPages}
                totalElements={totalElements}
                isLoading={isLoading}
                onPageChange={setPage}
                onRefresh={handleRefresh}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
