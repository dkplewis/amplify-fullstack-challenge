import { useState, useContext } from 'react';
import PropTypes from 'prop-types';
import { Auth } from 'aws-amplify';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Button, Icon, Image, Link as AmplifyLink, Menu, MenuButton, MenuItem, Text, View } from '@aws-amplify/ui-react';

import { StoreContext } from '@/store/store';

import styles from '@/component-styles/widgets/UserAuth.module.css';

const UserAuth = ({ type, tId, isVisibleHandler = (newIsVisible) => {}, setTownName,
  unsubscribeClient = (newUnsubscribeClient) => {}, disconnectSocket = () => {}, 
  rootLocation, topNavLocations = [], locations = [], tenantHeaderConfig = {} }) => {

  const router = useRouter();
  const currentRoute = router.asPath;

  const { setAnimation, setCurrentTopNavLocation } = useContext(StoreContext);

  const [isOpen, setIsOpen] = useState(false);

  const signOutHandler = async () => {

    try {
      isVisibleHandler != null && isVisibleHandler(false);
      unsubscribeClient(true);
      disconnectSocket();
      setCurrentTopNavLocation("");
      setTownName("");
      setAnimation("none")
      // Use the Auth signOut method rather than the context signOut
      await Auth.signOut();
      // Ensure Firefox clears all auth cookies
      var cookies = document.cookie.split(";");
      for (var i = 0; i < cookies.length; i++) {
        var cookie = cookies[i];
        var eqPos = cookie.indexOf("=");
        var name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
      }
      // Redirect to the index page
      router.push("/");
    } catch (error) {
      console.error(error);
    }

  };

  return <View className={styles.userAuth}>
    { type == "mobile" ?
      <View>
        <Text className={styles.welcomeText} as="span">Welcome, Demo User.</Text>
        {" "}
        <Text className={styles.welcomeText} as="span">
          (Not you? 
          <Button className={styles.signOutLink} variation="link" onClick={signOutHandler}>Sign out</Button>
        )</Text>
      </View>
    :
      <Menu isOpen={isOpen} onOpenChange={setIsOpen} className={styles.userProfile} menuAlign="end" trigger={
        <MenuButton className={styles.welcomeButton} variation="link">
          <View className={styles.welcomeIcon}>
            <Image src="/images/user-profile.svg" alt="" />
          </View>
          <View>Welcome, Demo User</View>
          <View className={styles.expanderIconContainer}>
            <Icon className={isOpen ? styles.expanderOpenIcon : styles.expanderIcon} width="24" height="24" viewBox={{
              width: 24,
              height: 24
            }} pathData="M16.59 8.58984L12 13.1698L7.41 8.58984L6 9.99984L12 15.9998L18 9.99984L16.59 8.58984Z"/>
          </View>
        </MenuButton>
      }>
        { rootLocation && topNavLocations?.length > 1 && topNavLocations.map((topLevelLocation, index) => {

          const topNavLocationPathLen = topLevelLocation.PATH.split("#").length;
          const childLocationsForTopNavLocation = locations?.length > 0 ?
            locations.filter((location) => location.PATH.startsWith(topLevelLocation.PATH + "#") && location.PATH.split("#").length == topNavLocationPathLen + 1)
          : [];
          const defaultLocationForTopNavLocation = childLocationsForTopNavLocation.length > 1 ?
            topLevelLocation
          :
            childLocationsForTopNavLocation.find((location) => location.DEFAULT_LOCATION);

          return <MenuItem key={topLevelLocation.LOCATION_HEADER_KEY + "_" + index}
            className={currentRoute.includes(`/${topLevelLocation.ENTITY_TYPE_ID.replace("LOCATION#", "")}`) ? styles.menuItemActive : styles.menuItem}
          >
            { tenantHeaderConfig[topLevelLocation.LOCATION_HEADER_KEY] ?
              <>
                { defaultLocationForTopNavLocation ?
                  <Link
                    href={"/installation/" +
                      rootLocation.ENTITY_TYPE_ID.replace("LOCATION#", "") + 
                      "/" +
                      topLevelLocation.ENTITY_TYPE_ID.replace("LOCATION#", "") + 
                      
                      (childLocationsForTopNavLocation.length > 1 ? 
                        tenantHeaderConfig[topLevelLocation.LOCATION_HEADER_KEY].childPath
                      :
                        "/" + defaultLocationForTopNavLocation.GSI2_PK.replace("TYPE#", "").toLowerCase()
                      ) +
                      "/" +
                      (childLocationsForTopNavLocation.length > 1 ? 
                        topLevelLocation.ENTITY_TYPE_ID.replace("LOCATION#", "")
                      :
                        defaultLocationForTopNavLocation.ENTITY_TYPE_ID.replace("LOCATION#", "")
                      )
                    } passHref>
                    <AmplifyLink onClick={() => {
                      setIsOpen(false);
                      setCurrentTopNavLocation(topLevelLocation.ENTITY_TYPE_ID.replace("LOCATION#", ""));
                    }}>
                      <Text className={styles.linkText}>
                        {topLevelLocation.NAME}
                      </Text>
                    </AmplifyLink>
                  </Link>
                :
                  <View>
                    <View as="span">
                      <Text className={styles.linkText}>
                        {topLevelLocation.NAME}
                      </Text>
                    </View>
                  </View>
                }
              </>
            :
              <></>
            }
          </MenuItem>
        }) }
        <MenuItem className={styles.menuItem} onClick={() => {}}>
          <View className={styles.signOutLabel}>Not you?</View>
          <View className={styles.signOutButton}>Sign out</View>
        </MenuItem>
      </Menu>
    }
  </View>;

}

export default UserAuth;

UserAuth.propTypes = {
  type: PropTypes.string,
  tId: PropTypes.string,
  isVisibleHandler: PropTypes.func,
  unsubscribeClient: PropTypes.func,
  disconnectSocket: PropTypes.func,
  rootLocation: PropTypes.object.isRequired,
  topNavLocations: PropTypes.arrayOf(PropTypes.object),
  locations: PropTypes.arrayOf(PropTypes.object),
  tenantHeaderConfig: PropTypes.object
};