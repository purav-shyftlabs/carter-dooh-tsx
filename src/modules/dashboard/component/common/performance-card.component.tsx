import { carterColors, Typography } from 'shyftlabs-dsl';
import { ArrowUp } from '@/lib/icons';
import { Skeleton } from '@/lib/material-ui';
import styles from '../../styles/components/common/performance-card.module.scss';

interface IPerformanceCard {
  title: string | React.ReactNode;
  loading?: boolean;
  value?: string | number;
  growthPercentage?: number;
  active?: boolean;
  activeClass?: string;
  onClick?: () => void;
}

const PerformanceCard: React.FC<IPerformanceCard> = props => {
  const { active, activeClass, loading, title, value, growthPercentage = 0, onClick } = props;
  console.log(active, 'active');
  // if (loading) {
  //   return (
  //     <div className={styles.container}>
  //       <div className={styles.info_container}>
  //         <Skeleton width={'50%'} />
  //         <Skeleton width={'80%'} height={30} />
  //       </div>
  //       <div className={styles.fluctuation_container}>
  //         <Skeleton width={20} variant="circular" />
  //         <Skeleton width={'30%'} style={{ marginLeft: '4px' }} />
  //       </div>
  //     </div>
  //   );
  // }

  const mode = growthPercentage > 0 ? 'growth' : growthPercentage < 0 ? 'shrink' : 'none';
  const textColor =
    growthPercentage > 0
      ? carterColors['green-700']
      : growthPercentage < 0
      ? carterColors['red-700']
      : carterColors['text-800'];

  return (
    <button
      className={!activeClass ? styles.container : `${styles.container} ${styles[activeClass]}`}
      onClick={onClick}
      data-active={active}
    >
      <div className={styles.info_container}>
        <Typography variant="caption-semibold" color={carterColors['text-800']}>
          {title}
        </Typography>
        <Typography variant="subtitle-semibold" color={carterColors['text-900']}>
          {value}
        </Typography>
      </div>
      <div className={styles.fluctuation_container} data-mode={mode}>
        {growthPercentage !== 0 && <ArrowUp size={14} />}
        <Typography variant="body-medium" color={textColor}>
          {`${Math.abs(growthPercentage).toFixed(2)}%`}
        </Typography>
      </div>
    </button>
  );
};

export default PerformanceCard;
