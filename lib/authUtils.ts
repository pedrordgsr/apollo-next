import { validateToken } from "./api"

/**
 * Verifica se o token atual é válido
 * @returns Promise com o resultado da validação
 */
export async function checkTokenValidity() {
  try {
    const validation = await validateToken()
    return {
      isValid: validation.valid,
      username: validation.username,
      expiration: validation.expiration,
      message: validation.message,
    }
  } catch (error) {
    console.error("Erro ao validar token:", error)
    return {
      isValid: false,
      username: null,
      expiration: null,
      message: "Erro ao validar token",
    }
  }
}

/**
 * Verifica se o token expira em breve (menos de 5 minutos)
 * @param expirationDate Data de expiração do token
 * @returns true se o token expira em breve
 */
export function isTokenExpiringSoon(expirationDate: string): boolean {
  const expiration = new Date(expirationDate)
  const now = new Date()
  const fiveMinutes = 5 * 60 * 1000 // 5 minutos em milissegundos
  
  return expiration.getTime() - now.getTime() < fiveMinutes
}

/**
 * Formata a data de expiração para exibição
 * @param expirationDate Data de expiração do token
 * @returns String formatada com a data de expiração
 */
export function formatExpiration(expirationDate: string): string {
  const expiration = new Date(expirationDate)
  return expiration.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}
