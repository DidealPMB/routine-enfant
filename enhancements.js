/* Améliorations : comportements supplémentaires, détail historique et pavé PIN Safari. */
(function(){
  const extraBehaviors=[
    ['no-hit','✋','Je ne tape pas'],
    ['no-insult','🤐','Je ne dis pas d’insulte']
  ];

  // Ajoute les nouvelles missions sans toucher à l'historique existant.
  const behaviorIds=new Set(GROUPS.behaviors.tasks.map(t=>t[0]));
  extraBehaviors.forEach(t=>{if(!behaviorIds.has(t[0]))GROUPS.behaviors.tasks.push(t);baseCfg.tasks[t[0]]=true});
  app.profiles.forEach(p=>{
    p.cfg=p.cfg||{};
    p.cfg.tasks=p.cfg.tasks||{};
    extraBehaviors.forEach(t=>{if(p.cfg.tasks[t[0]]===undefined)p.cfg.tasks[t[0]]=true});
  });
  bind();save();

  // Pavé PIN : ne dépend pas des variables DOM implicites, moins fiables sur Safari/iPadOS.
  window.openPin=function(){
    entered='';
    const error=document.getElementById('pinError');
    const overlay=document.getElementById('pinOverlay');
    if(error)error.textContent='';
    if(overlay)overlay.classList.add('open');
    drawPin();
  };
  window.closePin=function(){document.getElementById('pinOverlay')?.classList.remove('open')};
  window.drawPin=function(){
    const dots=document.getElementById('pinDots');
    const pad=document.getElementById('keypad');
    if(dots)dots.textContent='● '.repeat(entered.length)+'○ '.repeat(4-entered.length);
    if(pad)pad.innerHTML=[1,2,3,4,5,6,7,8,9,'⌫',0,'✓'].map(k=>`<button type="button" class="key" onclick="pinKey('${k}')">${k}</button>`).join('');
  };
  window.pinKey=function(k){
    if(k==='⌫')entered=entered.slice(0,-1);
    else if(k==='✓'){
      if(entered===cfg.parentPin){
        closePin();cfg.kidMode=false;save();render();showView('today');
      }else{
        entered='';
        const error=document.getElementById('pinError');
        if(error)error.textContent='Code incorrect';
      }
    }else if(entered.length<4)entered+=k;
    drawPin();
  };

  function dayScoreFromState(day){return score(day?.state||{})}
  function statusHtml(v){
    if(v===2)return '<span class="historyStatus historyGreat">🌟 Très bien</span>';
    if(v===1)return '<span class="historyStatus historyMid">😊 Moyen / avec aide</span>';
    if(v===0)return '<span class="historyStatus historyCloud">☁️ Difficile</span>';
    return '<span class="historyStatus historyEmpty">— Non renseigné</span>';
  }
  function dateFromKey(k){const [y,m,d]=k.split('-').map(Number);return new Date(y,m-1,d,12,0,0)}

  window.openDayDetail=function(dayKey){
    const day=db.days[dayKey];
    if(!day)return;
    document.getElementById('historyDetailOverlay')?.remove();
    const date=dateFromKey(dayKey);
    const scoreValue=dayScoreFromState(day);
    const max=maxScore();
    const p=percent(scoreValue,max);
    let groups='';
    for(const gk of ORDER){
      const g=GROUPS[gk];
      if(!cfg.blocks[gk])continue;
      const tasks=g.tasks.filter(t=>cfg.tasks[t[0]]!==false);
      if(!tasks.length)continue;
      const rows=tasks.map(t=>{
        if(g.type==='potty'){
          const potKey=t[0]==='pot-pee'?'pee':'poop';
          if(cfg.pottyMode[potKey]==='counter')return `<div class="historyMission"><div><span class="historyEmoji">${t[1]}</span><b>${t[2]}</b></div><span class="historyCounter">${day.pot?.[potKey]||0}</span></div>`;
        }
        return `<div class="historyMission"><div><span class="historyEmoji">${t[1]}</span><b>${t[2]}</b></div>${statusHtml(day.state?.[t[0]])}</div>`;
      }).join('');
      groups+=`<section class="historyGroup"><h3>${g.title}</h3>${rows}</section>`;
    }
    const o=document.createElement('div');
    o.id='historyDetailOverlay';o.className='overlay open';
    o.innerHTML=`<div class="historyDetailModal"><div class="historyDetailHead"><div><h2>${date.toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</h2><div class="historySummary">⭐ <b>${scoreValue}/${max}</b> · <b>${p}%</b> ${day.closed?'· 🏁 Clôturée':'· 📝 Non clôturée'}</div></div><button class="historyClose" onclick="closeDayDetail()">✕</button></div>${groups}<button class="btn historyBottomClose" onclick="closeDayDetail()">Fermer</button></div>`;
    document.body.appendChild(o);
  };
  window.closeDayDetail=function(){document.getElementById('historyDetailOverlay')?.remove()};

  // Historique cliquable jour par jour.
  window.renderWeek=function(){
    const m=add(monday(new Date()),weekOffset*7),names=['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];
    let total=0,potTotal=0,closed=0,h='';
    for(let i=0;i<7;i++){
      const d=add(m,i),dk=key(d),r=db.days[dk],p=r?percent(score(r.state||{}),maxScore()):0;
      if(r){total+=score(r.state||{});potTotal+=(r.pot?.pee||0)+(r.pot?.poop||0);if(r.closed)closed++}
      const clickable=!!r;
      h+=`<button type="button" class="day historyDay ${dk===key()?'today':''} ${clickable?'clickable':'empty'}" ${clickable?`onclick="openDayDetail('${dk}')"`:''}><b>${names[i]}</b><div>${d.getDate()}/${d.getMonth()+1}</div><strong>${dk>key()?'—':r?p+'%':'—'}</strong><div>${r?.closed?'🏁':dk>key()?'⏳':r?'📝':'—'}</div>${clickable?'<small>Voir le détail</small>':''}</button>`;
    }
    document.getElementById('weekRange').textContent=`Du ${m.toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'})} au ${add(m,6).toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'})}`;
    document.getElementById('weekInfo').innerHTML=`⭐ <b>${total}</b> étoiles · 🚽 <b>${potTotal}</b> réussites pot · 🏁 <b>${closed}</b> journée(s) clôturée(s)`;
    document.getElementById('weekGrid').innerHTML=h;
    document.getElementById('nextWeekBtn').disabled=weekOffset>=0;
  };

  // Rafraîchit l'interface avec les nouvelles missions et fonctions.
  if(typeof render==='function')render();
})();