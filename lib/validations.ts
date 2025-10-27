import { z } from "zod"

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

// Schema para Cliente
export const clienteSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  tipoPessoa: z.enum(["FISICA", "JURIDICA"]),
  cpfcnpj: z.string().min(1, "CPF/CNPJ é obrigatório"),
  ie: z.string().optional(),
  email: z.string().optional(),
  telefone: z.string().optional(),
  genero: z.enum(["MASCULINO", "FEMININO", "NAO_INFORMAR"]),
  endereco: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  uf: z.string().max(2, "UF deve ter no máximo 2 caracteres").optional(),
  cep: z.string().optional(),
}).refine((data) => {
  const cpfCnpjLimpo = data.cpfcnpj.replace(/\D/g, "")
  
  if (data.tipoPessoa === "FISICA") {
    if (cpfCnpjLimpo.length !== 11) {
      return false
    }
    return validarCPF(cpfCnpjLimpo)
  }
  
  if (data.tipoPessoa === "JURIDICA") {
    if (cpfCnpjLimpo.length !== 14) {
      return false
    }
    return validarCNPJ(cpfCnpjLimpo)
  }
  
  return true
}, {
  message: "CPF/CNPJ inválido",
  path: ["cpfcnpj"],
})

export type ClienteFormData = z.infer<typeof clienteSchema>

// Schema para Fornecedor
export const fornecedorSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  tipoPessoa: z.enum(["FISICA", "JURIDICA"]),
  cpfcnpj: z.string().min(1, "CPF/CNPJ é obrigatório"),
  ie: z.string().optional(),
  email: z.string().optional(),
  telefone: z.string().optional(),
  tipoFornecedor: z.string().min(1, "O tipo de fornecedor é obrigatório"),
  endereco: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  uf: z.string().max(2, "UF deve ter no máximo 2 caracteres").optional(),
  cep: z.string().optional(),
}).refine((data) => {
  const cpfCnpjLimpo = data.cpfcnpj.replace(/\D/g, "")
  
  if (data.tipoPessoa === "FISICA") {
    if (cpfCnpjLimpo.length !== 11) {
      return false
    }
    return validarCPF(cpfCnpjLimpo)
  }
  
  if (data.tipoPessoa === "JURIDICA") {
    if (cpfCnpjLimpo.length !== 14) {
      return false
    }
    return validarCNPJ(cpfCnpjLimpo)
  }
  
  return true
}, {
  message: "CPF/CNPJ inválido",
  path: ["cpfcnpj"],
})

export type FornecedorFormData = z.infer<typeof fornecedorSchema>

// Schema para Funcionário
export const funcionarioSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  cpfcnpj: z.string().min(1, "CPF é obrigatório"),
  email: z.string().optional(),
  telefone: z.string().optional(),
  endereco: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  uf: z.string().max(2, "UF deve ter no máximo 2 caracteres").optional(),
  cep: z.string().optional(),
  cargo: z.string().min(1, "Cargo é obrigatório"),
  salario: z.string().min(1, "Salário é obrigatório").refine((val) => {
    const num = parseFloat(val)
    return !isNaN(num) && num > 0
  }, "Salário deve ser maior que zero"),
  dataAdmissao: z.string().min(1, "Data de admissão é obrigatória").refine((val) => {
    // Valida formato dd/mm/yyyy
    const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/
    if (!regex.test(val)) return false
    
    const [, dia, mes, ano] = val.match(regex) || []
    if (!dia || !mes || !ano) return false
    
    const diaNum = parseInt(dia)
    const mesNum = parseInt(mes)
    const anoNum = parseInt(ano)
    
    if (mesNum < 1 || mesNum > 12) return false
    if (diaNum < 1 || diaNum > 31) return false
    if (anoNum < 1900 || anoNum > 2100) return false
    
    return true
  }, "Data inválida. Use o formato dd/mm/yyyy"),
}).refine((data) => {
  const cpfLimpo = data.cpfcnpj.replace(/\D/g, "")
  
  if (cpfLimpo.length !== 11) {
    return false
  }
  
  return validarCPF(cpfLimpo)
}, {
  message: "CPF inválido",
  path: ["cpfcnpj"],
})

export type FuncionarioFormData = z.infer<typeof funcionarioSchema>

// Schema para Produto
export const produtoSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  descricao: z.string().min(1, "Descrição é obrigatória"),
  precoCusto: z.number().positive("Preço de custo deve ser maior que zero"),
  precoVenda: z.number().positive("Preço de venda deve ser maior que zero"),
}).refine((data) => data.precoVenda >= data.precoCusto, {
  message: "Preço de venda não pode ser menor que o preço de custo",
  path: ["precoVenda"],
})

export type ProdutoFormData = z.infer<typeof produtoSchema>
