import type { Dificuldade, Discipline, NivelEnsino, Origem, Question, Screen, User } from "../types/app";

export const LEVELS_ED: NivelEnsino[] = ["Fundamental", "Médio", "Superior"];
export const DIFFICULTIES: Dificuldade[] = ["Fácil", "Médio", "Difícil"];
export const ORIGINS: Origem[] = ["Livro", "ENEM", "Vestibular", "Universidade", "Concurso", "Outro"];
export const EMOJI_LIST = ["📐","⚡","🧪","🧬","📜","🌍","✍️","🔬","🎨","🎵","💻","🏛️","📖","🔢","🌱","⚗️","🧮","📊","🗺️","🎭","📡","🏺","🔭","💡","🧠","🎓","📝","🏆","🌐","💊","⚖️","🎯","🔐","🏗️","🎸","🎬","🍎","🧲","🌊","🦁","🚀","🌙","🏔️","🌿","🎹","🎲","📱","🔑","🦋","🐋","🌺","🏖️","🌈","⭐","🔥","💎","🌸","🦊"];
export const COLOR_LIST = ["#4dabf7","#74c0fc","#ffd60a","#ffec5c","#00e5a0","#69db7c","#da77f2","#f093fb","#ff9a5c","#ff6b35","#ff8787","#ff4757","#20c997","#38d9a9","#a9e34b","#748ffc","#5c7cfa","#f783ac","#ff922b","#63e6be","#c0eb75","#faa2c1"];
export const AV_GRADS = ["linear-gradient(135deg,#ff6b35,#ff9a5c)","linear-gradient(135deg,#4dabf7,#74c0fc)","linear-gradient(135deg,#00e5a0,#69db7c)","linear-gradient(135deg,#da77f2,#f093fb)","linear-gradient(135deg,#ffd60a,#ffec5c)"];
export const NAV_ITEMS: Array<[Screen, string, string]> = [["home","🏠","Início"],["disciplines","🎓","Disciplinas"],["leaderboard","🏆","Ranking"],["questions","📚","Questões"],["profile","👤","Perfil"]];

export const DEFAULT_DISCS: Discipline[] = [
  {id:"d1",name:"Matemática",icon:"📐",color:"#4dabf7",builtin:true},
  {id:"d2",name:"Física",icon:"⚡",color:"#ffd60a",builtin:true},
  {id:"d3",name:"Química",icon:"🧪",color:"#00e5a0",builtin:true},
  {id:"d4",name:"Biologia",icon:"🧬",color:"#69db7c",builtin:true},
  {id:"d5",name:"História",icon:"📜",color:"#ff9a5c",builtin:true},
  {id:"d6",name:"Geografia",icon:"🌍",color:"#20c997",builtin:true},
  {id:"d7",name:"Português",icon:"✍️",color:"#da77f2",builtin:true},
  {id:"d8",name:"Ciências",icon:"🔬",color:"#74c0fc",builtin:true},
];

export const INIT_QUESTIONS: Question[] = [
  {id:"q1",pergunta:"Qual é o valor de x em 2x + 4 = 12?",disciplina:"Matemática",nivelEnsino:"Médio",tipoResposta:"multipla-escolha",opcoes:["x = 3","x = 4","x = 5","x = 6"],respostaCorreta:"x = 4",comentario:"2x = 8, logo x = 4.",origem:"Livro",tags:["álgebra"],dataCadastro:"2024-01-15"},
  {id:"q2",pergunta:"π é aproximadamente 3,14159?",disciplina:"Matemática",nivelEnsino:"Médio",tipoResposta:"verdadeiro-falso",opcoes:["Verdadeiro","Falso"],respostaCorreta:"Verdadeiro",comentario:"Pi ≈ 3,14159…",origem:"Livro",tags:["geometria"],dataCadastro:"2024-01-15"},
  {id:"q3",pergunta:"Fórmula da área do círculo?",disciplina:"Matemática",nivelEnsino:"Médio",tipoResposta:"multipla-escolha",opcoes:["A=2πr","A=πr²","A=πd","A=2πr²"],respostaCorreta:"A=πr²",comentario:"A=πr², r é o raio.",origem:"ENEM",tags:["geometria"],dataCadastro:"2024-01-16"},
  {id:"q4",pergunta:"Unidade de força no SI?",disciplina:"Física",nivelEnsino:"Médio",tipoResposta:"multipla-escolha",opcoes:["Joule","Watt","Newton","Pascal"],respostaCorreta:"Newton",comentario:"Força = Newton (N).",origem:"ENEM",tags:["dinâmica"],dataCadastro:"2024-01-17"},
  {id:"q5",pergunta:"Velocidade da luz ≈ 300.000 km/s?",disciplina:"Física",nivelEnsino:"Médio",tipoResposta:"verdadeiro-falso",opcoes:["Verdadeiro","Falso"],respostaCorreta:"Verdadeiro",comentario:"c ≈ 299.792 km/s.",origem:"Livro",tags:["luz"],dataCadastro:"2024-01-17"},
  {id:"q6",pergunta:"Ano da proclamação da República?",disciplina:"História",nivelEnsino:"Médio",tipoResposta:"multipla-escolha",opcoes:["1822","1888","1889","1891"],respostaCorreta:"1889",comentario:"15 nov 1889.",origem:"ENEM",tags:["brasil"],dataCadastro:"2024-01-18"},
  {id:"q7",pergunta:"Revolução Francesa ocorreu no séc. XIX?",disciplina:"História",nivelEnsino:"Médio",tipoResposta:"verdadeiro-falso",opcoes:["Verdadeiro","Falso"],respostaCorreta:"Falso",comentario:"1789 = séc. XVIII.",origem:"Livro",tags:["França"],dataCadastro:"2024-01-18"},
  {id:"q8",pergunta:"Gás absorvido na fotossíntese?",disciplina:"Ciências",nivelEnsino:"Fundamental",tipoResposta:"multipla-escolha",opcoes:["Oxigênio","Nitrogênio","CO₂","Hidrogênio"],respostaCorreta:"CO₂",comentario:"Plantas absorvem CO₂.",origem:"Livro",tags:["fotossíntese"],dataCadastro:"2024-01-19"},
  {id:"q9",pergunta:"Terra é 3º planeta a partir do Sol?",disciplina:"Ciências",nivelEnsino:"Fundamental",tipoResposta:"verdadeiro-falso",opcoes:["Verdadeiro","Falso"],respostaCorreta:"Verdadeiro",comentario:"Mercúrio, Vênus, Terra…",origem:"Livro",tags:["planetas"],dataCadastro:"2024-01-19"},
  {id:"q10",pergunta:"Figura de linguagem com 'como' ou 'tal qual'?",disciplina:"Português",nivelEnsino:"Médio",tipoResposta:"multipla-escolha",opcoes:["Metáfora","Metonímia","Símile","Hipérbole"],respostaCorreta:"Símile",comentario:"Símile usa termos comparativos.",origem:"ENEM",tags:["figuras"],dataCadastro:"2024-01-20"},
  {id:"q11",pergunta:"Estrutura que sintetiza proteínas?",disciplina:"Biologia",nivelEnsino:"Superior",tipoResposta:"multipla-escolha",opcoes:["Mitocôndria","Ribossomo","Núcleo","Retículo"],respostaCorreta:"Ribossomo",comentario:"Ribossomos traduzem RNA.",origem:"Universidade",tags:["célula"],dataCadastro:"2024-01-21"},
  {id:"q12",pergunta:"ATP é a molécula energética das células?",disciplina:"Biologia",nivelEnsino:"Superior",tipoResposta:"verdadeiro-falso",opcoes:["Verdadeiro","Falso"],respostaCorreta:"Verdadeiro",comentario:"ATP = moeda energética.",origem:"Universidade",tags:["metabolismo"],dataCadastro:"2024-01-21"},
  {id:"q13",pergunta:"Símbolo químico do Ouro?",disciplina:"Química",nivelEnsino:"Médio",tipoResposta:"multipla-escolha",opcoes:["Go","Or","Au","Ag"],respostaCorreta:"Au",comentario:"Au = Aurum (latim).",origem:"ENEM",tags:["tabela periódica"],dataCadastro:"2024-01-22"},
  {id:"q14",pergunta:"H₂O tem 2 H e 1 O?",disciplina:"Química",nivelEnsino:"Médio",tipoResposta:"verdadeiro-falso",opcoes:["Verdadeiro","Falso"],respostaCorreta:"Verdadeiro",comentario:"H₂O: 2H + 1O.",origem:"Livro",tags:["moléculas"],dataCadastro:"2024-01-22"},
  {id:"q15",pergunta:"25% de 200?",disciplina:"Matemática",nivelEnsino:"Fundamental",tipoResposta:"multipla-escolha",opcoes:["25","40","50","75"],respostaCorreta:"50",comentario:"200 × 0,25 = 50.",origem:"Livro",tags:["porcentagem"],dataCadastro:"2024-01-23"},
  {id:"q16",pergunta:"Planeta Vermelho?",disciplina:"Ciências",nivelEnsino:"Fundamental",tipoResposta:"multipla-escolha",opcoes:["Vênus","Júpiter","Marte","Saturno"],respostaCorreta:"Marte",comentario:"Marte tem óxido de ferro.",origem:"Livro",tags:["planetas"],dataCadastro:"2024-01-24"},
  {id:"q17",pergunta:"Autor de 'Dom Casmurro'?",disciplina:"Português",nivelEnsino:"Médio",tipoResposta:"multipla-escolha",opcoes:["José de Alencar","Eça de Queirós","Machado de Assis","Lima Barreto"],respostaCorreta:"Machado de Assis",comentario:"Dom Casmurro, 1899.",origem:"ENEM",tags:["literatura"],dataCadastro:"2024-01-25"},
];

export const INIT_USERS: User[] = [
  {id:"u1",nome:"Ana Silva",email:"ana@demo.com",pwdHash:"-1520573439",pontuacao:850,respostasCertas:92,respostasErradas:15},
  {id:"u2",nome:"Carlos Mendes",email:"carlos@demo.com",pwdHash:"-1520573439",pontuacao:720,respostasCertas:75,respostasErradas:22},
  {id:"u3",nome:"Beatriz Costa",email:"beatriz@demo.com",pwdHash:"-1520573439",pontuacao:640,respostasCertas:68,respostasErradas:18},
  {id:"u4",nome:"Diego Ferreira",email:"diego@demo.com",pwdHash:"-1520573439",pontuacao:430,respostasCertas:47,respostasErradas:31},
];

export const BADGES: Array<{id:string; icon:string; name:string; desc:string}> = [
  {id:"first_correct",icon:"🎯",name:"Primeiro Passo",desc:"Primeira resposta correta"},
  {id:"perfect_session",icon:"💎",name:"Sessão Perfeita",desc:"100% de acerto em uma sessão"},
  {id:"century",icon:"💯",name:"Centurião",desc:"100 respostas corretas no total"},
  {id:"streak_3",icon:"🔥",name:"Em Chamas",desc:"3 dias seguidos estudando"},
  {id:"streak_7",icon:"⚡",name:"Imparável",desc:"7 dias seguidos estudando"},
  {id:"level_5",icon:"⭐",name:"Veterano",desc:"Alcançou o Nível 5"},
  {id:"level_10",icon:"🏆",name:"Mestre",desc:"Alcançou o Nível 10"},
  {id:"speed_demon",icon:"🚀",name:"Relâmpago",desc:"Respondeu corretamente em menos de 5s"},
  {id:"bookworm",icon:"📖",name:"Estudioso",desc:"Favoritou 10 questões"},
  {id:"all_disciplines",icon:"🌐",name:"Enciclopédia",desc:"Estudou todas as disciplinas disponíveis"},
];
