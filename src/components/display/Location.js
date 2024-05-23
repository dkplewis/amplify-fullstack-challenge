import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Card, Text, View } from '@aws-amplify/ui-react';

import styles from '@/component-styles/display/Location.module.css';

const Location = ({ location, locationTypeConfig, resourcesBucket, onClickHandler, tenantId }) => {

  const tileBg = useMemo(() => `/images/${
    resourcesBucket
  }/desktop-${
    locationTypeConfig?.tileBackground || ""
  }`, [resourcesBucket, locationTypeConfig]);

  return <View title="Go to this location"
    id={`location-${location.name}_tenantId-${tenantId}`}
    onClick={(evt) => onClickHandler(evt, "immediate", location)}>
    <Card className={`locationTile ${styles.locationTile}`} backgroundImage={"url('" + tileBg + "')"}>
    </Card>
    <View className={styles.dTileLocationIdContainer}>
      <Text className={`locationText ${styles.locationText}`}>
        <strong>{location.name}</strong>
      </Text>
    </View>
  </View>;

}

export default Location;

Location.propTypes = {
  isMobile: PropTypes.bool,
  location: PropTypes.object.isRequired,
  locationTypeConfig: PropTypes.object,
  resourcesBucket: PropTypes.string,
  onClickHandler: PropTypes.func.isRequired,
  measurements: PropTypes.object,
  variant: PropTypes.string,
  animation: PropTypes.string,
  tenantId: PropTypes.string
};