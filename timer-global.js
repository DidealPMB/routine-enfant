/* Timer général : remplace les timers attachés aux missions. */
(function(){
  // Supprime un éventuel ancien timer de mission sans toucher aux scores.
  if (typeof cfg !== 'undefined' && cfg.activeTimer) {
    cfg.activeTimer = null;
    save();
  }

  window.uniformTaskCard = function(t){
    const v=db.days[key()].state[t[0]];
    return `<div class="actionCard ${cls(v)}"><div class="actionHead"><span class="actionEmoji">${t[1]}</span><span class="actionName">${t[2]}</span></div>${actionButtons(t[0])}</div>`;
  };

  window.uniformPottyCard = function(t){
    const k=t[0]==='pot-pee'?'pee':'poop';
    if(cfg.pottyMode[k]==='stars')return window.uniformTaskCard(t);
    const n=db.days[key()].pot[k]||0;
    return `<div class="actionCard"><div class="actionHead"><span class="actionEmoji">🚽</span><span class="actionName">${t[2]}</span></div><div class="actionCount">${n}</div><div class="actionCounter"><button class="minus" onclick="pot('${k}',-1)">−</button><button class="plus" onclick="pot('${k}',1)">＋</button></div></div>`;
  };

  function remaining(){
    return cfg.globalTimer ? Math.max(0,Math.ceil((cfg.globalTimer.endAt-Date.now())/1000)) : 0;
  }
  function format(sec){
    const m=Math.floor(sec/60),s=sec%60;
    return String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');
  }
  window.openGeneralTimer=function(){
    if(cfg.globalTimer && remaining()>0){ openRunningTimer(); return; }
    if(cfg.globalTimer && remaining()<=0 && cfg.globalTimer.finished){ openRunningTimer(); return; }
    document.getElementById('timerOverlay')?.remove();
    const o=document.createElement('div');
    o.className='overlay open';o.id='timerOverlay';
    o.innerHTML=`<div class="timerModal generalTimerModal"><div class="generalTimerIcon">⏱️</div><h2>Mon timer</h2><p>Combien de temps ?</p><div class="timerPresets generalPresets">${[2,5,10,15,20,30].map(n=>`<button class="timerPreset" onclick="startGeneralTimer(${n})">${n}<small> min</small></button>`).join('')}</div><button class="btn timerCancelBtn" onclick="closeGeneralTimer()">Annuler</button></div>`;
    document.body.appendChild(o);
  };
  window.startGeneralTimer=function(minutes){
    cfg.globalTimer={duration:minutes*60,endAt:Date.now()+minutes*60000,notified:false,finished:false};
    save();openRunningTimer();globalTimerTick();
  };
  function openRunningTimer(){
    document.getElementById('timerOverlay')?.remove();
    const o=document.createElement('div');o.className='overlay open';o.id='timerOverlay';
    o.innerHTML=`<div class="timerModal generalTimerModal" id="generalTimerCard"><div class="generalTimerIcon">⏱️</div><div id="generalTimerClock" class="timerClock">00:00</div><div class="timerProgress"><div id="generalTimerBar" class="timerProgressBar"></div></div><div id="generalTimerMessage" class="generalTimerMessage">Tu as le temps, avance tranquillement 🌟</div><div class="timerControls"><button class="btn" onclick="closeGeneralTimer()">Masquer</button><button class="btn" onclick="addGeneralTimerMinute()">+1 min</button><button class="btn" onclick="stopGeneralTimer()">⏹ Arrêter</button></div></div>`;
    document.body.appendChild(o);globalTimerTick();
  }
  window.closeGeneralTimer=function(){document.getElementById('timerOverlay')?.remove()};
  window.addGeneralTimerMinute=function(){
    if(!cfg.globalTimer)return;
    cfg.globalTimer.endAt=Math.max(Date.now(),cfg.globalTimer.endAt)+60000;
    cfg.globalTimer.duration=(cfg.globalTimer.duration||0)+60;
    cfg.globalTimer.notified=false;cfg.globalTimer.finished=false;
    save();globalTimerTick();
  };
  window.stopGeneralTimer=function(){
    if(!cfg.globalTimer)return;
    if(!confirm('Arrêter le timer ?'))return;
    cfg.globalTimer=null;save();closeGeneralTimer();globalTimerTick();
  };
  function finishTimer(){
    if(!cfg.globalTimer || cfg.globalTimer.notified)return;
    cfg.globalTimer.notified=true;cfg.globalTimer.finished=true;save();
    if(navigator.vibrate)navigator.vibrate([180,80,180,80,240]);
    const card=document.getElementById('generalTimerCard');if(card)card.classList.add('timerDone');
    const msg=document.getElementById('generalTimerMessage');if(msg)msg.innerHTML='🎉 <b>Le temps est terminé !</b>';
    for(let i=0;i<16;i++){
      const s=document.createElement('span');s.className='timerConfetti';s.textContent=['⭐','✨','🎉'][i%3];s.style.left=(20+Math.random()*60)+'vw';s.style.top=(35+Math.random()*20)+'vh';s.style.setProperty('--tx',(Math.random()*240-120)+'px');document.body.appendChild(s);setTimeout(()=>s.remove(),1200);
    }
  }
  window.globalTimerTick=function(){
    const btn=document.getElementById('activeTimerBtn');if(!btn)return;
    if(!cfg.globalTimer){btn.textContent='⏱️ Timer';btn.classList.remove('running','finished');return;}
    const rem=remaining();
    btn.textContent=rem>0?`⏱️ ${format(rem)}`:'⏱️ Terminé !';
    btn.classList.toggle('running',rem>0);btn.classList.toggle('finished',rem<=0);
    const clock=document.getElementById('generalTimerClock');if(clock)clock.textContent=format(rem);
    const bar=document.getElementById('generalTimerBar');if(bar){const p=cfg.globalTimer.duration?Math.max(0,Math.min(100,rem/cfg.globalTimer.duration*100)):0;bar.style.width=p+'%';}
    if(rem<=0)finishTimer();
  };
  window.openActiveTimer=window.openGeneralTimer;
  setInterval(globalTimerTick,1000);
  if(typeof render==='function')render();
  globalTimerTick();
})();