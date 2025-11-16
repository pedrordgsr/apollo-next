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

// Interceptor para lidar com respostas de erro (ex: token expirado)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token inválido ou expirado
      if (typeof window !== "undefined") {
        localStorage.removeItem("token")
        localStorage.removeItem("usuarioId")
        localStorage.removeItem("username")
        localStorage.removeItem("funcionarioId")
        localStorage.removeItem("isAdmin")
        
        // Redirecionar para login se não estiver na página de login
        if (!window.location.pathname.includes("/login") && window.location.pathname !== "/") {
          window.location.href = "/"
        }
      }
    }
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
  isAdmin: boolean
}

// Tipos para validação de token
export interface ValidateTokenResponse {
  valid: boolean
  username: string
  expiration: string
  message: string
}

// Função de login
export const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>("/auth/login", credentials)
  return response.data
}

// Função para validar token
export const validateToken = async (): Promise<ValidateTokenResponse> => {
  const response = await api.get<ValidateTokenResponse>("/auth/validate")
  return response.data
}
