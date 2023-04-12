import { SNSEvent, Context } from 'aws-lambda';
import { SFNClient, StartExecutionCommand } from "@aws-sdk/client-sfn";

export const handler = async (event: SNSEvent, context: Context): Promise<void> => {

    return;
}