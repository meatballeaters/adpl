// --- STATE GLOBAL (Simulasi Database/Sesi) ---
// State ini disimpan di window untuk berbagi antar halaman HTML.
// Dalam aplikasi nyata, data ini akan disimpan di Firestore atau state management.

window.gameState = {
    // State Pemain
    player: {
        username: 'UserDemo',
        id: 'U-000',
        score: 0, // Skor kumulatif
    },

    // State Game Aktif
    puzzle: [],       // Array urutan potongan puzzle (0 = kosong)
    size: 3,          // Ukuran grid (3x3, 4x4, atau 5x5)
    emptyIndex: 8,    // Index array dari potongan kosong (default 3x3)
    moves: 0,         // Jumlah langkah
    timer: 0,         // Durasi dalam detik
    intervalId: null, // ID untuk clearInterval
    latestScore: 0,   // Skor yang diperoleh pada game terakhir

    // Data Papan Skor Simulasi
    leaderboard: [
        { name: 'Pemain0001', score: 2500, id: 'P-0001' },
        { name: 'Pemain0000', score: 1800, id: 'P-0000' },
    ],

    // URL Gambar Puzzle (Placeholder)
    PUZZLE_IMAGE_URL: 'https://placehold.co/400x400/3b82f6/ffffff?text=P+U+Z+Z+L+E'
};

// --- Fungsi Timer ---

/** Memulai timer permainan. */
function startTimer() {
    const state = window.gameState;
    if (state.intervalId) return;

    const durationElement = document.getElementById('game-duration');
    if (durationElement) {
        state.intervalId = setInterval(() => {
            state.timer++;
            durationElement.textContent = formatTime(state.timer);
        }, 1000);
    }
}

/** Menghentikan timer permainan. */
function stopTimer() {
    const state = window.gameState;
    if (state.intervalId) {
        clearInterval(state.intervalId);
        state.intervalId = null;
    }
}

/** Format waktu dari detik menjadi MM:SS. */
function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// --- Fungsi Mekanisme Puzzle ---

/** Menghitung inversi dalam array (untuk pengecekan solvability). */
function countInversions(arr, size) {
    let inversions = 0;
    const flat = arr.filter(n => n !== 0); // Abaikan potongan kosong
    for (let i = 0; i < flat.length - 1; i++) {
        for (let j = i + 1; j < flat.length; j++) {
            if (flat[i] > flat[j]) {
                inversions++;
            }
        }
    }
    return inversions;
}

/** Menghitung baris potongan kosong (dari bawah, 1-indexed). */
function getEmptyRowFromBottom(index, size) {
    // Baris dihitung dari 0 (paling atas)
    const row = Math.floor(index / size);
    // Baris dari bawah adalah size - row
    return size - row;
}

/** Menginisialisasi dan mengacak puzzle hingga dapat dipecahkan (solvable). */
function initializePuzzle(size) {
    const state = window.gameState;
    state.size = size;
    state.timer = 0;
    state.moves = 0;
    state.latestScore = 0;
    stopTimer();

    const numPieces = size * size;
    let newPuzzle;
    let isSolvable = false;

    // Lakukan pengacakan hingga konfigurasi dapat dipecahkan
    while (!isSolvable) {
        // Buat array dari 1 hingga N-1, dan 0
        newPuzzle = Array.from({ length: numPieces }, (_, i) => i + 1);
        newPuzzle[numPieces - 1] = 0; 
        
        // Acak array (kecuali potongan kosong, lalu pindahkan 0 ke posisi acak)
        for (let i = numPieces - 2; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newPuzzle[i], newPuzzle[j]] = [newPuzzle[j], newPuzzle[i]];
        }
        
        // Tentukan posisi potongan kosong
        const emptyIndex = newPuzzle.indexOf(0);
        
        const inversions = countInversions(newPuzzle, size);
        const emptyRowFromBottom = getEmptyRowFromBottom(emptyIndex, size);

        // Aturan Solvability 15 Puzzle (berlaku untuk N x N)
        if (size % 2 !== 0) { // Grid Ganjil (3x3, 5x5)
            // Solvable jika jumlah inversi genap
            isSolvable = (inversions % 2 === 0);
        } else { // Grid Genap (4x4)
            // Solvable jika:
            // 1. Potongan kosong di baris genap dari bawah, dan inversi ganjil.
            // 2. Potongan kosong di baris ganjil dari bawah, dan inversi genap.
            const emptyRowEven = emptyRowFromBottom % 2 === 0;
            const inversionsEven = inversions % 2 === 0;
            
            if (emptyRowEven) { // Baris genap dari bawah (4, 2)
                isSolvable = !inversionsEven; // Inversi harus ganjil
            } else { // Baris ganjil dari bawah (3, 1)
                isSolvable = inversionsEven; // Inversi harus genap
            }
        }
    }
    
    state.puzzle = newPuzzle;
    state.emptyIndex = newPuzzle.indexOf(0);
}

/** Merender potongan puzzle ke DOM. */
function renderPuzzleBoard() {
    const state = window.gameState;
    const board = document.getElementById('puzzle-board');
    if (!board) return;

    board.style.gridTemplateColumns = `repeat(${state.size}, 1fr)`;
    const movesElement = document.getElementById('game-moves');
    if (movesElement) {
        movesElement.textContent = String(state.moves).padStart(2, '0');
    }

    board.innerHTML = state.puzzle.map((value, index) => {
        const isBlank = value === 0;
        const size = state.size;

        let style = '';
        let content = `<span class="text-white text-lg drop-shadow-lg">${isBlank ? '' : value}</span>`;

        if (!isBlank) {
            // Hitung posisi background untuk mendapatkan potongan gambar yang tepat
            // Potongan dengan nilai 'value' (misal 5) harus menampilkan bagian gambar dari posisi 4 (indeks 0-based)
            const tileIndex = value - 1; 
            const originalRow = Math.floor(tileIndex / size);
            const originalCol = tileIndex % size;
            
            // Perhitungan posisi background yang benar agar gambar utuh terbagi
            const originalBgX = (originalCol / (size - 1)) * 100;
            const originalBgY = (originalRow / (size - 1)) * 100;

            style = `background-image: url('${state.PUZZLE_IMAGE_URL}'); background-position: ${originalBgX.toFixed(2)}% ${originalBgY.toFixed(2)}%; background-size: ${size * 100}%;`;
        }

        return `
            <div class="puzzle-piece ${isBlank ? 'empty-piece' : ''}"
                data-index="${index}"
                data-value="${value}"
                onclick="window.movePiece(${index})"
                style="${style}"
            >
                ${content}
            </div>
        `;
    }).join('');

    const durationElement = document.getElementById('game-duration');
    if (durationElement) {
        durationElement.textContent = formatTime(state.timer);
    }
}

/** Fungsi untuk memindahkan potongan puzzle. Dipanggil dari onclick di HTML. */
window.movePiece = function(clickedIndex) {
    const state = window.gameState;
    const n = state.size;
    const clickedValue = state.puzzle[clickedIndex];

    // Jangan lakukan apa-apa jika yang diklik adalah potongan kosong
    if (clickedValue === 0) return;

    const clickedRow = Math.floor(clickedIndex / n);
    const clickedCol = clickedIndex % n;
    const emptyRow = Math.floor(state.emptyIndex / n);
    const emptyCol = state.emptyIndex % n;

    // Cek apakah potongan yang diklik bersebelahan dengan potongan kosong
    const isAdjacent = (Math.abs(clickedRow - emptyRow) + Math.abs(clickedCol - emptyCol) === 1);

    if (isAdjacent) {
        // Tukar potongan di array
        [state.puzzle[clickedIndex], state.puzzle[state.emptyIndex]] = [state.puzzle[state.emptyIndex], state.puzzle[clickedIndex]];

        // Perbarui posisi potongan kosong
        state.emptyIndex = clickedIndex;

        // Perbarui langkah
        state.moves++;
        
        // Render ulang papan
        renderPuzzleBoard();
        
        // Cek kondisi menang
        if (isSolved()) {
            calculateScore();
            stopTimer();
            // Navigasi ke halaman menang (complete.html)
            window.location.href = 'menang.html';
        }
    }
}

/** Cek apakah puzzle sudah terpecahkan. */
function isSolved() {
    const state = window.gameState;
    const numPieces = state.size * state.size;
    // Kondisi menang: 1, 2, 3, ..., N-1, 0
    for (let i = 0; i < numPieces - 1; i++) {
        // Potongan di index i harus memiliki nilai i + 1
        if (state.puzzle[i] !== i + 1) {
            return false;
        }
    }
    // Potongan terakhir harus bernilai 0 (kosong)
    return state.puzzle[numPieces - 1] === 0;
}

/** Menghitung skor dan memperbarui skor pemain. */
function calculateScore() {
    const state = window.gameState;
    // Logika skor: 1000 * Size - (Durasi dalam detik / 3) - (Langkah * 5)
    const baseScore = 1000 * state.size;
    const penaltyTime = Math.floor(state.timer / 3);
    const penaltyMoves = state.moves * 5;
    const finalScore = Math.max(100, baseScore - penaltyTime - penaltyMoves); // Skor minimal 100
    
    state.latestScore = finalScore;
    state.player.score += finalScore;

    // Update leaderboard (simulasi)
    const playerEntry = state.leaderboard.find(p => p.id === state.player.id);
    if (playerEntry) {
        playerEntry.score = state.player.score;
    }
    // Sortir leaderboard (simulasi)
    state.leaderboard.sort((a, b) => b.score - a.score);
}

/** Keluar dari Permainan (dipanggil dari modal konfirmasi) */
window.exitGame = function() {
    const state = window.gameState;
    stopTimer();
    // Reset state game
    state.timer = 0;
    state.moves = 0;
    state.puzzle = [];
    state.size = 3;
    // Navigasi kembali ke index
    window.location.href = 'index.html';
}
/** Fungsi untuk merender modal (pop-up) */
window.openModal = function(id) {
    // Hentikan timer jika modal jeda dibuka
    if (id === 'pause-modal') {
        stopTimer();
    }
    document.getElementById(id).classList.remove('hidden');
    document.getElementById(id).classList.add('flex');
}
window.closeModal = function(id) {
    document.getElementById(id).classList.add('hidden');
    document.getElementById(id).classList.remove('flex');
    // Lanjutkan timer jika modal jeda ditutup
    if (id === 'pause-modal') {
        startTimer(); 
    }
}
// Fungsi untuk memulai game dari pemilihan level
window.selectLevelAndStart = function(size) {
    initializePuzzle(size);
    window.location.href = 'halaman-puzzle.html';
}
// Fungsi untuk menangani login (simulasi)
window.handleLogin = function(event) {
    event.preventDefault();
    // Di sini akan ada logika validasi login
    console.log('Login berhasil disimulasikan');
    window.location.href = 'index.html';
}

// Fungsi untuk menangani registrasi (simulasi)
window.handleRegistration = function(event) {
    event.preventDefault();
    // Di sini akan ada logika registrasi
    console.log('Registrasi berhasil disimulasikan');
    window.location.href = 'login.html';
}