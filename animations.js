/* =========================================================
   animations.js — Linoleum.app uchun anime.js animatsiya qatlami
   Bu fayl script.js dagi funksionallikka HECH QANDAY tegmaydi.
   Faqat DOM'dagi o'zgarishlarni tashqaridan kuzatib,
   ustiga vizual harakatlar (kirish animatsiyasi, hisoblagich,
   ripple effekti) qo'shadi.
   ========================================================= */

(function(){
  if (typeof anime === 'undefined') { return; }

  var isAnimatingStats = false;

  /* ---------- 1) Ro'yxatlarga kirish animatsiyasi (stagger) ---------- */
  var listSelectors = [
    '#kassaProductList',
    '#omborTableBody',
    '#receiptItems',
    '#expenseList',
    '#salesHistoryList',
    '#topProducts',
    '#kassaScanResults',
    '#scanResults'
  ];

  function animateChildren(container){
    if (!container) return;
    var children = container.children;
    if (!children || children.length === 0) return;
    anime.set(children, { opacity: 0, translateY: 10 });
    anime({
      targets: Array.prototype.slice.call(children),
      opacity: [0, 1],
      translateY: [10, 0],
      easing: 'easeOutQuad',
      duration: 380,
      delay: anime.stagger(28, {start: 20})
    });
  }

  var listObservers = [];
  function attachListObservers(){
    listSelectors.forEach(function(sel){
      var el = document.querySelector(sel);
      if (!el || el.__animObserved) return;
      el.__animObserved = true;
      var obs = new MutationObserver(function(){
        if (isAnimatingStats) return;
        animateChildren(el);
      });
      obs.observe(el, { childList: true });
      listObservers.push(obs);
    });
  }

  /* ---------- 2) Statistika kartalari — raqam hisoblagich ---------- */
  var statIds = ['statToday','statMonth','statStockValue','statExpenseToday','statExpenseMonth','statProfitToday'];
  var lastStatValues = {};

  function parseFormattedNumber(str){
    if (!str) return 0;
    var cleaned = String(str).replace(/[^\d\-]/g, '');
    var n = parseInt(cleaned, 10);
    return isNaN(n) ? 0 : n;
  }

  function formatUZ(n){
    return new Intl.NumberFormat('uz-UZ').format(Math.round(n));
  }

  function animateStatCounters(){
    isAnimatingStats = true;
    statIds.forEach(function(id){
      var el = document.getElementById(id);
      if (!el) return;
      var target = parseFormattedNumber(el.textContent);
      var from = lastStatValues.hasOwnProperty(id) ? lastStatValues[id] : 0;
      if (from === target) { lastStatValues[id] = target; return; }
      var obj = { val: from };
      anime({
        targets: obj,
        val: target,
        round: 1,
        easing: 'easeOutCubic',
        duration: 700,
        update: function(){
          el.textContent = formatUZ(obj.val);
        },
        complete: function(){
          el.textContent = formatUZ(target);
          lastStatValues[id] = target;
        }
      });
    });
  }

  var hisobotObserver = null;
  function attachHisobotObserver(){
    var view = document.getElementById('view-hisobot');
    if (!view || view.__animObserved) return;
    view.__animObserved = true;
    var target = document.getElementById('statToday');
    if (!target) return;
    hisobotObserver = new MutationObserver(function(){
      if (view.classList.contains('active')){
        animateStatCounters();
      }
    });
    hisobotObserver.observe(target.parentElement.parentElement, { childList: true, subtree: true, characterData: true });
  }

  /* ---------- 3) Tab almashtirishda mayin o'tish ---------- */
  document.querySelectorAll('.tab-btn').forEach(function(btn){
    btn.addEventListener('click', function(){
      var viewId = 'view-' + btn.dataset.view;
      var view = document.getElementById(viewId);
      if (!view) return;
      requestAnimationFrame(function(){
        anime.set(view, { opacity: 0, translateY: 8 });
        anime({
          targets: view,
          opacity: [0, 1],
          translateY: [8, 0],
          easing: 'easeOutQuad',
          duration: 320
        });
        if (viewId === 'view-hisobot'){
          setTimeout(animateStatCounters, 60);
        }
      });
    });
  });

  /* ---------- 4) Tugmalarga bosilganda mayin "ripple" effekti ---------- */
  function addRipple(e){
    var btn = e.currentTarget;
    var rect = btn.getBoundingClientRect();
    var ripple = document.createElement('span');
    var size = Math.max(rect.width, rect.height) * 1.4;
    ripple.style.position = 'absolute';
    ripple.style.borderRadius = '50%';
    ripple.style.background = 'rgba(255,255,255,0.35)';
    ripple.style.pointerEvents = 'none';
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = ((e.clientX || rect.left + rect.width/2) - rect.left - size/2) + 'px';
    ripple.style.top = ((e.clientY || rect.top + rect.height/2) - rect.top - size/2) + 'px';
    var prevPosition = getComputedStyle(btn).position;
    if (prevPosition === 'static') btn.style.position = 'relative';
    btn.style.overflow = 'hidden';
    btn.appendChild(ripple);
    anime({
      targets: ripple,
      scale: [0, 1],
      opacity: [0.5, 0],
      easing: 'easeOutQuad',
      duration: 500,
      complete: function(){ ripple.remove(); }
    });
  }

  function attachRipples(){
    document.querySelectorAll('button.primary, button.secondary, .scan-upload-btn, .white-scan-btn').forEach(function(btn){
      if (btn.__rippleAttached) return;
      btn.__rippleAttached = true;
      btn.addEventListener('click', addRipple);
    });
  }

  /* ---------- 5) Ombor jadvali qatorlari doim yangilanadi — observerlarni qayta biriktirish ---------- */
  var refreshTimer = setInterval(function(){
    attachListObservers();
    attachHisobotObserver();
    attachRipples();
  }, 800);

  /* ---------- Boshlang'ich ishga tushirish ---------- */
  document.addEventListener('DOMContentLoaded', function(){
    attachListObservers();
    attachHisobotObserver();
    attachRipples();

    // Header va panellarning boshlang'ich kirish animatsiyasi
    anime({
      targets: '.panel, .receipt',
      opacity: [0, 1],
      translateY: [14, 0],
      easing: 'easeOutQuad',
      duration: 500,
      delay: anime.stagger(60, {start: 150})
    });
  });
})();
