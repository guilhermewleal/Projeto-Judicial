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

// --- ENGINE 1: CALCULADORA DE PRAZOS PROCESSUAIS (CPC) ---
const inputPublicacao = document.getElementById('data-publicacao');
const inputDias = document.getElementById('dias-prazo');
const inputFeriados = document.getElementById('feriados-extras');
const btnCalcularPrazo = document.getElementById('btn-calcular-prazo');

// Definir data padrão como hoje
inputPublicacao.valueAsDate = new Date();

btnCalcularPrazo.addEventListener('click', () => {
  const dataVal = inputPublicacao.value;
  const diasUteis = parseInt(inputDias.value);
  const feriadosExtras = parseInt(inputFeriados.value) || 0;

  if (!dataVal || isNaN(diasUteis) || diasUteis <= 0) {
    alert('Preencha os campos de data e dias corretamente.');
    return;
  }

  const [ano, mes, dia] = dataVal.split('-').map(Number);
  let dataAtual = new Date(ano, mes - 1, dia);

  // O primeiro dia do prazo é o dia ÚTIL SEGUINTE à publicação
  let inicioContagem = proximoDiaUtil(new Date(dataAtual));
  
  let dataCorrente = new Date(inicioContagem);
  let diasContados = 0;

  // Adiciona a lógica de suspensão/feriados extras no meio do fluxo
  let diasParaSomar = diasUteis + feriadosExtras;

  while (diasContados < diasParaSomar) {
    const diaSemana = dataCorrente.getDay();
    // 0 = Domingo, 6 = Sábado
    if (diaSemana !== 0 && diaSemana !== 6) {
      diasContados++;
    }
    
    if (diasContados < diasParaSomar) {
      dataCorrente.setDate(dataCorrente.getDate() + 1);
    }
  }

  // Se a data final cair em fim de semana por exceção, prorroga para o próximo dia útil
  dataCorrente = proximoDiaUtil(dataCorrente);

  // Exibição dos Resultados
  const opcoesData = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  document.getElementById('res-data-fatal').textContent = dataCorrente.toLocaleDateString('pt-BR');
  document.getElementById('res-dia-semana').textContent = dataCorrente.toLocaleDateString('pt-BR', opcoesData);
  document.getElementById('res-inicio').textContent = inicioContagem.toLocaleDateString('pt-BR');
  document.getElementById('res-dias-contados').textContent = diasUteis;
  document.getElementById('res-suspensoes').textContent = feriadosExtras;
});

function proximoDiaUtil(data) {
  let novaData = new Date(data);
  // Se for publicação/evento hoje, avança pro dia seguinte antes de testar
  novaData.setDate(novaData.getDate() + 1);
  
  while (novaData.getDay() === 0 || novaData.getDay() === 6) {
    novaData.setDate(novaData.getDate() + 1);
  }
  return novaData;
}

// --- ENGINE 2: ANÁLISE DE RISCO & HONORÁRIOS ---
const inputValorCausa = document.getElementById('valor-causa');
const inputPctExito = document.getElementById('pct-exito');
const selectProbabilidade = document.getElementById('probabilidade');
const btnCalcularRisco = document.getElementById('btn-calcular-risco');

btnCalcularRisco.addEventListener('click', () => {
  const valor = parseFloat(inputValorCausa.value);
  const pct = parseFloat(inputPctExito.value);
  const prob = parseFloat(selectProbabilidade.value);

  if (isNaN(valor) || valor <= 0 || isNaN(pct)) {
    alert('Insira um valor de causa e percentual válidos.');
    return;
  }

  const honorariosEstimados = valor * (pct / 100);
  const riscoSucumbencia = valor * 0.10; // Média padrão de 10% de sucumbência
  const retornoPonderado = (honorariosEstimados * prob) - (riscoSucumbencia * (1 - prob));

  // Atualiza UI
  document.getElementById('res-honorarios').textContent = formatarMoeda(honorariosEstimados);
  document.getElementById('res-sucumbencia').textContent = formatarMoeda(riscoSucumbencia);
  
  const fillBar = document.getElementById('risk-bar-fill');
  fillBar.style.width = `${prob * 100}%`;

  const elRetorno = document.getElementById('res-retorno-ponderado');
  elRetorno.textContent = `Expectativa Matemática Liquida: ${formatarMoeda(retornoPonderado)}`;
});

function formatarMoeda(val) {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// --- ENGINE 3: GERADOR DE MINUTAS ---
const btnGerarMinuta = document.getElementById('btn-gerar-minuta');
const btnCopiarMinuta = document.getElementById('btn-copiar-minuta');
const minutaOutput = document.getElementById('minuta-output');

btnGerarMinuta.addEventListener('click', () => {
  const tipo = document.getElementById('tipo-minuta').value;
  const cliente = document.getElementById('nome-cliente').value || '[ NOME DO CLIENTE ]';
  const oposicao = document.getElementById('nome-opp').value || '[ NOME DA PARTE CONTRÁRIA ]';
  const valor = parseFloat(document.getElementById('valor-doc').value) || 0;

  const valorFormatado = formatarMoeda(valor);
  const dataHoje = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });

  let texto = '';

  if (tipo === 'notificacao') {
    texto = `NOTIFICAÇÃO EXTRAJUDICIAL DE COBRANÇA

Ao(À) ${oposicao}

A pedido de nosso constituinte, ${cliente}, vimos por meio desta NOTIFICAR V. Sa. acerca do débito pendente no valor de ${valorFormatado}.

Solicitamos o comparecimento ou contato no prazo impreterível de 5 (cinco) dias úteis para a regularização do referido valor, sob pena de adoção das medidas judiciais cabíveis, incluindo ação de execução e inclusão nos órgãos de proteção ao crédito.

Atenciosamente,

[CIDADE/UF], ${dataHoje}.
__________________________________
Advocacia / OAB`;
  } else if (tipo === 'procuracao') {
    texto = `PROCURAÇÃO AD JUDICIA ET EXTRA

OUTORGANTE: ${cliente}, com qualificações completas anexas.

OUTORGADO: [NOME DO ADVOGADO], inscrito na OAB sob o nº [000.000], com escritório profissional em [ENDEREÇO].

PODERES: Pelo presente instrumento, o OUTORGANTE confere ao OUTORGADO amplos poderes para o foro em geral, conforme artigo 105 do Código de Processo Civil, referente à demanda envolvendo ${oposicao}, com valor estimado de ${valorFormatado}.

[CIDADE/UF], ${dataHoje}.

__________________________________
${cliente}`;
  }

  minutaOutput.value = texto;
});

btnCopiarMinuta.addEventListener('click', () => {
  if (!minutaOutput.value) return;
  navigator.clipboard.writeText(minutaOutput.value);
  btnCopiarMinuta.textContent = '✔ Copiado!';
  setTimeout(() => {
    btnCopiarMinuta.textContent = '📋 Copiar';
  }, 1500);
});