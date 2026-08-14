/**
 * Ky WIFI Telecom - Painel Administrativo com Automação Mensal
 */

const firebaseConfig = {
  apiKey: "AIzaSyA0XjvmilmpNwBVDHuVRdyF8YCQ0SimvJA",
  authDomain: "ky-wi-fi-telecom.firebaseapp.com",
  databaseURL: "https://ky-wi-fi-telecom-default-rtdb.firebaseio.com",
  projectId: "ky-wi-fi-telecom",
  storageBucket: "ky-wi-fi-telecom.appspot.com",
  messagingSenderId: "222931880150",
  appId: "1:222931880150:web:4224128a5b03022e3f6177",
  measurementId: "G-RYJLD3M3HY"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

// ========== SESSÃO E PERMISSÕES ==========
let usuarioAtual = null;

function obterUsuarioLogado() {
  try {
    const raw = localStorage.getItem('usuarioLogado');
    if (!raw) {
      const defaultUser = { cpf: "00000000000", nome: "Administrador Geral", tipo: "admin" };
      localStorage.setItem('usuarioLogado', JSON.stringify(defaultUser));
      return defaultUser;
    }
    return JSON.parse(raw);
  } catch (e) {
    return { cpf: "00000000000", nome: "Administrador Geral", tipo: "admin" };
  }
}

function isAdmin() {
  return usuarioAtual && (usuarioAtual.tipo === 'admin');
}

function isOperador() {
  return usuarioAtual && (usuarioAtual.tipo === 'operador' || usuarioAtual.tipo === 'admin');
}

function protegerPainel() {
  usuarioAtual = obterUsuarioLogado();
  if (!usuarioAtual || !usuarioAtual.cpf) {
    showToast('Faça login para acessar o painel.', 'error');
    setTimeout(() => { window.location.href = 'login.html'; }, 800);
    return false;
  }
  return true;
}

function aplicarPermissoesUI() {
  const nomeEl = document.getElementById('userNomeDisplay');
  const roleEl = document.getElementById('userRoleDisplay');
  const tabAdmin = document.getElementById('tabBtnAdmin');
  const welcomeTitle = document.getElementById('welcomeTitle');
  const welcomeSub = document.getElementById('welcomeSub');

  if (nomeEl) nomeEl.textContent = usuarioAtual.nome || 'Usuário';
  if (roleEl) {
    const tipo = usuarioAtual.tipo || 'operador';
    roleEl.textContent = tipo === 'admin' ? 'Admin Geral' : 'Suporte';
    roleEl.classList.toggle('role-operador', tipo === 'operador');
  }
  if (tabAdmin) {
    tabAdmin.style.display = isAdmin() ? '' : 'none';
  }
  if (welcomeTitle) {
    welcomeTitle.textContent = isAdmin()
      ? 'Painel Admin Geral'
      : 'Painel de Suporte';
  }
  if (welcomeSub) {
    welcomeSub.textContent = isAdmin()
      ? 'Controle total: contratos, boletos e usuários do sistema.'
      : 'Crie, edite, finalize e interrompa contratos · emita e baixe boletos.';
  }
}

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
  let icon = type === 'error' ? 'fa-exclamation-circle' : (type === 'info' ? 'fa-info-circle' : 'fa-check-circle');

  toast.innerHTML = `<i class="fas ${icon}"></i> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'fadeOut 0.3s ease-in forwards';
    setTimeout(() => { toast.remove(); }, 300);
  }, duration);
}

// INICIALIZAÇÃO
document.addEventListener('DOMContentLoaded', () => {
  if (!protegerPainel()) return;
  aplicarPermissoesUI();

  const cpfInput = document.getElementById('cpf');
  const usrCpfInput = document.getElementById('usrCpf');
  const bolCpfInput = document.getElementById('bolCpf');

  if (cpfInput) cpfInput.addEventListener('input', e => aplicarMascaraCPF(e.target));
  if (usrCpfInput) usrCpfInput.addEventListener('input', e => aplicarMascaraCPF(e.target));
  if (bolCpfInput) bolCpfInput.addEventListener('input', e => aplicarMascaraCPF(e.target));

  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        fecharModalElemento(modal.id);
      }
    });
  });

  carregarContratos();
  carregarBoletos();
  carregarEstatisticas();

  // Executa a verificação automática de geradores de boleto do mês
  verificarEGerarBoletosAutomaticos();
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

  const activeTab = document.getElementById(tabId);
  if (activeTab) activeTab.classList.add('active');
  if (evt && evt.currentTarget) evt.currentTarget.classList.add('active');

  if (tabId === 'tabContratos') carregarContratos();
  if (tabId === 'tabBoletos') carregarBoletos();
  if (tabId === 'tabAdmin') carregarUsuariosAdmin();
}

// ESTATÍSTICAS DO PAINEL
function carregarEstatisticas() {
  db.ref('clientes').on('value', snapshot => {
    const el = document.getElementById('statClientes');
    if (el) el.innerText = snapshot.numChildren() || 0;
  });

  db.ref('contratos').on('value', snapshot => {
    let countAtivos = 0;
    snapshot.forEach(child => {
      if (child.val().status === 'ativo') countAtivos++;
    });
    const el = document.getElementById('statContratos');
    if (el) el.innerText = countAtivos;
  });

  db.ref('boletos').on('value', snapshot => {
    const el = document.getElementById('statBoletos');
    if (el) el.innerText = snapshot.numChildren() || 0;
  });

  db.ref('usuarios').on('value', snapshot => {
    let countAdmins = 0;
    snapshot.forEach(child => {
      if (child.val().tipo === 'admin') countAdmins++;
    });
    const el = document.getElementById('statAdmins');
    if (el) el.innerText = countAdmins;
  });
}

// ==========================================================
// 🤖 AUTOMAÇÃO: GERAÇÃO AUTOMÁTICA DE BOLETO POR MÊS
// ==========================================================
async function verificarEGerarBoletosAutomaticos() {
  try {
    const dataAtual = new Date();
    const nomesMeses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    const mesNome = nomesMeses[dataAtual.getMonth()];
    const anoAtual = dataAtual.getFullYear();
    const identificadorMesAno = `${mesNome}/${anoAtual}`;

    const snapContratos = await db.ref('contratos').once('value');
    const contratos = snapContratos.val();
    if (!contratos) return;

    const snapBoletos = await db.ref('boletos').once('value');
    const boletosExistentes = snapBoletos.val() || {};

    let novosBoletosGerados = 0;

    for (const key in contratos) {
      const c = contratos[key];
      
      // Gera apenas para contratos ATIVOS
      if (c.status === 'ativo') {
        const cpf = c.cliente_cpf;

        // Verifica se já existe um boleto para este CPF neste Mês/Ano
        const jaExiste = Object.values(boletosExistentes).some(b => 
          b.cliente_cpf === cpf && b.mes_referencia === identificadorMesAno
        );

        if (!jaExiste) {
          // Calcula data de vencimento automática para o mês corrente
          const diaVenc = parseInt(c.dia_vencimento || '10', 10);
          const mesZero = String(dataAtual.getMonth() + 1).padStart(2, '0');
          const diaZero = String(diaVenc).padStart(2, '0');
          const dataVencimentoStr = `${anoAtual}-${mesZero}-${diaZero}`;

          const newRef = db.ref('boletos').push();
          const nossoNum = `756${Math.floor(10000000 + Math.random() * 90000000)}`;
          const linhaDigitavel = `75691.40333 40333.${nossoNum.slice(-5)} 40333.000010 7 00000000009990`;

          const novoBoletoAuto = {
            id: newRef.key,
            cliente_cpf: cpf,
            cliente_nome: c.cliente_nome,
            nosso_numero: nossoNum,
            linha_digitavel: linhaDigitavel,
            chave_pix: "kywifitelecom@gmail.com",
            mes_referencia: identificadorMesAno,
            vencimento: dataVencimentoStr,
            valor: parseFloat(c.valor),
            status: 'pendente',
            gerado_automaticamente: true,
            created_at: new Date().toISOString()
          };

          await newRef.set(novoBoletoAuto);
          novosBoletosGerados++;
        }
      }
    }

    if (novosBoletosGerados > 0) {
      showToast(`Automação: ${novosBoletosGerados} boleto(s) mensal(is) gerado(s) com sucesso!`, 'info', 5000);
    }
  } catch (err) {
    console.error("Erro na automação de boletos:", err);
  }
}

// GESTÃO DE CONTRATOS
function carregarContratos() {
  const tbody = document.getElementById('listaContratos');
  if (!tbody) return;
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
      const st = (item.status || 'ativo').toLowerCase();
      const podeFinalizar = st === 'ativo' || st === 'suspenso';
      const podeInterromper = st === 'ativo' || st === 'suspenso';
      const podeReativar = st === 'interrompido' || st === 'finalizado' || st === 'suspenso' || st === 'cancelado';

      rows += `
        <tr>
          <td><strong>${item.cliente_nome || 'Não Informado'}</strong></td>
          <td>${item.cliente_cpf ? formatarCPF(item.cliente_cpf) : '-'}</td>
          <td>${item.plano || '-'}</td>
          <td>R$ ${parseFloat(item.valor || 0).toFixed(2)}</td>
          <td>Todo dia ${item.dia_vencimento || '-'}</td>
          <td><span class="badge badge-${st}">${st.toUpperCase()}</span></td>
          <td>
            <div class="actions-row">
              <button class="btn-action btn-orange" onclick="imprimirContrato('${key}')" title="Imprimir Contrato"><i class="fas fa-print"></i></button>
              <button class="btn-action btn-edit" onclick="editarContrato('${key}')" title="Editar"><i class="fas fa-edit"></i></button>
              ${podeFinalizar ? `<button class="btn-action btn-success" onclick="alterarStatusContrato('${key}','finalizado')" title="Finalizar"><i class="fas fa-flag-checkered"></i></button>` : ''}
              ${podeInterromper ? `<button class="btn-action btn-warn" onclick="alterarStatusContrato('${key}','interrompido')" title="Interromper"><i class="fas fa-pause-circle"></i></button>` : ''}
              ${podeReativar ? `<button class="btn-action btn-muted" onclick="alterarStatusContrato('${key}','ativo')" title="Reativar"><i class="fas fa-play-circle"></i></button>` : ''}
              ${isAdmin() ? `<button class="btn-action btn-danger" onclick="deletarContrato('${key}')" title="Excluir"><i class="fas fa-trash"></i></button>` : ''}
            </div>
          </td>
        </tr>
      `;
    });
    tbody.innerHTML = rows;
  });
}

async function salvarContrato(e) {
  e.preventDefault();
  const btn = document.getElementById('btnSalvarContrato') || e.submitter;
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...'; }

  try {
    const contratoId = document.getElementById('contratoId').value;
    const cpfLimpo = document.getElementById('cpf').value.replace(/\D/g, '');
    const nomeCliente = document.getElementById('nome').value.trim();
    const dataNascimento = document.getElementById('dataNascimento').value || '';
    const valorRaw = document.getElementById('valor').value.replace(',', '.').trim();
    const valorNum = parseFloat(valorRaw);

    if (!cpfLimpo || cpfLimpo.length !== 11) {
      throw new Error('CPF inválido. Informe os 11 dígitos.');
    }
    if (!nomeCliente) {
      throw new Error('Informe o nome completo do cliente.');
    }
    if (isNaN(valorNum) || valorNum <= 0) {
      throw new Error('Informe um valor mensal válido.');
    }

    const dadosCliente = {
      cpf: cpfLimpo,
      nome: nomeCliente,
      nome_mae: document.getElementById('nomeMae').value || '',
      telefone: document.getElementById('telefone').value || '',
      email: (document.getElementById('emailCliente') && document.getElementById('emailCliente').value) || '',
      cep: document.getElementById('cep').value || '',
      endereco: document.getElementById('endereco').value || ''
    };
    if (dataNascimento) dadosCliente.data_nascimento = dataNascimento;

    const clienteRef = db.ref(`clientes/${cpfLimpo}`);
    const snapCli = await clienteRef.once('value');
    if (snapCli.exists()) {
      await clienteRef.update(dadosCliente);
    } else {
      dadosCliente.created_at = new Date().toISOString();
      await clienteRef.set(dadosCliente);
    }

    const dadosContrato = {
      cliente_cpf: cpfLimpo,
      cliente_nome: nomeCliente,
      plano: document.getElementById('plano').value || '700 Mega Fibra',
      valor: valorNum,
      dia_vencimento: parseInt(document.getElementById('diaVencimento').value || '10', 10),
      status: document.getElementById('status').value || 'ativo'
    };

    if (contratoId) {
      dadosContrato.atualizado_em = new Date().toISOString();
      await db.ref(`contratos/${contratoId}`).update(dadosContrato);
      showToast('Contrato atualizado com sucesso!', 'success');
    } else {
      const newRef = db.ref('contratos').push();
      dadosContrato.id = newRef.key;
      dadosContrato.created_at = new Date().toISOString();
      await newRef.set(dadosContrato);
      showToast('Contrato criado com sucesso!', 'success');
    }

    fecharModalContrato();
    verificarEGerarBoletosAutomaticos(); // Executa automação ao salvar novo contrato
  } catch (err) {
    console.error(err);
    const msg = (err && err.message) ? err.message : 'Erro ao salvar contrato.';
    showToast(msg, 'error', 5000);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-save"></i> Salvar Contrato';
    }
  }
}

// IMPRESSÃO DE CONTRATO
async function imprimirContrato(id) {
  try {
    const snapC = await db.ref(`contratos/${id}`).once('value');
    const c = snapC.val();
    if (!c) return showToast('Contrato não encontrado.', 'error');

    const snapCli = await db.ref(`clientes/${c.cliente_cpf}`).once('value');
    const cli = snapCli.val() || {};

    const win = window.open('', '_blank');
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Contrato - ${c.cliente_nome}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; color: #121826; }
          .header { text-align: center; border-bottom: 2px solid #6A1B9A; padding-bottom: 15px; margin-bottom: 25px; }
          .header img { height: 60px; }
          .header h2 { color: #6A1B9A; margin: 10px 0 5px 0; }
          .box { border: 1px solid #CBD5E1; padding: 15px; border-radius: 8px; margin-bottom: 20px; background: #F8FAFC; }
          .box h3 { margin-top: 0; color: #4A148C; border-bottom: 1px solid #CBD5E1; padding-bottom: 5px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 0.95rem; }
          .clauses { text-align: justify; font-size: 0.9rem; line-height: 1.5; margin-top: 25px; }
          .signatures { margin-top: 50px; display: flex; justify-content: space-between; text-align: center; }
          .sig-line { width: 45%; border-top: 1px solid #000; padding-top: 5px; font-size: 0.85rem; }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="https://i.ibb.co/Xrz7n7dX/image-9658f0-removebg-preview.png" alt="Ky WIFI Logo">
          <h2>KY TELECOMUNICACOES LTDA</h2>
          <small>CNPJ: 22.131.209/0001-93 · Águas Lindas de Goiás - GO</small>
        </div>

        <h3 style="text-align: center;">TERMO DE ADESÃO E CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE INTERNET</h3>

        <div class="box">
          <h3>DADOS DO CONTRATANTE</h3>
          <div class="grid">
            <p><strong>Nome:</strong> ${c.cliente_nome}</p>
            <p><strong>CPF:</strong> ${formatarCPF(c.cliente_cpf)}</p>
            <p><strong>Telefone:</strong> ${cli.telefone || '-'}</p>
            <p><strong>E-mail:</strong> ${cli.email || '-'}</p>
            <p><strong>Mãe:</strong> ${cli.nome_mae || '-'}</p>
            <p><strong>Endereço:</strong> ${cli.endereco || '-'}, CEP: ${cli.cep || '-'}</p>
          </div>
        </div>

        <div class="box">
          <h3>PLANO E CONDIÇÕES COMERCIAIS</h3>
          <div class="grid">
            <p><strong>Plano Contratado:</strong> ${c.plano}</p>
            <p><strong>Valor Mensal:</strong> R$ ${parseFloat(c.valor).toFixed(2)}</p>
            <p><strong>Vencimento:</strong> Todo dia ${c.dia_vencimento}</p>
            <p><strong>Status do Contrato:</strong> ${String(c.status).toUpperCase()}</p>
          </div>
        </div>

        <div class="clauses">
          <p><strong>1. DO OBJETO:</strong> O presente contrato tem por objeto a prestação de Serviços de Comunicação Multimídia (Internet Banda Larga) pela CONTRATADA ao CONTRATANTE.</p>
          <p><strong>2. DAS OBRIGAÇÕES E DO PAGAMENTO:</strong> O CONTRATANTE compromete-se a efetuar o pagamento da mensalidade até a data do vencimento contratado sob pena de suspensão dos serviços em caso de inadimplência.</p>
          <p><strong>3. DA MANUTENÇÃO E SUPORTE:</strong> A CONTRATADA garante o suporte técnico para a integridade da rede contratada dentro do perímetro de cobertura da operadora.</p>
        </div>

        <div class="signatures">
          <div class="sig-line"><strong>KY TELECOMUNICACOES LTDA</strong><br>CONTRATADA</div>
          <div class="sig-line"><strong>${c.cliente_nome}</strong><br>CONTRATANTE</div>
        </div>

        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `);
    win.document.close();
  } catch (err) {
    showToast('Erro ao preparar contrato para impressão.', 'error');
  }
}

async function editarContrato(id) {
  try {
    showToast('Carregando dados...', 'info', 1200);
    const snapContrato = await db.ref(`contratos/${id}`).once('value');
    const c = snapContrato.val();
    if (!c) {
      showToast('Contrato não encontrado no Firebase.', 'error');
      return;
    }

    const snapCliente = await db.ref(`clientes/${c.cliente_cpf}`).once('value');
    const cli = snapCliente.val() || {};

    document.getElementById('formContrato').reset();
    document.getElementById('contratoId').value = id;
    document.getElementById('nome').value = c.cliente_nome || cli.nome || '';
    document.getElementById('cpf').value = formatarCPF(c.cliente_cpf || '');
    document.getElementById('cpf').readOnly = true;
    document.getElementById('dataNascimento').value = cli.data_nascimento || '';
    document.getElementById('nomeMae').value = cli.nome_mae || '';
    document.getElementById('telefone').value = cli.telefone || '';
    const emailEl = document.getElementById('emailCliente');
    if (emailEl) emailEl.value = cli.email || '';
    document.getElementById('cep').value = cli.cep || '';
    document.getElementById('endereco').value = cli.endereco || '';

    const planoSelect = document.getElementById('plano');
    const planoVal = c.plano || '';
    let found = false;
    for (let i = 0; i < planoSelect.options.length; i++) {
      if (planoSelect.options[i].value === planoVal) { found = true; break; }
    }
    if (!found && planoVal) {
      const opt = document.createElement('option');
      opt.value = planoVal;
      opt.textContent = planoVal;
      planoSelect.appendChild(opt);
    }
    planoSelect.value = planoVal;

    document.getElementById('valor').value = (c.valor != null) ? Number(c.valor).toFixed(2) : '';
    document.getElementById('diaVencimento').value = String(c.dia_vencimento || '10');
    document.getElementById('status').value = c.status || 'ativo';

    document.getElementById('modalTitulo').innerText = 'Editar Contrato';
    abrirModalElemento('modalContrato');
  } catch (err) {
    console.error(err);
    showToast('Erro ao carregar contrato para edição.', 'error');
  }
}

async function deletarContrato(id) {
  if (!isAdmin()) {
    showToast('Apenas o Admin Geral pode excluir contratos.', 'error');
    return;
  }
  if (confirm('Deseja realmente remover este contrato? Esta ação não pode ser desfeita.')) {
    await db.ref(`contratos/${id}`).remove();
    showToast('Contrato removido com sucesso.', 'success');
  }
}

async function alterarStatusContrato(id, novoStatus) {
  if (!confirm(`Confirma alterar o status para ${novoStatus.toUpperCase()}?`)) return;
  try {
    await db.ref(`contratos/${id}`).update({
      status: novoStatus,
      status_atualizado_em: new Date().toISOString(),
      status_por: usuarioAtual ? usuarioAtual.nome : 'sistema'
    });
    showToast('Status atualizado com sucesso.', 'success');
  } catch (err) {
    showToast('Erro ao atualizar status do contrato.', 'error');
  }
}

function atualizarValorPlano() {
  const sel = document.getElementById('plano');
  if (!sel) return;
  const opt = sel.options[sel.selectedIndex];
  if (opt && opt.dataset.valor) {
    document.getElementById('valor').value = opt.dataset.valor;
  }
}

// MODAIS AUXILIARES
function abrirModalElemento(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.display = 'flex';
  el.classList.add('open');
}

function fecharModalElemento(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('open');
  el.style.display = 'none';
}

function abrirModalContrato() {
  document.getElementById('formContrato').reset();
  document.getElementById('contratoId').value = '';
  document.getElementById('cpf').readOnly = false;
  document.getElementById('modalTitulo').innerText = 'Novo Contrato';
  const plano = document.getElementById('plano');
  if (plano) {
    plano.value = '700 Mega Fibra';
    atualizarValorPlano();
  }
  document.getElementById('status').value = 'ativo';
  abrirModalElemento('modalContrato');
}

function fecharModalContrato() { fecharModalElemento('modalContrato'); }

// BOLETOS
function carregarBoletos() {
  const tbody = document.getElementById('listaBoletos');
  if (!tbody) return;
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
          <td><code>${b.nosso_numero || key}</code></td>
          <td>${b.cliente_nome || '-'}</td>
          <td><span class="badge badge-agosto">${b.mes_referencia || 'Mês'}</span></td>
          <td>${formatarData(b.vencimento)}</td>
          <td>R$ ${parseFloat(b.valor || 0).toFixed(2)}</td>
          <td><span class="badge badge-${b.status || 'pendente'}">${(b.status || 'pendente').toUpperCase()}</span></td>
          <td>
            <div class="actions-row">
              <button class="btn-action btn-orange" onclick="imprimirBoleto('${key}')" title="Imprimir boleto"><i class="fas fa-print"></i></button>
              ${!isPago ? `<button class="btn-action btn-success" onclick="marcarComoPago('${key}')" title="Marcar como pago"><i class="fas fa-check-circle"></i> Pago</button>` : `<span class="badge badge-pago">PAGO</span>`}
            </div>
          </td>
        </tr>
      `;
    });
    tbody.innerHTML = rows;
  });
}

// IMPRESSÃO DE BOLETO
// IMPRESSÃO DE BOLETO
function gerarEImprimirBoletoAutomatico(boleto) {
  if (!boleto) {
    showToast('Dados do boleto não encontrados.', 'error');
    return;
  }

  const pixChave = boleto.chave_pix || "kywifitelecom@gmail.com";
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(pixChave)}`;
  const linhaDigitavel = boleto.linha_digitavel || "75691.40333 40333.000000 40333.000010 7 00000000009990";
  const linhaDigitavelLimpa = linhaDigitavel.replace(/\D/g, '');
  const codigoBarrasUrl = `https://bwipjs-api.metafloor.com/?bcid=i2of5&text=${linhaDigitavelLimpa}&scale=2&height=14`;
  const valorDoc = parseFloat(boleto.valor || 0).toFixed(2).replace('.', ',');

  const win = window.open('', '_blank', 'width=920,height=900');
  win.document.write(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Boleto Bancário - ${boleto.nosso_numero || boleto.id || '2a-Via'}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Arial', sans-serif; }
        body { background: #f5f5f5; color: #000; padding: 20px; font-size: 10px; }
        .boleto-paper { max-width: 800px; margin: 0 auto; background: #fff; padding: 25px; border: 1px solid #ccc; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        
        .recibo-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #6A1B9A; padding-bottom: 10px; margin-bottom: 15px; }
        .recibo-header img { height: 45px; }
        .recibo-header .empresa-info { text-align: right; font-size: 11px; line-height: 1.4; color: #333; }
        
        .linha-corte { border-top: 1px dashed #777; margin: 20px 0; position: relative; text-align: right; }
        .linha-corte span { font-size: 9px; background: #fff; padding: 0 5px; position: relative; top: -7px; color: #555; }
        
        .banco-header { display: flex; align-items: flex-end; border-bottom: 2px solid #000; padding-bottom: 4px; margin-bottom: 2px; }
        .banco-logo { font-size: 22px; font-weight: 900; color: #003366; width: 130px; letter-spacing: -0.5px; }
        .codigo-banco { font-size: 18px; font-weight: bold; padding: 0 12px; border-left: 2px solid #000; border-right: 2px solid #000; }
        .linha-digitavel { font-size: 13px; font-weight: bold; margin-left: auto; letter-spacing: 0.8px; font-family: monospace; }
        
        table.b-table { width: 100%; border-collapse: collapse; margin-bottom: -1px; }
        table.b-table td { border: 1px solid #000; padding: 5px 7px; vertical-align: top; }
        .lbl { font-size: 8px; font-weight: bold; text-transform: uppercase; color: #444; display: block; margin-bottom: 2px; }
        .val { font-size: 11px; font-weight: bold; color: #000; }
        .val-destaque { font-size: 13px; font-weight: 800; text-align: right; color: #000; }
        
        .pix-section { display: flex; gap: 15px; align-items: center; margin-top: 8px; background: #f9f9f9; padding: 8px; border-radius: 6px; border: 1px solid #ddd; }
        .pix-qr { text-align: center; }
        .pix-qr img { width: 100px; height: 100px; display: block; border: 1px solid #bbb; border-radius: 4px; }
        .pix-txt { font-size: 10px; line-height: 1.5; color: #222; }
        .pix-txt code { background: #eee; padding: 2px 6px; border-radius: 3px; font-family: monospace; font-size: 11px; font-weight: bold; }
        
        .barcode-container { text-align: center; margin-top: 20px; padding-top: 10px; }
        .barcode-container img { max-width: 100%; height: 55px; }
        
        @media print {
          body { background: #fff; padding: 0; }
          .boleto-paper { border: none; box-shadow: none; padding: 0; }
        }
      </style>
    </head>
    <body>
      <div class="boleto-paper">
        <div class="recibo-header">
          <img src="https://i.ibb.co/Xrz7n7dX/image-9658f0-removebg-preview.png" alt="Ky WIFI Telecom">
          <div class="empresa-info">
            <strong>KY TELECOMUNICACOES LTDA</strong><br>
            CNPJ: 22.131.209/0001-93<br>
            Atendimento: (61) 98203-1828 | Águas Lindas de Goiás - GO
          </div>
        </div>
        
        <table class="b-table">
          <tr>
            <td colspan="3"><span class="lbl">Beneficiário</span><span class="val">KY TELECOMUNICACOES LTDA - CNPJ: 22.131.209/0001-93</span></td>
            <td><span class="lbl">Vencimento</span><span class="val">${boleto.vencimento || 'A vencer'}</span></td>
          </tr>
          <tr>
            <td colspan="3"><span class="lbl">Pagador</span><span class="val">${boleto.cliente_nome || 'Cliente'} - CPF: ${boleto.cliente_cpf || ''}</span></td>
            <td><span class="lbl">Valor do Documento</span><span class="val-destaque">R$ ${valorDoc}</span></td>
          </tr>
        </table>

        <div class="linha-corte">
          <span>✂ Corte na linha pontilhada</span>
        </div>

        <div class="banco-header">
          <div class="banco-logo">SICOOB</div>
          <div class="codigo-banco">756-0</div>
          <div class="linha-digitavel">${linhaDigitavel}</div>
        </div>

        <table class="b-table">
          <tr>
            <td colspan="3"><span class="lbl">Local de Pagamento</span><span class="val">Pagável em qualquer banco ou via PIX até o vencimento</span></td>
            <td><span class="lbl">Vencimento</span><span class="val-destaque">${boleto.vencimento || ''}</span></td>
          </tr>
          <tr>
            <td colspan="3"><span class="lbl">Beneficiário</span><span class="val">KY TELECOMUNICACOES LTDA - CNPJ: 22.131.209/0001-93</span></td>
            <td><span class="lbl">Agência/Código Beneficiário</span><span class="val">4033 / 00010-7</span></td>
          </tr>
          <tr>
            <td><span class="lbl">Data do Documento</span><span class="val">${new Date().toLocaleDateString('pt-BR')}</span></td>
            <td><span class="lbl">Nº do Documento</span><span class="val">${boleto.nosso_numero || boleto.id || '0000'}</span></td>
            <td><span class="lbl">Especie Doc.</span><span class="val">DS</span></td>
            <td><span class="lbl">(=) Valor do Documento</span><span class="val-destaque">R$ ${valorDoc}</span></td>
          </tr>
          <tr>
            <td colspan="3" rowspan="2">
              <span class="lbl">Instruções (Texto de Responsabilidade do Beneficiário)</span>
              <div style="font-size: 10px; line-height: 1.4; color: #222; margin-bottom: 6px;">
                • Não receber após 30 dias do vencimento.<br>
                • Sujeito a suspensão dos serviços em caso de inadimplência.<br>
                • Dúvidas ou suporte: (61) 98203-1828.
              </div>
              <div class="pix-section">
                <div class="pix-qr">
                  <img src="${qrCodeUrl}" alt="QR Code PIX">
                </div>
                <div class="pix-txt">
                  <strong style="color: #6A1B9A; font-size: 11px;">PAGUE MAIS RÁPIDO COM PIX</strong><br>
                  Escaneie o QR Code ao lado pelo app do seu banco ou utilize a chave PIX:<br>
                  <code>${pixChave}</code>
                </div>
              </div>
            </td>
            <td><span class="lbl">(-) Descontos / Abatimento</span></td>
          </tr>
          <tr>
            <td><span class="lbl">(=) Valor Cobrado</span></td>
          </tr>
        </table>

        <div class="barcode-container">
          <img src="${codigoBarrasUrl}" alt="Código de Barras Boleto">
        </div>
      </div>
    </body>
    </html>
  `);
  win.document.close();
  // Dispara a impressão automaticamente após o carregamento
  setTimeout(() => { win.print(); }, 600);
}

async function imprimirBoleto(id) {
  try {
    const snap = await db.ref(`boletos/${id}`).once('value');
    const boleto = snap.val();
    if (!boleto) {
      showToast('Boleto não encontrado.', 'error');
      return;
    }
    gerarEImprimirBoletoAutomatico(boleto);
  } catch (err) {
    console.error(err);
    showToast('Erro ao abrir boleto para impressão.', 'error');
  }
}

async function marcarComoPago(id) {
  if (!confirm('Confirmar o recebimento e marcar este boleto como PAGO?')) return;
  try {
    await db.ref(`boletos/${id}`).update({
      status: 'pago',
      pago_em: new Date().toISOString(),
      pago_por: usuarioAtual ? usuarioAtual.nome : 'sistema'
    });
    showToast('Boleto marcado como PAGO!', 'success');
  } catch (err) {
    showToast('Erro ao atualizar boleto.', 'error');
  }
}

async function abrirModalBoleto() {
  document.getElementById('formBoleto').reset();
  const dataPadrao = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  document.getElementById('bolVencimento').value = dataPadrao;

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
      Object.values(contratos).forEach(c => {
        if (c.cliente_cpf === cpf && c.status === 'ativo') {
          valorSugerido = c.valor;
        }
      });

      const opt = document.createElement('option');
      opt.value = cpf;
      opt.dataset.valor = valorSugerido;
      opt.dataset.nome = cli.nome || 'Cliente';
      opt.textContent = `${cli.nome || 'Cliente'} - CPF: ${formatarCPF(cpf)}`;
      selectCli.appendChild(opt);
    });

  } catch (err) {
    showToast('Erro ao carregar clientes.', 'error');
  }

  abrirModalElemento('modalBoleto');
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

function fecharModalBoleto() { fecharModalElemento('modalBoleto'); }

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
  const nossoNum = `756${Math.floor(10000000 + Math.random() * 90000000)}`;
  const linhaDigitavel = `75691.40333 40333.${nossoNum.slice(-5)} 40333.000010 7 00000000009990`;

  const novoBoleto = {
    id: newRef.key,
    cliente_cpf: cpfLimpo,
    cliente_nome: option ? option.dataset.nome : 'Cliente',
    nosso_numero: nossoNum,
    linha_digitavel: linhaDigitavel,
    chave_pix: "kywifitelecom@gmail.com",
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
  if (!isAdmin()) return;
  const tbody = document.getElementById('listaUsuariosAdmin');
  if (!tbody) return;
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
      const cpfEsc = (u.cpf || key).replace(/'/g, "\\'");
      rows += `
        <tr>
          <td><strong>${u.nome || 'Administrador'}</strong></td>
          <td>${formatarCPF(u.cpf || key)}</td>
          <td><span class="badge badge-${u.tipo || 'admin'}">${(u.tipo || 'admin').toUpperCase()}</span></td>
          <td>${u.email || '-'}</td>
          <td><span class="badge badge-ativo">${(u.status || 'ativo').toUpperCase()}</span></td>
          <td>
            <button class="btn-action btn-orange" onclick="editarUsuarioAdmin('${cpfEsc}')" title="Editar"><i class="fas fa-edit"></i></button>
            <button class="btn-action btn-danger" onclick="deletarUsuarioAdmin('${cpfEsc}')" title="Remover"><i class="fas fa-user-minus"></i></button>
          </td>
        </tr>
      `;
    });
    tbody.innerHTML = rows;
  });
}

async function salvarUsuarioAdmin(e) {
  e.preventDefault();
  if (!isAdmin()) {
    showToast('Apenas o Admin Geral pode gerenciar usuários.', 'error');
    return;
  }
  const cpfLimpo = document.getElementById('usrCpf').value.replace(/\D/g, '');
  const dataNascimento = document.getElementById('usrDataNascimento').value;
  const email = document.getElementById('usrEmail').value.trim();
  const senha = document.getElementById('usrSenha').value;
  const isEdit = !!document.getElementById('usrId').value;

  if (!cpfLimpo || cpfLimpo.length !== 11) {
    showToast('CPF inválido.', 'error');
    return;
  }
  if (!dataNascimento) {
    showToast('Informe a data de nascimento.', 'error');
    return;
  }

  const dados = {
    nome: document.getElementById('usrNome').value.trim(),
    cpf: cpfLimpo,
    data_nascimento: dataNascimento,
    email: email || '',
    tipo: document.getElementById('usrTipo').value || 'admin',
    status: 'ativo'
  };

  try {
    if (isEdit) {
      const snap = await db.ref(`usuarios/${cpfLimpo}`).once('value');
      const atual = snap.val() || {};
      dados.senha = senha ? senha : (atual.senha || '');
      dados.created_at = atual.created_at || new Date().toISOString();
      await db.ref(`usuarios/${cpfLimpo}`).update(dados);
      showToast('Usuário atualizado com sucesso!', 'success');
    } else {
      if (!senha) {
        showToast('Informe a senha de acesso.', 'error');
        return;
      }
      dados.senha = senha;
      dados.created_at = new Date().toISOString();
      await db.ref(`usuarios/${cpfLimpo}`).set(dados);
      showToast('Usuário cadastrado com sucesso!', 'success');
    }
    fecharModalUsuario();
  } catch (err) {
    console.error(err);
    showToast('Erro ao salvar usuário.', 'error');
  }
}

async function editarUsuarioAdmin(cpf) {
  const snap = await db.ref(`usuarios/${cpf}`).once('value');
  const u = snap.val();
  if (!u) {
    showToast('Usuário não encontrado.', 'error');
    return;
  }
  document.getElementById('usrId').value = cpf;
  document.getElementById('usrNome').value = u.nome || '';
  document.getElementById('usrDataNascimento').value = u.data_nascimento || '';
  document.getElementById('usrEmail').value = u.email || '';
  document.getElementById('usrCpf').value = formatarCPF(u.cpf || cpf);
  document.getElementById('usrCpf').readOnly = true;
  document.getElementById('usrSenha').value = '';
  document.getElementById('usrSenha').placeholder = 'Deixe em branco para manter a senha atual';
  document.getElementById('usrSenha').required = false;
  document.getElementById('usrTipo').value = u.tipo || 'admin';
  document.getElementById('modalUsuarioTitulo').innerText = 'Editar Usuário Admin';
  abrirModalElemento('modalUsuario');
}

async function deletarUsuarioAdmin(cpf) {
  if (!isAdmin()) {
    showToast('Apenas o Admin Geral pode remover usuários.', 'error');
    return;
  }
  if (confirm('Deseja remover o acesso deste usuário?')) {
    await db.ref(`usuarios/${cpf}`).remove();
    showToast('Usuário removido com sucesso.', 'success');
  }
}

function abrirModalUsuario() {
  if (!isAdmin()) {
    showToast('Apenas o Admin Geral pode cadastrar usuários.', 'error');
    return;
  }
  document.getElementById('formUsuarioAdmin').reset();
  document.getElementById('usrId').value = '';
  document.getElementById('usrCpf').readOnly = false;
  document.getElementById('usrSenha').required = true;
  document.getElementById('usrSenha').placeholder = 'Digite a senha';
  document.getElementById('modalUsuarioTitulo').innerText = 'Cadastrar Usuário Admin';
  abrirModalElemento('modalUsuario');
}

function fecharModalUsuario() { fecharModalElemento('modalUsuario'); }

// EXPORTAR PLANILHA
function exportarPlanilha() {
  db.ref('contratos').once('value', snapshot => {
    const data = snapshot.val();
    if (!data) return showToast('Nenhum dado para exportar.', 'error');

    let csvContent = "data:text/csv;charset=utf-8,Cliente,CPF,Plano,Valor,Vencimento,Status\n";
    Object.values(data).forEach(c => {
      csvContent += `"${c.cliente_nome || ''}","${c.cliente_cpf || ''}","${c.plano || ''}","${c.valor || ''}","${c.dia_vencimento || ''}","${c.status || ''}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "contratos_kywifi.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
}

function logout() {
  localStorage.removeItem('usuarioLogado');
  window.location.href = 'login.html';
}

function formatarCPF(cpf) {
  if (!cpf) return '-';
  const c = String(cpf).replace(/\D/g, '');
  if (c.length !== 11) return cpf;
  return c.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

function formatarData(dataStr) {
  if (!dataStr) return '-';
  if (dataStr.includes('T')) {
    const d = new Date(dataStr);
    return d.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  }
  const partes = dataStr.split('-');
  if (partes.length === 3) {
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }
  return dataStr;
}