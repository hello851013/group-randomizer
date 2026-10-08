import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Trash2, Pin } from 'lucide-react';
import { getCategoryTheme } from '../theme';

export function SortableItem({ 
  id, 
  person, 
  onDelete, 
  onTogglePin, 
  density = 'normal',
  categoryName,
  categoryShortName,
  isUnassigned = false
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: id });

  const [showActions, setShowActions] = useState(false);

  const isPinned = person?.isPinned || false;
  const theme = getCategoryTheme(person?.sourceId);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 1,
    borderLeft: `3px solid ${theme.color}`,
  };

  // 需求 3：名單卡片的前面圓圈內僅放入一個字元
  const getInitials = (name) => {
    return (name || '').trim().slice(0, 1).toUpperCase();
  };

  const iconSize = density === 'micro' ? 12 : density === 'mini' ? 13 : density === 'compact' ? 14 : 15;
  const displayName = categoryName || theme.name;
  const displayShort = categoryShortName || theme.shortName || theme.id;

  const handleCardClick = (e) => {
    if (e.target.closest('.card-actions')) return;
    setShowActions(prev => !prev);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`draggable-card card-density-${density} ${isDragging ? 'is-dragging' : ''} ${isPinned ? 'is-pinned' : ''} ${showActions && !isDragging ? 'actions-active' : ''}`}
      onClick={handleCardClick}
      onMouseLeave={() => setShowActions(false)}
      {...attributes}
      {...listeners}
    >
      <div className="card-name">
        <div
          className="avatar-placeholder"
          style={{ background: theme.avatarGradient }}
        >
          {getInitials(person?.name)}
        </div>
        
        {/* 需求 1 & 4：完整呈現卡片名稱，釘選僅顯示金色小圖示，保留原分類顏色 */}
        <span className="person-name" title={person?.name}>
          {isPinned && <span className="pinned-indicator" title="已釘選固定">📌</span>}
          {person?.name}
        </span>

        {!isUnassigned ? (
          <span 
            className="category-pill"
            style={{
              color: theme.badgeText,
              backgroundColor: theme.badgeBg,
              borderColor: theme.border,
            }}
            title={displayName}
          >
            <span className="cat-full">{displayName}</span>
            <span className="cat-short">{displayShort}</span>
          </span>
        ) : null}
      </div>
      
      {/* 需求 1：釘選與刪除碰到或點選時才顯示懸浮遮罩，平常不佔空間完整顯示名稱與分組 */}
      <div 
        className="card-actions" 
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        {onTogglePin && (
          <button 
            type="button"
            className={`action-btn pin-btn ${isPinned ? 'active' : ''}`} 
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin(id);
            }}
            title={isPinned ? "取消釘選" : "釘選固定此人"}
          >
            <Pin size={iconSize} fill={isPinned ? "currentColor" : "none"} />
          </button>
        )}
        {onDelete && (
          <button 
            type="button"
            className="action-btn delete-btn" 
            onClick={(e) => {
              e.stopPropagation();
              onDelete(id);
            }} 
            title="刪除"
          >
            <Trash2 size={iconSize} />
          </button>
        )}
      </div>
    </div>
  );
}
