import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Card, Text, View } from '@aws-amplify/ui-react';

import styles from '@/component-styles/display/Area.module.css';

const Area = ({ location, area, locationTypeConfig, resourcesBucket, onClickHandler,
  measureValue, tenantId }) => {

  const tileBg = useMemo(() => `/images/${
    resourcesBucket
  }/desktop-${
    locationTypeConfig.tileBackground
  }`, [measureValue, locationTypeConfig, resourcesBucket]);

  return <>
    <Card className={`areaTile ${styles.locationTile}`} backgroundImage={"url('" + tileBg + "')"} title="Go to this area"
      id={`area-${location.NAME}-${area.NAME}_tenantId-${tenantId}`}
      onClick={(evt) => onClickHandler(evt, "immediate", area)}
    >
    </Card>
    <View className={styles.dTileLocationIdContainer}>
      <Text className={`locationText ${styles.locationText}`}>
        <strong>{area.NAME}</strong>
      </Text>
    </View>
    </>;

}

export default Area;

Area.propTypes = {
  isMobile: PropTypes.bool,
  location: PropTypes.object.isRequired,
  area: PropTypes.object.isRequired,
  locationTypeConfig: PropTypes.object,
  resourcesBucket: PropTypes.string,
  onClickHandler: PropTypes.func.isRequired,
  variant: PropTypes.string,
  viewType: PropTypes.string,
  measureValue: PropTypes.number,
  tenantId: PropTypes.string
};