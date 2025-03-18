import { EncryptCommand, KMSClient } from '@aws-sdk/client-kms';
import { STSClient, GetCallerIdentityCommand } from "@aws-sdk/client-sts";
import { fromEnv } from "@aws-sdk/credential-providers";
import https from "https";

// Enable debug logging
process.env.AWS_SDK_JS_DEBUG = "true";

// Debug HTTP requests
const original = https.request;
https.request = function (options, callback) {
  console.log(Date.now(), 'starting request', options.method, options.host, options.path);
  return original(options, (error, result) => {
    console.log(Date.now(), 'request done', options.method, options.host, options.path);
    callback(error, result);
  });
};

const stsClient = new STSClient({
    credentials: fromEnv()
});

async function testCredentials() {
    try {
        console.log('Testing STS call...');
        const stsResponse = await stsClient.send(new GetCallerIdentityCommand({}));
        console.log('STS call successful:', stsResponse);

        console.log('Testing KMS call...');
        const kmsClient = new KMSClient({
            credentials: fromEnv({
                profile: 'default',
                cache: false
            })
        });

        await kmsClient.send(
            new EncryptCommand({ 
                KeyId: 'KEY_ID', 
                Plaintext: new TextEncoder().encode('foo') 
            }), 
            { abortSignal: AbortSignal.timeout(1) }
        );
    } catch (error) {
        console.error('Error:', error);
        console.error('Full error details:', JSON.stringify(error, null, 2));
    }
}

testCredentials();



           

