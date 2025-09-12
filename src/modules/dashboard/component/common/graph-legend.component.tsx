import { carterColors, Typography } from 'shyftlabs-dsl';
import styles from '../../styles/components/common/graph-legend.module.scss';

interface TGraphLegend {
  title: string;
  color: string;
}

const GraphLegend: React.FC<TGraphLegend> = props => {
  const { title, color: backgroundColor } = props;
  return (
    <div className={styles.container}>
      <div className={styles.icon} style={{ backgroundColor }} />
      <Typography color={carterColors['text-900']} fontSize='xs'>{title}</Typography>
    </div>
  );
};

export default GraphLegend;
