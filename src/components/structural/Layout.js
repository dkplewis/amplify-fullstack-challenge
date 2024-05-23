import { cloneElement } from 'react';
import PropTypes from 'prop-types';
import { View } from '@aws-amplify/ui-react';
//import { isMobile } from 'react-device-detect';
import { useQuery } from '@tanstack/react-query';
import DataLoadError from '@/components/display/DataLoadError';
import Header from '@/components/structural/Header';
import { getLocationDataAndTenant } from '@/utils/crud';

import styles from '@/component-styles/structural/Layout.module.css';
import genericStyles from '@/page-styles/Generic.module.css';

const isMobile = false;

const Layout = ({ currentLocation, setLoading, townNameHandler, children }) => {

  const { isPending, isError, isSuccess, data, error } = useQuery({
    queryKey: ["locationAndTenant"],
    queryFn: ({ queryKey }) => getLocationDataAndTenant(queryKey[1])
  });

  if (isError) return <View className={isMobile ? "isMobile" : "isDesktop"}>
    <View as="main" className={isMobile ? styles.mMain : styles.dMain}>
      <DataLoadError dataLoadError={error.message} />
    </View>
  </View>;

  return <View className="isDesktop">
    { data?.tenantData?.config?.header && <Header type="desktop" rootLocation={data.rootLocation}
      topNavLocations={data.topNavLocations} locations={data.locations}
      currentLocation={currentLocation} tenantHeaderConfig={data.tenantData?.config?.header || null}
      resourcesConfig={data.tenantData?.config?.resources || null}
      setTownName={townNameHandler} /> }
    <View as="main" className={styles.dMain}>
      { cloneElement(children, { setLoading: setLoading }) }
    </View>
  </View>;

}

export default Layout;

Layout.propTypes = {
  setLoading: PropTypes.func,
  currentLocation: PropTypes.arrayOf(PropTypes.string),
  children: PropTypes.object
};