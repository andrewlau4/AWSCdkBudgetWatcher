import { Construct } from 'constructs';

import * as cdk from 'aws-cdk-lib';
import * as nodejs  from 'aws-cdk-lib/aws-lambda-nodejs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as stepfunctions from 'aws-cdk-lib/aws-stepfunctions';
import * as stepfunctionstasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { StepFunctionLambdaStepsEnv, DowngradeGroupRolesStepFunctionProp } from './Constants';

export class DowngradeGroupRolesStepFunction extends Construct {

    public readonly stepFuncStateMachine: stepfunctions.StateMachine;

    constructor(scope: Construct, id: string, props: DowngradeGroupRolesStepFunctionProp) {
        super(scope, id);


        const step1Function = new nodejs.NodejsFunction(this, 'step1_downgrade_grp_role_lambda', {
            runtime: lambda.Runtime.NODEJS_18_X,
            environment: {
              [StepFunctionLambdaStepsEnv.NAME_OF_COGNITO_GROUP_TO_DOWNGRADE]: props.nameOfCognitoGroupToDowngrade,
              [StepFunctionLambdaStepsEnv.COGNITO_POOL_ID]: props.cognitoUserPoolId,
              [StepFunctionLambdaStepsEnv.ROLE_TO_DOWNGRADE_TO_ARN]: props.roleToDowngradeTo.roleArn
            }
        });

        step1Function.role?.attachInlinePolicy(
            new iam.Policy(this, 'downgradegrp-userpool-iam-policy', {
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

        const step2Function = new nodejs.NodejsFunction(this, 'step2_downgrade_identity_user_role_lambda', {
            runtime: lambda.Runtime.NODEJS_18_X,
            environment: {
              [StepFunctionLambdaStepsEnv.IDENTITY_POOL_ID]: props.identityPoolId,
              [StepFunctionLambdaStepsEnv.ROLE_TO_DOWNGRADE_TO_ARN]: props.roleToDowngradeTo.roleArn,
              [StepFunctionLambdaStepsEnv.ROLE_FOR_UNAUTH_ARN]: props.roleForUnauthenticatedUser.roleArn
            }
        });

        step2Function.role?.attachInlinePolicy(
            new iam.Policy(this, 'downgrade-identitypool-iam-policy', {
              statements: [new iam.PolicyStatement({
                actions: [
                  "iam:GetRole",
                  "iam:PassRole"  
                ],
                resources: [
                  props.roleToDowngradeTo.roleArn,
                  props.roleForUnauthenticatedUser.roleArn
                ],
              })],
            })
          );


        const cognitoPool = cognito.UserPool.fromUserPoolId(this, "myCognitoUserPool", 
            props.cognitoUserPoolId);

        cognitoPool.grant(step1Function,
            "cognito-idp:ListGroups",
            "cognito-idp:GetGroup",
            "cognito-idp:ListUserPools",
            "cognito-idp:UpdateGroup"
            );

        step2Function.role?.attachInlinePolicy(
          new iam.Policy(this, 'identitypool-policy', {
            statements: [new iam.PolicyStatement({
              actions: [
              "cognito-identity:SetIdentityPoolRoles",
              "cognito-identity:ListIdentityPools",
              "cognito-identity:ListIdentities",
              "cognito-identity:UpdateIdentityPool",
              "cognito-identity:GetIdentityPoolRoles",
              ],
              resources: [
                `arn:aws:cognito-identity:${process.env.CDK_DEFAULT_REGION}:${process.env.CDK_DEFAULT_ACCOUNT}:identitypool/${props.identityPoolId}`
              ],
            })],
          })
        );


        const stepFunctions = new stepfunctionstasks.LambdaInvoke(this, "Downgrade Role Of Group", {
          lambdaFunction: step1Function, 
          resultPath: '$.step1Result'
        })

        stepFunctions.next(new stepfunctionstasks.LambdaInvoke(this, "Downgrade Roles in Identity Pool", { 
          lambdaFunction: step2Function,
          resultPath: '$.step2Result'
        }) );

        this.stepFuncStateMachine = new stepfunctions.StateMachine(this, 'BudgetWatcherStateMachine', {
          definition: stepFunctions,
          timeout: cdk.Duration.minutes(5)
        });

    }

}