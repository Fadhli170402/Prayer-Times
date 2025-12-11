const PRAYER_ICONS = {
    Fajr: '🌅',
    Dhuhr: '☀️',
    Asr: '🌤️',
    Maghrib: '🌇',
    Isha: '🌙'
};

// Nama sholat dalam Arab (untuk ditampilkan di bawah nama Indonesia)
const PRAYER_ARABIC = {
    Fajr: 'الفجر',
    Dhuhr: 'الظهر',
    Asr: 'العصر',
    Maghrib: 'المغرب',
    Isha: 'العشاء'
};

// Urutan sholat
const PRAYER_ORDER = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

let currentLocation = 'Lokasi tidak diketahui';
let prayerTimings = {};
let nextPrayerName = '';

// Fungsi untuk reverse geocoding menggunakan OpenStreetMap Nominatim
async function getPlaceName(lat, lon) {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=id`
        );
        const data = await response.json();
        if (data && data.address) {
            const { city, town, village, state, country } = data.address;
            const locality = city || town || village || 'Lokasi tidak dikenal';
            return `${locality}, ${state || country || ''}`.trim().replace(/,$/, '');
        }
        return `Lat: ${lat.toFixed(4)}, Lon: ${lon.toFixed(4)}`;
    } catch (error) {
        console.warn('Gagal mendapatkan nama lokasi:', error);
        return `Lat: ${lat.toFixed(4)}, Lon: ${lon.toFixed(4)}`;
    }
}

function formatTime(timeStr) {
    return timeStr.slice(0, 5); // Hanya jam:menit
}

function getHijriDate() {
    // Untuk demo, kita gunakan tanggal statis. Bisa diganti dengan API hijriyah.
    return '15 Jumadil Akhir 1446 H';
}

function getCurrentPrayerAndNext(timings) {
    const now = new Date();
    const minutesNow = now.getHours() * 60 + now.getMinutes();

    const prayerMinutes = {};
    for (const name of PRAYER_ORDER) {
        const timeStr = timings[name];
        const [hour, minute] = timeStr.split(':').map(Number);
        prayerMinutes[name] = hour * 60 + minute;
    }

    let currentPrayer = null;
    let nextPrayer = null;

    for (let i = PRAYER_ORDER.length - 1; i >= 0; i--) {
        if (minutesNow >= prayerMinutes[PRAYER_ORDER[i]]) {
            currentPrayer = PRAYER_ORDER[i];
            break;
        }
    }

    for (const name of PRAYER_ORDER) {
        if (minutesNow < prayerMinutes[name]) {
            nextPrayer = name;
            break;
        }
    }

    if (!nextPrayer) nextPrayer = 'Fajr';

    return { current: currentPrayer, next: nextPrayer };
}

function calculateCountdown(nextPrayer) {
    const now = new Date();
    const nextTimeStr = prayerTimings[nextPrayer];
    const [hour, minute] = nextTimeStr.split(':').map(Number);
    
    const nextDate = new Date(now);
    nextDate.setHours(hour, minute, 0, 0);

    if (nextDate <= now) {
        nextDate.setDate(nextDate.getDate() + 1);
    }

    const diffMs = nextDate - now;
    const diffSec = Math.floor(diffMs / 1000);
    const hours = Math.floor(diffSec / 3600);
    const mins = Math.floor((diffSec % 3600) / 60);

    return `${hours} jam ${mins} menit`;
}

function updateClock() {
    const clockElement = document.getElementById('clock');
    if (!clockElement) return;

    const now = new Date();
    const timeString = now.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });

    const parts = timeString.split(':');
    clockElement.innerHTML = `
        <span>${parts[0]}</span>
        <span class="separator">:</span>
        <span>${parts[1]}</span>
        <span class="separator">:</span>
        <span>${parts[2]}</span>
    `;
}

function renderPrayerCards() {
    const container = document.getElementById('prayer-list');
    container.innerHTML = '';

    const { current, next } = getCurrentPrayerAndNext(prayerTimings);
    nextPrayerName = next;

    PRAYER_ORDER.forEach(prayer => {
        const card = document.createElement('div');
        card.className = 'prayer-card';
        if (prayer === current) card.classList.add('current-prayer');
        else if (prayer === next) card.classList.add('next-prayer');

        const iconSpan = document.createElement('span');
        iconSpan.className = 'icon';
        iconSpan.textContent = PRAYER_ICONS[prayer];

        const nameDiv = document.createElement('div');
        nameDiv.className = 'name';
        nameDiv.innerHTML = `
            <div>${prayer}</div>
            <div class="arabic">${PRAYER_ARABIC[prayer]}</div>
        `;

        const timeSpan = document.createElement('span');
        timeSpan.className = 'time';
        timeSpan.textContent = formatTime(prayerTimings[prayer]);

        card.appendChild(iconSpan);
        card.appendChild(nameDiv);
        card.appendChild(timeSpan);
        container.appendChild(card);
    });
}

function renderCountdown() {
    const countdownEl = document.getElementById('countdown-text');
    if (!countdownEl || !nextPrayerName) return;

    const countdown = calculateCountdown(nextPrayerName);
    countdownEl.innerHTML = `Menuju <strong>${nextPrayerName}</strong> dalam <strong>${countdown}</strong>`;
}

function prayerTimes(lat, lon, placeName = 'Lokasi tidak diketahui') {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="header-tag">Jadwal Sholat</div>
        <h1 class="title">Waktu Sholat</h1>
        <p class="subtitle">Jangan lewatkan waktu ibadah Anda</p>
        <div class="location-date">
            <div class="location-info">
                <span class="location-icon">📍</span>
                <span id="location-name">Loading...</span>
            </div>
            <div class="date-info">
                <span class="date-icon">📅</span>
                <span id="date-display">Loading...</span>
            </div>
        </div>
        <div class="clock-container">
            <div id="clock">--:--:--</div>
            <div id="countdown-text" class="countdown">Menunggu data...</div>
        </div>
        <div id="prayer-list"></div>
        <button class="refresh-btn" id="refresh-btn">🔄 Perbarui Jadwal</button>
        <div class="footer">
            <div class="bismillah">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>
            <div>Dengan menyebut nama Allah Yang Maha Pengasih lagi Maha Penyayang</div>
        </div>
    `;

    fetch(`https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lon}&method=20`)
        .then(response => response.json())
        .then(data => {
            prayerTimings = data.data.timings;
            currentLocation = placeName; // Simpan nama lokasi

            // Update UI
            document.getElementById('location-name').textContent = currentLocation;
            document.getElementById('date-display').textContent = `${new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} | ${getHijriDate()}`;

            renderPrayerCards();
            renderCountdown();

            // Mulai jam
            updateClock();
            setInterval(updateClock, 1000);
            setInterval(renderCountdown, 30000); // Update countdown setiap 30 detik

            // Event listener tombol refresh
            document.getElementById('refresh-btn').addEventListener('click', () => {
                prayerTimes(lat, lon, placeName);
            });
        })
        .catch(err => {
            console.error('Error fetching prayer times:', err);
            app.innerHTML = `<div class="loading">Gagal memuat jadwal sholat. Silakan coba lagi.</div>`;
        });
}

async function success(position) {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;
    const placeName = await getPlaceName(lat, lon);
    prayerTimes(lat, lon, placeName);
}

function error() {
    // Default ke Jakarta jika geolocation gagal
    const lat = -6.21462; // Jakarta
    const lon = 106.84513;
    
    getPlaceName(lat, lon).then(placeName => {
        prayerTimes(lat, lon, placeName);
    });
}

function userLocation() {
    if (!navigator.geolocation) {
        alert('Geolocation tidak didukung oleh browser ini.');
        error();
    } else {
        navigator.geolocation.getCurrentPosition(success, error);
    }
}

// Jalankan saat DOM siap
document.addEventListener('DOMContentLoaded', () => {
    userLocation();
});