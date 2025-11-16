"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/useAuth"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { toast } from "sonner"
import { IconArrowLeft, IconLoader2, IconPlus, IconPrinter } from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"
import {
  PedidoInfoForm,
  PedidoResumoCard,
  PedidoItensTable,
  ProdutoSelectorDialog,
  generatePedidoPrintDocument,
} from "@/components/pedidos"
import type { PedidoItem, PedidoFormData, Produto, Pessoa } from "@/components/pedidos"

function CadastrarPedidoContent() {
  const { isAuthenticated, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const pedidoId = searchParams.get("id")
  const isEditing = !!pedidoId

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingPedido, setIsLoadingPedido] = useState(false)
  const [pedidoStatus, setPedidoStatus] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [produtos, setProdutos] = useState<Produto[]>([])
  const [pessoas, setPessoas] = useState<Pessoa[]>([])
  const [funcionarioNome, setFuncionarioNome] = useState<string>("")

  const [formData, setFormData] = useState<PedidoFormData>({
    tipo: "VENDA",
    vencimento: "",
    formaPagamento: "",
    idPessoa: "",
    idFuncionario: "",
    itens: [],
  })

  const [showProdutoDialog, setShowProdutoDialog] = useState(false)

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/")
    }
  }, [loading, isAuthenticated, router])

  const fetchFuncionarioNome = async (id: number) => {
    try {
      const response = await api.get(`/funcionarios/${id}`)
      setFuncionarioNome(response.data.nome || `Funcionário ${id}`)
    } catch {
      setFuncionarioNome(`Funcionário ${id}`)
    }
  }

  // Carregar dados auxiliares
  useEffect(() => {
    if (isAuthenticated) {
      fetchProdutos()
      fetchPessoas()
      
      // Buscar funcionário do localStorage
      const funcionarioId = localStorage.getItem("funcionarioId")
      if (funcionarioId && !isEditing) {
        setFormData((prev) => ({
          ...prev,
          idFuncionario: funcionarioId,
        }))
        fetchFuncionarioNome(Number(funcionarioId))
      }
    }
  }, [isAuthenticated, isEditing])

  // Buscar dados do pedido quando estiver visualizando/editando
  useEffect(() => {
    if (isAuthenticated && pedidoId) {
      fetchPedido()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, pedidoId])

  const fetchProdutos = async () => {
    try {
      const response = await api.get("/produtos?page=0&size=1000")
      setProdutos(response.data.content)
    } catch {
      toast.error("Erro ao carregar produtos")
    }
  }

  const fetchPessoas = async () => {
    try {
      // Buscar clientes e fornecedores
      const [clientesResponse, fornecedoresResponse] = await Promise.all([
        api.get("/clientes?page=0&size=1000"),
        api.get("/fornecedores?page=0&size=1000"),
      ])
      
      // Combinar clientes e fornecedores com a propriedade 'tipo'
      const clientes = clientesResponse.data.content.map((c: { id: number; nome: string }) => ({
        id: c.id,
        nome: c.nome,
        tipo: "CLIENTE"
      }))
      
      const fornecedores = fornecedoresResponse.data.content.map((f: { id: number; nome: string }) => ({
        id: f.id,
        nome: f.nome,
        tipo: "FORNECEDOR"
      }))
      
      setPessoas([...clientes, ...fornecedores])
    } catch {
      toast.error("Erro ao carregar clientes e fornecedores")
    }
  }

  const fetchPedido = async () => {
    setIsLoadingPedido(true)
    try {
      const response = await api.get(`/pedidos/${pedidoId}`)
      const pedido = response.data

      setPedidoStatus(pedido.status)

      // Carregar nomes dos produtos nos itens
      const itensComNomes = await Promise.all(
        pedido.itens.map(async (item: { produtoId: number; qntd: number; precoVendaUN: number; precoCustoUN?: number }) => {
          try {
            const produtoResponse = await api.get(`/produtos/${item.produtoId}`)
            return {
              produtoId: item.produtoId,
              qntd: item.qntd,
              precoVendaUN: item.precoVendaUN,
              precoCustoUN: item.precoCustoUN || produtoResponse.data.precoCusto,
              produtoNome: produtoResponse.data.nome,
            }
          } catch {
            return {
              produtoId: item.produtoId,
              qntd: item.qntd,
              precoVendaUN: item.precoVendaUN,
              precoCustoUN: item.precoCustoUN,
              produtoNome: `Produto ${item.produtoId}`,
            }
          }
        })
      )

      setFormData({
        tipo: pedido.tipo,
        vencimento: pedido.vencimento
          ? new Date(pedido.vencimento).toISOString().slice(0, 16)
          : "",
        formaPagamento: pedido.formaPagamento,
        idPessoa: pedido.idPessoa,
        idFuncionario: pedido.idFuncionario,
        itens: itensComNomes,
      })
      
      // Buscar nome do funcionário
      fetchFuncionarioNome(pedido.idFuncionario)
    } catch (err) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosError = err as {
          response?: { status?: number }
        }
        if (axiosError.response?.status === 404) {
          toast.error("Pedido não encontrado")
          router.push("/pedidos")
        } else {
          toast.error("Erro ao carregar pedido")
        }
      }
    } finally {
      setIsLoadingPedido(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    // Validações
    const newErrors: Record<string, string> = {}

    if (!formData.tipo) newErrors.tipo = "Tipo é obrigatório"
    if (!formData.formaPagamento) newErrors.formaPagamento = "Forma de pagamento é obrigatória"
    if (!formData.idPessoa) newErrors.idPessoa = "Cliente/Fornecedor é obrigatório"
    if (!formData.idFuncionario) newErrors.idFuncionario = "Funcionário é obrigatório"
    if (formData.itens.length === 0) newErrors.itens = "Adicione pelo menos um item ao pedido"

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsSubmitting(true)

    try {
      const payload = {
        ...formData,
        idPessoa: Number(formData.idPessoa),
        idFuncionario: Number(formData.idFuncionario),
        vencimento: formData.vencimento ? new Date(formData.vencimento).toISOString() : null,
        itens: formData.itens.map(item => ({
          produtoId: item.produtoId,
          qntd: item.qntd,
          precoVendaUN: item.precoVendaUN,
        })),
      }

      if (isEditing && pedidoStatus === "ORCAMENTO") {
        // Atualizar pedido existente (somente se for orçamento)
        await api.put(`/pedidos/${pedidoId}`, payload)
        toast.success("Pedido atualizado com sucesso!")
      } else if (!isEditing) {
        // Criar novo pedido
        await api.post("/pedidos", payload)
        toast.success("Pedido cadastrado com sucesso!")
      }
      router.push("/pedidos")
    } catch (err) {
      console.error("Erro ao salvar pedido:", err)
      
      if (err && typeof err === "object" && "response" in err) {
        const axiosError = err as {
          response?: { 
            status?: number
            data?: unknown
          }
        }
        
        // Extrair mensagem de erro do response
        let errorMessage = "Erro ao salvar pedido"
        
        if (axiosError.response?.data) {
          const errorData = axiosError.response.data
          
          // Se for string, usar diretamente
          if (typeof errorData === "string") {
            errorMessage = errorData
          }
          // Se for objeto com message
          else if (typeof errorData === "object" && errorData !== null && "message" in errorData) {
            const dataObj = errorData as { message?: string; localizedMessage?: string }
            if (typeof dataObj.message === "string") {
              errorMessage = dataObj.message
            } else if (typeof dataObj.localizedMessage === "string") {
              errorMessage = dataObj.localizedMessage
            }
          }
        }
        
        toast.error(errorMessage)
      } else {
        toast.error("Erro ao salvar pedido")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenProdutoDialog = () => {
    setShowProdutoDialog(true)
  }

  const handleConfirmAddProduto = (produto: Produto, quantidade: number, preco: number) => {
    const item: PedidoItem = {
      produtoId: produto.id,
      qntd: quantidade,
      precoVendaUN: preco,
      precoCustoUN: produto.precoCusto,
      produtoNome: produto.nome,
    }

    setFormData((prev) => ({
      ...prev,
      itens: [...prev.itens, item],
    }))

    setShowProdutoDialog(false)
    toast.success("Produto adicionado!")

    if (errors.itens) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors.itens
        return newErrors
      })
    }
  }

  const handleRemoveItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      itens: prev.itens.filter((_, i) => i !== index),
    }))
  }

  const calcularTotal = () => {
    return formData.itens.reduce(
      (total, item) => total + item.qntd * item.precoVendaUN,
      0
    )
  }

  const canEdit = !isEditing || pedidoStatus === "ORCAMENTO"

  const handlePrint = () => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) {
      toast.error("Por favor, habilite pop-ups para imprimir")
      return
    }

    const pessoaNome = pessoas.find(p => p.id === Number(formData.idPessoa))?.nome || `Pessoa ${formData.idPessoa}`

    const html = generatePedidoPrintDocument({
      pedidoId,
      formData,
      pedidoStatus,
      pessoaNome,
      funcionarioNome,
    })

    printWindow.document.write(html)
    printWindow.document.close()
  }

  if (loading || !isAuthenticated || isLoadingPedido) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <IconLoader2 className="size-8 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/pedidos")}
              className="mb-4"
            >
              <IconArrowLeft className="mr-2 size-4" />
              Voltar
            </Button>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight">
                  {isEditing ? `Pedido #${pedidoId}` : "Novo Pedido"}
                </h1>
                {pedidoStatus && (
                  <Badge
                    className={
                      pedidoStatus === "ORCAMENTO"
                        ? "bg-yellow-500/10 text-yellow-700"
                        : pedidoStatus === "FATURADO"
                        ? "bg-green-500/10 text-green-700"
                        : pedidoStatus === "NOTA_CANCELADA"
                        ? "bg-orange-500/10 text-orange-700"
                        : "bg-red-500/10 text-red-700"
                    }
                  >
                    {pedidoStatus === "NOTA_CANCELADA" ? "NOTA CANCELADA" : pedidoStatus}
                  </Badge>
                )}
              </div>
              {isEditing && formData.itens.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrint}
                >
                  <IconPrinter className="mr-2 size-4" />
                  Imprimir
                </Button>
              )}
            </div>
            {!canEdit && (
              <p className="text-muted-foreground mt-2">
                Este pedido não pode ser editado pois já foi{" "}
                {pedidoStatus === "NOTA_CANCELADA" 
                  ? "cancelado (nota cancelada)" 
                  : pedidoStatus?.toLowerCase()}.
              </p>
            )}
          </div>

          <div className="px-4 lg:px-6">
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Formulário Principal */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Informações do Pedido</CardTitle>
                    <CardDescription>
                      Preencha os dados do pedido
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <PedidoInfoForm
                      formData={formData}
                      pessoas={pessoas}
                      funcionarioNome={funcionarioNome}
                      errors={errors}
                      canEdit={canEdit}
                      hasItems={formData.itens.length > 0}
                      onFormChange={(data) => setFormData((prev) => ({ ...prev, ...data }))}
                    />
                  </CardContent>
                </Card>

                {/* Card de Resumo */}
                <PedidoResumoCard
                  itemsCount={formData.itens.length}
                  total={calcularTotal()}
                  canEdit={canEdit}
                  isEditing={isEditing}
                  isSubmitting={isSubmitting}
                  onSubmit={() => {
                    const form = document.querySelector('form') as HTMLFormElement
                    if (form) form.requestSubmit()
                  }}
                  onCancel={() => router.push("/pedidos")}
                />
              </div>

              {/* Itens do Pedido */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Itens do Pedido</CardTitle>
                  <CardDescription>
                    Adicione produtos ao pedido
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {canEdit && (
                    <div className="mb-6">
                      <Button
                        type="button"
                        onClick={handleOpenProdutoDialog}
                        className="w-full"
                      >
                        <IconPlus className="mr-2 size-4" />
                        Adicionar Produto
                      </Button>
                    </div>
                  )}

                  {errors.itens && (
                    <div className="mb-4 text-sm text-destructive">
                      {errors.itens}
                    </div>
                  )}

                  <PedidoItensTable
                    items={formData.itens}
                    tipo={formData.tipo}
                    canEdit={canEdit}
                    onRemoveItem={handleRemoveItem}
                  />
                </CardContent>
              </Card>
            </form>

            {/* Dialog de Seleção de Produto */}
            <ProdutoSelectorDialog
              open={showProdutoDialog}
              onOpenChange={setShowProdutoDialog}
              produtos={produtos}
              tipo={formData.tipo}
              onConfirm={handleConfirmAddProduto}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CadastrarPedidoPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <IconLoader2 className="size-8 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        </div>
      }
    >
      <CadastrarPedidoContent />
    </Suspense>
  )
}
