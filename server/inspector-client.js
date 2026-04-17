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
  label.style.cssText='position:fixed;z-index:2147483646;pointer-events:none;background:#0a0a0a;color:#00ff88;font:500 11px/1.4 monospace;padding:2px 8px;border-radius:4px;display:none;max-width:90vw;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;border:1px solid rgba(0,255,136,0.3);';
  document.documentElement.appendChild(label);

  var selLabel = document.createElement('div');
  selLabel.id='__ins_sel_label';
  selLabel.style.cssText='position:fixed;z-index:2147483647;pointer-events:none;box-sizing:border-box;display:none;max-width:min(92vw,28rem);padding:8px 12px;border-radius:12px;font:600 12px/1.45 ui-monospace,monospace;color:#7dd3fc;background:rgba(10,10,10,0.92);border:1px solid rgba(56,189,248,0.55);box-shadow:0 8px 24px rgba(0,0,0,0.45);white-space:normal;word-break:break-all;';
  document.documentElement.appendChild(selLabel);

  window.addEventListener('message',function(e){
    if(!e.data) return;
    if(e.data.type==='inspector-toggle'){
      inspectMode=!!e.data.enabled;
      if(!inspectMode){
        ov.style.display='none'; label.style.display='none'; sel.style.display='none'; selLabel.style.display='none';
      }
    }
    if(e.data.type==='inspector-clear'){
      sel.style.display='none'; selLabel.style.display='none'; ov.style.display='none'; label.style.display='none';
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
    var src=findSource(el);
    label.textContent= src ? (src.file+' : L'+src.line) : '\\u4f4d\\u7f6e\\u30c7\\u30fc\\u30bf\\u306a\\u3057';
    label.style.display='block';
    var lx=rect.left; var ly=rect.top-24;
    if(ly<0) ly=rect.bottom+4;
    label.style.left=lx+'px'; label.style.top=ly+'px';
  }

  function showSelectedLabel(el,rect,src){
    if(src){
      selLabel.textContent=src.file+' : L'+src.line;
    }else{
      selLabel.textContent='\\u4f4d\\u7f6e\\u30c7\\u30fc\\u30bf\\u306a\\u3057';
    }
    selLabel.style.display='block';
    selLabel.style.left='0px';
    selLabel.style.top='0px';
    var w=selLabel.offsetWidth;
    var h=selLabel.offsetHeight||40;
    var gap=8;
    var lx=rect.left;
    var ly=rect.top-h-gap;
    if(ly<6) ly=rect.bottom+gap;
    if(lx+w>window.innerWidth-10) lx=Math.max(10,window.innerWidth-w-10);
    if(lx<10) lx=10;
    if(ly+h>window.innerHeight-6) ly=Math.max(6,window.innerHeight-h-6);
    selLabel.style.left=lx+'px';
    selLabel.style.top=ly+'px';
  }

  function pickElementAt(x,y){
    var st=document.elementsFromPoint(x,y);
    for(var i=0;i<st.length;i++){
      var el=st[i];
      if(!el||isInspectorEl(el)) continue;
      if(el===document.documentElement||el===document.body) continue;
      return el;
    }
    return null;
  }

  function handleHover(x,y){
    if(!inspectMode) return;
    var el=pickElementAt(x,y);
    if(!el||el===hoverEl) return;
    hoverEl=el;
    var r=el.getBoundingClientRect();
    positionBox(ov,r);
    showLabel(el,r);
  }

  var touchStart=null;
  var lastTouchPick=0;

  document.addEventListener('mousemove',function(e){ handleHover(e.clientX,e.clientY); },true);
  document.addEventListener('touchmove',function(e){ if(!inspectMode)return; var t=e.touches[0]; handleHover(t.clientX,t.clientY); },{passive:true});

  document.addEventListener('touchstart',function(e){
    if(!inspectMode) return;
    if(e.touches.length!==1) return;
    var t=e.touches[0];
    touchStart={x:t.clientX,y:t.clientY};
  },{passive:true,capture:true});

  function selectElement(el){
    var r=el.getBoundingClientRect();
    positionBox(sel,r);
    ov.style.display='none';
    label.style.display='none';
    hoverEl=null;
    var cs=window.getComputedStyle(el);
    var src=findSource(el);
    showSelectedLabel(el,r,src);
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

  document.addEventListener('touchend',function(e){
    if(!inspectMode) return;
    if(!touchStart) return;
    var t=e.changedTouches[0];
    var dx=t.clientX-touchStart.x;
    var dy=t.clientY-touchStart.y;
    var dist=Math.sqrt(dx*dx+dy*dy);
    touchStart=null;
    if(dist>22) return;
    e.preventDefault();
    e.stopPropagation();
    lastTouchPick=Date.now();
    var el=pickElementAt(t.clientX,t.clientY);
    if(el) selectElement(el);
  },{passive:false,capture:true});

  document.addEventListener('click',function(e){
    if(!inspectMode) return;
    if(Date.now()-lastTouchPick<650) return;
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    var el=pickElementAt(e.clientX,e.clientY);
    if(el) selectElement(el);
  },true);
})();</script>`;
