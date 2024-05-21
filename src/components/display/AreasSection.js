import { useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Collection, Flex, Image, Loader, Text, View } from '@aws-amplify/ui-react';
import { useQueries } from '@tanstack/react-query';
import Area from '@/components/display/Area';
import GrowthCycleProgress from '@/components/widgets/GrowthCycleProgress';
import IndexLegend from '@/components/widgets/IndexLegend';
import MeasurementType from '@/components/widgets/MeasurementType';
import { getLocationMeasurementsDataByDatesAndType } from '@/utils/crud';
import { getActiveSchedule, getActiveSchedulePeriodStartAndEndDay, getActiveScheduleStartDate, getDifferenceInHours,
  getLatestSchedule, getLatestSchedulePeriodStartAndEndDay, getLatestScheduleStartDate, getLatestIndexValue,
  hasInsufficientHourlyData, isScheduleComplete, isHourlyDataPointThresholdTriggered } from '@/utils/datetime';
import { caDimSort } from '@/utils/sort';

import genericStyles from '@/page-styles/Generic.module.css';
import styles from '@/component-styles/display/Areas.module.css';

const AreasSection = ({ sectionId, areaData = [], scheduleData = [],
  tenantId, tenantConfig, location, clickHandler, pageNo }) => {

  const [indicesDate, setMeasurementsDate] = useState(null);
  const [indicesType, setMeasurementsType] = useState("SUPPLY");

  const [fromDate, toDate] = useMemo(() => {

    let from = (process.env.NEXT_PUBLIC_NOW ?? new Date().toJSON()).split("T")[0];
    const toDateStr = (process.env.NEXT_PUBLIC_NOW ?? new Date().toJSON());
    let to = toDateStr.split("T")[0];

    const activeScheduleStartDate = getActiveScheduleStartDate(scheduleData
      .filter((schedule) => schedule.GSI2_PK == location.ENTITY_TYPE_ID),
      Number.parseInt(tenantConfig?.details?.trendlinePeriod || "48", 10),
      tenantConfig?.details?.rollingTrendlinePeriod, true, true);

    if (activeScheduleStartDate) {

      from = activeScheduleStartDate.toJSON().split("T")[0];

      if (getDifferenceInHours(new Date(to), activeScheduleStartDate, true, true) <= 24) {

        if (getDifferenceInHours(new Date(to), activeScheduleStartDate, true, true) <= 1) {

          from += "T" + activeScheduleStartDate.toJSON().split("T")[1].split(":").slice(0, 2).join(":") + ":00";
          to += "T" + toDateStr.split("T")[1].split(":").slice(0, 2).join(":") + ":00";

        } else {

          from += "T" + activeScheduleStartDate.toJSON().split("T")[1].split(":")[0] + ":00";
          to += "T" + toDateStr.split("T")[1].split(":")[0] + ":00:00";

        }

      }

      console.debug("Showing indices data from " + from +
        (from.indexOf("T") == 10 ? from.lastIndexOf(":") != 16 ? ":00" : "" : ":00") +
        " to " + to + " for " + location.NAME + "...");

    } else {

      const latestScheduleStartDate = getLatestScheduleStartDate(scheduleData
        .filter((schedule) => schedule.GSI2_PK == location.ENTITY_TYPE_ID),
        Number.parseInt(tenantConfig?.details?.trendlinePeriod || "48", 10),
        tenantConfig?.details?.rollingTrendlinePeriod, true, true);

      if (latestScheduleStartDate) {

        from = latestScheduleStartDate.toJSON().split("T")[0];

        if (getDifferenceInHours(new Date(to), activeScheduleStartDate, true, true) <= 24) {

          if (getDifferenceInHours(new Date(to), activeScheduleStartDate, true, true) <= 1) {

            from += "T" + latestScheduleStartDate.toJSON().split("T")[1].split(":").slice(0, 2).join(":") + ":00";
            to += "T" + toDateStr.split("T")[1].split(":").slice(0, 2).join(":") + ":00";

          } else {

            from += "T" + latestScheduleStartDate.toJSON().split("T")[1].split(":")[0] + ":00";
            to += "T" + toDateStr.split("T")[1].split(":")[0] + ":00:00";

          }

        }

        console.debug("Showing historic indices data from " + from +
          (from.indexOf("T") == 10 ? from.lastIndexOf(":") != 16 ? ":00" : "" : ":00") +
          " to " + to + " for " + location.NAME + "...");

      }

    }

    return [from, to];

  }, [scheduleData, location, tenantConfig, indicesDate]);

  const indicesForDateRangeQueries = useQueries({
    queries: !fromDate && !toDate ? [] : Object.keys(tenantConfig.measurements || {})
      .filter(measurement => tenantConfig.measurements[measurement].enabled)
      .map((indexType) => {
        return {
          queryKey: [
            "locationMeasurementsByDatesAndType",
            tenantId,
            (sectionId?.split("_")[1] || "").replace("LOCATION#", ""),
            fromDate,
            toDate,
            indexType,
            areaData.length
          ],
          queryFn: ({ queryKey }) => getLocationMeasurementsDataByDatesAndType(queryKey[2], queryKey[3], queryKey[4], queryKey[5], queryKey[6], queryKey[1]),
          refetchInterval: 20000
        } 
      }),
    combine: (results) => {
      return ({
        data: results.reduce((acc, curr) => {
          return acc.concat(curr.data ? curr.data.filter(datum => fromDate.lastIndexOf(":") == 16 ?
            datum.GSI5_SK.lastIndexOf(":") == 16
          : fromDate.lastIndexOf(":") == 13 ?
            datum.GSI5_SK.lastIndexOf(":") == 13
          : true) : []);
        }, []),
        isPending: results.some(result => result.isPending),
        isRefetching: results.some(result => result.isRefetching),
        isError: results.some(result => result.isError),
        isSuccess: results.every(result => result.isSuccess)
      })
    }
  });

  useEffect(() => {

    if (indicesForDateRangeQueries.isRefetching) setMeasurementsDate(new Date().toJSON().substring(0, 16) + ":00");

  }, [indicesForDateRangeQueries.isRefetching]);
  
  const sectionMeasurements = useMemo(() => {

    let result = {};

    if (indicesForDateRangeQueries.isSuccess) {

      result[sectionId] = {};

      indicesForDateRangeQueries.data.forEach((indexDatum) => {

        const areaId = indexDatum.ENTITY_TYPE.split("#")[1];
        const indexType = indexDatum.GSI5_PK.split("#")[1];
        const indexDate = indexDatum.GSI5_SK.split("#")[0];
        if (!result[sectionId][indexDate]) result[sectionId][indexDate] = {};
        if (!result[sectionId][indexDate][indexType]) result[sectionId][indexDate][indexType] = {};
        result[sectionId][indexDate][indexType][areaId] = {...indexDatum};
    
      })

    }

    return result;

  }, [indicesForDateRangeQueries, sectionId]);

  const defaultMeasurementsDate = useMemo(() => {

    if (!scheduleData || !scheduleData.length) return (process.env.NEXT_PUBLIC_NOW ?? new Date().toJSON()).split("T")[0];

    let [initialPeriodStartDate, initialPeriodEndDate] = (
    getActiveSchedulePeriodStartAndEndDay(scheduleData,
      Number.parseInt(tenantConfig.details.trendlinePeriod || "48", 10),
      "JSON", tenantConfig.details.rollingTrendlinePeriod, "UTC", false, false)
    ||
    getLatestSchedulePeriodStartAndEndDay(scheduleData,
      Number.parseInt(tenantConfig.details.trendlinePeriod || "48", 10),
      "JSON", tenantConfig.details.rollingTrendlinePeriod, "UTC", false, false)
    ).split(" - ");
    const differenceInHours = getDifferenceInHours(new Date(initialPeriodEndDate), new Date(initialPeriodStartDate), true, true);

    const now = (process.env.NEXT_PUBLIC_NOW ?? new Date().toJSON());
    let nowDate = now.split("T")[0];
    let endDate = initialPeriodEndDate.split("T")[0];

    const nowTime = now.split("T")[1].split(":");

    if (differenceInHours <= 1) {

      [initialPeriodStartDate, initialPeriodEndDate] = (
        getActiveSchedulePeriodStartAndEndDay(scheduleData,
          Number.parseInt(tenantConfig.details.trendlinePeriod || "48", 10),
          "JSON", tenantConfig.details.rollingTrendlinePeriod, "UTC", false, true)
        ||
        getLatestSchedulePeriodStartAndEndDay(scheduleData,
          Number.parseInt(tenantConfig.details.trendlinePeriod || "48", 10),
          "JSON", tenantConfig.details.rollingTrendlinePeriod, "UTC", false, true)
        ).split(" - ");

      const endTime = initialPeriodEndDate.split("T")[1].split(":");
  
      nowDate += "T" + nowTime.slice(0, 2).join(":") + ":00";
      endDate += "T" + endTime.slice(0, 2).join(":") + ":00";

    } else if (differenceInHours <= 24) {

      const endTime = initialPeriodEndDate.split("T")[1].split(":");

      nowDate += "T" + nowTime[0] + ":00";
      endDate += "T" + endTime[0] + ":00";

    }

    return endDate < nowDate ? endDate : nowDate;
      
  }, [scheduleData, tenantConfig]);

  const getLocationTypeConfig = useCallback((tenantConfig) => {

    return tenantConfig.areas.locationTypeConfig == "details" ?
      tenantConfig.details 
    :
      tenantConfig.locations[tenantConfig.areas.locationTypeConfig];
  
  }, []);

  const getUnorderedCollection = useCallback((collectionItems, location, indexData, currentType, tenantId,
    schedule, initialPeriod, threshold, isRolling) => {

    let isHourly = false;

    const [initialPeriodStartDate, initialPeriodEndDate] = (getActiveSchedulePeriodStartAndEndDay(schedule, initialPeriod,
      "JSON", isRolling, "UTC", false, false)
    ||
      getLatestSchedulePeriodStartAndEndDay(schedule, initialPeriod, "JSON", isRolling, "UTC", false, false)
    ).split(" - ");

    if (initialPeriodStartDate && initialPeriodEndDate) {

      const startDateMs = new Date(initialPeriodStartDate).getTime();
      const endDateMs = new Date(initialPeriodEndDate).getTime();

      isHourly = isHourlyDataPointThresholdTriggered(startDateMs, endDateMs, threshold,
        hasInsufficientHourlyData(Object.values(indexData ?? {})));

    }

    return <Collection type="list" role="list" className="locationCollection"
      items={collectionItems.slice(
        (pageNo * parseInt(tenantConfig.areas?.locationTypeConfig == "details" ?
          tenantConfig.details.resPerPage
        :
          tenantConfig.locations && tenantConfig.locations[tenantConfig.areas?.locationTypeConfig || ""]?.resPerPage || "50", 10)),
        parseInt(tenantConfig.areas?.locationTypeConfig == "details" ?
          tenantConfig.details.resPerPage
        :
          (tenantConfig.locations && tenantConfig.locations[tenantConfig.controlarea?.locationTypeConfig || ""]?.resPerPage) || "50", 10) * (pageNo + 1))}
      direction="row"
      gap="0"
      wrap="wrap">
      {(item, index) => (
        <View key={item.ENTITY_TYPE_ID} role="listitem" className={`locationCollectionTile ${styles.dAreaCollectionTile}`}>
          <Area location={location} area={item}
            schedules={scheduleData.filter(schedule => schedule.GSI3_PK == item.ENTITY_TYPE_ID)}
            locationTypeConfig={getLocationTypeConfig(tenantConfig)} 
            resourcesBucket={tenantConfig.resources} onClickHandler={clickHandler}
            isHeatmapEnabled={tenantConfig.enableHeatmap} viewType={currentType}
            indexValue={getLatestIndexValue(indexData ? indexData[item.ENTITY_TYPE_ID.replace("AREA#", "")]: null,
              isHourly, item.ENTITY_TYPE_ID)}
            tenantId={tenantId}
          />
        </View>
      )}
    </Collection>;

  }, [clickHandler, scheduleData, tenantConfig, pageNo]);

  const getOrderedCollection = useCallback((collectionItems, location, indexData, currentType, tenantId,
    schedule, initialPeriod, threshold, isRolling) => {

    let isHourly = false;

    const [initialPeriodStartDate, initialPeriodEndDate] = (getActiveSchedulePeriodStartAndEndDay(schedule, initialPeriod,
      "JSON", isRolling, "UTC", false, false)
    ||
      getLatestSchedulePeriodStartAndEndDay(schedule, initialPeriod, "JSON", isRolling, "UTC", false, false)
    ).split(" - ");

    if (initialPeriodStartDate && initialPeriodEndDate) {

      const startDateMs = new Date(initialPeriodStartDate).getTime();
      const endDateMs = new Date(initialPeriodEndDate).getTime();
      isHourly = isHourlyDataPointThresholdTriggered(startDateMs, endDateMs, threshold,
        hasInsufficientHourlyData(Object.values(indexData ?? {})));

    }
    
    let collectionItemsByRow = {
      row_0: []
    };

    const maxRow = collectionItems.reduce((max, curr) => curr.CA_DIMENSIONS[1] + 1 > max ? curr.CA_DIMENSIONS[1] + 1 : max, 1);

    // Create an 8 x 8 grid of Control Areas and spacers
    for (let c = 0, len = maxRow * 8; c < len; c += 1) {

      const currTile = [c % 8, Math.floor(c / 8)];

      if (collectionItemsByRow["row_" + currTile[1]] === undefined) collectionItemsByRow["row_" + currTile[1]] = [];

      const currCollectionItem = collectionItems.find(collectionItem => collectionItem.CA_DIMENSIONS.length == currTile.length &&
        collectionItem.CA_DIMENSIONS.every(( item, idx) => item === currTile[idx]));

      collectionItemsByRow["row_" + currTile[1]].push(currCollectionItem ? currCollectionItem : { isSpacer: true });

    }

    return Object.values(collectionItemsByRow).map((items, idx) => {

      return <Collection key={"row_" + idx} type="list" role="list" className="locationCollection"
        items={items.slice(
          (pageNo * parseInt(tenantConfig.areas.locationTypeConfig == "details" ?
            tenantConfig.details.resPerPage
          :
            tenantConfig.locations[tenantConfig.areas.locationTypeConfig].resPerPage
          , 10)),
          parseInt(tenantConfig.areas.locationTypeConfig == "details" ?
            tenantConfig.details.resPerPage
          :
            tenantConfig.locations[tenantConfig.areas.locationTypeConfig].resPerPage
          , 10) * (pageNo + 1))}
        direction="row"
        gap="0"
        wrap="wrap">
        {(item, index) => (
            item.isSpacer ? 
              <View key={"space_" + index} role="listitem" className={styles.dAreaCollectionTile}></View>
            : 
              <View key={item.ENTITY_TYPE_ID} role="listitem" className={`locationCollectionTile ${styles.dAreaCollectionTile}`}>
                <Area location={location} area={item}
                  schedules={scheduleData.filter(schedule => schedule.GSI3_PK == item.ENTITY_TYPE_ID)}
                  locationTypeConfig={getLocationTypeConfig(tenantConfig)} 
                  resourcesBucket={tenantConfig.resources} onClickHandler={clickHandler}
                  isHeatmapEnabled={tenantConfig.enableHeatmap} viewType={currentType}
                  indexValue={getLatestIndexValue(indexData ? indexData[item.ENTITY_TYPE_ID.replace("AREA#", "")] : null,
                    isHourly, item.ENTITY_TYPE_ID)}
                  tenantId={tenantId}
                />
              </View>
        )}
      </Collection>;

    });

  }, [clickHandler, scheduleData, tenantConfig, pageNo]);

  const getDurationLabel = useCallback((schedules, initialPeriod, isRolling, tz) => {

    const [durationStartDate, durationEndDate] = (
      getActiveSchedulePeriodStartAndEndDay(schedules, initialPeriod, "Mmmm DD", isRolling, tz || "UTC", false, false)
      ||
      getLatestSchedulePeriodStartAndEndDay(schedules, initialPeriod, "Mmmm DD", isRolling, tz || "UTC", false, false)
    ).split(" - ");

    return durationStartDate == durationEndDate ? durationEndDate : durationStartDate + " - " + durationEndDate;

  }, []);

  const getTimePeriodLabel = useCallback((schedules, initialPeriod, threshold, isRolling, indices, section, date, type) => {

    if (!schedules || !schedules.length) return "";

    let initialScheduleDates = getActiveSchedulePeriodStartAndEndDay(schedules, initialPeriod, "JSON", isRolling, "UTC", false, false);

    if (!initialScheduleDates) {

      initialScheduleDates = getLatestSchedulePeriodStartAndEndDay(schedules, initialPeriod, "JSON", isRolling, "UTC", false, false);

    }

    if (!initialScheduleDates) return "";

    const [initialPeriodStartDate, initialPeriodEndDate] = initialScheduleDates.split(" - ");

    if (initialPeriodStartDate && initialPeriodEndDate) {

      date += date.indexOf(":") != -1 || date.indexOf("T") == 10 ? ":00" : ""; 

      const isHourly = date.indexOf("T") == 10 || isHourlyDataPointThresholdTriggered(
        new Date(initialPeriodStartDate).getTime(),
        new Date(initialPeriodEndDate).getTime(),
        threshold,
        hasInsufficientHourlyData(Object.values(indices && indices[section] && indices[section][date] && indices[section][date][type] ?
          indices[section][date][type]
        :
          {})
      ));

      let scheduleDates = getActiveSchedulePeriodStartAndEndDay(schedules, initialPeriod, "JSON", isRolling, "UTC", isHourly, false);

      if (!scheduleDates) {

        scheduleDates = getLatestSchedulePeriodStartAndEndDay(schedules, initialPeriod, "JSON", isRolling, "UTC", isHourly, false);

      }

      if (!scheduleDates) return "";

      const [periodStartDate, periodEndDate] = scheduleDates.split(" - ");

      const startDateMs = new Date(periodStartDate).getTime();
      const endDateMs = new Date(periodEndDate).getTime();

      const periodLength = isHourly ?
        (Math.floor((endDateMs - startDateMs) / 1000 / 60 / 60) + 1)
      :
        Math.floor((endDateMs - startDateMs) / 1000 / 60 / 60 / 24);

      return isRolling ?
        `Last ${periodLength} ${isHourly ? "Hour" : "Day"}${periodLength > 1 ? "s" : ""}`
      :
        `Current ${periodLength} ${isHourly ? "Hour" : "Day"}${periodLength > 1 ? "s" : ""} Period`;

    } else {

      return "";

    }
    
  }, []);

  return indicesForDateRangeQueries.isSuccess ?
    <>
      { tenantConfig.enableHeatmap && <>
        <View className={styles.infoContainer}>
          <Flex className={styles.infoContent}>
            <View className={styles.measurementContainer}>
              { Object.keys(tenantConfig.measurements || {})
                .filter(measurement => tenantConfig.measurements[measurement].enabled &&
                  tenantConfig.measurements[measurement].displayOnView != "details").length ?
                <MeasurementType current={indicesType} options={tenantConfig.measurements} tenantId={tenantId}
                  onChangeHandler={setMeasurementsType} locationId={location.ENTITY_TYPE_ID.replace("LOCATION#", "")} />
              :
                <></>
              }
            </View>
            <View className={styles.legendContainer}>
              <IndexLegend type={indicesType} />
            </View>
            <View className={styles.growthCycleContainer}>
              <Flex className={styles.duration}>
                <Image src="/images/calendar.svg" alt="" title="Growth cycle duration" />
                <View className={styles.durationLabel}>
                  { getDurationLabel(scheduleData, Number.parseInt(tenantConfig.details.trendlinePeriod || "48", 10),
                    tenantConfig.details.rollingTrendlinePeriod, location.TIMEZONE_ID) }
                </View>
              </Flex>
              <View className={styles.growthCycleLabelContainer}>
                <Text className={genericStyles.progressLabel}>
                  { getTimePeriodLabel(scheduleData, Number.parseInt(tenantConfig.details.trendlinePeriod || "48", 10),
                  Number.parseInt(tenantConfig.defaultHourlyDailyDataThreshold || "72", 10), tenantConfig.details.rollingTrendlinePeriod, sectionMeasurements,
                  sectionId, (indicesDate || defaultMeasurementsDate), indicesType) }
                </Text>
              </View>
              { scheduleData.length > 0 && <>
                <GrowthCycleProgress area={areaData[0]} tenantId={tenantId}
                  schedules={getActiveSchedule(scheduleData) ? [getActiveSchedule(scheduleData)] : getLatestSchedule(scheduleData) ? [getLatestSchedule(scheduleData)] : []}
                  period={Number.parseInt(tenantConfig.details.trendlinePeriod || "48", 10)} isRollingPeriod={tenantConfig.details.rollingTrendlinePeriod}
                  hourlyDailyThreshold={Number.parseInt(tenantConfig.defaultHourlyDailyDataThreshold || "72", 10)} tz={location.TIMEZONE_ID || "UTC"}
                  periodStart={(getActiveSchedulePeriodStartAndEndDay(scheduleData,
                    Number.parseInt(tenantConfig.details.trendlinePeriod || "48", 10),
                    "JSON",
                    tenantConfig.details.rollingTrendlinePeriod,
                    "UTC",
                    Number.parseInt(tenantConfig.details.trendlinePeriod || "48", 10) <= 24 ? true : false,
                    Number.parseInt(tenantConfig.details.trendlinePeriod || "48", 10) <= 1 ? true : false)
                    ||
                    getLatestSchedulePeriodStartAndEndDay(scheduleData,
                    Number.parseInt(tenantConfig.details.trendlinePeriod || "48", 10),
                    "JSON",
                    tenantConfig.details.rollingTrendlinePeriod,
                    "UTC",
                    Number.parseInt(tenantConfig.details.trendlinePeriod || "48", 10) <= 24 ? true : false,
                    Number.parseInt(tenantConfig.details.trendlinePeriod || "48", 10) <= 1 ? true : false)
                  ).split(" - ")[0]}
                  periodEnd={(getActiveSchedulePeriodStartAndEndDay(scheduleData,
                    Number.parseInt(tenantConfig.details.trendlinePeriod || "48", 10),
                    "JSON",
                    tenantConfig.details.rollingTrendlinePeriod,
                    "UTC",
                    Number.parseInt(tenantConfig.details.trendlinePeriod || "48", 10) <= 24 ? true : false,
                    Number.parseInt(tenantConfig.details.trendlinePeriod || "48", 10) <= 1 ? true : false)
                    ||
                    getLatestSchedulePeriodStartAndEndDay(scheduleData,
                    Number.parseInt(tenantConfig.details.trendlinePeriod || "48", 10),
                    "JSON",
                    tenantConfig.details.rollingTrendlinePeriod,
                    "UTC",
                    Number.parseInt(tenantConfig.details.trendlinePeriod || "48", 10) <= 24 ? true : false,
                    Number.parseInt(tenantConfig.details.trendlinePeriod || "48", 10) <= 1 ? true : false)
                  )
                  .split(" - ")[1]}
                  isHourly={Number.parseInt(tenantConfig.details.trendlinePeriod || "48", 10) <= 24 ? true : false}
                  isMinutes={Number.parseInt(tenantConfig.details.trendlinePeriod || "48", 10) <= 1 ? true : false}
                  variant="thin" sliderValue={(indicesDate || defaultMeasurementsDate)} sliderChangeHandler={setMeasurementsDate} isSlideable={indicesForDateRangeQueries.isSuccess} 
                />
                <Flex className={styles.durationLabelsContainer}>
                  {/* Assumption that all areas in a location are growing the same thing */}
                  { getActiveSchedule(scheduleData) || getLatestSchedule(scheduleData) ?
                      (getActiveSchedulePeriodStartAndEndDay(scheduleData,
                        Number.parseInt(tenantConfig.details.trendlinePeriod || "48", 10),
                        Number.parseInt(tenantConfig.details.trendlinePeriod || "48", 10) <= 24 ? "HH:mm" : "Mmm DD",
                        tenantConfig.details.rollingTrendlinePeriod,
                        location.TIMEZONE_ID || "UTC",
                        Number.parseInt(tenantConfig.details.trendlinePeriod || "48", 10) <= 24 ? true : false,
                        Number.parseInt(tenantConfig.details.trendlinePeriod || "48", 10) <= 1 ? true : false)
                        ||
                        getLatestSchedulePeriodStartAndEndDay(scheduleData,
                        Number.parseInt(tenantConfig.details.trendlinePeriod || "48", 10),
                        Number.parseInt(tenantConfig.details.trendlinePeriod || "48", 10) <= 24 ? "HH:mm" : "Mmm DD",
                        tenantConfig.details.rollingTrendlinePeriod,
                        location.TIMEZONE_ID || "UTC",
                        Number.parseInt(tenantConfig.details.trendlinePeriod || "48", 10) <= 24 ? true : false,
                        Number.parseInt(tenantConfig.details.trendlinePeriod || "48", 10) <= 1 ? true : false)
                      )
                      .split(" - ")
                      .map((date, idx) => {
                        return <Text key={date} className={idx == 1 && isScheduleComplete(scheduleData) ?
                          styles.locationDuration100PcText
                        :
                          styles.locationDurationText
                        }>{date}</Text>
                      })
                  :
                      <>
                        <Text className={styles.locationDurationText}>&nbsp;</Text>
                        <Text className={styles.locationDurationText}>&nbsp;</Text>
                      </>
                  }
                </Flex>
              </> }
            </View>
          </Flex>
        </View>
      </> }
      { areaData.find(area => area.CA_DIMENSIONS) &&
        getOrderedCollection(areaData
          .filter(area => !area.DELETED_AT && area.CA_DIMENSIONS)
          .sort((a, b) => caDimSort(a, b, "asc")),
          location,
          sectionMeasurements[sectionId] &&
          sectionMeasurements[sectionId][(indicesDate || defaultMeasurementsDate)] ?
            sectionMeasurements[sectionId][(indicesDate || defaultMeasurementsDate)][indicesType]
          : {},
          indicesType,
          tenantId,
          scheduleData,
          Number.parseInt(tenantConfig.details.trendlinePeriod || "48", 10),
          Number.parseInt(tenantConfig.defaultHourlyDailyDataThreshold || "72", 10),
          tenantConfig.details.rollingTrendlinePeriod
        )
      }
      { getUnorderedCollection(areaData
          .filter(area => !area.DELETED_AT && !area.CA_DIMENSIONS),
          location,
          sectionMeasurements[sectionId] &&
          sectionMeasurements[sectionId][(indicesDate || defaultMeasurementsDate)] ?
            sectionMeasurements[sectionId][(indicesDate || defaultMeasurementsDate)][indicesType]
          : {},
          indicesType,
          tenantId,
          scheduleData,
          Number.parseInt(tenantConfig.details.trendlinePeriod || "48", 10),
          Number.parseInt(tenantConfig.defaultHourlyDailyDataThreshold || "72", 10),
          tenantConfig.details.rollingTrendlinePeriod
      ) }
    </>
  :
    <View className={styles.loadingContainer}>
      <Loader size="large" emptyColor="#F2F2F7" filledColor="#89BC2B" />
    </View>;

}

export default AreasSection;

AreasSection.propTypes = {
  sectionId: PropTypes.string,
  areaData: PropTypes.arrayOf(PropTypes.object),
  scheduleData: PropTypes.arrayOf(PropTypes.object),
  alertData: PropTypes.arrayOf(PropTypes.object),
  tenantId: PropTypes.string,
  tenantConfig: PropTypes.object,
  location: PropTypes.object,
  clickHandler: PropTypes.func,
  viewToggle: PropTypes.string,
  pageNo: PropTypes.number,
  fromDate: PropTypes.string,
  toDate: PropTypes.string
};