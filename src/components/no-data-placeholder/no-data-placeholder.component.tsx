import Image from 'next/image';
import { Typography } from 'shyftlabs-dsl';
import EmptyListImage from '@/assets/images/empty-list.svg';
import styles from './no-data-placeholder.module.scss';

interface INoDataPlaceholder {
  title?: string;
  description?: string;
  className?: string;
}

const NoDataPlaceholder: React.FC<INoDataPlaceholder> = props => {
  const { className = '', title = 'No Data Found', description = 'Please try again later' } = props;
  return (
    <div className={`${styles.empty_creative_container} ${className}`}>
      <Image src={EmptyListImage} alt="Empty List Image" />
      <Typography fontFamily="Roboto" variant="body-semibold">{title} </Typography>
      <Typography fontFamily="Roboto" variant="caption-regular">{description}</Typography>
    </div>
  );
};

export default NoDataPlaceholder;
