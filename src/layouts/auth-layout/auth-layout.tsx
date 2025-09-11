import { PropsWithChildren } from 'react';
import Head from 'next/head';
import styles from './auth-layout.module.scss';

interface IAuthLayout {
  bodyClassName?: string;
  head?: Partial<{
    title: string;
    description: string;
  }>;
}

const AuthLayout: React.FC<PropsWithChildren<IAuthLayout>> = props => {
  const { children, head } = props;
  return (
    <div>
      <Head>
        <title>{head?.title || 'RMN Auth'}</title>
        <meta name="description" content={head?.description || 'RMN Auth'} />
      </Head>
     <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.authBody}>{children}</div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
