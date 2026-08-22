/* V39 : actions photo avatar (caméra ou photothèque) */
(function(){
  function ensureInputs(){
    let camera=document.getElementById('avatarCameraInput');
    if(!camera){camera=document.createElement('input');camera.type='file';camera.accept='image/*';camera.capture='user';camera.id='avatarCameraInput';camera.hidden=true;camera.onchange=window.handlePhoto;document.body.appendChild(camera)}
    let library=document.getElementById('avatarLibraryInput');
    if(!library){library=document.createElement('input');library.type='file';library.accept='image/*';library.id='avatarLibraryInput';library.hidden=true;library.onchange=window.handlePhoto;document.body.appendChild(library)}
  }
  function findProfileGroup(){
    const groups=[...document.querySelectorAll('#settingsView .settingsGroup')];
    return groups.find(g=>/profil\s*&\s*avatar/i.test(g.querySelector(':scope>h3')?.textContent||'')) ||
           groups.find(g=>/profil actif/i.test(g.querySelector(':scope>h3')?.textContent||'')) ||
           groups.find(g=>/profils/i.test(g.querySelector(':scope>h3')?.textContent||''));
  }
  function inject(){
    ensureInputs();
    const group=findProfileGroup(); if(!group)return;
    group.querySelector('.avatarPhotoActionsV39')?.remove();
    const box=document.createElement('div');box.className='avatarPhotoActionsV39';
    box.innerHTML=`<div class="avatarPhotoActionHead"><div><b>📸 Photo de profil</b><small>Utilise la caméra ou choisis une image déjà présente sur l’appareil.</small></div></div><div class="avatarPhotoActionGrid"><button class="btn avatarPhotoBtn" type="button" onclick="document.getElementById('avatarCameraInput').click()">📷 Prendre une photo</button><button class="btn avatarPhotoBtn" type="button" onclick="document.getElementById('avatarLibraryInput').click()">🖼️ Choisir une photo</button><button class="btn avatarPhotoBtn subtle" type="button" onclick="removePhoto()">↩️ Revenir à l’avatar</button></div>`;
    const choices=group.querySelector('#avatarChoices')||group.querySelector('.avatarChoicesV2')||group.querySelector('.profiles');
    if(choices)choices.insertAdjacentElement('afterend',box); else group.appendChild(box);
  }
  const prev=window.renderSettings;window.renderSettings=function(){prev();setTimeout(inject,0)};
  const oldShow=window.showView;window.showView=function(v){oldShow(v);if(v==='settings')setTimeout(inject,0)};
  setTimeout(inject,80);
})();