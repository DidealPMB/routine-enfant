/* Commercial V2 : organisation visuelle des paramètres par familles. */
(function(){
  const CATS=[
    {id:'family',icon:'👤',title:'Famille & profil',desc:'Profils, identité de l’enfant et accès parents.',keys:['profil','avatar','code parent']},
    {id:'routines',icon:'🧩',title:'Routines',desc:'Blocs, missions, planning et packs prêts à l’emploi.',keys:['packs de routines','missions personnalisées','planning par jour','blocs','missions','propreté','école','devoir']},
    {id:'child',icon:'🎮',title:'Expérience enfant',desc:'Ce que l’enfant voit et utilise dans son espace.',keys:['mode enfant','carte d’aventure','défi','progression','badge','série','timer']},
    {id:'rewards',icon:'🎁',title:'Récompenses',desc:'Étoiles, récompenses, boutique et coffres.',keys:['récompense hebdomadaire','récompense','boutique','coffres','pondération','score']},
    {id:'app',icon:'⚙️',title:'Application & données',desc:'Sauvegarde, options générales et réglages techniques.',keys:['sauvegarde','note parentale','préférence','données']}
  ];
  function clean(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')}
  function categoryFor(group){const title=clean(group.querySelector(':scope>h3')?.textContent);for(const c of CATS){if(c.keys.some(k=>title.includes(clean(k))))return c.id}return 'app'}
  function build(host){
    host.querySelectorAll(':scope>.settingsCategory').forEach(cat=>{cat.querySelectorAll(':scope>.settingsCategoryGrid>.settingsGroup').forEach(g=>host.appendChild(g));cat.remove()});
    const groups=[...host.querySelectorAll(':scope>.settingsGroup')].filter(g=>getComputedStyle(g).display!=='none'||!g.classList.contains('legacyHidden'));
    if(!groups.length)return;
    const anchor=host.querySelector(':scope>h2');
    CATS.forEach(c=>{
      const members=groups.filter(g=>categoryFor(g)===c.id);
      if(!members.length)return;
      const section=document.createElement('section');section.className=`settingsCategory settingsCategory-${c.id}`;section.dataset.category=c.id;
      section.innerHTML=`<div class="settingsCategoryHead"><div class="settingsCategoryIcon">${c.icon}</div><div><h3>${c.title}</h3><p>${c.desc}</p></div></div><div class="settingsCategoryGrid"></div>`;
      const grid=section.querySelector('.settingsCategoryGrid');members.forEach(g=>grid.appendChild(g));host.appendChild(section)
    });
    if(anchor)host.insertBefore(anchor,host.firstChild);
  }
  function enhanceControls(host){
    host.querySelectorAll('.settingsGroup').forEach(g=>{
      const rows=[...g.children].filter(el=>el.matches?.('.toggleRow,.settingInline'));
      if(rows.length>=2)g.classList.add('settingsCompactRows');
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