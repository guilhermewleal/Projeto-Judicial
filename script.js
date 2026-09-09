// --- NAVEGAÇÃO ENTRE ABAS ---
const navButtons = document.querySelectorAll('.nav-btn');
const tabPanels = document.querySelectorAll('.tab-panel');

navButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    navButtons.forEach(b => b.classList.remove('active'));
    tabPanels.forEach(p => p.classList.remove('active'));

    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
  });
});

// --- ENGINE 1: PREVISÃO DE PRAZOS PROCESSUAIS ---
const inputPublicacao = document.getElementById('data-publicacao');
const inputDias = document.getElementById('dias-prazo');
const inputFeriados = document.getElementById('feriados-extras');
const selectTipoPrazo = document.getElementById('tipo-prazo');
const chkRecesso = document.getElementById('chk-recesso');
const btnCalcularPrazo = document.getElementById('btn-calcular-prazo');

// Definir data padrão como hoje
inputPublicacao.valueAsDate = new Date();

btnCalcularPrazo.addEventListener('click', () => {
  const dataVal = inputPublicacao.value;
  let diasUteis = parseInt(inputDias.value);
  const feriadosExtras = parseInt(inputFeriados.value) || 0;
  const multiplicador = parseInt(selectTipoPrazo.value) || 1;
  const considerarRecesso = chkRecesso.checked;

  if (!dataVal || isNaN(diasUteis) || diasUteis <= 0) {
    alert('Insira uma data e quantidade de dias válidos.');
    return;
  }

  // Aplica o multiplicador de prazo (ex: 2x para Fazenda Pública)
  diasUteis = diasUteis * multiplicador;

  const [ano, mes, dia] = dataVal.split('-').map(Number);
  let dataAtual = new Date(ano, mes - 1, dia);

  // Primeiro dia útil após a publicação
  let inicioContagem = proximoDiaUtil(new Date(dataAtual));
  let dataCorrente = new Date(inicioContagem);
  
  let diasContados = 0;
  let diasAdicionaisAplicados = feriadosExtras;

  while (diasContados < (diasUteis + diasAdicionaisAplicados)) {
    // Checa Recesso Forense (20/Dez a 20/Jan) se habilitado
    if (considerarRecesso && ehRecessoForense(dataCorrente)) {
      dataCorrente.setDate(dataCorrente.getDate() + 1);
      continue;
    }

    const diaSemana = dataCorrente.getDay();
    // Verifica dia útil (1 a 5)
    if (diaSemana !== 0 && diaSemana !== 6) {
      diasContados++;
    }
    
    if (diasContados < (diasUteis + diasAdicionaisAplicados)) {
      dataCorrente.setDate(dataCorrente.getDate() + 1);
    }
  }

  dataCorrente = proximoDiaUtil(dataCorrente);

  // Exibição dos Resultados
  const opcoesData = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  document.getElementById('res-data-fatal').textContent = dataCorrente.toLocaleDateString('pt-BR');
  document.getElementById('res-dia-semana').textContent = dataCorrente.toLocaleDateString('pt-BR', opcoesData);
  document.getElementById('res-inicio').textContent = inicioContagem.toLocaleDateString('pt-BR');
  document.getElementById('res-multiplicador').textContent = `${multiplicador}x (${diasUteis} dias total)`;
  document.getElementById('res-suspensoes').textContent = `${feriadosExtras} dia(s)`;
});

function proximoDiaUtil(data) {
  let novaData = new Date(data);
  novaData.setDate(novaData.getDate() + 1);
  while (novaData.getDay() === 0 || novaData.getDay() === 6) {
    novaData.setDate(novaData.getDate() + 1);
  }
  return novaData;
}

function ehRecessoForense(data) {
  const mes = data.getMonth(); // 0-indexado (11 = Dez, 0 = Jan)
  const dia = data.getDate();
  if ((mes === 11 && dia >= 20) || (mes === 0 && dia <= 20)) {
    return true;
  }
  return false;
}

// --- ENGINE 2: MATRIZ DE RISCO & SIMULAÇÃO ---
const inputValorCausa = document.getElementById('valor-causa');
const inputPctExito = document.getElementById('pct-exito');
const inputPctSucumbencia = document.getElementById('pct-sucumbencia');
const sliderProbabilidade = document.getElementById('probabilidade');
const probValDisplay = document.getElementById('prob-val');
const btnCalcularRisco = document.getElementById('btn-calcular-risco');

// Atualiza indicador de porcentagem dinamicamente
sliderProbabilidade.addEventListener('input', (e) => {
  probValDisplay.textContent = e.target.value;
});

btnCalcularRisco.addEventListener('click', () => {
  const valor = parseFloat(inputValorCausa.value);
  const pctExito = parseFloat(inputPctExito.value);
  const pctSucumb = parseFloat(inputPctSucumbencia.value);
  const prob = parseFloat(sliderProbabilidade.value) / 100;

  if (isNaN(valor) || valor <= 0) {
    alert('Informe o valor da causa para realizar os cálculos.');
    return;
  }

  const honorariosVitoria = valor * (pctExito / 100);
  const riscoDerrota = valor * (pctSucumb / 100);
  
  // Modelo de Expectativa Matemática: E = (Ganho * P(Vitória)) - (Custo * P(Derrota))
  const retornoPonderado = (honorariosVitoria * prob) - (riscoDerrota * (1 - prob));

  document.getElementById('res-honorarios').textContent = formatarMoeda(honorariosVitoria);
  document.getElementById('res-sucumbencia').textContent = formatarMoeda(riscoSucumbencia(riscoDerrota));
  document.getElementById('res-retorno-ponderado').textContent = formatarMoeda(retornoPonderado);
  
  const fillBar = document.getElementById('risk-bar-fill');
  fillBar.style.width = `${prob * 100}%`;
});

function riscoSucumbencia(val) {
  return val;
}

function formatarMoeda(val) {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// --- ENGINE 3: SINTETIZADOR DE MINUTAS AUTOMÁTICO ---
const btnGerarMinuta = document.getElementById('btn-gerar-minuta');
const btnCopiarMinuta = document.getElementById('btn-copiar-minuta');
const minutaOutput = document.getElementById('minuta-output');

btnGerarMinuta.addEventListener('click', () => {
  const tipo = document.getElementById('tipo-minuta').value;
  const tom = document.getElementById('tom-documento').value;
  const cliente = document.getElementById('nome-cliente').value || '[ NOME DO CLIENTE ]';
  const oposicao = document.getElementById('nome-opp').value || '[ PARTE CONTRÁRIA ]';
  const valor = parseFloat(document.getElementById('valor-doc').value) || 0;

  const valorFormatado = formatarMoeda(valor);
  const dataHoje = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });

  let texto = '';

  if (tipo === 'notificacao') {
    if (tom === 'formal') {
      texto = `NOTIFICAÇÃO EXTRAJUDICIAL DE COBRANÇA\n\nÀ(Ao) ${oposicao}\n\nSirvo-me da presente para, na qualidade de patrono de ${cliente}, NOTIFICAR V. Sa. a proceder com o adimplemento da quantia de ${valorFormatado}.\n\nOutrossim, assinala-se o prazo de 5 (cinco) dias úteis para a devida quitação do montante, sob pena de imediata propositura das medidas judiciais coercitivas cabíveis.\n\n[CIDADE/UF], ${dataHoje}.\n__________________________________\nAdvocacia Regulamentada`;
    } else if (tom === 'assertivo') {
      texto = `NOTIFICAÇÃO FORMAL DE COBRANÇA IMPRETERÍVEL\n\nPARA: ${oposicao}\nREQUERENTE: ${cliente}\nVALOR DEVEDOR: ${valorFormatado}\n\nFica a parte notificada cientificada de que possui o prazo IMPORROGÁVEL de 5 (cinco) dias para quitar o débito informado. A ausência de manifestação ensejará a imediata inscrição em órgãos de proteção ao crédito e o ajuizamento de Ação Executiva.\n\nData: ${dataHoje}.\n__________________________________\nDepartamento Jurídico`;
    } else {
      texto = `NOTIFICAÇÃO EXTRAJUDICIAL\n\nPrezado(a) ${oposicao},\n\nSolicitamos em nome de ${cliente} a regularização do valor pendente de ${valorFormatado}.\n\nPedimos a gentileza de entrar em contato no prazo de 5 dias úteis para alinhamento da liquidação do débito.\n\nAtenciosamente,\nData: ${dataHoje}.\n__________________________________\nRepresentante Legal`;
    }
  } else if (tipo === 'procuracao') {
    texto = `PROCURAÇÃO AD JUDICIA ET EXTRA\n\nOUTORGANTE: ${cliente}, com qualificações registradas.\nOUTORGADO: Sociedade de Advogados / Representante Legal OAB.\n\nPODERES: Concedem-se amplos poderes para o foro em geral referentes à lide em face de ${oposicao}, com valor estimado em ${valorFormatado}.\n\n[CIDADE/UF], ${dataHoje}.\n\n__________________________________\n${cliente}`;
  } else if (tipo === 'acordo') {
    texto = `TERMO DE ACORDO EXTRAJUDICIAL\n\nPARTES:\n1. ${cliente} (Credor)\n2. ${oposicao} (Devedor)\n\nDO OBJETO: As partes ajustam expressamente a composição amigável do débito no valor total de ${valorFormatado}, pondo fim à controvérsia existente.\n\n[CIDADE/UF], ${dataHoje}.\n\n______________________          ______________________\n   Credor / Advo.                  Devedor / Advo.`;
  }

  minutaOutput.value = texto;
});

btnCopiarMinuta.addEventListener('click', () => {
  if (!minutaOutput.value) return;
  navigator.clipboard.writeText(minutaOutput.value);
  btnCopiarMinuta.textContent = '✔ Copiado para a Área de Transferência';
  setTimeout(() => {
    btnCopiarMinuta.textContent = '📋 Copiar Documento';
  }, 1800);
});