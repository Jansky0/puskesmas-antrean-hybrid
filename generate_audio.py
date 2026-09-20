import os
import urllib.request
import urllib.parse

AUDIO_DIR = "/home/jansky/Proyek/puskesmas-antrean-hybrid/public/audio"
os.makedirs(AUDIO_DIR, exist_ok=True)

# Words to generate TTS audio files for
AUDIO_MAP = {
    "bell.mp3": None, # Will generate chime via ffmpeg
    "nomor-antrean.mp3": "Nomor antrean",
    "silakan-menuju.mp3": "Silakan menuju",
    # Letters
    "huruf-a.mp3": "A",
    "huruf-b.mp3": "B",
    "huruf-c.mp3": "C",
    "huruf-d.mp3": "D",
    "huruf-e.mp3": "E",
    "huruf-f.mp3": "F",
    "huruf-g.mp3": "G",
    "huruf-h.mp3": "H",
    "huruf-i.mp3": "I",
    "huruf-l.mp3": "L",
    # Numbers
    "angka-0.mp3": "nol",
    "angka-1.mp3": "satu",
    "angka-2.mp3": "dua",
    "angka-3.mp3": "tiga",
    "angka-4.mp3": "empat",
    "angka-5.mp3": "lima",
    "angka-6.mp3": "enam",
    "angka-7.mp3": "tujuh",
    "angka-8.mp3": "delapan",
    "angka-9.mp3": "sembilan",
    "angka-10.mp3": "sepuluh",
    "angka-11.mp3": "sebelas",
    "ratus.mp3": "ratus",
    "seratus.mp3": "seratus",
    "puluh.mp3": "puluh",
    "belas.mp3": "belas",
    # Rooms
    "loket-pendaftaran.mp3": "Loket Pendaftaran",
    "ruang-anak.mp3": "Ruang Anak",
    "ruang-ibu.mp3": "Ruang Ibu",
    "ruang-klaster-3.mp3": "Ruang Klaster Tiga",
    "ruang-tindakan.mp3": "Ruang Tindakan",
    "ruang-kb.mp3": "Ruang K B",
    "ruang-imunisasi.mp3": "Ruang Imunisasi",
    "ruang-gigi.mp3": "Ruang Gigi dan Mulut",
    "ruang-usg.mp3": "Ruang U S G",
    "ruang-farmasi.mp3": "Ruang Farmasi"
}

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
}

for filename, text in AUDIO_MAP.items():
    if text is None:
        continue
    filepath = os.path.join(AUDIO_DIR, filename)
    url = f"https://translate.google.com/translate_tts?ie=UTF-8&q={urllib.parse.quote(text)}&tl=id&client=tw-ob"
    print(f"Generating {filename} for '{text}'...")
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req) as resp, open(filepath, 'wb') as f:
            f.write(resp.read())
    except Exception as e:
        print(f"Error {filename}: {e}")

print("Audio generation complete!")
