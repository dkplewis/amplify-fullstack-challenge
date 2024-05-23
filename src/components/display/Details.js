import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Flex, Text, View } from '@aws-amplify/ui-react';
import Breadcrumb from '@/components/structural/Breadcrumb';
import MeasurementsPerformanceChart from '@/components/widgets/MeasurementsPerformanceChart';
import InsightImages from '@/components/widgets/InsightImages';
import { getFormattedDate, getLatestIndexDateForAreas, getDifferenceInHours,
  getMeasurementsDataByTime, getPeriodStartAndEndMs, hasInsufficientHourlyData, isHourlyDataPointThresholdTriggered } from '@/utils/datetime';
import { getMeasurementsZones } from '@/utils/location';
import { hierarchySort, nameSort } from '@/utils/sort';

import genericStyles from '@/page-styles/Generic.module.css';
import styles from '@/component-styles/display/Details.module.css';

const Details = ({ areaData, areasData, scheduleData, tenantData, locationData, measurementsData = [],
  zoneData = [], tenantId, locationPath, period, setPeriodHandler,
  timeUnit, setTimeUnitHandler, dateRange, setDateRangeHandler,
  availableMeasurements }) => {

  const scrollableContentRef = useRef(null);

  const [scrollableContentHeight, setScrollableContentHeight] = useState(undefined);

  const ONE_DAY_IN_MS = 86400000;
  const END_OF_DAY_IN_MS = 86399999;

  useEffect(() => {

    const windowHeightRatio = window.innerHeight / 95.25;
    setScrollableContentHeight((scrollableContentRef.current.offsetHeight / windowHeightRatio));

  }, []);

  const periodDates = useMemo(() => {

    const hourlyDailyThreshold = Number.parseInt(tenantData.CONFIG.defaultHourlyDailyDataThreshold || "72", 10);
    let [periodStartMs, periodEndMs, isHourly] = [null, null, 0, 0, 0];
    if (dateRange && dateRange.length == 2 && dateRange[0] && dateRange[1]) {

      // The date range selector sets the last day to midnight, but we want to include that day
      const isHourlyTriggered = isHourlyDataPointThresholdTriggered(dateRange[0].getTime(), dateRange[1].getTime() + ONE_DAY_IN_MS,
        hourlyDailyThreshold, hasInsufficientHourlyData(measurementsData));
      const endDateMs = dateRange[1].getTime() +
        (isHourlyTriggered ?
          END_OF_DAY_IN_MS
        : getDifferenceInHours(dateRange[1].getTime(), dateRange[0].getTime()) > hourlyDailyThreshold ?
          0
        :
          ONE_DAY_IN_MS);
      [periodStartMs, periodEndMs, isHourly] = [dateRange[0].getTime(), endDateMs, isHourlyTriggered ? 1 : 0, 0, 0];

    } else {

      [periodStartMs, periodEndMs, isHourly] = getPeriodStartAndEndMs(scheduleData, period,
        hourlyDailyThreshold, tenantData.CONFIG.details.rollingTrendlinePeriod, measurementsData);

    }
    
    return {
      fromDateMs: periodStartMs,
      toDateMs: periodEndMs,
      isHourly: isHourly
    };

  }, [dateRange, scheduleData, measurementsData, period, tenantData]);

  const defaultEditedMeasurements = useMemo(() => {

    let result = {};

    if (availableMeasurements) {

      const availableMeasurementsConfig = Object.keys(availableMeasurements);
      for (let c = 0, len = availableMeasurementsConfig.length; c < len; c += 1) {
          
        result[availableMeasurementsConfig[c]] = {
          ...availableMeasurements[availableMeasurementsConfig[c]],
          enabledFlag: availableMeasurements[availableMeasurementsConfig[c]].enabled
        }

      }

    }
    
    return result;

  }, [availableMeasurements]);

  const defaultActiveIndex = useMemo(() => {

    let defaultActive = "";

    const availableMeasurementsConfig = Object.keys(availableMeasurements);
    if (availableMeasurementsConfig.filter((key) => availableMeasurements[key].enabled).length > 0) {

      for (let c = 0, len = availableMeasurementsConfig.length; c < len; c += 1) {
        
        if (availableMeasurements[availableMeasurementsConfig[c]].defaultExpanded) defaultActive = availableMeasurementsConfig[c];

      }
    
    }

    return defaultActive;

  }, [availableMeasurements]); 

  const measurementsDataByDateTime = useMemo(() => {

    const hourlyDailyThreshold = Number.parseInt(tenantData.CONFIG.defaultHourlyDailyDataThreshold || "72", 10);
    return getMeasurementsDataByTime(measurementsData, periodDates.fromDateMs, periodDates.toDateMs, periodDates.isHourly, period, hourlyDailyThreshold)
  
  }, [measurementsData, periodDates, period, tenantData]);

  const defaultEditedAreas = useMemo(() => {

    const caclPath = areaData?.PATH.split("#").slice(0, -1).join("#");
    let result = [...areasData];
    result = result.map(item => {

      return { ...item, enabledFlag: item.ENTITY_TYPE_ID == areaData.ENTITY_TYPE_ID || item.PATH.startsWith(caclPath + "#") }

    });
    return result.sort((a, b) => hierarchySort(a, b, "asc", locationData, tenantData));

  }, [areaData, areasData, locationData, tenantData]);

  const defaultAvailableAreas = useMemo(() => defaultEditedAreas, [defaultEditedAreas]);

  const cacls = useMemo(() => {

    const caclLocationTypes = Object.keys(tenantData.CONFIG.locations).reduce((acc, curr) => {
      const currLocationConfig = tenantData.CONFIG.locations[curr];
      if (currLocationConfig.isAreaContainer) acc.push(curr);
      return acc;
    }, []);
    const caclLocations = locationData.filter(location => caclLocationTypes.includes(location.GSI2_PK.replace("TYPE#", "").toLowerCase()));
    return caclLocations.sort((a, b) => nameSort(a, b, "asc"));

  }, [locationData, tenantData]);

  const areasZones = useMemo(() => getMeasurementsZones(areaData, zoneData), [areaData, zoneData]);

  const tz = useMemo(() =>
    locationData.find(location => location.PATH == areaData?.PATH.split("#").slice(0, -1).join("#"))?.TIMEZONE_ID || "UTC",
    [areaData, locationData]);

  const getLatestActivityDate = useCallback((alerts, area, schedule, measures, tz) => {

    if (!schedule?.ENTITY_TYPE_ID) return "";

    const latestIndexDate = getLatestIndexDateForAreas(measures, area, tz);
    if (latestIndexDate) return latestIndexDate;

    return getFormattedDate(new Date(schedule.CYCLE_STARTED_AT).setUTCHours(0, 0, 0, 0), "Mmm DD, YYYY", tz);

  }, []);

  return (<View className="detailsView multiMeasurements">
    <View ref={scrollableContentRef} className={styles.dContentWellContainer}>
      <View className="scrollableContent" style={{ height: scrollableContentHeight + "vh" }}>
        <View className="contentWellHeader">
          <Flex className={genericStyles.contentWellHeading}>
            <Breadcrumb viewType="details" resourcesPath={tenantData.CONFIG.resources} tenantName={tenantData.NAME}
              label="Detailed View"
              icon={tenantData.CONFIG.details.icon}
              area={areaData}
              areaConfig={tenantData.CONFIG.details}
              locationPath={locationPath}
              locations={locationData}
              locationConfigs={tenantData.CONFIG.locations}
            />
          </Flex>
        </View>
        { areaData && scheduleData && <Flex className={styles.areaDetailsWideContainer}>
          <View className={styles.trayInfoContainer}>
            <Flex>
              <Text className={`infoLabel ${styles.infoLabel}`}>Contract:</Text>
              <Text className={styles.infoText}>{ scheduleData.CONTRACT }</Text>
            </Flex>
          </View>
          <View className={styles.trayInfoContainer}>
            <Flex>
              <Text className={`infoLabel ${styles.infoLabel}`}>Date:</Text>
              <Text className={styles.infoText}>
                { getLatestActivityDate([], areaData, scheduleData, measurementsDataByDateTime, tz) }
              </Text>
            </Flex>
            <Flex>
              <Text className={`infoLabel ${styles.infoLabel}`}>Provider:</Text>
              <Text className={styles.infoText}>{ scheduleData.PROVIDER }</Text>
            </Flex>
          </View>
        </Flex> }
        <View className={styles.measuresContainer}>
          { scheduleData.ENTITY_TYPE_ID &&
            <View className={styles.healthIndex}>
              { Object.keys(availableMeasurements).length > 0 && <MeasurementsPerformanceChart
                data={measurementsDataByDateTime}
                measurementConfig={availableMeasurements}
                period={period}
                defaultPeriod={Number.parseInt(tenantData.CONFIG.details.trendlinePeriod, 10) || 48}
                tz={tz}
                periodDates={periodDates}
                tenantId={tenantId}
                area={areaData}
                schedule={scheduleData}
                isRollingPeriod={tenantData.CONFIG.details.rollingTrendlinePeriod}
                threshold={Number.parseInt(tenantData.CONFIG.defaultHourlyDailyDataThreshold || "72", 10)}
                isColourEnabled={tenantData.CONFIG.details.enableColourPalette}
                periodChangeHandler={setPeriodHandler}
                chartLineType={tenantData.CONFIG.details.chartLineType || "monotone"}
                timeUnit={timeUnit}
                timeUnitHandler={setTimeUnitHandler}
                dateRange={dateRange}
                setDateRangeHandler={setDateRangeHandler}
              /> }
            </View>
          }
        </View>
        <View className={styles.imageDisplay}>
          { scheduleData?.ENTITY_TYPE_ID && areasZones.length > 0 && <InsightImages schedule={scheduleData} zones={areasZones}
            areaName={areaData.NAME} showAreaName={tenantData.CONFIG.details.detailsView == "measureimage"}
            resources={tenantData.CONFIG.resources} areaIcon={tenantData.CONFIG.details.icon} tz={tz} /> }
        </View>
      </View>
    </View>
  </View>);

}

export default Details;

Details.propTypes = {
  areaData: PropTypes.object,
  scheduleData: PropTypes.object,
  tenantData: PropTypes.object,
  locationData: PropTypes.arrayOf(PropTypes.object),
  measurementsData: PropTypes.arrayOf(PropTypes.object),
  zoneData: PropTypes.arrayOf(PropTypes.object),
  tenantId: PropTypes.string,
  currentLocation: PropTypes.string,
  locationPath: PropTypes.string,
  period: PropTypes.number,
  setPeriodHandler: PropTypes.func,
  timeUnit: PropTypes.string,
  setTimeUnitHandler: PropTypes.func,
  dateRange: PropTypes.arrayOf(PropTypes.object),
  setDateRangeHandler: PropTypes.func,
};