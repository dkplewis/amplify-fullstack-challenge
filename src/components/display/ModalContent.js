
//import { isMobile } from 'react-device-detect';
import { Loader,  View } from '@aws-amplify/ui-react';
import Details from '@/components/display/Details';

import styles from '@/component-styles/display/ModalContent.module.css';

const ModalContent = (props) => {

  const isMobile = false;

  return <View className={isMobile ? "isMobile" : "isDesktop"}>
    { props.areaData ? 
      <Details {...props} />
    :
      <View className={styles.loadingContainer}>
        <Loader size="large" emptyColor="#F2F2F7" filledColor="#89BC2B" />
      </View> }
  </View>;

}

export default ModalContent;