import PropTypes from 'prop-types';
import { Flex, Loader, Text } from '@aws-amplify/ui-react';

import styles from '@/component-styles/display/Loading.module.css';

const Loading = ({ loadingText }) => {

  return <Flex className={styles.loadingCanvas}>
    <Flex className={styles.loadingContainer}>
      <Loader size="large" width="3.335rem" height="3.335rem" />
      <Text className={styles.loadingText}>
        { loadingText ? loadingText : "Loading ..." }
      </Text>
    </Flex>
  </Flex>;

}

export default Loading;

Loading.propTypes = {
  loadingText: PropTypes.string
};