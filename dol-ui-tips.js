






















(function () {
  "use strict";


  var doc = document;
  function root() { return doc.documentElement; }


  function markCombat() {
    var list = doc.getElementById("listContainer");
    if (!list) { root().removeAttribute("data-dol-combat"); return; }
    root().setAttribute("data-dol-combat", "1");
  }




  var openTip = null;
  function closeTip() {
    if (openTip) { openTip.classList.remove("dol-tip-on"); openTip = null; }
  }
  function onTap(ev) {
    var t = ev.target;
    while (t && t !== doc) {
      if (t.nodeName.toLowerCase() === "mouse" && t.classList.contains("tooltip")) {
        if (openTip === t) { closeTip(); } else { closeTip(); t.classList.add("dol-tip-on"); openTip = t; }
        return;
      }
      t = t.parentNode;
    }
    closeTip();
  }





  var queued = false;
  function schedule() {
    if (queued) return;
    queued = true;
    (window.requestAnimationFrame || function (f) { setTimeout(f, 32); })(function () {
      queued = false;
      try { markCombat(); } catch (e) {  }
    });
  }

  function boot() {
    var story = doc.getElementById("story") || doc.body;
    if (!story) { setTimeout(boot, 200); return; }
    new MutationObserver(schedule).observe(story, { childList: true, subtree: true });

    doc.addEventListener("pointerup", onTap, true);



    root().setAttribute("data-dol-tips", "1");
    window.dolUI = { layer: "tips" };
    schedule();
  }

  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
