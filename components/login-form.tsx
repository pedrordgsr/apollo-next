"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { login } from "@/lib/api"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [senha, setSenha] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const data = await login({ username, senha })

      // Salvar no localStorage
      localStorage.setItem("token", data.token)
      localStorage.setItem("usuarioId", data.usuarioId.toString())
      localStorage.setItem("username", data.username)
      localStorage.setItem("funcionarioId", data.funcionarioId.toString())

      // Redirecionar para dashboard
      router.push("/dashboard")
    } catch (err) {
      const errorMessage = err instanceof Error && 'response' in err 
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message 
        : "Erro ao fazer login. Tente novamente."
      setError(errorMessage || "Erro ao fazer login. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className={cn("flex flex-col gap-6", className)} onSubmit={handleSubmit} {...props}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Entrar na conta</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Insira suas credenciais abaixo para entrar na sua conta
          </p>
        </div>
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
            {error}
          </div>
        )}
        <Field>
          <FieldLabel htmlFor="username">Usuário</FieldLabel>
          <Input 
            id="username" 
            type="text" 
            placeholder="usuario123" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required 
          />
        </Field>
        <Field>
          <div className="flex items-center">
            <FieldLabel htmlFor="password">Senha</FieldLabel>
          </div>
          <Input 
            id="password" 
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required 
          />
        </Field>
        <Field>
          <Button type="submit" disabled={loading}>
            {loading ? "Entrando..." : "Login"}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  )
}
