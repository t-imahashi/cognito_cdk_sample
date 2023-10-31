import { CfnOutput, Duration, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { AccountRecovery, Mfa, OAuthScope, StringAttribute, UserPool, UserPoolClient, UserPoolClientIdentityProvider, UserPoolEmail, UserPoolOperation } from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { AttributeType, StreamViewType, Table } from 'aws-cdk-lib/aws-dynamodb';

export class CognitoStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const userPool = new UserPool(this, 'UserPool', {
      signInAliases: { // Cognito ユーザープールのサインインオプション
        email: true, // MEMO: ユーザーネームの代わりにメールアドレスをサインインおよびサインアップで使えるようになる
      },
      mfa: Mfa.OFF, // 多要素認証
      accountRecovery: AccountRecovery.EMAIL_ONLY, // ユーザーアカウントの復旧
      selfSignUpEnabled: true, // セルフサービスのサインアップ
      autoVerify: { // Cognito アシスト型の検証および確認
        email: true,
        phone: false,
      },
      keepOriginal: { // 属性変更の確認
        email: true,
        phone: false,
      },
      standardAttributes: { // 必須の属性
        email: {
          required: true,
          mutable: true,
        },
      },
      customAttributes: { // カスタム属性
        role: new StringAttribute({
          minLen: 0,
          maxLen: 256,
          mutable: true,
        }),
      },
      email: UserPoolEmail.withCognito(),
      userPoolName: 'UserPool', // ユーザープール名
      deletionProtection: false, // 削除保護 // TODO: 本番環境ではtrueにする
      removalPolicy: RemovalPolicy.DESTROY, // TODO: 本番環境では消す
    });

    const userPoolClient = new UserPoolClient(this, "UserPoolClient", {
      userPool,
      generateSecret: false, // クライアントシークレット MEMO: @aws-amplify/authを使用する場合(ALLOW_USER_SRP_AUTH)は、falseにしないと使えなくなる
      authFlows: { // 認証フロー
        userSrp: true, // ALLOW_USER_SRP_AUTH
      },
      authSessionValidity: Duration.minutes(3), // 認証フローセッションの持続期間
      refreshTokenValidity: Duration.days(30), // 更新トークンの有効期限
      accessTokenValidity: Duration.minutes(60), // アクセストークンの有効期限
      idTokenValidity: Duration.minutes(60), // ID トークンの有効期限
      enableTokenRevocation: true, // トークンの取り消しを有効化
      preventUserExistenceErrors: true, // ユーザー存在エラーの防止
      supportedIdentityProviders: [UserPoolClientIdentityProvider.COGNITO], // これなんぞ？
      oAuth: {
        flows: { // oAuth付与タイプ設定
          authorizationCodeGrant: true, // 認証コード付与
          implicitCodeGrant: true, // 暗黙的な付与
        },
        callbackUrls: [
          'https://sample.com/app',
          'https://oauth.pstmn.io/v1/callback', // ポストマンアプリ用
        ],
        logoutUrls: [ // 許可されているサインアウトURL設定
          'https://sample.com/app',
        ],
        scopes: [ // カスタムスコープ
          OAuthScope.EMAIL,
          OAuthScope.OPENID,
          OAuthScope.PHONE,
          OAuthScope.PROFILE,
        ],
      }
    })

    // Lambdaトリガー
    const handler = new NodejsFunction(this, "NodejsFunction", {
      runtime: Runtime.NODEJS_18_X,
      entry: 'lambda/index.ts',
    })
    userPool.addTrigger(UserPoolOperation.PRE_TOKEN_GENERATION, handler)

    // userテーブル
    const usersTable = new Table(this, "users", {
      tableName: "users",
      partitionKey: {
        name: "id",
        type: AttributeType.STRING,
      },
      removalPolicy: RemovalPolicy.DESTROY, // TODO: 本番では使っちゃだめ
      stream: StreamViewType.NEW_AND_OLD_IMAGES,
      readCapacity: 10,
      writeCapacity: 10,
    })

    // LambdaからDynamoDBの書込読込許可
    usersTable.grantReadWriteData(handler)

    new CfnOutput(this, "UserPoolId", { value: userPool.userPoolId, exportName: "UserPoolId" })
    new CfnOutput(this, "UserPoolClientId", { value: userPoolClient.userPoolClientId, exportName: "UserPoolClientId" })
  }
}
