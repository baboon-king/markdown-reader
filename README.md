# 📖 Markdown Reader

A simple and lightweight Progressive Web App (PWA) for reading Markdown files on desktop and mobile. Just open your files and start reading, even offline!

## ✨ Features

- **📱 Mobile & Desktop Support** - Responsive design that works seamlessly on all devices
- **🔌 Offline Capability** - Works without an internet connection thanks to service workers
- **💾 Remembers Files** - Keeps track of recently opened files using localStorage
- **📝 Rich Markdown Support** - Displays formatted markdown with proper styling for headers, lists, code blocks, tables, and more
- **🎨 Clean Interface** - Simple, distraction-free reading experience
- **⚡ Lightweight** - No build process, minimal dependencies, fast loading

## 🚀 Usage

### Online

Visit the hosted version (when deployed) or serve it locally:

```bash
# Clone the repository
git clone https://github.com/baboon-king/markdown-reader.git
cd markdown-reader

# Serve with any static HTTP server, e.g.:
python3 -m http.server 8888
# or
npx http-server
```

Then open http://localhost:8888 in your browser.

### Install as PWA

1. Open the app in a modern browser (Chrome, Edge, Safari, Firefox)
2. Look for the "Install" button in your browser's address bar
3. Click install to add it to your home screen or desktop
4. Launch it like a native app!

### Opening Files

1. Click the "📁 Open File" button
2. Select a `.md` or `.markdown` file from your device
3. Read the beautifully formatted content
4. Click "✕ Close" to return to the home screen

### Recent Files

- Recently opened files are listed for quick reference
- Click "🗑️ Clear History" to remove all recent files
- Individual files can be removed using the "Remove" button

## 🔧 Technical Details

### Stack
- Pure HTML, CSS, and JavaScript (no frameworks)
- Service Worker for offline functionality
- Web App Manifest for PWA features
- LocalStorage for persistence
- Marked.js library for markdown parsing (with fallback parser)

### Files Structure
```
├── index.html          # Main HTML structure
├── styles.css          # Responsive CSS styling
├── app.js              # Application logic
├── sw.js               # Service worker for offline support
├── manifest.json       # PWA manifest
├── icon-192.png        # PWA icon (192x192)
└── icon-512.png        # PWA icon (512x512)
```

## 🔒 Security

- **Marked.js v9+** includes built-in XSS protection
- **Fallback parser** escapes all HTML entities before processing
- **Read-only mode** - No file writing or modification capabilities
- **Local-only** - Files are read from your device and never uploaded anywhere
- **Client-side** - All processing happens in your browser, no server involved

## 🌐 Browser Support

Works on all modern browsers that support:
- File API
- Service Workers
- LocalStorage
- ES6+ JavaScript

Tested on: Chrome, Edge, Firefox, Safari (desktop and mobile)

## 📄 License

See the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.
