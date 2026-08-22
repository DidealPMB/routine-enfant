/* Commercial V2 : un seul accès enfant vers tous les outils. */
(function(){
function available(){return [
 {id:'badges',icon:'🏅',label:'Mes badges',ok:()=>cfg.childTools?.badges!==false,open:()=>openChildBadges?.()},
 {id:'progress',icon:'📈',label:'Ma progression',ok:()=>cfg.childTools?.progress!==false,open:()=>openChildProgress?.()},
 {id:'challenge',icon:'🎯',label:'Mon défi',ok:()=>cfg.childTools?.challenge!==false,open:()=>openChildChallenge?.()},
 {id:'adventure',icon:'🗺️',label:'Mon aventure',ok:()=>cfg.adventure?.enabled&&cfg.adventure?.showButton!==false,open:()=>openChildAdventure?.()},
 {id:'shop',icon:'🛍️',label:'Ma boutique',ok:()=>cfg.starShop?.enabled&&cfg.starShop?.showChildButton!==false,open:()=>openStarShop?.()},
 {id:'chests',icon:'🎁',label:'Mes coffres',ok:()=>cfg.surpriseChests?.enabled&&cfg.surpriseChests?.showChildButton!==false,open:()=>openChildChests?.()},
 {id:'profile',icon:'👤',label:'Mon profil',ok:()=>cfg.avatarEvolution?.enabled&&cfg.avatarEvolution?.showChildButton!==false,open:()=>openChildAvatar?.()}
].filter(x=>x.ok())}
function hideLegacy(){document.querySelectorAll('#childSideTools .childToolBtn:not(#childHubBtn)').forEach(b=>b.style.setProperty('display','none','important'));document.querySelector('.kidBadgeBtn')?.style.setProperty('display','none','important')}
window.openChildHub=function(){if(!cfg.kidMode)return;document.getElementById('childHubOverlay')?.remove();const tools=available();const o=document.createElement('div');o.id='childHubOverlay';o.className='overlay open';o.innerHTML=`<div class="modal childHubModal"><button class="historyClose" onclick="this.closest('.overlay').remove()">✕</button><div class="childHubHeader"><div class="childHubAvatar">${cfg.photo?`<img src="${cfg.photo}" alt="">`:cfg.avatar||'🦁'}</div><div><h2>🎒 Mon espace</h2><p>${cfg.childName||'Champion'}</p></div></div><div class="childHubGrid">${tools.map((t,i)=>`<button class="childHubCard" data-tool="${t.id}" onclick="openHubTool(${i})"><span>${t.icon}</span><b>${t.label}</b></button>`).join('')}</div><button class="btn kidToolBack" onclick="this.closest('.overlay').remove()">← Retour à ma journée</button></div>`;document.body.appendChild(o);window.__hubTools=tools}
window.openHubTool=function(i){const t=window.__hubTools?.[i];document.getElementById('childHubOverlay')?.remove();t?.open()}
function ensureButton(){let b=document.getElementById('childHubBtn');if(!b){b=document.createElement('button');b.id='childHubBtn';b.className='childToolBtn childHubBtn';b.innerHTML='🎒 Mon espace';b.onclick=openChildHub;document.getElementById('childSideTools')?.appendChild(b)}b.style.display=cfg.kidMode?'flex':'none';hideLegacy()}
const prev=window.render;window.render=function(){prev();ensureButton()};ensureButton();
})();