const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const pino = require('pino');
const QRCode = require('qrcode');
const http = require('http');
const path = require('path');
const fs = require('fs');

const PORT = process.env.WHATSAPP_PORT || 3001;
const AUTH_DIR = path.join(process.cwd(), 'whatsapp_auth');

if (!fs.existsSync(AUTH_DIR)) {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
}

let socket = null;
let isConnected = false;
let currentQR = null;
let userPhone = null;
let isInitializing = false;

async function startWhatsAppEngine(force = false) {
  if (isInitializing) return;
  if (socket && isConnected && !force) return;

  isInitializing = true;
  console.log('🚀 [WhatsApp Engine] Starting Baileys Multi-Device connection...');

  try {
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
    const { version } = await fetchLatestBaileysVersion().catch(() => ({ version: [2, 3000, 1015901307] }));

    socket = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: false,
      logger: pino({ level: 'silent' }),
      browser: ['Hotel JB POS', 'Chrome', '120.0.0.0'],
      syncFullHistory: false,
    });

    socket.ev.on('creds.update', saveCreds);

    socket.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        try {
          currentQR = await QRCode.toDataURL(qr, {
            margin: 2,
            width: 280,
            color: { dark: '#0f172a', light: '#ffffff' }
          });
          isConnected = false;
          userPhone = null;
          console.log('📲 [WhatsApp Engine] New Pairing QR Code generated successfully!');
        } catch (e) {
          console.error('Error creating QR data URL:', e);
        }
      }

      if (connection === 'close') {
        isConnected = false;
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
        console.log(`⚠️ [WhatsApp Engine] Connection closed (code ${statusCode}). Reconnecting: ${shouldReconnect}`);

        if (statusCode === DisconnectReason.loggedOut) {
          try {
            fs.rmSync(AUTH_DIR, { recursive: true, force: true });
            fs.mkdirSync(AUTH_DIR, { recursive: true });
          } catch {}
          socket = null;
          currentQR = null;
          userPhone = null;
          setTimeout(() => startWhatsAppEngine(true), 2000);
        } else if (shouldReconnect) {
          setTimeout(() => startWhatsAppEngine(true), 3000);
        }
      } else if (connection === 'open') {
        isConnected = true;
        currentQR = null;
        const jid = socket?.user?.id || '';
        userPhone = jid.split(':')[0].replace(/\D/g, '');
        console.log(`✅ [WhatsApp Engine] CONNECTED as +${userPhone}! Ready for background dispatch.`);
      }
    });
  } catch (err) {
    console.error('WhatsApp engine startup error:', err);
  } finally {
    isInitializing = false;
  }
}

// Lightweight HTTP server for IPC with Next.js API routes
const server = http.createServer(async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = req.url || '/';

  // 1. GET /status
  if (url === '/status' && req.method === 'GET') {
    res.writeHead(200);
    res.end(JSON.stringify({
      isConnected,
      qrCode: currentQR,
      phoneNumber: userPhone
    }));
    return;
  }

  // 2. POST /restart
  if (url === '/restart' && req.method === 'POST') {
    await startWhatsAppEngine(true);
    res.writeHead(200);
    res.end(JSON.stringify({
      isConnected,
      qrCode: currentQR,
      phoneNumber: userPhone
    }));
    return;
  }

  // 3. POST /send
  if (url === '/send' && req.method === 'POST') {
    let bodyStr = '';
    req.on('data', chunk => { bodyStr += chunk; });
    req.on('end', async () => {
      try {
        const { phone, message } = JSON.parse(bodyStr);
        let cleanPhone = (phone || '').replace(/\D/g, '');
        if (cleanPhone.length === 10) cleanPhone = '91' + cleanPhone;
        else if (cleanPhone.length > 10 && !cleanPhone.startsWith('91')) cleanPhone = '91' + cleanPhone.slice(-10);

        if (!cleanPhone || cleanPhone.length < 10) {
          res.writeHead(400);
          res.end(JSON.stringify({ success: false, error: 'Invalid phone number' }));
          return;
        }

        if (!socket || !isConnected) {
          res.writeHead(400);
          res.end(JSON.stringify({ success: false, error: 'WhatsApp is not connected. Please scan QR in Owner Settings.' }));
          return;
        }

        const jid = `${cleanPhone}@s.whatsapp.net`;
        const sent = await socket.sendMessage(jid, { text: message });

        res.writeHead(200);
        res.end(JSON.stringify({
          success: true,
          messageId: sent?.key?.id,
          deliveredTo: cleanPhone
        }));
      } catch (e) {
        res.writeHead(500);
        res.end(JSON.stringify({ success: false, error: e.message }));
      }
    });
    return;
  }

  // 4. POST /logout
  if (url === '/logout' && req.method === 'POST') {
    try {
      if (socket) {
        try { await socket.logout(); } catch {}
        try { socket.end(); } catch {}
      }
    } catch {}

    try {
      if (fs.existsSync(AUTH_DIR)) {
        fs.rmSync(AUTH_DIR, { recursive: true, force: true });
        fs.mkdirSync(AUTH_DIR, { recursive: true });
      }
    } catch {}

    socket = null;
    isConnected = false;
    currentQR = null;
    userPhone = null;

    setTimeout(() => startWhatsAppEngine(true), 1000);

    res.writeHead(200);
    res.end(JSON.stringify({ success: true, message: 'Disconnected' }));
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`🌐 [WhatsApp Service API] Running on http://localhost:${PORT}`);
  startWhatsAppEngine();
});
