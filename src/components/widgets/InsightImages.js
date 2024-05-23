import { useState, useEffect, useMemo, useRef, Fragment } from 'react';
import PropTypes from 'prop-types';
import { Flex, Image as AmplifyImage, Link, Loader, Text, View } from '@aws-amplify/ui-react';
import { useQuery } from '@tanstack/react-query';
import { getStorageItems } from '@/utils/crud';
import { getActiveAlert, getFormattedDate } from '@/utils/datetime';
import { zoneDimSort } from '@/utils/sort';

import styles from '@/component-styles/widgets/InsightImages.module.css';

const InsightImages = ({ alerts = [], schedule, zones = [], tz = "UTC",
  areaName, showAreaName, resources, areaIcon, isMobile }) => {

  const interval = useRef(null);

  const [now, setNow] = useState(new Date().getTime());

  useEffect(() => {

    // While the page is displayed, refresh the images every 20s
    interval.current = setInterval(() => {

      setNow(new Date().getTime());

    }, 60000);
    
    return () => {

      clearInterval(interval.current);

    };
    
  }, []);

  const imageSrcs = useMemo(() => {

    if (schedule && schedule.ENTITY_TYPE_ID && zones.length != 0) {

      return Array.from({ length: 3 }, (_, idx) => {

        // Show an image from up to three Zones. 2023-07-07 expectation is that a Control Area will not have more than 3 Zones
        let currZone = zones.length == 1 ?
          zones[0]
        : zones.length == 2 ?
          zones.sort((a, b) => zoneDimSort(a, b, "asc"))[idx < 2 ? 0 : 1]
        :
          zones.sort((a, b) => zoneDimSort(a, b, "asc"))[idx];
        let imgData = !currZone ? "" : `/areadetail/${
          schedule.ENTITY_TYPE_ID.replace("SCHEDULE#", "")
        }/${
          currZone.ENTITY_TYPE_ID.replace("ZONE#", "")
        }/${idx + 1}.jpg?t=${now}`;

        return imgData;

      });

    } else {

      return [];

    }

  }, [schedule, zones, now]);

  return <>
    <Flex className={styles.insightImagesContainer}>
      { imageSrcs.map((imageSrc, idx) => {
          
        let currZone = zones.length == 1 ?
          zones[0]
        : zones.length == 2 ?
          zones.sort((a, b) => zoneDimSort(a, b, "asc"))[idx < 2 ? 0 : 1]
        :
          zones.sort((a, b) => zoneDimSort(a, b, "asc"))[idx];

        if (!imageSrc) return <Fragment key={`${currZone?.ENTITY_TYPE_ID || "NA"}_img${idx}`}></Fragment>;

        return <View key={`${currZone?.ENTITY_TYPE_ID || "NA"}_img${idx}`}>
          <View className="imageBorder">
            <AmplifyImage
              width={401}
              height={222}
              alt=""
              src={imageSrc}
              style={{ objectFit: "cover" }}
            />
          </View>
          { idx == 0 && <Flex className={styles.legendContainer}>
            { showAreaName && <Flex className={styles.legendContent} style={{
              marginTop: "-3px"
            }}>
              <AmplifyImage
                src={`/images/${resources}/desktop-${areaIcon}`}
                alt=""
                width={24}
                height={24}
              />
              <View as="p" className={styles.legendUC}>{((idx == 0 && zones.length == 1) ||
                (idx < 2 && zones.length == 2) || zones.length > 2) ?
                areaName
              : 
                <>&nbsp;</>
              }</View>
            </Flex> }
            <Flex className={styles.legendContent}>
              <AmplifyImage src="/images/calendar.svg" alt="" title="Last modified date" />
              <View as="p" className={styles.legend}>
                {getFormattedDate(new Date(), "Mmm-DD-YYYY", tz)}
              </View>
            </Flex>
            <Flex className={styles.legendContent}>
              <AmplifyImage src={"/images/time-active.svg"} alt="Last modified time" />
              <View as="p" className={styles.legend}>
                {getFormattedDate(new Date(), "HH:mm", tz) + (tz == "UTC" ? " UTC" : "")}
              </View>
            </Flex>
          </Flex> }
        </View>;
      }) }
    </Flex>
    <View className={styles.imageCredits}>
      <ol>
        <li>
          <Link href="http://www.jct600.co.uk/electric/" isExternal target="image">JCT600</Link>
        </li>
        <li>
          <Link href="https://www.geograph.org.uk/photo/6462286" isExternal target="image">Kit Rackley</Link>
        </li>
        <li>
          <Link href="https://www.geograph.org.uk/photo/7654335" isExternal target="image">TCExplorer</Link>
        </li>
      </ol>
    </View>
  </>;

};

export default InsightImages;

InsightImages.propTypes = {
  alerts: PropTypes.arrayOf(PropTypes.object),
  schedule: PropTypes.object,
  zones: PropTypes.arrayOf(PropTypes.object),
  tz: PropTypes.string,
  areaName: PropTypes.string,
  showAreaName: PropTypes.bool,
  resources: PropTypes.string,
  areaIcon: PropTypes.string,
  isMobile: PropTypes.bool
};