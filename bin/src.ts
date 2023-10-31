#!/usr/bin/env node
import 'source-map-support/register';
import { App } from 'aws-cdk-lib';
import { CognitoStack } from '../lib/cognito-stack';

const app = new App();
new CognitoStack(app, 'CognitoStack', {});
