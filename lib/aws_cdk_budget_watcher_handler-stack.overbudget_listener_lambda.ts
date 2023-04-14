import { SNSEvent, Context } from 'aws-lambda';
import { SFNClient, StartExecutionCommand, StartExecutionCommandInput } from "@aws-sdk/client-sfn";

import { STATE_MACHINE_ARN_KEY } from './Constants';

export const handler = async (event: SNSEvent, context: Context): Promise<void> => {

    console.log("overbudget listener is called");

    const sfnClient = new SFNClient({ region: process.env.AWS_REGION });

    const today = new Date();
    const params: StartExecutionCommandInput = {
        stateMachineArn: process.env[STATE_MACHINE_ARN_KEY],
        name: `OVERBUDGET_STEP_FUNCTION_EXECUTED_ON_${today.getFullYear() + '_' + today.getMonth() 
        + '_' + today.getDate() + '_' +  today.getHours() + '_' + today.getMinutes() + '_' + today.getSeconds() }`
    };

    const command = new StartExecutionCommand(params);

    console.log("overbudget listener going to execute command");
    const sfnResponse = await sfnClient.send(command)

    console.log(`Over Budget Listener execute result ${JSON.stringify(sfnResponse, null, 2)}`)

    return;
}