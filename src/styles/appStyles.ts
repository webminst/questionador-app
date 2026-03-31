export const APP_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
:root{--bg:#f4f7fb;--surf:#ffffff;--card:#ffffff;--card2:#f6f9ff;--bdr:#d9e2f0;--bdr2:#c7d3e8;
--pri:#ff6b35;--pri-d:rgba(255,107,53,.12);--sec:#efb700;--sec-d:rgba(239,183,0,.15);
--ok:#00a873;--ok-d:rgba(0,168,115,.12);--err:#d73a49;--err-d:rgba(215,58,73,.12);
--blu:#2b7adf;--blu-d:rgba(43,122,223,.12);--tx:#0f172a;--txd:#52607a;--txm:#7a8ca8;
color-scheme:light;}
[data-theme="dark"]{--bg:#060a14;--surf:#0d1526;--card:#111d33;--card2:#162038;--bdr:#1c2d47;--bdr2:#253557;
--pri:#ff6b35;--pri-d:rgba(255,107,53,.14);--sec:#ffd60a;--sec-d:rgba(255,214,10,.14);
--ok:#00e5a0;--ok-d:rgba(0,229,160,.14);--err:#ff4757;--err-d:rgba(255,71,87,.14);
--blu:#4dabf7;--blu-d:rgba(77,171,247,.14);--tx:#e6edf7;--txd:#6e82a0;--txm:#37506e;
color-scheme:dark;}
*{box-sizing:border-box;margin:0;padding:0}
body,#root{background:var(--bg);color:var(--tx);font-family:'DM Sans',sans-serif;min-height:100vh}
::-webkit-scrollbar{width:5px;height:5px}
::-webkit-scrollbar-track{background:var(--surf)}
::-webkit-scrollbar-thumb{background:var(--bdr2);border-radius:3px}
.SY{font-family:'Syne',sans-serif}
.pg{max-width:860px;margin:0 auto;padding:28px 18px 90px}
@media(min-width:768px){.pg{padding-bottom:32px}}
/* Nav */
.nav{background:var(--surf);border-bottom:1px solid var(--bdr);padding:0 20px;height:60px;display:flex;align-items:center;position:sticky;top:0;z-index:100;gap:12px}
.nav-right{margin-left:auto;display:flex;align-items:center;gap:6px}
@media(max-width:640px){.desk-nav{display:none!important}}
/* Stats strip */
.sstrip{background:linear-gradient(135deg,var(--card),var(--surf));border-bottom:1px solid var(--bdr);padding:10px 20px;display:flex;align-items:center;gap:20px;overflow-x:auto;white-space:nowrap}
.sval{font-family:'Syne',sans-serif;font-weight:700;font-size:14px}.slbl{font-size:11px;color:var(--txd);margin-right:4px}
.lvlbar{background:var(--bdr);border-radius:99px;height:5px;width:72px;overflow:hidden;display:inline-block;vertical-align:middle;margin:0 4px}
.lvlfill{height:100%;background:linear-gradient(90deg,var(--pri),var(--sec));border-radius:99px;transition:width .6s}
/* Bottom nav */
.bnav{position:fixed;bottom:0;left:0;right:0;background:var(--surf);border-top:1px solid var(--bdr);display:none;padding:5px 0 7px;z-index:100}
@media(max-width:768px){.bnav{display:flex}}
.bnav-btn{flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;background:none;border:none;cursor:pointer;color:var(--txm);font-family:'DM Sans',sans-serif;font-size:9px;font-weight:500;padding:3px 1px;transition:color .15s}
.bnav-btn.on{color:var(--pri)}
/* Buttons */
.btn{border:none;cursor:pointer;font-family:'DM Sans',sans-serif;font-weight:600;border-radius:11px;transition:all .18s;display:inline-flex;align-items:center;justify-content:center;gap:7px}
.btn-p{background:linear-gradient(135deg,var(--pri),#ff9a5c);color:#fff;padding:12px 20px;font-size:14px;box-shadow:0 4px 18px rgba(255,107,53,.22)}
.btn-p:hover{transform:translateY(-2px);box-shadow:0 8px 26px rgba(255,107,53,.38)}.btn-p:active{transform:translateY(0)}
.btn-s{background:var(--bdr);color:var(--tx);padding:11px 18px;font-size:14px}.btn-s:hover{background:var(--bdr2)}
.btn-g{background:transparent;color:var(--txd);padding:9px 14px;font-size:14px}.btn-g:hover{color:var(--tx);background:var(--bdr)}
.btn-sm{padding:7px 13px;font-size:12px;border-radius:8px}.btn-w{width:100%}
.btn-danger{background:var(--err-d);color:var(--err);border:1px solid rgba(255,71,87,.25)}.btn-danger:hover{background:rgba(255,71,87,.22)}
.btn-ok{background:linear-gradient(135deg,var(--ok),#00c986);color:#002b1a;padding:12px 20px;font-size:14px;font-weight:700}
/* Focus ring */
a:focus-visible,button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible,[role="button"]:focus-visible,[role="tab"]:focus-visible,[role="radio"]:focus-visible{outline:3px solid var(--pri);outline-offset:2px;box-shadow:0 0 0 2px var(--surf),0 0 0 5px rgba(255,107,53,.35)}
/* Inputs */
.lbl{font-size:12px;font-weight:500;color:var(--txd);margin-bottom:5px;display:block}
.inp{width:100%;background:var(--surf);border:1.5px solid var(--bdr);border-radius:11px;padding:11px 14px;color:var(--tx);font-family:'DM Sans',sans-serif;font-size:14px;outline:none;transition:border-color .2s}
.inp:focus{border-color:var(--pri)}.inp.err-inp{border-color:var(--err)}.inp.ok-inp{border-color:var(--ok)}
.inp option{background:var(--card)}.err-msg{font-size:11px;color:var(--err);margin-top:4px}
/* Cards */
.card{background:var(--card);border:1px solid var(--bdr);border-radius:16px;padding:22px}
/* Auth */
.auth-wrap{min-height:100vh;background:radial-gradient(ellipse at 15% 50%,rgba(255,107,53,.07) 0%,transparent 55%),radial-gradient(ellipse at 85% 20%,rgba(77,171,247,.05) 0%,transparent 50%),var(--bg);display:flex;align-items:center;justify-content:center;padding:20px}
.auth-card{background:var(--card);border:1px solid var(--bdr);border-radius:22px;padding:40px 34px;width:100%;max-width:430px;box-shadow:0 40px 80px rgba(0,0,0,.5)}
.logo-icon{width:50px;height:50px;background:linear-gradient(135deg,var(--pri),#ff9a5c);border-radius:13px;display:flex;align-items:center;justify-content:center;font-size:22px;box-shadow:0 6px 20px rgba(255,107,53,.28)}
.logo-tx{font-family:'Syne',sans-serif;font-size:1.7rem;font-weight:800;background:linear-gradient(135deg,var(--pri),var(--sec));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.div-line{display:flex;align-items:center;gap:10px;color:var(--txm);font-size:12px;margin:14px 0}
.div-line::before,.div-line::after{content:'';flex:1;height:1px;background:var(--bdr)}
/* Tabs */
.tabs{display:flex;gap:3px;background:var(--surf);border-radius:11px;padding:3px;margin-bottom:22px}
.tab{flex:1;padding:9px 10px;background:transparent;border:none;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:500;color:var(--txd);border-radius:8px;transition:all .18s}
.tab.on{background:var(--card);color:var(--tx);box-shadow:0 2px 8px rgba(0,0,0,.28)}
/* Disc grid */
.dgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(168px,1fr));gap:14px}
@media(max-width:500px){.dgrid{grid-template-columns:repeat(2,1fr)}}
.dcard{background:var(--card);border:1px solid var(--bdr);border-radius:15px;padding:20px 14px;cursor:pointer;transition:all .22s;text-align:center}
.dcard:hover{transform:translateY(-4px);box-shadow:0 14px 30px rgba(0,0,0,.28)}
.dicon{width:52px;height:52px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:24px;margin:0 auto 10px}
/* Quiz */
.qhdr{background:var(--surf);border-bottom:1px solid var(--bdr);padding:12px 18px;display:flex;align-items:center;gap:12px}
.pbar{flex:1;background:var(--bdr);border-radius:99px;height:7px;overflow:hidden}
.pfill{height:100%;background:linear-gradient(90deg,var(--pri),var(--sec));border-radius:99px;transition:width .35s}
.timer-ring{position:relative;display:flex;align-items:center;justify-content:center}
.aopt{background:var(--surf);border:2px solid var(--bdr);border-radius:13px;padding:13px 16px;cursor:pointer;transition:all .18s;display:flex;align-items:center;gap:12px;margin-bottom:9px;text-align:left;width:100%}
.aopt:hover:not(:disabled){border-color:var(--pri);background:var(--pri-d)}.aopt.sel{border-color:var(--blu);background:var(--blu-d)}
.aopt.cor{border-color:var(--ok);background:var(--ok-d)}.aopt.err{border-color:var(--err);background:var(--err-d)}.aopt:disabled{cursor:default}
.oltr{width:30px;height:30px;border-radius:7px;background:var(--bdr);display:flex;align-items:center;justify-content:center;font-family:'Syne',sans-serif;font-size:12px;font-weight:700;flex-shrink:0;transition:all .18s}
.aopt.cor .oltr{background:var(--ok);color:#002b1a}.aopt.err .oltr{background:var(--err);color:#fff}.aopt.sel .oltr{background:var(--blu);color:#fff}
.fbanner{border-radius:13px;padding:14px 16px;margin-top:14px;display:flex;align-items:flex-start;gap:10px;animation:slideIn .28s ease}
.fbanner.ok{background:var(--ok-d);border:1px solid rgba(0,229,160,.3)}.fbanner.er{background:var(--err-d);border:1px solid rgba(255,71,87,.3)}
@keyframes slideIn{from{opacity:0;transform:translateY(-7px)}to{opacity:1;transform:translateY(0)}}
.quiz-primary-actions-inline{display:flex;gap:8px;align-items:center}
.quiz-actions-mobile{display:none}
@media(max-width:768px){
.quiz-content{padding-bottom:170px!important}
.quiz-primary-actions-inline{display:none!important}
.quiz-actions-mobile{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(env(safe-area-inset-bottom,0px) + 10px);z-index:120;display:flex;align-items:center;justify-content:center;width:min(760px,calc(100% - 24px));background:var(--surf);border:1px solid var(--bdr);border-radius:14px;padding:10px;box-shadow:0 12px 28px rgba(0,0,0,.22)}
}
/* Results */
.rhdr{background:linear-gradient(135deg,var(--card),var(--surf));border-radius:18px;padding:26px;text-align:center;margin-bottom:20px;border:1px solid var(--bdr)}
.sgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:20px}
@media(max-width:450px){.sgrid{grid-template-columns:repeat(2,1fr)}}
.scard{background:var(--card);border:1px solid var(--bdr);border-radius:13px;padding:13px;text-align:center}
.rv-item{background:var(--surf);border:1px solid var(--bdr);border-radius:13px;padding:16px;margin-bottom:10px}
.rv-item.wr{border-color:rgba(255,71,87,.3)}.rv-item.rg{border-color:rgba(0,229,160,.3)}
/* Leaderboard */
.lbrow{background:var(--card);border:1px solid var(--bdr);border-radius:13px;padding:13px 16px;display:flex;align-items:center;gap:14px;margin-bottom:7px}
.lbrow.me{border-color:var(--pri);background:var(--pri-d)}
.lbrnk{font-family:'Syne',sans-serif;font-size:17px;font-weight:800;width:28px;text-align:center;flex-shrink:0}
.rnk1{color:#ffd700}.rnk2{color:#c0c0c0}.rnk3{color:#cd7f32}
/* Badges */
.badge-pill{display:inline-flex;align-items:center;gap:3px;padding:3px 9px;border-radius:99px;font-size:11px;font-weight:600}
.bp{background:var(--pri-d);color:var(--pri)}.bs{background:var(--ok-d);color:var(--ok)}.by{background:var(--sec-d);color:var(--sec)}.bb{background:var(--blu-d);color:var(--blu)}.bm{background:var(--bdr);color:var(--txd)}
.badge-card{background:var(--card);border:1px solid var(--bdr);border-radius:14px;padding:16px;text-align:center;transition:all .2s}
.badge-card.earned{border-color:var(--sec);background:var(--sec-d)}
.badge-card.locked{opacity:.45;filter:grayscale(.7)}
/* Streak */
.streak-day{width:26px;height:26px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:600}
.streak-day.done{background:var(--ok-d);color:var(--ok);border:1px solid rgba(0,229,160,.3)}
.streak-day.today{background:var(--sec-d);border:1px solid var(--sec);color:var(--sec)}
.streak-day.miss{background:var(--bdr);color:var(--txm)}
/* Avatar */
.av{border-radius:11px;display:flex;align-items:center;justify-content:center;font-family:'Syne',sans-serif;font-weight:700;flex-shrink:0}
/* Modal */
.mover{position:fixed;inset:0;background:rgba(0,0,0,.72);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:1000;padding:18px}
.modal{background:var(--card);border:1px solid var(--bdr2);border-radius:22px;padding:26px;width:100%;max-width:480px;max-height:90vh;overflow-y:auto;box-shadow:0 40px 80px rgba(0,0,0,.6);animation:mIn .25s ease}
@keyframes mIn{from{opacity:0;transform:scale(.96) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}}
/* Toast */
.tbox{position:fixed;bottom:88px;right:16px;z-index:2000;display:flex;flex-direction:column;gap:7px}
@media(min-width:768px){.tbox{bottom:18px}}
.toast{background:var(--card2);border:1px solid var(--bdr2);border-radius:11px;padding:11px 15px;font-size:13px;max-width:290px;box-shadow:0 8px 22px rgba(0,0,0,.4);animation:tIn .25s ease}
@keyframes tIn{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:translateX(0)}}
.toast.s{border-color:rgba(0,229,160,.35)}.toast.e{border-color:rgba(255,71,87,.35)}.toast.b{border-color:var(--sec)}
/* Utils */
.fade{animation:fade .35s ease}
@keyframes fade{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
.row{display:flex;align-items:center}.ptx{font-size:12px;color:var(--txd)}
.upload-z{border:2px dashed var(--bdr2);border-radius:15px;padding:36px 20px;text-align:center;cursor:pointer;transition:all .2s}
.upload-z:hover{border-color:var(--pri);background:var(--pri-d)}
.prof-hdr{background:linear-gradient(135deg,rgba(255,107,53,.1),rgba(77,171,247,.05));border:1px solid var(--bdr);border-radius:18px;padding:22px;margin-bottom:18px;display:flex;align-items:center;gap:18px}
/* Disc management */
.disc-row{background:var(--card);border:1px solid var(--bdr);border-radius:14px;padding:13px 16px;display:flex;align-items:center;gap:13px;margin-bottom:9px;transition:all .18s}
.disc-row:hover{border-color:var(--bdr2);background:var(--card2)}
.emoji-grid{display:grid;grid-template-columns:repeat(8,1fr);gap:4px;margin-top:8px;max-height:190px;overflow-y:auto}
.emoji-btn{width:36px;height:36px;border-radius:8px;border:2px solid transparent;background:var(--surf);cursor:pointer;font-size:18px;display:flex;align-items:center;justify-content:center;transition:all .14s}
.emoji-btn:hover,.emoji-btn.sel{border-color:var(--pri);background:var(--pri-d)}
.color-grid{display:flex;flex-wrap:wrap;gap:7px;margin-top:8px}
.cswatch{width:28px;height:28px;border-radius:7px;border:3px solid transparent;cursor:pointer;transition:all .14s}
.cswatch.sel{border-color:#fff;transform:scale(1.18);box-shadow:0 2px 8px rgba(0,0,0,.4)}
/* Password strength */
.pwd-bar{height:4px;border-radius:99px;flex:1;transition:background .3s}
/* Onboarding */
.onboard-overlay{position:fixed;inset:0;background:rgba(0,0,0,.82);backdrop-filter:blur(6px);z-index:2000;display:flex;align-items:center;justify-content:center;padding:18px}
.onboard-card{background:var(--card);border:1px solid var(--bdr2);border-radius:22px;padding:36px;max-width:420px;width:100%;text-align:center;box-shadow:0 40px 80px rgba(0,0,0,.6);animation:mIn .3s ease}
.onboard-dots{display:flex;gap:7px;justify-content:center;margin:20px 0 0}
.odot{width:8px;height:8px;border-radius:99px;background:var(--bdr2);transition:all .25s}
.odot.on{background:var(--pri);width:20px}
/* Timer arc */
.timer-arc{transform:rotate(-90deg);transition:stroke-dashoffset .9s linear}
/* Mode chips */
.mode-chip{border-radius:99px;padding:8px 16px;font-size:13px;font-weight:600;cursor:pointer;border:2px solid var(--bdr);background:transparent;color:var(--txd);transition:all .18s;font-family:'DM Sans',sans-serif}
.mode-chip.on{border-color:var(--pri);background:var(--pri-d);color:var(--pri)}
/* Pagination */
.page-btn{width:34px;height:34px;border-radius:8px;border:1px solid var(--bdr);background:var(--surf);color:var(--txd);cursor:pointer;font-size:13px;font-weight:600;transition:all .15s;display:flex;align-items:center;justify-content:center}
.page-btn:hover{border-color:var(--bdr2);color:var(--tx)}.page-btn.on{border-color:var(--pri);background:var(--pri-d);color:var(--pri)}
/* SR indicator */
.sr-due{width:8px;height:8px;border-radius:50%;background:var(--ok);display:inline-block;margin-right:4px}
.sr-overdue{background:var(--err)}
`;
