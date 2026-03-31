import { describe, expect, it } from "vitest";
import { buildQuestionsCsv, getQuestionsCsvFilename, parseQuestionsCsv } from "./csv";

describe("questions csv export", () => {
  it("gera cabecalho e linha de questao com dificuldade", () => {
    const csv = buildQuestionsCsv([
      {
        id: "q1",
        pergunta: "Quanto e 2 + 2?",
        disciplina: "Matematica",
        dificuldade: "Fácil",
        nivelEnsino: "Fundamental",
        tipoResposta: "multipla-escolha",
        opcoes: ["3", "4", "5", "6", "7"],
        respostaCorreta: "4",
        comentario: "Soma basica",
        origem: "Livro",
        tags: ["soma", "basico"],
        dataCadastro: "2026-03-26",
      },
    ]);

    expect(csv.split("\n")[0]).toContain("Dificuldade");
    expect(csv.split("\n")[0]).toContain("OpcaoE");
    expect(csv).toContain("Fácil");
    expect(csv).toContain("soma, basico");
    expect(csv).toContain(",7,");
  });

  it("usa Medio como fallback para dificuldade ausente", () => {
    const csv = buildQuestionsCsv([
      {
        id: "q2",
        pergunta: "A Terra e o 3o planeta?",
        disciplina: "Ciencias",
        nivelEnsino: "Fundamental",
        tipoResposta: "verdadeiro-falso",
        opcoes: ["Verdadeiro", "Falso"],
        respostaCorreta: "Verdadeiro",
        origem: "Livro",
        tags: [],
        dataCadastro: "2026-03-26",
      },
    ]);

    expect(csv).toContain(",Médio,");
  });

  it("gera nome de arquivo de backup com prefixo esperado", () => {
    const name = getQuestionsCsvFilename();
    expect(name.startsWith("questoes-backup-")).toBe(true);
    expect(name.endsWith(".csv")).toBe(true);
  });
});

describe("questions csv import", () => {
  it("parse valido com uma questao", () => {
    const csv = `Pergunta,Disciplina,Dificuldade,NivelEnsino,TipoResposta,OpcaoA,OpcaoB,OpcaoC,OpcaoD,OpcaoE,RespostaCorreta,Comentario,Origem,Tags
Quanto e 2 + 2?,Matematica,Fácil,Fundamental,multipla-escolha,3,4,5,6,7,4,Soma basica,Livro,soma`;

    const result = parseQuestionsCsv(csv);
    expect(result.errors.length).toBe(0);
    expect(result.questions.length).toBe(1);
    expect(result.questions[0].pergunta).toBe("Quanto e 2 + 2?");
    expect(result.questions[0].disciplina).toBe("Matematica");
    expect(result.questions[0].opcoes).toContain("4");
    expect(result.questions[0].tags).toContain("soma");
  });

  it("rejeita cabecalho invalido", () => {
    const csv = `Pergunta,Discipl,Dificuldade,NivelEnsino,TipoResposta,OpcaoA,OpcaoB,OpcaoC,OpcaoD,OpcaoE,RespostaCorreta,Comentario,Origem,Tags
Quanto e 2 + 2?,Matematica,Fácil,Fundamental,multipla-escolha,3,4,5,6,7,4,Soma basica,Livro,soma`;

    const result = parseQuestionsCsv(csv);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.questions.length).toBe(0);
  });

  it("rejeita linha com colunas faltando", () => {
    const csv = `Pergunta,Disciplina,Dificuldade,NivelEnsino,TipoResposta,OpcaoA,OpcaoB,OpcaoC,OpcaoD,OpcaoE,RespostaCorreta,Comentario,Origem,Tags
Quanto e 2 + 2?,Matematica,Fácil,Fundamental,multipla-escolha,3,4,5,6`;

    const result = parseQuestionsCsv(csv);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.questions.length).toBe(0);
  });

  it("rejeita questao sem pergunta", () => {
    const csv = `Pergunta,Disciplina,Dificuldade,NivelEnsino,TipoResposta,OpcaoA,OpcaoB,OpcaoC,OpcaoD,OpcaoE,RespostaCorreta,Comentario,Origem,Tags
,Matematica,Fácil,Fundamental,multipla-escolha,3,4,5,6,7,4,Soma basica,Livro,soma`;

    const result = parseQuestionsCsv(csv);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.questions.length).toBe(0);
  });

  it("rejeita multipla-escolha com menos de 2 opcoes", () => {
    const csv = `Pergunta,Disciplina,Dificuldade,NivelEnsino,TipoResposta,OpcaoA,OpcaoB,OpcaoC,OpcaoD,OpcaoE,RespostaCorreta,Comentario,Origem,Tags
Quanto e 2 + 2?,Matematica,Fácil,Fundamental,multipla-escolha,3,,,,,3,Soma basica,Livro,soma`;

    const result = parseQuestionsCsv(csv);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.questions.length).toBe(0);
  });

  it("rejeita resposta correta fora das opcoes", () => {
    const csv = `Pergunta,Disciplina,Dificuldade,NivelEnsino,TipoResposta,OpcaoA,OpcaoB,OpcaoC,OpcaoD,OpcaoE,RespostaCorreta,Comentario,Origem,Tags
Quanto e 2 + 2?,Matematica,Fácil,Fundamental,multipla-escolha,3,4,5,6,7,999,Soma basica,Livro,soma`;

    const result = parseQuestionsCsv(csv);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.questions.length).toBe(0);
  });

  it("aceita pergunta multiline quando campo esta quoted", () => {
    const csv = `Pergunta,Disciplina,Dificuldade,NivelEnsino,TipoResposta,OpcaoA,OpcaoB,OpcaoC,OpcaoD,OpcaoE,RespostaCorreta,Comentario,Origem,Tags
"Enunciado com\nquebra de linha",Portugues,Médio,Médio,multipla-escolha,A,B,C,,,A,"Comentario com\n2 linhas",Livro,texto`;

    const result = parseQuestionsCsv(csv);
    expect(result.errors.length).toBe(0);
    expect(result.questions.length).toBe(1);
    expect(result.questions[0].pergunta).toContain("quebra de linha");
    expect(result.questions[0].comentario).toContain("2 linhas");
  });

  it("aceita aspas escapadas em campos quoted", () => {
    const csv = `Pergunta,Disciplina,Dificuldade,NivelEnsino,TipoResposta,OpcaoA,OpcaoB,OpcaoC,OpcaoD,OpcaoE,RespostaCorreta,Comentario,Origem,Tags
"Qual e o termo ""sujeito"" na frase?",Portugues,Fácil,Médio,multipla-escolha,Pronome,Sujeito,Verbo,,,Sujeito,"Uso de ""sujeito""",Livro,gramatica`;

    const result = parseQuestionsCsv(csv);
    expect(result.errors.length).toBe(0);
    expect(result.questions.length).toBe(1);
    expect(result.questions[0].pergunta).toContain('"sujeito"');
    expect(result.questions[0].comentario).toContain('"sujeito"');
  });

  it("rejeita verdadeiro-falso com resposta invalida", () => {
    const csv = `Pergunta,Disciplina,Dificuldade,NivelEnsino,TipoResposta,OpcaoA,OpcaoB,OpcaoC,OpcaoD,OpcaoE,RespostaCorreta,Comentario,Origem,Tags
A agua ferve a 100C?,Ciencias,Médio,Fundamental,verdadeiro-falso,,,,,,Talvez,,Livro,ciencia`;

    const result = parseQuestionsCsv(csv);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.questions.length).toBe(0);
  });

  it("importa arquivo grande com 1000 linhas", () => {
    const header =
      "Pergunta,Disciplina,Dificuldade,NivelEnsino,TipoResposta,OpcaoA,OpcaoB,OpcaoC,OpcaoD,OpcaoE,RespostaCorreta,Comentario,Origem,Tags";
    const rows = Array.from({ length: 1000 }, (_, idx) =>
      `Pergunta ${idx + 1},Matematica,Médio,Fundamental,multipla-escolha,1,2,3,,,2,,Livro,tag${idx + 1}`,
    );
    const csv = [header, ...rows].join("\n");

    const result = parseQuestionsCsv(csv);
    expect(result.errors.length).toBe(0);
    expect(result.questions.length).toBe(1000);
    expect(result.questions[999].pergunta).toBe("Pergunta 1000");
  });
});
