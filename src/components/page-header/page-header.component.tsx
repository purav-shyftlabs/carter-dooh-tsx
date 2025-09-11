import { useRouter } from 'next/router';
import { Maybe } from 'types';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { carterColors, Tooltip, Typography } from 'shyftlabs-dsl';
import Link from 'next/link';
import { Breadcrumbs, Skeleton } from '@/lib/material-ui';
import { truncateString } from '@/common/helpers';
import styles from './page-header.module.scss';

interface PageHeaderProps {
  title?: React.ReactNode;
  backUrl?: string;
  isLoading?: boolean;
  showBackButton?: boolean;
  breadcrumbs?: { url?: string; label: Maybe<string> }[];
  ActionComponent?: React.ComponentType;
  onPressBackButton?: () => void;
  testId?: string;
}

const PageHeaderLink = ({ label, url }: { label: string; url?: string }) => {
  return (
    <Tooltip title={label.length > 30 ? label : undefined}>
      {url ? (
        <Link href={url}>
          <Typography color={carterColors['links-blue']} variant="caption-medium">
            {truncateString(label)}
          </Typography>
        </Link>
      ) : (
        <Typography color={carterColors['text-800']} variant="caption-regular">
          {truncateString(label)}
        </Typography>
      )}
    </Tooltip>
  );
};

const PageHeader: React.FC<PageHeaderProps> = props => {
  const { isLoading, title, onPressBackButton, backUrl, showBackButton, breadcrumbs, ActionComponent, testId } = props;

  const router = useRouter();

  const handleBackIconClick = () => {
    if (onPressBackButton) {
      onPressBackButton();
    } else {
      if (backUrl) {
        router.replace(backUrl);
        return;
      }
      router.back();
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header_container}>
        {showBackButton && (
          <button className={styles.back_button} type="button" data-testid="back-button" onClick={handleBackIconClick}>
            <ChevronLeft color={carterColors['brand-600']} height={24} />
          </button>
        )}
        <div>
          {isLoading ? (
            <Skeleton width={150} />
          ) : (
            <Typography variant="body-large-semibold" color={carterColors['text-900']} data-testid={testId}>
              {title}
            </Typography>
          )}

          {!!breadcrumbs?.length && (
            <Breadcrumbs
              aria-label="breadcrumb"
              separator={<ChevronRight height={16} width={16} color={carterColors['text-500']} />}
              className={`${styles.breadcrumbs_container}`}
            >
              {breadcrumbs.map(item =>
                isLoading ? <Skeleton width={50} /> : <PageHeaderLink label={item.label as string} url={item.url} />,
              )}
            </Breadcrumbs>
          )}
        </div>
      </div>
      {ActionComponent && <ActionComponent />}
    </div>
  );
};

export default PageHeader;
