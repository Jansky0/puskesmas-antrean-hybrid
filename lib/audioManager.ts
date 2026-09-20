interface SpeechPayload {
  ticketNumber: string;
  roomName: string;
}

class VoiceAnnouncementManager {
  private queue: SpeechPayload[] = [];
  private isSpeaking: boolean = false;

  private playSingleAudio(url: string): Promise<void> {
    return new Promise((resolve) => {
      const audio = new Audio(url);
      audio.onended = () => resolve();
      audio.onerror = () => resolve(); // jika file tidak ada, skip dengan lancar
      audio.play().catch(() => resolve());
    });
  }

  private getAudioSequence(ticketNumber: string, roomName: string): string[] {
    const sequence: string[] = ["/audio/bell.mp3", "/audio/nomor-antrean.mp3"];

    // 1. Parsing Kode Huruf (misal: "A", "B", "L")
    const letterMatch = ticketNumber.match(/^[A-Za-z]+/);
    if (letterMatch) {
      const letter = letterMatch[0].toLowerCase();
      sequence.push(`/audio/huruf-${letter}.mp3`);
    }

    // 2. Parsing Angka (misal: 001 -> "0", "0", "1" atau angka terbilang)
    const numberMatch = ticketNumber.match(/\d+/);
    if (numberMatch) {
      const numStr = numberMatch[0];
      // Jika formatnya berawalan 0 (misal: "001"), eja per digit
      if (numStr.startsWith("0")) {
        for (const char of numStr) {
          sequence.push(`/audio/angka-${char}.mp3`);
        }
      } else {
        const num = parseInt(numStr, 10);
        if (num < 10) {
          sequence.push(`/audio/angka-${num}.mp3`);
        } else if (num === 10) {
          sequence.push("/audio/angka-10.mp3");
        } else if (num === 11) {
          sequence.push("/audio/angka-11.mp3");
        } else if (num < 20) {
          sequence.push(`/audio/angka-${num % 10}.mp3`);
          sequence.push("/audio/belas.mp3");
        } else if (num < 100) {
          const puluhan = Math.floor(num / 10);
          const satuan = num % 10;
          sequence.push(`/audio/angka-${puluhan}.mp3`);
          sequence.push("/audio/puluh.mp3");
          if (satuan > 0) sequence.push(`/audio/angka-${satuan}.mp3`);
        } else if (num === 100) {
          sequence.push("/audio/seratus.mp3");
        } else if (num < 1000) {
          const ratusan = Math.floor(num / 100);
          const sisa = num % 100;
          if (ratusan === 1) {
            sequence.push("/audio/seratus.mp3");
          } else {
            sequence.push(`/audio/angka-${ratusan}.mp3`);
            sequence.push("/audio/ratus.mp3");
          }
          if (sisa > 0) {
            if (sisa < 10) {
              sequence.push(`/audio/angka-${sisa}.mp3`);
            } else if (sisa === 10) {
              sequence.push("/audio/angka-10.mp3");
            } else if (sisa === 11) {
              sequence.push("/audio/angka-11.mp3");
            } else if (sisa < 20) {
              sequence.push(`/audio/angka-${sisa % 10}.mp3`);
              sequence.push("/audio/belas.mp3");
            } else {
              const puluhan = Math.floor(sisa / 10);
              const satuan = sisa % 10;
              sequence.push(`/audio/angka-${puluhan}.mp3`);
              sequence.push("/audio/puluh.mp3");
              if (satuan > 0) sequence.push(`/audio/angka-${satuan}.mp3`);
            }
          }
        }
      }
    }

    sequence.push("/audio/silakan-menuju.mp3");

    // 3. Mapping Ruangan
    const roomLower = roomName.toLowerCase();
    if (roomLower.includes("loket")) {
      sequence.push("/audio/loket-pendaftaran.mp3");
    } else if (roomLower.includes("anak")) {
      sequence.push("/audio/ruang-anak.mp3");
    } else if (roomLower.includes("ibu")) {
      sequence.push("/audio/ruang-ibu.mp3");
    } else if (roomLower.includes("klaster")) {
      sequence.push("/audio/ruang-klaster-3.mp3");
    } else if (roomLower.includes("tindakan")) {
      sequence.push("/audio/ruang-tindakan.mp3");
    } else if (roomLower.includes("kb")) {
      sequence.push("/audio/ruang-kb.mp3");
    } else if (roomLower.includes("imunisasi")) {
      sequence.push("/audio/ruang-imunisasi.mp3");
    } else if (roomLower.includes("gigi")) {
      sequence.push("/audio/ruang-gigi.mp3");
    } else if (roomLower.includes("usg")) {
      sequence.push("/audio/ruang-usg.mp3");
    } else if (roomLower.includes("farmasi")) {
      sequence.push("/audio/ruang-farmasi.mp3");
    }

    return sequence;
  }

  public speak(ticketNumber: string, roomName: string) {
    if (!ticketNumber || !roomName) return;
    this.queue.push({ ticketNumber, roomName });
    if (!this.isSpeaking) {
      this.processQueue();
    }
  }

  private async processQueue() {
    if (this.queue.length === 0) {
      this.isSpeaking = false;
      return;
    }

    this.isSpeaking = true;
    const currentItem = this.queue.shift();
    if (!currentItem) return;

    const audioSequence = this.getAudioSequence(currentItem.ticketNumber, currentItem.roomName);

    for (const audioUrl of audioSequence) {
      await this.playSingleAudio(audioUrl);
    }

    setTimeout(() => this.processQueue(), 500);
  }
}

export const voiceManager = new VoiceAnnouncementManager();

export function printThermalTicket(ticketNumber: string, roomName: string) {
  if (typeof window === "undefined") return;

  // Jika berjalan di Desktop Application (Electron), gunakan silent print native
  if ((window as any).electronAPI && (window as any).electronAPI.printSilent) {
    (window as any).electronAPI.printSilent(ticketNumber, roomName);
    return;
  }

  const printWin = window.open("", "_blank", "width=300,height=400");
  if (!printWin) return;

  const nowStr = new Date().toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  printWin.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Cetak Tiket ${ticketNumber}</title>
        <meta charset="utf-8">
        <style>
          @page {
            size: 58mm 3276mm;
            margin: 0;
          }
          * { box-sizing: border-box; -webkit-print-color-adjust: exact; }
          body {
            font-family: Arial, Helvetica, sans-serif;
            text-align: left;
            width: 58mm;
            margin: 0;
            padding: 8px 6px 30px 6px;
            color: #000000 !important;
            background: #ffffff !important;
          }
          .title { font-size: 16px; font-weight: 900; margin-bottom: 4px; text-transform: uppercase; line-height: 1.2; text-align: left; }
          .subtitle { font-size: 12px; font-weight: bold; margin-bottom: 6px; text-align: left; }
          .divider { border-top: 2px dashed #000; margin: 8px 0; width: 100%; }
          .room { font-size: 16px; font-weight: 900; margin: 8px 0; text-transform: uppercase; text-align: left; }
          .ticket { font-size: 56px; font-weight: 900; margin: 8px 0; line-height: 1; letter-spacing: 2px; text-align: left; }
          .footer { font-size: 12px; margin-top: 8px; font-weight: bold; text-align: left; }
        </style>
      </head>
      <body>
        <div class="title">PUSKESMAS PRAMBONTERGAYANG</div>
        <div class="subtitle">Sistem Antrean Pelayanan</div>
        <div class="divider"></div>
        <div class="room">${roomName}</div>
        <div class="ticket">${ticketNumber}</div>
        <div class="divider"></div>
        <div class="subtitle">${nowStr}</div>
        <div class="footer">Harap Menunggu Nomor Dipanggil</div>
        <div style="height: 15px;"></div>
        <script>
          window.onload = function() {
            window.focus();
            setTimeout(function() {
              window.print();
              setTimeout(function() { window.close(); }, 800);
            }, 300);
          };
        </script>
      </body>
    </html>
  `);

  printWin.document.close();
}
