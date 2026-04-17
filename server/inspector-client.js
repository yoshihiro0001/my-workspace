/**
 * Inspector script — プレビュー iframe に注入される。
 * 要素の選択・ハイライトを行い、親フレームに postMessage で通知する。
 * data-ws-file / data-ws-line が付いたビルドではソース位置を親に渡す。
 */
export const INSPECTOR_SCRIPT = `<script data-inspector="true">(function(){
  var inspectMode = false;
  var hoverEl = null;

  var ov = document.createElement('div');
  ov.id='__ins_ov';
  ov.style.cssText='position:fixed;pointer-events:none;z-index:2147483646;border:2px solid #00ff88;background:rgba(0,255,136,0.08);transition:all 80ms ease;display:none;border-radius:3px;';
  document.documentElement.appendChild(ov);

  var sel = document.createElement('div');
  sel.id='__ins_sel';
  sel.style.cssText='position:fixed;pointer-events:none;z-index:2147483645;border:2px solid #00aaff;background:rgba(0,170,255,0.06);display:none;border-radius:3px;';
  document.documentElement.appendChild(sel);

  var label = document.createElement('div');
  label.id='__ins_label';
  label.style.cssText='position:fixed;z-index:2147483647;pointer-events:none;background:#0a0a0a;color:#00ff88;font:500 11px/1.4 monospace;padding:2px 8px;border-radius:4px;display:none;max-width:90vw;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;border:1px solid rgba(0,255,136,0.3);';
  document.documentElement.appendChild(label);

  window.addEventListener('message',function(e){
    if(!e.data) return;
    if(e.data.type==='inspector-toggle'){
      inspectMode=!!e.data.enabled;
      if(!inspectMode){ ov.style.display='none'; label.style.display='none'; }
    }
    if(e.data.type==='inspector-clear'){
      sel.style.display='none'; ov.style.display='none'; label.style.display='none';
    }
  });

  function isInspectorEl(el){ return el&&el.id&&el.id.startsWith('__ins_'); }

  function positionBox(box,rect){
    box.style.display='block';
    box.style.left=rect.left+'px'; box.style.top=rect.top+'px';
    box.style.width=rect.width+'px'; box.style.height=rect.height+'px';
  }

  function findSource(el){
    var cur=el;
    while(cur&&cur!==document.documentElement){
      if(cur.getAttribute){
        var f=cur.getAttribute('data-ws-file');
        var ln=cur.getAttribute('data-ws-line');
        if(f&&ln){ return {file:f,line:parseInt(ln,10)}; }
      }
      cur=cur.parentElement;
    }
    return null;
  }

  function showLabel(el,rect){
    var tag=el.tagName.toLowerCase();
    var cls=el.className&&typeof el.className==='string'?'.'+el.className.trim().split(/\\s+/).join('.'):'';
    var id=el.id&&!el.id.startsWith('__ins_')?'#'+el.id:'';
    var src=findSource(el);
    label.textContent= src ? (src.file+':'+src.line+' · <'+tag+id+cls+'>') : ('<'+tag+id+cls+'>');
    label.style.display='block';
    var lx=rect.left; var ly=rect.top-24;
    if(ly<0) ly=rect.bottom+4;
    label.style.left=lx+'px'; label.style.top=ly+'px';
  }

  function handleHover(x,y){
    if(!inspectMode) return;
    var el=document.elementFromPoint(x,y);
    if(!el||isInspectorEl(el)||el===hoverEl) return;
    hoverEl=el;
    var r=el.getBoundingClientRect();
    positionBox(ov,r);
    showLabel(el,r);
  }

  document.addEventListener('mousemove',function(e){ handleHover(e.clientX,e.clientY); },true);
  document.addEventListener('touchmove',function(e){ if(!inspectMode)return; var t=e.touches[0]; handleHover(t.clientX,t.clientY); },{passive:true});

  function selectElement(el){
    var r=el.getBoundingClientRect();
    positionBox(sel,r);
    var cs=window.getComputedStyle(el);
    var src=findSource(el);
    var info={
      type:'element-selected',
      tag:el.tagName.toLowerCase(),
      id:el.id||'',
      classes:el.className&&typeof el.className==='string'?el.className.trim().split(/\\s+/).filter(Boolean):[],
      text:(el.textContent||'').trim().slice(0,120),
      attributes:{},
      styles:{
        color:cs.color, backgroundColor:cs.backgroundColor,
        fontSize:cs.fontSize, fontWeight:cs.fontWeight,
        padding:cs.padding, margin:cs.margin,
        borderRadius:cs.borderRadius, width:cs.width, height:cs.height,
        display:cs.display, border:cs.border
      },
      rect:{x:r.x,y:r.y,width:r.width,height:r.height},
      html:el.outerHTML.slice(0,600)
    };
    if(src){ info.sourceFile=src.file; info.sourceLine=src.line; }
    for(var i=0;i<el.attributes.length;i++){
      var a=el.attributes[i];
      if(!a.name.startsWith('__')) info.attributes[a.name]=a.value;
    }
    window.parent.postMessage(info,'*');
  }

  document.addEventListener('click',function(e){
    if(!inspectMode) return;
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    var el=document.elementFromPoint(e.clientX,e.clientY);
    if(el&&!isInspectorEl(el)) selectElement(el);
  },true);

  document.addEventListener('touchend',function(e){
    if(!inspectMode) return;
    e.preventDefault();
    var t=e.changedTouches[0];
    var el=document.elementFromPoint(t.clientX,t.clientY);
    if(el&&!isInspectorEl(el)) selectElement(el);
  },true);
})();</script>`;
