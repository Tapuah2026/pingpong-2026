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
let playerVotes = {}; // { playerId: { userId: 'up' | 'down' } }
let predictions = {}; // { matchId: { userId: 'playerName' } }
let playerImages = {}; // { playerName: base64 }

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

function getPlayerAvatar(playerName) {
    const key = playerName.replace(/[.#$[\]]/g, '_');
    if (playerImages && playerImages[key]) {
        return playerImages[key];
    }
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=Felix`;
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
                <div class="flex items-center px-3 py-2.5 border-t border-white/5 ${index === 0 ? 'bg-white/5' : ''}">
                    <div class="w-6 font-bold text-xs ${rankColor}">${index + 1}</div>
                    <div class="flex-1 font-medium flex items-center gap-2.5 text-sm truncate">
                        <img src="${getPlayerAvatar(p.name)}" class="w-7 h-7 rounded-full bg-white shadow-sm">
                        <span class="truncate">${p.name}</span>
                    </div>
                    <div class="w-14 text-center font-mono text-xs text-white/50">${p.wins}-${p.losses}</div>
                    <div class="w-10 text-left font-bold text-sm ${ptsColor}">${p.points > 0 ? '+' : ''}${p.points}</div>
                </div>
            `;
        });

        const groupHtml = `
            <div id="node-group-${groupName}" class="glass-panel p-3 rounded-xl overflow-hidden mb-5 relative w-full max-w-[340px] mx-auto shadow-lg shadow-black/20">
                <div class="flex items-center justify-between mb-4 px-1 font-black text-sm uppercase tracking-tight">
                    <span class="flex items-center gap-2"><i class="fa-solid fa-layer-group text-primary"></i> בית ${groupName}</span>
                    ${isGroupsClosed ? '<span class="text-[10px] bg-white/10 px-2 py-0.5 rounded text-white/50 font-bold uppercase"><i class="fa-solid fa-lock mr-1"></i>סגור</span>' : ''}
                </div>
                <div class="flex items-center px-2 py-1.5 border-b border-white/5 text-[10px] text-white/40 uppercase tracking-widest font-black">
                    <div class="w-6">#</div>
                    <div class="flex-1 text-right">שחקן</div>
                    <div class="w-14 text-center">נ-ה</div>
                    <div class="w-10 text-left">נק'</div>
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
        const votes = playerVotes[p.id] || {};
        const crownVotes = Object.values(votes).filter(v => v === 'crown').length;
        const zeroVotes = Object.values(votes).filter(v => v === 'zero').length;
        const middleVotes = Object.values(votes).filter(v => v === 'middle').length;
        const palestineVotes = Object.values(votes).filter(v => v === 'palestine').length;
        const userVote = votes[userId];

        list.innerHTML += `
            <div class="glass-panel rounded-2xl p-3 flex items-center justify-between animate-fade-in-up">
                <div class="flex items-center gap-3 flex-1">
                    <div class="w-12 h-12 rounded-full bg-gradient-to-tr from-white/10 to-white/30 p-0.5" onclick="event.stopPropagation(); window.openImageViewer('${getPlayerAvatar(p.name)}')">
                        <img src="${getPlayerAvatar(p.name)}" class="w-full h-full rounded-full bg-white cursor-pointer hover:scale-110 transition-transform">
                    </div>
                    <div class="flex flex-col cursor-pointer" onclick="window.openPlayerModal(${p.id})">
                        <h3 class="font-bold text-sm text-white">${p.name}</h3>
                        <span class="text-[10px] text-primary font-medium">בית ${p.group} • #${p.rank || '-'}</span>
                    </div>
                </div>
                
                <div class="flex items-center gap-2 bg-white/5 px-2 py-2 rounded-xl">
                    <button onclick="window.togglePlayerVote(${p.id}, 'crown')" class="flex flex-col items-center gap-1 transition-all ${userVote === 'crown' ? 'text-yellow-400 scale-110' : 'text-white/30 hover:text-white/60'}">
                        <i class="fa-solid fa-crown text-[12px]"></i>
                        <span class="text-[9px] font-bold font-mono">${crownVotes}</span>
                    </button>
                    <div class="w-[1px] h-3 bg-white/10"></div>
                    <button onclick="window.togglePlayerVote(${p.id}, 'zero')" class="flex flex-col items-center gap-1 transition-all ${userVote === 'zero' ? 'text-red-400 scale-110' : 'text-white/30 hover:text-white/60'}">
                        <i class="fa-solid fa-0 text-[12px]"></i>
                        <span class="text-[9px] font-bold font-mono">${zeroVotes}</span>
                    </button>
                    <div class="w-[1px] h-3 bg-white/10"></div>
                    <button onclick="window.togglePlayerVote(${p.id}, 'middle')" class="flex flex-col items-center gap-1 transition-all ${userVote === 'middle' ? 'text-purple-400 scale-110' : 'text-white/30 hover:text-white/60'}">
                        <span class="text-[12px]">🖕</span>
                        <span class="text-[9px] font-bold font-mono">${middleVotes}</span>
                    </button>
                    <div class="w-[1px] h-3 bg-white/10"></div>
                    <button onclick="window.togglePlayerVote(${p.id}, 'palestine')" class="flex flex-col items-center gap-1 transition-all ${userVote === 'palestine' ? 'scale-110' : 'opacity-40 hover:opacity-100'}">
                        <img src="https://flagcdn.com/w40/ps.png" class="w-4 h-auto rounded-sm">
                        <span class="text-[9px] font-bold font-mono ${userVote === 'palestine' ? 'text-red-500' : 'text-white/30'}">${palestineVotes}</span>
                    </button>
                </div>
            </div>
        `;
    });
}

window.togglePlayerVote = function(playerId, voteType) {
    if (!window.db) return;
    const voteRef = window.db.ref(`playerVotes/${playerId}/${userId}`);
    
    voteRef.once('value', (snap) => {
        const currentVote = snap.val();
        if (currentVote === voteType) {
            // Remove vote if clicking same one
            voteRef.remove();
        } else {
            // Set or update vote
            voteRef.set(voteType);
        }
    });
};

// --- Player Profile Modal ---
window.openPlayerModal = function (playerId) {
    const p = calculatedPlayers.find(player => player.id === playerId);
    if (!p) return;

    document.getElementById('modal-img').src = getPlayerAvatar(p.name);
    document.getElementById('modal-name').innerText = p.name;
    document.getElementById('modal-rank').innerHTML = `
        <span>בית ${p.group}</span>
        <span class="opacity-50">&bull;</span>
        <span>${p.played} משחקים</span>
    `;
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
        // Only scroll to top when user explicitly clicks a button
        window.scrollTo({ top: 0, behavior: 'smooth' });
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
                const phaseId = slide.id.replace('slide-', '');
                document.querySelectorAll('.phase-btn').forEach(btn => btn.classList.remove('active'));
                const activeBtn = document.getElementById(`btn-phase-${phaseId}`);
                if (activeBtn) activeBtn.classList.add('active');
            }
        });
    }, { root: slider, threshold: 0.9 });

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
let allCompletedMatches = [];
window.closedPhases = {};

function getPlayerByName(name) {
    if (!name || name === 'TBD') return { name: 'TBD', seed: 'none' };
    return players.find(p => p.name === name) || { name: name, seed: 'none' };
}

function getBracketResult(phase, matchIndex) {
    if (!allCompletedMatches) return { winner: null, loser: null, score1: '--', score2: '--' };
    const m = allCompletedMatches.find(m => m.bracketPhase === phase && m.bracketIndex === matchIndex);
    if (!m) return { winner: null, loser: null, score1: '--', score2: '--' };
    
    if (parseInt(m.sets1) > parseInt(m.sets2)) return { winner: m.p1, loser: m.p2, score1: m.sets1, score2: m.sets2 };
    if (parseInt(m.sets2) > parseInt(m.sets1)) return { winner: m.p2, loser: m.p1, score1: m.sets2, score2: m.sets1 };
    return { winner: null, loser: null, score1: m.sets1, score2: m.sets2 };
}

function renderBracket(phase) {
    const container = document.getElementById(`${phase}-container`);
    if (!container) return;

    let matchesHtml = '';
    let matchCount = (phase === 'round16') ? 8 : (phase === 'quarters' ? 4 : (phase === 'semis' ? 2 : 2)); 
    let title = (phase === 'round16') ? 'שמינית גמר' : (phase === 'quarters' ? 'רבע גמר' : (phase === 'semis' ? 'חצי גמר' : 'גמר וחלוקת מקומות'));

    const bracketData = {}; 
    
    if (phase === 'round16' && isGroupsClosed) {
        const groupStandings = {};

        groupNames.forEach(gn => {
            const gPlayers = calculatedPlayers.filter(p => p.group === gn);
            gPlayers.sort((a, b) => b.points - a.points || b.wins - a.wins);
            groupStandings[gn] = gPlayers;
        });

        const pairings = [
            { m: 1, s: 1, g: 'לובאן', r: 0 }, { m: 1, s: 2, g: 'עלי', r: 1 },
            { m: 2, s: 1, g: 'השבח', r: 0 }, { m: 2, s: 2, g: 'המיליונר', r: 1 },
            { m: 3, s: 1, g: 'תורמוס', r: 0 }, { m: 3, s: 2, g: 'ששון', r: 1 },
            { m: 4, s: 1, g: 'הלוזר', r: 0 }, { m: 4, s: 2, g: 'הדורבן', r: 1 },
            { m: 5, s: 1, g: 'עלי', r: 0 }, { m: 5, s: 2, g: 'לובאן', r: 1 },
            { m: 6, s: 1, g: 'המיליונר', r: 0 }, { m: 6, s: 2, g: 'השבח', r: 1 },
            { m: 7, s: 1, g: 'ששון', r: 0 }, { m: 7, s: 2, g: 'תורמוס', r: 1 },
            { m: 8, s: 1, g: 'הדורבן', r: 0 }, { m: 8, s: 2, g: 'הלוזר', r: 1 }
        ];

        pairings.forEach(p => {
            const player = groupStandings[p.g] && groupStandings[p.g][p.r];
            if (player) bracketData[`${p.m}-${p.s}`] = player;
        });
    } else if (phase === 'quarters' && window.closedPhases?.round16) {
        for (let i = 1; i <= 4; i++) {
            bracketData[`${i}-1`] = getPlayerByName(getBracketResult('round16', (i * 2) - 1).winner);
            bracketData[`${i}-2`] = getPlayerByName(getBracketResult('round16', (i * 2)).winner);
        }
    } else if (phase === 'semis' && window.closedPhases?.quarters) {
        for (let i = 1; i <= 2; i++) {
            bracketData[`${i}-1`] = getPlayerByName(getBracketResult('quarters', (i * 2) - 1).winner);
            bracketData[`${i}-2`] = getPlayerByName(getBracketResult('quarters', (i * 2)).winner);
        }
    } else if (phase === 'final' && window.closedPhases?.semis) {
        const res1 = getBracketResult('semis', 1);
        const res2 = getBracketResult('semis', 2);
        bracketData['1-1'] = getPlayerByName(res1.winner);
        bracketData['1-2'] = getPlayerByName(res2.winner);
        bracketData['2-1'] = getPlayerByName(res1.loser);
        bracketData['2-2'] = getPlayerByName(res2.loser);
    }

    for (let i = 1; i <= matchCount; i++) {
        const p1 = bracketData[`${i}-1`] || { name: 'TBD', seed: 'none' };
        const p2 = bracketData[`${i}-2`] || { name: 'TBD', seed: 'none' };
        const res = getBracketResult(phase, i);
        
        let matchTitle = '';
        if (phase === 'final') {
            matchTitle = i === 1 ? 'גמר (מקומות 1-2)' : 'משחק על מקום 3 (מקומות 3-4)';
        }

        matchesHtml += `
            <div id="node-${phase}-${i}" class="glass-panel p-3 rounded-xl flex flex-col border border-white/5 bracket-node relative w-full max-w-[340px] mx-auto shadow-lg shadow-black/20">
                ${matchTitle ? `<div class="text-[10px] text-primary font-bold uppercase mb-2 px-1 tracking-wider">${matchTitle}</div>` : ''}
                <div class="flex flex-col gap-2 flex-1 w-full">
                    <div class="flex justify-between items-center bg-white/5 p-2.5 rounded-lg">
                        <div class="flex items-center gap-2.5">
                            <img src="${getPlayerAvatar(p1.name)}" class="w-8 h-8 rounded-full bg-white/10 shadow-inner">
                            <span class="text-sm font-bold ${p1.name === 'TBD' ? 'text-white/20' : ''}">${p1.name}</span>
                        </div>
                        <span class="font-mono text-primary text-xs font-bold">${res.winner === p1.name ? res.score1 : (res.loser === p1.name ? res.score2 : '--')}</span>
                    </div>
                    <div class="flex justify-between items-center bg-white/5 p-2.5 rounded-lg">
                        <div class="flex items-center gap-2.5">
                            <img src="${getPlayerAvatar(p2.name)}" class="w-8 h-8 rounded-full bg-white/10 shadow-inner">
                            <span class="text-sm font-bold ${p2.name === 'TBD' ? 'text-white/20' : ''}">${p2.name}</span>
                        </div>
                        <span class="font-mono text-primary text-xs font-bold">${res.winner === p2.name ? res.score1 : (res.loser === p2.name ? res.score2 : '--')}</span>
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

    // 0. Player Votes Listener
    window.db.ref('playerVotes').on('value', (snapshot) => {
        playerVotes = snapshot.val() || {};
        renderPlayers();
    });

    // 0.1 Predictions Listener
    window.db.ref('predictions').on('value', (snapshot) => {
        predictions = snapshot.val() || {};
        // Trigger re-render of upcoming matches if they are already rendered
        // In this app, upcoming matches are rendered when the upcomingMatches ref changes
        // but we might need to manually trigger it or just wait for the next sync.
        // Actually, we can just trigger the upcomingMatches update logic manually.
        window.db.ref('upcomingMatches').once('value', (snap) => {
            updateUpcomingUI(snap.val());
        });
    });

    window.db.ref('playerImages').on('value', (snapshot) => {
        playerImages = snapshot.val() || {};
        // Re-render everything that uses avatars
        renderGroups();
        renderPlayers();
        renderBracket('round16');
        renderBracket('quarters');
        renderBracket('semis');
        renderBracket('final');
        // Live match will update automatically via its listener if it calls getPlayerAvatar
        // but we might need to nudge it. 
        // Actually, the listener above for liveMatch will trigger on its own, 
        // but if ONLY playerImages change, we should refresh the live card manually.
        window.db.ref('liveMatch').once('value', (snap) => {
            const data = snap.val();
            if (data && data.p1 !== '---') {
                document.getElementById('p1-img').src = getPlayerAvatar(data.p1);
                document.getElementById('p2-img').src = getPlayerAvatar(data.p2);
            }
        });
    });

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

        document.getElementById('p1-name').innerText = data.p1;
        document.getElementById('p2-name').innerText = data.p2;
        document.getElementById('p1-score').innerText = data.score1;
        document.getElementById('p2-score').innerText = data.score2;
        document.getElementById('p1-sets').innerText = `${data.sets1} מערכות`;
        document.getElementById('p2-sets').innerText = `${data.sets2} מערכות`;
        document.getElementById('match-set').innerText = (data.sets1 === 2 || data.sets2 === 2) ? "המשחק הסתיים" : `מערכה ${data.currentSet}`;
        document.getElementById('match-timer').innerText = (data.sets1 === 2 || data.sets2 === 2) ? "" : "שידור חי";

        const p1Base = (typeof players !== 'undefined') ? players.find(p => p.name === data.p1) : null;
        const p2Base = (typeof players !== 'undefined') ? players.find(p => p.name === data.p2) : null;
        if (p1Base) document.getElementById('p1-img').src = getPlayerAvatar(data.p1);
        if (p2Base) document.getElementById('p2-img').src = getPlayerAvatar(data.p2);

        // Handle Live Stream Link
        const streamLink = document.getElementById('live-stream-link');
        if (streamLink) {
            if (data.streamUrl && data.streamUrl.trim() !== '') {
                streamLink.href = data.streamUrl;
                streamLink.classList.remove('hidden');
            } else {
                streamLink.href = '#';
                streamLink.classList.add('hidden');
            }
        }

        // Handle Predictions
        const p1Pred = document.getElementById('p1-prediction');
        const p2Pred = document.getElementById('p2-prediction');
        const p1Bar = document.getElementById('p1-prediction-bar');
        const p2Bar = document.getElementById('p2-prediction-bar');

        if (data.matchId && predictions[data.matchId]) {
            const matchPredictions = predictions[data.matchId];
            const total = Object.keys(matchPredictions).length;
            const p1Votes = Object.values(matchPredictions).filter(v => v === data.p1).length;
            const p2Votes = Object.values(matchPredictions).filter(v => v === data.p2).length;
            
            const p1Percent = total > 0 ? Math.round((p1Votes / total) * 100) : 0;
            const p2Percent = total > 0 ? Math.round((p2Votes / total) * 100) : 0;
            
            if (p1Pred) {
                p1Pred.innerText = `${p1Percent}%`;
                p1Pred.classList.remove('hidden');
            }
            if (p2Pred) {
                p2Pred.innerText = `${p2Percent}%`;
                p2Pred.classList.remove('hidden');
            }
            if (p1Bar) p1Bar.style.width = `${p1Percent}%`;
            if (p2Bar) p2Bar.style.width = `${p2Percent}%`;
            const totalEl = document.getElementById('total-predictions');
            if (totalEl) {
                totalEl.innerText = `${total} הצבעות`;
                totalEl.classList.remove('hidden');
            }
        } else {
            if (p1Pred) p1Pred.classList.add('hidden');
            if (p2Pred) p2Pred.classList.add('hidden');
            if (p1Bar) p1Bar.style.width = `50%`;
            if (p2Bar) p2Bar.style.width = `50%`;
            const totalEl = document.getElementById('total-predictions');
            if (totalEl) totalEl.classList.add('hidden');
        }
    });

    // 2. Upcoming Matches Listener
    window.db.ref('upcomingMatches').on('value', (snapshot) => {
        updateUpcomingUI(snapshot.val());
    });
}

function updateUpcomingUI(data) {
    const container = document.getElementById('home-upcoming-queue');
    if (!container) return;

    if (!data) {
        container.innerHTML = '<p class="text-white/30 text-sm text-center py-4 bg-white/5 rounded-xl">No upcoming matches</p>';
        return;
    }

    const entries = Object.entries(data);
    
    // Grouping by House (בית)
    const grouped = {};
    entries.forEach(([id, m]) => {
        const p1Info = players.find(p => p.name === m.p1);
        const p2Info = players.find(p => p.name === m.p2);
        
        let groupName = "אחר"; // Default for knockout or mixed
        if (p1Info && p2Info && p1Info.group === p2Info.group) {
            groupName = p1Info.group;
        } else if (p1Info) {
            groupName = p1Info.group;
        } else if (p2Info) {
            groupName = p2Info.group;
        }
        
        if (!grouped[groupName]) grouped[groupName] = [];
        grouped[groupName].push({ id, ...m });
    });

    // Sort groups so named groups come first, "Other" last
    const sortedGroupNames = Object.keys(grouped).sort((a, b) => {
        if (a === "אחר") return 1;
        if (b === "אחר") return -1;
        return a.localeCompare(b);
    });

    let finalHtml = '';
    
    sortedGroupNames.forEach(groupName => {
        finalHtml += `
            <div class="mb-8">
                <div class="flex items-center gap-3 mb-4 px-1">
                    <div class="h-px flex-1 bg-gradient-to-r from-transparent to-white/10"></div>
                    <span class="text-[10px] font-black text-primary uppercase tracking-[0.2em] whitespace-nowrap">בית ${groupName}</span>
                    <div class="h-px flex-1 bg-gradient-to-l from-transparent to-white/10"></div>
                </div>
                <div class="space-y-3">
        `;
        
        grouped[groupName].forEach(m => {
            const matchId = m.id;
            const p1Img = getPlayerAvatar(m.p1);
            const p2Img = getPlayerAvatar(m.p2);

            const matchPredictions = predictions[matchId] || {};
            const totalVotes = Object.keys(matchPredictions).length;
            const p1Votes = Object.values(matchPredictions).filter(v => v === m.p1).length;
            const p2Votes = Object.values(matchPredictions).filter(v => v === m.p2).length;
            
            const userPrediction = matchPredictions[userId];
            const hasVoted = !!userPrediction;

            const p1Percent = totalVotes > 0 ? Math.round((p1Votes / totalVotes) * 100) : 0;
            const p2Percent = totalVotes > 0 ? Math.round((p2Votes / totalVotes) * 100) : 0;

            finalHtml += `
                <div class="glass-panel p-3 rounded-xl flex flex-col gap-3 animate-fade-in-up overflow-hidden relative shadow-lg shadow-black/10">
                    <div class="flex items-center gap-3">
                        <div class="text-center w-16 border-r border-white/10 pr-2">
                            <div class="text-[9px] text-white/40 uppercase font-bold">${m.date ? m.date.split('-').slice(1).reverse().join('/') : 'TBD'}</div>
                            <div class="font-bold text-primary">${m.time || '--:--'}</div>
                        </div>
                        <div class="flex-1 flex items-center justify-between pl-2">
                            <!-- Player 1 -->
                            <div onclick="window.submitPrediction('${matchId}', '${m.p1}')" class="flex items-center gap-2 cursor-pointer transition-all active:scale-95 group">
                                <img src="${p1Img}" class="w-8 h-8 rounded-full bg-white/10 transition-all duration-300 border-2 border-transparent ${userPrediction === m.p1 ? 'active-ring-glow scale-110' : 'grayscale-[0.5] group-hover:grayscale-0'}">
                                <div class="flex flex-col">
                                    <span class="text-sm font-semibold transition-colors ${userPrediction === m.p1 ? 'text-primary' : 'text-white/70'}">${m.p1}</span>
                                    ${hasVoted ? `<span class="text-[10px] font-bold text-white/30">${p1Percent}%</span>` : ''}
                                </div>
                            </div>
                            
                            <span class="text-white/20 text-[10px] font-black uppercase tracking-tighter">VS</span>
                            
                            <!-- Player 2 -->
                            <div onclick="window.submitPrediction('${matchId}', '${m.p2}')" class="flex items-center gap-2 flex-row-reverse cursor-pointer transition-all active:scale-95 group">
                                <img src="${p2Img}" class="w-8 h-8 rounded-full bg-white/10 transition-all duration-300 border-2 border-transparent ${userPrediction === m.p2 ? 'active-ring-glow scale-110' : 'grayscale-[0.5] group-hover:grayscale-0'}">
                                <div class="flex flex-col items-end">
                                    <span class="text-sm font-semibold transition-colors ${userPrediction === m.p2 ? 'text-primary' : 'text-white/70'}">${m.p2}</span>
                                    ${hasVoted ? `<span class="text-[10px] font-bold text-white/30">${p2Percent}%</span>` : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    ${hasVoted ? `
                    <div class="flex items-center gap-3 animate-slide-down">
                        <div class="w-16 pr-2"></div>
                        <div class="flex-1">
                            <div class="h-1 bg-white/5 rounded-full overflow-hidden flex mb-1">
                                <div class="bg-primary h-full transition-all duration-700 ease-out" style="width: ${p1Percent}%"></div>
                                <div class="bg-white/10 h-full transition-all duration-700 ease-out" style="width: ${p2Percent}%"></div>
                            </div>
                            <div class="text-[9px] text-white/20 text-center font-bold">${totalVotes} הצבעות</div>
                        </div>
                    </div>
                    ` : `
                    <div class="flex items-center gap-3">
                        <div class="w-16 pr-2"></div>
                        <div class="flex-1 text-[9px] text-center text-white/20 uppercase font-bold tracking-widest">לחץ על שחקן כדי להמר</div>
                    </div>
                    `}
                </div>
            `;
        });
        
        finalHtml += `</div></div>`;
    });

    container.innerHTML = finalHtml;
}

window.submitPrediction = function(matchId, playerName) {
    if (!window.db) return;
    const predRef = window.db.ref(`predictions/${matchId}/${userId}`);
    predRef.once('value', (snap) => {
        if (snap.val() === playerName) {
            predRef.remove(); // Toggle off
        } else {
            predRef.set(playerName);
        }
    });
};

// 3. Completed Matches & Results Listener
function initCompletedMatchesListener() {
    if (!window.db) return;
    window.db.ref('completedMatches').on('value', (snapshot) => {
        const data = snapshot.val();
        allCompletedMatches = data ? Object.values(data) : [];
        calculatedPlayers = calculatePlayerStats(data);
        
        renderGroups();
        renderPlayers();
        renderBracket('round16');
        renderBracket('quarters');
        renderBracket('semis');
        renderBracket('final');

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
            const p1Img = getPlayerAvatar(match.p1);
            const p2Img = getPlayerAvatar(match.p2);
            const isP1Winner = match.sets1 > match.sets2;

            const card = document.createElement('div');
            card.className = 'glass-panel rounded-xl p-4 animate-fade-in-up flex flex-col gap-3 mb-3';
            card.innerHTML = `
                <div class="text-xs text-white/50 text-center uppercase tracking-widest">${match.date}</div>
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3 w-1/3">
                        <img src="${p1Img}" onclick="window.openImageViewer('${p1Img}')" class="w-10 h-10 rounded-full bg-white/10 p-0.5 cursor-pointer hover:scale-110 transition-transform ${isP1Winner ? 'ring-2 ring-primary' : ''}">
                        <span class="font-bold text-sm ${isP1Winner ? 'text-primary' : 'text-white/70'}">${match.p1.split(' ')[0]}</span>
                    </div>
                    <div class="flex items-center gap-2 font-mono text-xl w-1/3 justify-center">
                        <span class="${isP1Winner ? 'font-black text-white' : 'text-white/50'}">${match.sets1}</span>
                        <span class="text-white/20">-</span>
                        <span class="${!isP1Winner ? 'font-black text-white' : 'text-white/50'}">${match.sets2}</span>
                    </div>
                    <div class="flex items-center gap-3 w-1/3 justify-end">
                        <span class="font-bold text-sm ${!isP1Winner ? 'text-primary' : 'text-white/70'}">${match.p2.split(' ')[0]}</span>
                        <img src="${p2Img}" onclick="window.openImageViewer('${p2Img}')" class="w-10 h-10 rounded-full bg-white/10 p-0.5 cursor-pointer hover:scale-110 transition-transform ${!isP1Winner ? 'ring-2 ring-primary' : ''}">
                    </div>
                </div>

            `;
            container.appendChild(card);
        });
    });
}

// 4. Tournament State Listener
function initTournamentStateListener() {
    if (!window.db) return;
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
}

// 5. News Listener
function initNewsListener() {
    if (!window.db) return;
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

    // 5. Tournament State Listener
    window.db.ref('tournamentState').on('value', (snapshot) => {
        const state = snapshot.val() || {};
        isGroupsClosed = !!state.isGroupsClosed;
        window.closedPhases = state.closedPhases || {};
        
        // Re-render everything that depends on state
        renderGroups();
        renderBracket('round16');
        renderBracket('quarters');
        renderBracket('semis');
        renderBracket('final');
    });
}

// Analytics: Track visits per day
function trackVisit() {
    if (!window.db) return;
    try {
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
        
        // Use sessionStorage to avoid double-counting refreshes in the same session
        const visitKey = `visited_${dateStr}`;
        if (sessionStorage.getItem(visitKey)) return;

        const visitsRef = window.db.ref(`analytics/visits/${dateStr}`);
        visitsRef.transaction((currentValue) => {
            return (currentValue || 0) + 1;
        });
        
        sessionStorage.setItem(visitKey, 'true');
    } catch (e) {
        console.error("Visit tracking error:", e);
    }
}

// Initialize all global listeners
function initAllListeners() {
    initAppListeners();
    initCompletedMatchesListener();
    initTournamentStateListener();
    initNewsListener();
    trackVisit(); // Track visit on load
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

initAllListeners();

// Initial render with empty stats
calculatedPlayers = calculatePlayerStats(null);
renderGroups();
renderPlayers();
renderBracket('round16');
renderBracket('quarters');
renderBracket('semis');
renderBracket('final');

// --- Image Viewer Logic ---
window.openImageViewer = function(src) {
    const modal = document.getElementById('image-viewer-modal');
    const img = document.getElementById('image-viewer-img');
    if (!modal || !img) return;

    img.src = src;
    modal.classList.remove('pointer-events-none');
    modal.classList.remove('opacity-0');
    setTimeout(() => {
        img.classList.remove('scale-95');
        img.classList.add('scale-100');
    }, 10);
};

window.closeImageViewer = function() {
    const modal = document.getElementById('image-viewer-modal');
    const img = document.getElementById('image-viewer-img');
    if (!modal || !img) return;

    img.classList.remove('scale-100');
    img.classList.add('scale-95');
    modal.classList.add('opacity-0');
    setTimeout(() => {
        modal.classList.add('pointer-events-none');
        img.src = '';
    }, 300);
};
