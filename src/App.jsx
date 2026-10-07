import React, { useState, useEffect } from 'react';
import { 
  DndContext, 
  pointerWithin,
  rectIntersection,
  closestCorners,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import {
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { Menu, Wand2, Plus, Users, RotateCcw, X, Monitor, Smartphone, Share2, Sparkles, Clipboard } from 'lucide-react';
import { DroppableColumn } from './components/DroppableColumn';
import { SortableItem } from './components/SortableItem';
import { ShareModal } from './components/ShareModal';
import { getCategoryTheme } from './theme';

export const APP_VERSION = 'v1.2.0';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(() => typeof window !== 'undefined' && window.innerWidth > 768);
  const [viewMode, setViewMode] = useState('desktop'); // 'desktop' | 'mobile'
  const [numGroups, setNumGroups] = useState(6);
  const [numSources, setNumSources] = useState(1);
  const [activeSource, setActiveSource] = useState('source-1');
  const [sourceQuotas, setSourceQuotas] = useState({});
  const [maxPerGroup, setMaxPerGroup] = useState('');
  const [inputText, setInputText] = useState('');
  const [shareModalOpen, setShareModalOpen] = useState(false);

  // 自定義名稱狀態 (分類與組別)
  const [categoryNames, setCategoryNames] = useState({});
  const [groupNames, setGroupNames] = useState({});

  const getCategoryName = (sourceId) => {
    if (categoryNames[sourceId]?.trim()) return categoryNames[sourceId].trim();
    const theme = getCategoryTheme(sourceId);
    return theme?.name || '分類 1';
  };

  const getCategoryShortName = (sourceId) => {
    if (categoryNames[sourceId]?.trim()) {
      return categoryNames[sourceId].trim().slice(0, 2);
    }
    const theme = getCategoryTheme(sourceId);
    return theme?.shortName || '分1';
  };

  const getGroupName = (groupId) => {
    if (groupNames[groupId]?.trim()) return groupNames[groupId].trim();
    const idx = parseInt(groupId.replace('group-', ''), 10);
    return `第 ${idx || 1} 組`;
  };

  const handleRenameTitle = (id, newTitle) => {
    if (id.startsWith('source-')) {
      setCategoryNames(prev => ({ ...prev, [id]: newTitle }));
    } else if (id.startsWith('group-')) {
      setGroupNames(prev => ({ ...prev, [id]: newTitle }));
    }
  };

  // 快速範例名單填入
  const handleFillSample = () => {
    const sampleNames = [
      '王小明', '陳大頭', '林小美', '張建華', '黃雅婷', '李宗翰', 
      '劉怡君', '吳冠宇', '蔡佩珊', '楊凱文', '許淑芬', '鄭柏豪'
    ];
    setInputText(sampleNames.join(', '));
  };

  // 一鍵貼上剪貼簿名單
  const handlePasteClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setInputText(prev => prev ? `${prev}, ${text}` : text);
        }
      } else {
        alert("瀏覽器限制無法直接讀取剪貼簿，請於輸入框內長按並選擇「貼上」");
      }
    } catch {
      alert("無法存取剪貼簿，請直接在文字框中長按貼上");
    }
  };

  // 確保在使用者刪除輸入格 (暫時為空字串) 時，系統仍具備大於等於 1 的預設安全計算值
  const safeNumSources = Math.max(1, parseInt(numSources, 10) || 1);
  const safeNumGroups = Math.max(1, parseInt(numGroups, 10) || 1);
  
  // State for all columns: { 'source-1': [], 'group-1': [], ... }
  const [columns, setColumns] = useState({
    'source-1': []
  });

  const [activeId, setActiveId] = useState(null);

  // Initialize group columns based on safeNumGroups and safeNumSources
  useEffect(() => {
    setColumns(prev => {
      const newCols = { ...prev };
      for (let i = 1; i <= safeNumSources; i++) {
        const sourceId = `source-${i}`;
        newCols[sourceId] = prev[sourceId] || [];
      }
      for (let i = 1; i <= safeNumGroups; i++) {
        const groupId = `group-${i}`;
        newCols[groupId] = prev[groupId] || [];
      }
      return newCols;
    });
    
    if (parseInt(activeSource.split('-')[1]) > safeNumSources) {
      setActiveSource('source-1');
    }
  }, [safeNumGroups, safeNumSources, activeSource]);

  // 需求 5：全面優化滑鼠與手機觸控感應器 (解決手機與電腦不好拖拉的問題)
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 4, // 電腦版滑鼠移動 4px 立即順暢觸發拖拉
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 100, // 手機版輕按 100ms 立即啟動拖拉，同時保留滑動滾動彈性
        tolerance: 6,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 專業雙階段碰撞檢測：優先 pointerWithin，回退至 rectIntersection 與 closestCorners
  const customCollisionDetection = (args) => {
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) {
      return pointerCollisions;
    }
    const rectCollisions = rectIntersection(args);
    if (rectCollisions.length > 0) {
      return rectCollisions;
    }
    return closestCorners(args);
  };

  const handleAddNames = () => {
    if (!inputText.trim()) return;
    const names = inputText.split(/[,\n]+/).map(n => n.trim()).filter(n => n);
    if (names.length === 0) return;

    const newPeople = names.map(name => ({
      id: `person-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      isPinned: false,
      sourceId: activeSource
    }));

    setColumns(prev => {
      const newCols = { ...prev };
      newCols[activeSource] = [...(newCols[activeSource] || []), ...newPeople];
      return newCols;
    });
    
    setInputText('');
  };

  const handleClearAll = () => {
    if (window.confirm("確定要清空所有名單嗎？")) {
      setColumns(prev => {
        const newCols = {};
        for (let i = 1; i <= safeNumSources; i++) newCols[`source-${i}`] = [];
        for (let i = 1; i <= safeNumGroups; i++) newCols[`group-${i}`] = [];
        return newCols;
      });
    }
  };

  const handleDeleteItem = (id) => {
    setColumns(prev => {
      const newCols = { ...prev };
      for (const key in newCols) {
        newCols[key] = newCols[key].filter(p => p.id !== id);
      }
      return newCols;
    });
  };

  const handleTogglePin = (id) => {
    setColumns(prev => {
      const newCols = { ...prev };
      for (const key in newCols) {
        newCols[key] = newCols[key].map(item => 
          item.id === id ? { ...item, isPinned: !item.isPinned } : item
        );
      }
      return newCols;
    });
  };

  const handleReset = () => {
    setColumns(prev => {
      const newCols = {};
      Object.keys(prev).forEach(k => newCols[k] = [...prev[k]]);
      
      const groupKeys = Object.keys(newCols).filter(k => k.startsWith('group-'));
      groupKeys.forEach(key => {
        const itemsToProcess = [...newCols[key]];
        newCols[key] = [];
        itemsToProcess.forEach(item => {
          if (item.isPinned) {
            newCols[key].push(item);
          } else {
            const src = item.sourceId || 'source-1';
            if (!newCols[src]) newCols[src] = [];
            newCols[src].push(item);
          }
        });
      });
      return newCols;
    });
  };

  const handleRandomize = () => {
    setColumns(prev => {
      // 1. Collect all available (non-pinned) items from prev, grouped by source
      const availableBySource = {};
      for (let i = 1; i <= safeNumSources; i++) availableBySource[`source-${i}`] = [];

      Object.keys(prev).forEach(key => {
        (prev[key] || []).forEach(item => {
          if (!item.isPinned) {
            const src = item.sourceId || 'source-1';
            if (!availableBySource[src]) availableBySource[src] = [];
            availableBySource[src].push({ ...item }); // clone each item
          }
        });
      });

      // Check if there's anything to distribute
      let hasAvailable = false;
      Object.values(availableBySource).forEach(arr => {
        if (arr.length > 0) hasAvailable = true;
      });
      if (!hasAvailable) return prev;

      // 2. Shuffle each source pool
      Object.values(availableBySource).forEach(arr => {
        for (let i = arr.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [arr[i], arr[j]] = [arr[j], arr[i]];
        }
      });

      // 3. Build new columns: start with only pinned items
      const newCols = {};
      for (let i = 1; i <= safeNumSources; i++) newCols[`source-${i}`] = [];
      const activeGroupKeys = [];
      for (let i = 1; i <= safeNumGroups; i++) {
        const gk = `group-${i}`;
        activeGroupKeys.push(gk);
        // Keep only pinned items from previous groups
        newCols[gk] = (prev[gk] || []).filter(item => item.isPinned).map(item => ({ ...item }));
      }

      const maxLimit = parseInt(maxPerGroup) || 0;

      // 4. Distribute items
      Object.keys(availableBySource).forEach(src => {
        const items = availableBySource[src];
        const quota = parseInt(sourceQuotas[src]);

        if (quota > 0) {
          for (const groupKey of activeGroupKeys) {
            const pinnedOfSource = newCols[groupKey].filter(i => i.sourceId === src).length;
            const needed = Math.max(0, quota - pinnedOfSource);
            for (let i = 0; i < needed; i++) {
              if (items.length > 0) {
                newCols[groupKey].push(items.pop());
              }
            }
          }
          // Overflow goes back to source
          if (items.length > 0) {
            newCols[src].push(...items);
          }
        } else {
          let currentGroupIndex = 0;
          while (items.length > 0) {
            let placed = false;
            let startIdx = currentGroupIndex;
            do {
              const groupKey = activeGroupKeys[currentGroupIndex];
              const isFull = maxLimit > 0 && newCols[groupKey].length >= maxLimit;
              if (!isFull) {
                newCols[groupKey].push(items.pop());
                placed = true;
                currentGroupIndex = (currentGroupIndex + 1) % activeGroupKeys.length;
                break;
              }
              currentGroupIndex = (currentGroupIndex + 1) % activeGroupKeys.length;
            } while (currentGroupIndex !== startIdx);

            if (!placed) {
              newCols[src].push(...items);
              items.length = 0;
            }
          }
        }
      });

      return newCols;
    });
  };

  const findContainer = (id) => {
    if (id in columns) {
      return id;
    }
    return Object.keys(columns).find(key => 
      columns[key].some(item => item.id === id)
    );
  };

  const handleDragStart = (event) => {
    const { active } = event;
    setActiveId(active.id);
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    const overId = over?.id;

    if (!overId || active.id === overId) {
      return;
    }

    const activeContainer = findContainer(active.id);
    const overContainer = findContainer(overId);

    if (!activeContainer || !overContainer || activeContainer === overContainer) {
      return;
    }

    setColumns((prev) => {
      const activeItems = prev[activeContainer];
      const activeItem = activeItems.find(i => i.id === active.id);
      const overItems = prev[overContainer];

      if (overContainer.startsWith('group-')) {
        const maxLimit = parseInt(maxPerGroup) || 0;
        if (maxLimit > 0 && overItems.length >= maxLimit) {
          return prev;
        }

        const src = activeItem?.sourceId || 'source-1';
        const quota = parseInt(sourceQuotas[src]);
        if (quota > 0) {
          const currentCount = overItems.filter(i => (i.sourceId || 'source-1') === src).length;
          if (currentCount >= quota) {
            return prev;
          }
        }
      }

      const activeIndex = activeItems.findIndex(i => i.id === active.id);
      const overIndex = overId in prev ? overItems.length + 1 : overItems.findIndex(i => i.id === overId);

      return {
        ...prev,
        [activeContainer]: [
          ...prev[activeContainer].filter((item) => item.id !== active.id),
        ],
        [overContainer]: [
          ...prev[overContainer].slice(0, overIndex),
          activeItems[activeIndex],
          ...prev[overContainer].slice(overIndex, prev[overContainer].length),
        ],
      };
    });
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    const activeContainer = findContainer(active.id);
    const overContainer = findContainer(over?.id);

    if (!activeContainer || !overContainer || activeContainer !== overContainer) {
      setActiveId(null);
      return;
    }

    const activeIndex = columns[activeContainer].findIndex(i => i.id === active.id);
    const overIndex = columns[overContainer].findIndex(i => i.id === over?.id);

    if (activeIndex !== overIndex) {
      setColumns((prev) => ({
        ...prev,
        [overContainer]: arrayMove(prev[overContainer], activeIndex, overIndex),
      }));
    }

    setActiveId(null);
  };

  const getActivePerson = () => {
    if (!activeId) return null;
    for (const key in columns) {
      const person = columns[key].find(p => p.id === activeId);
      if (person) return person;
    }
    return null;
  };

  const dropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: '0.5',
        },
      },
    }),
  };

  const totalSourcePeople = Object.keys(columns)
    .filter(k => k.startsWith('source-'))
    .reduce((acc, k) => acc + (columns[k]?.length || 0), 0);

  const totalGroupPeople = Object.keys(columns)
    .filter(k => k.startsWith('group-'))
    .reduce((acc, k) => acc + (columns[k]?.length || 0), 0);

  return (
    <div className={`app-container ${viewMode === 'mobile' ? 'mode-mobile' : 'mode-desktop'}`}>
      {sidebarOpen && (
        <div 
          className="sidebar-backdrop" 
          onClick={() => setSidebarOpen(false)} 
        />
      )}

      <div className={`sidebar ${sidebarOpen ? '' : 'collapsed'}`}>
        <div className="sidebar-header">
          <div className="sidebar-title">
            <Users size={18} color="var(--primary-accent)" />
            名單輸入
          </div>
          <button 
            className="sidebar-close-btn" 
            onClick={() => setSidebarOpen(false)}
            title="收合面板"
          >
            <X size={18} />
          </button>
        </div>
        
        <div className="sidebar-scroll-body">
          <div className="form-group">
            <label className="form-label">未分配分類數 (來源池)</label>
            <input 
              type="number" 
              className="text-input"
              value={numSources}
              onChange={(e) => setNumSources(e.target.value)}
              onBlur={() => {
                if (!numSources || parseInt(numSources, 10) < 1) {
                  setNumSources(1);
                } else {
                  setNumSources(parseInt(numSources, 10));
                }
              }}
              min="1"
              placeholder="最少 1"
            />
          </div>

          {/* 需求 1：自定義分類名稱 */}
          <div className="form-group">
            <label className="form-label">自定義分類名稱</label>
            <div className="category-names-list">
              {Array.from({ length: safeNumSources }).map((_, i) => {
                const sId = `source-${i+1}`;
                const theme = getCategoryTheme(sId);
                return (
                  <div key={`cat-name-input-${sId}`} className="cat-name-row">
                    <span 
                      className="source-color-dot" 
                      style={{ backgroundColor: theme.color, boxShadow: `0 0 6px ${theme.color}` }} 
                    />
                    <input 
                      type="text"
                      className="text-input cat-name-input"
                      value={categoryNames[sId] ?? ''}
                      onChange={(e) => setCategoryNames(prev => ({ ...prev, [sId]: e.target.value }))}
                      placeholder={theme.name}
                      maxLength={15}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>載入目標分類</label>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                目前已有 {columns[activeSource]?.length || 0} 人
              </span>
            </div>
            <select 
              className="text-input" 
              value={activeSource}
              onChange={(e) => setActiveSource(e.target.value)}
            >
              {Array.from({ length: safeNumSources }).map((_, i) => {
                const sId = `source-${i+1}`;
                const name = getCategoryName(sId);
                const count = columns[sId]?.length || 0;
                return (
                  <option key={sId} value={sId}>
                    {name} — 已有 {count} 人
                  </option>
                );
              })}
            </select>
          </div>
          
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>輸入名單 (換行或逗號)</label>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button 
                  type="button" 
                  className="quick-link-btn"
                  onClick={handlePasteClipboard}
                  title="一鍵貼上剪貼簿內容"
                >
                  <Clipboard size={12} />
                  <span>貼上</span>
                </button>
                <button 
                  type="button" 
                  className="quick-link-btn"
                  onClick={handleFillSample}
                  title="填入12位範例測試名單"
                >
                  <Sparkles size={12} />
                  <span>填範例</span>
                </button>
              </div>
            </div>
            <textarea 
              className="textarea-input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="例如: 王小明, 陳大頭, 林小美..."
            />
          </div>
          
          <button className="btn-primary" onClick={handleAddNames}>
            <Plus size={16} />
            加入至選定分類
          </button>

          <button className="btn-secondary" onClick={handleClearAll} style={{ marginBottom: '6px' }}>
            <RotateCcw size={16} />
            清空所有名單
          </button>

          <div className="form-group">
            <label className="form-label">設定組數</label>
            <input 
              type="number" 
              className="text-input"
              value={numGroups}
              onChange={(e) => setNumGroups(e.target.value)}
              onBlur={() => {
                if (!numGroups || parseInt(numGroups, 10) < 1) {
                  setNumGroups(1);
                } else {
                  setNumGroups(parseInt(numGroups, 10));
                }
              }}
              min="1"
              placeholder="最少 1"
            />
          </div>

          <div className="form-group">
            <label className="form-label">每組人數上限 (全域)</label>
            <input 
              type="number" 
              className="text-input"
              value={maxPerGroup}
              onChange={(e) => setMaxPerGroup(e.target.value)}
              onBlur={() => {
                if (maxPerGroup !== '' && parseInt(maxPerGroup, 10) < 1) {
                  setMaxPerGroup('');
                }
              }}
              min="1"
              placeholder="例如: 3 (無限制留空)"
            />
          </div>

          {safeNumSources > 1 && (
            <div className="form-group">
              <label className="form-label">各分類抽取配額 (每組)</label>
              {Array.from({ length: safeNumSources }).map((_, i) => {
                const sId = `source-${i+1}`;
                const theme = getCategoryTheme(sId);
                const name = getCategoryName(sId);
                return (
                  <div key={`quota-${i}`} className="quota-row">
                    <span className="quota-label" style={{ color: theme.color }}>
                      <span 
                        className="source-color-dot" 
                        style={{ backgroundColor: theme.color, boxShadow: `0 0 6px ${theme.color}` }} 
                      />
                      {name}
                    </span>
                    <input 
                      type="number" 
                      className="text-input quota-input"
                      value={sourceQuotas[sId] ?? ''}
                      onChange={(e) => setSourceQuotas(prev => ({...prev, [sId]: e.target.value}))}
                      min="0"
                      placeholder="不限"
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="main-content">
        <div className="top-bar">
          <div className="top-bar-left">
            <button className="toggle-sidebar-btn" onClick={() => setSidebarOpen(!sidebarOpen)} title={sidebarOpen ? "隱藏面板" : "名單設定"}>
              <Menu size={20} />
            </button>
            <h1 className="workspace-title">
              智能分組平台
              <span className="version-badge">{APP_VERSION}</span>
            </h1>
          </div>

          <div className="top-bar-actions">
            {/* 重置名單按鈕 */}
            <button 
              className="action-pill-btn reset-pill-btn" 
              onClick={handleReset}
              title="將所有組員重置回未分配池"
            >
              <RotateCcw size={15} />
              <span className="btn-label-text">重置名單</span>
            </button>

            {/* 輸出分享按鈕 */}
            <button 
              className="action-pill-btn share-pill-btn" 
              onClick={() => setShareModalOpen(true)}
              title="匯出與分享分組結果 (複製文字/產生圖卡)"
            >
              <Share2 size={15} />
              <span className="btn-label-text">輸出分享</span>
            </button>

            {/* 隨機分組核心按鈕 */}
            <button 
              className="action-pill-btn randomize-pill-btn" 
              onClick={handleRandomize}
              title="開始隨機分組"
            >
              <Wand2 size={15} />
              <span>隨機分組</span>
            </button>

            {/* RWD 檢視切換 */}
            <div className="rwd-switcher">
              <button 
                className={`rwd-tab-btn ${viewMode === 'desktop' ? 'active' : ''}`}
                onClick={() => {
                  setViewMode('desktop');
                  setSidebarOpen(true);
                }}
                title="切換至電腦版檢視"
              >
                <Monitor size={14} />
                <span className="rwd-label">電腦</span>
              </button>
              <button 
                className={`rwd-tab-btn ${viewMode === 'mobile' ? 'active' : ''}`}
                onClick={() => {
                  setViewMode('mobile');
                  setSidebarOpen(false);
                }}
                title="切換至手機版檢視"
              >
                <Smartphone size={14} />
                <span className="rwd-label">手機</span>
              </button>
            </div>
          </div>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={customCollisionDetection}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="board-layout">
            <div className="source-area">
              <h3 className="area-title">未分配名單 (來源池)</h3>
              <div className={`unassigned-zone ${safeNumSources > 2 ? 'multi-sources' : ''}`}>
                {Array.from({ length: safeNumSources }).map((_, i) => {
                  const sourceId = `source-${i+1}`;
                  return (
                    <div key={sourceId} className="unassigned-col-wrapper">
                      <DroppableColumn 
                        id={sourceId} 
                        title={getCategoryName(sourceId)} 
                        items={columns[sourceId] || []} 
                        onDeleteItem={handleDeleteItem}
                        onTogglePin={handleTogglePin}
                        isSpecial={true}
                        onRenameTitle={handleRenameTitle}
                        getCategoryName={getCategoryName}
                        getCategoryShortName={getCategoryShortName}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="group-area">
              <h3 className="area-title">分組結果</h3>
              <div className="groups-matrix">
                {Array.from({ length: safeNumGroups }).map((_, i) => {
                  const groupId = `group-${i + 1}`;
                  return (
                    <DroppableColumn 
                      key={groupId} 
                      id={groupId} 
                      title={getGroupName(groupId)} 
                      items={columns[groupId] || []}
                      onDeleteItem={handleDeleteItem}
                      onTogglePin={handleTogglePin}
                      onRenameTitle={handleRenameTitle}
                      getCategoryName={getCategoryName}
                      getCategoryShortName={getCategoryShortName}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          <DragOverlay dropAnimation={dropAnimation}>
            {activeId ? (
              <SortableItem 
                id={activeId} 
                person={getActivePerson()} 
                categoryName={getActivePerson() ? getCategoryName(getActivePerson().sourceId) : null}
                categoryShortName={getActivePerson() ? getCategoryShortName(getActivePerson().sourceId) : null}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* 輸出與分享結果彈跳視窗 */}
      <ShareModal 
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        columns={columns}
        numGroups={safeNumGroups}
        getGroupName={getGroupName}
        getCategoryName={getCategoryName}
        getCategoryShortName={getCategoryShortName}
      />
    </div>
  );
}

export default App;
