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

## 🚀 Getting Started

The application is pre-configured and fully packaged! 

### Download the Standalone Installer
To install the app on any Windows machine:
1. Navigate to the latest release in your GitHub repository.
2. Download **`Billio Setup.exe`**.
3. Run the installer, select your preferred install directory, and start generating invoices immediately!

---

## 🔄 Releasing New Updates

The app is equipped with **Automatic Background Updates**. When you make changes to the app and want to deploy a new version for your father:

1. Increment the `"version"` number in `package.json` (e.g., from `"1.0.0"` to `"1.0.1"`).
2. Run the build command:
   ```bash
   npm run build
   ```
3. Publish a new release using:
   ```bash
   npx electron-builder --win -p always
   ```
   *(Ensure you have set your `GH_TOKEN` environment variable).*

Once uploaded, the app will automatically download the new update in the background when launched and apply it next time it starts up!

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
