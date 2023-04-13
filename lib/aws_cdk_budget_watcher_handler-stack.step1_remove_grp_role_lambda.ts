import { Context } from 'aws-lambda';

import { CognitoIdentityClient, CreateIdentityPoolCommand, ListIdentitiesCommand, 
    ListIdentitiesCommandOutput,
    //https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-cognito-identity/classes/getidentitypoolrolescommand.html
    GetIdentityPoolRolesCommand,
    //https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-cognito-identity/interfaces/getidentitypoolrolescommandoutput.html
    GetIdentityPoolRolesCommandInput,
    GetIdentityPoolRolesCommandOutput,

    //https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-cognito-identity/classes/setidentitypoolrolescommand.html
    SetIdentityPoolRolesCommand,
    SetIdentityPoolRolesCommandInput,
    SetIdentityPoolRolesCommandOutput
 } from "@aws-sdk/client-cognito-identity";

//https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-cognito-identity-provider/
import { CognitoIdentityProviderClient, AddCustomAttributesCommand, AdminAddUserToGroupCommand,
     ListGroupsCommand, ListIdentityProvidersCommand, GroupType,
        ProviderDescription, UpdateGroupCommand, UpdateGroupCommandOutput 
    } from "@aws-sdk/client-cognito-identity-provider";

