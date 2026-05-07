// --- Global Functions ---
function openGates() {
    if (document.body.classList.contains('gates-open')) return;

    setTimeout(() => {
        document.body.classList.add('gates-open');
        console.log("Gates opening...");
        setTimeout(() => {
            const loader = document.getElementById('loader-wrapper');
            if (loader) loader.style.display = 'none';
        }, 1500);
    }, 1000);
}

// Check state immediately
if (document.readyState === 'complete') {
    openGates();
} else {
    window.addEventListener('load', openGates);
    setTimeout(openGates, 5000); // Failsafe
}

// --- Navigation Logic ---
window.switchView = function (viewId) {
    // Hide all views
    document.querySelectorAll('.view-section').forEach(view => {
        view.classList.add('hidden');
    });

    // Show selected view
    const targetView = document.getElementById(`view-${viewId}`);
    if (targetView) {
        targetView.classList.remove('hidden');
        targetView.classList.add('animate-fade-in-up');
    }

    // Update nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('text-primary');
        btn.classList.add('text-white/50');
    });
    const activeBtn = document.getElementById(`nav-${viewId}`);
    if (activeBtn) {
        activeBtn.classList.remove('text-white/50');
        activeBtn.classList.add('text-primary');
    }
};

// No bracket lines for now

let calculatedPlayers = [];

// --- Stats Calculation Engine ---
function calculatePlayerStats(completedMatches) {
    // Start with base players from data.js
    const sourcePlayers = (typeof players !== 'undefined') ? players : [];

    const stats = sourcePlayers.map(p => ({
        ...p,
        played: 0,
        wins: 0,
        losses: 0,
        points: 0,
        winRate: 0,
        form: []
    }));

    if (!completedMatches) return stats;

    const matches = Object.values(completedMatches);

    matches.forEach(m => {
        const p1 = stats.find(p => p.name === m.p1);
        const p2 = stats.find(p => p.name === m.p2);

        if (p1 && p2) {
            p1.played++;
            p2.played++;

            if (m.sets1 > m.sets2) {
                p1.wins++;
                p1.points += 2;
                p1.form.push('W');
                p2.losses++;
                p2.points += 1;
                p2.form.push('L');
            } else {
                p2.wins++;
                p2.points += 2;
                p2.form.push('W');
                p1.losses++;
                p1.points += 1;
                p1.form.push('L');
            }
        }
    });

    // Finalize win rates and limit form to last 5
    stats.forEach(p => {
        if (p.played > 0) {
            p.winRate = Math.round((p.wins / p.played) * 100);
        }
        p.form = p.form.slice(-5);
    });

    return stats;
}

// --- Render Groups ---
function renderGroups() {
    const container = document.getElementById('groups-container');
    if (!container || typeof groupNames === 'undefined') return;

    container.innerHTML = '';

    groupNames.forEach(groupName => {
        let groupPlayers = calculatedPlayers.filter(p => p.group === groupName);

        if (groupPlayers.length === 0) {
            groupPlayers = [
                { name: `Empty Spot`, wins: 0, losses: 0, points: 0, seed: `Empty${groupName}1` },
                { name: `Empty Spot`, wins: 0, losses: 0, points: 0, seed: `Empty${groupName}2` }
            ];
        } else {
            groupPlayers.sort((a, b) => b.points - a.points || b.wins - a.wins);
        }

        let rowsHtml = '';
        groupPlayers.forEach((p, index) => {
            let rankColor = index === 0 ? 'text-yellow-500' : 'text-white/70';
            let ptsColor = p.points > 0 ? 'text-green-400' : (p.points < 0 ? 'text-red-400' : 'text-white/50');
            rowsHtml += `
                <div class="flex items-center px-2 py-1 border-t border-white/5 ${index === 0 ? 'bg-white/5' : ''}">
                    <div class="w-4 font-bold text-[8px] ${rankColor}">${index + 1}</div>
                    <div class="flex-1 font-medium flex items-center gap-1 text-[9px] truncate">
                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${p.seed || 'none'}" class="w-3.5 h-3.5 rounded-full bg-white">
                        <span class="truncate">${p.name}</span>
                    </div>
                    <div class="w-9 text-center font-mono text-[8px] text-white/40">${p.wins}-${p.losses}</div>
                    <div class="w-6 text-right font-bold text-[9px] ${ptsColor}">${p.points > 0 ? '+' : ''}${p.points}</div>
                </div>
            `;
        });

        const groupHtml = `
            <div id="node-group-${groupName}" class="glass-panel rounded-lg overflow-hidden mb-2 relative w-full max-w-[210px] mx-auto">
                <div class="flex items-center justify-between px-2 py-1 bg-white/10 font-bold text-[9px]">
                    <span>בית ${groupName}</span>
                    ${isGroupsClosed ? '<span class="text-[7px] bg-white/10 px-1 py-0.5 rounded text-white/40 uppercase"><i class="fa-solid fa-lock mr-1"></i>סגור</span>' : ''}
                </div>
                <div class="flex items-center px-2 py-0.5 border-b border-white/5 text-[7px] text-white/30 uppercase tracking-wider font-bold">
                    <div class="w-4">#</div>
                    <div class="flex-1">שחקן</div>
                    <div class="w-9 text-center">נ-ה</div>
                    <div class="w-6 text-right">נק'</div>
                </div>
                <div>
                    ${rowsHtml}
                </div>
            </div>
        `;
        container.innerHTML += groupHtml;
    });
    // renderGroups complete
}

// --- Render Players ---
function renderPlayers() {
    const list = document.getElementById('players-list');
    if (!list) return;

    list.innerHTML = '';
    const sortedPlayers = [...calculatedPlayers].sort((a, b) => a.name.localeCompare(b.name));

    sortedPlayers.forEach(p => {
        list.innerHTML += `
            <div class="glass-panel rounded-2xl p-4 flex flex-col items-center text-center active:scale-95 transition-transform" onclick="window.openPlayerModal(${p.id})">
                <div class="w-16 h-16 rounded-full bg-gradient-to-tr from-white/10 to-white/30 p-1 mb-3">
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${p.seed}" class="w-full h-full rounded-full bg-white">
                </div>
                <h3 class="font-bold text-sm mb-1">${p.name}</h3>
                <span class="text-xs text-primary font-medium">דירוג #${p.rank || '-'}</span>
            </div>
        `;
    });
}

// --- Player Profile Modal ---
window.openPlayerModal = function (playerId) {
    const p = calculatedPlayers.find(player => player.id === playerId);
    if (!p) return;

    document.getElementById('modal-img').src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.seed}`;
    document.getElementById('modal-name').innerText = p.name;
    document.getElementById('modal-rank').innerText = `בית ${p.group} • ${p.played} משחקים`;
    document.getElementById('modal-played').innerText = p.played;
    document.getElementById('modal-winrate').innerText = `${p.winRate}%`;
    document.getElementById('modal-points').innerText = p.points > 0 ? `+${p.points}` : p.points;
    document.getElementById('modal-points').className = p.points > 0 ? 'font-mono text-xl font-bold text-green-400' : (p.points < 0 ? 'font-mono text-xl font-bold text-red-400' : 'font-mono text-xl font-bold');

    const formContainer = document.getElementById('modal-form');
    formContainer.innerHTML = '';
    p.form.forEach(res => {
        const colorClass = res === 'W' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30';
        formContainer.innerHTML += `<div class="w-8 h-8 rounded-full border flex items-center justify-center font-bold text-sm ${colorClass}">${res}</div>`;
    });

    document.getElementById('player-modal').classList.remove('translate-y-full');
};

window.closePlayerModal = function () {
    document.getElementById('player-modal').classList.add('translate-y-full');
};

// --- Manual Entry Logic ---
window.openManualEntry = function () {
    const pin = prompt("הזן קוד גישה (PIN) להזנת תוצאה:");
    if (pin === '1234') {
        const m1Select = document.getElementById('man-p1');
        const m2Select = document.getElementById('man-p2');

        if (m1Select && m2Select && typeof players !== 'undefined') {
            let options = players.map(p => `<option value="${p.name}">${p.name}</option>`).join('');
            m1Select.innerHTML = options;
            m2Select.innerHTML = options;
            if (players.length > 1) m2Select.selectedIndex = 1;
        }

        document.getElementById('manual-overlay').classList.remove('translate-y-full');
    } else if (pin !== null) {
        alert("קוד שגוי!");
    }
};

window.saveManualResult = function () {
    const p1 = document.getElementById('man-p1').value;
    const p2 = document.getElementById('man-p2').value;
    const sets1 = parseInt(document.getElementById('man-sets1').value);
    const sets2 = parseInt(document.getElementById('man-sets2').value);

    if (p1 === p2) return alert("בחר שני שחקנים שונים");

    const matchData = {
        id: Date.now(),
        date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        p1, p2, score1: 0, score2: 0, sets1, sets2
    };

    if (!window.db) return alert("שגיאה: מסד הנתונים לא מחובר!");

    window.db.ref('completedMatches').push(matchData).then(() => {
        alert('התוצאה נשמרה בהצלחה!');
        document.getElementById('manual-overlay').classList.add('translate-y-full');
    });
};

// --- Social Logic (Likes & Comments) ---
const userId = localStorage.getItem('pingpong_userid') || 'user_' + Math.random().toString(36).substr(2, 9);
localStorage.setItem('pingpong_userid', userId);

window.toggleLike = function (newsId) {
    if (!window.db) return;
    const likeRef = window.db.ref(`news/${newsId}/likes/${userId}`);
    likeRef.once('value', (snap) => {
        if (snap.exists()) {
            likeRef.remove();
        } else {
            likeRef.set(true);
        }
    });
};

window.submitComment = function (newsId) {
    const nameInput = document.getElementById(`comment-name-${newsId}`);
    const textInput = document.getElementById(`comment-input-${newsId}`);
    const name = nameInput.value.trim() || 'שחקן אורח';
    const text = textInput.value.trim();

    if (!text || !window.db) return;

    // Save name for next time
    localStorage.setItem('pingpong_username', name);

    const commentData = {
        userId,
        userName: name,
        text,
        date: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
    };

    window.db.ref(`news/${newsId}/comments`).push(commentData).then(() => {
        textInput.value = '';
    });
};

window.shareNews = function (title, text, customUrl) {
    const shareUrl = customUrl || window.location.href; // Use specific link or current page
    if (navigator.share) {
        navigator.share({
            title: title,
            text: text,
            url: shareUrl
        }).catch(err => console.log('Error sharing:', err));
    } else {
        // Fallback: copy the specific link
        const dummy = document.createElement('input');
        document.body.appendChild(dummy);
        dummy.value = shareUrl;
        dummy.select();
        document.execCommand('copy');
        document.body.removeChild(dummy);
        alert('הקישור הועתק ללוח!');
    }
};


window.scrollToSlide = function (phaseId) {
    const slide = document.getElementById(`slide-${phaseId}`);
    if (slide) {
        slide.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
};

function initScrollSpy() {
    const slider = document.getElementById('tournament-slider');
    const slides = document.querySelectorAll('.snap-slide');
    if (!slider || !slides.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const slide = entry.target;
            if (entry.isIntersecting) {
                // Update top nav
                const phaseId = slide.id.replace('slide-', '');
                document.querySelectorAll('.phase-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                const activeBtn = document.getElementById(`btn-phase-${phaseId}`);
                if (activeBtn) activeBtn.classList.add('active');
            }
        });
    }, { root: slider, threshold: 0.6 });

    slides.forEach(slide => observer.observe(slide));
}

window.addEventListener('load', () => {
    initScrollSpy();
    if (document.readyState === 'complete') openGates();
});

// Update switchView to trigger rendering if needed
const originalSwitchView = window.switchView;
window.switchView = function (viewId) {
    originalSwitchView(viewId);
    if (viewId === 'groups') {
        renderGroups();
        renderBracket('round16');
        renderBracket('quarters');
        renderBracket('semis');
        renderBracket('final');

        // Ensure we start at the first slide (Groups)
        setTimeout(() => {
            window.scrollToSlide('groups');
        }, 100);

        setTimeout(initScrollSpy, 200);
    }
};

let isGroupsClosed = false;

function renderBracket(phase) {
    const container = document.getElementById(`${phase}-container`);
    if (!container) return;

    let matchesHtml = '';
    let matchCount = 0;
    let title = '';

    if (phase === 'round16') { matchCount = 8; title = 'שמינית גמר'; }
    else if (phase === 'quarters') { matchCount = 4; title = 'רבע גמר'; }
    else if (phase === 'semis') { matchCount = 2; title = 'חצי גמר'; }
    else if (phase === 'final') { matchCount = 1; title = 'גמר'; }

    // Logic to get winners if groups are closed
    const bracketData = {}; // To store who is in which slot

    if (phase === 'round16' && isGroupsClosed) {
        const groupStandings = {};
        groupNames.forEach(gn => {
            const players = calculatedPlayers.filter(p => p.group === gn);
            players.sort((a, b) => b.points - a.points || b.wins - a.wins);
            groupStandings[gn] = players;
        });

        // Fill slots: [MatchID, SlotID, PlayerObject]
        const pairings = [
            { m: 1, s: 1, g: 'A', r: 0 }, { m: 1, s: 2, g: 'B', r: 1 },
            { m: 2, s: 1, g: 'C', r: 0 }, { m: 2, s: 2, g: 'D', r: 1 },
            { m: 3, s: 1, g: 'E', r: 0 }, { m: 3, s: 2, g: 'F', r: 1 },
            { m: 4, s: 1, g: 'G', r: 0 }, { m: 4, s: 2, g: 'H', r: 1 },
            { m: 5, s: 1, g: 'B', r: 0 }, { m: 5, s: 2, g: 'A', r: 1 },
            { m: 6, s: 1, g: 'D', r: 0 }, { m: 6, s: 2, g: 'C', r: 1 },
            { m: 7, s: 1, g: 'F', r: 0 }, { m: 7, s: 2, g: 'E', r: 1 },
            { m: 8, s: 1, g: 'H', r: 0 }, { m: 8, s: 2, g: 'G', r: 1 }
        ];

        pairings.forEach(p => {
            const player = groupStandings[p.g][p.r];
            if (player) {
                bracketData[`${p.m}-${p.s}`] = player;
            }
        });
    }

    for (let i = 1; i <= matchCount; i++) {
        const p1 = bracketData[`${i}-1`] || { name: 'TBD', seed: 'none' };
        const p2 = bracketData[`${i}-2`] || { name: 'TBD', seed: 'none' };

        matchesHtml += `
            <div id="node-${phase}-${i}" class="glass-panel p-3 rounded-xl flex items-center justify-between border border-white/5 bracket-node relative w-full max-w-[340px] mx-auto">
                <div class="flex flex-col gap-2 flex-1 w-full">
                    <div class="flex justify-between items-center bg-white/5 p-2 rounded-lg">
                        <div class="flex items-center gap-2">
                            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${p1.seed}" class="w-5 h-5 rounded-full bg-white/10">
                            <span class="text-[11px] font-bold ${p1.name === 'TBD' ? 'text-white/20' : ''}">${p1.name}</span>
                        </div>
                        <span class="font-mono text-primary text-xs">--</span>
                    </div>
                    <div class="flex justify-between items-center bg-white/5 p-2 rounded-lg">
                        <div class="flex items-center gap-2">
                            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${p2.seed}" class="w-5 h-5 rounded-full bg-white/10">
                            <span class="text-[11px] font-bold ${p2.name === 'TBD' ? 'text-white/20' : ''}">${p2.name}</span>
                        </div>
                        <span class="font-mono text-primary text-xs">--</span>
                    </div>
                </div>
            </div>
        `;
    }

    container.innerHTML = `
        <div class="text-[10px] text-white/40 uppercase font-bold tracking-[0.2em] text-center mb-6 pt-4">${title}</div>
        <div class="flex flex-col justify-around flex-1 gap-6">
            ${matchesHtml}
        </div>
    `;
}

// --- Firebase Realtime Listeners ---

function initAppListeners() {
    if (!window.db) {
        setTimeout(initAppListeners, 500);
        return;
    }

    // 1. Live Match Listener
    window.db.ref('liveMatch').on('value', (snapshot) => {
        const data = snapshot.val();
        const liveCard = document.getElementById('live-match-card');
        const noMatchMsg = document.getElementById('no-live-match');
        const statusIcon = document.getElementById('live-ping-icon');
        const statusText = document.getElementById('match-status-text');

        const liveHeader = document.getElementById('live-match-header');

        if (!data || data.p1 === '---') {
            if (liveCard) liveCard.style.display = 'none';
            if (liveHeader) liveHeader.style.display = 'none';
            if (noMatchMsg) noMatchMsg.classList.remove('hidden');
            return;
        }

        if (liveCard) liveCard.style.display = 'block';
        if (liveHeader) liveHeader.style.display = 'flex';
        if (noMatchMsg) noMatchMsg.classList.add('hidden');

        document.getElementById('p1-name').innerText = data.p1.split(' ')[0];
        document.getElementById('p2-name').innerText = data.p2.split(' ')[0];
        document.getElementById('p1-score').innerText = data.score1;
        document.getElementById('p2-score').innerText = data.score2;
        document.getElementById('p1-sets').innerText = `${data.sets1} מערכות`;
        document.getElementById('p2-sets').innerText = `${data.sets2} מערכות`;
        document.getElementById('match-set').innerText = (data.sets1 === 2 || data.sets2 === 2) ? "המשחק הסתיים" : `מערכה ${data.currentSet}`;
        document.getElementById('match-timer').innerText = (data.sets1 === 2 || data.sets2 === 2) ? "" : "שידור חי";

        const p1Base = (typeof players !== 'undefined') ? players.find(p => p.name === data.p1) : null;
        const p2Base = (typeof players !== 'undefined') ? players.find(p => p.name === data.p2) : null;
        if (p1Base) document.getElementById('p1-img').src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${p1Base.seed}`;
        if (p2Base) document.getElementById('p2-img').src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${p2Base.seed}`;
    });

    // 2. Upcoming Matches Listener
    window.db.ref('upcomingMatches').on('value', (snapshot) => {
        const container = document.getElementById('home-upcoming-queue');
        if (!container) return;

        const data = snapshot.val();
        if (!data) {
            container.innerHTML = '<p class="text-white/30 text-sm text-center py-4 bg-white/5 rounded-xl">No upcoming matches</p>';
            return;
        }

        const upcoming = Object.values(data);
        container.innerHTML = upcoming.map(m => {
            const p1Base = (typeof players !== 'undefined') ? players.find(p => p.name === m.p1) : null;
            const p2Base = (typeof players !== 'undefined') ? players.find(p => p.name === m.p2) : null;
            const p1Img = `https://api.dicebear.com/7.x/avataaars/svg?seed=${p1Base ? p1Base.seed : m.p1}`;
            const p2Img = `https://api.dicebear.com/7.x/avataaars/svg?seed=${p2Base ? p2Base.seed : m.p2}`;

            return `
                <div class="glass-panel p-3 rounded-xl flex items-center gap-3 animate-fade-in-up">
                    <div class="text-center w-16 border-r border-white/10 pr-2">
                        <div class="text-[9px] text-white/40 uppercase font-bold">${m.date ? m.date.split('-').slice(1).reverse().join('/') : 'היום'}</div>
                        <div class="font-bold text-primary">${m.time}</div>
                    </div>
                    <div class="flex-1 flex items-center justify-between pl-2">
                        <div class="flex items-center gap-2">
                            <img src="${p1Img}" class="w-8 h-8 rounded-full bg-white/10">
                            <span class="text-sm font-semibold">${m.p1.split(' ')[0]}</span>
                        </div>
                        <span class="text-white/30 text-xs px-2">vs</span>
                        <div class="flex items-center gap-2 flex-row-reverse">
                            <img src="${p2Img}" class="w-8 h-8 rounded-full bg-white/10">
                            <span class="text-sm font-semibold">${m.p2.split(' ')[0]}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    });

    // 3. Completed Matches & Results Listener
    window.db.ref('completedMatches').on('value', (snapshot) => {
        const data = snapshot.val();
        calculatedPlayers = calculatePlayerStats(data);
        renderGroups();
        renderPlayers();

        const container = document.getElementById('results-container');
        if (!container) return;

        if (!data) {
            container.innerHTML = '<p class="text-white/30 text-sm text-center py-10">No results yet</p>';
            return;
        }

        const matches = Object.values(data).reverse();
        container.innerHTML = '';

        matches.forEach(match => {
            const p1Base = (typeof players !== 'undefined') ? players.find(p => p.name === match.p1) : null;
            const p2Base = (typeof players !== 'undefined') ? players.find(p => p.name === match.p2) : null;
            const p1Img = `https://api.dicebear.com/7.x/avataaars/svg?seed=${p1Base ? p1Base.seed : match.p1}`;
            const p2Img = `https://api.dicebear.com/7.x/avataaars/svg?seed=${p2Base ? p2Base.seed : match.p2}`;
            const isP1Winner = match.sets1 > match.sets2;

            const card = document.createElement('div');
            card.className = 'glass-panel rounded-xl p-4 animate-fade-in-up flex flex-col gap-3 mb-3';
            card.innerHTML = `
                <div class="text-xs text-white/50 text-center uppercase tracking-widest">${match.date}</div>
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3 w-1/3">
                        <img src="${p1Img}" class="w-10 h-10 rounded-full bg-white/10 p-0.5 ${isP1Winner ? 'ring-2 ring-primary' : ''}">
                        <span class="font-bold text-sm ${isP1Winner ? 'text-primary' : 'text-white/70'}">${match.p1.split(' ')[0]}</span>
                    </div>
                    <div class="flex items-center gap-2 font-mono text-xl w-1/3 justify-center">
                        <span class="${isP1Winner ? 'font-black text-white' : 'text-white/50'}">${match.sets1}</span>
                        <span class="text-white/20">-</span>
                        <span class="${!isP1Winner ? 'font-black text-white' : 'text-white/50'}">${match.sets2}</span>
                    </div>
                    <div class="flex items-center gap-3 w-1/3 justify-end">
                        <span class="font-bold text-sm ${!isP1Winner ? 'text-primary' : 'text-white/70'}">${match.p2.split(' ')[0]}</span>
                        <img src="${p2Img}" class="w-10 h-10 rounded-full bg-white/10 p-0.5 ${!isP1Winner ? 'ring-2 ring-primary' : ''}">
                    </div>
                </div>
                <div class="text-center text-xs text-white/30">סה"כ נקודות: ${match.score1} - ${match.score2}</div>
            `;
            container.appendChild(card);
        });
    });

    // 4. Tournament State Listener
    window.db.ref('tournamentState').on('value', (snapshot) => {
        const state = snapshot.val() || {};
        isGroupsClosed = !!state.isGroupsClosed;
        window.closedPhases = state.closedPhases || {};
        
        renderGroups();
        renderBracket('round16');
        renderBracket('quarters');
        renderBracket('semis');
        renderBracket('final');
    });

    // 5. News Listener
    window.db.ref('news').on('value', (snapshot) => {
        const container = document.getElementById('news-container');
        if (!container) return;

        const data = snapshot.val();
        if (!data) {
            container.innerHTML = `
                <div class="glass-panel p-6 rounded-2xl text-center text-white/50">
                    <i class="fa-solid fa-newspaper text-4xl mb-3 opacity-50"></i>
                    <p>אין עדכונים חדשים כרגע</p>
                </div>`;
            return;
        }

        const newsItems = Object.entries(data)
            .map(([key, val]) => ({ ...val, firebaseKey: key }))
            .sort((a, b) => b.id - a.id); // Newest first

        container.innerHTML = newsItems.map(item => {
            const likesCount = item.likes ? Object.keys(item.likes).length : 0;
            const hasLiked = item.likes && item.likes[userId];
            const comments = item.comments ? Object.values(item.comments) : [];
            const savedName = localStorage.getItem('pingpong_username') || '';

            return `
                <article class="glass-panel rounded-2xl overflow-hidden animate-fade-in-up mb-6">
                    ${item.image ? `<img src="${item.image}" alt="${item.title}" class="w-full h-48 object-cover border-b border-white/10">` : ''}
                    <div class="p-5">
                        <div class="text-xs text-white/40 font-bold mb-2 uppercase tracking-widest">${item.date}</div>
                        <h3 class="text-lg font-bold mb-2">${item.title}</h3>
                        <p class="text-white/70 text-sm leading-relaxed mb-6">${item.text}</p>
                        
                        <!-- Actions -->
                        <div class="flex items-center gap-6 border-t border-white/5 pt-4 mb-4">
                            <button onclick="window.toggleLike('${item.firebaseKey}')" class="flex items-center gap-2 ${hasLiked ? 'text-primary' : 'text-white/40'} transition-colors">
                                <i class="${hasLiked ? 'fa-solid' : 'fa-regular'} fa-heart text-xl"></i>
                                <span class="text-sm font-bold">${likesCount}</span>
                            </button>
                            <div class="flex items-center gap-2 text-white/40">
                                <i class="fa-regular fa-comment text-xl"></i>
                                <span class="text-sm font-bold">${comments.length}</span>
                            </div>
                            <button onclick="window.shareNews('${item.title}', '${item.text.substring(0, 50)}...', '${window.location.origin}${window.location.pathname}?newsId=${item.firebaseKey}')" class="flex items-center gap-2 text-white/40 hover:text-white transition-colors">
                                <i class="fa-solid fa-share-nodes text-xl"></i>
                                <span class="text-sm font-bold text-xs uppercase">שתף</span>
                            </button>
                        </div>

                        <!-- Comments Section -->
                        <div class="space-y-3 mb-4">
                            ${comments.map(c => `
                                <div class="bg-white/5 rounded-xl p-3 text-xs">
                                    <div class="flex justify-between mb-1">
                                        <span class="font-bold text-primary">${c.userName || 'שחקן אורח'}</span>
                                        <span class="opacity-30">${c.date}</span>
                                    </div>
                                    <div class="text-white/80">${c.text}</div>
                                </div>
                            `).join('')}
                        </div>

                        <!-- Add Comment -->
                        <div class="space-y-2">
                            <input type="text" id="comment-name-${item.firebaseKey}" value="${savedName}" placeholder="שמך..." class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-primary">
                            <div class="flex gap-2">
                                <input type="text" id="comment-input-${item.firebaseKey}" placeholder="הוסף תגובה..." class="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-primary">
                                <button onclick="window.submitComment('${item.firebaseKey}')" class="bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold">שלח</button>
                            </div>
                        </div>
                    </div>
                </article>
            `;
        }).join('');
    });
}

// --- Page Load Handling ---
window.addEventListener('load', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const newsId = urlParams.get('newsId');
    if (newsId) {
        setTimeout(() => {
            window.switchView('news');
            // Scroll to the specific news item if it exists
            const newsItem = document.querySelector(`[onclick*="${newsId}"]`);
            if (newsItem) newsItem.scrollIntoView({ behavior: 'smooth' });
        }, 500);
    }
});

initAppListeners();

// Initial render with empty stats
calculatedPlayers = calculatePlayerStats(null);
renderGroups();
renderPlayers();
renderBracket('round16');
renderBracket('quarters');
renderBracket('semis');
renderBracket('final');


