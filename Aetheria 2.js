import * as THREE from 'three';

const DEFAULT_STYLES = "    :root {\n      color-scheme: dark;\n      --gold: #e6c17f;\n      --gold-muted: #a38d69;\n      --text: #f5f1e6;\n      --muted: #a7b1ab;\n      --glass: rgba(10, 19, 20, .88);\n      --line: rgba(220, 194, 144, .27);\n    }\n    * { box-sizing: border-box; }\n    html, body { width: 100%; height: 100%; margin: 0; overflow: hidden; }\n    body { background: #111d1d; color: var(--text); font-family: Inter, system-ui, sans-serif; user-select: none; }\n    button, input, summary { font: inherit; }\n    button, summary { -webkit-tap-highlight-color: transparent; }\n    button { cursor: pointer; }\n    button:focus-visible, summary:focus-visible, canvas:focus-visible, input:focus-visible { outline: 2px solid #f0cb88; outline-offset: 3px; }\n    .hidden { display: none !important; }\n    .flex { display: flex; }\n    .serif { font-family: Cinzel, Georgia, serif; }\n    .mono { font-family: 'JetBrains Mono', monospace; }\n    .glass { background: var(--glass); border: 1px solid var(--line); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); box-shadow: 0 12px 35px rgba(0, 0, 0, .24); }\n    #webgl-stage { position: fixed; inset: 0; background: linear-gradient(rgba(24, 39, 38, .12), rgba(12, 25, 23, .35)), url('https://images.pexels.com/photos/6129613/pexels-photo-6129613.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200') center / cover; }\n    #webgl-stage canvas { display: block; width: 100vw !important; height: 100vh !important; outline: 0; touch-action: none; }\n    .screen-shade { position: fixed; inset: 0; pointer-events: none; background: linear-gradient(180deg, rgba(5, 13, 14, .48), transparent 24%, transparent 69%, rgba(5, 13, 14, .55)); }\n    .hud-header { position: fixed; z-index: 10; inset: 0 0 auto; display: grid; grid-template-columns: 1fr auto 1fr; align-items: start; gap: 20px; padding: 24px 28px; pointer-events: none; }\n    .brand, .header-actions, .compass { pointer-events: auto; }\n    .brand { display: flex; gap: 12px; align-items: center; width: max-content; }\n    .brand-mark { width: 45px; height: 45px; display: grid; place-items: center; border: 1px solid rgba(229, 193, 127, .53); background: rgba(11, 24, 24, .68); }\n    .brand-mark svg { width: 30px; height: 30px; }\n    .brand-title { font-size: 19px; font-weight: 700; letter-spacing: .18em; line-height: 1; color: #f6e8c9; }\n    .brand-sub { margin-top: 7px; color: #c5c5b2; font-size: 9px; letter-spacing: .15em; text-transform: uppercase; }\n    .brand-sub span { color: var(--gold); }\n    #hud-telemetry { margin-top: 5px; color: #a3b0a7; font-size: 9px; letter-spacing: .02em; white-space: nowrap; }\n    .compass { width: 350px; text-align: center; }\n    .compass-bar { min-height: 38px; display: flex; align-items: center; justify-content: center; gap: 22px; padding: 0 20px; border-bottom: 1px solid rgba(225, 196, 143, .6); background: linear-gradient(90deg, transparent, rgba(9, 19, 19, .75), transparent); }\n    .compass-side { color: #aab3a7; font-size: 10px; letter-spacing: .15em; }\n    .compass-heading { color: #f0d09a; font-size: 12px; letter-spacing: .12em; font-weight: 700; }\n    .compass-divider { color: #8e8d74; font-size: 9px; }\n    .region-label { display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 8px; color: #e6e0ce; font-size: 10px; letter-spacing: .14em; text-transform: uppercase; }\n    .region-label i { width: 3px; height: 3px; background: #c5a970; transform: rotate(45deg); }\n    #hud-weather { color: #accbc4; font-size: 9px; letter-spacing: .08em; }\n    .header-actions { justify-self: end; display: flex; gap: 10px; align-items: center; }\n    .world-clock { text-align: right; padding-right: 12px; border-right: 1px solid rgba(229, 193, 127, .32); }\n    .micro-label { color: #9ca99e; font-size: 9px; font-weight: 600; letter-spacing: .15em; text-transform: uppercase; }\n    #hud-clock { margin-top: 5px; color: #f4e1b9; font-size: 11px; white-space: nowrap; }\n    .hud-button { min-height: 40px; border: 1px solid var(--line); background: rgba(11, 24, 24, .85); color: #f2e3c6; padding: 0 14px; font-size: 10px; font-weight: 600; letter-spacing: .04em; transition: border-color .2s, background .2s, color .2s; }\n    .hud-button:hover { border-color: rgba(238, 202, 143, .75); background: rgba(37, 53, 45, .95); }\n    .roadmap-button { display: flex; align-items: center; gap: 9px; }\n    .roadmap-button svg { width: 15px; height: 15px; color: var(--gold); }\n    .chart-button { display: flex; align-items: center; gap: 8px; }\n    .chart-button svg { width: 15px; height: 15px; color: var(--gold); flex: none; }\n    .chart-button[aria-expanded=\"false\"] { color: #bac6b8; }\n    .chart-mobile { display: none; }\n    .radar-panel { position: fixed; z-index: 11; top: 112px; right: 28px; width: 254px; padding: 15px 16px 13px; animation: slide-in .65s .15s both; }\n    .panel-heading { display: flex; align-items: center; justify-content: space-between; gap: 10px; }\n    .panel-title { font-size: 11px; font-weight: 700; letter-spacing: .13em; color: #f5dfb3; }\n    .live-label { display: flex; align-items: center; gap: 6px; color: #a6c9ad; font-size: 9px; letter-spacing: .1em; }\n    .chart-close { position: relative; width: 25px; height: 25px; display: grid; place-items: center; padding: 0; border: 1px solid rgba(220, 194, 144, .25); background: transparent; color: #e5d6b7; }\n    .chart-close::before { content: \"\"; position: absolute; inset: -8px; }\n    .chart-close:hover { background: rgba(229, 193, 127, .16); }\n    .chart-close svg { width: 12px; height: 12px; }\n    .live-dot { width: 5px; height: 5px; border-radius: 50%; background: #8dd9ad; box-shadow: 0 0 9px #9ae4b0; animation: pulse 2.3s ease-in-out infinite; }\n    .radar-kicker { margin-top: 5px; color: #95a59b; font-size: 9px; letter-spacing: .07em; }\n    .radar-wrap { position: relative; width: 196px; height: 196px; margin: 17px auto 13px; }\n    .radar-ring { position: absolute; inset: 3px; border: 1px solid rgba(232, 204, 154, .8); border-radius: 50%; padding: 5px; box-shadow: 0 0 0 3px rgba(229, 193, 127, .09), 0 0 20px rgba(0, 0, 0, .24); }\n    #radar-canvas { display: block; width: 100%; height: 100%; border-radius: 50%; cursor: crosshair; background: #273d37; touch-action: manipulation; }\n    .cardinal { position: absolute; z-index: 2; color: #f6d99e; font-size: 10px; font-weight: 700; line-height: 1; text-shadow: 0 1px 4px #000; pointer-events: none; }\n    .cardinal.n { top: -6px; left: 50%; transform: translateX(-50%); }\n    .cardinal.s { bottom: -6px; left: 50%; transform: translateX(-50%); }\n    .cardinal.e { right: -5px; top: 50%; transform: translateY(-50%); }\n    .cardinal.w { left: -6px; top: 50%; transform: translateY(-50%); }\n    .radar-loading { position: absolute; inset: 12px; display: grid; place-items: center; border-radius: 50%; color: #d6dfcf; font-size: 9px; letter-spacing: .12em; background: rgba(21, 42, 37, .28); pointer-events: none; }\n    .radar-controls { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding-bottom: 11px; border-bottom: 1px solid rgba(220, 194, 144, .15); }\n    .radar-scale { color: #cbd2c2; font-size: 10px; }\n    .zoom-controls { display: flex; gap: 4px; }\n    .zoom-controls button { width: 25px; height: 25px; border: 1px solid rgba(220, 194, 144, .25); background: rgba(255, 255, 255, .04); color: #e5d6b7; font-size: 16px; line-height: 1; }\n    .zoom-controls button:hover { background: rgba(229, 193, 127, .16); }\n    .zoom-controls button:disabled { opacity: .35; cursor: default; }\n    .waypoint-line { display: flex; justify-content: space-between; gap: 8px; align-items: center; padding-top: 10px; min-height: 31px; }\n    #waypoint-status { color: #c5cbbd; font-size: 9px; line-height: 1.5; }\n    #clear-waypoint { color: #efd096; border: 0; border-bottom: 1px solid rgba(239, 208, 150, .45); padding: 2px 0; background: transparent; font-size: 9px; flex: none; }\n    .legend { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 8px; color: #99a99e; font-size: 8px; letter-spacing: .03em; }\n    .legend span { display: inline-flex; align-items: center; gap: 5px; }\n    .legend-mark { width: 7px; height: 7px; transform: rotate(45deg); border: 1px solid #8ce8e2; }\n    .legend-mark.target { border-color: #f5cc79; background: #f5cc79; }\n    .legend-mark.wind { border-color: #d0e9ce; border-radius: 50%; transform: none; }\n    .legend-mark.hamlet { border-color: #f0c99a; transform: none; }\n    #compass-updraft { margin-top: 5px; color: #d0e9ce; font-size: 9px; }\n    #compass-hamlet { margin-top: 5px; color: #f0d2a4; font-size: 9px; }\n    .look-hint { position: fixed; left: 50%; bottom: 120px; z-index: 3; transform: translateX(-50%); color: rgba(250, 240, 217, .8); text-shadow: 0 2px 6px #111; font-size: 9px; font-weight: 600; letter-spacing: .18em; text-transform: uppercase; pointer-events: none; transition: opacity .3s; }\n    .look-hint.is-hidden { opacity: 0; }\n    .crosshair { position: fixed; z-index: 5; inset: 0; align-items: center; justify-content: center; pointer-events: none; }\n    .crosshair span { width: 5px; height: 5px; border: 1px solid #fff0c7; border-radius: 50%; box-shadow: 0 0 7px #e8c789; }\n    .hud-bottom { position: fixed; z-index: 10; left: 28px; right: 28px; bottom: 24px; display: flex; align-items: end; justify-content: space-between; gap: 14px; pointer-events: none; }\n    .status-panel, .bottom-actions { pointer-events: auto; }\n    .status-panel { max-width: 650px; padding: 12px 16px; border-left: 2px solid var(--gold); }\n    .status-top { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; }\n    #hud-coords { color: #f1deba; font-size: 10px; }\n    #hud-mode-badge { color: #a4d3b6; font-size: 10px; }\n    #hud-hero-state { color: #e8c786; font-size: 10px; }\n    #btn-hero-view[aria-pressed=\"true\"], #btn-glider[aria-pressed=\"true\"] { border-color: #d4b476; color: #fff0cc; background: rgba(71, 67, 41, .85); }\n    .status-sep { width: 1px; height: 13px; background: rgba(224, 208, 172, .25); }\n    .stamina-row { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-top: 8px; color: #b9c9b5; font-size: 9px; letter-spacing: .08em; }\n    #stamina-caption.exhausted { color: #e4a276; }\n    .stamina-track { width: 108px; height: 4px; background: rgba(224, 230, 209, .18); overflow: hidden; }\n    #stamina-fill { display: block; height: 100%; width: 100%; background: #b9d9a3; transition: width .15s linear, background .15s; }\n    #stamina-fill.low { background: #e4a276; }\n    #stamina-number { min-width: 22px; color: #dce7ce; }\n    #parkour-announcement { color: #e7b291; letter-spacing: 0; }\n    .key-guide { margin-top: 7px; color: #aebbb0; font-size: 10px; line-height: 1.5; }\n    .key-guide b { color: #e7d2aa; font-weight: 600; }\n    .bottom-actions { display: flex; gap: 8px; align-items: end; }\n    .bottom-actions > button { white-space: nowrap; }\n    .world-options { position: relative; }\n    .world-options summary { display: flex; gap: 9px; align-items: center; justify-content: center; list-style: none; cursor: pointer; }\n    .world-options summary::-webkit-details-marker { display: none; }\n    .world-options summary svg { width: 15px; height: 15px; }\n    .settings-panel { position: absolute; bottom: calc(100% + 10px); right: 0; width: 262px; max-height: min(65vh, 490px); overflow-y: auto; padding: 14px; }\n    .settings-title { margin-bottom: 11px; color: #e9d0a4; font-size: 10px; font-weight: 700; letter-spacing: .13em; }\n    .time-controls { padding: 10px 0 12px; border-top: 1px solid rgba(255,255,255,.09); border-bottom: 1px solid rgba(255,255,255,.09); }\n    .time-row { display: flex; justify-content: space-between; align-items: center; gap: 8px; color: #b3c0b4; font-size: 10px; }\n    input[type=range] { width: 100%; margin: 11px 0 0; accent-color: #e5bd78; }\n    #btn-time-cycle { border: 1px solid rgba(229,193,127,.3); background: rgba(229,193,127,.08); color: #ecd3a2; padding: 4px 8px; font-size: 9px; }\n    .setting-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; padding-top: 11px; }\n    .setting-grid button { min-height: 34px; padding: 6px 8px; text-align: left; border: 1px solid rgba(255,255,255,.1); color: #cdd8ce; background: rgba(255,255,255,.035); font-size: 9px; line-height: 1.4; }\n    .setting-grid button:hover { border-color: rgba(229,193,127,.5); background: rgba(255,255,255,.08); }\n    .setting-grid button:disabled { opacity: .5; cursor: default; }\n    .setting-grid .seed-button { grid-column: 1 / -1; color: #efcc89; text-align: center; }\n    .photo-controls { position: fixed; z-index: 25; left: 50%; bottom: 24px; transform: translateX(-50%); width: min(490px, calc(100% - 28px)); padding: 15px 17px; }\n    .photo-heading { display: flex; justify-content: space-between; align-items: center; gap: 12px; color: #f0d7a7; font-size: 11px; letter-spacing: .14em; }\n    .photo-heading span:last-child { color: #aebfb3; font-size: 9px; letter-spacing: .04em; text-align: right; }\n    .photo-row { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; margin-top: 13px; }\n    .photo-row label, .photo-row output { color: #c3d0c2; font-size: 10px; }\n    .photo-row input { flex: 1; min-width: 80px; width: auto; margin: 0; }\n    .photo-row button { min-height: 36px; }\n    #photo-feedback { min-height: 14px; margin-top: 8px; color: #b9c9b5; font-size: 9px; }\n    body.photo-mode .hud-header, body.photo-mode .radar-panel, body.photo-mode .hud-bottom, body.photo-mode .touch-controls, body.photo-mode .look-hint, body.photo-mode #ledge-prompt, body.photo-mode #climb-prompt, body.photo-mode #interact-prompt, body.photo-mode #crosshair, body.photo-mode .discovery-banner, body.photo-mode .screen-shade { visibility: hidden; pointer-events: none; }\n    body.photo-mode #webgl-stage canvas { cursor: grab; }\n    .discovery-banner { position: fixed; z-index: 20; top: 105px; left: 50%; transform: translateX(-50%); text-align: center; padding: 13px 40px; border-top: 1px solid rgba(228,194,134,.55); border-bottom: 1px solid rgba(228,194,134,.55); background: linear-gradient(90deg, transparent, rgba(8,18,18,.9), transparent); transition: opacity .7s, margin-top .7s; pointer-events: none; white-space: nowrap; }\n    .discovery-banner.opacity-0 { opacity: 0; }\n    .discovery-banner.-translate-y-2 { margin-top: -8px; }\n    .discovery-kicker { color: #9fe1db; font-size: 9px; letter-spacing: .23em; text-transform: uppercase; }\n    #discovery-title { color: #f3d9a2; font-size: 19px; font-weight: 700; letter-spacing: .13em; }\n    #discovery-sub { color: #c6d0c6; font-size: 10px; }\n    #interact-prompt { position: fixed; z-index: 12; bottom: 156px; left: 50%; transform: translateX(-50%); }\n    #btn-interact-waystone { display: flex; align-items: center; gap: 10px; min-height: 42px; padding: 0 16px; color: #f3e3bd; }\n    #ledge-prompt, #climb-prompt { position: fixed; z-index: 13; bottom: 205px; left: 50%; transform: translateX(-50%); display: flex; align-items: center; gap: 7px; white-space: nowrap; }\n    #ledge-prompt button, #climb-prompt button { display: flex; align-items: center; gap: 8px; min-height: 40px; padding: 0 12px; color: #f3e3bd; font-size: 10px; }\n    #ledge-prompt .keycap, #climb-prompt .keycap { width: auto; min-width: 23px; padding: 0 5px; }\n    .ledge-shimmy { color: #f3e3bd; font-size: 9px; text-shadow: 0 1px 5px #081211; }\n    .climb-compact { display: none; color: #f3e3bd; font-size: 9px; text-shadow: 0 1px 5px #081211; }\n    .keycap { display: inline-grid; place-items: center; width: 23px; height: 23px; border: 1px solid #d1ae6c; color: #f2d9a2; font-size: 10px; }\n    #interact-label { font-size: 10px; letter-spacing: .08em; }\n    .drawer { position: fixed; z-index: 30; inset: 0 0 0 auto; width: min(430px, 100%); display: flex; flex-direction: column; background: rgba(9, 19, 19, .97); border-left: 1px solid rgba(229, 193, 127, .35); box-shadow: -20px 0 70px rgba(0,0,0,.4); transform: translateX(0); transition: transform .3s; }\n    .drawer.translate-x-full { transform: translateX(100%); }\n    .drawer-head { padding: 23px; border-bottom: 1px solid rgba(255,255,255,.1); display: flex; justify-content: space-between; align-items: start; gap: 15px; }\n    .drawer-head h2 { margin: 6px 0 5px; color: #f2dcaf; font-size: 19px; font-weight: 600; letter-spacing: .04em; }\n    .drawer-head p { margin: 0; color: #a3b0a4; font-size: 11px; line-height: 1.5; }\n    .close-button { width: 33px; height: 33px; flex: none; border: 1px solid var(--line); background: transparent; color: #e9dcc2; font-size: 20px; }\n    .drawer-content { padding: 20px 23px 30px; overflow-y: auto; }\n    .progress-line { height: 3px; background: rgba(255,255,255,.1); margin: 13px 0 23px; }\n    .progress-line span { display: block; height: 100%; width: 21%; background: #e6c17f; }\n    .epoch { padding: 14px 0; border-bottom: 1px solid rgba(255,255,255,.09); }\n    .epoch-number { color: #90a298; font-size: 9px; letter-spacing: .12em; }\n    .epoch h3 { margin: 6px 0 0; color: #dde4d8; font-size: 12px; font-weight: 600; line-height: 1.5; }\n    .epoch p { margin: 7px 0 0; color: #a8b5aa; font-size: 11px; line-height: 1.65; }\n    .epoch.active .epoch-number { color: #e6c17f; }\n    .boot-status { position: fixed; z-index: 18; left: 50%; top: 49%; transform: translate(-50%, -50%); min-width: 220px; text-align: center; color: #f6e7c8; text-shadow: 0 2px 12px #12221c; pointer-events: none; }\n    .boot-status p { margin: 0; }\n    .boot-title { font-size: 13px; letter-spacing: .2em; }\n    .boot-detail { margin-top: 9px !important; color: #e0e6d9; font-size: 10px; line-height: 1.6; }\n    .boot-spinner { width: 25px; height: 25px; margin: 0 auto 15px; border: 1px solid rgba(255,255,255,.3); border-top-color: #e8c27e; border-radius: 50%; animation: spin 1s linear infinite; }\n    .boot-status.failed { pointer-events: auto; padding: 22px; background: rgba(8,18,18,.92); border: 1px solid var(--line); }\n    .boot-status.failed .boot-spinner { display: none; }\n    #retry-world { margin-top: 13px; }\n    .touch-controls { display: none; position: fixed; z-index: 10; left: 20px; bottom: 125px; align-items: end; gap: 14px; }\n    .dpad { display: grid; grid-template-columns: repeat(3, 38px); grid-template-rows: repeat(2, 38px); gap: 3px; }\n    .touch-controls button { width: 38px; height: 38px; border: 1px solid rgba(229,193,127,.45); color: #f0ddbb; background: rgba(9,22,21,.78); touch-action: none; }\n    .touch-controls .up { grid-column: 2; }\n    .touch-controls .left { grid-column: 1; grid-row: 2; }\n    .touch-controls .down { grid-column: 2; grid-row: 2; }\n    .touch-controls .right { grid-column: 3; grid-row: 2; }\n    .touch-actions { display: grid; grid-template-columns: repeat(2, 48px); gap: 6px; }\n    .touch-controls .jump, .touch-controls .dodge, .touch-controls .glide, .touch-controls .sprint { width: 48px; height: 48px; font-size: 9px; }\n    .touch-controls .sprint[aria-pressed=\"true\"] { background: rgba(112, 115, 64, .85); border-color: #e5c17f; }\n    .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }\n    .mobile-proxy { display: none; }\n    @keyframes pulse { 50% { opacity: .4; } }\n    @keyframes spin { to { transform: rotate(360deg); } }\n    @keyframes slide-in { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }\n    @media (max-width: 1050px) {\n      .hud-header { grid-template-columns: 1fr auto; }\n      .compass { position: fixed; top: 88px; left: 50%; transform: translateX(-50%); width: 310px; }\n      .radar-panel { top: 143px; }\n    }\n    @media (max-width: 700px) {\n      .hud-header { padding: 15px; gap: 8px; }\n      .brand-mark { width: 38px; height: 38px; }\n      .brand-title { font-size: 15px; }\n      .brand-sub { font-size: 8px; }\n      #hud-telemetry { max-width: 210px; overflow: hidden; text-overflow: ellipsis; }\n      .world-clock { display: none; }\n      .roadmap-button { min-height: 38px; padding: 0 10px; }\n      .chart-button { min-height: 38px; padding: 0 8px; justify-content: center; }\n      .chart-button #chart-toggle-label { display: none; }\n      .chart-button .chart-mobile { display: inline; font-size: 9px; }\n      .compass { top: 72px; width: 245px; }\n      .compass-bar { min-height: 29px; gap: 14px; }\n      .region-label { margin-top: 5px; }\n      .radar-panel { top: 130px; right: 14px; width: 195px; padding: 12px; }\n      .radar-wrap { width: 150px; height: 150px; margin: 13px auto 11px; }\n      .radar-kicker { font-size: 8px; }\n      .panel-title { font-size: 9px; }\n      .hud-bottom { left: 14px; right: 14px; bottom: 14px; align-items: end; }\n      .status-panel { padding: 10px 12px; max-width: calc(100% - 126px); }\n      .key-guide { font-size: 9px; }\n      .key-guide .extra-keys { display: none; }\n      .bottom-actions > button { display: none; }\n      .setting-grid .mobile-proxy { display: block; }\n      .look-hint { bottom: 98px; font-size: 8px; }\n      .ledge-shimmy { display: none; }\n      .climb-compact { display: inline; }\n      #ledge-prompt button, #climb-prompt button { padding: 0 8px; }\n      .photo-controls { bottom: 14px; padding: 12px; }\n      .discovery-banner { top: 112px; padding: 10px 22px; }\n      #discovery-title { font-size: 15px; }\n    }\n    @media (max-width: 420px) {\n      .brand-mark { width: 34px; height: 34px; }\n      .brand-sub { font-size: 7px; letter-spacing: .08em; }\n      .chart-button { gap: 5px; padding: 0 6px; }\n      .roadmap-button { width: 38px; padding: 0; justify-content: center; }\n      .roadmap-button span { display: none; }\n      .compass { top: 75px; left: 14px; width: 170px; transform: none; }\n      .compass-bar { gap: 10px; }\n      .region-label { font-size: 8px; flex-wrap: wrap; }\n      .radar-panel { top: 88px; width: 172px; padding: 10px; }\n      .radar-wrap { width: 132px; height: 132px; }\n      .radar-panel .live-label { display: none; }\n      .legend { gap: 7px; }\n      #hud-telemetry { max-width: 160px; }\n      .status-panel { max-width: calc(100% - 116px); }\n      #hud-mode-badge { display: none; }\n      #hud-hero-state { display: none; }\n      .status-sep { display: none; }\n      .stamina-track { width: 70px; }\n    }\n    @media (pointer: coarse) { .touch-controls { display: flex; } .look-hint { display: none; } }\n    @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; } }";
const DEFAULT_UI_HTML = "<div id=\"webgl-stage\" aria-label=\"Aetheria open world\"></div>\n  <div class=\"screen-shade\" aria-hidden=\"true\"></div>\n  <div id=\"crosshair\" class=\"crosshair hidden\" aria-hidden=\"true\"><span></span></div>\n\n  <div id=\"discovery-banner\" class=\"discovery-banner opacity-0 -translate-y-2\">\n    <div class=\"discovery-kicker mono\">Waystone attuned</div>\n    <div id=\"discovery-title\" class=\"serif\">SANCTUM OF DAWN</div>\n    <div id=\"discovery-sub\" class=\"mono\">Fast-travel anchor registered</div>\n  </div>\n  <div id=\"interact-prompt\" class=\"hidden\">\n    <button id=\"btn-interact-waystone\" class=\"glass\" type=\"button\"><span class=\"keycap mono\">F</span><span id=\"interact-label\" class=\"serif\">Attune Waystone</span></button>\n  </div>\n  <div id=\"ledge-prompt\" class=\"hidden\" aria-label=\"Ledge actions\">\n    <span class=\"ledge-shimmy mono\">A / D SHIMMY</span>\n    <button id=\"btn-mantle\" class=\"glass mono\" type=\"button\"><span class=\"keycap\">SPACE</span> CLIMB</button>\n    <button id=\"btn-drop-ledge\" class=\"glass mono\" type=\"button\"><span class=\"keycap\">S</span> DROP</button>\n    <button id=\"btn-leap-ledge\" class=\"glass mono\" type=\"button\"><span class=\"keycap\">X</span> LEAP</button>\n  </div>\n  <div id=\"climb-prompt\" class=\"hidden\" aria-label=\"Climbing actions\">\n    <span class=\"ledge-shimmy mono\">W/S CLIMB / A/D TRAVERSE</span>\n    <span class=\"climb-compact mono\">UP/DOWN CLIMB</span>\n    <button id=\"btn-climb-release\" class=\"glass mono\" type=\"button\"><span class=\"keycap\">Q</span> RELEASE</button>\n    <button id=\"btn-climb-leap\" class=\"glass mono\" type=\"button\"><span class=\"keycap\">X</span> LEAP</button>\n  </div>\n\n  <header class=\"hud-header\">\n    <div class=\"brand\">\n      <div class=\"brand-mark\" aria-hidden=\"true\">\n        <svg viewBox=\"0 0 36 36\" fill=\"none\"><path d=\"M18 2 29 18 18 34 7 18 18 2Z\" stroke=\"#d8b879\"/><path d=\"M18 7v22M10 18h16M13 23l5-14 5 14M14.5 20h7\" stroke=\"#ecd29d\" stroke-width=\"1.2\"/><circle cx=\"18\" cy=\"18\" r=\"2\" fill=\"#e6c17f\"/></svg>\n      </div>\n      <div>\n        <div class=\"brand-title serif\">AETHERIA</div>\n        <div class=\"brand-sub mono\">WORLD ENGINE <span>/ CHUNK 021</span></div>\n        <div id=\"hud-telemetry\" class=\"mono\">Initializing world...</div>\n      </div>\n    </div>\n    <div class=\"compass\" aria-label=\"World compass\">\n      <div class=\"compass-bar mono\"><span id=\"compass-left\" class=\"compass-side\">NW</span><span class=\"compass-divider\">|</span><span id=\"compass-heading\" class=\"compass-heading\">N 000</span><span class=\"compass-divider\">|</span><span id=\"compass-right\" class=\"compass-side\">NE</span></div>\n      <div class=\"region-label\"><span id=\"hud-biome\" class=\"serif\">Emerald Lowlands</span><i></i><span id=\"hud-weather\" class=\"mono\">CLEAR SKIES</span></div>\n      <div id=\"compass-waystone\" class=\"mono\" style=\"color:#a7d9d3;font-size:9px;margin-top:5px;\"></div>\n      <div id=\"compass-updraft\" class=\"mono\" title=\"Glide through rising wind to gain height and recover stamina\"></div>\n      <div id=\"compass-hamlet\" class=\"mono\" title=\"Seed-based settlement survey\">SURVEYING SETTLEMENT</div>\n    </div>\n    <div class=\"header-actions\">\n      <div class=\"world-clock\"><div class=\"micro-label\">World time</div><div id=\"hud-clock\" class=\"mono\">07:30 / Dawn</div></div>\n      <button id=\"btn-toggle-chart\" type=\"button\" class=\"hud-button chart-button\" aria-controls=\"radar-panel\" aria-expanded=\"true\" aria-label=\"Hide Explorer's Chart\" title=\"Hide chart (M)\">\n        <svg viewBox=\"0 0 20 20\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.3\" aria-hidden=\"true\"><circle cx=\"10\" cy=\"10\" r=\"7\"/><path d=\"M10 3v14M3 10h14M7 7l6 6m0-6-6 6\"/></svg><span id=\"chart-toggle-label\">HIDE CHART</span><span id=\"chart-toggle-mobile\" class=\"chart-mobile\" aria-hidden=\"true\">HIDE MAP</span>\n      </button>\n      <button id=\"btn-open-blueprint\" type=\"button\" class=\"hud-button roadmap-button\" aria-controls=\"blueprint-drawer\" aria-expanded=\"false\" aria-label=\"Open roadmap\">\n        <svg viewBox=\"0 0 20 20\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.3\" aria-hidden=\"true\"><path d=\"m2 5 5-2 6 2 5-2v12l-5 2-6-2-5 2V5ZM7 3v12m6-10v12\"/></svg>\n        <span>ROADMAP</span>\n      </button>\n    </div>\n  </header>\n\n  <aside id=\"radar-panel\" class=\"radar-panel glass\" aria-label=\"Topographic radar\">\n    <div class=\"panel-heading\"><span class=\"panel-title serif\">EXPLORER'S CHART</span><span class=\"live-label mono\"><i class=\"live-dot\"></i> LIVE</span><button id=\"btn-close-chart\" class=\"chart-close\" type=\"button\" aria-label=\"Hide Explorer's Chart\" title=\"Hide chart\"><svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" aria-hidden=\"true\"><path d=\"M3 3l10 10M13 3 3 13\"/></svg></button></div>\n    <div class=\"radar-kicker mono\">TOPOGRAPHIC RADAR / NORTH UP</div>\n    <div class=\"radar-wrap\">\n      <span class=\"cardinal n mono\">N</span><span class=\"cardinal e mono\">E</span><span class=\"cardinal s mono\">S</span><span class=\"cardinal w mono\">W</span>\n      <div class=\"radar-ring\"><canvas id=\"radar-canvas\" width=\"256\" height=\"256\" tabindex=\"0\" role=\"application\" aria-label=\"Topographic radar. Click to place a waypoint or select the settlement marker. Use arrow keys and Enter; Delete clears the waypoint.\"></canvas></div>\n      <div id=\"radar-loading\" class=\"radar-loading mono\">SCANNING TERRAIN</div>\n    </div>\n    <div class=\"radar-controls\"><span id=\"radar-scale\" class=\"radar-scale mono\">200m radius</span><div class=\"zoom-controls\"><button id=\"zoom-out\" type=\"button\" aria-label=\"Zoom radar out\" title=\"Zoom out\">-</button><button id=\"zoom-in\" type=\"button\" aria-label=\"Zoom radar in\" title=\"Zoom in\">+</button></div></div>\n    <div class=\"waypoint-line\"><span id=\"waypoint-status\" class=\"mono\">Click the map to set a waypoint</span><button id=\"clear-waypoint\" class=\"hidden mono\" type=\"button\">CLEAR</button></div>\n    <div id=\"map-announcement\" class=\"sr-only\" role=\"status\" aria-live=\"polite\"></div>\n    <div class=\"legend mono\"><span title=\"Dashed markers indicate an approximate compass bearing\"><i class=\"legend-mark\"></i> WAYSTONE</span><span><i class=\"legend-mark target\"></i> WAYPOINT</span><span title=\"Rising wind currents\"><i class=\"legend-mark wind\"></i> WIND</span><span><i class=\"legend-mark hamlet\"></i> SITE</span><span id=\"seed-label\">SEED 7741</span></div>\n  </aside>\n\n  <div id=\"look-hint\" class=\"look-hint mono\">Click the world to look around</div>\n  <div class=\"touch-controls\" aria-label=\"Touch movement controls\">\n    <div class=\"dpad\">\n      <button class=\"up\" data-move=\"KeyW\" type=\"button\" aria-label=\"Move forward\">^</button>\n      <button class=\"left\" data-move=\"KeyA\" type=\"button\" aria-label=\"Move left\">&lsaquo;</button>\n      <button class=\"down\" data-move=\"KeyS\" type=\"button\" aria-label=\"Move backward\">v</button>\n      <button class=\"right\" data-move=\"KeyD\" type=\"button\" aria-label=\"Move right\">&rsaquo;</button>\n    </div>\n    <div class=\"touch-actions\"><button id=\"touch-dodge\" class=\"dodge mono\" type=\"button\" aria-label=\"Dodge roll\">ROLL</button><button id=\"touch-jump\" class=\"jump mono\" data-move=\"Space\" type=\"button\" aria-label=\"Jump, vault, climb or ascend\">JUMP</button><button id=\"touch-glider\" class=\"glide mono\" type=\"button\" aria-label=\"Deploy glider\" aria-pressed=\"false\">GLIDE</button><button id=\"touch-sprint\" class=\"sprint mono\" type=\"button\" aria-label=\"Toggle sprint\" aria-pressed=\"false\">RUN</button></div>\n  </div>\n\n  <footer class=\"hud-bottom\">\n    <div class=\"status-panel glass\">\n      <div class=\"status-top mono\"><span id=\"hud-coords\">XYZ: 0.0, 0.0, 0.0</span><i class=\"status-sep\"></i><span id=\"hud-mode-badge\">Mode: Third-Person Explorer</span><i class=\"status-sep\"></i><span id=\"hud-hero-state\">EXPLORER / LOADING</span></div>\n      <div class=\"stamina-row mono\"><span id=\"stamina-caption\">STAMINA</span><div id=\"stamina-meter\" class=\"stamina-track\" role=\"progressbar\" aria-label=\"Stamina\" aria-valuemin=\"0\" aria-valuemax=\"100\" aria-valuenow=\"100\"><span id=\"stamina-fill\"></span></div><span id=\"stamina-number\">100</span><span id=\"parkour-announcement\" role=\"status\" aria-live=\"polite\"></span></div>\n      <div class=\"key-guide\"><b>WASD</b> move / <b>X</b> dodge or leap <span class=\"extra-keys\"> / <b>SHIFT</b> sprint / <b>SPACE</b> jump or climb / <b>Q</b> release / <b>E</b> glide / <b>P</b> photo</span> / <b>M</b> chart</div>\n    </div>\n    <div class=\"bottom-actions\">\n      <button id=\"btn-glider\" type=\"button\" class=\"hud-button mono\" aria-pressed=\"false\" title=\"Deploy or fold the glider while airborne\">[E] Glider: Closed</button>\n      <button id=\"btn-dodge\" type=\"button\" class=\"hud-button mono\" title=\"Dodge in the movement direction\">[X] Dodge</button>\n      <button id=\"btn-hero-view\" type=\"button\" class=\"hud-button mono\" aria-pressed=\"false\" title=\"Move the camera closer to the explorer\">[H] Hero View: Off</button>\n      <button id=\"btn-fly-mode\" type=\"button\" class=\"hud-button mono\">[V] Free-Fly: Off</button>\n      <button id=\"btn-weather-state\" type=\"button\" class=\"hud-button mono\">[K] Weather: Clear</button>\n      <details class=\"world-options\">\n        <summary class=\"hud-button mono\"><svg viewBox=\"0 0 20 20\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" aria-hidden=\"true\"><path d=\"M3 5h14M3 10h14M3 15h14\"/><circle cx=\"7\" cy=\"5\" r=\"1.7\" fill=\"#0b1818\"/><circle cx=\"13\" cy=\"10\" r=\"1.7\" fill=\"#0b1818\"/><circle cx=\"8\" cy=\"15\" r=\"1.7\" fill=\"#0b1818\"/></svg> WORLD</summary>\n        <div class=\"settings-panel glass\">\n          <div class=\"settings-title serif\">WORLD SETTINGS</div>\n          <div class=\"time-controls\"><div class=\"time-row\"><span class=\"mono\">TIME OF DAY</span><button id=\"btn-time-cycle\" type=\"button\" class=\"mono\">Auto</button></div><input id=\"slider-time\" type=\"range\" min=\"0\" max=\"24\" step=\"0.05\" value=\"7.5\" aria-label=\"Time of day\"></div>\n          <div class=\"setting-grid mono\">\n            <button id=\"glider-mobile\" class=\"mobile-proxy\" type=\"button\" aria-pressed=\"false\">[E] Glider: Closed</button>\n            <button id=\"hero-mobile\" class=\"mobile-proxy\" type=\"button\" aria-pressed=\"false\">[H] Hero View: Off</button>\n            <button id=\"fly-mobile\" class=\"mobile-proxy\" type=\"button\">[V] Free-Fly: Off</button>\n            <button id=\"weather-mobile\" class=\"mobile-proxy\" type=\"button\">[K] Weather: Clear</button>\n            <button id=\"btn-cloud-state\" type=\"button\">[C] Clouds: Cumulus</button>\n            <button id=\"btn-rock-density\" type=\"button\">[R] Rocks: Full</button>\n            <button id=\"btn-tree-density\" type=\"button\">[T] Trees: Full</button>\n            <button id=\"btn-grass-density\" type=\"button\">[G] Grass: Lush</button>\n            <button id=\"btn-sea-state\" type=\"button\">[O] Sea: Swell</button>\n            <button id=\"btn-lod-debug\" type=\"button\">[L] LOD Rings: Off</button>\n            <button id=\"btn-wireframe\" type=\"button\">Wireframe: Off</button>\n            <button id=\"btn-photo-mode\" type=\"button\" aria-pressed=\"false\">[P] Photo Mode</button>\n            <button id=\"chart-settings\" type=\"button\" aria-pressed=\"true\">Chart: Visible</button>\n            <button id=\"btn-traversal-effects\" type=\"button\" aria-pressed=\"true\">Trail Effects: On</button>\n            <button id=\"btn-track-hamlet\" type=\"button\" disabled>Surveying Hamlet...</button>\n            <button id=\"btn-reseed\" type=\"button\" class=\"seed-button\">GENERATE NEW WORLD SEED</button>\n          </div>\n        </div>\n      </details>\n    </div>\n  </footer>\n\n  <section id=\"photo-controls\" class=\"photo-controls glass hidden\" aria-label=\"Photo mode controls\">\n    <div class=\"photo-heading\"><span class=\"serif\">PHOTO MODE</span><span class=\"mono\">EXPLORER PAUSED / DRAG TO ORBIT</span></div>\n    <div class=\"photo-row mono\"><label for=\"photo-fov\">FOV</label><input id=\"photo-fov\" type=\"range\" min=\"35\" max=\"85\" step=\"1\" value=\"55\"><output id=\"photo-fov-value\" for=\"photo-fov\">55</output><button id=\"btn-photo-save\" class=\"hud-button\" type=\"button\">SAVE PNG</button><button id=\"btn-photo-exit\" class=\"hud-button\" type=\"button\">EXIT</button></div>\n    <div id=\"photo-feedback\" class=\"mono\" role=\"status\" aria-live=\"polite\">The captured image excludes the HUD.</div>\n  </section>\n\n  <aside id=\"blueprint-drawer\" class=\"drawer translate-x-full\" aria-label=\"100-chunk engine roadmap\" aria-hidden=\"true\" inert>\n    <div class=\"drawer-head\"><div><div class=\"micro-label mono\">THE AETHERIA ROADMAP / 21%</div><h2 class=\"serif\">A world in the making.</h2><p>Ten epochs. One evolving open-world engine.</p></div><button id=\"btn-close-blueprint\" class=\"close-button\" type=\"button\" aria-label=\"Close roadmap\">&times;</button></div>\n    <div class=\"drawer-content\">\n      <div class=\"progress-line\"><span></span></div>\n      <div class=\"epoch\"><div class=\"epoch-number mono\">EPOCH I / CHUNKS 001-010 / COMPLETE</div><h3>World engine and exploration</h3><p>Streaming terrain, ocean, foliage, weather, ancient waystones, and a live topographic radar with custom waypoints.</p></div>\n      <div class=\"epoch\"><div class=\"epoch-number mono\">EPOCH II / CHUNKS 011-020 / COMPLETE</div><h3>The explorer takes shape</h3><p>Chunks 011-020 add the hero rig, parkour, wall climbing, stamina, gliding, wind currents, photo mode and responsive landings.</p></div>\n      <div class=\"epoch active\"><div class=\"epoch-number mono\">EPOCH III / 021-030 / ACTIVE</div><h3>Citadels, villages and interiors</h3><p>Chunk 021 surveys a seed-based hamlet with terrain-aware cottages, paths and solid foundations. Interiors come later.</p></div>\n      <div class=\"epoch\"><div class=\"epoch-number mono\">EPOCH IV / 031-040</div><h3>Action combat and magic</h3></div>\n      <div class=\"epoch\"><div class=\"epoch-number mono\">EPOCH V / 041-050</div><h3>Wildlife, mounts and taming</h3></div>\n      <div class=\"epoch\"><div class=\"epoch-number mono\">EPOCH VI / 051-060</div><h3>Factions, stealth and world bosses</h3></div>\n      <div class=\"epoch\"><div class=\"epoch-number mono\">EPOCH VII / 061-070</div><h3>Inventory, crafting and loot</h3></div>\n      <div class=\"epoch\"><div class=\"epoch-number mono\">EPOCH VIII / 071-080</div><h3>NPCs, dialogue, quests and economy</h3></div>\n      <div class=\"epoch\"><div class=\"epoch-number mono\">EPOCH IX / 081-090</div><h3>Ruins, shrines and physics puzzles</h3></div>\n      <div class=\"epoch\"><div class=\"epoch-number mono\">EPOCH X / 091-100</div><h3>World events, fast travel and polish</h3></div>\n    </div>\n  </aside>\n\n  <div id=\"boot-status\" class=\"boot-status\" role=\"status\" aria-live=\"polite\"><div class=\"boot-spinner\"></div><p class=\"boot-title serif\">CHARTING THE WORLD</p><p id=\"boot-detail\" class=\"boot-detail mono\">Preparing the terrain and its skies...</p><button id=\"retry-world\" type=\"button\" class=\"hud-button hidden\">RETRY</button></div>";

if (typeof document !== 'undefined') {
  if (!document.querySelector('style[data-aetheria-styles]') && !document.querySelector('.hud-header')) {
    const styleEl = document.createElement('style');
    styleEl.setAttribute('data-aetheria-styles', 'true');
    styleEl.textContent = DEFAULT_STYLES;
    document.head.appendChild(styleEl);
  }
  if (!document.getElementById('blueprint-drawer')) {
    const existingStage = document.getElementById('webgl-stage');
    if (existingStage) existingStage.remove();
    document.body.insertAdjacentHTML('afterbegin', DEFAULT_UI_HTML);
  }
}

let _engine = {};
let _explorerRig, _parkour, _sprint, _traversal, _glider, _updrafts, _photo, _trail, _hamlet, _beacon;
let _setHeroView, _setPhotoMode, _setGlider, _setTrailEffects, _placeWaypoint, _clearWaypoint, _announceParkour;

const byId = (id) => document.getElementById(id);
const drawer = byId('blueprint-drawer');
const roadmapButton = byId('btn-open-blueprint');
const syncDrawer = () => {
  const closed = drawer.classList.contains('translate-x-full');
  drawer.inert = closed;
  drawer.setAttribute('aria-hidden', String(closed));
  roadmapButton.setAttribute('aria-expanded', String(!closed));
};
new MutationObserver(syncDrawer).observe(drawer, { attributes: true, attributeFilter: ['class'] });
syncDrawer();
const chartPanel = byId('radar-panel');
const chartButton = byId('btn-toggle-chart');
let chartVisible = true;
function setChartVisible(visible, persist = true) {
  const wasVisible = chartVisible;
  chartVisible = visible;
  if (!visible && chartPanel.contains(document.activeElement)) chartButton.focus();
  chartPanel.classList.toggle('hidden', !visible);
  chartPanel.inert = !visible;
  chartButton.setAttribute('aria-expanded', String(visible));
  chartButton.setAttribute('aria-label', visible ? "Hide Explorer's Chart" : "Show Explorer's Chart");
  chartButton.title = visible ? 'Hide chart (M)' : 'Show chart (M)';
  byId('chart-toggle-label').textContent = visible ? 'HIDE CHART' : 'SHOW CHART';
  byId('chart-toggle-mobile').textContent = visible ? 'HIDE MAP' : 'SHOW MAP';
  byId('chart-settings').textContent = visible ? 'Chart: Visible' : 'Chart: Hidden';
  byId('chart-settings').setAttribute('aria-pressed', String(visible));
  if (persist) {
    try { localStorage.setItem('aetheria-chart-visible', visible ? '1' : '0');   _engine = engine;
  _explorerRig = explorerRig;
  _parkour = parkour;
  _sprint = sprint;
  _traversal = traversal;
  _glider = glider;
  _updrafts = updrafts;
  _photo = photo;
  _trail = trail;
  _hamlet = hamlet;
  _beacon = beacon;
  _setHeroView = setHeroView;
  _setPhotoMode = setPhotoMode;
  _setGlider = setGlider;
  _setTrailEffects = setTrailEffects;
  _placeWaypoint = placeWaypoint;
  _clearWaypoint = clearWaypoint;
  _announceParkour = announceParkour;
} catch (error) { /* Optional preference. */ }
  }
  if (visible && !wasVisible) window.dispatchEvent(new Event('aetheria:chart-show'));
}
try { setChartVisible(localStorage.getItem('aetheria-chart-visible') !== '0', false); }
catch (error) { setChartVisible(true, false); }
chartButton.addEventListener('click', () => setChartVisible(!chartVisible));
byId('btn-close-chart').addEventListener('click', () => setChartVisible(false));
byId('chart-settings').addEventListener('click', () => setChartVisible(!chartVisible));
window.addEventListener('keydown', (event) => {
  const tag = event.target && event.target.tagName;
  if (event.code !== 'KeyM' || event.repeat || ['INPUT', 'TEXTAREA', 'SELECT'].includes(tag) || (event.target && event.target.isContentEditable)) return;
  event.preventDefault();
  setChartVisible(!chartVisible);
});
byId('retry-world').addEventListener('click', () => location.reload());

try {
  const engine = await import('https://cdn.jsdelivr.net/gh/nobody778/aetheria@e954818a0bc0df5d8cc4c68952ed72b57fb94cee/Aetheria%20Core.js');
  const { scene, camera, renderer, terrain, ocean, player, landmarks, worldNoise } = engine;
  byId('boot-status').classList.add('hidden');

  function installExplorerRig(controller) {
    const avatar = controller.avatar;
    const oldGeometries = new Set();
    const oldMaterials = new Set();
    avatar.traverse((object) => {
      if (!object.isMesh) return;
      if (object.geometry) oldGeometries.add(object.geometry);
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material) => { if (material) oldMaterials.add(material); });
    });
    while (avatar.children.length) avatar.remove(avatar.children[0]);
    oldGeometries.forEach((geometry) => geometry.dispose());
    oldMaterials.forEach((material) => material.dispose());

    const cloth = new THREE.MeshStandardMaterial({ color: 0x304b43, roughness: .92 });
    const darkCloth = new THREE.MeshStandardMaterial({ color: 0x1d332e, roughness: .94 });
    const capeCloth = new THREE.MeshStandardMaterial({ color: 0x45645a, roughness: .93 });
    const leather = new THREE.MeshStandardMaterial({ color: 0x513b30, roughness: .86 });
    const boots = new THREE.MeshStandardMaterial({ color: 0x302b28, roughness: .92 });
    const bronze = new THREE.MeshStandardMaterial({ color: 0xb89964, metalness: .55, roughness: .46 });
    const skin = new THREE.MeshStandardMaterial({ color: 0xc69b7b, roughness: .83 });
    const eye = new THREE.MeshStandardMaterial({ color: 0x272725, roughness: .9 });

    function part(parent, geometry, material, x, y, z) {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      parent.add(mesh);
      return mesh;
    }

    const upperBody = new THREE.Group();
    upperBody.position.y = .89;
    avatar.add(upperBody);
    part(upperBody, new THREE.CylinderGeometry(.29, .24, .62, 10), cloth, 0, .37, 0);
    part(upperBody, new THREE.CylinderGeometry(.245, .32, .32, 10), darkCloth, 0, .02, 0);
    part(upperBody, new THREE.BoxGeometry(.43, .31, .075), leather, 0, .43, .275);
    const strap = part(upperBody, new THREE.BoxGeometry(.055, .59, .025), bronze, .045, .40, .322);
    strap.rotation.z = -.52;
    const crest = part(upperBody, new THREE.OctahedronGeometry(.065), bronze, 0, .49, .335);
    crest.scale.z = .35;
    part(upperBody, new THREE.CylinderGeometry(.265, .265, .095, 12), leather, 0, .10, 0);
    part(upperBody, new THREE.BoxGeometry(.1, .085, .03), bronze, 0, .10, .27);
    part(upperBody, new THREE.BoxGeometry(.15, .18, .11), leather, .27, .02, -.01);

    const cape = new THREE.Group();
    cape.position.set(0, .62, -.23);
    upperBody.add(cape);
    part(cape, new THREE.BoxGeometry(.58, .43, .045), capeCloth, 0, -.215, 0);
    const lowerCape = new THREE.Group();
    lowerCape.position.y = -.43;
    cape.add(lowerCape);
    part(lowerCape, new THREE.BoxGeometry(.54, .42, .04), capeCloth, 0, -.21, 0);
    part(lowerCape, new THREE.BoxGeometry(.025, .38, .05), bronze, -.22, -.21, -.004);
    part(lowerCape, new THREE.BoxGeometry(.025, .38, .05), bronze, .22, -.21, -.004);

    const head = new THREE.Group();
    head.position.set(0, .86, 0);
    upperBody.add(head);
    const hood = part(head, new THREE.SphereGeometry(.225, 14, 12), darkCloth, 0, 0, -.055);
    hood.scale.set(1.05, 1.12, 1);
    const face = part(head, new THREE.SphereGeometry(.175, 14, 12), skin, 0, -.01, .105);
    face.scale.set(.9, 1.02, .66);
    const hoodTrim = part(head, new THREE.TorusGeometry(.18, .012, 6, 18), bronze, 0, -.005, .155);
    hoodTrim.scale.y = 1.1;
    part(head, new THREE.SphereGeometry(.014, 8, 6), eye, -.055, .015, .217);
    part(head, new THREE.SphereGeometry(.014, 8, 6), eye, .055, .015, .217);
    part(head, new THREE.SphereGeometry(.025, 8, 6), skin, 0, -.025, .22);
    const collar = part(upperBody, new THREE.TorusGeometry(.22, .035, 7, 18), leather, 0, .69, 0);
    collar.rotation.x = Math.PI / 2;

    function buildArm(side) {
      const shoulder = new THREE.Group();
      shoulder.position.set(side * .31, .59, 0);
      shoulder.rotation.z = side * .11;
      upperBody.add(shoulder);
      const pad = part(shoulder, new THREE.SphereGeometry(.15, 10, 8), bronze, 0, 0, 0);
      pad.scale.set(1.05, .55, 1);
      part(shoulder, new THREE.CapsuleGeometry(.085, .23, 5, 10), cloth, 0, -.19, 0);
      const elbow = new THREE.Group();
      elbow.position.y = -.37;
      shoulder.add(elbow);
      part(elbow, new THREE.CapsuleGeometry(.075, .19, 5, 10), leather, 0, -.14, 0);
      part(elbow, new THREE.CylinderGeometry(.08, .08, .055, 10), bronze, 0, -.22, 0);
      part(elbow, new THREE.SphereGeometry(.075, 10, 8), skin, 0, -.31, .015);
      return { shoulder, elbow };
    }
    function buildLeg(side) {
      const hip = new THREE.Group();
      hip.position.set(side * .15, .87, 0);
      avatar.add(hip);
      part(hip, new THREE.CapsuleGeometry(.095, .22, 5, 10), darkCloth, 0, -.20, 0);
      const knee = new THREE.Group();
      knee.position.y = -.39;
      hip.add(knee);
      part(knee, new THREE.CapsuleGeometry(.085, .20, 5, 10), cloth, 0, -.18, 0);
      part(knee, new THREE.CylinderGeometry(.09, .09, .06, 10), bronze, 0, -.05, .005);
      part(knee, new THREE.BoxGeometry(.18, .15, .28), boots, 0, -.34, .055);
      return { hip, knee };
    }
    const leftArm = buildArm(-1);
    const rightArm = buildArm(1);
    const leftLeg = buildLeg(-1);
    const rightLeg = buildLeg(1);
    const rollPivot = new THREE.Group();
    const rigSpace = new THREE.Group();
    rollPivot.position.y = .98;
    rigSpace.position.y = -.98;
    rollPivot.add(rigSpace);
    avatar.children.slice().forEach((child) => rigSpace.add(child));
    avatar.add(rollPivot);
    // The core controller owns the hip swing; the new joints keep that contract.
    controller.legL = leftLeg.hip;
    controller.legR = rightLeg.hip;
    avatar.visible = !controller.flyMode;
    return { upperBody, head, cape, lowerCape, leftArm, rightArm, leftLeg, rightLeg, rollPivot };
  }

  const explorerRig = installExplorerRig(player);
  const heroButton = byId('btn-hero-view');
  let heroView = false;
  let savedCamera = { distance: player.camDist, pitch: player.pitch };
  let heroState = '';
  function setHeroView(enabled) {
    if (enabled === heroView) return;
    if (enabled) {
      if (player.flyMode) player.toggleFlyMode(false);
      savedCamera = { distance: player.camDist, pitch: player.pitch };
      player.camDist = 3.6;
      player.pitch = .12;
    } else {
      player.camDist = savedCamera.distance;
      player.pitch = savedCamera.pitch;
    }
    heroView = enabled;
    heroButton.setAttribute('aria-pressed', String(enabled));
    heroButton.textContent = enabled ? '[H] Hero View: On' : '[H] Hero View: Off';
  }
  heroButton.addEventListener('click', () => setHeroView(!heroView));
  window.addEventListener('keydown', (event) => {
    const tag = event.target && event.target.tagName;
    if (event.code === 'KeyH' && !event.repeat && !['INPUT', 'TEXTAREA', 'BUTTON'].includes(tag)) {
      setHeroView(!heroView);
    }
  });

  const parkour = { action: null, stamina: 100, regenDelay: 0 };
  const sprint = { active: false, exhausted: false, touchRequested: false };
  const traversal = { jumpBuffer: 0, coyote: 0, footDistance: 0, swimDistance: 0, foot: 0, landingTimer: 0, before: {} };
  function createGliderVisual() {
    const group = new THREE.Group();
    group.position.set(0, 2.32, -.03);
    group.visible = false;
    const points = [
      [0, .12, .65], [-2.15, -.05, -.1], [-1.65, -.2, -.95],
      [0, .02, -.56], [1.65, -.2, -.95], [2.15, -.05, -.1]
    ];
    const fabricGeometry = new THREE.BufferGeometry();
    fabricGeometry.setAttribute('position', new THREE.Float32BufferAttribute(points.flat(), 3));
    const colors = [0xd8bd81, 0x2f6859, 0xc29b5b, 0x326c5b, 0xc29b5b, 0x2f6859];
    const colorData = [];
    colors.forEach((hex) => {
      const color = new THREE.Color(hex);
      colorData.push(color.r, color.g, color.b);
    });
    fabricGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colorData, 3));
    fabricGeometry.setIndex([0, 1, 2, 0, 2, 3, 0, 3, 4, 0, 4, 5]);
    fabricGeometry.computeVertexNormals();
    const fabric = new THREE.Mesh(fabricGeometry, new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: .85 }));
    fabric.castShadow = true;
    group.add(fabric);

    const ribMaterial = new THREE.MeshStandardMaterial({ color: 0xb99b65, metalness: .35, roughness: .55 });
    const up = new THREE.Vector3(0, 1, 0);
    function rib(from, to) {
      const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to);
      const delta = b.clone().sub(a);
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(.018, .018, delta.length(), 6), ribMaterial);
      mesh.position.copy(a).add(b).multiplyScalar(.5);
      mesh.quaternion.setFromUnitVectors(up, delta.normalize());
      group.add(mesh);
    }
    for (const index of [1, 2, 3, 4, 5]) rib(points[0], points[index]);
    for (const pair of [[1, 2], [2, 3], [3, 4], [4, 5]]) rib(points[pair[0]], points[pair[1]]);
    const cords = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-1.2, -.03, -.23), new THREE.Vector3(-.32, -.7, .08),
      new THREE.Vector3(1.2, -.03, -.23), new THREE.Vector3(.32, -.7, .08),
      new THREE.Vector3(-.45, .07, .4), new THREE.Vector3(-.32, -.7, .08),
      new THREE.Vector3(.45, .07, .4), new THREE.Vector3(.32, -.7, .08)
    ]);
    group.add(new THREE.LineSegments(cords, new THREE.LineBasicMaterial({ color: 0xe5d0a1 })));
    const emblem = new THREE.Mesh(new THREE.OctahedronGeometry(.13), ribMaterial);
    emblem.position.set(0, .11, -.06);
    emblem.scale.set(.8, .3, 1.2);
    group.add(emblem);
    player.avatar.add(group);
    return group;
  }
  const glider = { active: false, spread: 0, visual: createGliderVisual() };
  function createUpdraftSystem() {
    const spacing = 160, maxColumns = 12, ringsPerColumn = 4, motesPerColumn = 18;
    const ringGeometry = new THREE.RingGeometry(.96, 1, 32);
    ringGeometry.rotateX(-Math.PI / 2);
    const ringMaterial = new THREE.MeshBasicMaterial({ color: 0xb8ead2, transparent: true, opacity: .22, depthWrite: false, side: THREE.DoubleSide });
    const rings = new THREE.InstancedMesh(ringGeometry, ringMaterial, maxColumns * ringsPerColumn);
    rings.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    rings.count = 0;
    rings.frustumCulled = false;
    scene.add(rings);

    const positions = new Float32Array(maxColumns * motesPerColumn * 3);
    const positionAttribute = new THREE.BufferAttribute(positions, 3);
    positionAttribute.setUsage(THREE.DynamicDrawUsage);
    const moteGeometry = new THREE.BufferGeometry();
    moteGeometry.setAttribute('position', positionAttribute);
    moteGeometry.setDrawRange(0, 0);
    const motes = new THREE.Points(moteGeometry, new THREE.PointsMaterial({ color: 0xd0f5dc, size: .42, transparent: true, opacity: .75, depthWrite: false }));
    motes.frustumCulled = false;
    scene.add(motes);
    const marker = new THREE.Object3D();
    const state = { columns: [], strength: 0 };
    const cardinals = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    let lastCellX = null, lastCellZ = null, lastSeed = null, nextHud = 0;

    function hash(x, z, salt) {
      let h = (Math.imul(x, 374761393) ^ Math.imul(z, 668265263) ^ Math.imul(worldNoise.seed ^ salt, 1274126177)) >>> 0;
      h = Math.imul(h ^ (h >>> 16), 2246822519);
      h = Math.imul(h ^ (h >>> 13), 3266489917);
      return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
    }
    function column(x, z, cx, cz, starter) {
      const ground = terrain.getHeightAt(x, z);
      if (!starter && ground < terrain.seaLevel + .3) return null;
      return {
        x, z, base: Math.max(terrain.seaLevel, ground) + .12,
        radius: 7.5 + hash(cx, cz, 11) * 2.5,
        height: 48 + hash(cx, cz, 17) * 16,
        phase: hash(cx, cz, 23)
      };
    }
    function rebuild(position, cellX, cellZ) {
      const columns = [];
      const startSites = [[-14, -38], [-30, -26], [18, -32], [-34, 10], [24, 18], [0, 34]];
      let start = startSites[0];
      for (const site of startSites) {
        if (terrain.getHeightAt(site[0], site[1]) > terrain.seaLevel + .3) { start = site; break; }
      }
      if (Math.hypot(position.x - start[0], position.z - start[1]) < 400) {
        columns.push(column(start[0], start[1], 0, 0, true));
      }
      for (let dz = -1; dz <= 1; dz++) {
        for (let dx = -1; dx <= 1; dx++) {
          const cx = cellX + dx, cz = cellZ + dz;
          if (hash(cx, cz, 1) < .46) continue;
          const x = (cx + .2 + hash(cx, cz, 2) * .6) * spacing;
          const z = (cz + .2 + hash(cx, cz, 3) * .6) * spacing;
          if (columns.some((item) => Math.hypot(item.x - x, item.z - z) < 26)) continue;
          const item = column(x, z, cx, cz, false);
          if (item) columns.push(item);
        }
      }
      state.columns = columns.slice(0, maxColumns);
      lastCellX = cellX;
      lastCellZ = cellZ;
      lastSeed = worldNoise.seed;
    }
    function update(position, elapsed) {
      const cellX = Math.floor(position.x / spacing), cellZ = Math.floor(position.z / spacing);
      if (cellX !== lastCellX || cellZ !== lastCellZ || worldNoise.seed !== lastSeed) rebuild(position, cellX, cellZ);
      let nearest = null, nearestDistance = Infinity;
      state.strength = 0;
      let ringIndex = 0, moteIndex = 0;
      for (const item of state.columns) {
        const distance = Math.hypot(position.x - item.x, position.z - item.z);
        if (distance < nearestDistance) { nearest = item; nearestDistance = distance; }
        const altitude = position.y - item.base;
        if (distance < item.radius && altitude > -.5 && altitude < item.height) {
          const radial = Math.max(0, 1 - distance / item.radius);
          const smooth = radial * radial * (3 - 2 * radial);
          const base = .65 + .35 * Math.min(1, Math.max(0, altitude / 5));
          const ceiling = Math.min(1, Math.max(0, (item.height - altitude) / 8));
          state.strength = Math.max(state.strength, smooth * base * ceiling);
        }
        for (let i = 0; i < ringsPerColumn; i++) {
          const rise = i === 0 ? .18 : (elapsed * 4 + (i - 1) * item.height / (ringsPerColumn - 1) + item.phase * item.height) % item.height;
          const scale = i === 0 ? item.radius : item.radius * (.7 + .14 * Math.sin(rise / item.height * Math.PI));
          marker.position.set(item.x, item.base + rise, item.z);
          marker.scale.set(scale, 1, scale);
          marker.updateMatrix();
          rings.setMatrixAt(ringIndex++, marker.matrix);
        }
        for (let i = 0; i < motesPerColumn; i++) {
          const rise = (elapsed * (3.2 + (i % 3) * .35) + i * item.height / motesPerColumn + item.phase * item.height) % item.height;
          const angle = elapsed * .7 + i * 2.399 + item.phase * Math.PI * 2;
          const radius = item.radius * (.3 + (i % 4) * .13);
          positions[moteIndex++] = item.x + Math.cos(angle) * radius;
          positions[moteIndex++] = item.base + rise;
          positions[moteIndex++] = item.z + Math.sin(angle) * radius;
        }
      }
      rings.count = ringIndex;
      rings.instanceMatrix.needsUpdate = true;
      moteGeometry.setDrawRange(0, moteIndex / 3);
      positionAttribute.needsUpdate = true;
      if (elapsed >= nextHud) {
        nextHud = elapsed + .4;
        if (!nearest || nearestDistance > 450) {
          byId('compass-updraft').textContent = '';
        } else if (glider.active && state.strength > .48) {
          const drain = player.keys.ShiftLeft || player.keys.ShiftRight || sprint.touchRequested ? 13 : 9;
          byId('compass-updraft').textContent = state.strength * 16 > drain ? 'UPDRAFT / LIFT + STAMINA' : 'UPDRAFT / LIFT';
        } else {
          const bearing = (Math.atan2(nearest.x - position.x, -(nearest.z - position.z)) * 180 / Math.PI + 360) % 360;
          byId('compass-updraft').textContent = `UPDRAFT / ${Math.round(nearestDistance)}m ${cardinals[Math.round(bearing / 45) % 8]}`;
        }
      }
    }
    return { state, update };
  }
  const updrafts = createUpdraftSystem();
  const parkourProbe = new THREE.Vector3();
  const movementKeys = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight'];
  const blockedKeys = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight', 'ShiftLeft', 'ShiftRight', 'Space'];
  const heldKeys = Object.create(null);
  let shownStamina = -1;
  let shownStaminaCaption = '';
  let parkourMessageTimer;
  let ledgeCooldown = 0;
  let ledgeScanTimer = 0;
  function announceParkour(message) {
    byId('parkour-announcement').textContent = message;
    clearTimeout(parkourMessageTimer);
    parkourMessageTimer = setTimeout(() => { byId('parkour-announcement').textContent = ''; }, 2200);
  }
  function sprintRequested() {
    return Boolean(sprint.touchRequested || player.keys.ShiftLeft || player.keys.ShiftRight);
  }
  function updateStamina(dt) {
    parkour.regenDelay = Math.max(0, parkour.regenDelay - dt);
    if (!parkour.action && !glider.active && !sprint.active && parkour.regenDelay === 0) {
      const moving = Math.hypot(player.velocity.x, player.velocity.z) > .3;
      const recovery = player.isSwimming ? 10 : moving ? 15 : 22;
      parkour.stamina = Math.min(100, parkour.stamina + dt * recovery);
    }
    if (parkour.stamina <= 0) sprint.exhausted = true;
    if (sprint.exhausted && !sprintRequested() && parkour.stamina >= 25) sprint.exhausted = false;
    const value = Math.round(parkour.stamina);
    const caption = sprint.exhausted ? 'EXHAUSTED' : sprint.active ? 'SPRINTING' : glider.active && updrafts.state.strength > .55 ? 'UPDRAFT' : value < 100 && parkour.regenDelay === 0 && !parkour.action && !glider.active ? 'RECOVERING' : 'STAMINA';
    const captionChanged = caption !== shownStaminaCaption;
    if (captionChanged) {
      shownStaminaCaption = caption;
      byId('stamina-caption').textContent = caption;
      byId('stamina-caption').classList.toggle('exhausted', sprint.exhausted);
    }
    if (value === shownStamina && !captionChanged) return;
    byId('stamina-meter').setAttribute('aria-valuetext', `${value} stamina, ${caption.toLowerCase()}`);
    if (value === shownStamina) return;
    shownStamina = value;
    byId('stamina-fill').style.width = `${value}%`;
    byId('stamina-fill').classList.toggle('low', value < 28);
    byId('stamina-number').textContent = String(value);
    byId('stamina-meter').setAttribute('aria-valuenow', String(value));
  }
  function setTouchSprint(enabled) {
    sprint.touchRequested = enabled;
    const button = byId('touch-sprint');
    button.setAttribute('aria-pressed', String(enabled));
    button.textContent = enabled ? 'RUN ON' : 'RUN';
    updateStamina(0);
  }
  const touchSprint = byId('touch-sprint');
  touchSprint.addEventListener('pointerdown', (event) => { event.preventDefault(); setTouchSprint(!sprint.touchRequested); });
  touchSprint.addEventListener('click', (event) => { if (event.detail === 0) setTouchSprint(!sprint.touchRequested); });

  const photo = { active: false, fov: 55 };
  const photoFocus = new THREE.Vector3();
  const photoPosition = new THREE.Vector3();
  const photoTarget = new THREE.Vector3();
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const photoHud = [document.querySelector('.hud-header'), byId('radar-panel'), document.querySelector('.hud-bottom'), document.querySelector('.touch-controls'), byId('ledge-prompt'), byId('climb-prompt'), byId('interact-prompt')];
  const previousInert = new Map();
  function updateCameraFov(dt) {
    const target = photo.active ? photo.fov : reducedMotion.matches ? 55 : player.flyMode ? 60 : glider.active ? 62 : sprint.active ? 59 : 55;
    const difference = target - camera.fov;
    if (Math.abs(difference) < .01) {
      if (camera.fov !== target) { camera.fov = target; camera.updateProjectionMatrix(); }
      return;
    }
    camera.fov += difference * (reducedMotion.matches ? 1 : 1 - Math.exp(-dt * 5));
    camera.updateProjectionMatrix();
  }
  function updatePhotoCamera(dt) {
    if (player.flyMode) {
      camera.position.copy(player.position);
      photoTarget.set(
        player.position.x - Math.sin(player.yaw) * Math.cos(player.pitch) * 10,
        player.position.y - Math.sin(player.pitch) * 10,
        player.position.z - Math.cos(player.yaw) * Math.cos(player.pitch) * 10
      );
      camera.lookAt(photoTarget);
      return;
    }
    photoFocus.copy(player.position);
    photoFocus.y += player.isSwimming ? 1.48 : 1.65;
    photoPosition.set(
      photoFocus.x + Math.sin(player.yaw) * Math.cos(player.pitch) * player.camDist,
      photoFocus.y + Math.sin(player.pitch) * player.camDist,
      photoFocus.z + Math.cos(player.yaw) * Math.cos(player.pitch) * player.camDist
    );
    const floor = Math.max(terrain.getHeightAt(photoPosition.x, photoPosition.z), terrain.seaLevel) + .82;
    photoPosition.y = Math.max(photoPosition.y, floor);
    camera.position.lerp(photoPosition, 1 - Math.exp(-dt * 12));
    camera.lookAt(photoFocus);
  }
  function setPhotoMode(enabled) {
    if (enabled === photo.active) return;
    if (enabled) {
      drawer.classList.add('translate-x-full');
      document.querySelector('.world-options').open = false;
      if (document.pointerLockElement === renderer.domElement && document.exitPointerLock) document.exitPointerLock();
      player.keys = {};
      player.draggingLook = false;
      traversal.jumpBuffer = 0;
      traversal.coyote = 0;
      sprint.active = false;
      setTouchSprint(false);
      photo.fov = Math.max(35, Math.min(85, Math.round(camera.fov)));
      byId('photo-fov').value = String(photo.fov);
      byId('photo-fov-value').textContent = String(photo.fov);
      byId('photo-feedback').textContent = 'The captured image excludes the HUD.';
      photoHud.forEach((node) => { previousInert.set(node, node.inert); node.inert = true; });
      photo.active = true;
      document.body.classList.add('photo-mode');
      byId('photo-controls').classList.remove('hidden');
      byId('btn-photo-mode').setAttribute('aria-pressed', 'true');
      byId('photo-fov').focus();
    } else {
      photo.active = false;
      document.body.classList.remove('photo-mode');
      byId('photo-controls').classList.add('hidden');
      photoHud.forEach((node) => { node.inert = previousInert.get(node) || false; });
      previousInert.clear();
      byId('btn-photo-mode').setAttribute('aria-pressed', 'false');
      player.keys = {};
      player.draggingLook = false;
      document.querySelector('.world-options summary').focus();
    }
  }
  byId('btn-photo-mode').addEventListener('click', () => setPhotoMode(true));
  byId('btn-photo-exit').addEventListener('click', () => setPhotoMode(false));
  byId('photo-fov').addEventListener('input', (event) => {
    photo.fov = Number(event.target.value);
    byId('photo-fov-value').textContent = String(photo.fov);
  });
  byId('btn-photo-save').addEventListener('click', () => {
    try {
      // Render and read in the same task so a preserved drawing buffer is unnecessary.
      renderer.render(scene, camera);
      const image = renderer.domElement.toDataURL('image/png');
      if (!image.startsWith('data:image/png')) throw new Error('Canvas capture was empty');
      const link = document.createElement('a');
      link.href = image;
      link.download = `aetheria-${worldNoise.seed}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      byId('photo-feedback').textContent = 'PNG download started.';
    } catch (error) {
      console.error('Photo capture failed:', error);
      byId('photo-feedback').textContent = 'Capture unavailable in this browser.';
    }
  });
  renderer.domElement.addEventListener('click', (event) => {
    if (photo.active) event.stopImmediatePropagation();
  }, true);
  const pausedKeys = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyQ', 'KeyE', 'KeyF', 'KeyG', 'KeyH', 'KeyK', 'KeyL', 'KeyM', 'KeyO', 'KeyR', 'KeyT', 'KeyV', 'KeyX', 'KeyC', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'ShiftLeft', 'ShiftRight', 'ControlLeft']);
  window.addEventListener('keydown', (event) => {
    const tag = event.target && event.target.tagName;
    const editing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(tag) || (event.target && event.target.isContentEditable);
    const inControls = event.target && event.target.closest && event.target.closest('#photo-controls');
    if (event.code === 'KeyP' && !event.repeat && (!editing || inControls)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      setPhotoMode(!photo.active);
      return;
    }
    if (!photo.active) return;
    if (event.code === 'Escape') {
      event.preventDefault();
      event.stopImmediatePropagation();
      setPhotoMode(false);
      return;
    }
    if (inControls && ['Space', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.code)) return;
    if (pausedKeys.has(event.code)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);

  function setGlider(enabled) {
    if (enabled === glider.active) return true;
    if (enabled) {
      if (player.flyMode) {
        announceParkour('Exit free-fly to glide');
        return false;
      }
      if (parkour.action) {
        announceParkour('Finish the current move first');
        return false;
      }
      if (player.isSwimming || player.onGround) {
        announceParkour('Jump into the air to glide');
        return false;
      }
      if (parkour.stamina < 10) {
        announceParkour('Not enough stamina');
        return false;
      }
      parkour.stamina -= 8;
    }
    glider.active = enabled;
    parkour.regenDelay = 1.1;
    byId('btn-glider').textContent = enabled ? '[E] Glider: Open' : '[E] Glider: Closed';
    byId('btn-glider').setAttribute('aria-pressed', String(enabled));
    byId('touch-glider').textContent = enabled ? 'FOLD' : 'GLIDE';
    byId('touch-glider').setAttribute('aria-pressed', String(enabled));
    byId('touch-glider').setAttribute('aria-label', enabled ? 'Fold glider' : 'Deploy glider');
    updateStamina(0);
    return true;
  }
  function updateGlider(dt, elapsed) {
    const target = glider.active ? 1 : 0;
    const blend = 1 - Math.exp(-Math.min(dt, .05) * 9);
    glider.spread += (target - glider.spread) * blend;
    glider.visual.visible = glider.spread > .02;
    glider.visual.scale.x = Math.max(.001, glider.spread);
    const turn = (player.keys.KeyD || player.keys.ArrowRight ? 1 : 0) - (player.keys.KeyA || player.keys.ArrowLeft ? 1 : 0);
    glider.visual.rotation.z += (-turn * .16 - glider.visual.rotation.z) * blend;
    glider.visual.rotation.x = .04 + Math.sin(elapsed * 2) * .025;
    if (glider.active) {
      const boosted = player.keys.ShiftLeft || player.keys.ShiftRight || sprint.touchRequested;
      const recovered = updrafts.state.strength * 16;
      parkour.stamina = Math.max(0, Math.min(100, parkour.stamina + dt * (recovered - (boosted ? 13 : 9))));
      parkour.regenDelay = 1.1;
      if (parkour.stamina <= 0) {
        setGlider(false);
        announceParkour('Glider folded: stamina depleted');
      }
    }
  }
  byId('btn-glider').addEventListener('click', () => setGlider(!glider.active));
  const touchGlider = byId('touch-glider');
  touchGlider.addEventListener('pointerdown', (event) => { event.preventDefault(); setGlider(!glider.active); });
  touchGlider.addEventListener('click', (event) => { if (event.detail === 0) setGlider(!glider.active); });
  byId('btn-reseed').addEventListener('click', () => setGlider(false));
  function movementDirection(useForwardWhenIdle) {
    const keys = player.keys;
    const forward = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0);
    const sideways = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0);
    let x = -Math.sin(player.yaw) * forward + Math.cos(player.yaw) * sideways;
    let z = -Math.cos(player.yaw) * forward - Math.sin(player.yaw) * sideways;
    const length = Math.hypot(x, z);
    if (length < .001) {
      if (!useForwardWhenIdle) return null;
      x = -Math.sin(player.yaw);
      z = -Math.cos(player.yaw);
    } else {
      x /= length;
      z /= length;
    }
    return { x, z };
  }
  function setLedgePrompt(visible) {
    byId('ledge-prompt').classList.toggle('hidden', !visible);
    byId('touch-jump').textContent = visible ? 'CLIMB' : 'JUMP';
    byId('touch-dodge').textContent = visible ? 'LEAP' : 'ROLL';
    byId('touch-dodge').setAttribute('aria-label', visible ? 'Leap away from ledge' : 'Dodge roll');
    byId('btn-dodge').textContent = visible ? '[X] Leap Away' : '[X] Dodge';
    byId('btn-dodge').title = visible ? 'Leap away from the ledge' : 'Dodge in the movement direction';
  }
  function setClimbPrompt(visible) {
    byId('climb-prompt').classList.toggle('hidden', !visible);
    byId('touch-jump').textContent = visible ? 'TOP' : 'JUMP';
    byId('touch-dodge').textContent = visible ? 'LEAP' : 'ROLL';
    byId('touch-dodge').setAttribute('aria-label', visible ? 'Leap away from wall' : 'Dodge roll');
    byId('btn-dodge').textContent = visible ? '[X] Leap Away' : '[X] Dodge';
    byId('btn-dodge').title = visible ? 'Leap away from the wall' : 'Dodge in the movement direction';
  }
  function cancelParkour() {
    if (!parkour.action) return;
    if (parkour.action.type === 'hang' || parkour.action.type === 'mantle') {
      setLedgePrompt(false);
      ledgeCooldown = .8;
    } else if (parkour.action.type === 'climb') {
      setClimbPrompt(false);
      ledgeCooldown = .8;
    }
    parkour.action = null;
    explorerRig.rollPivot.rotation.x = 0;
    explorerRig.rollPivot.rotation.z = 0;
    player.avatar.position.copy(player.position);
  }
  function startDodge() {
    if (parkour.action) return false;
    if (player.flyMode || player.isSwimming || !player.onGround) {
      announceParkour('Dodge requires solid ground');
      return false;
    }
    if (parkour.stamina < 28) {
      announceParkour('Not enough stamina');
      return false;
    }
    const direction = movementDirection(true);
    parkour.stamina -= 28;
    parkour.regenDelay = 1.05;
    parkour.action = { type: 'dodge', age: 0, duration: .56, direction };
    updateStamina(0);
    return true;
  }
  function findVaultTarget(direction) {
    const position = player.position;
    const cx = Math.round(position.x / terrain.chunkSize);
    const cz = Math.round(position.z / terrain.chunkSize);
    let best = null;
    for (let dz = -1; dz <= 1; dz++) {
      for (let dx = -1; dx <= 1; dx++) {
        const chunk = terrain.chunks.get(`${cx + dx},${cz + dz}`);
        if (!chunk) continue;
        for (const bundle of [chunk.geologyBundle, chunk.landmarkBundle]) {
          const colliders = bundle && bundle.userData && bundle.userData.colliders;
          if (!Array.isArray(colliders)) continue;
          for (const collider of colliders) {
            if (![collider.x, collider.z, collider.y, collider.h, collider.r].every(Number.isFinite) || collider.h <= 0) continue;
            const rise = collider.y + collider.h - position.y;
            if (rise < .35 || rise > 1.5 || collider.r < .18 || collider.r > 2) continue;
            const toX = collider.x - position.x, toZ = collider.z - position.z;
            const along = toX * direction.x + toZ * direction.z;
            const side = Math.abs(toX * direction.z - toZ * direction.x);
            if (along <= 0 || along > collider.r + 1.05 || side > collider.r + .15) continue;
            const edge = Math.sqrt(Math.max(0, (collider.r + .65) ** 2 - side ** 2));
            const travel = along + edge + .2;
            if (travel > 5.5 || (best && travel >= best.travel)) continue;
            const endX = position.x + direction.x * travel;
            const endZ = position.z + direction.z * travel;
            const endY = terrain.getHeightAt(endX, endZ);
            if (endY < terrain.seaLevel + .1 || Math.abs(endY - position.y) > 1.25) continue;
            const height = Math.max(.85, collider.y + collider.h - Math.min(position.y, endY) + .5);
            let clear = true;
            for (const t of [.25, .5, .75, 1]) {
              const smooth = t * t * (3 - 2 * t);
              const x = position.x + (endX - position.x) * smooth;
              const z = position.z + (endZ - position.z) * smooth;
              const y = position.y + (endY - position.y) * smooth + Math.sin(Math.PI * t) * height;
              parkourProbe.set(x, y, z);
              terrain.resolvePropCollisions(parkourProbe, .42);
              if (Math.hypot(parkourProbe.x - x, parkourProbe.z - z) > .2) { clear = false; break; }
            }
            if (clear) best = { x: endX, y: endY, z: endZ, height, travel };
          }
        }
      }
    }
    return best;
  }
  function startVault() {
    if (parkour.action || player.flyMode || player.isSwimming || !player.onGround) return false;
    const direction = movementDirection(false);
    if (!direction) return false;
    const target = findVaultTarget(direction);
    if (!target) return false;
    if (parkour.stamina < 18) {
      announceParkour('Not enough stamina');
      return false;
    }
    parkour.stamina -= 18;
    parkour.regenDelay = 1;
    parkour.action = {
      type: 'vault', age: 0, duration: .68, direction,
      startX: player.position.x, startY: player.position.y, startZ: player.position.z,
      endX: target.x, endY: target.y, endZ: target.z, height: target.height
    };
    updateStamina(0);
    return true;
  }
  function findClimbTarget(direction) {
    const position = player.position;
    const ground = terrain.getHeightAt(position.x, position.z);
    const cx = Math.round(position.x / terrain.chunkSize);
    const cz = Math.round(position.z / terrain.chunkSize);
    let best = null;
    function consider(endX, endZ, endY, score, source, facing) {
      const anchorY = Math.max(position.y, ground + .1);
      const climbHeight = endY - 1.34 - anchorY;
      if (!Number.isFinite(endY) || endY < terrain.seaLevel + .1 || climbHeight < .25 || climbHeight > 12) return;
      if (best && score >= best.score) return;
      parkourProbe.set(endX, endY + .04, endZ);
      terrain.resolvePropCollisions(parkourProbe, .42);
      if (Math.hypot(parkourProbe.x - endX, parkourProbe.z - endZ) > .2) return;
      best = { anchorX: position.x, anchorY, anchorZ: position.z, endX, endY, endZ, score, source, direction: facing };
    }
    for (let dz = -1; dz <= 1; dz++) {
      for (let dx = -1; dx <= 1; dx++) {
        const chunk = terrain.chunks.get(`${cx + dx},${cz + dz}`);
        if (!chunk) continue;
        for (const bundle of [chunk.geologyBundle, chunk.landmarkBundle]) {
          const colliders = bundle && bundle.userData && bundle.userData.colliders;
          if (!Array.isArray(colliders)) continue;
          for (const collider of colliders) {
            if (!collider.walkable || ![collider.x, collider.z, collider.y, collider.h, collider.r].every(Number.isFinite)) continue;
            if (collider.h <= 0 || collider.r < .55 || collider.r > 6) continue;
            const dx = collider.x - position.x, dz = collider.z - position.z;
            const distance = Math.hypot(dx, dz);
            if (distance < .001) continue;
            const facing = { x: dx / distance, z: dz / distance };
            if (facing.x * direction.x + facing.z * direction.z < .55) continue;
            const gap = distance - collider.r - .42;
            if (gap < -.75 || gap > .7) continue;
            const innerRadius = Math.max(.1, collider.r - Math.min(.55, collider.r * .5));
            const endX = collider.x - facing.x * innerRadius;
            const endZ = collider.z - facing.z * innerRadius;
            const top = collider.y + collider.h;
            const endY = terrain.getSupportHeightAt(endX, endZ, top + .5);
            if (endY < top - .65) continue;
            consider(endX, endZ, endY, Math.max(0, gap), { type: 'collider', x: collider.x, z: collider.z, y: collider.y, h: collider.h, r: collider.r }, facing);
          }
        }
      }
    }
    const near = terrain.getHeightAt(position.x + direction.x * .2, position.z + direction.z * .2);
    const front = terrain.getHeightAt(position.x + direction.x, position.z + direction.z);
    const endX = position.x + direction.x * 1.6;
    const endZ = position.z + direction.z * 1.6;
    const endY = terrain.getHeightAt(endX, endZ);
    if (front - near > .8 && endY - ground > 2 && endY >= front - .35 && Math.abs(endY - front) < 1.2) {
      consider(endX, endZ, endY, 1, { type: 'terrain' }, direction);
    }
    return best;
  }
  function startClimb() {
    if (parkour.action || glider.active || player.flyMode || player.isSwimming || ledgeCooldown > 0) return false;
    const direction = movementDirection(false);
    if (!direction) return false;
    const target = findClimbTarget(direction);
    if (!target) return false;
    if (parkour.stamina < 10) {
      announceParkour('Not enough stamina');
      return false;
    }
    const previousY = player.position.y;
    player.position.set(target.anchorX, target.anchorY, target.anchorZ);
    player.camera.position.y += target.anchorY - previousY;
    player.avatar.position.copy(player.position);
    player.velocity.set(0, 0, 0);
    player.onGround = false;
    player.keys.Space = false;
    parkour.stamina -= 5;
    parkour.regenDelay = 1.1;
    parkour.action = { type: 'climb', age: 0, movement: 0, surfaceCheck: .3, ...target };
    setClimbPrompt(true);
    announceParkour('Climbing: W/S up or down');
    updateStamina(0);
    return true;
  }
  // Prefer walkable prop tops, then check steep terrain for a safe landing.
  function findLedgeTarget(direction) {
    const position = player.position;
    const groundHere = terrain.getHeightAt(position.x, position.z);
    const cx = Math.round(position.x / terrain.chunkSize);
    const cz = Math.round(position.z / terrain.chunkSize);
    let best = null;
    function consider(endX, endZ, endY, score, source) {
      const rise = endY - position.y;
      const anchorY = endY - 1.34;
      if (!Number.isFinite(endY) || endY < terrain.seaLevel + .1 || rise < .7 || rise > 1.95) return;
      if (anchorY < groundHere + .08 || Math.abs(anchorY - position.y) > .65 || (best && score >= best.score)) return;
      parkourProbe.set(endX, endY + .04, endZ);
      terrain.resolvePropCollisions(parkourProbe, .42);
      if (Math.hypot(parkourProbe.x - endX, parkourProbe.z - endZ) > .2) return;
      best = { anchorX: position.x, anchorY, anchorZ: position.z, endX, endY, endZ, score, source };
    }
    for (let dz = -1; dz <= 1; dz++) {
      for (let dx = -1; dx <= 1; dx++) {
        const chunk = terrain.chunks.get(`${cx + dx},${cz + dz}`);
        if (!chunk) continue;
        for (const bundle of [chunk.geologyBundle, chunk.landmarkBundle]) {
          const colliders = bundle && bundle.userData && bundle.userData.colliders;
          if (!Array.isArray(colliders)) continue;
          for (const collider of colliders) {
            if (!collider.walkable || ![collider.x, collider.z, collider.y, collider.h, collider.r].every(Number.isFinite)) continue;
            if (collider.h <= 0 || collider.r < .55 || collider.r > 6) continue;
            const toX = collider.x - position.x, toZ = collider.z - position.z;
            const along = toX * direction.x + toZ * direction.z;
            const side = Math.abs(toX * direction.z - toZ * direction.x);
            if (along <= 0 || side > collider.r * .75) continue;
            const edge = along - Math.sqrt(Math.max(0, (collider.r + .42) ** 2 - side ** 2));
            if (edge < -.65 || edge > 1.05) continue;
            const travel = Math.max(.25, edge + .42 + Math.min(.55, collider.r * .5));
            const endX = position.x + direction.x * travel;
            const endZ = position.z + direction.z * travel;
            if (Math.hypot(endX - collider.x, endZ - collider.z) >= collider.r - .05) continue;
            const top = collider.y + collider.h;
            const endY = terrain.getSupportHeightAt(endX, endZ, top + .5);
            if (endY < top - .65) continue;
            consider(endX, endZ, endY, Math.max(0, edge), { type: 'collider', x: collider.x, z: collider.z, y: collider.y, h: collider.h, r: collider.r });
          }
        }
      }
    }
    const near = terrain.getHeightAt(position.x + direction.x * .2, position.z + direction.z * .2);
    const front = terrain.getHeightAt(position.x + direction.x, position.z + direction.z);
    const endX = position.x + direction.x * 1.6;
    const endZ = position.z + direction.z * 1.6;
    const endY = terrain.getHeightAt(endX, endZ);
    if (front - near > .55 && endY >= front - .35 && Math.abs(endY - front) < 1.2) {
      consider(endX, endZ, endY, 1, { type: 'terrain' });
    }
    return best;
  }
  function maybeGrabLedge(dt) {
    if (parkour.action || glider.active || player.onGround || player.flyMode || player.isSwimming || parkour.stamina < 8 || ledgeCooldown > 0 || player.velocity.y > 4.5) return;
    const direction = movementDirection(false);
    if (!direction) return;
    ledgeScanTimer -= dt;
    if (ledgeScanTimer > 0) return;
    ledgeScanTimer = .12;
    const target = findLedgeTarget(direction);
    if (!target) return;
    const previousY = player.position.y;
    player.position.set(target.anchorX, target.anchorY, target.anchorZ);
    player.camera.position.y += target.anchorY - previousY;
    player.avatar.position.copy(player.position);
    player.velocity.set(0, 0, 0);
    player.onGround = false;
    player.keys.Space = false;
    parkour.regenDelay = 1.1;
    let facing = direction;
    if (target.source.type === 'collider') {
      const dx = target.source.x - target.anchorX, dz = target.source.z - target.anchorZ;
      const length = Math.hypot(dx, dz);
      if (length > .001) facing = { x: dx / length, z: dz / length };
    }
    parkour.action = { type: 'hang', age: 0, direction: facing, shimmy: 0, surfaceCheck: .25, ...target };
    setLedgePrompt(true);
    announceParkour('Ledge caught');
  }
  function hangSurfaceValid(action) {
    const source = action.source;
    const support = source.type === 'collider'
      ? terrain.getSupportHeightAt(action.endX, action.endZ, source.y + source.h + .5)
      : terrain.getHeightAt(action.endX, action.endZ);
    return Number.isFinite(support) && Math.abs(support - action.endY) < .55;
  }
  // Move around a prop's curved rim or along a terrain edge, checking both handhold and landing.
  function shimmyLedge(action, side, dt) {
    const source = action.source;
    let anchorX, anchorZ, endX, endZ, endY, direction;
    if (source.type === 'collider') {
      const dx = action.anchorX - source.x, dz = action.anchorZ - source.z;
      const radius = Math.hypot(dx, dz);
      if (radius < .1) return false;
      const angle = Math.atan2(dz, dx) - side * 1.2 * dt / radius;
      const nx = Math.cos(angle), nz = Math.sin(angle);
      anchorX = source.x + nx * radius;
      anchorZ = source.z + nz * radius;
      const innerRadius = Math.hypot(action.endX - source.x, action.endZ - source.z);
      endX = source.x + nx * innerRadius;
      endZ = source.z + nz * innerRadius;
      endY = terrain.getSupportHeightAt(endX, endZ, source.y + source.h + .5);
      if (endY < source.y + source.h - .65) return false;
      direction = { x: -nx, z: -nz };
    } else {
      direction = action.direction;
      anchorX = action.anchorX - direction.z * side * 1.2 * dt;
      anchorZ = action.anchorZ + direction.x * side * 1.2 * dt;
      const near = terrain.getHeightAt(anchorX + direction.x * .2, anchorZ + direction.z * .2);
      const front = terrain.getHeightAt(anchorX + direction.x, anchorZ + direction.z);
      endX = anchorX + direction.x * 1.6;
      endZ = anchorZ + direction.z * 1.6;
      endY = terrain.getHeightAt(endX, endZ);
      if (front - near <= .55 || endY < front - .35 || Math.abs(endY - front) >= 1.2) return false;
    }
    const anchorY = endY - 1.34;
    if (!Number.isFinite(endY) || endY < terrain.seaLevel + .1 || Math.abs(anchorY - action.anchorY) > .25) return false;
    if (anchorY < terrain.getHeightAt(anchorX, anchorZ) + .08) return false;
    parkourProbe.set(anchorX, anchorY, anchorZ);
    terrain.resolvePropCollisions(parkourProbe, .42);
    if (Math.hypot(parkourProbe.x - anchorX, parkourProbe.z - anchorZ) > .2) return false;
    parkourProbe.set(endX, endY + .04, endZ);
    terrain.resolvePropCollisions(parkourProbe, .42);
    if (Math.hypot(parkourProbe.x - endX, parkourProbe.z - endZ) > .2) return false;
    Object.assign(action, { anchorX, anchorY, anchorZ, endX, endY, endZ, direction });
    return true;
  }
  function stepWallClimb(action, dt) {
    const vertical = (player.keys.KeyW || player.keys.ArrowUp ? 1 : 0) - (player.keys.KeyS || player.keys.ArrowDown ? 1 : 0);
    const side = (player.keys.KeyD || player.keys.ArrowRight ? 1 : 0) - (player.keys.KeyA || player.keys.ArrowLeft ? 1 : 0);
    let traversed = false;
    if (side) {
      const source = action.source;
      let anchorX, anchorZ, endX, endZ, endY, direction;
      if (source.type === 'collider') {
        const dx = action.anchorX - source.x, dz = action.anchorZ - source.z;
        const radius = Math.hypot(dx, dz);
        if (radius > .1) {
          const angle = Math.atan2(dz, dx) - side * 1.05 * dt / radius;
          const nx = Math.cos(angle), nz = Math.sin(angle);
          anchorX = source.x + nx * radius;
          anchorZ = source.z + nz * radius;
          const innerRadius = Math.hypot(action.endX - source.x, action.endZ - source.z);
          endX = source.x + nx * innerRadius;
          endZ = source.z + nz * innerRadius;
          endY = terrain.getSupportHeightAt(endX, endZ, source.y + source.h + .5);
          direction = { x: -nx, z: -nz };
          if (endY < source.y + source.h - .65) endY = NaN;
        }
      } else {
        direction = action.direction;
        anchorX = action.anchorX - direction.z * side * 1.05 * dt;
        anchorZ = action.anchorZ + direction.x * side * 1.05 * dt;
        const near = terrain.getHeightAt(anchorX + direction.x * .2, anchorZ + direction.z * .2);
        const front = terrain.getHeightAt(anchorX + direction.x, anchorZ + direction.z);
        endX = anchorX + direction.x * 1.6;
        endZ = anchorZ + direction.z * 1.6;
        endY = terrain.getHeightAt(endX, endZ);
        if (front - near <= .55 || endY < front - .35 || Math.abs(endY - front) >= 1.2) endY = NaN;
      }
      if (Number.isFinite(endY) && endY >= terrain.seaLevel + .1 && Math.abs(endY - action.endY) < .3 && action.anchorY >= terrain.getHeightAt(anchorX, anchorZ) + .05) {
        parkourProbe.set(anchorX, action.anchorY, anchorZ);
        terrain.resolvePropCollisions(parkourProbe, .42);
        const clearWall = Math.hypot(parkourProbe.x - anchorX, parkourProbe.z - anchorZ) <= .2;
        parkourProbe.set(endX, endY + .04, endZ);
        terrain.resolvePropCollisions(parkourProbe, .42);
        const clearTop = Math.hypot(parkourProbe.x - endX, parkourProbe.z - endZ) <= .2;
        if (clearWall && clearTop) {
          Object.assign(action, { anchorX, anchorZ, endX, endY, endZ, direction });
          traversed = true;
        }
      }
    }
    action.surfaceCheck -= dt;
    if (action.surfaceCheck <= 0) {
      action.surfaceCheck = .3;
      if (!hangSurfaceValid(action)) return 'lost';
    }
    const floor = terrain.getHeightAt(action.anchorX, action.anchorZ);
    const lip = action.endY - 1.34;
    if (!Number.isFinite(floor) || lip < floor + .12) return 'lost';
    action.anchorY = THREE.MathUtils.clamp(action.anchorY + vertical * 1.8 * dt, floor + .1, lip);
    action.movement = vertical || (traversed ? side : 0);
    if (vertical < 0 && action.anchorY <= floor + .11) { action.anchorY = floor; return 'ground'; }
    if (vertical > 0 && action.anchorY >= lip - .015) { action.anchorY = lip; return 'ledge'; }
    return 'climb';
  }
  function releaseClimb() {
    const action = parkour.action;
    if (!action || action.type !== 'climb') return false;
    parkour.action = null;
    setClimbPrompt(false);
    ledgeCooldown = .9;
    parkour.regenDelay = 1.1;
    explorerRig.rollPivot.rotation.x = 0;
    explorerRig.rollPivot.rotation.z = 0;
    const dx = -action.direction.x * .25, dz = -action.direction.z * .25;
    player.position.x += dx;
    player.position.z += dz;
    player.camera.position.x += dx;
    player.camera.position.z += dz;
    player.velocity.set(dx * 4, -2, dz * 4);
    player.onGround = false;
    player.keys.Space = false;
    player.avatar.position.copy(player.position);
    return true;
  }
  function reachClimbLedge(action) {
    if (!action || action.type !== 'climb' || parkour.action !== action) return false;
    if (action.anchorY < action.endY - 1.44) {
      announceParkour('Climb upward to reach the ledge');
      return false;
    }
    action.anchorY = action.endY - 1.34;
    parkour.action = { ...action, type: 'hang', age: 0, shimmy: 0, surfaceCheck: .25 };
    player.keys.Space = false;
    setClimbPrompt(false);
    setLedgePrompt(true);
    announceParkour('Ledge reached');
    return true;
  }
  function dropLedge() {
    const action = parkour.action;
    if (!action || action.type !== 'hang') return false;
    parkour.action = null;
    ledgeCooldown = .9;
    parkour.regenDelay = 1.1;
    setLedgePrompt(false);
    explorerRig.rollPivot.rotation.x = 0;
    const dx = -action.direction.x * .25, dz = -action.direction.z * .25;
    player.position.x += dx;
    player.position.z += dz;
    player.camera.position.x += dx;
    player.camera.position.z += dz;
    player.velocity.set(dx * 4, -2, dz * 4);
    player.onGround = false;
    player.keys.Space = false;
    player.avatar.position.copy(player.position);
    return true;
  }
  function startWallLeap() {
    const action = parkour.action;
    if (!action || (action.type !== 'hang' && action.type !== 'climb')) return false;
    if (parkour.stamina < 22) {
      announceParkour('Not enough stamina');
      return false;
    }
    const direction = { x: -action.direction.x, z: -action.direction.z };
    parkour.stamina -= 22;
    parkour.regenDelay = 1.1;
    ledgeCooldown = 1;
    parkour.action = { type: 'walljump', age: 0, duration: .34, direction };
    player.velocity.set(direction.x * 6.5, 8.2, direction.z * 6.5);
    player.onGround = false;
    player.keys.Space = false;
    if (action.type === 'climb') setClimbPrompt(false);
    else setLedgePrompt(false);
    updateStamina(0);
    return true;
  }
  function dodgeOrLeap() {
    if (parkour.action && (parkour.action.type === 'hang' || parkour.action.type === 'climb')) return startWallLeap();
    return startDodge();
  }
  function startMantle() {
    const action = parkour.action;
    if (!action || action.type !== 'hang') return false;
    if (parkour.stamina < 12) {
      announceParkour('Not enough stamina');
      return false;
    }
    parkour.stamina -= 12;
    parkour.regenDelay = 1.1;
    parkour.action = {
      type: 'mantle', age: 0, duration: .82, direction: action.direction,
      startX: player.position.x, startY: player.position.y, startZ: player.position.z,
      endX: action.endX, endY: action.endY, endZ: action.endZ
    };
    player.keys.Space = false;
    setLedgePrompt(false);
    updateStamina(0);
    return true;
  }
  byId('btn-mantle').addEventListener('click', startMantle);
  byId('btn-drop-ledge').addEventListener('click', dropLedge);
  byId('btn-leap-ledge').addEventListener('click', startWallLeap);
  byId('btn-climb-release').addEventListener('click', releaseClimb);
  byId('btn-climb-leap').addEventListener('click', startWallLeap);
  function advanceParkour(dt) {
    const action = parkour.action;
    if (!action) return;
    const sustained = action.type === 'hang' || action.type === 'climb';
    action.age = sustained ? action.age + dt : Math.min(action.duration, action.age + dt);
    const t = sustained ? 0 : action.age / action.duration;
    const position = player.position;
    const beforeX = position.x, beforeY = position.y, beforeZ = position.z;
    if (action.type === 'dodge') {
      const speed = 8.2 + 4.6 * Math.sin(Math.PI * t);
      position.x += action.direction.x * speed * dt;
      position.z += action.direction.z * speed * dt;
      terrain.resolvePropCollisions(position, .42);
      let floor = terrain.getSupportHeightAt(position.x, position.z, beforeY);
      if (floor > beforeY + .65) {
        position.x = beforeX;
        position.z = beforeZ;
        floor = terrain.getSupportHeightAt(beforeX, beforeZ, beforeY);
      }
      player.velocity.set(action.direction.x * speed, 0, action.direction.z * speed);
      if (floor < beforeY - .8) {
        player.onGround = false;
        action.age = action.duration;
      } else {
        position.y = floor;
        player.onGround = true;
      }
    } else if (action.type === 'climb') {
      const outcome = stepWallClimb(action, dt);
      position.set(action.anchorX, action.anchorY, action.anchorZ);
      player.velocity.set(0, 0, 0);
      player.onGround = false;
      if (outcome === 'lost') {
        announceParkour('Climbing surface no longer available');
        releaseClimb();
        return;
      }
      parkour.stamina = Math.max(0, parkour.stamina - dt * (action.movement ? 13 : 6));
      parkour.regenDelay = 1.1;
      if (outcome === 'ground') {
        parkour.action = null;
        setClimbPrompt(false);
        ledgeCooldown = .7;
        player.onGround = true;
      } else if (parkour.stamina <= 0) {
        announceParkour('Grip lost');
        releaseClimb();
        return;
      } else if (outcome === 'ledge') {
        reachClimbLedge(action);
      }
    } else if (action.type === 'hang') {
      const side = (player.keys.KeyD || player.keys.ArrowRight ? 1 : 0) - (player.keys.KeyA || player.keys.ArrowLeft ? 1 : 0);
      const moved = side !== 0 && shimmyLedge(action, side, dt);
      action.shimmy = moved ? side : 0;
      position.set(action.anchorX, action.anchorY, action.anchorZ);
      player.velocity.set(0, 0, 0);
      player.onGround = false;
      action.surfaceCheck -= dt;
      if (action.surfaceCheck <= 0) {
        action.surfaceCheck = .3;
        if (!hangSurfaceValid(action)) {
          announceParkour('Ledge no longer available');
          dropLedge();
          return;
        }
      }
      parkour.stamina = Math.max(0, parkour.stamina - dt * (moved ? 15 : 11));
      parkour.regenDelay = 1.1;
      if (parkour.stamina <= 0) {
        announceParkour('Grip lost');
        dropLedge();
        return;
      }
    } else if (action.type === 'walljump') {
      const speed = 6.5 * (1 - .25 * t);
      position.x += action.direction.x * speed * dt;
      position.z += action.direction.z * speed * dt;
      terrain.resolvePropCollisions(position, .42);
      const floor = terrain.getSupportHeightAt(position.x, position.z, beforeY);
      if (position.y <= floor) {
        position.y = floor;
        player.onGround = true;
        player.velocity.y = 0;
        action.age = action.duration;
      }
      player.velocity.x = action.direction.x * speed;
      player.velocity.z = action.direction.z * speed;
    } else if (action.type === 'mantle') {
      // Lift first, then move over the edge to avoid crossing the wall.
      const upTime = Math.min(1, t / .55);
      const forwardTime = Math.max(0, (t - .4) / .6);
      const up = upTime * upTime * (3 - 2 * upTime);
      const forward = forwardTime * forwardTime * (3 - 2 * forwardTime);
      position.x = action.startX + (action.endX - action.startX) * forward;
      position.z = action.startZ + (action.endZ - action.startZ) * forward;
      position.y = action.startY + (action.endY - action.startY + .18) * up - .18 * forward;
      const inverseDt = dt > .0001 ? 1 / dt : 0;
      player.velocity.set((position.x - beforeX) * inverseDt, (position.y - beforeY) * inverseDt, (position.z - beforeZ) * inverseDt);
      player.onGround = false;
    } else {
      const smooth = t * t * (3 - 2 * t);
      position.x = action.startX + (action.endX - action.startX) * smooth;
      position.z = action.startZ + (action.endZ - action.startZ) * smooth;
      position.y = action.startY + (action.endY - action.startY) * smooth + Math.sin(Math.PI * t) * action.height;
      const rate = 6 * t * (1 - t) / action.duration;
      player.velocity.set((action.endX - action.startX) * rate, (action.endY - action.startY) * rate + Math.cos(Math.PI * t) * Math.PI * action.height / action.duration, (action.endZ - action.startZ) * rate);
      player.onGround = false;
    }
    player.avatar.rotation.y = Math.atan2(action.direction.x, action.direction.z);
    player.avatar.position.copy(position);
    player.camera.position.x += position.x - beforeX;
    player.camera.position.y += position.y - beforeY;
    player.camera.position.z += position.z - beforeZ;
    if (!sustained && action.age >= action.duration) {
      if (action.type === 'vault' || action.type === 'mantle') {
        player.position.y = action.endY;
        player.onGround = true;
        player.velocity.set(0, 0, 0);
        player.avatar.position.copy(player.position);
      }
      if (action.type === 'mantle') ledgeCooldown = .7;
      parkour.action = null;
      explorerRig.rollPivot.rotation.x = 0;
      explorerRig.rollPivot.rotation.z = 0;
    }
  }
  byId('btn-dodge').addEventListener('click', dodgeOrLeap);
  const touchDodge = byId('touch-dodge');
  touchDodge.addEventListener('pointerdown', (event) => { event.preventDefault(); dodgeOrLeap(); });
  touchDodge.addEventListener('click', (event) => { if (event.detail === 0) dodgeOrLeap(); });
  byId('btn-reseed').addEventListener('click', cancelParkour);
  window.addEventListener('keydown', (event) => {
    const tag = event.target && event.target.tagName;
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag) || (event.target && (event.target.isContentEditable || event.target.id === 'radar-canvas'))) return;
    if (tag === 'BUTTON' && event.code === 'Space') return;
    if (event.code === 'KeyE' && !event.repeat && !player.flyMode) {
      event.preventDefault();
      setGlider(!glider.active);
      return;
    }
    if (event.code === 'KeyX' && !event.repeat) { event.preventDefault(); dodgeOrLeap(); }
    if ((event.code === 'KeyS' || event.code === 'ArrowDown') && parkour.action && parkour.action.type === 'hang' && !event.repeat) {
      event.preventDefault();
      dropLedge();
      return;
    }
    if (event.code === 'KeyQ' && parkour.action && parkour.action.type === 'climb' && !event.repeat) {
      event.preventDefault();
      releaseClimb();
      return;
    }
    if (event.code === 'Space' && parkour.action && !player.flyMode) {
      event.preventDefault();
      if (parkour.action.type === 'hang' && !event.repeat) startMantle();
      else if (parkour.action.type === 'climb' && !event.repeat) reachClimbLedge(parkour.action);
      player.keys.Space = false;
    } else if (event.code === 'Space' && !event.repeat && !player.flyMode) {
      if (startVault() || startClimb()) {
        event.preventDefault();
        player.keys.Space = false;
      } else if (!glider.active && !player.isSwimming) {
        traversal.jumpBuffer = .15;
      }
    }
  });

  function updateExplorerPose(dt, elapsed) {
    const speed = Math.hypot(player.velocity.x, player.velocity.z);
    const moving = speed > .3;
    const airborne = !player.onGround && !player.isSwimming && !player.flyMode;
    let state = 'IDLE';
    if (player.flyMode) state = 'FREE FLY';
    else if (parkour.action) state = parkour.action.type === 'hang' && parkour.action.shimmy ? 'SHIMMYING' : { dodge: 'DODGING', vault: 'VAULTING', hang: 'HANGING', climb: 'CLIMBING WALL', mantle: 'MANTLING', walljump: 'WALL LEAP' }[parkour.action.type];
    else if (glider.active) state = 'GLIDING';
    else if (player.isSwimming) state = moving ? 'SWIMMING' : 'TREADING WATER';
    else if (airborne) state = player.velocity.y > .5 ? 'JUMPING' : 'FALLING';
    else if (moving) state = speed > 10 ? 'RUNNING' : 'WALKING';
    if (state !== heroState) {
      heroState = state;
      byId('hud-hero-state').textContent = `EXPLORER / ${state}`;
    }
    if (player.flyMode) return;

    const blend = 1 - Math.exp(-Math.min(dt, .05) * 10);
    const stride = Math.sin(player.walkCycle);
    const movement = Math.min(1, speed / 7);
    const breath = Math.sin(elapsed * 2.1);
    const ease = (current, target) => current + (target - current) * blend;
    if (parkour.action) {
      const type = parkour.action.type;
      const hanging = type === 'hang';
      const climbing = type === 'mantle';
      const wallClimbing = type === 'climb';
      const dodging = type === 'dodge';
      const leaping = type === 'walljump';
      const t = hanging || wallClimbing ? 0 : parkour.action.age / parkour.action.duration;
      explorerRig.rollPivot.rotation.x = dodging ? t * Math.PI * 2 : hanging || wallClimbing ? .04 + breath * .015 : (leaping ? -.16 : -.3) * Math.sin(Math.PI * t);
      explorerRig.rollPivot.rotation.z = hanging && parkour.action.shimmy ? parkour.action.shimmy * .06 : 0;
      explorerRig.upperBody.position.y = .89;
      explorerRig.upperBody.rotation.z = ease(explorerRig.upperBody.rotation.z, 0);
      explorerRig.head.rotation.x = ease(explorerRig.head.rotation.x, hanging ? -.2 : dodging ? .25 : -.1);
      const armTarget = hanging ? -2.6 : wallClimbing ? -2.3 : climbing ? -2.15 + t * .6 : dodging ? -1.1 : leaping ? -1.7 : -1.35;
      const limbWave = hanging && parkour.action.shimmy ? Math.sin(elapsed * 8) * .22 : wallClimbing && parkour.action.movement ? Math.sin(elapsed * 7) * .3 : 0;
      explorerRig.leftArm.shoulder.rotation.x = ease(explorerRig.leftArm.shoulder.rotation.x, armTarget + limbWave);
      explorerRig.rightArm.shoulder.rotation.x = ease(explorerRig.rightArm.shoulder.rotation.x, armTarget - limbWave);
      explorerRig.leftArm.elbow.rotation.x = ease(explorerRig.leftArm.elbow.rotation.x, hanging ? -.25 : -.8);
      explorerRig.rightArm.elbow.rotation.x = ease(explorerRig.rightArm.elbow.rotation.x, hanging ? -.25 : -.8);
      player.legL.rotation.x = ease(player.legL.rotation.x, hanging ? -.15 : wallClimbing ? -.2 + limbWave : dodging ? -.55 : -.65);
      player.legR.rotation.x = ease(player.legR.rotation.x, hanging ? .12 : wallClimbing ? -.2 - limbWave : dodging ? -.55 : .3);
      explorerRig.leftLeg.knee.rotation.x = ease(explorerRig.leftLeg.knee.rotation.x, hanging ? .3 : wallClimbing ? .55 : .85);
      explorerRig.rightLeg.knee.rotation.x = ease(explorerRig.rightLeg.knee.rotation.x, hanging ? .25 : wallClimbing ? .55 : .65);
      explorerRig.cape.rotation.x = ease(explorerRig.cape.rotation.x, .38);
      explorerRig.lowerCape.rotation.x = ease(explorerRig.lowerCape.rotation.x, .18);
      return;
    }
    if (glider.active) {
      explorerRig.rollPivot.rotation.x = .12 + breath * .015;
      explorerRig.rollPivot.rotation.z = 0;
      explorerRig.upperBody.position.y = .89;
      explorerRig.upperBody.rotation.z = ease(explorerRig.upperBody.rotation.z, 0);
      explorerRig.head.rotation.x = ease(explorerRig.head.rotation.x, -.1);
      explorerRig.leftArm.shoulder.rotation.x = ease(explorerRig.leftArm.shoulder.rotation.x, -2.65);
      explorerRig.rightArm.shoulder.rotation.x = ease(explorerRig.rightArm.shoulder.rotation.x, -2.65);
      explorerRig.leftArm.elbow.rotation.x = ease(explorerRig.leftArm.elbow.rotation.x, -.2);
      explorerRig.rightArm.elbow.rotation.x = ease(explorerRig.rightArm.elbow.rotation.x, -.2);
      player.legL.rotation.x = ease(player.legL.rotation.x, -.12);
      player.legR.rotation.x = ease(player.legR.rotation.x, .12);
      explorerRig.leftLeg.knee.rotation.x = ease(explorerRig.leftLeg.knee.rotation.x, .25);
      explorerRig.rightLeg.knee.rotation.x = ease(explorerRig.rightLeg.knee.rotation.x, .3);
      explorerRig.cape.rotation.x = ease(explorerRig.cape.rotation.x, .42);
      explorerRig.lowerCape.rotation.x = ease(explorerRig.lowerCape.rotation.x, .22 + breath * .025);
      return;
    }
    explorerRig.rollPivot.rotation.x = 0;
    explorerRig.rollPivot.rotation.z = 0;
    let leftArm = -stride * .58 * movement;
    let rightArm = stride * .58 * movement;
    if (player.isSwimming) {
      leftArm = -1.0 + stride * .6 * movement;
      rightArm = -1.0 - stride * .6 * movement;
    } else if (airborne) {
      leftArm = -.75;
      rightArm = -.75;
      player.legL.rotation.x = ease(player.legL.rotation.x, -.32);
      player.legR.rotation.x = ease(player.legR.rotation.x, .24);
    }
    explorerRig.leftArm.shoulder.rotation.x = ease(explorerRig.leftArm.shoulder.rotation.x, leftArm);
    explorerRig.rightArm.shoulder.rotation.x = ease(explorerRig.rightArm.shoulder.rotation.x, rightArm);
    explorerRig.leftArm.elbow.rotation.x = ease(explorerRig.leftArm.elbow.rotation.x, player.isSwimming ? -.45 : -.12 - movement * .14);
    explorerRig.rightArm.elbow.rotation.x = ease(explorerRig.rightArm.elbow.rotation.x, player.isSwimming ? -.45 : -.12 - movement * .14);
    explorerRig.leftLeg.knee.rotation.x = ease(explorerRig.leftLeg.knee.rotation.x, airborne ? .5 : Math.max(0, -stride) * .5 * movement);
    explorerRig.rightLeg.knee.rotation.x = ease(explorerRig.rightLeg.knee.rotation.x, airborne ? .25 : Math.max(0, stride) * .5 * movement);
    explorerRig.upperBody.position.y = .89 + breath * .004 + (airborne ? 0 : Math.abs(stride) * .022 * movement);
    explorerRig.upperBody.rotation.z = ease(explorerRig.upperBody.rotation.z, -stride * .035 * movement);
    explorerRig.head.rotation.z = ease(explorerRig.head.rotation.z, breath * .016 + stride * .018 * movement);
    explorerRig.head.rotation.x = ease(explorerRig.head.rotation.x, airborne ? -.10 : .02);
    explorerRig.cape.rotation.x = ease(explorerRig.cape.rotation.x, .05 + movement * .22 + breath * .015);
    explorerRig.lowerCape.rotation.x = ease(explorerRig.lowerCape.rotation.x, .04 + movement * .12 + stride * .025 * movement);
  }
  function createTrailEffects() {
    const maxParticles = 72, maxRings = 10;
    const palette = {
      dust: new THREE.Color(0xcbbd9d), sand: new THREE.Color(0xe0c08a),
      snow: new THREE.Color(0xe4f1ee), water: new THREE.Color(0x9bd8df)
    };
    const particles = Array.from({ length: maxParticles }, () => ({ active: false }));
    const ripples = Array.from({ length: maxRings }, () => ({ active: false }));
    const particleMesh = new THREE.InstancedMesh(
      new THREE.SphereGeometry(.12, 6, 4),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .55, depthWrite: false }),
      maxParticles
    );
    const ringGeometry = new THREE.RingGeometry(.78, 1, 24);
    ringGeometry.rotateX(-Math.PI / 2);
    const ringMesh = new THREE.InstancedMesh(
      ringGeometry,
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .5, depthWrite: false, side: THREE.DoubleSide }),
      maxRings
    );
    particleMesh.setColorAt(0, palette.dust);
    ringMesh.setColorAt(0, palette.dust);
    particleMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    ringMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    particleMesh.instanceColor.setUsage(THREE.DynamicDrawUsage);
    ringMesh.instanceColor.setUsage(THREE.DynamicDrawUsage);
    particleMesh.frustumCulled = false;
    ringMesh.frustumCulled = false;
    particleMesh.count = 0;
    ringMesh.count = 0;
    scene.add(particleMesh, ringMesh);
    const marker = new THREE.Object3D();
    let particleCursor = 0, ringCursor = 0;
    const state = { enabled: true };

    function surface(x, y, z, elapsed) {
      const seabed = terrain.getHeightAt(x, z);
      const wave = ocean.getWaveHeightAt(x, z, elapsed, seabed);
      const wet = player.isSwimming || (wave - seabed > .08 && y < wave + .18);
      if (wet) return { y: Math.max(y, wave) + .04, color: palette.water, wet: true };
      const biome = String(terrain.getBiomeAt(x, y, z) || '').toLowerCase();
      const color = /snow|glacial|frost/.test(biome) ? palette.snow : /desert|dune|arid/.test(biome) ? palette.sand : palette.dust;
      return { y: y + .04, color, wet: false };
    }
    function emitParticles(x, z, ground, count, energy) {
      for (let i = 0; i < count; i++) {
        const particle = particles[particleCursor++ % maxParticles];
        const angle = Math.random() * Math.PI * 2;
        const spread = .16 + Math.random() * .35;
        Object.assign(particle, {
          active: true, age: 0, life: ground.wet ? .42 + Math.random() * .18 : .55 + Math.random() * .22,
          x: x + Math.cos(angle) * spread, y: ground.y, z: z + Math.sin(angle) * spread,
          vx: Math.cos(angle) * energy * (.25 + Math.random() * .45),
          vy: (ground.wet ? .8 : .3) + Math.random() * energy * .45,
          vz: Math.sin(angle) * energy * (.25 + Math.random() * .45),
          size: .65 + Math.random() * .8, wet: ground.wet, color: ground.color
        });
      }
    }
    function emitRing(x, z, ground, radius) {
      const ring = ripples[ringCursor++ % maxRings];
      Object.assign(ring, { active: true, age: 0, life: .55, x, y: ground.y, z, radius, color: ground.color });
    }
    function foot(x, y, z, elapsed, swimming) {
      if (!state.enabled) return;
      const ground = surface(x, y, z, elapsed);
      emitParticles(x, z, ground, swimming ? 3 : 2, swimming ? 1 : .55);
      if (ground.wet) emitRing(x, z, ground, .55);
    }
    function landing(x, y, z, elapsed, impact) {
      if (!state.enabled) return;
      const ground = surface(x, y, z, elapsed);
      const strength = Math.min(2, .7 + impact * .07);
      emitParticles(x, z, ground, Math.min(10, 4 + Math.floor(impact / 2)), strength);
      emitRing(x, z, ground, Math.min(1.5, .45 + impact * .06));
    }
    function clear() {
      particles.forEach((particle) => { particle.active = false; });
      ripples.forEach((ring) => { ring.active = false; });
      particleMesh.count = 0;
      ringMesh.count = 0;
    }
    function update(dt) {
      if (!state.enabled) return;
      let count = 0;
      const damping = Math.max(0, 1 - dt * 1.5);
      for (const particle of particles) {
        if (!particle.active) continue;
        particle.age += dt;
        if (particle.age >= particle.life) { particle.active = false; continue; }
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
        particle.z += particle.vz * dt;
        particle.vx *= damping;
        particle.vz *= damping;
        particle.vy += (particle.wet ? -3 : .25) * dt;
        const age = particle.age / particle.life;
        marker.position.set(particle.x, particle.y, particle.z);
        marker.scale.setScalar(Math.max(.001, particle.size * (1 - age) * (1 + age * .5)));
        marker.updateMatrix();
        particleMesh.setMatrixAt(count, marker.matrix);
        particleMesh.setColorAt(count++, particle.color);
      }
      particleMesh.count = count;
      particleMesh.instanceMatrix.needsUpdate = true;
      particleMesh.instanceColor.needsUpdate = true;
      count = 0;
      for (const ring of ripples) {
        if (!ring.active) continue;
        ring.age += dt;
        if (ring.age >= ring.life) { ring.active = false; continue; }
        const age = ring.age / ring.life;
        const fade = age < .75 ? 1 : (1 - age) / .25;
        marker.position.set(ring.x, ring.y, ring.z);
        marker.scale.setScalar(Math.max(.001, (.15 + age * ring.radius) * fade));
        marker.updateMatrix();
        ringMesh.setMatrixAt(count, marker.matrix);
        ringMesh.setColorAt(count++, ring.color);
      }
      ringMesh.count = count;
      ringMesh.instanceMatrix.needsUpdate = true;
      ringMesh.instanceColor.needsUpdate = true;
    }
    return { state, foot, landing, clear, update };
  }
  const trail = createTrailEffects();
  function setTrailEffects(enabled, persist = true) {
    trail.state.enabled = enabled;
    byId('btn-traversal-effects').textContent = enabled ? 'Trail Effects: On' : 'Trail Effects: Off';
    byId('btn-traversal-effects').setAttribute('aria-pressed', String(enabled));
    if (!enabled) trail.clear();
    if (persist) {
      try { localStorage.setItem('aetheria-trail-effects', enabled ? '1' : '0'); } catch (error) { /* Optional preference. */ }
    }
  }
  try {
    const savedEffects = localStorage.getItem('aetheria-trail-effects');
    setTrailEffects(savedEffects === null ? !reducedMotion.matches : savedEffects === '1', false);
  } catch (error) {
    setTrailEffects(!reducedMotion.matches, false);
  }
  byId('btn-traversal-effects').addEventListener('click', () => setTrailEffects(!trail.state.enabled));
  byId('btn-reseed').addEventListener('click', () => {
    trail.clear();
    traversal.jumpBuffer = traversal.coyote = traversal.footDistance = traversal.swimDistance = 0;
  });
  function updateTraversal(dt, elapsed, before) {
    const position = player.position;
    const distance = Math.hypot(position.x - before.x, position.z - before.z);
    const anchored = before.action === 'hang' || before.action === 'climb' || before.action === 'mantle';
    const landed = !before.grounded && player.onGround && !player.isSwimming && !player.flyMode && !anchored;
    if (landed && before.velocityY < -1.2) {
      trail.landing(position.x, position.y, position.z, elapsed, -before.velocityY);
      if (!reducedMotion.matches) traversal.landingTimer = .28;
    }
    if (distance > Math.max(3, dt * 100)) {
      traversal.footDistance = traversal.swimDistance = 0;
    } else if (player.onGround && !player.isSwimming && !player.flyMode && !parkour.action && !glider.active) {
      traversal.footDistance += distance;
      const step = sprint.active ? 3 : 2.3;
      if (traversal.footDistance >= step) {
        traversal.footDistance %= step;
        const side = traversal.foot++ % 2 ? 1 : -1;
        const x = position.x + Math.cos(player.avatar.rotation.y) * .14 * side;
        const z = position.z - Math.sin(player.avatar.rotation.y) * .14 * side;
        trail.foot(x, position.y, z, elapsed, false);
      }
      traversal.swimDistance = 0;
    } else if (player.isSwimming && !player.flyMode) {
      traversal.swimDistance += distance;
      if (traversal.swimDistance >= 2.6) {
        traversal.swimDistance %= 2.6;
        trail.foot(position.x, position.y, position.z, elapsed, true);
      }
      traversal.footDistance = 0;
    } else {
      traversal.footDistance = traversal.swimDistance = 0;
    }
    trail.update(dt);
  }
  function applyLandingPose(dt) {
    if (traversal.landingTimer <= 0) return;
    traversal.landingTimer = Math.max(0, traversal.landingTimer - dt);
    if (parkour.action || player.flyMode || player.isSwimming || glider.active) return;
    const bend = Math.sin((1 - traversal.landingTimer / .28) * Math.PI) * .12;
    explorerRig.upperBody.position.y -= bend;
    explorerRig.leftLeg.knee.rotation.x += bend * 2;
    explorerRig.rightLeg.knee.rotation.x += bend * 2;
  }
  function createHamletSystem() {
    const names = ['Dawnstead', 'Willowmere', 'Mossford', 'Briar Hollow', 'Stonebrook', 'Alderwatch'];
    const cardinals = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const state = { seed: worldNoise.seed, phase: 'survey', site: null, houses: [], well: null, discovered: false };
    const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
    const roundGeometry = new THREE.CylinderGeometry(1, 1, 1, 12);
    const roofGeometry = new THREE.BufferGeometry();
    roofGeometry.setAttribute('position', new THREE.Float32BufferAttribute([
      -.55, 0, -.55, .55, 0, -.55, 0, .48, -.55,
      -.55, 0, .55, .55, 0, .55, 0, .48, .55
    ], 3));
    roofGeometry.setIndex([0, 2, 1, 3, 4, 5, 0, 3, 5, 0, 5, 2, 2, 5, 4, 2, 4, 1]);
    roofGeometry.computeVertexNormals();
    const materials = {
      stone: new THREE.MeshStandardMaterial({ color: 0x77776a, roughness: .98 }),
      wall: new THREE.MeshStandardMaterial({ color: 0xcab995, roughness: .96 }),
      wood: new THREE.MeshStandardMaterial({ color: 0x4d3b30, roughness: .92 }),
      roof: new THREE.MeshStandardMaterial({ color: 0x795044, roughness: .95, flatShading: true, side: THREE.DoubleSide }),
      glass: new THREE.MeshStandardMaterial({ color: 0xe2bb78, emissive: 0x6a3d18, emissiveIntensity: .32, roughness: .7 }),
      water: new THREE.MeshStandardMaterial({ color: 0x426e6a, roughness: .35, metalness: .08 }),
      path: new THREE.MeshStandardMaterial({ color: 0x93866d, roughness: 1, side: THREE.DoubleSide })
    };
    const surveyOffsets = [[0, 0], [-18, 0], [18, 0], [0, -18], [0, 18], [-14, -14], [-14, 14], [14, -14], [14, 14]];
    const marker = new THREE.Object3D();
    const pathGeometries = [];
    let root = null, surveyIndex = 0, candidates = [], candidateIndex = 0, nextHud = 0, nextValidation = 0, planning = null;

    function hash(index, salt) {
      let h = (Math.imul(worldNoise.seed ^ salt, 1274126177) ^ Math.imul(index + 1, 374761393)) >>> 0;
      h = Math.imul(h ^ (h >>> 16), 2246822519);
      h = Math.imul(h ^ (h >>> 13), 3266489917);
      return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
    }
    function clearBuilt() {
      if (root) {
        root.traverse((object) => { if (object.isInstancedMesh) object.dispose(); });
        scene.remove(root);
      }
      root = null;
      pathGeometries.forEach((geometry) => geometry.dispose());
      pathGeometries.length = 0;
      state.houses = [];
      state.well = null;
      planning = null;
    }
    function reset(seed) {
      clearBuilt();
      state.seed = seed;
      state.phase = 'survey';
      state.site = null;
      state.discovered = false;
      surveyIndex = 0;
      candidates = [];
      candidateIndex = 0;
      nextHud = 0;
      nextValidation = 0;
      byId('compass-hamlet').textContent = 'SURVEYING SETTLEMENT';
      byId('btn-track-hamlet').disabled = true;
      byId('btn-track-hamlet').textContent = 'Surveying Hamlet...';
    }
    function finishSurvey() {
      candidates.sort((a, b) => a.score - b.score);
      if (!candidates.length) {
        state.phase = 'unavailable';
        byId('compass-hamlet').textContent = 'NO SUITABLE HAMLET SITE';
        byId('btn-track-hamlet').textContent = 'No Hamlet Found';
        window.dispatchEvent(new Event('aetheria:hamlet-site'));
        return;
      }
      chooseCandidate();
    }
    function chooseCandidate() {
      const candidate = candidates[candidateIndex++];
      if (!candidate) return false;
      state.site = { x: candidate.x, z: candidate.z, name: names[(state.seed >>> 0) % names.length] };
      state.phase = 'waiting';
      try { state.discovered = localStorage.getItem(`aetheria-hamlet-seen:${state.seed}`) === '1'; } catch (error) { /* Optional discovery memory. */ }
      byId('btn-track-hamlet').disabled = false;
      byId('btn-track-hamlet').textContent = 'Track Hamlet';
      byId('btn-track-hamlet').title = `Set a waypoint for ${state.site.name}`;
      window.dispatchEvent(new Event('aetheria:hamlet-site'));
      return true;
    }
    function stepSurvey() {
      const deadline = performance.now() + 2.5;
      do {
        const radius = 80 + Math.floor(surveyIndex / 12) * 28;
        const angle = (state.seed % 360) * Math.PI / 180 + surveyIndex * 2.399963;
        const x = Math.cos(angle) * radius, z = Math.sin(angle) * radius;
        let low = Infinity, high = -Infinity;
        for (const offset of surveyOffsets) {
          const height = terrain.getHeightAt(x + offset[0], z + offset[1]);
          low = Math.min(low, height);
          high = Math.max(high, height);
        }
        if (low > terrain.seaLevel + .3 && Number.isFinite(low) && Number.isFinite(high)) {
          const score = (high - low) * 5 + radius * .012;
          candidates.push({ x, z, score });
        }
        surveyIndex++;
      } while (surveyIndex < 72 && performance.now() < deadline);
      if (surveyIndex >= 72) finishSurvey();
    }
    function chunksReady(x, z) {
      const cx = Math.round(x / terrain.chunkSize), cz = Math.round(z / terrain.chunkSize);
      for (let dz = -1; dz <= 1; dz++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (!terrain.chunks.has(`${cx + dx},${cz + dz}`)) return false;
        }
      }
      return true;
    }
    function clearOfProps(x, z, radius) {
      const size = terrain.chunkSize, cx = Math.round(x / size), cz = Math.round(z / size);
      for (let dz = -1; dz <= 1; dz++) {
        for (let dx = -1; dx <= 1; dx++) {
          const cellX = cx + dx, cellZ = cz + dz;
          const outsideX = Math.max(0, Math.abs(x - cellX * size) - size * .5);
          const outsideZ = Math.max(0, Math.abs(z - cellZ * size) - size * .5);
          if (Math.hypot(outsideX, outsideZ) > radius + 8) continue;
          const chunk = terrain.chunks.get(`${cellX},${cellZ}`);
          if (!chunk) return false;
          for (const bundle of [chunk.forestBundle, chunk.geologyBundle, chunk.landmarkBundle]) {
            const colliders = bundle && bundle.userData && bundle.userData.colliders;
            if (!Array.isArray(colliders)) continue;
            for (const collider of colliders) {
              if (!Number.isFinite(collider.x) || !Number.isFinite(collider.z)) continue;
              const separation = radius + (Number.isFinite(collider.r) ? collider.r : .7) + .4;
              if (Math.hypot(collider.x - x, collider.z - z) < separation) return false;
            }
          }
        }
      }
      return true;
    }
    function plotAt(x, z, width, depth, yaw) {
      const ux = Math.cos(yaw), uz = -Math.sin(yaw), fx = Math.sin(yaw), fz = Math.cos(yaw);
      let low = terrain.getHeightAt(x, z), high = low;
      for (const sx of [-1, 1]) {
        for (const sz of [-1, 1]) {
          const px = x + ux * sx * width * .5 + fx * sz * depth * .5;
          const pz = z + uz * sx * width * .5 + fz * sz * depth * .5;
          const height = terrain.getHeightAt(px, pz);
          low = Math.min(low, height);
          high = Math.max(high, height);
        }
      }
      if (!Number.isFinite(low) || !Number.isFinite(high) || low < terrain.seaLevel + .15 || high - low > 3.2) return null;
      return { x, z, width, depth, yaw, base: high + .15, foundation: Math.max(.65, high - low + .4), radius: Math.hypot(width, depth) * .5 + .6 };
    }
    function makePath(startX, startZ, endX, endZ) {
      const dx = endX - startX, dz = endZ - startZ;
      const length = Math.hypot(dx, dz);
      if (length < 1) return null;
      const nx = -dz / length, nz = dx / length, segments = 20, width = .7;
      const positions = [], indices = [];
      for (let i = 0; i <= segments; i++) {
        const t = i / segments, x = startX + dx * t, z = startZ + dz * t;
        for (const side of [-1, 1]) {
          const px = x + nx * width * side, pz = z + nz * width * side;
          positions.push(px, terrain.getHeightAt(px, pz) + .09, pz);
        }
        if (i < segments) {
          const a = i * 2;
          indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
        }
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geometry.setIndex(indices);
      geometry.computeVertexNormals();
      pathGeometries.push(geometry);
      const mesh = new THREE.Mesh(geometry, materials.path);
      mesh.receiveShadow = true;
      return mesh;
    }
    // Find clear plots over several frames instead of blocking terrain streaming.
    function stepPlanning() {
      const site = state.site;
      if (planning.complete) {
        const inPlot = !player.flyMode && planning.plots.some((plot) => Math.hypot(player.position.x - plot.x, player.position.z - plot.z) < plot.radius + .6 && player.position.y < plot.base + 5);
        const inPlaza = !player.flyMode && Math.hypot(player.position.x - site.x, player.position.z - site.z) < 2.5;
        if (inPlot || inPlaza) {
          if (!planning.warned) { planning.warned = true; announceParkour('Move clear of the surveyed plots'); }
          return;
        }
        const plots = planning.plots;
        planning = null;
        build(plots);
        return;
      }
      const phase = (state.seed % 360) * Math.PI / 180;
      const deadline = performance.now() + 2.5;
      do {
        const i = planning.index++;
        const radius = 15 + (i % 6) * 5.5;
        const angle = phase + i * 2.399963;
        const x = site.x + Math.cos(angle) * radius, z = site.z + Math.sin(angle) * radius;
        const width = (i < 40 ? 5.4 : 4.2) + hash(i, 19), depth = (i < 40 ? 4.8 : 3.8) + hash(i, 29) * .8;
        const yaw = Math.atan2(site.x - x, site.z - z);
        const plot = plotAt(x, z, width, depth, yaw);
        if (plot && clearOfProps(x, z, plot.radius) && !planning.plots.some((other) => Math.hypot(other.x - x, other.z - z) < other.radius + plot.radius + 2)) planning.plots.push(plot);
      } while (planning.index < 64 && planning.plots.length < 4 && performance.now() < deadline);
      if (planning.index >= 64 || planning.plots.length >= 4) {
        planning.complete = true;
      }
    }
    function build(plots) {
      const site = state.site;
      const wellGround = terrain.getHeightAt(site.x, site.z);
      const hasWell = Number.isFinite(wellGround) && wellGround > terrain.seaLevel + .15 && clearOfProps(site.x, site.z, 2.3);
      if (!plots.length && candidateIndex < Math.min(candidates.length, 8) && chooseCandidate()) return;
      if (!plots.length && !hasWell) {
        state.phase = 'unavailable';
        state.site = null;
        byId('compass-hamlet').textContent = 'NO CLEAR HAMLET SITE';
        byId('btn-track-hamlet').disabled = true;
        byId('btn-track-hamlet').textContent = 'No Hamlet Found';
        window.dispatchEvent(new Event('aetheria:hamlet-site'));
        return;
      }

      const batches = {
        stone: { geometry: boxGeometry, material: materials.stone, matrices: [] },
        wall: { geometry: boxGeometry, material: materials.wall, matrices: [] },
        wood: { geometry: boxGeometry, material: materials.wood, matrices: [] },
        glass: { geometry: boxGeometry, material: materials.glass, matrices: [] },
        roof: { geometry: roofGeometry, material: materials.roof, matrices: [] },
        stoneRound: { geometry: roundGeometry, material: materials.stone, matrices: [] },
        waterRound: { geometry: roundGeometry, material: materials.water, matrices: [] }
      };
      function origin(x, y, z, yaw) {
        const matrix = new THREE.Matrix4().makeRotationY(yaw);
        matrix.setPosition(x, y, z);
        return matrix;
      }
      function part(batch, transform, x, y, z, sx, sy, sz) {
        marker.position.set(x, y, z);
        marker.rotation.set(0, 0, 0);
        marker.scale.set(sx, sy, sz);
        marker.updateMatrix();
        batches[batch].matrices.push(transform.clone().multiply(marker.matrix));
      }
      root = new THREE.Group();
      state.houses = [];
      for (const plot of plots) {
        const transform = origin(plot.x, plot.base, plot.z, plot.yaw);
        const w = plot.width, d = plot.depth;
        part('stone', transform, 0, -plot.foundation * .5, 0, w + .35, plot.foundation, d + .35);
        part('wall', transform, 0, 1.5, 0, w, 3, d);
        part('roof', transform, 0, 3, 0, w, 3, d);
        for (const x of [-w * .49, w * .49]) {
          for (const z of [-d * .49, d * .49]) part('wood', transform, x, 1.5, z, .16, 3, .16);
        }
        part('wood', transform, 0, 1.04, d * .5 + .06, 1.12, 2.08, .12);
        part('stone', transform, 0, .08, d * .5 + .55, 1.4, .16, 1.1);
        for (const x of [-w * .29, w * .29]) {
          part('wood', transform, x, 1.75, d * .5 + .055, .92, 1.05, .1);
          part('glass', transform, x, 1.75, d * .5 + .12, .68, .8, .04);
        }
        part('stone', transform, w * .23, 3.72, -d * .18, .48, 1.35, .48);
        state.houses.push({ x: plot.x, z: plot.z, base: plot.base, bottom: plot.base - plot.foundation, width: w, depth: d, yaw: plot.yaw, height: 3, peak: 1.44 });
        const frontX = Math.sin(plot.yaw), frontZ = Math.cos(plot.yaw);
        const path = makePath(plot.x + frontX * (d * .5 + 1), plot.z + frontZ * (d * .5 + 1), site.x - frontX * 2.7, site.z - frontZ * 2.7);
        if (path) root.add(path);
      }
      if (hasWell) {
        const transform = origin(site.x, wellGround + .1, site.z, 0);
        part('stoneRound', transform, 0, .45, 0, 1.65, .9, 1.65);
        part('waterRound', transform, 0, .93, 0, 1.18, .05, 1.18);
        part('wood', transform, -1.3, 1.85, 0, .18, 2.2, .18);
        part('wood', transform, 1.3, 1.85, 0, .18, 2.2, .18);
        part('roof', transform, 0, 2.95, 0, 3.2, 1.4, 2.3);
        state.well = { x: site.x, z: site.z, base: wellGround, radius: 1.7, height: 3.7 };
      }
      state.site.kind = plots.length > 1 ? 'Hamlet' : plots.length ? 'Outpost' : 'Well';
      byId('btn-track-hamlet').textContent = `Track ${state.site.kind}`;
      for (const batch of Object.values(batches)) {
        if (!batch.matrices.length) continue;
        const mesh = new THREE.InstancedMesh(batch.geometry, batch.material, batch.matrices.length);
        batch.matrices.forEach((matrix, index) => mesh.setMatrixAt(index, matrix));
        mesh.instanceMatrix.needsUpdate = true;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.frustumCulled = false;
        root.add(mesh);
      }
      scene.add(root);
      state.phase = 'built';
    }
    function roofHeight(house, localX) {
      return house.base + house.height + house.peak * Math.max(0, 1 - Math.abs(localX) / (house.width * .55));
    }
    function supportHeight(x, z, previousY, base) {
      if (state.phase !== 'built' || state.seed !== worldNoise.seed) return base;
      let support = base;
      for (const house of state.houses) {
        const dx = x - house.x, dz = z - house.z, c = Math.cos(house.yaw), s = Math.sin(house.yaw);
        const localX = c * dx - s * dz, localZ = s * dx + c * dz;
        if (Math.abs(localX) > house.width * .55 || Math.abs(localZ) > house.depth * .55) continue;
        const roof = roofHeight(house, localX);
        if (previousY >= roof - .58) support = Math.max(support, roof);
      }
      return support;
    }
    function resolve(position, radius) {
      if (state.phase !== 'built' || state.seed !== worldNoise.seed) return;
      for (const house of state.houses) {
        const dx = position.x - house.x, dz = position.z - house.z, c = Math.cos(house.yaw), s = Math.sin(house.yaw);
        let localX = c * dx - s * dz, localZ = s * dx + c * dz;
        if (position.y + 1.8 < house.bottom - .1 || position.y > house.base + house.height + house.peak + .5) continue;
        if (Math.abs(localX) < house.width * .55 && Math.abs(localZ) < house.depth * .55 && position.y >= roofHeight(house, localX) - .58) continue;
        const halfX = house.width * .5 + radius, halfZ = house.depth * .5 + radius;
        if (Math.abs(localX) >= halfX || Math.abs(localZ) >= halfZ) continue;
        const pushX = halfX - Math.abs(localX), pushZ = halfZ - Math.abs(localZ);
        if (pushX < pushZ) localX = (localX < 0 ? -1 : 1) * halfX;
        else localZ = (localZ < 0 ? -1 : 1) * halfZ;
        position.x = house.x + c * localX + s * localZ;
        position.z = house.z - s * localX + c * localZ;
      }
      if (state.well && position.y + 1.8 >= state.well.base && position.y <= state.well.base + state.well.height) {
        const dx = position.x - state.well.x, dz = position.z - state.well.z;
        const minimum = state.well.radius + radius, distance = Math.hypot(dx, dz);
        if (distance < minimum) {
          const nx = distance > .001 ? dx / distance : 1, nz = distance > .001 ? dz / distance : 0;
          position.x = state.well.x + nx * minimum;
          position.z = state.well.z + nz * minimum;
        }
      }
    }
    function update(position, elapsed) {
      if (state.seed !== worldNoise.seed) reset(worldNoise.seed);
      try {
        if (state.phase === 'survey') stepSurvey();
        if (!state.site) return;
        const distance = Math.hypot(position.x - state.site.x, position.z - state.site.z);
        if (state.phase === 'waiting' && distance < 340 && chunksReady(state.site.x, state.site.z)) {
          planning = { index: 0, plots: [] };
          state.phase = 'planning';
        }
        if (state.phase === 'planning' && distance < 340 && chunksReady(state.site.x, state.site.z)) stepPlanning();
      } catch (error) {
        console.error('Hamlet generation failed:', error);
        clearBuilt();
        state.phase = 'unavailable';
        state.site = null;
        byId('compass-hamlet').textContent = 'HAMLET GENERATION UNAVAILABLE';
        byId('btn-track-hamlet').disabled = true;
        byId('btn-track-hamlet').textContent = 'No Hamlet Found';
        window.dispatchEvent(new Event('aetheria:hamlet-site'));
        return;
      }
      if (!state.site) return;
      const distance = Math.hypot(position.x - state.site.x, position.z - state.site.z);
      if (root) root.visible = distance < 460;
      if (state.phase === 'built' && distance < 250 && elapsed >= nextValidation) {
        nextValidation = elapsed + 1.5;
        const ready = state.houses.every((house) => chunksReady(house.x, house.z)) && (!state.well || chunksReady(state.well.x, state.well.z));
        if (ready) {
          const blockedHouse = state.houses.some((house) => !clearOfProps(house.x, house.z, Math.hypot(house.width, house.depth) * .5 + .6));
          const blockedWell = state.well && !clearOfProps(state.well.x, state.well.z, 2.3);
          if (blockedHouse || blockedWell) { invalidate(); return; }
        }
      }
      if (state.phase === 'built' && !state.discovered && distance < 24) {
        state.discovered = true;
        try { localStorage.setItem(`aetheria-hamlet-seen:${state.seed}`, '1'); } catch (error) { /* Optional discovery memory. */ }
        announceParkour(`Discovered ${state.site.name}`);
      }
      if (elapsed >= nextHud) {
        nextHud = elapsed + .4;
        const bearing = (Math.atan2(state.site.x - position.x, -(state.site.z - position.z)) * 180 / Math.PI + 360) % 360;
        const direction = cardinals[Math.round(bearing / 45) % 8];
        const status = state.phase === 'built' ? state.site.name.toUpperCase() : `SURVEY / ${state.site.name.toUpperCase()}`;
        byId('compass-hamlet').textContent = `${status} / ${Math.round(distance)}m ${direction}`;
      }
    }
    function invalidate() {
      if (state.phase === 'unavailable') { reset(worldNoise.seed); return; }
      if (!state.site || (state.phase !== 'built' && state.phase !== 'planning')) return;
      clearBuilt();
      state.phase = 'waiting';
    }
    function setWireframe(enabled) {
      Object.values(materials).forEach((material) => { material.wireframe = enabled; });
    }
    reset(worldNoise.seed);
    return { state, update, resolve, supportHeight, invalidate, setWireframe };
  }
  const hamlet = createHamletSystem();
  const coreResolveProps = terrain.resolvePropCollisions.bind(terrain);
  const coreSupportHeight = terrain.getSupportHeightAt.bind(terrain);
  terrain.resolvePropCollisions = (position, radius = .42) => {
    coreResolveProps(position, radius);
    hamlet.resolve(position, radius);
  };
  terrain.getSupportHeightAt = (x, z, previousY) => hamlet.supportHeight(x, z, previousY, coreSupportHeight(x, z, previousY));
  const coreRebuildForest = terrain.rebuildForestOnly.bind(terrain);
  const coreRebuildGeology = terrain.rebuildGeologyOnly.bind(terrain);
  const coreSetWireframe = terrain.setWireframe.bind(terrain);
  terrain.rebuildForestOnly = () => { coreRebuildForest(); hamlet.invalidate(); };
  terrain.rebuildGeologyOnly = () => { coreRebuildGeology(); hamlet.invalidate(); };
  terrain.setWireframe = (enabled) => { coreSetWireframe(enabled); hamlet.setWireframe(enabled); };
  const corePlayerUpdate = player.update.bind(player);
  player.update = (dt, elapsed) => {
    hamlet.update(player.position, elapsed);
    updrafts.update(player.position, elapsed);
    if (photo.active) {
      updatePhotoCamera(dt);
      updateCameraFov(dt);
      return;
    }
    ledgeCooldown = Math.max(0, ledgeCooldown - dt);
    if (parkour.action && player.flyMode) cancelParkour();
    if (glider.active && (player.flyMode || player.isSwimming || player.onGround || parkour.action)) setGlider(false);
    const before = traversal.before;
    before.grounded = player.onGround;
    before.velocityY = player.velocity.y;
    before.x = player.position.x;
    before.z = player.position.z;
    before.action = parkour.action ? parkour.action.type : null;
    const jumpEligible = !parkour.action && !glider.active && !player.flyMode && !player.isSwimming;
    if (jumpEligible) traversal.coyote = before.grounded ? .12 : Math.max(0, traversal.coyote - dt);
    else traversal.jumpBuffer = traversal.coyote = 0;
    let injectedJump = false;
    let previousSpace;
    if (jumpEligible && traversal.jumpBuffer > 0 && (player.onGround || traversal.coyote > 0)) {
      previousSpace = player.keys.Space;
      player.keys.Space = true;
      player.onGround = true;
      traversal.jumpBuffer = 0;
      traversal.coyote = 0;
      injectedJump = true;
    }
    const requested = sprintRequested();
    if (sprint.exhausted && !requested && parkour.stamina >= 25) sprint.exhausted = false;
    const forward = (player.keys.KeyW || player.keys.ArrowUp ? 1 : 0) - (player.keys.KeyS || player.keys.ArrowDown ? 1 : 0);
    const sideways = (player.keys.KeyD || player.keys.ArrowRight ? 1 : 0) - (player.keys.KeyA || player.keys.ArrowLeft ? 1 : 0);
    const sprintEligible = !parkour.action && !glider.active && !player.flyMode;
    sprint.active = Boolean(sprintEligible && requested && (forward || sideways) && !sprint.exhausted && parkour.stamina > 0);
    const previousShiftLeft = player.keys.ShiftLeft;
    const previousShiftRight = player.keys.ShiftRight;
    if (sprintEligible && (sprint.exhausted || parkour.stamina <= 0)) {
      player.keys.ShiftLeft = false;
      player.keys.ShiftRight = false;
    } else if ((sprintEligible || glider.active) && sprint.touchRequested) {
      player.keys.ShiftLeft = true;
    }
    let forcedForward = false;
    let previousForward;
    if (glider.active) {
      // Blend toward the wind's lift before the core applies its gravity step.
      const gravity = 26 * dt;
      const descent = Math.max(player.velocity.y - gravity, -3);
      const target = -3 + updrafts.state.strength * 6.5;
      const assisted = player.velocity.y + (target - player.velocity.y) * (1 - Math.exp(-dt * 2.5));
      player.velocity.y = Math.max(descent, updrafts.state.strength > 0 ? assisted : descent) + gravity;
      const hasDirection = movementKeys.some((key) => player.keys[key]);
      if (!hasDirection) {
        previousForward = player.keys.KeyW;
        player.keys.KeyW = true;
        forcedForward = true;
      }
    }
    try {
      if (parkour.action) {
        for (const key of blockedKeys) { heldKeys[key] = player.keys[key]; player.keys[key] = false; }
        try { corePlayerUpdate(dt, elapsed); }
        finally { for (const key of blockedKeys) player.keys[key] = heldKeys[key]; }
      } else {
        corePlayerUpdate(dt, elapsed);
      }
    } finally {
      if (forcedForward) player.keys.KeyW = previousForward;
      if (injectedJump) player.keys.Space = previousSpace;
      player.keys.ShiftLeft = previousShiftLeft;
      player.keys.ShiftRight = previousShiftRight;
    }
    if (glider.active && (player.onGround || player.isSwimming || player.flyMode || parkour.action)) setGlider(false);
    if (parkour.action && player.isSwimming) cancelParkour();
    if (!parkour.action && !glider.active) maybeGrabLedge(dt);
    advanceParkour(dt);
    if (before.grounded && !player.onGround && player.velocity.y > 1) traversal.coyote = 0;
    if (!injectedJump && traversal.jumpBuffer > 0) {
      if (parkour.action || glider.active || player.flyMode || player.isSwimming) traversal.jumpBuffer = 0;
      else if (player.onGround && !before.grounded) traversal.jumpBuffer = Math.max(traversal.jumpBuffer, dt + .001);
      else traversal.jumpBuffer = Math.max(0, traversal.jumpBuffer - dt);
    }
    if (heroView && player.flyMode) setHeroView(false);
    if (sprint.active && !parkour.action && !glider.active && !player.flyMode) {
      parkour.stamina = Math.max(0, parkour.stamina - dt * (player.isSwimming ? 12 : 16));
      parkour.regenDelay = 1.05;
      if (parkour.stamina <= 0) {
        sprint.exhausted = true;
        sprint.active = false;
        announceParkour('Release sprint to run again');
      }
    } else {
      sprint.active = false;
    }
    updateGlider(dt, elapsed);
    updateStamina(dt);
    updateTraversal(dt, elapsed, before);
    updateExplorerPose(dt, elapsed);
    applyLandingPose(dt);
    updateCameraFov(dt);
  };
  updateStamina(0);
  updateExplorerPose(0, 0);

  const canvas = byId('radar-canvas');
  const ctx = canvas.getContext('2d');
  const terrainCanvas = document.createElement('canvas');
  const terrainContext = terrainCanvas.getContext('2d');
  if (!ctx || !terrainContext) throw new Error('Canvas 2D is unavailable');
  const gridSize = 80;
  terrainCanvas.width = terrainCanvas.height = gridSize;
  const ranges = [80, 125, 200, 320, 500];
  let rangeIndex = 2;
  let mapRange = ranges[rangeIndex];
  let seed = worldNoise.seed;
  let snapshot = null;
  let sampling = null;
  let waypoint = null;
  let trackingHamlet = false;
  let waystones = [];
  let lastDraw = 0;
  let lastLandmarks = 0;
  let keyboardCursor = null;
  const middle = canvas.width / 2;
  const mapRadius = middle - 2;
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const scratchPosition = new THREE.Vector3();

  const beacon = new THREE.Group();
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(.22, .8, 96, 16, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xffd78b, transparent: true, opacity: .21, depthWrite: false, side: THREE.DoubleSide })
  );
  beam.position.y = 48;
  const crystal = new THREE.Mesh(
    new THREE.OctahedronGeometry(.9),
    new THREE.MeshBasicMaterial({ color: 0xffdb95 })
  );
  crystal.position.y = 5;
  const groundRing = new THREE.Mesh(
    new THREE.RingGeometry(1.5, 1.7, 40),
    new THREE.MeshBasicMaterial({ color: 0xffd78b, transparent: true, opacity: .8, side: THREE.DoubleSide, depthWrite: false })
  );
  groundRing.rotation.x = -Math.PI / 2;
  groundRing.position.y = .1;
  beacon.add(beam, crystal, groundRing);
  beacon.visible = false;
  scene.add(beacon);

  const storageKey = () => `aetheria-waypoint-v1:${seed}`;
  const announce = (message) => { byId('map-announcement').textContent = message; };
  function saveWaypoint() {
    try {
      if (waypoint) localStorage.setItem(storageKey(), JSON.stringify(waypoint));
      else localStorage.removeItem(storageKey());
    } catch (error) {
      // The radar still works if storage is unavailable.
    }
  }
  function placeWaypoint(x, z, persist = true, trackHamlet = false) {
    if (!Number.isFinite(x) || !Number.isFinite(z)) return;
    trackingHamlet = trackHamlet;
    waypoint = { x, z, kind: trackHamlet ? 'hamlet' : 'custom' };
    const ground = Math.max(terrain.seaLevel, terrain.getHeightAt(x, z));
    beacon.position.set(x, ground + .08, z);
    beacon.visible = true;
    byId('clear-waypoint').classList.remove('hidden');
    if (persist) {
      saveWaypoint();
      announce(`Waypoint set at ${Math.round(x)}, ${Math.round(z)}.`);
    }
    updateWaypointLabel();
  }
  function clearWaypoint(persist = true) {
    waypoint = null;
    trackingHamlet = false;
    beacon.visible = false;
    byId('clear-waypoint').classList.add('hidden');
    byId('waypoint-status').textContent = 'Click the map to set a waypoint';
    if (persist) {
      saveWaypoint();
      announce('Waypoint cleared.');
    }
  }
  function restoreWaypoint() {
    clearWaypoint(false);
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey()) || 'null');
      if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.z)) placeWaypoint(saved.x, saved.z, false, saved.kind === 'hamlet');
    } catch (error) {
      // Ignore unavailable or invalid saved data.
    }
  }
  function updateWaypointLabel() {
    if (!waypoint) return;
    const dx = waypoint.x - player.position.x;
    const dz = waypoint.z - player.position.z;
    const distance = Math.round(Math.hypot(dx, dz));
    const heading = (Math.atan2(dx, -dz) * 180 / Math.PI + 360) % 360;
    const direction = directions[Math.round(heading / 45) % 8];
    byId('waypoint-status').textContent = `${distance}m ${direction} / ${Math.round(waypoint.x)}, ${Math.round(waypoint.z)}`;
  }
  restoreWaypoint();
  byId('clear-waypoint').addEventListener('click', () => clearWaypoint());
  byId('btn-track-hamlet').addEventListener('click', () => {
    if (!hamlet.state.site) return;
    placeWaypoint(hamlet.state.site.x, hamlet.state.site.z, true, true);
    announceParkour(`Tracking ${hamlet.state.site.name}`);
  });
  window.addEventListener('aetheria:hamlet-site', () => {
    if (!trackingHamlet) return;
    if (hamlet.state.site) {
      if (!waypoint || Math.hypot(waypoint.x - hamlet.state.site.x, waypoint.z - hamlet.state.site.z) > .1) {
        placeWaypoint(hamlet.state.site.x, hamlet.state.site.z, true, true);
        announceParkour(`Survey updated: ${hamlet.state.site.name}`);
      }
    } else {
      clearWaypoint();
      announceParkour('No suitable hamlet site');
    }
  });

  function beginSampling() {
    sampling = {
      centerX: player.position.x,
      centerZ: player.position.z,
      span: mapRange * 2.7,
      range: mapRange,
      seed,
      row: 0,
      heights: new Float32Array(gridSize * gridSize)
    };
  }
  function terrainColor(height, sea) {
    if (height < sea - 3) return [33, 76, 83];
    if (height < sea) return [62, 111, 108];
    if (height < sea + 2) return [160, 157, 112];
    if (height < 11) return [92, 126, 91];
    if (height < 23) return [113, 136, 99];
    if (height < 37) return [139, 143, 114];
    if (height < 50) return [157, 155, 137];
    return [202, 205, 190];
  }
  function finishSampling(job) {
    const image = terrainContext.createImageData(gridSize, gridSize);
    for (let z = 0; z < gridSize; z++) {
      for (let x = 0; x < gridSize; x++) {
        const index = z * gridSize + x;
        const height = job.heights[index];
        const left = job.heights[z * gridSize + Math.max(0, x - 1)];
        const above = job.heights[Math.max(0, z - 1) * gridSize + x];
        const color = terrainColor(height, terrain.seaLevel);
        const relief = Math.max(.76, Math.min(1.2, 1 + (above - height) * .025 + (left - height) * .017));
        const contour = height > terrain.seaLevel && Math.floor(height / 5) !== Math.floor(left / 5) ? .78 : 1;
        const offset = index * 4;
        image.data[offset] = color[0] * relief * contour;
        image.data[offset + 1] = color[1] * relief * contour;
        image.data[offset + 2] = color[2] * relief * contour;
        image.data[offset + 3] = 255;
      }
    }
    terrainContext.putImageData(image, 0, 0);
    snapshot = { centerX: job.centerX, centerZ: job.centerZ, span: job.span, range: job.range, seed: job.seed };
    sampling = null;
    byId('radar-loading').classList.add('hidden');
  }
  // Sample a few rows per frame so the live terrain query does not stall the game.
  function sampleTerrain() {
    if (!sampling) return;
    const deadline = performance.now() + 2.5;
    do {
      const row = sampling.row;
      const z = sampling.centerZ + (row / (gridSize - 1) - .5) * sampling.span;
      for (let x = 0; x < gridSize; x++) {
        const worldX = sampling.centerX + (x / (gridSize - 1) - .5) * sampling.span;
        sampling.heights[row * gridSize + x] = terrain.getHeightAt(worldX, z);
      }
      sampling.row++;
    } while (sampling.row < gridSize && performance.now() < deadline);
    if (sampling.row === gridSize) finishSampling(sampling);
  }

  function getWaystones() {
    const found = [];
    const seen = new WeakSet();
    const locations = new Set();
    let visits = 0;
    function visit(node, depth) {
      if (!node || typeof node !== 'object' || depth > 4 || visits++ > 1000 || seen.has(node)) return;
      seen.add(node);
      if (node instanceof Map || node instanceof Set) {
        for (const item of node.values()) visit(item, depth + 1);
        return;
      }
      if (Array.isArray(node)) {
        for (const item of node) visit(item, depth + 1);
        return;
      }
      const pos = node.isObject3D ? node : (node.worldPosition || node.worldPos || node.position || node.pos || node.coords || node.location || node.group || node.mesh || node);
      let x, z;
      if (pos && pos.isObject3D && pos.parent) {
        pos.getWorldPosition(scratchPosition);
        x = scratchPosition.x;
        z = scratchPosition.z;
      } else if (Array.isArray(pos) && pos.length >= 3 && Number.isFinite(pos[0]) && Number.isFinite(pos[2])) {
        x = pos[0];
        z = pos[2];
      } else if (pos && Number.isFinite(pos.x) && Number.isFinite(pos.z)) {
        x = pos.x;
        z = pos.z;
      } else if (Number.isFinite(node.worldX) && Number.isFinite(node.worldZ)) {
        x = node.worldX;
        z = node.worldZ;
      }
      if (Number.isFinite(x) && Number.isFinite(z)) {
        const key = `${Math.round(x * 2)},${Math.round(z * 2)}`;
        if (!locations.has(key)) {
          locations.add(key);
          found.push({ x, z, attuned: Boolean(node.attuned || node.activated || node.isAttuned || node.discovered) });
        }
        return;
      }
      for (const [key, value] of Object.entries(node)) {
        if (!/^(scene|parent|children|geometry|material|matrix|uniforms)$/i.test(key)) visit(value, depth + 1);
      }
    }
    for (const [key, value] of Object.entries(landmarks)) {
      if (/waystone/i.test(key) && value && !value.isObject3D && !value.isMaterial && !value.isBufferGeometry && !value.isTexture) visit(value, 0);
    }
    // The core's compass may refer to a registry under a different property name.
    if (typeof landmarks.getCompassRadarText === 'function') {
      const references = landmarks.getCompassRadarText.toString().matchAll(/this\.([A-Za-z_$][\w$]*)/g);
      for (const match of references) {
        const value = landmarks[match[1]];
        if (value && typeof value === 'object' && !value.isObject3D) visit(value, 0);
      }
    }
    for (const name of Object.getOwnPropertyNames(Object.getPrototypeOf(landmarks))) {
      if (/^get(?:Nearest|Active|All).*Waystone/i.test(name) && typeof landmarks[name] === 'function') {
        try { visit(landmarks[name](player.position), 0); } catch (error) { /* Optional core getter. */ }
      }
    }
    for (const entry of terrain.chunks.values()) {
      const data = entry.landmarkBundle && entry.landmarkBundle.userData;
      if (!data) continue;
      for (const [key, value] of Object.entries(data)) if (/waystone/i.test(key)) visit(value, 0);
    }
    if (!found.length && typeof landmarks.getCompassRadarText === 'function') {
      const text = landmarks.getCompassRadarText(player.position);
      const match = text.match(/(\d+(?:\.\d+)?)\s*m\s*(NE|NW|SE|SW|N|E|S|W)\b/i);
      if (match) {
        const bearing = directions.indexOf(match[2].toUpperCase()) * Math.PI / 4;
        const distance = Number(match[1]);
        found.push({ x: player.position.x + Math.sin(bearing) * distance, z: player.position.z - Math.cos(bearing) * distance, approximate: true });
      }
    }
    return found;
  }
  function worldToMap(x, z) {
    return { x: middle + (x - player.position.x) / mapRange * mapRadius, y: middle + (z - player.position.z) / mapRange * mapRadius };
  }
  function mapToWorld(x, y) {
    return { x: player.position.x + (x - middle) / mapRadius * mapRange, z: player.position.z + (y - middle) / mapRadius * mapRange };
  }
  function diamond(x, y, size, fill, stroke) {
    ctx.beginPath();
    ctx.moveTo(x, y - size);
    ctx.lineTo(x + size, y);
    ctx.lineTo(x, y + size);
    ctx.lineTo(x - size, y);
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1.6; ctx.stroke(); }
  }
  function drawRadar(now) {
    const p = player.position;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.beginPath();
    ctx.arc(middle, middle, mapRadius, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = '#304c42';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (snapshot && snapshot.seed === seed && snapshot.range === mapRange) {
      const imageSize = snapshot.span / (mapRange * 2) * mapRadius * 2;
      const imageX = middle + (snapshot.centerX - p.x) / mapRange * mapRadius - imageSize / 2;
      const imageY = middle + (snapshot.centerZ - p.z) / mapRange * mapRadius - imageSize / 2;
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(terrainCanvas, imageX, imageY, imageSize, imageSize);
    }

    const grid = mapRange >= 320 ? 100 : mapRange >= 160 ? 50 : 20;
    ctx.strokeStyle = 'rgba(234, 225, 196, .13)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = Math.floor((p.x - mapRange) / grid) * grid; x <= p.x + mapRange; x += grid) {
      const px = worldToMap(x, p.z).x;
      ctx.moveTo(px, 0); ctx.lineTo(px, canvas.height);
    }
    for (let z = Math.floor((p.z - mapRange) / grid) * grid; z <= p.z + mapRange; z += grid) {
      const py = worldToMap(p.x, z).y;
      ctx.moveTo(0, py); ctx.lineTo(canvas.width, py);
    }
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 245, 213, .25)';
    ctx.beginPath(); ctx.arc(middle, middle, mapRadius * .5, 0, Math.PI * 2); ctx.stroke();

    for (const stone of waystones) {
      const point = worldToMap(stone.x, stone.z);
      if (Math.hypot(point.x - middle, point.y - middle) > mapRadius - 8) continue;
      ctx.save();
      ctx.shadowColor = '#76ded7';
      ctx.shadowBlur = 8;
      if (stone.approximate) ctx.setLineDash([2, 2]);
      diamond(point.x, point.y, 5, stone.attuned ? '#a5f4e8' : '#1b4442', '#a5f4e8');
      ctx.restore();
    }
    for (const current of updrafts.state.columns) {
      const point = worldToMap(current.x, current.z);
      if (Math.hypot(point.x - middle, point.y - middle) > mapRadius - 8) continue;
      ctx.save();
      ctx.strokeStyle = '#d0e9ce';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = '#b9f1d2';
      ctx.shadowBlur = 6;
      ctx.beginPath(); ctx.arc(point.x, point.y, 5, -.5, Math.PI * 1.25); ctx.stroke();
      ctx.beginPath(); ctx.arc(point.x, point.y, 2, .4, Math.PI * 1.8); ctx.stroke();
      ctx.restore();
    }
    if (hamlet.state.site) {
      const point = worldToMap(hamlet.state.site.x, hamlet.state.site.z);
      if (Math.hypot(point.x - middle, point.y - middle) <= mapRadius - 9) {
        ctx.save();
        ctx.fillStyle = '#3e493f';
        ctx.strokeStyle = '#f0d2a4';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(point.x - 6, point.y); ctx.lineTo(point.x, point.y - 5); ctx.lineTo(point.x + 6, point.y); ctx.lineTo(point.x + 5, point.y); ctx.lineTo(point.x + 5, point.y + 5); ctx.lineTo(point.x - 5, point.y + 5); ctx.lineTo(point.x - 5, point.y); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.restore();
      }
    }
    if (waypoint) {
      const point = worldToMap(waypoint.x, waypoint.z);
      const dx = point.x - middle;
      const dy = point.y - middle;
      const length = Math.hypot(dx, dy);
      const factor = length > mapRadius - 11 ? (mapRadius - 11) / length : 1;
      ctx.save(); ctx.shadowColor = '#ffcb71'; ctx.shadowBlur = 10;
      diamond(middle + dx * factor, middle + dy * factor, 6, '#f5ce80', '#fff3ce');
      ctx.restore();
    }
    if (keyboardCursor) {
      ctx.strokeStyle = '#fff4d8';
      ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.arc(keyboardCursor.x, keyboardCursor.y, 8, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.save();
    ctx.translate(middle, middle);
    ctx.rotate(-player.yaw);
    ctx.shadowColor = '#071a19'; ctx.shadowBlur = 6;
    ctx.fillStyle = '#fff8e5';
    ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(7, 7); ctx.lineTo(0, 4); ctx.lineTo(-7, 7); ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.restore();
    crystal.rotation.y = now * .001;
    groundRing.scale.setScalar(1 + .08 * Math.sin(now * .002));
  }

  function resetRadar() {
    sampling = null;
    snapshot = null;
    byId('radar-loading').classList.remove('hidden');
  }
  window.addEventListener('aetheria:chart-show', resetRadar);
  function updateZoom() {
    mapRange = ranges[rangeIndex];
    byId('radar-scale').textContent = `${mapRange}m radius`;
    byId('zoom-in').disabled = rangeIndex === 0;
    byId('zoom-out').disabled = rangeIndex === ranges.length - 1;
    resetRadar();
  }
  byId('zoom-in').addEventListener('click', () => { rangeIndex = Math.max(0, rangeIndex - 1); updateZoom(); });
  byId('zoom-out').addEventListener('click', () => { rangeIndex = Math.min(ranges.length - 1, rangeIndex + 1); updateZoom(); });
  canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width * canvas.width;
    const y = (event.clientY - rect.top) / rect.height * canvas.height;
    if (Math.hypot(x - middle, y - middle) > mapRadius) return;
    keyboardCursor = null;
    let point = mapToWorld(x, y), trackHamlet = false;
    if (hamlet.state.site) {
      const marker = worldToMap(hamlet.state.site.x, hamlet.state.site.z);
      if (Math.hypot(x - marker.x, y - marker.y) <= 10) {
        point = { x: hamlet.state.site.x, z: hamlet.state.site.z };
        trackHamlet = true;
      }
    }
    placeWaypoint(point.x, point.z, true, trackHamlet);
  });
  canvas.addEventListener('keydown', (event) => {
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', ' ', 'Delete', 'Backspace'].includes(event.key)) return;
    event.preventDefault();
    event.stopPropagation();
    if (event.key === 'Delete' || event.key === 'Backspace') { clearWaypoint(); return; }
    if (!keyboardCursor) keyboardCursor = { x: middle, y: middle };
    if (event.key === 'ArrowUp') keyboardCursor.y -= 10;
    if (event.key === 'ArrowDown') keyboardCursor.y += 10;
    if (event.key === 'ArrowLeft') keyboardCursor.x -= 10;
    if (event.key === 'ArrowRight') keyboardCursor.x += 10;
    const dx = keyboardCursor.x - middle, dy = keyboardCursor.y - middle;
    const length = Math.hypot(dx, dy);
    if (length > mapRadius - 7) {
      keyboardCursor.x = middle + dx / length * (mapRadius - 7);
      keyboardCursor.y = middle + dy / length * (mapRadius - 7);
    }
    if (event.key === 'Enter' || event.key === ' ') {
      let point = mapToWorld(keyboardCursor.x, keyboardCursor.y), trackHamlet = false;
      if (hamlet.state.site) {
        const marker = worldToMap(hamlet.state.site.x, hamlet.state.site.z);
        if (Math.hypot(keyboardCursor.x - marker.x, keyboardCursor.y - marker.y) <= 10) {
          point = { x: hamlet.state.site.x, z: hamlet.state.site.z };
          trackHamlet = true;
        }
      }
      placeWaypoint(point.x, point.z, true, trackHamlet);
    }
  });
  canvas.addEventListener('keyup', (event) => {
    if (event.key.startsWith('Arrow') || event.key === ' ') event.stopPropagation();
  });
  canvas.addEventListener('blur', () => { keyboardCursor = null; });

  document.addEventListener('pointerlockchange', () => {
    byId('look-hint').classList.toggle('is-hidden', document.pointerLockElement === renderer.domElement);
  });
  window.addEventListener('keydown', (event) => {
    if (event.code === 'Escape') {
      document.querySelector('.world-options').open = false;
      drawer.classList.add('translate-x-full');
    }
  });
  window.addEventListener('blur', () => {
    player.keys = {};
    sprint.active = false;
    traversal.jumpBuffer = 0;
    traversal.coyote = 0;
    setTouchSprint(false);
  });
  document.querySelectorAll('[data-move]').forEach((button) => {
    const key = button.dataset.move;
    button.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      button.setPointerCapture(event.pointerId);
      player.keys[key] = true;
      if (key === 'KeyS' && parkour.action && parkour.action.type === 'hang') {
        dropLedge();
        player.keys[key] = false;
      } else if (key === 'Space' && parkour.action && parkour.action.type === 'hang') {
        startMantle();
        player.keys.Space = false;
      } else if (key === 'Space' && parkour.action && parkour.action.type === 'climb') {
        reachClimbLedge(parkour.action);
        player.keys.Space = false;
      } else if (key === 'Space' && !player.flyMode) {
        if (startVault() || startClimb()) player.keys.Space = false;
        else if (!glider.active && !player.isSwimming) traversal.jumpBuffer = .15;
      }
    });
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      button.addEventListener(type, () => { player.keys[key] = false; });
    }
  });
  let touchLook = null;
  renderer.domElement.addEventListener('pointerdown', (event) => {
    if (event.pointerType !== 'touch') return;
    event.preventDefault();
    touchLook = { id: event.pointerId, x: event.clientX, y: event.clientY };
    renderer.domElement.setPointerCapture(event.pointerId);
  });
  renderer.domElement.addEventListener('pointermove', (event) => {
    if (!touchLook || event.pointerId !== touchLook.id) return;
    player.yaw -= (event.clientX - touchLook.x) * .004;
    player.pitch = THREE.MathUtils.clamp(player.pitch + (event.clientY - touchLook.y) * .004, -.65, 1.25);
    touchLook.x = event.clientX;
    touchLook.y = event.clientY;
  });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    renderer.domElement.addEventListener(type, (event) => { if (touchLook && event.pointerId === touchLook.id) touchLook = null; });
  }
  for (const [proxyId, originalId] of [['glider-mobile', 'btn-glider'], ['hero-mobile', 'btn-hero-view'], ['fly-mobile', 'btn-fly-mode'], ['weather-mobile', 'btn-weather-state']]) {
    const proxy = byId(proxyId), original = byId(originalId);
    proxy.addEventListener('click', () => original.click());
    const sync = () => {
      proxy.textContent = original.textContent;
      if (original.hasAttribute('aria-pressed')) proxy.setAttribute('aria-pressed', original.getAttribute('aria-pressed'));
    };
    new MutationObserver(sync).observe(original, { childList: true, characterData: true, subtree: true });
    sync();
  }

  function radarLoop(now) {
    requestAnimationFrame(radarLoop);
    if (worldNoise.seed !== seed) {
      seed = worldNoise.seed;
      byId('seed-label').textContent = `SEED ${seed}`;
      waystones = [];
      resetRadar();
      restoreWaypoint();
    }
    if (!chartVisible) return;
    const moved = snapshot && Math.hypot(player.position.x - snapshot.centerX, player.position.z - snapshot.centerZ);
    if (!sampling && (!snapshot || snapshot.range !== mapRange || moved > mapRange * .18)) beginSampling();
    sampleTerrain();
    if (now - lastLandmarks > 800) {
      waystones = getWaystones();
      lastLandmarks = now;
      updateWaypointLabel();
    }
    if (now - lastDraw > 80) {
      drawRadar(now);
      lastDraw = now;
    }
  }
  updateZoom();
  requestAnimationFrame(radarLoop);
} catch (error) {
  console.error('Aetheria could not start:', error);
  const boot = byId('boot-status');
  boot.classList.remove('hidden');
  boot.classList.add('failed');
  boot.querySelector('.boot-title').textContent = 'WORLD UNAVAILABLE';
  byId('boot-detail').textContent = 'The engine could not start. Check your connection and WebGL support, then retry.';
  byId('retry-world').classList.remove('hidden');
  byId('radar-loading').textContent = 'WORLD OFFLINE';
  byId('hud-telemetry').textContent = 'Engine unavailable';
  byId('hud-hero-state').textContent = 'EXPLORER / OFFLINE';
  byId('stamina-number').textContent = '--';
  byId('stamina-fill').style.width = '0%';
  byId('stamina-meter').setAttribute('aria-valuenow', '0');
  roadmapButton.addEventListener('click', () => drawer.classList.toggle('translate-x-full'));
  byId('btn-close-blueprint').addEventListener('click', () => drawer.classList.add('translate-x-full'));
}
const {
  SeededNoise,
  SkyAtmosphere,
  VolumetricCloudSystem,
  DynamicWeatherSystem,
  OceanWaterSystem,
  GrassFoliageSystem,
  ProceduralForestSystem,
  ProceduralGeologySystem,
  AncientLandmarksSystem,
  WorldTerrain,
  ExplorerController,
  scene,
  camera,
  renderer,
  terrain,
  ocean,
  player,
  landmarks,
  worldNoise,
  sky,
  clouds,
  weather,
  grass,
  forest,
  geology
} = _engine;

export {
  SeededNoise,
  SkyAtmosphere,
  VolumetricCloudSystem,
  DynamicWeatherSystem,
  OceanWaterSystem,
  GrassFoliageSystem,
  ProceduralForestSystem,
  ProceduralGeologySystem,
  AncientLandmarksSystem,
  WorldTerrain,
  ExplorerController,
  scene,
  camera,
  renderer,
  terrain,
  ocean,
  player,
  landmarks,
  worldNoise,
  sky,
  clouds,
  weather,
  grass,
  forest,
  geology,
  setChartVisible,
  _explorerRig as explorerRig,
  _parkour as parkour,
  _sprint as sprint,
  _traversal as traversal,
  _glider as glider,
  _updrafts as updrafts,
  _photo as photo,
  _trail as trail,
  _hamlet as hamlet,
  _beacon as beacon,
  _setHeroView as setHeroView,
  _setPhotoMode as setPhotoMode,
  _setGlider as setGlider,
  _setTrailEffects as setTrailEffects,
  _placeWaypoint as placeWaypoint,
  _clearWaypoint as clearWaypoint,
  _announceParkour as announceParkour
};