const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Hotel POS Production Services...');

// 1. Start WhatsApp Service Daemon
const whatsappProcess = spawn('node', [path.join(__dirname, 'whatsapp-service.js')], {
  stdio: 'inherit',
  shell: true,
  env: process.env,
});

whatsappProcess.on('error', (err) => {
  console.error('❌ Failed to start WhatsApp Service:', err);
});

// 2. Start Next.js Production Server
const nextProcess = spawn('npx', ['next', 'start', '-p', process.env.PORT || '3000'], {
  stdio: 'inherit',
  shell: true,
  env: process.env,
});

nextProcess.on('error', (err) => {
  console.error('❌ Failed to start Next.js Server:', err);
});

// Handle graceful termination
const cleanup = () => {
  console.log('\n🛑 Stopping all services...');
  whatsappProcess.kill();
  nextProcess.kill();
  process.exit();
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
