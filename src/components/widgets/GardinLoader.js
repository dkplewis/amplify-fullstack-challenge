import { forwardRef } from 'react';
import { View } from '@aws-amplify/ui-react';
import { getAlertCreatedDayAsPercentageOfCycle, getAlertCreatedDayAsPercentageOfPeriod,
  getAlertResolvedDayAsPercentageOfCycle, getAlertResolvedDayAsPercentageOfPeriod,
  getLatestAlertForArea } from '@/utils/datetime';
import { timeSort } from '@/utils/sort';

import styles from '@/component-styles/widgets/GardinLoader.module.css';

export const LINEAR_BORDER = "linear-border";
export const LINEAR_EMPTY = "linear-empty";
export const LINEAR_GRADIENT = "linear-gradient";
export const LINEAR_FILLED = "linear-filled";
export const LINEAR_ALERT = "linear-alert";
export const LINEAR_RESOLVED = "linear-resolved";
export const LINEAR_DURATION = "linear-duration";
export const CIRCLE_ALERT = "circle-alert";
export const CIRCLE_RESOLVED = "circle-resolved";
export const CIRCLE_PERCENTAGE = "circle-percentage";

const GardinLoaderPrimitive = ({
  variant = "standard",
  className,
  borderColor,
  filledColor,
  emptyColor,
  activeAlertColor,
  resolvedAlertColor,
  gradientStartColor,
  gradientEndColor,
  percentageColor,
  noDataColor,
  size,
  percentage = 0,
  startPercentage = 0,
  endPercentage = 0,
  showActiveAlert = false,
  showResolvedAlert = false,
  showAlertHistory = false,
  showAlertHistoryDuration = false,
  showLatestAlertOnlyInHistory = false,
  showNoData = false,
  area = {
    ENTITY_TYPE_ID: ""
  },
  schedules = [],
  alerts = [],
  periodStart,
  periodEnd,
  threshold,
  isHourly,
  selectedAlert,
  tenantId,
  onClickHandler,
  ...rest
}, ref) => {

  // Calculate filled line x2 value
  percentage = Math.min(percentage, 100);
  percentage = Math.max(percentage, 0);
  const percent = `${percentage}%`;

  // Calculate active alert line x1 value
  startPercentage = Math.min(startPercentage, 100);
  startPercentage = Math.max(startPercentage, 0);
  const startPercent = `${startPercentage}%`;

  // Calculate active alert line x2 value
  let endActivePercentage = Math.min(endPercentage, 100);
  endActivePercentage = Math.max(endActivePercentage, 0);
  const endActivePercent = `${endActivePercentage}%`;

  // Resolved alert end percentage is start percentage + 1
  let endResolvedPercentage = startPercentage + 1;
  const endResolvedPercent = `${endResolvedPercentage}%`;

  const loader = (<>
    { gradientStartColor && gradientEndColor && <defs>
      <linearGradient id="e" x1="0" x2="100%" y1="50%" y2="50%" gradientUnits="userSpaceOnUse">
          <stop stopColor={gradientStartColor} offset="0" />
          <stop stopColor={gradientEndColor} offset="1" />
      </linearGradient>
    </defs> }
    <g>
      { borderColor && <line
        x1="0"
        x2="100%"
        y1="50%"
        y2="50%"
        style={{ stroke: String(borderColor) }}
        data-testid={LINEAR_BORDER}
      /> }
      { emptyColor && <line
        x1="0"
        x2="100%"
        y1={ variant == "standard" ? "50%" : "50%" }
        y2={ variant == "standard" ? "50%" : "50%" }
        style={{ stroke: String(emptyColor), strokeWidth: variant == "standard" ? "0.8rem" : "0.1rem" }}
        data-testid={LINEAR_EMPTY}
      /> }
      { gradientStartColor && gradientEndColor && <line
        x1="0"
        x2="100%"
        y1="50%"
        y2="50%"
        style={{ stroke: "url(#e)" }}
        data-testid={LINEAR_GRADIENT}
      /> }
      { filledColor && <line
        x1="0"
        x2={percent}
        y1="50%"
        y2="50%"
        style={{
          // To get rid of the visible stroke linecap when percentage is 0
          stroke:
            percentage === 0
            ? "none"
            : filledColor
              ? String(filledColor)
              : undefined,
          strokeWidth: variant == "standard" ? "0.7rem" : "0.25rem"
        }}
        data-testid={LINEAR_FILLED}
      /> }
      { showActiveAlert && <g key="activeAlert_duration">
        <line
          x1={startPercent}
          x2={endActivePercent}
          y1="50%"
          y2="50%"
          style={{
            // To get rid of the visible stroke linecap when percentage is 0
            stroke: showNoData ? activeAlertColor : noDataColor,
            strokeWidth: variant == "standard" ? "0.95rem" : "0.45rem"
          }}
          data-testid={LINEAR_ALERT + "_border"}
        />
        <line
          x1={startPercent}
          x2={endActivePercent}
          y1="50%"
          y2="50%"
          style={{
            // To get rid of the visible stroke linecap when percentage is 0
            stroke:
              endActivePercentage === 0
              ? "none"
              : activeAlertColor
                ? String(activeAlertColor)
                : undefined,
            strokeWidth: variant == "standard" ? "0.85rem" : "0.35rem"
          }}
          data-testid={LINEAR_ALERT + "_fill"}
        />
      </g> }
      { showResolvedAlert && <g key="resolvedAlert_duration">
        <line
          x1={startPercent}
          x2={endResolvedPercent}
          y1="50%"
          y2="50%"
          style={{
            // To get rid of the visible stroke linecap when percentage is 0
            stroke: showNoData ? activeAlertColor : noDataColor,
            strokeWidth: variant == "standard" ? "0.95rem" : "0.45rem"
          }}
          data-testid={LINEAR_RESOLVED + "_border"}
        />
        <line
          x1={startPercent}
          x2={endResolvedPercent}
          y1="50%"
          y2="50%"
          style={{
            // To get rid of the visible stroke linecap when percentage is 0
            stroke:
              endResolvedPercentage === 0
              ? "none"
              : resolvedAlertColor
                ? String(resolvedAlertColor)
                : undefined,
            strokeWidth: variant == "standard" ? "0.85rem" : "0.35rem"
          }}
          data-testid={LINEAR_RESOLVED + "_fill"}
        />
      </g> }
      { showAlertHistory && alerts.length &&
        alerts.sort((a, b) => timeSort(a, b, "asc")).map((alert, index, arr) => {

        let output = [];

        if (index + 1 == arr.length) {

          if (showAlertHistoryDuration) {

            output.push(<g key={alert.ENTITY_TYPE_ID + "_duration_" + index}
              id={`resolvedAlertInfo_alert-${alert.ENTITY_TYPE_ID}_tenantId-${tenantId}`}
              data-amplify-analytics-on="click"
              data-amplify-analytics-name="resolvedAlertInfoClick"
              data-amplify-analytics-attrs={`alert:${alert.ENTITY_TYPE_ID},tenantId:${tenantId}`}
              onClick={alert.STATE == "closed_resolved" ?
                (evt) => selectedAlert == index ? onClickHandler(null) : onClickHandler(index)
              :
                undefined
              }
            >
              <line
                x1={(periodStart && periodEnd ?
                  getAlertCreatedDayAsPercentageOfPeriod(alert, area, periodStart, periodEnd, isHourly)
                :
                  getAlertCreatedDayAsPercentageOfCycle(alert, area, schedules)
                ) + "%"}
                x2={(periodStart && periodEnd ?
                  getAlertResolvedDayAsPercentageOfPeriod(alert, area, periodStart, periodEnd, isHourly)
                :
                  getAlertResolvedDayAsPercentageOfCycle(alert, area, schedules)
                ) + "%"}
                y1="50%"
                y2="50%"
                style={{
                  // To get rid of the visible stroke linecap when percentage is 0
                  stroke: showNoData ? activeAlertColor : noDataColor,
                  strokeWidth: variant == "standard" ? "0.95rem" : "0.45rem"
                }}
                data-testid={LINEAR_DURATION + "_border_" + index}
              />
              <line
                x1={(periodStart && periodEnd ?
                  getAlertCreatedDayAsPercentageOfPeriod(alert, area, periodStart, periodEnd, isHourly)
                :
                  getAlertCreatedDayAsPercentageOfCycle(alert, area, schedules)
                ) + "%"}
                x2={(periodStart && periodEnd ?
                  getAlertResolvedDayAsPercentageOfPeriod(alert, area, periodStart, periodEnd, isHourly)
                :
                  getAlertResolvedDayAsPercentageOfCycle(alert, area, schedules)
                ) + "%"}
                y1="50%"
                y2="50%"
                style={{
                  // To get rid of the visible stroke linecap when percentage is 0
                  stroke:
                    (periodStart && periodEnd ?
                      getAlertResolvedDayAsPercentageOfPeriod(alert, area, periodStart, periodEnd, isHourly)
                    :
                      getAlertResolvedDayAsPercentageOfCycle(alert, area, schedules)
                    ) === 0 ?
                      "none"
                    : showNoData ?
                        noDataColor
                      : 
                        activeAlertColor ?
                          String(showNoData ? noDataColor : activeAlertColor)
                        :
                          undefined,
                  strokeWidth: variant == "standard" ? "0.85rem" : "0.35rem",
                  cursor: alert.STATE == "closed_resolved" ? "pointer" : "auto"
                }}
                data-testid={LINEAR_DURATION + "_fill_" + index}
              />
            </g>);

          } else {

            // Display the indicator for when the alert was created, regardless of current state
            output.push(<circle key={alert.ENTITY_TYPE_ID + "_active_" + index}
              cx={(periodStart && periodEnd ?
                getAlertCreatedDayAsPercentageOfPeriod(getLatestAlertForArea(alerts, area.ENTITY_TYPE_ID), area, periodStart, periodEnd, isHourly)
              :  
                getAlertCreatedDayAsPercentageOfCycle(getLatestAlertForArea(alerts, area.ENTITY_TYPE_ID), area, schedules)
              ) + "%"}
              cy="50%"
              r={variant == "standard" ? 9 : 2}
              style={variant == "standard" ?
                {
                  stroke: "#1C1C1E",
                  strokeWidth: "1px",
                  strokeLinejoin: "round",
                  fill:
                    activeAlertColor
                    ? String(activeAlertColor)
                    : undefined
                }
              :
                {
                  strokeLinejoin: "round",
                  fill:
                    activeAlertColor
                    ? String(activeAlertColor)
                    : undefined
                }
              }
              data-testid={CIRCLE_ALERT + "-ACTIVE_" + index}
            />);

            if (alert.CLOSED_AT) {
              output.push(<circle key={alert.id + "_resolved_" + index}
                cx={(periodStart && periodEnd ?
                  getAlertResolvedDayAsPercentageOfPeriod(getLatestAlertForArea(alerts, area.ENTITY_TYPE_ID), area, periodStart, periodEnd, isHourly)
                :
                  getAlertResolvedDayAsPercentageOfCycle(getLatestAlertForArea(alerts, area.ENTITY_TYPE_ID), area, schedules)
                ) + "%"}
                cy="50%"
                r={alert.STATE === "closed_resolved" ? variant == "standard" ? 9 : 2 : 0 }
                style={variant == "standard" ?
                  {
                    stroke: "#1C1C1E",
                    strokeWidth: "1px",
                    strokeLinejoin: "round",
                    fill:
                      alert.STATE === "closed_resolved"
                      ? resolvedAlertColor
                        ? String(resolvedAlertColor)
                        : undefined
                      : undefined
                  }
                :
                  {
                    strokeLinejoin: "round",
                    fill:
                      alert.STATE === "closed_resolved"
                      ? resolvedAlertColor
                        ? String(resolvedAlertColor)
                        : undefined
                      : undefined
                  }
                }
                data-testid={alert.STATE === "closed_resolved" ? CIRCLE_RESOLVED + "-RESOLVED_" + index : null}
              />);
            }

          }

        }

        return output;

      }) }
      { showAlertHistory && alerts.length && alerts.filter(alert => alert.STATE == "active")
      .sort((a, b) => timeSort(a, b, "asc"))
      .map((alert, index) => {

        let output = [];

        if ((showLatestAlertOnlyInHistory && index + 1 == alerts.length) || !showLatestAlertOnlyInHistory) {

          if (showAlertHistoryDuration) {

            output.push(<g key={alert.ENTITY_TYPE_ID + "_duration_" + index}>
              <line
                x1={(periodStart && periodEnd ?
                  getAlertCreatedDayAsPercentageOfPeriod(alert, area, periodStart, periodEnd, isHourly)
                :
                  getAlertCreatedDayAsPercentageOfCycle(alert, area, schedules)
                ) + "%"}
                x2={(periodStart && periodEnd ?
                  getAlertResolvedDayAsPercentageOfPeriod(alert, area, periodStart, periodEnd, isHourly)
                :
                  getAlertResolvedDayAsPercentageOfCycle(alert, area, schedules)
                ) + "%"}
                y1="50%"
                y2="50%"
                style={{
                  // To get rid of the visible stroke linecap when percentage is 0
                  stroke: showNoData && index + 1 == alerts.length ? activeAlertColor : noDataColor,
                  strokeWidth: variant == "standard" ? "0.95rem" : "0.45rem"
                }}
                data-testid={LINEAR_DURATION + "_border_" + index}
              />
              <line
                x1={(periodStart && periodEnd ?
                  getAlertCreatedDayAsPercentageOfPeriod(alert, area, periodStart, periodEnd, isHourly)
                :
                  getAlertCreatedDayAsPercentageOfCycle(alert, area, schedules)
                ) + "%"}
                x2={(periodStart && periodEnd ?
                  getAlertResolvedDayAsPercentageOfPeriod(alert, area, periodStart, periodEnd, isHourly)
                :
                  getAlertResolvedDayAsPercentageOfCycle(alert, area, schedules)
                ) + "%"}
                y1="50%"
                y2="50%"
                style={{
                  // To get rid of the visible stroke linecap when percentage is 0
                  stroke:
                    (periodStart && periodEnd ?
                      getAlertResolvedDayAsPercentageOfPeriod(alert, area, periodStart, periodEnd, isHourly)
                    :
                      getAlertResolvedDayAsPercentageOfCycle(alert, area, schedules)
                    ) === 0 ?
                      "none"
                    : showNoData && index + 1 == alerts.length ?
                        noDataColor
                      : 
                        activeAlertColor ?
                          String(showNoData && index + 1 == alerts.length ? noDataColor : activeAlertColor)
                        :
                          undefined,
                  strokeWidth: variant == "standard" ? "0.85rem" : "0.35rem"
                }}
                data-testid={LINEAR_DURATION + "_fill_" + index}
              />
            </g>);

          } else {

            // Display the indicator for when the alert was created, regardless of current state
            output.push(<circle key={alert.ENTITY_TYPE_ID + "_active_" + index}
              cx={(periodStart && periodEnd ?
                getAlertCreatedDayAsPercentageOfPeriod(getLatestAlertForArea(alerts, area.ENTITY_TYPE_ID), area, periodStart, periodEnd, isHourly)
              :  
                getAlertCreatedDayAsPercentageOfCycle(getLatestAlertForArea(alerts, area.ENTITY_TYPE_ID), area, schedules)
              ) + "%"}
              cy="50%"
              r={variant == "standard" ? 9 : 2}
              style={variant == "standard" ?
                {
                  stroke: "#1C1C1E",
                  strokeWidth: "1px",
                  strokeLinejoin: "round",
                  fill:
                    activeAlertColor
                    ? String(activeAlertColor)
                    : undefined
                }
              :
                {
                  strokeLinejoin: "round",
                  fill:
                    activeAlertColor
                    ? String(activeAlertColor)
                    : undefined
                }
              }
              data-testid={CIRCLE_ALERT + "-ACTIVE_" + index}
            />);

          }

        }

        return output;

      }) }
      { showAlertHistory && alerts.length && alerts.filter(alert => alert.STATE == "closed_resolved")
      .sort((a, b) => timeSort(a, b, "asc"))
      .map((alert, index) => {

        let output = [];

        if ((showLatestAlertOnlyInHistory && index + 1 == alerts.length) || !showLatestAlertOnlyInHistory) {

          if (showAlertHistoryDuration) {

            output.push(<g key={alert.ENTITY_TYPE_ID + "_duration_" + index}
              id={`resolvedAlertInfo_alert-${alert.ENTITY_TYPE_ID}_tenantId-${tenantId}`}
              data-amplify-analytics-on="click"
              data-amplify-analytics-name="resolvedAlertInfoClick"
              data-amplify-analytics-attrs={`alert:${alert.ENTITY_TYPE_ID},tenantId:${tenantId}`}
              onClick={alert.STATE == "closed_resolved" ?
                (evt) => selectedAlert == index ? onClickHandler(null) : onClickHandler(index)
              :
                undefined
              }
            >
              <line
                x1={(periodStart && periodEnd ?
                  getAlertCreatedDayAsPercentageOfPeriod(alert, area, periodStart, periodEnd, isHourly)
                :
                  getAlertCreatedDayAsPercentageOfCycle(alert, area, schedules)
                ) + "%"}
                x2={(periodStart && periodEnd ?
                  getAlertResolvedDayAsPercentageOfPeriod(alert, area, periodStart, periodEnd, isHourly)
                :
                  getAlertResolvedDayAsPercentageOfCycle(alert, area, schedules)
                ) + "%"}
                y1="50%"
                y2="50%"
                style={{
                  // To get rid of the visible stroke linecap when percentage is 0
                  stroke: showNoData && index + 1 == alerts.length ? activeAlertColor : noDataColor,
                  strokeWidth: variant == "standard" ? "0.95rem" : "0.45rem"
                }}
                data-testid={LINEAR_DURATION + "_border_" + index}
              />
              <line
                x1={(periodStart && periodEnd ?
                  getAlertCreatedDayAsPercentageOfPeriod(alert, area, periodStart, periodEnd, isHourly)
                :
                  getAlertCreatedDayAsPercentageOfCycle(alert, area, schedules)
                ) + "%"}
                x2={(periodStart && periodEnd ?
                  getAlertResolvedDayAsPercentageOfPeriod(alert, area, periodStart, periodEnd, isHourly)
                :
                  getAlertResolvedDayAsPercentageOfCycle(alert, area, schedules)
                ) + "%"}
                y1="50%"
                y2="50%"
                style={{
                  // To get rid of the visible stroke linecap when percentage is 0
                  stroke:
                    (periodStart && periodEnd ?
                      getAlertResolvedDayAsPercentageOfPeriod(alert, area, periodStart, periodEnd, isHourly)
                    :
                      getAlertResolvedDayAsPercentageOfCycle(alert, area, schedules)
                    ) === 0 ?
                      "none"
                    : showNoData && index + 1 == alerts.length ?
                        noDataColor
                      : 
                        activeAlertColor ?
                          String(showNoData && index + 1 == alerts.length ? noDataColor : activeAlertColor)
                        :
                          undefined,
                  strokeWidth: variant == "standard" ? "0.85rem" : "0.35rem",
                  cursor: "pointer"
                }}
                data-testid={LINEAR_DURATION + "_fill_" + index}
              />
            </g>);

          } else {

            // Display the indicator for when the alert was created, regardless of current state
            output.push(<circle key={alert.ENTITY_TYPE_ID + "_active_" + index}
              cx={(periodStart && periodEnd ?
                getAlertCreatedDayAsPercentageOfPeriod(getLatestAlertForArea(alerts, area.ENTITY_TYPE_ID), area, periodStart, periodEnd, isHourly)
              :  
                getAlertCreatedDayAsPercentageOfCycle(getLatestAlertForArea(alerts, area.ENTITY_TYPE_ID), area, schedules)
              ) + "%"}
              cy="50%"
              r={variant == "standard" ? 9 : 2}
              style={variant == "standard" ?
                {
                  stroke: "#1C1C1E",
                  strokeWidth: "1px",
                  strokeLinejoin: "round",
                  fill:
                    activeAlertColor
                    ? String(activeAlertColor)
                    : undefined
                }
              :
                {
                  strokeLinejoin: "round",
                  fill:
                    activeAlertColor
                    ? String(activeAlertColor)
                    : undefined
                }
              }
              data-testid={CIRCLE_ALERT + "-ACTIVE_" + index}
            />);

            output.push(<circle key={alert.id + "_resolved_" + index}
              cx={(periodStart && periodEnd ?
                getAlertResolvedDayAsPercentageOfPeriod(getLatestAlertForArea(alerts, area.ENTITY_TYPE_ID), area, periodStart, periodEnd, isHourly)
              :
                getAlertResolvedDayAsPercentageOfCycle(getLatestAlertForArea(alerts, area.ENTITY_TYPE_ID), area, schedules)
              ) + "%"}
              cy="50%"
              r={variant == "standard" ? 9 : 2}
              style={variant == "standard" ?
                {
                  stroke: "#1C1C1E",
                  strokeWidth: "1px",
                  strokeLinejoin: "round",
                  fill:
                    resolvedAlertColor ?
                      String(resolvedAlertColor)
                    :
                      undefined
                }
              :
                {
                  strokeLinejoin: "round",
                  fill:
                    resolvedAlertColor ?
                      String(resolvedAlertColor)
                    :
                      undefined
                }
              }
              data-testid={CIRCLE_RESOLVED + "-RESOLVED_" + index}
            />);

          }

        }

        return output;

      }) }
      { percentageColor && <circle
        cx={percent}
        cy="50%"
        r="6.5"
        style={{
          stroke: "#1C1C1E",
          strokeWidth: "1px",
          strokeLinejoin: "round",
          fill:
            percentageColor
            ? String(percentageColor)
            : undefined
        }}
        data-testid={CIRCLE_PERCENTAGE}
      /> }
    </g>
  </>);

  return (
    <View
      as="svg"
      className={styles.gardinLoader}
      data-size={size}
      data-variation="linear"
      ref={ref}
      role="img"
      {...rest}
    >
      {loader}
    </View>
  );
};

/**
 * [📖 Docs](https://ui.docs.amplify.aws/react/components/loader)
 */
export const GardinLoader = forwardRef(GardinLoaderPrimitive);

GardinLoader.displayName = "GardinLoader";