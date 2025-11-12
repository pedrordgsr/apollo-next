"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { validateToken } from "./api"

interface User {
  token: string
  usuarioId: number
  username: string
  funcionarioId: number
  isAdmin: boolean
}

export function useAuth() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === "undefined") return null
    
    const token = localStorage.getItem("token")
    const usuarioId = localStorage.getItem("usuarioId")
    const username = localStorage.getItem("username")
    const funcionarioId = localStorage.getItem("funcionarioId")
    const isAdmin = localStorage.getItem("isAdmin")

    if (token && usuarioId && username && funcionarioId) {
      return {
        token,
        usuarioId: parseInt(usuarioId),
        username,
        funcionarioId: parseInt(funcionarioId),
        isAdmin: isAdmin === "true",
      }
    }
    return null
  })
  const [loading, setLoading] = useState(true)

  const logout = useCallback(() => {
    localStorage.removeItem("token")
    localStorage.removeItem("usuarioId")
    localStorage.removeItem("username")
    localStorage.removeItem("funcionarioId")
    localStorage.removeItem("isAdmin")
    setUser(null)
    router.push("/")
  }, [router])

  // Validar token ao carregar o hook
  useEffect(() => {
    const checkToken = async () => {
      if (user?.token) {
        try {
          const validation = await validateToken()
          if (!validation.valid) {
            // Token inválido, fazer logout
            logout()
          }
        } catch (error) {
          // Erro na validação, fazer logout
          console.error("Erro ao validar token:", error)
          logout()
        }
      }
      setLoading(false)
    }

    checkToken()
  }, [user?.token, logout]) // Executa ao montar e quando o token mudar

  const setUserData = (userData: User) => {
    localStorage.setItem("token", userData.token)
    localStorage.setItem("usuarioId", userData.usuarioId.toString())
    localStorage.setItem("username", userData.username)
    localStorage.setItem("funcionarioId", userData.funcionarioId.toString())
    localStorage.setItem("isAdmin", userData.isAdmin.toString())
    setUser(userData)
  }

  const isAuthenticated = !!user

  return {
    user,
    loading,
    isAuthenticated,
    setUserData,
    logout,
  }
}
