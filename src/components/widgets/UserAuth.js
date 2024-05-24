import { useState, useContext } from 'react';
import PropTypes from 'prop-types';
import { useRouter } from 'next/router';
import { Icon, Image, Menu, MenuButton, MenuItem, useAuthenticator, View } from '@aws-amplify/ui-react';

import { StoreContext } from '@/store/store';

import styles from '@/component-styles/widgets/UserAuth.module.css';

const UserAuth = ({ isVisibleHandler = (newIsVisible) => {}, setTownName }) => {

  const { user, signOut } = useAuthenticator((context) => [context.user]);

  const router = useRouter();

  const { setCurrentTopNavLocation } = useContext(StoreContext);

  const [isOpen, setIsOpen] = useState(false);

  const signOutHandler = async () => {

    try {
      isVisibleHandler != null && isVisibleHandler(false);
      setCurrentTopNavLocation("");
      setTownName("");
      signOut();
      // Ensure Firefox clears all auth cookies
      var cookies = document.cookie.split(";");
      for (var i = 0; i < cookies.length; i++) {
        var cookie = cookies[i];
        var eqPos = cookie.indexOf("=");
        var name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
      }
      // Redirect to the measure page
      router.push("/");
    } catch (error) {
      console.error(error);
    }

  };

  return <View className={styles.userAuth}>
    <Menu isOpen={isOpen} onOpenChange={setIsOpen} className={styles.userProfile} menuAlign="end" trigger={
      <MenuButton className={styles.welcomeButton} variation="link">
        <View className={styles.welcomeIcon}>
          <Image src="/images/user-profile.svg" alt="" />
        </View>
        <View>Welcome, {user.signInDetails.loginId}</View>
        <View className={styles.expanderIconContainer}>
          <Icon className={isOpen ? styles.expanderOpenIcon : styles.expanderIcon} width="24" height="24" viewBox={{
            width: 24,
            height: 24
          }} pathData="M16.59 8.58984L12 13.1698L7.41 8.58984L6 9.99984L12 15.9998L18 9.99984L16.59 8.58984Z"/>
        </View>
      </MenuButton>
    }>
      <MenuItem className={styles.menuItem} onClick={signOutHandler}>
        <View className={styles.signOutLabel}>Not you?</View>
        <View className={styles.signOutButton}>Sign out</View>
      </MenuItem>
    </Menu>
  </View>;

}

export default UserAuth;

UserAuth.propTypes = {
  isVisibleHandler: PropTypes.func,
  setTownName: PropTypes.func
};