import PropTypes from 'prop-types';
import { Alert, Card, Flex, Text } from '@aws-amplify/ui-react';

const DataLoadError = ({ dataLoadError }) => {

  return <Flex height="90vh" justifyContent="center" alignItems="center">
    <Card variation="elevated" width="36rem">
      <Alert variation="error" isDismissible={false} hasIcon={true} heading="Data error">
        <Text>{dataLoadError}</Text>
        { dataLoadError && dataLoadError.indexOf("status code 401") !== -1 ?
          <Text>
            <br />
            The app isn&apos;t allowed to use the data API right now.
          </Text>
        : "" }
      </Alert>
    </Card>
  </Flex>;

}

export default DataLoadError;

DataLoadError.propTypes = {
  dataLoadError: PropTypes.string
};