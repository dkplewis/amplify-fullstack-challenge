/** @module utils/datetime */

/**
 * Custom types
 * @typedef {(Object)} AmplifyClass
 * @typedef {(Object)} Alert
 * @typedef {(Object)} CognitoUser
 * @typedef {(Object)} Area
 * @typedef {({isError: boolean, message: string})} CSError
 * @typedef {(Object)} Schedule
 * @typedef {({schedules: Schedule[], indices: Index[], isError: boolean, message: string})} ScheduleMeasurementsData
 * @typedef {(Object)} Index
 * @typedef {(Object)} Location
 * @typedef {({rootLocation: Location, locations: Location[], topNavLocations: Location[], isError: boolean, message: string})} LocationData
 * @typedef {({rootLocation: Location, locations: Location[], tenantData: Tenant, topNavLocations: Location[], isError: boolean, message: string})} LocationTenantData
 * @typedef {({area: Area, areas: Area[], currentLocationPath: string, rootLocation: Location, locations: Location[], tenantData: Tenant, topNavLocations: Location[], zones: Zone[], isError: boolean, message: string})} AreaLocationTenantZonesData
 * @typedef {(Object)} SunriseSunset
 * @typedef {(Object)} Tenant
 * @typedef {(Object)} Zone
 */

import { getAlertSeverity } from '@/utils/location';

// Define how long an index is considered "fresh" in ms
// Initial value is 4h = 14,400,000
// 2022-12-23 1d = 86,400,000
const INDEX_FRESHNESS_INTERVAL = 86400000;

// Useful millisecond values
const SECONDS_MS_IN_MINUTE = 60000;
const MINUTES_SECONDS_MS_IN_HOUR = 3600000;
const END_OF_DAY_IN_MS = 86399999;
const HOURS_MINUTES_SECONDS_MS_IN_DAY = 86400000;

// Helpers

/**
 * 
 * @param {*} timeHHMM 
 * @param {*} minutes 
 * @returns 
 */
export const addMinutesToTime = (timeHHMM, minutes) => {

  // Input: A time string in the format hh:mm and the number of minutes to add
  // Output: The time string modified by the given number of minutes
  // Note: this doesn't change the day part of the date. This will need to be done manually for now.

  let timeParts = timeHHMM.split(":");

  // Increment the minute part by 1,
  // incrementing the hour part and resetting the minute part if the minute part moves to 60
  // and resetting the hour and minute part to 0 if the hour part moves to 24
  let newHour = parseInt(timeParts[0], 10);
  let newMinute = parseInt(timeParts[1], 10) + minutes;

  if (newMinute >= 60) {
    // Add the correct number of extra minutes
    newMinute = newMinute - 60;
    newHour = newHour + 1;
    
    if (newHour == 24) {
      
      newHour = 0;

    }

  }
  
  return (newHour < 10 ? "0" + newHour : newHour) +
    ":" +
    (newMinute < 10 ? "0" + newMinute : newMinute);

};

/**
 * 
 * @param {*} date 
 * @returns 
 */
export const getDaysAgo = (date) => {

  // Input: A date in the format YYYY-mm-DDTHH:MM:SSZ
  // Output: The difference in days between the given date and now
  // or 0 if no date has been given
  if (!date) return 0;

  return getDifferenceInDays((process.env.NEXT_PUBLIC_NOW ? new Date(process.env.NEXT_PUBLIC_NOW) : new Date()),
    new Date(date), true, true, true);

};

/**
 * 
 * @param {*} date1 
 * @param {*} date2 
 * @param {*} convertDate1 
 * @param {*} convertDate2 
 * @param {*} roundUp 
 * @returns 
 */
export const getDifferenceInDays = (date1, date2, convertDate1, convertDate2, roundUp) => {

  // Input: Date 1 as convertDate1  == false ? ms since epoch : date string,
  //        Date 2 as convertDate2  == false ? ms since epoch : date string
  // Output: The difference in days from Date 1 to Date 2
  // or 0 if one or both Dates are omitted
  if (!date1 || !date2) return 0;

  const date1Ms = convertDate1 ? date1.getTime() : date1;
  const date2Ms = convertDate2 ? date2.getTime() : date2;

  return roundUp ? 
    Math.ceil((date1Ms - date2Ms) / (1000 * 3600 * 24))
  :
    Math.floor((date1Ms - date2Ms) / (1000 * 3600 * 24));

};

/**
 * 
 * @param {*} date1 
 * @param {*} date2 
 * @param {*} convertDate1 
 * @param {*} convertDate2 
 * @returns 
 */
export const getDifferenceInHours = (date1, date2, convertDate1, convertDate2) => {

  // Input: Date 1 as convertDate1  == false ? ms since epoch : date string,
  //        Date 2 as convertDate2  == false ? ms since epoch : date string
  // Output: The difference in hours between Date 1 and Date 2
  // or 0 if one or both Dates are omitted
  if (!date1 || !date2) return 0;

  const date1Ms = convertDate1 ? date1.getTime() : date1;
  const date2Ms = convertDate2 ? date2.getTime() : date2;

  return Math.round((date1Ms - date2Ms) / (1000 * 3600));

};

/**
 * 
 * @param {*} date1 
 * @param {*} date2 
 * @param {*} convertDate1 
 * @param {*} convertDate2 
 * @returns 
 */
export const getDifferenceInMinutes = (date1, date2, convertDate1, convertDate2) => {

  // Input: Date 1 as convertDate1  == false ? ms since epoch : date string,
  //        Date 2 as convertDate2  == false ? ms since epoch : date string
  // Output: The difference in minutes between Date 1 and Date 2
  // or 0 if one or both Dates are omitted
  if (!date1 || !date2) return 0;

  const date1Ms = convertDate1 ? date1.getTime() : date1;
  const date2Ms = convertDate2 ? date2.getTime() : date2;

  return Math.round((date1Ms - date2Ms) / (1000 * 60));

};

/**
 * 
 * @param {*} date 
 * @param {*} fmt 
 * @param {*} tz 
 * @returns 
 */
export const getFormattedDate = (date, fmt, tz = "UTC") => {

  // Input: A date
  // Output: A string representation of the date, using the given format or short month, day of the month and full year
  // e.g. Dec 22, 2021
  // (days of month less than 10 are prefixed with 0)
  // or an empty string if no Date is provided
  if (!date || date == "Invalid Date") return "";

  let formattedDate = "";
  switch (fmt) {
    case "Mmmm DD":
      formattedDate = new Intl.DateTimeFormat("en-US", { month: "long", day: "2-digit", timeZone: tz })
        .format(date); 
      break;
    case "Mmm-DD":
    case "Mmm DD":
        // "en-US" gives us the Mmm DD format, with space replaced by hyphen
      formattedDate = new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit", timeZone: tz })
        .format(date)
        .replace(" ", fmt == "Mmm-DD" ? "-" : " "); 
      break;
    case "Mmm-DD-YYYY":
        // "en-US" gives us the Mmm DD format, with spaces replaced by hyphen
      formattedDate = new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit", year: "numeric", timeZone: tz })
        .format(date)
        .replace(" ", "-"). replace(", ", "-"); 
      break;
    case "HH:mm:ss":
      formattedDate = new Intl.DateTimeFormat("en-GB", { hourCycle: "h23", hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: tz })
        .format(date); 
      break;
    case "HH:mm":
      formattedDate = new Intl.DateTimeFormat("en-GB", { hourCycle: "h23", hour: "2-digit", minute: "2-digit", timeZone: tz })
        .format(date); 
      break;
    case "Mmm-DD HH:mm":
      // "en-US" gives us Mmm DD, HH:mm format
      formattedDate = new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit", hourCycle: "h23", hour: "2-digit", minute: "2-digit", timeZone: tz })
        .format(date)
        .split(", ")
        .join("_")
        .replace(" ", "-")
        .replace("_", " ");
      break;
    default:
      // "en-US" gives us the Mmm DD, YYYY format
      formattedDate = new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit", year: "numeric", timeZone: tz })
        .format(date);
      break;
  }
  return formattedDate;

};

/**
 * 
 * @param {*} date 
 * @returns 
 */
export const getHoursAgo = (date) => {

  // Input: A date in the format YYYY-mm-DDTHH:MM:SSZ
  // Output: The difference in hours between the given date and now
  // or 0 if no date has been given
  if (!date) return 0;

  return getDifferenceInHours(new Date(), new Date(date), true, true);

};

/**
 * 
 * @param {*} schedule 
 * @param {*} period 
 * @param {*} isRollingPeriod 
 * @param {*} isHourly 
 * @param {*} isMinutes 
 * @param {*} isSeconds 
 * @returns 
 */
export const getPeriodStartAndEndDate = (schedule, period, isRollingPeriod, isHourly, isMinutes, isSeconds) => {

  /*
    Given a Growth Job with a start and end date, and a period of days,
    calculate the start and end date of the period for the current day in the active Growth Job
    where the start date begins at midnight and the end date ends at 23:59:59.999
  */
  if (!schedule || period == null) return [];

  const now = (process.env.NEXT_PUBLIC_NOW ? new Date(process.env.NEXT_PUBLIC_NOW) : new Date()); 
  let periodStartDate, periodEndDate;

  if (period == -1) {

    let scheduleStartDateMs = new Date(schedule.CYCLE_STARTED_AT).setUTCHours(0, 0, 0, 0);
    let scheduleEndDateMs = new Date(schedule.CYCLE_COMPLETING_AT).setUTCHours(23, 59, 59, 999);

    return [ 
      scheduleStartDateMs,
      scheduleEndDateMs
    ];
  
  }

  const nowMs = !isMinutes && !isSeconds ? now.setUTCMinutes(0, 0 ,0) : !isSeconds ? now.setUTCSeconds(0, 0) : now.getTime();
  const periodMs = period * MINUTES_SECONDS_MS_IN_HOUR;

  const scheduleStartDate = new Date(schedule.CYCLE_STARTED_AT);
  const scheduleEndDate = new Date(schedule.CYCLE_COMPLETED_AT || schedule.CYCLE_COMPLETING_AT);

  if (isRollingPeriod) {
    
    let currPeriodStartDateMs = nowMs - periodMs;

    let scheduleStartDateMs = isSeconds ?
      scheduleStartDate.getTime()
    : isMinutes ?
      scheduleStartDate.setUTCSeconds(0, 0)
    : isHourly ?
      scheduleStartDate.setUTCMinutes(0, 0 ,0)
    :
      scheduleStartDate.setUTCHours(0, 0, 0, 0);

    let scheduleEndDateMs = isSeconds ?
      scheduleEndDate.getTime()
    : isMinutes ?
      scheduleEndDate.setUTCSeconds(0, 0)
    : isHourly ?
      scheduleEndDate.setUTCMinutes(0, 0 ,0)
    :
      scheduleEndDate.setUTCHours(0, 0, 0, 0);

    periodStartDate = currPeriodStartDateMs < scheduleStartDateMs ?
      scheduleStartDateMs
    : currPeriodStartDateMs > scheduleEndDateMs ?
      scheduleEndDateMs - periodMs
    :
      currPeriodStartDateMs;

    periodEndDate = scheduleStartDateMs + periodMs > nowMs &&
      scheduleStartDateMs + periodMs <= scheduleEndDateMs ?
      scheduleStartDateMs + periodMs
    : nowMs > scheduleEndDateMs || scheduleStartDateMs + periodMs > scheduleEndDateMs ?
      scheduleEndDateMs
    : nowMs;

  } else {

    let currPeriodDateMs = isSeconds ?
      scheduleStartDate.getTime()
    : isMinutes ?
      scheduleStartDate.setUTCSeconds(0, 0)
    : isHourly ?
      scheduleStartDate.setUTCMinutes(0, 0 ,0)
    :
      scheduleStartDate.setUTCHours(0, 0, 0, 0);

    let scheduleEndDateMs = isSeconds ?
      scheduleEndDate.getTime()
    : isMinutes ?
      scheduleEndDate.setUTCSeconds(0, 0)
    : isHourly ?
      scheduleEndDate.setUTCMinutes(0, 0 ,0)
    :
      scheduleEndDate.setUTCHours(0, 0, 0, 0);

    let currPeriodStartDateMs;
    while (currPeriodDateMs <= nowMs && currPeriodDateMs <= scheduleEndDateMs) {

      currPeriodStartDateMs = currPeriodDateMs;
      currPeriodDateMs += periodMs;

    }
    periodStartDate = currPeriodStartDateMs;
    periodEndDate = currPeriodStartDateMs + periodMs > scheduleEndDateMs ?
      scheduleEndDateMs
    :
      currPeriodStartDateMs + periodMs;

  }

  return [ 
    periodStartDate + (isSeconds || isMinutes ? 0 : isHourly ? MINUTES_SECONDS_MS_IN_HOUR : 0),
    periodEndDate
  ];

};

/**
 * 
 * @param {*} from 
 * @param {*} to 
 * @param {*} threshold 
 * @param {*} hasInsufficientDataPoints 
 * @returns 
 */
export const isHourlyDataPointThresholdTriggered = (from, to, threshold, hasInsufficientDataPoints) => {

  // Check if the period range triggers the hourly data point threshold
  return to - from <= (Number.parseInt(threshold, 10) * MINUTES_SECONDS_MS_IN_HOUR) && !hasInsufficientDataPoints;

};

/**
 * Return the start and end date in milliseconds since the epoch for the current period and a flag to indicate
 * if there is sufficient indices data to show hourly data points in an hourly view (1 = true, 0 = false).
 * 
 * @param {Schedule} schedule - a schedule that provides a date range
 * @param {number} period - the number of hours in the date range 
 * @param {number} hourlyDailyThreshold - the hours at which data point display switches from daily to hourly 
 * @param {boolean} isRollingPeriod - a flag to indicate if data is displayed windowed (false) or rolling (true) 
 * @param {Index[]} indices - an array of indices to check for sufficient hourly data points 
 * @returns {[number, number, number, number, number]} - the start date in milliseconds, the end date in milliseconds and the "is hourly" flag
 */
export const getPeriodStartAndEndMs = (schedule, period, hourlyDailyThreshold, isRollingPeriod, indices) => {

  if (!schedule || period == null) return [null, null, 0, 0, 0];

  // Determine the current period's start and end dates in milliseconds from the epoch
  let [startDateMs, endDateMs] = getPeriodStartAndEndDate(schedule, period, isRollingPeriod, false);

  // Given the start and end dates for the period, filter the indices entities that fall in this period
  const startDateJSON = new Date(startDateMs).toJSON();
  const endDateJSON = new Date(endDateMs).toJSON();

  if (!startDateJSON || !endDateJSON) return [null, null, 0, 0, 0];

  const startDate = startDateJSON.split("T")[0];
  const endDate = endDateJSON.split("T")[0];
  const periodMeasurements = indices.filter(index => {
    const [createDate, createTime] = index.CREATED_AT.split("T");
    return createDate >= startDate && createDate <= endDate;
  });
  let isHourly = 0;
  if (isHourlyDataPointThresholdTriggered(startDateMs, endDateMs, hourlyDailyThreshold, hasInsufficientHourlyData(periodMeasurements))) {
    [startDateMs, endDateMs] = getPeriodStartAndEndDate(schedule, period, isRollingPeriod, true);
    isHourly = 1;
  }
  let isMinutes = 0;
  if (endDateMs - startDateMs < MINUTES_SECONDS_MS_IN_HOUR) {
    [startDateMs, endDateMs] = getPeriodStartAndEndDate(schedule, period, isRollingPeriod, true, true);
    isMinutes = 1;
  }
  let isSeconds = 0;
  // Switch to seconds view if the period is less than 30 minutes
  if (endDateMs - startDateMs < SECONDS_MS_IN_MINUTE * 31) {
    [startDateMs, endDateMs] = getPeriodStartAndEndDate(schedule, period, isRollingPeriod, true, true, true);
    isSeconds = 1;
  }

  return [startDateMs, endDateMs, isHourly, isMinutes, isSeconds];
  
};

/**
 * 
 * @param {*} tz 
 * @returns 
 */
export const getYesterdayTomorrowAdjustment = (tz) => {

  const now = (process.env.NEXT_PUBLIC_NOW ? new Date(process.env.NEXT_PUBLIC_NOW) : new Date());
  const nowUTC = new Intl.DateTimeFormat("en-GB", { month: "2-digit", day: "2-digit", year: "numeric", timeZone: "UTC" })
    .format(now)
    .split("/")
    .reverse()
    .join("-");
  const nowLocal = new Intl.DateTimeFormat("en-GB", { month: "2-digit", day: "2-digit", year: "numeric", timeZone: tz })
    .format(now)
    .split("/")
    .reverse()
    .join("-");

  return nowUTC < nowLocal ? 0 : nowUTC > nowLocal ? 1 : -1;

};

/**
 * 
 * @param {*} date 
 * @param {*} startMs 
 * @param {*} endMs 
 * @returns 
 */
export const getTimeAsPercentageOfPeriod = (date, startMs, endMs) => {

  // Input: A period start and end date and an ISO date and time string
  // Output: The percentage of the period at which the time occurs
  // or 0 if there are no dates
  if (!date || !startMs || !endMs) return 0;

  const eventDateMs = new Date(date).getTime();
  const periodDurationMs = endMs - startMs;

  return eventDateMs < startMs ?
    0
  : eventDateMs > endMs ? 
    0
  :
    Math.floor((eventDateMs - startMs) / periodDurationMs * 100);

};

// Alerts

/**
 * 
 * @param {*} alerts 
 * @returns 
 */
export const getActiveAlert = (alerts) => {

  // Input: An array of alerts
  // Output: The first active alert or undefined if there are no active alerts,
  // or null if no alerts have been given
  if (!alerts || !alerts.length) return null;

  // Find the latest alert date for the given area
  return alerts.find(alert => !alert?.CLOSED_AT);

};

/**
 * 
 * @param {*} alerts 
 * @param {*} areaId 
 * @param {*} measurement 
 * @returns 
 */
export const getActiveAlertForArea = (alerts, areaId, measurement) => {

  // Input: An array of alerts, the current area ID and a measurement type
  // Output: The active alert
  // or null if no alerts have been given or no area ID has been given
  if (!alerts || !alerts.length || !areaId) return null;

  // Find the latest alert date for the given area
  if (measurement == "PHI") {

    return getActiveAlert(alerts.filter(alert => alert?.GSI3_PK == areaId && alert?.TRIGGER_METRIC == "fv_fm"));

  } else if (measurement == "PS2") {

    return getActiveAlert(alerts.filter(alert => alert?.GSI3_PK == areaId && (alert?.TRIGGER_METRIC == "supply" || alert?.TRIGGER_METRIC == "qp")));

  } else {

    return getActiveAlert(alerts.filter(alert => alert?.GSI3_PK == areaId));

  }

};

/**
 * 
 * @param {*} alert 
 * @param {*} area 
 * @param {*} schedules 
 * @returns 
 */
export const getAlertCreatedDayAsPercentageOfCycle = (alert, area, schedules) => {

  // Input: A area, an array of schedules for the current location and an alert
  // Output: The percentage of the active schedule's cycle at which the alert first occurred
  // or 0 if no area has been given or there are no customer job or there is no alert
  if (!area || !schedules || !schedules.length || schedules[0] == null || !alert) return 0;

  const cycleDuration = getActiveCycleDurationInDays(schedules);
  // Avoid divide-by-zero errors
  if (cycleDuration == 0) return 0;

  return Math.floor(((getAlertCreatedDayInCycle(alert, schedules)) / cycleDuration) * 100);

};

/**
 * 
 * @param {*} alert 
 * @param {*} area 
 * @param {*} start 
 * @param {*} end 
 * @param {*} isHourly 
 * @returns 
 */
export const getAlertCreatedDayAsPercentageOfPeriod = (alert, area, start, end, isHourly = false) => {

  // Input: A area, a period start and end date and an alert
  // Output: The percentage of the period at which the alert first occurred
  // or 0 if no area has been given or there are no dates or there is no alert
  if (!area || !start || !end || !alert) return 0;

  const alertCreatedDate = new Date(alert.CREATED_AT);
  // "start" and "end" should already be tz adjusted
  const periodStartMs = new Date(start).getTime();
  const periodEndMs = new Date(end).getTime();
  const periodDurationMs = periodEndMs - periodStartMs;
  const alertCreatedDateMs = isHourly ? alertCreatedDate.setUTCMinutes(0, 0 ,0) : alertCreatedDate.setUTCHours(0, 0, 0, 0);

  return alertCreatedDateMs < periodStartMs ?
    0
  :
    Math.floor((alertCreatedDateMs - periodStartMs) / periodDurationMs * 100); 

};

/**
 * 
 * @param {*} alert 
 * @param {*} schedules 
 * @returns 
 */
export const getAlertCreatedDayInCycle = (alert, schedules) => {

  // Input: An array of schedules for the current location and an alert
  // Output: The percentage of the active schedule's cycle at which the alert first occurred
  // or 0 if there are no customer job or there is no alert
  if (!schedules || !schedules.length || schedules[0] == null || !alert) return 0;

  return getCurrentCyclePoint(schedules, 0, false, false) - getDaysAgoInCycle(alert.CREATED_AT, schedules);

};

/**
 * 
 * @param {*} alert 
 * @param {*} start 
 * @param {*} end 
 * @param {*} tz 
 * @param {*} isHourly 
 * @returns 
 */
export const getAlertCreatedDateInPeriod = (alert, start, end, tz = "UTC", isHourly = false) => {

  // Input: An array of schedules for the current location and an alert
  // Output: The percentage of the active schedule's cycle at which the alert first occurred
  // or 0 if there are no customer job or there is no alert
  if (!start || !end || !alert) return 0;

  const alertCreatedDate = new Date(alert.CREATED_AT);
  let alertCreatedDateMs = alertCreatedDate.getTime();
  // "start" and "end" should already be tz adjusted
  if (isHourly) {
    alertCreatedDateMs = alertCreatedDate.setUTCMinutes(0, 0 ,0);
  } else {
    // When displaying daily data points, calculate alert start dates at midnight of the day they were raised
    alertCreatedDateMs = alertCreatedDate.setUTCHours(0, 0, 0, 0);
  }

  if (isHourly) {
    return getFormattedDate(new Date(alertCreatedDateMs), "Mmm-DD HH:mm", tz);
  } else {
    return getFormattedDate(new Date(alertCreatedDateMs), "Mmm-DD", tz);
  }

};

/**
 * 
 * @param {*} alert 
 * @param {*} area 
 * @param {*} schedules 
 * @returns 
 */
export const getAlertResolvedDayAsPercentageOfCycle = (alert, area, schedules) => {

  // Input: A area, an array of schedules for the current location and an alert
  // Output: The percentage of the active schedule's cycle at which the alert was resolved
  // or 0 if no area has been given or there are no customer job or there is no alert
  if (!area || !schedules || !schedules.length || schedules[0] == null || !alert) return 0;
  
  const cycleDuration = getActiveCycleDurationInDays(schedules);
  // Avoid divide-by-zero errors
  if (cycleDuration == 0) return 0;

  return Math.floor(((getAlertResolvedDayInCycle(alert, schedules)) / cycleDuration) * 100);

};

/**
 * 
 * @param {*} alert 
 * @param {*} area 
 * @param {*} start 
 * @param {*} end 
 * @param {*} isHourly 
 * @returns 
 */
export const getAlertResolvedDayAsPercentageOfPeriod = (alert, area, start, end, isHourly = false) => {

  // Input: A area, a period start and end date and an alert
  // Output: The percentage of the period at which the alert was resolved
  // or 0 if no area has been given or there are no dates or there is no alert
  if (!area || !start || !end || !alert) return 0;

  if (!(alert.CLOSED_AT && alert.STATE == "closed_resolved")) return getCurrentCycleDayAsPercentageOfPeriod(start, end, isHourly);

  const alertResolvedDate = new Date(alert.CLOSED_AT);
  // "start" and "end" should already be tz adjusted
  const periodStartMs = new Date(start).getTime();
  const periodEndMs = new Date(end).getTime();
  const periodDurationMs = periodEndMs - periodStartMs;
  const alertResolvedDateMs = isHourly ? alertResolvedDate.setUTCMinutes(0, 0 ,0) : alertResolvedDate.setUTCHours(0, 0, 0, 0);
  const alertResolvedDayPct = Math.floor((alertResolvedDateMs - periodStartMs) / periodDurationMs * 100);

  return alertResolvedDateMs >= periodEndMs ? 
    100
  :
    alertResolvedDayPct < 0 ? 0 : alertResolvedDayPct; 

};

/**
 * 
 * @param {*} alert 
 * @param {*} schedules 
 * @returns 
 */
export const getAlertResolvedDayInCycle = (alert, schedules) => {

  // Input: An array of schedules for the current location and an alert
  // Output: The percentage of the active schedule's cycle at which the alert was resolved
  // or 0 if there are no customer job or there is no alert
  if (!schedules || !schedules.length || schedules[0] == null || !alert) return 0;

  return getCurrentCyclePoint(schedules) - getDaysAgoInCycle(alert.CLOSED_AT, schedules);

};

/**
 * 
 * @param {*} alert 
 * @param {*} start 
 * @param {*} end 
 * @param {*} tz 
 * @param {*} isHourly 
 * @returns 
 */
export const getAlertResolvedDateInPeriod = (alert, start, end, tz = "UTC", isHourly = false) => {

  // Input: An array of schedules for the current location and an alert
  // Output: The percentage of the active schedule's cycle at which the alert was resolved
  // or 0 if there are no customer job or there is no alert
  if (!start || !end || !alert) return 0;

  const alertResolvedDate = !(alert.CLOSED_AT && alert.STATE == "closed_resolved") ?
    (process.env.NEXT_PUBLIC_NOW ? new Date(process.env.NEXT_PUBLIC_NOW) : new Date())
  :
    new Date(alert.CLOSED_AT);
  let alertResolvedDateMs = alertResolvedDate.getTime(); 
  const periodEnd = new Date(end);
  let periodEndMs = periodEnd.getTime();
  if (isHourly) {
    alertResolvedDateMs = alertResolvedDate.setUTCMinutes(0, 0 ,0);
    periodEndMs = periodEnd.setUTCMinutes(0, 0 ,0);
  } else {
    // When displaying daily data points, calculate alert start dates at midnight of the day they were raised
    alertResolvedDateMs = alertResolvedDate.setUTCHours(0, 0, 0, 0);
    periodEndMs = periodEnd.setUTCHours(0, 0, 0, 0);
  }

  if (isHourly) {
    const differenceInHours = Math.floor((periodEndMs - alertResolvedDateMs) / 1000 / 60 / 60);
    return differenceInHours > 0 ? getFormattedDate(new Date(alertResolvedDateMs), "Mmm-DD HH:mm", tz) : "";
  } else {
    const differenceInDays = Math.floor((periodEndMs - alertResolvedDateMs) / 1000 / 60 / 60 / 24);
    return differenceInDays > 0 ? getFormattedDate(new Date(alertResolvedDateMs), "Mmm-DD", tz) : "";
  }

};

/**
 * 
 * @param {*} alerts 
 * @returns 
 */
export const getFirstAlert = (alerts) => {

  // Input: An array of active and resolving alerts
  // Output: The first active or resolved alert
  // or null if no alerts have been given
  if (!alerts || !alerts.length) return null;

  // Find the first alert date for the given area
  return alerts.reduce((prev, curr) => curr.CREATED_AT < prev.CREATED_AT ? curr : prev);

};

/**
 * 
 * @param {*} alerts 
 * @returns 
 */
export const getLatestAlert = (alerts) => {

  // Input: An array of alerts
  // Output: The latest alert
  // or null if no alerts have been given
  if (!alerts || !alerts.length) return null;

  // Find the latest alert date for the given area
  return alerts.reduce((prev, curr) => curr.CREATED_AT > prev.CREATED_AT ? curr : prev);

};

/**
 * 
 * @param {*} alerts 
 * @param {*} tz 
 * @returns 
 */
export const getLatestAlertDate = (alerts, tz = "UTC") => {

  // Input: Array of alerts
  // Output: String representation of the latest alert date
  // or an empty string if no alerts have been provided
  const latestAlert = getLatestAlert(alerts);

  if (latestAlert) {
    const alertCreatedDate = new Date(latestAlert.CREATED_AT);
    return getFormattedDate(alertCreatedDate, "Mmm DD, YYYY", tz);
  }
  return "";

};

/**
 * 
 * @param {*} alerts 
 * @param {*} areaId 
 * @param {*} measurement 
 * @param {*} state 
 * @returns 
 */
export const getLatestAlertForArea = (alerts, areaId, measurement, state) => {

  // Input: An array of alerts, the current area ID and an optional measurement type
  // Output: The latest alert
  // or null if no alerts have been given or no area ID has been given
  if (!alerts || !alerts.length || !areaId) return null;

  if (measurement) {

    // Find the latest alert date for the given area for the given metric
    return getLatestAlert(alerts.filter(alert => alert?.GSI3_PK == areaId &&
      (measurement == "PHI" ? alert?.TRIGGER_METRIC == "fv_fm" : alert?.TRIGGER_METRIC == "supply" || alert?.TRIGGER_METRIC == "qp") &&
      (state ? alert?.STATE == state : true)));

  } else {

    // Find the latest Fv/Fm alert date for the given area
    const latestFvFmAlert = getLatestAlert(alerts.filter(alert => alert?.GSI3_PK == areaId &&
      alert?.TRIGGER_METRIC == "fv_fm" &&
      (state ? alert?.STATE == state : true)));
    const latestFvFmAlertSeverity = latestFvFmAlert ? getAlertSeverity(latestFvFmAlert) : ""; 

    // Find the latest Qe alert date for the given area
    const latestQeAlert = getLatestAlert(alerts.filter(alert => alert?.GSI3_PK == areaId &&
      (alert?.TRIGGER_METRIC == "supply" || alert?.TRIGGER_METRIC == "qp") &&
      (state ? alert?.STATE == state : true)));
    const latestQeAlertSeverity = latestQeAlert ? getAlertSeverity(latestQeAlert) : ""; 

    // If the Qe alert has a higher severity than the Fv/Fm alert, return it regardless of date,
    // otherwise if the Fv/FM alert has a higher severity than the Qe alert, return it regardless of date,
    // otherwise return the latest Fv/FM or Qe alert, or the Fv/Fm alert if it exists, or the Qe alert if it exists,
    // or the latest alert regardless of trigger metric
    return (latestFvFmAlertSeverity == "low" && latestQeAlertSeverity != "" && latestQeAlertSeverity != "low" ||
      latestFvFmAlertSeverity == "medium" && latestQeAlertSeverity == "high") ?
        latestQeAlert
    : (latestQeAlertSeverity == "low" && latestFvFmAlertSeverity != "" && latestFvFmAlertSeverity != "low" ||
      latestQeAlertSeverity == "medium" && latestFvFmAlertSeverity == "high") ?
        latestFvFmAlert
    :
      latestFvFmAlert && latestQeAlert ?
        latestFvFmAlert.CREATED_AT > latestQeAlert.CREATED_AT ?
          latestFvFmAlert
        :
          latestQeAlert
      :
        latestFvFmAlert ?
          latestFvFmAlert
        :
          latestQeAlert ? 
            latestQeAlert
          :
            getLatestAlert(alerts.filter(alert => alert?.GSI3_PK == areaId)); 
  }

};

// Growth jobs

/**
 * 
 * @param {*} schedules 
 * @returns 
 */
export const getActiveCycleDurationInDays = (schedules) => {

  // Input: An array of schedules
  // Output: The difference in days between the active schedule's cycle start date and end date
  // or 0 if no schedules have been given
  // Assumes that all areas in a location are on the same growth cycle
  if (!schedules || !schedules.length || schedules[0] == null) return 0;

  const activeSchedule = getActiveSchedule(schedules);

  let diff = 0;
  if (activeSchedule) {
    const cycleStartDateMs = new Date(activeSchedule.CYCLE_STARTED_AT).setUTCHours(0, 0, 0, 0);
    const cycleEndDateMs = new Date(activeSchedule.CYCLE_COMPLETING_AT).setUTCHours(23, 59, 59, 999);
    diff = getDifferenceInDays(cycleEndDateMs, cycleStartDateMs, false, false, true);
  }
  return diff;

};

/**
 * 
 * @param {*} schedules 
 * @returns 
 */
export const getActiveSchedule = (schedules) => {

  // Input: an array of schedules
  // Output: the active schedule
  // or null if no schedules are given
  schedules = schedules.filter(item => item);

  if (!schedules || !schedules.length || schedules[0] == null) return null;

  const nowMs = (process.env.NEXT_PUBLIC_NOW ? new Date(process.env.NEXT_PUBLIC_NOW) : new Date()).getTime();

  // Find the first schedule that has not been marked as completed,
  // where the started at date is in the past and the completing at date is in the future
  return schedules.find(schedule => !schedule.CYCLE_COMPLETED_AT &&
    new Date(schedule.CYCLE_STARTED_AT).getTime() <= nowMs &&
    new Date(schedule.CYCLE_COMPLETING_AT).getTime() >= nowMs);

};

/**
 * 
 * @param {*} schedules 
 * @param {*} fmt 
 * @param {*} tz 
 * @returns 
 */
export const getActiveScheduleStartAndEndDay = (schedules, fmt, tz = "UTC") => {

  // Input: an array of schedules and an optional format
  // Output: the active schedule start and end dates in the given format
  // or an empty string if no schedules are given
  schedules = schedules.filter(item => item);

  if (!schedules || !schedules.length || schedules[0] == null) return "";

  // Find the first schedule that has not been marked as completed,
  // where the started at date is in the past and the completing at date is in the future
  const activeSchedule = getActiveSchedule(schedules);

  if (activeSchedule) {

    const activeScheduleStartDate = new Date(activeSchedule.CYCLE_STARTED_AT);
    const activeScheduleStartDateMs = activeScheduleStartDate.setUTCHours(activeScheduleStartDate.getUTCHours(), 0, 0, 0);
    const activeScheduleEndDate = new Date(activeSchedule.CYCLE_COMPLETING_AT);
    const activeScheduleEndDateMs = activeScheduleEndDate.setUTCHours(activeScheduleEndDate.getUTCHours(), 0, 0, 0);

    return (fmt == "JSON" ? activeSchedule.CYCLE_STARTED_AT.substring(0, 13) + ":00:00.000Z" :
      getFormattedDate(new Date(activeScheduleStartDateMs), fmt ? fmt : "Mmmm DD", tz)) + 
    " - " +
      (fmt == "JSON" ? activeSchedule.CYCLE_COMPLETING_AT.substring(0, 13) + ":00:00.000Z" : 
      getFormattedDate(new Date(activeScheduleEndDateMs), fmt ? fmt : "Mmmm DD", tz));
  
  }

  return "";

};

/**
 * 
 * @param {*} schedules 
 * @param {*} period 
 * @param {*} fmt 
 * @param {*} isRollingPeriod 
 * @param {*} tz 
 * @param {*} isHourly 
 * @param {*} roundUp 
 * @returns 
 */
export const getActiveSchedulePeriodStartAndEndDay = (schedules, period, fmt, isRollingPeriod = false, tz = "UTC",
  isHourly = false, isMinutes = false, roundUp) => {

  // Input: an array of schedules, a period of days and an optional format
  // Output: the active schedule start date or the start date of the current period
  // and the active schedule end date or the end date of the current period in the given format
  // or an empty string if no schedules are given
  schedules = schedules.filter(item => item);

  if (!schedules || !schedules.length || schedules[0] == null) return "";

  // Find the first schedule that has not been marked as completed,
  // where the started at date is in the past and the completing at date is in the future
  const activeSchedule = getActiveSchedule(schedules);

  if (!activeSchedule) return "";

  const [periodStartDate, periodEndDate] = getPeriodStartAndEndDate(activeSchedule, period, isRollingPeriod, isHourly, isMinutes);

  if (fmt == "JSON") {
    return new Date(periodStartDate).toJSON() + " - " + new Date(periodEndDate).toJSON();
  } else {
    return getFormattedDate(new Date(periodStartDate), fmt ? fmt : "Mmmm DD", tz) + 
      " - " +
      getFormattedDate(new Date(periodEndDate), fmt ? fmt : "Mmmm DD", tz);
  }

};

/**
 * 
 * @param {*} schedules 
 * @param {*} period 
 * @param {*} isRollingPeriod 
 * @param {*} isHourly
 * @param {*} isMinutes
 * @returns 
 */
export const getActiveScheduleStartDate = (schedules, period, isRollingPeriod = false, isHourly = false, isMinutes = false) => {

  // Input: an array of schedules
  // Output: the active schedule start date
  // or null if no schedules are given
  schedules = schedules.filter(item => item);

  if (!schedules || !schedules.length || schedules[0] == null) return "";

  // Find the first schedule that has not been marked as completed,
  // where the started at date is in the past and the completing at date is in the future
  const activeSchedule = getActiveSchedule(schedules);

  if (!activeSchedule) return "";

  if (period) {

    const [periodStartDate, periodEndDate] = getPeriodStartAndEndDate(activeSchedule, period, isRollingPeriod, isHourly, isMinutes);
    return new Date(periodStartDate);

  } else {

    const activeScheduleStartDate = new Date(activeSchedule.CYCLE_STARTED_AT); 
    return new Date(activeScheduleStartDate);

  }

};

/**
 * 
 * @param {*} schedules 
 * @param {*} period 
 * @param {*} isRollingPeriod 
 * @param {*} isHourly 
 * @returns 
 */
export const getCurrentCyclePoint = (schedules, period, isRollingPeriod = false, isHourly = false, isMinutes = false) => {

  // Input: An array of schedules, the period to display, a flag to indicate if the period is rolling
  //  and a flag to indicate if the period is displayed in hours or days (default)
  // Output: The difference in days (default) or hours between the active schedule's cycle start date and now
  // or 0 if no schedules has been given
  // Assumes that all areas in a location are on the same growth cycle
  if (!schedules || !schedules.length || schedules[0] == null) return 0;

  const activeSchedule = getActiveSchedule(schedules);
  const latestSchedule = getLatestSchedule(schedules);

  if (!activeSchedule && !latestSchedule) return 0;

  if (activeSchedule) {

    if (period) {

      const [periodStartDate, periodEndDate] = getPeriodStartAndEndDate(activeSchedule, period, isRollingPeriod, isHourly, isMinutes);
      const periodDuration = Math.ceil((periodEndDate - periodStartDate) / (isMinutes ? SECONDS_MS_IN_MINUTE : isHourly ? MINUTES_SECONDS_MS_IN_HOUR : 24 * MINUTES_SECONDS_MS_IN_HOUR));
      const differenceFromNow = isMinutes ?
        getDifferenceInMinutes((process.env.NEXT_PUBLIC_NOW ? new Date(process.env.NEXT_PUBLIC_NOW) : new Date()),
          periodStartDate, false, false)
      : isHourly ? 
        getDifferenceInHours((process.env.NEXT_PUBLIC_NOW ? new Date(process.env.NEXT_PUBLIC_NOW) : new Date()),
          periodStartDate, false, false)
      :
        getDifferenceInDays((process.env.NEXT_PUBLIC_NOW ? new Date(process.env.NEXT_PUBLIC_NOW) : new Date()),
          periodStartDate, false, false);
      return differenceFromNow > periodDuration ? periodDuration : differenceFromNow;

    } else {

      const cycleDuration = getActiveCycleDurationInDays(schedules);
      const differenceFromNow = isMinutes ?
        getDifferenceInMinutes((process.env.NEXT_PUBLIC_NOW ? new Date(process.env.NEXT_PUBLIC_NOW) : new Date()),
          new Date(activeSchedule.CYCLE_STARTED_AT), false, true)
      : isHourly ? 
        getDifferenceInHours((process.env.NEXT_PUBLIC_NOW ? new Date(process.env.NEXT_PUBLIC_NOW) : new Date()),
        new Date(activeSchedule.CYCLE_STARTED_AT), false, true)
      :
        getDifferenceInDays((process.env.NEXT_PUBLIC_NOW ? new Date(process.env.NEXT_PUBLIC_NOW) : new Date()),
        new Date(activeSchedule.CYCLE_STARTED_AT), false, true);
      return differenceFromNow > cycleDuration ? cycleDuration : differenceFromNow + 1;

    }

  } else {

    if (period) {

      const [periodStartDate, periodEndDate] = getPeriodStartAndEndDate(latestSchedule, period, isRollingPeriod, false);
      return Math.ceil((periodEndDate - periodStartDate) / (isHourly ? MINUTES_SECONDS_MS_IN_HOUR : 24 * MINUTES_SECONDS_MS_IN_HOUR));

    } else {

      return getLatestCompletedCycleDuration(schedules, isHourly);

    }

  }
  
};

/**
 * 
 * @param {*} schedules 
 * @returns 
 */
export const getCurrentCycleDayAsPercentageOfCycle = (schedules) => {

  // Input: An array of schedules
  // Output: The percentage of the active schedule's growth cycle that has been completed including "today"
  // or 0 if no schedules have been given
  if (!schedules || !schedules.length || schedules[0] == null) return 0;

  const cycleDuration = getActiveCycleDurationInDays(schedules);
  // Avoid divide-by-zero errors
  if (cycleDuration == 0) return 0;
  const currentCycleDay = getCurrentCyclePoint(schedules, 0, false, false);

  return Math.floor((currentCycleDay / cycleDuration) * 100);

};

/**
 * 
 * @param {*} start 
 * @param {*} end 
 * @param {*} isHourly 
 * @returns 
 */
export const getCurrentCycleDayAsPercentageOfPeriod = (start, end, isHourly = false) => {

  const now = (process.env.NEXT_PUBLIC_NOW ? new Date(process.env.NEXT_PUBLIC_NOW) : new Date());
  let currentDayMs = isHourly ? now.setUTCMinutes(0, 0, 0) : now.setUTCHours(23, 59, 59, 999);

  // "start" and "end" should already be tz adjusted
  const periodStartMs = new Date(start).getTime();
  const periodEndMs = new Date(end).getTime();

  currentDayMs = currentDayMs >= periodEndMs ? periodEndMs : currentDayMs - END_OF_DAY_IN_MS;
  const periodDurationMs = new Date(end).getTime() - periodStartMs;

  const currentCycleDayPct = Math.floor((currentDayMs - periodStartMs) / periodDurationMs * 100);
  return currentCycleDayPct < 0 ? 0 : currentCycleDayPct; 

};

/**
 * 
 * @param {*} schedules 
 * @returns 
 */
export const getCycleDurationInDays = (schedules) => {

  // Input: An array of schedules
  // Output: The length of the growth cycle in days
  // or 0 if no schedules have been given
  if (!schedules || !schedules.length || schedules[0] == null) return 0;

  return getActiveSchedule(schedules) ? getActiveCycleDurationInDays(schedules) : getLatestCompletedCycleDuration(schedules, false);

};

/**
 * 
 * @param {*} date 
 * @param {*} schedules 
 * @returns 
 */
export const getDaysAgoInCycle = (date, schedules) => {

  // Input: A date in the format YYYY-mm-DDTHH:MM:SSZ
  // Output: The difference in days between the given date and either now
  // or the active schedule's expected completion date if there is an active schedule
  // or the most recent schedule's actual completion date if there is no active schedule
  // or 0 if no date has been given or no schedules have been given
  if (!date || !schedules || !schedules.length || schedules[0] == null) return 0;

  // Default to now
  let dateMs = (process.env.NEXT_PUBLIC_NOW ? new Date(process.env.NEXT_PUBLIC_NOW) : new Date()).setUTCHours(0, 0, 0, 0);

  // Get the active schedule
  const activeSchedule = getActiveSchedule(schedules);
  if (!activeSchedule) {
    // Find the most recently completed schedule
    const latestSchedule = getLatestSchedule(schedules);
    // Use the latest schedule CYCLE_COMPLETED_AT or CYCLE_COMPLETING_AT date
    dateMs = new Date(latestSchedule.CYCLE_COMPLETED_AT || latestSchedule.CYCLE_COMPLETING_AT).setUTCHours(23, 59, 59, 999);
  } else if (getDifferenceInDays(dateMs, new Date(activeSchedule.CYCLE_COMPLETING_AT).setUTCHours(23, 59, 59, 999), false, false) > 0) {
    // Check if the active schedule has actually expired (now > CYCLE_COMPLETING_AT)
    // and update the date if it has
    dateMs = new Date(activeSchedule.CYCLE_COMPLETING_AT).setUTCHours(23, 59, 59, 999);
  }
  return getDifferenceInDays(dateMs, new Date(date).setUTCHours(0, 0, 0, 0), false, false);

};

/**
 * 
 * @param {*} daysAgo 
 * @param {*} schedules 
 * @returns 
 */
export const getDaysAgoInCycleAsPercentageOfCycle = (daysAgo, schedules) => {

  // Input: An array of schedules
  // Output: The percentage of the active schedule's growth cycle that has been completed includsing "today"
  // or 0 if no schedules have been given
  if (Number.isNaN(daysAgo) || !schedules || !schedules.length || schedules[0] == null) return 0;

  const cycleDuration = getActiveCycleDurationInDays(schedules);
  // Avoid divide-by-zero errors
  if (cycleDuration == 0) return 0;
  const daysAgoInCycle = getCurrentCyclePoint(schedules, 0, false, false) - daysAgo;

  return Math.floor((daysAgoInCycle / cycleDuration) * 100);

};

/**
 * 
 * @param {*} schedules 
 * @returns 
 */
export const getLatestCompletedCycleDuration = (schedules, isHourly = false) => {

  // Input: An array of schedules
  // Output: The difference in days between the most recent schedule's cycle start date and end date
  // or 0 if no schedules have been given
  // Assumes that all areas in a location are on the same growth cycle
  if (!schedules || !schedules.length || schedules[0] == null) return 0;

  const latestCompletedSchedule = getLatestSchedule(schedules);

  let diff = 0;
  if (latestCompletedSchedule) {
    const cycleStartDateMs = isHourly ?
      new Date(latestCompletedSchedule.CYCLE_STARTED_AT).setUTCMinutes(0, 0, 0)
    : 
      new Date(latestCompletedSchedule.CYCLE_STARTED_AT).setUTCHours(0, 0, 0, 0);
    const cycleEndDateMs = isHourly ?
      new Date(latestCompletedSchedule.CYCLE_COMPLETED_AT || latestCompletedSchedule.CYCLE_COMPLETING_AT).setUTCHours(59, 59, 999)
    :
      new Date(latestCompletedSchedule.CYCLE_COMPLETED_AT || latestCompletedSchedule.CYCLE_COMPLETING_AT).setUTCHours(23, 59, 59, 999);
    diff = isHourly ? 
      getDifferenceInHours(cycleEndDateMs, cycleStartDateMs, false, false)
    :
      getDifferenceInDays(cycleEndDateMs, cycleStartDateMs, false, false, true);
  }
  return diff;

};

/**
 * 
 * @param {*} schedules 
 * @returns 
 */
export const getLatestSchedule = (schedules) => {

  // Input: An array of schedules
  // Output: The latest schedule
  // or null if no schedules have been given
  if (!schedules || !schedules.length || schedules[0] == null) return null;

  const nowMs = (process.env.NEXT_PUBLIC_NOW ? new Date(process.env.NEXT_PUBLIC_NOW) : new Date()).getTime();

  // Find the latest started at date for the given schedules where the started at date is in the past
  // and the completing date is in the future
  const latestRunningSchedule = schedules.reduce((prev, curr) =>
    new Date(curr.CYCLE_STARTED_AT).getTime() > new Date(prev.CYCLE_STARTED_AT).getTime() &&
    new Date(curr.CYCLE_STARTED_AT).getTime() <= nowMs &&
    new Date(curr.CYCLE_COMPLETING_AT).getTime() >= nowMs ? curr : prev, { CYCLE_STARTED_AT: 0 });

  // If a schedule matches these criteria, return it 
  if (latestRunningSchedule.CYCLE_STARTED_AT != 0) {

    return latestRunningSchedule;

  } else {

    // Otherwise return the latest schedule where the completing date has passed
    return schedules.reduce((prev, curr) =>
      new Date(curr.CYCLE_STARTED_AT).getTime() > new Date(prev.CYCLE_STARTED_AT).getTime() &&
      new Date(curr.CYCLE_STARTED_AT).getTime() <= nowMs &&
      new Date(curr.CYCLE_COMPLETING_AT).getTime() < nowMs ? curr : prev);

  } 

};

/**
 * 
 * @param {*} schedules 
 * @param {*} period 
 * @param {*} fmt 
 * @param {*} isRollingPeriod 
 * @param {*} tz 
 * @param {*} isHourly 
 * @param {*} roundUp 
 * @returns 
 */
export const getLatestSchedulePeriodStartAndEndDay = (schedules, period, fmt, isRollingPeriod = false, tz = "UTC",
  isHourly = false, isMinutes = false, roundUp) => {

  // Input: an array of schedules, a period of days and an optional format
  // Output: the latest schedule start date or the start date of the current period
  // and the latest schedule end date or the end date of the current period in the given format
  // or an empty string if no schedules are given
  schedules = schedules.filter(item => item);

  if (!schedules || !schedules.length || schedules[0] == null) return "";

  // Find the first schedule that has not been marked as completed,
  // where the started at date is in the past and the completing at date is in the future
  const latestSchedule = getLatestSchedule(schedules);

  if (latestSchedule) {

    const [periodStartDate, periodEndDate] = getPeriodStartAndEndDate(latestSchedule, period, isRollingPeriod, isHourly, isMinutes);

    if (fmt == "JSON") {
      return new Date(periodStartDate).toJSON() + " - " + new Date(periodEndDate).toJSON();
    } else {
      return getFormattedDate(new Date(periodStartDate), fmt ? fmt : "Mmmm DD", tz) + 
        " - " +
        getFormattedDate(new Date(periodEndDate), fmt ? fmt : "Mmmm DD", tz);
    }
  
  }

  return "";

};

/**
 * 
 * @param {*} schedules 
 * @param {*} period 
 * @param {*} isRollingPeriod 
 * @param {*} isHourly
 * @param {*} isMinutes
 * @returns 
 */
export const getLatestScheduleStartDate = (schedules, period, isRollingPeriod = false, isHourly = false, isMinutes = false) => {

  // Input: an array of schedules
  // Output: the active schedule start date
  // or null if no schedules are given
  schedules = schedules.filter(item => item);

  if (!schedules || !schedules.length || schedules[0] == null) return "";

  // Find the first schedule that has not been marked as completed,
  // where the started at date is in the past and the completing at date is in the future
  const latestSchedule = getLatestSchedule(schedules);

  if (!latestSchedule) return "";

  if (period) {

    const [periodStartDate, periodEndDate] = getPeriodStartAndEndDate(latestSchedule, period, isRollingPeriod, isHourly, isMinutes);
    return new Date(periodStartDate);

  } else {

    const latestScheduleStartDate = new Date(latestSchedule.CYCLE_STARTED_AT); 
    return new Date(latestScheduleStartDate);

  }

};

/**
 * 
 * @param {*} schedules 
 * @returns 
 */
export const isScheduleComplete = (schedules) => {

  // Input: An array of schedules
  // Output: True if the active schedule has been completed,
  // i.e. there is no active schedule
  // Otherwise false
  // Assumes that all areas in a location are on the same growth cycle
  if (!schedules || !schedules.length || schedules[0] == null) return false;

  const activeSchedule = getActiveSchedule(schedules);
  if (!activeSchedule) return true;

  return false;

};

/**
 * 
 * @param {*} schedules 
 * @returns 
 */
export const isScheduleRunning = (schedules) => {

  // Input: an array of schedules for the current location
  // Output: a boolean that indicates if there is an active schedule
  // or false if no schedules are given
  if (!schedules || !schedules.length || schedules[0] == null) return false;

  return getActiveSchedule(schedules) != null;

};

// Measurements

/**
 * 
 * @param {*} indices 
 * @param {*} currentDateMs 
 * @param {*} endDateMs 
 * @param {*} isHourly 
 * @param {*} isMinutes 
 * @param {*} isSeconds 
 * @param {*} period 
 * @param {*} hourlyDailyThreshold 
 * @param {*} byCAID 
 * @param {*} type 
 * @returns 
 */
export const getMeasurementsDataByTime = (indices, currentDateMs, endDateMs, isHourly, isMinutes, isSeconds, period, hourlyDailyThreshold, byCAID, type) => {

  // Input: An array of indices, a schedule, a period of days to return from today backwards, the number of hours
  // before or on which hourly data points should be returned and after which daily data points should be returned,
  // and the current location timezone offset
  // Output: When daily data points are required, an object containing a date entry for each unique day of the schedule, from today - period to today
  // and the indices relating to that date
  // or when hourly data points are required, an object containing a date and time entry for each unique day and time of the schedule, from today - period to today
  // and the indices relating to that date and time
  // or an empty object if no indices have been given, no schedule has been given or no period has been given

  // Set up the data object to store the indices data
  let data = {};

  if (!indices || !indices.length) return [];

  // Determine if the period needs to be adjusted
  const nowDate = (process.env.NEXT_PUBLIC_NOW ? new Date(process.env.NEXT_PUBLIC_NOW) : new Date()); 
  const nowDateMs = nowDate.setUTCMinutes(0, 0, 0);
  const nowMidnightMs = nowDate.setUTCHours(0);
  const hoursToday = Math.floor((nowDateMs - nowMidnightMs) / MINUTES_SECONDS_MS_IN_HOUR);
  const ignoreFirstDatum = (period > hourlyDailyThreshold && period % 24 != 0 && period % 24 > hoursToday) ? true : false;
  const ignoreLastDatum = (period > hourlyDailyThreshold && period % 24 != 0 && period % 24 <= hoursToday) ? true : false;

  // While the current date is less than or the same as the period end date,
  // create a date entry for each unique day or hour
  let dataKeys = [];
  let indicesKeySet = new Set();
  while (currentDateMs <= endDateMs) {
    const current = new Date(currentDateMs).toJSON();
    const [currDate, currTime] = current.split("T");
    indicesKeySet.add(currDate + (isSeconds ?
      "T" + currTime.split(":").slice(0, 2).join(":") + ":00"  
    : isMinutes ?
      "T" + currTime.split(":")[0] + ":00"
    :
      ""));
    const displayTime = isSeconds ?
      "_" + currTime.split(":").slice(0, 3).join("_").split(".")[0] 
    : isMinutes ?
      "_" + currTime.split(":").slice(0, 2).join("_") + "_00" 
    : isHourly ? 
      "_" + currTime.split(":")[0] + "_00"
    :
      "";
    const dataKey = "dd_" + currDate.split("-").reverse().join("_") + displayTime;
    data[dataKey] = { createDate: current, displayDate: current };
    if (isHourly) data[dataKey].isHourly = true;
    if (isMinutes) data[dataKey].isMinutes = true;
    if (isSeconds) data[dataKey].isSeconds = true;
    data[dataKey].hasData = false;
    currentDateMs += (isSeconds ? 
      1000
    : isMinutes ?
      SECONDS_MS_IN_MINUTE
    : isHourly ?
      MINUTES_SECONDS_MS_IN_HOUR
    :
      HOURS_MINUTES_SECONDS_MS_IN_DAY);
    dataKeys.push(dataKey);
  }
  let keyToDelete = ignoreFirstDatum ? dataKeys[0] : ignoreLastDatum ? dataKeys[dataKeys.length - 1] : null;
  if (keyToDelete) delete data[keyToDelete];
  const indicesKeys = Array.from(indicesKeySet);

  // Get today's date and time
  const [today, now] = (process.env.NEXT_PUBLIC_NOW ?? new Date().toJSON()).split("T");

  indices
    .filter(index => indicesKeys.includes(index.GSI5_SK.split("#")[0]) &&
      ((type && index.GSI5_PK.indexOf("#" + type.toUpperCase() + "#") > -1) || !type))
    .map(index => {
      const indexType = index.GSI5_PK.indexOf("#SUPPLY#") > -1 ?
        "supply"
      : index.GSI5_PK.indexOf("#DEMAND#") > -1 ?
        "demand"
      : "ign";
      const [createDate, createTime] = index.CREATED_AT.split("T");
      if (isSeconds || isMinutes || isHourly) {
        const indexDateTimestamp = index.GSI5_SK.split("#")[0];
        const indexTimestamp = indexDateTimestamp.split("T")[1];
        const currTime = isSeconds ?
          indexTimestamp.split(":").slice(0, 2).join("_") 
        : isMinutes ?
          indexTimestamp.split(":")[0]
        : "";
        const indexHistory = index.INDEX_HISTORY ? JSON.parse(index.INDEX_HISTORY) : {};
        const indexHistoryKeys = Object.keys(indexHistory);
        for (let c = 0, len = indexHistoryKeys.length; c < len; c += 1) {
          let currKey = indexHistoryKeys[c];
          currKey = Number.parseInt(currKey, 10) < 10 ? "0" + currKey : currKey;
          const dateTimeKey = "dd_" + createDate.split("-").reverse().join("_") +
            "_" + (currTime  ? currTime + "_" : "") + currKey + (isSeconds ? "" : "_00");
          // We don't *have* to check whether the index's create date is today, 
          // but test data can exist for days after "today"
          if (data[dateTimeKey] && createDate <= today) {
            const rawIndexValue = indexHistory[currKey];
            let indexValue = null;
            if ((rawIndexValue + "").indexOf(".") != -1) {
              indexValue = Number.isNaN(Number.parseFloat(rawIndexValue)) ? 0.0 : Number.parseFloat(rawIndexValue); 
            } else {
              indexValue = Number.isNaN(Number.parseInt(rawIndexValue, 10)) ? 0 : Number.parseInt(rawIndexValue, 10); 
            }
            if (indexValue) data[dateTimeKey].hasData = true;
            data[dateTimeKey].createDate = index.CREATED_AT;
            data[dateTimeKey].displayDate = createDate +
              "T" +
              (currTime ? currTime.replace("_", ":") + ":" : "") + currKey + (currTime ?
                currTime.indexOf("_") != -1 ?
                  ""
                :
                  ":00"
              : ":00:00") + ".000Z";
            data[dateTimeKey].isHourly = isHourly;
            data[dateTimeKey].isMinutes = isMinutes;
            data[dateTimeKey].isSeconds = isSeconds;
            if (byCAID) {
              data[dateTimeKey][index.ENTITY_TYPE.replace("MEASUREMENTBYAREA#", "")] = indexValue;
            } else {
              data[dateTimeKey][indexType] = indexValue;
            }
          }
        }
      } else {
        const dateKey = "dd_" + createDate.split("-").reverse().join("_");
        // We don't *have* to check whether the index's create date is today, 
        // but test data can exist for days after "today"
        if (data[dateKey] && createDate <= today) {
          data[dateKey].createDate = index.CREATED_AT;
          data[dateKey].displayDate = createDate + "T00:00:00.000Z";
          if (byCAID) {
            data[dateKey][index.ENTITY_TYPE.replace("MEASUREMENTBYAREA#", "")] = index.INDEX_AVG;
          } else {
            data[dateKey][indexType] = index.INDEX_AVG;
          }
          data[dateKey].hasData = true;
          data[dateKey].isHourly = false;
          data[dateKey].isMinutes = false;
          data[dateKey].isSeconds = false;
        }
      }
      
    });

  return Object.values(data).filter(datum => isSeconds ? datum.hasData : true);

};

/**
 * 
 * @param {*} indices 
 * @param {*} area 
 * @param {*} tz 
 * @returns 
 */
export const getLatestIndexDateForAreas = (indices, area, tz) => {

  // Input: An array of indices and a area
  // Output: String representation of the latest index date for the area
  // or an empty string if no indices have been provided or no area has been given
  if (!indices || !indices.length || !area) return "";

  // Find the latest index date across all areas
  const latestDateMs = Math.max(...indices
    .filter(index => index.phi || index.ps2 || index.pui || index.pei || index.etr || index.par || index.qe)
    .map(index => new Date(index.createDate).getTime()));
  if (latestDateMs === -Infinity) return "";
  // Format the date for display
  return getFormattedDate(new Date(latestDateMs), "Mmm DD, YYYY", tz);

};

/**
 * 
 * @param {*} latestIndex 
 * @param {*} isHourly 
 * @param {*} areaId 
 * @returns 
 */
export const getLatestIndexValue = (latestIndex, isHourly, areaId) => {

  if (!latestIndex || latestIndex.ENTITY_TYPE !== "INDEXBY" + areaId) return null;

  const indexAvgValue = latestIndex.INDEX_AVG;
  let indexLatestValue = latestIndex.INDEX_LATEST;

  const hhmm = (process.env.NEXT_PUBLIC_NOW ?? new Date().toJSON()).split("T")[1].split(":")[0];

  let currentHourValue = null;
  if (latestIndex.INDEX_HISTORY) {

    try {
    
      const indexHistory = JSON.parse(latestIndex.INDEX_HISTORY);
      currentHourValue = indexHistory[hhmm];
      indexLatestValue = currentHourValue && currentHourValue != indexLatestValue ? currentHourValue : indexLatestValue;
      
    } catch (err) {

      console.error(err);

    }

  }

  return isHourly && indexLatestValue ?
    Number.parseFloat(indexLatestValue + "")
  : indexAvgValue ? 
    Number.parseFloat(indexAvgValue + "")
  :
    null;

};

/**
 * 
 * @param {*} index 
 * @param {*} from 
 * @param {*} to 
 * @returns 
 */
export const isLatestIndexFresh = (index, from, to) => {

  // Input: A time series index data object - { createDate: "X", displayDate: "Y", phi: Z }
  // Output: True if the index's created date is within "INDEX_FRESHNESS_INTERVAL" of now, false otherwise
  if (!index) return false;
  
  const now = (process.env.NEXT_PUBLIC_NOW ? new Date(process.env.NEXT_PUBLIC_NOW) : new Date()).getTime();
  const indexCreatedAt = new Date(index.createDate).getTime();

  // An index must be "INDEX_FRESHNESS_INTERVAL" or newer to be considered fresh
  return now - indexCreatedAt <= INDEX_FRESHNESS_INTERVAL;

};

/**
 * 
 * @param {*} indices 
 * @returns 
 */
export const hasInsufficientHourlyData = (indices) => {

  if (!indices || !indices.length) return true;

  // DL-2023-12-13 Support granularity down to one hour rather than 8
  return indices.reduce((acc, curr) => curr.INDEX_HISTORY && curr.INDEX_HISTORY != "null" ?
    acc += curr.GSI5_PK.indexOf("#DAY#") == -1 ? 0 : Object.keys(JSON.parse(curr.INDEX_HISTORY)).length
  :
    acc += curr.isHourly ? 1 : 0, 0) == 0;

};

export const name = "datetime";