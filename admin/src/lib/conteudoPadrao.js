// Espelho do conteúdo padrão do site (src/data/defaults.js no repositório do site).
//
// Por que existe: o painel abre com o que veio da API. Enquanto uma seção nunca
// foi publicada, ela volta vazia — e o operador veria caixas em branco em vez do
// texto que está no ar, sem saber o que está mudando. Este arquivo preenche esse
// vazio, seção por seção, só quando a API não trouxe nada para ela.
//
// Isto NÃO é a fonte da verdade: o site continua caindo nos próprios padrões se o
// content.json não tiver a chave. Ao editar defaults.js no site, atualize aqui.
// Gerado a partir de defaults.js — não editar à mão sem motivo.
//
// CUIDADO: o painel publica TODAS as seções de uma vez, e no site as listas são
// substituídas inteiras. Um espelho desatualizado não fica só feio no painel —
// ele REVERTE a seção correspondente do site na próxima publicação.

export const CONTEUDO_PADRAO = {
  "identidade": {
    "corPrimaria": "#1E4E79",
    "corSecundaria": "#DDEAF6",
    "logo": "/logo.png",
    "logoRodape": "/logo-claro.png"
  },
  "cabecalho": {
    "menu1": "A operação",
    "menu2": "Serviços",
    "menu3": "Acompanhamento",
    "menu4": "Clientes",
    "menu5": "Diferenciais",
    "menu6": "Contato",
    "textoBotao": "Solicitar orçamento"
  },
  "hero": {
    "badge": "São Roque/SP · há mais de 20 anos",
    "titulo": "Sua operação limpa, verde e protegida.",
    "tituloDestaque": "protegida",
    "subtitulo": "Limpeza profissional, paisagismo e controle de pragas para condomínios, empresas e indústrias — frentes conduzidas por um time só, sem repasse entre fornecedores.",
    "textoBotao1": "Solicitar orçamento",
    "textoBotao2": "Ver os serviços",
    "aviso": "Cada atendimento acompanhado em tempo real pelo portal do cliente",
    "pilares": [
      {
        "titulo": "Limpeza profissional",
        "desc": "Pós-obra, fachadas, pisos e caixa d'água",
        "alvo": "limpeza",
        "icone": "limpeza"
      },
      {
        "titulo": "Paisagismo",
        "desc": "Projetos, manutenção, poda e irrigação automatizada",
        "alvo": "paisagismo",
        "icone": "planta"
      },
      {
        "titulo": "Controle de pragas",
        "desc": "Dedetização, desratização e descupinização — ANVISA",
        "alvo": "dedetizacao",
        "icone": "escudo"
      }
    ],
    "estatisticas": [
      {
        "valor": "20+",
        "rotulo": "Anos de operação"
      },
      {
        "valor": "500+",
        "rotulo": "Clientes atendidos"
      },
      {
        "valor": "98%",
        "rotulo": "Índice de satisfação"
      },
      {
        "valor": "24h",
        "rotulo": "Urgências de pragas"
      }
    ]
  },
  "operacao": {
    "eyebrow": "A operação",
    "titulo": "Duas décadas fazendo o trabalho que só aparece quando falha.",
    "texto": "Limpeza, jardim e controle de pragas são serviços invisíveis quando bem executados. Foi mantendo essa invisibilidade em condomínios, empresas e indústrias da região que a Evolutionis chegou aos 20 anos.",
    "pontos": [
      {
        "titulo": "Um fornecedor, várias frentes",
        "texto": "Você trata com um interlocutor só. Sem repassar responsabilidade entre empresas quando o jardim precisa de poda no mesmo dia da dedetização."
      },
      {
        "titulo": "Equipe própria e treinada",
        "texto": "Times fixos por contrato, que conhecem o local e o padrão esperado — não uma equipe diferente a cada visita."
      },
      {
        "titulo": "Procedimentos e conformidade",
        "texto": "Produtos adequados a cada superfície e procedimentos de controle de pragas aprovados pela ANVISA."
      },
      {
        "titulo": "Visibilidade do que foi feito",
        "texto": "Cada atendimento é registrado e fica disponível para consulta — não é preciso ligar para saber se a equipe passou."
      }
    ]
  },
  "servicos": {
    "eyebrow": "Serviços",
    "titulo": "Quatro frentes, um único time.",
    "texto": "A rolagem controla o vídeo ao lado: cada serviço que você percorre avança a cena correspondente, mostrando o time em campo.",
    "itens": [
      {
        "chave": "paisagismo",
        "num": "01",
        "titulo": "Paisagismo",
        "rotulo": "Paisagismo",
        "legenda": "Poda técnica de cerca-viva",
        "desc": "Projeto, implantação e manutenção contínua de áreas verdes — poda técnica e irrigação automatizada para o jardim atravessar o ano inteiro bem.",
        "tags": [
          "Projetos",
          "Manutenção",
          "Poda",
          "Irrigação"
        ],
        "a": 0,
        "b": 1.708
      },
      {
        "chave": "dedetizacao",
        "num": "02",
        "titulo": "Dedetização",
        "rotulo": "Dedetização",
        "legenda": "Aplicação com equipamento de proteção",
        "desc": "Inspeção, aplicação e monitoramento com produtos e procedimentos aprovados pela ANVISA, e atendimento de urgência em 24h.",
        "tags": [
          "Inspeção",
          "Aplicação",
          "Monitoramento",
          "Urgência 24h"
        ],
        "a": 1.708,
        "b": 3.458
      },
      {
        "chave": "pragas",
        "num": "03",
        "titulo": "Controle de pragas",
        "rotulo": "Controle de pragas",
        "legenda": "Roedores, cupins e pragas urbanas",
        "desc": "Desratização, descupinização e manejo de pragas urbanas, com a mesma inspeção prévia e o monitoramento posterior à aplicação.",
        "tags": [
          "Desratização",
          "Descupinização",
          "Pragas urbanas"
        ]
      },
      {
        "chave": "limpeza",
        "num": "04",
        "titulo": "Limpeza profissional",
        "rotulo": "Limpeza profissional",
        "legenda": "Da entrega da obra à manutenção do dia a dia",
        "desc": "Conservação do ambiente construído de ponta a ponta — da entrega da obra à rotina de manutenção, com equipe treinada e equipamento próprio para cada superfície.",
        "especialidades": [
          {
            "titulo": "Pós-obra",
            "desc": "Retirada de resíduo fino, remoção de respingos e higienização completa — a obra entregue pronta para uso, sem etapa intermediária."
          },
          {
            "titulo": "Fachada",
            "desc": "Vidros, revestimentos e esquadrias em altura, com equipe treinada em trabalho vertical e equipamento de segurança certificado."
          },
          {
            "titulo": "Tratamento de piso",
            "desc": "Lavagem mecanizada, cristalização e impermeabilização — recupera o piso e prolonga o intervalo entre manutenções."
          },
          {
            "titulo": "Caixa d'água",
            "desc": "Higienização de reservatórios em shoppings, prédios comerciais e condomínios, com laudo e periodicidade dentro da norma."
          }
        ],
        "a": 3.458,
        "b": 10.416
      }
    ]
  },
  "acompanhamento": {
    "eyebrow": "Acompanhamento em tempo real",
    "titulo": "Você não precisa ligar para saber se a equipe passou.",
    "texto": "Nossa operação de campo é gerenciada pelo Field Control — e você recebe acesso ao portal do cliente, onde acompanha cada ordem de serviço em tempo real.",
    "itens": [
      {
        "titulo": "Status de cada atendimento",
        "texto": "Veja o que está agendado, em execução e concluído, sem depender de telefonema ou mensagem."
      },
      {
        "titulo": "Equipe a caminho",
        "texto": "Acompanhe o deslocamento do time da nossa base até o seu endereço, com horário de chegada."
      },
      {
        "titulo": "Histórico completo",
        "texto": "Todo serviço executado fica registrado — útil na prestação de contas em assembleia ou auditoria."
      },
      {
        "titulo": "Abertura de chamados",
        "texto": "Solicite um atendimento extra pelo próprio portal, sem passar por intermediário."
      }
    ],
    "ordens": [
      {
        "titulo": "Limpeza de áreas comuns",
        "detalhe": "Concluído · Bloco A",
        "hora": "08:40",
        "estado": "done"
      },
      {
        "titulo": "Poda e manutenção do jardim",
        "detalhe": "Em execução · equipe no local",
        "hora": "10:15",
        "estado": "now"
      },
      {
        "titulo": "Controle de pragas · garagem",
        "detalhe": "Agendado · equipe a caminho",
        "hora": "14:00",
        "estado": "next"
      },
      {
        "titulo": "Higienização de carpetes",
        "detalhe": "Agendado · salão de festas",
        "hora": "16:30",
        "estado": "next"
      }
    ]
  },
  "clientes": {
    "eyebrow": "Quem confia na Evolutionis",
    "titulo": "Condomínios, empresas e indústrias da região.",
    "texto": "Contratos de manutenção contínua em três perfis de cliente, cada um com exigências próprias de rotina, horário e conformidade.",
    "placeholder": true,
    "itens": [
      {
        "nome": "Alto da Serra",
        "setor": "Condomínio"
      },
      {
        "nome": "Jardim das Flores",
        "setor": "Condomínio"
      },
      {
        "nome": "Grupo Mailasqui",
        "setor": "Indústria"
      },
      {
        "nome": "Vale Verde",
        "setor": "Empresa"
      },
      {
        "nome": "Portal do Sol",
        "setor": "Condomínio"
      },
      {
        "nome": "Metalúrgica SR",
        "setor": "Indústria"
      },
      {
        "nome": "Centro Empresarial",
        "setor": "Empresa"
      },
      {
        "nome": "Residencial Aurora",
        "setor": "Condomínio"
      }
    ]
  },
  "diferenciais": {
    "eyebrow": "Diferenciais",
    "titulo": "O que muda ao contratar a Evolutionis.",
    "itens": [
      {
        "icone": "relogio",
        "titulo": "Pontualidade",
        "texto": "Cronograma acordado em contrato e cumprido — com o horário de cada visita registrado no portal."
      },
      {
        "icone": "escudo",
        "titulo": "Atendimento 24h",
        "texto": "Urgências de controle de pragas atendidas fora do horário comercial, inclusive fins de semana."
      },
      {
        "icone": "documento",
        "titulo": "Orçamento gratuito",
        "texto": "Visita técnica sem custo para dimensionar o serviço pelo que o local realmente precisa."
      },
      {
        "icone": "equipe",
        "titulo": "Equipe qualificada",
        "texto": "Profissionais treinados, com equipamento de proteção e procedimento definido."
      },
      {
        "icone": "local",
        "titulo": "Cobertura regional",
        "texto": "Base em São Roque, atendendo cidades da região."
      },
      {
        "icone": "folha",
        "titulo": "Sustentabilidade",
        "texto": "Produtos e práticas escolhidos para reduzir impacto ambiental sem abrir mão do resultado."
      }
    ]
  },
  "depoimentos": {
    "eyebrow": "Depoimentos",
    "titulo": "O que dizem quem convive com o serviço.",
    "placeholder": false,
    "itens": [
      {
        "texto": "A facilidade de acompanhar todos os atendimentos diretamente pelo aplicativo me proporciona muito mais segurança e transparência em relação aos serviços executados. Tenho, em tempo real, uma visão clara de tudo o que está sendo realizado, o que transmite ainda mais confiança no trabalho da Evolutionis Serviços.",
        "nome": "Jaraguá Shopping",
        "cargo": ""
      },
      {
        "texto": "A agilidade e a qualidade dos serviços prestados pela Evolutionis Serviços nos proporcionam a tranquilidade e a segurança de saber que tudo aquilo que foi contratado e prometido será realizado com excelência. É essa confiança no cumprimento dos compromissos que faz da Evolutionis Serviços uma parceira essencial para nós.",
        "nome": "Polo Shopping",
        "cargo": ""
      },
      {
        "texto": "O atendimento personalizado da Evolutionis Serviços nos proporciona tanta confiança e tranquilidade que não sentimos necessidade de buscar novos parceiros. A empresa consegue suprir todas as nossas necessidades com excelência, agilidade e um atendimento diferenciado.",
        "nome": "Flores de Lago",
        "cargo": ""
      },
      {
        "texto": "A facilidade de acompanhar todos os atendimentos diretamente pelo aplicativo me proporciona muito mais segurança e transparência em relação aos serviços executados. Tenho, em tempo real, uma visão clara de tudo o que está sendo realizado, o que transmite ainda mais confiança no trabalho da Evolutionis Serviços.",
        "nome": "Shopping Tivoli",
        "cargo": ""
      }
    ]
  },
  "contato": {
    "eyebrow": "Contato",
    "titulo": "Fale com a operação.",
    "texto": "Orçamento sem custo. Respondemos em horário comercial — e a qualquer hora em caso de urgência de pragas.",
    "whatsapp": "5511917513230",
    "whatsappVisivel": "(11) 91751-3230",
    "email": "comercial@evolutionis.com.br",
    "endereco": "Rua Borba Gato, 33",
    "bairro": "Mailasqui · São Roque/SP",
    "horario": "Segunda a sexta, 8h às 18h",
    "urgenciaTitulo": "Urgência de pragas",
    "urgenciaTexto": "Infestação fora do horário comercial? Atendemos 24h — chame no WhatsApp que acionamos a equipe de plantão.",
    "mapaEmbed": ""
  },
  "rodape": {
    "sobre": "Limpeza profissional, paisagismo e controle de pragas para condomínios, empresas e indústrias. Há mais de 20 anos em São Roque/SP.",
    "textoDireitos": "© 2026 Evolutionis Serviços Ltda. Todos os direitos reservados.",
    "instagram": "https://www.instagram.com/evolutionis_servicos",
    "linkedin": "https://www.linkedin.com/company/evolutionis-servico-ltda/",
    "facebook": ""
  },
  "seo": {
    "titulo": "Evolutionis Serviços | Limpeza, Paisagismo e Controle de Pragas",
    "descricao": "Há mais de 20 anos em limpeza profissional, paisagismo e controle de pragas para condomínios, empresas e indústrias em São Roque/SP. Acompanhe cada atendimento em tempo real.",
    "cidades": []
  }
};
