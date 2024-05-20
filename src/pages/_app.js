import { useState, useEffect } from 'react';
import { Amplify } from 'aws-amplify';
import { Authenticator, Image, View } from '@aws-amplify/ui-react';
import Head from 'next/head';
import Error from 'next/error';
import { useRouter } from 'next/router';
import { HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import Layout from '@/components/structural/Layout';

import '@aws-amplify/ui-react/styles.css';
import '@fontsource/inter/variable.css';
import 'react-responsive-modal/styles.css';
import '@/styles/globals.css';

import outputs from '@/aws-outputs/amplify_outputs.json';

Amplify.configure(outputs, {
  ssr: true
});

const ChallengeApp = ({ Component, pageProps }) => {

  const [siteName, setSiteName] = useState("");
  const [ queryClient ] = useState(() => {
    return new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60000,
          gcTime: 1000 * 60 * 60 * 24
        }
      }
    })
  });
  const persister = createSyncStoragePersister({
    storage: typeof window !== "undefined" ? window.localStorage : undefined
  });

  const router = useRouter();

  useEffect(() => {

    const onRouteChangeStart = (url) => {

      document.body.style.cursor = "wait";

    }

    // Delay changing the site name until the router transition has finished, to avoid
    // displaying the wrong site name for the displayed data.
    const onRouteChangeComplete = (url) => {

      setSiteName(pageProps.currentSiteName);
      document.body.style.cursor = "auto";

    }

    router.events.on('routeChangeStart', onRouteChangeStart);
    router.events.on('routeChangeComplete', onRouteChangeComplete);
 
    return () => {

      router.events.off('routeChangeStart', onRouteChangeStart);
      router.events.off('routeChangeComplete', onRouteChangeComplete);

    }

  }, [router]);
  
  return (<>
    <Head>
      <title>Gardin</title>
      <meta name="description" content="Dev Community AWS Amplify Fullstack TypeScript Challenge app by David Lewis" />
      <meta name="viewport" content="viewport-fit=cover, user-scalable=no, width=device-width, initial-scale=1, maximum-scale=1" />
    </Head>
    <Authenticator variation="modal">
      { ({ signOut, user}) => 
        <PersistQueryClientProvider client={queryClient} persistOptions={{persister}}>
          <HydrationBoundary state={pageProps?.dehydratedState}>
            { pageProps?.errorCode ?
              <Error statusCode={pageProps?.errorCode} title={pageProps?.errorMessage} />
            :
              <Layout {...pageProps} siteNameHandler={setSiteName}
              >
                <Component {...pageProps} siteName={siteName}/>
              </Layout>
            }
          </HydrationBoundary>
        </PersistQueryClientProvider>
        }
    </Authenticator>
  </>);

}

export default GardinApp;
