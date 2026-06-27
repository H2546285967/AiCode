// public/app.js
const API = {
  upload: '/api/upload',
  audit: '/api/audit',
  list: '/api/materials',
  health: '/api/health',
};

fetch(API.health)
  .then(r => r.json())
  .then(data => {
    const badge = document.getElementById('mode-badge');
    badge.textContent = data.mode === 'MOCK' ? '🎭 Mock 模式' : '🤖 Kimi API';
  })
  .catch(() => {});

const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('file-input');
const browseBtn = document.getElementById('browse-btn');

dropzone.addEventListener('click', () => fileInput.click());
browseBtn.addEventListener('click', (e) => { e.stopPropagation(); fileInput.click(); });
dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('dragover'); });
dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
dropzone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropzone.classList.remove('dragover');
  if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
});
fileInput.addEventListener('change', (e) => {
  if (e.target.files.length) handleFile(e.target.files[0]);
});

async function handleFile(file) {
  const platform = document.querySelector('input[name="platform"]:checked').value;
  const progress = document.getElementById('upload-progress');
  const resultSection = document.getElementById('result-section');

  progress.classList.remove('hidden');
  resultSection.classList.add('hidden');

  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('platform', platform);

    const uploadRes = await fetch(API.upload, { method: 'POST', body: formData });
    if (!uploadRes.ok) throw new Error('上传失败: ' + (await uploadRes.text()));
    const { materialId, materialType } = await uploadRes.json();

    showPreview(file, materialType);

    const auditRes = await fetch(API.audit, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ materialId }),
    });
    if (!auditRes.ok) throw new Error('审核失败: ' + (await auditRes.text()));
    const { report, riskScore, status } = await auditRes.json();

    renderReport(report, status, riskScore);
    loadHistory();
  } catch (err) {
    alert('错误: ' + err.message);
    console.error(err);
  } finally {
    progress.classList.add('hidden');
  }
}

function showPreview(file, materialType) {
  const preview = document.getElementById('material-preview');
  const url = URL.createObjectURL(file);
  if (materialType === 'image') {
    preview.innerHTML = `<img src="${url}" alt="素材预览">`;
  } else {
    preview.innerHTML = `<video src="${url}" controls></video>`;
  }
}

function renderReport(report, status, riskScore) {
  const section = document.getElementById('result-section');
  section.classList.remove('hidden');

  const verdictText = { pass: '✅ 通过', review: '⚠️ 需复审', reject: '❌ 拒绝' }[report.verdict];
  const verdictClass = report.verdict;
  document.getElementById('audit-summary').innerHTML = `
    <div class="score-circle ${verdictClass}">${riskScore}</div>
    <div>
      <div class="verdict ${verdictClass}">${verdictText}</div>
      <div style="font-size:13px;color:#64748b;margin-top:4px;">综合评分 · ${report.reasoning || ''}</div>
    </div>
  `;

  const dims = report.dimensions || {};
  const dimLabels = {
    compliance: '合规性',
    brand_safety: '品牌安全',
    quality: '内容质量',
    platform_fit: '平台适配',
  };
  const dimHtml = Object.entries(dims).map(([key, dim]) => {
    const level = dim.score >= 80 ? 'high' : dim.score >= 50 ? 'mid' : 'low';
    const issuesHtml = (dim.issues || []).map(i => `<li>${i}</li>`).join('');
    return `
      <div class="dim-card ${level}">
        <div class="dim-name">${dimLabels[key] || key}</div>
        <div class="dim-score">${dim.score}</div>
        ${issuesHtml ? `<ul class="dim-issues">${issuesHtml}</ul>` : ''}
      </div>
    `;
  }).join('');
  document.getElementById('audit-dimensions').innerHTML = dimHtml;

  const sugHtml = (report.suggestions || []).map(s => `<li>${s}</li>`).join('');
  document.getElementById('audit-suggestions').innerHTML = `
    <h3>💡 修改建议</h3>
    <ul>${sugHtml || '<li>无</li>'}</ul>
  `;
}

async function loadHistory() {
  try {
    const res = await fetch(API.list);
    const { items } = await res.json();
    const list = document.getElementById('history-list');
    if (!items.length) {
      list.innerHTML = '<p style="text-align:center;color:#94a3b8;padding:20px;">暂无审核记录</p>';
      return;
    }
    list.innerHTML = items.map(item => {
      const statusClass = item.status === 'approved' ? 'pass' :
                         item.status === 'rejected' ? 'reject' :
                         item.status === 'human_review' ? 'review' : 'pending';
      const statusText = { approved: '通过', rejected: '拒绝', human_review: '复审', pending: '待审' }[item.status] || item.status;
      const time = new Date(item.created_at).toLocaleString('zh-CN');
      return `
        <div class="history-item">
          <span class="filename">#${item.id} ${item.source_filename}</span>
          <span class="badge ${statusClass}">${statusText}${item.risk_score != null ? ' · ' + item.risk_score : ''}</span>
          <span style="color:#94a3b8;font-size:12px;">${time}</span>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error('加载历史失败:', err);
  }
}

loadHistory();