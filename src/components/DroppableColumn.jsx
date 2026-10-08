import React, { useState, useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { Edit2, Check } from 'lucide-react';
import { SortableItem } from './SortableItem';
import { getCategoryTheme, getDensity } from '../theme';

export function DroppableColumn({ 
  id, 
  title, 
  items, 
  onDeleteItem, 
  onTogglePin, 
  isSpecial,
  onRenameTitle,
  getCategoryName,
  getCategoryShortName
}) {
  const { setNodeRef } = useDroppable({
    id: id,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editVal, setEditVal] = useState(title);

  useEffect(() => {
    setEditVal(title);
  }, [title]);

  const handleSaveTitle = () => {
    setIsEditing(false);
    if (editVal.trim() && onRenameTitle) {
      onRenameTitle(id, editVal.trim());
    } else {
      setEditVal(title);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSaveTitle();
    } else if (e.key === 'Escape') {
      setEditVal(title);
      setIsEditing(false);
    }
  };

  const theme = isSpecial ? getCategoryTheme(id) : null;
  const density = getDensity(items.length);

  return (
    <div 
      className={`column ${isSpecial ? 'source-column' : ''} col-density-${density}`}
      style={isSpecial ? {
        borderColor: theme.border,
        background: `linear-gradient(180deg, ${theme.bg} 0%, rgba(15, 23, 42, 0.4) 100%)`,
      } : {}}
    >
      <div className="column-header">
        <span className="column-header-title">
          {isSpecial && (
            <span 
              className="source-color-dot" 
              style={{ backgroundColor: theme.color, boxShadow: `0 0 8px ${theme.color}` }}
            />
          )}

          {isEditing ? (
            <div className="title-edit-wrapper" onClick={(e) => e.stopPropagation()}>
              <input 
                type="text" 
                className="title-edit-input" 
                value={editVal}
                onChange={(e) => setEditVal(e.target.value)}
                onBlur={handleSaveTitle}
                onKeyDown={handleKeyDown}
                autoFocus
                maxLength={20}
              />
              <button className="title-save-btn" onClick={handleSaveTitle}>
                <Check size={12} />
              </button>
            </div>
          ) : (
            <span 
              className="column-title-text"
              style={isSpecial ? { color: theme.color, fontWeight: 700 } : {}}
              onClick={() => setIsEditing(true)}
              title="點擊自定義名稱"
            >
              <span className="title-text-content">{title}</span>
              <Edit2 size={11} className="title-edit-icon" />
            </span>
          )}
        </span>
        <span 
          className="column-badge"
          style={isSpecial ? {
            backgroundColor: theme.badgeBg,
            color: theme.badgeText,
            border: `1px solid ${theme.border}`,
          } : {}}
        >
          {items.length} 人
        </span>
      </div>
      <div 
        className={`column-content column-content-${density}`} 
        ref={setNodeRef}
      >
        <SortableContext 
          id={id}
          items={items.map(i => i.id)} 
          strategy={rectSortingStrategy}
        >
          {items.map(person => (
            <SortableItem 
              key={person.id} 
              id={person.id} 
              person={person} 
              density={density}
              onDelete={onDeleteItem}
              onTogglePin={onTogglePin}
              categoryName={getCategoryName ? getCategoryName(person.sourceId) : null}
              categoryShortName={getCategoryShortName ? getCategoryShortName(person.sourceId) : null}
              isUnassigned={isSpecial}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
