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

interface FuncionarioFormData {
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
  dataAdmissao: string
  cargo: string
  salario: string
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

export default function CadastrarFuncionarioPage() {
  const { isAuthenticated, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const funcionarioId = searchParams.get("id")
  const isEditing = !!funcionarioId

  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<FuncionarioFormData>({
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
    dataAdmissao: "",
    cargo: "",
    salario: "",
  })

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/")
    }
  }, [loading, isAuthenticated, router])

  useEffect(() => {
    if (isEditing && isAuthenticated) {
      fetchFuncionario()
    }
  }, [funcionarioId, isAuthenticated])

  const fetchFuncionario = async () => {
    setIsLoading(true)
    try {
      const response = await api.get(`/funcionarios/${funcionarioId}`)
      const funcionario = response.data
      
      // Formata a data de ISO para dd/mm/yyyy
      let dataAdmissaoFormatada = ""
      if (funcionario.dataAdmissao) {
        const data = new Date(funcionario.dataAdmissao)
        const dia = String(data.getDate()).padStart(2, '0')
        const mes = String(data.getMonth() + 1).padStart(2, '0')
        const ano = data.getFullYear()
        dataAdmissaoFormatada = `${dia}/${mes}/${ano}`
      }
      
      setFormData({
        nome: funcionario.nome || "",
        tipoPessoa: funcionario.tipoPessoa || "FISICA",
        cpfcnpj: funcionario.cpfCnpj || "",
        ie: funcionario.ie || "",
        email: funcionario.email || "",
        telefone: funcionario.telefone?.toString() || "",
        endereco: funcionario.endereco || "",
        bairro: funcionario.bairro || "",
        cidade: funcionario.cidade || "",
        uf: funcionario.uf || "",
        cep: funcionario.cep?.toString() || "",
        dataAdmissao: dataAdmissaoFormatada,
        cargo: funcionario.cargo || "",
        salario: funcionario.salario?.toString() || "",
      })
    } catch (err) {
      toast.error("Erro ao carregar dados do funcionário")
      router.push("/funcionarios")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validação básica
    if (!formData.nome || !formData.cpfcnpj || !formData.email || !formData.cargo || !formData.dataAdmissao || !formData.salario) {
      toast.error("Preencha todos os campos obrigatórios")
      return
    }

    // Validação de CPF
    const cpfLimpo = formData.cpfcnpj.replace(/\D/g, "")
    
    if (formData.tipoPessoa === "FISICA") {
      if (cpfLimpo.length !== 11) {
        toast.error("CPF deve ter 11 dígitos")
        return
      }
      if (!validarCPF(cpfLimpo)) {
        toast.error("CPF inválido. Verifique os dígitos informados.")
        return
      }
    }

    setIsSaving(true)
    try {
      // Converte a data de dd/mm/yyyy para ISO
      let dataAdmissaoISO = new Date().toISOString()
      if (formData.dataAdmissao && formData.dataAdmissao.length === 10) {
        const [dia, mes, ano] = formData.dataAdmissao.split("/")
        if (dia && mes && ano) {
          const dataFormatada = `${ano}-${mes}-${dia}T00:00:00`
          dataAdmissaoISO = new Date(dataFormatada).toISOString()
        }
      }

      const payload = {
        nome: formData.nome,
        tipoPessoa: formData.tipoPessoa,
        cpfcnpj: cpfLimpo,
        ie: formData.ie || null,
        email: formData.email,
        telefone: parseInt(formData.telefone.replace(/\D/g, "")) || 0,
        endereco: formData.endereco,
        bairro: formData.bairro,
        cidade: formData.cidade,
        uf: formData.uf,
        cep: parseInt(formData.cep.replace(/\D/g, "")) || 0,
        dataAdmissao: dataAdmissaoISO,
        cargo: formData.cargo,
        salario: parseFloat(formData.salario) || 0,
      }

      if (isEditing) {
        await api.put(`/funcionarios/${funcionarioId}`, payload)
        toast.success("Funcionário atualizado com sucesso!")
      } else {
        await api.post("/funcionarios", payload)
        toast.success("Funcionário cadastrado com sucesso!")
      }
      
      router.push("/funcionarios")
    } catch (err) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosError = err as {
          response?: { status?: number; data?: { message?: string } }
        }
        toast.error(
          axiosError.response?.data?.message || 
          `Erro ao ${isEditing ? "atualizar" : "cadastrar"} funcionário`
        )
      } else {
        toast.error(`Erro ao ${isEditing ? "atualizar" : "cadastrar"} funcionário`)
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleInputChange = (field: keyof FuncionarioFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  // Função para formatar data dd/mm/yyyy
  const formatarDataParaInput = (value: string) => {
    const apenasNumeros = value.replace(/\D/g, "")
    
    if (apenasNumeros.length <= 2) {
      return apenasNumeros
    } else if (apenasNumeros.length <= 4) {
      return `${apenasNumeros.slice(0, 2)}/${apenasNumeros.slice(2)}`
    } else {
      return `${apenasNumeros.slice(0, 2)}/${apenasNumeros.slice(2, 4)}/${apenasNumeros.slice(4, 8)}`
    }
  }

  const handleDataChange = (value: string) => {
    const formatted = formatarDataParaInput(value)
    handleInputChange("dataAdmissao", formatted)
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
                  onClick={() => router.push("/funcionarios")}
                  className="mb-4"
                >
                  <IconArrowLeft className="mr-2 size-4" />
                  Voltar
                </Button>
                <h1 className="text-3xl font-bold tracking-tight">
                  {isEditing ? "Editar Funcionário" : "Cadastrar Funcionário"}
                </h1>
              </div>

              <div className="px-4 lg:px-6">
                <Card className="max-w-3xl">
                  <CardHeader>
                    <CardTitle>{isEditing ? "Editar Funcionário" : "Novo Funcionário"}</CardTitle>
                    <CardDescription>
                      {isEditing
                        ? "Atualize as informações do funcionário"
                        : "Preencha os dados para cadastrar um novo funcionário"}
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
                            <FieldLabel htmlFor="cpfcnpj">CPF *</FieldLabel>
                            <FieldContent>
                              <Input
                                id="cpfcnpj"
                                value={formData.cpfcnpj}
                                onChange={(e) => handleInputChange("cpfcnpj", e.target.value)}
                                placeholder="000.000.000-00"
                                required
                              />
                            </FieldContent>
                          </Field>

                          <Field>
                            <FieldLabel htmlFor="cargo">Cargo *</FieldLabel>
                            <FieldContent>
                              <Input
                                id="cargo"
                                value={formData.cargo}
                                onChange={(e) => handleInputChange("cargo", e.target.value)}
                                placeholder="Ex: Caixa, Gerente"
                                required
                              />
                            </FieldContent>
                          </Field>

                          <Field>
                            <FieldLabel htmlFor="salario">Salário (R$) *</FieldLabel>
                            <FieldContent>
                              <Input
                                id="salario"
                                type="number"
                                step="0.01"
                                value={formData.salario}
                                onChange={(e) => handleInputChange("salario", e.target.value)}
                                placeholder="0.00"
                                required
                              />
                            </FieldContent>
                          </Field>

                          <Field>
                            <FieldLabel htmlFor="dataAdmissao">Data de Admissão *</FieldLabel>
                            <FieldContent>
                              <Input
                                id="dataAdmissao"
                                type="text"
                                placeholder="dd/mm/yyyy"
                                value={formData.dataAdmissao}
                                onChange={(e) => handleDataChange(e.target.value)}
                                maxLength={10}
                                required
                              />
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
                        onClick={() => router.push("/funcionarios")}
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
