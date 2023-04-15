import * as iam from 'aws-cdk-lib/aws-iam';

export const STATE_MACHINE_ARN_KEY = "STATE_MACHINE_ARN";

export enum StepFunctionLambdaStepsEnv {
    NAME_OF_COGNITO_GROUP_TO_DOWNGRADE = "nameOfCognitoGroupToDowngrade",
    COGNITO_POOL_ID = "cognitoPoolId",
    IDENTITY_POOL_ID = "identityPoolId",
    ROLE_TO_DOWNGRADE_TO_ARN = "roleToDowngradeToArn",
    ROLE_FOR_UNAUTH_ARN = "roleForUnauthArn"
  };

export interface DowngradeGroupRolesStepFunctionProp {
    nameOfCognitoGroupToDowngrade: string;
    cognitoUserPoolId: string;
    identityPoolId: string;
    roleToDowngradeTo: iam.IRole;
    roleForUnauthenticatedUser: iam.IRole;
};
