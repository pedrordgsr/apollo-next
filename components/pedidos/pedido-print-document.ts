import type { PedidoItem } from "./types"

interface GeneratePedidoPrintDocumentProps {
  pedidoId: string | null
  formData: {
    tipo: "COMPRA" | "VENDA"
    vencimento: string
    formaPagamento: string
    idPessoa: number | string
    itens: PedidoItem[]
  }
  pedidoStatus: string | null
  pessoaNome: string
  funcionarioNome: string
}

export function generatePedidoPrintDocument({
  pedidoId,
  formData,
  pedidoStatus,
  pessoaNome,
  funcionarioNome,
}: GeneratePedidoPrintDocumentProps): string {
  const date = new Date().toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
  const vencimento = formData.vencimento
    ? new Date(formData.vencimento).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "—"

  const statusColors: Record<string, string> = {
    ORCAMENTO: "#ca8a04",
    FATURADO: "#16a34a",
    CANCELADO: "#dc2626",
    NOTA_CANCELADA: "#ea580c",
  }

  const tipoColors: Record<string, string> = {
    COMPRA: "#2563eb",
    VENDA: "#16a34a",
  }

  const totalItens = formData.itens.reduce((sum, item) => sum + item.qntd, 0)
  const totalVenda = formData.itens.reduce(
    (total, item) => total + item.qntd * item.precoVendaUN,
    0
  )

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Pedido #${pedidoId || "Novo"}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: Arial, sans-serif;
            padding: 40px;
            color: #333;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: start;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #333;
          }
          .company-info h1 {
            font-size: 28px;
            margin-bottom: 5px;
          }
          .company-info p {
            font-size: 12px;
            color: #666;
          }
          .order-info {
            text-align: right;
          }
          .order-info h2 {
            font-size: 24px;
            margin-bottom: 10px;
          }
          .badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: bold;
            margin: 2px;
          }
          .section {
            margin-bottom: 25px;
          }
          .section-title {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 10px;
            text-transform: uppercase;
            color: #666;
          }
          .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
          }
          .info-item {
            font-size: 13px;
          }
          .info-item label {
            display: block;
            font-weight: bold;
            margin-bottom: 3px;
            color: #666;
          }
          .info-item value {
            display: block;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }
          th {
            background-color: #f5f5f5;
            padding: 10px;
            text-align: left;
            font-size: 12px;
            border: 1px solid #ddd;
          }
          td {
            padding: 10px;
            font-size: 12px;
            border: 1px solid #ddd;
          }
          .text-right {
            text-align: right;
          }
          .totals {
            margin-top: 20px;
            display: flex;
            justify-content: flex-end;
          }
          .totals-box {
            width: 300px;
            border: 1px solid #ddd;
          }
          .totals-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 15px;
            font-size: 13px;
            border-bottom: 1px solid #ddd;
          }
          .totals-row:last-child {
            border-bottom: none;
          }
          .totals-row.total {
            font-weight: bold;
            background-color: #f5f5f5;
            font-size: 14px;
          }
          .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            text-align: center;
            font-size: 11px;
            color: #666;
          }
          @media print {
            body {
              padding: 20px;
            }
            .no-print {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-info">
            <h1>Apollo System</h1>
            <p>Sistema de Gestão Empresarial</p>
          </div>
          <div class="order-info">
            <h2>Pedido #${pedidoId || "Novo"}</h2>
            <div>
              <span class="badge" style="background-color: ${tipoColors[formData.tipo]}20; color: ${tipoColors[formData.tipo]};">
                ${formData.tipo}
              </span>
              ${
                pedidoStatus
                  ? `
                <span class="badge" style="background-color: ${statusColors[pedidoStatus]}20; color: ${statusColors[pedidoStatus]};">
                  ${pedidoStatus}
                </span>
              `
                  : ""
              }
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Informações do Pedido</div>
          <div class="info-grid">
            <div class="info-item">
              <label>Data de Emissão:</label>
              <value>${date}</value>
            </div>
            <div class="info-item">
              <label>Vencimento:</label>
              <value>${vencimento}</value>
            </div>
            <div class="info-item">
              <label>${formData.tipo === "COMPRA" ? "Fornecedor" : "Cliente"}:</label>
              <value>${pessoaNome}</value>
            </div>
            <div class="info-item">
              <label>Funcionário Responsável:</label>
              <value>${funcionarioNome}</value>
            </div>
            <div class="info-item">
              <label>Forma de Pagamento:</label>
              <value>${formData.formaPagamento || "—"}</value>
            </div>
            <div class="info-item">
              <label>Total de Itens:</label>
              <value>${totalItens}</value>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Itens do Pedido</div>
          <table>
            <thead>
              <tr>
                <th>Produto</th>
                <th class="text-right">Qtd</th>
                <th class="text-right">Preço Unit.</th>
                <th class="text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${formData.itens
                .map(
                  (item) => `
                <tr>
                  <td>${item.produtoNome || `Produto ${item.produtoId}`}</td>
                  <td class="text-right">${item.qntd}</td>
                  <td class="text-right">R$ ${item.precoVendaUN.toFixed(2)}</td>
                  <td class="text-right">R$ ${(item.precoVendaUN * item.qntd).toFixed(2)}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>

          <div class="totals">
            <div class="totals-box">
              <div class="totals-row total">
                <span>TOTAL:</span>
                <span>R$ ${totalVenda.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="footer">
          <p>Documento gerado em ${new Date().toLocaleString("pt-BR")}</p>
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
    </html>
  `
}
