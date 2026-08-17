/* Fonctions d'évolution : pondération, défis, progression, séries, bilan hebdo, récompenses et notes. */
(function(){
  const RANDOM_REWARDS=[
    '🎬 Choisir le film de la soirée',
    '📚 Choisir une histoire supplémentaire',
    '🎲 Choisir un jeu en famille',
    '🎵 Choisir la musique du moment',
    '🌳 Choisir une sortie au parc',
    '🍰 Choisir le dessert',
    '🧸 Dormir avec un doudou spécial',
    '👑 Être le chef de famille pendant 15 minutes',
    '🎨 Choisir une activité créative',
    '🕺 Organiser une mini soirée dansante',
    '🥞 Choisir le petit-déjeuner du week-end',
    '⛺ Faire une cabane dans le salon'
  ];

  function ensureCfg(c){
    c.weightingEnabled ??= false;
    c.taskWeights ??= {};
    c.weeklyChallenge ??= {taskId:'',target:5};
    c.rewardMode ??= 'custom';
    c.weeklyRewardThreshold ??= 70;
    c.weeklyRewards ??= {};
    Object.values(GROUPS).forEach(g=>g.tasks.forEach(t=>{if(c.taskWeights[t[0]]===undefined)c.taskWeights[t[0]]=1}));
  }
  app.profiles.forEach(p=>ensureCfg(p.cfg||(p.cfg={})));bind();ensureCfg(cfg);save();

  function taskById(id){for(const gk of ORDER){const t=GROUPS[gk]?.tasks?.find(x=>x[0]===id);if(t)return {task:t,gk,group:GROUPS[gk]}}return null}
  function enabledRatedTasks(){const out=[];for(const gk of ORDER){const g=GROUPS[gk];if(!g||!cfg.blocks[gk])continue;for(const t of g.tasks){if(cfg.tasks[t[0]]===false)continue;if(g.type==='potty'){const pk=t[0]==='pot-pee'?'pee':'poop';if(cfg.pottyMode[pk]==='counter')continue}out.push({task:t,gk,group:g})}}return out}

  /* Pondération : complètement inactive tant que l'option reste décochée. */
  const originalScore=window.score;
  const originalMaxScore=window.maxScore;
  window.score=function(state={}){
    if(!cfg.weightingEnabled)return originalScore(state);
    return activeIds().reduce((n,id)=>n+(state[id]??0)*(Number(cfg.taskWeights[id])||1),0);
  };
  window.maxScore=function(){
    if(!cfg.weightingEnabled)return originalMaxScore();
    return activeIds().reduce((n,id)=>n+2*(Number(cfg.taskWeights[id])||1),0);
  };

  function weekMonday(date=new Date()){return monday(date)}
  function weekKey(date=new Date()){return key(weekMonday(date))}
  function weekRecords(offset=0){const m=add(weekMonday(new Date()),offset*7),end=key(add(m,6)),start=key(m);return allDays().filter(([k])=>k>=start&&k<=end)}
  function challengeProgress(){
    const ch=cfg.weeklyChallenge;if(!ch?.taskId)return {count:0,target:ch?.target||5};
    const count=weekRecords(0).filter(([,d])=>d.state?.[ch.taskId]===2).length;
    return {count,target:Number(ch.target)||5};
  }

  function renderChallengeCard(){
    const ch=cfg.weeklyChallenge;if(!ch?.taskId)return '';
    const found=taskById(ch.taskId);if(!found)return '';
    const p=challengeProgress(),done=p.count>=p.target,pct=Math.min(100,Math.round(p.count/p.target*100));
    return `<section class="challengeCard ${done?'done':''}"><div class="challengeIcon">🎯</div><div class="challengeBody"><div class="challengeEyebrow">DÉFI DE LA SEMAINE</div><h3>${found.task[1]} ${found.task[2]}</h3><div class="challengeProgressText">${done?'🏆 Défi réussi !':`${p.count} / ${p.target} 🌟`}</div><div class="challengeTrack"><div class="challengeFill" style="width:${pct}%"></div></div></div></section>`;
  }

  const originalRenderToday=window.renderToday;
  window.renderToday=function(){
    originalRenderToday();
    const host=document.getElementById('todayBlocks');if(!host)return;
    const html=renderChallengeCard();if(html)host.insertAdjacentHTML('afterbegin',html);
  };

  function taskSeries(taskId){
    const recs=allDays().filter(([,d])=>d.closed).sort((a,b)=>a[0].localeCompare(b[0]));
    let current=0,best=0,lastGoodIndex=-1;
    recs.forEach(([k,d],i)=>{const good=(d.state?.[taskId]??-1)>=1;if(good){current++;best=Math.max(best,current);lastGoodIndex=i}else current=0});
    if(recs.length&&lastGoodIndex!==recs.length-1)current=0;
    return {current,best};
  }

  function pctForTask(records,id){const vals=records.map(([,d])=>d.state?.[id]).filter(v=>v!==undefined);return vals.length?Math.round(vals.reduce((a,v)=>a+v,0)/(vals.length*2)*100):null}
  function pctForGroup(records,gk){const ids=enabledRatedTasks().filter(x=>x.gk===gk).map(x=>x.task[0]),vals=[];records.forEach(([,d])=>ids.forEach(id=>{if(d.state?.[id]!==undefined)vals.push(d.state[id])}));return vals.length?Math.round(vals.reduce((a,v)=>a+v,0)/(vals.length*2)*100):null}
  function deltaHtml(cur,prev){if(cur===null)return '<span class="trendNoData">—</span>';if(prev===null)return `<span class="trendNew">${cur}%</span>`;const d=cur-prev,icon=d>0?'↗':d<0?'↘':'→',cls=d>0?'trendUp':d<0?'trendDown':'trendFlat';return `<span class="${cls}">${cur}% ${icon} ${d>0?'+':''}${d}</span>`}

  function progressionHtml(){
    const cur=weekRecords(0),prev=weekRecords(-1);
    const sections=ORDER.filter(gk=>cfg.blocks[gk]&&GROUPS[gk]).map(gk=>({gk,cur:pctForGroup(cur,gk),prev:pctForGroup(prev,gk)})).filter(x=>x.cur!==null||x.prev!==null);
    const actions=enabledRatedTasks().map(x=>({...x,cur:pctForTask(cur,x.task[0]),prev:pctForTask(prev,x.task[0])})).filter(x=>x.cur!==null||x.prev!==null).sort((a,b)=>(b.cur??-1)-(a.cur??-1));
    return `<section class="progressionPanel"><h3>📈 Progression semaine après semaine</h3><p>Comparaison de cette semaine avec la semaine précédente.</p><div class="progressSectionGrid">${sections.map(x=>`<div class="progressSection"><b>${GROUPS[x.gk].title}</b>${deltaHtml(x.cur,x.prev)}</div>`).join('')}</div><details class="progressDetails"><summary>Détail de la progression par action</summary><div class="progressActionList">${actions.map(x=>`<div class="progressAction"><span>${x.task[1]} ${x.task[2]}</span>${deltaHtml(x.cur,x.prev)}</div>`).join('')}</div></details></section>`;
  }

  function streaksHtml(){
    const items=enabledRatedTasks().map(x=>({...x,...taskSeries(x.task[0])})).filter(x=>x.best>0).sort((a,b)=>b.best-a.best);
    return `<section class="streakPanel"><h3>🔥 Séries & records</h3><p>Une série continue lorsqu'une action obtient au moins 😊 sur des journées clôturées consécutives.</p><div class="streakGrid">${items.slice(0,12).map(x=>`<div class="streakCard"><span>${x.task[1]}</span><b>${x.task[2]}</b><div>🔥 Série actuelle : <strong>${x.current}</strong></div><small>🏆 Record : ${x.best} jour${x.best>1?'s':''}</small></div>`).join('')||'<p>Les premières séries apparaîtront ici.</p>'}</div></section>`;
  }

  const previousRenderStats=window.renderStats;
  window.renderStats=function(){
    previousRenderStats();
    const host=document.getElementById('statsInfo');if(host)host.insertAdjacentHTML('beforeend',progressionHtml()+streaksHtml());
  };

  function rewardForWeek(mondayDate,eligible){
    if(!eligible)return '🔒 Récompense non débloquée';
    if(cfg.rewardMode!=='random')return cfg.reward||'🎁 Récompense surprise';
    const wk=key(mondayDate);cfg.weeklyRewards??={};
    if(!cfg.weeklyRewards[wk]){cfg.weeklyRewards[wk]=RANDOM_REWARDS[Math.floor(Math.random()*RANDOM_REWARDS.length)];save()}
    return cfg.weeklyRewards[wk];
  }
  function weeklySummary(offset=0){
    const m=add(weekMonday(new Date()),offset*7),recs=weekRecords(offset),closed=recs.filter(([,d])=>d.closed),avg=closed.length?Math.round(closed.reduce((n,[,d])=>n+percent(score(d.state||{}),maxScore()),0)/closed.length):0;
    const prev=weekRecords(offset-1).filter(([,d])=>d.closed),prevAvg=prev.length?Math.round(prev.reduce((n,[,d])=>n+percent(score(d.state||{}),maxScore()),0)/prev.length):null;
    const tasks=enabledRatedTasks().map(x=>({...x,p:pctForTask(recs,x.task[0])})).filter(x=>x.p!==null).sort((a,b)=>b.p-a.p);
    const best=tasks[0],work=tasks[chooseWorkIndex(tasks)];
    const eligible=closed.length>=5&&avg>=(Number(cfg.weeklyRewardThreshold)||70);
    return `<section class="weeklySummary"><div class="weeklySummaryTitle">🏆 Bilan de la semaine</div><div class="weeklySummaryMetrics"><div><b>${closed.length}</b><small>jours clôturés</small></div><div><b>${avg}%</b><small>moyenne</small></div><div><b>${prevAvg===null?'—':`${avg-prevAvg>=0?'+':''}${avg-prevAvg}`}</b><small>vs semaine précédente</small></div></div>${best?`<p>🌟 <b>Point fort :</b> ${best.task[1]} ${best.task[2]} (${best.p}%)</p>`:''}${work?`<p>💪 <b>À travailler :</b> ${work.task[1]} ${work.task[2]} (${work.p}%)</p>`:''}<div class="weeklyReward ${eligible?'unlocked':'locked'}"><b>${eligible?'🎁 Récompense débloquée':'🔒 Objectif récompense'}</b><span>${eligible?rewardForWeek(m,eligible):`Atteindre ${cfg.weeklyRewardThreshold}% avec au moins 5 journées clôturées`}</span></div></section>`;
  }
  function chooseWorkIndex(tasks){return tasks.length?tasks.length-1:0}

  const previousRenderWeek=window.renderWeek;
  window.renderWeek=function(){previousRenderWeek();const info=document.getElementById('weekInfo');if(info)info.insertAdjacentHTML('afterend',weeklySummary(weekOffset))};

  /* Notes parentales : ajoutées au détail historique existant. */
  const previousOpenDayDetail=window.openDayDetail;
  window.openDayDetail=function(dayKey){
    previousOpenDayDetail(dayKey);
    const modal=document.querySelector('#historyDetailOverlay .historyDetailModal');if(!modal)return;
    const close=modal.querySelector('.historyBottomClose');
    const note=document.createElement('section');note.className='parentNote';
    note.innerHTML=`<h3>📝 Note parentale</h3><p>Contexte utile : fatigue, changement de rythme, maladie, sortie, humeur…</p><textarea maxlength="800" placeholder="Ajouter une note sur cette journée…" oninput="saveParentNote('${dayKey}',this.value)">${escapeHtml(db.days[dayKey]?.note||'')}</textarea><small>Enregistré automatiquement</small>`;
    if(close)modal.insertBefore(note,close);else modal.appendChild(note);
  };
  window.saveParentNote=function(dayKey,value){if(db.days[dayKey]){db.days[dayKey].note=value;save()}};
  function escapeHtml(v){return String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}

  /* Badges progressifs. */
  function greatCount(id){return Object.values(db.days).filter(d=>d.closed&&d.state?.[id]===2).length}
  function addTierFamily(prefix,icon,label,id,thresholds){const rar=['bronze','silver','gold'];thresholds.forEach((n,i)=>{if(!BADGES.some(b=>b[0]===`${prefix}${n}`))BADGES.push([`${prefix}${n}`,icon,`${label} ${['🥉','🥈','🥇'][i]}`,rar[i],()=>greatCount(id)>=n])})}
  addTierFamily('kind','💛','Cœur gentil','talk',[3,10,25]);
  addTierFamily('nohit','✋','Mains douces','no-hit',[3,10,30]);
  addTierFamily('tidyTier','🧸','Champion du rangement','tidy',[3,10,25]);
  addTierFamily('calmTier','🧘','Maître du calme','calm',[3,10,25]);
  addTierFamily('teethTier','🪥','Super brossage','evening-teeth',[3,10,30]);

  function weightingRows(){return enabledRatedTasks().map(x=>`<div class="weightRow"><span>${x.task[1]} ${x.task[2]}</span><select onchange="cfg.taskWeights['${x.task[0]}']=Number(this.value);save()" ${cfg.weightingEnabled?'':'disabled'}><option value="1" ${(cfg.taskWeights[x.task[0]]||1)==1?'selected':''}>Normal ×1</option><option value="1.5" ${cfg.taskWeights[x.task[0]]==1.5?'selected':''}>Important ×1,5</option><option value="2" ${cfg.taskWeights[x.task[0]]==2?'selected':''}>Prioritaire ×2</option></select></div>`).join('')}
  function challengeOptions(){return enabledRatedTasks().map(x=>`<option value="${x.task[0]}" ${cfg.weeklyChallenge.taskId===x.task[0]?'selected':''}>${x.task[1]} ${x.task[2]}</option>`).join('')}
  function growthSettings(){return `<div class="settingsGroup growthSettings"><h3>🎯 Défi hebdomadaire</h3><p>Le défi apparaît aussi dans l'interface de l'enfant.</p><select class="field" onchange="cfg.weeklyChallenge.taskId=this.value;save();render()"><option value="">Aucun défi</option>${challengeOptions()}</select><div class="settingInline"><span>Nombre de 🌟 à obtenir</span><select onchange="cfg.weeklyChallenge.target=Number(this.value);save();render()">${[3,4,5,6,7].map(n=>`<option ${cfg.weeklyChallenge.target==n?'selected':''}>${n}</option>`).join('')}</select></div></div><div class="settingsGroup growthSettings"><h3>🎁 Récompense hebdomadaire</h3><label class="rewardMode"><input type="radio" name="rewardMode" value="custom" ${cfg.rewardMode==='custom'?'checked':''} onchange="cfg.rewardMode='custom';save();render()"> Je choisis la récompense</label><label class="rewardMode"><input type="radio" name="rewardMode" value="random" ${cfg.rewardMode==='random'?'checked':''} onchange="cfg.rewardMode='random';save();render()"> 🎲 Tirer une récompense familiale aléatoire</label><div class="settingInline"><span>Seuil hebdomadaire</span><select onchange="cfg.weeklyRewardThreshold=Number(this.value);save();render()">${[60,65,70,75,80,85].map(n=>`<option value="${n}" ${cfg.weeklyRewardThreshold==n?'selected':''}>${n}%</option>`).join('')}</select></div>${cfg.rewardMode==='random'?`<details><summary>Voir les récompenses possibles</summary><ul class="rewardExamples">${RANDOM_REWARDS.map(x=>`<li>${x}</li>`).join('')}</ul></details>`:''}</div><div class="settingsGroup growthSettings"><h3>⚖️ Pondération du score</h3><div class="featureOffNote">Option disponible mais désactivée par défaut.</div><label class="weightToggle"><input type="checkbox" ${cfg.weightingEnabled?'checked':''} onchange="cfg.weightingEnabled=this.checked;save();render()"> Activer la pondération</label><div class="weightRows">${weightingRows()}</div></div>`}

  const previousRenderSettings=window.renderSettings;
  window.renderSettings=function(){
    previousRenderSettings();
    const host=document.getElementById('settingsView')?.querySelector('.box');if(!host)return;
    host.querySelectorAll('.growthSettings').forEach(x=>x.remove());
    const backup=Array.from(host.querySelectorAll('.settingsGroup')).find(x=>x.textContent.includes('Sauvegarde'));
    const holder=document.createElement('div');holder.innerHTML=growthSettings();
    Array.from(holder.children).forEach(el=>backup?host.insertBefore(el,backup):host.appendChild(el));
  };

  /* Re-render final pour activer les nouveaux blocs. */
  if(typeof render==='function')render();
})();