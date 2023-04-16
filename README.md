# Welcome to your CDK TypeScript project
This project demostrates setting up below AWS resources and workflow using CDK:

![Workflow](workflow.drawio.png)

To install AWS CDK, follow the instructions here: https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html

To deploy, run:
   cdk deploy --parameters CognitoUserPoolId=<congito pool id> --parameters NameOfCognitoGroupToDowngrade=<cognito group you want downgraded> --parameters IdentityPoolId=<identity pool id>

The budget can be configured by this line of code in [this file](./lib/aws_cdk_budget_watcher_handler-stack.ts):

```
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
    });
```
