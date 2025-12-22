// Di dalam file puzzle-logic.js
window.handleRegistration = function(event) {
    event.preventDefault(); // Mencegah form dari submit bawaan browser
    // ... tambahkan logika validasi dan registrasi Anda di sini ...
    // Contoh: setelah registrasi berhasil, tampilkan notifikasi
    alert("Registrasi berhasil! Anda akan diarahkan ke halaman login.");
    // Arahkan ke halaman login
    window.location.href = "login.html";
}
window.handleLogin = function(event) {
    event.preventDefault(); // Mencegah form dari submit bawaan browser
    // ... tambahkan logika validasi dan login Anda di sini ...
    // Contoh: setelah login berhasil, arahkan ke halaman dashboard (misalnya 'dashboard.html')
    alert("Login berhasil!");
    window.location.href = "index.html"; // Ganti dengan halaman tujuan Anda
}
