/* =========================================================
   VISUALISASI JARINGAN (Canvas)
   ========================================================= */
const canvas = document.getElementById('netcanvas');
const ctx = canvas.getContext('2d');
let W, H, DPR;

function resize(){
  DPR = window.devicePixelRatio || 1;
  W = canvas.clientWidth;
  H = canvas.clientHeight;
  canvas.width = W * DPR;
  canvas.height = H * DPR;
  ctx.setTransform(DPR,0,0,DPR,0,0);
}
window.addEventListener('resize', resize);
resize();

const COLORS = {
  cyan: '#4CC9F0',
  red: '#EF476F',
  amber: '#FFB703',
  green: '#52D68A',
  line: '#232B3B',
  muted: '#7C8AA0'
};

let scanned = 0, passed = 0, blocked = 0;
const statScanned = document.getElementById('statScanned');
const statPassed = document.getElementById('statPassed');
const statBlocked = document.getElementById('statBlocked');

function updateStats(){
  statScanned.textContent = scanned;
  statPassed.textContent = passed;
  statBlocked.textContent = blocked;
}

// Node jaringan: klien di kiri, server di kanan, firewall di tengah
function layout(){
  return {
    clients: [0.18, 0.35, 0.5, 0.65, 0.82].map(f => ({x: W*0.08, y: H*f})),
    firewallX: W*0.5,
    servers: [0.3, 0.5, 0.7].map(f => ({x: W*0.9, y: H*f}))
  };
}

let packets = [];
let sparks = [];

function spawnPacket(){
  const L = layout();
  const from = L.clients[Math.floor(Math.random()*L.clients.length)];
  const isThreat = Math.random() < 0.35;
  packets.push({
    x: from.x, y: from.y,
    startY: from.y,
    isThreat,
    phase: 'toFirewall',
    speed: 1.6 + Math.random()*0.9,
    target: null
  });
  scanned++;
  updateStats();
}

let spawnTimer = 0;

function drawNode(x, y, color, r){
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI*2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x, y, r+4, 0, Math.PI*2);
  ctx.strokeStyle = color + '55';
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawFirewall(x){
  ctx.save();
  ctx.strokeStyle = COLORS.amber;
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 8]);
  ctx.beginPath();
  ctx.moveTo(x, 20);
  ctx.lineTo(x, H-20);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  ctx.fillStyle = COLORS.amber;
  ctx.font = '600 11px "IBM Plex Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('FIREWALL / IDS', x, 14);
}

function tick(){
  ctx.clearRect(0,0,W,H);
  const L = layout();

  // garis latar tipis dari client & ke server
  ctx.strokeStyle = COLORS.line;
  ctx.lineWidth = 1;
  L.clients.forEach(c=>{
    ctx.beginPath();
    ctx.moveTo(c.x, c.y);
    ctx.lineTo(L.firewallX, H/2);
    ctx.stroke();
  });
  L.servers.forEach(s=>{
    ctx.beginPath();
    ctx.moveTo(L.firewallX, H/2);
    ctx.lineTo(s.x, s.y);
    ctx.stroke();
  });

  drawFirewall(L.firewallX);

  L.clients.forEach(c=> drawNode(c.x, c.y, COLORS.cyan, 5));
  L.servers.forEach(s=> drawNode(s.x, s.y, COLORS.green, 6));

  // update & gambar packets
  packets = packets.filter(p => p.alive !== false);
  packets.forEach(p=>{
    if(p.phase === 'toFirewall'){
      const dx = L.firewallX - p.x;
      const dy = (H/2) - p.y;
      const dist = Math.hypot(dx,dy);
      if(dist < 4){
        if(p.isThreat){
          p.phase = 'blocked';
          blocked++; updateStats();
          sparks.push({x:p.x, y:p.y, life: 18});
        } else {
          p.phase = 'toServer';
          p.target = L.servers[Math.floor(Math.random()*L.servers.length)];
        }
      } else {
        p.x += (dx/dist) * p.speed;
        p.y += (dy/dist) * p.speed;
      }
    } else if(p.phase === 'toServer'){
      const dx = p.target.x - p.x;
      const dy = p.target.y - p.y;
      const dist = Math.hypot(dx,dy);
      if(dist < 5){
        p.alive = false;
        passed++; updateStats();
      } else {
        p.x += (dx/dist) * p.speed;
        p.y += (dy/dist) * p.speed;
      }
    } else if(p.phase === 'blocked'){
      p.alive = false;
    }

    if(p.alive !== false){
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3.2, 0, Math.PI*2);
      ctx.fillStyle = p.isThreat ? COLORS.red : COLORS.cyan;
      ctx.fill();
    }
  });

  // spark saat blokir
  sparks = sparks.filter(s => s.life > 0);
  sparks.forEach(s=>{
    ctx.beginPath();
    ctx.arc(s.x, s.y, (18-s.life)*1.4, 0, Math.PI*2);
    ctx.strokeStyle = `rgba(239,71,111,${s.life/18})`;
    ctx.lineWidth = 2;
    ctx.stroke();
    s.life--;
  });

  spawnTimer++;
  if(spawnTimer > 34){
    spawnTimer = 0;
    spawnPacket();
  }

  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

/* =========================================================
   AP AI — CHAT DENGAN WEB SEARCH (Google Gemini API - GRATIS)
   ========================================================= */
const keyBox = document.getElementById('keyBox');
const apiKeyInput = document.getElementById('apiKeyInput');
const chatWindow = document.getElementById('chatWindow');
const emptyHint = document.getElementById('emptyHint');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');

const GEMINI_MODEL = 'gemini-3.6-flash';
const STORAGE_KEY = 'apai_gemini_key';
let apiKey = '';
let history = []; // format Gemini: [{ role: 'user'|'model', parts: [{text}] }]

// Tampilkan kotak API key, isi otomatis kalau sudah pernah disimpan di browser ini sebelumnya
keyBox.classList.add('show');
try{
  const saved = localStorage.getItem(STORAGE_KEY);
  if(saved) apiKeyInput.value = saved;
}catch(e){ /* localStorage tidak tersedia, lanjut tanpa isi otomatis */ }

// Simpan otomatis tiap kali user ketik/paste key baru, supaya tidak perlu diketik ulang lain kali
apiKeyInput.addEventListener('input', ()=>{
  try{ localStorage.setItem(STORAGE_KEY, apiKeyInput.value.trim()); }catch(e){}
});

const forgetKeyBtn = document.getElementById('forgetKeyBtn');
if(forgetKeyBtn){
  forgetKeyBtn.addEventListener('click', ()=>{
    apiKeyInput.value = '';
    try{ localStorage.removeItem(STORAGE_KEY); }catch(e){}
  });
}

function addMessage(role, text, sources){
  if(emptyHint) emptyHint.remove();
  const div = document.createElement('div');
  div.className = 'msg ' + (role === 'user' ? 'user' : 'ai');
  if(role !== 'user'){
    const who = document.createElement('span');
    who.className = 'who';
    who.textContent = 'AP AI';
    div.appendChild(who);
  }
  const body = document.createElement('div');
  body.textContent = text;
  div.appendChild(body);

  if(sources && sources.length){
    const src = document.createElement('div');
    src.className = 'sources';
    src.innerHTML = 'Sumber: ' + sources.map(s =>
      `<a href="${s.url}" target="_blank" rel="noopener">${(s.title || s.url)}</a>`
    ).join(' · ');
    div.appendChild(src);
  }

  chatWindow.appendChild(div);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function addTyping(){
  const div = document.createElement('div');
  div.className = 'typing';
  div.id = 'typingIndicator';
  div.textContent = 'AP AI sedang mencari jawaban...';
  chatWindow.appendChild(div);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}
function removeTyping(){
  const el = document.getElementById('typingIndicator');
  if(el) el.remove();
}

async function askAPAI(question){
  apiKey = apiKeyInput.value.trim();
  if(!apiKey){
    addMessage('ai', 'Masukkan Google Gemini API key di kotak atas dulu ya, biar aku bisa jawab. Ambil gratis di aistudio.google.com/app/apikey');
    return;
  }

  history.push({ role: 'user', parts: [{ text: question }] });
  addTyping();
  sendBtn.disabled = true;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;

  try{
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: history,
        systemInstruction: {
          parts: [{ text: 'Kamu adalah AP AI, asisten yang menjawab pertanyaan seputar keamanan jaringan dan topik umum lain dalam Bahasa Indonesia, singkat dan jelas. Gunakan pencarian Google bila butuh info terkini.' }]
        },
        tools: [{ google_search: {} }]
      })
    });

    if(!res.ok){
      const errText = await res.text();
      throw new Error('HTTP ' + res.status + ': ' + errText);
    }

    const data = await res.json();
    const candidate = (data.candidates && data.candidates[0]) || null;
    let answer = '';
    let sources = [];

    if(candidate){
      (candidate.content?.parts || []).forEach(part=>{
        if(part.text) answer += part.text;
      });

      const chunks = candidate.groundingMetadata?.groundingChunks || [];
      chunks.forEach(c=>{
        const uri = c.web?.uri;
        const title = c.web?.title;
        if(uri && !sources.find(s=>s.url===uri)){
          sources.push({ url: uri, title });
        }
      });

      history.push({ role: 'model', parts: candidate.content?.parts || [{ text: answer }] });
    }

    removeTyping();
    addMessage('ai', answer || '(Tidak ada jawaban teks dari model.)', sources);

  } catch(err){
    removeTyping();
    addMessage('ai', 'Gagal menghubungi API: ' + err.message);
  } finally {
    sendBtn.disabled = false;
  }
}

function handleSend(){
  const q = chatInput.value.trim();
  if(!q) return;
  addMessage('user', q);
  chatInput.value = '';
  askAPAI(q);
}

sendBtn.addEventListener('click', handleSend);
chatInput.addEventListener('keydown', e=>{
  if(e.key === 'Enter') handleSend();
});
