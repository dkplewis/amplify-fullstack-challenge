import { useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Collection, Loader, View } from '@aws-amplify/ui-react';
import { useQueries } from '@tanstack/react-query';
import Area from '@/components/display/Area';
import { getLocationMeasurementsDataByDatesAndType } from '@/utils/crud';
import { getActiveSchedulePeriodStartAndEndDay, getActiveScheduleStartDate, getDifferenceInHours,
  getLatestSchedulePeriodStartAndEndDay, getLatestScheduleStartDate, getLatestIndexValue,
  hasInsufficientHourlyData,isHourlyDataPointThresholdTriggered } from '@/utils/datetime';

import styles from '@/component-styles/display/Areas.module.css';

const AreasSection = ({ sectionId, areaData = [], scheduleData = [],
  tenantId, tenantConfig, location, clickHandler, pageNo }) => {

  const [measuresDate, setMeasurementsDate] = useState(null);
  const [measuresType, setMeasurementsType] = useState("SUPPLY");

  const [fromDate, toDate] = useMemo(() => {

    let from = (process.env.NEXT_PUBLIC_NOW ?? new Date().toJSON()).split("T")[0];
    const toDateStr = (process.env.NEXT_PUBLIC_NOW ?? new Date().toJSON());
    let to = toDateStr.split("T")[0];

    const activeScheduleStartDate = getActiveScheduleStartDate(scheduleData
      .filter((schedule) => schedule.gsi2Pk == location.entityTypeId),
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

      console.debug("Showing measures data from " + from +
        (from.indexOf("T") == 10 ? from.lastIndexOf(":") != 16 ? ":00" : "" : ":00") +
        " to " + to + " for " + location.name + "...");

    } else {

      const latestScheduleStartDate = getLatestScheduleStartDate(scheduleData
        .filter((schedule) => schedule.gsi2Pk == location.entityTypeId),
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

        console.debug("Showing historic measures data from " + from +
          (from.indexOf("T") == 10 ? from.lastIndexOf(":") != 16 ? ":00" : "" : ":00") +
          " to " + to + " for " + location.name + "...");

      }

    }

    return [from, to];

  }, [scheduleData, location, tenantConfig, measuresDate]);

  const measuresForDateRangeQueries = useQueries({
    queries: !fromDate && !toDate ? [] : Object.keys(tenantConfig.measurements || {})
      .filter(measurement => tenantConfig.measurements[measurement].enabled)
      .map((measureType) => {
        return {
          queryKey: [
            "locationMeasurementsByDatesAndType",
            tenantId,
            (sectionId?.split("_")[1] || "").replace("LOCATION#", ""),
            fromDate,
            toDate,
            measureType,
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
            datum.gsi5Sk.lastIndexOf(":") == 16
          : fromDate.lastIndexOf(":") == 13 ?
            datum.gsi5Sk.lastIndexOf(":") == 13
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

    if (measuresForDateRangeQueries.isRefetching) setMeasurementsDate(new Date().toJSON().substring(0, 16) + ":00");

  }, [measuresForDateRangeQueries.isRefetching]);
  
  const sectionMeasurements = useMemo(() => {

    let result = {};

    if (measuresForDateRangeQueries.isSuccess) {

      result[sectionId] = {};

      measuresForDateRangeQueries.data.forEach((measureDatum) => {

        const areaId = measureDatum.entityType.split("#")[1];
        const measureType = measureDatum.gsi5Pk.split("#")[1];
        const measureDate = measureDatum.gsi5Sk.split("#")[0];
        if (!result[sectionId][measureDate]) result[sectionId][measureDate] = {};
        if (!result[sectionId][measureDate][measureType]) result[sectionId][measureDate][measureType] = {};
        result[sectionId][measureDate][measureType][areaId] = {...measureDatum};
    
      })

    }

    return result;

  }, [measuresForDateRangeQueries, sectionId]);

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

  const getUnorderedCollection = useCallback((collectionItems, location, measureData, currentType, tenantId,
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
        hasInsufficientHourlyData(Object.values(measureData ?? {})));

    }

    return <Collection type="list" role="list" className="locationCollection"
      items={collectionItems}
      direction="row"
      wrap="wrap">
      {(item) => (
        <View key={item.entityTypeId} role="listitem" className={`locationCollectionTile ${styles.dAreaCollectionTile}`}>
          <Area location={location} area={item}
            locationTypeConfig={getLocationTypeConfig(tenantConfig)} 
            resourcesBucket={tenantConfig.resources} onClickHandler={clickHandler}
            viewType={currentType}
            measureValue={getLatestIndexValue(measureData ? measureData[item.entityTypeId.replace("AREA#", "")]: null,
              isHourly, item.entityTypeId)}
            tenantId={tenantId}
          />
        </View>
      )}
    </Collection>;

  }, [clickHandler, scheduleData, tenantConfig, pageNo]);

  return measuresForDateRangeQueries.isSuccess ?
    <>
      { getUnorderedCollection(areaData
          .filter(area => !area.deletedAt),
          location,
          sectionMeasurements[sectionId] &&
          sectionMeasurements[sectionId][(measuresDate || defaultMeasurementsDate)] ?
            sectionMeasurements[sectionId][(measuresDate || defaultMeasurementsDate)][measuresType]
          : {},
          measuresType,
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