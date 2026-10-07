import React, { useState, useEffect } from 'react';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import {
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { Menu, Wand2, Plus, Users, RotateCcw, X, Monitor, Smartphone } from 'lucide-react';
import { DroppableColumn } from './components/DroppableColumn';
import { SortableItem } from './components/SortableItem';
import { getCategoryTheme } from './theme';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [viewMode, setViewMode] = useState('desktop'); // 'desktop' | 'mobile'
  const [mobileTab, setMobileTab] = useState('sources'); // 'sources' | 'groups'
  const [numGroups, setNumGroups] = useState(6);
  const [numSources, setNumSources] = useState(1);
  const [activeSource, setActiveSource] = useState('source-1');
  const [sourceQuotas, setSourceQuotas] = useState({});
  const [maxPerGroup, setMaxPerGroup] = useState('');
  const [inputText, setInputText] = useState('');
  
  // State for all columns: { 'source-1': [], 'group-1': [], ... }
  const [columns, setColumns] = useState({
    'source-1': []
  });

  const [activeId, setActiveId] = useState(null);

  // Initialize group columns based on numGroups and numSources
  useEffect(() => {
    setColumns(prev => {
      const newCols = { ...prev };
      for (let i = 1; i <= numSources; i++) {
        const sourceId = `source-${i}`;
        newCols[sourceId] = prev[sourceId] || [];
      }
      for (let i = 1; i <= numGroups; i++) {
        const groupId = `group-${i}`;
        newCols[groupId] = prev[groupId] || [];
      }
      return newCols;
    });
    
    if (parseInt(activeSource.split('-')[1]) > numSources) {
      setActiveSource('source-1');
    }
  }, [numGroups, numSources, activeSource]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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
        for (let i = 1; i <= numSources; i++) newCols[`source-${i}`] = [];
        for (let i = 1; i <= numGroups; i++) newCols[`group-${i}`] = [];
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
    setMobileTab('sources');
  };

  const handleRandomize = () => {
    setColumns(prev => {
      // 1. Collect all available (non-pinned) items from prev, grouped by source
      const availableBySource = {};
      for (let i = 1; i <= numSources; i++) availableBySource[`source-${i}`] = [];

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
      for (let i = 1; i <= numSources; i++) newCols[`source-${i}`] = [];
      const activeGroupKeys = [];
      for (let i = 1; i <= numGroups; i++) {
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
    setMobileTab('groups');
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
        
        <div className="form-group">
          <label className="form-label">未分配分類數 (來源池)</label>
          <input 
            type="number" 
            className="text-input"
            value={numSources}
            onChange={(e) => setNumSources(Math.max(1, parseInt(e.target.value) || 1))}
            min="1"
          />
        </div>

        <div className="form-group">
          <label className="form-label">載入目標</label>
          <select 
            className="text-input" 
            value={activeSource}
            onChange={(e) => setActiveSource(e.target.value)}
          >
            {Array.from({ length: numSources }).map((_, i) => {
              const sId = `source-${i+1}`;
              const theme = getCategoryTheme(sId);
              return (
                <option key={sId} value={sId}>
                  分類 {i+1} ({theme.name})
                </option>
              );
            })}
          </select>
        </div>
        
        <div className="form-group">
          <label className="form-label">輸入名單 (換行或逗號分隔)</label>
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
            onChange={(e) => setNumGroups(Math.max(1, parseInt(e.target.value) || 1))}
            min="1"
          />
        </div>

        <div className="form-group">
          <label className="form-label">每組人數上限 (全域)</label>
          <input 
            type="number" 
            className="text-input"
            value={maxPerGroup}
            onChange={(e) => setMaxPerGroup(e.target.value ? Math.max(1, parseInt(e.target.value)) : '')}
            min="1"
            placeholder="例如: 3"
          />
        </div>

        {numSources > 1 && (
          <div className="form-group">
            <label className="form-label">各分類抽取配額 (每組)</label>
            {Array.from({ length: numSources }).map((_, i) => {
              const sId = `source-${i+1}`;
              const theme = getCategoryTheme(sId);
              return (
                <div key={`quota-${i}`} className="quota-row">
                  <span className="quota-label" style={{ color: theme.color }}>
                    <span 
                      className="source-color-dot" 
                      style={{ backgroundColor: theme.color, boxShadow: `0 0 6px ${theme.color}` }} 
                    />
                    分類 {i+1}
                  </span>
                  <input 
                    type="number" 
                    className="text-input quota-input"
                    value={sourceQuotas[sId] || ''}
                    onChange={(e) => setSourceQuotas(prev => ({...prev, [sId]: e.target.value}))}
                    min="0"
                    placeholder="不限"
                  />
                </div>
              );
            })}
          </div>
        )}

        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
          <button 
            className="btn-secondary" 
            style={{ justifyContent: 'center' }}
            onClick={handleReset}
          >
            <RotateCcw size={16} />
            重置名單回未分配區
          </button>

          <button 
            className="btn-primary" 
            style={{ background: 'linear-gradient(135deg, #a855f7, #ec4899)' }}
            onClick={handleRandomize}
          >
            <Wand2 size={16} />
            隨機分組
          </button>
        </div>
      </div>

      <div className="main-content">
        <div className="top-bar">
          <div className="top-bar-left">
            <button className="toggle-sidebar-btn" onClick={() => setSidebarOpen(!sidebarOpen)} title={sidebarOpen ? "隱藏面板" : "顯示面板"}>
              <Menu size={20} />
            </button>
            <h1 className="workspace-title">智能分組平台</h1>
          </div>

          <div className="mobile-view-tabs">
            <button 
              className={`mobile-tab-btn ${mobileTab === 'sources' ? 'active' : ''}`}
              onClick={() => setMobileTab('sources')}
            >
              未分配來源 ({totalSourcePeople})
            </button>
            <button 
              className={`mobile-tab-btn ${mobileTab === 'groups' ? 'active' : ''}`}
              onClick={() => setMobileTab('groups')}
            >
              分組結果 ({totalGroupPeople})
            </button>
          </div>

          <div className="top-bar-actions">
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
                <span>電腦版</span>
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
                <span>手機版</span>
              </button>
            </div>
          </div>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className={`board-layout tab-${mobileTab}`}>
            <div className="source-area">
              <h3 className="area-title">未分配名單 (來源池)</h3>
              <div className={`unassigned-zone ${numSources > 2 ? 'multi-sources' : ''}`}>
                {Array.from({ length: numSources }).map((_, i) => {
                  const sourceId = `source-${i+1}`;
                  return (
                    <div key={sourceId} className="unassigned-col-wrapper">
                      <DroppableColumn 
                        id={sourceId} 
                        title={`分類 ${i+1}`} 
                        items={columns[sourceId] || []} 
                        onDeleteItem={handleDeleteItem}
                        onTogglePin={handleTogglePin}
                        isSpecial={true}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="group-area">
              <h3 className="area-title">分組結果</h3>
              <div className="groups-matrix">
                {Array.from({ length: numGroups }).map((_, i) => {
                  const groupId = `group-${i + 1}`;
                  return (
                    <DroppableColumn 
                      key={groupId} 
                      id={groupId} 
                      title={`第 ${i + 1} 組`} 
                      items={columns[groupId] || []}
                      onDeleteItem={handleDeleteItem}
                      onTogglePin={handleTogglePin}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          <DragOverlay dropAnimation={dropAnimation}>
            {activeId ? (
              <SortableItem id={activeId} person={getActivePerson()} />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}

export default App;
