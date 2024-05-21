import { Fragment } from 'react';
import PropTypes from 'prop-types';
import Link from 'next/link';
import { Flex, Heading, Image, Link as AmplifyLink, View } from '@aws-amplify/ui-react';

import genericStyles from '@/page-styles/Generic.module.css';

const Breadcrumb = ({ viewType, resourcesPath, tenantName, label, icon,
  area, areaConfig, locationPath, locations, locationConfigs, locationBreadCrumbPaths }) => {

  return <Flex className={genericStyles.locationHeadings}>
    { viewType != "details" ?
      <Heading
        className={genericStyles.h1Heading}
        level={1}
        key="breadCrumb_tenant"
      >
        <Image src={`/images/${resourcesPath}/desktop-site-breadcrumb-icon.svg`} alt="" />
        <View as="span">{locations.filter(location => location.GSI2_PK == "TYPE#TOWN").length > 1 ?
          locations.filter(location => location.GSI2_PK == "TYPE#TOWN" && locationPath && locationPath.startsWith(location.PATH)).length > 1 ?
            tenantName
          :
            locations.find(location => location.GSI2_PK == "TYPE#TOWN" && locationPath && locationPath.startsWith(location.PATH))?.NAME || tenantName
        :
          locations.find(location => location.GSI2_PK == "TYPE#TOWN")?.NAME || tenantName
        }&nbsp;&nbsp;-&nbsp;&nbsp;</View>
      </Heading>
    :
      <Heading
        className={genericStyles.h2Heading}
        level={2}
        key="breadCrumb_town"
      >
        <Image src={`/images/${resourcesPath}/desktop-site-breadcrumb-icon.svg`} alt="" />
        <View as="span">{locations.filter(location => location.GSI2_PK == "TYPE#TOWN").length > 1 ?
          locations.filter(location => location.GSI2_PK == "TYPE#TOWN" && locationPath && locationPath.startsWith(location.PATH)).length > 1 ?
            tenantName
          :
            locations.find(location => location.GSI2_PK == "TYPE#TOWN" && locationPath && locationPath.startsWith(location.PATH))?.NAME || tenantName
        :
          locations.find(location => location.GSI2_PK == "TYPE#TOWN")?.NAME || tenantName
        }&nbsp;&nbsp;-&nbsp;&nbsp;</View>
      </Heading>
    }
    { viewType == "locations" || viewType == "areas" || viewType == "alerts" ?
      <Heading
        className={genericStyles.h1Heading}
        level={1}
        key="breadCrumb_location"
      >
        { viewType == "alerts" ?
          <Image src={`/images/${icon}`} alt="" />
        :
          <Image src={`/images/${resourcesPath}/desktop-${icon}`} alt="" />
        }
        <View as="span">{label} View</View>
      </Heading>
    : viewType == "location" ?
      <Fragment key="breadCrumb_locations">
        {(locationPath.split("#") || []).slice(0, -1).map((locId, idx, arr) => {

          const locationData = locations.find(location => location.ENTITY_TYPE_ID == "LOCATION#" + locId);
          if (locationData) {

            const locationType = locationData.GSI2_PK.replace("TYPE#", "").toLowerCase();
            const locationConfig = locationConfigs[locationType];
            const locationUrl = locationBreadCrumbPaths.find(path => path.indexOf("/" + locationType + "/" + locId) != -1);

            return <Heading
              className={genericStyles.h1Heading}
              level={1}
              key={"breadCrumb_location_" + idx}
            >
              {locationConfig?.icon && <Image src={`/images/${resourcesPath}/desktop-${locationConfig.icon}`} alt="" /> }
              { locationUrl ?
                <>
                  <Link href={locationUrl} passHref>
                    <AmplifyLink>
                      { locationConfig?.breadCrumbLabel.indexOf("{") != -1 ?
                        locationConfig.breadCrumbLabel.substring(0, locationConfig.breadCrumbLabel.indexOf("{")) +
                        locationData.NAME + 
                        locationConfig.breadCrumbLabel.substring(locationConfig.breadCrumbLabel.indexOf("}") + 1)
                      :
                        locationConfig?.breadCrumbLabel || locationData.NAME
                      }
                    </AmplifyLink>
                  </Link>
                  <View as="span">
                    &nbsp;-&nbsp;
                  </View>
                </>
              :
                <View as="span">
                  { locationConfig?.breadCrumbLabel.indexOf("{") != -1 ?
                    locationConfig.breadCrumbLabel.substring(0, locationConfig.breadCrumbLabel.indexOf("{")) +
                    locationData.NAME + 
                    locationConfig.breadCrumbLabel.substring(locationConfig.breadCrumbLabel.indexOf("}") + 1)
                  :
                    locationConfig?.breadCrumbLabel || locationData.NAME
                  }
                  &nbsp;-&nbsp;
                </View>
              }
              </Heading>;
    
          } else {

            return <Fragment key={"breadCrumb_location_" + idx}></Fragment>;

          }

        })}
        {(locationPath.split("#") || []).slice(-1).map((locId) => {

          const locationData = locations.find(location => location.ENTITY_TYPE_ID == "LOCATION#" + locId);
          if (locationData) {

            const locationConfig = locationConfigs[locationData.GSI2_PK.replace("TYPE#", "").toLowerCase()];
            
            return <Heading
              className={genericStyles.h1Heading}
              level={1}
              key={"breadCrumb_location_" + ((locationPath.split("#") || []).length)}
            >
              {locationConfig?.icon && <Image src={`/images/${resourcesPath}/desktop-${locationConfig.icon}`} alt="" /> }
              <View as="span">
                All {label} in { locationConfig?.breadCrumbLabel.indexOf("{") != -1 ?
                  locationConfig.breadCrumbLabel.substring(0, locationConfig.breadCrumbLabel.indexOf("{")) +
                  locationData.NAME + 
                  locationConfig.breadCrumbLabel.substring(locationConfig.breadCrumbLabel.indexOf("}") + 1)
                :
                  locationConfig?.breadCrumbLabel || locationData.NAME
                }
              </View>
            </Heading>;

          }

          return <></>;

        })}
      </Fragment>
    : viewType == "details" ?
      <Fragment key="breadCrumb_locations">
        {(area?.PATH?.split("#") || []).map((locId, idx, arr) => {

          const locationData = locations.find(location => location.ENTITY_TYPE_ID == "LOCATION#" + locId);
          if (locationData && locationData.GSI2_PK != "TYPE#TOWN") {

            const locationConfig = locationConfigs[locationData.GSI2_PK.replace("TYPE#", "").toLowerCase()];

            return <Heading
              className={genericStyles.h2Heading}
              level={2}
              key={"breadCrumb_location_" + idx}
            >
              {locationConfig?.icon && <Image src={`/images/${resourcesPath}/desktop-${locationConfig.icon}`} alt="" /> }
              <View as="span">
              { (locationConfig?.breadCrumbLabel || "").indexOf("{") != -1 ?
                locationConfig.breadCrumbLabel.substring(0, locationConfig.breadCrumbLabel.indexOf("{")) +
                locationData.NAME + 
                locationConfig.breadCrumbLabel.substring(locationConfig.breadCrumbLabel.indexOf("}") + 1)
              :
                locationConfig?.breadCrumbLabel || locationData.NAME
              }
              { idx + 1 < arr.length && <>&nbsp;&nbsp;-&nbsp;</> }
              </View>
            </Heading>;
    
          } else {

            return <Fragment key={"breadCrumb_location_" + idx}></Fragment>;

          }

        })}
        <Heading
          className={genericStyles.h2Heading}
          level={2}
          key="breadCrumb_area"
        >
          <Image src={`/images/${resourcesPath}/desktop-${icon}`} alt="" />
          <View as="span">
            { (areaConfig?.breadCrumbLabel || "").indexOf("{") != -1 ?
              areaConfig.breadCrumbLabel.substring(0, areaConfig.breadCrumbLabel.indexOf("{")) +
              (area?.NAME || "") + 
              areaConfig.breadCrumbLabel.substring(areaConfig.breadCrumbLabel.indexOf("}") + 1)
            :
              areaConfig?.breadCrumbLabel || (area?.NAME || "")
            }
            &nbsp;&nbsp;-
          </View>
        </Heading>
        <Heading
          className={genericStyles.h2Heading}
          level={2}
          key="breadCrumb_details"
        >
          <Image src={`/images/${resourcesPath}/desktop-details-breadcrumb-icon.svg`} alt="" />
          <View as="span">{label}</View>
        </Heading>
      </Fragment>
    :
      <Fragment key="breadCrumb_locations"></Fragment>
    }
  </Flex>;

};

export default Breadcrumb;

Breadcrumb.propTypes = {
  viewType: PropTypes.string.isRequired,
  resourcesPath: PropTypes.string.isRequired,
  tenantName: PropTypes.string,
  label: PropTypes.string,
  icon: PropTypes.string,
  area: PropTypes.object,
  areaConfig: PropTypes.object,
  locationPath: PropTypes.string,
  locationConfigs: PropTypes.object,
  locationBreadCrumbPaths: PropTypes.arrayOf(PropTypes.string)
};