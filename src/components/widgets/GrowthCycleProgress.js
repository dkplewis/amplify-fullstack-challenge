import { useState, useMemo, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { View } from '@aws-amplify/ui-react';
import { debounce } from 'lodash';
import moment from 'moment';
import ReactSlider from 'react-slider';
import { SVGLoader } from '@/components/widgets/SVGLoader';
import { getActiveSchedule, getCurrentCyclePoint, getCycleDurationInDays, getFormattedDate,
  getCurrentCycleDayAsPercentageOfCycle, getCurrentCycleDayAsPercentageOfPeriod, getDaysAgoInCycleAsPercentageOfCycle,
  isScheduleComplete, isScheduleRunning } from '@/utils/datetime';

import styles from '@/component-styles/widgets/GrowthCycleProgress.module.css';

const GrowthCycleProgress = ({ schedules = [], area, variant = "standard", showNoData = false, 
  sliderValue = "", sliderChangeHandler = (yyyyddmm) => {}, isSlideable = false,
  periodStart, periodEnd, period, isRollingPeriod, hourlyDailyThreshold, isHourly = false, isMinutes = false, tz = "UTC",
  tenantId, onClickHandler }) => {

  const [value, setValue] = useState(getCurrentCyclePoint(schedules, period, isRollingPeriod, isHourly, isMinutes));

  const doSliderChangeHandler = () => {

    const [newDate, newTime] = moment(periodStart).add(value, isMinutes ? "m" : isHourly ? "h" : "d").toJSON().split("T");
    const newValue = newDate + (isMinutes ?
      "T" + newTime.split(":").slice(0, 2).join(":") + ":00"
    : isHourly ?
      "T" + newTime.split(":")[0] + ":00"
    : "");
    sliderChangeHandler(newValue);

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
    <View className={styles.rangeSliderContainer}>
      <ReactSlider min={0} max={Math.ceil(moment.duration(moment(periodEnd).diff(moment(periodStart))).as(isMinutes ? "minutes" : isHourly ? "hours" : "days"))} step={1}
        value={value} onChange={onChangeHandler} renderThumb={renderThumb} renderTrack={renderTrack} />
    </View>
  </View>;

}

export default GrowthCycleProgress;

const dateTimeString = (props, propName, componentName) => {
  if (props[propName] && isNaN(Date.parse(props[propName]))) {
    return new Error(`Invalid prop ${propName} supplied to ${componentName}. Validation failed.`);
  }
};

GrowthCycleProgress.propTypes = {
  area: PropTypes.object.isRequired,
  schedules: PropTypes.array.isRequired,
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
  tenantId: PropTypes.string,
  onClickHandler: PropTypes.func,
  variant: PropTypes.string
};