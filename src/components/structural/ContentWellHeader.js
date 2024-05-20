import PropTypes from 'prop-types';
import { Flex, Text, View } from '@aws-amplify/ui-react';

import genericStyles from '@/page-styles/Generic.module.css';

const ContentWellHeader = ({ siteName, showSiteName = true, children }) => {

  return <View className={`contentWellHeader ${genericStyles.contentWellHeader}`}>
    <Flex className={genericStyles.contentWellHeading}>
      { children }
    </Flex>
    { showSiteName && <Text className={genericStyles.siteName}>{ siteName }</Text> }
  </View>;

}

export default ContentWellHeader;

ContentWellHeader.propTypes = {
  children: PropTypes.object,
  siteName: PropTypes.string,
  showSiteName: PropTypes.bool
};