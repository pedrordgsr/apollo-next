"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { useAuth } from "@/lib/useAuth"
import { ProductsDataTable } from "./products-data-table"
import { api } from "@/lib/api"

interface Produto {
  id: number
  status: string
  nome: string
  descricao: string
  qntdEstoque: number
  precoCusto: number
  precoVenda: number
}

interface PaginatedResponse {
  content: Produto[]
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

export default function ProdutosPage() {
  const { isAuthenticated, loading } = useAuth()
  const router = useRouter()
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/")
    }
  }, [loading, isAuthenticated, router])

  useEffect(() => {
    if (isAuthenticated) {
      fetchProdutos(page)
    }
  }, [page, isAuthenticated])

  const fetchProdutos = async (pageNumber: number) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await api.get<PaginatedResponse>(
        `/api/produtos?page=${pageNumber}&size=10`
      )

      setProdutos(response.data.content)
      setTotalPages(response.data.totalPages)
      setTotalElements(response.data.totalElements)
    } catch (err) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { status?: number; data?: { message?: string } } }
        if (axiosError.response?.status === 401) {
          setError("Sessão expirada. Faça login novamente.")
        } else {
          setError(axiosError.response?.data?.message || "Erro ao carregar produtos")
        }
      } else {
        setError("Erro ao carregar produtos")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = () => {
    fetchProdutos(page)
  }

  if (loading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Carregando...</p>
      </div>
    )
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <h1 className="text-3xl font-bold tracking-tight">Produtos</h1>
                <p className="text-muted-foreground mt-2">
                  Gerencie o catálogo de produtos
                </p>
              </div>
              
              {error && (
                <div className="mx-4 lg:mx-6 rounded-lg bg-destructive/15 p-4 text-destructive">
                  {error}
                </div>
              )}

              <ProductsDataTable
                data={produtos}
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
      </SidebarInset>
    </SidebarProvider>
  )
}
