/**
 * This code is responsible from fetching the email from DynamoDB,
 * generating a JSON with it and storing it on a s3 bucket.
 * It's hosted on AWS Lambda.
 */

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({});
const bucketName = process.env.ARCHIVE_BUCKET_NAME;

export const handler = async (event) => {
  for (const record of event.Records) {
    if (record.eventName === 'INSERT') {
      const submission = record.dynamodb.NewImage;
      
      const fileName = `submission-${submission.timestamp.S}.json`;
      const fileContent = JSON.stringify(submission, null, 2);

      const params = {
        Bucket: bucketName,
        Key: fileName,
        Body: fileContent,
        ContentType: 'application/json'
      };

      await s3.send(new PutObjectCommand(params));
      console.log(`Archived submission to ${fileName}`);
    }
  }
  return { status: 'Success' };
};