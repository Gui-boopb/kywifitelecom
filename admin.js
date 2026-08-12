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

async function editarContrato(id) {
  const snapContrato = await db.ref(`contratos/${id}`).once('value');
  const c = snapContrato.val();
  if (!c) return showToast('Contrato não encontrado.', 'error');

  const snapCliente = await db.ref(`clientes/${c.cliente_cpf}`).once('value');
  const cli = snapCliente.val() || {};

  document.getElementById('contratoId').value = id;
  document.getElementById('nome').value = c.cliente_nome || cli.nome || '';
  document.getElementById('cpf').value = formatarCPF(c.cliente_cpf);
  document.getElementById('dataNascimento').value = cli.data_nascimento || '';
  document.getElementById('nomeMae').value = cli.nome_mae || '';
  document.getElementById('telefone').value = cli.telefone || '';
  document.getElementById('cep').value = cli.cep || '';
  document.getElementById('endereco').value = cli.endereco || '';
  document.getElementById('plano').value = c.plano;
  document.getElementById('valor').value = c.valor;
  document.getElementById('diaVencimento').value = c.dia_vencimento;
  document.getElementById('status').value = c.status;

  document.getElementById('modalTitulo').innerText = 'Editar Contrato';
  document.getElementById('modalContrato').style.display = 'flex';
}

// IMPRIMIR CONTRATO COMPLETO
async function imprimirContrato(id) {
  const snap = await db.ref(`contratos/${id}`).once('value');
  const c = snap.val();
  if (!c) return showToast('Contrato não encontrado.', 'error');

  const snapCli = await db.ref(`clientes/${c.cliente_cpf}`).once('value');
  const cli = snapCli.val() || {};

  const win = window.open('', '_blank');
  win.document.write(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Contrato - ${c.cliente_nome}</title>
      <style>
        @media print { body { padding: 0; } }
        body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #222; margin: 0; padding: 40px; font-size: 13px; line-height: 1.6; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #6A1B9A; padding-bottom: 15px; margin-bottom: 20px; }
        .logo { height: 50px; }
        .company-info { text-align: right; font-size: 11px; color: #555; }
        h1 { color: #6A1B9A; font-size: 16px; text-transform: uppercase; text-align: center; margin-bottom: 20px; font-weight: bold; }
        .box-data { background: #F8FAFC; border: 1px solid #CBD5E1; padding: 18px; border-radius: 8px; margin-bottom: 20px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .grid-full { grid-column: span 2; }
        .label { font-weight: bold; color: #4A148C; }
        .terms { text-align: justify; font-size: 12px; color: #333; margin-bottom: 40px; }
        .terms h3 { font-size: 13px; color: #6A1B9A; margin-top: 15px; margin-bottom: 5px; text-transform: uppercase; }
        .signatures { display: flex; justify-content: space-between; margin-top: 60px; page-break-inside: avoid; }
        .sig-box { width: 45%; text-align: center; border-top: 1px solid #333; padding-top: 8px; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="header">
        <img src="https://i.ibb.co/Xrz7n7dX/image-9658f0-removebg-preview.png" class="logo" alt="Ky WIFI Telecom">
        <div class="company-info">
          <strong>KY TELECOMUNICACOES LTDA</strong><br>
          CNPJ: 22.131.209/0001-93<br>
          Atendimento: (61) 98203-1828 | Águas Lindas de Goiás - GO
        </div>
      </div>

      <h1>TERMO DE ADESÃO E CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE INTERNET</h1>

      <div class="box-data">
        <div class="grid">
          <div><span class="label">Cliente:</span> ${c.cliente_nome}</div>
          <div><span class="label">CPF:</span> ${formatarCPF(c.cliente_cpf)}</div>
          <div><span class="label">Telefone:</span> ${cli.telefone || 'Não informado'}</div>
          <div><span class="label">Data de Nascimento:</span> ${formatarData(cli.data_nascimento)}</div>
          <div><span class="label">Nome da Mãe:</span> ${cli.nome_mae || 'Não informado'}</div>
          <div><span class="label">CEP:</span> ${cli.cep || 'Não informado'}</div>
          <div class="grid-full"><span class="label">Endereço Completo:</span> ${cli.endereco || 'Não informado'}</div>
          <div><span class="label">Plano Contratado:</span> ${c.plano}</div>
          <div><span class="label">Valor Mensal:</span> R$ ${parseFloat(c.valor).toFixed(2)}</div>
          <div><span class="label">Dia de Vencimento:</span> Todo dia ${c.dia_vencimento}</div>
          <div><span class="label">Status do Contrato:</span> ${(c.status || 'ATIVO').toUpperCase()}</div>
        </div>
      </div>

      <div class="terms">
        <h3>1. DO OBJETO</h3>
        <p>O presente contrato tem por objeto a prestação de Serviços de Comunicação de Multimídia (Acesso à Internet em Banda Larga via Fibra Óptica) pela CONTRATADA ao CONTRATANTE, de acordo com o plano contratado e descrito acima.</p>

        <h3>2. DAS OBRIGAÇÕES E DO PAGAMENTO</h3>
        <p>O CONTRATANTE compromete-se a efetuar o pagamento do valor mensal até a data estipulada de vencimento. O não pagamento até a data do vencimento sujeitará o cliente a juros, multa por atraso e suspensão temporária dos serviços conforme regulamentação vigente da ANATEL.</p>

        <h3>3. DA MANUTENÇÃO E SUPORTE</h3>
        <p>A CONTRATADA responsabiliza-se pela manutenção da rede e garantia do sinal até o ponto de terminação óptica instalado no endereço do cliente, prestando suporte técnico dentro dos prazos operacionais estabelecidos.</p>
      </div>

      <div class="signatures">
        <div class="sig-box">
          <strong>KY TELECOMUNICACOES LTDA</strong><br>
          Contratada
        </div>
        <div class="sig-box">
          <strong>${c.cliente_nome}</strong><br>
          CPF: ${formatarCPF(c.cliente_cpf)}<br>
          Contratante
        </div>
      </div>

      <script>
        window.onload = function() { window.print(); }
      </script>
    </body>
    </html>
  `);
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
          <td><code>${b.nosso_numero || key}</code></td>
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

// IMPRIMIR BOLETO IGUAL AO DO BOT (LAYOUT BANCÁRIO SICOOB / FEBRABAN)
async function imprimirBoleto(id) {
  const snap = await db.ref(`boletos/${id}`).once('value');
  const boleto = snap.val();
  if (!boleto) return showToast('Boleto não encontrado no sistema.', 'error');

  const snapCli = await db.ref(`clientes/${boleto.cliente_cpf}`).once('value');
  const cli = snapCli.val() || {};

  const pixChave = boleto.chave_pix || "kywifitelecom@gmail.com";
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(pixChave)}`;
  const linhaDigitavel = boleto.linha_digitavel || "75691.40333 40333.000000 40333.000010 7 00000000009990";
  const linhaDigitavelLimpa = linhaDigitavel.replace(/\D/g, '');
  const codigoBarrasUrl = `https://bwipjs-api.metafloor.com/?bcid=i2of5&text=${linhaDigitavelLimpa}&scale=2&height=14`;
  const valorDoc = parseFloat(boleto.valor || 0).toFixed(2).replace('.', ',');
  const dataVenc = boleto.vencimento ? formatarData(boleto.vencimento) : 'A vencer';

  const win = window.open('', '_blank', 'width=920,height=900');
  win.document.write(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <title>Boleto Bancário - ${boleto.nosso_numero || id}</title>
        <style>
            * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Arial', sans-serif; }
            body { background: #f5f5f5; color: #000; padding: 20px; font-size: 10px; }
            .boleto-paper { max-width: 800px; margin: 0 auto; background: #fff; padding: 25px; border: 1px solid #ccc; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
            
            /* Recibo do Sacado */
            .recibo-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #6A1B9A; padding-bottom: 10px; margin-bottom: 15px; }
            .recibo-header img { height: 45px; }
            .recibo-header .empresa-info { text-align: right; font-size: 11px; line-height: 1.4; color: #333; }
            
            /* Linha de Corte */
            .linha-corte { border-top: 1px dashed #777; margin: 20px 0; position: relative; text-align: right; }
            .linha-corte span { font-size: 9px; background: #fff; padding: 0 5px; position: relative; top: -7px; color: #555; }
            
            /* Tabela do Boleto */
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
            <!-- COMPROVANTE / RECIBO DO PAGADOR -->
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
                    <td><span class="lbl">Vencimento</span><span class="val">${dataVenc}</span></td>
                </tr>
                <tr>
                    <td colspan="3"><span class="lbl">Pagador</span><span class="val">${boleto.cliente_nome || 'Cliente'} - CPF: ${formatarCPF(boleto.cliente_cpf)}</span></td>
                    <td><span class="lbl">Valor do Documento</span><span class="val-destaque">R$ ${valorDoc}</span></td>
                </tr>
            </table>

            <div class="linha-corte">
                <span>✂ Corte na linha pontilhada</span>
            </div>

            <!-- FICHA DE COMPENSAÇÃO BANCÁRIA -->
            <div class="banco-header">
                <div class="banco-logo">SICOOB</div>
                <div class="codigo-banco">756-0</div>
                <div class="linha-digitavel">${linhaDigitavel}</div>
            </div>

            <table class="b-table">
                <tr>
                    <td colspan="3"><span class="lbl">Local de Pagamento</span><span class="val">Pagável em qualquer banco ou via PIX até o vencimento</span></td>
                    <td><span class="lbl">Vencimento</span><span class="val-destaque">${dataVenc}</span></td>
                </tr>
                <tr>
                    <td colspan="3"><span class="lbl">Beneficiário</span><span class="val">KY TELECOMUNICACOES LTDA - CNPJ: 22.131.209/0001-93</span></td>
                    <td><span class="lbl">Agência/Código Beneficiário</span><span class="val">4033 / 00010-7</span></td>
                </tr>
                <tr>
                    <td><span class="lbl">Data do Documento</span><span class="val">${new Date().toLocaleDateString('pt-BR')}</span></td>
                    <td><span class="lbl">Nº do Documento</span><span class="val">${boleto.nosso_numero || id}</span></td>
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
                <tr>
                    <td colspan="4">
                        <span class="lbl">Pagador / Sacado</span>
                        <div class="val">${boleto.cliente_nome || 'Cliente'} - CPF: ${formatarCPF(boleto.cliente_cpf)}</div>
                        <div style="font-size: 10px; color: #444;">${cli.endereco || 'Endereço não informado'}</div>
                    </td>
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
  setTimeout(() => { win.print(); }, 600);
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
    data_nascimento: dataNascimento,
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

// EXPORTAR PARA EXCEL (CSV)
function exportarPlanilha() {
  db.ref('contratos').once('value', snapshot => {
    const data = snapshot.val();
    if (!data) return showToast('Nenhum dado para exportar.', 'error');

    let csvContent = "data:text/csv;charset=utf-8,Cliente,CPF,Plano,Valor,Vencimento,Status\n";
    Object.values(data).forEach(c => {
      csvContent += `"${c.cliente_nome}","${c.cliente_cpf}","${c.plano}","${c.valor}","${c.dia_vencimento}","${c.status}"\n`;
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