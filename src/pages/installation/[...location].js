import { useState, useEffect, useContext, useMemo, useRef, useCallback } from 'react';
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
import { StoreContext } from '@/store/store';
import { getScheduleData, getScheduleMeasurementsData, getLocationDataTenantDataAndArea } from '@/utils/crud';
import { getLocationBreadcrumbs } from '@/utils/location';
import { orderSort } from '@/utils/sort';

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
      response = await getLocationDataTenantDataAndArea(TENANT_ID);

    } else {

      // We are displaying a Location, so fetch all Control Areas for the current Location path
      response = await getLocationDataTenantDataAndArea(TENANT_ID, locationId);

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
      tenantData.config?.locations[locationType]?.isAreaContainer) && !!locationId;
 
    /* currrentTown = if there is more than one immediate child location for the current top nav location, return the immediate child location of the current top nav location
        where the current location's path starts with the child location's path, OR
      if there is more than one immediate child location for the current top nav location, return the immediate child location where the entity ID is the entity ID given in the URL, OR
      if there is more than one immediate child location for the current top nav location, return the top nav location where the entity ID is the entity ID given in the URL, OR
      return the immediate child location where the entity ID is the entity ID given in the URL, OR
      return the default immediate child location, OR
      return the top nav location where the entity ID is the entity ID given in the URL, OR
      return the root location, OR
      return null
    */
    const topNavLocationPath = topNavLocationData.find(location => location.entityTypeId == `LOCATION#${topNavLocation}`)?.path || "";
    const topNavLocationPathLen = topNavLocationPath ? topNavLocationPath.split("#").length : 0;
    const childLocationsForTopNavLocation = locationData.filter((location) => location.path.startsWith(topNavLocationPath + "#") && location.path.split("#").length == topNavLocationPathLen + 1);

    let currentTown = null;
    if (childLocationsForTopNavLocation.length) {

      currentTown = childLocationsForTopNavLocation.find(location => childLocationsForTopNavLocation.length > 1 && currentLocationPath.startsWith(location.path + "#"))
       || childLocationsForTopNavLocation.find(location => childLocationsForTopNavLocation.length > 1 && location.entityTypeId == `LOCATION#${locationId}`)
       || topNavLocationData.find(location => location.entityTypeId == `LOCATION#${topNavLocation}`) 
       || childLocationsForTopNavLocation.find(location => location.entityTypeId == `LOCATION#${locationId}`)
       || childLocationsForTopNavLocation.find(location => location.defaultLocation);

    }
    if (!currentTown) {

      currentTown = topNavLocationData.find(location => location.entityTypeId == `LOCATION#${topNavLocation}`)
       || rootLocationData;
       
    }

    returnObject.props["currentTownName"] = currentTown ? currentTown.name : null;

    const breadCrumbData = getLocationBreadcrumbs(
      "/installation/",
      currentLocationPath?.replace("PATH#", "").split("#") || [],
      false,
      rootLocation,
      topNavLocation,
      locationData,
      tenantData.config?.header[topNavLocationData.find(location => location.entityTypeId == `LOCATION#${topNavLocation}`)?.locationHeaderKey || "NONE"]?.childPath || ""
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
      queryKey: ["areaScheduleMeasurements", TENANT_ID, locationId || "", "locations"] || null,
      queryFn: ({ queryKey }) => getScheduleMeasurementsData(queryKey[2], queryKey[1], { req, res }),
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

const Installation = ({ tenantId, locId, fetchLocationMeasurements, currentTownName, isAreaView,
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
  const [areaId, setCAId] = useState(null);
  
  const router = useRouter();

  const { currentTopNavLocation } = useContext(StoreContext);

  const modalRef = useRef(null);

  const queryClient = useQueryClient();

  const { isPending: isPendingPageData, isError: isErrorPageData, isSuccess: isSuccessPageData,
    data: pageData, error: pageError } = useQuery({
    queryKey: ["locationTenantAndAreas", tenantId, "locations"],
    queryFn: ({ queryKey }) => getLocationDataTenantDataAndArea(queryKey[1])
  });

  const { isPending: isPendingScheduleData, isError: isErrorScheduleData, isSuccess: isSuccessScheduleData,
    data: scheduleData, error: scheduleError } = useQuery({
    queryKey: ["schedules", tenantId],
    queryFn: ({ queryKey }) => getScheduleData(queryKey[1]),
    enabled: (locationType !== "details" && !fetchLocationMeasurements)
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

    const area = pageData.areas.find(area => area.entityTypeId == "AREA#" + areaId);

    if (area) {

      const urlPath = router.asPath;

      // As the current location breadcrumb paths array is for the location,
      // get the correct arry for the Details View being displayed in the modal
      const areaBreadCrumbPaths = getLocationBreadcrumbs(
        "/installation/",
        area.path.replace("PATH#", "").split("#"),
        true,
        urlPath.split("/")[2],
        pageData.topNavLocations,
        pageData.locations,
        pageData.tenantData.config?.header[pageData.topNavLocations.find(location => location.entityTypeId == `LOCATION#${currentTopNavLocation}`)?.locationHeaderKey || "NONE"]?.childPath || ""
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

  const defaultPeriod = useMemo(() => Number.parseInt(pageData.tenantData.config.details.trendlinePeriod, 10) || 48, [pageData.tenantData]);

  const defaultAvailableMeasurements = useMemo(() => {

    let result = {};
    if (pageData.tenantData?.config?.measurements) {

      const enabledMeasurements = Object.keys(pageData.tenantData.config.measurements || {})
        .filter((key) => pageData.tenantData.config.measurements[key].enabled);
      for (let c = 0, len = enabledMeasurements.length; c < len; c += 1) {
        
        result[enabledMeasurements[c]] = {
          ...pageData.tenantData.config.measurements[enabledMeasurements[c]],
          enabled: pageData.tenantData.config.measurements[enabledMeasurements[c]].enabled
        };

      }

    }

    return result;

  }, [pageData.tenantData]);

  const defaultShow = useMemo(() => {

    const enabledMeasurements = Object.keys(pageData.tenantData.config.measurements || {})
        .filter((key) => pageData.tenantData.config.measurements[key].enabled);
    return enabledMeasurements
      .sort((a, b) => orderSort(pageData.tenantData.config.measurements[a], pageData.tenantData.config.measurements[b], "asc"))

  }, [pageData.tenantData]);

  useEffect(() => {

    if (dateRange[0] && dateRange[1] && dateRange[1].getTime() >= dateRange[0].getTime()) {

      const threshold = Number.parseInt(pageData.tenantData.config.defaultHourlyDailyDataThreshold, 10) || 72;
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
        "/" + locationSubPath)}/${locationId.replace("LOCATION#", "").replace("AREA#", "")}`;

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
      setShowModal(area.entityTypeId);
      setCAId(area.entityTypeId.replace("AREA#", ""));

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

  if (isPendingPageData || (locationType === "details" && isPendingAreaMeasurementsData) ||
  (locationType !== "details" && ((locationType === "areas" && !locId) ||
    locationType !== "areas") && isPendingScheduleData)) return <Loading />;

  if (isErrorPageData || (locationType === "details" && isErrorAreaMeasurementsData) ||
    (locationType !== "details" && ((locationType === "areas" && !locId) || locationType !== "areas") && isErrorScheduleData)) {

    return <DataLoadError dataLoadError={pageError ?
      pageError.message
    : scheduleError ?
      scheduleError.message
    :
      areaMeasurementsError.message
    } />;
    
  }

  return isAreaView ?
    <>
      <Head>
        <title>{pageData.tenantData.config.areas.allAreasLabel} View | Dev Community Amplify Fullstack TypeScript Challenge Project</title>
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
        classNames={{ modal: "modal-details-view" + (pageData.tenantData?.config?.details?.detailsView == "measureimage" ? " view-wide" : "") }}>
        <ModalContent areaData={modalData.area} areasData={modalData.areas}
          scheduleData={modalData.schedule} zoneData={modalData.zones} locationPath={locationPath}
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
        selectedLocationId={locId} locationPath={locationPath}
        tenantId={tenantId} currentLocation={locationURI[0] + "__" + locationURI[1]}
        onClickHandler={handleClick} townName={currentTownName} showModalHandler={doShowModal}
      />
    </>
  :
    <>
      <Head>
        <title>Town View | Dev Community Amplify Fullstack TypeScript Challenge Project</title>
      </Head>

      <Locations locationData={pageData.locations} rootLocationData={pageData.rootLocation} topNavLocationData={pageData.topNavLocations}
        areaData={pageData.areas.filter(area => area.path.startsWith(locationPath))}
        scheduleData={scheduleData} townName={currentTownName}
        tenantId={tenantId}
        currentLocations={pageData.locations.filter(location => location.path.startsWith(locationPath + "#")).length == 0 ?
          pageData.locations.filter(location => location.path.startsWith(locationPath))
        :
          pageData.locations.filter(location => location.path.startsWith(locationPath + "#") && location.path.split("#").length - 1 === locationPath.split("#").length + 1)
        }
        tenantData={pageData.tenantData} locationType={locationType} locationPath={locationPath} showModalHandler={doShowModal}
        currentLocation={locationURI[0] + "__" + locationURI[1]} onClickHandler={handleClick}
        locationParts={locationURI} locationBreadCrumbPaths={locationBreadCrumbPaths} />
    </>;

}

export default Installation;