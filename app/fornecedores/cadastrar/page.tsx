"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
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
import { toast } from "sonner"
import { IconArrowLeft, IconLoader2 } from "@tabler/icons-react"
import { fornecedorSchema, type FornecedorFormData } from "@/lib/validations"

function CadastrarFornecedorContent() {
  const { isAuthenticated, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const fornecedorId = searchParams.get("id")
  const isEditing = !!fornecedorId

  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof FornecedorFormData, string>>>({})
  const [formData, setFormData] = useState<FornecedorFormData>({
    nome: "",
    tipoPessoa: "JURIDICA",
    cpfcnpj: "",
    ie: "",
    email: "",
    telefone: "",
    endereco: "",
    bairro: "",
    cidade: "",
    uf: "",
    cep: "",
    tipoFornecedor: "",
  })

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/")
    }
  }, [loading, isAuthenticated, router])

  useEffect(() => {
    const fetchFornecedor = async () => {
      setIsLoading(true)
      try {
        const response = await api.get(`/fornecedores/${fornecedorId}`)
        const fornecedor = response.data
        
        setFormData({
          nome: fornecedor.nome || "",
          tipoPessoa: fornecedor.tipoPessoa || "JURIDICA",
          cpfcnpj: fornecedor.cpfCnpj || "",
          ie: fornecedor.ie || "",
          email: fornecedor.email || "",
          telefone: fornecedor.telefone?.toString() || "",
          endereco: fornecedor.endereco || "",
          bairro: fornecedor.bairro || "",
          cidade: fornecedor.cidade || "",
          uf: fornecedor.uf || "",
          cep: fornecedor.cep?.toString() || "",
          tipoFornecedor: fornecedor.tipoFornecedor || "",
        })
      } catch {
        toast.error("Erro ao carregar dados do fornecedor")
        router.push("/fornecedores")
      } finally {
        setIsLoading(false)
      }
    }

    if (isEditing && isAuthenticated) {
      fetchFornecedor()
    }
  }, [fornecedorId, isAuthenticated, isEditing, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    
    // Validação com Zod
    const result = fornecedorSchema.safeParse(formData)

    if (!result.success) {
      const fieldErrors: Partial<Record<keyof FornecedorFormData, string>> = {}
      result.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          fieldErrors[issue.path[0] as keyof FornecedorFormData] = issue.message
        }
      })
      setErrors(fieldErrors)
      
      // Mostra a primeira mensagem de erro
      const firstError = result.error.issues[0]
      if (firstError) {
        toast.error(firstError.message)
      }
      return
    }

    setIsSaving(true)
    try {
      const cpfCnpjLimpo = formData.cpfcnpj.replace(/\D/g, "")
      
      const payload = {
        nome: formData.nome,
        tipoPessoa: formData.tipoPessoa,
        cpfcnpj: cpfCnpjLimpo,
        ie: formData.ie || null,
        email: formData.email,
        telefone: parseInt(formData.telefone?.replace(/\D/g, "") || "0") || 0,
        endereco: formData.endereco,
        bairro: formData.bairro,
        cidade: formData.cidade,
        uf: formData.uf,
        cep: parseInt(formData.cep?.replace(/\D/g, "") || "0") || 0,
        tipoFornecedor: formData.tipoFornecedor || null,
      }

      if (isEditing) {
        await api.put(`/fornecedores/${fornecedorId}`, payload)
        toast.success("Fornecedor atualizado com sucesso!")
      } else {
        await api.post("/fornecedores", payload)
        toast.success("Fornecedor cadastrado com sucesso!")
      }
      
      router.push("/fornecedores")
    } catch (err) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosError = err as {
          response?: { status?: number; data?: { message?: string } }
        }
        toast.error(
          axiosError.response?.data?.message || 
          `Erro ao ${isEditing ? "atualizar" : "cadastrar"} fornecedor`
        )
      } else {
        toast.error(`Erro ao ${isEditing ? "atualizar" : "cadastrar"} fornecedor`)
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleInputChange = (field: keyof FornecedorFormData, value: string | undefined) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    
    // Limpa erro do campo ao digitar
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  if (loading || !isAuthenticated || isLoading) {
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
                  onClick={() => router.push("/fornecedores")}
                  className="mb-4"
                >
                  <IconArrowLeft className="mr-2 size-4" />
                  Voltar
                </Button>
                <h1 className="text-3xl font-bold tracking-tight">
                  {isEditing ? "Editar Fornecedor" : "Cadastrar Fornecedor"}
                </h1>
              </div>

              <div className="px-4 lg:px-6">
                <Card className="max-w-3xl">
                  <CardHeader>
                    <CardTitle>{isEditing ? "Editar Fornecedor" : "Novo Fornecedor"}</CardTitle>
                    <CardDescription>
                      {isEditing
                        ? "Atualize as informações do fornecedor"
                        : "Preencha os dados para cadastrar um novo fornecedor"}
                    </CardDescription>
                  </CardHeader>
                  <form onSubmit={handleSubmit}>
                    <CardContent>
                      <FieldGroup>
                        <Field data-invalid={!!errors.nome}>
                          <FieldLabel htmlFor="nome">Nome *</FieldLabel>
                          <FieldContent>
                            <Input
                              id="nome"
                              value={formData.nome}
                              onChange={(e) => handleInputChange("nome", e.target.value)}
                              placeholder="Nome completo"
                              required
                            />
                            {errors.nome && <FieldError>{errors.nome}</FieldError>}
                          </FieldContent>
                        </Field>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <Field data-invalid={!!errors.tipoPessoa}>
                            <FieldLabel htmlFor="tipoPessoa">Tipo de Pessoa *</FieldLabel>
                            <FieldContent>
                              <Select
                                value={formData.tipoPessoa}
                                onValueChange={(value) =>
                                  handleInputChange("tipoPessoa", value)
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="FISICA">Física</SelectItem>
                                  <SelectItem value="JURIDICA">Jurídica</SelectItem>
                                </SelectContent>
                              </Select>
                              {errors.tipoPessoa && <FieldError>{errors.tipoPessoa}</FieldError>}
                            </FieldContent>
                          </Field>

                          <Field data-invalid={!!errors.cpfcnpj}>
                            <FieldLabel htmlFor="cpfcnpj">
                              {formData.tipoPessoa === "FISICA" ? "CPF" : "CNPJ"} *
                            </FieldLabel>
                            <FieldContent>
                              <Input
                                id="cpfcnpj"
                                value={formData.cpfcnpj}
                                onChange={(e) => handleInputChange("cpfcnpj", e.target.value)}
                                placeholder={
                                  formData.tipoPessoa === "FISICA"
                                    ? "000.000.000-00"
                                    : "00.000.000/0000-00"
                                }
                                required
                              />
                              {errors.cpfcnpj && <FieldError>{errors.cpfcnpj}</FieldError>}
                            </FieldContent>
                          </Field>

                          <Field>
                            <FieldLabel htmlFor="ie">Inscrição Estadual</FieldLabel>
                            <FieldContent>
                              <Input
                                id="ie"
                                value={formData.ie}
                                onChange={(e) => handleInputChange("ie", e.target.value)}
                                placeholder="Inscrição Estadual"
                              />
                            </FieldContent>
                          </Field>

                          <Field data-invalid={!!errors.tipoFornecedor}>
                            <FieldLabel htmlFor="tipoFornecedor">Tipo Fornecedor *</FieldLabel>
                            <FieldContent>
                              <Input
                                id="tipoFornecedor"
                                value={formData.tipoFornecedor}
                                onChange={(e) => handleInputChange("tipoFornecedor", e.target.value)}
                                placeholder="Digite o tipo de fornecedor"
                              />
                              {errors.tipoFornecedor && <FieldError>{errors.tipoFornecedor}</FieldError>}
                            </FieldContent>
                          </Field>

                          <Field data-invalid={!!errors.email}>
                            <FieldLabel htmlFor="email">E-mail</FieldLabel>
                            <FieldContent>
                              <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => handleInputChange("email", e.target.value)}
                                placeholder="email@exemplo.com"
                              />
                              {errors.email && <FieldError>{errors.email}</FieldError>}
                            </FieldContent>
                          </Field>

                          <Field>
                            <FieldLabel htmlFor="telefone">Telefone</FieldLabel>
                            <FieldContent>
                              <Input
                                id="telefone"
                                value={formData.telefone}
                                onChange={(e) => handleInputChange("telefone", e.target.value)}
                                placeholder="(00) 00000-0000"
                              />
                            </FieldContent>
                          </Field>
                        </div>

                        <Field>
                          <FieldLabel htmlFor="endereco">Endereço</FieldLabel>
                          <FieldContent>
                            <Input
                              id="endereco"
                              value={formData.endereco}
                              onChange={(e) => handleInputChange("endereco", e.target.value)}
                              placeholder="Rua, número, complemento"
                            />
                          </FieldContent>
                        </Field>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-5">
                          <Field>
                            <FieldLabel htmlFor="bairro">Bairro</FieldLabel>
                            <FieldContent>
                              <Input
                                id="bairro"
                                value={formData.bairro}
                                onChange={(e) => handleInputChange("bairro", e.target.value)}
                                placeholder="Bairro"
                              />
                            </FieldContent>
                          </Field>

                          <Field>
                            <FieldLabel htmlFor="cidade">Cidade</FieldLabel>
                            <FieldContent>
                              <Input
                                id="cidade"
                                value={formData.cidade}
                                onChange={(e) => handleInputChange("cidade", e.target.value)}
                                placeholder="Cidade"
                              />
                            </FieldContent>
                          </Field>

                          <Field>
                            <FieldLabel htmlFor="uf">UF</FieldLabel>
                            <FieldContent>
                              <Input
                                id="uf"
                                value={formData.uf}
                                onChange={(e) => handleInputChange("uf", e.target.value)}
                                placeholder="PR"
                                maxLength={2}
                              />
                            </FieldContent>
                          </Field>

                          <Field>
                            <FieldLabel htmlFor="cep">CEP</FieldLabel>
                            <FieldContent>
                              <Input
                                id="cep"
                                value={formData.cep}
                                onChange={(e) => handleInputChange("cep", e.target.value)}
                                placeholder="00000-000"
                              />
                            </FieldContent>
                          </Field>
                        </div>
                      </FieldGroup>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push("/fornecedores")}
                        disabled={isSaving}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={isSaving}>
                        {isSaving && (
                          <IconLoader2 className="mr-2 size-4 animate-spin" />
                        )}
                        {isEditing ? "Salvar Alterações" : "Cadastrar"}
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

export default function CadastrarFornecedorPage() {
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
      <CadastrarFornecedorContent />
    </Suspense>
  )
}
