# 🧾 Billio - Professional Invoicing Desktop App

![Billio Banner](https://images.unsplash.com/photo-1626085521404-5853b0183188?q=80&w=1200&h=400&auto=format&fit=crop)

**Billio** is an offline-first, lightning-fast multi-business invoice generator tailored specifically for Indian publication and book distribution businesses. 

Designed for speed and aesthetic excellence, Billio allows you to seamlessly manage multiple business profiles, auto-generate incremental invoice numbers, and instantly export beautiful, customizable A4 PDFs—completely offline.

---

## ✨ Features

- **🏢 Multi-Business Support**: Switch effortlessly between different businesses (e.g., ABC Publications, XYZ Books) with independent settings, logos, and bank details.
- **⚡ Lightning Fast & Offline**: Your data is stored locally. No internet connection required to generate invoices.
- **🎨 6 Premium Themes**: Choose from beautifully handcrafted templates like *Minimal Modern*, *Premium Corporate*, and *Publication Focus*.
- **🎛️ Live A4 Customizer**: Toggle watermarks, change accent colors, adjust line spacing, and switch border styles in real-time.
- **📦 Smart Auto-Complete**: Start typing a customer's name and Billio will instantly pull their GSTIN, Phone, Address, and Email from history.
- **🧮 Auto-Calculations**: Automatic tallying of Line Totals, Percent/Flat Discounts, Round-Offs, and automated English word translations (e.g., "Five Thousand Rupees Only").
- **📑 Smart Pagination**: Massive item lists automatically span across multiple pages without ever awkwardly slicing a row in half.
- **📱 WhatsApp Integration**: One-click sharing to easily send PDF receipts to your clients via WhatsApp Web.

---

## 🚀 How to Bundle for Desktop (For Your Father)

To convert this project into a standalone `.exe` installer software with **Automatic Background Updates**, you will use **Electron**. 

When you release a new version on GitHub, the app will automatically download it in the background and notify your father to update!

### 1. Install Bundling Dependencies
Run this command in your terminal:
```bash
npm install -D electron electron-builder electron-is-dev concurrently wait-on
npm install electron-updater
```

### 2. Add Electron Main Process (`electron/main.js`)
Create a folder named `electron` and a file named `main.js` inside it, and add this code:
```javascript
import { app, BrowserWindow } from 'electron';
import path from 'path';
import { autoUpdater } from 'electron-updater';
import isDev from 'electron-is-dev';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    title: "Billio",
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true
    }
  });

  if (isDev) {
    win.loadURL('http://localhost:5173');
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();
  
  // Trigger Auto Updater
  if (!isDev) {
    autoUpdater.checkForUpdatesAndNotify();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
```

### 3. Update your `package.json`
Add the following to your `package.json`:
```json
"main": "electron/main.js",
"build": {
  "appId": "com.billio.app",
  "productName": "Billio",
  "directories": { "output": "release" },
  "publish": [{
    "provider": "github",
    "owner": "YOUR_GITHUB_USERNAME",
    "repo": "YOUR_REPO_NAME"
  }]
}
```
*Note: Replace `YOUR_GITHUB_USERNAME` and `YOUR_REPO_NAME` with your actual GitHub details.*

### 4. Build the App!
Run your React build, and then run electron-builder to generate the `.exe`:
```bash
npm run build
npx electron-builder --win
```
🎉 You will find a **`Billio Setup.exe`** file inside the `release` folder! Give this `.exe` file to your father to install.

---

## 🔄 How GitHub Auto-Updates Work

1. Whenever you make changes (like fixing a bug or adding a feature), increment the `"version"` number in your `package.json` (e.g., from `"1.0.0"` to `"1.0.1"`).
2. Run `npm run build` followed by `npx electron-builder --win -p always`.
3. This will automatically compile the new version and upload it to your GitHub Repository as a **Release**.
4. The next time your father opens the Billio app on his computer, the `electron-updater` package will detect the new release on GitHub, download it quietly in the background, and ask him to restart to apply the update!

---

## 🛠️ Tech Stack
- **Frontend Framework:** React 19 + Vite
- **Styling:** Tailwind CSS V4
- **State Management:** Zustand (Persisted locally)
- **Icons:** Lucide React
- **PDF Engine:** html2pdf.js + native browser printing
- **Desktop Bundler:** Electron + Electron-Builder
