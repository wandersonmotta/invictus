import * as XLSX from "xlsx";
import { formatCPF } from "@/lib/cpf";
import { formatCNPJ } from "@/lib/cnpj";

interface ImportedNomeItem {
  tempId: string;
  person_name: string;
  document: string;
  whatsapp: string;
  fichaFile: null;
  identidadeFile: null;
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function formatDocument(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 11) return formatCPF(value);
  return formatCNPJ(value);
}

export function downloadTemplate() {
  const link = document.createElement("a");
  link.href = "/modelo-limpa-nome.xlsx";
  link.download = "modelo-limpa-nome.xlsx";
  link.click();
}

export function parseExcelFile(file: File): Promise<ImportedNomeItem[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Erro ao ler arquivo"));
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        if (!ws) { resolve([]); return; }

        const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

        // Skip header row
        const items: ImportedNomeItem[] = [];
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || !row[0]) continue;

          const name = String(row[0]).trim();
          if (!name) continue;

          const rawDoc = row[1] ? String(row[1]).trim() : "";
          const rawPhone = row[2] ? String(row[2]).trim() : "";

          const docDigits = rawDoc.replace(/\D/g, "");
          let formattedDoc = "";
          if (docDigits.length >= 11) {
            formattedDoc = formatDocument(rawDoc);
          } else if (docDigits) {
            formattedDoc = docDigits;
          }

          const phoneDigits = rawPhone.replace(/\D/g, "").slice(0, 11);
          const formattedPhone = phoneDigits ? formatPhone(phoneDigits) : "";

          items.push({
            tempId: crypto.randomUUID(),
            person_name: name,
            document: formattedDoc,
            whatsapp: phoneDigits ? `+55${phoneDigits}` : "",
            fichaFile: null,
            identidadeFile: null,
          });
        }

        resolve(items);
      } catch {
        reject(new Error("Erro ao processar planilha"));
      }
    };
    reader.readAsArrayBuffer(file);
  });
}
