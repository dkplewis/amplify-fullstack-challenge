import { Fragment, useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Button, Flex, Image, Text, View } from '@aws-amplify/ui-react';
import { LineChart, Line, ReferenceDot, ReferenceLine, Tooltip, XAxis, YAxis } from 'recharts';
import { Tooltip as ReactTooltip } from 'react-tooltip';
//import { isMobile } from 'react-device-detect';
import PeriodSelector from '@/components/widgets/PeriodSelector';
import { getFormattedDate, getTimeAsPercentageOfPeriod } from '@/utils/datetime';
import { areaHasActiveAlerts } from '@/utils/location';

import styles from '@/component-styles/widgets/PerformanceChart.module.css';

const ACTIVE_COLOUR = "#f2f2f7";
const ALERT_COLOUR = "#f5d205";
const AREA_COLOURS = [
  "#89bc2b", "#0589f5", "#f59705", "#e84c60", "#b605f5", "#05eef5", "#18f537",
  "#3abc2b", "#0525f5", "#f5d505", "#854ce8", "#f505d9", "#05d1f5",
  "#2bbca4", "#2105f5", "#f5bd05", "#4c6be8", "#f50589", "#05adf5"

];
const LINE_AREA_COLOURS = [
  "rgba(137, 188, 43, 1)", "rgba(5, 137, 245, 1)", "rgba(245, 151, 5, 1)", "rgba(232, 76, 96, 1)", "rgba(182, 5, 245, 1)", "rgba(5, 238, 245, 1)", "rgba(24, 245, 55, 1)",
  "rgba(58, 188, 43, 1)", "rgba(5, 37, 245, 1)", "rgba(245, 213, 5, 1)", "rgba(133, 76, 232, 1)", "rgba(245, 5, 217, 1)", "rgba(5, 209, 245, 1)", 
  "rgba(43, 188, 164, 1)", "rgba(33, 5, 245, 1)", "rgba(245, 189, 5, 1)", "rgba(76, 107, 232, 1)", "rgba(245, 5, 137, 1)", "rgba(5, 173, 245, 1)", 
];
const LINE_AREA_COLOURS_FADED = [
  "rgba(137, 188, 43, 0.45)", "rgba(5, 137, 245, 0.45)", "rgba(245, 151, 5, 0.45)", "rgba(232, 76, 96, 0.45)", "rgba(182, 5, 245, 0.45)", "rgba(5, 238, 245, 0.45)", "rgba(24, 245, 55, 0.45)",
  "rgba(58, 188, 43, 0.45)", "rgba(5, 37, 245, 0.45)", "rgba(245, 213, 5, 0.45)", "rgba(133, 76, 232, 0.45)", "rgba(245, 5, 217, 0.45)", "rgba(5, 209, 245, 0.45)", 
  "rgba(43, 188, 164, 0.45)", "rgba(33, 5, 245, 0.45)", "rgba(245, 189, 5, 0.45)", "rgba(76, 107, 232, 0.45)", "rgba(245, 5, 137, 0.45)", "rgba(5, 173, 245, 0.45)", 
];


const AreasComparisonChart = ({ data = [], measurementConfig, period, defaultPeriod, alerts = [], tz = "UTC",
  tenantId, schedule, area, isRollingPeriod, isColourEnabled, threshold, sunriseSunsets = [], cacls = [],
  periodChangeHandler, chartLineType, editedAreas, availableAreas, areaIcon, periodDates,
  timeUnit, timeUnitHandler, dateRange, setDateRangeHandler, addRemoveClickHandler, cancelClickHandler, acceptClickHandler, resourcesPath,
  activeIndex }) => {

  const isMobile = false;
  
  const [showTooltip, setShowTooltip] = useState(false);
  const [indexSelectorIsOpen, setIndexSelectorIsOpen] = useState(false);
  const [activeArea, setActiveArea] = useState("");
  const [focussedArea, setFocussedArea] = useState("");
  const [show, setShow] = useState(null);

  // Determine which areas are enabled for the customer
  const enabledAreas = useMemo(() => availableAreas.filter((item) => item.enabledFlag), [availableAreas]);

  // Determine how many columns are required in the area selector
  const areaSelectorColumns = useMemo(() => {

    let result = 1;
    const columns = Math.ceil(availableAreas.length / 32);
    if (columns > 0) result = columns;

    return result;

  }, [availableAreas]);

  // Get the min and max values from the dataset across all areas
  let dataMinMax = useMemo(() => {

    let result = [];

    for (let c = 0, len = enabledAreas.length; c < len; c += 1) {

      const area = enabledAreas[c];
      const areaId = area.ENTITY_TYPE_ID.replace("AREA#", "");

      const minMax = data.reduce((acc, curr) => {

        if (!curr[areaId]) return acc;

        const currIndexValue = curr[areaId];
        let roundedDownValue = Math.floor(currIndexValue / 10) * 10;
        let previousTen = currIndexValue % 10 == 0 && (
          activeIndex == "phi" || activeIndex == "ps2" || activeIndex == "etr" || activeIndex == "par" ?
            roundedDownValue > 9
          :
            true
        ) ?
          roundedDownValue - 10
        :
          roundedDownValue;
        let roundedUpValue = Math.ceil(currIndexValue / 10) * 10;
        let nextTen = currIndexValue % 10 == 0 && (
          activeIndex == "phi" || activeIndex == "ps2" ?
            roundedUpValue < 91
          : activeIndex == "etr" ?
            roundedUpValue < 1991
          : activeIndex == "par" ?
            roundedUpValue < 791
          :
            true
        ) ?
          roundedUpValue + 10
        :
          roundedUpValue;
        acc[0] = (acc[0] === undefined || previousTen < acc[0]) ? previousTen : acc[0];
        acc[1] = (acc[1] === undefined || nextTen > acc[1]) ? nextTen : acc[1];

        return acc;

      }, []);
      if (minMax.length == 2) {

        const minMaxDiff = (activeIndex == "phi" || activeIndex == "ps2" || activeIndex == "etr" || activeIndex == "par") && minMax[0] > 0 ? 
          Math.floor(Math.abs(minMax[1] - minMax[0]) / 10)
        : activeIndex == "pei" || activeIndex == "pui" ? 
          Math.floor(Math.abs(minMax[1] - minMax[0]) / 10)
        : 0;
        // Add extra padding to the min value to ensure data points aren't covered by the indices selector buttons
        const padding = (minMax[1] - minMax[0]) / 4;
        minMax[0] -= minMaxDiff + padding;

        if (minMax[0] < result[0] || result[0] === undefined) result[0] = minMax[0];
        if (minMax[1] > result[1] || result[1] === undefined) result[1] = minMax[1];

      }

    }

    return result;

  }, [data, activeIndex, enabledAreas]);

  // For each available area, get the latest index value
  // If two or more indices have the same value, decrease 
  let indicesLatestValues = useMemo(() => {

    let result = {};

    for (let c = 0, len = enabledAreas.length; c < len; c += 1) {

      const area = enabledAreas[c];
      const areaId = area.ENTITY_TYPE_ID.replace("AREA#", "");
  
      const lastIndex = data.findLast(datum => datum[areaId]);
      const lastValue = lastIndex ? lastIndex[areaId] : null;
      result[areaId] = lastValue;
  
    }

    return result;
  
  }, [enabledAreas, data]);

  let areasToShow = useMemo(() => {

    let result = [];

    for (let c = 0, len = enabledAreas.length; c < len; c += 1) {

      const area = enabledAreas[c];
      const areaId = area.ENTITY_TYPE_ID.replace("AREA#", "");

      const lastIndex = data.findLast(datum => datum[areaId]);
      const lastValue = lastIndex ? lastIndex[areaId] : null;
      if (lastValue) result.push(areaId);

    }

    return result;

  }, [enabledAreas, data]);

  // Determine the y-axis tick configuration and icon position across all areas for the active index
  // Four ticks at 25%, 50%, 75% and 100% of the y-axis domain for PHI, PUI and PS2
  // Four ticks at -25, 0, 25 and max value for PEI (fixed values)
  // Icon position will be the percentage of the min / max range where the latest value occurs
  let indicesYAxisTicks = useMemo(() => {

    let result = [];
    const [min, max] = dataMinMax;
    if (min != undefined && max != undefined) {

      if (activeIndex != "pei") {

        const diff = max - min;
        const initialTick = diff / 4;
        result = [min, min + initialTick, min + (initialTick * 2), min + (initialTick * 3), max];

      } else if (activeIndex == "pei") {

        result = [min, -25, 0, 25, max];

      }

    }

    return result;

  }, [dataMinMax, activeIndex]);
  
  const CustomTooltip = (props) => {

    const { active, payload, show = false, config, areas, activeIndex } = props;

    if (show && active && payload && payload.length) {

      return <View className="custom-tooltip">
        <Flex className="custom-tooltip-date-time">
          <View className="custom-tooltip-image">
            <Image src={"/images/calendar.svg"} alt="" />
          </View>
          <Text className="custom-tooltip-label">
            {getFormattedDate(new Date(payload[0].payload.displayDate), "Mmm-DD-YYYY", tz)}
          </Text>
          { payload[0].payload.isHourly && <>
            <View className="custom-tooltip-image">
              <Image src={"/images/time-active.svg"} alt="" />
            </View>
            <Text className="custom-tooltip-label">
              {getFormattedDate(new Date(payload[0].payload.displayDate), "HH:mm:ss", tz)}
              { tz == "UTC" ? " UTC" : "" }
            </Text>
          </> }
        </Flex>
        <Flex className="custom-tooltip-columns">
          <View className="custom-tooltip-image">
            <Image className="index-icon" src={`/images/${config[activeIndex.toUpperCase()] ?
              config[activeIndex.toUpperCase()].buttonIcon
            :
              ""
            }-active.svg`} alt="" />
          </View>
          <Text className="custom-tooltip-label">
            {payload[0].name}
          </Text>
        </Flex>
        { payload.map((areaPayload, idx) => {

          return <Flex key={areaPayload.dataKey + "-" + idx} gap="0.5rem" className="custom-tooltip-extraspace">
            <Text className="custom-tooltip-label evenly">{areas
              .find(area => area.ENTITY_TYPE_ID == "AREA#" + areaPayload.dataKey)?.NAME || "Area"}</Text>
            <Text className="custom-tooltip-label evenly">{`${areaPayload.value}${["phi", "ps2", "qe"].includes(activeIndex) ?
              "%"
            : activeIndex == "pui" && config.PUI?.maxValue ?
              " out of " + config.PUI.maxValue
            :
              ""
            }`}</Text>
          </Flex>;

        }) }
      </View>;

    }
  
    return null;

  };

  const CustomizedXAxisTick = (props) => {

    const { x, y, payload, length, threshold } = props;

    const longerTick = (periodDates.isHourly && payload.value.indexOf("T00:00:") != -1)
    ||
    (!periodDates.isHourly && (
      payload.index == 0 ||
      (period / 24 >= 14 ? (payload.index + 1) % 7 == 0 : false)
    )) ?
      true
    :
      false;

    const showHourlyTick = periodDates.isHourly && (payload.index == 0 || payload.index % Math.ceil(length / 24) == 0);

    const showDailyTick = (!periodDates.isHourly && (payload.index == 0 || (period / 24 >= 14 ?
      (payload.index + 1) % 7 == 0
    : true))) && payload.value != "dataMax" && payload.value != "dataMin";
  
    return <g transform={`translate(0, -16)`}>
      { periodDates.isHourly && payload.value.indexOf("T00:00:") != -1 && 
        <g transform={`translate(${payload.index == 0 ? x - 20 : payload.index + 1 == length ? x + 15 : x}, ${y - 30})`}>
          <rect x={-5} y={5} width="50" height="20" fill="#1c1c1e" fillOpacity="1" stroke="#1c1c1e" />    
          <text x={0} y={0} dy={20} textAnchor={payload.index == 0 ? "start" : payload.index + 1 == data.length ? "end" : "middle"} fill="#636366" fontSize="0.675rem" fontWeight="700">
            { payload.value != "dataMax" && payload.value != "dataMin" ? getFormattedDate(new Date(payload.value), "Mmm-DD", tz) : "" }
          </text>
        </g>
      }
      { longerTick ?
        <line height={30} orientation="bottom" width="1062" x={x} y={y - 22} className="recharts-cartesian-axis-tick-line" stroke="#666" fill="none" x1={x} y1={y + 8} x2={x} y2={y - 4}>
        </line>
      :
        <line height={30} orientation="bottom" width="1062" x={x} y={y - 22} className="recharts-cartesian-axis-tick-line" stroke="#666" fill="none" x1={x} y1={y + 2} x2={x} y2={y + 8}>
        </line>
      }
      <g transform={`translate(${payload.index == 0 ? x - 15 : payload.index + 1 == length ? x + 15 : x}, ${y})`}>
        <text x={0} y={0} dy={23} textAnchor={payload.index == 0 ? "start" : payload.index + 1 == data.length ? "end" : "middle"} fill="#636366" fontSize="0.675rem" fontWeight="700">
          { showHourlyTick || showDailyTick ? 
            getFormattedDate(new Date(payload.value), showHourlyTick ? "HH:mm" : "Mmm-DD", tz) 
          :
            ""
          }
        </text>
      </g>
    </g>;

  }

  const CustomizedYAxisTick = (props) => {

    const { x, y, payload } = props;

    return <>
      <line width={60} orientation="left" height="680" x={5} y={5} className="recharts-cartesian-axis-tick-line" stroke="#666" fill="none" x1={x + 2} y1={y} x2={x + 8} y2={y}>
      </line>
      <text orientation="left" width="60" height="680" x={x} y={y} textAnchor="end" fill="#636366" fontSize="0.675rem" fontWeight="700">
        <tspan x={x} dy="0.355em">{payload.value}</tspan>
      </text>
    </>;

  }

  const CustomizedYAxisIcon = (props) => {

    const { cy, children} = props;

    return <g>
      <foreignObject x={1310} y={cy - 12} width={26} height={26}>
        {children}
      </foreignObject>
    </g>;

  }

  const CustomizedDot = (props) => {

    const { cx, cy, hasActiveAlerts, active, fill } = props;

    return cx && cy && <>
      <circle r="12" cx={cx} cy={cy} fill="transparent"
        onMouseEnter={() => setShowTooltip(true)} onMouseLeave={() => setShowTooltip(false)}
      />
      <circle r="3" stroke="#1c1c1e" strokeWidth="1" fill={hasActiveAlerts ? ALERT_COLOUR : active ? ACTIVE_COLOUR : fill}
        cx={cx} cy={cy} className="recharts-dot recharts-line-dot"
        onMouseEnter={() => setShowTooltip(true)} onMouseLeave={() => setShowTooltip(false)}
      />
      
    </>;

  };

  const showHideClickHandler = (areaId, latestValues) => {

    const visibleAreas = Object.keys(latestValues).filter((item) => latestValues[item]);
    const idx = (show ?? areasToShow).findIndex((item) => item == areaId);
    let newShow = [...(show ?? areasToShow)];
    if (idx >= 0) {

      newShow.splice(idx, 1);

      if (visibleAreas.length > 1) {

        if (activeArea == areaId) setActiveArea(null);
        if (focussedArea == areaId) setFocussedArea("");

      }
      setShow(newShow);
      
    } else {

      newShow.push(areaId);
      if (activeArea != areaId) setActiveArea(areaId);
      setShow(newShow);
  
    }

  };

  const getTotalLabelsLength = (areas, cacls, areasData) => {

    let totalLabelsLength = areas
      .reduce((acc, curr) => curr.enabledFlag && areasData[curr.ENTITY_TYPE_ID.replace("AREA#", "")] ?
        acc += (cacls.find(cacl => curr.PATH.startsWith(cacl.PATH + "#"))?.NAME.length || 0) +
          curr.NAME.length + 3
        : acc, 0);
    return totalLabelsLength;

  };

  const getSelectorButtonHeight = (areas, cacls, areasData) => {

    return getTotalLabelsLength(areas, cacls, areasData) < 85 ? 45 : 88;

  };

  const getSelectorButtonYPos = (areas, cacls, areasData) => {

    return getTotalLabelsLength(areas, cacls, areasData) < 85 ? 520 : 470;

  }

  const getAreaLineChart = (areaId, areaName, caclName, normalColor, fadedColor, buttonColor, hasActiveAlerts, idxLabel, indicesLatestValues) => {

    return <Fragment key={areaId + "_chart"}>
      { indicesLatestValues[areaId] != null && <>
        <Line isAnimationActive={false} yAxisId={`${activeIndex}YAxis`}
          type={chartLineType} dataKey={areaId}
          name={idxLabel} legendType="none" stroke={
          hasActiveAlerts ?
            ALERT_COLOUR
          : (activeArea == areaId && focussedArea == "") || focussedArea == areaId ?
            ACTIVE_COLOUR
          : activeArea == "" && focussedArea == "" ?
            normalColor
          :
            fadedColor
          } dot={<CustomizedDot hasActiveAlerts={hasActiveAlerts} active={activeArea == areaId && focussedArea == ""} fill={(activeArea == areaId && focussedArea == "") || focussedArea == areaId ?
            ACTIVE_COLOUR
          : activeArea == "" && focussedArea == "" ?
            normalColor
          :
            fadedColor} />} activeDot={false} connectNulls={true}
        />
        <ReferenceDot yAxisId={`${activeIndex}YAxis`} y={indicesLatestValues[areaId]} x={data.length > 0 ? data[data.length - 1].displayDate : ""}
          isFront={true} ifOverflow="extendDomain" shape={<CustomizedYAxisIcon>
            <Button variation="link" className={`highlightButton area${activeArea != "" || focussedArea != "" ? " muted" : ""} colour${
              buttonColor.replace("#", "")
            }${!isColourEnabled ? " mono" : ""}${
              (activeArea == areaId && focussedArea == "") || focussedArea == areaId ? " active" : ""
            }`} id={`${areaId}-chart-highlight`}
              data-amplify-analytics-on="click"
              data-amplify-analytics-name={`${activeIndex}ChartClick`}
              data-amplify-analytics-attrs={`clickType:inactive,tenantId:${tenantId}`}
              onMouseEnter={(evt) => setFocussedArea(areaId)} onMouseLeave={(evt) => setFocussedArea("")}
              onClick={(evt) => setActiveArea(areaId)} data-state="active"
              title={(caclName ? caclName + " - " : "") + areaName}>
              <svg width="24" height="24" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13.3319 12.42V16.608C14.2859 15.246 15.4019 13.998 16.6679 12.894C16.9919 12.612 17.3279 12.336 17.6759 12.072C18.1019 11.748 18.5459 11.436 18.9959 11.142L19.5479 11.994C18.8939 12.414 18.2759 12.87 17.6819 13.362C17.3339 13.65 16.9919 13.956 16.6679 14.268C14.0939 16.722 13.0319 18.666 12.3059 21.984H11.5799H10.5179H4.42188L5.00988 22.998H24.9899L25.5779 21.984H13.3679C13.7219 20.538 14.2319 19.152 14.8919 17.838H16.6679H17.6819H18.7499C20.2439 17.838 21.5939 17.232 22.5779 16.248C23.5619 15.264 24.1679 13.908 24.1679 12.42V7.00195H18.7499C17.6639 7.00195 16.6499 7.32595 15.7979 7.88395C15.5159 8.06995 15.2459 8.28595 14.9999 8.51995L14.9219 8.59195C13.9439 9.57595 13.3319 10.932 13.3319 12.42ZM7.42188 16.248C8.40588 17.232 9.75588 17.838 11.2499 17.838H12.1919V12.42C12.1919 12.084 12.2159 11.748 12.2699 11.418C12.3059 11.184 12.3539 10.95 12.4139 10.722C12.7079 9.62995 13.2839 8.62795 14.0879 7.81195C13.2599 7.29595 12.2879 7.00195 11.2499 7.00195H5.83188V12.42C5.83188 13.908 6.43788 15.264 7.42188 16.248Z" fill={(activeArea == areaId && focussedArea == "") || focussedArea == areaId ?
                    ACTIVE_COLOUR
                  : activeArea == "" && focussedArea == "" ?
                    normalColor
                  :
                    fadedColor} />
              </svg>
            </Button>
          </CustomizedYAxisIcon>}
        />
      </> }
    </Fragment>;                

  };

  return <>
    <LineChart
      width={1332}
      height={640}
      data={data}
      margin={{ top: 5, right: 28, bottom: 5, left: 5 }}
    >
      {/* Default y-axis configuration. Only used if no indices are being shown or at least one index has a min / max pair */}
      <YAxis hide={dataMinMax.length > 0 && indicesYAxisTicks.length > 0 && (show ?? areasToShow).length > 0}
        type="number" scale="linear" domain={[0, 100]} interval={0} tickCount={5} ticks={[0, 25, 50, 75, 100]}
        tick={<CustomizedYAxisTick />} tickLine={false}
      />
      {/* Information tooltip */}
      <Tooltip cursor={false} isAnimationActive={false}
        content={<CustomTooltip show={showTooltip} config={measurementConfig} areas={availableAreas} activeIndex={activeIndex} />} />
      { dataMinMax.length > 0 && indicesYAxisTicks.length > 0 && (show ?? areasToShow).length > 0 && <>
        <YAxis yAxisId={`${activeIndex}YAxis`} type="number" scale="linear" domain={dataMinMax}
          interval={0} tickCount={5} ticks={indicesYAxisTicks} tick={<CustomizedYAxisTick />} tickLine={false} />
        <ReferenceLine yAxisId={`${activeIndex}YAxis`} y={indicesYAxisTicks[1]} stroke="#636366" strokeDasharray="2 4" />
        <ReferenceLine yAxisId={`${activeIndex}YAxis`} y={indicesYAxisTicks[2]} stroke="#636366" strokeDasharray="2 4" />
        <ReferenceLine yAxisId={`${activeIndex}YAxis`} y={indicesYAxisTicks[3]} stroke="#636366" strokeDasharray="2 4" />
        {/* Render the normal line chart for each area */}
        { enabledAreas
          .filter(area => {

            const areaId = area.ENTITY_TYPE_ID.replace("AREA#", "");
            return indicesLatestValues[areaId] != null && (show ?? areasToShow).includes(areaId);

          })
          .map((area, idx) => {

            const cacl = cacls.find(cacl => area.PATH.startsWith(cacl.PATH + "#"));
            const areaId = area.ENTITY_TYPE_ID.replace("AREA#", "");

            return getAreaLineChart(areaId, area.NAME, cacl ? cacl.NAME : null, (LINE_AREA_COLOURS[idx] || LINE_AREA_COLOURS[0]),
              (LINE_AREA_COLOURS_FADED[idx] || LINE_AREA_COLOURS_FADED[0]), (AREA_COLOURS[idx] || AREA_COLOURS[0]),
              areaHasActiveAlerts(alerts, area, schedule), measurementConfig[activeIndex.toUpperCase()].label,
              indicesLatestValues);

          })
        }
        {/* Render the highlighted area line chart - do this last so it's on top */}
        { enabledAreas
          .filter((area) => area.ENTITY_TYPE_ID == "AREA#" + (focussedArea == "" ? activeArea : focussedArea))
          .map((area, idx) => {

            const cacl = cacls.find(cacl => area.PATH.startsWith(cacl.PATH + "#"));
            const areaId = area.ENTITY_TYPE_ID.replace("AREA#", "");

            if (!(show ?? areasToShow).includes(areaId) || measurementConfig[activeIndex.toUpperCase()] == undefined) return <Fragment key={areaId + "_chart"}></Fragment>;

            return getAreaLineChart(areaId, area.NAME, cacl ? cacl.NAME : null, null, null, (AREA_COLOURS[idx] || AREA_COLOURS[0]),
              areaHasActiveAlerts(alerts, area, schedule), measurementConfig[activeIndex.toUpperCase()].label,
              indicesLatestValues);

          })
        }
      </> }
      {/* common x-axis */}
      <XAxis dataKey="displayDate" domain={["dataMin", "dataMax"]} interval={0} tickLine={false}
        tick={<CustomizedXAxisTick length={data.length} threshold={threshold}/>} />
      <foreignObject x={64} y={getSelectorButtonYPos(availableAreas, cacls, indicesLatestValues)}
        width={1240} height={getSelectorButtonHeight(availableAreas, cacls, indicesLatestValues)}>
        <View className={styles.indicesChartLabelContainer}>
          <Flex className={styles.indicesChartLabelContent}>
            { enabledAreas
              .filter(area => {

                const areaId = area.ENTITY_TYPE_ID.replace("AREA#", "");
                return indicesLatestValues[areaId] != null;

              })
              .map((area, idx) => {

                const cacl = cacls.find(cacl => area.PATH.startsWith(cacl.PATH + "#"));
                const areaId = area.ENTITY_TYPE_ID.replace("AREA#", "");

                return <View key={area.ENTITY_TYPE_ID + "_selector"} 
                  onMouseOver={(evt) => setFocussedArea((show ?? areasToShow).includes(areaId) ? areaId : "")}
                  onMouseOut={(evt) => setFocussedArea("")}
                  className={activeArea == areaId ?
                    styles.indicesPerformanceChartLabelContainerActive
                  : focussedArea == areaId ?
                    styles.indicesPerformanceChartLabelContainerFocus
                  :
                    styles.indicesPerformanceChartLabelContainer
                  }>
                  <Flex className={styles.indicesPerformanceChartLabel}>
                    <Flex className={styles.indicesPerformanceChartLabelIndicator}>
                      <Image className={styles.areasPerformanceChartLabelIcon} src={`/images/${resourcesPath}/${isMobile ? "" : "desktop-"}${areaIcon}`} alt=""
                        data-amplify-analytics-on="click"
                        data-amplify-analytics-name="areaChartClick"
                        data-amplify-analytics-attrs={`clickType:${activeArea == areaId ? "inactive" : "active"},tenantId:${tenantId}`}
                        onClick={(evt) => {
                          if (!(show ?? areasToShow).includes(areaId)) showHideClickHandler(areaId, indicesLatestValues);
                          setActiveArea(activeArea != areaId ? areaId : "");
                        }} data-state={activeArea == areaId ? "active" : "inactive"}
                      />
                      <View as="p" className={styles.indicesPerformanceChartLabelText}
                        data-amplify-analytics-on="click"
                        data-amplify-analytics-name="areaChartClick"
                        data-amplify-analytics-attrs={`clickType:${activeArea == areaId ? "inactive" : "active"},tenantId:${tenantId}`}
                        onClick={(evt) => {
                          if (!(show ?? areasToShow).includes(areaId)) showHideClickHandler(areaId, indicesLatestValues);
                          setActiveArea(activeArea != areaId ? areaId : "");
                        }} data-state={activeArea == areaId ? "active" : "inactive"}
                      >
                        {(cacl ? cacl.NAME + " - " : "") + area.NAME}
                      </View>
                    </Flex>
                    <View className={styles.indicesPerformanceChartLabelTick} data-amplify-analytics-on="click"
                      data-amplify-analytics-name="areaChartClick"
                      data-amplify-analytics-attrs={`clickType:${activeArea == areaId ? "hide" : "show"},tenantId:${tenantId}`}
                      onClick={(evt) => showHideClickHandler(areaId, indicesLatestValues)}
                      data-state={(show ?? areasToShow).includes(areaId) ? "show" : "hide"}
                    >
                      { (show ?? areasToShow).includes(areaId) ? 
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 22C6.477 22 2 17.523 2 12C2 6.477 6.477 2 12 2C17.523 2 22 6.477 22 12C22 17.523 17.523 22 12 22ZM11.003 16L18.073 8.929L16.659 7.515L11.003 13.172L8.174 10.343L6.76 11.757L11.003 16Z" fill={activeArea == areaId ? isColourEnabled ? (AREA_COLOURS[idx] || AREA_COLOURS[0]) : ACTIVE_COLOUR : isColourEnabled ? (AREA_COLOURS[idx] || AREA_COLOURS[0]) : "#f2f2f7"} />
                        </svg>
                      :
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="12" cy="12" r="9.5" stroke={isColourEnabled ? (AREA_COLOURS[idx] || AREA_COLOURS[0]) : "#f2f2f7"} />
                        </svg>
                      }
                    </View>
                  </Flex>
                </View>;

              })
            }
          </Flex>
        </View>
      </foreignObject>
    </LineChart>
    <View className={styles.areasChartWideXAxisFloating}>
      { tz != "UTC" && sunriseSunsets.map(sunriseSunset => {

        const firstLightLeftPos = (1244 / 100) * getTimeAsPercentageOfPeriod(sunriseSunset.SUNRISE_SUNSET.SUNRISE,
          periodDates.fromDateMs, periodDates.toDateMs);

        const lastLightLeftPos = (1244 / 100) * getTimeAsPercentageOfPeriod(sunriseSunset.SUNRISE_SUNSET.SUNSET,
          periodDates.fromDateMs, periodDates.toDateMs);

        return <Fragment key={sunriseSunset.ENTITY_TYPE_ID}>
          { firstLightLeftPos > 0 && <View as="p" style={{
            top: "-18px",
            left: (firstLightLeftPos - 12) + "px",
            zIndex: 100
          }} title={`Sunrise: ${getFormattedDate(new Date(sunriseSunset.SUNRISE_SUNSET.SUNRISE), "HH:mm:ss", tz)}`}>
            <Image src="/images/daytime-indicator.svg" height={24} width={24} alt="" />  
          </View>}
          { lastLightLeftPos > 0 && <View as="p" style={{
            top: "-18px",
            left: (lastLightLeftPos) + "px",
            zIndex: 100
          }} title={`Sunset: ${getFormattedDate(new Date(sunriseSunset.SUNRISE_SUNSET.SUNSET), "HH:mm:ss", tz)}`}>
            <Image src="/images/nighttime-indicator.svg" height={20} width={20} alt=""/>  
          </View>}
        </Fragment>;

      })}
    </View>
    <Flex className={styles.underContainer}>
      <View className={styles.periodProgressUnderContainer}>
        { isRollingPeriod && <PeriodSelector period={period} defaultPeriod={defaultPeriod}
          tenantId={tenantId} area={area} schedule={schedule}
          periodChangeHandler={periodChangeHandler} showDateRange={true} idPrefix="areas"
          timeUnit={timeUnit} timeUnitHandler={timeUnitHandler} dateRange={dateRange} setDateRangeHandler={setDateRangeHandler} /> }
      </View>
      <View>
        <Button className="standard-button" style={{ width: "4.5rem", marginTop: "0.5rem" }}
          onClick={(evt) => setIndexSelectorIsOpen(!indexSelectorIsOpen)}
          data-tooltip-id="index-tooltip" data-tooltip-variant="light"
          data-tooltip-delay-show={2000}
        >
          <Image src="/images/add.svg" alt="" />
          &nbsp;
          Area
        </Button>
        <ReactTooltip isOpen={indexSelectorIsOpen} id="index-tooltip" className="index-tooltip" place="top-end" offset={10} clickable={true}>
          <View className="react-tooltip-content react-tooltip-content-padded-all react-tooltip-content-light-grey">
            <Flex className={styles.areaHeading}>
              <Image src={`/images/${resourcesPath}/${isMobile ? "" : "desktop-"}${areaIcon}`} alt="" />
              <View as="p" className={styles.areaSelectorTitle}>&nbsp;Areas</View>
            </Flex>
            <Flex>
              { Array.from({ length: areaSelectorColumns }, (_, idx) => {

                if (!editedAreas || !editedAreas.length ||
                  !cacls || !cacls.length) return <Fragment key={`areasCol_${idx}`}></Fragment>;

                const areaSubSet = editedAreas.slice(idx * 32, (idx + 1) * 32);
                let currCacl = cacls.find(cacl => areaSubSet[0].PATH.startsWith(cacl.PATH + "#"));
                let caclName = currCacl?.NAME ?? "";

                return <View key={`areasCol_${idx}`} className={styles.areaColumn}>
                { areaSubSet
                  .map((area) => {
    
                    currCacl = cacls.find(cacl => area.PATH.startsWith(cacl.PATH + "#"));
                    if (currCacl && (currCacl.NAME != caclName)) caclName = currCacl.NAME;

                    return <Flex key={area.ENTITY_TYPE_ID} className={styles.indexSelectorOption}>
                      <View className={styles.indexSelectorOptionLabel}>{caclName}&nbsp;&nbsp;&nbsp;&nbsp;{area.NAME}</View>
                      <View className={styles.indexSelectorOptionIcon}>{<Image src={`/images/tick${area.enabledFlag ? "-active" : ""}.svg`} alt=""
                        onClick={(evt) => addRemoveClickHandler(area.ENTITY_TYPE_ID)} data-state={area.enabledFlag ? "add" : "remove"}
                      />}</View>
                    </Flex>;
                  
                  })
                }
                </View>;

              }) }
            </Flex>
            <Flex className={styles.indexSelectorButtons}>
              <Button className="borderless-button"
                onClick={(evt) => {
                  setIndexSelectorIsOpen(false);
                  cancelClickHandler();
                }}>Cancel</Button>
              <Button className="borderless-button"
                onClick={(evt) => {
                  acceptClickHandler();
                  setIndexSelectorIsOpen(false);
                }}>Accept</Button>
            </Flex>
          </View>
        </ReactTooltip>
      </View>
    </Flex>
  </>;

};

export default AreasComparisonChart;

AreasComparisonChart.propTypes = {
  data: PropTypes.arrayOf(PropTypes.object),
  measurementConfig: PropTypes.object.isRequired,
  editedMeasurements: PropTypes.object,
  editedAreas: PropTypes.arrayOf(PropTypes.object),
  availableAreas: PropTypes.arrayOf(PropTypes.object),
  period: PropTypes.number,
  defaultPeriod: PropTypes.number,
  alerts: PropTypes.arrayOf(PropTypes.object),
  tz: PropTypes.string,
  tenantId: PropTypes.string,
  schedule: PropTypes.object.isRequired,
  area: PropTypes.object.isRequired,
  isRollingPeriod: PropTypes.bool,
  isColourEnabled: PropTypes.bool,
  threshold: PropTypes.number,
  sunriseSunsets: PropTypes.arrayOf(PropTypes.object),
  cacls: PropTypes.arrayOf(PropTypes.object),
  activeIndex: PropTypes.string,
  activeIndexHandler: PropTypes.func,
  periodChangeHandler: PropTypes.func,
  show: PropTypes.arrayOf(PropTypes.string),
  setShowHandler: PropTypes.func,
  chartLineType: PropTypes.string,
  areaIcon: PropTypes.string,
  resourcesPath: PropTypes.string,
  timeUnit: PropTypes.string,
  timeUnitHandler: PropTypes.func,
  dateRange: PropTypes.arrayOf(PropTypes.object),
  setDateRangeHandler: PropTypes.func,
  addRemoveClickHandler: PropTypes.func,
  cancelClickHandler: PropTypes.func,
  acceptClickHandler: PropTypes.func
};