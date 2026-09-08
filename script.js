/* =========================================================
   LANDING PAGE — background network particles + traffic sim
   ========================================================= */
(function(){
  const COLORS = {
    gold: '#D9A441', red: '#C0392B', amber: '#D98E3B',
    green: '#6B9E5E', line: '#E6DAC4', muted: '#8C7B6B'
  };

  /* ---- Background particle network ---- */
  const bg = document.getElementById('bgnet');
  if(bg){
    const bctx = bg.getContext('2d');
    let bw, bh, nodes = [];

    function bgResize(){
      bw = window.innerWidth; bh = window.innerHeight;
      const dpr = window.devicePixelRatio || 1;
      bg.width = bw * dpr; bg.height = bh * dpr;
      bctx.setTransform(dpr,0,0,dpr,0,0);
      const count = Math.min(70, Math.floor(bw * bh / 16000));
      nodes = Array.from({length: count}, () => ({
        x: Math.random()*bw, y: Math.random()*bh,
        vx: (Math.random()-.5)*0.35, vy: (Math.random()-.5)*0.35,
        r: 1.5 + Math.random()*2,
        c: [COLORS.gold, COLORS.red, COLORS.green][Math.floor(Math.random()*3)]
      }));
    }
    window.addEventListener('resize', bgResize);
    bgResize();

    function bgTick(){
      bctx.clearRect(0,0,bw,bh);
      // koneksi antar node
      for(let i=0;i<nodes.length;i++){
        for(let j=i+1;j<nodes.length;j++){
          const a=nodes[i], b=nodes[j];
          const d=Math.hypot(a.x-b.x, a.y-b.y);
          if(d<130){
            bctx.beginPath();
            bctx.moveTo(a.x,a.y); bctx.lineTo(b.x,b.y);
            bctx.strokeStyle = 'rgba(217,164,65,'+(0.14*(1-d/130))+')';
            bctx.lineWidth = 1;
            bctx.stroke();
          }
        }
      }
      nodes.forEach(n=>{
        n.x+=n.vx; n.y+=n.vy;
        if(n.x<0||n.x>bw) n.vx*=-1;
        if(n.y<0||n.y>bh) n.vy*=-1;
        bctx.beginPath();
        bctx.arc(n.x,n.y,n.r,0,Math.PI*2);
        bctx.fillStyle = n.c + '66';
        bctx.fill();
      });
      requestAnimationFrame(bgTick);
    }
    requestAnimationFrame(bgTick);
  }

  /* ---- Traffic simulation ---- */
  const canvas = document.getElementById('netcanvas');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, DPR;

  function resize(){
    DPR = window.devicePixelRatio || 1;
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W*DPR; canvas.height = H*DPR;
    ctx.setTransform(DPR,0,0,DPR,0,0);
  }
  window.addEventListener('resize', resize);
  resize();

  let scanned=0, passed=0, blocked=0;
  const elS=document.getElementById('statScanned'),
        elP=document.getElementById('statPassed'),
        elB=document.getElementById('statBlocked');
  function updateStats(){
    if(elS) elS.textContent=scanned;
    if(elP) elP.textContent=passed;
    if(elB) elB.textContent=blocked;
  }

  function layout(){
    return {
      clients: [0.18,0.35,0.5,0.65,0.82].map(f=>({x:W*0.08, y:H*f})),
      firewallX: W*0.5,
      servers: [0.3,0.5,0.7].map(f=>({x:W*0.9, y:H*f}))
    };
  }

  let packets=[], sparks=[], spawnTimer=0;

  function spawnPacket(){
    const L=layout();
    const from=L.clients[Math.floor(Math.random()*L.clients.length)];
    packets.push({
      x:from.x, y:from.y, startY:from.y,
      isThreat: Math.random()<0.35,
      phase:'toFirewall',
      speed: 1.6+Math.random()*0.9,
      target:null
    });
    scanned++; updateStats();
  }

  function drawNode(x,y,color,r){
    ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2);
    ctx.fillStyle=color; ctx.fill();
    ctx.beginPath(); ctx.arc(x,y,r+4,0,Math.PI*2);
    ctx.strokeStyle=color+'55'; ctx.lineWidth=1; ctx.stroke();
  }

  function drawFirewall(x){
    ctx.save();
    ctx.strokeStyle=COLORS.amber; ctx.lineWidth=2;
    ctx.setLineDash([10,8]);
    ctx.beginPath(); ctx.moveTo(x,20); ctx.lineTo(x,H-20); ctx.stroke();
    ctx.setLineDash([]); ctx.restore();
    ctx.fillStyle=COLORS.amber;
    ctx.font='600 11px "IBM Plex Mono", monospace';
    ctx.textAlign='center';
    ctx.fillText('FIREWALL / IDS', x, 14);
  }

  function tick(){
    ctx.clearRect(0,0,W,H);
    const L=layout();

    ctx.strokeStyle=COLORS.line; ctx.lineWidth=1;
    L.clients.forEach(c=>{
      ctx.beginPath(); ctx.moveTo(c.x,c.y); ctx.lineTo(L.firewallX,H/2); ctx.stroke();
    });
    L.servers.forEach(s=>{
      ctx.beginPath(); ctx.moveTo(L.firewallX,H/2); ctx.lineTo(s.x,s.y); ctx.stroke();
    });

    drawFirewall(L.firewallX);
    L.clients.forEach(c=>drawNode(c.x,c.y,COLORS.gold,5));
    L.servers.forEach(s=>drawNode(s.x,s.y,COLORS.green,6));

    packets=packets.filter(p=>p.alive!==false);
    packets.forEach(p=>{
      if(p.phase==='toFirewall'){
        const dx=L.firewallX-p.x, dy=(H/2)-p.y, dist=Math.hypot(dx,dy);
        if(dist<4){
          if(p.isThreat){
            p.phase='blocked'; blocked++; updateStats();
            sparks.push({x:p.x,y:p.y,life:18});
          } else {
            p.phase='toServer';
            p.target=L.servers[Math.floor(Math.random()*L.servers.length)];
          }
        } else { p.x+=(dx/dist)*p.speed; p.y+=(dy/dist)*p.speed; }
      } else if(p.phase==='toServer'){
        const dx=p.target.x-p.x, dy=p.target.y-p.y, dist=Math.hypot(dx,dy);
        if(dist<5){ p.alive=false; passed++; updateStats(); }
        else { p.x+=(dx/dist)*p.speed; p.y+=(dy/dist)*p.speed; }
      } else if(p.phase==='blocked'){ p.alive=false; }

      if(p.alive!==false){
        ctx.beginPath(); ctx.arc(p.x,p.y,3.2,0,Math.PI*2);
        ctx.fillStyle = p.isThreat ? COLORS.red : COLORS.gold;
        ctx.fill();
      }
    });

    sparks=sparks.filter(s=>s.life>0);
    sparks.forEach(s=>{
      ctx.beginPath(); ctx.arc(s.x,s.y,(18-s.life)*1.4,0,Math.PI*2);
      ctx.strokeStyle='rgba(192,57,43,'+(s.life/18)+')';
      ctx.lineWidth=2; ctx.stroke();
      s.life--;
    });

    spawnTimer++;
    if(spawnTimer>34){ spawnTimer=0; spawnPacket(); }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
