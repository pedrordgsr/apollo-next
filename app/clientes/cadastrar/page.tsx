"use client"

import { useState, useEffect } from "react"
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

interface ClienteFormData {
  nome: string
  tipoPessoa: "FISICA" | "JURIDICA"
  cpfcnpj: string
  ie: string
  email: string
  telefone: string
  endereco: string
  bairro: string
  cidade: string
  uf: string
  cep: string
  genero: "MASCULINO" | "FEMININO" | "NAO_INFORMAR" | ""
}

// Função para validar CPF
function validarCPF(cpf: string): boolean {
  const cpfLimpo = cpf.replace(/\D/g, "")
  
  if (cpfLimpo.length !== 11) return false
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cpfLimpo)) return false
  
  // Valida primeiro dígito verificador
  let soma = 0
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpfLimpo.charAt(i)) * (10 - i)
  }
  let resto = (soma * 10) % 11
  if (resto === 10 || resto === 11) resto = 0
  if (resto !== parseInt(cpfLimpo.charAt(9))) return false
  
  // Valida segundo dígito verificador
  soma = 0
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpfLimpo.charAt(i)) * (11 - i)
  }
  resto = (soma * 10) % 11
  if (resto === 10 || resto === 11) resto = 0
  if (resto !== parseInt(cpfLimpo.charAt(10))) return false
  
  return true
}

// Função para validar CNPJ
function validarCNPJ(cnpj: string): boolean {
  const cnpjLimpo = cnpj.replace(/\D/g, "")
  
  if (cnpjLimpo.length !== 14) return false
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{13}$/.test(cnpjLimpo)) return false
  
  // Valida primeiro dígito verificador
  let tamanho = cnpjLimpo.length - 2
  let numeros = cnpjLimpo.substring(0, tamanho)
  const digitos = cnpjLimpo.substring(tamanho)
  let soma = 0
  let pos = tamanho - 7
  
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--
    if (pos < 2) pos = 9
  }
  
  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11)
  if (resultado !== parseInt(digitos.charAt(0))) return false
  
  // Valida segundo dígito verificador
  tamanho = tamanho + 1
  numeros = cnpjLimpo.substring(0, tamanho)
  soma = 0
  pos = tamanho - 7
  
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--
    if (pos < 2) pos = 9
  }
  
  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11)
  if (resultado !== parseInt(digitos.charAt(1))) return false
  
  return true
}

export default function CadastrarClientePage() {
  const { isAuthenticated, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const clienteId = searchParams.get("id")
  const isEditing = !!clienteId

  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<ClienteFormData>({
    nome: "",
    tipoPessoa: "FISICA",
    cpfcnpj: "",
    ie: "",
    email: "",
    telefone: "",
    endereco: "",
    bairro: "",
    cidade: "",
    uf: "",
    cep: "",
    genero: "",
  })

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/")
    }
  }, [loading, isAuthenticated, router])

  useEffect(() => {
    if (isEditing && isAuthenticated) {
      fetchCliente()
    }
  }, [clienteId, isAuthenticated])

  const fetchCliente = async () => {
    setIsLoading(true)
    try {
      const response = await api.get(`/clientes/${clienteId}`)
      const cliente = response.data
      
      setFormData({
        nome: cliente.nome || "",
        tipoPessoa: cliente.tipoPessoa || "FISICA",
        cpfcnpj: cliente.cpfCnpj || "",
        ie: cliente.ie || "",
        email: cliente.email || "",
        telefone: cliente.telefone?.toString() || "",
        endereco: cliente.endereco || "",
        bairro: cliente.bairro || "",
        cidade: cliente.cidade || "",
        uf: cliente.uf || "",
        cep: cliente.cep?.toString() || "",
        genero: cliente.genero || "",
      })
    } catch (err) {
      toast.error("Erro ao carregar dados do cliente")
      router.push("/clientes")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validação básica
    if (!formData.nome || !formData.cpfcnpj || !formData.email) {
      toast.error("Preencha todos os campos obrigatórios")
      return
    }

    // Validação de CPF/CNPJ
    const cpfCnpjLimpo = formData.cpfcnpj.replace(/\D/g, "")
    
    if (formData.tipoPessoa === "FISICA") {
      if (cpfCnpjLimpo.length !== 11) {
        toast.error("CPF deve ter 11 dígitos")
        return
      }
      if (!validarCPF(cpfCnpjLimpo)) {
        toast.error("CPF inválido. Verifique os dígitos informados.")
        return
      }
    }
    
    if (formData.tipoPessoa === "JURIDICA") {
      if (cpfCnpjLimpo.length !== 14) {
        toast.error("CNPJ deve ter 14 dígitos")
        return
      }
      if (!validarCNPJ(cpfCnpjLimpo)) {
        toast.error("CNPJ inválido. Verifique os dígitos informados.")
        return
      }
    }

    setIsSaving(true)
    try {
      const payload = {
        nome: formData.nome,
        tipoPessoa: formData.tipoPessoa,
        cpfcnpj: cpfCnpjLimpo,
        ie: formData.ie || null,
        email: formData.email,
        telefone: parseInt(formData.telefone.replace(/\D/g, "")) || 0,
        endereco: formData.endereco,
        bairro: formData.bairro,
        cidade: formData.cidade,
        uf: formData.uf,
        cep: parseInt(formData.cep.replace(/\D/g, "")) || 0,
        genero: formData.genero || null,
      }

      if (isEditing) {
        await api.put(`/clientes/${clienteId}`, payload)
        toast.success("Cliente atualizado com sucesso!")
      } else {
        await api.post("/clientes", payload)
        toast.success("Cliente cadastrado com sucesso!")
      }
      
      router.push("/clientes")
    } catch (err) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosError = err as {
          response?: { status?: number; data?: { message?: string } }
        }
        toast.error(
          axiosError.response?.data?.message || 
          `Erro ao ${isEditing ? "atualizar" : "cadastrar"} cliente`
        )
      } else {
        toast.error(`Erro ao ${isEditing ? "atualizar" : "cadastrar"} cliente`)
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleInputChange = (field: keyof ClienteFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
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
                  onClick={() => router.push("/clientes")}
                  className="mb-4"
                >
                  <IconArrowLeft className="mr-2 size-4" />
                  Voltar
                </Button>
                <h1 className="text-3xl font-bold tracking-tight">
                  {isEditing ? "Editar Cliente" : "Cadastrar Cliente"}
                </h1>
              </div>

              <div className="px-4 lg:px-6">
                <Card className="max-w-3xl">
                  <CardHeader>
                    <CardTitle>{isEditing ? "Editar Cliente" : "Novo Cliente"}</CardTitle>
                    <CardDescription>
                      {isEditing
                        ? "Atualize as informações do cliente"
                        : "Preencha os dados para cadastrar um novo cliente"}
                    </CardDescription>
                  </CardHeader>
                  <form onSubmit={handleSubmit}>
                    <CardContent>
                      <FieldGroup>
                        <Field>
                          <FieldLabel htmlFor="nome">Nome *</FieldLabel>
                          <FieldContent>
                            <Input
                              id="nome"
                              value={formData.nome}
                              onChange={(e) => handleInputChange("nome", e.target.value)}
                              placeholder="Nome completo"
                              required
                            />
                          </FieldContent>
                        </Field>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <Field>
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
                            </FieldContent>
                          </Field>

                          <Field>
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

                          <Field>
                            <FieldLabel htmlFor="genero">Gênero</FieldLabel>
                            <FieldContent>
                              <Select
                                value={formData.genero}
                                onValueChange={(value) => handleInputChange("genero", value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="MASCULINO">Masculino</SelectItem>
                                  <SelectItem value="FEMININO">Feminino</SelectItem>
                                  <SelectItem value="NAO_INFORMAR">Não informar</SelectItem>
                                </SelectContent>
                              </Select>
                            </FieldContent>
                          </Field>

                          <Field>
                            <FieldLabel htmlFor="email">E-mail *</FieldLabel>
                            <FieldContent>
                              <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => handleInputChange("email", e.target.value)}
                                placeholder="email@exemplo.com"
                                required
                              />
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
                        onClick={() => router.push("/clientes")}
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
