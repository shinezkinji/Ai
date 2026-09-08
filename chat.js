/* Asuna AI — chat (Groq API) */
const AVATAR_URL = "https://github.com/shinezkinji.png";
const keyBox = document.getElementById('keyBox');
const apiKeyInput = document.getElementById('apiKeyInput');
const chatWindow = document.getElementById('chatWindow');
const emptyHint = document.getElementById('emptyHint');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');

const GROQ_MODEL = 'groq/compound';
const STORAGE_KEY = 'apai_groq_key';
let apiKey = '';
let history = [];

keyBox.classList.add('show');
try{
  const saved = localStorage.getItem(STORAGE_KEY);
  if(saved) apiKeyInput.value = saved;
}catch(e){}

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
    who.innerHTML = '<img src="' + AVATAR_URL + '" alt="" class="avatar-sm">Asuna AI';
    div.appendChild(who);
  }
  const body = document.createElement('div');
  body.textContent = text;
  div.appendChild(body);

  if(sources && sources.length){
    const src = document.createElement('div');
    src.className = 'sources';
    src.innerHTML = 'Sumber: ' + sources.map(s =>
      '<a href="' + s.url + '" target="_blank" rel="noopener">' + (s.title || s.url) + '</a>'
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
  div.textContent = 'Asuna AI sedang mencari jawaban...';
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
    addMessage('ai', 'Masukkan Groq API key di kotak atas dulu ya, biar aku bisa jawab. Ambil gratis di console.groq.com/keys');
    return;
  }

  history.push({ role: 'user', content: question });
  addTyping();
  sendBtn.disabled = true;

  try{
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: 'Kamu adalah Asuna AI, asisten yang menjawab pertanyaan seputar keamanan jaringan dan topik umum lain dalam Bahasa Indonesia, singkat dan jelas. Gunakan web search bila butuh info terkini.' },
          ...history
        ]
      })
    });

    if(!res.ok){
      const errText = await res.text();
      throw new Error('HTTP ' + res.status + ': ' + errText);
    }

    const data = await res.json();
    const message = data.choices?.[0]?.message;
    const answer = message?.content || '';
    let sources = [];

    (message?.executed_tools || []).forEach(tool=>{
      const results = tool.search_results?.results || tool.output?.results || [];
      results.forEach(r=>{
        if(r.url && !sources.find(s=>s.url===r.url)){
          sources.push({ url: r.url, title: r.title });
        }
      });
    });

    history.push({ role: 'assistant', content: answer });
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
