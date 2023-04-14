import { Context } from 'aws-lambda';

import { CognitoIdentityClient, CreateIdentityPoolCommand, ListIdentitiesCommand, 
    ListIdentitiesCommandOutput,

    GetIdentityPoolRolesCommand,

    GetIdentityPoolRolesCommandInput,
    GetIdentityPoolRolesCommandOutput,

    SetIdentityPoolRolesCommand,
    SetIdentityPoolRolesCommandInput,
    SetIdentityPoolRolesCommandOutput
 } from "@aws-sdk/client-cognito-identity";

import { CognitoIdentityProviderClient, AddCustomAttributesCommand, AdminAddUserToGroupCommand,
     ListGroupsCommand, ListGroupsCommandInput, ListGroupsCommandOutput, ListIdentityProvidersCommand, GroupType,
        ProviderDescription, UpdateGroupCommand, UpdateGroupCommandInput, UpdateGroupCommandOutput 
    } from "@aws-sdk/client-cognito-identity-provider";

import { StepFunctionLambdaStepsEnv } from './DowngradeGroupRolesStepFunctionConstruct';

export type DowngradeGroupResult = {
    [k: string]: {
        originlGroupArn?: string;
        afterGroupArn: string;
    }
}

export const handler = async (event: any, context: Context): Promise<any> => {

    const result: DowngradeGroupResult = {};

    if (!process.env[StepFunctionLambdaStepsEnv.COGNITO_POOL_ID] 
        || !process.env[StepFunctionLambdaStepsEnv.ROLE_TO_DOWNGRADE_TO_ARN]) {
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
        listGrpResponse.Groups?.forEach(
            (value: GroupType, index: number, array: GroupType[]) => {
                if (value.GroupName) {
                    if (process.env[StepFunctionLambdaStepsEnv.NAME_OF_COGNITO_GROUP_TO_DOWNGRADE]
                        ?.toLocaleLowerCase().includes(value.GroupName!.toLocaleLowerCase().trim())
                        && value.RoleArn != process.env[StepFunctionLambdaStepsEnv.ROLE_TO_DOWNGRADE_TO_ARN]
                        ) {

                            const updateGrpInput: UpdateGroupCommandInput = { 
                                GroupName: value.GroupName,
                                UserPoolId: userPoolId,
                                Description: value.Description,
                                RoleArn: process.env[StepFunctionLambdaStepsEnv.ROLE_TO_DOWNGRADE_TO_ARN],
                                Precedence: value.Precedence  
                            };

                        removeRoleFromGrpResultPromiseArray.push(
                            identityProviderclient.send(new UpdateGroupCommand(updateGrpInput))); 
                            
                        result[value.GroupName!].originlGroupArn = value.RoleArn;

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
                
                console.log(`removed result: group ${value.Group!.GroupName} 
                    rolearn ${value.Group!.RoleArn}`);
            }
        )
    }

    return result;
}