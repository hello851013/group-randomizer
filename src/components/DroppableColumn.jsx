import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { SortableItem } from './SortableItem';
import { getCategoryTheme, getDensity } from '../theme';

export function DroppableColumn({ id, title, items, onDeleteItem, onTogglePin, isSpecial }) {
  const { setNodeRef } = useDroppable({
    id: id,
  });

  const theme = isSpecial ? getCategoryTheme(id) : null;
  const density = getDensity(items.length);
  // Source columns split into 2 equal columns (左右分欄) whenever there are 2+ items to eliminate scrolling
  const isSplitGrid = isSpecial && items.length >= 2;

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
          <span style={isSpecial ? { color: theme.color, fontWeight: 700 } : {}}>{title}</span>
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
        className={`column-content column-content-${density} ${isSplitGrid ? 'split-2col' : ''}`} 
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
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
