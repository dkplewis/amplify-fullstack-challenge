import PropTypes from 'prop-types';
import { Text, View } from '@aws-amplify/ui-react';

import styles from '@/component-styles/display/LocationTile.module.css';

const LocationTile = ({ isMobile, tileLocation, locationActiveAlertCount, uniqueLocationActiveAlertCount }) => {

  return <>
    { locationActiveAlertCount > 0 && <>
      <View className={isMobile ? styles.mAlertText: styles.dAlertText}>
        <Text as="span">
          { Number.parseFloat(((uniqueLocationActiveAlertCount / tileLocation.TOTAL_CONTROL_AREAS) * 100) + "").toFixed(0) }
          % crop at risk
        </Text>
      </View>
      <View className={styles.alertBadge}>
        <Text className={styles.alertBadgeText}>{ locationActiveAlertCount }</Text>
      </View>
    </> }
    { isMobile && <View className={isMobile ? styles.mTileLocationIdContainer : styles.dTileLocationIdContainer}>
      <Text className={`locationText ${styles.locationText}`} title={ isMobile && tileLocation.NAME.length > 4 ? tileLocation.NAME : null }>
        <strong>{ isMobile && tileLocation.NAME.length > 4 ? tileLocation.NAME.substring(0, 3) + "..." : tileLocation.NAME }</strong>
      </Text>
    </View> }
  </>;

};

export default LocationTile;

LocationTile.propTypes = {
  isMobile: PropTypes.bool,
  tileLocation: PropTypes.object.isRequired,
  locationActiveAlertCount: PropTypes.number,
  uniqueLocationActiveAlertCount: PropTypes.number
};