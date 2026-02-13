# Deployment Manual - BSF Lecture Assistant

## Quick Start (5 minutes)

### Prerequisites

1. **Node.js** 18+ installed
2. **API Key**: Get an Anthropic API key from https://console.anthropic.com

### Setup Steps

```bash
# 1. Clone the repository
git clone https://github.com/adhigaduh/bsf-lecture-assistant.git
cd bsf-lecture-assistant

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env.local

# 4. Add your API key
# Edit .env.local and set:
ANTHROPIC_API_KEY=sk-ant-your-api-key-here

# 5. Start development server
npm run dev
```

### Access on Local Network

The app will be available at:
- **This computer**: http://localhost:3000
- **Other devices**: http://YOUR_IP_ADDRESS:3000

Find your IP address:
```bash
# macOS
ipconfig getifaddr en0

# Linux
hostname -I | awk '{print $1}'

# Windows
ipconfig | findstr /i "IPv4"
```

---

## Production Build (Recommended for Network Use)

For better performance on local network:

```bash
# 1. Build the application
npm run build

# 2. Start production server
npm start
```

The app will now run on http://localhost:3000

---

## Network Configuration

### Allowing External Access

By default, Next.js binds to `localhost`. To allow network access:

```bash
# Option 1: Set hostname
npm run dev -- -H 0.0.0.0

# Option 2: Set in package.json
# Add to scripts: "dev": "next dev -H 0.0.0.0"
```

### Firewall Settings

If other devices can't connect:

**macOS:**
```bash
# Allow Node.js through firewall
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /usr/local/bin/node
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --unblockapp /usr/local/bin/node
```

**Ubuntu/Linux:**
```bash
sudo ufw allow 3000/tcp
```

---

## Troubleshooting

### "Port 3000 already in use"
```bash
# Find and kill the process
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm run dev
```

### API Errors / "Generation failed"
1. Check your API key is correct in `.env.local`
2. Ensure you have API credits available
3. Check console for detailed errors

### Can't access from other device
1. Verify IP address is correct
2. Check firewall settings
3. Ensure both devices are on same network

---

## File Structure for Reference

```
bsf-lecture-assistant/
├── .env.local          # API keys (create from .env.example)
├── package.json
├── next.config.ts
├── app/                # Next.js pages & API routes
├── components/         # React components
├── lib/               # Business logic (AI, stores, exports)
├── types/             # TypeScript definitions
├── pdfs/              # Test PDF files
├── lectures/          # Saved lecture output
└── TECHNICAL_DOCS.md  # Developer documentation
```

---

## Common Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm start` | Run production build |
| `npm run lint` | Run linter |

---

## Support

For issues, check:
1. Console logs in browser (F12)
2. Terminal output for server errors
3. GitHub Issues: https://github.com/adhigaduh/bsf-lecture-assistant/issues
