(() => {
'use strict';

const api=async(path)=>{
    const r=await fetch(OC.generateUrl('/apps/hc_stickynotes'+path),{
        cache:'no-store',
        headers:{requesttoken:OC.requestToken,'Content-Type':'application/json'}
    });
    const text=await r.text();
    let data={};
    try{data=text?JSON.parse(text):{}}catch(_){data={}}
    if(!r.ok)throw new Error(data.error||r.statusText);
    return data;
};


function normalizeHexColor(color){
    if(typeof color!=='string')return '#fff59d';
    let c=color.trim();
    if(/^#[0-9a-f]{3}$/i.test(c))c='#'+c.slice(1).split('').map(x=>x+x).join('');
    return /^#[0-9a-f]{6}$/i.test(c)?c.toLowerCase():'#fff59d';
}
function contrastTextColor(background){
    const c=normalizeHexColor(background).slice(1);
    const rgb=[0,2,4].map(i=>parseInt(c.slice(i,i+2),16)/255).map(v=>v<=0.04045?v/12.92:Math.pow((v+0.055)/1.055,2.4));
    const L=0.2126*rgb[0]+0.7152*rgb[1]+0.0722*rgb[2];
    return 1.05/(L+0.05)>(L+0.05)/0.05?'#ffffff':'#171717';
}

function noteTilt(id){const n=Number(id)||0;const raw=((n*37)%9)-4;return raw===0?1:raw;}
const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

function sortNotes(notes,categories,settings){
    const cat=id=>categories.find(c=>c.id==id);
    const pins=new Set((settings.pinnedNoteIds||[]).map(Number));
    const order=(settings.noteOrder||[]).map(Number);
    const pos=new Map(order.map((id,i)=>[id,i]));
    const mode=settings.sortMode||'manual';

    return [...notes].filter(n=>!n.completedAt).sort((a,b)=>{
        const ap=pins.has(Number(a.id)),bp=pins.has(Number(b.id));
        if(ap!==bp)return ap?-1:1;
        if(mode==='category'){
            const ac=(cat(a.categoryId)?.name||'').toLocaleLowerCase();
            const bc=(cat(b.categoryId)?.name||'').toLocaleLowerCase();
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

OCA.Dashboard.register('hc_stickynotes', (el) => {
    el.innerHTML=`<div class="sn-widget"><a class="sn-widget-new sn-widget-new-top" href="${OC.generateUrl('/apps/hc_stickynotes/')}?new=1">+ ${t('hc_stickynotes','New sticky note')}</a><div class="sn-widget-loading">${t('hc_stickynotes','Loading…')}</div><div class="sn-widget-grid"></div></div>`;

    Promise.all([api('/api/notes'),api('/api/categories'),api('/api/settings')]).then(([notes,catRes,settings])=>{
        const categories=catRes.categories||[];
        const cat=id=>categories.find(c=>c.id==id);
        const cols=Math.max(1,Math.min(4,Number(settings.widgetColumns)||2));
        const rows=Math.max(1,Math.min(6,Number(settings.widgetRows)||4));
        const max=cols*rows;
        const list=sortNotes(notes,categories,settings).slice(0,max);

        const grid=el.querySelector('.sn-widget-grid');
        grid.style.setProperty('--sn-widget-cols',String(cols));
        el.querySelector('.sn-widget-loading').remove();

        grid.innerHTML=list.map(n=>{
            const c=cat(n.categoryId);
            const st=c?.style||{};const mode=(st.markerMode&&st.markerMode!=='inherit')?st.markerMode:(settings.markerMode||'header');const mark=st.markerColor||c?.color||n.color||'#4f86f7';const base=st.background||settings.baseColor||'#fff59d';const paper=st.paperType||'plain';const textColor=contrastTextColor(mode==='full'?mark:base);
            return `<a class="sn-widget-card sn-marker-${esc(mode)} sn-paper-${esc(paper)}" href="${OC.generateUrl('/apps/hc_stickynotes/')}" style="--sn-base:${esc(base)};--sn-marker:${esc(mark)};--sn-text:${textColor};--sn-marker-size:${Number(settings.markerSize)||7}px;--sn-tilt:${settings.randomTilt===false?0:noteTilt(n.id)}deg">
                ${c?`<div class="${mode==='header'?'sn-widget-category-head':'sn-widget-category-badge'}" style="--sn-category:${esc(c.color)}"><span>${esc(c.icon||'📝')}</span><strong>${esc(c.name)}</strong></div>`:''}
                <strong class="sn-widget-title">${esc(n.title||t('hc_stickynotes','Untitled note'))}</strong>
                <div class="sn-widget-content">${esc(n.content||'')}</div>
                ${n.priority==='important'?'<span class="sn-widget-priority">❗</span>':''}
            </a>`;
        }).join('');
        const alignWidgetPapers=()=>{
            grid.querySelectorAll('.sn-widget-card:not(.sn-paper-plain)').forEach(card=>{
                const content=card.querySelector('.sn-widget-content');
                if(!content)return;
                const cs=getComputedStyle(content);
                const fontSize=parseFloat(cs.fontSize)||14;
                let lineHeight=parseFloat(cs.lineHeight);
                if(!Number.isFinite(lineHeight)||lineHeight<=0)lineHeight=fontSize*1.45;
                const baseline=Math.min(lineHeight-2,((lineHeight-fontSize)/2)+(fontSize*.86)+1);
                card.style.setProperty('--sn-paper-step',`${lineHeight}px`);
                card.style.setProperty('--sn-paper-origin-y',`${(content.offsetTop||0)+baseline-lineHeight}px`);
            });
        };
        requestAnimationFrame(alignWidgetPapers);
        if('ResizeObserver' in window)new ResizeObserver(()=>requestAnimationFrame(alignWidgetPapers)).observe(grid);

        if(!list.length){
            grid.innerHTML=`<div class="sn-widget-empty">${t('hc_stickynotes','No sticky notes yet.')}</div>`;
        }
    }).catch(err=>{
        const loading=el.querySelector('.sn-widget-loading');
        if(loading)loading.textContent=t('hc_stickynotes','Unable to load Sticky Notes');
        console.error('[Sticky Notes widget]',err);
    });
});
})();
