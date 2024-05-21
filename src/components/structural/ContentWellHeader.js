import PropTypes from 'prop-types';
import { Flex, Text, View } from '@aws-amplify/ui-react';

import genericStyles from '@/page-styles/Generic.module.css';

const ContentWellHeader = ({ townName, showTownName = true, children }) => {

  return <View className={`contentWellHeader ${genericStyles.contentWellHeader}`}>
    <Flex className={genericStyles.contentWellHeading}>
      { children }
    </Flex>
    { showTownName && <Text className={genericStyles.townName}>{ townName }</Text> }
  </View>;

}

export default ContentWellHeader;

ContentWellHeader.propTypes = {
  children: PropTypes.object,
  townName: PropTypes.string,
  showTownName: PropTypes.bool
};