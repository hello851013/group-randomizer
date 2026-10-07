import React from 'react';
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

  const isPinned = person?.isPinned || false;
  const theme = getCategoryTheme(person?.sourceId);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 1,
    ...(isPinned
      ? {}
      : {
          borderLeft: `3px solid ${theme.color}`,
        }),
  };

  // 需求 3：名單卡片的前面圓圈內僅放入一個字元
  const getInitials = (name) => {
    return (name || '').trim().slice(0, 1).toUpperCase();
  };

  const iconSize = density === 'micro' ? 12 : density === 'mini' ? 13 : density === 'compact' ? 14 : 16;
  const displayName = categoryName || theme.name;
  const displayShort = categoryShortName || theme.shortName || theme.id;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`draggable-card card-density-${density} ${isDragging ? 'is-dragging' : ''} ${isPinned ? 'is-pinned' : ''}`}
      {...attributes}
      {...listeners}
    >
      <div className="card-name">
        <div
          className="avatar-placeholder"
          style={
            isPinned
              ? { background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#ffffff', boxShadow: '0 0 8px rgba(245, 158, 11, 0.6)' }
              : { background: theme.avatarGradient }
          }
        >
          {getInitials(person?.name)}
        </div>
        
        <span className="person-name" title={person?.name}>{person?.name}</span>

        {isPinned ? (
          <span className="pinned-badge" title="已釘選 - 隨機分組時保持在此組">
            📌<span className="pin-text"> 釘選</span>
          </span>
        ) : !isUnassigned ? (
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
      
      <div className="card-actions" onPointerDown={(e) => e.stopPropagation()}>
        {onTogglePin && (
          <button 
            className={`action-btn pin-btn ${isPinned ? 'active' : ''}`} 
            onClick={() => onTogglePin(id)}
            title={isPinned ? "取消釘選" : "釘選固定此人"}
          >
            <Pin size={iconSize} fill={isPinned ? "currentColor" : "none"} />
          </button>
        )}
        {onDelete && (
          <button className="action-btn delete-btn" onClick={() => onDelete(id)} title="刪除">
            <Trash2 size={iconSize} />
          </button>
        )}
      </div>
    </div>
  );
}
