/* Commercial V2 : organisation visuelle des paramètres par familles. */
(function(){
  const CATS=[
    {id:'family',icon:'👤',title:'Famille & profil',desc:'Profils, identité de l’enfant et avatar.',keys:['profil','avatar']},
    {id:'routines',icon:'🧩',title:'Routines',desc:'Blocs, missions, planning et packs prêts à l’emploi.',keys:['packs de routines','missions personnalisées','planning par jour','blocs','missions','propreté','école','devoir']},
    {id:'child',icon:'🎮',title:'Expérience enfant',desc:'Ce que l’enfant voit et utilise dans son espace.',keys:['mode enfant','carte d’aventure','défi','progression','badge','série','timer']},
    {id:'rewards',icon:'🎁',title:'Récompenses',desc:'Étoiles, récompenses, boutique et coffres.',keys:['récompense hebdomadaire','récompense','boutique','coffres','pondération','score']},
    {id:'app',icon:'⚙️',title:'Application & données',desc:'Sécurité, sauvegarde, options générales et données.',keys:['code parent','sauvegarde','note parentale','préférence','données']}
  ];
  const WIDE_KEYS=['profil & avatar','avatar evolutif','planning par jour','missions personnalisees','missions','packs de routines','boutique de recompenses','carte d’aventure'];
  const OPEN_KEY='champion.settings.categories.v2';
  function clean(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')}
  function categoryFor(group){const title=clean(group.querySelector(':scope>h3')?.textContent);for(const c of CATS){if(c.keys.some(k=>title.includes(clean(k))))return c.id}return 'app'}
  function groupTitle(g){return clean(g.querySelector(':scope>h3')?.textContent)}
  function isWide(g){const t=groupTitle(g);return WIDE_KEYS.some(k=>t.includes(clean(k))) || g.classList.contains('profileAvatarSettings') || g.classList.contains('weeklyPlannerSettings') || g.classList.contains('customRoutineSettings')}
  function readOpen(){try{return JSON.parse(localStorage.getItem(OPEN_KEY)||'{}')}catch(e){return{}}}
  function writeOpen(v){try{localStorage.setItem(OPEN_KEY,JSON.stringify(v))}catch(e){}}
  function setCategoryOpen(section,open){section.classList.toggle('categoryCollapsed',!open);section.setAttribute('aria-expanded',open?'true':'false');const c=section.querySelector('.settingsCategoryChevron');if(c)c.textContent=open?'⌃':'⌄'}
  function bindCategory(section){const head=section.querySelector('.settingsCategoryHead');if(!head||head.dataset.bound)return;head.dataset.bound='1';head.setAttribute('role','button');head.setAttribute('tabindex','0');const toggle=()=>{const open=section.classList.contains('categoryCollapsed');setCategoryOpen(section,open);const state=readOpen();state[section.dataset.category]=open;writeOpen(state)};head.addEventListener('click',toggle);head.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle()}})}
  function build(host){
    const previous=readOpen();
    host.querySelectorAll(':scope>.settingsCategory').forEach(cat=>{cat.querySelectorAll(':scope>.settingsCategoryGrid>.settingsGroup').forEach(g=>host.appendChild(g));cat.remove()});
    const groups=[...host.querySelectorAll(':scope>.settingsGroup')].filter(g=>getComputedStyle(g).display!=='none'||!g.classList.contains('legacyHidden'));
    if(!groups.length)return;
    const anchor=host.querySelector(':scope>h2');
    CATS.forEach(c=>{
      const members=groups.filter(g=>categoryFor(g)===c.id);
      if(!members.length)return;
      const section=document.createElement('section');section.className=`settingsCategory settingsCategory-${c.id}`;section.dataset.category=c.id;
      section.innerHTML=`<div class="settingsCategoryHead"><div class="settingsCategoryIcon">${c.icon}</div><div class="settingsCategoryText"><h3>${c.title}</h3><p>${c.desc}</p></div><div class="settingsCategoryMeta"><span>${members.length} rubrique${members.length>1?'s':''}</span><b class="settingsCategoryChevron">⌃</b></div></div><div class="settingsCategoryGrid"></div>`;
      const grid=section.querySelector('.settingsCategoryGrid');members.forEach(g=>{g.classList.toggle('settingsWideGroup',isWide(g));grid.appendChild(g)});host.appendChild(section);
      const defaultOpen=c.id==='family'||c.id==='routines';setCategoryOpen(section,previous[c.id]===undefined?defaultOpen:!!previous[c.id]);bindCategory(section)
    });
    if(anchor)host.insertBefore(anchor,host.firstChild);
  }
  function enhanceControls(host){
    host.querySelectorAll('.settingsGroup').forEach(g=>{
      const rows=[...g.children].filter(el=>el.matches?.('.toggleRow,.settingInline'));
      g.classList.toggle('settingsCompactRows',rows.length>=2 && !g.classList.contains('weeklyPlannerSettings'));
      g.querySelectorAll('input[type="checkbox"]').forEach(i=>{const l=i.closest('label');if(l)l.classList.add('touchToggle')});
      g.querySelectorAll('.btn').forEach(b=>b.classList.add('touchBtn'));
    });
    const block=document.getElementById('blockSettings');if(block)block.classList.add('settingsOptionGrid');
    const task=document.getElementById('taskSettings');if(task)task.classList.add('settingsTaskGrid');
  }
  function organize(){const host=document.querySelector('#settingsView>.box');if(!host)return;build(host);enhanceControls(host)}
  const prev=window.renderSettings;window.renderSettings=function(){prev();requestAnimationFrame(()=>{organize();setTimeout(organize,0)})};
  const oldShow=window.showView;window.showView=function(v){oldShow(v);if(v==='settings')setTimeout(organize,0)};
  setTimeout(organize,50);
})();