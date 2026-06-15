/* =========================================
   TECH SOLUTIONS — CENTRAL DE CHAMADOS
   app.js — CRUD completo com localStorage
   ========================================= */
 
'use strict';
 
/* ─── STATE ─── */
let chamados = JSON.parse(localStorage.getItem('ts_chamados') || '[]');
let currentId = parseInt(localStorage.getItem('ts_nextId') || '1', 10);
let deletingId = null;
let viewingId  = null;
 
/* ─── DOM REFS ─── */
const tbody          = document.getElementById('tickets-tbody');
const emptyState     = document.getElementById('empty-state');
const modalOverlay   = document.getElementById('modal-overlay');
const viewOverlay    = document.getElementById('view-overlay');
const deleteOverlay  = document.getElementById('delete-overlay');
const form           = document.getElementById('chamado-form');
const formError      = document.getElementById('form-error');
const formErrorText  = document.getElementById('form-error-text');
const modalTitle     = document.getElementById('modal-title');
const modalSubtitle  = document.getElementById('modal-subtitle');
const btnSubmitText  = document.getElementById('btn-submit-text');
const deleteIdSpan   = document.getElementById('delete-chamado-id');
const searchInput    = document.getElementById('search-input');
const filterPrio     = document.getElementById('filter-prioridade');
const filterClass    = document.getElementById('filter-classificacao');
const toast          = document.getElementById('toast');
const toastText      = document.getElementById('toast-text');
 
/* ─── UTILS ─── */
function save() {
  localStorage.setItem('ts_chamados', JSON.stringify(chamados));
  localStorage.setItem('ts_nextId', String(currentId));
}
 
function genId() {
  const id = `TS-${String(currentId).padStart(4, '0')}`;
  currentId++;
  return id;
}
 
function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}
 
function showToast(msg, isError = false) {
  toastText.textContent = msg;
  toast.className = 'toast' + (isError ? ' toast--error' : '');
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3000);
}
 
function escHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
 
/* ─── PRIORITY HELPERS ─── */
const PRIO_CLASS = {
  'Crítica': 'critica',
  'Alta':    'alta',
  'Média':   'media',
  'Baixa':   'baixa',
};
 
function prioBadge(prioridade) {
  const cls = PRIO_CLASS[prioridade] || 'baixa';
  return `<span class="badge badge--${cls}">${escHtml(prioridade)}</span>`;
}
 
/* ─── STATS ─── */
function updateStats() {
  document.getElementById('count-total').textContent   = chamados.length;
  document.getElementById('count-critica').textContent = chamados.filter(c => c.prioridade === 'Crítica').length;
  document.getElementById('count-alta').textContent    = chamados.filter(c => c.prioridade === 'Alta').length;
  document.getElementById('count-media').textContent   = chamados.filter(c => c.prioridade === 'Média').length;
  document.getElementById('count-baixa').textContent   = chamados.filter(c => c.prioridade === 'Baixa').length;
}
 
/* ─── RENDER TABLE ─── */
function render() {
  const q     = searchInput.value.toLowerCase().trim();
  const prio  = filterPrio.value;
  const classf = filterClass.value;
 
  let list = chamados.slice().sort((a, b) => {
    const order = { 'Crítica': 0, 'Alta': 1, 'Média': 2, 'Baixa': 3 };
    return (order[a.prioridade] ?? 9) - (order[b.prioridade] ?? 9);
  });
 
  if (q) {
    list = list.filter(c =>
      c.id.toLowerCase().includes(q) ||
      c.classificacao.toLowerCase().includes(q) ||
      c.impacto.toLowerCase().includes(q) ||
      (c.causa || '').toLowerCase().includes(q) ||
      (c.setor || '').toLowerCase().includes(q)
    );
  }
  if (prio)  list = list.filter(c => c.prioridade === prio);
  if (classf) list = list.filter(c => c.classificacao === classf);
 
  if (list.length === 0) {
    tbody.innerHTML = '';
    emptyState.style.display = '';
    updateStats();
    return;
  }
 
  emptyState.style.display = 'none';
 
  tbody.innerHTML = list.map(c => `
    <tr data-id="${escHtml(c.id)}">
      <td><span class="ticket-id">${escHtml(c.id)}</span></td>
      <td><span class="classif-badge">${escHtml(c.classificacao)}</span></td>
      <td>${prioBadge(c.prioridade)}</td>
      <td class="td-impacto">${escHtml(c.impacto)}</td>
      <td class="td-causa" title="${escHtml(c.causa)}">${escHtml(c.causa || '—')}</td>
      <td class="td-tempo">${escHtml(c.tempo)}</td>
      <td class="td-data">${formatDate(c.criadoEm)}</td>
      <td>
        <div class="td-acoes">
          <button class="action-btn action-btn--view" data-action="view" data-id="${escHtml(c.id)}" title="Ver detalhes">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="3" stroke="currentColor" stroke-width="1.5"/><path d="M1 8C2.5 4 5 2 8 2s5.5 2 7 6c-1.5 4-4 6-7 6s-5.5-2-7-6z" stroke="currentColor" stroke-width="1.5"/></svg>
          </button>
          <button class="action-btn action-btn--edit" data-action="edit" data-id="${escHtml(c.id)}" title="Editar">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M11 2l3 3-9 9H2v-3L11 2z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>
          </button>
          <button class="action-btn action-btn--del" data-action="delete" data-id="${escHtml(c.id)}" title="Excluir">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 10h8l1-10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
 
  updateStats();
}
 
/* ─── OPEN MODAL (CREATE / EDIT) ─── */
function openModal(chamado = null) {
  form.reset();
  formError.classList.add('hidden');
 
  if (chamado) {
    modalTitle.textContent    = 'Editar Chamado';
    modalSubtitle.textContent = `Editando ${chamado.id}`;
    btnSubmitText.textContent = 'Salvar Alterações';
 
    document.getElementById('field-id').value              = chamado.id;
    document.getElementById('field-classificacao').value   = chamado.classificacao;
    document.getElementById('field-prioridade').value      = chamado.prioridade;
    document.getElementById('field-impacto').value         = chamado.impacto;
    document.getElementById('field-causa').value           = chamado.causa || '';
    document.getElementById('field-diagnostico').value     = chamado.diagnostico || '';
    document.getElementById('field-solucao').value         = chamado.solucao || '';
    document.getElementById('field-tempo').value           = chamado.tempo;
    document.getElementById('field-setor').value           = chamado.setor || '';
  } else {
    modalTitle.textContent    = 'Novo Chamado';
    modalSubtitle.textContent = 'Preencha os campos abaixo para registrar o chamado';
    btnSubmitText.textContent = 'Registrar Chamado';
    document.getElementById('field-id').value = '';
  }
 
  modalOverlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}
 
function closeModal() {
  modalOverlay.classList.add('hidden');
  document.body.style.overflow = '';
}
 
/* ─── VIEW MODAL ─── */
function openView(id) {
  const c = chamados.find(x => x.id === id);
  if (!c) return;
  viewingId = id;
 
  document.getElementById('view-id-badge').textContent = c.id;
  document.getElementById('view-title').textContent    = `${c.classificacao} — ${c.prioridade}`;
 
  const fields = [
    { label: 'Classificação',                  value: c.classificacao },
    { label: 'Prioridade',                     value: c.prioridade, badge: true },
    { label: 'Impacto',                        value: c.impacto,    full: true },
    { label: 'Setor Solicitante',              value: c.setor || null },
    { label: 'Tempo Estimado de Atendimento',  value: c.tempo },
    { label: 'Aberto em',                      value: formatDate(c.criadoEm) },
    { label: 'Possível Causa',                 value: c.causa,       full: true },
    { label: 'Procedimentos de Diagnóstico',   value: c.diagnostico, full: true },
    { label: 'Solução Proposta',               value: c.solucao,     full: true },
  ];
 
  document.getElementById('view-body').innerHTML = fields.map(f => {
    const empty = !f.value;
    const cls   = ['view-field', f.full ? 'view-field--full' : ''].join(' ').trim();
    let val;
    if (empty) {
      val = `<div class="view-field-value view-field-value--empty">Não informado</div>`;
    } else if (f.badge) {
      val = `<div class="view-field-value">${prioBadge(f.value)}</div>`;
    } else {
      val = `<div class="view-field-value">${escHtml(f.value)}</div>`;
    }
    return `<div class="${cls}"><div class="view-field-label">${f.label}</div>${val}</div>`;
  }).join('');
 
  viewOverlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}
 
function closeView() {
  viewOverlay.classList.add('hidden');
  document.body.style.overflow = '';
  viewingId = null;
}
 
/* ─── DELETE MODAL ─── */
function openDelete(id) {
  deletingId = id;
  deleteIdSpan.textContent = id;
  deleteOverlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}
 
function closeDelete() {
  deleteOverlay.classList.add('hidden');
  document.body.style.overflow = '';
  deletingId = null;
}
 
/* ─── FORM SUBMIT ─── */
form.addEventListener('submit', e => {
  e.preventDefault();
  formError.classList.add('hidden');
 
  const id            = document.getElementById('field-id').value.trim();
  const classificacao = document.getElementById('field-classificacao').value;
  const prioridade    = document.getElementById('field-prioridade').value;
  const impacto       = document.getElementById('field-impacto').value;
  const causa         = document.getElementById('field-causa').value.trim();
  const diagnostico   = document.getElementById('field-diagnostico').value.trim();
  const solucao       = document.getElementById('field-solucao').value.trim();
  const tempo         = document.getElementById('field-tempo').value;
  const setor         = document.getElementById('field-setor').value.trim();
 
  // Validate required fields
  if (!classificacao || !prioridade || !impacto || !causa || !tempo) {
    formErrorText.textContent = 'Preencha todos os campos obrigatórios (*).';
    formError.classList.remove('hidden');
    formError.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    return;
  }
 
  if (id) {
    // EDIT
    const idx = chamados.findIndex(c => c.id === id);
    if (idx !== -1) {
      chamados[idx] = { ...chamados[idx], classificacao, prioridade, impacto, causa, diagnostico, solucao, tempo, setor };
      save();
      render();
      closeModal();
      showToast(`Chamado ${id} atualizado com sucesso.`);
    }
  } else {
    // CREATE
    const newChamado = {
      id: genId(),
      classificacao,
      prioridade,
      impacto,
      causa,
      diagnostico,
      solucao,
      tempo,
      setor,
      criadoEm: new Date().toISOString(),
    };
    chamados.push(newChamado);
    save();
    render();
    closeModal();
    showToast(`Chamado ${newChamado.id} registrado com sucesso!`);
  }
});
 
/* ─── EVENT DELEGATION: TABLE ACTIONS ─── */
tbody.addEventListener('click', e => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const action = btn.dataset.action;
  const id     = btn.dataset.id;
 
  if (action === 'view')   openView(id);
  if (action === 'edit')   openModal(chamados.find(c => c.id === id));
  if (action === 'delete') openDelete(id);
});
 
/* ─── BUTTON EVENTS ─── */
document.getElementById('btn-novo-chamado').addEventListener('click', () => openModal());
document.getElementById('btn-close-modal').addEventListener('click', closeModal);
document.getElementById('btn-cancel').addEventListener('click', closeModal);
 
document.getElementById('btn-close-view').addEventListener('click', closeView);
document.getElementById('btn-close-view-2').addEventListener('click', closeView);
document.getElementById('btn-edit-from-view').addEventListener('click', () => {
  const c = chamados.find(x => x.id === viewingId);
  closeView();
  if (c) openModal(c);
});
 
document.getElementById('btn-close-delete').addEventListener('click', closeDelete);
document.getElementById('btn-cancel-delete').addEventListener('click', closeDelete);
document.getElementById('btn-confirm-delete').addEventListener('click', () => {
  if (!deletingId) return;
  chamados = chamados.filter(c => c.id !== deletingId);
  save();
  render();
  showToast(`Chamado ${deletingId} excluído.`, false);
  closeDelete();
});
 
/* ─── CLOSE ON OVERLAY CLICK ─── */
[
  { overlay: modalOverlay,  close: closeModal  },
  { overlay: viewOverlay,   close: closeView   },
  { overlay: deleteOverlay, close: closeDelete },
].forEach(({ overlay, close }) => {
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
});
 
/* ─── CLOSE ON ESC ─── */
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (!modalOverlay.classList.contains('hidden'))  closeModal();
  if (!viewOverlay.classList.contains('hidden'))   closeView();
  if (!deleteOverlay.classList.contains('hidden')) closeDelete();
});
 
/* ─── FILTERS ─── */
searchInput.addEventListener('input',   render);
filterPrio.addEventListener('change',   render);
filterClass.addEventListener('change',  render);
 
/* ─── SEED DATA (first load only) ─── */
function seedIfEmpty() {
  if (chamados.length > 0) return;
 
  const seeds = [
    {
      classificacao: 'Incidente',
      prioridade: 'Crítica',
      impacto: 'Crítico — Empresa toda',
      causa: 'Servidor de autenticação não responde após queda de energia.',
      diagnostico: 'Verificar logs do servidor. Checar UPS e link de rede. Testar conectividade VPN.',
      solucao: 'Reinicializar serviço de autenticação. Acionar fornecedor do nobreak.',
      tempo: '< 1 hora',
      setor: 'TI / Infraestrutura',
    },
    {
      classificacao: 'Incidente',
      prioridade: 'Alta',
      impacto: 'Alto — Múltiplos setores',
      causa: 'E-mails corporativos não estão sendo entregues — possível bloqueio de relay.',
      diagnostico: 'Verificar filas no servidor de e-mail. Checar blacklists de IP. Analisar logs SMTP.',
      solucao: 'Limpar fila de mensagens. Solicitar remoção de blacklist. Verificar configurações SPF/DKIM.',
      tempo: '1–4 horas',
      setor: 'Suporte',
    },
    {
      classificacao: 'Problema',
      prioridade: 'Média',
      impacto: 'Médio — Um setor',
      causa: 'Lentidão no ERP do setor Financeiro após atualização de módulo.',
      diagnostico: 'Analisar queries lentas no banco. Verificar índices. Comparar performance pré/pós atualização.',
      solucao: 'Reindexar tabelas afetadas. Reverter atualização se necessário. Abrir chamado com fornecedor.',
      tempo: '4–8 horas',
      setor: 'Financeiro',
    },
    {
      classificacao: 'Requisição',
      prioridade: 'Baixa',
      impacto: 'Baixo — Usuário único',
      causa: 'Usuário solicita troca de equipamento — notebook com defeito na bateria.',
      diagnostico: 'Confirmar modelo e número de série. Verificar estoque de substitutos.',
      solucao: 'Provisionar equipamento reserva. Encaminhar notebook para reparo ou descarte.',
      tempo: '1–2 dias',
      setor: 'RH',
    },
  ];
 
  seeds.forEach(s => {
    chamados.push({ id: genId(), ...s, criadoEm: new Date(Date.now() - Math.random() * 86400000 * 3).toISOString() });
  });
  save();
}
 
/* ─── INIT ─── */
seedIfEmpty();
render();