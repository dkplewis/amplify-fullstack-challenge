import { Fragment, useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Button, Flex, Heading, Image, Text, View } from '@aws-amplify/ui-react';
import { LineChart, Line, ReferenceDot, ReferenceLine, Tooltip, XAxis, YAxis } from 'recharts';
import { Tooltip as ReactTooltip } from 'react-tooltip';
import PeriodSelector from '@/components/widgets/PeriodSelector';
import { getFormattedDate, getTimeAsPercentageOfPeriod } from '@/utils/datetime';

import genericStyles from '@/page-styles/Generic.module.css';
import styles from '@/component-styles/widgets/PerformanceChart.module.css';

const ACTIVE_COLOUR = "#f2f2f7";
const ALERT_COLOUR = "#f5d205";
const LINE_COLOURS = {
  PHI: {
    colour: "#89bc2b",
    highlight: "rgba(137, 188, 43, 1)",
    fade: "rgba(137, 188, 43, 0.45)"
  },
  PS2: {
    colour: "#f59705",
    highlight: "rgba(245, 151, 5, 1)",
    fade: "rgba(245, 151, 5, 0.45)"
  },
  PUI: {
    colour: "#e84c60",
    highlight: "rgba(232, 76, 96, 1)",
    fade: "rgba(232, 76, 96, 0.45)"
  },
  PEI: {
    colour: "#0589f5",
    highlight: "rgba(5, 137, 245, 1)",
    fade: "rgba(5, 137, 245, 0.45)"
  },
  ETR: {
    colour: "#b605f5",
    highlight: "rgba(182, 5, 245, 1)",
    fade: "rgba(182, 5, 245, 0.45)"
  },
  PAR: {
    colour: "#05eef5",
    highlight: "rgba(5, 238, 245, 1)",
    fade: "rgba(5, 238, 245, 0.45)"
  },
  QE: {
    colour: "#18f537",
    highlight: "rgba(24, 245, 55, 1)",
    fade: "rgba(24, 245, 55, 0.45)"
  },
};

const MeasurementsPerformanceChart = ({ data = [], measurementConfig, period, defaultPeriod, hasActiveAlerts = false, tz = "UTC",
  tenantId, schedule, area, isRollingPeriod, isColourEnabled, threshold, sunriseSunsets = [], activeIndex, activeIndexHandler,
  show, setShowHandler, periodChangeHandler, chartLineType, isDataUpdating, editedMeasurements, periodDates,
  timeUnit, timeUnitHandler, dateRange, setDateRangeHandler, addRemoveClickHandler, cancelClickHandler, acceptClickHandler }) => {

  const [showTooltip, setShowTooltip] = useState(false);
  const [indexSelectorIsOpen, setIndexSelectorIsOpen] = useState(false);
  const [focussedIndex, setFocussedIndex] = useState("");

  // Determine which indices are enabled for the customer
  const enabledMeasurements = useMemo(() => Object.keys(measurementConfig)
    .map((key) => measurementConfig[key].enabled ? key.toLowerCase() : null)
    .filter((item) => item), [measurementConfig]);

  // For each enabled index, get the min and max values from the dataset
  const dataMinMax = useMemo(() => {

    let result = {
      phi: null,
      pei: null,
      ps2: null,
      pui: null,
      etr: null,
      par: null,
      qe: null
    };

    for (let c = 0, len = enabledMeasurements.length; c < len; c += 1) {

      const index = enabledMeasurements[c];
      const minMax = data.reduce((acc, curr) => {

        if (!curr[index]) return acc;
        const currIndexValue = curr[index];
        let roundedDownValue = Math.floor(currIndexValue / 10) * 10;
        let previousTen = currIndexValue % 10 == 0 && (
          index == "phi" || index == "ps2" || index == "etr" || index == "par" || index == "supply" ?
            roundedDownValue > 9
          :
            true
        ) ?
          roundedDownValue - 10
        :
          roundedDownValue;
        let roundedUpValue = Math.ceil(currIndexValue / 10) * 10;
        let nextTen = currIndexValue % 10 == 0 && (
          index == "phi" || index == "ps2" || index == "supply" ?
            roundedUpValue < 91
          : index == "etr" ?
            roundedUpValue < 1991
          : index == "par" ?
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

        const minMaxDiff = (index == "phi" || index == "ps2" || index == "etr" || index == "par" || index == "supply") && minMax[0] > 0 ? 
          Math.floor(Math.abs(minMax[1] - minMax[0]) / 10)
        : index == "pei" || index == "pui" ? 
          Math.floor(Math.abs(minMax[1] - minMax[0]) / 10)
        : 0;
        // Add extra padding to the min value to ensure data points aren't covered by the indices selector buttons
        const padding = (minMax[1] - minMax[0]) / 4;
        minMax[0] -= minMaxDiff + padding;

      }
      result[index] = minMax;

    }

    return result;

  }, [enabledMeasurements, data]);

  // For each enabled index, get the latest index value
  // If two or more indices have the same value, decrease 
  const yAxisLatestPoints = useMemo(() => {

    let result = {
      phi: null,
      pei: null,
      ps2: null,
      pui: null,
      etr: null,
      par: null,
      qe: null
    };

    for (let c = 0, len = enabledMeasurements.length; c < len; c += 1) {

      const index = enabledMeasurements[c];
      const lastIndex = data.findLast(datum => datum[index]);
      const lastValue = lastIndex ? lastIndex[index] : 0;
      result[index] = lastValue;

    }

    return result;

  }, [enabledMeasurements, data]);

  const yAxisTicks = useMemo(() => {

    // For each enabled index, determine the y-axis tick configuration and icon position
    // Four ticks at 25%, 50%, 75% and 100% of the y-axis domain for PHI, PUI and PS2
    // Four ticks at -25, 0, 25 and max value for PEI (fixed values)
    // Icon position will be the percentage of the min / max range where the latest value occurs
    let result = {
      phi: null,
      pei: null,
      ps2: null,
      pui: null,
      etr: null,
      par: null,
      qe: null
    };
    Object.keys(dataMinMax).forEach((key) => {

      const [min, max] = dataMinMax[key] ?
        dataMinMax[key]
      :
        [undefined, undefined];
      if (min != undefined && max != undefined) {

        if (key != "pei") {

          const diff = max - min;
          const initialTick = diff / 4;
          result[key] = [min, min + initialTick, min + (initialTick * 2), min + (initialTick * 3), max];

        } else if (key == "pei") {

          result[key] = [min, -25, 0, 25, max];

        }

      }
      
    });

    return result;

  }, [dataMinMax]);

  const CustomTooltip = (props) => {

    const { active, payload, show = false, config } = props;

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
          <View>
            { payload
              .filter((indexPayload) => ["phi", "pei", "ps2", "pui"].includes(indexPayload.dataKey))
              .sort((a, b) => {
                const aOrder = config[a.dataKey.toUpperCase()].order;
                const bOrder = config[b.dataKey.toUpperCase()].order;
                return aOrder > bOrder ? 1 : aOrder < bOrder ? -1 : 0;
              })
              .map((indexPayload, idx) => {

                return <Flex key={indexPayload.dataKey + "-" + indexPayload.payload.displayDate + "-" + idx} gap="0.5rem" className="custom-tooltip-extraspace">
                  <View className="custom-tooltip-image">
                    <Image className="index-icon" src={`/images/${config[indexPayload.dataKey.toUpperCase()] ?
                      config[indexPayload.dataKey.toUpperCase()].buttonIcon
                    :
                      ""
                    }-active.svg`} alt="" />
                  </View>
                  <Text className="custom-tooltip-label lesspad">{`${indexPayload.value}${["phi", "ps2"].includes(indexPayload.dataKey) ?
                    "%"
                  : indexPayload.dataKey == "pui" && config.PUI?.maxValue ?
                    " out of " + config.PUI.maxValue
                  :
                    ""
                  }`}</Text>
                </Flex>;

              })
            }
          </View>
          <View>
            { payload
              .filter((indexPayload) => ["etr", "par", "supply"].includes(indexPayload.dataKey))
              .sort((a, b) => {
                const aOrder = config[a.dataKey.toUpperCase()].order;
                const bOrder = config[b.dataKey.toUpperCase()].order;
                return aOrder > bOrder ? 1 : aOrder < bOrder ? -1 : 0;
              })
              .map((indexPayload, idx) => {

                return <Flex key={indexPayload.dataKey + "-" + indexPayload.payload.displayDate + "-" + idx} gap="0" className="custom-tooltip-extraspace">
                  <Text className="custom-tooltip-label morepad autocase">{indexPayload.dataKey != "supply" ?
                    indexPayload.dataKey.toUpperCase()
                  :
                    "qE"
                  }&nbsp;=&nbsp;</Text>
                  <Text className="custom-tooltip-label morepad">{indexPayload.value}{indexPayload.dataKey == "supply" ? "%" : ""}</Text>
                </Flex>;

              })
            }
          </View>
        </Flex>
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

    const showTimeTick = (periodDates.isSeconds || periodDates.isMinutes || periodDates.isHourly)
      && (payload.index == 0 || payload.index % Math.ceil(length / 24) == 0);

    const showDayTick = (!(periodDates.isSeconds || periodDates.isMinutes || periodDates.isHourly)
      && (payload.index == 0 || (period / 24 >= 14 ?
        (payload.index + 1) % 7 == 0
      : true))
    ) && payload.value != "dataMax" && payload.value != "dataMin";
  
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
      <g transform={`translate(${payload.index == 0  ? x - (periodDates.isSeconds ? 25 : 15) : payload.index + 1 == length ? x + (periodDates.isSeconds ? 25 : 15) : x}, ${y})`}>
        <text x={0} y={0} dy={23} textAnchor={payload.index == 0 ? "start" : payload.index + 1 == data.length ? "end" : "middle"} fill="#636366" fontSize="0.675rem" fontWeight="700">
          { showTimeTick ?
            getFormattedDate(new Date(payload.value), periodDates.isSeconds ? "HH:mm:ss" : "HH:mm", tz) 
          : showDayTick ?
            getFormattedDate(new Date(payload.value), "Mmm-DD", tz)
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
      <foreignObject x={1310} y={cy - 12} width={22} height={22}>
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
      <circle r="3" stroke="#1c1c1e" strokeWidth="1" fill={hasActiveAlerts ? ALERT_COLOUR : fill}
        cx={cx} cy={cy} className="recharts-dot recharts-line-dot"
        onMouseEnter={() => setShowTooltip(true)} onMouseLeave={() => setShowTooltip(false)}
      />
      
    </>;

  };

  const activeClickHander = (indexType) => {

    const idx = show.findIndex((item) => item == indexType);
    if (idx == -1) {

      let newShow = [...show];
      newShow.push(indexType);
      setShowHandler(newShow);

    }
    
    if (indexType == activeIndex) {

      activeIndexHandler("");

    } else {

      activeIndexHandler(indexType);

    }

  };

  const showHideClickHandler = (indexType, minsMaxes, config) => {

    const visibleMeasurements = Object.keys(minsMaxes)
      .filter((item) => minsMaxes[item] &&
        minsMaxes[item].length != 0 && show.includes(item.toUpperCase()))
      .sort((a, b) => {
        const aOrder = (config[a.toUpperCase()] ?? 0).order;
        const bOrder = (config[b.toUpperCase()] ?? 0).order;
        return aOrder > bOrder ? 1 : aOrder < bOrder ? -1 : 0;
      });
    const idx = show.findIndex((item) => item == indexType);
    const visibleIdx = visibleMeasurements.findIndex((item) => item == indexType.toLowerCase());
    let newShow = [...show];
    if (idx >= 0) {

      newShow.splice(idx, 1);

      if (visibleMeasurements.length > 1) {

        let nextIndex = visibleIdx + 1 == visibleMeasurements.length ?
          visibleMeasurements[visibleIdx - 1]
        : visibleIdx == 0 ? 
          visibleMeasurements[1]
        :
          null;

        if (nextIndex) {

          const nextIndexUC = nextIndex.toUpperCase();
          activeIndexHandler(nextIndexUC);
          setFocussedIndex(nextIndexUC);

        }

        setShowHandler(newShow);

      }

    } else {

      newShow.push(indexType);
      if (activeIndex != indexType) activeIndexHandler(indexType);
      setShowHandler(newShow);
  
    }

  };

  const getTotalLabelsLength = (config, minMaxValues) => {

    let totalLabelsLength = 0;
    for (const [key, values] of Object.entries(config)) {

      if (values.enabled && minMaxValues[key.toLowerCase()] && minMaxValues[key.toLowerCase()].length == 2) totalLabelsLength += values.label.length;

    }
    return totalLabelsLength;

  };

  const getSelectorButtonHeight = (config, minMaxValues) => {

    return getTotalLabelsLength(config, minMaxValues) < 85 ? 45 : 88;

  };

  const getSelectorButtonYPos = (config, minMaxValues) => {

    return getTotalLabelsLength(config, minMaxValues) < 85 ? 520 : 470;

  }

  return <>
    <View className={styles.healthPerformanceChart}>
      <View className={styles.headingContainer}>
        <Heading className={genericStyles.h2Heading} level={2}>Index Data</Heading>
      </View>
      { Object.keys(dataMinMax).map((index) => {

        const indexUC = index.toUpperCase();
        return measurementConfig[indexUC] && !!measurementConfig[indexUC].description ?
          <ReactTooltip key={`${indexUC}-tooltip`} id={`${indexUC}-tooltip`}
            place="top-start" offset={5}>
            <View className="react-tooltip-content react-tooltip-content-padded-rbl react-tooltip-content-dark-grey">
              <Flex className="tooltipContent">
                <Image className="index-type-button" src={`/images/${measurementConfig[indexUC].buttonIcon}-active.svg`}
                  alt="" title={measurementConfig[indexUC].label} />
                <Text className={genericStyles.measurementDescriptionText}>{measurementConfig[indexUC].description}</Text>
              </Flex>
            </View>
          </ReactTooltip>
        :
          <Fragment key={`${indexUC}-tooltip`}></Fragment>;

      }) }
      <LineChart
        width={1332}
        height={640}
        data={data}
        margin={{ top: 5, right: 28, bottom: 5, left: 5 }}
      >
        {/* Default y-axis configuration. Only used if no indices are being shown or at least one index has a min / max pair */}
        <YAxis hide={show.length != 0 && ((dataMinMax.phi ?? []).length > 0 || (dataMinMax.pui ?? []).length > 0 || (dataMinMax.ps2 ?? []).length > 0 || (dataMinMax.pei ?? []).length > 0 ||
            (dataMinMax.etr ?? []).length > 0 || (dataMinMax.par ?? []).length > 0 || (dataMinMax.qe ?? []).length > 0)}
          type="number" scale="linear" domain={[0, 100]} interval={0} tickCount={5} ticks={[0, 25, 50, 75, 100]}
          tick={<CustomizedYAxisTick />} tickLine={false}
        />
        {/* y-axis configurations */}
        {/* Current default set */}
        { (dataMinMax.phi ?? []).length && <YAxis yAxisId="phiYAxis" type="number" scale="linear" domain={dataMinMax.phi} interval={0} tickCount={5} ticks={yAxisTicks.phi} tick={<CustomizedYAxisTick />} tickLine={false}
          hide={!(
            show.includes("PHI") && (
              (activeIndex == null && focussedIndex == "") || 
              (activeIndex == "PHI" && focussedIndex == "") || 
              focussedIndex == "PHI"
            )
          )}
        /> }
        { (dataMinMax.pei ?? []).length && <YAxis yAxisId="peiYAxis" type="number" scale="linear" domain={dataMinMax.pei} interval={0} tickCount={5} ticks={yAxisTicks.pei} tick={<CustomizedYAxisTick />} tickLine={false}
          hide={!(
            show.includes("PEI") && (
              (
                !(show.includes("PHI") && (dataMinMax.phi ?? []).length > 0) &&
                !(show.includes("SUPPLY") && (dataMinMax.qe ?? []).length > 0) && 
                !(show.includes("ETR") && (dataMinMax.etr ?? []).length > 0) &&
                activeIndex == null && focussedIndex == ""
              ) || 
              (activeIndex == "PEI" && focussedIndex == "") || 
              focussedIndex == "PEI"
            )
          )}
        /> }
        { (dataMinMax.etr ?? []).length && <YAxis yAxisId="etrYAxis" type="number" scale="linear" domain={dataMinMax.etr} interval={0} tickCount={5} ticks={yAxisTicks.etr} tick={<CustomizedYAxisTick />} tickLine={false}
          hide={!(
            show.includes("ETR") && (
              (
                !(show.includes("PHI") && (dataMinMax.phi ?? []).length > 0) && 
                !(show.includes("SUPPLY") && (dataMinMax.qe ?? []).length > 0) && 
                activeIndex == null && focussedIndex == ""
              ) || 
              (activeIndex == "ETR" && focussedIndex == "") || 
              focussedIndex == "ETR"
            )
          )}
        /> }
        { (dataMinMax.qe ?? []).length && <YAxis yAxisId="qeYAxis" type="number" scale="linear" domain={dataMinMax.qe} interval={0} tickCount={5} ticks={yAxisTicks.qe} tick={<CustomizedYAxisTick />} tickLine={false}
          hide={!(
            show.includes("SUPPLY") && (
              (
                !(show.includes("PHI") && (dataMinMax.phi ?? []).length > 0) && 
                activeIndex == null && focussedIndex == ""
              ) || 
              (activeIndex == "SUPPLY" && focussedIndex == "") || 
              focussedIndex == "SUPPLY"
            )
          )}
        /> }
        {/* Current default set */}
        {/* Historic indices */}
        { (dataMinMax.pui ?? []).length && <YAxis yAxisId="puiYAxis" type="number" scale="linear" domain={dataMinMax.pui} interval={0} tickCount={5} ticks={yAxisTicks.pui} tick={<CustomizedYAxisTick />} tickLine={false}
          hide={!(
            show.includes("PUI") && (
              (
                !(show.includes("PHI") && (dataMinMax.phi ?? []).length > 0) &&
                !(show.includes("SUPPLY") && (dataMinMax.qe ?? []).length > 0) && 
                !(show.includes("ETR") && (dataMinMax.etr ?? []).length > 0) &&
                !(show.includes("PEI") && (dataMinMax.pei ?? []).length > 0) &&
                activeIndex == null && focussedIndex == ""
              ) || 
              (activeIndex == "PUI" && focussedIndex == "") || 
              focussedIndex == "PUI"
            )
          )}
        /> }
        { (dataMinMax.par ?? []).length && <YAxis yAxisId="parYAxis" type="number" scale="linear" domain={dataMinMax.par} interval={0} tickCount={5} ticks={yAxisTicks.par} tick={<CustomizedYAxisTick />} tickLine={false}
          hide={!(
            show.includes("PAR") && (
              (
                !(show.includes("PHI") && (dataMinMax.phi ?? []).length > 0) &&
                !(show.includes("SUPPLY") && (dataMinMax.qe ?? []).length > 0) && 
                !(show.includes("ETR") && (dataMinMax.etr ?? []).length > 0) &&
                !(show.includes("PEI") && (dataMinMax.pei ?? []).length > 0) &&
                !(show.includes("PUI") && (dataMinMax.pui ?? []).length > 0) &&
                activeIndex == null && focussedIndex == ""
              ) || 
              (activeIndex == "PAR" && focussedIndex == "") || 
              focussedIndex == "PAR"
            )
          )}
        /> }
        { (dataMinMax.ps2 ?? []).length && <YAxis yAxisId="ps2YAxis" type="number" scale="linear" domain={dataMinMax.ps2} interval={0} tickCount={5} ticks={yAxisTicks.ps2} tick={<CustomizedYAxisTick />} tickLine={false}
          hide={!(
            show.includes("PS2") && (
              (
                !(show.includes("PHI") && (dataMinMax.phi ?? []).length > 0) &&
                !(show.includes("SUPPLY") && (dataMinMax.qe ?? []).length > 0) && 
                !(show.includes("ETR") && (dataMinMax.etr ?? []).length > 0) &&
                !(show.includes("PEI") && (dataMinMax.pei ?? []).length > 0) &&
                !(show.includes("PUI") && (dataMinMax.pui ?? []).length > 0) &&
                !(show.includes("PAR") && (dataMinMax.par ?? []).length > 0) &&
                activeIndex == null && focussedIndex == ""
              ) || 
              (activeIndex == "PS2" && focussedIndex == "") || 
              focussedIndex == "PS2"
            )
          )}
        /> }
        {/* Historic indices */}
        {/* Information tooltip */}
        <Tooltip cursor={false} isAnimationActive={false}
          content={<CustomTooltip show={showTooltip} config={measurementConfig} />} />
        {/* Default line charts for each index. Shown when the index is *not* active, i.e. green or coloured line
            Contains the left-hand y-axis, the right-hand index icon and the graph line */}
        { Object.keys(measurementConfig)
          .sort((a, b) => {
            const aOrder = measurementConfig[a].order;
            const bOrder = measurementConfig[b].order;
            return aOrder > bOrder ? 1 : aOrder < bOrder ? -1 : 0;
          })
          .map((key) => {

            const keyLC = key.toLowerCase();

            return <Fragment key={key + "_defaultLine"}>
              { (dataMinMax[keyLC] ?? []).length && (activeIndex != key || (activeIndex == key && focussedIndex != "" && focussedIndex != key)) &&
                <>
                  { show.includes(key) && data[data.length - 1] && <ReferenceDot yAxisId={keyLC + "YAxis"} y={yAxisLatestPoints[keyLC]} x={data[data.length - 1].displayDate}
                    isFront={true} ifOverflow="extendDomain" shape={<CustomizedYAxisIcon>
                      <Button variation="link" className={`highlightButton ${keyLC}${!isColourEnabled ? " mono" : ""}${focussedIndex != "" || (activeIndex ?? "") != "" ? " muted" : ""}`} id={keyLC + "-chart-highlight"}
                        data-amplify-analytics-on="click"
                        data-amplify-analytics-name={keyLC + "ChartClick"}
                        data-amplify-analytics-attrs={`clickType:active,tenantId:${tenantId}`}
                        onMouseEnter={(evt) => setFocussedIndex(key)}
                        onClick={(evt) => activeIndexHandler(key)} data-state="inactive">
                          <Image src={`/images/${measurementConfig[key].buttonIcon}.svg`} alt="" />
                      </Button>
                    </CustomizedYAxisIcon>}
                  /> }
                  <Line isAnimationActive={false} hide={!show.includes(key)} yAxisId={keyLC + "YAxis"} type={chartLineType} dataKey={keyLC}
                    name={measurementConfig[key].label} legendType="none" stroke={
                    hasActiveAlerts ?
                      ALERT_COLOUR
                    : isColourEnabled ?
                      !focussedIndex  && !activeIndex ? LINE_COLOURS[key].highlight : LINE_COLOURS[key].fade
                    :
                      "#89bc2b"
                    } dot={<CustomizedDot hasActiveAlerts={hasActiveAlerts} active={false} fill={isColourEnabled ?
                      !focussedIndex && !activeIndex ? LINE_COLOURS[key].highlight : LINE_COLOURS[key].fade
                    :
                      "#89bc2b"
                    } />}
                    activeDot={false}
                  />
                </>
              }
              </Fragment>;

          })
        }
        {/* Active line chart for each index. Only shown when the index is active, i.e. white line
            Contains the left-hand y-axis, reference lines, right-hand index icon and graph line.
            These must be included after the default line charts to ensure that the active index chart
            is shown on top of all other indices charts */}
        { Object.keys(measurementConfig)
          .sort((a, b) => {
            const aOrder = measurementConfig[a].order;
            const bOrder = measurementConfig[b].order;
            return aOrder > bOrder ? 1 : aOrder < bOrder ? -1 : 0;
          })
          .map((key) => {

            const keyLC = key.toLowerCase();

            return <Fragment key={key + "_activeLine"}>
              { (dataMinMax[keyLC] ?? []).length && (yAxisTicks[keyLC] ?? []).length &&
                (focussedIndex == key || (activeIndex == key && focussedIndex == "")) && <>
                <ReferenceLine yAxisId={keyLC + "YAxis"} y={yAxisTicks[keyLC][1]} stroke="#636366" strokeDasharray="2 4" />
                <ReferenceLine yAxisId={keyLC + "YAxis"} y={yAxisTicks[keyLC][2]} stroke="#636366" strokeDasharray="2 4" />
                <ReferenceLine yAxisId={keyLC + "YAxis"} y={yAxisTicks[keyLC][3]} stroke="#636366" strokeDasharray="2 4" />
                { data[data.length - 1] && <ReferenceDot yAxisId={keyLC + "YAxis"} y={yAxisLatestPoints[keyLC]} x={data[data.length - 1].displayDate}
                  isFront={true} ifOverflow="extendDomain" shape={<CustomizedYAxisIcon>
                    <Button variation="link" className={`highlightButton ${keyLC}${!isColourEnabled ? " mono" : ""}${(activeIndex == key && focussedIndex == "") || focussedIndex == key ? " active" : ""}`} id={keyLC + "-chart-highlight"}
                      data-amplify-analytics-on="click"
                      data-amplify-analytics-name={keyLC + "ChartClick"}
                      data-amplify-analytics-attrs={`clickType:inactive,tenantId:${tenantId}`}
                      onMouseLeave={(evt) => setFocussedIndex("")}
                      onClick={(evt) => activeIndexHandler(key)} data-state="active">
                        <Image src={`/images/${measurementConfig[key].buttonIcon}-active.svg`} alt="" />
                    </Button>
                  </CustomizedYAxisIcon>}
                /> }
                <Line isAnimationActive={false} yAxisId={keyLC + "YAxis"} type={chartLineType} dataKey={keyLC} name={measurementConfig[key].label} legendType="none" stroke={
                  hasActiveAlerts ?
                    ALERT_COLOUR
                  : false && isColourEnabled ?
                    LINE_COLOURS[key].highlight
                  :
                    ACTIVE_COLOUR
                  } dot={<CustomizedDot hasActiveAlerts={hasActiveAlerts} active={true} fill={false && isColourEnabled ?
                    LINE_COLOURS[key].highlight
                  :
                    ACTIVE_COLOUR} />} activeDot={false}
                />
              </> }
            </Fragment>;

          })
        }
        {/* common x-axis */}
        <XAxis dataKey="displayDate" domain={["dataMin", "dataMax"]} interval={0} tickLine={false}
          tick={<CustomizedXAxisTick length={data.length} threshold={threshold}/>} />
        <foreignObject x={64} y={getSelectorButtonYPos(measurementConfig, dataMinMax)} width={1240} height={getSelectorButtonHeight(measurementConfig, dataMinMax)}>
          <View className={styles.indicesChartLabelContainer}>
            <Flex className={styles.indicesChartLabelContent}>
            { Object.keys(measurementConfig)
                .sort((a, b) => {
                  const aOrder = measurementConfig[a].order;
                  const bOrder = measurementConfig[b].order;
                  return aOrder > bOrder ? 1 : aOrder < bOrder ? -1 : 0;
                })
                .map((key) => {

                  const keyLC = key.toLowerCase();

                  return dataMinMax[keyLC] && dataMinMax[keyLC].length != 0 ?
                    <View key={key + "_selectorButton"}
                      onMouseOver={(evt) => setFocussedIndex(show.includes(key) ? key : "")} onMouseOut={(evt) => setFocussedIndex("")}
                      className={activeIndex == key ?
                        styles.indicesPerformanceChartLabelContainerActive
                      : focussedIndex == key ?
                        styles.indicesPerformanceChartLabelContainerFocus
                      :
                        styles.indicesPerformanceChartLabelContainer
                      }>
                      <Flex className={styles.indicesPerformanceChartLabel}>
                        <Flex className={styles.indicesPerformanceChartLabelIndicator}>
                          <Image className={styles.indicesPerformanceChartLabelIcon} src={"/images/" + measurementConfig[key].buttonIcon + "-active.svg"} alt=""
                            data-amplify-analytics-on="click"
                            data-amplify-analytics-name={keyLC + "ChartClick"}
                            data-amplify-analytics-attrs={`clickType:${activeIndex == key ? "inactive" : "active"},tenantId:${tenantId}`}
                            onClick={(evt) => activeClickHander(key)} data-state={activeIndex == key ? "active" : "inactive"}
                          />
                          <View as="p" className={styles.indicesPerformanceChartLabelText}
                            data-amplify-analytics-on="click"
                            data-amplify-analytics-name={keyLC + "ChartClick"}
                            data-amplify-analytics-attrs={`clickType:${activeIndex == key ? "inactive" : "active"},tenantId:${tenantId}`}
                            onClick={(evt) => activeClickHander(key)} data-state={activeIndex == key ? "active" : "inactive"}
                          >
                            {measurementConfig[key].label}
                          </View>
                        </Flex>
                        <View className={styles.indicesPerformanceChartLabelTick} data-amplify-analytics-on="click"
                          data-amplify-analytics-name={keyLC + "ChartClick"}
                          data-amplify-analytics-attrs={`clickType:${activeIndex == key ? "hide" : "show"},tenantId:${tenantId}`}
                          onClick={(evt) => showHideClickHandler(key, dataMinMax, measurementConfig)} data-state={show.includes(key) ? "show" : "hide"}
                        >
                          { show.includes(key) ? 
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12 22C6.477 22 2 17.523 2 12C2 6.477 6.477 2 12 2C17.523 2 22 6.477 22 12C22 17.523 17.523 22 12 22ZM11.003 16L18.073 8.929L16.659 7.515L11.003 13.172L8.174 10.343L6.76 11.757L11.003 16Z"
                                fill={activeIndex == key ? isColourEnabled ? LINE_COLOURS[key].colour : ACTIVE_COLOUR : isColourEnabled ? LINE_COLOURS[key].colour : "#f2f2f7"} />
                            </svg>
                          :
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <circle cx="12" cy="12" r="9.5" stroke={isColourEnabled ? LINE_COLOURS[key].colour : "#f2f2f7"} />
                            </svg>
                          }
                        </View>
                      </Flex>
                    </View>
                  :
                    <Fragment key={key + "_selectorButton"}></Fragment>;

                })
              }
            </Flex>
          </View>
        </foreignObject>
      </LineChart>
      <View className={styles.chartWideXAxisFloating}>
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
    </View>
    <Flex className={styles.underContainer}>
      <View className={styles.periodProgressUnderContainer}>
        { isRollingPeriod && <PeriodSelector period={period} defaultPeriod={defaultPeriod}
          tenantId={tenantId} area={area} schedule={schedule}
          periodChangeHandler={periodChangeHandler} showDateRange={true} idPrefix="indices"
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
          Index
        </Button>
        <ReactTooltip isOpen={indexSelectorIsOpen} id="index-tooltip" className="index-tooltip" place="top-end" offset={10} clickable={true}>
          <View className="react-tooltip-content react-tooltip-content-padded-all react-tooltip-content-light-grey">
            <View as="p" className={styles.indexSelectorTitle}>&nbsp;Index</View>
            { Object.keys(editedMeasurements)
              .sort((a, b) => {
                const aOrder = measurementConfig[a].order;
                const bOrder = measurementConfig[b].order;
                return aOrder > bOrder ? 1 : aOrder < bOrder ? -1 : 0;
              })
              .map((key) => {

                const measurement = editedMeasurements[key];
              
                return <Flex key={measurement.buttonIcon} className={styles.indexSelectorOption}>
                  <View className={styles.indexSelectorOptionLabel}>&nbsp;{measurement.label}</View>
                  <View className={styles.indexSelectorOptionIcon}>{<Image src={`/images/tick${measurement.enabledFlag ? "-active" : ""}.svg`} alt=""
                    onClick={(evt) => addRemoveClickHandler(key)} data-state={measurement.enabledFlag ? "add" : "remove"}
                  />}</View>
                </Flex>;

              })
            }
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
                  setFocussedIndex("");
                }}>Accept</Button>
            </Flex>
          </View>
        </ReactTooltip>
      </View>
    </Flex>
  </>;

};

export default MeasurementsPerformanceChart;

MeasurementsPerformanceChart.propTypes = {
  data: PropTypes.arrayOf(PropTypes.object),
  measurementConfig: PropTypes.object.isRequired,
  editedMeasurements: PropTypes.object,
  period: PropTypes.number,
  defaultPeriod: PropTypes.number,
  hasActiveAlerts: PropTypes.bool,
  tz: PropTypes.string,
  tenantId: PropTypes.string,
  schedule: PropTypes.object.isRequired,
  area: PropTypes.object.isRequired,
  isRollingPeriod: PropTypes.bool,
  isColourEnabled: PropTypes.bool,
  isDataUpdating: PropTypes.bool,
  threshold: PropTypes.number,
  sunriseSunsets: PropTypes.arrayOf(PropTypes.object),
  activeIndex: PropTypes.string,
  activeIndexHandler: PropTypes.func,
  periodChangeHandler: PropTypes.func,
  show: PropTypes.arrayOf(PropTypes.string),
  setShowHandler: PropTypes.func,
  chartLineType: PropTypes.string,
  timeUnit: PropTypes.string,
  timeUnitHandler: PropTypes.func,
  dateRange: PropTypes.arrayOf(PropTypes.object),
  setDateRangeHandler: PropTypes.func,
  addRemoveClickHandler: PropTypes.func,
  cancelClickHandler: PropTypes.func,
  acceptClickHandler: PropTypes.func
};