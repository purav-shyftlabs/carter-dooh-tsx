import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Monitor, Wifi, WifiOff, Clock } from 'lucide-react';
import type { Screen } from '@/types/screens';
import ROUTES from '@/common/routes';
import styles from '../styles/screens-card-view.module.scss';

type CardScreen = Screen;

type IScreensCardViewProps = {
  screens: CardScreen[];
  loading: boolean;
  pageNo: number;
  pageSize: number;
  totalCount: number;
  onPaginationChange: (pageNo: number, pageSize: number) => void;
};

// Card view component
const ScreenCard: React.FC<{ screen: CardScreen }> = ({ screen }) => {
  const router = useRouter();
  const status = String(screen.status || '').toLowerCase();
  
  let statusBgColor, statusColor;
  if (status === 'active' || status === 'paired') {
    statusBgColor = '#E8F5E9';
    statusColor = '#2E7D32';
  } else if (status === 'inactive') {
    statusBgColor = '#FFEBEE';
    statusColor = '#C62828';
  } else if (status === 'maintenance') {
    statusBgColor = '#FFF3E0';
    statusColor = '#E65100';
  } else {
    statusBgColor = '#F5F5F5';
    statusColor = '#666';
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Never';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch {
      return 'Invalid date';
    }
  };

  return (
    <div
      className={styles.screenCard}
      onClick={() => {
        router.push(`${ROUTES.BILLBOARD.LIST}/${screen.id}`);
      }}
    >
      <div className={styles.cardHeader}>
        <div className={styles.iconContainer}>
          <Monitor size={24} />
        </div>
        <div className={styles.statusBadge} style={{ backgroundColor: statusBgColor, color: statusColor }}>
          {screen.status || 'Unknown'}
        </div>
      </div>

      <div className={styles.cardBody}>
        <h3 className={styles.screenName}>{screen.name}</h3>
        <p className={styles.deviceName}>{screen.deviceName || screen.name}</p>

        <div className={styles.infoRow}>
          <span className={styles.label}>MAC Address:</span>
          <span className={styles.value}>{screen.macAddress || 'N/A'}</span>
        </div>

        <div className={styles.infoRow}>
          <span className={styles.label}>Online:</span>
          <span className={`${styles.onlineStatus} ${screen.isOnline ? styles.online : styles.offline}`}>
            {screen.isOnline ? (
              <>
                <Wifi size={14} />
                <span>Online</span>
              </>
            ) : (
              <>
                <WifiOff size={14} />
                <span>Offline</span>
              </>
            )}
          </span>
        </div>

        {screen.lastSeenAt && (
          <div className={styles.infoRow}>
            <span className={styles.label}>
              <Clock size={14} />
              Last Seen:
            </span>
            <span className={styles.value}>{formatDate(screen.lastSeenAt)}</span>
          </div>
        )}
      </div>

      <div className={styles.cardFooter}>
        <span className={styles.createdDate}>Created: {formatDate(screen.createdAt)}</span>
      </div>
    </div>
  );
};

const ScreensCardView: React.FC<IScreensCardViewProps> = ({
  screens,
  loading,
  pageNo,
  pageSize,
  totalCount,
  onPaginationChange,
}) => {
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        Loading screens...
      </div>
    );
  }

  if (screens.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <h3>No Screens Yet</h3>
        <p>Click + Add Screen to pair a new screen</p>
      </div>
    );
  }

  const totalPages = Math.ceil(totalCount / pageSize);
  const startItem = (pageNo - 1) * pageSize + 1;
  const endItem = Math.min(pageNo * pageSize, totalCount);

  return (
    <>
      <div className={styles.cardsGrid}>
        {screens.map((screen: CardScreen) => (
          <ScreenCard key={screen.id} screen={screen} />
        ))}
      </div>

      {/* Simple pagination for grid view */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            onClick={() => onPaginationChange(pageNo - 1, pageSize)}
            disabled={pageNo === 1}
            className={styles.paginationButton}
          >
            Previous
          </button>
          <span className={styles.paginationInfo}>
            Showing {startItem}-{endItem} of {totalCount}
          </span>
          <button
            onClick={() => onPaginationChange(pageNo + 1, pageSize)}
            disabled={pageNo >= totalPages}
            className={styles.paginationButton}
          >
            Next
          </button>
        </div>
      )}
    </>
  );
};

export default ScreensCardView;

