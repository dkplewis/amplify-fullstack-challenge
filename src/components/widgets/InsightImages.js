import { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Flex, Image as AmplifyImage, Link, Loader, Text, View } from '@aws-amplify/ui-react';
import { useQuery } from '@tanstack/react-query';
import { getStorageItems } from '@/utils/crud';
import { getFormattedDate } from '@/utils/datetime';
import { zoneDimSort } from '@/utils/sort';

import styles from '@/component-styles/widgets/InsightImages.module.css';

const InsightImages = ({ schedule, zones = [], tz = "UTC",
  areaName, showAreaName, resources, areaIcon }) => {

  const { isPending, isError, isSuccess, data, error } = useQuery({
    queryKey: ["getStorageItems", schedule?.entityTypeId, zones],
    queryFn: ({ queryKey }) => getStorageItems(queryKey[1], queryKey[2]),
    enabled: (schedule?.entityTypeId && zones.length > 0)
  });

  if (isPending) return <View className={styles.loadingContainer}>
    <Loader size="large" emptyColor="#F2F2F7" filledColor="#89BC2B" />
  </View>;

  if (isError) return <></>;
  
  return <>
    <Flex className={styles.insightImagesContainer}>
      { isSuccess && schedule && <>
        { Array.from({ length: 3 }, (_, idx) => {

          // Show an image from up to three Zones. 2023-07-07 expectation is that a Control Area will not have more than 3 Zones
          let currZone = zones.length == 1 ?
            zones[0]
          : zones.length == 2 ?
            zones.sort((a, b) => zoneDimSort(a, b, "asc"))[idx < 2 ? 0 : 1]
          :
            zones.sort((a, b) => zoneDimSort(a, b, "asc"))[idx];
          let imgData = !currZone ? -1 : data.find(img => img.src.indexOf(`areadetail/${
            schedule.entityTypeId.replace("SCHEDULE#", "")
          }/${
            currZone.entityTypeId.replace("ZONE#", "")
          }/${idx + 1}.jpg`) != -1);

          if (!imgData) return <Fragment key={`${currZone?.entityTypeId || "NA"}_img${idx}`}></Fragment>;

          return <View key={`${currZone?.entityTypeId || "NA"}_img${idx}`}>
            <View className="imageBorder">
              <AmplifyImage
                width={401}
                height={222}
                alt=""
                src={imgData.src}
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
      </> }
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
  schedule: PropTypes.object,
  zones: PropTypes.arrayOf(PropTypes.object),
  tz: PropTypes.string,
  areaName: PropTypes.string,
  showAreaName: PropTypes.bool,
  resources: PropTypes.string,
  areaIcon: PropTypes.string
};