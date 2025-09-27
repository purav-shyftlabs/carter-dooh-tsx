import React from 'react';
import { BreadcrumbItem } from '@/types/folder';
import styles from '../styles/breadcrumb.module.scss';

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  onNavigate: (item: BreadcrumbItem) => void;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, onNavigate }) => {
  const handleClick = (item: BreadcrumbItem, event: React.MouseEvent) => {
    event.preventDefault();
    onNavigate(item);
  };

  return (
    <nav className={styles.breadcrumb} aria-label="Breadcrumb">
      <ol className={styles.list}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={item.id || 'root'} className={styles.item}>
              {index > 0 && <span className={styles.separator}>/</span>}
              {isLast ? (
                <span className={styles.current} aria-current="page">
                  {item.name}
                </span>
              ) : (
                <button
                  className={styles.link}
                  onClick={(e) => handleClick(item, e)}
                  type="button"
                >
                  {item.name}
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
