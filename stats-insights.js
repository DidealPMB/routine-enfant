/* Analyse détaillée des statistiques par section et par action. */
(function(){
  function ratingLabel(p){
    if(p>=80)return {label:'Bien acquis',cls:'statsGood',icon:'🌟'};
    if(p>=55)return {label:'À consolider',cls:'statsWarn',icon:'😊'};
    return {label:'À travailler',cls:'statsImprove',icon:'🎯'};
  }

  function missionStatsFor(records,task){
    const values=[];
    records.forEach(([,day])=>{
      const v=day?.state?.[task[0]];
      if(v!==undefined)values.push(v);
    });
    if(!values.length)return {count:0,pct:null,great:0,mid:0,cloud:0};
    const total=values.reduce((a,v)=>a+v,0);
    return {
      count:values.length,
      pct:Math.round(total/(values.length*2)*100),
      great:values.filter(v=>v===2).length,
      mid:values.filter(v=>v===1).length,
      cloud:values.filter(v=>v===0).length
    };
  }

  function sectionStats(records,gk){
    const g=GROUPS[gk];
    const rated=[];
    const counters=[];
    g.tasks.forEach(t=>{
      if(cfg.tasks[t[0]]===false)return;
      if(g.type==='potty'){
        const pk=t[0]==='pot-pee'?'pee':'poop';
        if(cfg.pottyMode[pk]==='counter'){
          const total=records.reduce((n,[,d])=>n+(d?.pot?.[pk]||0),0);
          counters.push({task:t,total});
          return;
        }
      }
      const s=missionStatsFor(records,t);
      if(s.count)rated.push({task:t,...s});
    });
    const observations=rated.reduce((n,x)=>n+x.count,0);
    const pct=observations?Math.round(rated.reduce((n,x)=>n+(x.pct*x.count),0)/observations):null;
    return {g,gk,rated,counters,pct,observations};
  }

  function actionRow(item){
    const r=ratingLabel(item.pct);
    return `<div class="statsActionRow">
      <div class="statsActionLabel"><span>${item.task[1]}</span><b>${item.task[2]}</b><small>${item.count} évaluation${item.count>1?'s':''}</small></div>
      <div class="statsActionVisual"><div class="statsTrack"><div class="statsFill ${r.cls}" style="width:${item.pct}%"></div></div><div class="statsBreakdown">🌟 ${item.great} · 😊 ${item.mid} · ☁️ ${item.cloud}</div></div>
      <div class="statsActionScore ${r.cls}"><b>${item.pct}%</b><small>${r.icon} ${r.label}</small></div>
    </div>`;
  }

  function counterRow(item){
    return `<div class="statsActionRow statsCounterRow"><div class="statsActionLabel"><span>${item.task[1]}</span><b>${item.task[2]}</b></div><div class="statsCounterValue">${item.total}</div><div class="statsCounterText">réussite${item.total>1?'s':''}</div></div>`;
  }

  window.renderStats=function(){
    const recs=rangeRecords(statsRange);
    let stars=0,pot=0,closed=0,great=0,ratings=0;
    for(const[,d]of recs){
      stars+=score(d.state||{});
      pot+=(d.pot?.pee||0)+(d.pot?.poop||0);
      if(d.closed)closed++;
      Object.values(d.state||{}).forEach(v=>{ratings++;if(v===2)great++});
    }
    const done=recs.filter(([,d])=>d.closed);
    const avg=done.length?Math.round(done.reduce((a,[,d])=>a+percent(score(d.state||{}),maxScore()),0)/done.length):0;

    const sections=ORDER.filter(gk=>cfg.blocks[gk]).map(gk=>sectionStats(recs,gk));
    const ratedActions=sections.flatMap(s=>s.rated.map(x=>({...x,group:s.g.title})));
    const improvement=ratedActions.filter(x=>x.count>0).sort((a,b)=>a.pct-b.pct).slice(0,5);

    const priorityHtml=improvement.length?`<div class="statsPriority"><h3>🎯 Priorités d'amélioration</h3><div class="statsPriorityGrid">${improvement.map(x=>{const r=ratingLabel(x.pct);return `<div class="statsPriorityCard ${r.cls}"><div>${x.task[1]}</div><b>${x.task[2]}</b><strong>${x.pct}%</strong><small>${x.group}</small></div>`}).join('')}</div></div>`:'';

    const sectionsHtml=sections.map(s=>{
      const r=s.pct===null?null:ratingLabel(s.pct);
      const rows=[...s.rated].sort((a,b)=>a.pct-b.pct).map(actionRow).join('')+s.counters.map(counterRow).join('');
      if(!rows)return '';
      return `<section class="statsSectionCard">
        <div class="statsSectionHead"><div><h3>${s.g.title}</h3><small>${s.observations} évaluation${s.observations>1?'s':''}</small></div>${r?`<div class="statsSectionScore ${r.cls}"><b>${s.pct}%</b><small>${r.icon} ${r.label}</small></div>`:''}</div>
        ${s.pct!==null?`<div class="statsTrack statsSectionTrack"><div class="statsFill ${r.cls}" style="width:${s.pct}%"></div></div>`:''}
        <div class="statsActions">${rows}</div>
      </section>`;
    }).join('');

    document.getElementById('statsInfo').innerHTML=`
      <div class="statsOverview">
        <div class="statsMetric"><span>⭐</span><b>${stars}</b><small>étoiles</small></div>
        <div class="statsMetric"><span>🏁</span><b>${closed}</b><small>jours clôturés</small></div>
        <div class="statsMetric"><span>📈</span><b>${avg}%</b><small>moyenne</small></div>
        <div class="statsMetric"><span>🌟</span><b>${ratings?Math.round(great/ratings*100):0}%</b><small>très bien</small></div>
        <div class="statsMetric"><span>🔥</span><b>${streak()}</b><small>meilleure série</small></div>
        <div class="statsMetric"><span>🚽</span><b>${pot}</b><small>réussites pot</small></div>
      </div>
      <div class="statsPeriodLabel">Période : <b>${statsRange?statsRange+' derniers jours':'tout l’historique'}</b></div>
      ${priorityHtml}
      <div class="statsSectionsTitle"><h3>📋 Détail par section et action</h3><p>Les actions les plus faibles apparaissent en premier dans chaque section.</p></div>
      ${sectionsHtml||'<p>Aucune donnée évaluée sur cette période.</p>'}`;
    renderBadges();
  };

  if(typeof renderStats==='function')renderStats();
})();