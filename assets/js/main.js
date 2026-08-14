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
   FILTRO DE AGENDAMENTO
   Intercepta os CTAs e qualifica a lead antes de mandar pro WhatsApp:
   quem não consegue vir até Osasco e quem só faz por convênio recebe
   uma saída honesta em vez de entrar na fila do atendimento.
   ============================================================ */
(() => {
  const root = document.getElementById('quiz');
  if (!root) return;

  const WA = '551136568148';
  const card = root.querySelector('.quiz-card');
  const body = root.querySelector('#quizBody');
  const fill = root.querySelector('#quizFill');

  const steps = [
    {
      key: 'local',
      q: 'A avaliação é presencial, na nossa clínica em Osasco/SP. Você consegue vir até aqui?',
      note: 'A Gio fica no Rochdale, em Osasco. Todo protocolo começa com uma avaliação individual, feita pessoalmente pela equipe.',
      options: [
        { label: 'Sim, moro em Osasco ou região', value: 'Mora em Osasco ou região' },
        { label: 'Sim, venho de outra cidade', value: 'Vem de outra cidade' },
        { label: 'Não consigo ir presencialmente', value: 'Não consegue ir presencialmente', out: 'local' }
      ]
    },
    {
      key: 'caso',
      q: 'Sobre o seu caso, o que mais se aplica?',
      options: [
        { label: 'Emagreci e o bumbum perdeu volume', value: 'Emagreceu e perdeu volume' },
        { label: 'Treino, mas o formato e a projeção não vêm', value: 'Treina, mas falta formato e projeção' },
        { label: 'Não treino e quero volume e contorno', value: 'Não treina e quer volume e contorno' },
        { label: 'Flacidez, textura da pele ou diferença entre os lados', value: 'Flacidez, textura ou assimetria' }
      ]
    },
    {
      key: 'investimento',
      q: 'O atendimento na Gio é particular. Tudo certo seguir assim?',
      note: 'A gente não trabalha com convênio nem plano de saúde, porque procedimento estético não é coberto. Depois da avaliação, a equipe apresenta valores e formas de pagamento antes de qualquer decisão sua.',
      options: [
        { label: 'Sim, consigo seguir particular', value: 'Segue particular' },
        { label: 'Só faço se for pelo convênio', value: 'Só faria pelo convênio', out: 'convenio' }
      ]
    },
    {
      key: 'nome',
      type: 'name',
      q: 'Como a equipe da Gio pode te chamar?'
    }
  ];

  const outs = {
    local: {
      eyebrow: 'Obrigada pela sinceridade',
      title: 'Talvez a gente não seja o ideal pro seu caso agora.',
      text: 'Todos os nossos protocolos começam com uma avaliação presencial, aqui em Osasco/SP. Como você não consegue vir até a clínica, pode não ser o melhor momento. Mas se quiser tirar uma dúvida, a gente está aqui.'
    },
    convenio: {
      eyebrow: 'Obrigada pela sinceridade',
      title: 'Talvez a gente não seja o ideal pro seu caso agora.',
      text: 'Tudo bem. Como o atendimento é particular e nenhum convênio cobre procedimento estético, pode não ser o melhor momento pra você. Mas se quiser entender os valores ou tirar uma dúvida, a gente está aqui.'
    }
  };

  const answers = {};
  let idx = 0;        // passo atual
  let outKey = null;  // saída acionada, quando houver
  let viaOut = false; // insistiu depois de cair numa saída
  let lastFocus = null;

  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function waHref() {
    const linhas = [
      viaOut
        ? 'Olá! Vim pelo site da Gio e gostaria de tirar uma dúvida sobre a harmonização glútea.'
        : 'Olá! Vim pelo site da Gio e quero agendar minha avaliação de harmonização glútea.',
      ''
    ];
    const campos = [
      ['Nome', answers.nome],
      ['Deslocamento', answers.local],
      ['Meu caso', answers.caso],
      ['Atendimento particular', answers.investimento]
    ];
    campos.forEach(([rotulo, valor]) => { if (valor) linhas.push(rotulo + ': ' + valor); });
    return 'https://wa.me/' + WA + '?text=' + encodeURIComponent(linhas.join('\n'));
  }

  function setProgress(pct) { fill.style.width = pct + '%'; }

  function render() {
    // saída: perfil fora do que a clínica atende
    if (outKey) {
      const o = outs[outKey];
      setProgress(100);
      body.innerHTML =
        '<div class="quiz-step">' +
          '<p class="quiz-eyebrow">' + o.eyebrow + '</p>' +
          '<h2 class="quiz-title">' + o.title + '</h2>' +
          '<p class="quiz-note">' + o.text + '</p>' +
          '<button type="button" class="quiz-ghost" data-go="nome">Mesmo assim, quero falar</button>' +
        '</div>';
      focusFirst();
      return;
    }

    // tela final: manda pro WhatsApp com o resumo preenchido
    if (idx >= steps.length) {
      setProgress(100);
      const nome = answers.nome ? ', ' + esc(answers.nome) : '';
      body.innerHTML =
        '<div class="quiz-step">' +
          '<p class="quiz-eyebrow">' + (viaOut ? 'Combinado' : 'Tudo certo') + '</p>' +
          '<h2 class="quiz-title">' + (viaOut ? 'Vamos conversar' + nome + '.' : 'Perfeito' + nome + '!') + '</h2>' +
          '<p class="quiz-note">' + (viaOut
            ? 'Vou te levar pro WhatsApp pra equipe entender melhor o seu caso e te dizer com sinceridade o que dá pra fazer.'
            : 'Seu caso tem o perfil que a gente atende. Vou te levar pro WhatsApp pra equipe confirmar o melhor horário da sua avaliação.') + '</p>' +
          '<div class="quiz-form">' +
            '<a class="cta quiz-cta" href="' + waHref() + '" target="_blank" rel="noopener">' +
              '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.15a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.18 8.18 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.14.16-.29.18-.54.06-.25-.13-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.43.13-.15.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.13-.56-1.35-.77-1.84-.2-.48-.4-.42-.56-.43h-.47c-.17 0-.43.06-.66.31-.22.25-.87.85-.87 2.07 0 1.22.89 2.4 1.02 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.14-1.18-.06-.11-.22-.17-.47-.29Z"/></svg>' +
              'Falar no WhatsApp' +
            '</a>' +
          '</div>' +
        '</div>';
      focusFirst();
      return;
    }

    const s = steps[idx];
    setProgress(Math.round((idx / steps.length) * 100));

    let html =
      '<div class="quiz-step">' +
        '<p class="quiz-eyebrow">Passo ' + (idx + 1) + ' de ' + steps.length + '</p>' +
        '<h2 class="quiz-title">' + s.q + '</h2>' +
        (s.note ? '<p class="quiz-note">' + s.note + '</p>' : '');

    if (s.type === 'name') {
      html +=
        '<form class="quiz-form" novalidate>' +
          '<input class="quiz-field" type="text" name="nome" placeholder="Seu primeiro nome" autocomplete="given-name" maxlength="40" aria-label="Seu primeiro nome">' +
          '<button type="submit" class="cta quiz-cta">Continuar' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>' +
          '</button>' +
        '</form>';
    } else {
      html += '<div class="quiz-opts">' +
        s.options.map((o, i) => '<button type="button" class="quiz-opt" data-opt="' + i + '">' + o.label + '</button>').join('') +
        '</div>';
    }

    if (idx > 0 && !viaOut) html += '<button type="button" class="quiz-back" data-back>Voltar</button>';
    body.innerHTML = html + '</div>';
    focusFirst();
  }

  function focusFirst() {
    const el = body.querySelector('.quiz-opt, .quiz-field, .quiz-ghost, .cta');
    if (el) el.focus({ preventScroll: true });
  }

  // ---- interações dentro do card ----
  body.addEventListener('click', e => {
    const opt = e.target.closest('[data-opt]');
    if (opt) {
      const choice = steps[idx].options[+opt.dataset.opt];
      answers[steps[idx].key] = choice.value;
      if (choice.out) outKey = choice.out;
      else idx++;
      render();
      return;
    }

    if (e.target.closest('[data-go="nome"]')) {   // "mesmo assim, quero falar"
      outKey = null;
      viaOut = true;
      idx = steps.findIndex(s => s.type === 'name');
      render();
      return;
    }

    if (e.target.closest('[data-back]')) {
      idx = Math.max(0, idx - 1);
      render();
    }
  });

  body.addEventListener('submit', e => {
    e.preventDefault();
    const field = e.target.querySelector('.quiz-field');
    const nome = field.value.trim();
    if (nome.length < 2) {
      field.focus();
      if (!e.target.querySelector('.quiz-err')) {
        field.insertAdjacentHTML('afterend', '<p class="quiz-err">Escreve seu nome pra gente te chamar direito.</p>');
      }
      return;
    }
    answers.nome = nome;
    idx = steps.length;
    render();
  });

  // ---- abrir / fechar ----
  function open(e) {
    if (e) e.preventDefault();
    lastFocus = document.activeElement;
    idx = 0; outKey = null; viaOut = false;
    Object.keys(answers).forEach(k => delete answers[k]);
    root.hidden = false;
    document.body.style.overflow = 'hidden';
    setProgress(0);
    render();
    requestAnimationFrame(() => root.classList.add('is-open'));
  }

  function close() {
    root.classList.remove('is-open');
    document.body.style.overflow = '';
    setTimeout(() => { root.hidden = true; }, 280);
    if (lastFocus) lastFocus.focus({ preventScroll: true });
  }

  document.querySelectorAll('a.cta[href*="wa.me"]').forEach(a => a.addEventListener('click', open));
  root.querySelectorAll('[data-quiz-close]').forEach(el => el.addEventListener('click', close));

  document.addEventListener('keydown', e => {
    if (root.hidden) return;
    if (e.key === 'Escape') { close(); return; }
    if (e.key !== 'Tab') return;

    // prende o foco dentro do card enquanto o modal está aberto
    const f = card.querySelectorAll('button, [href], input');
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
})();
