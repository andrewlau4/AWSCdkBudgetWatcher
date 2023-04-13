import { Construct } from 'constructs';

import * as nodejs  from 'aws-cdk-lib/aws-lambda-nodejs';
import * as iam from 'aws-cdk-lib/aws-iam'
import * as stepfunctions from 'aws-cdk-lib/aws-stepfunctions';
import * as stepfunctionstasks from 'aws-cdk-lib/aws-stepfunctions-tasks';

export interface RemoveGroupRolesStepFunctionProp {
    nameOfCognitoGroupToDowngrade: string;
    identityPoolId: string;
    roleToDowngradeTo: iam.IRole;
};

export class RemoveGroupRolesStepFunction extends Construct {

    constructor(scope: Construct, id: string, props: RemoveGroupRolesStepFunctionProp) {
        super(scope, id);


    }

}