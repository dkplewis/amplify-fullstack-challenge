
import { Loader,  View } from '@aws-amplify/ui-react';
import Details from '@/components/display/Details';

import styles from '@/component-styles/display/ModalContent.module.css';

const ModalContent = (props) => {

  return <View className="isDesktop">
    { props.areaData ? 
      <Details {...props} />
    :
      <View className={styles.loadingContainer}>
        <Loader size="large" />
      </View> }
  </View>;

}

export default ModalContent;