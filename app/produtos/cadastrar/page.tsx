"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
  const [isSubmitting, setIsSubmitting] = useState(false)
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
      await api.post("/api/produtos", formData)
      toast.success("Produto cadastrado com sucesso!")
      router.push("/produtos")
    } catch (err) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosError = err as {
          response?: { status?: number; data?: { message?: string } }
        }
        if (axiosError.response?.status === 401) {
          toast.error("Sessão expirada. Faça login novamente.")
        } else {
          toast.error("Erro ao cadastrar produto")
        }
      } else {
        toast.error("Erro ao cadastrar produto")
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
                  Cadastrar Produto
                </h1>
              </div>

              <div className="px-4 lg:px-6">
                <Card className="max-w-2xl">
                  <CardHeader>
                    <CardTitle>Novo Produto</CardTitle>
                    <CardDescription>
                      Preencha os dados do produto
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
                              placeholder="Ex: Carburador Jetta"
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
                              placeholder="Ex: Jetta nem tem carburador"
                            />
                            {errors.descricao && (
                              <FieldError>{errors.descricao}</FieldError>
                            )}
                          </FieldContent>
                        </Field>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && (
                          <IconLoader2 className="mr-2 size-4 animate-spin" />
                        )}
                        Cadastrar
                      </Button>
                    </CardFooter>
                  </form>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
