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
     ListGroupsCommand, ListIdentityProvidersCommand, GroupType,
        ProviderDescription, UpdateGroupCommand, UpdateGroupCommandOutput 
    } from "@aws-sdk/client-cognito-identity-provider";

export const handler = async (event: any, context: Context): Promise<any> => {

    if (!process.env.cognitoPoolId || !process.env.roleToDowngradeToArn) {
        console.log('nothing to do, empty cognito pool arguments');
        return;
    }


    const identityProviderclient = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION });



}