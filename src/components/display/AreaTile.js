import PropTypes from 'prop-types';
import { Flex, Text, View } from '@aws-amplify/ui-react';
import GrowthCycleProgress from '@/components/widgets/GrowthCycleProgress';
import { getActiveSchedule, getCycleDurationInDays, getActiveAlertForArea,
  getLatestAlertForArea, isScheduleComplete } from '@/utils/datetime';
  import { areaHasInFlightAlerts } from '@/utils/location';

import genericStyles from '@/page-styles/Generic.module.css';
import styles from '@/component-styles/display/AreaTile.module.css';

const AreaTile = ({ isMobile, tileLocation, tileArea, tileSchedules = [], tileAlerts = [], 
  tileAlertTypeConfig, showAlertDuration, showLatestAlertOnly, viewType, tenantId }) => {

  return <>
    { tileArea && tileSchedules.length > 0 &&
      tileAlerts.filter(alert => alert.GSI4_PK == getActiveSchedule(tileSchedules)?.ENTITY_TYPE_ID &&
      alert.STATE == "active" &&
      (alert.TRIGGER_METRIC == (viewType == "PHI" ? "fv_fm" : "qe") || alert.TRIGGER_METRIC == (viewType == "PHI" ? "fv_fm" : "qp"))).length > 0 && <>
      <GrowthCycleProgress variant="thin"
        schedules={[getActiveSchedule(tileSchedules)]}
        area={tileArea}
        alerts={tileAlerts.filter(alert => alert.GSI4_PK == getActiveSchedule(tileSchedules)?.ENTITY_TYPE_ID &&
          (alert.TRIGGER_METRIC == (viewType == "PHI" ? "fv_fm" : "qe") || alert.TRIGGER_METRIC == (viewType == "PHI" ? "fv_fm" : "qp")))}
        showActiveState={showLatestAlertOnly &&
          getActiveAlertForArea(tileAlerts, tileArea.ENTITY_TYPE_ID, viewType)?.ENTITY_TYPE_ID != null}
        showAlertHistory={!showLatestAlertOnly &&
          getLatestAlertForArea(tileAlerts, tileArea.ENTITY_TYPE_ID, viewType)?.ENTITY_TYPE_ID != null}
        showAlertHistoryDuration={showAlertDuration}
        showLatestAlertOnlyInHistory={showLatestAlertOnly}
        tenantId={tenantId}
      />
      <Flex justifyContent="space-between">
        <Text className={styles.locationDurationText}>0</Text>
        {/* Assumption that all areas in a location are growing the same thing */}
        <Text className={ isScheduleComplete(tileSchedules) ?
          genericStyles.locationDurationCompleted100PcText
        :
          genericStyles.locationDurationText }
        >
          { getCycleDurationInDays(tileSchedules) }
        </Text>
      </Flex>
    </> }
    { areaHasInFlightAlerts(tileAlerts, tileArea, getActiveSchedule(tileSchedules)) && <>
      <View className={isMobile ? styles.mAlertText : styles.dAlertText}>
        <Text as="span">
          { (tileAlertTypeConfig &&
            tileAlertTypeConfig[getLatestAlertForArea(tileAlerts, tileArea.ENTITY_TYPE_ID, viewType)?.TRIGGER_METRIC]
          ) || "Stressed" }
        </Text>
      </View>
    </> }
    { isMobile && <View className={isMobile ? styles.mTileLocationIdContainer : styles.dTileLocationIdContainer}>
      <Text className={isMobile ? styles.mLocationText : styles.dLocationText}>
        <strong>{tileArea.NAME}</strong>
      </Text>
    </View> }
  </>;

};

export default AreaTile;

AreaTile.propTypes = {
  isMobile: PropTypes.bool,
  tileLocation: PropTypes.object.isRequired,
  tileArea: PropTypes.object.isRequired,
  tileSchedules: PropTypes.arrayOf(PropTypes.object).isRequired,
  tileAlerts: PropTypes.arrayOf(PropTypes.object),
  tileAlertTypeConfig: PropTypes.object,
  showAlertDuration: PropTypes.bool,
  showLatestAlertOnly: PropTypes.bool,
  viewType: PropTypes.string,
  tenantId: PropTypes.string
};