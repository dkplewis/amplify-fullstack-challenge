import { Fragment, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Flex, Heading, Image, Text, View } from '@aws-amplify/ui-react';
import { AreaChart, Area, Tooltip, XAxis, YAxis } from 'recharts';
import PeriodSelector from '@/components/widgets/PeriodSelector';
import { getFormattedDate } from '@/utils/datetime';

import genericStyles from '@/page-styles/Generic.module.css';
import styles from '@/component-styles/widgets/PerformanceChart.module.css';

const LINE_COLOURS = {
  DEMAND: {
    colour: "#f59705",
    highlight: "rgba(245, 151, 5, 1)",
    fade: "rgba(245, 151, 5, 0.45)"
  },
  SUPPLY: {
    colour: "#0589f5",
    highlight: "rgba(5, 137, 245, 1)",
    fade: "rgba(5, 137, 245, 0.45)"
  }
};

const MeasurementsPerformanceChart = ({ data = [], measurementConfig, period, defaultPeriod, tz = "UTC",
  tenantId, schedule, area, isRollingPeriod, threshold, periodChangeHandler, chartLineType, periodDates,
  timeUnit, timeUnitHandler, dateRange, setDateRangeHandler }) => {

  // Determine which measures are enabled for the customer
  const enabledMeasurements = useMemo(() => Object.keys(measurementConfig)
    .map((key) => measurementConfig[key].enabled ? key.toLowerCase() : null)
    .filter((item) => item), [measurementConfig]);

  // For each enabled measure, get the min and max values from the dataset
  const dataMinMax = useMemo(() => {

    let result = {
      supply: null,
      demand: null
    };

    for (let c = 0, len = enabledMeasurements.length; c < len; c += 1) {

      const measure = enabledMeasurements[c];
      const minMax = data.reduce((acc, curr) => {

        if (!curr[measure]) return acc;
        const currIndexValue = curr[measure];
        let roundedDownValue = Math.floor(currIndexValue / 10) * 10;
        let previousTen = currIndexValue % 10 == 0 && roundedDownValue > 9 ?
          roundedDownValue - 10
        :
          roundedDownValue;
        let roundedUpValue = Math.ceil(currIndexValue / 10) * 10;
        let nextTen = currIndexValue % 10 == 0 && roundedUpValue < 91 ?
          roundedUpValue + 10
        :
          roundedUpValue;
        acc[0] = (acc[0] === undefined || previousTen < acc[0]) ? previousTen : acc[0];
        acc[1] = (acc[1] === undefined || nextTen > acc[1]) ? nextTen : acc[1];
        return acc;

      }, []);
      result[measure] = minMax;

    }

    return result;

  }, [enabledMeasurements, data]);

  const CustomTooltip = (props) => {

    const { active, payload, config } = props;

    if (active && payload && payload.length) {

      return <View className="custom-tooltip">
        <Flex className="custom-tooltip-date-time">
          <View className="custom-tooltip-image">
            <Image src={"/images/calendar.svg"} alt="" width={24} height={24} />
          </View>
          <Text className="custom-tooltip-label">
            {getFormattedDate(new Date(payload[0].payload.displayDate), "Mmm-DD-YYYY", tz)}
          </Text>
          { payload[0].payload.isHourly && <>
            <View className="custom-tooltip-image">
              <Image src={"/images/time-active.svg"} alt="" width={24} height={24}  />
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
              .filter((measurePayload) => ["supply", "demand"].includes(measurePayload.dataKey))
              .sort((a, b) => {
                const aOrder = config[a.dataKey.toUpperCase()].order;
                const bOrder = config[b.dataKey.toUpperCase()].order;
                return aOrder > bOrder ? 1 : aOrder < bOrder ? -1 : 0;
              })
              .map((measurePayload, idx) => {

                return <Flex key={measurePayload.dataKey + "-" + measurePayload.payload.displayDate + "-" + idx} gap="0.5rem" className="custom-tooltip-extraspace">
                  <View className="custom-tooltip-image">
                    <Image className="measure-icon" src={`/images/${config[measurePayload.dataKey.toUpperCase()] ?
                      config[measurePayload.dataKey.toUpperCase()].buttonIcon
                    :
                      ""
                    }-active.svg`} alt="" width={24} height={24}  />
                  </View>
                  <Text className="custom-tooltip-label lesspad">{measurePayload.name} - {measurePayload.value}%</Text>
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

    const showTimeTick = periodDates.isHourly
      && (payload.index == 0 || payload.index % Math.ceil(length / 24) == 0);

    const showDayTick = (!periodDates.isHourly
      && (payload.index == 0 || (period / 24 >= 14 ?
        (payload.index + 1) % 7 == 0
      : true))
    ) && payload.value != "dataMax" && payload.value != "dataMin";
  
    return <g transform={`translate(0, -16)`}>
      { periodDates.isHourly && payload.value.indexOf("T00:00:") != -1 && 
        <g transform={`translate(${payload.index == 0 ? x - 20 : payload.index + 1 == length ? x + 15 : x}, ${y - 30})`}>
          <text x={0} y={0} dy={20} textAnchor={payload.index == 0 ? "start" : payload.index + 1 == data.length ? "end" : "middle"} fontSize="0.675rem" fontWeight="700">
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
      <g transform={`translate(${payload.index == 0  ? x - 15 : payload.index + 1 == length ? x + 15 : x}, ${y})`}>
        <text x={0} y={0} dy={23} textAnchor={payload.index == 0 ? "start" : payload.indexre + 1 == data.length ? "end" : "middle"} fill="#636366" fontSize="0.675rem" fontWeight="700">
          { showTimeTick ?
            getFormattedDate(new Date(payload.value), "HH:mm", tz) 
          : showDayTick ?
            getFormattedDate(new Date(payload.value), "Mmm-DD", tz)
          :
            ""
          }
        </text>
      </g>
    </g>;

  }

  return <>
    <View className={styles.healthPerformanceChart}>
      <View className={styles.headingContainer}>
        <Heading className={genericStyles.h2Heading} level={2}>Supply vs Demand</Heading>
      </View>
      <AreaChart
        width={1332}
        height={640}
        data={data}
        margin={{ top: 5, right: 28, bottom: 5, left: 5 }}
      >
        {/* y-axis configurations */}
        <YAxis domain={[0,100]} tickFormatter={(value) => `${value}%`} />
        {/* Information tooltip */}
        <Tooltip content={<CustomTooltip config={measurementConfig} />} />
        {/* Default line charts for each measure. Shown when the measure is *not* active, i.e. green or coloured line
            Contains the left-hand y-axis, the right-hand measure icon and the graph line */}
        { Object.keys(measurementConfig)
          .sort((a, b) => {
            const aOrder = measurementConfig[a].order;
            const bOrder = measurementConfig[b].order;
            return aOrder > bOrder ? 1 : aOrder < bOrder ? -1 : 0;
          })
          .map((key) => {

            const keyLC = key.toLowerCase();

            return <Fragment key={key + "_defaultLine"}>
              { (dataMinMax[keyLC] ?? []).length && 
                <Area type={chartLineType} dataKey={keyLC}
                  name={measurementConfig[key].label} legendType="none" stroke={LINE_COLOURS[key].highlight}
                  fill={LINE_COLOURS[key].highlight}
                />
              }
              </Fragment>;

          })
        }
        {/* common x-axis */}
        <XAxis dataKey="displayDate" domain={["dataMin", "dataMax"]} interval={0} tickLine={false}
          tick={<CustomizedXAxisTick length={data.length} threshold={threshold}/>} />
      </AreaChart>
    </View>
    <Flex className={styles.underContainer}>
      <View className={styles.periodProgressUnderContainer}>
        { isRollingPeriod && <PeriodSelector period={period} defaultPeriod={defaultPeriod}
          tenantId={tenantId} area={area} schedule={schedule}
          periodChangeHandler={periodChangeHandler} showDateRange={true} idPrefix="measures"
          timeUnit={timeUnit} timeUnitHandler={timeUnitHandler} dateRange={dateRange} setDateRangeHandler={setDateRangeHandler} /> }
      </View>
    </Flex>
  </>;

};

export default MeasurementsPerformanceChart;

MeasurementsPerformanceChart.propTypes = {
  data: PropTypes.arrayOf(PropTypes.object),
  measurementConfig: PropTypes.object.isRequired,
  period: PropTypes.number,
  defaultPeriod: PropTypes.number,
  tz: PropTypes.string,
  tenantId: PropTypes.string,
  schedule: PropTypes.object.isRequired,
  area: PropTypes.object.isRequired,
  isRollingPeriod: PropTypes.bool,
  isColourEnabled: PropTypes.bool,
  isDataUpdating: PropTypes.bool,
  threshold: PropTypes.number,
  periodChangeHandler: PropTypes.func,
  chartLineType: PropTypes.string,
  timeUnit: PropTypes.string,
  timeUnitHandler: PropTypes.func,
  dateRange: PropTypes.arrayOf(PropTypes.object),
  setDateRangeHandler: PropTypes.func,
};