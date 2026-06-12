// Words Page Script for 划词翻译

document.addEventListener('DOMContentLoaded', async () => {
  const totalCount = document.getElementById('totalCount');
  const searchInput = document.getElementById('searchInput');
  const wordList = document.getElementById('wordList');
  const emptyState = document.getElementById('emptyState');
  const selectAll = document.getElementById('selectAll');
  const selectCount = document.getElementById('selectCount');
  const downloadBtn = document.getElementById('downloadBtn');
  const downloadHint = document.getElementById('downloadHint');
  const clearAll = document.getElementById('clearAll');

  let allWords = [];
  let selectedWords = new Set();

  // --- Load Words ---
  async function loadWords() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'getWords' }, (res) => {
        if (res && res.success) {
          allWords = res.data || [];
        } else {
          allWords = [];
        }
        const validKeys = new Set(allWords.map(w => w.word.toLowerCase()));
        for (const key of selectedWords) {
          if (!validKeys.has(key)) selectedWords.delete(key);
        }
        totalCount.textContent = allWords.length + ' 条';
        const query = searchInput.value.toLowerCase().trim();
        renderWordList(query ? allWords.filter(w =>
          w.word.toLowerCase().indexOf(query) !== -1 ||
          w.translation.toLowerCase().indexOf(query) !== -1
        ) : allWords);
        updateSelectUI();
        resolve();
      });
    });
  }

  // --- Render Word List ---
  function renderWordList(words) {
    const existing = wordList.querySelectorAll('.word-row');
    existing.forEach(el => el.remove());

    if (words.length === 0) {
      emptyState.style.display = 'flex';
      return;
    }

    emptyState.style.display = 'none';

    const sorted = [...words].sort((a, b) => b.addedAt - a.addedAt);

    for (const entry of sorted) {
      const key = entry.word.toLowerCase();
      const isChecked = selectedWords.has(key);
      const dateStr = new Date(entry.addedAt).toLocaleDateString('zh-CN');

      let phoneticHtml = '';
      if (entry.phonetic) {
        phoneticHtml = `<span class="row-phonetic">${escapeHtml(entry.phonetic)}</span>`;
      }

      let wordHtml = `<span class="row-word">${escapeHtml(entry.word)}</span>`;
      let sourceHtml = '';
      if (entry.sourceUrl) {
        const domain = extractDomain(entry.sourceUrl);
        wordHtml = `<span class="row-word"><a title="打开来源网页" data-url="${escapeAttr(entry.sourceUrl)}">${escapeHtml(entry.word)}</a></span>`;
        sourceHtml = `<span class="row-source" title="${escapeHtml(entry.sourceUrl)}">${escapeHtml(domain)}</span>`;
      }

      let noteHtml = '';
      if (entry.note) {
        noteHtml = `<span class="row-note">${escapeHtml(entry.note)}</span>`;
      }

      const row = document.createElement('div');
      row.className = 'word-row';
      row.innerHTML = `
        <label class="row-checkbox">
          <input type="checkbox" data-word="${escapeHtml(key)}" ${isChecked ? 'checked' : ''}>
          <span class="checkbox-custom"></span>
        </label>
        <div class="row-info">
          <div class="row-main">
            ${wordHtml}
            ${phoneticHtml}
          </div>
          <span class="row-translation">${escapeHtml(entry.translation)}</span>
          <div class="row-meta">
            ${sourceHtml}
            ${noteHtml}
            <span class="row-date">${dateStr}</span>
          </div>
        </div>
        <button class="row-delete" data-word="${escapeHtml(key)}" title="删除">×</button>
      `;
      wordList.appendChild(row);
    }

    // Checkbox handlers
    wordList.querySelectorAll('.row-checkbox input').forEach(cb => {
      cb.addEventListener('change', () => {
        const k = cb.dataset.word;
        if (cb.checked) selectedWords.add(k);
        else selectedWords.delete(k);
        updateSelectUI();
      });
    });

    // Delete handlers
    wordList.querySelectorAll('.row-delete').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const k = btn.dataset.word;
        selectedWords.delete(k);
        const w = allWords.find(w => w.word.toLowerCase() === k);
        if (w) {
          await sendMessage({ type: 'removeWord', word: w.word });
          await loadWords();
        }
      });
    });

    // Link click handlers
    wordList.querySelectorAll('.row-word a').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const url = link.dataset.url;
        if (url) chrome.tabs.create({ url });
      });
    });
  }

  // --- Select All ---
  selectAll.addEventListener('change', () => {
    const cbs = wordList.querySelectorAll('.row-checkbox input');
    if (selectAll.checked) {
      cbs.forEach(cb => { cb.checked = true; selectedWords.add(cb.dataset.word); });
    } else {
      cbs.forEach(cb => { cb.checked = false; selectedWords.delete(cb.dataset.word); });
    }
    updateSelectUI();
  });

  function updateSelectUI() {
    const cbs = wordList.querySelectorAll('.row-checkbox input');
    const visible = cbs.length;
    const checked = [...cbs].filter(cb => cb.checked).length;
    selectCount.textContent = '已选 ' + selectedWords.size + ' 项';
    selectAll.checked = visible > 0 && checked === visible;
    selectAll.indeterminate = checked > 0 && checked < visible;
  }

  // --- Search ---
  searchInput.addEventListener('input', async () => {
    const query = searchInput.value.toLowerCase().trim();
    const filtered = query ? allWords.filter(w =>
      w.word.toLowerCase().indexOf(query) !== -1 ||
      w.translation.toLowerCase().indexOf(query) !== -1
    ) : allWords;
    renderWordList(filtered);
    updateSelectUI();
  });

  // --- Download ---
  downloadBtn.addEventListener('click', async () => {
    let wordsToDownload;
    if (selectedWords.size > 0) {
      wordsToDownload = allWords.filter(w => selectedWords.has(w.word.toLowerCase()));
    } else {
      wordsToDownload = allWords;
    }
    if (wordsToDownload.length === 0) {
      showHint('暂无收藏词汇', 'error');
      return;
    }

    downloadBtn.disabled = true;
    try {
      const html = buildWordHtml(wordsToDownload);
      const blob = new Blob(['\uFEFF' + html], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const date = new Date().toLocaleDateString('zh-CN').replace(/\//g, '-');
      a.download = '生词收藏_' + date + '.html';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showHint('已导出 ' + wordsToDownload.length + ' 条词汇', 'success');
    } catch (err) {
      showHint('导出失败，请重试', 'error');
    } finally {
      downloadBtn.disabled = false;
    }
  });

  function buildWordHtml(words) {
    const dateStr = new Date().toLocaleDateString('zh-CN');
    const rows = words.map((w, i) => {
      const dt = new Date(w.addedAt).toLocaleDateString('zh-CN');
      let phCell = w.phonetic
        ? '<td style="padding:8px 12px;border-bottom:1px solid #eee;color:#888;font-size:12px;font-style:italic;">' + h(w.phonetic) + '</td>'
        : '';
      return '<tr>' +
        '<td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;color:#999;width:40px;">' + (i + 1) + '</td>' +
        '<td style="padding:8px 12px;border-bottom:1px solid #eee;font-weight:600;color:#333;">' + h(w.word) + '</td>' +
        phCell +
        '<td style="padding:8px 12px;border-bottom:1px solid #eee;color:#555;">' + h(w.translation) + '</td>' +
        (w.note ? '<td style="padding:8px 12px;border-bottom:1px solid #eee;color:#7C3AED;font-size:12px;">' + h(w.note) + '</td>' : '<td></td>') +
        '<td style="padding:8px 12px;border-bottom:1px solid #eee;color:#999;font-size:12px;white-space:nowrap;">' + dt + '</td>' +
      '</tr>';
    }).join('');

    const hasNotes = words.some(w => w.note);

    return '<!DOCTYPE html>\n<html lang="zh-CN">\n<head>\n<meta charset="UTF-8">\n<title>生词收藏</title>\n<style>\n' +
      'body{font-family:"Microsoft YaHei","PingFang SC","Helvetica Neue",Arial,sans-serif;max-width:900px;margin:40px auto;padding:0 20px;color:#333;}\n' +
      'h1{text-align:center;color:#7C3AED;font-size:24px;margin-bottom:4px;}\n' +
      '.meta{text-align:center;color:#999;font-size:13px;margin-bottom:24px;}\n' +
      'table{width:100%;border-collapse:collapse;border-top:2px solid #7C3AED;border-bottom:2px solid #7C3AED;}\n' +
      'th{padding:10px 12px;background:#f8f4ff;color:#7C3AED;font-size:14px;text-align:left;border-bottom:1px solid #ddd;}\n' +
      'td{font-size:14px;}\n' +
      'tr:nth-child(even) td{background:#fafafa;}\n' +
      '.footer{text-align:center;color:#ccc;font-size:12px;margin-top:24px;}\n' +
      '</style>\n</head>\n<body>\n' +
      '<h1>\u{1F4D6} \u751f\u8bcd\u6536\u85cf</h1>\n' +
      '<p class="meta">\u5bfc\u51fa\u65f6\u95f4\uff1a' + dateStr + '\u3000\uff5c\u3000\u5171 ' + words.length + ' \u4e2a\u8bcd\u6c47</p>\n' +
      '<table>\n<thead>\n<tr>\n<th style="width:40px;text-align:center;">#</th>\n<th>\u82f1\u6587/\u539f\u6587</th>\n<th>\u97f3\u6807</th>\n<th>\u7ffb\u8bd1</th>\n' +
      (hasNotes ? '<th>\u6ce8\u91ca</th>\n' : '<th></th>\n') +
      '<th style="width:90px;">\u6536\u85cf\u65e5\u671f</th>\n</tr>\n</thead>\n<tbody>\n' + rows + '\n</tbody>\n</table>\n' +
      '<p class="footer">\u7531\u300c\u62fe\u8bcd\u300dChrome \u63d2\u4ef6\u5bfc\u51fa \u00b7 ' + dateStr + '</p>\n</body>\n</html>';
  }

  // --- Clear All ---
  clearAll.addEventListener('click', async () => {
    if (!confirm('确定要清空全部收藏吗？此操作不可撤销。')) return;
    for (let i = 0; i < allWords.length; i++) {
      await sendMessage({ type: 'removeWord', word: allWords[i].word });
    }
    await loadWords();
  });

  // --- Helpers ---
  function showHint(text, type) {
    downloadHint.textContent = text;
    downloadHint.className = 'download-hint ' + (type || '');
    downloadHint.style.display = 'block';
    setTimeout(() => { downloadHint.style.display = 'none'; }, 3000);
  }

  async function sendMessage(request) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(request, (response) => {
        resolve(response || { success: false, error: 'No response' });
      });
    });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  function escapeAttr(str) {
    return (str || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function extractDomain(url) {
    try {
      const u = new URL(url);
      return u.hostname.replace(/^www\./, '');
    } catch (e) { return url; }
  }

  function h(str) {
    return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // --- Init ---
  await loadWords();
});
