"use client"

import { useState, useEffect } from "react"
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
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchProdutos(page, searchTerm, pageSize)
  }, [page, searchTerm, pageSize])

  const fetchProdutos = async (pageNumber: number, search: string = "", size: number = 10) => {
    setIsLoading(true)
    setError(null)
    try {
      const endpoint = search
        ? `/produtos/buscar?nome=${encodeURIComponent(search)}&page=${pageNumber}&size=${size}`
        : `/produtos?page=${pageNumber}&size=${size}`
      
      const response = await api.get<PaginatedResponse>(endpoint)

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
    fetchProdutos(page, searchTerm, pageSize)
  }

  const handleSearch = (term: string) => {
    setSearchTerm(term)
    setPage(0)
  }

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize)
    setPage(0)
  }

  return (
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
                onSearch={handleSearch}
                searchTerm={searchTerm}
                pageSize={pageSize}
                onPageSizeChange={handlePageSizeChange}
              />
            </div>
          </div>
        </div>
      
  )
}
