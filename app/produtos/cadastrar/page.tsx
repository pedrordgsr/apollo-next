"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
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
import { toast } from "sonner"
import { IconArrowLeft, IconLoader2 } from "@tabler/icons-react"
import { z } from "zod"

const produtoSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  descricao: z.string().min(1, "Descrição é obrigatória"),
  precoCusto: z.number().positive("Preço de custo deve ser maior que zero"),
  precoVenda: z.number().positive("Preço de venda deve ser maior que zero"),
}).refine((data) => data.precoVenda >= data.precoCusto, {
  message: "Preço de venda não pode ser menor que o preço de custo",
  path: ["precoVenda"],
})

type ProdutoFormData = z.infer<typeof produtoSchema>

export default function CadastrarProdutoPage() {
  const { isAuthenticated, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const produtoId = searchParams.get("id")
  const isEditing = !!produtoId
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingProduto, setIsLoadingProduto] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof ProdutoFormData, string>>>({})
  const [formData, setFormData] = useState<ProdutoFormData>({
    nome: "",
    descricao: "",
    precoCusto: 0,
    precoVenda: 0,
  })

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/")
    }
  }, [loading, isAuthenticated, router])

  // Buscar dados do produto quando estiver editando
  useEffect(() => {
    if (isAuthenticated && produtoId) {
      const fetchProduto = async () => {
        setIsLoadingProduto(true)
        try {
          const response = await api.get(`/api/produtos/${produtoId}`)
          const produto = response.data
          setFormData({
            nome: produto.nome,
            descricao: produto.descricao,
            precoCusto: produto.precoCusto,
            precoVenda: produto.precoVenda,
          })
        } catch (err) {
          if (err && typeof err === "object" && "response" in err) {
            const axiosError = err as {
              response?: { status?: number; data?: { message?: string } }
            }
            if (axiosError.response?.status === 401) {
              toast.error("Sessão expirada. Faça login novamente.")
            } else if (axiosError.response?.status === 404) {
              toast.error("Produto não encontrado")
              router.push("/produtos")
            } else {
              toast.error("Erro ao carregar produto")
            }
          } else {
            toast.error("Erro ao carregar produto")
          }
        } finally {
          setIsLoadingProduto(false)
        }
      }

      fetchProduto()
    }
  }, [isAuthenticated, produtoId, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    const result = produtoSchema.safeParse(formData)

    if (!result.success) {
      const fieldErrors: Partial<Record<keyof ProdutoFormData, string>> = {}
      result.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          fieldErrors[issue.path[0] as keyof ProdutoFormData] = issue.message
        }
      })
      setErrors(fieldErrors)
      return
    }

    setIsSubmitting(true)

    try {
      if (isEditing) {
        // Atualizar produto existente
        await api.put(`/api/produtos/${produtoId}`, formData)
        toast.success("Produto atualizado com sucesso!")
      } else {
        // Criar novo produto
        await api.post("/api/produtos", formData)
        toast.success("Produto cadastrado com sucesso!")
      }
      router.push("/produtos")
    } catch (err) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosError = err as {
          response?: { status?: number; data?: { message?: string } }
        }
        if (axiosError.response?.status === 401) {
          toast.error("Sessão expirada. Faça login novamente.")
        } else {
          toast.error(isEditing ? "Erro ao atualizar produto" : "Erro ao cadastrar produto")
        }
      } else {
        toast.error(isEditing ? "Erro ao atualizar produto" : "Erro ao cadastrar produto")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "precoCusto" || name === "precoVenda"
          ? parseFloat(value) || 0
          : value,
    }))

    if (errors[name as keyof ProdutoFormData]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name as keyof ProdutoFormData]
        return newErrors
      })
    }
  }

  // Cálculos de margem/markup em tempo real
  const precoCustoVal = Number(formData.precoCusto) || 0
  const precoVendaVal = Number(formData.precoVenda) || 0
  const profit = precoVendaVal - precoCustoVal
  const margemPercent = precoVendaVal > 0 ? (profit / precoVendaVal) * 100 : null
  const markupPercent = precoCustoVal > 0 ? (profit / precoCustoVal) * 100 : null

  if (loading || !isAuthenticated || isLoadingProduto) {
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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push("/produtos")}
                  className="mb-4"
                >
                  <IconArrowLeft className="mr-2 size-4" />
                  Voltar
                </Button>
                <h1 className="text-3xl font-bold tracking-tight">
                  {isEditing ? "Editar Produto" : "Cadastrar Produto"}
                </h1>
              </div>

              <div className="px-4 lg:px-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  <Card className="col-span-2 max-w-2xl">
                  <CardHeader>
                    <CardTitle>{isEditing ? "Editar Produto" : "Novo Produto"}</CardTitle>
                    <CardDescription>
                      {isEditing ? "Atualize os dados do produto" : "Preencha os dados do produto"}
                    </CardDescription>
                  </CardHeader>
                  <form onSubmit={handleSubmit}>
                    <CardContent>
                      <FieldGroup>
                        <Field data-invalid={!!errors.nome}>
                          <FieldLabel htmlFor="nome">
                            Nome *
                          </FieldLabel>
                          <FieldContent>
                            <Input
                              id="nome"
                              name="nome"
                              value={formData.nome}
                              onChange={handleChange}
                              placeholder="Ex: Arroz 1KG"
                            />
                            {errors.nome && <FieldError>{errors.nome}</FieldError>}
                          </FieldContent>
                        </Field>

                        <Field data-invalid={!!errors.descricao}>
                          <FieldLabel htmlFor="descricao">
                            Descrição *
                          </FieldLabel>
                          <FieldContent>
                            <Input
                              id="descricao"
                              name="descricao"
                              value={formData.descricao}
                              onChange={handleChange}
                              placeholder="Ex: Arroz branco tipo 1, embalagem de 1KG"
                            />
                            {errors.descricao && (
                              <FieldError>{errors.descricao}</FieldError>
                            )}
                          </FieldContent>
                        </Field>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 mb-5">
                          <Field data-invalid={!!errors.precoCusto}>
                            <FieldLabel htmlFor="precoCusto">
                              Preço de Custo (R$) *
                            </FieldLabel>
                            <FieldContent>
                              <Input
                                id="precoCusto"
                                name="precoCusto"
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.precoCusto || ""}
                                onChange={handleChange}
                                placeholder="0.00"
                              />
                              {errors.precoCusto && (
                                <FieldError>{errors.precoCusto}</FieldError>
                              )}
                            </FieldContent>
                          </Field>

                          <Field data-invalid={!!errors.precoVenda}>
                            <FieldLabel htmlFor="precoVenda">
                              Preço de Venda (R$) *
                            </FieldLabel>
                            <FieldContent>
                              <Input
                                id="precoVenda"
                                name="precoVenda"
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.precoVenda || ""}
                                onChange={handleChange}
                                placeholder="0.00"
                              />
                              {errors.precoVenda && (
                                <FieldError>{errors.precoVenda}</FieldError>
                              )}
                            </FieldContent>
                          </Field>
                        </div>
                      </FieldGroup>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push("/produtos")}
                        disabled={isSubmitting}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={isSubmitting || isLoadingProduto}>
                        {isSubmitting && (
                          <IconLoader2 className="mr-2 size-4 animate-spin" />
                        )}
                        {isEditing ? "Salvar Alterações" : "Cadastrar"}
                      </Button>
                    </CardFooter>
                  </form>
                </Card>

                {/* Card de margem em tempo real */}
                <Card className="hidden md:flex flex-col items-stretch p-0">
                  <CardHeader className="px-6 pt-6">
                    <CardTitle>Margem</CardTitle>
                    <CardDescription>Visualize a margem do produto</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Preço de Custo</span>
                        <span className="font-medium">R$ {precoCustoVal.toFixed(2)}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Preço de Venda</span>
                        <span className="font-medium">R$ {precoVendaVal.toFixed(2)}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Lucro (R$)</span>
                        <span className="font-medium">R$ {profit.toFixed(2)}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Margem (%)</span>
                        <span className="font-medium">{margemPercent === null ? "—" : `${margemPercent.toFixed(2)} %`}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Markup (%)</span>
                        <span className="font-medium">{markupPercent === null ? "—" : `${markupPercent.toFixed(2)} %`}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
