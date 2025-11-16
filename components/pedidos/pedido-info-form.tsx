import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Pessoa } from "./types"

interface PedidoInfoFormProps {
  formData: {
    tipo: "COMPRA" | "VENDA"
    vencimento: string
    formaPagamento: string
    idPessoa: number | string
    idFuncionario: number | string
  }
  pessoas: Pessoa[]
  funcionarioNome: string
  errors: Record<string, string>
  canEdit: boolean
  hasItems: boolean
  onFormChange: (data: Partial<PedidoInfoFormProps["formData"]>) => void
}

export function PedidoInfoForm({
  formData,
  pessoas,
  funcionarioNome,
  errors,
  canEdit,
  hasItems,
  onFormChange,
}: PedidoInfoFormProps) {
  return (
    <FieldGroup>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Field data-invalid={!!errors.tipo}>
          <FieldLabel htmlFor="tipo">Tipo *</FieldLabel>
          <FieldContent>
            <Select
              value={formData.tipo}
              onValueChange={(value: "COMPRA" | "VENDA") =>
                onFormChange({ tipo: value })
              }
              disabled={!canEdit || hasItems}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VENDA">Venda</SelectItem>
                <SelectItem value="COMPRA">Compra</SelectItem>
              </SelectContent>
            </Select>
            {errors.tipo && <FieldError>{errors.tipo}</FieldError>}
            {hasItems && canEdit && (
              <p className="text-xs text-muted-foreground mt-1">
                Remova os produtos para alterar o tipo
              </p>
            )}
          </FieldContent>
        </Field>

        <Field data-invalid={!!errors.vencimento}>
          <FieldLabel htmlFor="vencimento">Vencimento</FieldLabel>
          <FieldContent>
            <Input
              id="vencimento"
              type="datetime-local"
              value={formData.vencimento}
              onChange={(e) =>
                onFormChange({ vencimento: e.target.value })
              }
              disabled={!canEdit}
            />
          </FieldContent>
        </Field>
      </div>

      <Field data-invalid={!!errors.formaPagamento}>
        <FieldLabel htmlFor="formaPagamento">
          Forma de Pagamento *
        </FieldLabel>
        <FieldContent>
          <Input
            id="formaPagamento"
            value={formData.formaPagamento}
            onChange={(e) =>
              onFormChange({ formaPagamento: e.target.value })
            }
            placeholder="Ex: Dinheiro, Cartão de Crédito, PIX"
            disabled={!canEdit}
          />
          {errors.formaPagamento && (
            <FieldError>{errors.formaPagamento}</FieldError>
          )}
        </FieldContent>
      </Field>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Field data-invalid={!!errors.idPessoa}>
          <FieldLabel htmlFor="idPessoa">
            {formData.tipo === "COMPRA" ? "Fornecedor *" : "Cliente *"}
          </FieldLabel>
          <FieldContent>
            <Select
              value={formData.idPessoa.toString()}
              onValueChange={(value) =>
                onFormChange({ idPessoa: value })
              }
              disabled={!canEdit}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {pessoas
                  .filter((p) =>
                    formData.tipo === "COMPRA"
                      ? p.tipo === "FORNECEDOR"
                      : p.tipo === "CLIENTE"
                  )
                  .map((pessoa) => (
                    <SelectItem key={pessoa.id} value={pessoa.id.toString()}>
                      {pessoa.nome}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {errors.idPessoa && <FieldError>{errors.idPessoa}</FieldError>}
          </FieldContent>
        </Field>

        <Field data-invalid={!!errors.idFuncionario}>
          <FieldLabel htmlFor="idFuncionario">Funcionário *</FieldLabel>
          <FieldContent>
            <Input
              id="idFuncionario"
              value={funcionarioNome}
              disabled
              placeholder="Carregando..."
            />
            {errors.idFuncionario && (
              <FieldError>{errors.idFuncionario}</FieldError>
            )}
          </FieldContent>
        </Field>
      </div>
    </FieldGroup>
  )
}
