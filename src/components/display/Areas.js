import { Fragment, useState, useEffect, useMemo, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Accordion, Alert, Button, Heading, View } from '@aws-amplify/ui-react';
import AreasSection from '@/components/display/AreasSection';
import Breadcrumb from '@/components/structural/Breadcrumb';
import ContentWellHeader from '@/components/structural/ContentWellHeader';
import { hierarchySort } from '@/utils/sort';

import genericStyles from '@/page-styles/Generic.module.css';
import styles from '@/component-styles/display/Areas.module.css';

const Areas = ({ areaData, scheduleData, tenantData, locationData, rootLocationData, tenantId, selectedLocationId,
  topNavLocationData, locationPath, onClickHandler, currentLocation, showModalHandler, townName }) => {

  const [expandedSection, setExpandedSection] = useState(null);
  const [viewToggle, setViewToggle] = useState("grid");
  const [pageNo, setPageNo] = useState(0);

  useEffect(() => {

    document.body.style.cursor = "auto";

  }, []);

  const currentLocations = useMemo(() => {

    const childLocations = locationData.filter(location => location.PATH.startsWith(`PATH#${currentLocation.replace("__country", "#").replace("__", "#")}`));
    return childLocations
      .filter(childLocation =>
        tenantData.CONFIG.areas.expandableLocations.includes(childLocation.GSI2_PK.replace("TYPE#", "").toLowerCase())
      )
      .sort((a, b) => hierarchySort(a, b, "asc", locationData, tenantData));

  }, [tenantData, locationData, currentLocation]);
  
  const defaultExpandedSection = useMemo(() => {

    let result = "";

    if (currentLocations?.length > 0) {

      let selectedLocationPath;
      if (selectedLocationId) {

        selectedLocationPath = locationData.find(location => location.ENTITY_TYPE_ID == "LOCATION#" + selectedLocationId)?.PATH || null;

      }

      let isFirstMatchedLocationExpanded = false;

      result = currentLocations.map((currentLocation, index) => {

        if (selectedLocationId && currentLocation.ENTITY_TYPE_ID == "LOCATION#" + selectedLocationId) {

          // If the selected location matches a Control Area Container Location, expand it
          return "item_" + currentLocation.ENTITY_TYPE_ID + "_" + index;

        } else if (selectedLocationId && currentLocation.PATH.startsWith(selectedLocationPath) && !isFirstMatchedLocationExpanded) {

          // If the selected location's PATH references a Control Area Container Location, expand it
          isFirstMatchedLocationExpanded = true;
          
          return "item_" + currentLocation.ENTITY_TYPE_ID + "_" + index;

        } else if (!selectedLocationId && index == 0) {

          // If none of the conditions are met, display the first Control Area Container Location
          return "item_" + currentLocation.ENTITY_TYPE_ID + "_" + index;

        }

      }).filter(item => item);

    }

    return result;

  }, [currentLocations, locationData, selectedLocationId, tenantData]);

  const onChangeHandler = useCallback((newValue) => {

    const isCollapse = newValue == "collapse" || newValue == "expand" ?
      newValue
    :
      (expandedSection || defaultExpandedSection).filter((item) => !newValue.includes(item)).toString();
    const isExpand = newValue == "collapse" || newValue == "expand" ?
      newValue
    :
      newValue.filter((item) => !(expandedSection || defaultExpandedSection).includes(item)).toString();
    const locationKeyParts = (isCollapse ? isCollapse : isExpand ? isExpand : "").split("_");
      
    // Reset the pagination to the first data set when expanding sections
    setPageNo(0);

    // If we are collapsing or expanding all sections, determine the correct set of sections
    if (newValue == "collapse" || newValue == "expand") {

      if (newValue == "collapse") {

        setExpandedSection([]);

      } else {

        const expandableLocations = currentLocations.filter(location => locationData
          .filter(loc => loc.PATH.startsWith(location.PATH + "#")));
        let caclLocations = expandableLocations
          .map(loc => tenantData.CONFIG.locations[loc.GSI2_PK.replace("TYPE#", "").toLowerCase()].isAreaContainer ?
            loc
          :
            null    
          )
          .map((loc, idx) => loc ? "item_" + loc.ENTITY_TYPE_ID + "_" + idx : "")
          .filter(loc => loc != "");
        let parentLocations = expandableLocations.filter(loc => !caclLocations.includes(loc));
        for (let c = 0, len = parentLocations.length; c < len; c += 1) {

          caclLocations = caclLocations.concat(locationData
            .filter(loc => loc.PATH.startsWith(parentLocations[c].PATH + "#"))
            .filter(loc => tenantData.CONFIG.locations[loc.GSI2_PK.replace("TYPE#", "").toLowerCase()].isAreaContainer)
            .map((loc, idx) => "item_" + loc.ENTITY_TYPE_ID + "_" + idx));
          
        }

        setExpandedSection(caclLocations);
 
      }

    } else {

      setExpandedSection(newValue);

    }

  }, [expandedSection, defaultExpandedSection, locationData, tenantId]);

  const clickHandler = useCallback((evt, type, detail) => {

    if (evt.button != 0) return;
    
    showModalHandler(detail, locationData, topNavLocationData,
      currentLocation.split("__")[1], tenantData.CONFIG.town, tenantData.ENTITY_TYPE_ID.replace("TENANT#", ""),
      tenantData.CONFIG.header, tenantData.CONFIG.enableHeatmap);
  
  }, [currentLocation, locationData, onClickHandler, rootLocationData, showModalHandler, townName, tenantData, topNavLocationData]);

  return <>

    <ContentWellHeader
      townName={townName}
    >
      <Breadcrumb viewType="areas" resourcesPath={tenantData.CONFIG.resources} tenantName={tenantData.NAME}
        label={tenantData.CONFIG.areas.breadCrumbLabel}
        icon={tenantData.CONFIG.details.icon}
        locationPath={locationPath}
        locations={locationData}
      />
    </ContentWellHeader>
    { currentLocations.length > 1 && <View className={genericStyles.expandCollapseButton}>
      <Button className="standard-button" style={{ width: "7.5rem", marginTop: "0.5rem" }}
        onClick={(evt) => (expandedSection && expandedSection.length == 0) || !expandedSection ? 
          onChangeHandler("expand")
        :
          onChangeHandler("collapse")
        }
      >
        { (expandedSection && expandedSection.length == 0) || !expandedSection ? "Expand all" : "Collapse all"}
      </Button>
      <View>&nbsp;</View>
    </View> }
    { currentLocations.length > 0 ?
      <View className={`contentWellContainer ${genericStyles.contentWellContainer}`}>
      { currentLocations.map((location, locationIndex) => {

        if (tenantData.CONFIG.locations[location.GSI2_PK.replace("TYPE#", "").toLowerCase()].isAreaContainer) {

          let locationTypes = [];
          const currentLocationParts = location.PATH.split("#");
          for (let c = 2, len = currentLocationParts.length; c < len; c += 1) {
            const currentLocation = locationData.find(location => location.ENTITY_TYPE_ID == "LOCATION#" + currentLocationParts[c]);
            if (currentLocation) {
              locationTypes.push(currentLocation.NAME.length < 5 ?
                `${tenantData.CONFIG.locations[currentLocation.GSI2_PK.replace("TYPE#", "").toLowerCase()].searchResultLabel} ${currentLocation.NAME}`
              :
                currentLocation.NAME);
            }
          }

          const areasForLocation = areaData?.filter(ca => ca.PATH.startsWith(location.PATH)) || [];
          const locationKey = "item_" + location.ENTITY_TYPE_ID + "_" + locationIndex;

          return <Accordion.Container allowMultiple value={expandedSection || defaultExpandedSection}
            key={locationKey}
            onValueChange={onChangeHandler} className={genericStyles.expander}
          >
            <Accordion.Item
              value={locationKey}
              className={genericStyles.expanderItem}
            >
              <Accordion.Trigger>
                {locationTypes.join(" ")}
                <Accordion.Icon />
              </Accordion.Trigger>
              <Accordion.Content>
              { (expandedSection || defaultExpandedSection).includes(locationKey) && <>
                <AreasSection
                  sectionId={locationKey}
                  areaData={areasForLocation}
                  scheduleData={scheduleData.filter(schedule => schedule.GSI2_PK == location.ENTITY_TYPE_ID)}
                  tenantId={tenantId}
                  tenantConfig={tenantData?.CONFIG}
                  location={location}
                  clickHandler={clickHandler}
                  viewToggle={viewToggle}
                  pageNo={pageNo}
                />
              </> }
              </Accordion.Content>
            </Accordion.Item>
          </Accordion.Container>;

        } else {

          const childLocations = locationData
            .filter(loc => loc.PATH.startsWith(location.PATH + "#"))
            .filter(loc => tenantData.CONFIG.locations[loc.GSI2_PK.replace("TYPE#", "").toLowerCase()].isAreaContainer);
          const locationKey = "item_" + location.ENTITY_TYPE_ID + "_" + locationIndex;

          return <Fragment key={locationKey}>
            <Heading className={genericStyles.h2Heading} level={2}>{location.NAME}</Heading>
            <Accordion.Container allowMultiple value={(expandedSection || defaultExpandedSection)}
              onValueChange={onChangeHandler} className={genericStyles.expander}>
              { childLocations.map((childLocation, iLocationIndex) => {

                const areasForLocation = areaData?.filter(ca => ca.PATH.startsWith(childLocation.PATH + "#")) || [];
                const childLocationKey = "item_" + childLocation.ENTITY_TYPE_ID + "_" + iLocationIndex;

                return <Accordion.Item
                  key={childLocationKey}
                  value={childLocationKey}
                  className={genericStyles.expanderItem}
                >
                  <Accordion.Trigger>
                    {childLocation.NAME}
                    <Accordion.Icon />
                  </Accordion.Trigger>
                  <Accordion.Content>
                  { (expandedSection || defaultExpandedSection).includes(childLocationKey) && <>
                    <AreasSection
                      sectionId={childLocationKey}
                      areaData={areasForLocation}
                      scheduleData={scheduleData.filter(schedule => schedule.GSI2_PK == childLocation.ENTITY_TYPE_ID)}
                      tenantId={tenantId}
                      tenantConfig={tenantData?.CONFIG}
                      location={childLocation}
                      clickHandler={clickHandler}
                      viewToggle={viewToggle}
                      pageNo={pageNo}
                    />
                  </> }
                  </Accordion.Content>
                </Accordion.Item>;

              }) }
            </Accordion.Container>
            <View>&nbsp;</View>
          </Fragment>;

        }

      }) }
      </View>
    : currentLocations.length == 0 ?
      <View className={styles.alertContainer}>
        <Alert variation="warning" heading="No areas found">
          There are no areas to display. Please verify the customer configuration.
        </Alert>
      </View>
    :
      <></>
    }
    { currentLocations.length > 1 && <View className={genericStyles.expandCollapseButton}>
      <Button className="standard-button" style={{ width: "7.5rem", marginTop: "0.5rem" }}
        onClick={(evt) => (expandedSection && expandedSection.length == 0) || !expandedSection ? 
          onChangeHandler("expand")
        :
          onChangeHandler("collapse")
        }
      >
        { (expandedSection && expandedSection.length == 0) || !expandedSection ? "Expand all" : "Collapse all"}
      </Button>
    </View> }
  </>;

}

export default Areas;

Areas.propTypes = {
  areaData: PropTypes.arrayOf(PropTypes.object),
  scheduleData: PropTypes.arrayOf(PropTypes.object),
  tenantData: PropTypes.object,
  alertData: PropTypes.arrayOf(PropTypes.object),
  locationData: PropTypes.arrayOf(PropTypes.object),
  rootLocationData: PropTypes.object,
  tenantId: PropTypes.string,
  tId: PropTypes.string,
  selectedLocationId: PropTypes.string,
  topNavLocationData: PropTypes.arrayOf(PropTypes.object),
  locationPath: PropTypes.string,
  onClickHandler: PropTypes.func,
  currentLocation: PropTypes.string,
  animationHandler: PropTypes.func,
  showModalHandler: PropTypes.func,
  townName: PropTypes.string
};