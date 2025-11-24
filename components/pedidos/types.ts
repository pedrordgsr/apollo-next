export interface PedidoItem {
  produtoId: number
  qntd: number
  precoVendaUN: number
  precoCustoUN?: number
  produtoNome?: string
}

export interface PedidoFormData {
  tipo: "COMPRA" | "VENDA"
  vencimento: string
  formaPagamento: string
  idPessoa: number | string
  idFuncionario: number | string
  itens: PedidoItem[]
}

export interface Produto {
  id: number
  nome: string
  precoCusto: number
  precoVenda: number
  qntdEstoque: number
  status: string
}

export interface Pessoa {
  id: number
  nome: string
  tipo: string
}
