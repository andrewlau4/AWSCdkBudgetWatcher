
import { Context } from 'aws-lambda';

import { StepFunctionLambdaStepsEnv } from './Constants';

import { CognitoIdentityClient, ListIdentitiesCommand, ListIdentitiesCommandInput, ListIdentitiesCommandOutput,
    GetIdentityPoolRolesCommand, GetIdentityPoolRolesCommandInput, GetIdentityPoolRolesCommandOutput, SetIdentityPoolRolesCommand,
    SetIdentityPoolRolesCommandInput, SetIdentityPoolRolesCommandOutput
} from "@aws-sdk/client-cognito-identity";


enum IdentityPoolAuthenticationState {
    Auth = "authenticated",
    UnAuth = "unauthenticated"
}

type DowngradeIdentityRolesResult = {
    [key in IdentityPoolAuthenticationState]?: {
        originlGroupArn?: string;
        afterGroupArn?: string;
    }
}

export const handler = async (event: any, context: Context): Promise<any> => {
    const result: DowngradeIdentityRolesResult = {};

    if (!process.env[StepFunctionLambdaStepsEnv.IDENTITY_POOL_ID]?.trim() 
        || !process.env[StepFunctionLambdaStepsEnv.ROLE_TO_DOWNGRADE_TO_ARN]?.trim()
        || !process.env[StepFunctionLambdaStepsEnv.ROLE_FOR_UNAUTH_ARN]?.trim()
        ) {
        console.log('required env variable is empty, nothing to do');
        return result;
    }

    const identityPoolId = process.env[StepFunctionLambdaStepsEnv.IDENTITY_POOL_ID];

    const identityClient = new CognitoIdentityClient({ region: process.env.AWS_REGION });

    const listIdentitiesInput: ListIdentitiesCommandInput = {
        IdentityPoolId: identityPoolId, 
        MaxResults: 50, 
        HideDisabled: true,
    };
    const listIdentitiesCommand: ListIdentitiesCommand = new ListIdentitiesCommand(listIdentitiesInput);

    const listIdentitiesResult: ListIdentitiesCommandOutput = await identityClient.send(listIdentitiesCommand);

    const getIdentityPoolRolesInput: GetIdentityPoolRolesCommandInput = {
       IdentityPoolId: identityPoolId
    };
    const getIdentityPoolRolesCommand: GetIdentityPoolRolesCommand = new GetIdentityPoolRolesCommand(getIdentityPoolRolesInput);

    const getIdentityPoolRolesResult: GetIdentityPoolRolesCommandOutput = await identityClient.send(getIdentityPoolRolesCommand);

    if (Object.keys(getIdentityPoolRolesResult.Roles ?? {}).includes(IdentityPoolAuthenticationState.Auth)) {
        
        result[IdentityPoolAuthenticationState.Auth] = {};
        result[IdentityPoolAuthenticationState.UnAuth] = {};

        
        const setidentitypoolrolescommandinput: SetIdentityPoolRolesCommandInput  = {
            IdentityPoolId: identityPoolId,
            Roles: {
                [IdentityPoolAuthenticationState.Auth]: process.env[StepFunctionLambdaStepsEnv.ROLE_TO_DOWNGRADE_TO_ARN]
            },
            RoleMappings: {
                ...getIdentityPoolRolesResult.RoleMappings
            }
            
        };

        result[IdentityPoolAuthenticationState.Auth].originlGroupArn = 
            getIdentityPoolRolesResult.Roles![IdentityPoolAuthenticationState.Auth];
        result[IdentityPoolAuthenticationState.Auth].afterGroupArn = 
            process.env[StepFunctionLambdaStepsEnv.ROLE_TO_DOWNGRADE_TO_ARN];    
        
        if (Object.keys(getIdentityPoolRolesResult.Roles ?? {}).includes(IdentityPoolAuthenticationState.UnAuth)) {
            result[IdentityPoolAuthenticationState.UnAuth].originlGroupArn = 
                getIdentityPoolRolesResult.Roles![IdentityPoolAuthenticationState.UnAuth] ?? "";
            result[IdentityPoolAuthenticationState.UnAuth].afterGroupArn = 
                process.env[StepFunctionLambdaStepsEnv.ROLE_FOR_UNAUTH_ARN];

            setidentitypoolrolescommandinput.Roles![IdentityPoolAuthenticationState.UnAuth] =
                process.env[StepFunctionLambdaStepsEnv.ROLE_FOR_UNAUTH_ARN];
        }
        
        
        const setIdentityPoolRoleResponse: SetIdentityPoolRolesCommandOutput = 
            await identityClient.send(new SetIdentityPoolRolesCommand(setidentitypoolrolescommandinput));

        console.log(`setIdentityPoolRoleResponse statusCode: ${setIdentityPoolRoleResponse.$metadata.httpStatusCode}`);
        
    }

    return result;

}