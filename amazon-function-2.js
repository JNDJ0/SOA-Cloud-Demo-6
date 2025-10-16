import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({});
const bucketName = process.env.ARCHIVE_BUCKET_NAME;

export const handler = async (event) => {
    try {
        const listCommand = new ListObjectsV2Command({ Bucket: bucketName });
        const listResponse = await s3.send(listCommand);

        if (!listResponse.Contents || listResponse.Contents.length === 0) {
        return createResponse(200, []);
        }

        const readPromises = listResponse.Contents.map(async (file) => {
        const getCommand = new GetObjectCommand({ Bucket: bucketName, Key: file.Key });
        const fileResponse = await s3.send(getCommand);
        const fileContent = await fileResponse.Body.transformToString();
        const dynamoDbJson = JSON.parse(fileContent);
        return {
            name: dynamoDbJson.name.S,
            email: dynamoDbJson.email.S,
            message: dynamoDbJson.message.S,
            timestamp: dynamoDbJson.timestamp.S
        };
        });

        const submissions = await Promise.all(readPromises);

        submissions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        return createResponse(200, submissions);

    } 
    catch (error) {
        console.error(error);
        return createResponse(500, { message: "Failed to retrieve submissions." });
    }
};

const createResponse = (statusCode, body) => {
    return {
        statusCode: statusCode,
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*", 
        },
        body: JSON.stringify(body),
    };
};