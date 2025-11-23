import React, { useState } from 'react';
import BuffaloMindmap from './BuffaloMindmap';

function addYears(date: Date, years: number) {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return d;
}

function formatYM(date: Date) {
  return date.toLocaleString('en-US', { month: 'short' }) + '-' + date.getFullYear();
}

function countTotalBuffalos(node: any): number {
  let count = 1; // Count the current node
  if (node.children && node.children.length > 0) {
    for (const child of node.children) {
      count += countTotalBuffalos(child);
    }
  }
  return count;
}

function generateBuffalo(name: string, bornDate: Date, windowStart: Date, windowEnd: Date) {
  const milkStart = addYears(bornDate, 3); // lactation starts 3 yrs after birth

  const node: any = {
    name,
    born: formatYM(bornDate),
    milkStarts: formatYM(milkStart),
    children: [],
  };

  // No children if milkStart is after projection window
  if (milkStart > windowEnd) {
    node.totalChildren = 0;
    return node;
  }

  let childBirthYear = milkStart.getFullYear();
  const windowEndYear = windowEnd.getFullYear();

  let childIndex = 1;
  let childBirthDate = new Date(milkStart);
  const maxChildren = 10; // Maximum number of children per buffalo

  while (childBirthYear <= windowEndYear && childIndex <= maxChildren) {
    const childName = `${name}${childIndex}`;

    const childNode = generateBuffalo(childName, new Date(childBirthDate), windowStart, windowEnd);

    node.children.push(childNode);

    // next birth after 1 year
    childBirthDate.setFullYear(childBirthDate.getFullYear() + 1);
    childBirthYear++;

    childIndex++;
  }

  node.totalChildren = node.children.length;
  return node;
}

const BuffaloNode: React.FC<{ node: any; level?: number }> = ({ node, level = 0 }) => {
  const [open, setOpen] = useState(level < 1); // root expanded
  return (
    <div style={{ marginLeft: level * 16, marginTop: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {node.children && node.children.length > 0 && (
          <button onClick={() => setOpen(!open)} style={{ width: 22, height: 22, borderRadius: 4 }}>
            {open ? '-' : '+'}
          </button>
        )}
        <div style={{ fontWeight: 700 }}>{node.name}</div>
        <div style={{ marginLeft: 8, color: '#6b7280' }}>born: {node.born}</div>
        <div style={{ marginLeft: 8, color: '#6b7280' }}>milk: {node.milkStarts}</div>
        <div style={{ marginLeft: 8, color: '#10b981' }}>children: {node.totalChildren}</div>
      </div>
      {open && node.children && node.children.length > 0 && (
        <div style={{ marginTop: 6 }}>
          {node.children.map((c: any, idx: number) => (
            <BuffaloNode key={idx} node={c} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

const BuffaloTree: React.FC = () => {
  // Default inputs from the original algorithm
  const parentName = 'A';
  const born = '2023-01-01';
  const bornDate = new Date(born);

  const milkStart = addYears(bornDate, 3); // Jan 2026
  const windowStart = milkStart;
  const windowEnd = addYears(windowStart, 10); // Jan 2036

  const tree = generateBuffalo(parentName, bornDate, windowStart, windowEnd);
  const totalBuffalos = countTotalBuffalos(tree);

  const [view, setView] = useState<'list' | 'mindmap'>('list');

  return (
    <div>
      {/* Summary Card */}
      <div style={{ 
        padding: '1.5rem', 
        background: '#fff', 
        borderRadius: '12px', 
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        textAlign: 'center',
        border: '1px solid #e5e7eb',
        marginBottom: '1rem'
      }}>
        <h3 style={{ 
          margin: '0 0 1rem 0', 
          fontSize: '1.25rem', 
          fontWeight: '600', 
          color: '#111' 
        }}>
          Buffalo Family Tree Summary
        </h3>
        <div style={{ 
          fontSize: '2.5rem', 
          fontWeight: '700', 
          color: '#2563eb',
          marginBottom: '0.5rem'
        }}>
          {totalBuffalos}
        </div>
        <p style={{ 
          margin: 0, 
          fontSize: '1rem', 
          color: '#6b7280' 
        }}>
          Total Buffalos in Family Tree
        </p>
        <div style={{ 
          marginTop: '0.75rem', 
          fontSize: '0.875rem', 
          color: '#9ca3af' 
        }}>
          Projection Period: {formatYM(windowStart)} to {formatYM(windowEnd)}
        </div>
      </div>

      {/* View Toggle Buttons */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button 
          onClick={() => setView('list')} 
          style={{ 
            padding: '6px 10px', 
            borderRadius: 6, 
            background: view === 'list' ? '#2563eb' : '#eef2ff', 
            color: view === 'list' ? '#fff' : '#111',
            border: 'none',
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          List View
        </button>
        <button 
          onClick={() => setView('mindmap')} 
          style={{ 
            padding: '6px 10px', 
            borderRadius: 6, 
            background: view === 'mindmap' ? '#2563eb' : '#eef2ff', 
            color: view === 'mindmap' ? '#fff' : '#111',
            border: 'none',
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          Mindmap View
        </button>
      </div>

      {/* Tree Views */}
      {view === 'list' ? (
        <div style={{ padding: 12, background: '#fff', borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <BuffaloNode node={tree} level={0} />
        </div>
      ) : (
        <BuffaloMindmap rootNode={tree} />
      )}
    </div>
  );
};

export default BuffaloTree;
