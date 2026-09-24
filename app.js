// data.json を読み込み、タブとカードを動的に生成する

async function loadData() {
  const res = await fetch('data.json');
  if (!res.ok) throw new Error('data.json の読み込みに失敗しました');
  return res.json();
}

// icons/フォルダ内のSVGファイルを取得し、テキストとして返す
async function loadIconSvg(filename) {
  try {
    const res = await fetch(`icons/${filename}`);
    if (!res.ok) throw new Error(`${filename} の読み込みに失敗`);
    return await res.text();
  } catch (err) {
    console.error('アイコン読み込みエラー:', err);
    return '';
  }
}

// data.json内で使われているアイコンファイルをまとめて先読みし、{ファイル名: SVG文字列} のマップを作る
async function loadIcons(categories) {
  const uniqueFiles = [...new Set(categories.map(cat => cat.icon))];
  const pairs = await Promise.all(
    uniqueFiles.map(async (file) => [file, await loadIconSvg(file)])
  );
  return Object.fromEntries(pairs);
}

function buildTabButtons(categories, containerId, iconMap) {
  const container = document.getElementById(containerId);
  container.innerHTML = categories.map((cat, i) => `
    <button class="tab-btn${i === 0 ? ' active' : ''}" data-tab="${cat.id}">
      <span class="tab-icon">${iconMap[cat.icon] || ''}</span> ${cat.label}
    </button>
  `).join('');
}

function buildCard(palette) {
  const swatches = palette.colors.map(c => `
    <div class="swatch" style="background-color: ${c.code};" data-color="${c.code}" title="${c.code}"></div>
  `).join('');

  const listItems = palette.colors.map(c => `
    <li class="color-item" data-color="${c.code}">
      <span class="color-dot" style="background-color: ${c.code};"></span>
      <div class="color-info">
        <span class="color-name">${c.name}</span>
        <span class="color-code">${c.code}</span>
      </div>
    </li>
  `).join('');

  return `
    <div class="card">
      <div class="card-title">${palette.title}</div>
      <div class="card-desc">${palette.desc}</div>
      <div class="color-swatches">${swatches}</div>
      <ul class="color-list">${listItems}</ul>
    </div>
  `;
}

function buildTabContents(categories) {
  const main = document.getElementById('main-content');
  main.innerHTML = categories.map((cat, i) => `
    <div id="${cat.id}" class="tab-content palette-grid${i === 0 ? ' active' : ''}">
      ${cat.palettes.map(buildCard).join('')}
    </div>
  `).join('');
}

const ACTIVE_TAB_KEY = 'colorPaletteActiveTab';

function setupTabSwitching() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      const isBottomTab = !!btn.closest('.tab-container-bottom');

      // 上下どちらのタブ群も、同じdata-tabを持つボタンをまとめてactiveにする
      tabBtns.forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-tab') === targetTab);
      });
      tabContents.forEach(content => {
        content.classList.toggle('active', content.id === targetTab);
      });

      // 開いていたタブを再読み込み時に復元できるよう保存
      try {
        localStorage.setItem(ACTIVE_TAB_KEY, targetTab);
      } catch (e) {
        // localStorageが使えない環境では無視する
      }

      // 下部タブで切り替えた場合はページ上部へ戻る
      if (isBottomTab) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  });
}

function restoreActiveTab(categories) {
  let savedTab = null;
  try {
    savedTab = localStorage.getItem(ACTIVE_TAB_KEY);
  } catch (e) {
    savedTab = null;
  }

  // 保存されたタブが存在しない、またはdata.json上に該当カテゴリがなければ何もしない(先頭タブのまま)
  if (!savedTab || !categories.some(cat => cat.id === savedTab)) return;

  document.querySelectorAll('.tab-btn').forEach(b => {
    b.classList.toggle('active', b.getAttribute('data-tab') === savedTab);
  });
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.toggle('active', content.id === savedTab);
  });
}

function setupColorCopy() {
  let toastTimer;

  function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2000);
  }

  function copyToClipboard(colorCode) {
    navigator.clipboard.writeText(colorCode).then(() => {
      showToast(`「${colorCode}」をコピーしました！`);
    }).catch(err => {
      console.error('コピー失敗:', err);
    });
  }

  document.addEventListener('click', (e) => {
    const target = e.target.closest('[data-color]');
    if (target) {
      const colorCode = target.getAttribute('data-color');
      if (colorCode) copyToClipboard(colorCode);
    }
  });
}

async function init() {
  try {
    const data = await loadData();
    const iconMap = await loadIcons(data.categories);
    buildTabButtons(data.categories, 'tab-container', iconMap);
    buildTabButtons(data.categories, 'tab-container-bottom', iconMap);
    buildTabContents(data.categories);
    restoreActiveTab(data.categories);
    setupTabSwitching();
    setupColorCopy();
  } catch (err) {
    document.getElementById('main-content').innerHTML =
      `<p class="loading-msg">データの読み込みに失敗しました: ${err.message}</p>`;
    console.error(err);
  }
}

init();