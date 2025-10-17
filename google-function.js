/**
 * This code is responsible for sending the email via SendGrid, and then
 * store it on AWS DynamoDB.
 * It's hosted on Google Run Functions.
 */

const sgMail = require('@sendgrid/mail');
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");
const { v4: uuidv4 } = require('uuid');
const express = require('express');
const cors = require('cors');

const app = express();

const corsOptions = {
    origin: '*', 
    methods: 'POST, GET, OPTIONS',
    allowedHeaders: 'Content-Type',
};

app.use(cors(corsOptions));
app.use(express.json());

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const dbClient = new DynamoDBClient({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});
const docClient = DynamoDBDocumentClient.from(dbClient);

app.post('/', async (req, res) => {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).send({ error: 'Missing required fields: name, email, message.' });
    }

    try {
        const submissionId = uuidv4();
        const timestamp = new Date().toISOString();
        const dbCommand = new PutCommand({
            TableName: process.env.DYNAMODB_TABLE_NAME,
            Item: { submissionId, name, email, message, timestamp },
        });

        const emailMsg = {
            to: process.env.RECIPIENT_EMAIL,
            from: process.env.RECIPIENT_EMAIL,
            subject: `New Contact Form Submission from ${name}`,
            text: `You have a new message from:\nName: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
        };

        await Promise.all([
            docClient.send(dbCommand),
            sgMail.send(emailMsg),
        ]);

        return res.status(200).send({ message: 'Submission successful!' });
    } 
    catch (error) {
        console.error('Error processing submission:', error);
        return res.status(500).send({ error: 'An internal error occurred. Please try again later.' });
    }
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});