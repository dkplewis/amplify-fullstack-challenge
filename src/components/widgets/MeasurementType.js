import PropTypes from 'prop-types';
import { MdInfo } from 'react-icons/md';
import { Flex, Heading, Image, ToggleButton, ToggleButtonGroup, Text, View } from '@aws-amplify/ui-react';
import { Tooltip } from 'react-tooltip';
import { orderSort } from '@/utils/sort';

import genericStyles from '@/page-styles/Generic.module.css';
import styles from '@/component-styles/widgets/MeasurementType.module.css';

const MeasurementType = ({ current, options, locationId, tenantId, onChangeHandler }) => {

  return <>
    <Flex className={styles.headingContainer}>
      <Heading className={genericStyles.h4Heading} level={4}>
        {options[current].label}
      </Heading>
      { options[current].description && <View className={styles.infoIcon}
        data-tooltip-id={current + "-areasview-tooltip"} data-tooltip-variant="light"
        data-tooltip-delay-show={250}>
        <MdInfo />
      </View> }
    </Flex>
    { Object.keys(options).length > 1 && <ToggleButtonGroup value={current}
      onChange={(value) => onChangeHandler(value)} isExclusive isSelectionRequired
      className={styles.toggleButtonGroup}>
      { options && Object.keys(options).sort((a, b) => orderSort(options[a], options[b], "asc")).map((option, index) => {

        return options[option].enabled && options[option].displayOnView != "details" && <ToggleButton
          key={option}
          value={option}
          className={option == "PEI" ?
            current == option ? styles.toggleButtonAdjustedActive : styles.toggleButtonAdjusted
          :
            current == option ? styles.toggleButtonActive : styles.toggleButton
          }
          id={`indexType-${option}_location-${locationId}_tenantId-${tenantId}`}
          data-amplify-analytics-on="click"
          data-amplify-analytics-name="indexTypeChange"
          data-amplify-analytics-attrs={`indexType:${option},location:${locationId},tenantId:${tenantId}`}
        >
          <Image className="index-type-button" src={"/images/" + options[option].buttonIcon + (current == option ? "-active" : "") + ".svg"} alt="" title={options[option].label} />
        </ToggleButton>;

      }) }
    </ToggleButtonGroup> }
    { options && options[current].description && <>
      <Tooltip key={current + "_tooltip"} id={current + "-areasview-tooltip"} place="bottom-start">
        <View className="react-tooltip-content react-tooltip-content-padded-rbl react-tooltip-content-dark-grey">
          <Flex className="tooltipContent">
            <Image className="index-type-button" src={"/images/" + options[current].buttonIcon + "-active.svg"} alt="" title={options[current].label} />
            <Text className={genericStyles.measurementDescriptionText}>{options[current].description}</Text>
          </Flex>
        </View>
      </Tooltip>
    </> }
  </>;

}

export default MeasurementType;

MeasurementType.propTypes = {
  current: PropTypes.string.isRequired,
  options: PropTypes.object.isRequired,
  locationId: PropTypes.string,
  tenantId: PropTypes.string,
  onChangeHandler: PropTypes.func.isRequired
};