const API_URL = "https://69076c63b1879c890ed9bde4.mockapi.io/agendamento";

// === DOM ===
const calendario = document.querySelector("#calendario tbody");
const mesSelect = document.querySelector("#mes-select");
const anoSelect = document.querySelector("#ano-select");

const modal = document.querySelector("#modal");
const detalhesModal = document.querySelector("#detalhes");
const detalhesInfo = document.querySelector("#detalhes-info");

const salvarBtn = document.querySelector("#salvar");
const cancelarBtn = document.querySelector("#cancelar");
const fecharDetalhes = document.querySelector("#fechar-detalhes");
const excluirBtn = document.querySelector("#excluir");

// === Estado ===
let diaSelecionado = null;
let agendamentoAtual = null;

// === Meses ===
const meses = [
  "JANEIRO","FEVEREIRO","MARÇO","ABRIL","MAIO","JUNHO",
  "JULHO","AGOSTO","SETEMBRO","OUTUBRO","NOVEMBRO","DEZEMBRO"
];


// ======================
// API
// ======================
async function carregarAgendamentos() {
  const res = await fetch(API_URL);
  return await res.json();
}

async function salvarNaAPI(dados) {
  await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dados)
  });
}

async function excluirDaAPI(id) {
  await fetch(`${API_URL}/${id}`, {
    method: "DELETE"
  });
}


// ======================
// SELECTS
// ======================
function popularMesesEAnos() {
  const hoje = new Date();
  const anoAtual = hoje.getFullYear();

  meses.forEach((m, i) => {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = m;
    if (i === hoje.getMonth()) opt.selected = true;
    mesSelect.appendChild(opt);
  });

  for (let a = anoAtual - 1; a <= anoAtual + 3; a++) {
    const opt = document.createElement("option");
    opt.value = a;
    opt.textContent = a;
    if (a === anoAtual) opt.selected = true;
    anoSelect.appendChild(opt);
  }
}


// ======================
// CALENDÁRIO
// ======================
async function gerarCalendario(mes, ano) {
  calendario.innerHTML = "";

  const agendamentos = await carregarAgendamentos();

  const primeiroDia = new Date(ano, mes, 1);
  const ultimoDia = new Date(ano, mes + 1, 0);
  const diaSemanaInicio = primeiroDia.getDay();

  let dia = 1;
  let tr = document.createElement("tr");

  // espaços vazios
  for (let i = 0; i < diaSemanaInicio; i++) {
    tr.appendChild(document.createElement("td"));
  }

  // primeira linha
  for (let i = diaSemanaInicio; i < 7; i++) {
    tr.appendChild(criarCelula(dia, mes, ano, agendamentos));
    dia++;
  }

  calendario.appendChild(tr);

  // restante do mês
  while (dia <= ultimoDia.getDate()) {
    tr = document.createElement("tr");

    for (let i = 0; i < 7; i++) {
      if (dia <= ultimoDia.getDate()) {
        tr.appendChild(criarCelula(dia, mes, ano, agendamentos));
      } else {
        tr.appendChild(document.createElement("td"));
      }
      dia++;
    }

    calendario.appendChild(tr);
  }
}


// ======================
// CÉLULA
// ======================
function criarCelula(dia, mes, ano, agendamentos) {
  const td = document.createElement("td");
  td.textContent = String(dia).padStart(2, "0");

  const agDia = agendamentos.filter(a =>
    Number(a.dia) === dia &&
    Number(a.mes) === mes &&
    Number(a.ano) === ano
  );

  agDia.forEach((ag) => {
    const span = document.createElement("span");
    span.classList.add("agendamento");

    span.textContent = `${ag.nome} ${ag.horarioInicio} às ${ag.horarioFim}`;

    span.onclick = (e) => {
      e.stopPropagation();
      mostrarDetalhes(ag);
    };

    td.appendChild(span);
  });

  td.onclick = () => abrirModal(dia, mes, ano);

  return td;
}


// ======================
// MODAL
// ======================
function abrirModal(dia, mes, ano) {
  diaSelecionado = { dia, mes, ano };
  modal.style.display = "block";
}

function fecharModal() {
  modal.style.display = "none";
}


// ======================
// DETALHES
// ======================
function mostrarDetalhes(ag) {
  agendamentoAtual = ag;

  detalhesInfo.innerHTML = `
    <strong>Nome:</strong> ${ag.nome}<br>
    <strong>Cliente:</strong> ${ag.cliente}<br>
    <strong>Horário:</strong> ${ag.horarioInicio} às ${ag.horarioFim}
  `;

  detalhesModal.style.display = "block";
}

fecharDetalhes.onclick = () => {
  detalhesModal.style.display = "none";
};


// ======================
// HORÁRIOS
// ======================
function popularHorarios() {
  const ini = document.getElementById("horaInicial");
  const fim = document.getElementById("horaFinal");

  for (let h = 8; h <= 18; h++) {
    ["00","30"].forEach(min => {
      const hora = `${String(h).padStart(2,"0")}:${min}`;
      ini.appendChild(new Option(hora, hora));
      fim.appendChild(new Option(hora, hora));
    });
  }
}


// ======================
// SALVAR
// ======================
async function salvarAgendamento() {
  const nome = document.getElementById("nome").value;
  const inicio = document.getElementById("horaInicial").value;
  const fim = document.getElementById("horaFinal").value;
  const cliente = document.getElementById("cliente").value;

  if (!nome || !inicio || !fim || !cliente) {
    alert("Preencha todos os campos!");
    return;
  }

  const todos = await carregarAgendamentos();

  const conflito = todos.some(a =>
    Number(a.dia) === diaSelecionado.dia &&
    Number(a.mes) === diaSelecionado.mes &&
    Number(a.ano) === diaSelecionado.ano &&
    !(fim <= a.horarioInicio || inicio >= a.horarioFim)
  );

  if (conflito) {
    alert("Horário já ocupado!");
    return;
  }

  await salvarNaAPI({
    nome,
    cliente,
    horarioInicio: inicio,
    horarioFim: fim,
    dia: diaSelecionado.dia,
    mes: diaSelecionado.mes,
    ano: diaSelecionado.ano
  });

  fecharModal();
  gerarCalendario(diaSelecionado.mes, diaSelecionado.ano);
}


// ======================
// EXCLUIR
// ======================
excluirBtn.onclick = async () => {
  if (!agendamentoAtual) return;

  await excluirDaAPI(agendamentoAtual.id);

  detalhesModal.style.display = "none";

  gerarCalendario(
    parseInt(mesSelect.value),
    parseInt(anoSelect.value)
  );
};


// ======================
// EVENTOS
// ======================
mesSelect.onchange = () =>
  gerarCalendario(parseInt(mesSelect.value), parseInt(anoSelect.value));

anoSelect.onchange = () =>
  gerarCalendario(parseInt(mesSelect.value), parseInt(anoSelect.value));

cancelarBtn.onclick = fecharModal;
salvarBtn.onclick = salvarAgendamento;


// ======================
// INIT
// ======================
window.onload = () => {
  popularMesesEAnos();
  popularHorarios();

  gerarCalendario(
    new Date().getMonth(),
    new Date().getFullYear()
  );
};
