import { NextPageWithLayout } from '@/types/common';
import InternalLayout from '@/layouts/internal-layout/internal-layout';
import Hyperlink from '@/components/hyperlink/hyperlink.component';
import ROUTES from '@/common/routes';
import PageHeader from '@/components/page-header/page-header.component';
import { LabelToolTip } from '@/components/tooltip';
import styles from '../styles/access-control-layer.module.scss';

const ForbiddenPage: NextPageWithLayout = () => {
  return (
    <div className={styles.container}>
      <PageHeader
        title="403- Forbidden"
        ActionComponent={() => <LabelToolTip label="Go To Dashboard" url={ROUTES.DASHBOARD} />}
      />
      <div className={styles.card}>
        <p className={styles.title}>403 Forbidden</p>
        <p className={styles.subtitle}>Oops! You do not have permission to access this page.</p>
        <p className={styles.suggestionsTitle}>Possible reasons:</p>
        <ul className={styles.suggestionsList}>
          <li>Your account may not have the required permissions.</li>
          <li>The page may be restricted to certain users or roles.</li>
          <li>You may not be logged in with the correct credentials.</li>
        </ul>

        <p className={styles.nextStepsTitle}>What you can do:</p>
        <ul className={styles.suggestionsList}>
          <li>Contact your Administrator if you think this is a mistake</li>
          <li>
            <Hyperlink label="Login" url={ROUTES.AUTH.LOGOUT} /> with correct credentials
          </li>
          <li>
            Go to <Hyperlink label="Dashboard" url={ROUTES.DASHBOARD} />
          </li>
        </ul>
      </div>
    </div>
  );
};

ForbiddenPage.getLayout = page => (
  <InternalLayout
    head={{
      title: 'Forbidden | RMN',
    }}
  >
    {page}
  </InternalLayout>
);

export default ForbiddenPage;
