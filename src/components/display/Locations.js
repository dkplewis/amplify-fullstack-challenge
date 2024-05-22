import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Alert, Collection, Accordion, Flex, Loader, View } from '@aws-amplify/ui-react';
import Area from '@/components/display/Area';
import Location from '@/components/display/Location';
import Breadcrumb from '@/components/structural/Breadcrumb';
import ContentWellHeader from '@/components/structural/ContentWellHeader';
import { caDimSort } from '@/utils/sort';

import genericStyles from '@/page-styles/Generic.module.css';
import styles from '@/component-styles/display/Locations.module.css';

const Locations = ({ scheduleData = [], locationData = [], rootLocationData, alertData = [],
  tenantData, tId, locationPath, locationType, onClickHandler, currentLocation,
  showModalHandler, currentLocations, tenantId, locationBreadCrumbPaths, townName, topNavLocationData,
  isLoadingAlertData }) => {

  const [expandedSection, setExpandedSection] = useState(["itemGroup_0"]);
  const [indicesDate, setMeasurementsDate] = useState((process.env.NEXT_PUBLIC_NOW ?? new Date().toJSON()).split("T")[0]);
  const [indicesType, setMeasurementsType] = useState("SUPPLY");
  const [indices, setMeasurements] = useState({});
  const [indicesLoaded, setMeasurementsLoaded] = useState(true);
  const [historicMeasurementsLoaded, setHistoricMeasurementsLoaded] = useState(true);

  const DEFAULT_PAGE_SIZE = 24;
  const TODAY = new Date().toJSON().split("T")[0];

  useEffect(() => {

    document.body.style.cursor = "auto";

  }, []);

  const onChangeHandler = useCallback((newValue) => {

    setExpandedSection(newValue);

  }, []);

  const clickHandler = useCallback((evt, type, detail) => {

    const childPath = detail.ENTITY_TYPE == "AREA" ?
      tenantData.CONFIG?.details.childPath
    : 
      tenantData.CONFIG?.locations[detail.GSI2_PK.replace("TYPE#", "").toLowerCase()].childPath;

    if (evt.button != 0) return;
    
    if (detail.ENTITY_TYPE == "AREA") {

      showModalHandler(detail, locationData, topNavLocationData,
        currentLocation.split("__")[1], tenantData.CONFIG.town, tenantData.ENTITY_TYPE_ID.replace("TENANT#", ""),
        tenantData.CONFIG.header, tenantData.CONFIG.enableHeatmap);

    } else {

      onClickHandler(detail.ENTITY_TYPE_ID, tenantData.CONFIG.useAreasView ? "/areas" : childPath, false, true,
        rootLocationData.ENTITY_TYPE_ID.replace("LOCATION#", ""), currentLocation.split("__")[1], tId);

    }

  }, [currentLocation, locationData, onClickHandler, rootLocationData, showModalHandler, townName, tenantData, topNavLocationData, tId]);

  const getLocationTitle = useCallback((rangeLabel, start, end) => {

    return <Flex justifyContent="space-between" style={{ "padding": "0 1rem" }}>
      { rangeLabel && <View>{ rangeLabel.indexOf("{") !== -1 ?
        rangeLabel.substring(0, rangeLabel.indexOf("{")) + rangeLabel.substring(rangeLabel.indexOf("}") + 1)
      :
        rangeLabel
      }</View> }
      { start != null && end != null && <View>{(start < 10 ? "0" : "") + start + " - " + (end < 10 ? "0" : "") + end}</View> }
    </Flex>;

  }, []);

  const getUnorderedCollection = useCallback((collectionItems, indices, indexType, tenantId) => {

    return <Collection type="list" role="list" className="locationCollection"
      items={collectionItems}
      direction="row"
      wrap="wrap">
      {(item, index) => (
          tenantData.CONFIG?.locations[locationType]?.isAreaContainer ?      
            <View key={item.ENTITY_TYPE_ID} role="listitem"
              className={`locationCollectionTile ${styles.dAreaCollectionTile}`}>
              <Area location={currentLocations[0]} locationTypeConfig={tenantData.CONFIG.details}
                resourcesBucket={tenantData.CONFIG.resources}
                area={item} onClickHandler={clickHandler}
                viewType={indexType}
                indexValue={(indices || []).find(index => index.ENTITY_TYPE == "INDEXBY" + item.ENTITY_TYPE_ID)?.INDEX_AVG}
                tenantId={tenantId}
              />
            </View>
          :
          <View key={item.ENTITY_TYPE_ID} role="listitem"
            className={`locationCollectionTile ${styles.dLocationCollectionTile}`}>
            <Location location={item}
              locationTypeConfig={tenantData.CONFIG?.locations[item.GSI2_PK.replace("TYPE#", "").toLowerCase()]}
              resourcesBucket={tenantData.CONFIG?.resources} measurements={tenantData.CONFIG?.measurements} onClickHandler={clickHandler}
              animation="immediate" tenantId={tenantId} />
          </View>
      )}
    </Collection>;

  }, [alertData, clickHandler, currentLocations, scheduleData, locationType, tenantData]);

  const getOrderedCollection = useCallback((collectionItems, indices, indexType, tenantId) => {

    let collectionItemsByRow = {
      row_0: []
    };

    const maxRow = collectionItems.reduce((max, curr) => curr.CA_DIMENSIONS[1] + 1 > max ? curr.CA_DIMENSIONS[1] + 1 : max, 1);

    // Create an 8 x 8 grid of Control Areas and spacers
    for (let c = 0, len = maxRow * 8; c < len; c += 1) {

      const currTile = [c % 8, Math.floor(c / 8)];

      if (collectionItemsByRow["row_" + currTile[1]] === undefined) collectionItemsByRow["row_" + currTile[1]] = [];

      const currCollectionItem = collectionItems.find(collectionItem => collectionItem.CA_DIMENSIONS.length == currTile.length &&
        collectionItem.CA_DIMENSIONS.every(( item, idx) => item === currTile[idx]));

      collectionItemsByRow["row_" + currTile[1]].push(currCollectionItem ? currCollectionItem : { isSpacer: true });

    }

    return Object.values(collectionItemsByRow).map((items, idx) => {

      return <Collection key={"row_" + idx} type="list" role="list" className="locationCollection"
        items={items}
        direction="row"
        gap="1rem"
        wrap="wrap">
        {(item, index) => (
            item.isSpacer ? 
              <View key={"spacer_" + index} className={styles.dAreaCollectionTile}></View>
            : 
              <View key={item.ENTITY_TYPE_ID} className={`locationCollectionTile ${styles.dAreaCollectionTile}`}>
                <Area location={currentLocations[0]} locationTypeConfig={tenantData.CONFIG.details}
                  resourcesBucket={tenantData.CONFIG.resources}
                  area={item} onClickHandler={clickHandler}
                  viewType={indexType}
                  indexValue={(indices || []).find(index => index.ENTITY_TYPE == "INDEXBY" + item.ENTITY_TYPE_ID)?.INDEX_AVG}
                  tenantId={tenantId}
                />
              </View>
        )}
      </Collection>;
    
    });

  }, [alertData, clickHandler, currentLocations, scheduleData, tenantData, TODAY]);

  const getExpanderItems = useCallback((collectionItems, indicesItems, indexType, isAreaContainer, tenantId) => {

    let expanderItems = [];

    for (let c = 0, len = Math.ceil(collectionItems.length / (tenantData.CONFIG?.locations[locationType]?.resPerPage || DEFAULT_PAGE_SIZE)); c < len; c += 1) {

      const itemGroupStartIdx = c == 0 ? c : (c * (tenantData.CONFIG?.locations[locationType]?.resPerPage || DEFAULT_PAGE_SIZE)) - 1;
      const itemGroupEndIdx = (tenantData.CONFIG?.locations[locationType]?.resPerPage || DEFAULT_PAGE_SIZE) * (c + 1);

      expanderItems.push(<Accordion.Item
        key={"itemGroup_" + c}
        value={"itemGroup_" + c}
        className={genericStyles.expanderItem}
      >
        <Accordion.Trigger>
          { getLocationTitle(tenantData.CONFIG?.locations[locationType]?.rangeLabel, itemGroupStartIdx + 1,
            collectionItems.length < itemGroupEndIdx + 1 ? collectionItems.length : itemGroupEndIdx + 1) }
          <Accordion.Icon />
        </Accordion.Trigger>
        <Accordion.Content>
          { collectionItems.find(collectionItem => collectionItem.CA_DIMENSIONS) &&
            getOrderedCollection(collectionItems
              .filter(collectionItem => !collectionItem.DELETED_AT && collectionItem.CA_DIMENSIONS)
              .sort((a, b) => caDimSort(a, b, "asc")),
            indicesItems,
            indexType,
            tenantId
          ) }
          { getUnorderedCollection(collectionItems
              .filter(collectionItem => !collectionItem.DELETED_AT && !collectionItem.CA_DIMENSIONS),
            indicesItems,
            indexType,
            tenantId
          ) }
        </Accordion.Content>
      </Accordion.Item>);

    }

    return expanderItems;

  }, [getOrderedCollection, getUnorderedCollection, getLocationTitle, scheduleData, locationType, tenantData]);

  return isLoadingAlertData ? 
    <View className={styles.loadingContainer}>
      <Loader size="large" />
    </View>
  :
    <>
      <ContentWellHeader
        townName={townName}
      >
        <Breadcrumb viewType={tenantData.CONFIG?.useAreasView ? "locations" : "location"}
          resourcesPath={tenantData.CONFIG?.resources || "gardin"} tenantName={tenantData.NAME}
          label={tenantData.CONFIG?.useAreasView ? tenantData.CONFIG?.locations[locationType]?.label || "" :  tenantData.CONFIG?.locations[locationType]?.rangeLabel || ""}
          icon={tenantData.CONFIG?.locations[locationType]?.icon || ""}
          locationPath={locationPath}
          locations={locationData}
          locationConfigs={tenantData.CONFIG?.locations}
          locationBreadCrumbPaths={locationBreadCrumbPaths}
        />
      </ContentWellHeader>

      { (tenantData && currentLocations.length) ?
        <View className={`contentWellContainer ${genericStyles.contentWellContainer}`}>
          <View className="amplify-accordion">
            <View as="details" className={`amplify-accordion__item ${genericStyles.expanderItem}`} open>
              <View as="summary" className="amplify-accordion__item__trigger">
                {getLocationTitle(tenantData.CONFIG?.locations[locationType]?.rangeLabel)}
              </View>
              <View className="amplify-accordion__item__content">
                  { getUnorderedCollection(currentLocations, null, "SUPPLY", tenantId) }
              </View>
            </View>
          </View>
        </View>
      :
        <View className={styles.alertContainer}>
          <Alert variation="warning" heading="No locations found">
            There are no locations to display. Please verify the customer configuration.
          </Alert>
        </View>
      }

    </>;

}

export default Locations;

Locations.propTypes = {
  areaData: PropTypes.arrayOf(PropTypes.object),
  scheduleData: PropTypes.arrayOf(PropTypes.object),
  locationData: PropTypes.arrayOf(PropTypes.object),
  rootLocationData: PropTypes.object,
  alertData: PropTypes.arrayOf(PropTypes.object),
  tenantData: PropTypes.object,
  tId: PropTypes.string,
  locationPath: PropTypes.string,
  locationType: PropTypes.string,
  onClickHandler: PropTypes.func,
  currentLocation: PropTypes.string,
  locationParts: PropTypes.arrayOf(PropTypes.string),
  showModalHandler: PropTypes.func,
  currentLocations: PropTypes.arrayOf(PropTypes.object),
  tenantId: PropTypes.string,
  locationBreadCrumbPaths: PropTypes.arrayOf(PropTypes.string),
  animationHandler: PropTypes.func,
  townName: PropTypes.string,
  topNavLocationData: PropTypes.arrayOf(PropTypes.object),
  isLoadingAlertData: PropTypes.bool
};