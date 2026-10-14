// Varsayılan Kadro Listesi ("Sen" yerine "Muhammet", sabit pozisyonlar kaldırıldı)
const defaultPlayers = [
    { id: 1, name: "Muhammet" },
    { id: 2, name: "Mehmet" },
    { id: 3, name: "Ali Can" },
    { id: 4, name: "Ufuk" },
    { id: 5, name: "Yasin" },
    { id: 6, name: "Burak" },
    { id: 7, name: "Zekeriya" },
    { id: 8, name: "Cengiz" },
    { id: 9, name: "İbrahim" },
    { id: 10, name: "Yüksel" },
    { id: 11, name: "Miraç" },
    { id: 12, name: "Ömer Can" }
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
        opt.textContent = p.name;
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
    voterBadge.textContent = `${voter.name} Oy Kullanıyor`;
    
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

// Dengeli Kura Algoritması & Takım Kurma
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

// Takımları Sahaya Düzme ve Dinamik Pozisyon Atama (2-1-2 Formatı)
function renderTeamsOnPitch(teamA, teamB, scoreA, scoreB) {
    document.getElementById('teamARating').textContent = (scoreA / teamA.length).toFixed(1);
    document.getElementById('teamBRating').textContent = (scoreB / teamB.length).toFixed(1);

    // Kura sonucunda takımdaki 6 oyuncuyu 2-1-2 formatına dinamik yerleştir
    const assignPositions = (team) => ({
        goalie: team[0],
        defense: [team[1], team[2]],
        midfield: team[3],
        attack: [team[4], team[5] || team[4]]
    });

    const posA = assignPositions(teamA);
    const posB = assignPositions(teamB);

    const renderCard = (p, role, isTeamA) => `
        <div class="${isTeamA ? 'bg-red-600/90' : 'bg-blue-600/90'} text-white text-xs px-2.5 py-1.5 rounded-lg font-bold shadow-md text-center border border-white/20 min-w-[70px]">
            <div>${p.name}</div>
            <div class="text-[10px] opacity-90">${role} (${p.rating}⭐)</div>
        </div>
    `;

    // A Takımı Pozisyonlama
    document.getElementById('teamAGoalie').innerHTML = renderCard(posA.goalie, 'Kaleci', true);
    document.getElementById('teamADefense').innerHTML = `${renderCard(posA.defense[0], 'Defans', true)} ${renderCard(posA.defense[1], 'Defans', true)}`;
    document.getElementById('teamAMidfield').innerHTML = renderCard(posA.midfield, 'Orta Saha', true);
    document.getElementById('teamAAttack').innerHTML = `${renderCard(posA.attack[0], 'Forvet', true)} ${renderCard(posA.attack[1], 'Forvet', true)}`;

    // B Takımı Pozisyonlama
    document.getElementById('teamBAttack').innerHTML = `${renderCard(posB.attack[0], 'Forvet', false)} ${renderCard(posB.attack[1], 'Forvet', false)}`;
    document.getElementById('teamBMidfield').innerHTML = renderCard(posB.midfield, 'Orta Saha', false);
    document.getElementById('teamBDefense').innerHTML = `${renderCard(posB.defense[0], 'Defans', false)} ${renderCard(posB.defense[1], 'Defans', false)}`;
    document.getElementById('teamBGoalie').innerHTML = renderCard(posB.goalie, 'Kaleci', false);

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
