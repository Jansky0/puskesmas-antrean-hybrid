const { app, BrowserWindow, screen, ipcMain } = require('electron');
const path = require('path');

let mainWindow;
let tvWindow;

function createWindows() {
  const displays = screen.getAllDisplays();
  
  // Monitor 1 (Utama): Dashboard Kios / Main Menu
  const primaryDisplay = screen.getPrimaryDisplay();
  mainWindow = new BrowserWindow({
    x: primaryDisplay.bounds.x,
    y: primaryDisplay.bounds.y,
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const startUrl = process.env.ELECTRON_START_URL || `https://puskesmas-antrean-hybrid.vercel.app`;
  mainWindow.loadURL(startUrl);

  // Jika ada Monitor 2 (TV Extend), siapkan Window TV Sekunder
  const secondaryDisplay = displays.find((display) => display.id !== primaryDisplay.id);

  ipcMain.on('open-tv-window', () => {
    if (tvWindow) {
      tvWindow.focus();
      return;
    }

    const targetDisplay = secondaryDisplay || primaryDisplay;

    tvWindow = new BrowserWindow({
      x: targetDisplay.bounds.x,
      y: targetDisplay.bounds.y,
      width: targetDisplay.bounds.width,
      height: targetDisplay.bounds.height,
      fullscreen: true,
      simpleFullScreen: true,
      kiosk: true,
      frame: false,
      autoHideMenuBar: true,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    tvWindow.setKiosk(true);
    tvWindow.setFullScreen(true);
    tvWindow.loadURL(`${startUrl}/tv`);

    tvWindow.on('closed', () => {
      tvWindow = null;
    });
  });

  // Handle silent print for Thermal POS Printer with fallback
  ipcMain.on('print-silent', async (event, { ticketNumber, roomName }) => {
    let printWin = new BrowserWindow({
      width: 400,
      height: 600,
      show: false,
      webPreferences: { nodeIntegration: false, contextIsolation: true }
    });

    const nowStr = new Date().toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            @page {
              size: 58mm 3276mm;
              margin: 0;
            }
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact;
            }
            html, body {
              margin: 0;
              padding: 0;
              background-color: #ffffff !important;
            }
            body {
              font-family: Arial, Helvetica, sans-serif;
              text-align: center;
              color: #000000 !important;
            }
            .ticket-container {
              width: 44mm;
              margin-left: 6mm;
              padding: 8px 1mm 24px 1mm;
              text-align: center;
            }
            .title {
              font-size: 13px;
              font-weight: 900;
              margin-bottom: 2px;
              text-transform: uppercase;
              line-height: 1.25;
              letter-spacing: 0.5px;
            }
            .subtitle {
              font-size: 11px;
              font-weight: bold;
              margin-bottom: 4px;
            }
            .divider {
              border-top: 2px dashed #000;
              margin: 6px 0;
              width: 100%;
            }
            .room {
              font-size: 14px;
              font-weight: 900;
              margin: 6px 0;
              text-transform: uppercase;
              line-height: 1.25;
            }
            .ticket {
              font-size: 52px;
              font-weight: 900;
              margin: 6px 0;
              line-height: 1;
              letter-spacing: 2px;
            }
            .footer {
              font-size: 11px;
              margin-top: 6px;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="ticket-container">
            <div class="title">PUSKESMAS PRAMBONTERGAYANG</div>
            <div class="subtitle">Sistem Antrean Pelayanan</div>
            <div class="divider"></div>
            <div class="room">${roomName}</div>
            <div class="ticket">${ticketNumber}</div>
            <div class="divider"></div>
            <div class="subtitle">${nowStr}</div>
            <div class="footer">Harap Menunggu Dipanggil</div>
            <div style="height: 25px;"></div>
          </div>
        </body>
      </html>
    `;

    printWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);

    printWin.webContents.on('did-finish-load', async () => {
      try {
        const printers = await printWin.webContents.getPrintersAsync();
        const targetPrinter = printers.find(p => 
          p.name.toLowerCase().includes("58") || 
          p.name.toLowerCase().includes("pos") || 
          p.name.toLowerCase().includes("thermal") ||
          p.name.toLowerCase().includes("receipt") ||
          p.name.toLowerCase().includes("printer")
        ) || printers.find(p => p.isDefault) || printers[0];

        const printOptions = {
          silent: true,
          printBackground: true,
          margins: { marginType: 'none' },
          pageSize: { width: 58000, height: 3276000 }
        };

        if (targetPrinter && targetPrinter.name) {
          printOptions.deviceName = targetPrinter.name;
        }

        setTimeout(() => {
          printWin.webContents.print(printOptions, (success, errorType) => {
            if (!success) {
              console.error("Silent print failed:", errorType, "- fallback to print dialog");
              printWin.show();
              printWin.webContents.print({ silent: false, printBackground: true }, () => {
                printWin.close();
              });
            } else {
              printWin.close();
            }
          });
        }, 500);
      } catch (err) {
        console.error("Print error:", err);
        printWin.close();
      }
    });
  });
}

app.whenReady().then(createWindows);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
