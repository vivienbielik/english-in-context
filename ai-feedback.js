/* English in Context — AI writing feedback
   Adds an "Evaluate my writing" button under every writing task on the page.
   Include with: <script src="ai-feedback.js" data-level="B2"></script>
   The page's instructions are sent along with the text so the feedback matches the task. */
(function () {
  var script = document.currentScript;
  var LEVEL = (script && script.getAttribute('data-level')) || 'B1–B2';
  var TARGETS = '#pwText, #workspace, #ex14area, #writeup8, #writeup9, #writeup10, #reflectArea, #ex4area, ' +
                '#chartWriteArea, #pv4area, textarea.reflect, #wr-text, textarea.t-text, textarea[data-ai]';
  var CONTAINERS = '[data-ai-context], .tws, #projectWorkspace, .ex-block, section, .panel';

  var css =
    '.eicai-bar{margin:12px 0 4px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;}' +
    '.eicai-btn{border:1px solid #2f5d50;background:#2f5d50;color:#fff;padding:9px 16px;border-radius:8px;font:600 14px/1.2 "Segoe UI",Arial,sans-serif;cursor:pointer;}' +
    '.eicai-btn:hover{background:#244a40;} .eicai-btn:disabled{opacity:.65;cursor:wait;}' +
    '.eicai-hint{font:12.5px/1.4 "Segoe UI",Arial,sans-serif;color:#6b6558;}' +
    '.eicai-out{margin:10px 0 18px;font-family:"Segoe UI",Arial,sans-serif;color:#26241f;text-align:left;}' +
    '.eicai-card{background:#fff;border:1px solid #e7dfcd;border-radius:10px;padding:18px 20px;}' +
    '.eicai-eyebrow{font-size:12px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:#b4532a;margin-bottom:4px;}' +
    '.eicai-total{font-family:Georgia,serif;font-size:34px;font-weight:700;color:#2f5d50;margin-right:10px;}' +
    '.eicai-muted{color:#6b6558;font-size:14px;}' +
    '.eicai-scores{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:12px 0 14px;}' +
    '@media (max-width:560px){.eicai-scores{grid-template-columns:repeat(2,1fr);}}' +
    '.eicai-scores div{background:#e7eeec;border-radius:8px;padding:8px;font-size:12.5px;text-align:center;}' +
    '.eicai-scores b{display:block;font-family:Georgia,serif;font-size:21px;color:#2f5d50;}' +
    '.eicai-sec{border-top:1px solid #e7dfcd;padding-top:10px;margin-top:10px;font-size:14.5px;line-height:1.55;}' +
    '.eicai-sec h5{margin:0 0 4px;font-size:15px;} .eicai-sec h5 span{color:#2f5d50;}' +
    '.eicai-sec p{margin:0 0 6px;} .eicai-sec ul{margin:0;padding-left:20px;}' +
    '.eicai-tw{overflow-x:auto;} .eicai-corr{width:100%;border-collapse:collapse;font-size:14px;}' +
    '.eicai-corr td,.eicai-corr th{border-bottom:1px solid #e7dfcd;padding:6px 8px;text-align:left;vertical-align:top;}' +
    '.eicai-o{color:#b3312c;text-decoration:line-through;} .eicai-c{color:#2f5d50;font-weight:600;}' +
    '.eicai-up{background:#fbf1dc;border-radius:8px;padding:8px 12px;margin-bottom:8px;}' +
    '.eicai-note{font-size:12.5px;color:#6b6558;margin-top:12px;}' +
    '.eicai-err{background:#fbeceb;color:#b3312c;border-radius:8px;padding:11px 14px;font-size:14.5px;}' +
    '.eicai-spin{display:inline-block;width:13px;height:13px;border:2px solid #fff;border-top-color:transparent;border-radius:50%;animation:eicaisp .8s linear infinite;vertical-align:-2px;margin-right:6px;}' +
    '@keyframes eicaisp{to{transform:rotate(360deg);}}' +
    '@media print{.eicai-bar{display:none!important;}}';

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function countWords(t) { return (t.match(/[A-Za-zÀ-ž0-9]+(?:['’-][A-Za-zÀ-ž0-9]+)*/g) || []).length; }

  // The task instructions: heading of the surrounding block + the text that comes before the textarea.
  function taskContext(ta) {
    var box = ta.closest(CONTAINERS) || document.body;
    var head = box.querySelector('h1, h2, h3');
    var r = document.createRange();
    r.setStart(box, 0);
    r.setEndBefore(ta);
    var before = r.toString().replace(/\s+/g, ' ').trim();
    if (before.length > 2200) before = '…' + before.slice(-2200);
    var h = head ? head.textContent.replace(/\s+/g, ' ').trim() : '';
    if (h && before.indexOf(h) === -1) before = h + ' — ' + before;
    var ph = ta.getAttribute('placeholder');
    return before + (ph ? '\n(Text box hint: ' + ph + ')' : '');
  }

  function render(out, d) {
    var C = [['content', 'I. Task & content'], ['organisation', 'II. Organisation'], ['grammar', 'III. Grammar'], ['vocabulary', 'IV. Vocabulary']];
    var sc = d.scores || {};
    function num(k) { return Math.max(0, Math.min(5, Number(sc[k]) || 0)); }
    var total = C.reduce(function (a, c) { return a + num(c[0]); }, 0);
    var x = '<div class="eicai-card"><div class="eicai-eyebrow">AI feedback · level ' + esc(LEVEL) + '</div>';
    x += '<div><span class="eicai-total">' + total + ' / 20</span><span class="eicai-muted">' + (d.words || '') + ' words</span></div>';
    x += '<p style="margin:6px 0 0">' + esc(d.summary) + '</p>';
    x += '<div class="eicai-scores">' + C.map(function (c) { return '<div><b>' + num(c[0]) + '/5</b>' + c[1] + '</div>'; }).join('') + '</div>';
    var cr = d.criteria || {};
    C.forEach(function (c) {
      var k = cr[c[0]] || {};
      x += '<div class="eicai-sec"><h5>' + c[1] + ' <span>' + num(c[0]) + '/5</span></h5><p>' + esc(k.comment) + '</p>';
      if ((k.tips || []).length) x += '<ul>' + k.tips.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>';
      x += '</div>';
    });
    if ((d.corrections || []).length) {
      x += '<div class="eicai-sec"><h5>Mistakes and corrections</h5><div class="eicai-tw"><table class="eicai-corr"><tr><th>You wrote</th><th>Better</th><th>Why</th></tr>' +
        d.corrections.map(function (c) {
          return '<tr><td class="eicai-o">' + esc(c.original) + '</td><td class="eicai-c">' + esc(c.correction) + '</td><td>' + esc(c.explanation) + '</td></tr>';
        }).join('') + '</table></div></div>';
    }
    if ((d.upgrades || []).length) {
      x += '<div class="eicai-sec"><h5>Make it even better</h5>' + d.upgrades.map(function (u) {
        return '<div class="eicai-up"><span class="eicai-muted">' + esc(u.original) + '</span><br>→ <b>' + esc(u.improved) + '</b></div>';
      }).join('') + '</div>';
    }
    x += '<div class="eicai-note">This is AI feedback for practice. It can make mistakes — your teacher gives the real mark.</div></div>';
    out.innerHTML = x;
  }

  function attach(ta) {
    if (ta.dataset.eicai) return;
    ta.dataset.eicai = '1';
    var bar = document.createElement('div');
    bar.className = 'eicai-bar';
    bar.innerHTML = '<button type="button" class="eicai-btn">✦ Evaluate my writing</button>' +
      '<span class="eicai-hint">AI feedback on content, organisation, grammar and vocabulary. Do not write your name.</span>';
    var out = document.createElement('div');
    out.className = 'eicai-out';
    out.setAttribute('aria-live', 'polite');
    // place it after the word-count / toolbar row that follows the text box, if there is one
    var anchor = ta;
    var next = ta.nextElementSibling;
    if (next && /meta|toolbar|word-count|stat-row/.test(next.className || '')) anchor = next;
    anchor.parentNode.insertBefore(bar, anchor.nextSibling);
    bar.parentNode.insertBefore(out, bar.nextSibling);

    var btn = bar.querySelector('button');
    var shownFor = null;
    // a reused workspace (project pages) shows a different task: hide old feedback
    ta.addEventListener('focus', function () {
      if (shownFor !== null && shownFor !== taskContext(ta)) { out.innerHTML = ''; shownFor = null; }
    });
    btn.addEventListener('click', function () {
      var text = ta.value.trim();
      if (countWords(text) < 15) {
        out.innerHTML = '<div class="eicai-err">Please write at least 15 words before asking for feedback.</div>';
        return;
      }
      var ctx = taskContext(ta);
      btn.disabled = true;
      btn.innerHTML = '<span class="eicai-spin"></span>Evaluating… (10–30 s)';
      out.innerHTML = '';
      fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ mode: 'general', essay: text, task: { title: document.title, level: LEVEL, context: ctx } })
      }).then(function (r) {
        return r.json().catch(function () { return { error: 'The evaluator did not respond. Please try again.' }; })
          .then(function (d) { if (!r.ok || d.error) throw new Error(d.error || 'Something went wrong.'); return d; });
      }).then(function (d) {
        render(out, d); shownFor = ctx;
        out.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }).catch(function (e) {
        out.innerHTML = '<div class="eicai-err">' + esc(e.message) + '</div>';
      }).then(function () {
        btn.disabled = false; btn.innerHTML = '✦ Evaluate my writing';
      });
    });
  }

  function scan(root) {
    (root.querySelectorAll ? root : document).querySelectorAll(TARGETS).forEach(attach);
  }
  function init() {
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    scan(document);
    new MutationObserver(function (ms) {
      ms.forEach(function (m) { m.addedNodes.forEach(function (n) { if (n.nodeType === 1) { if (n.matches && n.matches(TARGETS)) attach(n); scan(n); } }); });
    }).observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
