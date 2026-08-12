/**
 * Ky WIFI Telecom - Painel Administrativo
 */

const firebaseConfig = {
  databaseURL: "https://ky-wi-fi-telecom-default-rtdb.firebaseio.com/"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

// SISTEMA DE NOTIFICAÇÕES TOAST
function showToast(message, type = 'success', duration = 3500) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  let icon = type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle';

  toast.innerHTML = `<i class="fas ${icon}"></i> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'fadeOut 0.3s ease-in forwards';
    setTimeout(() => { toast.remove(); }, 300);
  }, duration);
}

// MÁSCARAS DE ENTRADA (CPF)
document.addEventListener('DOMContentLoaded', () => {
  const cpfInput = document.getElementById('cpf');
  const usrCpfInput = document.getElementById('usrCpf');
  const bolCpfInput = document.getElementById('bolCpf');

  if (cpfInput) cpfInput.addEventListener('input', e => aplicarMascaraCPF(e.target));
  if (usrCpfInput) usrCpfInput.addEventListener('input', e => aplicarMascaraCPF(e.target));
  if (bolCpfInput) bolCpfInput.addEventListener('input', e => aplicarMascaraCPF(e.target));

  carregarContratos();
  carregarEstatisticas();
});

function aplicarMascaraCPF(input) {
  let value = input.value.replace(/\D/g, '');
  if (value.length > 11) value = value.slice(0, 11);
  value = value.replace(/(\d{3})(\d)/, '$1.$2');
  value = value.replace(/(\d{3})(\d)/, '$1.$2');
  value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  input.value = value;
}

// CONTROLE DE ABAS DE NAVEGAÇÃO
function openTab(evt, tabId) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(b => b.classList.remove('active'));

  document.getElementById(tabId).classList.add('active');
  if (evt && evt.currentTarget) evt.currentTarget.classList.add('active');

  if (tabId === 'tabContratos') carregarContratos();
  if (tabId === 'tabBoletos') carregarBoletos();
  if (tabId === 'tabAdmin') carregarUsuariosAdmin();
}

// ESTATÍSTICAS DO PAINEL
function carregarEstatisticas() {
  db.ref('clientes').on('value', snapshot => {
    document.getElementById('statClientes').innerText = snapshot.numChildren() || 0;
  });

  db.ref('contratos').on('value', snapshot => {
    let countAtivos = 0;
    snapshot.forEach(child => {
      if (child.val().status === 'ativo') countAtivos++;
    });
    document.getElementById('statContratos').innerText = countAtivos;
  });

  db.ref('boletos').on('value', snapshot => {
    document.getElementById('statBoletos').innerText = snapshot.numChildren() || 0;
  });

  db.ref('usuarios').on('value', snapshot => {
    let countAdmins = 0;
    snapshot.forEach(child => {
      if (child.val().tipo === 'admin') countAdmins++;
    });
    document.getElementById('statAdmins').innerText = countAdmins;
  });
}

function calcularIdade(dataNascimento) {
  if (!dataNascimento) return null;
  const hoje = new Date();
  const nasc = new Date(dataNascimento);
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const mes = hoje.getMonth() - nasc.getMonth();
  if (mes < 0 || (mes === 0 && hoje.getDate() < nasc.getDate())) idade--;
  return idade;
}

// GESTÃO DE CONTRATOS
function carregarContratos() {
  const tbody = document.getElementById('listaContratos');
  tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Buscando contratos no Firebase...</td></tr>';

  db.ref('contratos').on('value', snapshot => {
    const data = snapshot.val();
    if (!data) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Nenhum contrato cadastrado.</td></tr>';
      return;
    }

    let rows = '';
    Object.keys(data).forEach(key => {
      const item = data[key];
      rows += `
        <tr>
          <td><strong>${item.cliente_nome || 'Não Informado'}</strong></td>
          <td>${item.cliente_cpf ? formatarCPF(item.cliente_cpf) : '-'}</td>
          <td>${item.plano}</td>
          <td>R$ ${parseFloat(item.valor).toFixed(2)}</td>
          <td>Todo dia ${item.dia_vencimento}</td>
          <td><span class="badge badge-${item.status}">${item.status.toUpperCase()}</span></td>
          <td>
            <button class="btn-action btn-orange" onclick="imprimirContrato('${key}')" title="Imprimir Contrato"><i class="fas fa-file-contract"></i> Contrato</button>
            <button class="btn-action btn-edit" onclick="editarContrato('${key}')" title="Editar"><i class="fas fa-edit"></i></button>
            <button class="btn-action btn-danger" onclick="deletarContrato('${key}')" title="Excluir"><i class="fas fa-trash"></i></button>
          </td>
        </tr>
      `;
    });
    tbody.innerHTML = rows;
  });
}

async function salvarContrato(e) {
  e.preventDefault();
  const contratoId = document.getElementById('contratoId').value;
  const cpfLimpo = document.getElementById('cpf').value.replace(/\D/g, '');
  const nomeCliente = document.getElementById('nome').value;
  const dataNascimento = document.getElementById('dataNascimento').value;

  if (!dataNascimento) {
    showToast('Por favor, informe a Data de Nascimento do cliente.', 'error');
    return;
  }

  const dadosCliente = {
    cpf: cpfLimpo,
    nome: nomeCliente,
    data_nascimento: dataNascimento,
    nome_mae: document.getElementById('nomeMae').value || '',
    telefone: document.getElementById('telefone').value || '',
    cep: document.getElementById('cep').value || '',
    endereco: document.getElementById('endereco').value || '',
    created_at: new Date().toISOString()
  };

  await db.ref(`clientes/${cpfLimpo}`).update(dadosCliente);

  const dadosContrato = {
    cliente_cpf: cpfLimpo,
    cliente_nome: nomeCliente,
    plano: document.getElementById('plano').value,
    valor: parseFloat(document.getElementById('valor').value.replace(',', '.')),
    dia_vencimento: parseInt(document.getElementById('diaVencimento').value),
    status: document.getElementById('status').value,
    created_at: new Date().toISOString()
  };

  if (contratoId) {
    await db.ref(`contratos/${contratoId}`).update(dadosContrato);
  } else {
    const newRef = db.ref('contratos').push();
    dadosContrato.id = newRef.key;
    await newRef.set(dadosContrato);
  }

  showToast('Contrato e cliente salvos com sucesso!', 'success');
  fecharModalContrato();
}

async function deletarContrato(id) {
  if (confirm('Deseja realmente remover este contrato?')) {
    await db.ref(`contratos/${id}`).remove();
    showToast('Contrato removido com sucesso.', 'success');
  }
}

// EMISSÃO DE BOLETOS
function carregarBoletos() {
  const tbody = document.getElementById('listaBoletos');
  tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Buscando boletos...</td></tr>';

  db.ref('boletos').on('value', snapshot => {
    const data = snapshot.val();
    if (!data) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Nenhum boleto encontrado.</td></tr>';
      return;
    }

    let rows = '';
    Object.keys(data).forEach(key => {
      const b = data[key];
      const isPago = b.status === 'pago';
      rows += `
        <tr>
          <td><code>${b.nosso_numero}</code></td>
          <td>${b.cliente_nome || '-'}</td>
          <td><span class="badge badge-agosto">${b.mes_referencia}</span></td>
          <td>${formatarData(b.vencimento)}</td>
          <td>R$ ${parseFloat(b.valor).toFixed(2)}</td>
          <td><span class="badge badge-${b.status}">${b.status.toUpperCase()}</span></td>
          <td>
            <button class="btn-action btn-orange" onclick="imprimirBoleto('${key}')" title="Imprimir"><i class="fas fa-print"></i> Imprimir</button>
            ${!isPago ? `<button class="btn-action btn-excel" onclick="marcarComoPago('${key}')" title="Marcar como Pago"><i class="fas fa-check-circle"></i> Dar Baixa</button>` : ''}
          </td>
        </tr>
      `;
    });
    tbody.innerHTML = rows;
  });
}

async function marcarComoPago(id) {
  if (confirm('Confirmar o recebimento e marcar este boleto como PAGO?')) {
    await db.ref(`boletos/${id}`).update({ status: 'pago', pago_em: new Date().toISOString() });
    showToast('Boleto marcado como PAGO!', 'success');
  }
}

async function abrirModalBoleto() {
  document.getElementById('formBoleto').reset();
  const dataPadrao = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  document.getElementById('bolVencimento').value = dataPadrao;

  // Carregar Lista Selecionável de Clientes
  const selectCli = document.getElementById('bolClienteSelect');
  selectCli.innerHTML = '<option value="">Carregando clientes...</option>';

  try {
    const snapClientes = await db.ref('clientes').once('value');
    const clientes = snapClientes.val() || {};

    const snapContratos = await db.ref('contratos').once('value');
    const contratos = snapContratos.val() || {};

    selectCli.innerHTML = '<option value="">-- Selecione o Cliente --</option>';

    Object.keys(clientes).forEach(cpf => {
      const cli = clientes[cpf];
      let valorSugerido = '';
      
      // Busca valor do contrato ativo do cliente
      Object.values(contratos).forEach(c => {
        if (c.cliente_cpf === cpf && c.status === 'ativo') {
          valorSugerido = c.valor;
        }
      });

      const opt = document.createElement('option');
      opt.value = cpf;
      opt.dataset.valor = valorSugerido;
      opt.dataset.nome = cli.nome;
      opt.textContent = `${cli.nome} - CPF: ${formatarCPF(cpf)}`;
      selectCli.appendChild(opt);
    });

  } catch (err) {
    showToast('Erro ao carregar clientes.', 'error');
  }

  document.getElementById('modalBoleto').style.display = 'flex';
}

function selecionarClienteBoleto() {
  const select = document.getElementById('bolClienteSelect');
  const option = select.options[select.selectedIndex];

  if (option && option.value) {
    document.getElementById('bolCpf').value = formatarCPF(option.value);
    if (option.dataset.valor) {
      document.getElementById('bolValor').value = parseFloat(option.dataset.valor).toFixed(2);
    }
  } else {
    document.getElementById('bolCpf').value = '';
    document.getElementById('bolValor').value = '';
  }
}

function fecharModalBoleto() {
  document.getElementById('modalBoleto').style.display = 'none';
}

async function salvarNovoBoleto(e) {
  e.preventDefault();
  const cpfLimpo = document.getElementById('bolCpf').value.replace(/\D/g, '');
  const select = document.getElementById('bolClienteSelect');
  const option = select.options[select.selectedIndex];

  if (!cpfLimpo) {
    showToast('Por favor, selecione um cliente.', 'error');
    return;
  }

  const mesRef = document.getElementById('bolMes').value;
  const valorInput = document.getElementById('bolValor').value;
  const vencimento = document.getElementById('bolVencimento').value;

  const newRef = db.ref('boletos').push();
  const novoBoleto = {
    id: newRef.key,
    cliente_cpf: cpfLimpo,
    cliente_nome: option ? option.dataset.nome : 'Cliente',
    nosso_numero: `756${Math.floor(10000000 + Math.random() * 90000000)}`,
    mes_referencia: mesRef,
    vencimento: vencimento,
    valor: parseFloat(valorInput.replace(',', '.')),
    status: 'pendente',
    created_at: new Date().toISOString()
  };

  await newRef.set(novoBoleto);
  showToast('Boleto gerado com sucesso!', 'success');
  fecharModalBoleto();
}

// GESTÃO DE USUÁRIOS ADMIN
function carregarUsuariosAdmin() {
  const tbody = document.getElementById('listaUsuariosAdmin');
  tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Buscando operadores...</td></tr>';

  db.ref('usuarios').on('value', snapshot => {
    const data = snapshot.val();
    if (!data) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Nenhum usuário cadastrado.</td></tr>';
      return;
    }

    let rows = '';
    Object.keys(data).forEach(key => {
      const u = data[key];
      rows += `
        <tr>
          <td><strong>${u.nome || 'Administrador'}</strong></td>
          <td>${formatarCPF(u.cpf)}</td>
          <td><span class="badge badge-${u.tipo}">${(u.tipo || 'admin').toUpperCase()}</span></td>
          <td>${u.created_at ? formatarData(u.created_at) : 'Ativo'}</td>
          <td><span class="badge badge-ativo">ATIVO</span></td>
          <td>
            <button class="btn-action btn-danger" onclick="deletarUsuarioAdmin('${u.cpf}')"><i class="fas fa-user-minus"></i> Remover</button>
          </td>
        </tr>
      `;
    });
    tbody.innerHTML = rows;
  });
}

async function salvarUsuarioAdmin(e) {
  e.preventDefault();
  const cpfLimpo = document.getElementById('usrCpf').value.replace(/\D/g, '');
  const dataNascimento = document.getElementById('usrDataNascimento').value;

  if (!dataNascimento) {
    showToast('Informe a data de nascimento do operador.', 'error');
    return;
  }

  const novoUsuario = {
    nome: document.getElementById('usrNome').value,
    cpf: cpfLimpo,
    data_nascimento: dataNascimento, // Salvo para permitir a recuperação de senha
    senha: document.getElementById('usrSenha').value,
    tipo: document.getElementById('usrTipo').value,
    status: 'ativo',
    created_at: new Date().toISOString()
  };

  await db.ref(`usuarios/${cpfLimpo}`).set(novoUsuario);
  showToast('Usuário cadastrado com sucesso!', 'success');
  fecharModalUsuario();
}

async function deletarUsuarioAdmin(cpf) {
  if (confirm('Deseja remover o acesso deste usuário?')) {
    await db.ref(`usuarios/${cpf}`).remove();
    showToast('Usuário removido com sucesso.', 'success');
  }
}

// MODAIS
function abrirModalContrato() {
  document.getElementById('formContrato').reset();
  document.getElementById('contratoId').value = '';
  document.getElementById('modalTitulo').innerText = 'Novo Contrato';
  document.getElementById('modalContrato').style.display = 'flex';
}
function fecharModalContrato() { document.getElementById('modalContrato').style.display = 'none'; }

function abrirModalUsuario() {
  document.getElementById('formUsuarioAdmin').reset();
  document.getElementById('usrId').value = '';
  document.getElementById('modalUsuarioTitulo').innerText = 'Cadastrar Usuário Admin';
  document.getElementById('modalUsuario').style.display = 'flex';
}
function fecharModalUsuario() { document.getElementById('modalUsuario').style.display = 'none'; }

function logout() {
  localStorage.removeItem('usuarioLogado');
  window.location.href = 'login.html';
}

function formatarCPF(cpf) {
  if (!cpf) return '-';
  const c = cpf.replace(/\D/g, '');
  return c.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

function formatarData(dataStr) {
  if (!dataStr) return '-';
  const d = new Date(dataStr);
  return d.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}