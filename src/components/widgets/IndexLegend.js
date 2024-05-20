import PropTypes from 'prop-types';
import { Flex, Text, View } from '@aws-amplify/ui-react';

import styles from '@/component-styles/widgets/IndexLegend.module.css';

const IndexLegend = ({ type = "QE" }) => {

  const thresholds = {
    PHI: ["> 80%", "71 - 80%", "61 - 70%", "51 - 60%", "< 50%" ],
    PS2: ["> 80%", "61 - 80%", "41 - 60%", "21 - 40%", "< 20%"],
    QE: ["> 80%", "71 - 80%", "61 - 70%", "51 - 60%", "< 50%" ]
  };

  return <Flex className={styles.legend} gap={type == "PEI" ? "0.5rem" : "1rem"}>
    <Text as="p" className={styles.label}>{ type == "PUI" || type == "PEI" ? "HI" : "100%" }</Text>
    { Array.from({ length: type == "PEI" ? 9 : 5 }, (_, idx) => {

      return <View key={"key_" + idx} className={styles["key_" + type + "_" + idx]}
        title={thresholds[type] ? thresholds[type][idx] : null}></View>;

    }) }
    <Text as="p" className={styles.label}>{ type == "PUI" || type == "PEI" ? "LOW" : "0%" }</Text>
  </Flex>;

}

export default IndexLegend;

IndexLegend.propTypes = {
  type: PropTypes.string
};