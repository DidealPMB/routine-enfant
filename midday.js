/* Routines repas + ordre chronologique de la journée. */
(function(){
  const midday={
    title:'🍽️ Midi',
    type:'routine',
    tasks:[
      ['lunch-set-table','🍴','Je mets la table'],
      ['lunch-sit-well','🪑','Je me tiens bien à table'],
      ['lunch-taste','🥕','Je goûte ce qu’on me propose'],
      ['lunch-eat-calm','😋','Je mange calmement'],
      ['lunch-clear-table','🧺','Je débarrasse la table'],
      ['lunch-wash-hands','🧼','Je me lave les mains']
    ]
  };
  GROUPS.midday=midday;

  const dinnerTasks=[
    ['dinner-set-table','🍴','Je mets la table'],
    ['dinner-sit-well','🪑','Je me tiens bien à table'],
    ['dinner-taste','🥕','Je goûte ce qu’on me propose'],
    ['dinner-eat-calm','😋','Je mange calmement'],
    ['dinner-clear-table','🧺','Je débarrasse la table']
  ];
  const evening=GROUPS.evening;
  if(evening){
    const existing=new Set(evening.tasks.map(t=>t[0]));
    /* Repas d'abord, puis toilette / pyjama / dents / coucher. */
    evening.tasks=[...dinnerTasks.filter(t=>!existing.has(t[0])),...evening.tasks];
  }

  baseCfg.blocks.midday=true;
  midday.tasks.forEach(t=>baseCfg.tasks[t[0]]=true);
  dinnerTasks.forEach(t=>baseCfg.tasks[t[0]]=true);
  app.profiles.forEach(p=>{
    p.cfg=p.cfg||{};p.cfg.blocks=p.cfg.blocks||{};p.cfg.tasks=p.cfg.tasks||{};
    if(p.cfg.blocks.midday===undefined)p.cfg.blocks.midday=true;
    [...midday.tasks,...dinnerTasks].forEach(t=>{if(p.cfg.tasks[t[0]]===undefined)p.cfg.tasks[t[0]]=true});
  });
  ORDER.splice(0,ORDER.length,'morning','midday','rest','evening','cleanliness','behaviors','school','autonomy');
  bind();save();
  if(typeof render==='function')render();
})();