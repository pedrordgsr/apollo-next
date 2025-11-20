"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
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

interface UsuarioFormData {
  username: string
  senha: string
  confirmarSenha?: string
  funcionarioId: string
}

interface Funcionario {
  id: number
  nome: string
  cargo: string
  status: string
}

interface Usuario {
  username: string
  email: string
  idUsuario: string
  idPessoa: string
  status: string
  nome: string
  cargo: string
  isAdmin: boolean
}

function CadastrarUsuarioContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const usuarioId = searchParams.get("id")
  const isEditing = !!usuarioId

  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isTogglingAdmin, setIsTogglingAdmin] = useState(false)
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])
  const [errors, setErrors] = useState<Partial<Record<keyof UsuarioFormData, string>>>({})
  const [formData, setFormData] = useState<UsuarioFormData>({
    username: "",
    senha: "",
    confirmarSenha: "",
    funcionarioId: "",
  })

  useEffect(() => {
    const fetchFuncionarios = async () => {
      try {
        // Buscar todos os funcionários ativos
        const responseFuncionarios = await api.get("/funcionarios?page=0&size=1000")
        const funcionariosAtivos = responseFuncionarios.data.content.filter(
          (func: Funcionario) => func.status === "ATIVO"
        )

        // Se não estiver editando, filtrar funcionários que já têm usuário
        if (!isEditing) {
          try {
            const responseUsuarios = await api.get("/usuarios?page=0&size=1000")
            const usuarios = responseUsuarios.data.content || []
            
            // Pegar IDs de funcionários que já têm usuário
            const funcionariosComUsuario = new Set(
              usuarios.map((usuario: Usuario) => usuario.idPessoa)
            )
            
            // Filtrar apenas funcionários sem usuário
            const funcionariosSemUsuario = funcionariosAtivos.filter(
              (func: Funcionario) => !funcionariosComUsuario.has(func.id.toString())
            )
            
            setFuncionarios(funcionariosSemUsuario)
          } catch {
            // Se falhar ao buscar usuários, mostra todos os funcionários ativos
            setFuncionarios(funcionariosAtivos)
          }
        } else {
          // Se estiver editando, mostra todos os funcionários ativos
          setFuncionarios(funcionariosAtivos)
        }
      } catch {
        toast.error("Erro ao carregar funcionários")
      }
    }

    fetchFuncionarios()
  }, [isEditing])

  useEffect(() => {
    const fetchUsuario = async () => {
      setIsLoading(true)
      try {
        const response = await api.get(`/usuarios/${usuarioId}`)
        const usuario = response.data
        
        setFormData({
          username: usuario.username || "",
          senha: "",
          confirmarSenha: "",
          funcionarioId: usuario.idPessoa?.toString() || "",
        })
        setIsAdmin(usuario.isAdmin || false)
      } catch {
        toast.error("Erro ao carregar dados do usuário")
        router.push("/usuarios")
      } finally {
        setIsLoading(false)
      }
    }

    if (isEditing) {
      fetchUsuario()
    }
  }, [usuarioId, isEditing, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    
    // Validações
    if (!formData.username.trim()) {
      setErrors((prev) => ({ ...prev, username: "Nome de usuário é obrigatório" }))
      toast.error("Nome de usuário é obrigatório")
      return
    }

    // Validação de nome de usuário único
    if (!isEditing || formData.username !== searchParams.get("username")) {
      try {
        const responseUsuarios = await api.get("/usuarios?page=0&size=1000")
        const usuarios = responseUsuarios.data.content || []
        const usernameExistente = usuarios.find(
          (usuario: Usuario) => usuario.username.toLowerCase() === formData.username.trim().toLowerCase()
        )

        if (usernameExistente && (!isEditing || usernameExistente.idUsuario !== usuarioId)) {
          setErrors((prev) => ({ ...prev, username: "Este nome de usuário já está em uso" }))
          toast.error("Este nome de usuário já está em uso")
          return
        }
      } catch {
        // Continua se falhar na verificação - o backend validará
      }
    }

    if (!isEditing && !formData.senha) {
      setErrors((prev) => ({ ...prev, senha: "Senha é obrigatória" }))
      toast.error("Senha é obrigatória")
      return
    }

    if (!isEditing && formData.senha !== formData.confirmarSenha) {
      setErrors((prev) => ({ ...prev, confirmarSenha: "As senhas não coincidem" }))
      toast.error("As senhas não coincidem")
      return
    }

    // Validação de senha (tanto no cadastro quanto na edição se senha for preenchida)
    if (formData.senha && formData.senha.length < 6) {
      setErrors((prev) => ({ ...prev, senha: "A senha deve ter no mínimo 6 caracteres" }))
      toast.error("A senha deve ter no mínimo 6 caracteres")
      return
    }

    // Validação de confirmação de senha na edição (se senha foi preenchida)
    if (isEditing && formData.senha && formData.senha !== formData.confirmarSenha) {
      setErrors((prev) => ({ ...prev, confirmarSenha: "As senhas não coincidem" }))
      toast.error("As senhas não coincidem")
      return
    }

    if (!formData.funcionarioId) {
      setErrors((prev) => ({ ...prev, funcionarioId: "Funcionário é obrigatório" }))
      toast.error("Selecione um funcionário")
      return
    }

    // Validação de funcionário único (cada funcionário pode ter apenas um usuário)
    if (!isEditing) {
      try {
        const responseUsuarios = await api.get("/usuarios?page=0&size=1000")
        const usuarios = responseUsuarios.data.content || []
        const funcionarioComUsuario = usuarios.find(
          (usuario: Usuario) => usuario.idPessoa === formData.funcionarioId
        )

        if (funcionarioComUsuario) {
          setErrors((prev) => ({ ...prev, funcionarioId: "Este funcionário já possui um usuário" }))
          toast.error("Este funcionário já possui um usuário cadastrado")
          return
        }
      } catch {
        // Continua se falhar na verificação - o backend validará
      }
    }

    setIsSaving(true)
    try {
      const payload: { username: string; senha?: string; funcionarioId: number } = {
        username: formData.username.trim(),
        funcionarioId: parseInt(formData.funcionarioId),
      }

      // Só envia senha se estiver criando ou se foi preenchida na edição
      if (!isEditing || (formData.senha && formData.senha.trim())) {
        payload.senha = formData.senha
      }

      if (isEditing) {
        await api.put(`/usuarios/${usuarioId}`, payload)
        toast.success("Usuário atualizado com sucesso!")
      } else {
        // Endpoint de registro (POST /auth/register)
        const response = await api.post("/auth/register", payload)
        
        if (response.data) {
          toast.success("Usuário cadastrado com sucesso!")
        }
      }
      
      router.push("/usuarios")
    } catch (err) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosError = err as {
          response?: { status?: number; data?: { message?: string } }
        }
        
        if (axiosError.response?.status === 400) {
          toast.error(axiosError.response?.data?.message || "Dados inválidos")
        } else if (axiosError.response?.status === 409) {
          toast.error("Este nome de usuário já está em uso")
          setErrors((prev) => ({ ...prev, username: "Nome de usuário já existe" }))
        } else {
          toast.error(
            axiosError.response?.data?.message || 
            `Erro ao ${isEditing ? "atualizar" : "cadastrar"} usuário`
          )
        }
      } else {
        toast.error(`Erro ao ${isEditing ? "atualizar" : "cadastrar"} usuário`)
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleInputChange = (field: keyof UsuarioFormData, value: string) => {
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

  const handleAdminToggle = async (checked: boolean) => {
    if (!usuarioId) return
    
    setIsTogglingAdmin(true)
    try {
      await api.post(`/usuarios/${usuarioId}/admin-toggle`)
      setIsAdmin(checked)
      toast.success(`Status de administrador ${checked ? 'ativado' : 'desativado'} com sucesso!`)
    } catch (err) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosError = err as {
          response?: { status?: number; data?: { message?: string } }
        }
        toast.error(
          axiosError.response?.data?.message || 
          "Erro ao alterar status de administrador"
        )
      } else {
        toast.error("Erro ao alterar status de administrador")
      }
      // Reverte o estado em caso de erro
      setIsAdmin(!checked)
    } finally {
      setIsTogglingAdmin(false)
    }
  }

  if (isLoading) {
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
              onClick={() => router.push("/usuarios")}
              className="mb-4"
            >
              <IconArrowLeft className="mr-2 size-4" />
              Voltar
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">
              {isEditing ? "Editar Usuário" : "Cadastrar Usuário"}
            </h1>
          </div>

          <div className="px-4 lg:px-6">
            <Card className="max-w-2xl">
              <CardHeader>
                <CardTitle>{isEditing ? "Editar Usuário" : "Novo Usuário"}</CardTitle>
                <CardDescription>
                  {isEditing
                    ? "Atualize as informações do usuário"
                    : "Preencha os dados para cadastrar um novo usuário"}
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSubmit}>
                <CardContent>
                  <FieldGroup>
                    <Field data-invalid={!!errors.username}>
                      <FieldLabel htmlFor="username">Nome de Usuário *</FieldLabel>
                      <FieldContent>
                        <Input
                          id="username"
                          value={formData.username}
                          onChange={(e) => handleInputChange("username", e.target.value)}
                          placeholder="Digite o nome de usuário"
                          required
                        />
                        {errors.username && <FieldError>{errors.username}</FieldError>}
                      </FieldContent>
                    </Field>

                    <Field data-invalid={!!errors.funcionarioId}>
                      <FieldLabel htmlFor="funcionarioId">Funcionário *</FieldLabel>
                      <FieldContent>
                        <Select
                          value={formData.funcionarioId}
                          onValueChange={(value) =>
                            handleInputChange("funcionarioId", value)
                          }
                          disabled={isEditing}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um funcionário" />
                          </SelectTrigger>
                          <SelectContent>
                            {funcionarios.length > 0 ? (
                              funcionarios.map((func) => (
                                <SelectItem key={func.id} value={func.id.toString()}>
                                  {func.nome} - {func.cargo}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="none" disabled>
                                {isEditing 
                                  ? "Funcionário vinculado ao usuário" 
                                  : "Nenhum funcionário disponível"}
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        {errors.funcionarioId && <FieldError>{errors.funcionarioId}</FieldError>}
                        {!isEditing && !errors.funcionarioId && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Apenas funcionários sem usuário cadastrado
                          </p>
                        )}
                        {isEditing && (
                          <p className="text-xs text-muted-foreground mt-1">
                            O funcionário não pode ser alterado após o cadastro
                          </p>
                        )}
                      </FieldContent>
                    </Field>

                    {isEditing && (
                      <Field>
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <FieldLabel htmlFor="admin-toggle">
                              Administrador
                            </FieldLabel>
                            <p className="text-xs text-muted-foreground">
                              Permite acesso total ao sistema
                            </p>
                          </div>
                          <Switch
                            id="admin-toggle"
                            checked={isAdmin}
                            onCheckedChange={handleAdminToggle}
                            disabled={isTogglingAdmin}
                          />
                        </div>
                      </Field>
                    )}

                    <Field data-invalid={!!errors.senha}>
                      <FieldLabel htmlFor="senha">
                        {isEditing ? "Nova Senha (deixe em branco para manter)" : "Senha *"}
                      </FieldLabel>
                      <FieldContent>
                        <Input
                          id="senha"
                          type="password"
                          value={formData.senha}
                          onChange={(e) => handleInputChange("senha", e.target.value)}
                          placeholder="Mínimo 6 caracteres"
                          required={!isEditing}
                          minLength={6}
                        />
                        {errors.senha && <FieldError>{errors.senha}</FieldError>}
                        {!errors.senha && <p className="text-xs text-muted-foreground mt-1">Mínimo de 6 caracteres</p>}
                      </FieldContent>
                    </Field>

                    <Field data-invalid={!!errors.confirmarSenha}>
                      <FieldLabel htmlFor="confirmarSenha">
                        {isEditing ? "Confirmar Nova Senha" : "Confirmar Senha *"}
                      </FieldLabel>
                      <FieldContent>
                        <Input
                          id="confirmarSenha"
                          type="password"
                          value={formData.confirmarSenha}
                          onChange={(e) => handleInputChange("confirmarSenha", e.target.value)}
                          placeholder="Digite a senha novamente"
                          required={!isEditing}
                        />
                        {errors.confirmarSenha && <FieldError>{errors.confirmarSenha}</FieldError>}
                      </FieldContent>
                    </Field>
                  </FieldGroup>
                </CardContent>
                <CardFooter className="flex justify-between mt-5">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/usuarios")}
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
  )
}

export default function CadastrarUsuarioPage() {
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
      <CadastrarUsuarioContent />
    </Suspense>
  )
}
