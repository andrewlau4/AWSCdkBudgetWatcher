import { Context } from 'aws-lambda';

import { CognitoIdentityProviderClient,
    ListGroupsCommand, ListGroupsCommandInput, GroupType,
    UpdateGroupCommand, UpdateGroupCommandInput, UpdateGroupCommandOutput 
    } from "@aws-sdk/client-cognito-identity-provider";

import { StepFunctionLambdaStepsEnv } from './Constants';

type DowngradeGroupResult = {
    [k: string]: {
        originlGroupArn?: string;
        afterGroupArn?: string;
    }
}

export const handler = async (event: any, context: Context): Promise<any> => {

    const result: DowngradeGroupResult = {};

    if (!process.env[StepFunctionLambdaStepsEnv.COGNITO_POOL_ID]?.trim() 
        || !process.env[StepFunctionLambdaStepsEnv.ROLE_TO_DOWNGRADE_TO_ARN]?.trim()) {
        console.log('nothing to do, empty cognito pool arguments');
        return result;
    }

    const identityProviderclient = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION });

    const userPoolId = process.env[StepFunctionLambdaStepsEnv.COGNITO_POOL_ID];

    const ListGrpCmdInput: ListGroupsCommandInput = { // ListGroupsRequest
        UserPoolId: userPoolId, 
        Limit: 50
      };
    const listGrpsCommand: ListGroupsCommand = new ListGroupsCommand(ListGrpCmdInput);

    const listGrpResponse = await identityProviderclient.send(listGrpsCommand);

    const removeRoleFromGrpResultPromiseArray: Array<Promise<UpdateGroupCommandOutput>> = [];

    if (listGrpResponse.Groups?.length) {

        const groupsToDowngrade = process.env[StepFunctionLambdaStepsEnv.NAME_OF_COGNITO_GROUP_TO_DOWNGRADE]
                            ?.trim().toLocaleLowerCase().split(/\s*,\s*/);

        listGrpResponse.Groups?.forEach(
            (value: GroupType, index: number, array: GroupType[]) => {
                if (value.GroupName) {
                    if (groupsToDowngrade!.includes(value.GroupName!.toLocaleLowerCase().trim())
                        && value.RoleArn != process.env[StepFunctionLambdaStepsEnv.ROLE_TO_DOWNGRADE_TO_ARN]
                        ) {

                        console.log(`Going to downgrade: ${JSON.stringify(value)}`)

                        const updateGrpInput: UpdateGroupCommandInput = { 
                                GroupName: value.GroupName,
                                UserPoolId: userPoolId,
                                Description: value.Description,
                                RoleArn: process.env[StepFunctionLambdaStepsEnv.ROLE_TO_DOWNGRADE_TO_ARN],
                                Precedence: value.Precedence  
                            };

                        removeRoleFromGrpResultPromiseArray.push(
                            identityProviderclient.send(new UpdateGroupCommand(updateGrpInput))); 
                        
                        if (!result[value.GroupName!]) {
                            result[value.GroupName!] = {};
                        }
                        result[value.GroupName!].originlGroupArn = value.RoleArn ?? '';

                    }
                }
            }
        );
    }

    if (removeRoleFromGrpResultPromiseArray.length) {
        const removeRoleFromGrpResult = await Promise.all(removeRoleFromGrpResultPromiseArray);
        removeRoleFromGrpResult.forEach(
            (value: UpdateGroupCommandOutput) => {
                result[value.Group!.GroupName!].afterGroupArn = value.Group!.RoleArn!;

                console.log(`downgrade result: group ${value.Group!.GroupName} 
                    rolearn ${value.Group!.RoleArn}`);
            }
        )
    }

    return result;
}