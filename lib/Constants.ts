import * as iam from 'aws-cdk-lib/aws-iam';

export const STATE_MACHINE_ARN_KEY = "STATE_MACHINE_ARN";

export enum StepFunctionLambdaStepsEnv {
    NAME_OF_COGNITO_GROUP_TO_DOWNGRADE = "nameOfCognitoGroupToDowngrade",
    COGNITO_POOL_ID = "cognitoPoolId",
    ROLE_TO_DOWNGRADE_TO_ARN = "roleToDowngradeToArn"
  };

export interface DowngradeGroupRolesStepFunctionProp {
    nameOfCognitoGroupToDowngrade: string;
    cognitoUserPoolId: string;
    roleToDowngradeTo: iam.IRole;
};
