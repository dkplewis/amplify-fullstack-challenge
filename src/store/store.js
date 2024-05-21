import { useMemo, createContext } from 'react';
import useLocalStorageState from 'use-local-storage-state';

export const StoreContext = createContext(null);

const Store = ({ children, initialData }) => {

  // Persistent state
  const [currentTopNavLocation, setCurrentTopNavLocation] = useLocalStorageState("currentTopNavLocation", {
    defaultValue: ""
  });
  const [townName, setTownName] = useLocalStorageState("townName", {
    defaultValue: ""
  });

  const store = useMemo(() => (
    { currentTopNavLocation, townName, setCurrentTopNavLocation, setTownName }
  ), [currentTopNavLocation, townName, setCurrentTopNavLocation, setTownName]);

  return <StoreContext.Provider value={store}>
    { children }
  </StoreContext.Provider>

}

export default Store;