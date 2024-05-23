/** @module utils/location */

/**
 * Custom types
 * @typedef {(Object)} AmplifyClass
 * @typedef {(Object)} CognitoUser
 * @typedef {({isError: boolean, message: string})} CSError
 * @typedef {(Object)} Zone
 */

// Zones

/**
 * 
 * @param {*} area 
 * @param {*} zones 
 * @returns 
 */
export const getMeasurementsZones = (area, zones) => {

  // Input: A area and an array of zones
  // Output: An array of unique zone entityTypeIds related to the area
  // or an empty array if no area has been given or no zones have been given
  if (!area || !zones || !zones.length) return [];

  const pathParts = area.path.split("#").slice(0, -1);

  // Check for Control Area-specific Zones
  let areaZones = zones.filter(zone => !zone.deletedAt && area.path == zone.path);
  if (!areaZones.length) {

    // Check for Location-specific Zones, from deepest to shallowest
    // and return the first matching location, or the default (root location) Zones
    let pathLen = pathParts.length;
    let pathCounter = 1;
    areaZones = zones.filter(zone => !zone.deletedAt && zone.path == pathParts.join("#"));
    while (areaZones.length == 0 && pathCounter < pathLen) {

      const currPath = pathParts.slice(0, pathCounter * -1).join("#");
      areaZones = zones.filter(zone => !zone.deletedAt && zone.path == currPath);
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

  if (locations.length > 0 && locations.filter(location => location.path.split("#").slice(0, -1).join("#") == `PATH#${locationPathParts.slice(0, -1).join("#")}`).length > 1 &&
    topNavLocation != "country") {

    // Special case if the top-nav location has multiple child locations (e.g. France -> Paris & Marseille)
    navButtonPath = breadCrumbRootPath +
      topNavLocationPath + "/" +
      topNavLocation;

  }

  if (topNavLocation != "" && topNavLocation != "country") {

    // Special case if top-nav locations have been defined, where we need to add the top-nav location URL
    topNavBreadCrumb = breadCrumbRootPath + topNavLocationPath + "/" + topNavLocation;
    breadCrumbPaths.push(topNavBreadCrumb);

  }

  // Ignoring the root location and top-nav location, process each Location ID into a breadcrumb
  for (let c = 2, len = locationPathParts.length; c < len; c += 1) {

    const currLoc = locations.find(location => location.entityTypeId == "LOCATION#" + locationPathParts[c]);

    if (currLoc) {

      const currLocType = currLoc.gsi2Pk.replace("TYPE#", "").toLowerCase();
      const breadCrumb = breadCrumbRootPath + "/" + currLocType + "/" + locationPathParts[c];
      breadCrumbPaths.push(breadCrumb);

      if (c + 1 == len) {

        navButtonPath = breadCrumb;

      } else if (c + 2 == len) {

        navButtonPath = breadCrumb;

      }

    }

  }

  // Handle special case "close" button navigation
  if (isAreaDetailsView) navButtonPath = breadCrumbRootPath + "/areas";

  if (isAlertDetailsView) navButtonPath = "/alerts/" + rootLocation + "/" + topNavLocation;

  return {
    breadCrumbs: breadCrumbPaths,
    navButton: navButtonPath
  }

};

export const name = "location";