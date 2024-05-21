import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Card, Text, View } from '@aws-amplify/ui-react';

import styles from '@/component-styles/display/Area.module.css';

const Area = ({ location, area, schedules, locationTypeConfig, resourcesBucket, onClickHandler,
  animation = "immediate", viewType, indexValue, tenantId }) => {

  const tileBg = useMemo(() => {

    let result = "";
      
    if (indexValue != null) {

      const tileBackgroundParts = locationTypeConfig.tileBackground?.split(".") || ["", ""];
      let percentage = "100";
      // Uses images 10, 20, 30, 40 and 100
      const imageSet = ["10", "20", "30", "40", "100"];
      percentage = imageSet[indexValue < 50 ? 0 : indexValue < 61 ? 1 : indexValue < 71 ? 2 : indexValue < 81 ? 3 : 4 ];
      result = `/images/${resourcesBucket}/desktop-${tileBackgroundParts[0]}-pct${percentage}.${tileBackgroundParts[1]}`;

    } else {

      result = `/images/${resourcesBucket}/desktop-${locationTypeConfig.tileBackground}`;

    }

    return result;

  }, [indexValue, locationTypeConfig, resourcesBucket]);

  return <>
    <Card className={`areaTile ${styles.locationTile}`} backgroundImage={"url('" + tileBg + "')"} title="Go to this area"
      id={`area-${location.NAME}-${area.NAME}_tenantId-${tenantId}`}
      data-amplify-analytics-on="click"
      data-amplify-analytics-name="areaClick"
      data-amplify-analytics-attrs={`area:${location.NAME}-${area.NAME},tenantId:${tenantId}`}
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
  schedules: PropTypes.arrayOf(PropTypes.object).isRequired,
  alerts: PropTypes.arrayOf(PropTypes.object),
  alertTypeConfig: PropTypes.object,
  locationTypeConfig: PropTypes.object,
  resourcesBucket: PropTypes.string,
  showAlertDuration: PropTypes.bool,
  showLatestAlertOnly: PropTypes.bool,
  onClickHandler: PropTypes.func.isRequired,
  puiMaxValue: PropTypes.number,
  variant: PropTypes.string,
  animation: PropTypes.string,
  isHeatmapEnabled: PropTypes.bool,
  viewType: PropTypes.string,
  indexValue: PropTypes.number,
  tenantId: PropTypes.string
};