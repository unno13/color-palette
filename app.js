// data.json を読み込み、タブとカードを動的に生成する

async function loadData() {
  const res = await fetch('data.json');
  if (!res.ok) throw new Error('data.json の読み込みに失敗しました');
  return res.json();
}

function buildTabButtons(categories) {
  const container = document.getElementById('tab-container');
  container.innerHTML = categories.map((cat, i) => `
    <button class="tab-btn${i === 0 ? ' active' : ''}" data-tab="${cat.id}">
      <i class="${cat.icon}"></i> ${cat.label}
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
      <div class="card-number">${palette.number}</div>
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

function setupTabSwitching() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const targetTab = btn.getAttribute('data-tab');
      tabContents.forEach(content => {
        content.classList.toggle('active', content.id === targetTab);
      });
    });
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
    buildTabButtons(data.categories);
    buildTabContents(data.categories);
    setupTabSwitching();
    setupColorCopy();
  } catch (err) {
    document.getElementById('main-content').innerHTML =
      `<p class="loading-msg">データの読み込みに失敗しました: ${err.message}</p>`;
    console.error(err);
  }
}

init();
