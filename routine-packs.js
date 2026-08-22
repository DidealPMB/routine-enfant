/* Commercial V2 : packs de routines prêts à l'emploi. */
(function(){
const ALL=['1','2','3','4','5','6','7'],WEEK=['1','2','3','4','5'],WEEKEND=['6','7'];
const PACKS={
 preschool:{icon:'🧸',name:'3–5 ans',desc:'Routine simple pour autonomie, repas, calme et coucher.',groups:['morning','midday','nap','evening','potty','behavior'],days:ALL},
 school:{icon:'🎒',name:'Matin école',desc:'Les essentiels avant de partir à l’école.',groups:['morning'],days:WEEK},
 bedtime:{icon:'🌙',name:'Coucher',desc:'Repas du soir, hygiène, pyjama et coucher.',groups:['evening'],days:ALL},
 potty:{icon:'🚽',name:'Propreté',desc:'Pipi et caca sur le pot.',groups:['potty'],days:ALL},
 autonomy:{icon:'🌟',name:'Autonomie',desc:'Active les routines quotidiennes et les comportements positifs.',groups:['morning','midday','nap','evening','behavior'],days:ALL},
 weekend:{icon:'🏡',name:'Week-end',desc:'Routine plus légère pour samedi et dimanche.',groups:['morning','midday','evening','behavior'],days:WEEKEND},
 schoolwork:{icon:'📚',name:'Retour d’école & devoirs',desc:'Active les sections école/devoirs disponibles et les comportements.',groups:['school','homework','behavior'],days:WEEK}
};
function ensure(c){c.routinePacks??={};c.packBehavior??='merge'}
app.profiles.forEach(p=>ensure(p.cfg||(p.cfg={})));bind();ensure(cfg);save();
function tasksForGroup(gk){return GROUPS[gk]?.tasks||[]}
function applyPackData(pack,mode){ensure(cfg);cfg.taskSchedules??={};if(mode==='replace'){Object.keys(cfg.blocks).forEach(k=>cfg.blocks[k]=false);Object.keys(cfg.tasks).forEach(k=>cfg.tasks[k]=false)}for(const gk of pack.groups){if(!GROUPS[gk])continue;cfg.blocks[gk]=true;for(const t of tasksForGroup(gk)){cfg.tasks[t[0]]=true;cfg.taskSchedules[t[0]]=pack.days.slice()}}}
window.applyRoutinePack=function(id){const p=PACKS[id];if(!p)return;const mode=cfg.packBehavior||'merge';const verb=mode==='replace'?'remplacer la configuration actuelle':'ajouter ce pack à la configuration actuelle';if(!confirm(`${p.icon} ${p.name}\n\nVoulez-vous ${verb} ?`))return;applyPackData(p,mode);cfg.routinePacks[id]={appliedAt:new Date().toISOString()};save();render();showView('settings')};
function packCards(){return Object.entries(PACKS).map(([id,p])=>`<div class="routinePackCard"><div class="routinePackIcon">${p.icon}</div><div class="routinePackText"><b>${p.name}</b><small>${p.desc}</small></div><button class="btn primaryBtn" onclick="applyRoutinePack('${id}')">Activer</button></div>`).join('')}
function html(){return `<div class="settingsGroup routinePackSettings"><h3>🧩 Packs de routines</h3><p>Des bases prêtes à l'emploi. Après activation, chaque mission et chaque jour restent entièrement modifiables.</p><div class="settingInline"><span>Lors de l’activation d’un pack</span><select onchange="cfg.packBehavior=this.value;save()"><option value="merge" ${cfg.packBehavior==='merge'?'selected':''}>Ajouter à ma configuration</option><option value="replace" ${cfg.packBehavior==='replace'?'selected':''}>Remplacer ma configuration</option></select></div><div class="routinePackGrid">${packCards()}</div></div>`}
function inject(){const box=document.querySelector('#settingsView > .box');if(!box)return;box.querySelector('.routinePackSettings')?.remove();const holder=document.createElement('div');holder.innerHTML=html();const n=holder.firstElementChild;n.classList.add('settingsCollapsed');const h=n.querySelector('h3');h.classList.add('settingsAccordionTitle');h.insertAdjacentHTML('beforeend','<span class="settingsChevron">⌄</span>');h.addEventListener('click',()=>n.classList.toggle('settingsCollapsed'));const custom=box.querySelector('.customRoutineSettings');custom?box.insertBefore(n,custom):box.appendChild(n)}
const prev=window.renderSettings;window.renderSettings=function(){prev();ensure(cfg);inject()};inject();
})();