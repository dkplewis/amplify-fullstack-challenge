import { useState, useMemo, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Analytics } from 'aws-amplify';
import { View } from '@aws-amplify/ui-react';
import debounce from 'lodash.debounce';
import moment from 'moment';
import ReactSlider from 'react-slider';
import { GardinLoader } from '@/components/widgets/GardinLoader';
import { getAllAlertsForArea } from '@/utils/location';
import { getActiveSchedule, getCurrentCyclePoint, getCycleDurationInDays, getLatestAlertForArea, getFormattedDate,
  getCurrentCycleDayAsPercentageOfCycle, getCurrentCycleDayAsPercentageOfPeriod, getDaysAgoInCycleAsPercentageOfCycle,
  isScheduleComplete, isScheduleRunning, getAlertCreatedDayAsPercentageOfCycle,
  getAlertResolvedDayAsPercentageOfCycle, getAlertCreatedDayAsPercentageOfPeriod, getAlertResolvedDayAsPercentageOfPeriod,
  getYesterdayTomorrowAdjustment } from '@/utils/datetime';

import styles from '@/component-styles/widgets/GrowthCycleProgress.module.css';

const GrowthCycleProgress = ({ schedules = [], area, alerts = [], variant = "standard", showNoData = false, 
  showActiveState = false, showResolvedState = false, showAlertHistory = false, showAlertHistoryDuration = false,
  showLatestAlertOnlyInHistory = false, sliderValue = "", sliderChangeHandler = (yyyyddmm) => {}, isSlideable = false,
  periodStart, periodEnd, period, isRollingPeriod, hourlyDailyThreshold, isHourly = false, isMinutes = false, tz = "UTC",
  selectedAlert, tenantId, onClickHandler }) => {

  const [value, setValue] = useState(getCurrentCyclePoint(schedules, period, isRollingPeriod, isHourly, isMinutes));

  const doSliderChangeHandler = () => {

    const [newDate, newTime] = moment(periodStart).add(value, isMinutes ? "m" : isHourly ? "h" : "d").toJSON().split("T");
    const newValue = newDate + (isMinutes ?
      "T" + newTime.split(":").slice(0, 2).join(":") + ":00"
    : isHourly ?
      "T" + newTime.split(":")[0] + ":00"
    : "");
    sliderChangeHandler(newValue);

    // record will only fire if analytics are enabled 
    Analytics.record({
      name: "currentDayChange",
      attributes: {
        area: area.NAME,
        tenantId: tenantId,
        date: newDate
      }
    })
    .catch((error) => error.message.indexOf("No credentials, applicationId or region") == -1 ?
      console.error(error)
    :
      {}
    );

  };

  const ref = useRef(doSliderChangeHandler);
  
  useEffect(() => {

    ref.current = doSliderChangeHandler;

  }, [value]);

  const onChangeHandler = (newValue) => {

    const currentCyclePoint = getCurrentCyclePoint(schedules, period, isRollingPeriod, isHourly, isMinutes);
    const startingValue = newValue <= currentCyclePoint ? newValue : currentCyclePoint;
    if (isSlideable) {

      setValue(startingValue);
      debouncedOnChangeHandler();
  
    }
  
  };

  const debouncedOnChangeHandler = useMemo(() => {

    const debouncedFunction = () => {

      // ref is mutable! ref.current is a reference to the latest sendRequest
      ref.current?.();

    };

    return debounce(debouncedFunction, 300);
  
  }, []);

  const renderThumb = (props, state) => {

    return <View {...props} className={styles.thumbContainer}>
      <View className={isSlideable ? styles.activeThumb : styles.inactiveThumb}>
        <View className={styles.thumbLabel}>{ periodStart ?
          getFormattedDate(moment(periodStart).add(state.valueNow, isMinutes ? "m" : isHourly ? "h" : "d").toDate(), isMinutes || isHourly ? "HH:mm" : "Mmm DD", tz)
        :
          ""
        }</View>
      </View>
    </View>;

  };

  const renderTrack = (props, state) => {

    return <View {...props}>
      <View className={isSlideable ? styles.activeTrack : styles.inactiveTrack} style={{
        width: `$[state.offset}px`,
        left: `${state.valueNow}%`
      }}/>
    </View>;

  };
  
  return <View className={styles.progress} title={isScheduleComplete(schedules) ? 
    "Growth cycle completed"
  :
    "Day " + getCurrentCyclePoint(schedules, 0, false, false) + " of " + 
    getCycleDurationInDays(schedules) + " (" + 
    getDaysAgoInCycleAsPercentageOfCycle(0, schedules) + "% completed)"
  }>
    { sliderValue != "" && schedules.length > 0 ?
      <View className={styles.rangeSliderContainer}>
        <ReactSlider min={0} max={Math.ceil(moment.duration(moment(periodEnd).diff(moment(periodStart))).as(isMinutes ? "minutes" : isHourly ? "hours" : "days"))} step={1}
          value={value} onChange={onChangeHandler} renderThumb={renderThumb} renderTrack={renderTrack} />
      </View>
    :
      <GardinLoader variant={variant} showActiveAlert={showActiveState} showResolvedAlert={showResolvedState} tenantId={tenantId}
        showAlertHistory={showAlertHistory} showAlertHistoryDuration={showAlertHistoryDuration} showLatestAlertOnlyInHistory={showLatestAlertOnlyInHistory}
        percentage={isScheduleRunning(schedules) ?
          periodStart && periodEnd ?
            getCurrentCycleDayAsPercentageOfPeriod(periodStart, periodEnd, isHourly)
          :
            getCurrentCycleDayAsPercentageOfCycle(schedules)
        : isScheduleComplete(schedules) ?
          100
        :
          0
        }
        startPercentage={isScheduleRunning(schedules) && (showActiveState || showResolvedState) ?
          periodStart && periodEnd ?
            getAlertCreatedDayAsPercentageOfPeriod(getLatestAlertForArea(alerts, area.ENTITY_TYPE_ID), area, periodStart, periodEnd, isHourly)
          :
            getAlertCreatedDayAsPercentageOfCycle(getLatestAlertForArea(alerts, area.ENTITY_TYPE_ID), area, schedules)
        :
          0
        }
        endPercentage={isScheduleRunning(schedules) && (showActiveState || showResolvedState) ?
          periodStart && periodEnd ?
            getAlertResolvedDayAsPercentageOfPeriod(getLatestAlertForArea(alerts, area.ENTITY_TYPE_ID), area, periodStart, periodEnd, isHourly)
          :
            getAlertResolvedDayAsPercentageOfCycle(getLatestAlertForArea(alerts, area.ENTITY_TYPE_ID), area, schedules)
        :
          0
        }
        borderColor={ variant == "standard" ? "#636366" : null }
        emptyColor={ variant == "standard" ? "#3a3a3c" : "#636366" } filledColor="#fff" noDataColor="#000" activeAlertColor="#f5d205" resolvedAlertColor="#89bc2b"
        area={area} schedules={schedules} showNoData={showNoData}
        alerts={periodStart && periodEnd ? 
          getAllAlertsForArea(alerts, area, schedules.length == 1 ? schedules[0] : getActiveSchedule(schedules))
            .filter(alert => !alert.CLOSED_AT || alert.CLOSED_AT > periodStart)
        :
          getAllAlertsForArea(alerts, area, schedules.length == 1 ? schedules[0] : getActiveSchedule(schedules))
        } periodStart={periodStart} periodEnd={periodEnd} threshold={hourlyDailyThreshold} isHourly={isHourly} selectedAlert={selectedAlert} onClickHandler={onClickHandler}
      />
    }
  </View>;

}

export default GrowthCycleProgress;

const dateTimeString = (props, propName, componentName) => {
  if (props[propName] && isNaN(Date.parse(props[propName]))) {
    return new Error(`Invalid prop ${propName} supplied to ${componentName}. Validation failed.`);
  }
};

GrowthCycleProgress.propTypes = {
  alerts: PropTypes.array.isRequired,
  area: PropTypes.object.isRequired,
  schedules: PropTypes.array.isRequired,
  showActiveState: PropTypes.bool,
  showAlertHistory: PropTypes.bool,
  showAlertHistoryDuration: PropTypes.bool,
  showLatestAlertOnlyInHistory: PropTypes.bool,
  showResolvedState: PropTypes.bool,
  showNoData: PropTypes.bool,
  sliderValue: PropTypes.string,
  sliderChangeHandler: PropTypes.func,
  isSlideable: PropTypes.bool,
  periodStart: dateTimeString,
  periodEnd: dateTimeString,
  period: PropTypes.number,
  isRollingPeriod: PropTypes.bool,
  hourlyDailyThreshold: PropTypes.number,
  isHourly: PropTypes.bool,
  tz: PropTypes.string,
  selectedAlert: PropTypes.object,
  tenantId: PropTypes.string,
  onClickHandler: PropTypes.func,
  variant: PropTypes.string
};