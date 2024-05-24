import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  Measurements: a
    .model({
      createdAt: a.datetime(),
      deletedAt: a.datetime(),
      entityType: a.string().required(),
      entityTypeId: a.string().required(),
      gsi2Pk: a.string().required(),
      gsi3Pk: a.string().required(),
      gsi5Pk: a.string().required(),
      gsi5Sk: a.string().required(),
      measurementAvg: a.integer(),
      measurementMap: a.json(),
      measurementLatest: a.integer()
    })
    .identifier(['entityType', 'entityTypeId'])
    .secondaryIndexes(index => [
      index('gsi5Pk')
      .sortKeys(['gsi5Sk'])
      .queryField('getMeasurementsOfTypeByLocationForDates')
    ])
    .authorization((allow) => [allow.authenticated()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});