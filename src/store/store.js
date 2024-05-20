import { useState, useEffect, useMemo, createContext } from 'react';
import useLocalStorageState from 'use-local-storage-state';

export const StoreContext = createContext(null);

const Store = ({ children, initialData }) => {

  // Transient state
  const [searchTerm, setSearchTerm] = useState("");
  const [animation, setAnimation] = useState("none");

  // Persisted state
  const [ssrData, setSSRData] = useLocalStorageState("ssrData", {
    ssr: true,
    defaultValue: {
      areas: [], 
      schedules: [], 
      indices: [],
      locations: [],
      rootLocation: {}, 
      searchResults: [],
      topNavLocations: [],
      zones: []
    }
  });
  const [ssrMgmtData, setSSRMgmtData] = useLocalStorageState("ssrMgmtData", {
    ssr: true,
    defaultValue: {
      alerts: [],
      areas: [], 
      schedules: [], 
      locations: [], 
      rootLocation: {}, 
      sensorCoverages: [],
      sensors: [],
      topNavLocations: [],
      zones: []
    }
  });
  const [currentTopNavLocation, setCurrentTopNavLocation] = useLocalStorageState("currentTopNavLocation", {
    ssr: true,
    defaultValue: ""
  });
  const [tenantsData, setTenantsData] = useLocalStorageState("tenantsData", {
    ssr: true,
    defaultValue: []
  });
  const [selectedTenant, setSelectedTenant] = useLocalStorageState("selectedTenant", {
    ssr: true,
    defaultValue: ""
  });
  const [tenantData, setTenantData] = useLocalStorageState("tenantData", {
    ssr: true,
    defaultValue: {}
  });
  const [tenantDataHash, setTenantDataHash] = useLocalStorageState("tenantDataHash", {
    ssr: true,
    defaultValue: ""
  });
  const [siteName, setSiteName] = useLocalStorageState("siteName", {
    ssr: true,
    defaultValue: ""
  });
  const [searchComplete, setSearchComplete] = useLocalStorageState("searchComplete", {
    ssr: true,
    defaultValue: false
  });

  useEffect(() => {

    if (initialData) {
      const newSSRData = {
        areas: [],
        schedules: [],
        indices: [],
        locations: [],
        rootLocation: {},
        searchResults: [] ,
        topNavLocations: [],
        zones: []
      };

      newSSRData.areas = initialData.areas && initialData.areas.length ?
        [...initialData.areas]
      : ssrData.areas?.length && !initialData.resetAreas ?
        [...ssrData.areas] 
        : 
        [];

      newSSRData.schedules = initialData.schedules && initialData.schedules.length ?
        [...initialData.schedules]
      : ssrData.schedules?.length && !initialData.resetSchedules ?
        [...ssrData.schedules] 
        : 
        [];

      newSSRData.indices = initialData.indices && initialData.indices.length ?
        [...initialData.indices]
      : ssrData.indices?.length && !initialData.resetMeasurements ?
        [...ssrData.indices] 
        : 
        [];
        
      newSSRData.locations = initialData.locations && initialData.locations.length ?
        [...initialData.locations]
      : ssrData.locations?.length && !initialData.resetLocations ?
        [...ssrData.locations] 
        : 
        [];

      newSSRData.rootLocation = initialData.rootLocation?.ENTITY_TYPE_ID ?
        {...initialData.rootLocation}
      : ssrData.rootLocation?.ENTITY_TYPE_ID && !initialData.resetRootLocation ?
        {...ssrData.rootLocation}
        : 
        {};

      newSSRData.topNavLocations = initialData.topNavLocations && initialData.topNavLocations.length ?
        [...initialData.topNavLocations]
      : ssrData.topNavLocations?.length && !initialData.resetTopLevelLocations ?
        [...ssrData.topNavLocations] 
        : 
        [];

      newSSRData.searchResults = initialData.searchResults && initialData.searchResults.length ?
        [...initialData.searchResults]
      : ssrData.searchResults?.length && !initialData.resetSearchResults ?
        [...ssrData.searchResults]
        :
        [];

      newSSRData.zones = initialData.zones && initialData.zones.length ?
        [...initialData.zones]
      : ssrData.zones?.length && !initialData.resetZones ?
        [...ssrData.zones]
        :
        [];

      setSSRData(newSSRData);
    }

  }, [initialData, setSSRData]);

  const store = useMemo(() => (
    {ssrData, ssrMgmtData, searchTerm, currentTopNavLocation, selectedTenant, tenantData, tenantDataHash, tenantsData, animation, siteName, searchComplete,
    setSSRData, setSSRMgmtData, setSearchTerm, setCurrentTopNavLocation, setSelectedTenant, setTenantData, setTenantDataHash, setTenantsData, setAnimation, setSiteName, setSearchComplete }
  ), [ssrData, ssrMgmtData, searchTerm, currentTopNavLocation, selectedTenant, tenantData, tenantDataHash, tenantsData, animation, siteName, searchComplete,
    setSSRData, setSSRMgmtData, setSearchTerm, setCurrentTopNavLocation, setSelectedTenant, setTenantData, setTenantDataHash, setTenantsData, setAnimation, setSiteName, setSearchComplete]);

  return <StoreContext.Provider value={store}>
    { children }
  </StoreContext.Provider>

}

export default Store;

