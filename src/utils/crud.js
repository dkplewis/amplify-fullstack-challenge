/** @module utils/crud */

import { getUrl, list } from 'aws-amplify/storage';
import { generateClient } from 'aws-amplify/data';
import { runWithAmplifyServerContext, reqResBasedClient } from '@/utils/amplifyServerUtils';
import { getActiveSchedule, getLatestSchedule } from '@/utils/datetime';
import { nameSort } from '@/utils/sort';
import { AREA_ENTITIES, SCHEDULE_ENTITIES, MEASUREMENTS_ENTITIES,
  LOCATION_ENTITIES, TENANT_ENTITY, ZONE_ENTITIES } from '@/utils/demoData';

/**
 * @type {import('aws-amplify/data').Client<import('@/aws-data/resource').Schema>}
 */
const client = generateClient();

/**
 * Custom types
 * @typedef {(Object)} StorageGetUrlOutput
 * @typedef {(Object)} AmplifyClass
 * @typedef {(Object)} CognitoUser
 * @typedef {(Object)} Area
 * @typedef {({isError: boolean, message: string})} CSError
 * @typedef {(Object)} Schedule
 * @typedef {({schedules: Schedule[], measurements: Measure[], isError: boolean, message: string})} ScheduleMeasurementsData
 * @typedef {(Object)} Measure
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
      .filter(location => !location.deletedAt)
      .find(location => location.gsi2Pk == "TYPE#ROOT_LOCATION");
    data.topNavLocations = locationData
      .filter(location => !location.deletedAt)
      .filter(location => location.gsi2Pk == "TYPE#TOP_NAV_LOCATION")
      .sort((a, b) => nameSort(a, b, "asc"));
    data.locations = locationData
      .filter(location => !location.deletedAt)
      .filter(location => !["TYPE#ROOT_LOCATION", "TYPE#TOP_NAV_LOCATION"].includes(location.gsi2Pk))
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
      .filter(location => !location.deletedAt)
      .find(location => location.gsi2Pk == "TYPE#ROOT_LOCATION");
    // Parse the location data into root locations (those with a locationHeaderKey)
    // and visible locations (no locationHeaderKey and not the root location)
    data.topNavLocations = locationData
      .filter(location => !location.deletedAt)
      .filter(location => location.gsi2Pk == "TYPE#TOP_NAV_LOCATION")
      .sort((a, b) => nameSort(a, b, "asc"));
    data.locations = locationData
      .filter(location => !location.deletedAt)
      .filter(location => !["TYPE#ROOT_LOCATION", "TYPE#TOP_NAV_LOCATION"].includes(location.gsi2Pk))
      .sort((a, b) => nameSort(a, b, "asc"));
    // Set the tenant data and parse the config string into JSON
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
 * @param {string} [locId] - The ID of the location to fetch, if the request is made from the Installation page
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

      currentLocation = LOCATION_ENTITIES.find(loc => loc.entityTypeId == "LOCATION#" + locId);
      path = currentLocation.path;
        
    } else {

      // If the request does  not contain a location ID, retrieve the root Location
      currentLocation = LOCATION_ENTITIES.find(loc => loc.gsi2Pk == "TYPE#ROOT_LOCATION");
      path = currentLocation.path;

    }

    // Get back-end data required for Location page display
    const areaData = AREA_ENTITIES;
    const locationData = LOCATION_ENTITIES;
    const tenantData = TENANT_ENTITY;
    const zoneData = ZONE_ENTITIES;

    // Set the area data (may be empty if the Control Areas  has been deleted)
    // Control Areas are sorted by name
    data.areas = areaData
      .filter(area => area.path.startsWith(path))
      .filter(area => !area.deletedAt)
      .sort((a, b) => nameSort(a, b, "asc"));
    // Set the current location for breadcrumb processing
    data.currentLocationPath = currentLocation?.path || "";
    // Set the root location data. This determines the container location for all other locations
    data.rootLocation = locationData
      .filter(location => !location.deletedAt)
      .find(location => location.gsi2Pk == "TYPE#ROOT_LOCATION");
    // Parse the location data into root locations (those with a locationHeaderKey)
    // and visible locations (no locationHeaderKey and not the root location)
    data.topNavLocations = locationData
      .filter(location => !location.deletedAt)
      .filter(location => location.gsi2Pk == "TYPE#TOP_NAV_LOCATION")
      .sort((a, b) => nameSort(a, b, "asc"));
    data.locations = locationData
      .filter(location => !location.deletedAt)
      .filter(location => !["TYPE#ROOT_LOCATION", "TYPE#TOP_NAV_LOCATION"].includes(location.gsi2Pk))
      .sort((a, b) => nameSort(a, b, "asc"));
    // Set the tenant data and parse the config string into JSON
    data.tenantData = tenantData;
    data.zones = zoneData.filter(zone => !zone.deletedAt);

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

    data = scheduleData.filter(schedule => !schedule.deletedAt);

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
 * @param {Object} [ssr] - The Amplify SSR context, if the request is being made server-side
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

    let scheduleData = SCHEDULE_ENTITIES;

    if (scheduleData) {

      let querySchedule = getActiveSchedule(scheduleData.filter(schedule => !schedule.deletedAt));

      if (!querySchedule) {

        querySchedule = getLatestSchedule(scheduleData.filter(schedule => !schedule.deletedAt));
      
      }

      if (querySchedule) {

        let measurementsData = [];

        if (ssr) {

          measurementsData = await runWithAmplifyServerContext({
            nextServerContext: { request: ssr.req, response: ssr.res },
            operation: async (contextSpec) => {
              const { data } = await reqResBasedClient.models.Measurements.list(contextSpec, {
                entityType: "MEASUREBYAREA#" + areaId,
                entityTypeId: {
                  beginsWith: "MEASURE#"
                }
              });
              return data;
            }
          });

        } else {

          const { data, errors } = await client.models.Measurements.list();
          measurementsData = data;

        }

        // Set the measurements array
        data.measurements = measurementsData
          .filter(measure => !measure.deletedAt);

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
 * Fetch the measure entities for a given measure type, location and date for a given tenant
 * 
 * @async
 * @param {string} locId - The ID of the location for which we want to fetch measurement entities
 * @param {string} date - The date for which we want to fetch measure entities, in YYYY-MM-DD format
 * @param {string} measure - The measurement we want to fetch entities for. One of "PHI", "PS2", "PEI", "PUI", "ETR", "PAR", "SUPPLY" 
 * @param {string} tenantId - The tenant ID to indicate which customer we are querying
 * @param {AmplifyClass} [ssr] - The Amplify SSR context, if the request is being made server-side
 * @returns {Promise<(Measure[]|CSError[])>} The measurement entities or an error object,
 *  if an error was caught client-side
 * @throws The error message if an error was caught server-side
*/
export const getLocationMeasurementsDataByDateAndType = async (locId, date, measure, tenantId, ssr) => {

  /** @type {Measure[]} */
  let data = [];

  try {

    if (ssr) {

      data = await runWithAmplifyServerContext({
        nextServerContext: { request: ssr.req, response: ssr.res },
        operation: async (contextSpec) => {
          const { data } = await reqResBasedClient.models.Measurements.getMeasurementsOfTypeByLocationForDates(contextSpec, {
            gsi5Pk: "MEASUREMENTBYAREA#" + measure + "#LOC#" + locId,
            gsi5Sk: {
              beginsWith: date + "#" + locId
            }
          });
          return data;
        }
      });

    } else {

      const { data: measures, errors } = await client.models.Measurements.getMeasurementsOfTypeByLocationForDates({
        gsi5Pk: "MEASUREMENTBYAREA#" + measure + "#LOC#" + locId,
        gsi5Sk: {
          beginsWith: date + "#" + locId
        }
      });
      data = measures;

    }

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
 * Fetch the measure entities for a given measure type, location and date range for a given tenant
 * 
 * @async
 * @param {string} locId - The ID of the location for which we want to fetch measurement entities
 * @param {string} dateFrom - The date from which we want to fetch measurement entities, in YYYY-MM-DD(?THH:mm) format
 * @param {string} dateTo - The date from which we want to fetch measurement entities, in YYYY-MM-DD(?THH:mm) format
 * @param {string} measure - The measurement we want to fetch entities for. One of "PHI", "PS2", "PEI", "PUI", "ETR", "PAR", "SUPPLY"
 * @param {number} areaCount - The number of areas to fetch data for
 * @param {string} tenantId - The tenant ID to indicate which table we are querying
 * @param {AmplifyClass} [ssr] - The Amplify SSR context, if the request is being made server-side
 * @returns {Promise<(Measure[]|CSError[])>} The measurement entities or an error object,
 *  if an error was caught client-side
 * @throws The error message if an error was caught server-side
*/
export const getLocationMeasurementsDataByDatesAndType = async (locId, dateFrom, dateTo, measure, areaCount, tenantId, ssr) => {

  /** @type {Measure[]} */
  let data = [];

  try {

    if (ssr) {

      data = await runWithAmplifyServerContext({
        nextServerContext: { request: ssr.req, response: ssr.res },
        operation: async (contextSpec) => {
          const { data } = await reqResBasedClient.models.Measurements.getMeasurementsOfTypeByLocationForDates(contextSpec, {
            gsi5Pk: "MEASUREMENTBYAREA#" + measure + "#LOC#" + locId,
            gsi5Sk: {
              between: [dateFrom + "#" + locId, dateTo + "#" + locId]
            }
          });
          return data;
        }
      });

    } else {

      const { data: measures, errors } = await client.models.Measurements.getMeasurementsOfTypeByLocationForDates({
        gsi5Pk: "MEASUREMENTBYAREA#" + measure + "#LOC#" + locId,
        gsi5Sk: {
          between: [dateFrom + "#" + locId, dateTo + "#" + locId]
        }
      });
      data = measures;

    }

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
 * @returns {Promise<StorageGetUrlOutput>} The pre-signed URL of the item
 */
export const getStorageItem = async (itemKey) => {

  return getUrl({ path: itemKey });

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

      const zoneFileList = await list({ path: `areadetail/${
        scheduleId.replace("SCHEDULE#", "")
      }/${
        zone.entityTypeId.replace("ZONE#", "")
      }/`});

      if (zoneFileList.items) {

        zoneFileList.items.forEach(zoneFile => {

          if (zoneFile.path.endsWith(".jpg")) {

            promiseArray.push(getStorageItem(zoneFile.path));
            metaData[zoneFile.path] = { lastModified: zoneFile.lastModified };

          }

        });

      }
      
    }

    if (promiseArray.length) {

      const res = await Promise.all(promiseArray);
      for (let c = 0, len = res.length; c < len; c +=1) {
        
        const itemUrl = res[c].url.toString();
        const metaDataKey = Object.keys(metaData).find(datum => itemUrl.substring(datum) != -1);
        data.push({
          src: itemUrl,
          metaData: metaData[metaDataKey]
        });
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