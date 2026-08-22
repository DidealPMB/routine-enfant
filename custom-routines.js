/* Commercial V2 : missions personnalisées + planning hebdomadaire. */
(function(){
  const DAYS=[['1','Lun'],['2','Mar'],['3','Mer'],['4','Jeu'],['5','Ven'],['6','Sam'],['7','Dim']];
  const DEFAULT_DAYS=['1','2','3','4','5','6','7'];
  function ensure(c){
    c.customTasks??=[];
    c.taskSchedules??={};
    c.customTasks.forEach(t=>{c.tasks[t.id]??=true;c.taskSchedules[t.id]??=DEFAULT_DAYS.slice()});
  }
  app.profiles.forEach(p=>ensure(p.cfg||(p.cfg={})));bind();ensure(cfg);

  function syncCustomTasks(){
    for(const gk of ORDER){const g=GROUPS[gk];if(!g)continue;g.tasks=g.tasks.filter(t=>!String(t[0]).startsWith('custom-'))}
    for(const t of cfg.customTasks){
      if(!GROUPS[t.group])continue;
      GROUPS[t.group].tasks.push([t.id,t.emoji||'⭐',t.label]);
      cfg.tasks[t.id]??=true;
      cfg.taskSchedules[t.id]??=DEFAULT_DAYS.slice();
    }
  }
  syncCustomTasks();save();

  function weekdayForDate(d=new Date()){const n=d.getDay();return String(n===0?7:n)}
  window.taskScheduledOn=function(id,d=new Date()){
    const days=cfg.taskSchedules?.[id];
    if(!days||!days.length)return true;
    return days.includes(weekdayForDate(d));
  };

  const priorActiveIds=window.activeIds;
  window.activeIds=function(){return priorActiveIds().filter(id=>taskScheduledOn(id,new Date()))};

  const priorRenderToday=window.renderToday;
  window.renderToday=function(){
    syncCustomTasks();
    const changed=[];
    for(const gk of ORDER){const g=GROUPS[gk];if(!g)continue;for(const t of g.tasks){const id=t[0];if(cfg.tasks[id]!==false&&!taskScheduledOn(id,new Date())){changed.push([id,cfg.tasks[id]]);cfg.tasks[id]=false}}}
    priorRenderToday();
    changed.forEach(([id,v])=>cfg.tasks[id]=v);
  };

  function groupOptions(selected){return ORDER.filter(k=>GROUPS[k]&&GROUPS[k].type!=='potty').map(k=>`<option value="${k}" ${k===selected?'selected':''}>${GROUPS[k].title}</option>`).join('')}
  function dayChecks(id,days){return `<div class="scheduleDays">${DAYS.map(([v,l])=>`<label class="dayToggle"><input type="checkbox" ${days.includes(v)?'checked':''} onchange="toggleTaskDay('${id}','${v}',this.checked)"><span>${l}</span></label>`).join('')}</div>`}
  function customTaskRows(){
    if(!cfg.customTasks.length)return '<p class="muted">Aucune mission personnalisée pour le moment.</p>';
    return cfg.customTasks.map(t=>`<div class="customTaskRow"><div class="customTaskMain"><span class="customTaskEmoji">${t.emoji||'⭐'}</span><div><b>${t.label}</b><small>${GROUPS[t.group]?.title||t.group}</small></div></div>${dayChecks(t.id,cfg.taskSchedules[t.id]||DEFAULT_DAYS)}<button class="btn dangerBtn" onclick="deleteCustomTask('${t.id}')">Supprimer</button></div>`).join('')
  }
  function plannerRows(){
    const rows=[];
    for(const gk of ORDER){const g=GROUPS[gk];if(!g||g.type==='potty')continue;for(const t of g.tasks){if(cfg.tasks[t[0]]===false)continue;rows.push(`<div class="plannerRow"><div><span>${t[1]}</span><b>${t[2]}</b><small>${g.title}</small></div>${dayChecks(t[0],cfg.taskSchedules[t[0]]||DEFAULT_DAYS)}</div>`)}}
    return rows.join('')
  }
  function settingsHtml(){return `<div class="settingsGroup customRoutineSettings"><h3>🛠️ Missions personnalisées</h3><div class="customCreateGrid"><input id="customEmoji" class="field emojiInput" maxlength="4" value="⭐" aria-label="Emoji"><input id="customLabel" class="field" maxlength="45" placeholder="Ex. Je prépare mon cartable"><select id="customGroup" class="field">${groupOptions('morning')}</select><button class="btn primaryBtn" onclick="createCustomTask()">＋ Ajouter la mission</button></div><div id="customTaskList">${customTaskRows()}</div></div><div class="settingsGroup weeklyPlannerSettings"><h3>📆 Planning par jour</h3><p>Choisis les jours où chaque mission doit apparaître. Une mission non prévue aujourd'hui ne compte pas dans le score du jour.</p><div class="plannerActions"><button class="btn" onclick="setAllSchedules('week')">École Lun–Ven</button><button class="btn" onclick="setAllSchedules('all')">Tous les jours</button></div><div class="plannerList">${plannerRows()}</div></div>`}

  window.createCustomTask=function(){
    const label=document.getElementById('customLabel')?.value.trim(),emoji=document.getElementById('customEmoji')?.value.trim()||'⭐',group=document.getElementById('customGroup')?.value;
    if(!label||!GROUPS[group])return alert('Indique un nom de mission et une section.');
    const id='custom-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,5);
    cfg.customTasks.push({id,label,emoji,group,createdAt:new Date().toISOString()});cfg.tasks[id]=true;cfg.taskSchedules[id]=DEFAULT_DAYS.slice();syncCustomTasks();save();render();showView('settings');
  };
  window.deleteCustomTask=function(id){if(!confirm('Supprimer cette mission personnalisée ? Son historique déjà enregistré sera conservé.'))return;cfg.customTasks=cfg.customTasks.filter(t=>t.id!==id);cfg.tasks[id]=false;delete cfg.taskSchedules[id];syncCustomTasks();save();render();showView('settings')};
  window.toggleTaskDay=function(id,day,on){cfg.taskSchedules??={};const s=new Set(cfg.taskSchedules[id]||DEFAULT_DAYS);on?s.add(day):s.delete(day);cfg.taskSchedules[id]=DAYS.map(x=>x[0]).filter(x=>s.has(x));save();renderToday()};
  window.setAllSchedules=function(mode){const days=mode==='week'?['1','2','3','4','5']:DEFAULT_DAYS.slice();for(const gk of ORDER){const g=GROUPS[gk];if(!g||g.type==='potty')continue;for(const t of g.tasks){if(cfg.tasks[t[0]]!==false)cfg.taskSchedules[t[0]]=days.slice()}}save();render();showView('settings')};

  function injectSettings(){
    syncCustomTasks();const box=document.querySelector('#settingsView > .box');if(!box)return;
    box.querySelectorAll('.customRoutineSettings,.weeklyPlannerSettings').forEach(x=>x.remove());
    box.insertAdjacentHTML('beforeend',settingsHtml());
    box.querySelectorAll('.customRoutineSettings,.weeklyPlannerSettings').forEach(group=>{const title=group.querySelector(':scope > h3');if(!title)return;title.classList.add('settingsAccordionTitle');title.insertAdjacentHTML('beforeend','<span class="settingsChevron">⌄</span>');group.classList.add('settingsCollapsed');title.addEventListener('click',()=>group.classList.toggle('settingsCollapsed'))});
  }
  const priorRenderSettings=window.renderSettings;
  window.renderSettings=function(){priorRenderSettings();injectSettings()};
  injectSettings();render();
})();