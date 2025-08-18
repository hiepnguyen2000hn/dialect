//file: src/app/api/actions/donate-sol/route.ts

import {
    ActionGetResponse,
    ActionPostRequest,
    ActionPostResponse,
    ACTIONS_CORS_HEADERS,
} from "@solana/actions";
import {
    clusterApiUrl,
    Connection,
    LAMPORTS_PER_SOL,
    PublicKey,
    SystemProgram,
    Transaction,
} from "@solana/web3.js";

// Fixed recipient address for donations - replace with your actual wallet address
const DONATE_ADDRESS = "Bngu6CCtz5tCndhNraXL1maTx8nXn5ySZKiofrX6LZQB"; // Example valid wallet address - replace with yours

// GET endpoint returns the Blink metadata (JSON) and UI configuration
export const GET = async (req: Request) => {
    // This JSON is used to render the Blink UI
    const response: ActionGetResponse = {
        type: "action",
        icon: `${new URL("/donate-sol.jpg", req.url).toString()}`,
        label: "Donate SOL",
        title: "Donate SOL",
        description:
            "This Blink demonstrates how to donate SOL on the Solana blockchain. It is a part of the official Blink Starter Guides by Dialect Labs.",
        // Links is used if you have multiple actions or if you need more than one params
        links: {
            actions: [
                {
                    // Defines this as a blockchain transaction
                    type: "transaction",
                    label: "0.01 SOL",
                    // This is the endpoint for the POST request
                    href: `/api/actions/donate-sol?amount=0.01`,
                },
                {
                    type: "transaction",
                    label: "0.05 SOL",
                    href: `/api/actions/donate-sol?amount=0.05`,
                },
                {
                    type: "transaction",
                    label: "0.1 SOL",
                    href: `/api/actions/donate-sol?amount=0.1`,
                },
                {
                    // Example for a custom input field
                    type: "transaction",
                    href: `/api/actions/donate-sol?amount={amount}`,
                    label: "Donate Custom Amount",
                    parameters: [
                        {
                            name: "amount",
                            label: "Enter SOL amount",
                            type: "number",
                            required: true,
                        },
                    ],
                },
            ],
        },
    };

    // Return the response with proper headers
    return new Response(JSON.stringify(response), {
        status: 200,
        headers: ACTIONS_CORS_HEADERS,
    });
};

// POST endpoint handles the actual transaction creation
export const POST = async (req: Request) => {
    try {
        const url = new URL(req.url);
        const body: ActionPostRequest = await req.json();

        // Validate the account
        let account: PublicKey;
        try {
            account = new PublicKey(body.account);
        } catch (err) {
            return new Response('Invalid "account" provided', {
                status: 400,
                headers: ACTIONS_CORS_HEADERS,
            });
        }

        // Get amount from URL params
        const amountString = url.searchParams.get("amount");
        
        if (!amountString) {
            return new Response('Missing "amount" parameter', {
                status: 400,
                headers: ACTIONS_CORS_HEADERS,
            });
        }

        const amount = parseFloat(amountString);

        if (isNaN(amount) || amount <= 0 || amount > 100) {
            return new Response('Invalid "amount" - must be a positive number <= 100 SOL', {
                status: 400,
                headers: ACTIONS_CORS_HEADERS,
            });
        }

        // Fixed recipient for donations
        const recipient = new PublicKey(DONATE_ADDRESS);

        // Create connection to devnet
        const connection = new Connection(clusterApiUrl("devnet"));

        // Get the latest blockhash
        const { blockhash } = await connection.getLatestBlockhash();

        // Create the transfer instruction
        const transferInstruction = SystemProgram.transfer({
            fromPubkey: account,
            toPubkey: recipient,
            lamports: amount * LAMPORTS_PER_SOL,
        });

        // Create the transaction
        const transaction = new Transaction({
            feePayer: account,
            blockhash,
            lastValidBlockHeight: (await connection.getLatestBlockhash()).lastValidBlockHeight,
        }).add(transferInstruction);

        // Create the response
        const response: ActionPostResponse = {
            type: "transaction",
            transaction: Buffer.from(transaction.serialize({ requireAllSignatures: false })).toString("base64"),
            message: `Donate ${amount} SOL`,
        };

        return new Response(JSON.stringify(response), {
            status: 200,
            headers: ACTIONS_CORS_HEADERS,
        });
    } catch (err) {
        console.error(err);
        return new Response("An unknown error occurred", {
            status: 500,
            headers: ACTIONS_CORS_HEADERS,
        });
    }
};

// OPTIONS method for CORS preflight
export const OPTIONS = async () => {
    return new Response(null, {
        status: 200,
        headers: ACTIONS_CORS_HEADERS,
    });
};