(() => {
'use strict';

const $=sId=>document.getElementById(sId);
const oRoot=$('hc-stickynotes-app'); if(!oRoot)return;
const oCore=window.HcSharedAppCore;
const sRequiredCoreVersion=oRoot.dataset.requiredCoreVersion||'';
if(!oCore){console.error('[hc_stickynotes] Shared App Core runtime is unavailable.');return;}
oCore.assertCompatible(sRequiredCoreVersion);
const fnStickyNotesMount=(async()=>{
    const sShellUrl=oRoot.dataset.appShellUrl||'';
    if(!sShellUrl)throw new Error('Sticky Notes shell URL is missing.');
    const oResponse=await fetch(sShellUrl,{credentials:'same-origin',cache:'no-store',headers:{Accept:'text/html'}});
    if(!oResponse.ok)throw new Error(`Sticky Notes shell failed to load: HTTP ${oResponse.status}`);
    const sHtml=await oResponse.text();
    oRoot.innerHTML=sHtml;
    const oAppShell=$('sn-app-shell');
    if(!oAppShell)throw new Error('Sticky Notes application layout is missing.');
    oAppShell.classList.add(oCore.layout.classes.appLayout);
    const oHeader=oAppShell.querySelector('.sn-toolbar');
    if(oHeader)oHeader.classList.add(oCore.layout.classes.header);
    const oCategoryFilters=$('sn-category-filters');
    const oFilters=oAppShell.querySelector('.sn-filters');
    if(oCategoryFilters&&oFilters){
        const oToolbar=document.createElement('nav');
        oToolbar.className=oCore.layout.classes.toolbar+' sn-core-toolbar';
        oToolbar.setAttribute('aria-label',t('hc_stickynotes','Sticky Notes controls'));
        const oToolbarInner=document.createElement('div');
        oToolbarInner.className='sn-core-toolbar-inner';
        oToolbarInner.append(oCategoryFilters,oFilters);
        oToolbar.append(oToolbarInner);
        oHeader?.insertAdjacentElement('afterend',oToolbar);
        const toggle=document.createElement('button');
        toggle.id='sn-mobile-filters-toggle';toggle.type='button';toggle.textContent='☰ '+t('hc_stickynotes','Menu');
        toggle.setAttribute('aria-controls','sn-mobile-filters');toggle.setAttribute('aria-expanded','false');
        oToolbar.id='sn-mobile-filters';
        const menuHeader=document.createElement('div');menuHeader.className='sn-mobile-menu-header';
        const menuLabel=document.createElement('strong');menuLabel.textContent=t('hc_stickynotes','Menu');
        const menuClose=document.createElement('button');menuClose.type='button';menuClose.textContent='×';menuClose.setAttribute('aria-label',t('hc_stickynotes','Close'));
        menuHeader.append(menuLabel,menuClose);oToolbar.prepend(menuHeader);
        const backdrop=document.createElement('button');backdrop.type='button';backdrop.id='sn-mobile-filters-backdrop';backdrop.hidden=true;backdrop.tabIndex=-1;
        backdrop.setAttribute('aria-label',t('hc_stickynotes','Close'));
        oAppShell.append(backdrop);oHeader?.prepend(toggle);
        const setFiltersOpen=open=>{oToolbar.classList.toggle('is-open',open);backdrop.hidden=!open;toggle.setAttribute('aria-expanded',String(open));};
        toggle.onclick=()=>setFiltersOpen(!oToolbar.classList.contains('is-open'));
        menuClose.onclick=()=>{setFiltersOpen(false);toggle.focus()};
        backdrop.onclick=()=>setFiltersOpen(false);
        oToolbar.addEventListener('click',event=>{if(event.target.closest('[data-filter],[data-cat],.sn-toolbar-actions button'))setFiltersOpen(false)});
        oToolbar.addEventListener('change',event=>{if(event.target.matches('select'))setFiltersOpen(false)});
        oAppShell.addEventListener('keydown',event=>{if(event.key==='Escape'&&oToolbar.classList.contains('is-open')){setFiltersOpen(false);toggle.focus();}});
    }
    const oBoard=$('sn-board');
    const oEmpty=$('sn-empty');
    const oPagination=$('sn-pagination');
    if(oBoard&&oEmpty&&oPagination){
        const oContent=document.createElement('div');
        oContent.className=oCore.layout.classes.content;
        const oView=document.createElement('section');
        oView.className=oCore.layout.classes.view;
        const oScroll=document.createElement('div');
        oScroll.className=oCore.layout.classes.scrollArea+' sn-main-scroll';
        const oInner=document.createElement('div');
        oInner.className='sn-page-inner';
        oInner.append(oBoard,oEmpty,oPagination);
        oScroll.append(oInner);
        oView.append(oScroll);
        oContent.append(oView);
        const oFirstOverlay=oAppShell.querySelector('.sn-overlay');
        if(oFirstOverlay)oAppShell.insertBefore(oContent,oFirstOverlay);
        else oAppShell.append(oContent);
    }
oCore.about.register({id:'hc_stickynotes',name:'Sticky Notes',version:oRoot.dataset.appVersion||'',repository:'https://github.com/hacesoft/StickyNotes',releaseNotes:'https://github.com/hacesoft/StickyNotes/releases',documentation:'https://github.com/hacesoft/StickyNotes#readme',core:'>='+sRequiredCoreVersion});
const fnCoreLog=(sLevel,sMessage,oDetails={})=>{try{oCore.logger?.[sLevel]?.(`[hc_stickynotes] ${sMessage}`,oDetails)}catch(_e){}};

const fnGlobalError=(oEvent)=>{
    try{
        const oElement=document.getElementById('sn-error');
        if(oElement){
            oElement.textContent=t('hc_stickynotes','Sticky Notes')+': '+(oEvent.message||t('hc_stickynotes','Runtime error'));
            oElement.hidden=false;
        }
    }catch(_e){}
};
window.addEventListener('error',fnGlobalError);

const overlays={
 note:$('sn-note-overlay'),
 share:$('sn-share-overlay'),
 settings:$('sn-settings-overlay'),
 style:$('sn-style-overlay')
};
let bNotesSuccessfullyLoaded=false;
let notes=[],categories=[],editorMap={},settings={baseColor:'#fff59d',markerMode:'header',markerSize:7,pinnedNoteIds:[],noteOrder:[],sortMode:'manual',widgetColumns:2,widgetRows:4,pageSize:24,layoutWidth:'full',helpMode:false,notifications:{nextcloudEnabled:true,ntfyEnabled:false,ntfyServer:'https://ntfy.sh',ntfyTopic:'',events:{assigned_user:true,assigned_group:true,shared:true,task_completed:true,task_reopened:true,due_24h:true,due_1h:true,due_now:true}},randomTilt:true,noteShadow:true},isAdmin=false,filter='all',categoryFilter=0,sharingNote=null,timer=null,draggedNoteId=null,currentPage=1,assignmentValues=[],sSettingsTab='widget';
const uid=OC.getCurrentUser().uid;
// Historie názvů patří pouze přihlášenému uživateli; uložené údaje Edge nelze číst.
const sCategoryNameHistoryKey='hc_stickynotes:category-name-history:v1:'+encodeURIComponent(uid);
let aRecentCategoryNames=[];
try{
    const aSavedCategoryNames=JSON.parse(window.localStorage.getItem(sCategoryNameHistoryKey)||'[]');
    if(Array.isArray(aSavedCategoryNames))aRecentCategoryNames=aSavedCategoryNames.filter(v=>typeof v==='string'&&v.trim()).slice(0,15);
}catch(_e){/* Režim bez úložiště zachovává funkčnost editoru. */}


function showError(err,persistent=false){
    const message=err?.message||String(err)||t('hc_stickynotes','Unknown error');
    console.error('[Sticky Notes]',err);
    fnCoreLog('error',message);
    const el=$('sn-error');
    el.textContent=message;
    el.hidden=false;
    clearTimeout(showError._timer);
    if(!persistent){
        try{oCore.notifications.error(message,{dedupeKey:'hc_stickynotes:runtime-error',cooldownMs:1200});}catch(_e){}
        showError._timer=setTimeout(()=>{el.hidden=true},8000);
    }
}
async function confirmAction(message,title=t('hc_stickynotes','Confirm action')){
    return oCore.dialogs.confirm({title,message,confirmLabel:t('hc_stickynotes','Confirm'),cancelLabel:t('hc_stickynotes','Cancel'),danger:true});
}
async function fnPromptLinkUrl(){
    return new Promise((fnResolve)=>{
        let bResolved=false;
        const fnFinish=(sValue)=>{if(bResolved)return;bResolved=true;fnResolve(sValue);};
        const oWrap=document.createElement('div');
        const oLabel=document.createElement('label');
        oLabel.textContent=t('hc_stickynotes','Enter link URL');
        const oInput=document.createElement('input');
        oInput.type='url';
        oInput.value='https://';
        oInput.autocomplete='url';
        oInput.inputMode='url';
        oInput.style.width='100%';
        oLabel.append(oInput);
        oWrap.append(oLabel);
        const oDialog=oCore.dialogs.open({
            title:t('hc_stickynotes','Insert link'),
            content:oWrap,
            size:'small',
            closeLabel:t('hc_stickynotes','Close'),
            actions:[
                {label:t('hc_stickynotes','Cancel'),onClick:()=>fnFinish(null)},
                {label:t('hc_stickynotes','Insert link'),variant:'primary',close:false,onClick:(oController)=>{
                    const sValue=oInput.value.trim();
                    if(!/^https?:\/\//i.test(sValue)){
                        oInput.setCustomValidity(t('hc_stickynotes','Enter link URL'));
                        oInput.reportValidity();
                        oInput.focus();
                        return;
                    }
                    oInput.setCustomValidity('');
                    fnFinish(sValue);
                    oController.close('action');
                }},
            ],
            onClose:()=>fnFinish(null),
        });
        oInput.addEventListener('input',()=>oInput.setCustomValidity(''));
        oInput.addEventListener('keydown',(oEvent)=>{
            if(oEvent.key!=='Enter')return;
            oEvent.preventDefault();
            const sValue=oInput.value.trim();
            if(!/^https?:\/\//i.test(sValue)){oInput.setCustomValidity(t('hc_stickynotes','Enter link URL'));oInput.reportValidity();return;}
            fnFinish(sValue);
            oDialog.close('action');
        });
    });
}
async function api(path,options={}){
    const r=await fetch(OC.generateUrl('/apps/hc_stickynotes'+path),{
        cache:'no-store',
        headers:{requesttoken:OC.requestToken,'Content-Type':'application/json',Accept:'application/json'},
        ...options
    });
    const text=await r.text();
    let data;
    try{data=text?JSON.parse(text):{}}catch(_){data=null}
    // A successful /api/notes response is a JSON array. Both arrays and objects are valid JSON.
    if(data===null || typeof data!=='object'){
        // Nextcloud may return its HTML login/error page after session expiry or a guest access denial.
        // Do not display the entire HTML response to the user as an application error.
        const contentType=r.headers?.get?.('content-type')||'';
        const returnedHtml=/\btext\/html\b/i.test(contentType)||/<(?:!doctype\s+html|html\b|head\b|body\b)/i.test(text.slice(0,1024));
        if(returnedHtml){
            if(r.redirected||[401,403].includes(r.status)||/\/(?:login|logout)(?:\/|[?#]|$)/i.test(r.url||'')){
                throw new Error(t('hc_stickynotes','Your session has expired or access was denied. Sign in again and reload the page.'));
            }
            throw new Error(t('hc_stickynotes','Nextcloud returned an HTML page instead of application data. Reload the page and check your access.'));
        }
        throw new Error('Sticky Notes API returned invalid JSON (HTTP '+r.status+').');
    }
    if(!r.ok){
        const message=typeof data.error==='string'?data.error:(typeof data.message==='string'?data.message:`HTTP ${r.status} ${r.statusText}`);
        throw new Error(message);
    }
    return data;
}
const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const safeLower=value=>String(value??'').toLowerCase();
const dt=t=>t?new Date(t*1000).toLocaleString():'';
const category=id=>categories.find(c=>c.id==id);

function noteTilt(id){const n=Number(id)||0;const raw=((n*37)%9)-4;return raw===0?1:raw;}
function applyLayoutPreferences(){
 oRoot.classList.toggle('sn-layout-centered',settings.layoutWidth==='centered');
 oRoot.classList.toggle('sn-layout-full',settings.layoutWidth!=='centered');
 oRoot.classList.toggle('sn-no-shadow',settings.noteShadow===false);
}

function normalizeHexColor(color){
    if(typeof color!=='string')return '#fff59d';
    let c=color.trim();
    if(/^#[0-9a-f]{3}$/i.test(c)){
        c='#'+c.slice(1).split('').map(x=>x+x).join('');
    }
    return /^#[0-9a-f]{6}$/i.test(c)?c.toLowerCase():'#fff59d';
}
function contrastTextColor(background){
    const c=normalizeHexColor(background).slice(1);
    const rgb=[0,2,4].map(i=>parseInt(c.slice(i,i+2),16)/255).map(v=>v<=0.04045?v/12.92:Math.pow((v+0.055)/1.055,2.4));
    const luminance=0.2126*rgb[0]+0.7152*rgb[1]+0.0722*rgb[2];
    // WCAG contrast: choose between near-black and white.
    const blackContrast=(luminance+0.05)/0.05;
    const whiteContrast=1.05/(luminance+0.05);
    return whiteContrast>blackContrast?'#ffffff':'#171717';
}

function currentEditorData(){return {titleHtml:$('sn-rich-title').innerHTML.trim(),bodyHtml:$('sn-rich-body').innerHTML.trim()};}
function syncPlainFields(){$('sn-title').value=$('sn-rich-title').innerText.trim();$('sn-content').value=$('sn-rich-body').innerText.trim();}
function applyEditorData(n){
    const ed=n?.id?editorMap[String(n.id)]:null;
    $('sn-rich-title').innerHTML=ed?.titleHtml||esc(n?.title||'');
    $('sn-rich-body').innerHTML=ed?.bodyHtml||esc(n?.content||'').replace(/\n/g,'<br>');
    syncPlainFields();
}
function finalCategoryStyle(){const c=category($('sn-category').value),st=c?.style||{};return {mode:(st.markerMode&&st.markerMode!=='inherit')?st.markerMode:(settings.markerMode||'header'),marker:st.markerColor||c?.color||$('sn-color').value||'#4f86f7',bg:st.background||settings.baseColor||'#fff59d',paper:st.paperType||'plain'};}
function alignPaperSurface(surface,anchor){
    if(!surface||!anchor||surface.classList.contains('sn-paper-plain'))return;
    const cs=getComputedStyle(anchor);
    const fontSize=parseFloat(cs.fontSize)||16;
    let lineHeight=parseFloat(cs.lineHeight);
    if(!Number.isFinite(lineHeight)||lineHeight<=0)lineHeight=fontSize*1.45;

    // Put the paper rule/dot/grid row just under the text baseline, not at the
    // bottom edge of the CSS line box. This keeps subsequent rows visually
    // locked to normal rich-text lines instead of drifting through the text.
    const baseline=Math.min(lineHeight-3,((lineHeight-fontSize)/2)+(fontSize*.86)+2);
    const origin=(anchor.offsetTop||0)+baseline-lineHeight;
    surface.style.setProperty('--sn-paper-step',`${lineHeight}px`);
    surface.style.setProperty('--sn-paper-origin-y',`${origin}px`);
}
function alignEditorPaper(){alignPaperSurface($('sn-note-paper'),$('sn-rich-body'));}
function alignRenderedPapers(){
    document.querySelectorAll('#hc-hc-stickynotes-app .sn-card:not(.sn-paper-plain)').forEach(card=>alignPaperSurface(card,card.querySelector('.sn-content')));
}
function applyEditorAppearance(){
    const st=finalCategoryStyle(),p=$('sn-note-paper');
    const effectiveBg=st.mode==='full'?st.marker:st.bg;
    const text=contrastTextColor(effectiveBg);
    p.className='sn-note-paper sn-live-'+st.mode+' sn-paper-'+st.paper;
    p.style.setProperty('--sn-live-marker',st.marker);
    p.style.setProperty('--sn-paper-text',text);
    p.style.backgroundColor=effectiveBg;
    $('sn-rich-title').style.color=text;
    $('sn-rich-body').style.color=text;
    const sep=text==='#ffffff'?'rgba(255,255,255,.38)':'rgba(0,0,0,.28)';
    p.style.setProperty('--sn-separator',sep);
    requestAnimationFrame(alignEditorPaper);
}

const pinnedIds=()=>new Set((settings.pinnedNoteIds||[]).map(Number));
function orderedNotes(input){
    const pins=pinnedIds();
    const mode=settings.sortMode||'manual';
    const order=(settings.noteOrder||[]).map(Number);
    const pos=new Map(order.map((id,i)=>[id,i]));
    return [...input].sort((a,b)=>{
        const ap=pins.has(Number(a.id)),bp=pins.has(Number(b.id));
        if(ap!==bp)return ap?-1:1;
        if(mode==='category'){
            const ac=(category(a.categoryId)?.name||'').toLocaleLowerCase();
            const bc=(category(b.categoryId)?.name||'').toLocaleLowerCase();
            const cmp=ac.localeCompare(bc,undefined,{sensitivity:'base'});
            if(cmp!==0)return cmp;
        }else if(mode==='newest'){
            return (b.createdAt||0)-(a.createdAt||0);
        }else if(mode==='oldest'){
            return (a.createdAt||0)-(b.createdAt||0);
        }else{
            const ai=pos.has(Number(a.id))?pos.get(Number(a.id)):Number.MAX_SAFE_INTEGER;
            const bi=pos.has(Number(b.id))?pos.get(Number(b.id)):Number.MAX_SAFE_INTEGER;
            if(ai!==bi)return ai-bi;
        }
        return (b.updatedAt||0)-(a.updatedAt||0);
    });
}
function renderStats(){
    $('sn-stat-total').textContent=notes.length;
    $('sn-stat-active').textContent=notes.filter(n=>!n.completedAt).length;
    $('sn-stat-done').textContent=notes.filter(n=>!!n.completedAt).length;
}
async function saveLayout(){
    settings=await api('/api/layout',{method:'PUT',body:JSON.stringify({
        pinnedNoteIds:(settings.pinnedNoteIds||[]).map(Number),
        noteOrder:(settings.noteOrder||[]).map(Number)
    })});
}
function assigneeLabel(value){
    if(!value)return '';
    return value.startsWith('group:')?'👥 '+value.slice(6):'👤 '+value;
}


const focusableSelector='button:not([disabled]),[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[contenteditable="true"],[tabindex]:not([tabindex="-1"])';
let activeOverlayName=null;
let overlayReturnFocus=null;

function visibleFocusable(container){
    return [...container.querySelectorAll(focusableSelector)].filter(el=>!el.hidden&&el.getAttribute('aria-hidden')!=='true'&&el.offsetParent!==null);
}
function closeAll({restoreFocus=true}={}){
    const returnTo=overlayReturnFocus;
    Object.values(overlays).forEach(o=>{if(o){o.hidden=true;o.setAttribute('aria-hidden','true')}});
    activeOverlayName=null;
    overlayReturnFocus=null;
    hideAssigneeResults();
    hideCategoryIconPicker();
    closeCategoryEditor();
    if(restoreFocus&&returnTo?.isConnected){requestAnimationFrame(()=>returnTo.focus?.());}
}
function openOverlay(name){
    if(activeOverlayName)closeAll({restoreFocus:false});
    const o=overlays[name];
    if(!o)return;
    overlayReturnFocus=document.activeElement instanceof HTMLElement?document.activeElement:null;
    activeOverlayName=name;
    o.hidden=false;o.setAttribute('aria-hidden','false');
    syncVisualViewport();
    requestAnimationFrame(()=>{
        const modal=o.querySelector('[role="dialog"]')||o.querySelector('.sn-modal')||o;
        const target=visibleFocusable(modal)[0]||modal;
        if(target===modal&&!modal.hasAttribute('tabindex'))modal.setAttribute('tabindex','-1');
        target.focus?.({preventScroll:true});
    });
}
function wireOverlayClose(name,...ids){
    ids.forEach(id=>{const b=$(id);if(b)b.onclick=()=>closeAll()});
    const o=overlays[name];
    if(o)o.addEventListener('click',e=>{if(e.target===o)closeAll()});
}
wireOverlayClose('note','sn-note-x','sn-note-cancel');
wireOverlayClose('share','sn-share-x','sn-share-close');
wireOverlayClose('settings','sn-settings-x','sn-settings-close');
wireOverlayClose('style','sn-style-x','sn-style-close');

function selectSettingsTab(sTab='about'){
    sSettingsTab=sTab;
    document.querySelectorAll('#sn-settings-overlay [data-sn-settings-tab]').forEach((oButton)=>{
        const bActive=(oButton.dataset.snSettingsTab===sTab);
        oButton.classList.toggle('active',bActive);
        oButton.setAttribute('aria-selected',bActive?'true':'false');
        oButton.tabIndex=bActive?0:-1;
    });
    document.querySelectorAll('#sn-settings-overlay [data-sn-settings-panel]').forEach((oPanel)=>{
        const bActive=(oPanel.dataset.snSettingsPanel===sTab);
        oPanel.hidden=!bActive;
        oPanel.classList.toggle('active',bActive);
    });
}
function bindSettingsTabs(){
    document.querySelectorAll('#sn-settings-overlay [data-sn-settings-tab]').forEach((oButton)=>{
        oButton.addEventListener('click',()=>selectSettingsTab(oButton.dataset.snSettingsTab||'about'));
        oButton.addEventListener('keydown',(oEvent)=>{
            const aButtons=[...document.querySelectorAll('#sn-settings-overlay [data-sn-settings-tab]')];
            const iIndex=aButtons.indexOf(oButton);
            if(iIndex<0)return;
            if(oEvent.key!=='ArrowRight'&&oEvent.key!=='ArrowLeft'&&oEvent.key!=='Home'&&oEvent.key!=='End')return;
            oEvent.preventDefault();
            let iTarget=iIndex;
            if(oEvent.key==='ArrowRight')iTarget=(iIndex+1)%aButtons.length;
            else if(oEvent.key==='ArrowLeft')iTarget=(iIndex-1+aButtons.length)%aButtons.length;
            else if(oEvent.key==='Home')iTarget=0;
            else if(oEvent.key==='End')iTarget=aButtons.length-1;
            aButtons[iTarget]?.focus();
            selectSettingsTab(aButtons[iTarget]?.dataset.snSettingsTab||'about');
        });
    });
}
function resetMovableDialog(oDialog){
    if(!oDialog)return;
    oDialog.dataset.dragDx='0';
    oDialog.dataset.dragDy='0';
    oDialog.style.setProperty('--sn-dx','0px');
    oDialog.style.setProperty('--sn-dy','0px');
}
function initMovableDialog(sOverlayId,sHandleSelector){
    const oOverlay=$(sOverlayId);
    const oDialog=oOverlay?.querySelector('[role="dialog"]')||oOverlay?.querySelector('.sn-modal');
    const oHandle=oDialog?.querySelector(sHandleSelector);
    if(!oOverlay||!oDialog||!oHandle||oDialog.dataset.movableInit==='1')return;
    oDialog.dataset.movableInit='1';
    resetMovableDialog(oDialog);
    let oDrag=null;
    const fnCanStart=(oTarget)=>!oTarget.closest('button,input,select,textarea,label,a');
    const fnMove=(oEvent)=>{
        if(!oDrag)return;
        const iDx=oDrag.startDx+(oEvent.clientX-oDrag.startX);
        const iDy=oDrag.startDy+(oEvent.clientY-oDrag.startY);
        oDialog.dataset.dragDx=String(iDx);
        oDialog.dataset.dragDy=String(iDy);
        oDialog.style.setProperty('--sn-dx',iDx+'px');
        oDialog.style.setProperty('--sn-dy',iDy+'px');
    };
    const fnStop=()=>{if(!oDrag)return;oDrag=null;oDialog.classList.remove('sn-is-dragging');};
    oHandle.addEventListener('pointerdown',(oEvent)=>{
        if((oEvent.button??0)!==0||!fnCanStart(oEvent.target))return;
        oDrag={startX:oEvent.clientX,startY:oEvent.clientY,startDx:parseFloat(oDialog.dataset.dragDx||'0')||0,startDy:parseFloat(oDialog.dataset.dragDy||'0')||0};
        oDialog.classList.add('sn-is-dragging');
        oHandle.setPointerCapture?.(oEvent.pointerId);
        oEvent.preventDefault();
    });
    oHandle.addEventListener('pointermove',fnMove);
    oHandle.addEventListener('pointerup',fnStop);
    oHandle.addEventListener('pointercancel',fnStop);
    oHandle.addEventListener('dblclick',(oEvent)=>{if(fnCanStart(oEvent.target))resetMovableDialog(oDialog);});
}
bindSettingsTabs();
initMovableDialog('sn-settings-overlay','.sn-settings-drag-handle');

const fnDocumentKeydown=(e)=>{
    if(!activeOverlayName)return;
    const o=overlays[activeOverlayName];
    if(!o||o.hidden)return;
    if(e.key==='Escape'){e.preventDefault();if(!$('sn-icon-picker')?.hidden){hideCategoryIconPicker();$('sn-icon-current')?.focus();return;}closeAll();return;}
    if(e.key!=='Tab')return;
    const modal=o.querySelector('[role="dialog"]')||o.querySelector('.sn-modal')||o;
    const items=visibleFocusable(modal);
    if(!items.length){e.preventDefault();modal.focus?.();return;}
    const first=items[0],last=items[items.length-1];
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
};
document.addEventListener('keydown',fnDocumentKeydown);

function visualViewportBox(){
    const vv=window.visualViewport;
    return vv?{left:vv.offsetLeft,top:vv.offsetTop,width:vv.width,height:vv.height}:{left:0,top:0,width:window.innerWidth,height:window.innerHeight};
}
function syncVisualViewport(){
    const vp=visualViewportBox();
    oRoot.style.setProperty('--sn-vv-height',`${Math.max(1,Math.round(vp.height))}px`);
    oRoot.style.setProperty('--sn-vv-top',`${Math.round(vp.top)}px`);
    oRoot.style.setProperty('--sn-vv-left',`${Math.round(vp.left)}px`);
}

function visible(n){
    const q=safeLower($('sn-search')?.value);
    if(q&&!(`${n.title} ${n.content}`).toLowerCase().includes(q))return false;
    if(categoryFilter&&n.categoryId!=categoryFilter)return false;
    if(filter==='mine')return n.ownerUid===uid&&!n.completedAt;
    if(filter==='assigned')return n.assignedToMe&&!n.completedAt;
    if(filter==='shared')return n.ownerUid!==uid&&!n.assignedToMe&&!n.completedAt;
    if(filter==='done')return!!n.completedAt;
    return!n.completedAt;
}
function renderCategoryFilters(){
    $('sn-category-filters').innerHTML=`<button type="button" data-cat="0" class="${!categoryFilter?'active':''}">${t('hc_stickynotes','All categories')}</button>`+
    categories.map(c=>`<button type="button" data-cat="${c.id}" class="${categoryFilter==c.id?'active':''}"><i style="background:${esc(c.color)}"></i>${esc(c.icon)} ${esc(c.name)}${c.isSystem?' 🔒':''}</button>`).join('');
}
function render(){
    renderCategoryFilters();
    renderStats();
    applyLayoutPreferences();

    const filtered=orderedNotes(notes.filter(visible));
    const pageSize=Number(settings.pageSize)||24;
    const totalPages=Math.max(1,Math.ceil(filtered.length/pageSize));
    if(currentPage>totalPages)currentPage=totalPages;
    if(currentPage<1)currentPage=1;
    const start=(currentPage-1)*pageSize;
    const list=filtered.slice(start,start+pageSize);

    $('sn-empty').hidden=!!filtered.length;
    $('sn-board').innerHTML=list.map(n=>{
        const c=category(n.categoryId);
        const st=c?.style||{};
        const mode=(st.markerMode&&st.markerMode!=='inherit')?st.markerMode:(settings.markerMode||'header');
        const mark=st.markerColor||c?.color||n.color||'#4f86f7';
        const base=st.background||settings.baseColor||'#fff59d';
        const paper=st.paperType||'plain';
        const effectiveBase=mode==='full'?mark:base;
        const textColor=contrastTextColor(effectiveBase);
        return `<article class="sn-card sn-marker-${esc(mode)} sn-paper-${esc(paper)} ${n.completedAt?'sn-done':''}" style="--sn-base:${esc(base)};--sn-marker:${esc(mark)};--sn-text:${textColor};--sn-marker-size:${Number(settings.markerSize)||7}px;--sn-tilt:${settings.randomTilt===false?0:noteTilt(n.id)}deg" data-id="${n.id}" draggable="true">
        ${c?`<div class="${mode==='header'?'sn-category-head':'sn-category-badge'}" style="--sn-category:${esc(c.color)}"><span>${esc(c.icon||"📝")}</span><strong>${esc(c.name)}</strong></div>`:''}
        <div class="sn-card-head"><strong>${editorMap[String(n.id)]?.titleHtml||esc(n.title||t('hc_stickynotes','Untitled note'))}</strong>${n.priority==='important'?'<span>❗</span>':''}</div>
        <div class="sn-content">${editorMap[String(n.id)]?.bodyHtml||esc(n.content).replace(/\n/g,'<br>')}</div>
        <div class="sn-card-footer"><div class="sn-card-info">${(n.assignedUids||[n.assignedUid].filter(Boolean)).length?`<span class="sn-assignee-badge" title="${t('hc_stickynotes','Assigned to')}">👤 ${esc((n.assignedUids||[n.assignedUid]).filter(Boolean).join(', '))}</span>`:''}${n.dueAt?`<span class="sn-due-badge" title="${t('hc_stickynotes','Due date')}">⏰ ${esc(dt(n.dueAt))}</span>`:''}</div><div class="sn-actions"><button type="button" data-act="pin" title="${pinnedIds().has(Number(n.id))?t('hc_stickynotes','Unpin'):t('hc_stickynotes','Pin')}">${pinnedIds().has(Number(n.id))?'📌':'📍'}</button>${n.canEdit?`<button type="button" data-act="complete" title="${n.completedAt?t('hc_stickynotes','Restore'):t('hc_stickynotes','Mark as done')}">${n.completedAt?'↩':'✓'}</button>`:''}${n.ownerUid===uid?`<button type="button" data-act="share" title="${t('hc_stickynotes','Share')}">↗</button>`:''}${n.canEdit?`<button type="button" data-act="edit" title="${t('hc_stickynotes','Edit')}">✎</button>`:''}${n.ownerUid===uid?'<button type="button" data-act="delete" title="'+t('hc_stickynotes','Delete')+'">🗑</button>':''}</div></div></article>`;
    }).join('');

    const pager=$('sn-pagination');
    pager.hidden=filtered.length<=pageSize;
    $('sn-page-info').textContent=`${currentPage} / ${totalPages}`;
    $('sn-page-first').disabled=currentPage<=1;
    $('sn-page-prev').disabled=currentPage<=1;
    $('sn-page-next').disabled=currentPage>=totalPages;
    $('sn-page-last').disabled=currentPage>=totalPages;
    requestAnimationFrame(alignRenderedPapers);
}
async function loadAll(){
    const results=await Promise.allSettled([
        api('/api/notes'),
        api('/api/categories'),
        api('/api/settings'),
        api('/api/editor')
    ]);

    const failures=[];

    // Never interpret an API or response-format error as an empty notes collection.
    if(results[0].status==='fulfilled' && Array.isArray(results[0].value)){
        notes=results[0].value;
        bNotesSuccessfullyLoaded=true;
    }else{
        failures.push('notes: '+(results[0].status==='rejected'
            ? (results[0].reason?.message||results[0].reason)
            : 'Unexpected response: expected a JSON array'));
    }

    if(results[1].status==='fulfilled'){
        const cs=results[1].value;
        categories=Array.isArray(cs?.categories)?cs.categories:[];
        isAdmin=!!cs?.isAdmin;
    }else{
        failures.push('categories: '+(results[1].reason?.message||results[1].reason));
    }

    if(results[2].status==='fulfilled'){
        settings=results[2].value||settings;
    }else{
        failures.push('settings: '+(results[2].reason?.message||results[2].reason));
    }

    if(results[3].status==='fulfilled'){
        editorMap=(results[3].value&&typeof results[3].value==='object')?results[3].value:{};
    }else{
        // Rich text is optional: core notes still remain fully functional.
        console.warn('[Sticky Notes] editor API unavailable',results[3].reason);
        editorMap={};
    }

    if(!bNotesSuccessfullyLoaded){
        // The initial load failed: do not render misleading zero counters or an empty-board message.
        for(const id of ['sn-stat-total','sn-stat-active','sn-stat-done']){
            const el=$(id);if(el)el.textContent='—';
        }
        const empty=$('sn-empty');if(empty)empty.hidden=true;
        showError(new Error('Sticky Notes API: '+failures.join(' | ')), true);
        return;
    }
    render();
    renderSettings();
    openDeepLinkedNote();
    openRequestedNewNote();

    if(failures.length){
        showError(new Error('Sticky Notes API: '+failures.join(' | ')), true);
    }
}
async function loadCategories(){const cs=await api('/api/categories');categories=Array.isArray(cs?.categories)?cs.categories:[];isAdmin=!!cs?.isAdmin}

function fillCategorySelect(id){$('sn-category').innerHTML=`<option value="">${t('hc_stickynotes','No category')}</option>`+categories.map(c=>`<option value="${c.id}">${esc(c.icon)} ${esc(c.name)}</option>`).join('');$('sn-category').value=id||''}
function renderAssignmentChips(){const box=$('sn-assigned-selected');box.replaceChildren();for(const value of assignmentValues){const button=document.createElement('button');button.type='button';button.dataset.removeAssignee=value;button.textContent=assigneeLabel(value)+' ×';button.title=t('hc_stickynotes','Remove assignment');box.append(button)}box.hidden=assignmentValues.length===0;$('sn-assigned').value=assignmentValues[0]||''}
function openEditor(n=null){$('sn-id').value=n?.id||'';applyEditorData(n);$('sn-color').value=n?.color||'#4f86f7';fillCategorySelect(n?.categoryId);$('sn-category').onchange=applyEditorAppearance;$('sn-type').value=n?.type||'note';$('sn-priority').value=n?.priority||'normal';assignmentValues=[...(n?.assignedUids||[n?.assignedUid].filter(Boolean))];$('sn-assigned-search').value='';renderAssignmentChips();hideAssigneeResults();$('sn-due').value=n?.dueAt?new Date(n.dueAt*1000).toISOString().slice(0,16):'';applyEditorAppearance();openOverlay('note');}
let snDeepLinkHandled=false;
function openDeepLinkedNote(){
    if(snDeepLinkHandled)return;
    const raw=new URLSearchParams(window.location.search).get('note');
    if(!raw)return;
    snDeepLinkHandled=true;
    const id=Number(raw);
    const note=notes.find(n=>Number(n.id)===id);
    if(note){
        openEditor(note);
    }else{
        showError(new Error(t('hc_stickynotes','The requested note is unavailable or you no longer have access to it.')));
    }
    try{
        const url=new URL(window.location.href);
        url.searchParams.delete('note');
        history.replaceState(history.state,'',url.pathname+url.search+url.hash);
    }catch(_e){}
}
let snInitialNewHandled=false;
function openRequestedNewNote(){
    if(snInitialNewHandled||snDeepLinkHandled)return;
    const params=new URLSearchParams(window.location.search);
    if(params.get('new')!=='1')return;
    snInitialNewHandled=true;
    openEditor();
    try{
        const url=new URL(window.location.href);
        url.searchParams.delete('new');
        history.replaceState(history.state,'',url.pathname+url.search+url.hash);
    }catch(_e){}
}

async function saveNote(){
    syncPlainFields();
    const id=$('sn-id').value,due=$('sn-due').value,catId=$('sn-category').value;
    const btn=$('sn-save');btn.disabled=true;
    try{
        const saved=await api(id?`/api/notes/${id}`:'/api/notes',{
            method:id?'PUT':'POST',
            body:JSON.stringify({
                title:$('sn-title').value,
                content:$('sn-content').value,
                color:$('sn-color').value,
                categoryId:catId?Number(catId):null,
                type:$('sn-type').value,
                priority:$('sn-priority').value,
                assignedUid:assignmentValues[0]||null,
                assignedUids:assignmentValues,
                dueAt:due?Math.floor(new Date(due).getTime()/1000):null
            })
        });

        const noteId=Number(id||saved?.id||saved?.getId||0);
        if(noteId){
            try{
                await api(`/api/notes/${noteId}/editor`,{
                    method:'PUT',
                    body:JSON.stringify({editor:currentEditorData()})
                });
            }catch(editorErr){
                console.warn('[Sticky Notes] rich text save failed; plain note was saved',editorErr);
            }
        }

        closeAll();
        await loadAll();
    }finally{
        btn.disabled=false;
    }
}

function categoryMini(c){
 const st=c.style||{},mode=(st.markerMode&&st.markerMode!=='inherit')?st.markerMode:(settings.markerMode||'header');
 const marker=st.markerColor||c.color||'#4f86f7',bg=st.background||settings.baseColor||'#fff59d',paper=st.paperType||'plain';
 const effectiveBg=mode==='full'?marker:bg,text=contrastTextColor(effectiveBg);
 return `<span class="sn-cat-mini sn-marker-${esc(mode)} sn-paper-${esc(paper)}" style="--sn-marker:${esc(marker)};background-color:${esc(effectiveBg)};color:${text}"><span>${esc(c.icon||'📝')}</span><b>${esc(c.name)}</b></span>`;
}
function renderSettings(){
 $('sn-base-color').value=settings.baseColor||'#fff59d';$('sn-marker-mode').value=settings.markerMode||'header';$('sn-marker-size').value=Number(settings.markerSize)||7;$('sn-sort').value=settings.sortMode||'manual';$('sn-widget-columns').value=Number(settings.widgetColumns)||2;$('sn-widget-rows').value=Number(settings.widgetRows)||4;$('sn-settings-page-size').value=Number(settings.pageSize)||24;$('sn-page-size').value=Number(settings.pageSize)||24;$('sn-layout-width').value=settings.layoutWidth||'full';$('sn-help-mode').checked=!!settings.helpMode;$('sn-random-tilt').checked=settings.randomTilt!==false;$('sn-note-shadow').checked=settings.noteShadow!==false;document.querySelector('#sn-settings-overlay .sn-settings-panel')?.classList.toggle('sn-help-visible',!!settings.helpMode);
 const np=settings.notifications||{},ev=np.events||{};
 $('sn-notify-nextcloud').checked=np.nextcloudEnabled!==false;$('sn-notify-ntfy').checked=!!np.ntfyEnabled;$('sn-ntfy-server').value=np.ntfyServer||'https://ntfy.sh';$('sn-ntfy-topic').value=np.ntfyTopic||'';$('sn-ntfy-token').value='';$('sn-ntfy-clear-token').checked=false;
 const eventMap={'sn-event-assigned-user':'assigned_user','sn-event-assigned-group':'assigned_group','sn-event-shared':'shared','sn-event-completed':'task_completed','sn-event-reopened':'task_reopened','sn-event-due24':'due_24h','sn-event-due1':'due_1h','sn-event-duenow':'due_now'};Object.entries(eventMap).forEach(([id,key])=>{$(id).checked=ev[key]!==false});
 $('sn-ntfy-settings').classList.toggle('sn-disabled',!$('sn-notify-ntfy').checked);
 $('sn-categories-list').innerHTML=categories.map(c=>`<div class="sn-category-list-row${c.canEdit?' sn-category-list-row-editable':''}"${c.canEdit?` data-cat-row="${esc(c.id)}" tabindex="0" title="${t('hc_stickynotes','Edit')}"`:''}><div class="sn-category-list-main">${categoryMini(c)}<div class="sn-category-list-info"><strong>${esc(c.name)}</strong><small>${c.isSystem?t('hc_stickynotes','System category'):t('hc_stickynotes','Personal category')} · ${esc((c.style?.markerMode&&c.style.markerMode!=='inherit')?c.style.markerMode:t('hc_stickynotes','Global style'))}</small></div></div><div class="sn-category-list-actions">${c.canEdit?`<button type="button" data-cat-edit="${c.id}" title="${t('hc_stickynotes','Edit')}">✎</button><button type="button" data-cat-delete="${c.id}" title="${t('hc_stickynotes','Delete')}">🗑</button>`:''}</div></div>`).join('');
}
function updatePreview(){const p=$('sn-style-preview'),base=$('sn-base-color').value,mode=$('sn-marker-mode').value,size=Number($('sn-marker-size').value)||7,mark='#4f86f7';p.style.background=mode==='full'?mark:base;p.style.border='2px solid transparent';p.style.borderTop='0';p.style.borderLeft='0';if(mode==='header')p.style.borderTop=`${size}px solid ${mark}`;if(mode==='left')p.style.borderLeft=`${size}px solid ${mark}`;if(mode==='border')p.style.border=`${size}px solid ${mark}`}
async function openSettings(){try{settings=await api('/api/settings')||settings}catch(err){showError(err)}renderSettings();selectSettingsTab(sSettingsTab||'widget');openOverlay('settings');}
async function openStyleSettings(){try{const cs=await api('/api/categories');categories=Array.isArray(cs?.categories)?cs.categories:[];isAdmin=!!cs?.isAdmin}catch(err){showError(err)}renderSettings();openOverlay('style');}
async function saveSettings(){const btn=$('sn-save-settings');btn.disabled=true;try{const notificationEvents={assigned_user:$('sn-event-assigned-user').checked,assigned_group:$('sn-event-assigned-group').checked,shared:$('sn-event-shared').checked,task_completed:$('sn-event-completed').checked,task_reopened:$('sn-event-reopened').checked,due_24h:$('sn-event-due24').checked,due_1h:$('sn-event-due1').checked,due_now:$('sn-event-duenow').checked};const token=$('sn-ntfy-token').value.trim();settings=await api('/api/settings',{method:'PUT',body:JSON.stringify({baseColor:settings.baseColor||'#fff59d',markerMode:settings.markerMode||'header',markerSize:Number(settings.markerSize)||7,sortMode:$('sn-sort').value,widgetColumns:Number($('sn-widget-columns').value),widgetRows:Number($('sn-widget-rows').value),pageSize:Number($('sn-settings-page-size').value),layoutWidth:$('sn-layout-width').value,helpMode:$('sn-help-mode').checked,randomTilt:$('sn-random-tilt').checked,noteShadow:$('sn-note-shadow').checked,nextcloudEnabled:$('sn-notify-nextcloud').checked,ntfyEnabled:$('sn-notify-ntfy').checked,ntfyServer:$('sn-ntfy-server').value.trim(),ntfyTopic:$('sn-ntfy-topic').value.trim(),ntfyToken:$('sn-ntfy-clear-token').checked?'':(token===''?null:token),notificationEvents})});render();closeAll()}finally{btn.disabled=false}}
async function testNtfy(){const status=$('sn-ntfy-test-status'),btn=$('sn-test-ntfy');status.textContent=t('hc_stickynotes','Saving settings…');btn.disabled=true;try{const notificationEvents={assigned_user:$('sn-event-assigned-user').checked,assigned_group:$('sn-event-assigned-group').checked,shared:$('sn-event-shared').checked,task_completed:$('sn-event-completed').checked,task_reopened:$('sn-event-reopened').checked,due_24h:$('sn-event-due24').checked,due_1h:$('sn-event-due1').checked,due_now:$('sn-event-duenow').checked};const token=$('sn-ntfy-token').value.trim();settings=await api('/api/settings',{method:'PUT',body:JSON.stringify({baseColor:settings.baseColor||'#fff59d',markerMode:settings.markerMode||'header',markerSize:Number(settings.markerSize)||7,sortMode:$('sn-sort').value,widgetColumns:Number($('sn-widget-columns').value),widgetRows:Number($('sn-widget-rows').value),pageSize:Number($('sn-settings-page-size').value),layoutWidth:$('sn-layout-width').value,helpMode:$('sn-help-mode').checked,randomTilt:$('sn-random-tilt').checked,noteShadow:$('sn-note-shadow').checked,nextcloudEnabled:$('sn-notify-nextcloud').checked,ntfyEnabled:$('sn-notify-ntfy').checked,ntfyServer:$('sn-ntfy-server').value.trim(),ntfyTopic:$('sn-ntfy-topic').value.trim(),ntfyToken:$('sn-ntfy-clear-token').checked?'':(token===''?null:token),notificationEvents})});await api('/api/settings/ntfy/test',{method:'POST',body:'{}'});status.textContent=t('hc_stickynotes','Test notification sent.');try{oCore.notifications.success(t('hc_stickynotes','Test notification sent.'),{dedupeKey:'hc_stickynotes:ntfy-test',cooldownMs:1500});}catch(_e){}}catch(err){status.textContent=err?.message||String(err);throw err}finally{btn.disabled=false}}

const categoryIcons=['📝','📌','📋','✅','⭐','🏠','🛒','💼','💡','🔧','🔔','📅','🎯','❤️','👨‍👩‍👧','🚗','💰','📚','🍽️','💊','⚡','🌱','🎁','✈️','🏃','🧹','🐾','📞','💻','🔒'];
// Nabídka vlastní historie nevyužívá automatické vyplňování prohlížeče ani jeho top-layer.
function categoryNameSuggestions(sQuery){
    const fnFold=sValue=>String(sValue??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase();
    const sFilter=fnFold(String(sQuery??'').trim());
    const aNames=[...aRecentCategoryNames,...categories.map(oCategory=>oCategory?.name)];
    const oSeen=new Set();
    return aNames.filter(sName=>{
        if(typeof sName!=='string')return false;
        const sValue=sName.trim(),sKey=fnFold(sValue);
        if(!sValue||oSeen.has(sKey)||!sKey.includes(sFilter))return false;
        oSeen.add(sKey);
        return true;
    }).slice(0,7);
}
function rememberCategoryName(sName){
    const sValue=String(sName??'').trim();
    if(!sValue)return;
    aRecentCategoryNames=[sValue,...aRecentCategoryNames.filter(sItem=>sItem.toLocaleLowerCase()!==sValue.toLocaleLowerCase())].slice(0,15);
    try{window.localStorage.setItem(sCategoryNameHistoryKey,JSON.stringify(aRecentCategoryNames));}catch(_e){}
}
let aVisibleCategoryNameSuggestions=[];
let nActiveCategoryNameSuggestion=-1;
function hideCategoryNameSuggestions(){
    const oList=$('sn-cat-name-suggestions');
    if(oList)oList.hidden=true;
    aVisibleCategoryNameSuggestions=[];nActiveCategoryNameSuggestion=-1;
    $('sn-cat-name')?.setAttribute('aria-expanded','false');
    $('sn-cat-name')?.removeAttribute('aria-activedescendant');
}
function positionCategoryNameSuggestions(){
    const oInput=$('sn-cat-name'),oList=$('sn-cat-name-suggestions');
    if(!oInput||!oList||oList.hidden)return;
    const oRect=oInput.getBoundingClientRect(),oViewport=window.visualViewport;
    const nLeft=oViewport?.offsetLeft||0,nTop=oViewport?.offsetTop||0;
    const nRight=nLeft+(oViewport?.width||window.innerWidth),nBottom=nTop+(oViewport?.height||window.innerHeight);
    const nWidth=Math.min(Math.max(180,oRect.width),Math.max(180,nRight-nLeft-20));
    const nX=Math.max(nLeft+10,Math.min(oRect.left,nRight-nWidth-10));
    const nBelow=nBottom-oRect.bottom-12,nAbove=oRect.top-nTop-12;
    const bAbove=nBelow<120&&nAbove>nBelow;
    const nHeight=Math.min(230,Math.max(60,(bAbove?nAbove:nBelow)-8));
    oList.style.left=nX+'px';oList.style.width=nWidth+'px';oList.style.maxHeight=nHeight+'px';
    oList.style.top=(bAbove?Math.max(nTop+8,oRect.top-nHeight-6):oRect.bottom+6)+'px';
}
function renderCategoryNameSuggestions(){
    const oInput=$('sn-cat-name'),oList=$('sn-cat-name-suggestions');
    if(!oInput||!oList||$('sn-category-editor')?.hidden)return;
    const aItems=categoryNameSuggestions(oInput.value);
    aVisibleCategoryNameSuggestions=aItems;nActiveCategoryNameSuggestion=-1;
    oList.replaceChildren();
    for(let i=0;i<aItems.length;i++){
        const oItem=document.createElement('button');
        oItem.type='button';oItem.className='sn-cat-name-option';
        oItem.id='sn-cat-name-option-'+i;oItem.setAttribute('role','option');
        oItem.setAttribute('aria-selected','false');oItem.textContent=aItems[i];oItem.title=aItems[i];
        oItem.addEventListener('pointerdown',oEvent=>oEvent.preventDefault());
        oItem.addEventListener('click',()=>selectCategoryNameSuggestion(i));
        oList.append(oItem);
    }
    oList.hidden=!aItems.length;
    oInput.setAttribute('aria-expanded',String(!!aItems.length));
    if(aItems.length)positionCategoryNameSuggestions();
}
function selectCategoryNameSuggestion(nIndex){
    const sName=aVisibleCategoryNameSuggestions[nIndex];
    if(typeof sName!=='string')return;
    const oInput=$('sn-cat-name');oInput.value=sName;
    oInput.dispatchEvent(new Event('input',{bubbles:true}));
    oInput.focus();
    hideCategoryNameSuggestions();
}
function moveCategoryNameSuggestion(nDirection){
    if(!aVisibleCategoryNameSuggestions.length)return;
    const nCount=aVisibleCategoryNameSuggestions.length;
    nActiveCategoryNameSuggestion=(nActiveCategoryNameSuggestion+nDirection+nCount)%nCount;
    const oInput=$('sn-cat-name');
    const oList=$('sn-cat-name-suggestions');
    [...oList.children].forEach((oItem,nIndex)=>oItem.setAttribute('aria-selected',String(nIndex===nActiveCategoryNameSuggestion)));
    oInput.setAttribute('aria-activedescendant','sn-cat-name-option-'+nActiveCategoryNameSuggestion);
}
function setupCategoryNameSuggestions(){
    const oInput=$('sn-cat-name'),oList=document.createElement('div');
    oList.id='sn-cat-name-suggestions';oList.className='sn-cat-name-suggestions';
    oList.setAttribute('role','listbox');oList.hidden=true;
    document.body.appendChild(oList);
    // Automaticke zamereni pri otevreni editoru nesmi zobrazit historii.
    // Historii otevrit teprve pri skutecnem kliknuti nebo psani do pole.
    oInput.addEventListener('click',renderCategoryNameSuggestions);
    oInput.addEventListener('input',renderCategoryNameSuggestions);
    oInput.addEventListener('keydown',oEvent=>{
        if(oEvent.key==='Escape'&&!oList.hidden){oEvent.preventDefault();oEvent.stopPropagation();hideCategoryNameSuggestions();return;}
        if(oEvent.key==='ArrowDown'||oEvent.key==='ArrowUp'){
            if(oList.hidden)renderCategoryNameSuggestions();
            if(oList.hidden)return;
            oEvent.preventDefault();moveCategoryNameSuggestion(oEvent.key==='ArrowDown'?1:-1);
        }else if(oEvent.key==='Enter'&&!oList.hidden&&nActiveCategoryNameSuggestion>=0){
            oEvent.preventDefault();selectCategoryNameSuggestion(nActiveCategoryNameSuggestion);
        }
    });
    document.addEventListener('pointerdown',oEvent=>{
        if(!oList.hidden&&oEvent.target!==oInput&&!oList.contains(oEvent.target))hideCategoryNameSuggestions();
    });
    document.addEventListener('scroll',positionCategoryNameSuggestions,true);
    window.addEventListener('resize',positionCategoryNameSuggestions);
    window.visualViewport?.addEventListener('resize',positionCategoryNameSuggestions);
    window.visualViewport?.addEventListener('scroll',positionCategoryNameSuggestions);
}

// Plovoucí paleta ikon není součástí gridu formuláře a neovlivňuje jeho rozložení.
function categoryIconPickerGeometry(anchor,viewport){
    const margin=10,gap=7;
    const maxWidth=Math.max(1,viewport.width-2*margin);
    const width=Math.min(342,maxWidth);
    const bottom=viewport.top+viewport.height;
    const below=Math.max(0,bottom-anchor.bottom-margin-gap);
    const above=Math.max(0,anchor.top-viewport.top-margin-gap);
    const openAbove=below<210&&above>below;
    const available=openAbove?above:below;
    const height=Math.max(1,Math.min(252,available,viewport.height-2*margin));
    const left=Math.max(viewport.left+margin,Math.min(anchor.left,viewport.left+viewport.width-margin-width));
    const top=openAbove?anchor.top-gap-height:anchor.bottom+gap;
    return {left:Math.round(left),top:Math.round(Math.max(viewport.top+margin,Math.min(top,bottom-margin-height))),width:Math.round(width),height:Math.round(height)};
}
function positionCategoryIconPicker(){
    const box=$('sn-icon-picker'),trigger=$('sn-icon-current');
    if(!box||box.hidden||!trigger)return;
    const anchor=trigger.getBoundingClientRect(),vp=visualViewportBox();
    if(anchor.bottom<vp.top||anchor.top>vp.top+vp.height){hideCategoryIconPicker();return;}
    const position=categoryIconPickerGeometry(anchor,vp);
    box.style.left=position.left+'px';box.style.top=position.top+'px';
    box.style.width=position.width+'px';box.style.maxHeight=position.height+'px';
}
function hideCategoryIconPicker(){
    const box=$('sn-icon-picker'),trigger=$('sn-icon-current');
    if(box)box.hidden=true;
    if(trigger)trigger.setAttribute('aria-expanded','false');
}
function toggleCategoryIconPicker(){
    const box=$('sn-icon-picker'),trigger=$('sn-icon-current');
    if(!box||!trigger)return;
    if(!box.hidden){hideCategoryIconPicker();return;}
    box.hidden=false;trigger.setAttribute('aria-expanded','true');
    positionCategoryIconPicker();
}
function buildIconPicker(){
    const box=$('sn-icon-picker');
    if(!box)return;
    box.innerHTML=categoryIcons.map(icon=>`<button type="button" data-icon="${icon}" title="${icon}">${icon}</button>`).join('');
    // Portál do body obchází overflow:auto modálního dialogu.
    document.body.appendChild(box);
}

function updateCategoryPreview(){const p=$('sn-category-live-preview');if(!p)return;const name=$('sn-cat-name').value.trim()||t('hc_stickynotes','Category'),icon=$('sn-cat-icon').value||'📝',mode0=$('sn-cat-marker-mode').value||'inherit',mode=mode0==='inherit'?(settings.markerMode||'header'):mode0,marker=$('sn-cat-marker-color').value||$('sn-cat-color').value||'#4f86f7',bg=$('sn-cat-background').value||'#fff59d',paper=$('sn-cat-paper-type').value||'plain';p.className='sn-category-live-preview sn-live-'+mode+' sn-paper-'+paper;p.style.setProperty('--sn-live-marker',marker);const effectiveBg=mode==='full'?marker:bg;p.style.backgroundColor=effectiveBg;p.style.setProperty('--sn-preview-text',contrastTextColor(effectiveBg));$('sn-category-live-category').textContent=`${icon} ${name}`;}
function openCategoryEditor(c=null){hideCategoryIconPicker();hideCategoryNameSuggestions();const st=c?.style||{};$('sn-cat-id').value=c?.id||'';$('sn-cat-name').value=c?.name||'';$('sn-cat-color').value=c?.color||'#4f86f7';$('sn-cat-icon').value=c?.icon||'📝';$('sn-icon-current').textContent=$('sn-cat-icon').value;$('sn-cat-marker-mode').value=st.markerMode||'inherit';$('sn-cat-background').value=st.background||settings.baseColor||'#fff59d';$('sn-cat-paper-type').value=st.paperType||'plain';$('sn-cat-marker-color').value=st.markerColor||c?.color||'#4f86f7';$('sn-cat-system-wrap').hidden=!isAdmin;$('sn-cat-system').checked=!!c?.isSystem;$('sn-category-editor').hidden=false;updateCategoryPreview();$('sn-cat-name').focus()}
function closeCategoryEditor(){hideCategoryIconPicker();hideCategoryNameSuggestions();$('sn-category-editor').hidden=true}
async function saveCategory(){const id=$('sn-cat-id').value,btn=$('sn-save-category');btn.disabled=true;try{await api(id?`/api/categories/${id}`:'/api/categories',{method:id?'PUT':'POST',body:JSON.stringify({name:$('sn-cat-name').value,color:$('sn-cat-color').value,icon:$('sn-cat-icon').value,isSystem:$('sn-cat-system').checked,markerMode:$('sn-cat-marker-mode').value,background:$('sn-cat-background').value,markerColor:$('sn-cat-marker-color').value,paperType:$('sn-cat-paper-type').value})});rememberCategoryName($('sn-cat-name').value);closeCategoryEditor();await loadCategories();renderSettings();render()}finally{btn.disabled=false}}


function positionAssigneeResults(){
    const input=$('sn-assigned-search');
    const box=$('sn-assigned-results');
    if(!input||!box||box.hidden)return;

    const rect=input.getBoundingClientRect();
    const vp=visualViewportBox();
    const margin=10;
    const gap=6;
    const desired=Math.min(300,Math.max(140,Math.floor(vp.height*0.42)));
    const vpBottom=vp.top+vp.height;
    const vpRight=vp.left+vp.width;
    const below=Math.max(0,vpBottom-rect.bottom-margin-gap);
    const above=Math.max(0,rect.top-vp.top-margin-gap);
    const openAbove=below<140&&above>below;
    const available=openAbove?above:below;
    const maxHeight=Math.max(96,Math.min(desired,Math.max(96,available)));
    const width=Math.min(Math.max(rect.width,Math.min(280,vp.width-margin*2)),vp.width-margin*2);
    const minLeft=vp.left+margin;
    const maxLeft=Math.max(minLeft,vpRight-width-margin);
    const left=Math.max(minLeft,Math.min(rect.left,maxLeft));
    const top=openAbove
        ? Math.max(vp.top+margin,rect.top-gap-maxHeight)
        : Math.min(vpBottom-maxHeight-margin,rect.bottom+gap);

    box.classList.add('sn-picker-floating');
    box.style.left=`${Math.round(left)}px`;
    box.style.top=`${Math.round(top)}px`;
    box.style.width=`${Math.round(width)}px`;
    box.style.maxHeight=`${Math.round(maxHeight)}px`;
}
function hideAssigneeResults(){
    const box=$('sn-assigned-results');
    if(!box)return;
    box.hidden=true;
    box.classList.remove('sn-picker-floating');
    box.style.left='';box.style.top='';box.style.width='';box.style.maxHeight='';
}

async function searchAssignees(q=''){
    const r=await api('/api/users?q='+encodeURIComponent(q));
    const users=(r.users||[]).map(x=>({...x,type:'user',value:x.id}));
    const groups=(r.groups||[]).map(x=>({...x,type:'group',value:'group:'+x.id}));
    const box=$('sn-assigned-results');

    let html='';
    if(users.length){
        html+=`<div class="sn-picker-section">${t('hc_stickynotes','Users')}</div>`;
        html+=users.map(x=>`<button type="button" data-assignee="${esc(x.value)}"><span>👤</span><span><strong>${esc(x.displayName)}</strong><small>${esc(x.id)}</small></span></button>`).join('');
    }
    if(groups.length){
        html+=`<div class="sn-picker-section">${t('hc_stickynotes','Groups')}</div>`;
        html+=groups.map(x=>`<button type="button" data-assignee="${esc(x.value)}"><span>👥</span><span><strong>${esc(x.displayName)}</strong><small>${esc(x.id)}</small></span></button>`).join('');
    }
    if(!html){
        html=`<div class="sn-picker-empty">${t('hc_stickynotes','No users or groups found')}</div>`;
    }
    box.innerHTML=html;
    box.hidden=false;
    requestAnimationFrame(positionAssigneeResults);
}
function selectAssignee(value){
    if(assignmentValues.length>=32&&!assignmentValues.includes(value)){showError(new Error(t('hc_stickynotes','Maximum 32 assignees per note.')));return}
    if(!assignmentValues.includes(value))assignmentValues.push(value);
    $('sn-assigned-search').value='';
    hideAssigneeResults();
    renderAssignmentChips();
}
function clearAssignee(value){
    assignmentValues=assignmentValues.filter(item=>item!==value);
    renderAssignmentChips();
    hideAssigneeResults();
}
async function openShare(n){sharingNote=n;$('sn-share-search').value='';$('sn-share-results').innerHTML='';renderShares();openOverlay('share')}
function renderShares(){$('sn-current-shares').innerHTML=(sharingNote?.shares||[]).map(s=>`<div class="sn-share-chip">${esc(s.shareType)}: ${esc(s.shareWith)} (${esc(s.permission)}) ${sharingNote.ownerUid===uid?`<button type="button" data-unshare="${s.id}">×</button>`:''}</div>`).join('')}
async function searchTargets(q){if(!q){$('sn-share-results').innerHTML='';return}const r=await api('/api/users?q='+encodeURIComponent(q));const rows=[...(r.users||[]).map(x=>({...x,type:'user'})),...(r.groups||[]).map(x=>({...x,type:'group'}))];$('sn-share-results').innerHTML=rows.map(x=>`<button type="button" data-target-type="${x.type}" data-target-id="${esc(x.id)}">${x.type==='user'?'👤':'👥'} ${esc(x.displayName)} <small>${esc(x.id)}</small></button>`).join('')}

const oCoreToolbarController=oCore.toolbar.create($('sn-toolbar-actions'),{
    ariaLabel:t('hc_stickynotes','Sticky Notes'),
    actions:[
        {id:'styles',label:t('hc_stickynotes','Sticky note styles and categories'),icon:'🎨',compact:true,onClick:()=>openStyleSettings().catch(showError)},
        {id:'new',label:t('hc_stickynotes','New sticky note'),icon:'＋',variant:'primary',onClick:()=>openEditor()},
        {id:'settings',label:t('hc_stickynotes','Application settings'),icon:'⚙',compact:true,onClick:()=>openSettings().catch(showError)},
    ],
});
// Keep the same toolbar controller and handlers while moving its host into the
// phone popover. Restore it to the header on wider screens.
const mobileMenu=window.matchMedia('(max-width:760px)');
const toolbarActionsHost=$('sn-toolbar-actions');
const headerActionsParent=toolbarActionsHost.parentElement;
const mobileMenuInner=$('sn-mobile-filters')?.querySelector('.sn-core-toolbar-inner');
function placeToolbarActions(){
    if(!mobileMenuInner)return;
    const destination=mobileMenu.matches?mobileMenuInner:headerActionsParent;
    if(toolbarActionsHost.parentElement!==destination){
        if(mobileMenu.matches)destination.prepend(toolbarActionsHost);
        else destination.append(toolbarActionsHost);
    }
    if(!mobileMenu.matches){
        $('sn-mobile-filters').classList.remove('is-open');
        $('sn-mobile-filters-backdrop').hidden=true;
        $('sn-mobile-filters-toggle').setAttribute('aria-expanded','false');
    }
}
placeToolbarActions();mobileMenu.addEventListener('change',placeToolbarActions);
const oCoreAboutController=oCore.about.mount($('sn-core-about'),{
    requiredCoreVersion:sRequiredCoreVersion,
    heading:t('hc_stickynotes','About'),
});
$('sn-check-updates').onclick=async()=>{const button=$('sn-check-updates');if(button.disabled)return;button.disabled=true;try{await oCoreAboutController.refresh();}catch(error){showError(error);}finally{button.disabled=false;}};
$('sn-save').onclick=()=>saveNote().catch(showError);
$('sn-save-settings').onclick=()=>saveSettings().catch(showError);
$('sn-help-mode').onchange=()=>document.querySelector('#sn-settings-overlay .sn-settings-panel')?.classList.toggle('sn-help-visible',$('sn-help-mode').checked);
$('sn-notify-ntfy').onchange=()=>$('sn-ntfy-settings').classList.toggle('sn-disabled',!$('sn-notify-ntfy').checked);
$('sn-test-ntfy').onclick=()=>testNtfy().catch(showError);

buildIconPicker();
setupCategoryNameSuggestions();
['sn-cat-name','sn-cat-color','sn-cat-marker-mode','sn-cat-background','sn-cat-marker-color','sn-cat-paper-type'].forEach(id=>{$(id)?.addEventListener('input',updateCategoryPreview);$(id)?.addEventListener('change',updateCategoryPreview)});
$('sn-icon-current').onclick=toggleCategoryIconPicker;
$('sn-icon-picker').onclick=e=>{
    const b=e.target.closest('[data-icon]');if(!b)return;
    $('sn-cat-icon').value=b.dataset.icon;
    $('sn-icon-current').textContent=b.dataset.icon;
    hideCategoryIconPicker();
    $('sn-icon-current').focus();
    updateCategoryPreview();
};
// Kliknutí mimo paletu, změna rozměrů či posun dialogu.
document.addEventListener('pointerdown',e=>{
    const picker=$('sn-icon-picker');
    if(picker&&!picker.hidden&&!picker.contains(e.target)&&!$('sn-icon-current').contains(e.target))hideCategoryIconPicker();
});
document.addEventListener('scroll',positionCategoryIconPicker,true);
window.addEventListener('resize',positionCategoryIconPicker);
window.visualViewport?.addEventListener('resize',positionCategoryIconPicker);
window.visualViewport?.addEventListener('scroll',positionCategoryIconPicker);
$('sn-cat-name').addEventListener('input',updateCategoryPreview);
$('sn-cat-color').addEventListener('input',updateCategoryPreview);
$('sn-add-category').onclick=()=>openCategoryEditor();
$('sn-cancel-category').onclick=closeCategoryEditor;
$('sn-save-category').onclick=()=>saveCategory().catch(showError);
['sn-base-color','sn-marker-mode','sn-marker-size'].forEach(id=>$(id).addEventListener('input',()=>{updatePreview();if(!$('sn-category-editor').hidden)updateCategoryPreview()}));
$('sn-assigned-search').addEventListener('focus',()=>searchAssignees($('sn-assigned-search').value).catch(showError));
$('sn-assigned-search').addEventListener('input',e=>{clearTimeout(timer);timer=setTimeout(()=>searchAssignees(e.target.value).catch(showError),200)});
$('sn-assigned-results').onclick=e=>{
    const b=e.target.closest('[data-assignee]');if(!b)return;
    const value=b.dataset.assignee;
    const label=(value.startsWith('group:')?'👥 ':'👤 ')+b.querySelector('strong').textContent;
    selectAssignee(value);
};
$('sn-assigned-selected').onclick=e=>{const button=e.target.closest('[data-remove-assignee]');if(button)clearAssignee(button.dataset.removeAssignee)};
document.addEventListener('scroll',positionAssigneeResults,true);
const nCoreTopOffset=Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-height'))||50;
const oCoreLayoutController=oCore.layout.observe(oAppShell,{topOffset:nCoreTopOffset,onResize:()=>{
    syncVisualViewport();
    positionAssigneeResults();
    requestAnimationFrame(()=>{alignEditorPaper();alignRenderedPapers();});
}});
const fnDocumentPointerDown=(e)=>{
    const picker=e.target.closest?.('.sn-assignee-picker');
    if(!picker)hideAssigneeResults();
};
document.addEventListener('pointerdown',fnDocumentPointerDown);
$('sn-sort').onchange=()=>{currentPage=1;settings.sortMode=$('sn-sort').value;saveSettings().catch(showError)};
$('sn-search').oninput=()=>{currentPage=1;render()};

$('sn-page-size').value=Number(settings.pageSize)||24;
$('sn-page-size').onchange=()=>{
    settings.pageSize=Number($('sn-page-size').value)||24;
    $('sn-settings-page-size').value=settings.pageSize;
    currentPage=1;
    saveSettings().catch(showError);
};
$('sn-settings-page-size').onchange=()=>{
    settings.pageSize=Number($('sn-settings-page-size').value)||24;
    $('sn-page-size').value=settings.pageSize;
    currentPage=1;
    render();
};
$('sn-page-first').onclick=()=>{currentPage=1;render()};
$('sn-page-prev').onclick=()=>{if(currentPage>1){currentPage--;render()}};
$('sn-page-next').onclick=()=>{currentPage++;render()};
$('sn-page-last').onclick=()=>{
    const filtered=orderedNotes(notes.filter(visible));
    const ps=Number(settings.pageSize)||24;
    currentPage=Math.max(1,Math.ceil(filtered.length/ps));
    render();
};

document.querySelectorAll('.sn-filters button').forEach(b=>b.onclick=()=>{document.querySelectorAll('.sn-filters button').forEach(x=>x.classList.remove('active'));b.classList.add('active');filter=b.dataset.filter;currentPage=1;render()});
$('sn-category-filters').onclick=e=>{const b=e.target.closest('[data-cat]');if(b){categoryFilter=Number(b.dataset.cat);currentPage=1;render()}};
$('sn-board').onclick=async e=>{const b=e.target.closest('button');
    if(!b)return;
    const n=notes.find(x=>x.id==b.closest('.sn-card')?.dataset.id);if(!n)return;try{if(b.dataset.act==='pin'){
        const id=Number(n.id),pins=new Set((settings.pinnedNoteIds||[]).map(Number));
        if(pins.has(id))pins.delete(id);else pins.add(id);
        settings.pinnedNoteIds=[...pins];
        await saveLayout();render();
    }else if(b.dataset.act==='edit')openEditor(n);else if(b.dataset.act==='share')await openShare(n);else if(b.dataset.act==='complete'){await api(`/api/notes/${n.id}/complete`,{method:'POST'});await loadAll()}else if(b.dataset.act==='delete'){
        if(await confirmAction(t('hc_stickynotes','Delete this sticky note?'),t('hc_stickynotes','Delete sticky note'))){
            try{await api(`/api/notes/${n.id}/editor`,{method:'DELETE'})}catch(_){}
            await api(`/api/notes/${n.id}`,{method:'DELETE'});
            await loadAll();
        }
    }}catch(err){showError(err)}};
$('sn-board').addEventListener('dblclick',e=>{
    if(e.target.closest('button,a,input,select,textarea,[contenteditable="true"]'))return;
    const card=e.target.closest('.sn-card');
    if(!card)return;
    const n=notes.find(x=>String(x.id)===String(card.dataset.id));
    if(n)openEditor(n);
});

// Double-click opens only categories the current user is allowed to edit.
// Interactive action buttons are excluded so delete remains explicit and confirmed.
function handleCategoryRowDblClick(oEvent){
    if(oEvent.target.closest('button,a,input,select,textarea,[contenteditable="true"]'))return;
    const oRow=oEvent.target.closest('[data-cat-row]');
    if(!oRow)return;
    const oCategory=category(oRow.dataset.catRow);
    if(oCategory?.canEdit)openCategoryEditor(oCategory);
}
function handleCategoryRowKeydown(oEvent){
    if(oEvent.key!=='Enter'&&oEvent.key!==' ')return;
    const oRow=oEvent.target.closest('[data-cat-row]');
    if(!oRow||oEvent.target!==oRow)return;
    const oCategory=category(oRow.dataset.catRow);
    if(!oCategory?.canEdit)return;
    oEvent.preventDefault();
    openCategoryEditor(oCategory);
}
$('sn-categories-list').addEventListener('dblclick',handleCategoryRowDblClick);
$('sn-categories-list').addEventListener('keydown',handleCategoryRowKeydown);

$('sn-categories-list').onclick=async e=>{const ed=e.target.closest('[data-cat-edit]'),del=e.target.closest('[data-cat-delete]');if(ed)openCategoryEditor(category(ed.dataset.catEdit));if(del&&await confirmAction(t('hc_stickynotes','Delete this category?'),t('hc_stickynotes','Delete category'))){try{await api(`/api/categories/${del.dataset.catDelete}`,{method:'DELETE'});await loadCategories();renderSettings();render()}catch(err){showError(err)}}};

$('sn-board').addEventListener('dragstart',e=>{
    const card=e.target.closest('.sn-card');if(!card||settings.sortMode!=='manual')return;
    draggedNoteId=Number(card.dataset.id);
    card.classList.add('sn-dragging');
    e.dataTransfer.effectAllowed='move';
});
$('sn-board').addEventListener('dragend',e=>{
    e.target.closest('.sn-card')?.classList.remove('sn-dragging');
    draggedNoteId=null;
});
$('sn-board').addEventListener('dragover',e=>{
    const target=e.target.closest('.sn-card');if(settings.sortMode!=='manual'||!target||draggedNoteId===null)return;
    const pins=pinnedIds();
    if(pins.has(draggedNoteId)!==pins.has(Number(target.dataset.id)))return;
    e.preventDefault();
    e.dataTransfer.dropEffect='move';
});
$('sn-board').addEventListener('drop',async e=>{
    const target=e.target.closest('.sn-card');if(settings.sortMode!=='manual'||!target||draggedNoteId===null)return;
    const targetId=Number(target.dataset.id);
    if(targetId===draggedNoteId)return;
    const pins=pinnedIds();
    if(pins.has(draggedNoteId)!==pins.has(targetId))return;
    e.preventDefault();
    const current=orderedNotes(notes).map(n=>Number(n.id));
    const from=current.indexOf(draggedNoteId),to=current.indexOf(targetId);
    if(from<0||to<0)return;
    current.splice(to,0,current.splice(from,1)[0]);
    settings.noteOrder=current;
    try{await saveLayout();render()}catch(err){showError(err)}
});

$('sn-share-search').oninput=e=>{clearTimeout(timer);timer=setTimeout(()=>searchTargets(e.target.value).catch(showError),250)};
$('sn-share-results').onclick=async e=>{const b=e.target.closest('[data-target-id]');if(!b)return;try{await api(`/api/notes/${sharingNote.id}/shares`,{method:'POST',body:JSON.stringify({shareType:b.dataset.targetType,shareWith:b.dataset.targetId,permission:$('sn-share-permission').value})});await loadAll();sharingNote=notes.find(x=>x.id==sharingNote.id);renderShares()}catch(err){showError(err)}};
$('sn-current-shares').onclick=async e=>{const b=e.target.closest('[data-unshare]');if(!b)return;try{await api(`/api/notes/${sharingNote.id}/shares/${b.dataset.unshare}`,{method:'DELETE'});await loadAll();sharingNote=notes.find(x=>x.id==sharingNote.id);renderShares()}catch(err){showError(err)}};

let snSavedRange=null;
let snActiveEditable=$('sn-rich-body');
const SN_EMOJI_CATEGORIES=[
    {id:'recent',icon:'🕘',label:'Recent',items:[]},
    {id:'smileys',icon:'😀',label:'Smileys',items:['😀','😃','😄','😁','😆','😅','😂','🤣','🥲','😊','😇','🙂','🙃','😉','😌','😍','🥰','😘','😗','😙','😚','😋','😛','😝','😜','🤪','🤨','🧐','🤓','😎','🥸','🤩','🥳','🙂‍↕️','😏','😒','🙂‍↔️','😞','😔','😟','😕','🙁','☹️','😣','😖','😫','😩','🥺','😢','😭','😤','😠','😡','🤬','🤯','😳','🥵','🥶','😱','😨','😰','😥','😓','🤗','🤔','🫣','🤭','🫢','🫡','🤫','🫠','🤥','😶','🫥','😐','🫤','😑','🫨','😬','🙄','😯','😦','😧','😮','😲','🥱','😴','🤤','😪','😵','😵‍💫','🤐','🥴','🤢','🤮','🤧','😷','🤒','🤕','🤑','🤠','😈','👿','👹','👺','🤡','💩','👻','💀','☠️','👽','👾','🤖']},
    {id:'people',icon:'👋',label:'People',items:['👋','🤚','🖐️','✋','🖖','🫱','🫲','🫳','🫴','🫷','🫸','👌','🤌','🤏','✌️','🤞','🫰','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','🫵','👍','👎','✊','👊','🤛','🤜','👏','🙌','🫶','👐','🤲','🤝','🙏','✍️','💅','🤳','💪','🦾','🦿','🦵','🦶','👂','🦻','👃','🧠','🫀','🫁','🦷','🦴','👀','👁️','👅','👄','🫦','👶','🧒','👦','👧','🧑','👱','👨','🧔','👩','🧓','👴','👵','🙍','🙎','🙅','🙆','💁','🙋','🧏','🙇','🤦','🤷','👮','👷','💂','🕵️','👩‍⚕️','👨‍🌾','👩‍🍳','👨‍🎓','👩‍🎤','👨‍🏫','👩‍🏭','👨‍💻','👩‍💼','👨‍🔧','👩‍🔬','👨‍🎨','👩‍🚒','👨‍✈️','👩‍🚀','👨‍⚖️']},
    {id:'animals',icon:'🐶',label:'Animals',items:['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐻‍❄️','🐨','🐯','🦁','🐮','🐷','🐽','🐸','🐵','🙈','🙉','🙊','🐒','🐔','🐧','🐦','🐤','🐣','🐥','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝','🪱','🐛','🦋','🐌','🐞','🐜','🪰','🪲','🪳','🦟','🦗','🕷️','🦂','🐢','🐍','🦎','🦖','🦕','🐙','🦑','🪼','🦐','🦞','🦀','🐡','🐠','🐟','🐬','🐳','🐋','🦈','🦭','🐊','🐅','🐆','🦓','🦍','🦧','🦣','🐘','🦛','🦏','🐪','🐫','🦒','🦘','🦬','🐃','🐂','🐄','🫏','🐎','🐖','🐏','🐑','🦙','🐐','🦌','🫎','🐕','🐩','🦮','🐕‍🦺','🐈','🐈‍⬛','🪽','🪶','🐓','🦃','🦤','🦚','🦜','🦢','🪿','🦩','🕊️','🐇','🦝','🦨','🦡','🦫','🦦','🦥','🐁','🐀','🐿️','🦔']},
    {id:'food',icon:'🍕',label:'Food',items:['🍏','🍎','🍐','🍊','🍋','🍋‍🟩','🍌','🍉','🍇','🍓','🫐','🍈','🍒','🍑','🥭','🍍','🥥','🥝','🍅','🍆','🥑','🥦','🫛','🥬','🥒','🌶️','🫑','🌽','🥕','🫒','🧄','🧅','🥔','🍠','🫚','🥐','🥯','🍞','🥖','🥨','🧀','🥚','🍳','🧈','🥞','🧇','🥓','🥩','🍗','🍖','🌭','🍔','🍟','🍕','🫓','🥪','🥙','🧆','🌮','🌯','🫔','🥗','🥘','🫕','🥫','🍝','🍜','🍲','🍛','🍣','🍱','🥟','🦪','🍤','🍙','🍚','🍘','🍥','🥠','🥮','🍢','🍡','🍧','🍨','🍦','🥧','🧁','🍰','🎂','🍮','🍭','🍬','🍫','🍿','🍩','🍪','🌰','🥜','🍯','🥛','☕','🫖','🍵','🧃','🥤','🧋','🧊']},
    {id:'activities',icon:'⚽',label:'Activities',items:['⚽','🏀','🏈','⚾','🥎','🎾','🏐','🏉','🥏','🎱','🪀','🏓','🏸','🏒','🏑','🥍','🏏','🪃','🥅','⛳','🪁','🏹','🎣','🤿','🥊','🥋','🎽','🛹','🛼','🛷','⛸️','🥌','🎿','⛷️','🏂','🪂','🏋️','🤼','🤸','⛹️','🤺','🤾','🏌️','🏇','🧘','🏄','🏊','🤽','🚣','🧗','🚵','🚴','🏆','🥇','🥈','🥉','🏅','🎖️','🏵️','🎗️','🎫','🎟️','🎪','🤹','🎭','🩰','🎨','🎬','🎤','🎧','🎼','🎹','🥁','🪘','🎷','🎺','🪗','🎸','🪕','🎻','🪈','🎲','♟️','🎯','🎳','🎮','🎰','🧩']},
    {id:'travel',icon:'🚗',label:'Travel',items:['🚗','🚕','🚙','🚌','🚎','🏎️','🚓','🚑','🚒','🚐','🛻','🚚','🚛','🚜','🦯','🦽','🦼','🛴','🚲','🛵','🏍️','🛺','🚨','🚔','🚍','🚘','🚖','🚡','🚠','🚟','🚃','🚋','🚞','🚝','🚄','🚅','🚈','🚂','🚆','🚇','🚊','🚉','✈️','🛫','🛬','🛩️','💺','🛰️','🚀','🛸','🚁','🛶','⛵','🚤','🛥️','🛳️','⛴️','🚢','⚓','🛟','⛽','🚧','🚦','🚥','🗺️','🗿','🗽','🗼','🏰','🏯','🏟️','🎡','🎢','🎠','⛲','⛱️','🏖️','🏝️','🏜️','🌋','⛰️','🏕️','⛺','🛖','🏠','🏡','🏢','🏥','🏦','🏨','🏪','🏫','🏭','🏛️','⛪','🕌','🛕','🕍','⛩️','🕋']},
    {id:'objects',icon:'💡',label:'Objects',items:['⌚','📱','📲','💻','⌨️','🖥️','🖨️','🖱️','🖲️','🕹️','🗜️','💽','💾','💿','📀','📼','📷','📸','📹','🎥','📽️','🎞️','📞','☎️','📟','📠','📺','📻','🎙️','🎚️','🎛️','🧭','⏱️','⏲️','⏰','🕰️','⌛','⏳','📡','🔋','🪫','🔌','💡','🔦','🕯️','🪔','🧯','🛢️','💸','💵','💴','💶','💷','🪙','💳','🧾','💎','⚖️','🪜','🧰','🪛','🔧','🔨','⚒️','🛠️','⛏️','🪚','🔩','⚙️','🪤','🧱','⛓️','🧲','🔫','💣','🧨','🪓','🔪','🗡️','⚔️','🛡️','🚬','⚰️','🪦','⚱️','🏺','🔮','📿','🧿','🪬','💈','⚗️','🔭','🔬','🕳️','🩹','🩺','🩻','🩼','💊','💉','🩸','🧬','🦠','🧫','🧪','🌡️','🧹','🪠','🧺','🧻','🚽','🚿','🛁','🪥','🪒','🧴','🧷','🧹','🧽','🪣','🧼','🫧','🛎️','🔑','🗝️','🚪','🪑','🛋️','🛏️','🧸','🪞','🪟','🛍️','🛒','🎁','🎈','🎏','🎀','🪄','🪅','🎊','🎉','🪩','🪆','🖼️','🧵','🪡','🧶','🪢','👓','🕶️','🥽','🥼','🦺','👔','👕','👖','🧣','🧤','🧥','🧦','👗','👘','🥻','🩱','🩲','🩳','👙','👚','🪭','👛','👜','👝','🎒','🩴','👞','👟','🥾','🥿','👠','👡','🩰','👢','🪮','👑','👒','🎩','🎓','🧢','🪖','⛑️','📿','💄','💍','💼']},
    {id:'symbols',icon:'❤️',label:'Symbols',items:['❤️','🩷','🧡','💛','💚','💙','🩵','💜','🤎','🖤','🩶','🤍','💔','❤️‍🔥','❤️‍🩹','❣️','💕','💞','💓','💗','💖','💘','💝','💟','☮️','✝️','☪️','🕉️','☸️','✡️','🔯','🕎','☯️','☦️','🛐','⛎','♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓','🆔','⚛️','☢️','☣️','📴','📳','🈶','🈚','🈸','🈺','🈷️','✴️','🆚','💮','🉐','㊙️','㊗️','🈴','🈵','🈹','🈲','🅰️','🅱️','🆎','🆑','🅾️','🆘','❌','⭕','🛑','⛔','📛','🚫','💯','💢','♨️','🚷','🚯','🚳','🚱','🔞','📵','🚭','❗','❕','❓','❔','‼️','⁉️','🔅','🔆','〽️','⚠️','🚸','🔱','⚜️','🔰','♻️','✅','🈯','💹','❇️','✳️','❎','🌐','💠','Ⓜ️','🌀','💤','🏧','🚾','♿','🅿️','🛗','🛂','🛃','🛄','🛅','🚹','🚺','🚼','⚧️','🚻','🚮','🎦','📶','🈁','🔣','ℹ️','🔤','🔡','🔠','🆖','🆗','🆙','🆒','🆕','🆓','0️⃣','1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟','#️⃣','*️⃣','▶️','⏸️','⏯️','⏹️','⏺️','⏭️','⏮️','⏩','⏪','🔀','🔁','🔂','◀️','🔼','🔽','⏫','⏬','➡️','⬅️','⬆️','⬇️','↗️','↘️','↙️','↖️','↕️','↔️','↪️','↩️','⤴️','⤵️','🔃','🔄','🎵','🎶','➕','➖','➗','✖️','🟰','♾️','💲','™️','©️','®️','〰️','➰','➿','🔚','🔙','🔛','🔝','🔜','✔️','☑️','🔘','🔴','🟠','🟡','🟢','🔵','🟣','🟤','⚫','⚪','🟥','🟧','🟨','🟩','🟦','🟪','🟫','⬛','⬜','◼️','◻️','◾','◽','▪️','▫️','🔶','🔷','🔸','🔹','🔺','🔻','💠','🔳','🔲']},
    {id:'flags',icon:'🚩',label:'Flags',items:['🏁','🚩','🎌','🏴','🏳️','🏳️‍🌈','🏳️‍⚧️','🏴‍☠️','🇨🇿','🇸🇰','🇩🇪','🇦🇹','🇵🇱','🇺🇦','🇫🇷','🇮🇹','🇪🇸','🇵🇹','🇳🇱','🇧🇪','🇩🇰','🇸🇪','🇳🇴','🇫🇮','🇮🇸','🇮🇪','🇬🇧','🇨🇭','🇭🇺','🇷🇴','🇧🇬','🇭🇷','🇸🇮','🇬🇷','🇹🇷','🇺🇸','🇨🇦','🇲🇽','🇧🇷','🇦🇷','🇯🇵','🇰🇷','🇨🇳','🇮🇳','🇦🇺','🇳🇿','🇿🇦','🇪🇺']}
];
let snEmojiCategory='smileys';
function rememberEditorSelection(){
    const sel=window.getSelection();
    if(!sel||!sel.rangeCount)return;
    const r=sel.getRangeAt(0);
    const title=$('sn-rich-title'),body=$('sn-rich-body');
    if(title.contains(r.commonAncestorContainer)){snSavedRange=r.cloneRange();snActiveEditable=title;}
    else if(body.contains(r.commonAncestorContainer)){snSavedRange=r.cloneRange();snActiveEditable=body;}
}
function restoreEditorSelection(){
    const target=snActiveEditable||$('sn-rich-body');
    target.focus();
    const sel=window.getSelection();
    if(snSavedRange&&sel){sel.removeAllRanges();sel.addRange(snSavedRange);}
}
function getRecentEmoji(){
    try{
        const sNewKey='hc_stickynotes.recentEmoji';
        const sOldKey='stickynotes.recentEmoji';
        if(localStorage.getItem(sNewKey)===null&&localStorage.getItem(sOldKey)!==null){
            localStorage.setItem(sNewKey,localStorage.getItem(sOldKey)||'[]');
        }
        return JSON.parse(localStorage.getItem(sNewKey)||'[]').filter(Boolean).slice(0,28);
    }catch(_e){return []}
}
function rememberRecentEmoji(emoji){
    const list=[emoji,...getRecentEmoji().filter(e=>e!==emoji)].slice(0,28);
    try{localStorage.setItem('hc_stickynotes.recentEmoji',JSON.stringify(list))}catch(_e){}
}
function emojiCategoryItems(id){
    if(id==='recent')return getRecentEmoji();
    return SN_EMOJI_CATEGORIES.find(c=>c.id===id)?.items||[];
}
function renderEmojiPicker(){
    const q=safeLower($('sn-emoji-search')?.value).trim();
    $('sn-emoji-tabs').innerHTML=SN_EMOJI_CATEGORIES.map(c=>`<button type="button" data-emoji-cat="${c.id}" class="${snEmojiCategory===c.id?'active':''}" title="${esc(t('hc_stickynotes',c.label))}">${c.icon}</button>`).join('');
    let items=[];
    if(q){
        SN_EMOJI_CATEGORIES.filter(c=>c.id!=='recent').forEach(c=>{
            const sLabel=String(c.label??'');
            const sTranslated=t('hc_stickynotes',sLabel);
            if(safeLower(sLabel).includes(q)||safeLower(sTranslated??sLabel).includes(q))items.push(...(Array.isArray(c.items)?c.items:[]));
        });
        if(!items.length)items=SN_EMOJI_CATEGORIES.filter(c=>c.id!=='recent').flatMap(c=>c.items).filter(e=>e.includes(q));
    }else items=emojiCategoryItems(snEmojiCategory);
    items=[...new Set(items)];
    $('sn-emoji-grid').innerHTML=items.length?items.map(e=>`<button type="button" data-emoji="${e}" title="${e}">${e}</button>`).join(''):`<div class="sn-emoji-empty">${esc(t('hc_stickynotes','No emoji found.'))}</div>`;
}
function openEmojiPicker(){
    const picker=$('sn-emoji-picker');
    const recent=getRecentEmoji();
    if(recent.length)snEmojiCategory='recent';
    $('sn-emoji-search').value='';
    picker.hidden=false;picker.setAttribute('aria-hidden','false');
    renderEmojiPicker();
}
function closeEmojiPicker(){const p=$('sn-emoji-picker');p.hidden=true;p.setAttribute('aria-hidden','true');}
function insertEmoji(emoji){
    restoreEditorSelection();
    document.execCommand('insertText',false,emoji);
    rememberEditorSelection();rememberRecentEmoji(emoji);syncPlainFields();closeEmojiPicker();
}
['sn-rich-title','sn-rich-body'].forEach(id=>{
    $(id).addEventListener('keyup',rememberEditorSelection);
    $(id).addEventListener('mouseup',rememberEditorSelection);
    $(id).addEventListener('focus',()=>{snActiveEditable=$(id);rememberEditorSelection()});
    $(id).addEventListener('input',()=>{syncPlainFields();requestAnimationFrame(alignEditorPaper)});
});
const fnSelectionChange=()=>{
    const active=document.activeElement;
    if(active===$('sn-rich-title')||active===$('sn-rich-body'))rememberEditorSelection();
};
document.addEventListener('selectionchange',fnSelectionChange);
document.querySelectorAll('.sn-rich-toolbar [data-cmd]').forEach(btn=>btn.addEventListener('mousedown',e=>e.preventDefault()));
document.querySelectorAll('.sn-rich-toolbar [data-cmd]').forEach(btn=>btn.addEventListener('click',()=>{
    restoreEditorSelection();
    document.execCommand(btn.dataset.cmd,false,null);
    rememberEditorSelection();
    syncPlainFields();
    requestAnimationFrame(alignEditorPaper);
}));
$('sn-block-format').onchange=e=>{restoreEditorSelection();document.execCommand('formatBlock',false,e.target.value);rememberEditorSelection();syncPlainFields();requestAnimationFrame(alignEditorPaper);};
$('sn-insert-link').onmousedown=e=>e.preventDefault();
$('sn-insert-link').onclick=async()=>{const sUrl=await fnPromptLinkUrl();if(sUrl){restoreEditorSelection();document.execCommand('createLink',false,sUrl);rememberEditorSelection();syncPlainFields();}};
$('sn-remove-link').onmousedown=e=>e.preventDefault();
$('sn-remove-link').onclick=()=>{restoreEditorSelection();document.execCommand('unlink');rememberEditorSelection();syncPlainFields();};
$('sn-insert-table').onmousedown=e=>e.preventDefault();
$('sn-insert-table').onclick=()=>{restoreEditorSelection();document.execCommand('insertHTML',false,'<table><tbody><tr><td>1</td><td>2</td></tr><tr><td>3</td><td>4</td></tr></tbody></table><p><br></p>');rememberEditorSelection();syncPlainFields();};
$('sn-insert-check').onmousedown=e=>e.preventDefault();
$('sn-insert-check').onclick=()=>{restoreEditorSelection();document.execCommand('insertHTML',false,'<p>☐&nbsp;</p>');rememberEditorSelection();syncPlainFields();};
$('sn-insert-emoji').onmousedown=e=>{e.preventDefault();rememberEditorSelection();};
$('sn-insert-emoji').onclick=()=>{$('sn-emoji-picker').hidden?openEmojiPicker():closeEmojiPicker();};
$('sn-emoji-close').onclick=closeEmojiPicker;
$('sn-emoji-search').oninput=renderEmojiPicker;
$('sn-emoji-tabs').onclick=e=>{const b=e.target.closest('[data-emoji-cat]');if(!b)return;snEmojiCategory=b.dataset.emojiCat;$('sn-emoji-search').value='';renderEmojiPicker();};
$('sn-emoji-grid').onclick=e=>{const b=e.target.closest('[data-emoji]');if(!b)return;insertEmoji(b.dataset.emoji);};

let bCleanedUp=false;
function fnCleanup(){
    if(bCleanedUp)return;
    bCleanedUp=true;
    window.removeEventListener('error',fnGlobalError);
    document.removeEventListener('keydown',fnDocumentKeydown);
    document.removeEventListener('scroll',positionAssigneeResults,true);
    if(typeof fnDocumentPointerDown==='function')document.removeEventListener('pointerdown',fnDocumentPointerDown);
    if(typeof fnSelectionChange==='function')document.removeEventListener('selectionchange',fnSelectionChange);
    clearTimeout(timer);
    clearTimeout(showError._timer);
    try{oCoreLayoutController?.destroy();}catch(_e){}
    try{oCoreToolbarController?.destroy();}catch(_e){}
    try{oCoreAboutController?.destroy();}catch(_e){}
}
window.addEventListener('pagehide',fnCleanup,{once:true});
window.addEventListener('beforeunload',fnCleanup,{once:true});
syncVisualViewport();
oRoot.dataset.coreGuardState='mounted';
fnCoreLog('info','Sticky Notes frontend started.',{sAppVersion:oRoot.dataset.appVersion,sCoreVersion:oCore.version});
await loadAll();
})();
window.HcStickyNotesMountPromise = fnStickyNotesMount;
})();
