/* ==========================================================================
   KY WIFI TELECOM - SCRIPT PRINCIPAL
   ========================================================================== */

// Configurações Globais
const NUMERO_WHATSAPP = "5561982031828";
const COOKIE_NAME = "ky_telecom_lgpd_consent";

/* --- 1. GERENCIAMENTO REAL DE COOKIES (document.cookie) --- */
function setCookie(name, value, days) {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = `${name}=${encodeURIComponent(value)}${expires}; path=/; SameSite=Lax`;
}

function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i].trim();
        if (c.indexOf(nameEQ) === 0) {
            return decodeURIComponent(c.substring(nameEQ.length, c.length));
        }
    }
    return null;
}

/* --- 2. SISTEMA DE CONSENTIMENTO LGPD / COOKIES --- */
function initLGPD() {
    const lgpdBanner = document.getElementById('lgpd-banner');
    const acceptBtn = document.getElementById('lgpd-accept');
    const rejectBtn = document.getElementById('lgpd-reject');

    if (!lgpdBanner) return;

    // Busca preferência salva nos Cookies de fato ou no localStorage
    const consent = getCookie(COOKIE_NAME) || localStorage.getItem(COOKIE_NAME);

    if (!consent) {
        // Exibe o banner suavemente após 500ms
        setTimeout(() => {
            lgpdBanner.classList.add('active');
        }, 500);
    } else if (consent === 'all') {
        initTrackingScripts();
    }

    if (acceptBtn) {
        acceptBtn.addEventListener('click', () => registrarConsentimento('all'));
    }

    if (rejectBtn) {
        rejectBtn.addEventListener('click', () => registrarConsentimento('essential'));
    }
}

function registrarConsentimento(tipo) {
    const lgpdBanner = document.getElementById('lgpd-banner');

    // Grava Cookie no navegador (válido por 1 ano / 365 dias)
    setCookie(COOKIE_NAME, tipo, 365);
    // Grava no LocalStorage como redundância
    localStorage.setItem(COOKIE_NAME, tipo);

    if (lgpdBanner) {
        lgpdBanner.classList.remove('active');
    }

    if (tipo === 'all') {
        initTrackingScripts();
    }
}

function initTrackingScripts() {
    console.log('LGPD: Consentimento total concedido. Cookies e Scripts de medição liberados.');
    // Espaço reservado para carregar scripts como Google Analytics ou Meta Pixel
}

/* --- 3. INTEGRAÇÃO COM WHATSAPP --- */
function falarComAtendente(event, planoNome = "", planoVelocidade = "") {
    if (event) event.preventDefault();
    
    let textoBase = "Olá! Estou acessando o site e gostaria de saber mais informações sobre a Ky WIFI.";
    
    if (planoNome && planoVelocidade) {
        textoBase = `Olá! Gostaria de contratar o Plano ${planoNome} de ${planoVelocidade} MEGA com Instalação Grátis e Wi-Fi 6!`;
    }
    
    const mensagem = encodeURIComponent(textoBase);
    window.open(`https://wa.me/${NUMERO_WHATSAPP}?text=${mensagem}`, '_blank', 'noopener,noreferrer');
}

/* --- 4. MENU RESPONSIVO --- */
function toggleMenu() {
    const navMenu = document.getElementById('navMenu');
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    if (navMenu) {
        const isActive = navMenu.classList.toggle('active');
        if (hamburgerBtn) {
            hamburgerBtn.setAttribute('aria-expanded', isActive ? 'true' : 'false');
        }
    }
}

function closeMenu() {
    const navMenu = document.getElementById('navMenu');
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    if (navMenu) {
        navMenu.classList.remove('active');
        if (hamburgerBtn) {
            hamburgerBtn.setAttribute('aria-expanded', 'false');
        }
    }
}

/* --- 5. MÁSCARAS DE INPUT (CPF E TELEFONE) --- */
function aplicarMascaraCPF(input) {
    let value = input.value.replace(/\D/g, "");
    if (value.length > 11) value = value.slice(0, 11);
    
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    
    input.value = value;
}

function aplicarMascaraTelefone(input) {
    let value = input.value.replace(/\D/g, "");
    if (value.length > 11) value = value.slice(0, 11);

    if (value.length > 10) {
        value = value.replace(/^(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    } else if (value.length > 5) {
        value = value.replace(/^(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
    } else if (value.length > 2) {
        value = value.replace(/^(\d{2})(\d{0,5})/, "($1) $2");
    } else {
        value = value.replace(/^(\d*)/, "($1");
    }

    input.value = value;
}

/* --- 6. RENDERIZAÇÃO DOS CARDS DE PLANOS --- */
function renderizarPlanos() {
    const containerPlanos = document.getElementById('plans-container');
    if (!containerPlanos) return;

    const planos = [
        { nome: 'Básico', velocidade: '400', preco: '79,90', destaque: false },
        { nome: 'Família', velocidade: '700', preco: '99,90', destaque: true },
        { nome: 'Gamer Ultra', velocidade: '1000', preco: '139,90', destaque: false }
    ];

    containerPlanos.innerHTML = '';
    planos.forEach((plano, index) => {
        const delay = index * 0.2;
        const cardHTML = `
            <div class="plan-card ${plano.destaque ? 'highlight' : ''}" style="animation-delay: ${delay}s">
                ${plano.destaque ? '<div class="plan-badge">Mais Vendido</div>' : ''}
                <div class="plan-name">${plano.nome}</div>
                <div class="plan-speed">${plano.velocidade}<small> MEGA</small></div>
                <div class="plan-price"><span class="currency">R$</span> ${plano.preco} <span class="period">/mês</span></div>
                <ul class="plan-features">
                    <li><i class="fas fa-check-circle" aria-hidden="true"></i> Instalação Grátis</li>
                    <li><i class="fas fa-check-circle" aria-hidden="true"></i> Roteador Wi-Fi 6</li>
                    <li><i class="fas fa-check-circle" aria-hidden="true"></i> Suporte 24/7</li>
                </ul>
                
                <a href="contratar.html?plano=${plano.velocidade}" class="btn-contract" aria-label="Assinar Plano ${plano.nome} de ${plano.velocidade} Mega">Assinar Plano</a>
            </div>
        `;
        containerPlanos.innerHTML += cardHTML;
    });
}

/* --- 7. REVELAÇÃO SUAVE AO ROLAR A PÁGINA --- */
function initObserver() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                if (entry.target.id === 'planos') {
                    document.querySelectorAll('.plan-card').forEach(card => {
                        card.classList.add('active-reveal');
                    });
                }
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

    const sectionPlanos = document.getElementById('planos');
    if (sectionPlanos) {
        observer.observe(sectionPlanos);
    }
}

/* --- 8. REGISTRO DO SERVICE WORKER --- */
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js', { scope: './' })
                .then(() => console.log('Service Worker registrado com sucesso.'))
                .catch(err => console.error('Erro ao registrar Service Worker:', err));
        });
    }
}

/* --- INICIALIZADOR PRINCIPAL --- */
document.addEventListener("DOMContentLoaded", () => {
    // Escutadores de input
    const inputCPF = document.getElementById("cpf");
    if (inputCPF) {
        inputCPF.addEventListener("input", (e) => aplicarMascaraCPF(e.target));
    }

    const inputTelefone = document.getElementById("telefone");
    if (inputTelefone) {
        inputTelefone.addEventListener("input", (e) => aplicarMascaraTelefone(e.target));
    }

    // Inicialização dos módulos do site
    renderizarPlanos();
    initObserver();
    initLGPD();
    registerServiceWorker();
});
let notaSelecionada = 5;

// Configura a seleção visual das estrelas
function definirNota(nota) {
    notaSelecionada = nota;
    document.getElementById('feedbackNota').value = nota;
    
    const estrelas = document.querySelectorAll('#starRatingInput .star-btn');
    estrelas.forEach((estrela, index) => {
        if (index < nota) {
            estrela.classList.add('active');
        } else {
            estrela.classList.remove('active');
        }
    });
}

// Inicializa com 5 estrelas selecionadas por padrão
definirNota(5);

// Salva o novo feedback e insere na tela
function salvarFeedback(event) {
    event.preventDefault();

    const nome = document.getElementById('feedbackNome').value.trim();
    const tipo = document.getElementById('feedbackTipo').value.trim();
    const comentario = document.getElementById('feedbackComentario').value.trim();
    const nota = parseInt(document.getElementById('feedbackNota').value);

    if (!nome || !comentario) return;

    const novoFeedback = {
        nome: nome,
        tipo: tipo,
        comentario: comentario,
        nota: nota
    };

    // Recupera depoimentos salvos no localStorage
    let depoimentosSalvos = JSON.parse(localStorage.getItem('ky_depoimentos')) || [];
    depoimentosSalvos.unshift(novoFeedback);
    localStorage.setItem('ky_depoimentos', JSON.stringify(depoimentosSalvos));

    // Renderiza o novo card na tela
    adicionarCardDepoimento(novoFeedback);

    // Reseta o formulário
    document.getElementById('feedbackForm').reset();
    definirNota(5);

    alert('Obrigado pelo seu feedback! Sua avaliação foi publicada.');
}

// Cria a estrutura do card HTML do depoimento
function adicionarCardDepoimento(depoimento) {
    const container = document.querySelector('.testimonials-container');
    if (!container) return;

    const card = document.createElement('div');
    card.className = 'testimonial-card';

    const estrelasTexto = '★'.repeat(depoimento.nota) + '☆'.repeat(5 - depoimento.nota);

    card.innerHTML = `
        <div class="stars" role="img" aria-label="Avaliação: ${depoimento.nota} de 5 estrelas">${estrelasTexto}</div>
        <p>"${depoimento.comentario}"</p>
        <h4>${depoimento.nome}</h4>
        <span>${depoimento.tipo}</span>
    `;

    // Insere o novo depoimento no topo da lista
    container.insertBefore(card, container.firstChild);
}

// Carrega os depoimentos salvos anteriormente quando a página abre
document.addEventListener('DOMContentLoaded', () => {
    const depoimentosSalvos = JSON.parse(localStorage.getItem('ky_depoimentos')) || [];
    depoimentosSalvos.reverse().forEach(depoimento => {
        adicionarCardDepoimento(depoimento);
    });
});