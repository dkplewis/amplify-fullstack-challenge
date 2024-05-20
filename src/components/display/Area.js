import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Card, Flex, Text, View } from '@aws-amplify/ui-react';
import AreaTile from '@/components/display/AreaTile';
import { areaHasInFlightAlerts } from '@/utils/location';
import { getActiveSchedule } from '@/utils/datetime';

import styles from '@/component-styles/display/Area.module.css';

const Area = ({ isMobile, location, area, schedules, alerts, alertTypeConfig,
  locationTypeConfig, resourcesBucket, showAlertDuration, showLatestAlertOnly, onClickHandler, puiMaxValue,
  variant = "row", animation = "immediate", isHeatmapEnabled = false, viewType, indexValue, tenantId }) => {

  const tileBg = useMemo(() => {

    let result = "";
      
    if (isHeatmapEnabled && indexValue != null) {

      const tileBackgroundParts = locationTypeConfig.tileBackground?.split(".") || ["", ""];
      let percentage = "100";
      // DL 2023-06-06 The tile background images are specified in 20% increments, but the change
      // in gradient doesn't seem to be clear enough IMHO. If the spec doesn't change after customer review,
      // this code will be tidied up and the correct image sets created.
      // DL 2023-10-27 CPLD v2 has reduced PHI by 5% so adjusted the thresholds
      if (viewType == "PHI") {
      
        // Uses images 10, 20, 30, 40 and 100
        const imageSet = ["10", "20", "30", "40", "100"];
        percentage = imageSet[indexValue < 50 ? 0 : indexValue < 61 ? 1 : indexValue < 71 ? 2 : indexValue < 81 ? 3 : 4 ];

      } else {

        const puiThresholds = [puiMaxValue * 0.2, puiMaxValue * 0.4, puiMaxValue * 0.6, puiMaxValue * 0.8];

        // Uses images 50, 60, 70, 80 and 100
        const imageSet = ["50", "60", "70", "80", "100"];
        percentage = imageSet[viewType == "PS2" ? 
          indexValue < 20 ? 0 : indexValue < 40 ? 1 : indexValue < 60 ? 2 : indexValue < 80 ? 3 : 4
        : viewType == "PEI" ?
          indexValue < -80 || indexValue > 80 ? 0 :
          indexValue < -60 || indexValue > 60 ? 1 :
          indexValue < -40 || indexValue > 40 ? 2 :
          indexValue < -20 || indexValue > 20 ? 3 :
          4
        :
          indexValue < puiThresholds[0] ? 0 : indexValue < puiThresholds[1] ? 1 : indexValue < puiThresholds[2] ? 2 : indexValue < puiThresholds[3] ? 3 : 4
        ];

      }

      result = `/images/${resourcesBucket}/${isMobile ? "" : "desktop-"}${tileBackgroundParts[0]}-pct${percentage}.${tileBackgroundParts[1]}`;

    } else {

      result = `/images/${resourcesBucket}/${isMobile ? "" : "desktop-"}${locationTypeConfig.tileBackground}`;

    }

    return result;

  }, [indexValue, isHeatmapEnabled, isMobile, locationTypeConfig, puiMaxValue, resourcesBucket, viewType]);

  return (variant === "row" ? 
    <Card className={`locationItem ${styles.locationItem} ${areaHasInFlightAlerts(alerts, area, getActiveSchedule(schedules)) ? styles.active : ""}`}
      title="Go to this area"
      id={`area-${location.NAME}-${area.NAME}_tenantId-${tenantId}`}
      data-amplify-analytics-on="click"
      data-amplify-analytics-name="areaClick"
      data-amplify-analytics-attrs={`area:${location.NAME}-${area.NAME},tenantId:${tenantId}`}
      onClick={(evt) => onClickHandler(evt, "immediate", area)}
    >
      <Flex>
        <View className={styles.locationIdContainer}>
          <Text className={styles.locationText}>
            ID:
            {" "}
            <strong>{area.NAME}</strong>
          </Text>
        </View>
      </Flex>
    </Card>
  :
    variant === "tile" ?
    <>
      { animation == "timed-switch" ?
        <>
          <Card className={`areaTile ${styles.locationTile}`} backgroundImage={"url('" + tileBg + "')"} title="Go to this area"
            id={`area-${location.NAME}-${area.NAME}_tenantId-${tenantId}`}
            data-amplify-analytics-on="click"
            data-amplify-analytics-name="areaClick"
            data-amplify-analytics-attrs={`area:${location.NAME}-${area.NAME},tenantId:${tenantId}`}
            onClick={(evt) => onClickHandler(evt, "timed-switch", area)}
          >
            <AreaTile isMobile={isMobile} tileLocation={location} tileArea={area}
              tileSchedules={schedules} tileAlerts={alerts.filter(alert => (viewType == "PHI" && alert.TRIGGER_METRIC == "fv_fm") ||
                (viewType == "PS2" && (alert.TRIGGER_METRIC == "qe" || alert.TRIGGER_METRIC == "qp")))} tileAlertTypeConfig={alertTypeConfig}
              showAlertDuration={showAlertDuration} showLatestAlertOnly={showLatestAlertOnly} tenantId={tenantId} />
          </Card>
          { !isMobile && <View className={styles.dTileLocationIdContainer}>
            <Text className={styles.locationText}>
              <strong>{area.NAME}</strong>
            </Text>
          </View> }
        </>
      :
        <>
          <Card className={`areaTile ${styles.locationTile}`} backgroundImage={"url('" + tileBg + "')"} title="Go to this area"
            id={`area-${location.NAME}-${area.NAME}_tenantId-${tenantId}`}
            data-amplify-analytics-on="click"
            data-amplify-analytics-name="areaClick"
            data-amplify-analytics-attrs={`area:${location.NAME}-${area.NAME},tenantId:${tenantId}`}
            onClick={(evt) => onClickHandler(evt, "immediate", area)}
          >
            <AreaTile isMobile={isMobile} tileLocation={location} tileArea={area}
              tileSchedules={schedules} tileAlerts={alerts.filter(alert => (viewType == "PHI" && alert.TRIGGER_METRIC == "fv_fm") ||
                (viewType == "PS2" && (alert.TRIGGER_METRIC == "qe" || alert.TRIGGER_METRIC == "qp")))} tileAlertTypeConfig={alertTypeConfig}
              showAlertDuration={showAlertDuration} showLatestAlertOnly={showLatestAlertOnly} viewType={viewType} tenantId={tenantId} />
          </Card>
          { !isMobile && <View className={styles.dTileLocationIdContainer}>
            <Text className={`locationText ${styles.locationText}`}>
              <strong>{area.NAME}</strong>
            </Text>
          </View> }
        </>
      }
    </>
  :
    <></>);

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