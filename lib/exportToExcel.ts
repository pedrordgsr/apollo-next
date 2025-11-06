import * as XLSX from 'xlsx';

/**
 * Exporta dados para um arquivo Excel (.xlsx)
 * @param data - Array de objetos com os dados a serem exportados
 * @param filename - Nome do arquivo (sem extensão)
 * @param sheetName - Nome da planilha (opcional, padrão: "Dados")
 */
export function exportToExcel<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  sheetName: string = "Dados"
) {
  try {
    // Cria uma nova workbook
    const workbook = XLSX.utils.book_new();
    
    // Converte os dados para uma worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // Adiciona a worksheet ao workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    
    // Gera o arquivo e faz o download
    XLSX.writeFile(workbook, `${filename}.xlsx`);
    
    return true;
  } catch (error) {
    console.error("Erro ao exportar para Excel:", error);
    return false;
  }
}

/**
 * Formata os dados da tabela para exportação, removendo campos indesejados
 * @param data - Array de dados da tabela
 * @param excludeFields - Campos a serem excluídos da exportação
 */
export function prepareDataForExport<T extends Record<string, unknown>>(
  data: T[],
  excludeFields: string[] = []
): Record<string, unknown>[] {
  return data.map(item => {
    const newItem: Record<string, unknown> = {};
    
    Object.keys(item).forEach(key => {
      if (!excludeFields.includes(key)) {
        newItem[key] = item[key];
      }
    });
    
    return newItem;
  });
}
