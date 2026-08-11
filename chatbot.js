/* ==========================================================================
   KY BOT - CHATBOT IA DA KY WIFI TELECOM
   ========================================================================== */

const GROQ_API_KEY = "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";

// Injeta o HTML do Widget no body da página automaticamente
function renderKyChatWidget() {
    if (document.getElementById('ky-chat-widget')) return;

    const widgetHTML = `
        <div id="ky-chat-widget">
            <button id="ky-chat-toggle" class="ky-chat-btn" aria-label="Abrir Chatbot Assistente Virtual" onclick="toggleKyChat()">
                <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80" alt="Avatar Chatbot IA" class="ky-btn-avatar">
            </button>

            <div id="ky-chat-box" class="ky-chat-box ky-chat-hidden">
                <div class="ky-chat-header">
                    <div class="ky-chat-title">
                        <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80" alt="Foto Assistente IA Chatbot" class="ky-header-avatar">
                        <div class="ky-chat-info">
                            <strong>Ky Bot</strong>
                            <span class="ky-status"><span class="ky-status-dot"></span> Chatbot IA Online</span>
                        </div>
                    </div>
                    <button onclick="toggleKyChat()" class="ky-chat-close" aria-label="Fechar Chat">
                        <svg style="width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:2.5" viewBox="0 0 24 24">
                            <path d="M18 6L6 18M6 6l12 12" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                </div>

                <div id="ky-chat-messages" class="ky-chat-messages">
                    <div class="ky-msg ky-bot-msg">
                        Olá! Sou o Chatbot assistente virtual da <strong>Ky WIFI Telecom</strong>. Como posso te ajudar hoje?
                        <a href="contratar.html" class="ky-action-card">
                            <span class="ky-action-card-content">
                                <svg class="ky-svg-icon" viewBox="0 0 24 24"><path d="M12 3C7.58 3 3.6 4.8 0 7.69L2.35 10.82C5.33 8.37 8.5 7 12 7C15.5 7 18.67 8.37 21.65 10.82L24 7.69C20.4 4.8 16.42 3 12 3ZM12 9C8.94 9 6.13 10.22 3.53 12.21L5.88 15.34C7.8 13.82 9.8 13 12 13C14.2 13 16.2 13.82 18.12 15.34L20.47 12.21C17.87 10.22 15.06 9 12 9ZM12 15C10.27 15 8.65 15.65 7.18 16.73L12 23.16L16.82 16.73C15.35 15.65 13.73 15 12 15Z"/></svg>
                                Ver Planos e Contratar
                            </span>
                            <svg class="ky-svg-icon" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>
                        </a>
                    </div>
                </div>

                <div class="ky-chat-input-area">
                    <input type="text" id="ky-chat-input" placeholder="Digite sua dúvida..." onkeypress="handleKyKey(event)">
                    <button onclick="sendKyMessage()" aria-label="Enviar">
                        <svg style="width:16px;height:16px;fill:currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', widgetHTML);
}

function toggleKyChat() {
    const chatBox = document.getElementById('ky-chat-box');
    if (chatBox) chatBox.classList.toggle('ky-chat-hidden');
}

function handleKyKey(e) {
    if (e.key === 'Enter') sendKyMessage();
}

function formatKyBotText(text) {
    let formatted = text;
    const svgCart = `<svg class="ky-svg-icon" viewBox="0 0 24 24"><path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/></svg>`;
    const svgHeadset = `<svg class="ky-svg-icon" viewBox="0 0 24 24"><path d="M12 1a9 9 0 0 0-9 9v7c0 1.66 1.34 3 3 3h3v-8H5v-2c0-3.87 3.13-7 7-7s7 3.13 7 7v2h-4v8h3c1.66 0 3-1.34 3-3v-7a9 9 0 0 0-9-9z"/></svg>`;
    const svgWhatsapp = `<svg class="ky-svg-icon" viewBox="0 0 24 24"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm5.95 14.13c-.25.7-.84 1.25-1.57 1.48-.48.15-1.1.28-3.23-.6-2.73-1.13-4.5-3.89-4.64-4.08-.14-.19-1.11-1.48-1.11-2.82 0-1.34.7-1.99.95-2.26.25-.26.55-.33.73-.33.19 0 .37 0 .53.01.17.01.4.01.58.44.19.45.64 1.57.7 1.69.06.12.1.26.02.42-.08.16-.12.26-.24.4-.12.14-.25.31-.36.42-.12.12-.24.25-.1.49.14.24.62 1.02 1.33 1.65.91.81 1.68 1.06 1.92 1.18.24.12.38.1.52-.06.14-.16.61-.71.77-.95.16-.24.32-.2.53-.12.21.08 1.35.64 1.58.75.23.11.38.17.44.27.06.1.06.58-.19 1.28z"/></svg>`;
    const svgArrow = `<svg class="ky-svg-icon" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`;

    formatted = formatted.replace(/contratar\.html(\?plano=\d+)?/gi, function(match) {
        return `<a href="${match}" class="ky-action-card">
            <span class="ky-action-card-content">${svgCart} Clique aqui para Contratar</span>
            ${svgArrow}
        </a>`;
    });

    formatted = formatted.replace(/suporte\.html/gi, function() {
        return `<a href="suporte.html" class="ky-action-card">
            <span class="ky-action-card-content">${svgHeadset} Ir para Área de Suporte</span>
            ${svgArrow}
        </a>`;
    });

    formatted = formatted.replace(/(https?:\/\/wa\.me\/\d+|wa\.me\/\d+)/gi, function(match) {
        const url = match.startsWith('http') ? match : 'https://' + match;
        return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="ky-action-card ky-action-card-wa">
            <span class="ky-action-card-content">${svgWhatsapp} Falar no WhatsApp</span>
            ${svgArrow}
        </a>`;
    });

    formatted = formatted.replace(/\n/g, '<br>');
    return formatted;
}

async function sendKyMessage() {
    const input = document.getElementById('ky-chat-input');
    const text = input.value.trim();
    if (!text) return;

    appendKyMessage(text, 'user');
    input.value = '';

    const loadingId = appendKyMessage('Digitando...', 'bot');

    try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${GROQ_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    {
                        role: "system",
                        content: `Voce e o Ky Bot, chatbot assistente virtual da Ky WIFI Telecom em Aguas Lindas de Goias.
                        Planos: 400 Mega (R$79,90), 700 Mega (R$99,90), 1000 Mega (R$139,90). Todos com Wi-Fi 6 e Instalacao Gratis.
                        Para contratar: SEMPRE responda incluindo exatamente o link "contratar.html" (ou "contratar.html?plano=400", etc).
                        Para suporte, faturas ou trocar senha: SEMPRE responda incluindo o link "suporte.html" ou "https://wa.me/5561982031828".
                        REGRA OBRIGATORIA: NAO utilize nenhum emoji em suas respostas. Use apenas texto direto, amigavel e objetivo em no maximo 3 frases.`
                    },
                    { role: "user", content: text }
                ],
                max_tokens: 250
            })
        });

        const data = await response.json();
        const rawReply = data.choices[0]?.message?.content || "Desculpe, tive um problema ao responder. Fale conosco pelo WhatsApp: https://wa.me/5561982031828";
        document.getElementById(loadingId).innerHTML = formatKyBotText(rawReply);

    } catch (error) {
        console.error("Erro na API Groq:", error);
        document.getElementById(loadingId).innerHTML = formatKyBotText("No momento estou indisponivel. Fale com nosso suporte no WhatsApp: https://wa.me/5561982031828");
    }
}

function appendKyMessage(text, sender) {
    const container = document.getElementById('ky-chat-messages');
    if (!container) return;
    
    const msgDiv = document.createElement('div');
    const id = 'msg-' + Date.now();
    msgDiv.id = id;
    msgDiv.className = `ky-msg ${sender === 'user' ? 'ky-user-msg' : 'ky-bot-msg'}`;
    
    if (sender === 'user') {
        msgDiv.innerText = text;
    } else {
        msgDiv.innerHTML = text;
    }

    container.appendChild(msgDiv);
    container.scrollTop = container.scrollHeight;
    return id;
}

// Inicializa o widget quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', renderKyChatWidget);