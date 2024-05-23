/** @module utils/datetime */

/**
 * Custom types
 * @typedef {(Object)} AmplifyClass
 * @typedef {(Object)} CognitoUser
 * @typedef {(Object)} Area
 * @typedef {({isError: boolean, message: string})} CSError
 * @typedef {(Object)} Schedule
 * @typedef {({schedules: Schedule[], measurements: Index[], isError: boolean, message: string})} ScheduleMeasurementsData
 * @typedef {(Object)} Index
 * @typedef {(Object)} Location
 * @typedef {({rootLocation: Location, locations: Location[], topNavLocations: Location[], isError: boolean, message: string})} LocationData
 * @typedef {({rootLocation: Location, locations: Location[], tenantData: Tenant, topNavLocations: Location[], isError: boolean, message: string})} LocationTenantData
 * @typedef {({area: Area, areas: Area[], currentLocationPath: string, rootLocation: Location, locations: Location[], tenantData: Tenant, topNavLocations: Location[], zones: Zone[], isError: boolean, message: string})} AreaLocationTenantZonesData
 * @typedef {(Object)} Tenant
 * @typedef {(Object)} Zone
 */

// Define how long an measure is considered "fresh" in ms
// Initial value is 4h = 14,400,000
// 2022-12-23 1d = 86,400,000
const INDEX_FRESHNESS_INTERVAL = 86400000;

// Useful millisecond values
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
 * @returns 
 */
export const getPeriodStartAndEndDate = (schedule, period, isRollingPeriod, isHourly) => {

  /*
    Given a Growth Job with a start and end date, and a period of days,
    calculate the start and end date of the period for the current day in the active Growth Job
    where the start date begins at midnight and the end date ends at 23:59:59.999
  */
  if (!schedule || period == null) return [];

  const now = (process.env.NEXT_PUBLIC_NOW ? new Date(process.env.NEXT_PUBLIC_NOW) : new Date()); 
  let periodStartDate, periodEndDate;

  if (period == -1) {

    let scheduleStartDateMs = new Date(schedule.cycleStartedAt).setUTCHours(0, 0, 0, 0);
    let scheduleEndDateMs = new Date(schedule.cycleCompletingAt).setUTCHours(23, 59, 59, 999);

    return [ 
      scheduleStartDateMs,
      scheduleEndDateMs
    ];
  
  }

  const nowMs = now.setUTCMinutes(0, 0 ,0);
  const periodMs = period * MINUTES_SECONDS_MS_IN_HOUR;

  const scheduleStartDate = new Date(schedule.cycleStartedAt);
  const scheduleEndDate = new Date(schedule.cycleCompletedAt || schedule.cycleCompletingAt);

  if (isRollingPeriod) {
    
    let currPeriodStartDateMs = nowMs - periodMs;

    let scheduleStartDateMs = isHourly ?
      scheduleStartDate.setUTCMinutes(0, 0 ,0)
    :
      scheduleStartDate.setUTCHours(0, 0, 0, 0);

    let scheduleEndDateMs = isHourly ?
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

    let currPeriodDateMs =isHourly ?
      scheduleStartDate.setUTCMinutes(0, 0 ,0)
    :
      scheduleStartDate.setUTCHours(0, 0, 0, 0);

    let scheduleEndDateMs = isHourly ?
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
    periodStartDate + (isHourly ? MINUTES_SECONDS_MS_IN_HOUR : 0),
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
 * if there is sufficient measurements data to show hourly data points in an hourly view (1 = true, 0 = false).
 * 
 * @param {Schedule} schedule - a schedule that provides a date range
 * @param {number} period - the number of hours in the date range 
 * @param {number} hourlyDailyThreshold - the hours at which data point display switches from daily to hourly 
 * @param {boolean} isRollingPeriod - a flag to indicate if data is displayed windowed (false) or rolling (true) 
 * @param {Index[]} measurements - an array of measurements to check for sufficient hourly data points 
 * @returns {[number, number, number]} - the start date in milliseconds, the end date in milliseconds and the "is hourly" flag
 */
export const getPeriodStartAndEndMs = (schedule, period, hourlyDailyThreshold, isRollingPeriod, measurements) => {

  if (!schedule || period == null) return [null, null, 0];

  // Determine the current period's start and end dates in milliseconds from the epoch
  let [startDateMs, endDateMs] = getPeriodStartAndEndDate(schedule, period, isRollingPeriod, false);

  // Given the start and end dates for the period, filter the measurements entities that fall in this period
  const startDateJSON = new Date(startDateMs).toJSON();
  const endDateJSON = new Date(endDateMs).toJSON();

  if (!startDateJSON || !endDateJSON) return [null, null, 0];

  const startDate = startDateJSON.split("T")[0];
  const endDate = endDateJSON.split("T")[0];
  const periodMeasurements = measurements.filter(measure => {
    const [createDate, createTime] = measure.createdAt.split("T");
    return createDate >= startDate && createDate <= endDate;
  });
  let isHourly = 0;
  if (isHourlyDataPointThresholdTriggered(startDateMs, endDateMs, hourlyDailyThreshold, hasInsufficientHourlyData(periodMeasurements))) {
    [startDateMs, endDateMs] = getPeriodStartAndEndDate(schedule, period, isRollingPeriod, true);
    isHourly = 1;
  }

  return [startDateMs, endDateMs, isHourly];
  
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

// Schedules

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
    const cycleStartDateMs = new Date(activeSchedule.cycleStartedAt).setUTCHours(0, 0, 0, 0);
    const cycleEndDateMs = new Date(activeSchedule.cycleCompletingAt).setUTCHours(23, 59, 59, 999);
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
  return schedules.find(schedule => !schedule.cycleCompletedAt &&
    new Date(schedule.cycleStartedAt).getTime() <= nowMs &&
    new Date(schedule.cycleCompletingAt).getTime() >= nowMs);

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

    const activeScheduleStartDate = new Date(activeSchedule.cycleStartedAt);
    const activeScheduleStartDateMs = activeScheduleStartDate.setUTCHours(activeScheduleStartDate.getUTCHours(), 0, 0, 0);
    const activeScheduleEndDate = new Date(activeSchedule.cycleCompletingAt);
    const activeScheduleEndDateMs = activeScheduleEndDate.setUTCHours(activeScheduleEndDate.getUTCHours(), 0, 0, 0);

    return (fmt == "JSON" ? activeSchedule.cycleStartedAt.substring(0, 13) + ":00:00.000Z" :
      getFormattedDate(new Date(activeScheduleStartDateMs), fmt ? fmt : "Mmmm DD", tz)) + 
    " - " +
      (fmt == "JSON" ? activeSchedule.cycleCompletingAt.substring(0, 13) + ":00:00.000Z" : 
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
  isHourly = false, roundUp) => {

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

  const [periodStartDate, periodEndDate] = getPeriodStartAndEndDate(activeSchedule, period, isRollingPeriod, isHourly);

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
 * @returns 
 */
export const getActiveScheduleStartDate = (schedules, period, isRollingPeriod = false, isHourly = false) => {

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

    const [periodStartDate, periodEndDate] = getPeriodStartAndEndDate(activeSchedule, period, isRollingPeriod, isHourly);
    return new Date(periodStartDate);

  } else {

    const activeScheduleStartDate = new Date(activeSchedule.cycleStartedAt); 
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
export const getCurrentCyclePoint = (schedules, period, isRollingPeriod = false, isHourly = false) => {

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

      const [periodStartDate, periodEndDate] = getPeriodStartAndEndDate(activeSchedule, period, isRollingPeriod, isHourly);
      const periodDuration = Math.ceil((periodEndDate - periodStartDate) / (isHourly ? MINUTES_SECONDS_MS_IN_HOUR : 24 * MINUTES_SECONDS_MS_IN_HOUR));
      const differenceFromNow = isHourly ? 
        getDifferenceInHours((process.env.NEXT_PUBLIC_NOW ? new Date(process.env.NEXT_PUBLIC_NOW) : new Date()),
          periodStartDate, false, false)
      :
        getDifferenceInDays((process.env.NEXT_PUBLIC_NOW ? new Date(process.env.NEXT_PUBLIC_NOW) : new Date()),
          periodStartDate, false, false);
      return differenceFromNow > periodDuration ? periodDuration : differenceFromNow;

    } else {

      const cycleDuration = getActiveCycleDurationInDays(schedules);
      const differenceFromNow = isHourly ? 
        getDifferenceInHours((process.env.NEXT_PUBLIC_NOW ? new Date(process.env.NEXT_PUBLIC_NOW) : new Date()),
        new Date(activeSchedule.cycleStartedAt), false, true)
      :
        getDifferenceInDays((process.env.NEXT_PUBLIC_NOW ? new Date(process.env.NEXT_PUBLIC_NOW) : new Date()),
        new Date(activeSchedule.cycleStartedAt), false, true);
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
    // Use the latest schedule cycleCompletedAt or cycleCompletingAt date
    dateMs = new Date(latestSchedule.cycleCompletedAt || latestSchedule.cycleCompletingAt).setUTCHours(23, 59, 59, 999);
  } else if (getDifferenceInDays(dateMs, new Date(activeSchedule.cycleCompletingAt).setUTCHours(23, 59, 59, 999), false, false) > 0) {
    // Check if the active schedule has actually expired (now > cycleCompletingAt)
    // and update the date if it has
    dateMs = new Date(activeSchedule.cycleCompletingAt).setUTCHours(23, 59, 59, 999);
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
      new Date(latestCompletedSchedule.cycleStartedAt).setUTCMinutes(0, 0, 0)
    : 
      new Date(latestCompletedSchedule.cycleStartedAt).setUTCHours(0, 0, 0, 0);
    const cycleEndDateMs = isHourly ?
      new Date(latestCompletedSchedule.cycleCompletedAt || latestCompletedSchedule.cycleCompletingAt).setUTCHours(59, 59, 999)
    :
      new Date(latestCompletedSchedule.cycleCompletedAt || latestCompletedSchedule.cycleCompletingAt).setUTCHours(23, 59, 59, 999);
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
    new Date(curr.cycleStartedAt).getTime() > new Date(prev.cycleStartedAt).getTime() &&
    new Date(curr.cycleStartedAt).getTime() <= nowMs &&
    new Date(curr.cycleCompletingAt).getTime() >= nowMs ? curr : prev, { cycleStartedAt: 0 });

  // If a schedule matches these criteria, return it 
  if (latestRunningSchedule.cycleStartedAt != 0) {

    return latestRunningSchedule;

  } else {

    // Otherwise return the latest schedule where the completing date has passed
    return schedules.reduce((prev, curr) =>
      new Date(curr.cycleStartedAt).getTime() > new Date(prev.cycleStartedAt).getTime() &&
      new Date(curr.cycleStartedAt).getTime() <= nowMs &&
      new Date(curr.cycleCompletingAt).getTime() < nowMs ? curr : prev);

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
  isHourly = false, roundUp) => {

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

    const [periodStartDate, periodEndDate] = getPeriodStartAndEndDate(latestSchedule, period, isRollingPeriod, isHourly);

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
 * @returns 
 */
export const getLatestScheduleStartDate = (schedules, period, isRollingPeriod = false, isHourly = false) => {

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

    const [periodStartDate, periodEndDate] = getPeriodStartAndEndDate(latestSchedule, period, isRollingPeriod, isHourly);
    return new Date(periodStartDate);

  } else {

    const latestScheduleStartDate = new Date(latestSchedule.cycleStartedAt); 
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
 * @param {*} measurements 
 * @param {*} currentDateMs 
 * @param {*} endDateMs 
 * @param {*} isHourly 
 * @param {*} period 
 * @param {*} hourlyDailyThreshold 
 * @param {*} byCAID 
 * @param {*} type 
 * @returns 
 */
export const getMeasurementsDataByTime = (measurements, currentDateMs, endDateMs, isHourly, period, hourlyDailyThreshold, byCAID, type) => {

  // Input: An array of measurements, a schedule, a period of days to return from today backwards, the number of hours
  // before or on which hourly data points should be returned and after which daily data points should be returned,
  // and the current location timezone offset
  // Output: When daily data points are required, an object containing a date entry for each unique day of the schedule, from today - period to today
  // and the measurements relating to that date
  // or when hourly data points are required, an object containing a date and time entry for each unique day and time of the schedule, from today - period to today
  // and the measurements relating to that date and time
  // or an empty object if no measurements have been given, no schedule has been given or no period has been given

  // Set up the data object to store the measurements data
  let data = {};

  if (!measurements || !measurements.length) return [];

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
  let measurementsKeySet = new Set();
  while (currentDateMs <= endDateMs) {
    const current = new Date(currentDateMs).toJSON();
    const [currDate, currTime] = current.split("T");
    measurementsKeySet.add(currDate);
    const displayTime = isHourly ? 
      "_" + currTime.split(":")[0] + "_00"
    :
      "";
    const dataKey = "dd_" + currDate.split("-").reverse().join("_") + displayTime;
    data[dataKey] = { createDate: current, displayDate: current };
    if (isHourly) data[dataKey].isHourly = true;
    data[dataKey].hasData = false;
    currentDateMs += (isHourly ?
      MINUTES_SECONDS_MS_IN_HOUR
    :
      HOURS_MINUTES_SECONDS_MS_IN_DAY);
    dataKeys.push(dataKey);
  }
  let keyToDelete = ignoreFirstDatum ? dataKeys[0] : ignoreLastDatum ? dataKeys[dataKeys.length - 1] : null;
  if (keyToDelete) delete data[keyToDelete];
  const measurementsKeys = Array.from(measurementsKeySet);

  // Get today's date and time
  const [today, now] = (process.env.NEXT_PUBLIC_NOW ?? new Date().toJSON()).split("T");

  measurements
    .filter(measure => measurementsKeys.includes(measure.gsi5Sk.split("#")[0]))
    .map(measure => {
      const measureType = measure.gsi5Pk.indexOf("#SUPPLY#") > -1 ?
        "supply"
      : measure.gsi5Pk.indexOf("#DEMAND#") > -1 ?
        "demand"
      : "ign";
      const [createDate, createTime] = measure.createdAt.split("T");
      if (isHourly) {
        const measureHistory = measure.indexHistory ? JSON.parse(measure.indexHistory) : {};
        const measureHistoryKeys = Object.keys(measureHistory);
        for (let c = 0, len = measureHistoryKeys.length; c < len; c += 1) {
          let currKey = measureHistoryKeys[c];
          currKey = Number.parseInt(currKey, 10) < 10 ? "0" + currKey : currKey;
          const dateTimeKey = "dd_" + createDate.split("-").reverse().join("_") +
            "_" + currKey + "_00";
          // We don't *have* to check whether the measure's create date is today, 
          // but test data can exist for days after "today"
          if (data[dateTimeKey] && createDate <= today) {
            const rawIndexValue = measureHistory[currKey];
            let measureValue = null;
            if ((rawIndexValue + "").indexOf(".") != -1) {
              measureValue = Number.isNaN(Number.parseFloat(rawIndexValue)) ? 0.0 : Number.parseFloat(rawIndexValue); 
            } else {
              measureValue = Number.isNaN(Number.parseInt(rawIndexValue, 10)) ? 0 : Number.parseInt(rawIndexValue, 10); 
            }
            if (measureValue) data[dateTimeKey].hasData = true;
            data[dateTimeKey].createDate = measure.createdAt;
            data[dateTimeKey].displayDate = createDate +
              "T" + currKey + ":00:00" + ".000Z";
            data[dateTimeKey].isHourly = isHourly;
            if (byCAID) {
              data[dateTimeKey][measure.entityType.replace("MEASUREMENTBYAREA#", "")] = measureValue;
            } else {
              data[dateTimeKey][measureType] = measureValue;
            }
          }
        }
      } else {
        const dateKey = "dd_" + createDate.split("-").reverse().join("_");
        // We don't *have* to check whether the measure's create date is today, 
        // but test data can exist for days after "today"
        if (data[dateKey] && createDate <= today) {
          data[dateKey].createDate = measure.createdAt;
          data[dateKey].displayDate = createDate + "T00:00:00.000Z";
          if (byCAID) {
            data[dateKey][measure.entityType.replace("MEASUREMENTBYAREA#", "")] = measure.indexAvg;
          } else {
            data[dateKey][measureType] = measure.indexAvg;
          }
          data[dateKey].hasData = true;
          data[dateKey].isHourly = false;
        }
      }
      
    });

  return Object.values(data);

};

/**
 * 
 * @param {*} measurements 
 * @param {*} area 
 * @param {*} tz 
 * @returns 
 */
export const getLatestIndexDateForAreas = (measurements, area, tz) => {

  // Input: An array of measurements and a area
  // Output: String representation of the latest measure date for the area
  // or an empty string if no measurements have been provided or no area has been given
  if (!measurements || !measurements.length || !area) return "";

  // Find the latest measure date across all areas
  const latestDateMs = Math.max(...measurements
    .filter(measure => measure.phi || measure.ps2 || measure.pui || measure.pei || measure.etr || measure.par || measure.qe)
    .map(measure => new Date(measure.createDate).getTime()));
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

  if (!latestIndex || latestIndex.entityType !== "MEASUREMENTBY" + areaId) return null;

  const measureAvgValue = latestIndex.indexAvg;
  let measureLatestValue = latestIndex.indexLatest;

  const hhmm = (process.env.NEXT_PUBLIC_NOW ?? new Date().toJSON()).split("T")[1].split(":")[0];

  let currentHourValue = null;
  if (latestIndex.indexHistory) {

    try {
    
      const measureHistory = JSON.parse(latestIndex.indexHistory);
      currentHourValue = measureHistory[hhmm];
      measureLatestValue = currentHourValue && currentHourValue != measureLatestValue ? currentHourValue : measureLatestValue;
      
    } catch (err) {

      console.error(err);

    }

  }

  return isHourly && measureLatestValue ?
    Number.parseFloat(measureLatestValue + "")
  : measureAvgValue ? 
    Number.parseFloat(measureAvgValue + "")
  :
    null;

};

/**
 * 
 * @param {*} measure 
 * @param {*} from 
 * @param {*} to 
 * @returns 
 */
export const isLatestIndexFresh = (measure, from, to) => {

  // Input: A time series measure data object - { createDate: "X", displayDate: "Y", phi: Z }
  // Output: True if the measure's created date is within "INDEX_FRESHNESS_INTERVAL" of now, false otherwise
  if (!measure) return false;
  
  const now = (process.env.NEXT_PUBLIC_NOW ? new Date(process.env.NEXT_PUBLIC_NOW) : new Date()).getTime();
  const measureCreatedAt = new Date(measure.createDate).getTime();

  // An measure must be "INDEX_FRESHNESS_INTERVAL" or newer to be considered fresh
  return now - measureCreatedAt <= INDEX_FRESHNESS_INTERVAL;

};

/**
 * 
 * @param {*} measurements 
 * @returns 
 */
export const hasInsufficientHourlyData = (measurements) => {

  if (!measurements || !measurements.length) return true;

  // DL-2023-12-13 Support granularity down to one hour rather than 8
  return measurements.reduce((acc, curr) => curr.indexHistory && curr.indexHistory != "null" ?
    acc += curr.gsi5Pk.indexOf("#SUPPLY#") == -1 ? 0 : Object.keys(JSON.parse(curr.indexHistory)).length
  :
    acc += curr.isHourly ? 1 : 0, 0) == 0;

};

export const name = "datetime";