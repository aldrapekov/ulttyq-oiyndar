const UI = {
    ru: { game1: "Арқан Тартыс", game2: "Бәйге", game3: "Асық Ату", game4: "Случайный ученик", game5: "Қыз қуу", p: "Игрок", bot: "🤖 Бот (ИИ)", win: " победил(а)!", draw: "Ничья!", hand: "В руке: ", hit: "Сбито: " },
    kz: { game1: "Арқан Тартыс", game2: "Бәйге", game3: "Асық Ату", game4: "Кездейсоқ оқушы", game5: "Қыз қуу", p: "Ойыншы", bot: "🤖 Бот (ЖИ)", win: " жеңді!", draw: "Тең!", hand: "Сақа: ", hit: "Кеней: " }
};

const diffMap = { 'easy': 6000, 'medium': 5000, 'hard': 4000, 'impossible': 3000 };
const sounds = { correct: new Audio('da.mp3'), wrong: new Audio('net.mp3'), win: new Audio('win.mp3') };
function playSnd(name) { if(sounds[name]) { const c = sounds[name].cloneNode(); c.volume=0.2; c.play().catch(()=>{}); } }

function setTxt(id, txt) { const el = document.getElementById(id); if (el) el.innerText = txt; }
function setDisplay(id, style) { const el = document.getElementById(id); if (el) el.style.display = style; }

// --- ГЕНЕРАЦИЯ ВОПРОСОВ (Только пользовательский ИИ) ---
function generateQuestionData() {
    const savedData = localStorage.getItem('myCustomQuestions');
    if (savedData) {
        let customDB = JSON.parse(savedData);
        const q = customDB[Math.floor(Math.random() * customDB.length)];
        return { text: q.q, correct: q.correct, options: [q.correct, ...q.wrong].sort(() => Math.random() - 0.5) };
    } else {
        return { text: "Ошибка: Вопросы не загружены!", correct: "Ок", options: ["Ок", "-", "-", "-"] };
    }
}

// --- ТАЙМЕРЫ ---
let timerId = null;
function startPveTimer(barElementId, onTimeoutCallback) {
    clearTimeout(timerId);
    const bar = document.getElementById(barElementId);
    if(!bar) return;
    
    const diff = localStorage.getItem('gameDiff') || 'medium';
    const timeMs = diffMap[diff];

    bar.style.animation = 'none';
    void bar.offsetWidth; 
    bar.style.animation = `shrink ${timeMs}ms linear forwards`;
    
    const box = document.getElementById(barElementId.replace('timer', 'timer-box'));
    if(box) box.style.display = 'block';

    timerId = setTimeout(() => {
        playSnd('wrong');
        onTimeoutCallback(); 
    }, timeMs);
}
function stopTimer() {
    clearTimeout(timerId);
    document.querySelectorAll('.timer-bar').forEach(b => b.style.animation = 'none');
    document.querySelectorAll('.timer-container').forEach(c => c.style.display = 'none');
}

// --- ОСНОВНОЙ APP (Управление состояниями) ---
const app = {
    mode: 'pve',

    saveSettings() {
        if(document.getElementById('mode-select')) {
            localStorage.setItem('gameMode', document.getElementById('mode-select').value);
            localStorage.setItem('gameLang', document.getElementById('lang-select') ? document.getElementById('lang-select').value : 'ru');
            localStorage.setItem('gameDiff', document.getElementById('difficulty-select').value);
            if(document.getElementById('players-select')) {
                localStorage.setItem('gamePlayers', document.getElementById('players-select').value);
            }
            this.updateInterface();
        }
    },

    loadSettings() {
        this.mode = localStorage.getItem('gameMode') || 'pve';
        if(document.getElementById('mode-select')) {
            document.getElementById('mode-select').value = this.mode;
            if(document.getElementById('lang-select')) document.getElementById('lang-select').value = localStorage.getItem('gameLang') || 'ru';
            document.getElementById('difficulty-select').value = localStorage.getItem('gameDiff') || 'medium';
            if(document.getElementById('players-select')) document.getElementById('players-select').value = localStorage.getItem('gamePlayers') || '2';
        }
    },

    updateInterface() {
        this.loadSettings();
        const lang = localStorage.getItem('gameLang') || 'ru';
        const t = UI[lang];
        const isPve = this.mode === 'pve';

        // --- УМНАЯ СМЕНА ЗАГОЛОВКА И ВИДЕО ДЛЯ MENU.HTML ---
        const urlParams = new URLSearchParams(window.location.search);
        const gameType = urlParams.get('game') || 'arkan'; 
        
        const navTitleEl = document.getElementById('top-nav-title');
        if (navTitleEl) {
            const topTitles = { 'arkan': 'ARQAN TARTYS', 'baige': 'BÁIGE', 'asyk': 'ASYQ ATU', 'kyzquu': 'QYZ QUU' };
            navTitleEl.innerText = topTitles[gameType] || 'ÚLY DALA OIYNDARY';
        }

        const bgVideo = document.getElementById('menu-bg-video');
        if (bgVideo) {
            const videos = { 
                'arkan': 'arkan_bg.mp4', 
                'baige': 'baige_bg.mp4', 
                'asyk': 'asyk_bg.mp4', 
                'kyzquu': 'kyzquu_bg.mp4' 
            };
            const targetVideo = videos[gameType];
            if(targetVideo && !bgVideo.src.includes(targetVideo)) {
                bgVideo.src = targetVideo;
            }
        }
        // --------------------------------------------------

        setDisplay('wrap-difficulty', isPve ? 'block' : 'none');
        setDisplay('wrap-players', (isPve || gameType !== 'baige') ? 'none' : 'block');

        let p2Name = isPve ? t.bot : t.p + ' 2';
        setTxt('at-team-a', t.p + ' 1'); setTxt('at-team-b', p2Name);
        setTxt('as-name-1', t.p + ' 1'); setTxt('as-name-2', p2Name);
        let p2NameKq = isPve ? t.bot : t.p + ' 2 (Қыз)';
        setTxt('kq-team-a', t.p + ' 1 (Жігіт)'); setTxt('kq-team-b', p2NameKq);

        setDisplay('at-ai-status', isPve ? 'flex' : 'none'); setDisplay('at-p2-controls', isPve ? 'none' : 'flex');
        setDisplay('as-ai-status', isPve ? 'flex' : 'none'); setDisplay('as-p2-controls', isPve ? 'none' : 'block');
        setDisplay('kq-ai-status', isPve ? 'flex' : 'none'); setDisplay('kq-p2-controls', isPve ? 'none' : 'flex');
    },

    goHome() {
        stopTimer();
        window.location.href = 'index.html'; // Возврат на главный экран с видео
    },

    showWin(text) {
        stopTimer();
        setTxt('winner-text', text);
        document.getElementById('modal').classList.add('active');
    },

    restartCurrentGame() {
        location.reload();
    }
};

// --- ФУНКЦИИ ГЕНЕРАТОРА (КОПИРОВАНИЕ И ЗАПУСК) ---
function copyPrompt() {
    const promptText = document.getElementById('prompt-to-copy');
    if (promptText) {
        promptText.select();
        document.execCommand('copy');
        alert("Задание скопировано! Вставьте его в любой ИИ вместе с вашим текстом.");
    }
}

function launchSelectedGame() {
    let rawText = document.getElementById('ai-json-result').value.trim();
    if (!rawText) { alert("Вставьте результат от ИИ!"); return; }
    
    try {
        rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        let questions = JSON.parse(rawText);
        
        localStorage.setItem('myCustomQuestions', JSON.stringify(questions));
        app.saveSettings();
        
        // Берем название игры из URL и переходим на ее страницу
        const urlParams = new URLSearchParams(window.location.search);
        const gameType = urlParams.get('game') || 'arkan';
        window.location.href = `${gameType}.html`;
    } catch (error) {
        alert("Ошибка чтения JSON! Убедитесь, что скопировали код без лишнего текста.");
    }
}

// --- ЛОГИКА АРКАН ТАРТЫС ---
const arkanGame = {
    score: 0, active: false,
    start() {
        this.score = 0; this.active = true;
        document.getElementById('rope-marker').style.left = '50%';
        document.getElementById('modal').classList.remove('active');
        this.nextQ('a');
        if(app.mode === 'pvp') this.nextQ('b');
    },
    nextQ(team) {
        if (!this.active) return;
        const data = generateQuestionData();
        setTxt(`at-q-${team}`, data.text);
        const div = document.getElementById(`at-opt-${team}`);
        if(div) {
            div.innerHTML = '';
            data.options.forEach(opt => {
                let b = document.createElement('button');
                b.className = 'arkan-btn'; b.innerText = opt;
                b.onclick = () => this.check(team, opt, data.correct, b);
                div.appendChild(b);
            });
        }
        if(app.mode === 'pve' && team === 'a') {
            startPveTimer('at-timer', () => { this.score++; this.updateVisuals(); if(this.active) this.nextQ('a'); });
        }
    },
    check(team, val, corr, btn) {
        if(!this.active) return;
        if(val == corr) { playSnd('correct'); this.score += (team === 'a' ? -1 : 1); } 
        else { playSnd('wrong'); btn.style.background = '#555'; setTimeout(()=> btn.style.background='', 300); this.score += (team === 'a' ? 1 : -1); }
        this.updateVisuals(); if(this.active) this.nextQ(team);
    },
    updateVisuals() {
        const lang = localStorage.getItem('gameLang') || 'ru';
        let visualScore = Math.max(-5, Math.min(5, this.score));
        document.getElementById('rope-marker').style.left = (50 + (visualScore * 8)) + '%';
        if(this.score <= -5) { this.active = false; setTimeout(() => app.showWin(UI[lang].p + " 1" + UI[lang].win), 800); } 
        else if(this.score >= 5) { this.active = false; setTimeout(() => app.showWin((app.mode==='pve' ? UI[lang].bot : UI[lang].p + " 2") + UI[lang].win), 800); }
    }
};

// --- ЛОГИКА БӘЙГЕ ---
const baigeGame = {
    players: [], active: false,
    start() {
        this.active = true; document.getElementById('modal').classList.remove('active');
        const count = app.mode === 'pve' ? 2 : parseInt(localStorage.getItem('gamePlayers') || '2');
        const trackDiv = document.getElementById('race-track'); trackDiv.innerHTML = '<div class="finish-line"></div>';
        const controlsDiv = document.getElementById('baige-controls'); controlsDiv.innerHTML = '';
        this.players = [];
        const lang = localStorage.getItem('gameLang') || 'ru';
        const laneHeightPercent = (100 / count).toFixed(2) + '%';
        let horseTop = count === 2 ? '10px' : (count === 3 ? '0px' : '-5px'); 
        let horseSize = count === 2 ? '100px' : (count === 3 ? '80px' : '60px');

        for(let i=1; i<=count; i++) {
            this.players.push({ id: i, progress: 92 });
            const lane = document.createElement('div');
            lane.className = 'track-lane'; lane.style.height = laneHeightPercent;
            lane.innerHTML = `<img src="horse.gif" class="horse" id="horse-${i}" style="left: 92%; top: ${horseTop}; height: ${horseSize};">`;
            trackDiv.appendChild(lane);
            
            const pName = (app.mode === 'pve' && i === 2) ? UI[lang].bot : UI[lang].p + ' ' + i;
            const panel = document.createElement('div'); panel.className = `player-panel p${i}-color`;
            if (app.mode === 'pve' && i === 2) {
                panel.innerHTML = `<div class="player-header">${pName}</div><div class="ai-status" style="display:flex; flex:1; font-size:1.1rem;">🤖 ИИ скачет...</div>`;
            } else {
                panel.innerHTML = `<div class="player-header">${pName}</div>
                                   ${i===1 && app.mode==='pve' ? '<div class="timer-container" id="bg-timer-box"><div class="timer-bar" id="bg-timer"></div></div>' : ''}
                                   <div class="baige-q-box" id="bq-${i}">...</div><div class="baige-options" id="bopt-${i}"></div>`;
            }
            controlsDiv.appendChild(panel); this.nextQ(i);
        }
    },
    nextQ(id) {
        if (!this.active || (app.mode === 'pve' && id === 2)) return; 
        const data = generateQuestionData(); setTxt(`bq-${id}`, data.text);
        const div = document.getElementById(`bopt-${id}`);
        if(div) {
            div.innerHTML = '';
            data.options.forEach(opt => {
                let b = document.createElement('button'); b.className = 'baige-btn'; b.innerText = opt;
                b.onclick = () => this.check(id, opt, data.correct, b); div.appendChild(b);
            });
        }
        if(app.mode === 'pve' && id === 1) startPveTimer('bg-timer', () => { this.applyMove(2); this.nextQ(1); }); 
    },
    check(id, val, corr, btn) {
        if(!this.active) return;
        if(val == corr) { playSnd('correct'); this.applyMove(id); if(this.active) this.nextQ(id); } 
        else { playSnd('wrong'); btn.style.background = '#555'; setTimeout(()=> btn.style.background='', 300); if(app.mode === 'pve' && id === 1) { this.applyMove(2); if(this.active) this.nextQ(1); } }
    },
    applyMove(id) {
        const pIndex = id - 1; this.players[pIndex].progress -= 10;
        if(this.players[pIndex].progress < 5) this.players[pIndex].progress = 5;
        document.getElementById(`horse-${id}`).style.left = this.players[pIndex].progress + '%';
        const lang = localStorage.getItem('gameLang') || 'ru';
        if(this.players[pIndex].progress <= 5) {
            this.active = false; const pName = (app.mode === 'pve' && id === 2) ? UI[lang].bot : UI[lang].p + ' ' + id;
            app.showWin(pName + UI[lang].win);
        }
    }
};

// --- ЛОГИКА АСЫҚ АТУ ---
const asykGame = {
    p1: { ammo: 10, score: 0 }, p2: { ammo: 10, score: 0 }, active: false,
    start() {
        this.active = true; document.getElementById('modal').classList.remove('active');
        this.p1 = { ammo: 10, score: 0 }; this.p2 = { ammo: 10, score: 0 };
        for(let i=1; i<=2; i++) {
            this.updateStats(i); const field = document.getElementById(`as-field-${i}`);
            if(field) {
                field.innerHTML = '';
                for(let k=0; k<10; k++) { let a = document.createElement('div'); a.className = 'asyk-target'; a.innerHTML = '<img src="asyq.png" alt="Асық">'; a.id = `as-target-${i}-${k}`; field.appendChild(a); }
            }
        }
        this.nextQ(1); if(app.mode === 'pvp') this.nextQ(2);
    },
    updateStats(id) {
        const lang = localStorage.getItem('gameLang') || 'ru';
        setTxt(`as-hand-${id}`, UI[lang].hand + (id===1?this.p1.ammo:this.p2.ammo)); setTxt(`as-score-${id}`, UI[lang].hit + (id===1?this.p1.score:this.p2.score));
    },
    nextQ(id) {
        if (!this.active) return;
        const p = id===1 ? this.p1 : this.p2; if (p.ammo <= 0) return;
        const data = generateQuestionData(); setTxt(`as-q-${id}`, data.text);
        const div = document.getElementById(`as-opt-${id}`);
        if(div) { div.innerHTML = ''; data.options.forEach(opt => { let b = document.createElement('button'); b.className = 'asyk-btn'; b.innerText = opt; b.onclick = () => this.check(id, opt, data.correct, b); div.appendChild(b); }); }
        if(app.mode === 'pve' && id === 1) startPveTimer('as-timer', () => { this.applyScore(2); this.checkEnd(); });
    },
    check(id, val, corr, btn) {
        if(!this.active) return;
        if(val == corr) { playSnd('correct'); this.applyScore(id); } 
        else { playSnd('wrong'); if(app.mode === 'pve' && id === 1) this.applyScore(2); else { (id===1?this.p1:this.p2).ammo--; this.updateStats(id); } }
        this.checkEnd(id);
    },
    applyScore(id) {
        const p = id===1 ? this.p1 : this.p2;
        if(app.mode === 'pve' && id === 2) { this.p1.ammo--; } else { p.ammo--; }
        const target = document.getElementById(`as-target-${id}-${p.score}`); if(target) target.classList.add('hit');
        p.score++; this.updateStats(1); this.updateStats(2);
    },
    checkEnd(lastId = 1) {
        if(!this.active) return;
        let isEnd = (app.mode === 'pve' && this.p1.ammo <= 0) || (app.mode === 'pvp' && this.p1.ammo <= 0 && this.p2.ammo <= 0);
        if (isEnd) {
            this.active = false; stopTimer(); const lang = localStorage.getItem('gameLang') || 'ru';
            let text = this.p1.score > this.p2.score ? UI[lang].p + " 1" + UI[lang].win : (this.p2.score > this.p1.score ? (app.mode==='pve'?UI[lang].bot:UI[lang].p + " 2") + UI[lang].win : UI[lang].draw);
            app.showWin(text);
        } else {
            if(app.mode === 'pve') this.nextQ(1); else if (lastId === 1 && this.p1.ammo > 0) this.nextQ(1); else if (lastId === 2 && this.p2.ammo > 0) this.nextQ(2);
        }
    }
};

// --- ЛОГИКА ҚЫЗ ҚУУ ---
const kyzquuGame = {
    boyPos: 5, girlPos: 30, active: false,
    start() {
        this.boyPos = 5; this.girlPos = 30; this.active = true; document.getElementById('modal').classList.remove('active');
        this.updateVisuals(); this.nextQ('a'); if(app.mode === 'pvp') this.nextQ('b');
    },
    nextQ(team) {
        if (!this.active) return;
        const data = generateQuestionData(); setTxt(`kq-q-${team}`, data.text);
        const div = document.getElementById(`kq-opt-${team}`);
        if(div) { div.innerHTML = ''; data.options.forEach(opt => { let b = document.createElement('button'); b.className = 'arkan-btn'; b.innerText = opt; b.onclick = () => this.check(team, opt, data.correct, b); div.appendChild(b); }); }
        if(app.mode === 'pve' && team === 'a') startPveTimer('kq-timer', () => { this.girlPos += 12; this.updateVisuals(); if(this.active) this.nextQ('a'); });
    },
    check(team, val, corr, btn) {
        if(!this.active) return;
        if(val == corr) { playSnd('correct'); if (team === 'a') this.boyPos += 15; else this.girlPos += 12; } 
        else { playSnd('wrong'); btn.style.background = '#555'; setTimeout(()=> btn.style.background='', 300); if (app.mode === 'pve' && team === 'a') this.girlPos += 12; }
        this.updateVisuals(); if(this.active) this.nextQ(team);
    },
    updateVisuals() {
        const boyEl = document.getElementById('kq-boy'), girlEl = document.getElementById('kq-girl');
        if (boyEl) boyEl.style.left = this.boyPos + '%'; if (girlEl) girlEl.style.left = this.girlPos + '%';
        const lang = localStorage.getItem('gameLang') || 'ru';
        if (this.boyPos + 10 >= this.girlPos) { this.active = false; setTimeout(() => app.showWin(UI[lang].p + " 1 (Жігіт)" + UI[lang].win), 500); } 
        else if (this.girlPos >= 85) { this.active = false; const pName = app.mode === 'pve' ? UI[lang].bot : UI[lang].p + " 2 (Қыз)"; setTimeout(() => app.showWin(pName + UI[lang].win), 500); }
    }
};

// --- ЕДИНСТВЕННЫЙ АВТОЗАПУСК ---
document.addEventListener('DOMContentLoaded', () => {
    app.updateInterface(); 
    if (document.getElementById('arkan-screen')) arkanGame.start();
    if (document.getElementById('baige-screen')) baigeGame.start();
    if (document.getElementById('asyk-screen')) asykGame.start();
    if (document.getElementById('kyzquu-screen')) kyzquuGame.start();
    const bgm = document.getElementById('bgm'); if (bgm && bgm.paused) { bgm.volume = 0.3; bgm.play().catch(()=>{}); }
});
