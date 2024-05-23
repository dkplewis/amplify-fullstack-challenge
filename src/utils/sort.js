/** @module utils/sort */

/**
 * Custom types
 * @typedef {(Object)} AmplifyClass
 * @typedef {(Object)} CognitoUser
 * @typedef {(Object)} Area
 * @typedef {({isError: boolean, message: string})} CSError
 * @typedef {(Object)} Schedule
 * @typedef {({schedules: Schedule[], measures: Index[], isError: boolean, message: string})} ScheduleMeasurementsData
 * @typedef {(Object)} Index
 * @typedef {(Object)} Location
 * @typedef {({rootLocation: Location, locations: Location[], topNavLocations: Location[], isError: boolean, message: string})} LocationData
 * @typedef {({rootLocation: Location, locations: Location[], tenantData: Tenant, topNavLocations: Location[], isError: boolean, message: string})} LocationTenantData
 * @typedef {({area: Area, areas: Area[], currentLocationPath: string, rootLocation: Location, locations: Location[], tenantData: Tenant, topNavLocations: Location[], zones: Zone[], isError: boolean, message: string})} AreaLocationTenantZonesData
 * @typedef {(Object)} Tenant
 * @typedef {(Object)} Zone
 */

/**
 * Sorts two schedules by their SIZE attribute as a floating point number
 * 
 * @param {Schedule} a - The first schedule to compare 
 * @param {Schedule} b - The second schedule to compare 
 * @param {string} sortOrder - The sort order to apply. One of "asc" or "desc" 
 * @returns {number} If the sort order is "asc", 1 if a's SIZE attribute is greater than b's, 0 if they are the same
 *  and -1 if a's SIZE attribute is less than b's. If the sort order is "desc", 1 if a's SIZE attribute is less
 *  than b's, 0 if they are the same and -1 if a's SIZE attribute is greater than b's. 
 */
export const areaSort = (a, b, sortOrder) => {
  const aSize = Number.parseFloat(a.SIZE);
  const bSize = Number.parseFloat(b.SIZE);
  if (aSize < bSize) {
    return sortOrder === "asc" ? -1 : 1;
  } else if (aSize > bSize) {
    return sortOrder === "asc" ? 1 : -1;
  } else {
    return 0;
  }
};

/**
 * Sorts two zones by their zoneDimensions array attribute, ordered from left to right, top to bottom when the
 *  sort order is "asc" or ordered from bottom to top, right to left when the sort order is "desc" 
 * 
 * @param {Area} a - The first zone to compare 
 * @param {Area} b - The second zone to compare 
 * @param {string} sortOrder - The sort order to apply. One of "asc" or "desc" 
 * @returns {number} If the sort order is "asc", 1 if a's zoneDimensions attribute is greater than b's, 0 if they are the same
 *  and -1 if a's zoneDimensions attribute is less than b's. If the sort order is "desc", 1 if a's zoneDimensions attribute is less
 *  than b's, 0 if they are the same and -1 if a's zoneDimensions attribute is greater than b's. 
 */
export const zoneDimSort = (a, b, sortOrder) => {
  const aDim = (a.zoneDimensions || []).join("_");
  const bDim = (b.zoneDimensions || []).join("_");
  if (aDim < bDim) {
    return sortOrder === "asc" ? -1 : 1;
  } else if (aDim > bDim) {
    return sortOrder === "asc" ? 1 : -1;
  } else {
    return 0;
  }
};

export const getLocationHierarchy = (path, locations, tenantLocationsConfig) => {

  let locationNames = [];

  const currentLocationParts = path.split("#");

  for (let c = 2, len = currentLocationParts.length; c < len; c += 1) {
    const currentLocation = locations.find(location => location.entityTypeId == "LOCATION#" + currentLocationParts[c]);
    if (currentLocation) {
      locationNames.push(currentLocation.name.length < 5 ?
        `${tenantLocationsConfig[currentLocation.gsi2Pk.replace("TYPE#", "").toLowerCase()].searchResultLabel} ${currentLocation.name}`
      :
        currentLocation.name);
    }
  }

  return locationNames.join(" ");

};

/**
 * 
 * @param {*} a 
 * @param {*} b 
 * @param {*} sortOrder 
 * @param {*} locationData 
 * @param {*} tenantData 
 * @returns 
 */
export const hierarchySort = (a, b, sortOrder, locationData, tenantData) => {
  // Sort locations based on their location hierarchy converted into location names
  let aLocationNames = getLocationHierarchy(a.path, locationData, tenantData.config.locations);
  let bLocationNames = getLocationHierarchy(b.path, locationData, tenantData.config.locations);
  if (aLocationNames < bLocationNames) {
    return sortOrder === "asc" ? -1 : 1;
  } else if (aLocationNames > bLocationNames) {
    return sortOrder === "asc" ? 1 : -1;
  } else {
    return 0;
  }

};

/**
 * 
 * @param {*} a 
 * @param {*} b 
 * @param {*} sortOrder 
 * @returns 
 */
export const labelSort = (a, b, sortOrder) => {
  if (sortOrder == "asc") {
    return new Intl.Collator(undefined, { numeric: true }).compare(a.label, b.label);
  } else {
    return new Intl.Collator(undefined, { numeric: true }).compare(b.label, a.label);
  }
};

/**
 * 
 * @param {*} a 
 * @param {*} b 
 * @param {*} sortOrder 
 * @returns 
 */
export const nameSort = (a, b, sortOrder) => {
  if (sortOrder == "asc") {
    return new Intl.Collator(undefined, { numeric: true }).compare(a.name, b.name);
  } else {
    return new Intl.Collator(undefined, { numeric: true }).compare(b.name, a.name);
  }
};

/**
 * 
 * @param {*} a 
 * @param {*} b 
 * @param {*} sortOrder 
 * @returns 
 */
export const orderSort = (a, b, sortOrder) => {
  if (sortOrder == "asc") {
    return new Intl.Collator(undefined, { numeric: true }).compare(a.order, b.order);
  } else {
    return new Intl.Collator(undefined, { numeric: true }).compare(b.order, a.order);
  }
};

/**
 * 
 * @param {*} a 
 * @param {*} b 
 * @param {*} sortOrder 
 * @returns 
 */
export const pathSort = (a, b, sortOrder) => {
  if (a.path < b.path) {
    return sortOrder === "asc" ? -1 : 1;
  } else if (a.path > b.path) {
    return sortOrder === "asc" ? 1 : -1;
  } else {
    return 0;
  }
};

/**
 * 
 * @param {*} a 
 * @param {*} b 
 * @param {*} sortOrder 
 * @returns 
 */
export const timeSort = (a, b, sortOrder) => {
  if (a.createdAt < b.createdAt) {
    return sortOrder === "asc" ? -1 : 1;
  } else if (a.createdAt > b.createdAt) {
    return sortOrder === "asc" ? 1 : -1;
  } else {
    return 0;
  }
};

export const name = "sort";