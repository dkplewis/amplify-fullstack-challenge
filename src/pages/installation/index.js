import { useContext, useEffect } from 'react';
import { Loader, View } from '@aws-amplify/ui-react';
import { useRouter } from 'next/router'
//import { getSelectorsByUserAgent } from 'react-device-detect';
import { dehydrate, QueryClient, useQuery } from '@tanstack/react-query'
import DataLoadError from '@/components/display/DataLoadError';
import { StoreContext } from '@/store/store';
import { getLocationData, getLocationDataAndTenant } from '@/utils/crud';

import styles from '@/component-styles/Locations.module.css';

export const getServerSideProps = async ({ req, params, query }) => {

  const queryClient = new QueryClient();

  /* This doesn't work yet. See:
   * https://github.com/aws-amplify/amplify-hosting/issues/2800
   * https://github.com/aws-amplify/amplify-hosting/issues/3322

  const isMobile = req.headers["user-agent"] == "Amazon CloudFront" ?
    req.headers["cloudfront-is-mobile-viewer"]
  :
    getSelectorsByUserAgent(req.headers["user-agent"])?.isMobile;
  */ 

  try {

    let returnObject = {
      props: {}
    };

    returnObject.props["currentLocation"] = [];

    // Get the location data for the requested tenant, if the user has access, 
    // or the Standard user"s tenant
    let tenantId = null;

    tenantId = "GTDEMOAPP";
    returnObject.props["tenantId"] = tenantId;

    const locations = await getLocationData(tenantId);

    if (locations?.rootLocation) {

      returnObject.props["enableSL"] = false;

    }

    await queryClient.prefetchQuery({
      queryKey: ["locationAndTenant", tenantId],
      queryFn: ({ queryKey }) => getLocationDataAndTenant(queryKey[1])
    });

    returnObject.props["dehydratedState"] = dehydrate(queryClient);

    return returnObject;

  } catch (err) {

    if (typeof err == "string" && err.indexOf("not authenticated") !== -1) {

      return {
        redirect: {
          destination: "/",
          permanent: false,
        },
      };

    }

    return {
      props: {
        errorCode: 500,
        errorMessage: (err.message.indexOf("401") != -1 ? 
          "The app isn't allowed to use the data API right now."
        :
          err.message)
      }
    };

  }
  
};

const Installation = ({ tenantId, tId }) => {

  const { currentTopNavLocation, setCurrentTopNavLocation, setAnimation } = useContext(StoreContext);

  const router = useRouter();

  const { isPending, isError, isSuccess, data, error } = useQuery({
    queryKey: ["locationAndTenant", tenantId],
    queryFn: ({ queryKey }) => getLocationDataAndTenant(queryKey[1])
  });

  useEffect(() => {

    setAnimation("none");

    if (isSuccess) {

      let newTopNavLocation = "country";
      if (!currentTopNavLocation || currentTopNavLocation == "country") {

        const defaultTopNavLocation = data.topNavLocations?.find(topNavLocation => topNavLocation.defaultLocation) || null;
        if (defaultTopNavLocation) {

          newTopNavLocation = defaultTopNavLocation.entityTypeId.replace("LOCATION#", "");

        }
        setCurrentTopNavLocation(newTopNavLocation);

      }

    }

  }, [isSuccess]);

  if (isPending) return <View className={styles.loadingContainer}>
    <Loader size="large" emptyColor="#F2F2F7" filledColor="#89BC2B" />
  </View>;

  if (isError) <DataLoadError dataLoadError={error.message} />;

  if (isSuccess) {

    let newTopNavLocation = "country";
    if (!currentTopNavLocation || currentTopNavLocation == "country") {

      const defaultTopNavLocation = data.topNavLocations?.find(topNavLocation => topNavLocation.defaultLocation) || null;
      if (defaultTopNavLocation) {

        newTopNavLocation = defaultTopNavLocation.entityTypeId.replace("LOCATION#", "");

      }

    }

    const rootLocationId = data.rootLocation.entityTypeId.replace("LOCATION#", "");
    let theRoute = "";

    let topNavLocationPathLen = 0;
    let childLocationsForTopNavLocation = [];
    const currentTopNavLocationData = data.topNavLocations
      .find(topNavLocation => topNavLocation.entityTypeId == `LOCATION#${currentTopNavLocation}`);
    if (currentTopNavLocationData) {

      topNavLocationPathLen = currentTopNavLocationData.path.split("#").length;
      childLocationsForTopNavLocation = data.locations
        .filter((location) => location.path.startsWith(currentTopNavLocationData.path + "#") &&
          location.path.split("#").length == topNavLocationPathLen + 1);

    }

    let currentTown;
    if (currentTopNavLocationData) {

      currentTown = childLocationsForTopNavLocation.length > 1 ?
        currentTopNavLocationData
      :
        childLocationsForTopNavLocation.find(location => location.defaultLocation);

    } else {

      currentTown = data.locations.find(location => location.defaultLocation);

    }

    if (currentTown) {

      theRoute = `/installation/${rootLocationId}/${currentTopNavLocation || newTopNavLocation}${
        (childLocationsForTopNavLocation.length > 1 ? 
          data.tenantData.config.header[currentTown.locationHeaderKey].childPath
        :
          "/" + currentTown.gsi2Pk.replace("TYPE#", "").toLowerCase()) +
        "/" + 
        (childLocationsForTopNavLocation.length > 1 ? 
          currentTopNavLocation
        :
          currentTown.entityTypeId.replace("LOCATION#", ""))
      }`;

    } else {

      theRoute = `/installation/${rootLocationId}/${currentTopNavLocation || newTopNavLocation}/town/${rootLocationId}`;

    }

    router.push(theRoute);
 
    return <View className={styles.loadingContainer}>
      <Loader size="large" emptyColor="#F2F2F7" filledColor="#89BC2B" />
    </View>;

  }

}

export default Installation;