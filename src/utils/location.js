/** @module utils/location */

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

// Alerts

/**
 * 
 * @param {*} alert 
 * @returns 
 */
export const getAlertSeverity = (alert) => {

  if (!alert) return "unknown";

  return alert.SEVERITY_RATING_IDX == 0 ||
    alert.DESCRIPTION.toUpperCase().indexOf("SEVERITY: LOW") != -1 ||
    alert.DESCRIPTION == "LOW" ?
    "low"
  : alert.SEVERITY_RATING_IDX == 1 ||
    alert.DESCRIPTION.toUpperCase().indexOf("SEVERITY: MEDIUM") != -1 ||
    alert.DESCRIPTION == "MEDIUM" ? 
      "medium"
    : alert.SEVERITY_RATING_IDX == 2 ||
      alert.DESCRIPTION.toUpperCase().indexOf("SEVERITY: HIGH") != -1 ||
      alert.DESCRIPTION == "HIGH" ? 
        "high"
      :
        "unknown";

};

// Control areas

/**
 * 
 * @param {*} alerts 
 * @param {*} area 
 * @param {*} activeSchedule 
 * @returns 
 */
export const getAllAlertsForArea = (alerts, area, activeSchedule) => {

  // Input: An array of alerts, a area and an active schedule
  // Output: the set of alerts for the area for the active schedule
  // or an empty array if no alerts have been given or no area has been given
  // or no active schedule has been given
  if (!alerts || !alerts.length || !area || !activeSchedule) return [];

  return alerts.reduce((res, alert) => alert?.GSI3_PK == area.ENTITY_TYPE_ID &&
    alert?.GSI4_PK == activeSchedule.ENTITY_TYPE_ID ? res.concat(alert) : res, []);

};

/**
 * 
 * @param {*} alerts 
 * @param {*} area 
 * @param {*} schedule 
 * @returns 
 */
export const areaHasActiveAlerts = (alerts, area, schedule) => {

  // Input: an array of alerts, a area and an active schedule
  // Output: true if the set of alerts for the area for the active schedule has at least one active alert
  // otherwise false
  if (!alerts || !alerts.length || !area || !schedule) return false;

  return !!(getAllAlertsForArea(alerts, area, schedule).find((alert) => alert?.STATE == "active"));

};

/**
 * 
 * @param {*} alerts 
 * @param {*} area 
 * @param {*} schedule 
 * @returns 
 */
export const areaHasInFlightAlerts = (alerts, area, schedule) => {

  // Input: An array of alerts, a area and an active schedule
  // Output: true if the set of alerts for the area for the active schedule has at least one active or resolving alert
  // otherwise false
  if (!alerts || !alerts.length || !area || !schedule) return false;

  return !!getAllAlertsForArea(alerts, area, schedule).filter(alert => alert?.STATE === "active" || alert?.STATE === "resolving").length;

};

/**
 * 
 * @param {*} alerts 
 * @param {*} area 
 * @param {*} schedule 
 * @returns 
 */
export const areaHasResolvedAlerts = (alerts, area, schedule) => {

  // Input: an array of alerts, a area and an active schedule
  // Output: true if the set of alerts for the area for the active schedule has at least one resolved alert
  // otherwise false
  if (!alerts || !alerts.length || !area) return false;

  return !!(getAllAlertsForArea(alerts, area, schedule).find((alert) => alert?.STATE == "closed_resolved"));

};

/**
 * 
 * @param {*} alerts 
 * @param {*} area 
 * @param {*} schedule 
 * @returns 
 */
export const areaHasMultipleAlerts = (alerts, area, schedule) => {

  // Input: an array of alerts, a area and an active schedule
  // Output: true if the set of alerts for the area for the active schedule has at least one resolved alert
  // otherwise false
  if (!alerts || !alerts.length || !area) return false;

  return getAllAlertsForArea(alerts, area, schedule).filter((alert) => alert?.STATE == "active").length > 1;

};

// Locations

/**
 * 
 * @param {*} schedules 
 * @param {*} location 
 * @returns 
 */
export const getAggregatedSchedulesForLocation = (schedules, location) => {

  // Input: an array of schedules and a location
  // Output: a schedule object with the cycle start date as the earliest start date and
  // the expected completion data as the latest expected completion date
  // otherwise null
  if (!schedules || !schedules.length || !location) return null;

  const aggregatedSchedule = {
    ENTITY_TYPE_ID: "AGGREGATEDGROWTHJOB",
    CYCLE_STARTED_AT: "",
    CYCLE_COMPLETING_AT: ""
  };

  // Get the relevant schedules
  const schedulesForLocation = schedules.filter(schedule => schedule.PATH.startsWith(location.PATH));

  // Find the earliest schedule start date
  const earliestCycleStartedAtDate = Math.min(...schedulesForLocation.map(schedule => new Date(schedule.CYCLE_STARTED_AT).getTime()));

  // Find the latest schedule completing date
  const latestCycleCompletingAtDate = Math.max(...schedulesForLocation.map(schedule => new Date(schedule.CYCLE_COMPLETING_AT).getTime()));

  if (earliestCycleStartedAtDate !== Number.POSITIVE_INFINITY && latestCycleCompletingAtDate !== Number.NEGATIVE_INFINITY) {

    aggregatedSchedule.CYCLE_STARTED_AT = new Date(earliestCycleStartedAtDate).toISOString();
    aggregatedSchedule.CYCLE_COMPLETING_AT = new Date(latestCycleCompletingAtDate).toISOString();
  
    return aggregatedSchedule;
  
  }

  return null;

};

/**
 * 
 * @param {*} locationType 
 * @param {*} alert 
 * @param {*} locations 
 * @param {*} areas 
 * @param {*} area 
 * @returns 
 */
export const getLocationForType = (locationType, alert, locations, areas, area) => {

  if (!locationType) return null;

  // If we are looking for a specific location, prepare the necessary data
  // The location IDs identified in the Alert's PATH
  const alertPathParts = alert?.PATH?.split("#") || [];
  // The locations identified in the Alert's PATH
  const alertLocations = locations.filter(location => alertPathParts.includes(location.ENTITY_TYPE_ID.replace("LOCATION#", "")));
  
  let alertArea;
  if (!areas.length && area) {
    alertArea = area;
  } else {
    alertArea = areas.find(ca => ca.ENTITY_TYPE_ID == alert?.GSI3_PK);
  }
  
  // Supported location types are those defined for the tenant e.g. "tent_wo_rack", plus
  // "area" to display the alerted Control Area name,
  // "areaContainer" to display the name of the Location containing the alerted Control Area
  if (locationType == "area") {
    return alertArea;     
  } else if (locationType == "areaContainer") {
    return locations.find(location => location.PATH == alert?.PATH);    
  } else {
    if (locationType.indexOf("||") != -1) {
      const locationTypes = locationType.split("||");
      let matchingLocation = null;
      for (let c = 0, len = locationTypes.length; c < len; c += 1) {
        const matchingLocationForType = alertLocations.find(alertLocation => alertLocation.GSI2_PK == "TYPE#" + locationTypes[c].toUpperCase());
        if (matchingLocationForType) {
          matchingLocation = matchingLocationForType;
          break;
        }
      }
      return matchingLocation;
    } else {
      return alertLocations.find(alertLocation => alertLocation.GSI2_PK == "TYPE#" + locationType.toUpperCase());
    }
  }
  
};

/**
 * 
 * @param {*} location 
 * @param {*} alerts 
 * @returns 
 */
export const locationHasActiveAlerts = (location, alerts) => {

  // Input: A location and an array of alerts
  // Output: true if the location and its children have at least one active alert in the array of alerts
  // otherwise false
  if (!location || !alerts.length) return false;

  const activeAlertsForLocationAndChildren = alerts.filter(alert => alert?.PATH?.startsWith(location.PATH) && alert?.STATE == "active");

  return !!activeAlertsForLocationAndChildren.length;

};

/**
 * 
 * @param {*} location 
 * @param {*} alerts 
 * @param {*} ignoreMultipleAlertsForSameCA 
 * @returns 
 */
export const getLocationActiveAlertCount = (location, alerts, ignoreMultipleAlertsForSameCA) => {

  // Input: A location and an array of alerts
  // Output: a count of alerts for the location, ignoring trigger metric
  // otherwise 0
  if (!location || !alerts.length) return 0;

  const activeAlertsForLocation = alerts.filter((alert) =>
    alert?.PATH?.startsWith(location.PATH) &&
    alert?.STATE == "active");
  
  if (ignoreMultipleAlertsForSameCA) {

    return activeAlertsForLocation.filter((alert, idx, arr) => 
      arr.findIndex(innerAlert => innerAlert && alert && innerAlert?.GSI3_PK == alert?.GSI3_PK) == idx).length;

  } else {

    return activeAlertsForLocation.length;

  } 

};

// Zones

/**
 * 
 * @param {*} area 
 * @param {*} zones 
 * @returns 
 */
export const getMeasurementsZones = (area, zones) => {

  // Input: A area and an array of zones
  // Output: An array of unique zone ENTITY_TYPE_IDs related to the area
  // or an empty array if no area has been given or no zones have been given
  if (!area || !zones || !zones.length) return [];

  const pathParts = area.PATH.split("#").slice(0, -1);

  // Check for Control Area-specific Zones
  let areaZones = zones.filter(zone => !zone.DELETED_AT && area.PATH == zone.PATH);
  if (!areaZones.length) {

    // Check for Location-specific Zones, from deepest to shallowest
    // and return the first matching location, or the default (root location) Zones
    let pathLen = pathParts.length;
    let pathCounter = 1;
    areaZones = zones.filter(zone => !zone.DELETED_AT && zone.PATH == pathParts.join("#"));
    while (areaZones.length == 0 && pathCounter < pathLen) {

      const currPath = pathParts.slice(0, pathCounter * -1).join("#");
      areaZones = zones.filter(zone => !zone.DELETED_AT && zone.PATH == currPath);
      pathCounter += 1;

    } 

  }

  return areaZones;

};

/**
 * 
 * @param {*} breadCrumbRootPath 
 * @param {*} locationPathParts 
 * @param {*} isAreaDetailsView 
 * @param {*} isAlertDetailsView 
 * @param {*} rootLocation 
 * @param {*} topNavLocation 
 * @param {*} locations 
 * @param {*} tId 
 * @param {*} topNavLocationPath 
 * @returns 
 */
export const getLocationBreadcrumbs = (breadCrumbRootPath = "", locationPathParts = [], isAreaDetailsView = false,
  isAlertDetailsView = false, rootLocation = "", topNavLocation = "", locations = [], tId, topNavLocationPath ) => {

  let navButtonPath = null;
  const breadCrumbPaths = [];
  let topNavBreadCrumb = null;
  
  breadCrumbRootPath += rootLocation + (topNavLocation ? "/" + topNavLocation : "");

  if (locations.length > 0 && locations.filter(location => location.PATH.split("#").slice(0, -1).join("#") == `PATH#${locationPathParts.slice(0, -1).join("#")}`).length > 1 &&
    topNavLocation != "tnl") {

    // Special case if the top-nav location has multiple child locations (e.g. France -> Paris & Marseille)
    navButtonPath = breadCrumbRootPath +
      topNavLocationPath + "/" +
      topNavLocation +
      (tId ? "?tId=" + tId : "");

  }

  if (topNavLocation != "" && topNavLocation != "tnl") {

    // Special case if top-nav locations have been defined, where we need to add the top-nav location URL
    topNavBreadCrumb = breadCrumbRootPath + topNavLocationPath + "/" + topNavLocation + (tId ? "?tId=" + tId : "");
    breadCrumbPaths.push(topNavBreadCrumb);

  }

  // Ignoring the root location and top-nav location, process each Location ID into a breadcrumb
  for (let c = 2, len = locationPathParts.length; c < len; c += 1) {

    const currLoc = locations.find(location => location.ENTITY_TYPE_ID == "LOCATION#" + locationPathParts[c]);

    if (currLoc) {

      const currLocType = currLoc.GSI2_PK.replace("TYPE#", "").toLowerCase();
      const breadCrumb = breadCrumbRootPath + "/" + currLocType + "/" + locationPathParts[c] + (tId ? "?tId=" + tId : "");
      breadCrumbPaths.push(breadCrumb);

      if (c + 1 == len) {

        navButtonPath = breadCrumb;

      } else if (c + 2 == len) {

        navButtonPath = breadCrumb;

      }

    }

  }

  // Handle special case "close" button navigation
  if (isAreaDetailsView) navButtonPath = breadCrumbRootPath + "/areas" + (tId ? "?tId=" + tId : "");

  if (isAlertDetailsView) navButtonPath = "/alerts/" + rootLocation + "/" + topNavLocation + (tId ? "?tId=" + tId : "");

  return {
    breadCrumbs: breadCrumbPaths,
    navButton: navButtonPath
  }

};

export const name = "location";

module.exports = {
  getAlertSeverity,
  getAllAlertsForArea,
  areaHasActiveAlerts,
  areaHasInFlightAlerts,
  areaHasMultipleAlerts,
  areaHasResolvedAlerts,
  getAggregatedSchedulesForLocation,
  getLocationForType,
  locationHasActiveAlerts,
  getLocationActiveAlertCount,
  getMeasurementsZones,
  getLocationBreadcrumbs,
  name
}