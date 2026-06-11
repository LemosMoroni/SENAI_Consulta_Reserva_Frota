/**
 * ════════════════════════════════════════════════
 *  SENAI – Reserva de Veículos | app.js
 *  Integração com Google Sheets público via GViz
 * ════════════════════════════════════════════════
 *
 *  ESTRUTURA DA PLANILHA (linha 1 = cabeçalho):
 *
 *  A: Solicitação        (ex: SEN-649530/2026)
 *  B: Veículo            (ex: QHA7788 - Uno Evolution [SENAI])
 *  C: Localizador
 *  D: Motorista          ← busca pelo nome aqui
 *  E: Data inicial       (ex: 30/03/2026, 12:00)
 *  F: Data final         (ex: 30/03/2026, 23:00)
 *  G: Local de retirada e devolução
 *  H: Turno
 *  I: Ocupantes
 */

'use strict';

// ════════════════════════════════════════════════
//  ⚙️  CONFIGURAÇÃO  — edite apenas esta seção
// ════════════════════════════════════════════════
const CONFIG = {
  // ID da planilha Google Sheets (extraído da URL)
  sheetId: '1BAXBAlpam3xhJvx74X-HrOiu4J62p_IyiHTOLS-4E5k',

  // Nome exato da aba (deixe vazio para usar a primeira aba)
  tabName: '',

  // Índices das colunas (0 = coluna A)
  col: {
    solicitacao: 0,  // A – Solicitação
    veiculo:     1,  // B – Veículo (placa + modelo)
    localizador: 2,  // C – Localizador
    motorista:   3,  // D – Motorista  ← campo de busca
    dataInicial: 4,  // E – Data inicial
    dataFinal:   5,  // F – Data final
    local:       6,  // G – Local de retirada e devolução
    turno:       7,  // H – Turno
    ocupantes:   8,  // I – Ocupantes
    cidadeDestino: 9, // J – Cidade de destino
  },

  // Placas que possuem tag de pedágio Sem Parar
  semPararPlacas: [
    'RXL1L31', 'RYU3J48', 'QHA7788', 'TPO5E39', 'TPO1J29',
  ],
};
// ════════════════════════════════════════════════


// ─── UTILITÁRIOS ────────────────────────────────

/** Remove acentos e normaliza para comparação */
const norm = str =>
  (str || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .trim();

/** Iniciais do nome (máx. 2 letras) */
const iniciais = nome =>
  nome.trim().split(/\s+/).slice(0, 2).map(n => n[0].toUpperCase()).join('');

/** Formata valor de data vindo do Google Sheets */
function formatarData(val) {
  if (!val) return '—';
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(val)) return val;          // já dd/mm/aaaa
  if (/^\d{4}-\d{2}-\d{2}/.test(val)) {
    const [y, m, d] = val.split('-');
    return `${d}/${m}/${y}`;
  }
  return val;
}

/** Classe CSS para o status */
function classeStatus(status) {
  const s = norm(status);
  if (s.includes('confirm')) return 'status-confirmado';
  if (s.includes('pend'))    return 'status-pendente';
  if (s.includes('cancel'))  return 'status-cancelado';
  return 'status-confirmado';
}

/** Verifica se a placa tem Sem Parar */
const temSemParar = placa =>
  CONFIG.semPararPlacas.includes((placa || '').toUpperCase().trim());


// ─── GOOGLE SHEETS ──────────────────────────────

/** URL da API pública GViz do Google Sheets */
function sheetUrl() {
  const { sheetId, tabName } = CONFIG;
  const base = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json`;
  return tabName ? `${base}&sheet=${encodeURIComponent(tabName)}` : base;
}

/** Faz o fetch e retorna array de arrays de strings */
async function fetchPlanilha() {
  const resp = await fetch(sheetUrl());
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

  const txt = await resp.text();

  // Resposta GViz: /*O_o*/google.visualization.Query.setResponse({...});
  const match = txt.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\)/);
  if (!match) throw new Error('Resposta inesperada do Google Sheets');

  const { table } = JSON.parse(match[1]);

  return table.rows.map(row =>
    row.c.map(cell => {
      if (!cell) return '';
      // .f = valor formatado (datas, moeda), .v = valor bruto
      const v = cell.f ?? cell.v;
      return v !== null && v !== undefined ? String(v).trim() : '';
    })
  );
}


// ─── RENDERIZAÇÃO DOS CARDS ──────────────────────

/** Extrai placa e modelo do campo "QHA7788 - Uno Evolution [SENAI]" */
function parseVeiculo(veiculoStr) {
  if (!veiculoStr) return { placa: '—', modelo: '—' };
  const [placaPart, ...restParts] = veiculoStr.split(' - ');
  const placa = placaPart.trim();
  const modelo = restParts.join(' - ').replace(/\[.*?\]/g, '').trim() || '—';
  return { placa, modelo };
}

function renderCard(row, index) {
  const { col } = CONFIG;

  const nome        = row[col.motorista]   || '—';
  const solicitacao = row[col.solicitacao] || '—';
  const veiculoRaw  = row[col.veiculo]     || '';
  const dataInicial = row[col.dataInicial] || '—';
  const dataFinal   = row[col.dataFinal]   || '—';
  const local       = row[col.local]       || '—';
  const turno         = row[col.turno]         || '—';
  const ocupantes     = row[col.ocupantes]     || '';
  const cidadeDestino = row[col.cidadeDestino] || '';

  const { placa, modelo } = parseVeiculo(veiculoRaw);
  const status = 'Confirmado';
  const animDelay = index * 75;

  return /* html */`
  <article class="result-card" style="animation-delay:${animDelay}ms">

    <div class="card-top">
      <div class="avatar">${iniciais(nome)}</div>
      <div class="card-name-block">
        <div class="card-name">${nome}</div>
        <div class="card-name-sub">${solicitacao}</div>
      </div>
      <span class="status-pill ${classeStatus(status)}">${status}</span>
    </div>

    <div class="card-body">
      <div class="info-grid">
        <div class="info-item">
          <div class="info-lbl">📅 Data inicial</div>
          <div class="info-val">${dataInicial}</div>
        </div>
        <div class="info-item">
          <div class="info-lbl">📆 Data final</div>
          <div class="info-val">${dataFinal}</div>
        </div>
        <div class="info-item">
          <div class="info-lbl">📍 Local</div>
          <div class="info-val">${local}</div>
        </div>
        <div class="info-item">
          <div class="info-lbl">🕐 Turno</div>
          <div class="info-val">${turno}</div>
        </div>
        ${cidadeDestino ? `<div class="info-item">
          <div class="info-lbl">🏙️ Cidade de destino</div>
          <div class="info-val">${cidadeDestino}</div>
        </div>` : ''}
      </div>

      <div class="car-block">
        <div class="car-icon-box">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 11l1.5-4.5h11L19 11" stroke="#003087" stroke-width="1.8" stroke-linecap="round"/>
            <rect x="2" y="11" width="20" height="7" rx="2" stroke="#003087" stroke-width="1.8"/>
            <circle cx="7"  cy="18" r="2" stroke="#003087" stroke-width="1.8"/>
            <circle cx="17" cy="18" r="2" stroke="#003087" stroke-width="1.8"/>
            <path d="M5 14h14" stroke="#003087" stroke-width="1.2" stroke-linecap="round" opacity="0.3"/>
            <rect x="9" y="14" width="6" height="3" rx="0.5" fill="#F47920" opacity="0.5"/>
          </svg>
        </div>
        <div class="car-info">
          <div class="car-lbl">🚗 Veículo reservado</div>
          <div class="car-modelo">${modelo}</div>
          ${temSemParar(placa) ? `<span class="pedagio-tag">🛣️ Sem Parar</span>` : ''}
        </div>
        ${placa !== '—' ? `<div class="placa-tag">${placa}</div>` : ''}
      </div>
    </div>

    ${(nome !== '—' || ocupantes) ? /* html */`
    <div class="card-footer">
      <span class="card-footer-icon">👥</span>
      <p><strong>🧑‍✈️ Motorista:</strong> ${nome}</p>
      ${ocupantes ? `<p><strong>👥 Ocupantes:</strong> ${ocupantes}</p>` : ''}
    </div>` : ''}

  </article>`;
}


// ─── CONTROLES DE UI ────────────────────────────

const $ = id => document.getElementById(id);

function mostrar(id) { $(id).hidden = false; }
function ocultar(id) { $(id).hidden = true;  }

function setLoading(ativo) {
  $('btnBuscar').disabled = ativo;
  $('loadingWrap').hidden = !ativo;
}


// ─── AÇÃO PRINCIPAL ─────────────────────────────

async function buscar() {
  const input     = $('inputNome');
  const nomeBusca = input.value.trim();
  if (!nomeBusca) { input.focus(); return; }

  const dataBusca = $('inputData').value; // "YYYY-MM-DD" ou ''

  ocultar('emptyState');
  ocultar('resultSection');
  setLoading(true);

  try {
    const dados = await fetchPlanilha();
    filtrarEExibir(dados, nomeBusca, dataBusca);
  } catch (err) {
    console.warn('Planilha indisponível, usando dados demo:', err.message);
    filtrarEExibir(dadosDemo(), nomeBusca, dataBusca);
  } finally {
    setLoading(false);
  }
}

/**
 * Converte "dd/mm/aaaa, hh:mm" → "aaaa-mm-dd" para comparar com input[type=date]
 * Também aceita "dd/mm/aaaa" sem horário.
 */
function parseDateCell(val) {
  if (!val) return '';
  const match = val.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (!match) return '';
  return `${match[3]}-${match[2]}-${match[1]}`;
}

/** Filtra por nome do motorista (e data opcional) e renderiza os cards */
function filtrarEExibir(dados, nomeBusca, dataBusca) {
  const normBusca = norm(nomeBusca);
  const { col } = CONFIG;

  const resultado = dados.filter((row, i) => {
    const nomeCell = row[col.motorista] || '';
    // Pula linha de cabeçalho
    if (i === 0 && norm(nomeCell).includes('motorista')) return false;
    // Linha vazia
    if (!nomeCell) return false;
    // Filtro por nome (parcial, sem acento) — motorista OU ocupantes
    const ocupantesCell = row[col.ocupantes] || '';
    if (!norm(nomeCell).includes(normBusca) && !norm(ocupantesCell).includes(normBusca)) return false;
    // Filtro por data (se preenchida)
    if (dataBusca) {
      const dataInicial = parseDateCell(row[col.dataInicial] || '');
      const dataFinal   = parseDateCell(row[col.dataFinal]   || '');
      // Mantém se a data selecionada está dentro do período da reserva
      if (dataInicial && dataFinal) {
        if (dataBusca < dataInicial || dataBusca > dataFinal) return false;
      } else if (dataInicial) {
        if (dataBusca !== dataInicial) return false;
      }
    }
    return true;
  });

  if (resultado.length === 0) {
    $('nomeNaoEncontrado').textContent = dataBusca
      ? `${nomeBusca} na data selecionada`
      : nomeBusca;
    mostrar('emptyState');
    return;
  }

  const labelData = dataBusca
    ? ` em <strong>${dataBusca.split('-').reverse().join('/')}</strong>` : '';
  $('resultCount').innerHTML =
    `<strong>${resultado.length}</strong> reserva(s) para <strong>${nomeBusca}</strong>${labelData}`;
  $('resultList').innerHTML =
    resultado.map((row, i) => renderCard(row, i)).join('');
  mostrar('resultSection');
}

/** Limpa a busca */
function limpar() {
  $('inputNome').value = '';
  $('inputData').value = '';
  ocultar('emptyState');
  ocultar('resultSection');
  $('inputNome').focus();
}


// ─── DADOS DE DEMONSTRAÇÃO ──────────────────────
// Exibidos quando a planilha ainda não tem a aba "Reservas"
// ou quando o acesso falha.

function dadosDemo() {
  // [solicitacao, veiculo, localizador, motorista, dataInicial, dataFinal, local, turno, ocupantes]
  return [
    ['SEN-000001/2026', 'QHA7788 - Uno Evolution [SENAI]',  '', 'Carlos Eduardo Mendes', '30/03/2026, 07:00', '30/03/2026, 18:00', 'SENAI Lages - 049', 'Manhã / Tarde',  'Carlos'],
    ['SEN-000002/2026', 'TPO5E39 - ONIX [SENAI]',           '', 'Ana Paula Oliveira',    '31/03/2026, 13:00', '31/03/2026, 22:00', 'SENAI Lages - 049', 'Tarde / Noite',  'Ana'],
    ['SEN-000003/2026', 'RXL1L31 - HB20 [SENAI]',           '', 'Marcos Antônio Costa',  '01/04/2026, 07:00', '01/04/2026, 18:00', 'SENAI Lages - 049', 'Manhã / Tarde',  'Marcos'],
  ];
}


// ─── EVENTOS ────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  $('inputNome').addEventListener('keydown', e => {
    if (e.key === 'Enter') buscar();
  });
});
