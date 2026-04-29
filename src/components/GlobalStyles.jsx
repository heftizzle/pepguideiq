export function GlobalStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Oxanium:wght@400;600;800&family=JetBrains+Mono:wght@400;600&family=Outfit:wght@300;400;500;600&display=swap');
      :root{--pepv-top-header-height:104px}
      html{
        min-height:100%;
        background-color:var(--color-bg-page);
        background:var(--color-bg-page);
      }
      body{
        min-height:100vh;
        background-color:var(--color-bg-page);
        background:var(--color-bg-page);
      }
      #root{
        min-height:100%;
        background-color:var(--color-bg-page);
        background:var(--color-bg-page);
      }
      .pepv-app-shell{
        min-height:100vh;
        background-color:var(--color-bg-page);
        background:var(--color-bg-page);
      }
      .pepv-main-scroll{
        background-color:var(--color-bg-page);
        background:var(--color-bg-page);
        min-height:100vh;
        box-sizing:border-box;
      }
      .pepv-profile-route{
        background-color:var(--color-bg-page);
        background:var(--color-bg-page);
        min-height:100vh;
        box-sizing:border-box;
        overflow:visible;
        padding-bottom:32px;
      }
      /* Profile User card: full-width inputs (stacked avatar + fields layout lives in ProfileTab.jsx). */
      .pepv-profile-user-fields input.form-input,
      .pepv-profile-user-fields textarea.form-input{
        width:100%;
        max-width:100%;
        box-sizing:border-box;
      }
      @media (max-width: 360px){
        .pepv-profile-route{
          padding-bottom:128px;
        }
      }
      /* Bottom nav: pill labels never wrap; allow horizontal scroll if needed (≤360px). */
      .pepv-bottom-nav-label{
        white-space:nowrap;
      }
      @media (max-width: 360px){
        .pepv-bottom-nav-tabs{
          justify-content:flex-start;
          overflow-x:auto;
          flex-wrap:nowrap;
          -webkit-overflow-scrolling:touch;
          scrollbar-width:none;
        }
        .pepv-bottom-nav-tabs::-webkit-scrollbar{display:none}
        .pepv-bottom-nav-tabs > button{
          flex:0 0 auto;
          min-width:max-content;
        }
      }
      @supports (min-height:100dvh){
        body{min-height:100dvh}
        .pepv-app-shell{min-height:100dvh}
        .pepv-main-scroll{min-height:100dvh}
        .pepv-profile-route{min-height:100dvh}
      }
      .pepv-profile-tab{
        background-color:var(--color-bg-page);
        background:var(--color-bg-page);
        min-height:min-content;
        box-sizing:border-box;
        overflow:visible;
        padding-bottom:24px;
      }
      *{box-sizing:border-box;margin:0;padding:0}
      ::-webkit-scrollbar{width:3px}
      ::-webkit-scrollbar-thumb{background:var(--color-scrollbar-thumb);border-radius:2px}
      .pepv-library-cat-scroll{
        scrollbar-width:none;
        -ms-overflow-style:none;
      }
      .pepv-library-cat-scroll::-webkit-scrollbar{display:none}
      @media (max-width:768px){
        .pepv-library-cat-chev{display:none!important}
      }
      .grid-bg{background-image:linear-gradient(var(--color-grid-faint) 1px,transparent 1px),linear-gradient(90deg,var(--color-grid-faint) 1px,transparent 1px);background-size:48px 48px}
      .tab-btn{background:transparent;border:none;border-bottom:2px solid transparent;color:var(--color-text-secondary);padding:12px 16px;min-height:44px;cursor:pointer;font-family:'Outfit',sans-serif;font-size:13px;font-weight:500;letter-spacing:.06em;text-transform:uppercase;transition:all .2s;white-space:nowrap}
      .tab-btn:hover{color:var(--color-text-secondary)}
      .tab-btn.active{color:var(--color-accent);border-bottom-color:var(--color-accent)}
      .pcard{
        background:var(--color-bg-card);
        border-top:1px solid var(--color-border-pcard-top);
        border-left:1px solid var(--color-border-pcard-side);
        border-right:1px solid var(--color-border-pcard-side);
        border-bottom:1px solid var(--color-border-pcard-side);
        border-radius:10px;
        padding:20px;
        cursor:pointer;
        transition:transform 0.18s ease,box-shadow 0.18s ease,border-color 0.18s ease;
        position:relative;
        overflow:hidden;
        box-shadow:0 1px 3px var(--color-shadow-50),0 4px 12px var(--color-shadow-25);
      }
      .pcard::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:var(--cc,var(--color-accent));opacity:.5}
      .pcard:hover{
        transform:translateY(-2px);
        box-shadow:0 4px 16px var(--color-shadow-50),0 1px 4px var(--color-shadow-30);
        border-top-color:var(--color-border-pcard-hover);
        transition:transform 0.18s ease,box-shadow 0.18s ease,border-color 0.18s ease;
      }
      .pcard:active{transform:translateY(-1px)}
      .pcard--library{
        height:260px;
        display:flex;
        flex-direction:column;
        overflow:hidden;
        min-width:0;
      }
      .pcard--library .pcard-summary{
        display:-webkit-box;
        -webkit-line-clamp:2;
        -webkit-box-orient:vertical;
        overflow:hidden;
      }
      .pcard--library .pcard-bioavail,
      .pcard--library .pcard-bioavail-warn,
      .pcard--library .pcard-halflife{
        white-space:nowrap;
        overflow:hidden;
        text-overflow:ellipsis;
        max-width:100%;
        min-width:0;
      }
      .pcard--library .pcard-footer{
        margin-top:auto;
      }
      .pill{display:inline-block;padding:2px 8px;border-radius:3px;font-size:13px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;font-family:'JetBrains Mono',monospace}
      .pill--category{
        background:linear-gradient(135deg,color-mix(in srgb,var(--cc,var(--color-accent)) 20%,transparent) 0%,color-mix(in srgb,var(--cc,var(--color-accent)) 8%,transparent) 100%);
        color:var(--cc,var(--color-accent));
        border:1px solid color-mix(in srgb,var(--cc,var(--color-accent)) 21%,transparent);
        white-space:nowrap;
      }
      .pcard .pill--category{
        font-size:13px;
        flex-shrink:0;
      }
      .pcard--library .pill--category{
        max-width:45%;
        overflow:hidden;
        text-overflow:ellipsis;
      }
      .pcard--library .pcard-head-main{
        min-width:0;
        flex:1 1 auto;
      }
      .pcard--library .pcard-head-main > .brand{
        min-width:0;
        overflow:hidden;
        text-overflow:ellipsis;
        white-space:nowrap;
      }
      .build-tab-compound-meta .pill--category{font-size:11px;margin-top:4px;display:inline-block}
      .pepv-protocol-session-pill--active{
        box-shadow:0 0 0 1px var(--color-protocol-pill-active-1),0 0 14px var(--color-protocol-pill-active-2),0 0 4px var(--color-protocol-pill-active-3);
      }
      .search-input{background:var(--color-bg-card);border:1px solid var(--color-border-default);color:var(--color-text-primary);padding:10px 14px;border-radius:6px;font-family:'JetBrains Mono',monospace;font-size:13px;outline:none;transition:border-color .2s,box-shadow .2s;width:100%;box-shadow:0 0 0 3px transparent}
      .search-input:focus{border-color:var(--color-accent);box-shadow:0 0 0 3px var(--color-accent-dim)}
      .search-input::placeholder{color:var(--color-text-placeholder)}
      @media (max-width:767px){
        .search-input::placeholder,
        .search-input::-webkit-input-placeholder{
          color:var(--color-text-on-dark-muted);
          opacity:1;
        }
      }
      .btn-teal{background:var(--color-accent-subtle-14);border:1px solid var(--color-accent);color:var(--color-accent);padding:10px 20px;border-radius:7px;min-height:44px;cursor:pointer;font-family:'Outfit',sans-serif;font-size:13px;font-weight:500;transition:all .2s}
      .btn-teal:hover{background:var(--color-accent-subtle-22)}
      .btn-teal:disabled{opacity:.4;cursor:not-allowed}
      @keyframes pepvBtnSavedPulse{
        0%{border-color:var(--color-success);box-shadow:0 0 0 0 var(--color-success-glow)}
        40%{border-color:var(--color-success);box-shadow:0 0 20px var(--color-success-glow-mid)}
        100%{border-color:var(--color-success);box-shadow:0 0 0 0 transparent}
      }
      .btn-teal.btn-saved{
        animation:pepvBtnSavedPulse 1.8s ease-in-out forwards;
        border-color:var(--color-success)!important;
        color:var(--color-success)!important;
        background:var(--color-success-fill-soft)!important;
      }
      @keyframes pepvAdvisorSkeletonPulse{
        0%,100%{opacity:0.32}
        50%{opacity:0.58}
      }
      .pepv-advisor-skeleton{
        border-radius:10px;
        background:var(--color-border-default);
        min-height:76px;
        animation:pepvAdvisorSkeletonPulse 1.15s ease-in-out infinite;
      }
      .btn-green{background:var(--color-btn-green-fill);border:1px solid var(--color-btn-green);color:var(--color-btn-green);padding:10px 20px;border-radius:7px;min-height:44px;cursor:pointer;font-family:'Outfit',sans-serif;font-size:13px;font-weight:500}
      .btn-red{background:transparent;border:1px solid var(--color-danger);color:var(--color-danger);padding:10px 14px;border-radius:8px;min-height:44px;cursor:pointer;font-size:13px;font-family:'Outfit',sans-serif;transition:all .2s}
      .btn-red:hover{background:var(--color-danger-soft-bg)}
      .btn-amber{background:transparent;border:1px solid var(--color-warning);color:var(--color-warning);padding:10px 20px;border-radius:7px;min-height:44px;cursor:pointer;font-family:'Outfit',sans-serif;font-size:13px;font-weight:500;transition:all .2s}
      .btn-amber:hover{background:var(--tier-elite-dim)}
      .btn-amber:disabled{opacity:.4;cursor:not-allowed}
      .cat-btn{background:transparent;border:1px solid var(--color-border-default);color:var(--color-text-secondary);padding:7px 16px;border-radius:20px;cursor:pointer;font-size:13px;white-space:nowrap;transition:all .2s;font-family:'Outfit',sans-serif}
      .cat-btn.active{border-color:var(--color-accent);color:var(--color-accent);background:var(--color-accent-subtle-10)}
      .cat-btn:hover:not(.active){border-color:var(--color-border-emphasis);color:var(--color-text-secondary)}
      .mono{font-family:'JetBrains Mono',monospace;color:var(--color-text-secondary)}
      /* JetBrains Mono has no color emoji glyphs — force system emoji fonts for these spans */
      .pepv-emoji{
        font-family:"Segoe UI Emoji","Segoe UI Symbol","Apple Color Emoji","Noto Color Emoji",sans-serif;
        font-style:normal;font-weight:400;line-height:1;
      }
      .brand{font-family:'Oxanium',sans-serif}
      .drow{display:flex;gap:8px;padding:10px 0;border-bottom:1px solid var(--color-border-hairline);align-items:flex-start}
      .dlabel{font-family:'JetBrains Mono',monospace;font-size:13px;color:var(--color-accent);text-transform:uppercase;letter-spacing:.12em;min-width:110px;padding-top:3px;flex-shrink:0}
      .dval{font-size:13px;color:var(--color-text-secondary);flex:1;line-height:1.6}
      .goal-chip{padding:6px 10px;border-radius:20px;border:1px solid var(--color-border-default);background:transparent;color:var(--color-text-secondary);cursor:pointer;font-size:13px;font-family:'Outfit',sans-serif;transition:all .2s;text-align:left;width:100%}
      .goal-chip.on{border-color:var(--color-accent);color:var(--color-accent);background:var(--color-accent-subtle-10)}
      .ai-msg{padding:12px 14px;border-radius:8px;margin:6px 0;font-size:13px;line-height:1.65;animation:fi .3s ease}
      @keyframes fi{from{opacity:0;transform:translateY(3px)}to{opacity:1;transform:none}}
      .ai-user{background:var(--color-accent-subtle-0e);border:1px solid var(--color-accent-subtle-18);margin-left:32px}
      .ai-bot{background:var(--color-bg-card);border:1px solid var(--color-border-default);margin-right:32px}
      .ai-input{background:var(--color-bg-card);border:1px solid var(--color-border-default);color:var(--color-text-primary);padding:11px 13px;border-radius:7px;font-family:'Outfit',sans-serif;font-size:13px;outline:none;resize:none;flex:1;transition:border-color .2s,box-shadow .2s;box-shadow:0 0 0 3px transparent}
      .ai-input:focus{border-color:var(--color-accent);box-shadow:0 0 0 3px var(--color-accent-dim)}
      .scard{background:var(--color-bg-card);border:1px solid var(--color-border-default);border-radius:10px;padding:18px 20px;display:flex;align-items:center;gap:14px;transition:border-color .2s}
      .scard:hover{border-color:var(--color-border-strong)}
      .form-input{background:var(--color-bg-page);border:1px solid var(--color-border-default);color:var(--color-text-primary);padding:8px 11px;border-radius:5px;font-family:'JetBrains Mono',monospace;font-size:13px;outline:none;width:100%;transition:border-color .2s,box-shadow .2s;box-shadow:0 0 0 3px transparent}
      .form-input:focus{border-color:var(--color-accent);box-shadow:0 0 0 3px var(--color-accent-dim)}
      .pulse{animation:pulse 2s infinite}
      @keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
      .sugg-btn{background:var(--color-bg-card);border:1px solid var(--color-border-default);color:var(--color-text-secondary);padding:9px 14px;border-radius:6px;cursor:pointer;font-size:13px;font-family:'Outfit',sans-serif;text-align:left;transition:all .2s;width:100%}
      .sugg-btn:hover{border-color:var(--color-accent-subtle-30);color:var(--color-text-secondary)}
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
      .btn-upgrade-current{background:transparent!important;border:1px solid var(--color-upgrade-muted-border)!important;color:var(--color-text-muted)!important;cursor:not-allowed!important;opacity:1!important}
      .btn-upgrade-cta{background:var(--color-accent)!important;border:1px solid var(--color-accent)!important;color:var(--color-text-inverse)!important;font-weight:600!important}
      .btn-upgrade-cta:hover{background:var(--color-accent-hover)!important;border-color:var(--color-accent-hover)!important}
      .btn-upgrade-ghost{background:transparent!important;border:1px solid var(--color-border-emphasis)!important;color:var(--color-text-secondary)!important}
      .btn-upgrade-ghost:hover{border-color:var(--color-border-interactive-hover)!important;color:var(--color-text-primary)!important}
      @media (max-width: 640px) {
        .tab-btn{padding:10px 10px;font-size:13px}
      }
      /* AI Atlas full-screen takeover — open/close use same duration per breakpoint */
      .guide-takeover-root{
        position:fixed;inset:0;z-index:80;display:flex;flex-direction:column;box-sizing:border-box;
        padding:max(12px,env(safe-area-inset-top)) max(12px,env(safe-area-inset-right)) max(12px,env(safe-area-inset-bottom)) max(12px,env(safe-area-inset-left));
        background:var(--color-modal-scrim);backdrop-filter:blur(2px);
        background:var(--color-bg-page) !important;
        animation:guideTakeoverInDesktop .28s ease;
      }
      .guide-takeover-root.guide-takeover-root--exit{animation:guideTakeoverOutDesktop .28s ease forwards}
      @keyframes guideTakeoverInDesktop{from{opacity:0}to{opacity:1}}
      @keyframes guideTakeoverOutDesktop{from{opacity:1}to{opacity:0}}
      .guide-takeover-close{
        position:fixed;top:max(8px,env(safe-area-inset-top));right:max(8px,env(safe-area-inset-right));
        z-index:55;width:44px;height:44px;min-width:44px;min-height:44px;padding:0;margin:0;
        display:flex;align-items:center;justify-content:center;
        border:1px solid var(--color-border-emphasis);border-radius:12px;background:var(--color-bg-card);color:var(--color-text-secondary);
        font-size:22px;line-height:1;cursor:pointer;font-family:'Outfit',sans-serif;
        box-shadow:0 4px 20px var(--color-shadow-45);
        transition:color .15s,border-color .15s,background .15s;
      }
      .guide-takeover-close:hover{color:var(--color-text-primary);border-color:var(--color-border-interactive-hover);background:var(--color-border-default)}
      .guide-takeover-close:focus-visible{outline:2px solid var(--color-accent);outline-offset:2px}
      .guide-takeover-panel-wrap{
        flex:1;min-height:0;display:flex;flex-direction:row;gap:16px;margin-top:2px;width:100%;
      }
      .guide-takeover-chat-panel{
        display:flex;flex-direction:column;min-height:0;min-width:0;
        background:var(--color-bg-page);color:var(--color-text-primary);
      }
      .guide-takeover-msgs{flex:1;min-height:0;overflow-y:auto}
      .guide-takeover-input-bar{
        flex-shrink:0;
        padding:10px;
        border-top:1px solid var(--color-border-hairline);
        display:flex;
        flex-direction:column;
        gap:4px;
        box-sizing:border-box;
      }
      .guide-mobile-goals-toggle{
        width:100%;display:flex;align-items:center;justify-content:flex-start;gap:8px;
        padding:8px 12px;border:none;border-radius:0;background:var(--color-guide-toggle-bg);
        color:var(--color-accent);font-size:13px;font-family:'JetBrains Mono',monospace;cursor:pointer;text-align:left;
        border-bottom:1px solid var(--color-border-hairline);box-sizing:border-box;
      }
      .guide-mobile-goals-toggle:hover{background:var(--color-guide-toggle-bg-hover)}
      .guide-mobile-goals-dropdown{flex-shrink:0;background:var(--color-bg-page);border-bottom:1px solid var(--color-border-default)}
      .guide-mobile-goals-panel{
        max-height:120px;overflow-y:auto;overflow-x:hidden;border-top:1px solid var(--color-border-hairline);
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
          background:var(--color-modal-scrim);
          backdrop-filter:blur(2px);
          background:var(--color-bg-page) !important;
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
          background:var(--color-bg-sunken);
          box-shadow:0 -8px 24px var(--color-shadow-bar);
          padding-bottom:max(10px,env(safe-area-inset-bottom));
        }
      }
      [data-tutorial-highlight="1"]{
        animation:pepvTutorialTargetPulse 2.2s ease-in-out infinite;
        border-radius:12px;
        outline:2px solid var(--color-demo-outline);
        outline-offset:2px;
      }
      @keyframes pepvTutorialTargetPulse{
        0%,100%{outline-color:var(--color-demo-pulse-outline-1);box-shadow:0 0 0 0 var(--color-demo-pulse-shadow)}
        50%{outline-color:var(--color-demo-pulse-outline-2);box-shadow:0 0 18px var(--color-demo-pulse-shadow-2)}
      }
      /* Spotlight ring only — dim overlay is clip-path + rgba in TutorialSpotlight.jsx */
      @keyframes tutorialPulse{
        0%,100%{box-shadow:0 0 0 3px rgba(255,255,255,0.9)}
        50%{box-shadow:0 0 0 7px rgba(255,255,255,0.4)}
      }
      @keyframes pepv-dose-toast-anim{
        0%{opacity:0;transform:translateY(8px)}
        12%{opacity:1;transform:translateY(0)}
        85%{opacity:1;transform:translateY(0)}
        100%{opacity:0;transform:translateY(4px)}
      }
      .pepv-dose-toast-wrap{
        position:fixed;left:50%;top:auto;
        bottom:calc(env(safe-area-inset-bottom, 0px) + 7rem);
        transform:translateX(-50%);z-index:45;width:min(calc(100vw - 24px),440px);
        pointer-events:none;box-sizing:border-box;padding:0 12px;
      }
      .pepv-dose-toast-inner{
        animation:pepv-dose-toast-anim 5.3s cubic-bezier(0.22,1,0.36,1) forwards;
        background:var(--color-bg-card);border:1px solid var(--color-accent);color:var(--color-accent);min-height:44px;
        padding:12px 20px;border-radius:10px;font-size:14px;line-height:1.45;text-align:center;
        box-shadow:0 10px 40px var(--color-shadow-50);
        font-family:'Outfit',sans-serif,"Segoe UI Emoji","Segoe UI Symbol","Apple Color Emoji","Noto Color Emoji",system-ui,sans-serif;
        font-weight:500;
        letter-spacing:0.02em;
      }
      @keyframes pepv-notifications-bell-glow{
        0%,100%{box-shadow:0 0 0 0 var(--color-bell-glow)}
        50%{box-shadow:0 0 8px var(--color-bell-glow-transparent)}
      }
      .pepv-notifications-bell--unread{
        border-color:var(--color-bell-border-unread)!important;
        animation:pepv-notifications-bell-glow 1.5s ease-in-out infinite;
      }

      /* ---- LikeButton (goal-emoji engagement primitives) ---- */
      .pepv-like-btn{
        position:relative;
        display:inline-flex;align-items:center;justify-content:center;
        padding:0;margin:0;border:none;background:transparent;cursor:pointer;
        line-height:1;-webkit-tap-highlight-color:transparent;
        transition:transform .2s cubic-bezier(.34,1.56,.64,1),opacity .15s ease,filter .15s ease;
      }
      .pepv-like-btn[disabled]{cursor:default}
      .pepv-like-btn--off{opacity:.6;filter:grayscale(1)}
      .pepv-like-btn--on{opacity:1;filter:none;transform:scale(1.05)}
      .pepv-like-btn--tap{animation:pepvLikeTap .2s cubic-bezier(.34,1.56,.64,1)}
      @keyframes pepvLikeTap{
        0%{transform:scale(1)}
        50%{transform:scale(1.3)}
        100%{transform:scale(1.05)}
      }
      .pepv-like-burst{
        position:absolute;inset:0;pointer-events:none;overflow:visible;
      }
      .pepv-like-burst-particle{
        position:absolute;top:50%;left:50%;
        font-size:14px;line-height:1;
        transform:translate(-50%,-50%) scale(0);
        opacity:0;
        animation:pepvLikeBurst .7s cubic-bezier(.22,.61,.36,1) forwards;
      }
      @keyframes pepvLikeBurst{
        0%{transform:translate(-50%,-50%) scale(0) rotate(0deg);opacity:0}
        15%{opacity:1}
        60%{opacity:1}
        100%{
          transform:translate(calc(-50% + var(--pepv-like-dx,0px)),calc(-50% + var(--pepv-like-dy,0px))) scale(1) rotate(var(--pepv-like-rot,0deg));
          opacity:0;
        }
      }

      /* Header: AI Atlas / tier / profile pills — desktop may wrap; mobile = one scrollable row */
      .pepv-nav-account-pill-row{
        display:flex;
        align-items:center;
        gap:6px;
        flex-wrap:wrap;
        overflow-x:auto;
      }
      @media (max-width:767px){
        .pepv-nav-account-pill-row{
          flex-wrap:nowrap;
          white-space:nowrap;
          overflow-y:hidden;
          -webkit-overflow-scrolling:touch;
          min-width:0;
          overscroll-behavior-x:contain;
        }
        .pepv-nav-account-pill-row > *{
          flex-shrink:0;
        }
      }

      /* Library mobile search strip — extra top space below header pills on narrow screens */
      .pepv-library-mobile-search-panel{
        box-sizing:border-box;
        width:100%;
        padding:10px 0 12px;
        border-bottom:1px solid var(--color-border-hairline);
        position:relative;
        z-index:220;
        scroll-margin-top:var(--pepv-top-header-height);
      }
      @media (max-width:767px){
        .pepv-library-mobile-search-panel{
          padding-top:22px;
          padding-bottom:14px;
        }
      }

      /* Persistent header — shared action control (App.jsx + header icons). */
      .pepv-header-action-btn{
        box-sizing:border-box;
        min-height:36px;
        height:36px;
        min-width:36px;
        padding:8px 14px;
        border-radius:8px;
        border:1px solid var(--color-border-strong);
        background:var(--color-bg-card);
        font-family:'Outfit',sans-serif,"Segoe UI Emoji","Segoe UI Symbol","Apple Color Emoji","Noto Color Emoji",system-ui,sans-serif;
        font-size:13px;
        font-weight:500;
        color:var(--color-text-primary);
        display:inline-flex;
        align-items:center;
        justify-content:center;
        gap:6px;
        flex-shrink:0;
        cursor:pointer;
        line-height:1;
        transition:border-color 0.15s ease, background 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;
      }
      .pepv-header-action-btn:disabled{
        cursor:default;
        opacity:0.55;
      }
      .pepv-header-action-btn:hover:not(:disabled){
        border-color:var(--color-accent-subtle-40);
        background:var(--color-border-default);
      }
      .pepv-header-action-btn--icon{
        width:36px;
        min-width:36px;
        max-width:36px;
        padding:0;
      }
      .pepv-header-action-btn[data-active="true"]{
        border-color:var(--color-accent-nav-border);
        background:var(--color-accent-nav-fill);
        color:var(--color-accent);
      }
      .pepv-header-action-btn[data-active="true"]:hover:not(:disabled){
        border-color:var(--color-accent-subtle-40);
        background:var(--color-border-default);
        color:var(--color-text-primary);
      }
      .pepv-header-tier--goat{
        background:var(--tier-goat-dim)!important;
        color:var(--tier-goat)!important;
        border:1px solid var(--tier-goat-border)!important;
      }
      .pepv-header-tier--goat[data-active="true"]{
        background:var(--tier-goat-bg-active)!important;
        color:var(--tier-goat-text-strong)!important;
        border:1px solid var(--tier-goat-border)!important;
      }
      .pepv-header-tier--elite{
        background:var(--tier-elite-dim)!important;
        color:var(--tier-elite)!important;
        border:1px solid var(--tier-elite-border)!important;
      }
      .pepv-header-tier--pro{
        background:var(--tier-pro-dim)!important;
        color:var(--tier-pro)!important;
        border:1px solid var(--tier-pro-border)!important;
      }
      .pepv-header-tier--entry{
        color:var(--tier-entry)!important;
        border:1px solid var(--tier-entry-border)!important;
      }
      .pepv-header-action-btn.pepv-header-tier--goat:hover:not(:disabled),
      .pepv-header-action-btn.pepv-header-tier--elite:hover:not(:disabled),
      .pepv-header-action-btn.pepv-header-tier--pro:hover:not(:disabled),
      .pepv-header-action-btn.pepv-header-tier--entry:hover:not(:disabled){
        border-color:var(--color-accent-subtle-40)!important;
        background:var(--color-border-default)!important;
        color:var(--color-text-primary)!important;
      }
      .pepv-header-action-surface{
        box-sizing:border-box;
        min-height:36px;
        height:36px;
        min-width:36px;
        max-width:260px;
        padding:0;
        border-radius:8px;
        border:1px solid var(--color-border-strong);
        background:var(--color-bg-card);
        font-family:'Outfit',sans-serif,"Segoe UI Emoji","Segoe UI Symbol","Apple Color Emoji","Noto Color Emoji",system-ui,sans-serif;
        font-size:13px;
        font-weight:500;
        color:var(--color-text-secondary);
        display:inline-flex;
        align-items:stretch;
        overflow:hidden;
        flex-shrink:0;
        transition:border-color 0.15s ease, background 0.15s ease;
      }
      .pepv-header-action-surface:hover{
        border-color:var(--color-accent-subtle-40);
        background:var(--color-border-default);
      }
      .pepv-header-profile-pill__segment{
        border:none;
        background:transparent;
        color:inherit;
        font:inherit;
        font-size:13px;
        font-weight:500;
        font-family:inherit;
        cursor:pointer;
        display:inline-flex;
        align-items:center;
        gap:6px;
        min-height:0;
        box-sizing:border-box;
        align-self:stretch;
      }
      .pepv-header-profile-pill__segment--primary{
        flex:1 1 auto;
        min-width:0;
        padding:0 10px 0 14px;
        justify-content:flex-start;
        text-align:left;
      }
      .pepv-header-profile-pill__segment--handle{
        flex-shrink:0;
        padding:0 14px 0 10px;
        max-width:130px;
        color:var(--tier-pro);
        overflow:hidden;
        text-overflow:ellipsis;
        white-space:nowrap;
        border-left:1px solid var(--color-border-emphasis);
      }
      @media (max-width:560px){
        .pepv-header-action-surface.pepv-header-profile-pill--narrow{max-width:180px}
        .pepv-header-profile-pill__segment--handle.pepv-header-profile-pill--narrow{max-width:100px}
      }
    `}</style>
  );
}
