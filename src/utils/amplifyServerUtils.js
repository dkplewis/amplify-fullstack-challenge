import { createServerRunner } from '@aws-amplify/adapter-nextjs';
import { generateServerClientUsingReqRes } from '@aws-amplify/adapter-nextjs/data';
import outputs from '@/aws-outputs/amplify_outputs.json';

export const { runWithAmplifyServerContext } = createServerRunner({
  config: outputs
});

export const reqResBasedClient = generateServerClientUsingReqRes({
  config: outputs
});