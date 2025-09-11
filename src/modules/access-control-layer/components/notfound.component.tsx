import { NextPageWithLayout } from '@/types/common';
import InternalLayout from '@/layouts/internal-layout/internal-layout';
import Hyperlink from '@/components/hyperlink/hyperlink.component';
import ROUTES from '@/common/routes';
import PageHeader from '@/components/page-header/page-header.component';
import { LabelToolTip } from '@/components/tooltip';
import styles from '../styles/access-control-layer.module.scss';

const NotFoundPage: NextPageWithLayout = () => {
  return (
    <div className={styles.container}>
      <PageHeader
        title="404- Page Not Found"
        ActionComponent={() => <LabelToolTip label="Go To Dashboard" url={ROUTES.DASHBOARD} />}
      />
      <div className={styles.card}>
        <p className={styles.title}>404 Not Found</p>
        <p className={styles.subtitle}>Oops! The page you're looking for does not exist.</p>
        <p className={styles.reason}>The page may have been moved, deleted, or the URL may be incorrect.</p>

        <p className={styles.suggestionsTitle}>Possible reasons:</p>
        <ul className={styles.suggestionsList}>
          <li>The page was removed or renamed.</li>
          <li>The link you clicked may be broken.</li>
          <li>You may have typed the URL incorrectly.</li>
        </ul>

        <p className={styles.nextStepsTitle}>What you can do:</p>
        <ul className={styles.suggestionsList}>
          <li>Contact your Administrator if you think this is a mistake</li>
          <li>
            Go to <Hyperlink label="Dashboard" url={ROUTES.DASHBOARD} />
          </li>
        </ul>
      </div>
    </div>
  );
};

NotFoundPage.getLayout = page => (
  <InternalLayout
    head={{
      title: 'Page Not Found | RMN',
    }}
  >
    {page}
  </InternalLayout>
);

export default NotFoundPage;
