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

    const topic = new sns.Topic(this, 'BudgetWatcher', {
      displayName: 'Budget Wacther Alert',
    });

  }
}
