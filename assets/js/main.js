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

/* === CONFIG ===
   1) URL do Apps Script (ver instrucoes-formulario.md). Enquanto vazio, o lead segue pro WhatsApp normalmente. */
const SCRIPT_URL = "";
const WA_NUMBER  = "551136568148";
const PAGE_TAG   = document.title.includes("claro") ? "LP clara" : "LP harmonização glútea";

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

document.getElementById('fmSend').addEventListener('click', async ()=>{
  const nome = document.getElementById('fmNome').value.trim();
  const err  = document.getElementById('fmErr');
  if(nome.length<2){ err.style.display='block'; return; }
  err.style.display='none';
  const btn = document.getElementById('fmSend');
  btn.disabled = true; btn.textContent = 'Abrindo o WhatsApp...';

  const payload = new URLSearchParams({
    nome, whatsapp: '',
    local: answers.local||'', invest: answers.invest||'', agenda: answers.agenda||'',
    origem: PAGE_TAG
  });
  if(SCRIPT_URL){
    try{ await fetch(SCRIPT_URL,{method:'POST',mode:'no-cors',body:payload}); }catch(e){}
  }
  const msg = encodeURIComponent(
    'Oi! Me chamo '+nome+' e quero agendar minha avaliação de harmonização glútea.\n'+
    'Local: '+(answers.local||'')+'\nInvestimento: '+(answers.invest||'')+'\nAgenda: '+(answers.agenda||'')
  );
  const waUrl = 'https://wa.me/'+WA_NUMBER+'?text='+msg;
  document.getElementById('fmWa').href = waUrl;
  window.open(waUrl,'_blank');
  btn.disabled = false; btn.textContent = 'Agendar pelo WhatsApp';
  show(5);
});
