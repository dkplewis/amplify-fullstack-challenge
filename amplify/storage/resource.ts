import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'amplifyFullstackChallenge',
  access: (allow) => ({
    'areadetail/*': [
      allow.authenticated.to(['read','write']),
      allow.guest.to(['read'])
    ],
  }),
});