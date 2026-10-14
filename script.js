// Varsayılan Kadro Listesi
const defaultPlayers = [
    { id: 1, name: "Sen", position: "Orta Saha" },
    { id: 2, name: "Mehmet", position: "Orta Saha" },
    { id: 3, name: "Ali Can", position: "Kaleci" },
    { id: 4, name: "Ufuk", position: "Defans" },
    { id: 5, name: "Yasin", position: "Forvet" },
    { id: 6, name: "Burak", position: "Forvet" },
    { id: 7, name: "Zekeriya", position: "Forvet" },
    { id: 8, name: "Cengiz", position: "Defans" },
    { id: 9, name: "İbrahim", position: "Defans" },
    { id: 10, name: "Yüksel", position: "Forvet" },
    { id: 11, name: "Miraç", position: "Orta Saha" },
    { id: 12, name: "Ömer Can", position: "Defans" }
];

// LocalStorage Verilerini Yükle veya Başlat
let players = JSON.parse(localStorage.getItem('haliSahaPlayers')) || defaultPlayers;
let votes = JSON.parse(localStorage.getItem('haliSahaVotes')) || {}; // { voterId: { targetPlayerId: rating } }

// DOM Elementleri
const voterSelect = document.getElementById('voterSelect');
const ratingSection = document.getElementById('ratingSection');
const voterBadge = document.getElementById('voterBadge');
const playerRatingList = document.getElementById('playerRatingList');
const saveVotesBtn = document.getElementById('saveVotesBtn');
const drawTeamsBtn = document.getElementById('drawTeamsBtn');
const resultsContainer = document.getElementById('resultsContainer');

// Sayfa Yüklendiğinde
document.addEventListener('DOMContentLoaded', () => {
    populateVoterSelect();
    voterSelect.addEventListener('change', handleVoterChange);
    saveVotesBtn.addEventListener('click', saveVotes);
    drawTeamsBtn.addEventListener('click', calculateAndDrawTeams);
    document.getElementById('copyWhatsappBtn').addEventListener('click', copyWhatsappFormat);
});

// Oy Veren Seçim Listesini Doldur
function populateVoterSelect() {
    voterSelect.innerHTML = '<option value="">-- Lütfen İsmini Seç --</option>';
    players.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = `${p.name} (${p.position})`;
        voterSelect.appendChild(opt);
    });
}

// Seçilen Oyuncuya Göre Puanlama Listesini Aç
function handleVoterChange() {
    const voterId = voterSelect.value;
    if (!voterId) {
        ratingSection.classList.add('hidden');
        return;
    }

    const voter = players.find(p => p.id == voterId);
    voterBadge.textContent = `${voter.name} Oynuyor`;
    
    // Puanlama kartlarını oluştur (Kendi hariç)
    playerRatingList.innerHTML = '';
    const currentVoterVotes = votes[voterId] || {};

    players.filter(p => p.id != voterId).forEach(player => {
        const existingRating = currentVoterVotes[player.id] || 3; // Varsayılan 3 puan
        
        const card = document.createElement('div');
        card.className = "bg-slate-900/80 p-4 rounded-xl border border-slate-700 flex justify-between items-center";
        card.innerHTML = `
            <div>
                <span class="font-bold text-slate-200 block">${player.name}</span>
                <span class="text-xs text-slate-400">${player.position}</span>
            </div>
            <div class="flex items-center gap-1">
                <select data-target="${player.id}" class="rating-select bg-slate-800 text-amber-400 border border-slate-600 rounded-lg px-3 py-1 font-bold">
                    ${[1, 2, 3, 4, 5].map(star => `<option value="${star}" ${star == existingRating ? 'selected' : ''}>${star} ⭐</option>`).join('')}
                </select>
            </div>
        `;
        playerRatingList.appendChild(card);
    });

    ratingSection.classList.remove('hidden');
}

// Oyları Kaydet
function saveVotes() {
    const voterId = voterSelect.value;
    if (!voterId) return;

    if (!votes[voterId]) votes[voterId] = {};

    const ratingSelects = document.querySelectorAll('.rating-select');
    ratingSelects.forEach(select => {
        const targetId = select.getAttribute('data-target');
        votes[voterId][targetId] = parseInt(select.value);
    });

    localStorage.setItem('haliSahaVotes', JSON.stringify(votes));
    alert('✅ Oyların başarıyla kaydedildi!');
    voterSelect.value = '';
    ratingSection.classList.add('hidden');
}

// Her Oyuncunun Ortalama Puanını Hesapla
function calculatePlayerAverages() {
    return players.map(player => {
        let total = 0;
        let count = 0;

        Object.keys(votes).forEach(voterId => {
            if (voterId != player.id && votes[voterId][player.id]) {
                total += votes[voterId][player.id];
                count++;
            }
        });

        const avg = count > 0 ? (total / count) : 3.0; // Hiç oy yoksa nötr 3.0
        return { ...player, rating: parseFloat(avg.toFixed(1)) };
    });
}

// Dengeli Kura Algoritması & Takım Bitişi
function calculateAndDrawTeams() {
    const ratedPlayers = calculatePlayerAverages();
    
    // Oyuncuları Puana Göre Sırala
    ratedPlayers.sort((a, b) => b.rating - a.rating);

    let teamA = [];
    let teamB = [];
    let scoreA = 0;
    let scoreB = 0;

    // Yılan Dağıtım Algoritması (Snake Draft - Güçleri Birebir Dengelemek İçin)
    ratedPlayers.forEach((p, index) => {
        if (index % 4 === 0 || index % 4 === 3) {
            if (scoreA <= scoreB) { teamA.push(p); scoreA += p.rating; }
            else { teamB.push(p); scoreB += p.rating; }
        } else {
            if (scoreB <= scoreA) { teamB.push(p); scoreB += p.rating; }
            else { teamA.push(p); scoreA += p.rating; }
        }
    });

    renderTeamsOnPitch(teamA, teamB, scoreA, scoreB);
}

// Takımları Sahaya Düzme (2-1-2 Formatı)
function renderTeamsOnPitch(teamA, teamB, scoreA, scoreB) {
    document.getElementById('teamARating').textContent = (scoreA / teamA.length).toFixed(1);
    document.getElementById('teamBRating').textContent = (scoreB / teamB.length).toFixed(1);

    const renderCard = (p, isTeamA) => `
        <div class="${isTeamA ? 'bg-red-600/90' : 'bg-blue-600/90'} text-white text-xs px-2.5 py-1.5 rounded-lg font-bold shadow-md text-center border border-white/20 min-w-[70px]">
            <div>${p.name}</div>
            <div class="text-[10px] opacity-80">${p.rating} ⭐</div>
        </div>
    `;

    // A Takımı Pozisyonlama
    document.getElementById('teamAGoalie').innerHTML = renderCard(teamA[0], true);
    document.getElementById('teamADefense').innerHTML = `${renderCard(teamA[1], true)} ${renderCard(teamA[2], true)}`;
    document.getElementById('teamAMidfield').innerHTML = renderCard(teamA[3], true);
    document.getElementById('teamAAttack').innerHTML = `${renderCard(teamA[4], true)} ${renderCard(teamA[5] || teamA[4], true)}`;

    // B Takımı Pozisyonlama
    document.getElementById('teamBAttack').innerHTML = `${renderCard(teamB[4], false)} ${renderCard(teamB[5] || teamB[4], false)}`;
    document.getElementById('teamBMidfield').innerHTML = renderCard(teamB[3], false);
    document.getElementById('teamBDefense').innerHTML = `${renderCard(teamB[1], false)} ${renderCard(teamB[2], false)}`;
    document.getElementById('teamBGoalie').innerHTML = renderCard(teamB[0], false);

    resultsContainer.classList.remove('hidden');
    resultsContainer.scrollIntoView({ behavior: 'smooth' });
}

// WhatsApp Metni Kopyalama
function copyWhatsappFormat() {
    const ratingA = document.getElementById('teamARating').textContent;
    const ratingB = document.getElementById('teamBRating').textContent;

    let text = `⚽ *PERŞEMBE MAÇI AKILLI KURA SONUÇLARI* ⚽\n\n`;
    text += `🔴 *A TAKIMI* (Güç: ${ratingA})\n`;
    document.querySelectorAll('#teamAGoalie, #teamADefense, #teamAMidfield, #teamAAttack').forEach(el => {
        el.querySelectorAll('.font-bold').forEach(p => { if(p.textContent) text += `• ${p.textContent}\n`; });
    });

    text += `\n🔵 *B TAKIMI* (Güç: ${ratingB})\n`;
    document.querySelectorAll('#teamBGoalie, #teamBDefense, #teamBMidfield, #teamBAttack').forEach(el => {
        el.querySelectorAll('.font-bold').forEach(p => { if(p.textContent) text += `• ${p.textContent}\n`; });
    });

    text += `\nHilesiz, oylara göre dengeli kuradır. İki takıma da başarılar! 🔥`;

    navigator.clipboard.writeText(text);
    alert('📋 Kadro WhatsApp formatında panoya kopyalandı!');
}
