// Revela os elementos .rv conforme entram na viewport (reveal-on-scroll).
const io = new IntersectionObserver(es => {
  es.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('in');
      io.unobserve(e.target);
    }
  });
}, { threshold: .12 });

document.querySelectorAll('.rv').forEach(el => io.observe(el));


/* ============================================================
   FORM DE AGENDAMENTO (modal em etapas)
   ============================================================ */

const WA_NUMBER = "551136568148";
/* Precisa bater com a lista PAGINAS do CRM (assets/js/crm-data.js, no outro
   repositório): o filtro "página que gerou o lead" compara texto exato. */
const PAGE_TAG  = document.title.includes("claro") ? "LP clara" : "LP Harmonização Glútea";

/* === O CRM DA CLÍNICA ===
   Estas duas linhas são públicas de propósito e podem ficar no Git. A chave
   viaja dentro do JavaScript que qualquer visitante baixa — é assim que o
   Supabase funciona, e ela não é uma senha.

   Com ela, um estranho consegue exatamente uma coisa: criar um lead novo, na
   primeira etapa, sem nenhum campo de dinheiro preenchido. Não lê lead, não lê
   histórico, não lê faturamento. Quem garante isso é o Row Level Security do
   banco, não o segredo da chave. */
const CRM_URL = "https://supabase.samuelpadua.com.br";
const CRM_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzg4NTAwNDQwLCJleHAiOjIxMDM4NjA0NDB9.Yhud6oCcpYkrX2KM4ghlY9eOI6mGMnBWuNgE3X7RDus";

const fmOv = document.getElementById('fmOv');
const steps = [...document.querySelectorAll('.fm-step')];
const answers = {};
let cur = 1;

function show(n){
  cur = n;
  steps.forEach(s=>s.hidden = +s.dataset.step !== n);
  fmOv.querySelector('.fm').scrollTop = 0;
}
function openForm(){ answers.local=answers.invest=answers.agenda=undefined; show(1); fmOv.classList.add('open'); document.body.style.overflow='hidden'; }
function closeForm(){ fmOv.classList.remove('open'); document.body.style.overflow=''; }

document.querySelectorAll('a.cta[href*="wa.me"], a.cta[data-open-form]').forEach(a=>{
  a.addEventListener('click', e=>{ e.preventDefault(); openForm(); });
});
document.getElementById('fmX').addEventListener('click', closeForm);
fmOv.addEventListener('click', e=>{ if(e.target===fmOv) closeForm(); });
document.addEventListener('keydown', e=>{ if(e.key==='Escape') closeForm(); });

document.querySelectorAll('.fm-opt').forEach(b=>b.addEventListener('click', ()=>{
  answers[b.dataset.k] = b.dataset.v;
  if(b.dataset.dq){ show(6); return; }
  show(cur+1);
}));
document.querySelectorAll('.fm-back').forEach(b=>b.addEventListener('click', ()=>show(cur-1)));


/* ============================================================
   O TELEFONE
   ------------------------------------------------------------
   É o único dado do formulário sem o qual o lead não serve pra
   nada: o CRM inteiro gira em torno de "quem chamar agora", e um
   card sem número é um card que ninguém consegue trabalhar.
   ============================================================ */

/* Mesma regra do CRM (crm-store.js › normalizarWhatsapp). Os dois lados
   precisam gravar o número do mesmo jeito, senão a busca por telefone
   durante o atendimento não encontra o lead que veio do site. */
function normalizarWhatsapp(valor){
  const d = String(valor||'').replace(/\D/g,'');
  if(!d) return '';
  if(d.length >= 12 && d.indexOf('55') === 0) return d;   // já veio com 55 na frente
  if(d.length === 10 || d.length === 11) return '55' + d;
  return d;
}

function mascararTelefone(valor){
  const d = String(valor||'').replace(/\D/g,'').slice(0,11);
  if(d.length <= 2)  return d;
  if(d.length <= 6)  return '('+d.slice(0,2)+') '+d.slice(2);
  if(d.length <= 10) return '('+d.slice(0,2)+') '+d.slice(2,6)+'-'+d.slice(6);
  return '('+d.slice(0,2)+') '+d.slice(2,7)+'-'+d.slice(7);
}

const fmZap = document.getElementById('fmZap');
fmZap.addEventListener('input', ()=>{ fmZap.value = mascararTelefone(fmZap.value); });


/* ============================================================
   A ENTREGA PRO CRM
   ------------------------------------------------------------
   Insert direto no PostgREST, sem SDK: a landing inteira tem uns
   4 KB de JavaScript e carregar 120 KB de biblioteca por uma
   requisição não se paga.

   'Prefer: return=minimal' não é gosto, é obrigatório. A chave
   anônima tem INSERT em leads e não tem SELECT — pedir a linha de
   volta faria o banco recusar a escrita inteira.

   E nunca lança: se o CRM estiver fora do ar, a visitante vai pro
   WhatsApp do mesmo jeito. Perder o registro é ruim; perder a
   conversa é pior.
   ============================================================ */

/* A resposta de investimento é o critério de qualificação combinado na
   reunião. Mesma regra do crmStore.capturarDaLanding(), no CRM. */
function prioridadeDoLead(invest){
  if(!invest) return 'media';
  if(invest.indexOf('Pronta pra investir') === 0) return 'alta';
  if(invest.indexOf('APENAS') === 0) return 'baixa';
  return 'media';
}

function enviarParaCRM(nome, whatsapp, respostas){
  return fetch(CRM_URL + '/rest/v1/leads', {
    method: 'POST',
    headers: {
      'apikey': CRM_KEY,
      'Authorization': 'Bearer ' + CRM_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    /* Os campos que faltam aqui não estão esquecidos. Etapa e status são o que
       a política do banco exige; o resto (agendou, compareceu, follow-ups,
       observações, valores) fica no padrão da tabela de propósito — é
       exatamente o que a política confere pra impedir que alguém de posse da
       chave crie um lead já "fechado" e polua o faturamento do painel. */
    body: JSON.stringify({
      nome: nome,
      whatsapp: whatsapp,
      origem: 'Tráfego pago · Meta',
      campanha: '—',
      pagina_origem: PAGE_TAG,
      produto_interesse: 'Harmonização Glútea · Essencial',
      respostas_formulario: respostas,
      prioridade: prioridadeDoLead(respostas.invest),
      proxima_abordagem: 'Primeiro contato. Lead acabou de chegar pelo formulário.',
      etapa: 'novo',
      status: 'ativo'
    })
  }).then(r=>{
    if(!r.ok) return r.text().then(t=>console.warn('[CRM] lead não gravado ('+r.status+'):', t));
  }).catch(e=>{ console.warn('[CRM] lead não gravado:', e); });
}


document.getElementById('fmSend').addEventListener('click', ()=>{
  const nome = document.getElementById('fmNome').value.trim();
  const err  = document.getElementById('fmErr');

  function recusar(texto){ err.textContent = texto; err.style.display = 'block'; }

  if(nome.length < 2){ recusar('Me conta seu nome pra gente continuar.'); return; }

  const whatsapp = normalizarWhatsapp(fmZap.value);
  /* 12 ou 13 dígitos = 55 + DDD + o número (fixo ou celular). A política do
     banco aceita de 10 a 15; aqui é mais apertado de propósito, pra segurar o
     número digitado pela metade antes de ele virar um card inútil no CRM. */
  if(whatsapp.length < 12 || whatsapp.length > 13){
    recusar('Confere o WhatsApp com o DDD, por favor. Ex.: (11) 99999-9999');
    return;
  }
  err.style.display = 'none';

  const respostas = {
    local:  answers.local  || '',
    invest: answers.invest || '',
    agenda: answers.agenda || ''
  };

  const msg = encodeURIComponent(
    'Oi! Me chamo '+nome+' e quero agendar minha avaliação de harmonização glútea.\n'+
    'Local: '+respostas.local+'\nInvestimento: '+respostas.invest+'\nAgenda: '+respostas.agenda
  );
  const waUrl = 'https://wa.me/'+WA_NUMBER+'?text='+msg;
  document.getElementById('fmWa').href = waUrl;

  /* O WhatsApp abre PRIMEIRO, e sem nenhum await antes. Uma chamada de rede no
     meio tira o window.open de dentro do gesto do clique, e o navegador passa a
     tratar como pop-up não pedido — a aba simplesmente não abre. Se mesmo assim
     for bloqueada, o passo 5 tem o link com o mesmo endereço. */
  window.open(waUrl,'_blank');

  /* Campo-isca preenchido: robô. Vai pro WhatsApp, não vai pro CRM. */
  if(!document.getElementById('fmSite').value){
    enviarParaCRM(nome, whatsapp, respostas);
  }

  show(5);
});
