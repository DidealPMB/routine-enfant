/* Routine du midi + ordre chronologique de la journée. */
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
  baseCfg.blocks.midday=true;
  midday.tasks.forEach(t=>baseCfg.tasks[t[0]]=true);
  app.profiles.forEach(p=>{
    p.cfg=p.cfg||{};p.cfg.blocks=p.cfg.blocks||{};p.cfg.tasks=p.cfg.tasks||{};
    if(p.cfg.blocks.midday===undefined)p.cfg.blocks.midday=true;
    midday.tasks.forEach(t=>{if(p.cfg.tasks[t[0]]===undefined)p.cfg.tasks[t[0]]=true});
  });
  /* Les routines de la journée d'abord, dans l'ordre chronologique. */
  ORDER.splice(0,ORDER.length,'morning','midday','rest','evening','cleanliness','behaviors','school','autonomy');
  bind();save();
  if(typeof render==='function')render();
})();