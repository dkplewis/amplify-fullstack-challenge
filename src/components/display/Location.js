import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Card, Flex, Text, View } from '@aws-amplify/ui-react';
import LocationTile from '@/components/display/LocationTile';
import { getLocationActiveAlertCount, locationHasActiveAlerts } from '@/utils/location';

import styles from '@/component-styles/display/Location.module.css';

const Location = ({ isMobile, location, alerts, locationTypeConfig, resourcesBucket, onClickHandler,
  measurements, variant = "row", animation = "immediate", tenantId }) => {

  const tileBg = useMemo(() => `/images/${
    resourcesBucket
  }/${
    isMobile ? "" : "desktop-"
  }${
    locationTypeConfig?.tileBackground || ""
  }`, [resourcesBucket, isMobile, locationTypeConfig]);

  return (variant === "row" ? 
    <Card className={`locationItem ${styles.locationItem} ${
      locationHasActiveAlerts(location, alerts.filter(alert => measurements?.PS2.enabled ? true : alert.TRIGGER_METRIC == "fv_fm")) ? styles.active : ""
    }`}
      title="Go to this location"
      id={`location-${location.NAME}_tenantId-${tenantId}`}
      data-amplify-analytics-on="click"
      data-amplify-analytics-name="locationClick"
      data-amplify-analytics-attrs={`location:${location.NAME},tenantId:${tenantId}`}
      onClick={(evt) => onClickHandler(evt, "immediate", location)}
    >
      <Flex>
        <View className={isMobile ? styles.mLocationIdContainer : styles.dLocationIdContainer}>
          <Text className={`locationText ${styles.locationText}`}>
            <strong>{location.NAME}</strong>
          </Text>
        </View>
      </Flex>
    </Card>
  :
    variant === "tile" ?
      <>
        { animation == "timed-switch" ?
          <View title="Go to this location"
            id={`location-${location.NAME}_tenantId-${tenantId}`}
            data-amplify-analytics-on="click"
            data-amplify-analytics-name="locationClick"
            data-amplify-analytics-attrs={`location:${location.NAME},tenantId:${tenantId}`}
            onClick={(evt) => onClickHandler(evt, "timed-switch", location)}>
            <Card className={`locationTile ${styles.locationTile}`} backgroundImage={"url('" + tileBg + "')"}>
              <LocationTile isMobile={isMobile} tileLocation={location} locationActiveAlertCount={
                getLocationActiveAlertCount(location, alerts.filter(alert => measurements?.PS2.enabled ? true : alert.TRIGGER_METRIC == "fv_fm"))
              } uniqueLocationActiveAlertCount={
                getLocationActiveAlertCount(location, alerts.filter(alert => measurements?.PS2.enabled ? true : alert.TRIGGER_METRIC == "fv_fm"), true)
              } />
            </Card>
            { !isMobile && <View className={styles.dTileLocationIdContainer}>
              <Text className={`locationText ${styles.locationText}`}>
                <strong>{location.NAME}</strong>
              </Text>
            </View> }
          </View>
        :
          <View title="Go to this location"
            id={`location-${location.NAME}_tenantId-${tenantId}`}
            data-amplify-analytics-on="click"
            data-amplify-analytics-name="locationClick"
            data-amplify-analytics-attrs={`location:${location.NAME},tenantId:${tenantId}`}
            onClick={(evt) => onClickHandler(evt, "immediate", location)}>
            <Card className={`locationTile ${styles.locationTile}`} backgroundImage={"url('" + tileBg + "')"}>
              <LocationTile isMobile={isMobile} tileLocation={location} locationActiveAlertCount={
                getLocationActiveAlertCount(location, alerts.filter(alert => measurements?.PS2.enabled ? true : alert.TRIGGER_METRIC == "fv_fm"))
              } uniqueLocationActiveAlertCount={
                getLocationActiveAlertCount(location, alerts.filter(alert => measurements?.PS2.enabled ? true : alert.TRIGGER_METRIC == "fv_fm"), true)
              } />
            </Card>
            { !isMobile && <View className={styles.dTileLocationIdContainer}>
              <Text className={`locationText ${styles.locationText}`}>
                <strong>{location.NAME}</strong>
              </Text>
            </View> }
          </View>
        }
      </>        
        :
      <></>);

}

export default Location;

Location.propTypes = {
  isMobile: PropTypes.bool,
  location: PropTypes.object.isRequired,
  alerts: PropTypes.arrayOf(PropTypes.object).isRequired,
  locationTypeConfig: PropTypes.object,
  resourcesBucket: PropTypes.string,
  onClickHandler: PropTypes.func.isRequired,
  measurements: PropTypes.object,
  variant: PropTypes.string,
  animation: PropTypes.string,
  tenantId: PropTypes.string
};