# Componentes de Pedidos

Esta pasta contém os componentes modulares utilizados na tela de cadastro/edição de pedidos.

## Componentes

### PedidoInfoForm
Formulário com os campos principais de informação do pedido (tipo, vencimento, forma de pagamento, cliente/fornecedor, funcionário).

**Props:**
- `formData`: Dados do formulário
- `pessoas`: Lista de clientes e fornecedores
- `funcionarioNome`: Nome do funcionário responsável
- `errors`: Objeto com erros de validação
- `canEdit`: Se o formulário pode ser editado
- `hasItems`: Se o pedido já possui itens
- `onFormChange`: Callback para atualizar os dados do formulário

### PedidoResumoCard
Card lateral com resumo do pedido (quantidade de itens, total) e botões de ação.

**Props:**
- `itemsCount`: Quantidade de itens no pedido
- `total`: Valor total do pedido
- `canEdit`: Se o pedido pode ser editado
- `isEditing`: Se está editando um pedido existente
- `isSubmitting`: Se está enviando o formulário
- `onSubmit`: Callback para submeter o formulário
- `onCancel`: Callback para cancelar

### PedidoItensTable
Tabela com os itens do pedido, mostrando produto, quantidade, preços e margem (para vendas).

**Props:**
- `items`: Lista de itens do pedido
- `tipo`: Tipo do pedido (COMPRA ou VENDA)
- `canEdit`: Se os itens podem ser removidos
- `onRemoveItem`: Callback para remover um item

### ProdutoSelectorDialog
Dialog para buscar e selecionar produtos, com campos de quantidade e preço. Calcula automaticamente a margem de lucro para vendas.

**Props:**
- `open`: Estado de abertura do dialog
- `onOpenChange`: Callback para controlar abertura/fechamento
- `produtos`: Lista de produtos disponíveis
- `tipo`: Tipo do pedido (COMPRA ou VENDA)
- `onConfirm`: Callback executado ao confirmar adição do produto

### generatePedidoPrintDocument
Função utilitária que gera o HTML para impressão do pedido.

**Parâmetros:**
- `pedidoId`: ID do pedido
- `formData`: Dados do formulário
- `pedidoStatus`: Status atual do pedido
- `pessoaNome`: Nome do cliente/fornecedor
- `funcionarioNome`: Nome do funcionário responsável

**Retorna:** String com HTML completo para impressão

## Estrutura

```
components/pedidos/
├── index.ts                      # Exports centralizados
├── pedido-info-form.tsx         # Formulário de informações
├── pedido-resumo-card.tsx       # Card de resumo
├── pedido-itens-table.tsx       # Tabela de itens
├── produto-selector-dialog.tsx  # Dialog de seleção de produtos
└── pedido-print-document.ts     # Gerador de documento de impressão
```

## Uso

```tsx
import {
  PedidoInfoForm,
  PedidoResumoCard,
  PedidoItensTable,
  ProdutoSelectorDialog,
  generatePedidoPrintDocument,
} from "@/components/pedidos"
```
