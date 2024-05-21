import { useMemo } from 'react';
import PropTypes from 'prop-types';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Image, Link as AmplifyLink, Text, View } from '@aws-amplify/ui-react';
import UserAuth from '@/components/widgets/UserAuth';

import { MdElectricCar } from 'react-icons/md';

import styles from '@/component-styles/structural/Header.module.css';

const Header = (props) => {

  const { tId, type, tenantHeaderConfig, rootLocation, topNavLocations, locations,
    currentLocation, alertsViewOnly, resourcesConfig } = props;

  const router = useRouter();
  const currentRoute = router.asPath;

  const topNavLocation = useMemo(() => topNavLocations.find(tnl => tnl.ENTITY_TYPE_ID == "LOCATION#" + currentLocation[1]), [topNavLocations, currentLocation]);

  const defaultLocation = useMemo(() => {

    const childLocationsForTopNav = (!topNavLocation || locations.length == 0) ?
      []
    :
      locations.filter((location) => location.PATH.startsWith(topNavLocation.PATH + "#") &&
        location.PATH.split("#").length == topNavLocation.PATH.split("#").length + 1);

    return childLocationsForTopNav.length > 0 ?
      childLocationsForTopNav.find((location) => location.DEFAULT_LOCATION)
    :
      locations.find(location => location.DEFAULT_LOCATION);

  }, [topNavLocation, locations]);

  return tenantHeaderConfig && <header className={styles.dHeaderContainer}>
    <Link href={"/installation/" +
      rootLocation.ENTITY_TYPE_ID.replace("LOCATION#", "") + 
      "/" +
      currentLocation[1] +
      (topNavLocation && tenantHeaderConfig[topNavLocation.LOCATION_HEADER_KEY]?.childPath ? 
        tenantHeaderConfig[topNavLocation.LOCATION_HEADER_KEY || ""]?.childPath || ""
      : defaultLocation ?
        "/" + (defaultLocation?.GSI2_PK || "").replace("TYPE#", "").toLowerCase()
      :
        "/town"
      ) +
      "/" +
      (topNavLocation && tenantHeaderConfig[topNavLocation.LOCATION_HEADER_KEY]?.childPath ? 
        topNavLocation.ENTITY_TYPE_ID.replace("LOCATION#", "")
      : defaultLocation ?
        defaultLocation.ENTITY_TYPE_ID.replace("LOCATION#", "")
      :
        rootLocation.ENTITY_TYPE_ID.replace("LOCATION#", "")
      )
    } className={styles.dLogoLink}>
      <MdElectricCar size={24} />
      <View className={styles.logoText}>ChargeNG</View>
    </Link>
    <View className={styles.dHeader}>
      { !alertsViewOnly && <>
        <Link href={"/installation/" + 
          rootLocation.ENTITY_TYPE_ID.replace("LOCATION#", "") + 
          "/" +
          currentLocation[1] +
          (topNavLocation && tenantHeaderConfig[topNavLocation.LOCATION_HEADER_KEY]?.childPath ? 
            tenantHeaderConfig[topNavLocation.LOCATION_HEADER_KEY || ""]?.childPath || ""
          : defaultLocation ?
            "/" + (defaultLocation?.GSI2_PK || "").replace("TYPE#", "").toLowerCase()
          :
            "/town"
          ) +
          "/" +
          (topNavLocation && tenantHeaderConfig[topNavLocation.LOCATION_HEADER_KEY]?.childPath ? 
            topNavLocation.ENTITY_TYPE_ID.replace("LOCATION#", "")
          : defaultLocation ?
            defaultLocation.ENTITY_TYPE_ID.replace("LOCATION#", "")
          :
            rootLocation.ENTITY_TYPE_ID.replace("LOCATION#", "")
          )
        } passHref className={`headerNav ${currentRoute.startsWith("/installation/") && currentRoute.indexOf("/areas") === -1 ? styles.dActive : styles.dLink}`}>
          { tenantHeaderConfig && <>
            <Image className={`headerNavImg ${styles.linkAdjustImage}`}  
              src={`/images/${resourcesConfig}/${(
                currentRoute.startsWith("/installation/") && currentRoute.indexOf("/areas") === -1 ? 
                  tenantHeaderConfig.installation.activeIcon
              :
                  tenantHeaderConfig.installation.defaultIcon
              )}`}
              alt="" width={24} height={24} />
            <Image className={`headerNavHoverImg ${styles.linkAdjustImage}`}  
              src={`/images/${resourcesConfig}/${tenantHeaderConfig.installation.activeIcon}`}
              alt="" width={24} height={24} />
            <Text className={styles.linkText} as="span">
              {tenantHeaderConfig.installation.label}
            </Text>
          </> }
        </Link>
        <View className={styles.dSpacer}></View>
        <Link href={"/installation/" + 
          (currentLocation.length ?
            currentLocation.join("/") + "/areas"
          :
            null
          )
        } passHref className={`headerNav ${currentRoute.indexOf("/areas") !== -1 ? styles.dActive : styles.dLink}`}> 
          { tenantHeaderConfig && <>
            <Image className={`headerNavImg ${styles.linkAdjustImage}`}
              src={`/images/${resourcesConfig}/${(
                currentRoute.indexOf("/areas") !== -1 ?
                  tenantHeaderConfig.areas.activeIcon
                :
                  tenantHeaderConfig.areas.defaultIcon
              )}`}
              alt="" width={24} height={24} />
            <Image className={`headerNavHoverImg ${styles.linkAdjustImage}`}
              src={`/images/${resourcesConfig}/${tenantHeaderConfig.areas.activeIcon}`}
              alt="" width={24} height={24} />
            <Text className={styles.linkText} as="span">
              {tenantHeaderConfig.areas.label}
            </Text>
          </> }
        </Link>
      </>}
    </View>
    <UserAuth {...props}/>
  </header>;

}

export default Header;

Header.propTypes = {
  resourcesConfig: PropTypes.string,
  tenantHeaderConfig: PropTypes.object,
  rootLocation: PropTypes.object,
  topNavLocations: PropTypes.arrayOf(PropTypes.object),
  locations: PropTypes.arrayOf(PropTypes.object),
  currentLocation: PropTypes.arrayOf(PropTypes.string),
  animationHandler: PropTypes.func,
  isVisibleHandler: PropTypes.func,
  ssrDataHandler: PropTypes.func,
  setTownName: PropTypes.func,
  disconnectSocket: PropTypes.func,
  unsubscribeClient: PropTypes.func,
  tId: PropTypes.string,
  alertsViewOnly: PropTypes.bool,
  isVisible: PropTypes.bool,
  type: PropTypes.string
};