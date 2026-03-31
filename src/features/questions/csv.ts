import type { Question, Dificuldade, NivelEnsino, Origem, TipoResposta } from "../../types/app";

const CSV_HEADER = [
  "Pergunta",
  "Disciplina",
  "Dificuldade",
  "NivelEnsino",
  "TipoResposta",
  "OpcaoA",
  "OpcaoB",
  "OpcaoC",
  "OpcaoD",
  "OpcaoE",
  "RespostaCorreta",
  "Comentario",
  "Origem",
  "Tags",
].join(",");

function escapeCsv(value: string): string {
  const normalized = value.replace(/\r?\n/g, " ");
  if (normalized.includes('"') || normalized.includes(",") || normalized.includes(";")) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }
  return normalized;
}

export function buildQuestionsCsv(questions: Question[]): string {
  const rows = questions.map((q) => {
    const options = [q.opcoes[0] ?? "", q.opcoes[1] ?? "", q.opcoes[2] ?? "", q.opcoes[3] ?? "", q.opcoes[4] ?? ""];
    const tags = q.tags.join(", ");
    const columns = [
      q.pergunta,
      q.disciplina,
      q.dificuldade ?? "Médio",
      q.nivelEnsino,
      q.tipoResposta,
      options[0],
      options[1],
      options[2],
      options[3],
      options[4],
      q.respostaCorreta,
      q.comentario ?? "",
      q.origem,
      tags,
    ];

    return columns.map((c) => escapeCsv(c)).join(",");
  });

  return [CSV_HEADER, ...rows].join("\n");
}

export function getQuestionsCsvFilename(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const mi = String(now.getMinutes()).padStart(2, "0");
  return `questoes-backup-${yyyy}${mm}${dd}-${hh}${mi}.csv`;
}

function unescapeCsv(value: string): string {
  if (value.startsWith('"') && value.endsWith('"')) {
    return value.slice(1, -1).replace(/""/g, '"');
  }
  return value;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

function parseCsvRecords(csvContent: string): string[] {
  const records: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < csvContent.length; i++) {
    const char = csvContent[i];
    const nextChar = csvContent[i + 1];

    if (char === '"') {
      current += char;
      if (inQuotes && nextChar === '"') {
        current += nextChar;
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "\r") {
      continue;
    }

    if (char === "\n" && !inQuotes) {
      records.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  records.push(current);

  return records.filter((r) => r.trim().length > 0);
}

export interface ParseCsvResult {
  questions: Omit<Question, "id" | "dataCadastro">[];
  errors: string[];
}

export function parseQuestionsCsv(csvContent: string): ParseCsvResult {
  const lines = parseCsvRecords(csvContent);
  const questions: Omit<Question, "id" | "dataCadastro">[] = [];
  const errors: string[] = [];

  if (lines.length === 0) {
    errors.push("Arquivo CSV vazio.");
    return { questions, errors };
  }

  const headerLine = parseCsvLine(lines[0]);
  const expectedHeaders = [
    "Pergunta",
    "Disciplina",
    "Dificuldade",
    "NivelEnsino",
    "TipoResposta",
    "OpcaoA",
    "OpcaoB",
    "OpcaoC",
    "OpcaoD",
    "OpcaoE",
    "RespostaCorreta",
    "Comentario",
    "Origem",
    "Tags",
  ];

  if (headerLine.length !== expectedHeaders.length || !headerLine.every((h, i) => h === expectedHeaders[i])) {
    errors.push(`Cabeçalho inválido. Esperado: ${expectedHeaders.join(", ")}`);
    return { questions, errors };
  }

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const columns = parseCsvLine(line);
    if (columns.length !== expectedHeaders.length) {
      errors.push(`Linha ${i + 1}: esperava ${expectedHeaders.length} colunas, encontrou ${columns.length}.`);
      continue;
    }

    const [pergunta, disciplina, dificuldade, nivelEnsino, tipoRespostaRaw, opcaoA, opcaoB, opcaoC, opcaoD, opcaoE, respostaCorreta, comentario, origem, tagsStr] =
      columns.map((c) => unescapeCsv(c.trim()));

    const tipoResposta = (tipoRespostaRaw.trim() || "multipla-escolha") as TipoResposta;

    const perguntaTrim = pergunta.trim();
    if (!perguntaTrim) {
      errors.push(`Linha ${i + 1}: pergunta vazia.`);
      continue;
    }

    if (!disciplina.trim()) {
      errors.push(`Linha ${i + 1}: disciplina vazia.`);
      continue;
    }

    if (!respostaCorreta.trim()) {
      errors.push(`Linha ${i + 1}: resposta correta vazia.`);
      continue;
    }

    if (tipoResposta !== "multipla-escolha" && tipoResposta !== "verdadeiro-falso") {
      errors.push(`Linha ${i + 1}: tipoResposta inválido (${tipoResposta}).`);
      continue;
    }

    const opcoes = [opcaoA, opcaoB, opcaoC, opcaoD, opcaoE]
      .map((o) => o.trim())
      .filter((o) => o.length > 0);

    if (tipoResposta === "multipla-escolha" && opcoes.length < 2) {
      errors.push(`Linha ${i + 1}: tipo multipla-escolha requer ao menos 2 opções.`);
      continue;
    }

    if (tipoResposta === "multipla-escolha" && !opcoes.includes(respostaCorreta)) {
      errors.push(`Linha ${i + 1}: resposta correta não encontrada nas opções.`);
      continue;
    }

    if (tipoResposta === "verdadeiro-falso" && respostaCorreta !== "Verdadeiro" && respostaCorreta !== "Falso") {
      errors.push(`Linha ${i + 1}: resposta correta deve ser Verdadeiro ou Falso.`);
      continue;
    }

    const tags = tagsStr
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const question: Omit<Question, "id" | "dataCadastro"> = {
      pergunta: perguntaTrim,
      disciplina: disciplina.trim(),
      dificuldade: (dificuldade.trim() || "Médio") as Dificuldade,
      imagem: "",
      nivelEnsino: (nivelEnsino.trim() || "Fundamental") as NivelEnsino,
      tipoResposta,
      opcoes: tipoResposta === "multipla-escolha" ? opcoes : ["Verdadeiro", "Falso"],
      respostaCorreta: respostaCorreta.trim(),
      comentario: comentario.trim(),
      origem: (origem.trim() || "Livro") as Origem,
      tags,
    };

    questions.push(question);
  }

  return { questions, errors };
}
