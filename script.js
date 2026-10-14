import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyDy-Y4F9KV_wo2SYM9MmZOgrmlZc0kZqjU",
    authDomain: "matchmaking-5f6d0.firebaseapp.com",
    databaseURL: "https://matchmaking-5f6d0-default-rtdb.firebaseio.com",
    projectId: "matchmaking-5f6d0",
    storageBucket: "matchmaking-5f6d0.firebasestorage.app",
    messagingSenderId: "368624820285",
    appId: "1:368624820285:web:95ea32d33beb7fba214a54"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const varsayilanOyuncular = {
    "Muhammet": { pozisyon: "Orta Saha", puan: 8 },
    "Mehmet": { pozisyon: "Defans", puan: 7 },
    "Ali Can": { pozisyon: "Hücum", puan: 8 },
    "Ufuk": { pozisyon: "Kale", puan: 8 },
    "Yasin": { pozisyon: "Orta Saha", puan: 7 },
    "Burak": { pozisyon: "Defans", puan: 6 },
    "Zekeriya": { pozisyon: "Hücum", puan: 7 },
    "Cengiz": { pozisyon: "Orta Saha", puan: 6 },
    "İbrahim": { pozisyon: "Defans", puan: 7 },
    "Yüksel": { pozisyon: "Kale", puan: 7 },
    "Miraç": { pozisyon: "Hücum", puan: 6 },
    "Ömer Can": { pozisyon: "Orta Saha", puan: 6 }
};

let globalVeri = { oyuncular: {}, yoklama: {}, macTarihi: "", takimA: [], takimB: [], toplamA: 0, toplamB: 0 };

const dbRef = ref(db, 'haliSahaData');
onValue(dbRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
        globalVeri = data;
        if (!globalVeri.oyuncular) {
            globalVeri.oyuncular = varsayilanOyuncular;
            veriyiKaydet();
        }
    } else {
        globalVeri = { oyuncular: varsayilanOyuncular, yoklama: {}, macTarihi: "", takimA: [], takimB: [], toplamA: 0, toplamB: 0 };
        veriyiKaydet();
    }

    if (globalVeri.macTarihi) {
        const macZamani = new Date(globalVeri.macTarihi).getTime();
        const simdi = new Date().getTime();
        if (simdi >= macZamani) {
            globalVeri.yoklama = {};
            globalVeri.macTarihi = "";
            globalVeri.takimA = [];
            globalVeri.takimB = [];
            globalVeri.toplamA = 0;
            globalVeri.toplamB = 0;
            veriyiKaydet();
        }
    }
    
    document.getElementById('sync-status').innerText = "🟢 Canlı Bağlantı Aktif";
    document.getElementById('sync-status').className = "inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30";
    
    ekranlariGuncelle();
}, (error) => {
    document.getElementById('sync-status').innerText = "🔴 Bağlantı Hatası";
    document.getElementById('sync-status').className = "inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30";
});

function veriyiKaydet() {
    set(ref(db, 'haliSahaData'), globalVeri);
}

window.tabDegistir = function(tabAdi) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.getElementById('tab-' + tabAdi).classList.remove('hidden');

    ['yoklama', 'oyuncular', 'puanlama', 'kura'].forEach(t => {
        const btn = document.getElementById('btn-' + t);
        if (t === tabAdi) {
            btn.className = "px-4 py-2 rounded-lg font-medium text-sm transition-all bg-emerald-600 text-white shadow";
        } else {
            btn.className = "px-4 py-2 rounded-lg font-medium text-sm transition-all text-slate-300 hover:bg-slate-700";
        }
    });
}

function ekranlariGuncelle() {
    oyuncuDropdownDoldur();
    yoklamaListeleriniGoster();
    oyunculariListeleYonetim();
    oyunculariListelePuanlama();
    macTarihiniGoster();

    if (globalVeri.takimA && globalVeri.takimB && globalVeri.takimA.length > 0) {
        takimlariEkranaBas(globalVeri.takimA, globalVeri.takimB, globalVeri.toplamA || 0, globalVeri.toplamB || 0);
    }
}

function macTarihiniGoster() {
    const input = document.getElementById('match-date-picker');
    const countdown = document.getElementById('match-countdown');
    if (!input || !countdown) return;
    
    if (globalVeri.macTarihi) {
        input.value = globalVeri.macTarihi;
        const kalanZaman = new Date(globalVeri.macTarihi).toLocaleString('tr-TR');
        countdown.innerText = `Seçilen Maç Zamanı: ${kalanZaman}`;
    } else {
        input.value = "";
        countdown.innerText = "Henüz maç tarihi belirlenmedi.";
    }
}

window.macTarihiniKaydet = function() {
    const tarihDegeri = document.getElementById('match-date-picker').value;
    if (!tarihDegeri) {
        alert("Lütfen geçerli bir tarih ve saat seçin!");
        return;
    }
    globalVeri.macTarihi = tarihDegeri;
    veriyiKaydet();
    alert("Maç tarihi başarıyla kaydedildi!");
}

function oyuncuDropdownDoldur() {
    const select = document.getElementById('secilen-oyuncu');
    if (!select) return;
    const seciliDeger = select.value;
    select.innerHTML = '<option value="">Oyuncu Seçin...</option>';

    const oyuncular = globalVeri.oyuncular || {};
    for (let isim in oyuncular) {
        select.innerHTML += `<option value="${isim}">${isim} (${oyuncular[isim].pozisyon})</option>`;
    }
    select.value = seciliDeger;
}

window.oyVerGonder = function(event) {
    event.preventDefault();
    const isim = document.getElementById('secilen-oyuncu').value;
    const durum = document.getElementById('secilen-durum').value;

    if (!isim) return;

    if (!globalVeri.yoklama) globalVeri.yoklama = {};
    globalVeri.yoklama[isim] = durum;
    veriyiKaydet();
    alert(`${isim} için oyunuz (${durum === 'gelirim' ? 'Gelirim' : 'Gelemem'}) güncellendi!`);
}

function yoklamaListeleriniGoster() {
    const listeGelenler = document.getElementById('liste-gelenler');
    const listeGelmeyenler = document.getElementById('liste-gelmeyenler');
    const listeCevapVermeyenler = document.getElementById('liste-cevap-vermeyenler');
    
    if (!listeGelenler || !listeGelmeyenler || !listeCevapVermeyenler) return;
    
    listeGelenler.innerHTML = '';
    listeGelmeyenler.innerHTML = '';
    listeCevapVermeyenler.innerHTML = '';

    const oyuncular = globalVeri.oyuncular || {};
    const yoklama = globalVeri.yoklama || {};

    let gelenSayisi = 0;
    let gelmeyenSayisi = 0;
    let cevapVermeyenSayisi = 0;

    for (let isim in oyuncular) {
        const durum = yoklama[isim];
        const pozisyon = oyuncular[isim].pozisyon;

        if (durum === 'gelirim') {
            gelenSayisi++;
            listeGelenler.innerHTML += `
                <li class="flex justify-between items-center bg-slate-900/60 p-2.5 rounded-lg border border-slate-700/40">
                    <span class="font-medium text-white text-xs sm:text-sm">${isim} <span class="text-xs text-slate-400">(${pozisyon})</span></span>
                    <span class="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold">Geliyor</span>
                </li>
            `;
        } else if (durum === 'gelemem') {
            gelmeyenSayisi++;
            listeGelmeyenler.innerHTML += `
                <li class="flex justify-between items-center bg-slate-900/60 p-2.5 rounded-lg border border-slate-700/40">
                    <span class="font-medium text-white text-xs sm:text-sm">${isim} <span class="text-xs text-slate-400">(${pozisyon})</span></span>
                    <span class="text-xs bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded font-bold">Gelemiyor</span>
                </li>
            `;
        } else {
            cevapVermeyenSayisi++;
            listeCevapVermeyenler.innerHTML += `
                <li class="flex justify-between items-center bg-slate-900/60 p-2.5 rounded-lg border border-slate-700/40">
                    <span class="font-medium text-white text-xs sm:text-sm">${isim} <span class="text-xs text-slate-400">(${pozisyon})</span></span>
                    <span class="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-bold">Belirsiz</span>
                </li>
            `;
        }
    }

    if (gelenSayisi === 0) listeGelenler.innerHTML = '<li class="text-xs text-slate-400 p-2">Henüz yoklama verilmedi.</li>';
    if (gelmeyenSayisi === 0) listeGelmeyenler.innerHTML = '<li class="text-xs text-slate-400 p-2">Henüz "Gelemem" diyen yok.</li>';
    if (cevapVermeyenSayisi === 0) listeCevapVermeyenler.innerHTML = '<li class="text-xs text-emerald-400 p-2">Herkes oy kullandı!</li>';

    document.getElementById('sayi-gelen').innerText = `${gelenSayisi} Kişi`;
    document.getElementById('sayi-gelmeyen').innerText = `${gelmeyenSayisi} Kişi`;
    document.getElementById('sayi-cevap-vermeyen').innerText = `${cevapVermeyenSayisi} Kişi`;
}

function oyunculariListeleYonetim() {
    const tbody = document.getElementById('yonetim-oyuncu-tablosu');
    const sayacBadge = document.getElementById('toplam-oyuncu-sayisi');
    if (!tbody || !sayacBadge) return;

    tbody.innerHTML = '';
    const oyuncular = globalVeri.oyuncular || {};
    const oyuncuIsimleri = Object.keys(oyuncular);

    sayacBadge.innerText = `Toplam: ${oyuncuIsimleri.length} Oyuncu`;

    for (let isim of oyuncuIsimleri) {
        tbody.innerHTML += `
            <tr class="hover:bg-slate-700/30" id="row-${isim}">
                <td class="p-3 font-medium text-white w-1/3">${isim}</td>
                <td class="p-3 w-1/3">${oyuncular[isim].pozisyon}</td>
                <td class="p-3 text-right space-x-2 w-1/3">
                    <button onclick="oyuncuDuzenleModu('${isim}', '${oyuncular[isim].pozisyon}')" class="text-amber-400 hover:text-amber-300 text-xs bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 rounded-lg border border-amber-500/30 transition-colors">Düzenle</button>
                    <button onclick="oyuncuSil('${isim}')" class="text-rose-400 hover:text-rose-300 text-xs bg-rose-500/10 hover:bg-rose-500/20 px-3 py-1.5 rounded-lg border border-rose-500/30 transition-colors">Sil</button>
                </td>
            </tr>
        `;
    }
}

window.oyuncuDuzenleModu = function(eskiIsim, mevcutPozisyon) {
    const row = document.getElementById(`row-${eskiIsim}`);
    if (!row) return;

    row.innerHTML = `
        <td class="p-3 w-1/3">
            <input type="text" id="edit-isim-${eskiIsim}" value="${eskiIsim}" class="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-xs w-full">
        </td>
        <td class="p-3 w-1/3">
            <select id="edit-pozisyon-${eskiIsim}" class="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-xs">
                <option value="Kale" ${mevcutPozisyon === 'Kale' ? 'selected' : ''}>Kale</option>
                <option value="Defans" ${mevcutPozisyon === 'Defans' ? 'selected' : ''}>Defans</option>
                <option value="Orta Saha" ${mevcutPozisyon === 'Orta Saha' ? 'selected' : ''}>Orta Saha</option>
                <option value="Hücum" ${mevcutPozisyon === 'Hücum' ? 'selected' : ''}>Hücum</option>
            </select>
        </td>
        <td class="p-3 text-right space-x-2 w-1/3">
            <button onclick="oyuncuGuncelleKaydet('${eskiIsim}')" class="text-emerald-400 hover:text-emerald-300 text-xs bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 rounded-lg border border-emerald-500/30 transition-colors">Kaydet</button>
            <button onclick="ekranlariGuncelle()" class="text-slate-400 hover:text-slate-300 text-xs bg-slate-700/50 px-3 py-1.5 rounded-lg transition-colors">İptal</button>
        </td>
    `;
}

window.oyuncuGuncelleKaydet = function(eskiIsim) {
    const yeniIsim = document.getElementById(`edit-isim-${eskiIsim}`).value.trim();
    const yeniPozisyon = document.getElementById(`edit-pozisyon-${eskiIsim}`).value;

    if (!yeniIsim) {
        alert("Oyuncu adı boş olamaz!");
        return;
    }

    const mevcutPuan = globalVeri.oyuncular[eskiIsim] ? (globalVeri.oyuncular[eskiIsim].puan || 7) : 7;
    const mevcutYoklamaDurumu = globalVeri.yoklama ? globalVeri.yoklama[eskiIsim] : null;

    if (eskiIsim !== yeniIsim) {
        if (globalVeri.oyuncular[yeniIsim]) {
            alert("Bu isimde başka bir oyuncu zaten var!");
            return;
        }
        delete globalVeri.oyuncular[eskiIsim];
        if (globalVeri.yoklama && globalVeri.yoklama[eskiIsim]) {
            delete globalVeri.yoklama[eskiIsim];
        }
    }

    globalVeri.oyuncular[yeniIsim] = { pozisyon: yeniPozisyon, puan: mevcutPuan };
    if (mevcutYoklamaDurumu) {
        globalVeri.yoklama[yeniIsim] = mevcutYoklamaDurumu;
    }

    veriyiKaydet();
}

window.oyuncuEkle = function(event) {
    event.preventDefault();
    const isim = document.getElementById('yeni-isim').value.trim();
    const pozisyon = document.getElementById('yeni-pozisyon').value;

    if (!isim) return;

    if (!globalVeri.oyuncular) globalVeri.oyuncular = {};
    globalVeri.oyuncular[isim] = { pozisyon: pozisyon, puan: 7 };
    veriyiKaydet();

    document.getElementById('yeni-isim').value = '';
}

window.oyuncuSil = function(isim) {
    if (confirm(`${isim} isimli oyuncuyu silmek istediğine emin misin?`)) {
        delete globalVeri.oyuncular[isim];
        if (globalVeri.yoklama) delete globalVeri.yoklama[isim];
        veriyiKaydet();
    }
}

function oyunculariListelePuanlama() {
    const container = document.getElementById('puanlama-listesi');
    if (!container) return;
    container.innerHTML = '';

    const oyuncular = globalVeri.oyuncular || {};
    for (let isim in oyuncular) {
        const puan = oyuncular[isim].puan || 7;
        container.innerHTML += `
            <div class="bg-slate-900/60 border border-slate-700/60 p-4 rounded-xl flex items-center justify-between gap-4">
                <div>
                    <h4 class="font-bold text-white">${isim}</h4>
                    <span class="text-xs text-slate-400">${oyuncular[isim].pozisyon}</span>
                </div>
                <div class="flex items-center gap-3">
                    <span id="puan-txt-${isim}" class="text-emerald-400 font-bold w-8 text-center">${puan}</span>
                    <input type="range" min="1" max="10" value="${puan}" oninput="puanGuncelleAnlik('${isim}', this.value)" onchange="puanKaydet('${isim}', this.value)" class="w-28 sm:w-40 accent-emerald-500 cursor-pointer">
                </div>
            </div>
        `;
    }
}

window.puanGuncelleAnlik = function(isim, deger) {
    const txt = document.getElementById(`puan-txt-${isim}`);
    if (txt) txt.innerText = deger;
}

window.puanKaydet = function(isim, deger) {
    if (!globalVeri.oyuncular[isim]) globalVeri.oyuncular[isim] = {};
    globalVeri.oyuncular[isim].puan = parseInt(deger);
    veriyiKaydet();
}

window.kuraCek = function() {
    const oyuncular = globalVeri.oyuncular || {};
    const yoklama = globalVeri.yoklama || {};

    let gelenler = Object.keys(oyuncular).filter(isim => yoklama[isim] === 'gelirim');

    if (gelenler.length < 2) {
        alert("Kura çekmek için yoklamada en az 2 kişi 'Gelirim' demelidir!");
        return;
    }

    // Puanları eşit olan oyuncuları rastgele karıştır, farklı olanları puana göre sırala
    gelenler.sort((a, b) => {
        if (oyuncular[b].puan === oyuncular[a].puan) {
            return Math.random() - 0.5;
        }
        return oyuncular[b].puan - oyuncular[a].puan;
    });

    let takimA = [];
    let takimB = [];
    let toplamA = 0;
    let toplamB = 0;

    gelenler.forEach((oyuncu, index) => {
        let secilenTakim;
        let turSira = index % 4;
        if (turSira === 0 || turSira === 3) {
            if (toplamA <= toplamB) secilenTakim = 'A'; else secilenTakim = 'B';
        } else {
            if (toplamB <= toplamA) secilenTakim = 'B'; else secilenTakim = 'A';
        }

        const puan = oyuncular[oyuncu].puan;
        if (secilenTakim === 'A') {
            takimA.push({ isim: oyuncu, pozisyon: oyuncular[oyuncu].pozisyon, puan: puan });
            toplamA += puan;
        } else {
            takimB.push({ isim: oyuncu, pozisyon: oyuncular[oyuncu].pozisyon, puan: puan });
            toplamB += puan;
        }
    });

    globalVeri.takimA = takimA;
    globalVeri.takimB = takimB;
    globalVeri.toplamA = toplamA;
    globalVeri.toplamB = toplamB;
    veriyiKaydet();

    takimlariEkranaBas(takimA, takimB, toplamA, toplamB);
}

function takimlariEkranaBas(takimA, takimB, toplamA, toplamB) {
    const kuraSonuclariDiv = document.getElementById('kura-sonuclari');
    if (!kuraSonuclariDiv) return;

    kuraSonuclariDiv.classList.remove('hidden');

    const listeA = document.getElementById('liste-takim-a');
    const listeB = document.getElementById('liste-takim-b');

    if (!listeA || !listeB) return;

    listeA.innerHTML = '';
    listeB.innerHTML = '';

    takimA.forEach(o => {
        listeA.innerHTML += `<li class="flex justify-between items-center bg-slate-900/60 p-2.5 rounded-lg border border-slate-700/40">
            <span class="font-medium text-white">${o.isim} <span class="text-xs text-slate-400">(${o.pozisyon})</span></span>
            <span class="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded font-bold">${o.puan} Puan</span>
        </li>`;
    });

    takimB.forEach(o => {
        listeB.innerHTML += `<li class="flex justify-between items-center bg-slate-900/60 p-2.5 rounded-lg border border-slate-700/40">
            <span class="font-medium text-white">${o.isim} <span class="text-xs text-slate-400">(${o.pozisyon})</span></span>
            <span class="text-xs bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded font-bold">${o.puan} Puan</span>
        </li>`;
    });

    const ortA = document.getElementById('takim-a-ortalama');
    const ortB = document.getElementById('takim-b-ortalama');
    if (ortA) ortA.innerText = `Ort: ${(toplamA / (takimA.length || 1)).toFixed(1)}`;
    if (ortB) ortB.innerText = `Ort: ${(toplamB / (takimB.length || 1)).toFixed(1)}`;
}
