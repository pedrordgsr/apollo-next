"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/useAuth"
import { PedidosDataTable } from "./pedidos-data-table"
import { api } from "@/lib/api"

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
  tipo: "COMPRA" | "VENDA"
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

interface PaginatedResponse {
  content: Pedido[]
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

export default function PedidosPage() {
  const { isAuthenticated, loading } = useAuth()
  const router = useRouter()
  const [pedidos, setPedidos] = useState<Pedido[]>([])
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
      fetchPedidos(page)
    }
  }, [page, isAuthenticated])

  const fetchPedidos = async (pageNumber: number) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await api.get<PaginatedResponse>(
        `/pedidos?page=${pageNumber}&size=10`
      )

      // Buscar nomes de pessoas e funcionários
      const pedidosComNomes = await Promise.all(
        response.data.content.map(async (pedido) => {
          let pessoaNome = `Pessoa ${pedido.idPessoa}`
          let funcionarioNome = `Funcionário ${pedido.idFuncionario}`

          try {
            // Tentar buscar como cliente primeiro, depois como fornecedor
            let pessoaResponse = await api.get(`/clientes/${pedido.idPessoa}`).catch(() => null)
            
            if (!pessoaResponse) {
              pessoaResponse = await api.get(`/fornecedores/${pedido.idPessoa}`).catch(() => null)
            }
            
            if (pessoaResponse?.data?.nome) {
              pessoaNome = pessoaResponse.data.nome
            }
          } catch (error) {
            console.error(`Erro ao buscar pessoa ${pedido.idPessoa}:`, error)
          }

          try {
            const funcionarioResponse = await api.get(`/funcionarios/${pedido.idFuncionario}`)
            if (funcionarioResponse.data?.nome) {
              funcionarioNome = funcionarioResponse.data.nome
            }
          } catch (error) {
            console.error(`Erro ao buscar funcionário ${pedido.idFuncionario}:`, error)
          }

          return {
            ...pedido,
            pessoaNome,
            funcionarioNome,
          }
        })
      )

      setPedidos(pedidosComNomes)
      setTotalPages(response.data.totalPages)
      setTotalElements(response.data.totalElements)
    } catch (err) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { status?: number; data?: { message?: string } } }
        if (axiosError.response?.status === 401) {
          setError("Sessão expirada. Faça login novamente.")
        } else {
          setError(axiosError.response?.data?.message || "Erro ao carregar pedidos")
        }
      } else {
        setError("Erro ao carregar pedidos")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = () => {
    fetchPedidos(page)
  }

  if (loading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Carregando...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            <h1 className="text-3xl font-bold tracking-tight">Pedidos</h1>
            <p className="text-muted-foreground mt-2">
              Gerencie pedidos de compra e venda
            </p>
          </div>
          
          {error && (
            <div className="mx-4 lg:mx-6 rounded-lg bg-destructive/15 p-4 text-destructive">
              {error}
            </div>
          )}

          <PedidosDataTable
            data={pedidos}
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
  )
}
