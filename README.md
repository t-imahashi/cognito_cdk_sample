# cognito_cdk_sample
CognitoをCDKでデプロイするサンプルコード

## github actionsを使用するに当たっての下準備

- AWSで行うこと
  - デプロイ時のプロバイダの作成
    - IAM->IDプロバイダ->作成->ODIC
      - プロバイダのURL
        - https://token.actions.githubusercontent.com
      - 対象者
        - sts.amazonaws.com
  - デプロイ用ロールの作成
    - ここのRole名を下記の`AWS_IAM_ROLE_NAME`に入れる
    - policyは適宜適用
- GitHubで行うこと
  - Secretsの設定
    - Repository->Setting->secrets and variables->Actions->Reposgitory secretsに以下２つを設定
      - AWS_ACCOUNT_ID
      - AWS_IAM_ROLE_NAME
