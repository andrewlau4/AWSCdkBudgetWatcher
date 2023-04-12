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


export class AwsCdkBudgetWatcherHandlerStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    cdk.Tags.of(this).add('AwsCdkBudgetWatcherHandlerStack', '')


    const cognitoGroupNameCfnParam = new cdk.CfnParameter(this, "CognitoGroupNameToChange", {
      type: "String",
      default: cdk.Aws.NO_VALUE, 
      description: "Cognito group name that we want to change when overbudget"});

    const cognitoPoolIdCfnParam = new cdk.CfnParameter(this, "CognitoPoolId", {
        type: "String",
        default: cdk.Aws.NO_VALUE, 
        description: "Cognito Pool Id"});  

    const identityPoolArnCfnParam = new cdk.CfnParameter(this, "IdentityPoolIdArn", {
      type: "String",
      default: cdk.Aws.NO_VALUE, 
      description: "Identity Pool Id"});  

      
    const overbudgetTopic = new sns.Topic(this, 'BudgetWatcher', {
      displayName: 'Budget Wacther Alert',
    });
    const overbudgetTopicPolicy = new sns.TopicPolicy(this, 'TopicPolicy', {
      topics: [overbudgetTopic],
    });
    overbudgetTopicPolicy.document.addStatements(new iam.PolicyStatement({
      actions: ["sns:Subscribe"],
      principals: [new iam.AnyPrincipal()],
      resources: [overbudgetTopic.topicArn],
    }));

    const cfnBudget = new budgets.CfnBudget(this, "MyBuget", {
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
  }
}
