"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface User {
  token: string
  usuarioId: number
  username: string
  funcionarioId: number
}

export function useAuth() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === "undefined") return null
    
    const token = localStorage.getItem("token")
    const usuarioId = localStorage.getItem("usuarioId")
    const username = localStorage.getItem("username")
    const funcionarioId = localStorage.getItem("funcionarioId")

    if (token && usuarioId && username && funcionarioId) {
      return {
        token,
        usuarioId: parseInt(usuarioId),
        username,
        funcionarioId: parseInt(funcionarioId),
      }
    }
    return null
  })
  const loading = false

  const logout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("usuarioId")
    localStorage.removeItem("username")
    localStorage.removeItem("funcionarioId")
    setUser(null)
    router.push("/")
  }

  const isAuthenticated = !!user

  return {
    user,
    loading,
    isAuthenticated,
    logout,
  }
}
