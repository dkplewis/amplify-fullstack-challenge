import { useEffect, useContext, useState } from 'react';
import { useRouter } from 'next/router'
//import { getSelectorsByUserAgent } from 'react-device-detect';
import { dehydrate, QueryClient, useQuery } from '@tanstack/react-query'
import DataLoadError from '@/components/display/DataLoadError';
import Loading from '@/components/display/Loading';
import { StoreContext } from '@/store/store';
import { getLocationDataAndTenant } from '@/utils/crud';

export const getServerSideProps = async ({ req }) => {

  const queryClient = new QueryClient();

  const TENANT_ID = "CHALLENGEAPP";

  /* This doesn't work yet. See:
   * https://github.com/aws-amplify/amplify-hosting/issues/2800
   * https://github.com/aws-amplify/amplify-hosting/issues/3322

  const isMobile = req.headers["user-agent"] == "Amazon CloudFront" ?
    req.headers["cloudfront-is-mobile-viewer"]
  :
    getSelectorsByUserAgent(req.headers["user-agent"])?.isMobile;
  */ 

  let returnObject = {
    props: {}
  };

  try {

    returnObject.props["currentLocation"] = [];

    await queryClient.prefetchQuery({
      queryKey: ["locationAndTenant", TENANT_ID],
      queryFn: ({ queryKey }) => getLocationDataAndTenant(queryKey[1])
    });

    returnObject.props["dehydratedState"] = dehydrate(queryClient);
    returnObject.props["tenantId"] = TENANT_ID;

  } catch (err) {

    if (typeof err == "string" && err.indexOf("No current user") === -1) console.error(err);

    if (typeof err == "string" && err.indexOf("The user is not authenticated") !== -1) {

      return {
        redirect: {
          destination: "/",
          permanent: false,
        },
      };
  
    }

  }
  
  return returnObject;

};

const Home = ({ tenantId }) => {

  const [userTenantId, setUserTenantId] = useState(null);

  const router = useRouter();

  const { setCurrentTopNavLocation } = useContext(StoreContext);

  const { isPending, isError, isSuccess, data, error } = useQuery({
    queryKey: ["locationAndTenant", userTenantId],
    queryFn: ({ queryKey }) => getLocationDataAndTenant(queryKey[1]),
    enabled: !!userTenantId
  });

  useEffect(() => {

    if (isSuccess) {

      const defaultTopNavLocation = data.topNavLocations?.find(topNavLocation => topNavLocation.DEFAULT_LOCATION) || null;
      let newTopNavLocation = "tnl";
      if (defaultTopNavLocation) {

        newTopNavLocation = defaultTopNavLocation.ENTITY_TYPE_ID.replace("LOCATION#", "");

      }
      setCurrentTopNavLocation(newTopNavLocation);

    }

  }, [isSuccess, data, setCurrentTopNavLocation]);

  useEffect(() => {

    setUserTenantId(tenantId);

  }, []);

  if (isPending) return <Loading />;
 
  if (isError) return <DataLoadError dataLoadError={error.message} />;

  if (isSuccess) {

    const defaultTopNavLocation = data.topNavLocations?.find(topNavLocation => topNavLocation.DEFAULT_LOCATION) || null;
    let newTopNavLocation = "tnl";
    if (defaultTopNavLocation) {

      newTopNavLocation = defaultTopNavLocation.ENTITY_TYPE_ID.replace("LOCATION#", "");

    }

    const rootLocationId = data.rootLocation.ENTITY_TYPE_ID.replace("LOCATION#", "");
    const currentSite = data.locations.find(location => location.GSI2_PK == "TYPE#SITE" && location.DEFAULT_LOCATION);

    let theRoute;

    const rootUrl = "/installation/" + rootLocationId + "/" + newTopNavLocation + "/";

    if (currentSite) {

      theRoute = rootUrl + currentSite.GSI2_PK.replace("TYPE#", "").toLowerCase() + "/" +
        currentSite.ENTITY_TYPE_ID.replace("LOCATION#", "");
    
    } else {

      theRoute = rootUrl + "site/" + rootLocationId;

    }

    router.push(theRoute);
  
    return <Loading />;

  }
  
}

export default Home;