import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Image } from '@aws-amplify/ui-react';
//import { getSelectorsByUserAgent } from 'react-device-detect';
import { Modal } from 'react-responsive-modal';
import { dehydrate, QueryClient, useQuery, useQueryClient } from '@tanstack/react-query'
import Areas from '@/components/display/Areas';
import DataLoadError from '@/components/display/DataLoadError';
import Loading from '@/components/display/Loading';
import Locations from '@/components/display/Locations';
import ModalContent from '@/components/display/ModalContent';
import { getScheduleData, getScheduleMeasurementsData,
  getLocationDataTenantDataAndArea, getLocationMeasurementsDataByDateAndType } from '@/utils/crud';
import { getLocationBreadcrumbs } from '@/utils/location';
import { orderSort, timeSort } from '@/utils/sort';

export const getServerSideProps = async ({ req, res, params, query }) => {

  const queryClient = new QueryClient();

  const TENANT_ID = "CHALLENGEAPP";

  /* This doesn't work yet. See:
   * https://github.com/aws-amplify/amplify-hosting/issues/2800
   * https://github.com/aws-amplify/amplify-hosting/issues/3322

  const isMobile = req.headers["user-agent"] == "Amazon CloudFront" ?
    req.headers["cloudfront-is-mobile-viewer"]
  :
    getSelectorsByUserAgent(req.headers["user-agent"])?.isMobile;
  */ 

  try {

    let returnObject = {
      props: {}
    };

    returnObject.props["tenantId"] = TENANT_ID;
  
    // For params.location, item 0 is the current root location,
    // item 1 is the current top-level location,
    // item 2 is the current location type,
    // item 3 is the current location - not supplied when viewing the All Areas page
    // item 4 is an indicator that we are viewing details from the All Areas page
    const rootLocation = params.location[0];
    const topNavLocation = params.location[1];
    const locationType = params.location[2];
    const locationId = params.location[3];
    
    returnObject.props["currentLocation"] = params.location.slice(0, 2);
    returnObject.props["locationURI"] = params.location;
    returnObject.props["locationType"] = locationType;

    if (locationType == "areas") {

      returnObject.props["isAreaView"] = true;
      returnObject.props["locId"] = locationId || "";

    }

    // Back-end data 
    let locationData = [];
    let rootLocationData = {};
    let tenantData = {};
    let topNavLocationData = [];
    let currentLocationPath = "";

    // Fetch the customer locations and configuration
    let response;
    if (locationType == "areas" && locationId) {

      // The tenant uses the Control Areas View to show Control Area Container Locations, so ignore the
      // location ID as this is used to expand the correct section on the Control Areas View page
      response = await getLocationDataTenantDataAndArea(TENANT_ID, null, null, null);

    } else {

      // We are displaying a Location, so fetch all Control Areas for the current Location path
      response = await getLocationDataTenantDataAndArea(TENANT_ID, null, locationId, null);

    }
    if (!response.isError) {

      currentLocationPath = response.currentLocationPath;
      locationData = response.locations;
      rootLocationData = response.rootLocation;
      tenantData = response.tenantData;
      topNavLocationData = response.topNavLocations;

    }

    returnObject.props["locationPath"] = currentLocationPath;
    returnObject.props["fetchLocationMeasurements"] = (locationType == "areas" ||
      tenantData.CONFIG?.locations[locationType]?.isAreaContainer) && !!locationId;
 
    /* currrentSite = if there is more than one immediate child location for the current top nav location, return the immediate child location of the current top nav location
        where the current location's PATH starts with the child location's PATH, OR
      if there is more than one immediate child location for the current top nav location, return the immediate child location where the entity ID is the entity ID given in the URL, OR
      if there is more than one immediate child location for the current top nav location, return the top nav location where the entity ID is the entity ID given in the URL, OR
      return the immediate child location where the entity ID is the entity ID given in the URL, OR
      return the default immediate child location, OR
      return the top nav location where the entity ID is the entity ID given in the URL, OR
      return the root location, OR
      return null
    */
    const topNavLocationPath = topNavLocationData.find(location => location.ENTITY_TYPE_ID == `LOCATION#${topNavLocation}`)?.PATH || "";
    const topNavLocationPathLen = topNavLocationPath ? topNavLocationPath.split("#").length : 0;
    const childLocationsForTopNavLocation = locationData.filter((location) => location.PATH.startsWith(topNavLocationPath + "#") && location.PATH.split("#").length == topNavLocationPathLen + 1);

    let currentSite = null;
    if (childLocationsForTopNavLocation.length) {

      currentSite = childLocationsForTopNavLocation.find(location => childLocationsForTopNavLocation.length > 1 && currentLocationPath.startsWith(location.PATH + "#"))
       || childLocationsForTopNavLocation.find(location => childLocationsForTopNavLocation.length > 1 && location.ENTITY_TYPE_ID == `LOCATION#${locationId}`)
       || topNavLocationData.find(location => location.ENTITY_TYPE_ID == `LOCATION#${topNavLocation}`) 
       || childLocationsForTopNavLocation.find(location => location.ENTITY_TYPE_ID == `LOCATION#${locationId}`)
       || childLocationsForTopNavLocation.find(location => location.DEFAULT_LOCATION);

    }
    if (!currentSite) {

      currentSite = topNavLocationData.find(location => location.ENTITY_TYPE_ID == `LOCATION#${topNavLocation}`)
       || rootLocationData;
       
    }

    returnObject.props["currentSiteName"] = currentSite ? currentSite.NAME : null;

    const breadCrumbData = getLocationBreadcrumbs(
      "/installation/",
      currentLocationPath?.replace("PATH#", "").split("#") || [],
      false,
      false,
      rootLocation,
      topNavLocation,
      locationData,
      null,
      tenantData.CONFIG?.header[topNavLocationData.find(location => location.ENTITY_TYPE_ID == `LOCATION#${topNavLocation}`)?.LOCATION_HEADER_KEY || "NONE"]?.childPath || ""
    );

    returnObject.props["locationBreadCrumbPaths"] = breadCrumbData.breadCrumbs;
    returnObject.props["locationNavButtonPath"] = breadCrumbData.navButton;

    await queryClient.prefetchQuery({
      queryKey: ["locationTenantAndAreas", TENANT_ID, "locations"],
      queryFn: ({ queryKey }) => getLocationDataTenantDataAndArea(queryKey[1])
    });

    await queryClient.prefetchQuery({
      queryKey: ["schedules", TENANT_ID],
      queryFn: ({ queryKey }) => getScheduleData(queryKey[1])
    });

    await queryClient.prefetchQuery({
      queryKey: ["locationMeasurementsByDateAndType", TENANT_ID, locationId || "", new Date().toJSON().split("T")[0], "QE"],
      queryFn: ({ queryKey }) => getLocationMeasurementsDataByDateAndType(queryKey[2], queryKey[3], queryKey[4], queryKey[1])
    });

    await queryClient.prefetchQuery({
      queryKey: ["areaScheduleMeasurements", TENANT_ID, locationId || "", "locations"] || null,
      queryFn: ({ queryKey }) => getScheduleMeasurementsData(queryKey[2], queryKey[1])
    });

    returnObject.props["dehydratedState"] = dehydrate(queryClient);

    return returnObject;

  } catch (err) {

    if (typeof err == "string" && err.indexOf("not authenticated") !== -1) {

      return {
        redirect: {
          destination: "/",
          permanent: false,
        },
      }

    }

    return {
      props: {
        errorCode: 500,
        errorMessage: (err.message.indexOf("401") != -1 ? 
          "The app isn't allowed to use the data API right now."
        :
          err.message)
      }
    };

  }

}

const Installation = ({ tenantId, locId, fetchLocationMeasurements, currentSiteName, isAreaView,
  locationBreadCrumbPaths, locationNavButtonPath, locationPath, locationType, locationURI }) => {

  const [showModal, setShowModal] = useState("");
  const [modalData, setModalData] = useState({
    area: null,
    areas: [],
    schedule: null,
    measurements: [],
    locationBreadCrumbPaths: [],
    locations: [],
    rootLocation: null,
    tenantData: null,
    zones: []
  });
  const [period, setPeriod] = useState(null);
  const [timeUnit, setTimeUnit] = useState("hours");
  const [dateRange, setDateRange] = useState([null, null]);
  const [availableMeasurements, setAvailableMeasurements] = useState(null);
  const [show, setShow] = useState(null);
  const [areaId, setCAId] = useState(locationType === "details" ? locId : null);
  
  const router = useRouter();

  const modalRef = useRef(null);

  const queryClient = useQueryClient();

  const { isPending: isPendingPageData, isError: isErrorPageData, isSuccess: isSuccessPageData,
    data: pageData, error: pageError } = useQuery({
    queryKey: ["locationTenantAndAreas", tenantId, "locations"],
    queryFn: ({ queryKey }) => getLocationDataTenantDataAndArea(queryKey[1], null)
  });

  const { isPending: isPendingScheduleData, isError: isErrorScheduleData, isSuccess: isSuccessScheduleData,
    data: scheduleData, error: scheduleError } = useQuery({
    queryKey: ["schedules", tenantId],
    queryFn: ({ queryKey }) => getScheduleData(queryKey[1]),
    enabled: (locationType !== "details" && !fetchLocationMeasurements)
  });

  const { isPending: isPendingLocationMeasurementsData, isError: isErrorLocationMeasurementsData, isSuccess: isSuccessLocationMeasurementsData,
    data: locationMeasurementsData, error: locationMeasurementsError } = useQuery({
    queryKey: ["locationMeasurementsByDateAndType", tenantId, locId, new Date().toJSON().split("T")[0], "QE"],
    queryFn: ({ queryKey }) => getLocationMeasurementsDataByDateAndType(queryKey[2], queryKey[3], queryKey[4], queryKey[1]),
    enabled: (locationType !== "details" && fetchLocationMeasurements),
    refetchInterval: 20000
  });

  const { isPending: isPendingAreaMeasurementsData, isError: isErrorAreaMeasurementsData, isSuccess: isSuccessAreaMeasurementsData,
    data: areaMeasurementsData, error: areaMeasurementsError } = useQuery({
    queryKey: ["areaScheduleMeasurements", tenantId, areaId, "locations"],
    queryFn: ({ queryKey }) => getScheduleMeasurementsData(queryKey[2], queryKey[1]),
    enabled: areaId !== null,
    refetchInterval: 20000
  });

  useEffect(() => {

    if (isPendingPageData) document.body.style.cursor = "wait";
    if (isErrorPageData) console.error(pageError);
    if (isSuccessPageData) document.body.style.cursor = "auto";

  }, [isSuccessPageData, isPendingPageData, isErrorPageData, pageError]);

  useEffect(() => {

    if (!areaMeasurementsData || !pageData) return;

    const area = pageData.areas.find(area => area.ENTITY_TYPE_ID == "AREA#" + areaId);

    if (area) {

      const urlPath = router.asPath;

      // As the current location breadcrumb paths array is for the location,
      // get the correct arry for the Details View being displayed in the modal
      const areaBreadCrumbPaths = getLocationBreadcrumbs(
        "/installation/",
        area.PATH.replace("PATH#", "").split("#"),
        true,
        false,
        urlPath.split("/")[2],
        pageData.topNavLocations,
        pageData.locations,
        tenantId,
        pageData.tenantData.CONFIG?.header[pageData.topNavLocations.find(location => location.ENTITY_TYPE_ID == `LOCATION#${currentTopNavLocation}`)?.LOCATION_HEADER_KEY || "NONE"]?.childPath || ""
      );

      setModalData({
        area: area,
        areas: pageData.areas,
        schedule: areaMeasurementsData.schedules[0] || null,
        measurements: areaMeasurementsData.measurements,
        locationBreadCrumbPaths: areaBreadCrumbPaths.breadCrumbs,
        locations: pageData.locations,
        rootLocation: pageData.rootLocation,
        tenantData: pageData.tenantData,
        zones: pageData.zones
      });

    }

  }, [areaMeasurementsData, currentTopNavLocation, router, pageData, tenantId]);

  const defaultPeriod = useMemo(() => Number.parseInt(pageData.tenantData.CONFIG.details.trendlinePeriod, 10) || 48, [pageData.tenantData]);

  const defaultAvailableMeasurements = useMemo(() => {

    let result = {};
    if (pageData.tenantData?.CONFIG?.measurements) {

      const enabledMeasurements = Object.keys(pageData.tenantData.CONFIG.measurements || {})
        .filter((key) => pageData.tenantData.CONFIG.measurements[key].enabled);
      for (let c = 0, len = enabledMeasurements.length; c < len; c += 1) {
        
        result[enabledMeasurements[c]] = {
          ...pageData.tenantData.CONFIG.measurements[enabledMeasurements[c]],
          enabled: pageData.tenantData.CONFIG.measurements[enabledMeasurements[c]].enabled
        };

      }

    }

    return result;

  }, [pageData.tenantData]);

  const defaultShow = useMemo(() => {

    const enabledMeasurements = Object.keys(pageData.tenantData.CONFIG.measurements || {})
        .filter((key) => pageData.tenantData.CONFIG.measurements[key].enabled);
    return enabledMeasurements
      .sort((a, b) => orderSort(pageData.tenantData.CONFIG.measurements[a], pageData.tenantData.CONFIG.measurements[b], "asc"))

  }, [pageData.tenantData]);

  useEffect(() => {

    if (dateRange[0] && dateRange[1] && dateRange[1].getTime() >= dateRange[0].getTime()) {

      const threshold = Number.parseInt(pageData.tenantData.CONFIG.defaultHourlyDailyDataThreshold, 10) || 72;
      const [from, to] = dateRange;

      // from and to dates are set to midnight (as we don't ask for a time)
      const now = (process.env.NEXT_PUBLIC_NOW ? new Date(process.env.NEXT_PUBLIC_NOW) : new Date());
      const nowMidnight = (process.env.NEXT_PUBLIC_NOW ? new Date(process.env.NEXT_PUBLIC_NOW) : new Date()).setUTCHours(0, 0 ,0, 0);
      const toDate = to.toJSON().split("T")[0];
      const nowDate = now.toJSON().split("T")[0];
      let hoursToday = Math.floor((now.getTime() - nowMidnight) / 1000 / 60 / 60);
      let period = Math.round((to.getTime() - from.getTime()) / 1000 / 60 / 60);
      // If the period is 0, then the from date and to date are both today
      // In this situation, set the period to the number of hours so far today
      // If the period is less than or equal to the threshold, then pad with today's hours plus 1 hour
      period = nowDate == toDate && period == 0 ?
        hoursToday + 1
      : nowDate != toDate && period < threshold ?
        period + 24
      : nowDate != toDate && period == threshold ?
        period + hoursToday
      : period <= threshold ? 
        period + hoursToday + 1
      :
        period;

      setPeriod(period);

    }

  }, [dateRange, pageData.tenantData, setPeriod]);

  const handleClick = useCallback((locationId, locationSubPath, isAreaView, doNavigation,
    rootLocationId, currentTopNavLocation, tId) => {

    // e.g. abcde12345/towers/001, abcde12345/towers/001/trays/044
    let newRoute = `/installation/${rootLocationId}/${currentTopNavLocation}${
      (locationSubPath.startsWith("/") ?
        locationSubPath
      :
        "/" + locationSubPath)}/${locationId.replace("LOCATION#", "").replace("AREA#", "")}${
        isAreaView ? "/caview" : ""}${tId ? "?tId=" + tId : ""}`;

    if (doNavigation) {

      // This request is to perform the navigation we have pre-fetched
      document.body.style.cursor = "wait";
      router.push(newRoute);

    } else {

      // This request is to pre-fetch the requested page, which the user may cancel
      router.prefetch(newRoute);

    }

  }, [router]);

  const doShowModal = useCallback((area) => {

    if (area) {

      // Update from the back-end
      setShowModal(area.ENTITY_TYPE_ID);
      setCAId(area.ENTITY_TYPE_ID.replace("AREA#", ""));

    } else {

      setShowModal("");
      setCAId(null);
      setModalData({
        area: null,
        areas: [],
        schedule: null,
        measurements: [],
        locationBreadCrumbPaths: [],
        locations: [],
        rootLocation: null,
        tenantData: null,
        zones: []
      });

    }

  }, []);

  const doClearAlertNotification = useCallback((alertId) => {

    let newAlertNotifications = [...alertNotifications];
    const alertNotificationIdx = newAlertNotifications.findIndex(alertNotification => alertNotification.ENTITY_TYPE_ID == alertId);
    if (alertNotificationIdx != -1) {

      newAlertNotifications.splice(alertNotificationIdx, 1);

    }

    if (!newAlertNotifications.length) {
      
      setShowAlert(false);

      setTimeout(() => {

        setAlertNotifications(newAlertNotifications);

      }, 1100);

    } else {

      setAlertNotifications(newAlertNotifications);

    }

  }, [alertNotifications]);

  if (isPendingPageData || (locationType === "details" && isPendingAreaMeasurementsData) ||
  (locationType === "areas" && locId && isPendingLocationMeasurementsData) ||
  (locationType !== "details" && ((locationType === "areas" && !locId) ||
    locationType !== "areas") && isPendingScheduleData)) return <Loading />;

  if (isErrorPageData || (locationType === "details" && isErrorAreaMeasurementsData) ||
    (locationType === "areas" && locId && isErrorLocationMeasurementsData) ||
    (locationType !== "details" && ((locationType === "areas" && !locId) || locationType !== "areas") && isErrorScheduleData)) {

    return <DataLoadError dataLoadError={pageError ?
      pageError.message
    : scheduleError ?
      scheduleError.message
    : locationMeasurementsError ?
      locationMeasurementsError.message
    :
      areaMeasurementsError.message
    } />;
    
  }

  return isAreaView ?
    <>
      <Head>
        <title>Gardin - {pageData.tenantData.CONFIG.areas.allAreasLabel} View</title>
      </Head>

      <Modal ref={modalRef} initialFocusRef={modalRef} center open={!!showModal} onClose={() => {
        doShowModal("");
        setCAId(null);
        setModalData({
          area: null,
          areas: [],
          schedule: null,
          measurements: [],
          locationBreadCrumbPaths: [],
          locations: [],
          rootLocation: null,
          tenantData: null,
          zones: []
        });
      }} closeIcon={<Image src="/images/close.svg" alt="Close" />}
        classNames={{ modal: "modal-details-view" + (pageData.tenantData?.CONFIG?.details?.detailsView == "indeximage" ? " view-wide" : "") }}>
        <ModalContent areaData={modalData.area} areasData={modalData.areas}
          scheduleData={modalData.schedule} zoneData={modalData.zones} locationPath={locationPath}
          alertData={alertQueries.isPending || alertQueries.isError ? []:
            alertQueries.data
              .filter(alert => alert.GSI3_PK == "AREA#" + areaId)
              .sort((a, b) => timeSort(a, b, "asc"))
          }
          measurementsData={modalData.measurements} locationData={modalData.locations} tenantData={modalData.tenantData}
          period={period || defaultPeriod} setPeriodHandler={setPeriod}
          timeUnit={timeUnit} setTimeUnitHandler={setTimeUnit} dateRange={dateRange} setDateRangeHandler={setDateRange}
          availableMeasurements={availableMeasurements || defaultAvailableMeasurements} setAvailableMeasurementsHandler={setAvailableMeasurements}
          show={show || defaultShow} setShowHandler={setShow}
          locationParts={locationURI} animationHandler={() => {}}
          locationBreadCrumbPaths={modalData.locationBreadCrumbPaths} currentTopNavLocation={currentTopNavLocation} currentLocation={locationURI[0] + "__" + locationURI[1]}
          tenantId={tenantId} locationNavButtonPath={locationNavButtonPath} rootLocationData={modalData.rootLocation} />
      </Modal>

      <Areas areaData={pageData.areas} scheduleData={scheduleData} topNavLocationData={pageData.topNavLocations}
        rootLocationData={pageData.rootLocation} tenantData={pageData.tenantData}
        locationData={pageData.locations}
        alertData={alertQueries.isPending || alertQueries.isError ? []:
          alertQueries.data
            .sort((a, b) => timeSort(a, b, "asc"))
        }
        selectedLocationId={locId} locationPath={locationPath}
        animationHandler={setAnimation} tenantId={tenantId} tId={tId} currentLocation={locationURI[0] + "__" + locationURI[1]}
        onClickHandler={handleClick} siteName={currentSiteName} showModalHandler={doShowModal}
      />
    </>
  :
    <>
      <Head>
        <title>Gardin - Installation View</title>
      </Head>

      <Locations locationData={pageData.locations} rootLocationData={pageData.rootLocation} topNavLocationData={pageData.topNavLocations}
        areaData={pageData.areas.filter(area => area.PATH.startsWith(locationPath))}
        isLoadingAlertData={alertQueries.isPending}
        scheduleData={scheduleData} siteName={currentSiteName} tId={tId}
        alertData={alertQueries.isPending || alertQueries.isError ? []:
          alertQueries.data
            .sort((a, b) => timeSort(a, b, "asc"))
        }
        tenantId={tId ? tId : "GTDEMOAPP"}
        currentLocations={pageData.locations.filter(location => location.PATH.startsWith(locationPath + "#")).length == 0 ?
          pageData.locations.filter(location => location.PATH.startsWith(locationPath))
        :
          pageData.locations.filter(location => location.PATH.startsWith(locationPath + "#") && location.PATH.split("#").length - 1 === locationPath.split("#").length)
        }
        tenantData={pageData.tenantData} locationType={locationType} locationPath={locationPath} showModalHandler={doShowModal}
        currentLocation={locationURI[0] + "__" + locationURI[1]} onClickHandler={handleClick} animationHandler={setAnimation}
        locationParts={locationURI} locationBreadCrumbPaths={locationBreadCrumbPaths} />
    </>;

}

export default Installation;