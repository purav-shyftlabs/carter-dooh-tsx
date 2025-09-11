import '@/styles/globals.css';
// import 'react-date-range/dist/styles.css'; // main style file
// import 'react-date-range/dist/theme/default.css'; // theme css file
// import 'react-time-picker/dist/TimePicker.css';
// import 'react-clock/dist/Clock.css';
// import '@/styles/canvas.scss';
// import 'reactflow/dist/style.css';
import React from 'react';
import Head from 'next/head';
import { Provider } from 'react-redux';
import { AppProps } from 'next/app';
import { CacheProvider, EmotionCache } from '@emotion/react';
import createEmotionCache from '@/common/emotion-cache';
import { useStore, initializeAuthState } from '@/redux/store';
import ErrorBoundary from '@/components/error-boundary/error-boundary.component';
import { NextPageWithLayout } from '@/types/common';
import ToastMessage from '@/components/toast-store-message/toast-store-message.component';
import AlertProvider from '@/contexts/alert/alert.provider';

const clientSideEmotionCache = createEmotionCache();

interface Props extends AppProps {
  Component: NextPageWithLayout;
  emotionCache?: EmotionCache;
}

const App = (props: Props) => {
  const { Component, emotionCache = clientSideEmotionCache, pageProps } = props;
  const getLayout = Component.getLayout || (page => page);
  const initialAuthState = initializeAuthState();
  const store = useStore({
    ...pageProps.initialReduxState, 
    ...initialAuthState,
  });

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
       <CacheProvider value={emotionCache}>
      <ErrorBoundary>
        <Provider store={store}>
          <AlertProvider>
            <ToastMessage />
            {getLayout(<Component {...pageProps} />)}
          </AlertProvider>
        </Provider>
      </ErrorBoundary>
    </CacheProvider>
    </>
  );
};

export default App;
