import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Alert, Collection, Flex, Loader, View } from '@aws-amplify/ui-react';
import Area from '@/components/display/Area';
import Location from '@/components/display/Location';
import Breadcrumb from '@/components/structural/Breadcrumb';
import ContentWellHeader from '@/components/structural/ContentWellHeader';

import genericStyles from '@/page-styles/Generic.module.css';
import styles from '@/component-styles/display/Locations.module.css';

const Locations = ({ scheduleData = [], locationData = [], rootLocationData, alertData = [],
  tenantData, tId, locationPath, locationType, onClickHandler, currentLocation,
  showModalHandler, currentLocations, tenantId, locationBreadCrumbPaths, townName, topNavLocationData,
  isLoadingAlertData }) => {

  useEffect(() => {

    document.body.style.cursor = "auto";

  }, []);

  const clickHandler = useCallback((evt, type, detail) => {

    const childPath = detail.entityType == "AREA" ?
      tenantData.config?.details.childPath
    : 
      tenantData.config?.locations[detail.gsi2Pk.replace("TYPE#", "").toLowerCase()].childPath;

    if (evt.button != 0) return;
    
    if (detail.entityType == "AREA") {

      showModalHandler(detail, locationData, topNavLocationData,
        currentLocation.split("__")[1], tenantData.config.town, tenantData.entityTypeId.replace("TENANT#", ""),
        tenantData.config.header, tenantData.config.enableHeatmap);

    } else {

      onClickHandler(detail.entityTypeId, tenantData.config.useAreasView ? "/areas" : childPath, false, true,
        rootLocationData.entityTypeId.replace("LOCATION#", ""), currentLocation.split("__")[1], tId);

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

  const getUnorderedCollection = useCallback((collectionItems, measures, measureType, tenantId) => {

    return <Collection type="list" role="list" className="locationCollection"
      items={collectionItems}
      direction="row"
      wrap="wrap">
      {(item) => (
          tenantData.config?.locations[locationType]?.isAreaContainer ?      
            <View key={item.entityTypeId} role="listitem"
              className={`locationCollectionTile ${styles.dAreaCollectionTile}`}>
              <Area location={currentLocations[0]} locationTypeConfig={tenantData.config.details}
                resourcesBucket={tenantData.config.resources}
                area={item} onClickHandler={clickHandler}
                viewType={measureType}
                measureValue={(measures || []).find(measure => measure.entityType == "INDEXBY" + item.entityTypeId)?.measurementAvg}
                tenantId={tenantId}
              />
            </View>
          :
          <View key={item.entityTypeId} role="listitem"
            className={`locationCollectionTile ${styles.dLocationCollectionTile}`}>
            <Location location={item}
              locationTypeConfig={tenantData.config?.locations[item.gsi2Pk.replace("TYPE#", "").toLowerCase()]}
              resourcesBucket={tenantData.config?.resources} measurements={tenantData.config?.measurements} onClickHandler={clickHandler}
              animation="immediate" tenantId={tenantId} />
          </View>
      )}
    </Collection>;

  }, [alertData, clickHandler, currentLocations, scheduleData, locationType, tenantData]);

  return isLoadingAlertData ? 
    <View className={styles.loadingContainer}>
      <Loader size="large" />
    </View>
  :
    <>
      <ContentWellHeader
        townName={townName}
      >
        <Breadcrumb viewType={tenantData.config?.useAreasView ? "locations" : "location"}
          resourcesPath={tenantData.config?.resources || "gardin"} tenantName={tenantData.name}
          label={tenantData.config?.useAreasView ? tenantData.config?.locations[locationType]?.label || "" :  tenantData.config?.locations[locationType]?.rangeLabel || ""}
          icon={tenantData.config?.locations[locationType]?.icon || ""}
          locationPath={locationPath}
          locations={locationData}
          locationConfigs={tenantData.config?.locations}
          locationBreadCrumbPaths={locationBreadCrumbPaths}
        />
      </ContentWellHeader>

      { (tenantData && currentLocations.length) ?
        <View className={`contentWellContainer ${genericStyles.contentWellContainer}`}>
          <View className="amplify-accordion">
            <View as="details" className={`amplify-accordion__item ${genericStyles.expanderItem}`} open>
              <View as="summary" className="amplify-accordion__item__trigger">
                {getLocationTitle(tenantData.config?.locations[locationType]?.rangeLabel)}
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