import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

import * as sns from 'aws-cdk-lib/aws-sns';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions'
import * as budgets from 'aws-cdk-lib/aws-budgets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as nodejs  from 'aws-cdk-lib/aws-lambda-nodejs';
import * as stepfunctions from 'aws-cdk-lib/aws-stepfunctions';
import * as stepfunctionstasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { DowngradeGroupRolesStepFunction } from './DowngradeGroupRolesStepFunctionConstruct';

export const STATE_MACHINE_ARN = "STATE_MACHINE_ARN";

export class AwsCdkBudgetWatcherHandlerStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    cdk.Tags.of(this).add('AwsCdkBudgetWatcherHandlerStack', '--')


    const nameOfCognitoGroupToDowngradeCfnParam = new cdk.CfnParameter(this, "NameOfCognitoGroupToDowngrade", {
      type: "String",
      default: "",
      description: "The name of Cognito group that we want to downgrade its role when overbudget"});

    const cognitoUserPoolIdCfnParam = new cdk.CfnParameter(this, "CognitoUserPoolId", {
        type: "String",
        default: "",
        description: "Cognito User Pool Id"});  

    const identityPoolIdCfnParam = new cdk.CfnParameter(this, "IdentityPoolId", {
      type: "String",
      default: "",
      description: "Identity Pool Id"});  

      
    const overbudgetTopic = new sns.Topic(this, 'BudgetWatcher', {
      displayName: 'Budget Wacther Alert',
    });

    const cfnBudget = new budgets.CfnBudget(this, "Buget", {
      budget: {
        budgetType: 'COST',
        timeUnit: 'DAILY',
        budgetLimit: {
          amount: 2,
          unit: 'USD',
        },
        budgetName: 'MyBuget',
      },
      notificationsWithSubscribers: [
        {
          notification: {
            notificationType: 'ACTUAL',
            comparisonOperator: 'GREATER_THAN',
            threshold: 75, 
            thresholdType: 'PERCENTAGE'
          },
          subscribers: [
            {
              subscriptionType: 'SNS',
              address: overbudgetTopic.topicArn
            },
            ]
        }

      ]
    })


    //need to install esbuild https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_lambda_nodejs-readme.html
    //  otherwise, cdk will try to package the lambda function into docker container 
    const overbudgetListenerLambda = new nodejs.NodejsFunction(this, 'overbudget_listener_lambda', 
      { runtime: lambda.Runtime.NODEJS_18_X });

    
    overbudgetTopic.addSubscription(new subscriptions.LambdaSubscription(overbudgetListenerLambda, {}));
  
    //this is the role i want to downgrade to
    const dummyRole = new iam.Role(this, "DummyRole", {
      assumedBy: new iam.FederatedPrincipal("cognito-identity.amazonaws.com",
      {
        "StringEquals": {
          "cognito-identity.amazonaws.com:aud": identityPoolIdCfnParam.valueAsString
        },
        "ForAnyValue:StringLike": {
          "cognito-identity.amazonaws.com:amr": "authenticated"
        }
      },
      "sts:AssumeRoleWithWebIdentity") 
    });
    //this is the permission i want to downgrade the cognito users to if i am over budget
    dummyRole.addToPolicy(
      new iam.PolicyStatement({
        resources: ['*'],
        actions: ['cloudwatch:ListMetricStreams'],
      }
    ));

    const stepFunction = new DowngradeGroupRolesStepFunction(this, 'RemoveGroupRolesStepFunction', {
      nameOfCognitoGroupToDowngrade: nameOfCognitoGroupToDowngradeCfnParam.valueAsString,
      cognitoUserPoolId: cognitoUserPoolIdCfnParam.valueAsString,
      roleToDowngradeTo: dummyRole,

    });

    stepFunction.stepFuncStateMachine.grant(
      overbudgetListenerLambda,
      "states:StartExecution"
    )

    overbudgetListenerLambda.addEnvironment(STATE_MACHINE_ARN, 
      stepFunction.stepFuncStateMachine.role.roleArn);

  }
}
