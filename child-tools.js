/* Outils enfant : badges, progression et défi ouverts uniquement à la demande. */
(function(){
  function ensureChildTools(c){
    c.childTools ??= {badges:true,progress:true,challenge:true};
    c.childTools.badges ??= true;
    c.childTools.progress ??= true;
    c.childTools.challenge ??= true;
  }
  app.profiles.forEach(p=>ensureChildTools(p.cfg||(p.cfg={})));bind();ensureChildTools(cfg);save();

  function mondayLocal(d=new Date()){const x=new Date(d),q=x.getDay()||7;x.setHours(12,0,0,0);x.setDate(x.getDate()-q+1);return x}
  function addLocal(d,n){const x=new Date(d);x.setDate(x.getDate()+n);return x}
  function currentWeekRecords(){const m=mondayLocal(),start=key(m),end=key(addLocal(m,6));return allDays().filter(([k])=>k>=start&&k<=end)}
  function previousWeekRecords(){const m=addLocal(mondayLocal(),-7),start=key(m),end=key(addLocal(m,6));return allDays().filter(([k])=>k>=start&&k<=end)}
  function ratedTasks(){const out=[];for(const gk of ORDER){const g=GROUPS[gk];if(!g||!cfg.blocks[gk])continue;for(const t of g.tasks){if(cfg.tasks[t[0]]===false)continue;if(g.type==='potty'){const pk=t[0]==='pot-pee'?'pee':'poop';if(cfg.pottyMode[pk]==='counter')continue}out.push({task:t,gk,group:g})}}return out}
  function taskPct(records,id){const vals=records.map(([,d])=>d.state?.[id]).filter(v=>v!==undefined);return vals.length?Math.round(vals.reduce((a,v)=>a+v,0)/(vals.length*2)*100):null}
  function taskStreak(id){const recs=allDays().filter(([,d])=>d.closed).sort((a,b)=>a[0].localeCompare(b[0]));let cur=0,best=0,lastGood=-1;recs.forEach(([,d],i)=>{if((d.state?.[id]??-1)>=1){cur++;best=Math.max(best,cur);lastGood=i}else cur=0});if(recs.length&&lastGood!==recs.length-1)cur=0;return {cur,best}}
  function closePanel(){document.getElementById('childToolOverlay')?.remove()}
  window.closeChildTool=closePanel;

  function shell(title,icon,body){closePanel();const o=document.createElement('div');o.id='childToolOverlay';o.className='overlay open childToolOverlay';o.innerHTML=`<div class="kidToolModal"><div class="kidToolHead"><div class="kidToolTitle"><span>${icon}</span><h2>${title}</h2></div><button class="kidToolClose" onclick="closeChildTool()">✕</button></div>${body}<button class="btn kidToolBack" onclick="closeChildTool()">← Retour à ma journée</button></div>`;document.body.appendChild(o)}

  window.openChildBadges=function(){
    updateBadges();
    const unlocked=BADGES.filter(b=>cfg.badgesUnlocked[b[0]]).length;
    const cards=BADGES.map(b=>{const ok=!!cfg.badgesUnlocked[b[0]];return `<div class="kidToolBadge ${ok?b[3]:'locked'}"><div class="kidToolBadgeIcon">${ok?b[1]:'🔒'}</div><b>${b[2]}</b><small>${ok?b[3].toUpperCase():'À débloquer'}</small></div>`}).join('');
    shell('Mes badges','🏅',`<div class="kidToolScore">${unlocked} / ${BADGES.length} débloqués</div><div class="kidToolBadgeGrid">${cards}</div>`);
  };

  window.openChildProgress=function(){
    const cur=currentWeekRecords(),prev=previousWeekRecords();
    const items=ratedTasks().map(x=>{const pct=taskPct(cur,x.task[0]),old=taskPct(prev,x.task[0]),s=taskStreak(x.task[0]);return {...x,pct,old,...s}}).filter(x=>x.pct!==null||x.old!==null).sort((a,b)=>(b.pct??-1)-(a.pct??-1));
    const rows=items.length?items.map(x=>{const p=x.pct??0,d=x.old===null||x.old===undefined?'':x.pct===null?'':x.pct-x.old,trend=d===''?'':d>0?`↗ +${d}`:d<0?`↘ ${d}`:'→ 0';return `<div class="kidProgressRow"><div class="kidProgressLabel"><span>${x.task[1]}</span><div><b>${x.task[2]}</b><small>${x.group.title} · 🔥 ${x.cur} · 🏆 ${x.best}</small></div></div><div class="kidProgressBar"><i style="width:${p}%"></i></div><strong>${x.pct===null?'—':x.pct+'%'}</strong><em>${trend}</em></div>`}).join(''):`<div class="kidToolEmpty">🌱 Ta progression apparaîtra après quelques journées.</div>`;
    shell('Ma progression','📈',`<div class="kidToolIntro">Regarde tout ce que tu apprends cette semaine 🌟</div><div class="kidProgressList">${rows}</div>`);
  };

  window.openChildChallenge=function(){
    const ch=cfg.weeklyChallenge||{};
    if(!ch.taskId){shell('Mon défi','🎯','<div class="kidToolEmpty">🎈 Papa ou maman choisira bientôt un défi pour toi.</div>');return}
    let found=null;for(const gk of ORDER){const g=GROUPS[gk],t=g?.tasks?.find(x=>x[0]===ch.taskId);if(t){found={g,t};break}}
    if(!found){shell('Mon défi','🎯','<div class="kidToolEmpty">Aucun défi pour cette semaine.</div>');return}
    const target=Number(ch.target)||5,count=currentWeekRecords().filter(([,d])=>d.state?.[ch.taskId]===2).length,pct=Math.min(100,Math.round(count/target*100)),done=count>=target;
    shell('Mon défi','🎯',`<div class="kidChallengeBig ${done?'done':''}"><div class="kidChallengeEmoji">${found.t[1]}</div><h3>${found.t[2]}</h3><p>${done?'🏆 Défi réussi !':'Objectif : '+target+' étoiles'}</p><div class="kidChallengeTrack"><i style="width:${pct}%"></i></div><strong>${Math.min(count,target)} / ${target} 🌟</strong><div class="kidChallengeMessage">${done?'Bravo, tu as réussi ton défi ! 🎉':`Encore ${Math.max(0,target-count)} étoile${target-count>1?'s':''} pour réussir !`}</div></div>`);
  };

  function updateToolVisibility(){
    ensureChildTools(cfg);
    const map={childBadgesBtn:'badges',childProgressBtn:'progress',childChallengeBtn:'challenge'};
    Object.entries(map).forEach(([id,k])=>{const el=document.getElementById(id);if(el)el.style.display=cfg.kidMode&&cfg.childTools[k]?'flex':'none'});
  }

  function childToolSettings(){return `<div class="settingsGroup childToolsSettings"><h3>🧒 Boutons de l'interface enfant</h3><p>Choisis les raccourcis que l'enfant peut voir. Ils restent masqués dans l'interface parents.</p><label class="toggleRow"><span>🏅 Mes badges</span><input type="checkbox" ${cfg.childTools.badges?'checked':''} onchange="cfg.childTools.badges=this.checked;save();render()"></label><label class="toggleRow"><span>📈 Ma progression</span><input type="checkbox" ${cfg.childTools.progress?'checked':''} onchange="cfg.childTools.progress=this.checked;save();render()"></label><label class="toggleRow"><span>🎯 Mon défi</span><input type="checkbox" ${cfg.childTools.challenge?'checked':''} onchange="cfg.childTools.challenge=this.checked;save();render()"></label></div>`}

  const prevSettings=window.renderSettings;
  window.renderSettings=function(){prevSettings();ensureChildTools(cfg);const host=document.getElementById('settingsView')?.querySelector('.box');if(!host)return;host.querySelectorAll('.childToolsSettings').forEach(x=>x.remove());const mode=Array.from(host.querySelectorAll('.settingsGroup')).find(x=>x.textContent.includes('Mode enfant'));const holder=document.createElement('div');holder.innerHTML=childToolSettings();if(mode)mode.after(holder.firstElementChild);else host.appendChild(holder.firstElementChild)};

  const prevRender=window.render;
  window.render=function(){prevRender();ensureChildTools(cfg);updateToolVisibility()};
  updateToolVisibility();
})();