let state = {
    manager: '', clubId: null, matchday: 1, mySquad: [], schedule: [], standings: {}, selectedPlayer: null
};

window.onload = () => { lucide.createIcons(); renderSetup(); };

function renderSetup() {
    const grid = document.getElementById('club-grid');
    grid.innerHTML = ''; 
    db.clubs.forEach(c => {
        const isSelected = state.clubId === c.id;
        const div = document.createElement('div');
        div.className = `glass-panel p-2 rounded-xl cursor-pointer text-center flex flex-col items-center border-2 transition-all ${isSelected ? 'bg-white/10 border-white' : 'border-transparent hover:bg-white/5'}`;
        if(isSelected) { div.style.borderColor = c.colors[0]; }
        
        div.onclick = () => { state.clubId = c.id; renderSetup(); };
        div.innerHTML = `
            <img src="${c.logo}" class="h-10 w-10 object-contain mb-1 drop-shadow-md" alt="${c.name}">
            <p class="text-xs font-bold truncate w-full">${c.name}</p>
        `;
        grid.appendChild(div);
    });
}

function startCareer() {
    if (!state.clubId) { alert('Выберите клуб!'); return; }
    
    const input = document.getElementById('manager-name');
    state.manager = input.value.trim() || input.placeholder;
    
    let club = db.clubs.find(c => c.id === state.clubId);
    document.documentElement.style.setProperty('--club-main', club.colors[0]);
    document.documentElement.style.setProperty('--club-sec', club.colors[1]);
    
    // Генерация состава (11 основа + 7 запас)
    let form = ['ВРТ', 'ЛЗ', 'ЦЗ', 'ЦЗ', 'ПЗ', 'ЦОП', 'ЦП', 'ЦАП', 'ЛФД', 'ПФД', 'ФРВ', 'ВРТ', 'ЦЗ', 'ПЗ', 'ЦП', 'ЛФД', 'ФРВ', 'ЦАП'];
    state.mySquad = form.map((pos, i) => ({
        id: i,
        n: `${db.fNames[Math.floor(Math.random()*db.fNames.length)]} ${db.lNames[Math.floor(Math.random()*db.lNames.length)]}`,
        pos: pos,
        realPos: pos,
        o: club.ovr + Math.floor(Math.random()*7)-3
    }));

    db.clubs.forEach(c => { state.standings[c.id] = { id: c.id, n: c.name, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 }; });
    
    // Генерация календаря
    for(let i=0; i<30; i++) {
        let mw = []; let arr = [...db.clubs];
        while(arr.length > 1) mw.push({ h: arr.splice(Math.floor(Math.random()*arr.length), 1)[0].id, a: arr.splice(Math.floor(Math.random()*arr.length), 1)[0].id });
        state.schedule.push(mw);
    }

    document.getElementById('hub-name').innerText = club.name;
    document.getElementById('hub-logo').src = club.logo;
    document.getElementById('hub-manager').innerText = state.manager;
    document.getElementById('hub-budget').innerText = `€${club.budget}M`;

    document.getElementById('screen-setup').classList.remove('active');
    setTimeout(() => { document.getElementById('screen-main').classList.add('active'); updateHub(); renderPitch(); renderTable(); }, 100);
}

function switchTab(id, el) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(i => { i.classList.remove('text-club'); i.classList.add('text-gray-500'); });
    document.getElementById(`tab-${id}`).classList.add('active');
    el.classList.remove('text-gray-500'); el.classList.add('text-club');
    if(id === 'squad') renderPitch();
}

function updateHub() {
    document.getElementById('hub-matchday').innerText = state.matchday;
    if(state.matchday > 30) return alert('СЕЗОН ОКОНЧЕН!');
    
    let match = state.schedule[state.matchday-1].find(m => m.h === state.clubId || m.a === state.clubId);
    let isHome = match.h === state.clubId;
    let oppId = isHome ? match.a : match.h;
    let opp = db.clubs.find(c => c.id === oppId);
    let club = db.clubs.find(c => c.id === state.clubId);

    document.getElementById('match-home-team').innerText = isHome ? club.name : opp.name;
    document.getElementById('match-home-logo').src = isHome ? club.logo : opp.logo;
    document.getElementById('match-away-team').innerText = !isHome ? club.name : opp.name;
    document.getElementById('match-away-logo').src = !isHome ? club.logo : opp.logo;
}

// Поле 4-3-3
const f433 = [ {x:50,y:90,req:'ВРТ'}, {x:15,y:70,req:'ЛЗ'}, {x:35,y:75,req:'ЦЗ'}, {x:65,y:75,req:'ЦЗ'}, {x:85,y:70,req:'ПЗ'}, {x:50,y:55,req:'ЦОП'}, {x:30,y:40,req:'ЦП'}, {x:70,y:40,req:'ЦП'}, {x:20,y:15,req:'ЛФД'}, {x:80,y:15,req:'ПФД'}, {x:50,y:10,req:'ФРВ'} ];

function renderPitch() {
    const pitch = document.getElementById('pitch-view');
    const bench = document.getElementById('bench-view');
    pitch.innerHTML = ''; bench.innerHTML = '';
    let totalOvr = 0;

    state.mySquad.forEach((p, index) => {
        let isStarter = index < 11;
        let effOvr = p.o;
        let penClass = '';
        
        if (isStarter) {
            let req = f433[index].req;
            if (p.realPos !== req && !(req === 'ЦП' && p.realPos === 'ЦАП')) { effOvr -= 10; penClass = 'penalty'; }
            totalOvr += effOvr;
            
            let div = document.createElement('div');
            div.className = `player-node ${state.selectedPlayer === index ? 'selected' : ''}`;
            div.style.left = `${f433[index].x}%`; div.style.top = `${f433[index].y}%`;
            div.onclick = () => selectPlayer(index);
            div.innerHTML = `<div class="player-shirt ${penClass}">${effOvr}</div><div class="player-label">${p.n.split(' ')[0]}</div>`;
            pitch.appendChild(div);
        } else {
            let div = document.createElement('div');
            div.className = `bg-white/5 border border-white/10 rounded-lg p-2 flex justify-between items-center cursor-pointer hover:bg-white/10 ${state.selectedPlayer === index ? 'ring-2 ring-club' : ''}`;
            div.onclick = () => selectPlayer(index);
            div.innerHTML = `<div class="flex items-center gap-2"><div class="w-6 h-6 bg-club/20 rounded-full flex items-center justify-center text-[10px] font-bold text-club">${p.realPos}</div><span class="text-xs font-bold">${p.n}</span></div><span class="text-xs font-black text-fc-text">${p.o}</span>`;
            bench.appendChild(div);
        }
    });
    
    document.getElementById('widget-ovr').innerText = Math.round(totalOvr / 11);
}

function selectPlayer(index) {
    if (state.selectedPlayer === null) { state.selectedPlayer = index; } 
    else {
        let tmp = state.mySquad[state.selectedPlayer];
        state.mySquad[state.selectedPlayer] = state.mySquad[index];
        state.mySquad[index] = tmp;
        state.selectedPlayer = null;
    }
    renderPitch();
}

function renderTable() {
    const tb = document.getElementById('standings-body');
    tb.innerHTML = '';
    let arr = Object.values(state.standings).sort((a,b) => b.pts - a.pts || (b.gf-b.ga) - (a.gf-a.ga));
    
    arr.forEach((s, i) => {
        if(s.id === state.clubId) document.getElementById('widget-pos').innerText = i+1;
        let cClass = i<2 ? 'text-yellow-400' : (i>13 ? 'text-red-500' : 'text-gray-500');
        tb.innerHTML += `<div class="flex p-2 border-b border-white/5 items-center ${s.id===state.clubId ? 'bg-club/10 font-bold text-white' : 'text-gray-300'}">
            <div class="w-6 ${cClass}">${i+1}</div>
            <div class="flex-1 truncate">${s.n}</div>
            <div class="w-8 text-center">${s.p}</div>
            <div class="w-10 text-center text-[10px] text-gray-500">${s.gf}-${s.ga}</div>
            <div class="w-8 text-center text-club">${s.pts}</div>
        </div>`;
    });
}

function playMatchday() {
    if(state.matchday > 30) return;
    let myRes = null;

    state.schedule[state.matchday-1].forEach(m => {
        let h = state.standings[m.h]; let a = state.standings[m.a];
        let hOvr = m.h === state.clubId ? parseInt(document.getElementById('widget-ovr').innerText) : db.clubs.find(c=>c.id===m.h).ovr;
        let aOvr = m.a === state.clubId ? parseInt(document.getElementById('widget-ovr').innerText) : db.clubs.find(c=>c.id===m.a).ovr;
        
        let diff = hOvr - aOvr + 3;
        let gH = Math.max(0, Math.floor(Math.random() * (2 + diff*0.1)));
        let gA = Math.max(0, Math.floor(Math.random() * (2 - diff*0.1)));
        
        h.gf+=gH; h.ga+=gA; h.p++; a.gf+=gA; a.ga+=gH; a.p++;
        if(gH>gA) { h.w++; h.pts+=3; a.l++; } else if(gH<gA) { a.w++; a.pts+=3; h.l++; } else { h.d++; a.d++; h.pts++; a.pts++; }

        if(m.h === state.clubId || m.a === state.clubId) myRes = { hId:m.h, aId:m.a, gH:gH, gA:gA };
    });

    state.matchday++;
    
    // Модалка
    let cH = db.clubs.find(c=>c.id===myRes.hId); let cA = db.clubs.find(c=>c.id===myRes.aId);
    document.getElementById('res-h-logo').src = cH.logo; document.getElementById('res-h-name').innerText = cH.name;
    document.getElementById('res-a-logo').src = cA.logo; document.getElementById('res-a-name').innerText = cA.name;
    document.getElementById('res-score').innerText = `${myRes.gH} : ${myRes.gA}`;
    
    document.getElementById('match-modal').classList.remove('opacity-0', 'pointer-events-none');
}

function closeMatch() {
    document.getElementById('match-modal').classList.add('opacity-0', 'pointer-events-none');
    updateHub(); renderTable();
}
