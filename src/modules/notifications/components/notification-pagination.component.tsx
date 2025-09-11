import { Button, Typography } from 'shyftlabs-dsl';
import { ChevronLeftIcon, ChevronsLeftIcon, ChevronRightIcon, ChevronsRightIcon, ChevronDownIcon } from '@/lib/icons';
import styles from '../styles/notification-pagination.module.scss';

interface INotificationPagination {
  hasPrevPage: boolean;
  hasNextPage: boolean;
  totalPage: number;
  pageNo: number;
  goToPage: (nextPage: number) => void;
}

const NotificationPagination: React.FC<INotificationPagination> = props => {
  const { hasNextPage, hasPrevPage, goToPage, totalPage, pageNo } = props;
  const pagesOptions = Array.from({ length: totalPage });

  const staticPageOptions = [
    {
      key: 'left-most',
      icon: ChevronsLeftIcon,
      disabled: !hasPrevPage,
      onClick: () => goToPage(1),
    },
    {
      key: 'previous',
      icon: ChevronLeftIcon,
      disabled: !hasPrevPage,
      onClick: () => goToPage(pageNo - 1),
    },
    {
      key: 'next',
      icon: ChevronRightIcon,
      onClick: () => goToPage(pageNo + 1),
      disabled: !hasNextPage,
    },
    {
      key: 'right-most',
      icon: ChevronsRightIcon,
      onClick: () => goToPage(totalPage),
      disabled: !hasNextPage,
    },
  ];

  return (
    <div className={styles.container}>
      <Typography>
        Page
        <div className={styles.page_selection}>
          <select value={pageNo} onChange={({ target }) => goToPage(Number(target.value))}>
            {pagesOptions.map((_item, index) => (
              <option key={index + 1}>{index + 1}</option>
            ))}
          </select>
          <ChevronDownIcon />
        </div>
        <span className={styles.page_info}>of {totalPage}</span>
      </Typography>
      <div className={styles.actions_container}>
        {staticPageOptions.map(item => (
          <Button
            key={item.key}
            icon={<item.icon />}
            size="small"
            variant="tertiary"
            disabled={item.disabled}
            onClick={item.onClick}
          />
        ))}
      </div>
    </div>
  );
};

export default NotificationPagination;
