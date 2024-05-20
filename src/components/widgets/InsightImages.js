import { useState, useEffect, useMemo, useRef, Fragment } from 'react';
import PropTypes from 'prop-types';
import { Flex, Image as AmplifyImage, Loader, Text, View } from '@aws-amplify/ui-react';
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

    }, 20000);
    
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
        let imgData = !currZone ? "" : `/public/traydetail/${
          schedule.ENTITY_TYPE_ID.replace("GROWTHJOB#", "")
        }/${
          currZone.ENTITY_TYPE_ID.replace("ZONE#", "")
        }/${idx + 1}.png?t=${now}`;

        return imgData;

      });

    } else {

      return [];

    }

  }, [schedule, zones, now]);

  // The alerts prop is intended to be used to highlight a zone that has a stress event,
  // but we don't yet have the data to do this - note the 1 = 0 checks below to turn off classname switching

  // Active alert border disabled as data model has no link between Zones and Alerts as of 2023-03-15
  return <Flex className={styles.insightImagesContainer}>
    { imageSrcs.map((imageSrc, idx) => {
        
      let currZone = zones.length == 1 ?
        zones[0]
      : zones.length == 2 ?
        zones.sort((a, b) => zoneDimSort(a, b, "asc"))[idx < 2 ? 0 : 1]
      :
        zones.sort((a, b) => zoneDimSort(a, b, "asc"))[idx];

      if (!imageSrc) return <Fragment key={`${currZone?.ENTITY_TYPE_ID || "NA"}_img${idx}`}></Fragment>;

      // We don't link Alerts to Zones, so only show the active alert border if there is one Zone
      return <View key={`${currZone?.ENTITY_TYPE_ID || "NA"}_img${idx}`}>
        {/* 2023-07-11 Active alert image border to be added when we can link Alerts to Zones */}
        <View className={alerts.length > 0 && getActiveAlert(alerts) ?
          "activeAlertImageBorder"
        :
          "imageBorder"
        }>
          <AmplifyImage
            width={400}
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
              src={`/images/${resources}/${isMobile ? "" : "desktop-"}${areaIcon}`}
              alt=""
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
              {getFormattedDate(new Date(), "HH:mm:ss", tz) + (tz == "UTC" ? " UTC" : "")}
            </View>
          </Flex>
        </Flex> }
      </View>;
    }) }
  </Flex>;

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