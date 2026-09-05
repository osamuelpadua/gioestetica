# GIO Estética — Harmonização Glútea

Landing page estática da Clínica Gio (Osasco). Sem build, sem dependências: é só HTML, CSS e um JS pequeno.

## Como abrir

- **Rápido:** dê duplo-clique em `index.html`.
- **Recomendado (evita bloqueios do navegador com caminhos locais):** rode um servidor estático na pasta:
  ```bash
  npx serve .
  ```
  e abra o endereço que aparecer (ex.: `http://localhost:3000`).

## Estrutura

```
gioestetica/
├─ index.html            ← página (só o markup)
├─ assets/
│  ├─ css/styles.css     ← todo o estilo
│  ├─ js/main.js         ← reveal-on-scroll (aparição ao rolar)
│  └─ img/               ← imagens em WebP (otimizadas)
├─ index-claro.html      ← versão antiga (1.4 MB, imagens embutidas) — backup
└─ README.md
```

A versão antiga carregava as imagens embutidas em base64 dentro do HTML (1.4 MB). Aqui as imagens
foram extraídas, otimizadas para WebP e reduzidas ao tamanho real de exibição — o conjunto de
imagens caiu para ~480 KB, com carregamento preguiçoso (`loading="lazy"`) e cache do navegador.

## O que ainda precisa ser preenchido

### 1. Número do WhatsApp
Todos os botões (CTA) já apontam para o número da clínica:

```
https://wa.me/551136568148   (+55 11 3656-8148)
```

Para trocar, busque `551136568148` em **`index.html`** e substitua todas as ocorrências pelo novo
número, no formato internacional sem símbolos. São 5 botões: hero, "o que pode melhorar", "como
funciona", galeria antes/depois e a chamada final.

Opcional: para já abrir com uma mensagem pronta, use
`https://wa.me/551136568148?text=Quero%20agendar%20minha%20avalia%C3%A7%C3%A3o`.

### 2. Vídeo do hero (opcional)
Hoje o topo usa uma imagem desfocada (`assets/img/hero-bg.webp`). Para usar um vídeo:
1. coloque o arquivo em `assets/video/hero.mp4`;
2. em `index.html`, na seção HERO, descomente a linha `<video ...>` e apague a `<div class="bg-frame"></div>`.

### 3. Depoimentos
A seção "Quem já fez" mostra 5 avaliações reais do Google (prints otimizados em
`assets/img/avaliacao-1..5.webp`, gerados a partir da pasta `depoimentos/`). Para trocar ou
acrescentar, otimize os novos prints para WebP e ajuste os `<img>` da seção em `index.html`.

## Regenerar/otimizar imagens

As imagens já estão prontas em `assets/img/`. Se um dia precisar reprocessá-las a partir de novos
originais, use [sharp](https://sharp.pixelplumbing.com/) (Node): redimensione para a largura de uso
(fundos ~1600px, fotos ~800px) e exporte em WebP com qualidade ~80.

## Os leads vão para o CRM

Quando alguém termina o formulário, o lead é gravado no **CRM da clínica**
(`crm.gioesteticaavosasco.com.br`, outro repositório) e aparece na primeira etapa do
funil. Antes disso, quem preenchia tudo e não chegava a enviar a mensagem no WhatsApp
sumia sem deixar rastro — e era justamente o lead mais valioso, o que já tinha se
qualificado sozinho.

A gravação é um `POST` direto no PostgREST do Supabase, em `enviarParaCRM()`
(`assets/js/main.js`). Sem SDK: a página inteira tem uns 4 KB de JavaScript e carregar
120 KB de biblioteca por uma requisição não se pagaria.

Três detalhes que parecem escolha de estilo e não são:

- **`Prefer: return=minimal` é obrigatório.** A chave pública tem permissão de INSERT em
  `leads` e não tem SELECT. Pedir a linha de volta faz o banco recusar a escrita inteira,
  com `permission denied for table leads`.
- **O WhatsApp abre antes da gravação, e sem `await` nenhum no meio.** Uma chamada de rede
  antes do `window.open` tira a abertura de dentro do gesto do clique, e o navegador passa
  a tratar como pop-up não pedido. A aba simplesmente não abre.
- **A gravação nunca lança.** Se o CRM estiver fora do ar, a visitante vai para o WhatsApp
  do mesmo jeito. Perder o registro é ruim; perder a conversa é pior.

O campo de WhatsApp no passo 4 existe por causa disso: o CRM gira em torno de "quem chamar
agora", e um lead sem número é um card que ninguém consegue trabalhar. O `PAGE_TAG` precisa
bater com a lista `PAGINAS` do CRM — o filtro "página que gerou o lead" compara texto exato.

### A chave no meio do código é pública de propósito

A `CRM_KEY` viaja dentro do JavaScript que qualquer visitante baixa. É assim que o Supabase
funciona e ela não é uma senha: com ela dá para fazer exatamente uma coisa, criar um lead
novo na primeira etapa, sem nenhum campo de dinheiro preenchido. Não lê lead, não lê
histórico, não lê faturamento. Quem garante isso é o Row Level Security, no banco.

O que **nunca** pode aparecer aqui é a `service_role`: ela ignora o RLS inteiro.
