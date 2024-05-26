import { useMemo } from 'react';
import PropTypes from 'prop-types';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Image, Link as AmplifyLink, Text, View } from '@aws-amplify/ui-react';
import UserAuth from '@/components/widgets/UserAuth';

import { MdElectricCar } from 'react-icons/md';

import styles from '@/component-styles/structural/Header.module.css';

const Header = (props) => {

  const { tenantHeaderConfig, rootLocation, topNavLocations, locations,
    currentLocation, resourcesConfig } = props;

  const router = useRouter();
  const currentRoute = router.asPath;

  const topNavLocation = useMemo(() => topNavLocations.find(tnl => tnl.entityTypeId == "LOCATION#" + currentLocation[1]), [topNavLocations, currentLocation]);

  const defaultLocation = useMemo(() => {

    const childLocationsForTopNav = (!topNavLocation || locations.length == 0) ?
      []
    :
      locations.filter((location) => location.path.startsWith(topNavLocation.path + "#") &&
        location.path.split("#").length == topNavLocation.path.split("#").length + 1);

    return childLocationsForTopNav.length > 0 ?
      childLocationsForTopNav.find((location) => location.defaultLocation)
    :
      locations.find(location => location.defaultLocation);

  }, [topNavLocation, locations]);

  return tenantHeaderConfig && <header className={styles.dHeaderContainer}>
    <Link href={"/installation/" +
      rootLocation.entityTypeId.replace("LOCATION#", "") + 
      "/" +
      currentLocation[1] +
      (topNavLocation && tenantHeaderConfig[topNavLocation.locationHeaderKey]?.childPath ? 
        tenantHeaderConfig[topNavLocation.locationHeaderKey || ""]?.childPath || ""
      : defaultLocation ?
        "/" + (defaultLocation?.gsi2Pk || "").replace("TYPE#", "").toLowerCase()
      :
        "/town"
      ) +
      "/" +
      (topNavLocation && tenantHeaderConfig[topNavLocation.locationHeaderKey]?.childPath ? 
        topNavLocation.entityTypeId.replace("LOCATION#", "")
      : defaultLocation ?
        defaultLocation.entityTypeId.replace("LOCATION#", "")
      :
        rootLocation.entityTypeId.replace("LOCATION#", "")
      )
    } className={styles.dLogoLink}>
      <MdElectricCar size={24} />
      <View className={styles.logoText}>ChargeNG</View>
    </Link>
    <View className={styles.dHeader}>
      <Link href={"/installation/" + 
        rootLocation.entityTypeId.replace("LOCATION#", "") + 
        "/" +
        currentLocation[1] +
        (topNavLocation && tenantHeaderConfig[topNavLocation.locationHeaderKey]?.childPath ? 
          tenantHeaderConfig[topNavLocation.locationHeaderKey || ""]?.childPath || ""
        : defaultLocation ?
          "/" + (defaultLocation?.gsi2Pk || "").replace("TYPE#", "").toLowerCase()
        :
          "/town"
        ) +
        "/" +
        (topNavLocation && tenantHeaderConfig[topNavLocation.locationHeaderKey]?.childPath ? 
          topNavLocation.entityTypeId.replace("LOCATION#", "")
        : defaultLocation ?
          defaultLocation.entityTypeId.replace("LOCATION#", "")
        :
          rootLocation.entityTypeId.replace("LOCATION#", "")
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
  setTownName: PropTypes.func
};