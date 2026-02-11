// script.js 

// Centraliza a inicialização da página
window.onload = () => {
    loadFlowsIntoSelect();
    loadQueue();
    // Inicia a atualização automática da fila
    setInterval(loadQueue, 5000);
};

// Carrega os fluxos no Select (Dropdown)
async function loadFlowsIntoSelect() {
    const select = document.getElementById('flowSelect');
    if (!select) return; // Evita erro se o select não existir na tela

    try {
        const response = await fetch('/flows');
        const flows = await response.json();

        if (flows.length === 0) {
            select.innerHTML = '<option value="">Nenhum fluxo criado</option>';
            return;
        }

        // Preenche o select: o 'value' guarda o UUID e o texto mostra o Nome
        select.innerHTML = flows.map(f =>
            `<option value="${f.id}">${f.name}</option>`
        ).join('');

    } catch (err) {
        console.error('Erro ao carregar fluxos:', err);
        select.innerHTML = '<option value="">Erro ao carregar</option>';
    }
}

// Carrega o status da fila de mensagens na tabela
async function loadQueue() {
    try {
        const res = await fetch('/queue-status');
        const data = await res.json();
        const tbody = document.querySelector('#queueTable tbody');
        if (!tbody) return;

        tbody.innerHTML = data.map(m => `
            <tr>
                <td>${m.phone}</td>
                <td>${m.message}</td>
                <td>${new Date(m.scheduledAt).toLocaleTimeString()}</td>
                <td class="status-${m.status}">${m.status}</td>
            </tr>
        `).join('');
    } catch (err) {
        console.error('Erro ao carregar fila:', err);
    }
}

// --- FUNÇÕES DE AÇÃO ---

async function saveFlow() {
    const flowData = {
        name: document.getElementById('flowName').value,
        steps: [
            { message: document.getElementById('msg1').value, delayMinutes: 0 },
            { message: document.getElementById('msg2').value, delayMinutes: document.getElementById('delay2').value },
            { message: document.getElementById('msg3').value, delayMinutes: document.getElementById('delay3').value }
        ]
    };

    const response = await fetch('/create-flow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(flowData)
    });

    const result = await response.json();
    alert(result.message);
    
    // EXTRA: Atualiza o select automaticamente para o novo fluxo aparecer sem dar F5
    loadFlowsIntoSelect();
}

async function startSelectedFlow() {
    const select = document.getElementById('flowSelect');
    const flowId = select.value;

    if (!flowId) return alert("Por favor, selecione um fluxo!");

    const response = await fetch('/start-flow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flowId: flowId })
    });

    const result = await response.json();
    alert(result.message || result.error);
    loadQueue();
}

// --- DEMAIS FUNÇÕES ---

async function importCSV() {
    const fileInput = document.getElementById('csvFile');
    if (!fileInput.files[0]) return alert('Selecione um arquivo CSV.');

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);

    const res = await fetch('/import-contacts', { method: 'POST', body: formData });
    const data = await res.json();
    alert(data.message || data.error);
}

async function startCampaign() {
    const body = {
        message: document.getElementById('msg').value,
        minDelay: parseInt(document.getElementById('min').value),
        maxDelay: parseInt(document.getElementById('max').value)
    };

    const res = await fetch('/campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    const data = await res.json();
    alert(data.message);
    loadQueue();
}