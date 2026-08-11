import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await (await b.newContext({viewport:{width:1440,height:1700}})).newPage();
await p.addInitScript(() => { localStorage.setItem('color-taylor-theme','dark'); localStorage.setItem('color-taylor-muted','1'); });
await p.goto('http://localhost:5180/', { waitUntil:'networkidle' });
await p.waitForTimeout(1400);
const r = await p.evaluate(() => {
  const sl = document.getElementById('picker-layout');
  const slb = sl.getBoundingClientRect();
  const inner = document.getElementById('sliders-group-content').firstElementChild;
  const secs = [...inner.children];
  const sb = document.querySelector('#sb-wrapper > div:nth-child(2)');
  return {
    panel: Math.round(slb.height),
    panelPad: getComputedStyle(sl).padding,
    slidersGroupH: Math.round(document.getElementById('sliders-group').getBoundingClientRect().height),
    regionPadTop: getComputedStyle(document.getElementById('sliders-group-content')).paddingTop,
    innerH: Math.round(inner.getBoundingClientRect().height),
    innerGap: getComputedStyle(inner).rowGap,
    sections: secs.map(s => ({ id: s.id, h: Math.round(s.getBoundingClientRect().height) })),
    sumSections: secs.reduce((a,s)=>a+s.getBoundingClientRect().height,0),
    sb: sb ? Math.round(sb.getBoundingClientRect().height) : null,
    lastBottomToPanelBottom: Math.round(slb.bottom - secs[secs.length-1].getBoundingClientRect().bottom),
    innerBottomToPanelBottom: Math.round(slb.bottom - inner.getBoundingClientRect().bottom),
  };
});
console.log(JSON.stringify(r, null, 2));
