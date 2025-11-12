"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/useAuth"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { IconArrowLeft, IconLoader2, IconPlus, IconTrash } from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"

interface PedidoItem {
  produtoId: number
  qntd: number
  precoVendaUN: number
  precoCustoUN?: number
  produtoNome?: string
}

interface PedidoFormData {
  tipo: "COMPRA" | "VENDA" | "DEVOLUCAO"
  vencimento: string
  formaPagamento: string
  idPessoa: number | string
  idFuncionario: number | string
  itens: PedidoItem[]
}

interface Produto {
  id: number
  nome: string
  precoCusto: number
  precoVenda: number
  qntdEstoque: number
}

interface Pessoa {
  id: number
  nome: string
  tipo: string
}

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
  const [searchProduto, setSearchProduto] = useState("")
  const [selectedProduto, setSelectedProduto] = useState<Produto | null>(null)
  const [quantidadeDialog, setQuantidadeDialog] = useState(1)
  const [precoDialog, setPrecoDialog] = useState(0)

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
      const response = await api.get("/api/produtos?page=0&size=1000")
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
        pedido.itens.map(async (item: { produtoId: number; qntd: number; precoVendaUN: number }) => {
          try {
            const produtoResponse = await api.get(`/api/produtos/${item.produtoId}`)
            return {
              produtoId: item.produtoId,
              qntd: item.qntd,
              precoVendaUN: item.precoVendaUN,
              produtoNome: produtoResponse.data.nome,
            }
          } catch {
            return {
              produtoId: item.produtoId,
              qntd: item.qntd,
              precoVendaUN: item.precoVendaUN,
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
    setSearchProduto("")
    setSelectedProduto(null)
    setQuantidadeDialog(1)
    setPrecoDialog(0)
  }

  const handleSelectProduto = (produto: Produto) => {
    setSelectedProduto(produto)
    setQuantidadeDialog(1)
    setPrecoDialog(produto.precoVenda)
  }

  const handleConfirmAddProduto = () => {
    if (!selectedProduto) {
      toast.error("Selecione um produto")
      return
    }

    if (quantidadeDialog <= 0) {
      toast.error("Quantidade deve ser maior que zero")
      return
    }

    if (quantidadeDialog > selectedProduto.qntdEstoque) {
      toast.error(`Estoque insuficiente! Disponível: ${selectedProduto.qntdEstoque}`)
      return
    }

    if (precoDialog <= 0) {
      toast.error("Preço deve ser maior que zero")
      return
    }

    const item: PedidoItem = {
      produtoId: selectedProduto.id,
      qntd: quantidadeDialog,
      precoVendaUN: precoDialog,
      precoCustoUN: selectedProduto.precoCusto,
      produtoNome: selectedProduto.nome,
    }

    setFormData((prev) => ({
      ...prev,
      itens: [...prev.itens, item],
    }))

    setShowProdutoDialog(false)
    setSelectedProduto(null)
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

  const produtosFiltrados = produtos.filter((produto) =>
    produto.nome.toLowerCase().includes(searchProduto.toLowerCase())
  )

  const calcularTotal = () => {
    return formData.itens.reduce(
      (total, item) => total + item.qntd * item.precoVendaUN,
      0
    )
  }

  const canEdit = !isEditing || pedidoStatus === "ORCAMENTO"

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
                      : "bg-red-500/10 text-red-700"
                  }
                >
                  {pedidoStatus}
                </Badge>
              )}
            </div>
            {!canEdit && (
              <p className="text-muted-foreground mt-2">
                Este pedido não pode ser editado pois já foi{" "}
                {pedidoStatus?.toLowerCase()}.
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
                    <FieldGroup>
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <Field data-invalid={!!errors.tipo}>
                          <FieldLabel htmlFor="tipo">Tipo *</FieldLabel>
                          <FieldContent>
                            <Select
                              value={formData.tipo}
                              onValueChange={(value: "COMPRA" | "VENDA" | "DEVOLUCAO") =>
                                setFormData((prev) => ({ ...prev, tipo: value }))
                              }
                              disabled={!canEdit}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="VENDA">Venda</SelectItem>
                                <SelectItem value="COMPRA">Compra</SelectItem>
                                <SelectItem value="DEVOLUCAO">Devolução</SelectItem>
                              </SelectContent>
                            </Select>
                            {errors.tipo && <FieldError>{errors.tipo}</FieldError>}
                          </FieldContent>
                        </Field>

                        <Field data-invalid={!!errors.vencimento}>
                          <FieldLabel htmlFor="vencimento">Vencimento</FieldLabel>
                          <FieldContent>
                            <Input
                              id="vencimento"
                              type="datetime-local"
                              value={formData.vencimento}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  vencimento: e.target.value,
                                }))
                              }
                              disabled={!canEdit}
                            />
                          </FieldContent>
                        </Field>
                      </div>

                      <Field data-invalid={!!errors.formaPagamento}>
                        <FieldLabel htmlFor="formaPagamento">
                          Forma de Pagamento *
                        </FieldLabel>
                        <FieldContent>
                          <Input
                            id="formaPagamento"
                            value={formData.formaPagamento}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                formaPagamento: e.target.value,
                              }))
                            }
                            placeholder="Ex: Dinheiro, Cartão de Crédito, PIX"
                            disabled={!canEdit}
                          />
                          {errors.formaPagamento && (
                            <FieldError>{errors.formaPagamento}</FieldError>
                          )}
                        </FieldContent>
                      </Field>

                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <Field data-invalid={!!errors.idPessoa}>
                          <FieldLabel htmlFor="idPessoa">
                            {formData.tipo === "COMPRA"
                              ? "Fornecedor *"
                              : "Cliente *"}
                          </FieldLabel>
                          <FieldContent>
                            <Select
                              value={formData.idPessoa.toString()}
                              onValueChange={(value) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  idPessoa: value,
                                }))
                              }
                              disabled={!canEdit}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione..." />
                              </SelectTrigger>
                              <SelectContent>
                                {pessoas
                                  .filter((p) =>
                                    formData.tipo === "COMPRA"
                                      ? p.tipo === "FORNECEDOR"
                                      : p.tipo === "CLIENTE"
                                  )
                                  .map((pessoa) => (
                                    <SelectItem
                                      key={pessoa.id}
                                      value={pessoa.id.toString()}
                                    >
                                      {pessoa.nome}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                            {errors.idPessoa && (
                              <FieldError>{errors.idPessoa}</FieldError>
                            )}
                          </FieldContent>
                        </Field>

                        <Field data-invalid={!!errors.idFuncionario}>
                          <FieldLabel htmlFor="idFuncionario">
                            Funcionário *
                          </FieldLabel>
                          <FieldContent>
                            <Input
                              id="idFuncionario"
                              value={funcionarioNome}
                              disabled
                              placeholder="Carregando..."
                            />
                            {errors.idFuncionario && (
                              <FieldError>{errors.idFuncionario}</FieldError>
                            )}
                          </FieldContent>
                        </Field>
                      </div>
                    </FieldGroup>
                  </CardContent>
                </Card>

                {/* Card de Resumo */}
                <Card>
                  <CardHeader>
                    <CardTitle>Resumo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Itens
                        </span>
                        <span className="font-medium">
                          {formData.itens.length}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Total
                        </span>
                        <span className="font-bold text-lg">
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(calcularTotal())}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                  {canEdit && (
                    <CardFooter className="flex flex-col gap-2">
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={isSubmitting}
                      >
                        {isSubmitting && (
                          <IconLoader2 className="mr-2 size-4 animate-spin" />
                        )}
                        {isEditing ? "Salvar Alterações" : "Criar Pedido"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => router.push("/pedidos")}
                        disabled={isSubmitting}
                      >
                        Cancelar
                      </Button>
                    </CardFooter>
                  )}
                </Card>
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

                  {formData.itens.length > 0 ? (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Produto</TableHead>
                            <TableHead className="text-right">Quantidade</TableHead>
                            <TableHead className="text-right">Custo Unit.</TableHead>
                            <TableHead className="text-right">Preço Unit.</TableHead>
                            <TableHead className="text-right">Margem</TableHead>
                            <TableHead className="text-right">Subtotal</TableHead>
                            {canEdit && <TableHead className="w-[60px]"></TableHead>}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {formData.itens.map((item, index) => {
                            const margem = item.precoCustoUN && item.precoVendaUN > 0
                              ? ((item.precoVendaUN - item.precoCustoUN) / item.precoVendaUN * 100).toFixed(2)
                              : "0.00"
                            return (
                              <TableRow key={index}>
                                <TableCell className="font-medium">
                                  {item.produtoNome || `Produto ${item.produtoId}`}
                                </TableCell>
                                <TableCell className="text-right">
                                  {item.qntd}
                                </TableCell>
                                <TableCell className="text-right">
                                  {item.precoCustoUN ? (
                                    new Intl.NumberFormat("pt-BR", {
                                      style: "currency",
                                      currency: "BRL",
                                    }).format(item.precoCustoUN)
                                  ) : (
                                    <span className="text-muted-foreground">-</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  {new Intl.NumberFormat("pt-BR", {
                                    style: "currency",
                                    currency: "BRL",
                                  }).format(item.precoVendaUN)}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Badge variant={Number(margem) > 0 ? 'default' : 'secondary'}>
                                    {margem}%
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  {new Intl.NumberFormat("pt-BR", {
                                    style: "currency",
                                    currency: "BRL",
                                  }).format(item.qntd * item.precoVendaUN)}
                                </TableCell>
                                {canEdit && (
                                  <TableCell>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleRemoveItem(index)}
                                    >
                                      <IconTrash className="size-4 text-destructive" />
                                    </Button>
                                  </TableCell>
                                )}
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhum item adicionado ao pedido
                    </div>
                  )}
                </CardContent>
              </Card>
            </form>

            {/* Dialog de Seleção de Produto */}
            <AlertDialog open={showProdutoDialog} onOpenChange={setShowProdutoDialog}>
              <AlertDialogContent className="max-w-4xl max-h-[80vh]">
                <AlertDialogHeader>
                  <AlertDialogTitle>Selecionar Produto</AlertDialogTitle>
                </AlertDialogHeader>
                
                <div className="space-y-4">
                  {/* Campo de Busca */}
                  <div>
                    <Input
                      placeholder="Buscar produto..."
                      value={searchProduto}
                      onChange={(e) => setSearchProduto(e.target.value)}
                      className="w-full"
                    />
                  </div>

                  {/* Tabela de Produtos */}
                  <div className="border rounded-lg overflow-auto max-h-[300px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead className="text-right">Preço Custo</TableHead>
                          <TableHead className="text-right">Preço Venda</TableHead>
                          <TableHead className="text-right">Estoque</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {produtosFiltrados.length > 0 ? (
                          produtosFiltrados.map((produto) => (
                            <TableRow
                              key={produto.id}
                              className={`cursor-pointer hover:bg-muted ${
                                selectedProduto?.id === produto.id ? 'bg-muted' : ''
                              }`}
                              onClick={() => handleSelectProduto(produto)}
                            >
                              <TableCell className="font-medium">{produto.nome}</TableCell>
                              <TableCell className="text-right">
                                R$ {produto.precoCusto.toFixed(2)}
                              </TableCell>
                              <TableCell className="text-right">
                                R$ {produto.precoVenda.toFixed(2)}
                              </TableCell>
                              <TableCell className="text-right">
                                <Badge variant={produto.qntdEstoque > 0 ? 'default' : 'destructive'}>
                                  {produto.qntdEstoque}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                              Nenhum produto encontrado
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Inputs de Quantidade e Preço */}
                  {selectedProduto && (
                    <div className="space-y-4 pt-4 border-t">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <FieldLabel>Quantidade</FieldLabel>
                          <Input
                            type="number"
                            min="1"
                            value={quantidadeDialog}
                            onChange={(e) => setQuantidadeDialog(Number(e.target.value))}
                          />
                          {quantidadeDialog > selectedProduto.qntdEstoque && (
                            <p className="text-sm text-destructive mt-1">
                              ⚠️ Quantidade maior que estoque disponível ({selectedProduto.qntdEstoque})
                            </p>
                          )}
                        </div>
                        <div>
                          <FieldLabel>Preço Unitário</FieldLabel>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={precoDialog}
                            onChange={(e) => setPrecoDialog(Number(e.target.value))}
                          />
                        </div>
                      </div>
                      
                      {/* Exibir Margem Calculada */}
                      {precoDialog > 0 && (
                        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <span className="text-sm font-medium">Margem de Lucro:</span>
                          <Badge 
                            variant={
                              ((precoDialog - selectedProduto.precoCusto) / precoDialog * 100) > 0 
                                ? 'default' 
                                : 'destructive'
                            }
                            className="text-base"
                          >
                            {((precoDialog - selectedProduto.precoCusto) / precoDialog * 100).toFixed(2)}%
                          </Badge>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleConfirmAddProduto}
                    disabled={
                      !selectedProduto || 
                      quantidadeDialog <= 0 || 
                      (selectedProduto && quantidadeDialog > selectedProduto.qntdEstoque)
                    }
                  >
                    Adicionar ao Pedido
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
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
