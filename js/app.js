let state = {
    manager: '', clubId: null, matchday: 1, mySquad: [], schedule: [], standings: {}
};

window.onload = () => { 
    lucide.createIcons(); 
    renderSetup(); 
};

function renderSetup() {
    const grid = document.getElementById('club-grid');
    // ИСПРАВЛЕНИЕ БАГА: Очищаем контейнер перед отрисовкой, чтобы клубы не дублировались
    grid.innerHTML = ''; 
    
    db.clubs.forEach(c => {
        const isSelected = state.clubId === c.id;
        const div = document.createElement('div');
        div.className = `glass-panel p-3 rounded-xl cursor-pointer text-center flex flex-col items-center border-2 transition-all ${isSelected ? 'bg-white/10' : 'border-transparent'}`;
        if(isSelected) { div.style.borderColor = c.colors[0]; }
        
        div.onclick = () => { state.clubId = c.id; renderSetup(); };
        div.innerHTML = `
            <div class="h-10 w-10 mb-2 flex items-center justify-center font-black text-[10px] text-white rounded-full" style="background-color: ${c.colors[0]}">${c.name.slice(0,3)}</div>
            <p class="text-xs font-bold">${c.name}</p>
        `;
        grid.appendChild(div);
    });
}

function startCareer() {
    if (!state.clubId) { alert('Выберите клуб!'); return; }
    
    const input = document.getElementById('manager-name').value;
    state.manager = input.trim() || "Главный Тренер";
    
    let club = db.clubs.find(c => c.id === state.clubId);
    
    // Применяем цвета клуба к CSS переменным
    document.documentElement.style.setProperty('--club-main', club.colors[0]);
    document.documentElement.style.setProperty('--club-sec', club.colors[1]);
    
    // Инициализация турнира (заглушка для старта)
    db.clubs.forEach(c => { 
        state.standings[c.id] = { n: c.name, pts: 0, p: 0 }; 
    });

    document.getElementById('hub-name').innerText = club.name;
    document.getElementById('hub-manager').innerText = state.manager;
    document.getElementById('hub-budget').innerText = `€${club.budget}M`;

    // Переключение экранов
    document.getElementById('screen-setup').classList.remove('active');
    setTimeout(() => document.getElementById('screen-main').classList.add('active'), 100);
}

function switchTab(id, el) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(i => { i.classList.remove('text-club'); i.classList.add('text-gray-500'); });
    
    document.getElementById(`tab-${id}`).classList.add('active');
    el.classList.remove('text-gray-500'); 
    el.classList.add('text-club');
}

function playMatchday() {
    alert("Движок симуляции матча будет перенесен в этот отдельный файл!");
}
