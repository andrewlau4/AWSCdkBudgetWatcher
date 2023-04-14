import { Construct } from 'constructs';

import * as cdk from 'aws-cdk-lib';
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

export enum StepFunctionLambdaStepsEnv {
  NAME_OF_COGNITO_GROUP_TO_DOWNGRADE = "nameOfCognitoGroupToDowngrade",
  COGNITO_POOL_ID = "cognitoPoolId",
  ROLE_TO_DOWNGRADE_TO_ARN = "roleToDowngradeToArn"
}

export class DowngradeGroupRolesStepFunction extends Construct {

    public readonly stepFuncStateMachine: stepfunctions.StateMachine;

    constructor(scope: Construct, id: string, props: DowngradeGroupRolesStepFunctionProp) {
        super(scope, id);


        const step1Function = new nodejs.NodejsFunction(this, 'step1_remove_grp_role_lambda', {
            runtime: lambda.Runtime.NODEJS_18_X,
            environment: {
              [StepFunctionLambdaStepsEnv.NAME_OF_COGNITO_GROUP_TO_DOWNGRADE]: props.nameOfCognitoGroupToDowngrade,
              [StepFunctionLambdaStepsEnv.COGNITO_POOL_ID]: props.cognitoUserPoolId,
              [StepFunctionLambdaStepsEnv.ROLE_TO_DOWNGRADE_TO_ARN]: props.roleToDowngradeTo.roleArn
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


        const stepFunctions = new stepfunctionstasks.LambdaInvoke(this, "Downgrade Role Of Group", {
          lambdaFunction: step1Function, 
          resultPath: '$.step1Result'
        })

        this.stepFuncStateMachine = new stepfunctions.StateMachine(this, 'BudgetWatcherStateMachine', {
          definition: stepFunctions,
          timeout: cdk.Duration.minutes(5)
        });



    }

}