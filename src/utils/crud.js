/** @module utils/crud */

//import { generateClient } from 'aws-amplify/data';
//import { getMeasurementsByArea, getMeasurementsOfTypeByLocationForDate, getMeasurementsOfTypeByLocationForDates } from '@/graphql/queries';
import { getActiveSchedule, getLatestSchedule } from '@/utils/datetime';
import { nameSort, timeSort } from '@/utils/sort';
import { AREA_ENTITIES, SCHEDULE_ENTITIES, MEASUREMENTS_ENTITIES,
  LOCATION_ENTITIES, TENANT_ENTITY, ZONE_ENTITIES } from '@/utils/demoData';

const SUPPORTED_INDICES = ["SUPPLY"];

/**
 * @type { import('aws-amplify/data').Client<import('@/aws-data/resource').Schema> }
 */
//const client = generateClient();

/**
 * Custom types
 * @typedef {(Object)} AmplifyClass
 * @typedef {(Object)} Alert
 * @typedef {(Object)} CognitoUser
 * @typedef {(Object)} Area
 * @typedef {({isError: boolean, message: string})} CSError
 * @typedef {(Object)} Schedule
 * @typedef {({schedules: Schedule[], measurements: Index[], isError: boolean, message: string})} ScheduleMeasurementsData
 * @typedef {(Object)} Index
 * @typedef {(Object)} Location
 * @typedef {({rootLocation: Location, locations: Location[], topNavLocations: Location[], isError: boolean, message: string})} LocationData
 * @typedef {({rootLocation: Location, locations: Location[], tenantData: Tenant, topNavLocations: Location[], tenantDataHash: string, isError: boolean, message: string})} LocationTenantData
 * @typedef {({area: Area, areas: Area[], currentLocationPath: string, rootLocation: Location, locations: Location[], tenantData: Tenant, topNavLocations: Location[], zones: Zone[], isError: boolean, message: string})} AreaLocationTenantZonesData
 * @typedef {(Object)} SunriseSunset
 * @typedef {(Object)} Tenant
 * @typedef {(Object)} Zone
 */

/**
 * Fetch the root location, top-nav locations (if any) and all other locations for a given tenant
 * 
 * @async
 * @param {string} tenantId - The tenant ID to indicate which table we are querying
 * @param {AmplifyClass} [ssr] - The Amplify SSR context, if the request is being made server-side
 * @returns {Promise<LocationData>} The location data object
 */
export const getLocationData = async (tenantId, ssr) => {

  /** @type {LocationData} */
  let data = {};

  try {

    let locationData = [];

    locationData = LOCATION_ENTITIES;

    data.rootLocation = locationData
      .filter(location => !location.DELETED_AT)
      .find(location => location.GSI2_PK == "TYPE#ROOT_LOCATION");
    data.topNavLocations = locationData
      .filter(location => !location.DELETED_AT)
      .filter(location => location.GSI2_PK == "TYPE#TOP_NAV_LOCATION")
      .sort((a, b) => nameSort(a, b, "asc"));
    data.locations = locationData
      .filter(location => !location.DELETED_AT)
      .filter(location => !["TYPE#ROOT_LOCATION", "TYPE#TOP_NAV_LOCATION"].includes(location.GSI2_PK))
      .sort((a, b) => nameSort(a, b, "asc"));

  } catch (errors) {
    const errorResponse = processError("getLocationData", errors);
    if (ssr) {
      throw new Error(errorResponse.message);
    } else {
      console.error(errorResponse.message);
    }
  } finally {
    return data;
  }

};

/**
 * Fetch the root location, top-nav locations (if any) and all other locations for a given tenant
 * 
 * @async
 * @param {string} tenantId - The customer ID
 * @returns {Promise<LocationTenantData>} The location data and tenant entity, or the error response
 *  if an error was caught client-side
 * @throws The error message if an error was caught server-side
 */
export const getLocationDataAndTenant = async (tenantId) => {

  /** @type {LocationTenantData} */
  let data = {};

  try {

    let locationData = [];
    let tenantData = {};

    locationData = LOCATION_ENTITIES;
    tenantData = TENANT_ENTITY;

    // Set the root location data. This determines the container location for all other locations
    data.rootLocation = locationData
      .filter(location => !location.DELETED_AT)
      .find(location => location.GSI2_PK == "TYPE#ROOT_LOCATION");
    // Parse the location data into root locations (those with a LOCATION_HEADER_KEY)
    // and visible locations (no LOCATION_HEADER_KEY and not the root location)
    data.topNavLocations = locationData
      .filter(location => !location.DELETED_AT)
      .filter(location => location.GSI2_PK == "TYPE#TOP_NAV_LOCATION")
      .sort((a, b) => nameSort(a, b, "asc"));
    data.locations = locationData
      .filter(location => !location.DELETED_AT)
      .filter(location => !["TYPE#ROOT_LOCATION", "TYPE#TOP_NAV_LOCATION"].includes(location.GSI2_PK))
      .sort((a, b) => nameSort(a, b, "asc"));
    // Set the tenant data and parse the CONFIG string into JSON
    data.tenantData = tenantData;

    return new Promise((resolve) => resolve(data));

  } catch (errors) {
    const errorResponse = processError("getLocationDataAndTenant", errors);
    throw new Error(errorResponse.message);
  }

};

/**
 * If areaId is given, returns the given area entity, zone entities, location data and tenant entity.
 * If locId is given, returns the given location entity, area entities, zone entities and tenant entity.
 * If baseLocId is given, returns the location entities within that location and the area entities, zone entities
 *  and tenant entity.
 * If none of these are given, returns all location data, area entities, zone entities and tenant entity
 * 
 * @async
 * @param {string} tenantId - The tenant ID to indicate which customer we are querying
 * @param {string} [areaId] - The ID of the area to fetch, if the request is made from the Details View *page*
 * @param {string} [locId] - The ID of the location to fetch, if the request is made from the Installation page
 * @param {string} [baseLocId] - The ID of the parent location whose locations we want to fetch, if the request is made from
 *  the All Areas View page
 * @returns {Promise<AreaLocationTenantZonesData>} The tenant entity or an error object,
 *  if an error was caught client-side
 * @throws The error message if an error was caught server-side
 */
export const getLocationDataTenantDataAndArea = async (tenantId, locId) => {

  /** @type {AreaLocationTenantZonesData} */
  let data = {};

  try {

    let currentLocation;
    let path;

    if (locId) {

      currentLocation = LOCATION_ENTITIES.find(loc => loc.ENTITY_TYPE_ID == "LOCATION#" + locId);
      path = currentLocation.PATH;
        
    } else {

      // If the request does  not contain a location ID, retrieve the root Location
      currentLocation = LOCATION_ENTITIES.find(loc => loc.GSI2_PK == "TYPE#ROOT_LOCATION");
      path = currentLocation.PATH;

    }

    // Get back-end data required for Location page display
    const areaData = AREA_ENTITIES;
    const locationData = LOCATION_ENTITIES;
    const tenantData = TENANT_ENTITY;
    const zoneData = ZONE_ENTITIES;

    // Set the area data (may be empty if the Control Areas  has been deleted)
    // Control Areas are sorted by name
    data.areas = areaData
      .filter(area => area.PATH.startsWith(path))
      .filter(area => !area.DELETED_AT)
      .sort((a, b) => nameSort(a, b, "asc"));
    // Set the current location for breadcrumb processing
    data.currentLocationPath = currentLocation?.PATH || "";
    // Set the root location data. This determines the container location for all other locations
    data.rootLocation = locationData
      .filter(location => !location.DELETED_AT)
      .find(location => location.GSI2_PK == "TYPE#ROOT_LOCATION");
    // Parse the location data into root locations (those with a LOCATION_HEADER_KEY)
    // and visible locations (no LOCATION_HEADER_KEY and not the root location)
    data.topNavLocations = locationData
      .filter(location => !location.DELETED_AT)
      .filter(location => location.GSI2_PK == "TYPE#TOP_NAV_LOCATION")
      .sort((a, b) => nameSort(a, b, "asc"));
    data.locations = locationData
      .filter(location => !location.DELETED_AT)
      .filter(location => !["TYPE#ROOT_LOCATION", "TYPE#TOP_NAV_LOCATION"].includes(location.GSI2_PK))
      .sort((a, b) => nameSort(a, b, "asc"));
    // Set the tenant data and parse the CONFIG string into JSON
    data.tenantData = tenantData;
    data.zones = zoneData.filter(zone => !zone.DELETED_AT);

    return new Promise((resolve) => resolve(data));

  } catch (errors) {
    const errorResponse = processError("getLocationDataTenantDataAndArea", errors);
    throw new Error(errorResponse.message);
  }

};

/**
 * Fetch the schedule entities for a given tenant
 * 
 * @async
 * @param {string} tenantId - The tenant ID to indicate which table we are querying
 * @param {AmplifyClass} [ssr] - The Amplify SSR context, if the request is being made server-side
 * @returns {Promise<(Schedule[]|CSError[])>} An array of schedule entities or an array with a single error object,
 *  if an error was caught client-side
 * @throws The error message if an error was caught server-side
 */
export const getScheduleData = async (tenantId, ssr) => {

  /** @type {Schedule[]} */
  let data = [];

  try {

    let scheduleData = [];

    scheduleData = SCHEDULE_ENTITIES;

    data = scheduleData.filter(schedule => !schedule.DELETED_AT);

    return new Promise((resolve) => resolve(data));

  } catch (errors) {
    const errorResponse = processError("getScheduleData", errors);
    throw new Error(errorResponse.message);
  }

};

/**
 * Fetch the schedule entity and measurements entities for a given area and tenant
 * 
 * @async
 * @param {string} areaId - The ID of the area for which we want to fetch schedule and measurements
 * @param {string} tenantId - The tenant ID to indicate which table we are querying
 * @param {AmplifyClass} [ssr] - The Amplify SSR context, if the request is being made server-side
 * @returns {Promise<(ScheduleMeasurementsData)>} An object containing an array of schedule entities and an array of
 *  schedule measurements, or the error response if an error was caught client-side
 * @throws The error message if an error was caught server-side
 */
export const getScheduleMeasurementsData = async (areaId, tenantId, ssr) => {

  /** @type {ScheduleMeasurementsData} */
  let data = {
    schedules: [],
    measurements: [],
    isError: false,
    message: ""
  };

  try {

    let scheduleData = [];

    scheduleData = SCHEDULE_ENTITIES;

    if (scheduleData) {

      let querySchedule = getActiveSchedule(scheduleData.filter(schedule => !schedule.DELETED_AT));

      if (!querySchedule) {

        querySchedule = getLatestSchedule(scheduleData.filter(schedule => !schedule.DELETED_AT));
      
      }

      if (querySchedule) {

        let measurementsData = MEASUREMENTS_ENTITIES;

        // Set the measurements array
        data.measurements = measurementsData
          .filter(index => !index.DELETED_AT);

        // Set the schedule array
        data.schedules = [querySchedule];

      }
      
    }

    return new Promise((resolve) => resolve(data));

  } catch (errors) {
    const errorResponse = processError("getScheduleMeasurementsData", errors);
    throw new Error(errorResponse.message);
  }

};

/**
 * Fetch the index entities for a given index type, location and date for a given tenant
 * 
 * @async
 * @param {string} locId - The ID of the location for which we want to fetch measurement entities
 * @param {string} date - The date for which we want to fetch index entities, in YYYY-MM-DD format
 * @param {string} index - The measurement we want to fetch entities for. One of "PHI", "PS2", "PEI", "PUI", "ETR", "PAR", "SUPPLY" 
 * @param {string} tenantId - The tenant ID to indicate which customer we are querying
 * @param {AmplifyClass} [ssr] - The Amplify SSR context, if the request is being made server-side
 * @returns {Promise<(Index[]|CSError[])>} The measurement entities or an error object,
 *  if an error was caught client-side
 * @throws The error message if an error was caught server-side
*/
export const getLocationMeasurementsDataByDateAndType = async (locId, date, index, tenantId, ssr) => {

  /** @type {Index[]} */
  let data = [];

  try {

    let measurementsData = MEASUREMENTS_ENTITIES;

    if (date.indexOf("T") > -1) {

      date = date.split("T")[0];

    }

    return new Promise((resolve) => resolve(data));

  } catch (errors) {
    const errorResponse = processError("getLocationMeasurementsDataByDateAndType", errors);
    throw new Error(errorResponse.message);
  }

};

/**
 * Fetch the index entities for a given index type, location and date range for a given tenant
 * 
 * @async
 * @param {string} locId - The ID of the location for which we want to fetch measurement entities
 * @param {string} dateFrom - The date from which we want to fetch measurement entities, in YYYY-MM-DD(?THH:mm) format
 * @param {string} dateTo - The date from which we want to fetch measurement entities, in YYYY-MM-DD(?THH:mm) format
 * @param {string} index - The measurement we want to fetch entities for. One of "PHI", "PS2", "PEI", "PUI", "ETR", "PAR", "SUPPLY"
 * @param {number} areaCount - The number of areas to fetch data for
 * @param {string} tenantId - The tenant ID to indicate which table we are querying
 * @param {AmplifyClass} [ssr] - The Amplify SSR context, if the request is being made server-side
 * @returns {Promise<(Index[]|CSError[])>} The measurement entities or an error object,
 *  if an error was caught client-side
 * @throws The error message if an error was caught server-side
*/
export const getLocationMeasurementsDataByDatesAndType = async (locId, dateFrom, dateTo, index, areaCount, tenantId, ssr) => {

  /** @type {Index[]} */
  let data = [];

  try {

    let measurementsData = MEASUREMENTS_ENTITIES;

    return new Promise((resolve) => resolve(data));

  } catch (errors) {
    const errorResponse = processError("getLocationMeasurementsDataByDatesAndType", errors);
    throw new Error(errorResponse.message);
  }

};

/**
 * Get the pre-signed URL of an object in S3
 * 
 * @async
 * @param {string} itemKey - The S3 key of the item for which we want a pre-signed URL
 * @returns {Promise<string>} The pre-signed URL of the item
 */
export const getStorageItem = async (itemKey) => {

  return null //Storage.get(itemKey);

};

/**
 * Fetch a list of pre-signed URLs and object metadata for a given schedule and zone list
 * 
 * @async
 * @param {string} scheduleId - The schedule entity ID which forms the first part of the storage path 
 * @param {Zone[]} zones - The list of zone entities which can form the second part of the storage path
 * @returns {Promise<Object[]>} The array of the pre-signed URLs and metadata for the S3 objects related to
 *  the schedule and zones
 * @throws The error message if an error was caught server-side
 */
export const getStorageItems = async (scheduleId, zones) => {

  /** @type {Object[]} */
  let data = [];

  try {

    let metaData = {};
    let promiseArray = [];
    for (let c = 0, len = zones.length; c < len; c += 1) {

      const zone = zones[c];

      const zoneFileList = {
        results: []
      };

      if (zoneFileList.results) {

        zoneFileList.results.forEach(zoneFile => {

          if (zoneFile.key.endsWith(".png")) {

            promiseArray.push(getStorageItem(zoneFile.key));
            metaData[zoneFile.key] = { lastModified: zoneFile.lastModified };

          }

        });

      }
      
    }

    if (promiseArray.length) {

      const res = await Promise.all(promiseArray);
      for (let c = 0, len = res.length; c < len; c +=1) {
        
        const metaDataKey = Object.keys(metaData).find(datum => res[c].substring(datum) != -1);
        data.push({
          src: res[c],
          metaData: metaData[metaDataKey]
        })
      }

    }

    return new Promise((resolve) => resolve(data));

  } catch (errors) {
    const errorResponse = processError("getStorageItems", errors);
    throw new Error(errorResponse.message);
  }
  
};

const processError = (caller, errors) => {

  let errorResponse = {
    isError: true,
    message: ""
  };
  console.error("Caller function: " + caller);
  if (Array.isArray(errors)) {
    console.error({...errors});
    errorResponse.message = errors[0].message;
  } else if (errors.errors) {
    console.error(errors.errors[0].message);
    errorResponse.message = errors.errors[0].message;
  } else {
    console.error(errors);
    errorResponse.message = errors;
  }
  return errorResponse;

};

export const name = "crud";