import { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Alert, Collection, Expander, ExpanderItem, Flex, Heading, Image, Loader, Text, View } from '@aws-amplify/ui-react';
//import { isMobile } from 'react-device-detect';
import Area from '@/components/display/Area';
import Location from '@/components/display/Location';
import Breadcrumb from '@/components/structural/Breadcrumb';
import ContentWellHeader from '@/components/structural/ContentWellHeader';
import GrowthCycleProgress from '@/components/widgets/GrowthCycleProgress';
import IndexLegend from '@/components/widgets/IndexLegend';
import MeasurementType from '@/components/widgets/MeasurementType';
import { getActiveSchedule, getActiveScheduleStartAndEndDay, getCycleDurationInDays, isScheduleComplete } from '@/utils/datetime';
import { caDimSort } from '@/utils/sort';

import genericStyles from '@/page-styles/Generic.module.css';
import styles from '@/component-styles/display/Locations.module.css';

const Locations = ({ areaData = [], scheduleData = [], locationData = [], rootLocationData, alertData = [],
  tenantData, tId, locationPath, locationType, onClickHandler, currentLocation, locationParts,
  showModalHandler, currentLocations, tenantId, locationBreadCrumbPaths, animationHandler, siteName, topNavLocationData,
  isLoadingAlertData }) => {

  const isMobile = false;

  const [expandedSection, setExpandedSection] = useState("itemGroup_0");
  const [indicesDate, setMeasurementsDate] = useState((process.env.NEXT_PUBLIC_NOW ?? new Date().toJSON()).split("T")[0]);
  const [indicesType, setMeasurementsType] = useState("QE");
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
        currentLocation.split("__")[1], tenantData.CONFIG.site, tenantData.ENTITY_TYPE_ID.replace("TENANT#", ""),
        tenantData.CONFIG.header, tenantData.CONFIG.enableHeatmap);

    } else {

      onClickHandler(detail.ENTITY_TYPE_ID, tenantData.CONFIG.useAreasView ? "/areas" : childPath, false, true,
        rootLocationData.ENTITY_TYPE_ID.replace("LOCATION#", ""), currentLocation.split("__")[1], tId);

    }

  }, [currentLocation, locationData, onClickHandler, rootLocationData, showModalHandler, siteName, tenantData, topNavLocationData, tId]);

  const getLocationTitle = useCallback((rangeLabel, start, end) => {

    return <Flex justifyContent="space-between">
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
      gap="0"
      wrap="wrap">
      {(item, index) => (
          tenantData.CONFIG?.locations[locationType]?.isAreaContainer ?      
            <View key={item.ENTITY_TYPE_ID} role="listitem"
              className={`locationCollectionTile ${styles.dAreaCollectionTile}`}>
              <Area isMobile={isMobile} location={currentLocations[0]} locationTypeConfig={tenantData.CONFIG.details}
                resourcesBucket={tenantData.CONFIG.resources} alertTypeConfig={tenantData.CONFIG.alerts.alertTypes}
                showAlertDuration={tenantData.CONFIG.details.showAlertDuration}
                showLatestAlertOnly={tenantData.CONFIG.details.showLatestAlertOnly}
                area={item} onClickHandler={clickHandler}
                schedules={scheduleData.filter(schedule => schedule.GSI3_PK == item.ENTITY_TYPE_ID)}
                alerts={alertData.filter(alert => alert.GSI3_PK == item.ENTITY_TYPE_ID)}
                variant="tile" animation="immediate"
                isHeatmapEnabled={tenantData.CONFIG.enableHeatmap} viewType={indexType}
                indexValue={(indices || []).find(index => index.ENTITY_TYPE == "INDEXBY" + item.ENTITY_TYPE_ID)?.INDEX_AVG}
                puiMaxValue={tenantData.CONFIG.measurements.PUI.maxValue || 30}
                tenantId={tenantId}
              />
            </View>
          :
          <View key={item.ENTITY_TYPE_ID} role="listitem"
            className={`locationCollectionTile ${styles.dLocationCollectionTile}`}>
            <Location isMobile={isMobile} location={item} alerts={alertData}
              locationTypeConfig={tenantData.CONFIG?.locations[item.GSI2_PK.replace("TYPE#", "").toLowerCase()]}
              resourcesBucket={tenantData.CONFIG?.resources} measurements={tenantData.CONFIG?.measurements} onClickHandler={clickHandler}
              variant="tile" animation="immediate" tenantId={tenantId} />
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
        gap="0"
        wrap="wrap">
        {(item, index) => (
            item.isSpacer ? 
              <View key={"spacer_" + index} className={styles.dAreaCollectionTile}></View>
            : 
              <View key={item.ENTITY_TYPE_ID} className={`locationCollectionTile ${styles.dAreaCollectionTile}`}>
                <Area isMobile={isMobile} location={currentLocations[0]} locationTypeConfig={tenantData.CONFIG.details}
                  resourcesBucket={tenantData.CONFIG.resources} alertTypeConfig={tenantData.CONFIG.alerts.alertTypes}
                  showAlertDuration={tenantData.CONFIG.details.showAlertDuration}
                  showLatestAlertOnly={tenantData.CONFIG.details.showLatestAlertOnly}
                  area={item} onClickHandler={clickHandler}
                  schedules={scheduleData.filter(schedule => schedule.GSI3_PK == item.ENTITY_TYPE_ID)}
                  alerts={alertData.filter(alert => alert.GSI3_PK == item.ENTITY_TYPE_ID)}
                  variant="tile" animation="immediate"
                  isHeatmapEnabled={tenantData.CONFIG.enableHeatmap} viewType={indexType}
                  indexValue={(indices || []).find(index => index.ENTITY_TYPE == "INDEXBY" + item.ENTITY_TYPE_ID)?.INDEX_AVG}
                  puiMaxValue={tenantData.CONFIG.measurements.PUI.maxValue || 30}
                  tenantId={tenantId}
                />
              </View>
        )}
      </Collection>;
    
    });

  }, [alertData, clickHandler, currentLocations, scheduleData, tenantData, TODAY]);

  const getExpanderItems = useCallback((collectionItems, alertItems, indicesItems, indexType, isAreaContainer, tenantId) => {

    let expanderItems = [];

    for (let c = 0, len = Math.ceil(collectionItems.length / (tenantData.CONFIG?.locations[locationType]?.resPerPage || DEFAULT_PAGE_SIZE)); c < len; c += 1) {

      const itemGroupStartIdx = c == 0 ? c : (c * (tenantData.CONFIG?.locations[locationType]?.resPerPage || DEFAULT_PAGE_SIZE)) - 1;
      const itemGroupEndIdx = (tenantData.CONFIG?.locations[locationType]?.resPerPage || DEFAULT_PAGE_SIZE) * (c + 1);

      expanderItems.push(<ExpanderItem
        key={"itemGroup_" + c}
        title={getLocationTitle(tenantData.CONFIG?.locations[locationType]?.rangeLabel, itemGroupStartIdx + 1,
          collectionItems.length < itemGroupEndIdx + 1 ? collectionItems.length : itemGroupEndIdx + 1)
        }
        value={"itemGroup_" + c}
        className={genericStyles.expanderItem}
      >
        { isAreaContainer && tenantData?.CONFIG?.enableHeatmap && <>
          <View className={styles.infoContainer}>
            <Flex className={styles.infoContent}>
              <View className={styles.measurementContainer}>
                { Object.keys(tenantData.CONFIG.measurements || {}).filter(measurement => tenantData.CONFIG.measurements[measurement].enabled).length ?
                  <MeasurementType current={indicesType} options={tenantData.CONFIG.measurements} tenantId={tenantId}
                    onChangeHandler={setMeasurementsType} locationId={collectionItems[c].ENTITY_TYPE_ID.replace("LOCATION#", "")} />
                :
                  <></>
                }
              </View>
              <View className={styles.legendContainer}>
                <IndexLegend type={indicesType} />
              </View>
              <View className={styles.growthCycleContainer}>
                <Flex className={styles.duration}>
                  <Image src="/images/calendar.svg" alt="" title="Growth cycle duration" />
                  <View className={styles.durationLabel}>
                    { getActiveScheduleStartAndEndDay(scheduleData.filter(schedule => schedule.GSI2_PK == "LOCATION#" + locationParts[locationParts.length - 1]),
                      collectionItems[c].TIMEZONE_ID || "UTC") }
                  </View>
                </Flex>
                <Text className={genericStyles.progressLabel}>
                  Days Running
                </Text>
                { scheduleData.length > 0 && <>
                  <GrowthCycleProgress area={areaData[0]} tenantId={tenantId}
                  schedules={[getActiveSchedule(scheduleData.filter(schedule => schedule.GSI2_PK == "LOCATION#" + locationParts[locationParts.length - 1]))]}
                  alerts={[]} variant="thin" sliderValue={indicesDate} sliderChangeHandler={setMeasurementsDate} isSlideable={historicMeasurementsLoaded} />
                  <Flex justifyContent="space-between">
                    <Text className={genericStyles.locationDurationText}>0</Text>
                    {/* Assumption that all areas in a location are growing the same thing */}
                    <Text className={ isScheduleComplete(scheduleData.filter(schedule => schedule.GSI2_PK == "LOCATION#" + locationParts[locationParts.length - 1])) ?
                      genericStyles.locationDurationCompleted100PcText
                    :
                      genericStyles.locationDurationText }
                    >
                      { getCycleDurationInDays(scheduleData.filter(schedule => schedule.GSI2_PK == "LOCATION#" + locationParts[locationParts.length - 1])) }
                    </Text>
                  </Flex>
                </> }
              </View>
            </Flex>
          </View>
        </> }
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
      </ExpanderItem>);

    }

    return expanderItems;

  }, [alertData, getOrderedCollection, getUnorderedCollection, getLocationTitle, scheduleData, locationType, tenantData]);

  return isLoadingAlertData ? 
    <View className={styles.loadingContainer}>
      <Loader size="large" emptyColor="#F2F2F7" filledColor="#89BC2B" />
    </View>
  :
    <>

      <ContentWellHeader
        siteName={siteName}
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

      { ((tenantData && tenantData.CONFIG?.locations[locationType]?.isAreaContainer && areaData.length && currentLocations.length) ||
        tenantData && currentLocations.length) ?
        <View className={`contentWellContainer ${genericStyles.contentWellContainer}`}>
          { ((tenantData && tenantData.CONFIG?.locations[locationType]?.isAreaContainer && currentLocations.length && areaData.length > tenantData.CONFIG.locations[locationType]?.resPerPage) ||
            tenantData && currentLocations.length > tenantData.CONFIG?.locations[locationType]?.resPerPage) ?
            <Expander type="single" isCollapsible={true} value={expandedSection}
              onValueChange={onChangeHandler} className={genericStyles.expander}>
              { getExpanderItems(
                tenantData.CONFIG?.locations[locationType]?.isAreaContainer ?
                  areaData
                :
                  currentLocations,
                alertData.filter(alert => alert.STATE === "active"),
                indices[locationParts[locationParts.length - 1]] && indices[locationParts[locationParts.length - 1]][indicesDate] ?
                  indices[locationParts[locationParts.length - 1]][indicesDate][indicesType]
                : [],
                indicesType,
                tenantData.CONFIG.locations[locationType]?.isAreaContainer,
                tenantId
              )}
            </Expander>
          :
            tenantData.CONFIG?.locations[locationType]?.isAreaContainer ?
              <View className={`amplify-expander__item ${(areaData
                .find(item => 
                  getActiveSchedule(scheduleData.filter(schedule => schedule.GSI3_PK == item.ENTITY_TYPE_ID)) != null && alertData.find(alert => alert.GSI3_PK == item.ENTITY_TYPE_ID && alert.STATE == "active") != null
                ) != null) ?
                  genericStyles.expanderActiveAlertItem
                :
                  genericStyles.expanderItem
              }`} data-state="open">
                <Heading className="amplify-expander__header" level={3} data-state="open">
                  <View className="amplify-expander__trigger">
                    <View>{getLocationTitle(tenantData.CONFIG?.locations[locationType]?.rangeLabel)}</View>
                  </View>
                </Heading>
                <View className="amplify-expander__content">
                  <View className="amplify-expander__content__text">
                    { indicesLoaded ?
                      <>
                        { tenantData?.CONFIG?.enableHeatmap && <Flex className={styles.infoContainer}>
                          <View className={styles.measurementContainer}>
                            { Object.keys(tenantData.CONFIG.measurements || {}).filter(measurement => tenantData.CONFIG.measurements[measurement].enabled).length ?
                              <MeasurementType current={indicesType} options={tenantData.CONFIG.measurements}
                                onChangeHandler={setMeasurementsType} tenantId={tenantId}
                                locationId={locationData.find(location => location.ENTITY_TYPE_ID == "LOCATION#" + locationParts[locationParts.length - 1])?.ENTITY_TYPE_ID.replace("LOCATION#", "")} />
                            :
                              <></>
                            }
                          </View>
                          <View className={styles.growthCycleContainer}>s
                            <Flex className={styles.duration}>
                              <Image src="/images/calendar.svg" alt="" title="Growth cycle duration" />
                              <View className={styles.durationLabel}>
                                { getActiveScheduleStartAndEndDay(scheduleData.filter(schedule => schedule.GSI2_PK == "LOCATION#" + locationParts[locationParts.length - 1]),
                                  locationData.find(location => location.ENTITY_TYPE_ID == "LOCATION#" + locationParts[locationParts.length - 1])?.TIMEZONE_ID || "UTC") }
                              </View>
                            </Flex>
                            <Text className={genericStyles.progressLabel}>
                              Days Running
                            </Text>
                            { scheduleData.length > 0 && <>
                              <GrowthCycleProgress area={areaData[0]} tenantId={tenantId}
                              schedules={[getActiveSchedule(scheduleData.filter(schedule => schedule.GSI2_PK == "LOCATION#" + locationParts[locationParts.length - 1]))]}
                              alerts={[]} variant="thin" sliderValue={indicesDate} sliderChangeHandler={setMeasurementsDate} isSlideable={historicMeasurementsLoaded} />
                              <Flex justifyContent="space-between">
                                <Text className={genericStyles.locationDurationText}>0</Text>
                                {/* Assumption that all areas in a location are growing the same thing */}
                                <Text className={ isScheduleComplete(scheduleData.filter(schedule => schedule.GSI2_PK == "LOCATION#" + locationParts[locationParts.length - 1])) ?
                                  genericStyles.locationDurationCompleted100PcText
                                :
                                  genericStyles.locationDurationText }
                                >
                                  { getCycleDurationInDays(scheduleData.filter(schedule => schedule.GSI2_PK == "LOCATION#" + locationParts[locationParts.length - 1])) }
                                </Text>
                              </Flex>
                            </> }
                          </View>
                        </Flex> }
                        { areaData.find(area => area.CA_DIMENSIONS) &&
                          getOrderedCollection(areaData
                            .filter(area => !area.DELETED_AT && area.CA_DIMENSIONS)
                            .sort((a, b) => caDimSort(a, b, "asc")),
                          indices[locationParts[locationParts.length - 1]] && indices[locationParts[locationParts.length - 1]][indicesDate] ?
                            indices[locationParts[locationParts.length - 1]][indicesDate][indicesType]
                          : [],
                          indicesType,
                          tenantId)
                        }
                        { getUnorderedCollection(areaData
                            .filter(area => !area.DELETED_AT && !area.CA_DIMENSIONS),
                          indices[locationParts[locationParts.length - 1]] && indices[locationParts[locationParts.length - 1]][indicesDate] ?
                            indices[locationParts[locationParts.length - 1]][indicesDate][indicesType]
                        : [],
                        indicesType,
                        tenantId) }
                      </>
                    :
                      <View className={styles.loadingContainer}>
                        <Loader size="large" emptyColor="#F2F2F7" filledColor="#89BC2B" />
                      </View>
                    }
                  </View>
                </View>
              </View>
            :
              <View className={`amplify-expander__item ${genericStyles.expanderItem}`} data-state="open">
                <Heading className="amplify-expander__header" level={3} data-state="open">
                  <View className="amplify-expander__trigger">
                    <View>{getLocationTitle(tenantData.CONFIG?.locations[locationType]?.rangeLabel)}</View>
                  </View>
                </Heading>
                <View className="amplify-expander__content">
                  <View className="amplify-expander__content__text">
                    { getUnorderedCollection(currentLocations, null, "QE", tenantId) }
                  </View>
                </View>
              </View>
          }
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
  siteName: PropTypes.string,
  topNavLocationData: PropTypes.arrayOf(PropTypes.object),
  isLoadingAlertData: PropTypes.bool
};