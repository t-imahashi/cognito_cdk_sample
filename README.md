# cognito_cdk_sample
CognitoをCDKでデプロイするサンプルコード

## github actionsを使用するに当たっての下準備

1. AWS: デプロイ時のプロバイダの作成
  - IAM->IDプロバイダ->作成->ODIC
    - プロバイダのURL
      - https://token.actions.githubusercontent.com
    - 対象者
      - sts.amazonaws.com
  - ロールの設定
    - 適当に
2. GitHub: Secretsの設定
  - AWS_ACCOUNT_ID
  - AWS_IAM_ROLE_NAME

