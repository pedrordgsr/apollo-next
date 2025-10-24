import axios from "axios"

// Configure a URL base da sua API aqui
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

// Interceptor para adicionar o token em todas as requisições
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token")
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Tipos para o login
export interface LoginRequest {
  username: string
  senha: string
}

export interface LoginResponse {
  token: string
  type: string
  username: string
  usuarioId: number
  funcionarioId: number
}

// Função de login
export const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>("/api/auth/login", credentials)
  return response.data
}
