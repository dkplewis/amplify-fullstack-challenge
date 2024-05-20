import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import dynamic from 'next/dynamic';
import { Analytics } from 'aws-amplify';
import { Button, Flex, Image, Input, Label, View } from '@aws-amplify/ui-react';
import { components } from 'react-select';
import DatePicker from 'react-datepicker';

import styles from '@/component-styles/widgets/PeriodSelector.module.css';

import 'react-datepicker/dist/react-datepicker.css';

const DAYS_IN_MONTH = [31, (new Date(new Date().getFullYear(), 1, 29).getMonth() == 1 ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

const Select = dynamic(() => import("react-select"), {
  ssr: false
});

const PeriodSelector = ({ period = 720, defaultPeriod = 48, tenantId, area, schedule, periodChangeHandler, idPrefix,
  showDateRange = false, timeUnit, timeUnitHandler = (newUnit) => {}, dateRange, setDateRangeHandler = (newDateRange) => {} }) => {

  const customStyles = {
    control: (defaultStyles) => ({
      ...defaultStyles,
      backgroundColor: "transparent",
      padding: 0,
      border: "none",
      boxShadow: "none",
      width: "6rem",
      cursor: "pointer"
    }),
    dropdownIndicator: (defaultStyles, state) => ({
      ...defaultStyles,
      color: "#fff",
      "&:hover": {
        color: "#fff",
      },
      "svg": {
        width: "0.8rem"
      }
    }),
    indicatorsContainer: (defaultStyles) => ({
      ...defaultStyles,
      paddingBottom: "2px",
      width: "1rem"
    }),
    menu: (defaultStyles) => ({
      ...defaultStyles,
      backgroundColor: "#3a3a3c",
      border: "1px solid #f2f2f7",
      borderRadius: "3px",
      marginTop: 0,
      width: "10rem",
      zIndex: 1002
    }),
    menuList: (defaultStyles) => ({
      ...defaultStyles,
      padding: "0.5rem 0"
    }),
    option: (defaultStyles, state) => ({
      ...defaultStyles,
      color: "#fff",
      opacity: state.isSelected ? 1 : 0.35,
      backgroundColor: "transparent",
      fontSize: "0.675rem",
      fontWeight: 400,
      letterSpacing: "0.05em",
      textTransform: "uppercase",
      textAlign: "left",
      cursor: "pointer",
      padding: "0 0.25rem 0 1rem",
      marginBottom: 0,
      "&:hover": {
        opacity: 1,
        backgroundColor: "transparent"
      }
    }),
    singleValue: (defaultStyles) => ({ ...defaultStyles, color: "#fff" }),
    valueContainer: (defaultStyles) => ({
      ...defaultStyles,
      minWidth: "4rem",
      fontSize: "0.675rem",
      fontWeight: 700,
      color: "#fff",
      letterSpacing: "0.05em",
      textTransform: "uppercase"
    })
  };

  // timePeriod stores the value entered for the current time unit
  // This will be the period / hours in the current unit
  const [timePeriod, setTimePeriod] = useState(null);
  const datesCalRef = useRef(null);

  useEffect(() => {

    setTimePeriod(getTimePeriodForUnit(period, timeUnit));

  }, [period, timeUnit]);
  
  const getTimePeriodForUnit = useCallback((hours, unit) => {

    let monthCount = 0;
    if (unit == "months") {

      let currMonth = (process.env.NEXT_PUBLIC_NOW ? new Date(process.env.NEXT_PUBLIC_NOW) : new Date()).getMonth();
      let monthHoursCounted = hours;
      while (monthHoursCounted > 0) {

        monthHoursCounted -= DAYS_IN_MONTH[currMonth] * 24;
        currMonth = currMonth == 0 ? 11 : currMonth - 1;
        monthCount += 1;

      }

    }

    return unit == "minutes" ? hours * 60 : unit == "hours" ? hours : unit == "days" ? hours / 24 : unit == "weeks" ? hours / 168 : unit == "months" ? monthCount : -1;

  }, []);

  const timePeriodFromProps = useMemo(() => getTimePeriodForUnit(period, timeUnit), [period, timeUnit, getTimePeriodForUnit]);

  const onPeriodChange = (value) => {

    if (value != "" && isNaN(Number.parseInt(value, 10))) return false;

    setTimePeriod(value ? Number.parseInt(value, 10) : 0);

  };

  const onPeriodBlur = () => {

    let value = timePeriod;
    if (timeUnit == "days" && value < 1) {

      value = 2;

    } else if (value < 1) {

      value = 1;

    }
    let hoursInMonths = 0;
    if (timeUnit == "months") {

      let currMonth = (process.env.NEXT_PUBLIC_NOW ? new Date(process.env.NEXT_PUBLIC_NOW) : new Date()).getMonth();
      let count = 0;
      while (count < timePeriod) {

        hoursInMonths += DAYS_IN_MONTH[currMonth] * 24;
        currMonth = currMonth == 0 ? 11 : currMonth - 1;
        count += 1;

      }

    }
    setTimePeriod(value);
    periodChangeHandler(timeUnit == "minutes" ? value / 60 : timeUnit == "hours" ? value : timeUnit == "days" ? value * 24 : timeUnit == "weeks" ? value * 168 : hoursInMonths);

    // record will only fire if analytics are enabled 
    Analytics.record({
      name: "timeSeriesPeriodChange",
      attributes: {
        tenantId: tenantId,
        area: area.NAME,
        period: value + " " + timeUnit
      }
    })
    .catch((error) => error.message.indexOf("No credentials, applicationId or region") == -1 ?
      console.error(error)
    :
      {}
    );

  };

  const onPeriodUnitChange = (value) => {

    const newValue = value.value;

    timeUnitHandler(newValue);

    let timePeriod = newValue == "minutes" ? 30 : newValue == "hours" ? defaultPeriod : newValue == "days" ? defaultPeriod < 24 ? defaultPeriod : defaultPeriod / 24 : newValue == "weeks" || newValue == "months" ? 1 : -1;
    if (newValue != "range") setTimePeriod(timePeriod);

    let hoursInMonths = 0;
    if (newValue == "months") {

      let currMonth = (process.env.NEXT_PUBLIC_NOW ? new Date(process.env.NEXT_PUBLIC_NOW) : new Date()).getMonth();
      let count = 0;
      while (count < timePeriod) {

        hoursInMonths += DAYS_IN_MONTH[currMonth] * 24;
        currMonth = currMonth == 0 ? 11 : currMonth - 1;
        count += 1;

      }

    }

    if (newValue == "growth cycle") {

      timePeriod = -1;

    }

    if (newValue != "range") {

      periodChangeHandler(newValue == "minutes" ? timePeriod / 60 : newValue == "hours" ? timePeriod : newValue == "days" ? timePeriod * 24 : newValue == "weeks" ? timePeriod * 168 : newValue == "months" ? hoursInMonths : -1);
      setDateRangeHandler([null, null]);

      // record will only fire if analytics are enabled 
      Analytics.record({
        name: "timeSeriesUnitChange",
        attributes: {
          tenantId: tenantId,
          area: area.NAME,
          period: timePeriod + " " + newValue
        }
      })
      .catch((error) => error.message.indexOf("No credentials, applicationId or region") == -1 ?
        console.error(error)
      :
        {}
      );

    } else {

      periodChangeHandler(null);

    }

  };

  const { Option } = components;
  const IconOption = (props) => {

    return <Option {...props}>
      <Flex alignItems="center">
        <View style={{ width: "73%", borderBottom: "1px solid #636366", padding: "0.1rem 0" }}>
          {props.data.label}
        </View>
        { props.data.icon && <View>
          <Image
            src={`/images/${props.data.icon}`}
            style={{ width: 24 }}
            alt={props.data.label}
          />
        </View> }
      </Flex>
    </Option>;

  };

  return <Flex className={styles.periodSelector}>
    { !(["growth cycle", "range"].includes(timeUnit)) ?
      <>
        <Label className={styles.label} htmlFor={idPrefix + "_period"}>Last</Label>
        <Input className={styles.input} name="period" id={idPrefix + "_period"} value={timePeriod == 0 ? "" : (timePeriod || timePeriodFromProps)}
          onChange={(evt) => onPeriodChange(evt.target.value)} onBlur={(evt) => onPeriodBlur()}
          onKeyDown={(evt) => evt.code == "Enter" ? onPeriodBlur() : null}  />
      </>
    : timeUnit == "range" ?
      <>
        <Image src="/images/calendar.svg" alt="" title="Range selection" />
        <DatePicker ref={datesCalRef} isClearable={true} shouldCloseOnSelect={true}
          className={`amplify-input amplify-field-group__control ${styles.inputRange}`} dateFormat="MMM dd" enableTabLoop={false}
          onChange={(dates) => setDateRangeHandler(dates)} allowSameDay={true} maxDate={(process.env.NEXT_PUBLIC_NOW ? new Date(process.env.NEXT_PUBLIC_NOW) : new Date())}
          minDate={schedule ? new Date(schedule.CYCLE_STARTED_AT) : null}
          selectsRange={true} startDate={dateRange[0]} endDate={dateRange[1]}
          renderCustomHeader={({
            date,
            changeYear,
            changeMonth,
            decreaseMonth,
            increaseMonth,
            prevMonthButtonDisabled,
            nextMonthButtonDisabled,
          }) => (
            <Flex className="react-datepicker__header">
              <Button className="borderless-button" onClick={decreaseMonth} disabled={prevMonthButtonDisabled}>
                &laquo;
              </Button>
              <View className="react-datepicker__current-month">{date.toLocaleString("en-GB", {
                month: "long",
                year: "numeric",
              })}</View>
              <Button className="borderless-button" onClick={increaseMonth} disabled={nextMonthButtonDisabled}>
                &raquo;
              </Button>
            </Flex>
          )}>
          <Flex className={styles.datePickerButtons}>
            <Button className="borderless-button" onClick={() => {
                datesCalRef.current.setOpen(false);
              }}
            >
              Cancel
            </Button>
          </Flex>
        </DatePicker>
      </>
    :
      <></>
    }
    <Select menuPlacement="auto" value={{ value: timeUnit, label: timeUnit }} styles={customStyles} onChange={onPeriodUnitChange}
      components={{
        IndicatorSeparator: () => null,
        Option: IconOption
      }}
      options={[
        { value: "minutes", label: "minutes", icon: timeUnit == "minutes" ? "tick-active.svg" : "" },
        { value: "hours", label: "hours", icon: timeUnit == "hours" ? "tick-active.svg" : "" },
        { value: "days", label: "days", icon: timeUnit == "days" ? "tick-active.svg" : "" }, 
        { value: "weeks", label: "weeks", icon: timeUnit == "weeks" ? "tick-active.svg" : "" },
        { value: "months", label: "months", icon: timeUnit == "months" ? "tick-active.svg" : "" }, 
        showDateRange ?
          { value: "range", label: "range", icon: timeUnit == "range" ? "tick-active.svg" : "" }
        :
          { value: "growth cycle", label: "growth cycle", icon: timeUnit == "growth cycle" ? "tick-active.svg" : "" }
      ]} />
  </Flex>;

};

export default PeriodSelector;

PeriodSelector.propTypes = {
  period: PropTypes.number.isRequired,
  periodChangeHandler: PropTypes.func,
  defaultPeriod: PropTypes.number.isRequired,
  tenantId: PropTypes.string,
  area: PropTypes.object,
  schedule: PropTypes.object,
  showDateRange: PropTypes.bool.isRequired,
  timeUnit: PropTypes.string,
  timeUnitHandler: PropTypes.func,
  dateRange: PropTypes.arrayOf(PropTypes.object),
  setDateRangeHandler: PropTypes.func
};