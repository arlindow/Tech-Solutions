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
    // CHAMADO 01 – Financeiro: impressora não imprime boletos
    {
      setor: 'Financeiro',
      classificacao: 'Incidente',
      prioridade: 'Alta',
      impacto: 'Alto — Múltiplos setores',
      causa: 'Impressora utilizada para emissão de boletos deixou de imprimir. Possível falha no driver, fila de impressão travada ou problema físico no equipamento.',
      diagnostico: 'Verificar se a impressora está ligada e online. Limpar a fila de impressão no Windows. Reinstalar ou atualizar o driver. Testar impressão de página de diagnóstico. Checar cabos e conexão de rede/USB.',
      solucao: 'Reiniciar serviço de spooler de impressão. Reinstalar driver atualizado do fabricante. Se hardware com defeito, substituir por impressora reserva imediatamente para não bloquear emissão de boletos.',
      tempo: '1–4 horas',
    },
    // CHAMADO 02 – Recepção: sem internet em um único computador
    {
      setor: 'Recepção',
      classificacao: 'Incidente',
      prioridade: 'Média',
      impacto: 'Baixo — Usuário único',
      causa: 'Computador isolado sem acesso à internet enquanto demais funcionam normalmente. Possível falha na placa de rede, configuração de IP incorreta ou porta de switch com defeito.',
      diagnostico: 'Verificar status do adaptador de rede no gerenciador de dispositivos. Testar com cabo de rede diferente. Executar ipconfig /release e /renew. Pingar gateway padrão. Trocar porta do switch.',
      solucao: 'Reconfigurar adaptador de rede para DHCP automático. Substituir cabo de rede. Se placa de rede com defeito, instalar adaptador USB-Ethernet como alternativa temporária.',
      tempo: '1–4 horas',
    },
    // CHAMADO 03 – RH: esqueceu senha
    {
      setor: 'Recursos Humanos',
      classificacao: 'Requisição',
      prioridade: 'Baixa',
      impacto: 'Baixo — Usuário único',
      causa: 'Colaboradora esqueceu a senha de acesso ao sistema corporativo. Sem indício de comprometimento de segurança.',
      diagnostico: 'Verificar se a conta está bloqueada no Active Directory. Confirmar identidade da solicitante por canal secundário (e-mail pessoal ou telefone cadastrado). Registrar ocorrência no log de resets.',
      solucao: 'Redefinir senha via painel de administração do AD/sistema corporativo. Orientar a usuária a criar senha forte seguindo a política de senhas da empresa. Habilitar autenticação em dois fatores se disponível.',
      tempo: '< 1 hora',
    },
    // CHAMADO 04 – Comercial: lentidão no sistema de vendas
    {
      setor: 'Comercial',
      classificacao: 'Problema',
      prioridade: 'Alta',
      impacto: 'Alto — Múltiplos setores',
      causa: 'Sistema de vendas com lentidão excessiva, impactando operações comerciais. Possível sobrecarga de servidor, consultas SQL não otimizadas ou recursos insuficientes.',
      diagnostico: 'Monitorar CPU, RAM e I/O do servidor de aplicação e banco de dados. Identificar queries lentas com ferramentas de profiling. Verificar número de conexões simultâneas. Analisar logs de erro da aplicação.',
      solucao: 'Otimizar índices e queries identificadas como gargalo. Aumentar recursos do servidor (vertical scaling) ou balancear carga. Agendar manutenção preventiva com fornecedor do sistema.',
      tempo: '4–8 horas',
    },
    // CHAMADO 05 – Diretoria: notebook não liga após queda de energia
    {
      setor: 'Diretoria',
      classificacao: 'Incidente',
      prioridade: 'Crítica',
      impacto: 'Alto — Múltiplos setores',
      causa: 'Notebook do diretor não liga após queda de energia. Possível dano à placa-mãe, fonte interna ou HD/SSD causado por pico de tensão.',
      diagnostico: 'Testar com carregador reserva. Verificar LED de carga. Tentar inicialização com bateria removida. Conectar monitor externo para descartar falha de display. Se sem resposta, encaminhar para diagnóstico técnico especializado.',
      solucao: 'Disponibilizar equipamento reserva imediatamente para minimizar impacto na diretoria. Encaminhar notebook para reparo ou, se irreparável, providenciar substituição com urgência e restaurar backup dos dados.',
      tempo: '< 1 hora',
    },
    // CHAMADO 06 – Almoxarifado: planilha corrompida
    {
      setor: 'Almoxarifado',
      classificacao: 'Incidente',
      prioridade: 'Média',
      impacto: 'Médio — Um setor',
      causa: 'Arquivo de planilha de controle de estoque está corrompido. Possível falha ao salvar, desligamento abrupto ou setor de disco com erro.',
      diagnostico: 'Tentar abrir o arquivo com o recurso de recuperação do Excel. Verificar se há versões anteriores salvas (histórico de versões). Checar integridade do HD com ferramentas SMART. Verificar se o arquivo está em servidor de rede.',
      solucao: 'Recuperar última versão íntegra do backup diário. Reparar arquivo com ferramenta de recuperação do Office. Orientar usuário sobre procedimento correto de fechamento e salvamento. Verificar disco para setores defeituosos.',
      tempo: '1–4 horas',
    },
    // CHAMADO 07 – Atendimento: falhas em VoIP
    {
      setor: 'Atendimento',
      classificacao: 'Incidente',
      prioridade: 'Alta',
      impacto: 'Alto — Múltiplos setores',
      causa: 'Ligações VoIP com falhas e cortes constantes no setor de atendimento. Possível jitter elevado, perda de pacotes na rede ou sobrecarga de banda.',
      diagnostico: 'Executar teste de qualidade VoIP (MOS, jitter, latência, perda de pacotes). Verificar configuração de QoS nos switches e roteador. Analisar tráfego com Wireshark na VLAN de voz. Checar status do link com provedor.',
      solucao: 'Configurar/ajustar QoS priorizando tráfego de voz na rede. Se problema no link, acionar provedor de internet. Verificar firmwares dos telefones IP e servidor PBX. Considerar codec mais robusto (G.711 vs G.729).',
      tempo: '4–8 horas',
    },
    // CHAMADO 08 – Marketing: falta de espaço em disco
    {
      setor: 'Marketing',
      classificacao: 'Problema',
      prioridade: 'Média',
      impacto: 'Baixo — Usuário único',
      causa: 'Estação de trabalho de Marketing com disco quase cheio, causando lentidão e impossibilidade de salvar arquivos. Acúmulo de arquivos de mídia e temporários.',
      diagnostico: 'Executar análise de disco (WinDirStat ou TreeSize). Identificar pastas com maior consumo. Verificar arquivos temporários, lixeira e cache de aplicativos. Avaliar se há duplicatas de arquivos de projeto.',
      solucao: 'Limpeza de arquivos temporários e desnecessários. Mover projetos antigos para servidor de arquivos ou armazenamento externo. Se recorrente, provisionar HD adicional ou SSD de maior capacidade.',
      tempo: '1–4 horas',
    },
    // CHAMADO 09 – Produção: nenhum computador acessa sistema de produção
    {
      setor: 'Produção',
      classificacao: 'Incidente',
      prioridade: 'Crítica',
      impacto: 'Crítico — Empresa toda',
      causa: 'Nenhum computador do setor de Produção consegue acessar o sistema. Possível queda do servidor de aplicação, falha de rede no segmento do setor ou problema no serviço de autenticação.',
      diagnostico: 'Verificar status do servidor de produção (ping, serviços, logs). Checar conectividade do switch do setor. Testar acesso ao sistema a partir de outro segmento de rede. Verificar logs de autenticação e firewall.',
      solucao: 'Reiniciar serviços da aplicação de produção. Se falha de rede, isolar e substituir equipamento defeituoso. Ativar plano de contingência para operação manual enquanto o sistema é restabelecido. Comunicar gestão imediatamente.',
      tempo: '< 1 hora',
    },
    // CHAMADO 10 – Compras: não consegue enviar e-mails
    {
      setor: 'Compras',
      classificacao: 'Incidente',
      prioridade: 'Média',
      impacto: 'Médio — Um setor',
      causa: 'Usuário do setor de Compras não consegue enviar e-mails para fornecedores. Possível problema na conta do cliente de e-mail, senha expirada ou bloqueio pelo servidor SMTP.',
      diagnostico: 'Verificar configurações SMTP no cliente de e-mail. Testar envio via webmail. Checar se a senha da conta de e-mail está válida. Verificar logs no servidor de e-mail para erros de autenticação ou bloqueio.',
      solucao: 'Reconfigurar conta de e-mail com credenciais atualizadas. Se senha expirada, redefinir. Verificar cota da caixa de entrada. Se bloqueio por servidor, liberar junto ao administrador de e-mail.',
      tempo: '1–4 horas',
    },
    // CHAMADO 11 – Recepção: webcam parou após atualização
    {
      setor: 'Recepção',
      classificacao: 'Incidente',
      prioridade: 'Baixa',
      impacto: 'Baixo — Usuário único',
      causa: 'Webcam deixou de funcionar após atualização do sistema operacional. Possível incompatibilidade de driver com a nova versão do SO.',
      diagnostico: 'Verificar gerenciador de dispositivos em busca de erros no dispositivo de câmera. Checar se driver da webcam é compatível com a versão atual do sistema. Testar a câmera em outro computador para descartar defeito físico.',
      solucao: 'Reinstalar driver da webcam compatível com a versão atual do SO (obtido no site do fabricante). Se não houver driver compatível, reverter atualização do sistema ou solicitar driver em modo de compatibilidade.',
      tempo: '1–4 horas',
    },
    // CHAMADO 12 – RH: certificado digital expirado
    {
      setor: 'Recursos Humanos',
      classificacao: 'Problema',
      prioridade: 'Alta',
      impacto: 'Alto — Múltiplos setores',
      causa: 'Certificado digital utilizado para assinaturas eletrônicas expirou. Documentos e processos que dependem de assinatura digital estão bloqueados.',
      diagnostico: 'Confirmar data de expiração no repositório de certificados. Verificar quais processos e sistemas dependem do certificado. Identificar a autoridade certificadora (AC) responsável pela emissão.',
      solucao: 'Acionar imediatamente o processo de renovação do certificado digital junto à autoridade certificadora. Verificar se há certificado de backup válido. Documentar processos impactados e acionar responsáveis para assinaturas emergenciais por método alternativo.',
      tempo: '1–2 dias',
    },
    // CHAMADO 13 – Financeiro: phishing / e-mail suspeito
    {
      setor: 'Financeiro',
      classificacao: 'Incidente',
      prioridade: 'Crítica',
      impacto: 'Crítico — Empresa toda',
      causa: 'Usuários do Financeiro clicaram em link de e-mail phishing solicitando troca de senha. Risco crítico de comprometimento de credenciais e dados financeiros sensíveis.',
      diagnostico: 'Identificar imediatamente quais usuários clicaram no link. Verificar se credenciais foram inseridas na página falsa. Analisar logs de acesso para atividades suspeitas. Verificar integridade das contas comprometidas no AD.',
      solucao: 'Bloquear e redefinir senhas de todas as contas potencialmente comprometidas. Isolar estações que acessaram o link suspeito para análise forense. Notificar equipe de segurança. Acionar protocolo de resposta a incidentes. Informar gestão e, se necessário, autoridades.',
      tempo: '< 1 hora',
    },
    // CHAMADO 14 – Comercial: configurar notebook novo
    {
      setor: 'Comercial',
      classificacao: 'Requisição',
      prioridade: 'Baixa',
      impacto: 'Baixo — Usuário único',
      causa: 'Notebook novo adquirido precisa ser configurado para novo colaborador do setor Comercial.',
      diagnostico: 'Verificar checklist de provisionamento: imagem de SO padrão, softwares corporativos, ingresso no domínio, criação de conta de usuário, configuração de e-mail e VPN.',
      solucao: 'Aplicar imagem padrão da empresa via WDS/MDM. Instalar softwares necessários (sistema de vendas, Office, antivírus). Ingressar no domínio. Criar conta no AD. Configurar e-mail e acesso remoto. Entregar ao colaborador com termo de responsabilidade.',
      tempo: '1–2 dias',
    },
    // CHAMADO 15 – Produção: computador reinicia sozinho
    {
      setor: 'Produção',
      classificacao: 'Problema',
      prioridade: 'Alta',
      impacto: 'Médio — Um setor',
      causa: 'Computador de monitoramento da Produção reinicia sozinho de forma intermitente. Possível superaquecimento, falha em memória RAM, PSU instável ou driver com problema.',
      diagnostico: 'Analisar logs de eventos do Windows (Event Viewer) em busca de erros críticos. Verificar temperatura da CPU/GPU com HWMonitor. Executar teste de memória RAM (MemTest86). Checar status da PSU e conexões internas.',
      solucao: 'Limpar cooler e aplicar pasta térmica se superaquecimento. Substituir pente de RAM defeituoso. Trocar PSU se instável. Atualizar drivers de chipset. Se problema persistir, substituir equipamento para não comprometer o monitoramento da produção.',
      tempo: '4–8 horas',
    },
    // CHAMADO 16 – Diretoria: acesso negado a pasta compartilhada
    {
      setor: 'Diretoria',
      classificacao: 'Requisição',
      prioridade: 'Alta',
      impacto: 'Médio — Um setor',
      causa: 'Usuário da Diretoria com acesso negado a pasta compartilhada na rede. Possível alteração indevida de permissões, conta fora do grupo de segurança ou herança de permissões incorreta.',
      diagnostico: 'Verificar permissões NTFS e de compartilhamento da pasta no servidor de arquivos. Confirmar se a conta do usuário está no grupo de segurança correto no AD. Checar logs de auditoria para alterações recentes de permissão.',
      solucao: 'Adicionar usuário ao grupo de segurança adequado no Active Directory. Corrigir permissões NTFS se alteradas indevidamente. Documentar e registrar a alteração no change log. Verificar quem alterou a permissão anteriormente.',
      tempo: '< 1 hora',
    },
    // CHAMADO 17 – Marketing: licença de software expirada
    {
      setor: 'Marketing',
      classificacao: 'Problema',
      prioridade: 'Média',
      impacto: 'Médio — Um setor',
      causa: 'Software de edição gráfica com licença expirada, bloqueando atividades de criação do setor de Marketing.',
      diagnostico: 'Verificar data de expiração da licença no painel de licenciamento. Confirmar se é licença por assinatura (renovação) ou perpétua (upgrade). Verificar se há outras licenças disponíveis no pool da empresa.',
      solucao: 'Renovar assinatura junto ao fornecedor do software. Se houver licença disponível no pool, reatribuí-la ao usuário. Verificar orçamento de TI para renovação. Como alternativa temporária, avaliar uso de licença de outro computador não utilizado.',
      tempo: '1–2 dias',
    },
    // CHAMADO 18 – Atendimento: computador lento com propagandas (malware)
    {
      setor: 'Atendimento',
      classificacao: 'Incidente',
      prioridade: 'Crítica',
      impacto: 'Alto — Múltiplos setores',
      causa: 'Computador do setor de Atendimento extremamente lento com exibição de janelas de propaganda — sintomas claros de infecção por adware/malware. Risco de vazamento de dados e propagação na rede.',
      diagnostico: 'Isolar imediatamente o equipamento da rede. Executar varredura completa com antivírus atualizado e ferramenta anti-malware (Malwarebytes). Verificar processos suspeitos no Task Manager. Analisar extensões de navegador e programas instalados recentemente.',
      solucao: 'Isolar máquina da rede imediatamente. Executar remoção do malware ou, se comprometimento profundo, formatar e reinstalar o SO com imagem limpa. Verificar se outros computadores da rede foram afetados. Revisar políticas de segurança e navegação.',
      tempo: '4–8 horas',
    },
    // CHAMADO 19 – Almoxarifado: leitor de código de barras não reconhecido
    {
      setor: 'Almoxarifado',
      classificacao: 'Incidente',
      prioridade: 'Baixa',
      impacto: 'Baixo — Usuário único',
      causa: 'Leitor de código de barras do Almoxarifado não é reconhecido pelo computador. Possível falha no cabo USB, porta USB com problema ou ausência de driver.',
      diagnostico: 'Testar o leitor em outra porta USB do mesmo computador. Testar em outro computador para verificar se o defeito é no leitor ou na porta. Verificar gerenciador de dispositivos. Checar se há necessidade de driver específico do fabricante.',
      solucao: 'Substituir cabo USB se danificado. Instalar driver do fabricante se necessário. Se a porta USB estiver com defeito, usar hub USB externo. Se o leitor estiver com defeito físico, substituir pelo equipamento reserva.',
      tempo: '1–4 horas',
    },
    // CHAMADO 20 – Infraestrutura: múltiplos computadores sem acesso a recursos compartilhados
    {
      setor: 'Infraestrutura',
      classificacao: 'Incidente',
      prioridade: 'Crítica',
      impacto: 'Crítico — Empresa toda',
      causa: 'Diversos computadores de múltiplos setores perderam acesso a recursos compartilhados da rede (pastas, impressoras, sistemas). Possível falha no servidor de arquivos, controlador de domínio, switch core ou serviço DHCP/DNS.',
      diagnostico: 'Verificar status do controlador de domínio e servidor de arquivos (ping, serviços, logs). Checar disponibilidade do DHCP e DNS. Analisar logs do switch core em busca de erros de porta ou STP. Mapear quais segmentos de rede estão afetados.',
      solucao: 'Reiniciar serviços críticos do AD (Netlogon, DNS, DHCP) se parados. Se falha de hardware no switch core, ativar equipamento de contingência. Comunicar todos os gestores. Acionar plano de continuidade de negócios enquanto serviços são restaurados.',
      tempo: '< 1 hora',
    },
  ];
 
  seeds.forEach(s => {
    chamados.push({ id: genId(), ...s, criadoEm: new Date(Date.now() - Math.random() * 86400000 * 2).toISOString() });
  });
  save();
}
 
/* ─── INIT ─── */
seedIfEmpty();
render();
