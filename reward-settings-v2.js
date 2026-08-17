/* Récompenses V2 + paramètres repliables. Chargé en dernier pour surcharger l'ancien bilan sans casser les données. */
(function(){
  const REWARDS=[
    '🎬 Choisir le film de la soirée','📚 Une histoire supplémentaire','🎲 Choisir un jeu en famille','🎵 Choisir la musique','🌳 Une sortie au parc','🍰 Choisir le dessert','🎨 Choisir une activité créative','🕺 Mini soirée dansante','🥞 Choisir le petit-déjeuner du week-end','⛺ Faire une cabane dans le salon'
  ];

  function ensureRewardCfg(c){
    // Migration du réglage initial, jugé trop permissif.
    if(c.weeklyRewardThreshold===undefined || c.weeklyRewardThreshold===70)c.weeklyRewardThreshold=80;
    c.weeklyRewardMinDays ??= 6;
    c.weeklyRewards ??= {};
    c.rewardMode ??= 'custom';
  }
  app.profiles.forEach(p=>ensureRewardCfg(p.cfg||(p.cfg={})));bind();ensureRewardCfg(cfg);save();

  function knownRatedIds(){
    const ids=[];
    for(const gk of ORDER){
      const g=GROUPS[gk]; if(!g||!cfg.blocks[gk])continue;
      for(const t of g.tasks){
        if(cfg.tasks[t[0]]===false)continue;
        if(g.type==='potty'){
          const pk=t[0]==='pot-pee'?'pee':'poop';
          if(cfg.pottyMode[pk]==='counter')continue;
        }
        ids.push(t[0]);
      }
    }
    return ids;
  }
  function weightFor(id){return cfg.weightingEnabled ? (Number(cfg.taskWeights?.[id])||1) : 1}
  function makeSnapshot(day){
    const ids=knownRatedIds();
    let earned=0,max=0;
    ids.forEach(id=>{const w=weightFor(id);max+=2*w;earned+=(day.state?.[id]??0)*w});
    return {earned,max,taskCount:ids.length,createdAt:new Date().toISOString(),weighting:!!cfg.weightingEnabled};
  }
  function legacySnapshot(day){
    // Pour les anciennes journées, on ne peut pas connaître les missions non encore créées à l'époque.
    // On utilise donc uniquement les missions effectivement présentes dans l'historique.
    const known=new Set();Object.values(GROUPS).forEach(g=>g.tasks.forEach(t=>known.add(t[0])));
    const ids=Object.keys(day.state||{}).filter(id=>known.has(id));
    let earned=0,max=0;
    ids.forEach(id=>{const w=1;max+=2*w;earned+=(day.state?.[id]??0)*w});
    return {earned,max,taskCount:ids.length,legacy:true};
  }
  function dayRewardSnapshot(day){return day.rewardSnapshot?.max>0?day.rewardSnapshot:legacySnapshot(day)}

  // Dorénavant chaque journée clôturée mémorise le barème réellement applicable ce jour-là.
  const previousFinishDay=window.finishDay;
  window.finishDay=function(){
    const d=db.days[key()],wasClosed=!!d.closed;
    previousFinishDay();
    if(!wasClosed && d.closed && !d.rewardSnapshot){d.rewardSnapshot=makeSnapshot(d);save();}
  };

  function weekMonday(date=new Date()){return monday(date)}
  function recordsForOffset(offset){const m=add(weekMonday(new Date()),offset*7),start=key(m),end=key(add(m,6));return allDays().filter(([k])=>k>=start&&k<=end)}
  function weekRewardScore(offset){
    const closed=recordsForOffset(offset).filter(([,d])=>d.closed);
    let earned=0,max=0,tasks=0;
    closed.forEach(([,d])=>{const s=dayRewardSnapshot(d);earned+=s.earned;max+=s.max;tasks+=s.taskCount||0});
    return {closed:closed.length,earned,max,tasks,pct:max?Math.round(earned/max*100):0};
  }
  function rewardForWeek(m,eligible){
    if(!eligible)return '';
    if(cfg.rewardMode!=='random')return cfg.reward||'🎁 Récompense surprise';
    const wk=key(m);if(!cfg.weeklyRewards[wk]){cfg.weeklyRewards[wk]=REWARDS[Math.floor(Math.random()*REWARDS.length)];save()}return cfg.weeklyRewards[wk];
  }
  function levelLegend(){return `<div class="rewardLegend"><span>🌟 Très bien = <b>100%</b></span><span>😊 Moyen / avec aide = <b>50%</b></span><span>☁️ Difficile = <b>0%</b></span><span>Mission non renseignée sur une nouvelle journée clôturée = <b>0%</b></span></div>`}
  function weeklyRewardHtml(offset){
    const m=add(weekMonday(new Date()),offset*7),s=weekRewardScore(offset),threshold=Number(cfg.weeklyRewardThreshold)||80,minDays=Number(cfg.weeklyRewardMinDays)||6;
    const enoughDays=s.closed>=minDays,scoreOk=s.pct>=threshold,eligible=enoughDays&&scoreOk;
    const reward=rewardForWeek(m,eligible),remaining=Math.max(0,threshold-s.pct);
    return `<section class="weeklySummary weeklySummaryV2"><div class="weeklySummaryTitle">🎁 Récompense de la semaine</div><div class="weeklyRewardScore"><div class="weeklyRewardGauge"><i style="width:${Math.min(100,s.pct)}%"></i></div><strong>${s.pct}%</strong></div><div class="weeklySummaryMetrics"><div><b>${s.closed}/${minDays}</b><small>jours minimum</small></div><div><b>${s.tasks}</b><small>évaluations prises en compte</small></div><div><b>${threshold}%</b><small>objectif réglé</small></div></div>${levelLegend()}<div class="weeklyReward ${eligible?'unlocked':'locked'}"><b>${eligible?'🏆 Récompense débloquée':'🔒 Pas encore débloquée'}</b><span>${eligible?reward:!enoughDays?`Il faut encore ${minDays-s.closed} journée(s) clôturée(s).`:`Encore ${remaining} point(s) de pourcentage pour atteindre ${threshold}%.`}</span></div></section>`;
  }

  const previousRenderWeek=window.renderWeek;
  window.renderWeek=function(){
    previousRenderWeek();
    document.querySelectorAll('#weekView .weeklySummary').forEach(x=>x.remove());
    const info=document.getElementById('weekInfo');if(info)info.insertAdjacentHTML('afterend',weeklyRewardHtml(weekOffset));
  };

  function rewardSettingsHtml(){
    const thresholds=[60,65,70,75,80,85,90,95];
    return `<h3>🎁 Récompense hebdomadaire</h3><p>La récompense est calculée sur l'ensemble des évaluations des journées clôturées de la semaine.</p>${levelLegend()}<div class="settingInline"><span>Pourcentage minimum de réussite</span><select onchange="cfg.weeklyRewardThreshold=Number(this.value);save();render()">${thresholds.map(n=>`<option value="${n}" ${Number(cfg.weeklyRewardThreshold)===n?'selected':''}>${n}%</option>`).join('')}</select></div><div class="settingInline"><span>Journées clôturées minimum</span><select onchange="cfg.weeklyRewardMinDays=Number(this.value);save();render()">${[3,4,5,6,7].map(n=>`<option value="${n}" ${Number(cfg.weeklyRewardMinDays)===n?'selected':''}>${n} jour${n>1?'s':''}</option>`).join('')}</select></div><label class="rewardMode"><input type="radio" name="rewardMode2" ${cfg.rewardMode==='custom'?'checked':''} onchange="cfg.rewardMode='custom';save();render()"> Je choisis la récompense</label><label class="rewardMode"><input type="radio" name="rewardMode2" ${cfg.rewardMode==='random'?'checked':''} onchange="cfg.rewardMode='random';save();render()"> 🎲 Récompense familiale aléatoire</label>${cfg.rewardMode==='random'?`<details class="rewardExamplesDetails"><summary>Voir les récompenses possibles</summary><ul>${REWARDS.map(r=>`<li>${r}</li>`).join('')}</ul></details>`:''}`;
  }

  function setupCollapsibles(){
    const groups=document.querySelectorAll('#settingsView .settingsGroup');
    groups.forEach((group,i)=>{
      const h=group.querySelector(':scope > h3');if(!h)return;
      if(h.textContent.includes('Récompense hebdomadaire'))group.innerHTML=rewardSettingsHtml();
      const title=group.querySelector(':scope > h3');if(!title)return;
      title.classList.add('settingsAccordionTitle');
      if(!title.querySelector('.settingsChevron'))title.insertAdjacentHTML('beforeend','<span class="settingsChevron">⌄</span>');
      if(!group.dataset.accordionReady){group.dataset.accordionReady='1';group.classList.add('settingsCollapsed');title.addEventListener('click',()=>group.classList.toggle('settingsCollapsed'))}
    });
  }

  const previousRenderSettings=window.renderSettings;
  window.renderSettings=function(){previousRenderSettings();setupCollapsibles()};

  // Premier affichage.
  if(typeof renderSettings==='function')renderSettings();
  if(typeof renderWeek==='function')renderWeek();
})();