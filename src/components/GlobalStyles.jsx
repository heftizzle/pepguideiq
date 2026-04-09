export function GlobalStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Oxanium:wght@400;600;800&family=JetBrains+Mono:wght@400;600&family=Outfit:wght@300;400;500;600&display=swap');
      :root{--bg-primary:#07090e}
      html{
        min-height:100%;
        background-color:var(--bg-primary);
        background:var(--bg-primary);
      }
      body{
        min-height:100vh;
        background-color:var(--bg-primary);
        background:var(--bg-primary);
      }
      #root{
        min-height:100%;
        background-color:var(--bg-primary);
        background:var(--bg-primary);
      }
      .pepv-app-shell{
        min-height:100vh;
        background-color:var(--bg-primary);
        background:var(--bg-primary);
      }
      .pepv-main-scroll{
        background-color:var(--bg-primary);
        background:var(--bg-primary);
        min-height:100vh;
        box-sizing:border-box;
      }
      .pepv-profile-route{
        background-color:var(--bg-primary);
        background:var(--bg-primary);
        min-height:100vh;
        box-sizing:border-box;
      }
      @supports (min-height:100dvh){
        body{min-height:100dvh}
        .pepv-app-shell{min-height:100dvh}
        .pepv-main-scroll{min-height:100dvh}
        .pepv-profile-route{min-height:100dvh}
      }
      .pepv-profile-tab{
        background-color:var(--bg-primary);
        background:var(--bg-primary);
        min-height:100%;
        box-sizing:border-box;
      }
      *{box-sizing:border-box;margin:0;padding:0}
      ::-webkit-scrollbar{width:3px}
      ::-webkit-scrollbar-thumb{background:#00d4aa30;border-radius:2px}
      .pepv-library-cat-scroll{
        scrollbar-width:none;
        -ms-overflow-style:none;
      }
      .pepv-library-cat-scroll::-webkit-scrollbar{display:none}
      @media (max-width:768px){
        .pepv-library-cat-chev{display:none!important}
      }
      .grid-bg{background-image:linear-gradient(rgba(0,212,170,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,212,170,.025) 1px,transparent 1px);background-size:48px 48px}
      .tab-btn{background:transparent;border:none;border-bottom:2px solid transparent;color:#4a6080;padding:12px 16px;cursor:pointer;font-family:'Outfit',sans-serif;font-size:13px;font-weight:500;letter-spacing:.06em;text-transform:uppercase;transition:all .2s;white-space:nowrap}
      .tab-btn:hover{color:#8fa5bf}
      .tab-btn.active{color:#00d4aa;border-bottom-color:#00d4aa}
      .pcard{
        background:#0e1520;
        border-top:1px solid rgb(30,52,74);
        border-left:1px solid #1a2d40;
        border-right:1px solid #1a2d40;
        border-bottom:1px solid #1a2d40;
        border-radius:10px;
        padding:20px;
        cursor:pointer;
        transition:transform 0.18s ease,box-shadow 0.18s ease,border-color 0.18s ease;
        position:relative;
        overflow:hidden;
        box-shadow:0 1px 3px rgba(0,0,0,0.5),0 4px 12px rgba(0,0,0,0.25);
      }
      .pcard::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:var(--cc,#00d4aa);opacity:.5}
      .pcard:hover{
        transform:translateY(-2px);
        box-shadow:0 4px 16px rgba(0,0,0,0.5),0 1px 4px rgba(0,0,0,0.3);
        border-top-color:rgb(40,68,96);
        transition:transform 0.18s ease,box-shadow 0.18s ease,border-color 0.18s ease;
      }
      .pcard:active{transform:translateY(-1px)}
      .pill{display:inline-block;padding:2px 8px;border-radius:3px;font-size:13px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;font-family:'JetBrains Mono',monospace}
      .pill--category{
        background:linear-gradient(135deg,rgba(var(--cc-rgb,0,212,170),0.20) 0%,rgba(var(--cc-rgb,0,212,170),0.08) 100%);
        color:var(--cc,#00d4aa);
        border:1px solid rgba(var(--cc-rgb,0,212,170),0.21);
      }
      .pcard .pill--category{font-size:13px}
      .build-tab-compound-meta .pill--category{font-size:11px;margin-top:4px;display:inline-block}
      .pepv-protocol-session-pill--active{
        box-shadow:0 0 0 1px rgba(0,212,170,0.5),0 0 14px rgba(0,212,170,0.22),0 0 4px rgba(0,212,170,0.15);
      }
      .search-input{background:#0b0f17;border:1px solid #14202e;color:#dde4ef;padding:10px 14px;border-radius:6px;font-family:'JetBrains Mono',monospace;font-size:13px;outline:none;transition:border-color .2s;width:100%}
      .search-input:focus{border-color:#00d4aa50}
      .search-input::placeholder{color:#a0a0b0}
      .btn-teal{background:#00d4aa14;border:1px solid #00d4aa;color:#00d4aa;padding:10px 20px;border-radius:7px;min-height:44px;cursor:pointer;font-family:'Outfit',sans-serif;font-size:13px;font-weight:500;transition:all .2s}
      .btn-teal:hover{background:#00d4aa22}
      .btn-teal:disabled{opacity:.4;cursor:not-allowed}
      @keyframes pepvBtnSavedPulse{
        0%{border-color:#22c55e;box-shadow:0 0 0 0 rgba(34,197,94,0.45)}
        40%{border-color:#4ade80;box-shadow:0 0 20px rgba(34,197,94,0.42)}
        100%{border-color:#22c55e;box-shadow:0 0 0 0 rgba(34,197,94,0)}
      }
      .btn-teal.btn-saved{
        animation:pepvBtnSavedPulse 1.8s ease-in-out forwards;
        border-color:#22c55e!important;
        color:#86efac!important;
        background:rgba(34,197,94,0.16)!important;
      }
      @keyframes pepvAdvisorSkeletonPulse{
        0%,100%{opacity:0.32}
        50%{opacity:0.58}
      }
      .pepv-advisor-skeleton{
        border-radius:10px;
        background:#14202e;
        min-height:76px;
        animation:pepvAdvisorSkeletonPulse 1.15s ease-in-out infinite;
      }
      .btn-green{background:#10b98115;border:1px solid #10b981;color:#10b981;padding:10px 20px;border-radius:7px;min-height:44px;cursor:pointer;font-family:'Outfit',sans-serif;font-size:13px;font-weight:500}
      .btn-red{background:transparent;border:1px solid #ef4444;color:#ef4444;padding:6px 11px;border-radius:4px;cursor:pointer;font-size:13px;font-family:'Outfit',sans-serif;transition:all .2s}
      .btn-red:hover{background:#ef444418}
      .cat-btn{background:transparent;border:1px solid #14202e;color:#4a6080;padding:7px 16px;border-radius:20px;cursor:pointer;font-size:13px;white-space:nowrap;transition:all .2s;font-family:'Outfit',sans-serif}
      .cat-btn.active{border-color:#00d4aa;color:#00d4aa;background:#00d4aa10}
      .cat-btn:hover:not(.active){border-color:#243040;color:#8fa5bf}
      .mono{font-family:'JetBrains Mono',monospace}
      /* JetBrains Mono has no color emoji glyphs — force system emoji fonts for these spans */
      .pepv-emoji{
        font-family:"Segoe UI Emoji","Segoe UI Symbol","Apple Color Emoji","Noto Color Emoji",sans-serif;
        font-style:normal;font-weight:400;line-height:1;
      }
      .brand{font-family:'Oxanium',sans-serif}
      .drow{display:flex;gap:8px;padding:10px 0;border-bottom:1px solid #0e1822;align-items:flex-start}
      .dlabel{font-family:'JetBrains Mono',monospace;font-size:13px;color:#00d4aa;text-transform:uppercase;letter-spacing:.12em;min-width:110px;padding-top:3px;flex-shrink:0}
      .dval{font-size:13px;color:#8fa5bf;flex:1;line-height:1.6}
      .goal-chip{padding:6px 10px;border-radius:20px;border:1px solid #14202e;background:transparent;color:#4a6080;cursor:pointer;font-size:13px;font-family:'Outfit',sans-serif;transition:all .2s;text-align:left;width:100%}
      .goal-chip.on{border-color:#00d4aa;color:#00d4aa;background:#00d4aa10}
      .ai-msg{padding:12px 14px;border-radius:8px;margin:6px 0;font-size:13px;line-height:1.65;animation:fi .3s ease}
      @keyframes fi{from{opacity:0;transform:translateY(3px)}to{opacity:1;transform:none}}
      .ai-user{background:#00d4aa0e;border:1px solid #00d4aa18;margin-left:32px}
      .ai-bot{background:#0b0f17;border:1px solid #14202e;margin-right:32px}
      .ai-input{background:#0b0f17;border:1px solid #14202e;color:#dde4ef;padding:11px 13px;border-radius:7px;font-family:'Outfit',sans-serif;font-size:13px;outline:none;resize:none;flex:1;transition:border-color .2s}
      .ai-input:focus{border-color:#00d4aa50}
      .scard{background:#0e1520;border:1px solid #14202e;border-radius:10px;padding:18px 20px;display:flex;align-items:center;gap:14px;transition:border-color .2s}
      .scard:hover{border-color:#1e2e40}
      .form-input{background:#07090e;border:1px solid #14202e;color:#dde4ef;padding:8px 11px;border-radius:5px;font-family:'JetBrains Mono',monospace;font-size:13px;outline:none;width:100%;transition:border-color .2s}
      .form-input:focus{border-color:#00d4aa50}
      .pulse{animation:pulse 2s infinite}
      @keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
      .sugg-btn{background:#0b0f17;border:1px solid #14202e;color:#4a6080;padding:9px 14px;border-radius:6px;cursor:pointer;font-size:13px;font-family:'Outfit',sans-serif;text-align:left;transition:all .2s;width:100%}
      .sugg-btn:hover{border-color:#00d4aa30;color:#8fa5bf}
      .guide-sidebar{scrollbar-width:thin}
      .modal-backdrop--sheet{align-items:flex-end;justify-content:center;padding:0}
      @media (min-width:769px){
        .modal-backdrop--sheet{align-items:center;padding:16px}
      }
      @keyframes upgradeSheetUp{from{opacity:0;transform:translateY(100%)}to{opacity:1;transform:translateY(0)}}
      @keyframes upgradeFadeCenter{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
      @media (max-width:768px){
        .modal-backdrop--sheet .modal-panel--sheet{
          animation:upgradeSheetUp .34s ease;
          max-width:100%!important;width:100%;border-radius:16px 16px 0 0;
          max-height:min(92vh,900px)!important;padding-bottom:max(24px,env(safe-area-inset-bottom))
        }
      }
      @media (min-width:769px){
        .modal-backdrop--sheet .modal-panel--sheet{animation:upgradeFadeCenter .26s ease}
      }
      .modal-backdrop:not(.modal-backdrop--sheet) .modal-panel{animation:upgradeFadeCenter .22s ease}
      .btn-upgrade-current{background:transparent!important;border:1px solid #2e4055!important;color:#6b8299!important;cursor:not-allowed!important;opacity:1!important}
      .btn-upgrade-cta{background:#00d4aa!important;border:1px solid #00d4aa!important;color:#07090e!important;font-weight:600!important}
      .btn-upgrade-cta:hover{background:#00e6b8!important;border-color:#00e6b8!important}
      .btn-upgrade-ghost{background:transparent!important;border:1px solid #243040!important;color:#8fa5bf!important}
      .btn-upgrade-ghost:hover{border-color:#4a6080!important;color:#dde4ef!important}
      @media (max-width: 640px) {
        .tab-btn{padding:10px 10px;font-size:13px}
      }
      /* AI Guide full-screen takeover — open/close use same duration per breakpoint */
      .guide-takeover-root{
        position:fixed;inset:0;z-index:50;display:flex;flex-direction:column;box-sizing:border-box;
        padding:max(12px,env(safe-area-inset-top)) max(12px,env(safe-area-inset-right)) max(12px,env(safe-area-inset-bottom)) max(12px,env(safe-area-inset-left));
        background:rgba(5,10,18,0.92);backdrop-filter:blur(2px);
        background:#07090e !important;
        animation:guideTakeoverInDesktop .28s ease;
      }
      .guide-takeover-root.guide-takeover-root--exit{animation:guideTakeoverOutDesktop .28s ease forwards}
      @keyframes guideTakeoverInDesktop{from{opacity:0}to{opacity:1}}
      @keyframes guideTakeoverOutDesktop{from{opacity:1}to{opacity:0}}
      .guide-takeover-close{
        position:fixed;top:max(8px,env(safe-area-inset-top));right:max(8px,env(safe-area-inset-right));
        z-index:55;width:44px;height:44px;min-width:44px;min-height:44px;padding:0;margin:0;
        display:flex;align-items:center;justify-content:center;
        border:1px solid #243040;border-radius:12px;background:#0b0f17;color:#8fa5bf;
        font-size:22px;line-height:1;cursor:pointer;font-family:'Outfit',sans-serif;
        box-shadow:0 4px 20px rgba(0,0,0,.45);
        transition:color .15s,border-color .15s,background .15s;
      }
      .guide-takeover-close:hover{color:#dde4ef;border-color:#3d5266;background:#14202e}
      .guide-takeover-close:focus-visible{outline:2px solid #00d4aa;outline-offset:2px}
      .guide-takeover-panel-wrap{
        flex:1;min-height:0;display:flex;flex-direction:row;gap:16px;margin-top:2px;width:100%;
      }
      .guide-takeover-chat-panel{
        display:flex;flex-direction:column;min-height:0;min-width:0;
        background:#07090e;color:#dde4ef;
      }
      .guide-takeover-msgs{flex:1;min-height:0;overflow-y:auto}
      .guide-takeover-input-bar{
        flex-shrink:0;
        padding:10px;
        border-top:1px solid #0e1822;
        display:flex;
        flex-direction:column;
        gap:4px;
        box-sizing:border-box;
      }
      .guide-mobile-goals-toggle{
        width:100%;display:flex;align-items:center;justify-content:flex-start;gap:8px;
        padding:8px 12px;border:none;border-radius:0;background:rgba(0,212,170,0.08);
        color:#00d4aa;font-size:13px;font-family:'JetBrains Mono',monospace;cursor:pointer;text-align:left;
        border-bottom:1px solid #0e1822;box-sizing:border-box;
      }
      .guide-mobile-goals-toggle:hover{background:rgba(0,212,170,0.12)}
      .guide-mobile-goals-dropdown{flex-shrink:0;background:#07090e;border-bottom:1px solid #14202e}
      .guide-mobile-goals-panel{
        max-height:120px;overflow-y:auto;overflow-x:hidden;border-top:1px solid #0e1822;
        -webkit-overflow-scrolling:touch;
      }
      .guide-mobile-goals-row{
        display:flex;flex-direction:row;flex-wrap:nowrap;gap:8px;padding:8px 10px;
        overflow-x:auto;overflow-y:hidden;-webkit-overflow-scrolling:touch;scrollbar-width:thin;
      }
      .goal-chip.guide-mobile-goal-pill{width:auto!important;flex-shrink:0!important;white-space:nowrap;text-align:center}
      @media (max-width:768px){
        .guide-sidebar{display:none!important}
        .guide-takeover-root{
          padding-top:max(52px,env(safe-area-inset-top));
          animation:guideTakeoverInMobile .34s ease;
          background:rgba(5,10,18,0.92);
          backdrop-filter:blur(2px);
          background:#07090e !important;
        }
        .guide-takeover-root.guide-takeover-root--exit{animation:guideTakeoverOutMobile .34s ease forwards}
        @keyframes guideTakeoverInMobile{
          from{opacity:0;transform:translateY(100%)}
          to{opacity:1;transform:translateY(0)}
        }
        @keyframes guideTakeoverOutMobile{
          from{opacity:1;transform:translateY(0)}
          to{opacity:0;transform:translateY(100%)}
        }
        .guide-takeover-panel-wrap{
          flex-direction:column;
          gap:0;
          align-items:stretch;
        }
        .guide-takeover-chat-panel{
          flex:1 1 auto;
          min-height:0;
          width:100%;
          max-width:100%;
          min-width:0;
          align-self:stretch;
        }
        .guide-takeover-msgs{
          flex:1;
          min-height:0;
          min-width:0;
        }
        .guide-takeover-input-bar{
          position:sticky;
          bottom:0;
          z-index:2;
          background:#0b0f17;
          box-shadow:0 -8px 24px rgba(5,10,18,0.75);
          padding-bottom:max(10px,env(safe-area-inset-bottom));
        }
      }
      [data-demo-highlight="1"]{
        animation:pepvDemoPulse 2.2s ease-in-out infinite;
        border-radius:12px;
        outline:2px solid rgba(0,212,170,0.5);
        outline-offset:2px;
      }
      @keyframes pepvDemoPulse{
        0%,100%{outline-color:rgba(0,212,170,0.35);box-shadow:0 0 0 0 rgba(0,212,170,0.08)}
        50%{outline-color:rgba(0,212,170,0.9);box-shadow:0 0 18px rgba(0,212,170,0.18)}
      }
      @keyframes pepv-dose-toast-anim{
        0%{opacity:0;transform:translateY(10px)}
        12%{opacity:1;transform:translateY(0)}
        72%{opacity:1;transform:translateY(0)}
        100%{opacity:0;transform:translateY(4px)}
      }
      .pepv-dose-toast-wrap{
        position:fixed;left:50%;bottom:80px;
        transform:translateX(-50%);z-index:45;width:min(calc(100vw - 24px),440px);
        pointer-events:none;box-sizing:border-box;padding:0 12px;
      }
      .pepv-dose-toast-inner{
        animation:pepv-dose-toast-anim 2.5s cubic-bezier(0.22,1,0.36,1) forwards;
        background:#0e1520;border:1px solid #00d4aa;color:#00d4aa;min-height:44px;
        padding:12px 20px;border-radius:10px;font-size:14px;line-height:1.45;text-align:center;
        box-shadow:0 10px 40px rgba(0,0,0,0.5);
        font-family:'Outfit',sans-serif,"Segoe UI Emoji","Segoe UI Symbol","Apple Color Emoji","Noto Color Emoji",system-ui,sans-serif;
        font-weight:500;
        letter-spacing:0.02em;
      }
    `}</style>
  );
}
