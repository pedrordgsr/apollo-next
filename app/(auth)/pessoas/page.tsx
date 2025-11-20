"use client"

import { useState, useEffect } from "react"
import { PessoasDataTable } from "./pessoas-data-table"
import { api } from "@/lib/api"

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

interface PaginatedResponse {
  content: Pessoa[]
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

export default function PessoasPage() {
  const [pessoas, setPessoas] = useState<Pessoa[]>([])
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchPessoas(page, searchTerm, pageSize)
  }, [page, searchTerm, pageSize])

  const fetchPessoas = async (pageNumber: number, search: string = "", size: number = 10) => {
    setIsLoading(true)
    setError(null)
    try {
      const endpoint = search
        ? `/pessoas/buscar?name=${encodeURIComponent(search)}&page=${pageNumber}&size=${size}`
        : `/pessoas?page=${pageNumber}&size=${size}`
      
      const response = await api.get<PaginatedResponse>(endpoint)

      setPessoas(response.data.content)
      setTotalPages(response.data.totalPages)
      setTotalElements(response.data.totalElements)
    } catch (err) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { status?: number; data?: { message?: string } } }
        if (axiosError.response?.status === 401) {
          setError("Sessão expirada. Faça login novamente.")
        } else {
          setError(axiosError.response?.data?.message || "Erro ao carregar pessoas")
        }
      } else {
        setError("Erro ao carregar pessoas")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = () => {
    fetchPessoas(page, searchTerm, pageSize)
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
                <h1 className="text-3xl font-bold tracking-tight">Pessoas</h1>
                <p className="text-muted-foreground mt-2">
                  Visualize o cadastro de pessoas
                </p>
              </div>
              
              {error && (
                <div className="mx-4 lg:mx-6 rounded-lg bg-destructive/15 p-4 text-destructive">
                  {error}
                </div>
              )}

              <PessoasDataTable
                data={pessoas}
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
