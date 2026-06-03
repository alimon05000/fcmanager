// Глобальное состояние игры
let state = {
    manager: '', 
    clubId: null, 
    matchday: 1, 
    mySquad: [], 
    schedule: [], 
    standings: {}, 
    selectedPlayer: null,
    matchHomeId: null,
    matchAwayId: null
};

// Инициализация при старте приложения
window.onload = () => { 
    lucide.createIcons(); 
    renderSetup(); 
};

// Отрисовка списка клубов на стартовом экране
function renderSetup() {
    const grid = document.getElementById('club-grid');
    grid.innerHTML = ''; // Очистка от дублей
    
    db.clubs.forEach(c => {
        const isSelected = state.clubId === c.id;
        const div = document.createElement('div');
        div.className = `bg-fc-surface border border-fc-border p-3 rounded-2xl cursor-pointer text-center flex flex-col items-center transition-all duration-200 ${isSelected ? 'ring-2 ring-blue-500 bg-white/5' : 'hover:bg-white/5'}`;
        
        div.onclick = () => { 
            state.clubId = c.id; 
            document.getElementById('btn-start').classList.remove('opacity-50', 'translate-y-4', 'pointer-events-none');
            renderSetup(); 
        };
        
        div.innerHTML = `
            <img src="${c.logo}" class="h-12 w-12 object-contain mb-2 drop-shadow-md" alt="${c.name}" onerror="fallbackImage(this, '${c.id}')">
            <p class="text-xs font-bold truncate w-full text-white">${c.name}</p>
        `;
        grid.appendChild(div);
    });
}

// Запуск карьеры и создание чемпионата
function startCareer() {
    if (!state.clubId) return;
    
    const input = document.getElementById('manager-name').value.trim();
    state.manager = input !== '' ? input : 'Магомедгаджи Махмудов';
    
    let club = db.clubs.find(c => c.id === state.clubId);
    
    // Применяем цвета клуба к интерфейсу
    document.documentElement.style.setProperty('--club-main', club.colors[0]);
    document.documentElement.style.setProperty('--club-sec', club.colors[1]);
    document.getElementById('ambient-bg').style.backgroundColor = club.colors[0];
    
    // Генерация состава (11 основа + 7 запас)
    let form = ['ВРТ', 'ЛЗ', 'ЦЗ', 'ЦЗ', 'ПЗ', 'ЦОП', 'ЦП', 'ЦАП', 'ЛФД', 'ПФД', 'ФРВ', 'ВРТ', 'ЦЗ', 'ПЗ', 'ЦП', 'ЛФД', 'ФРВ', 'ЦАП'];
    state.mySquad = form.map((pos, i) => ({
        id: i,
        n: `${db.fNames[Math.floor(Math.random()*db.fNames.length)]} ${db.lNames[Math.floor(Math.random()*db.lNames.length)]}`,
        pos: pos,
        realPos: pos,
        o: club.ovr + Math.floor(Math.random()*7)-3 // Разброс рейтинга вокруг силы клуба
    }));

    // Инициализация турнирной таблицы
    db.clubs.forEach(c => { 
        state.standings[c.id] = { id: c.id, n: c.name, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 }; 
    });
    
    // Примитивный генератор календаря на 30 туров
    for(let i=0; i<30; i++) {
        let mw = []; 
        let arr = [...db.clubs];
        while(arr.length > 1) {
            mw.push({ 
                h: arr.splice(Math.floor(Math.random()*arr.length), 1)[0].id, 
                a: arr.splice(Math.floor(Math.random()*arr.length), 1)[0].id 
            });
        }
        state.schedule.push(mw);
    }

    // Заполнение шапки хаба
    document.getElementById('hub-name').innerText = club.name;
    document.getElementById('hub-logo').src = club.logo;
    document.getElementById('hub-manager').innerText = state.manager;
    document.getElementById('hub-budget').innerText = `€${club.budget}M`;

    // Смена экрана
    document.getElementById('screen-setup').classList.remove('active');
    setTimeout(() => { 
        document.getElementById('screen-main').classList.add('active'); 
        updateHub(); 
        renderPitch(); 
        renderTable(); 
    }, 200);
}

// Навигация по вкладкам
function switchTab(id, el) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(i => { 
        i.classList.remove('active', 'text-club'); 
        i.classList.add('text-gray-500'); 
    });
    
    document.getElementById(`tab-${id}`).classList.add('active');
    el.classList.remove('text-gray-500'); 
    el.classList.add('active', 'text-club');
    
    if(id === 'squad') renderPitch();
}

// Обновление главного экрана перед новым туром
function updateHub() {
    document.getElementById('hub-matchday').innerText = state.matchday;
    if(state.matchday > 30) return alert('СЕЗОН ОКОНЧЕН! Вы дошли до конца симуляции.');
    
    let match = state.schedule[state.matchday-1].find(m => m.h === state.clubId || m.a === state.clubId);
    let isHome = match.h === state.clubId;
    
    state.matchHomeId = match.h;
    state.matchAwayId = match.a;
    
    let oppId = isHome ? match.a : match.h;
    let opp = db.clubs.find(c => c.id === oppId);
    let club = db.clubs.find(c => c.id === state.clubId);

    // Установка данных матча
    document.getElementById('match-home-team').innerText = isHome ? club.name : opp.name;
    document.getElementById('match-home-logo').src = isHome ? club.logo : opp.logo;
    document.getElementById('match-away-team').innerText = !isHome ? club.name : opp.name;
    document.getElementById('match-away-logo').src = !isHome ? club.logo : opp.logo;
}

// Координаты для схемы 4-3-3 на 2D-поле
const f433 = [ 
    {x:50,y:85,req:'ВРТ'}, {x:15,y:65,req:'ЛЗ'}, {x:35,y:70,req:'ЦЗ'}, {x:65,y:70,req:'ЦЗ'}, {x:85,y:65,req:'ПЗ'}, 
    {x:50,y:50,req:'ЦОП'}, {x:30,y:35,req:'ЦП'}, {x:70,y:35,req:'ЦП'}, 
    {x:20,y:15,req:'ЛФД'}, {x:80,y:15,req:'ПФД'}, {x:50,y:10,req:'ФРВ'} 
];

// Отрисовка состава и 2D-поля
function renderPitch() {
    const pitch = document.getElementById('pitch-view');
    const bench = document.getElementById('bench-view');
    pitch.innerHTML = ''; 
    bench.innerHTML = '';
    
    let totalOvr = 0;

    state.mySquad.forEach((p, index) => {
        let isStarter = index < 11;
        let effOvr = p.o;
        let penClass = '';
        
        if (isStarter) {
            let req = f433[index].req;
            // Умный штраф за позицию (если игрок не на своей позиции, OVR падает на 10)
            if (p.realPos !== req && !(req === 'ЦП' && p.realPos === 'ЦАП')) { 
                effOvr -= 10; 
                penClass = 'penalty'; 
            }
            totalOvr += effOvr;
            
            let div = document.createElement('div');
            div.className = `player-node ${state.selectedPlayer === index ? 'selected' : ''}`;
            div.style.left = `${f433[index].x}%`; 
            div.style.top = `${f433[index].y}%`;
            div.onclick = () => selectPlayer(index);
            
            div.innerHTML = `
                <div class="player-shirt ${penClass}">${effOvr}</div>
                <div class="player-label">${p.n.split(' ')[0]}</div>
            `;
            pitch.appendChild(div);
        } else {
            let div = document.createElement('div');
            div.className = `bg-fc-surface border border-fc-border rounded-xl p-3 flex justify-between items-center cursor-pointer transition-all ${state.selectedPlayer === index ? 'ring-2 ring-club bg-white/5' : 'hover:bg-white/5'}`;
            div.onclick = () => selectPlayer(index);
            
            div.innerHTML = `
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 bg-club/20 rounded-full flex items-center justify-center text-[10px] font-black text-club">${p.realPos}</div>
                    <span class="text-xs font-bold text-white">${p.n}</span>
                </div>
                <span class="text-sm font-black text-white">${p.o}</span>
            `;
            bench.appendChild(div);
        }
    });
    
    document.getElementById('widget-ovr').innerText = Math.round(totalOvr / 11);
}

// Выбор и замена игроков местами
function selectPlayer(index) {
    if (state.selectedPlayer === null) { 
        state.selectedPlayer = index; 
    } else {
        // Меняем местами
        let tmp = state.mySquad[state.selectedPlayer];
        state.mySquad[state.selectedPlayer] = state.mySquad[index];
        state.mySquad[index] = tmp;
        state.selectedPlayer = null;
    }
    renderPitch();
}

// Отрисовка таблицы РПЛ
function renderTable() {
    const tb = document.getElementById('standings-body');
    tb.innerHTML = '';
    
    // Сортировка по очкам, затем по разнице мячей
    let arr = Object.values(state.standings).sort((a,b) => b.pts - a.pts || (b.gf-b.ga) - (a.gf-a.ga));
    
    arr.forEach((s, i) => {
        if(s.id === state.clubId) {
            document.getElementById('widget-pos').innerText = `${i+1} Место`;
        }
        
        let cClass = i < 2 ? 'text-yellow-400 font-bold' : (i > 13 ? 'text-red-500 font-bold' : 'text-gray-400');
        
        tb.innerHTML += `
        <div class="flex p-3 border-b border-white/5 items-center ${s.id===state.clubId ? 'bg-club/10 font-bold text-white border-l-2 border-l-club' : 'text-gray-300'}">
            <div class="w-6 text-[10px] ${cClass}">${i+1}</div>
            <div class="flex-1 truncate text-xs">${s.n}</div>
            <div class="w-8 text-center">${s.p}</div>
            <div class="w-10 text-center text-[10px] text-gray-500">${s.gf}-${s.ga}</div>
            <div class="w-8 text-center text-club font-black">${s.pts}</div>
        </div>`;
    });
}

// Симуляция всего тура
function playMatchday() {
    if(state.matchday > 30) return;
    
    state.schedule[state.matchday-1].forEach(m => {
        let h = state.standings[m.h]; 
        let a = state.standings[m.a];
        
        // Берем актуальный OVR
        let hOvr = m.h === state.clubId ? parseInt(document.getElementById('widget-ovr').innerText) : db.clubs.find(c=>c.id===m.h).ovr;
        let aOvr = m.a === state.clubId ? parseInt(document.getElementById('widget-ovr').innerText) : db.clubs.find(c=>c.id===m.a).ovr;
        
        // Математика голов
        let diff = hOvr - aOvr + 3; // +3 бонус домашнего стадиона
        let gH = Math.max(0, Math.floor(Math.random() * (2 + diff*0.12)));
        let gA = Math.max(0, Math.floor(Math.random() * (2 - diff*0.12)));
        
        if (gH > 5) gH = Math.floor(Math.random() * 3) + 2; // Ограничение диких счетов
        if (gA > 5) gA = Math.floor(Math.random() * 3) + 1;
        
        // Обновление статы
        h.gf+=gH; h.ga+=gA; h.p++; 
        a.gf+=gA; a.ga+=gH; a.p++;
        
        if(gH>gA) { h.w++; h.pts+=3; a.l++; } 
        else if(gH<gA) { a.w++; a.pts+=3; h.l++; } 
        else { h.d++; a.d++; h.pts++; a.pts++; }
    });

    state.matchday++;
    
    // Если тур прошел успешно, обновляем интерфейс
    updateHub(); 
    renderTable();
    alert('Тур успешно симулирован! Посмотрите результаты в Таблице лиги.');
}
