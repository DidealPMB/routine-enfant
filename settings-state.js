/* Conserve l'état ouvert/fermé des accordéons des paramètres. */
(function(){
let openTitles=new Set();
function titleOf(g){return g.querySelector(':scope > h3')?.textContent.replace('⌄','').trim()||''}
function capture(){openTitles=new Set(Array.from(document.querySelectorAll('#settingsView .settingsGroup:not(.settingsCollapsed)')).map(titleOf).filter(Boolean))}
function restore(){document.querySelectorAll('#settingsView .settingsGroup').forEach(g=>{const t=titleOf(g);if(openTitles.has(t))g.classList.remove('settingsCollapsed')})}
document.addEventListener('click',e=>{const h=e.target.closest('#settingsView .settingsAccordionTitle');if(h)setTimeout(capture,0)},true);
const prev=window.renderSettings;window.renderSettings=function(){capture();prev();restore()};
const prevRender=window.render;window.render=function(){capture();prevRender();restore()};
})();