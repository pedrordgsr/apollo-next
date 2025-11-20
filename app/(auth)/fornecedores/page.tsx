"use client"

import { useState, useEffect } from "react"
import { FornecedoresDataTable } from "./fornecedores-data-table"
import { api } from "@/lib/api"

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

interface PaginatedResponse {
  content: Fornecedor[]
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

export default function FornecedoresPage() {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchFornecedores(page, searchTerm)
  }, [page, searchTerm])

  const fetchFornecedores = async (pageNumber: number, search: string = "") => {
    setIsLoading(true)
    setError(null)
    try {
      let response: { data: PaginatedResponse };
      
      if (search) {
        // Usar endpoint de busca - buscar mais resultados para filtrar por categoria
        response = await api.get<PaginatedResponse>(
          `/pessoas/buscar?name=${encodeURIComponent(search)}&page=${pageNumber}&size=50`
        )
        
        // Filtrar apenas fornecedores
        const fornecedoresData = response.data.content.filter((p: Fornecedor) => p.categoria === "FORNECEDOR")
        
        // Calcular paginação local
        const pageSize = 10
        const start = 0
        const end = Math.min(pageSize, fornecedoresData.length)
        
        setFornecedores(fornecedoresData.slice(start, end))
        setTotalElements(fornecedoresData.length)
        setTotalPages(Math.ceil(fornecedoresData.length / pageSize))
      } else {
        // Usar endpoint direto de fornecedores
        response = await api.get<PaginatedResponse>(
          `/fornecedores?page=${pageNumber}&size=10`
        )
        
        setFornecedores(response.data.content)
        setTotalElements(response.data.totalElements)
        setTotalPages(response.data.totalPages)
      }
    } catch (err) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { status?: number; data?: { message?: string } } }
        if (axiosError.response?.status === 401) {
          setError("Sessão expirada. Faça login novamente.")
        } else {
          setError(axiosError.response?.data?.message || "Erro ao carregar fornecedores")
        }
      } else {
        setError("Erro ao carregar fornecedores")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = () => {
    fetchFornecedores(page, searchTerm)
  }

  const handleSearch = (term: string) => {
    setSearchTerm(term)
    setPage(0)
  }

  return (
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <h1 className="text-3xl font-bold tracking-tight">Fornecedores</h1>
                <p className="text-muted-foreground mt-2">
                  Gerencie o cadastro de fornecedores
                </p>
              </div>
              
              {error && (
                <div className="mx-4 lg:mx-6 rounded-lg bg-destructive/15 p-4 text-destructive">
                  {error}
                </div>
              )}

              <FornecedoresDataTable
                data={fornecedores}
                currentPage={page}
                totalPages={totalPages}
                totalElements={totalElements}
                isLoading={isLoading}
                onPageChange={setPage}
                onRefresh={handleRefresh}
                onSearch={handleSearch}
                searchTerm={searchTerm}
              />
            </div>
          </div>
        </div>
  )
}
