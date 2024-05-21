import { Fragment, useState, useRef, useMemo } from 'react';
import { useQueries } from '@tanstack/react-query'
import { Button, Flex, Heading, Icon, Image, Loader, TabItem, Tabs, View } from '@aws-amplify/ui-react';
import AreasComparisonChart from '@/components/widgets/AreasComparisonChart';

import { getLocationMeasurementsDataByDatesAndType } from '@/utils/crud';
import { getMeasurementsDataByTime } from '@/utils/datetime';

import genericStyles from '@/page-styles/Generic.module.css';
import styles from '@/component-styles/widgets/PerformanceChart.module.css';

const AreaMeasurementsTabs = (props) => {

  const { periodDates, availableAreas, cacls, period, threshold, tenantId, measurementConfig, currentActiveIndex } = props;

  const scrollRef = useRef(null);

  const mouseCoords = useRef({
    startX: 0,
    startY: 0,
    scrollLeft: 20,
    scrollTop: 0
  });

  const [tab, setTab] = useState(0);
  const [activeIndex, setActiveIndex] = useState("");
  //const [isMouseDown, setIsMouseDown] = useState(false);
  //const [isScrolling, setIsScrolling] = useState(false);

  // Determine which indices are enabled for the customer
  const enabledMeasurements = useMemo(() => Object.fromEntries(Object.entries(measurementConfig)
    .filter(([key, values]) => values.enabled)
    .sort(([aKey, aValues], [bKey, bValues]) => {
      return aValues.order > bValues.order ? 1 : aValues.order < bValues.order ? -1 : 0;
    })), [measurementConfig]);

  const periodQueryDates = useMemo(() => {
   
    return {
      fromDate: new Date(periodDates.fromDateMs).toJSON().split("T")[0],
      toDate: new Date(periodDates.toDateMs).toJSON().split("T")[0]
    };

  }, [periodDates]);

  const indicesForDateRangeQueries = useQueries({
    queries: cacls.map((cacl) => {

      console.debug("Getting " + (Object.keys(enabledMeasurements).includes(activeIndex.toUpperCase()) ? activeIndex.toUpperCase() : currentActiveIndex) +
        " indices data from " + periodQueryDates.fromDate + " to " + periodQueryDates.toDate + " for " + cacl.NAME + "...");

      const areaCountForCacl = availableAreas.filter(area => area.PATH.startsWith(cacl.PATH + "#"))?.length || 0;

      return {
        queryKey: [
          "locationMeasurementsByDatesAndType",
          tenantId,
          cacl.ENTITY_TYPE_ID.replace("LOCATION#", ""),
          periodQueryDates.fromDate,
          periodQueryDates.toDate,
          (Object.keys(enabledMeasurements).includes(activeIndex.toUpperCase()) ? activeIndex.toUpperCase() : currentActiveIndex),
          areaCountForCacl
        ],
        queryFn: ({ queryKey }) => getLocationMeasurementsDataByDatesAndType(queryKey[2], queryKey[3], queryKey[4], queryKey[5], queryKey[6], queryKey[1]),
        enabled: periodQueryDates.fromDate != null && periodQueryDates.toDate != null &&
          (Object.keys(enabledMeasurements).includes(activeIndex.toUpperCase()) ? activeIndex : currentActiveIndex) != ""
      };

    }),
    combine: (results) => {
      return ({
        data: results.reduce((acc, curr) => {
          return curr.data ? acc.concat(curr.data) : acc;
        }, []),
        isPending: results.some(result => result.isPending) && 
          (Object.keys(enabledMeasurements).includes(activeIndex.toUpperCase()) ? activeIndex : currentActiveIndex) != "",
        isError: results.some(result => result.isError)
      })
    }

  });

  /*  
  const onDragStartHandler = (evt) => {

    if (!scrollRef.current) return;
    
    const slider = scrollRef.current.children[0];

    const startX = evt.pageX - slider.offsetLeft;
    const startY = evt.pageY - slider.offsetTop;
    const scrollLeft = slider.scrollLeft;
    const scrollTop = slider.scrollTop;
    mouseCoords.current = { startX, startY, scrollLeft, scrollTop }
    setIsMouseDown(true);
    document.body.style.cursor = "grabbing";

  };

  const onDragEndHandler = (evt) => {

    if (!scrollRef.current) return;

    setIsMouseDown(false);
    document.body.style.cursor = "default";

  };

  const onDragHandler = (evt) => {

    if (!isMouseDown || !scrollRef.current) return;

    evt.preventDefault();
    const slider = scrollRef.current.children[0];
    const x = evt.pageX - slider.offsetLeft;
    const y = evt.pageY - slider.offsetTop;
    const walkX = (x - mouseCoords.current.startX) * 1.5;
    const walkY = (y - mouseCoords.current.startY) * 1.5;
    slider.scrollLeft = mouseCoords.current.scrollLeft - walkX;
    slider.scrollTop = mouseCoords.current.scrollTop - walkY;

  };
  */

  const onClickHandler = (evt, amt) => {

    if (!scrollRef.current) return;

    const slider = scrollRef.current;
    const startX = evt.pageX - slider.offsetLeft;
    const startY = evt.pageY - slider.offsetTop;
    let scrollLeft = mouseCoords.current.scrollLeft + amt; // Add 20 to cover left-hand arrow positioning
    const scrollTop = mouseCoords.current.scrollTop;
    mouseCoords.current = { startX, startY, scrollLeft, scrollTop };
    slider.scrollLeft = scrollLeft;

  };

  /*
    <View ref={scrollRef}
      onMouseDown={onDragStartHandler}
      onMouseUp={onDragEndHandler}
      onMouseMove={onDragHandler}
    >
  */

  return <View className={styles.areaComparisonChart}>
    <Flex className={`horizontalScrollableContent ${styles.headingContainer}`}>
      <Heading className={genericStyles.h2Heading} level={2}>Area Comparison</Heading>
      <View className={styles.tabsNavContainer}>
        { Object.keys(enabledMeasurements).length >= 4 && <Button variation="link" className="tabsButton leftButton" id="tabs-scroll-left"
          onClick={(evt) => onClickHandler(evt, -750)}>
          <span data-testid="move-left-icon"
            className="amplify-icon amplify-expander__icon"
            aria-hidden="true"
            style={{ width: "1em", height: "1em" }}
          >
            <Icon viewBox={{ width: 24, height: 24}}
              pathData="M16.59 8.58984L12 13.1698L7.41 8.58984L6 9.99984L12 15.9998L18 9.99984L16.59 8.58984Z"
            />
          </span>  
        </Button> }
        { Object.keys(enabledMeasurements).length > 0 && <View ref={scrollRef}>
          <Tabs className={styles.tabList}
            currentIndex={!Object.keys(enabledMeasurements).includes(activeIndex.toUpperCase()) ?
              Object.keys(enabledMeasurements).findIndex(index => index == currentActiveIndex)
            :
              tab
            }
            defaultIndex="0"
            onChange={(tab) => {
              setTab(tab);
              setActiveIndex((Object.keys(enabledMeasurements)[tab] || "SUPPLY").toLowerCase());
            }}>
            { Object.keys(enabledMeasurements)
              .filter(key => enabledMeasurements[key].enabled)
              .map((key, idx) => {

                return <TabItem className={styles.tabItem} key={key} title={<View className={`${key + "_tab"} ${styles.tabContainer}`}>
                  
                  { idx > 0 && <View className={styles.before}></View> }
                  <View className={styles.tabContent}>
                    <View className={styles.tabLabel}>
                      <Image src={`/images/${enabledMeasurements[key].buttonIcon}-active.svg`} alt="" />
                      <View as="span">{enabledMeasurements[key].label}</View>
                    </View>
                  </View>
                  <View className={styles.after}></View>
                </View>} value={idx} />;

              })
            }
            <View className={styles.spacer}></View>
          </Tabs>
        </View> }
        { Object.keys(enabledMeasurements).length >= 4 && <Button variation="link" className="tabsButton rightButton" id="tabs-scroll-right"
          onClick={(evt) => onClickHandler(evt, 750)}>
          <span data-testid="move-right-icon"
            className="amplify-icon amplify-expander__icon"
            aria-hidden="true"
            style={{ width: "1em", height: "1em" }}
          >
            <Icon viewBox={{ width: 24, height: 24}}
              pathData="M16.59 8.58984L12 13.1698L7.41 8.58984L6 9.99984L12 15.9998L18 9.99984L16.59 8.58984Z"
            />
          </span>  
        </Button> }
      </View>
    </Flex>
    { indicesForDateRangeQueries.isPending ?
      <View className={styles.areaComparisonChart}>
        <View className={styles.loadingContainer} style={{ height: "640px" }}>
          <Loader size="large" emptyColor="#F2F2F7" filledColor="#89BC2B" />
        </View>
      </View>
    : indicesForDateRangeQueries.isError ?
      <></>
    :
      <AreasComparisonChart {...props}
        activeIndex={Object.keys(enabledMeasurements).includes(activeIndex.toUpperCase()) ? activeIndex : currentActiveIndex.toLowerCase()}
        activeIndexHandler={setActiveIndex}
        data={getMeasurementsDataByTime(indicesForDateRangeQueries.data,
          periodDates.fromDateMs, periodDates.toDateMs, periodDates.isHourly,
          period, threshold, true)}
      />
    }
  </View>;

};

export default AreaMeasurementsTabs;