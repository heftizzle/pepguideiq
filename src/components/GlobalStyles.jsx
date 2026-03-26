export function GlobalStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Oxanium:wght@400;600;800&family=JetBrains+Mono:wght@400;600&family=Outfit:wght@300;400;500;600&display=swap');
      *{box-sizing:border-box;margin:0;padding:0}
      ::-webkit-scrollbar{width:3px}
      ::-webkit-scrollbar-thumb{background:#00d4aa30;border-radius:2px}
      .grid-bg{background-image:linear-gradient(rgba(0,212,170,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,212,170,.025) 1px,transparent 1px);background-size:48px 48px}
      .tab-btn{background:transparent;border:none;border-bottom:2px solid transparent;color:#4a6080;padding:12px 16px;cursor:pointer;font-family:'Outfit',sans-serif;font-size:12px;font-weight:500;letter-spacing:.06em;text-transform:uppercase;transition:all .2s;white-space:nowrap}
      .tab-btn:hover{color:#8fa5bf}
      .tab-btn.active{color:#00d4aa;border-bottom-color:#00d4aa}
      .pcard{background:#0b0f17;border:1px solid #14202e;border-radius:8px;padding:16px;cursor:pointer;transition:all .2s;position:relative;overflow:hidden}
      .pcard::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:var(--cc,#00d4aa);opacity:.5}
      .pcard:hover{border-color:var(--cc,#00d4aa);transform:translateY(-2px);box-shadow:0 10px 40px rgba(0,0,0,.5)}
      .pill{display:inline-block;padding:2px 8px;border-radius:3px;font-size:10px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;font-family:'JetBrains Mono',monospace}
      .search-input{background:#0b0f17;border:1px solid #14202e;color:#dde4ef;padding:10px 14px;border-radius:6px;font-family:'JetBrains Mono',monospace;font-size:13px;outline:none;transition:border-color .2s;width:100%}
      .search-input:focus{border-color:#00d4aa50}
      .search-input::placeholder{color:#243040}
      .btn-teal{background:#00d4aa14;border:1px solid #00d4aa;color:#00d4aa;padding:7px 14px;border-radius:5px;cursor:pointer;font-family:'Outfit',sans-serif;font-size:12px;font-weight:500;transition:all .2s}
      .btn-teal:hover{background:#00d4aa22}
      .btn-teal:disabled{opacity:.4;cursor:not-allowed}
      .btn-green{background:#10b98115;border:1px solid #10b981;color:#10b981;padding:7px 14px;border-radius:5px;cursor:pointer;font-family:'Outfit',sans-serif;font-size:12px;font-weight:500}
      .btn-red{background:transparent;border:1px solid #ef4444;color:#ef4444;padding:6px 11px;border-radius:4px;cursor:pointer;font-size:11px;font-family:'Outfit',sans-serif;transition:all .2s}
      .btn-red:hover{background:#ef444418}
      .cat-btn{background:transparent;border:1px solid #14202e;color:#4a6080;padding:5px 12px;border-radius:20px;cursor:pointer;font-size:11px;white-space:nowrap;transition:all .2s;font-family:'Outfit',sans-serif}
      .cat-btn.active{border-color:#00d4aa;color:#00d4aa;background:#00d4aa10}
      .cat-btn:hover:not(.active){border-color:#243040;color:#8fa5bf}
      .mono{font-family:'JetBrains Mono',monospace}
      .brand{font-family:'Oxanium',sans-serif}
      .drow{display:flex;gap:8px;padding:7px 0;border-bottom:1px solid #0e1822;align-items:flex-start}
      .dlabel{font-family:'JetBrains Mono',monospace;font-size:9px;color:#00d4aa;text-transform:uppercase;letter-spacing:.12em;min-width:110px;padding-top:3px;flex-shrink:0}
      .dval{font-size:12px;color:#8fa5bf;flex:1;line-height:1.5}
      .goal-chip{padding:6px 10px;border-radius:20px;border:1px solid #14202e;background:transparent;color:#4a6080;cursor:pointer;font-size:11px;font-family:'Outfit',sans-serif;transition:all .2s;text-align:left;width:100%}
      .goal-chip.on{border-color:#00d4aa;color:#00d4aa;background:#00d4aa10}
      .ai-msg{padding:12px 14px;border-radius:8px;margin:6px 0;font-size:13px;line-height:1.65;animation:fi .3s ease}
      @keyframes fi{from{opacity:0;transform:translateY(3px)}to{opacity:1;transform:none}}
      .ai-user{background:#00d4aa0e;border:1px solid #00d4aa18;margin-left:32px}
      .ai-bot{background:#0b0f17;border:1px solid #14202e;margin-right:32px}
      .ai-input{background:#0b0f17;border:1px solid #14202e;color:#dde4ef;padding:11px 13px;border-radius:7px;font-family:'Outfit',sans-serif;font-size:13px;outline:none;resize:none;flex:1;transition:border-color .2s}
      .ai-input:focus{border-color:#00d4aa50}
      .scard{background:#0b0f17;border:1px solid #14202e;border-radius:8px;padding:14px 16px;display:flex;align-items:center;gap:14px;transition:border-color .2s}
      .scard:hover{border-color:#1e2e40}
      .form-input{background:#07090e;border:1px solid #14202e;color:#dde4ef;padding:8px 11px;border-radius:5px;font-family:'JetBrains Mono',monospace;font-size:12px;outline:none;width:100%;transition:border-color .2s}
      .form-input:focus{border-color:#00d4aa50}
      .pulse{animation:pulse 2s infinite}
      @keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
      .sugg-btn{background:#0b0f17;border:1px solid #14202e;color:#4a6080;padding:9px 14px;border-radius:6px;cursor:pointer;font-size:12px;font-family:'Outfit',sans-serif;text-align:left;transition:all .2s;width:100%}
      .sugg-btn:hover{border-color:#00d4aa30;color:#8fa5bf}
      .advisor-sidebar{scrollbar-width:thin}
      @media (max-width: 640px) {
        .advisor-sidebar{display:none}
        .tab-btn{padding:10px 10px;font-size:11px}
      }
    `}</style>
  );
}
