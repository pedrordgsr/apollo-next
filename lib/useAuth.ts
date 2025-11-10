"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

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
  const loading = false

  const setUserData = (userData: User) => {
    localStorage.setItem("token", userData.token)
    localStorage.setItem("usuarioId", userData.usuarioId.toString())
    localStorage.setItem("username", userData.username)
    localStorage.setItem("funcionarioId", userData.funcionarioId.toString())
    localStorage.setItem("isAdmin", userData.isAdmin.toString())
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("usuarioId")
    localStorage.removeItem("username")
    localStorage.removeItem("funcionarioId")
    localStorage.removeItem("isAdmin")
    setUser(null)
    router.push("/")
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
