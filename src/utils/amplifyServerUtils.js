import { createServerRunner } from '@aws-amplify/adapter-nextjs';
import outputs from '@/aws-outputs/amplify_outputs.json';

export const { runWithAmplifyServerContext } = createServerRunner({
  config: outputs
});