import React, { useState, useRef } from 'react';
import { X, Copy, Check, Share2, Download, Image as ImageIcon, FileText } from 'lucide-react';
import { getCategoryTheme } from '../theme';

export function ShareModal({ 
  isOpen, 
  onClose, 
  columns, 
  numGroups,
  getGroupName,
  getCategoryName,
  getCategoryShortName 
}) {
  const [activeTab, setActiveTab] = useState('text'); // 'text' | 'image'
  const [copied, setCopied] = useState(false);
  const [isGeneratingImg, setIsGeneratingImg] = useState(false);
  const canvasRef = useRef(null);

  if (!isOpen) return null;

  // Filter and format group data
  const groupsData = [];
  let totalAssignedPeople = 0;

  for (let i = 1; i <= numGroups; i++) {
    const groupId = `group-${i}`;
    const members = columns[groupId] || [];
    totalAssignedPeople += members.length;
    const title = getGroupName ? getGroupName(groupId) : `第 ${i} 組`;
    groupsData.push({
      id: groupId,
      title: title,
      members: members
    });
  }

  // Generate formatted text
  const generateText = () => {
    const now = new Date();
    const timeStr = `${now.getFullYear()}/${(now.getMonth()+1).toString().padStart(2, '0')}/${now.getDate().toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    let text = `🎉【智能分組結果】🎉\n`;
    text += `📅 建立時間：${timeStr}\n`;
    text += `📊 總組數：${numGroups} 組 ｜ 總人數：${totalAssignedPeople} 人\n`;
    text += `═════════════════════\n\n`;

    groupsData.forEach(g => {
      text += `📌 ${g.title} (${g.members.length}人)\n`;
      if (g.members.length === 0) {
        text += `   (暫無組員)\n`;
      } else {
        g.members.forEach(m => {
          const theme = getCategoryTheme(m.sourceId);
          const pinMark = m.isPinned ? ' [📌釘選]' : '';
          const shortName = getCategoryShortName ? getCategoryShortName(m.sourceId) : theme?.shortName;
          const catMark = shortName ? ` (${shortName})` : '';
          text += `   • ${m.name}${catMark}${pinMark}\n`;
        });
      }
      text += `\n`;
    });

    text += `═════════════════════\n`;
    text += `⚡ 由 智能分組平台 自動生成`;
    return text;
  };

  const formattedText = generateText();

  // Copy to clipboard
  const handleCopyText = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(formattedText);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = formattedText;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch (err) {
      console.error("Copy failed", err);
      alert("複製失敗，請手動複製文字框內的內容");
    }
  };

  // Web Share API (native on iPhone Safari & Android)
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: '智能分組結果',
          text: formattedText,
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          handleCopyText();
        }
      }
    } else {
      handleCopyText();
    }
  };

  // Generate & Download Canvas Image
  const handleDownloadImage = () => {
    setIsGeneratingImg(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = 800;
    
    // Calculate required height based on groups count
    const cols = 2;
    const cardWidth = 360;
    const cardGap = 20;
    const headerHeight = 120;
    const footerHeight = 60;
    
    // Calculate group cards height
    const rows = Math.ceil(groupsData.length / cols);
    let maxRowHeights = [];
    for (let r = 0; r < rows; r++) {
      const g1 = groupsData[r * cols];
      const g2 = groupsData[r * cols + 1];
      const count1 = g1 ? g1.members.length : 0;
      const count2 = g2 ? g2.members.length : 0;
      const maxCount = Math.max(count1, count2, 1);
      const h = 48 + maxCount * 36 + 16; // title + members + padding
      maxRowHeights.push(h);
    }
    const totalContentHeight = maxRowHeights.reduce((a, b) => a + b + cardGap, 0);
    const height = headerHeight + totalContentHeight + footerHeight;

    canvas.width = width;
    canvas.height = height;

    // Background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    // Decorative gradient circle
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#1e1b4b');
    grad.addColorStop(0.5, '#0f172a');
    grad.addColorStop(1, '#172554');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Header Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🎉 智能分組結果', width / 2, 50);

    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#94a3b8';
    const now = new Date();
    const timeStr = `${now.getFullYear()}/${(now.getMonth()+1).toString().padStart(2, '0')}/${now.getDate().toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    ctx.fillText(`總組數：${numGroups} 組 ｜ 總人數：${totalAssignedPeople} 人 ｜ 生成時間：${timeStr}`, width / 2, 80);

    // Draw Group Cards
    let currentY = headerHeight;
    for (let r = 0; r < rows; r++) {
      const rowHeight = maxRowHeights[r];
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c;
        if (idx >= groupsData.length) break;
        const group = groupsData[idx];
        const cardX = 30 + c * (cardWidth + cardGap);
        const cardY = currentY;

        // Card box
        ctx.fillStyle = 'rgba(30, 41, 59, 0.7)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(cardX, cardY, cardWidth, rowHeight, 10);
        ctx.fill();
        ctx.stroke();

        // Group Header
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(group.title, cardX + 16, cardY + 30);

        // Group count badge
        ctx.fillStyle = '#6366f1';
        ctx.beginPath();
        ctx.roundRect(cardX + cardWidth - 65, cardY + 14, 50, 22, 11);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${group.members.length} 人`, cardX + cardWidth - 40, cardY + 29);

        // Members list
        let memberY = cardY + 60;
        if (group.members.length === 0) {
          ctx.fillStyle = '#64748b';
          ctx.font = 'italic 13px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText('(無名單)', cardX + 24, memberY);
        } else {
          group.members.forEach((m) => {
            const theme = getCategoryTheme(m.sourceId);

            // Member row background
            ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.beginPath();
            ctx.roundRect(cardX + 12, memberY - 18, cardWidth - 24, 28, 6);
            ctx.fill();

            // Color bar on left of row
            ctx.fillStyle = theme.color;
            ctx.fillRect(cardX + 12, memberY - 18, 4, 28);

            // Member Name
            ctx.fillStyle = '#ffffff';
            ctx.font = '500 14px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(m.name, cardX + 26, memberY);

            // Category tag
            if (theme.shortName) {
              ctx.fillStyle = theme.color;
              ctx.font = 'bold 11px sans-serif';
              ctx.textAlign = 'right';
              ctx.fillText(theme.shortName, cardX + cardWidth - 24, memberY);
            }

            // Pinned indicator
            if (m.isPinned) {
              ctx.font = '12px sans-serif';
              ctx.fillText('📌', cardX + cardWidth - 52, memberY);
            }

            memberY += 34;
          });
        }
      }
      currentY += rowHeight + cardGap;
    }

    // Footer Branding
    ctx.fillStyle = '#64748b';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⚡ 智能分組平台 (group-randomizer)', width / 2, height - 25);

    // Export to Download
    try {
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `分組結果_${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}.png`;
      a.click();
    } catch (e) {
      console.error(e);
      alert("圖片產生失敗，建議直接使用「文字分享」");
    } finally {
      setIsGeneratingImg(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="share-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Share2 size={18} color="var(--primary-accent)" />
            <span>匯出與分享分組結果</span>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-tabs">
          <button 
            className={`modal-tab-btn ${activeTab === 'text' ? 'active' : ''}`}
            onClick={() => setActiveTab('text')}
          >
            <FileText size={15} />
            <span>文字格式 (通訊軟體)</span>
          </button>
          <button 
            className={`modal-tab-btn ${activeTab === 'image' ? 'active' : ''}`}
            onClick={() => setActiveTab('image')}
          >
            <ImageIcon size={15} />
            <span>圖片卡片 (下載保存)</span>
          </button>
        </div>

        <div className="modal-body">
          {activeTab === 'text' ? (
            <div className="text-export-section">
              <p className="export-hint">
                💡 可一鍵複製整齊排列的名單，直接貼至 LINE、Slack 或微信群組：
              </p>
              <textarea 
                className="export-textarea" 
                readOnly 
                value={formattedText}
                rows={10}
              />
              <div className="export-actions">
                <button className="btn-primary copy-btn" onClick={handleCopyText}>
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  <span>{copied ? '已成功複製到剪貼簿！' : '一鍵複製文字'}</span>
                </button>
                {typeof navigator !== 'undefined' && navigator.share && (
                  <button className="btn-secondary share-btn" onClick={handleNativeShare}>
                    <Share2 size={16} />
                    <span>直接分享至手機 App</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="image-export-section">
              <p className="export-hint">
                🖼️ 將所有分組結果繪製成高質感暗黑風格圖卡，適合存檔或分享社群：
              </p>
              <div className="canvas-preview-container">
                <div className="mini-preview-card">
                  <div className="preview-card-header">
                    <span className="preview-title">🎉 智能分組結果</span>
                    <span className="preview-meta">{numGroups} 組 ｜ {totalAssignedPeople} 人</span>
                  </div>
                  <div className="preview-groups-grid">
                    {groupsData.slice(0, 4).map(g => (
                      <div key={g.id} className="preview-group-box">
                        <div className="p-box-title">{g.title} ({g.members.length}人)</div>
                        <div className="p-box-names">
                          {g.members.slice(0, 3).map((m, idx) => (
                            <span key={idx} className="p-tag">{m.name}</span>
                          ))}
                          {g.members.length > 3 && <span className="p-more">+{g.members.length - 3}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <canvas ref={canvasRef} style={{ display: 'none' }} />
              <button 
                className="btn-primary download-img-btn" 
                onClick={handleDownloadImage}
                disabled={isGeneratingImg}
              >
                <Download size={16} />
                <span>{isGeneratingImg ? '正在繪製圖片...' : '產生並下載高解析 PNG 圖檔'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
