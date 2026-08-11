const numeroWhatsApp = "5561982031828";

// Função para enviar mensagem personalizada para o WhatsApp
function falarComAtendente(event, planoNome = "", planoVelocidade = "") {
    if (event) event.preventDefault();
    
    let textoBase = "Olá! Estou acessando o site e gostaria de saber mais informações sobre a Ky WIFI.";
    
    if (planoNome && planoVelocidade) {
        textoBase = `Olá! Gostaria de contratar o Plano ${planoNome} de ${planoVelocidade} MEGA com Instalação Grátis e Wi-Fi 6!`;
    }
    
    const mensagem = encodeURIComponent(textoBase);
    window.open(`https://wa.me/${numeroWhatsApp}?text=${mensagem}`, '_blank', 'noopener,noreferrer');
}

// Alternar visibilidade do menu responsivo (Hambúrguer) e atualizar ARIA
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

// Fechar menu responsivo ao clicar num link
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

// Máscara dinâmica para o CPF (000.000.000-00)
function aplicarMascaraCPF(input) {
    let value = input.value.replace(/\D/g, "");
    if (value.length > 11) value = value.slice(0, 11);
    
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    
    input.value = value;
}

// Máscara dinâmica para Telefone/WhatsApp ((00) 00000-0000)
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

// Inicializar máscaras de campos de formulário automaticamente se existirem
document.addEventListener("DOMContentLoaded", () => {
    const inputCPF = document.getElementById("cpf");
    if (inputCPF) {
        inputCPF.addEventListener("input", (e) => aplicarMascaraCPF(e.target));
    }

    const inputTelefone = document.getElementById("telefone");
    if (inputTelefone) {
        inputTelefone.addEventListener("input", (e) => aplicarMascaraTelefone(e.target));
    }
});

// Array de Planos
const planos = [
    { nome: 'Básico', velocidade: '400', preco: '79,90', destaque: false },
    { nome: 'Família', velocidade: '700', preco: '99,90', destaque: true },
    { nome: 'Gamer Ultra', velocidade: '1000', preco: '139,90', destaque: false }
];

const containerPlanos = document.getElementById('plans-container');

// Gerar e inserir dinamicamente os cards de planos no HTML
if (containerPlanos) {
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

// Intersection Observer para animações suaves no scroll
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
// --- Gerenciamento de Cookies LGPD ---
document.addEventListener('DOMContentLoaded', () => {
    const lgpdBanner = document.getElementById('lgpd-banner');
    const acceptBtn = document.getElementById('lgpd-accept');
    const rejectBtn = document.getElementById('lgpd-reject');

    // Chave utilizada para salvar no navegador
    const STORAGE_KEY = 'ky_telecom_lgpd_consent';

    // Verifica se o usuário já definiu a preferência
    const userConsent = localStorage.getItem(STORAGE_KEY);

    if (!userConsent) {
        // Exibe o banner após um pequeno atraso para suavizar o carregamento
        setTimeout(() => {
            lgpdBanner.classList.add('active');
        }, 500);
    }

    // Função para fechar o banner e gravar a escolha
    const setConsent = (type) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            consent: type,
            timestamp: new Date().toISOString()
        }));

        lgpdBanner.classList.remove('active');

        // Se aceitou todos, inicialize scripts de rastreamento (ex: Analytics/Pixel)
        if (type === 'all') {
            initTrackingScripts();
        }
    };

    if (acceptBtn) {
        acceptBtn.addEventListener('click', () => setConsent('all'));
    }

    if (rejectBtn) {
        rejectBtn.addEventListener('click', () => setConsent('essential'));
    }
});

// Função para carregar scripts não-essenciais apenas após o consentimento
function initTrackingScripts() {
    // Insira aqui scripts como Google Analytics ou Facebook Pixel, se houver
    console.log('LGPD: Consentimento total concedido. Carregando scripts de medição.');
}