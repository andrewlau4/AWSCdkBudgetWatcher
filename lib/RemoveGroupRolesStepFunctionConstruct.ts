import { Construct } from 'constructs';

import * as nodejs  from 'aws-cdk-lib/aws-lambda-nodejs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as stepfunctions from 'aws-cdk-lib/aws-stepfunctions';
import * as stepfunctionstasks from 'aws-cdk-lib/aws-stepfunctions-tasks';

export interface DowngradeGroupRolesStepFunctionProp {
    nameOfCognitoGroupToDowngrade: string;
    cognitoUserPoolId: string;
    roleToDowngradeTo: iam.IRole;
};

export class RemoveGroupRolesStepFunction extends Construct {

    constructor(scope: Construct, id: string, props: DowngradeGroupRolesStepFunctionProp) {
        super(scope, id);


        const step1Function = new nodejs.NodejsFunction(this, 'step1_remove_grp_role_lambda', {
            runtime: lambda.Runtime.NODEJS_18_X,
            environment: {
                nameOfCognitoGroupToDowngrade: props.nameOfCognitoGroupToDowngrade,
                cognitoPoolId: props.cognitoUserPoolId,
                roleToDowngradeToArn: props.roleToDowngradeTo.roleArn
            }
        });

        step1Function.role?.attachInlinePolicy(
            new iam.Policy(this, 'removegrp-userpool-iam-policy', {
              statements: [new iam.PolicyStatement({
                actions: [
                  "iam:GetRole",
                  "iam:PassRole"  
                ],
                resources: [
                  props.roleToDowngradeTo.roleArn
                ],
              })],
            })
          );

        const cognitoPool = cognito.UserPool.fromUserPoolId(this, "myCognitoUserPool", 
            props.cognitoUserPoolId);

        cognitoPool.grant(step1Function,
            "cognito-idp:ListGroups",
            "cognito-idp:GetGroup",
            "cognito-idp:ListUserPools"
            );

    }

}