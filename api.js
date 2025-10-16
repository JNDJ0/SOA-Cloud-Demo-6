import AWS from "aws-sdk";

const ses = new AWS.SES({ region: "eu-north-1" });

export const handler = async (event) => {
    try {
        const body = JSON.parse(event.body);

        const params = {
            Source: "joaolucassmoreira0@gmail.com",
            Destination: {
                ToAddresses: [body.to],
            },
            Message: {
                Subject: { Data: "Message from your website" },
                Body: { Text: { Data: body.message }, },
            },
        };

        await ses.sendEmail(params).promise();

        return {
            statusCode: 200,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ success: true }),
        };
    } 
    catch (err) {
        console.error(err);
        return {
            statusCode: 500,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ error: err.message }),
        };
    }
};
