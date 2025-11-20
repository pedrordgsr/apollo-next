"use client"

import { useState, useEffect } from "react"
import { ClientesDataTable } from "./clientes-data-table"
import { api } from "@/lib/api"

interface Cliente {
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
  genero: string
}

interface PaginatedResponse {
  content: Cliente[]
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

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchClientes(page, searchTerm, pageSize)
  }, [page, searchTerm, pageSize])

  const fetchClientes = async (pageNumber: number, search: string = "", size: number = 10) => {
    setIsLoading(true)
    setError(null)
    try {
      let response: { data: PaginatedResponse };
      
      if (search) {
        // Usar endpoint de busca - buscar mais resultados para filtrar por categoria
        response = await api.get<PaginatedResponse>(
          `/pessoas/buscar?name=${encodeURIComponent(search)}&page=${pageNumber}&size=50`
        )
        
        // Filtrar apenas clientes
        const clientesData = response.data.content.filter((p: Cliente) => p.categoria === "CLIENTE")
        
        // Calcular paginação local
        const start = 0 // Sempre mostrar do início pois já estamos na página correta do backend
        const end = Math.min(size, clientesData.length)
        
        setClientes(clientesData.slice(start, end))
        setTotalElements(clientesData.length)
        setTotalPages(Math.ceil(clientesData.length / size))
      } else {
        // Usar endpoint direto de clientes
        response = await api.get<PaginatedResponse>(
          `/clientes?page=${pageNumber}&size=${size}`
        )
        
        setClientes(response.data.content)
        setTotalElements(response.data.totalElements)
        setTotalPages(response.data.totalPages)
      }
    } catch (err) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { status?: number; data?: { message?: string } } }
        if (axiosError.response?.status === 401) {
          setError("Sessão expirada. Faça login novamente.")
        } else {
          setError(axiosError.response?.data?.message || "Erro ao carregar clientes")
        }
      } else {
        setError("Erro ao carregar clientes")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = () => {
    fetchClientes(page, searchTerm, pageSize)
  }

  const handleSearch = (term: string) => {
    setSearchTerm(term)
    setPage(0) // Voltar para primeira página ao buscar
  }

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize)
    setPage(0) // Voltar para primeira página ao mudar tamanho
  }

  return (
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
                <p className="text-muted-foreground mt-2">
                  Gerencie o cadastro de clientes
                </p>
              </div>
              
              {error && (
                <div className="mx-4 lg:mx-6 rounded-lg bg-destructive/15 p-4 text-destructive">
                  {error}
                </div>
              )}

              <ClientesDataTable
                data={clientes}
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
