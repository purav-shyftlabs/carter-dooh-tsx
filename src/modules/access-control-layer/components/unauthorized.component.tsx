import { NextPageWithLayout } from '@/types/common';
import InternalLayout from '@/layouts/internal-layout/internal-layout';
import Hyperlink from '@/components/hyperlink/hyperlink.component';
import ROUTES from '@/common/routes';
import PageHeader from '@/components/page-header/page-header.component';
import { LabelToolTip } from '@/components/tooltip';
import styles from '../styles/access-control-layer.module.scss';

const UnauthorizedPage: NextPageWithLayout = () => {
  return (
    <div className={styles.container}>
      <PageHeader
        title="401- Unauthorized"
        ActionComponent={() => <LabelToolTip label="Go To Dashboard" url={ROUTES.DASHBOARD} />}
      />
      <div className={styles.card}>
        <p className={styles.title}>401 - Unauthorized</p>
        <p className={styles.subtitle}>Oops! You don’t have permission to view this page.</p>
        <p className={styles.suggestionsTitle}>Possible reasons:</p>
        <ul className={styles.suggestionsList}>
          <li>You may not be logged in.</li>
          <li>Your session may have expired.</li>
          <li>You do not have the required permissions to view this page.</li>
        </ul>

        <p className={styles.nextStepsTitle}>What you can do:</p>
        <ul className={styles.suggestionsList}>
          <li>Contact your Administrator if you think this is a mistake</li>
          <li>
            Go To <Hyperlink label="Dashboard" url={ROUTES.DASHBOARD} />
          </li>
        </ul>
      </div>
    </div>
  );
};

UnauthorizedPage.getLayout = page => (
  <InternalLayout
    head={{
      title: 'Unauthorized | RMN',
    }}
  >
    {page}
  </InternalLayout>
);

export default UnauthorizedPage;
