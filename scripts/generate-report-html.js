const fs = require('fs');

const md = fs.readFileSync('./reports/code-analysis.md', 'utf8');
const lines = md.split('\n');

let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Code Quality Analysis - Vault Navigator</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 40px 20px;
      line-height: 1.6;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px;
      text-align: center;
    }
    .header h1 {
      font-size: 2.5em;
      margin-bottom: 10px;
      font-weight: 700;
    }
    .header p {
      font-size: 1.1em;
      opacity: 0.9;
    }
    .content {
      padding: 40px;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin: 30px 0;
    }
    .stat-card {
      background: #f8f9fa;
      padding: 24px;
      border-radius: 12px;
      border-left: 4px solid #3498db;
      transition: transform 0.2s;
    }
    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    .stat-label {
      color: #7f8c8d;
      font-size: 0.9em;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .stat-value {
      color: #2c3e50;
      font-size: 2.5em;
      font-weight: 700;
      margin: 8px 0;
    }
    .stat-card.error { border-left-color: #e74c3c; }
    .stat-card.warning { border-left-color: #f39c12; }
    .stat-card.success { border-left-color: #27ae60; }
    .error .stat-value { color: #e74c3c; }
    .warning .stat-value { color: #f39c12; }
    .success .stat-value { color: #27ae60; }
    h2 {
      color: #2c3e50;
      font-size: 1.8em;
      margin: 40px 0 20px 0;
      padding-bottom: 12px;
      border-bottom: 2px solid #ecf0f1;
    }
    .issue-item {
      background: #fff;
      border: 1px solid #ecf0f1;
      border-radius: 8px;
      padding: 16px;
      margin: 12px 0;
      transition: all 0.2s;
    }
    .issue-item:hover {
      border-color: #3498db;
      box-shadow: 0 2px 8px rgba(52, 152, 219, 0.1);
    }
    .issue-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;
    }
    .severity-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 0.85em;
      font-weight: 600;
      text-transform: uppercase;
    }
    .severity-error {
      background: #fee;
      color: #e74c3c;
    }
    .severity-warning {
      background: #fef5e7;
      color: #f39c12;
    }
    .rule-name {
      font-family: 'Courier New', monospace;
      color: #3498db;
      font-weight: 600;
    }
    .file-path {
      color: #7f8c8d;
      font-size: 0.9em;
      font-family: 'Courier New', monospace;
    }
    .issue-message {
      color: #555;
      margin-top: 8px;
      padding-left: 20px;
      border-left: 3px solid #ecf0f1;
    }
    .rule-list {
      list-style: none;
    }
    .rule-list li {
      padding: 12px;
      margin: 8px 0;
      background: #f8f9fa;
      border-radius: 6px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .rule-count {
      background: #3498db;
      color: white;
      padding: 4px 12px;
      border-radius: 12px;
      font-weight: 600;
      font-size: 0.9em;
    }
    .file-list {
      list-style: none;
    }
    .file-list li {
      padding: 10px;
      margin: 6px 0;
      background: #fff;
      border: 1px solid #ecf0f1;
      border-radius: 6px;
      font-family: 'Courier New', monospace;
      font-size: 0.9em;
    }
    .config-list {
      list-style: none;
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .config-list li {
      padding: 8px 0;
      color: #555;
    }
    .config-list strong {
      color: #2c3e50;
    }
    .timestamp {
      text-align: center;
      color: #95a5a6;
      font-size: 0.9em;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ecf0f1;
    }
    code {
      background: #f8f9fa;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      color: #e74c3c;
      font-size: 0.9em;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Code Quality Analysis</h1>
      <p>Vault Navigator - SonarJS Quality Report</p>
    </div>
    <div class="content">`;

// Parse markdown and convert to enhanced HTML
let inList = false;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  if (line.startsWith('# ')) {
    // Skip main title (already in header)
    continue;
  } else if (line.startsWith('## ')) {
    if (inList) { html += '</ul>'; inList = false; }
    html += `<h2>${line.substring(3)}</h2>`;
  } else if (line.startsWith('- **')) {
    if (!inList) { html += '<ul class="rule-list">'; inList = true; }
    const match = line.match(/- \*\*(.+?)\*\*: (.+)/);
    if (match) {
      html += `<li><span class="rule-name">${match[1]}</span><span class="rule-count">${match[2]}</span></li>`;
    }
  } else if (line.startsWith('- ')) {
    if (!inList) { html += '<ul class="config-list">'; inList = true; }
    html += `<li>${line.substring(2).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')}</li>`;
  } else if (line.match(/^🔴|^🟡/)) {
    if (inList) { html += '</ul>'; inList = false; }
    const severity = line.startsWith('🔴') ? 'error' : 'warning';
    html += `<div class="issue-item">
      <div class="issue-header">
        <span class="severity-badge severity-${severity}">${severity}</span>
        <span>${line.substring(2)}</span>
      </div>
    </div>`;
  } else if (line.trim() === '') {
    if (inList) { html += '</ul>'; inList = false; }
  } else if (line.trim()) {
    html += `<p>${line}</p>`;
  }
}

if (inList) html += '</ul>';

html += `
      <div class="timestamp">
        Generated: ${new Date().toUTCString()}<br>
        <a href="index.html" style="color: #3498db; text-decoration: none;">← Back to Reports</a>
      </div>
    </div>
  </div>
</body>
</html>`;

fs.writeFileSync('./reports/code-analysis.html', html);
console.log('HTML report generated successfully');
