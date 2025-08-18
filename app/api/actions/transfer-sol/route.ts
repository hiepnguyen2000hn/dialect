//file: src/app/api/actions/transfer-sol/route.ts

import {
    ActionGetResponse,
    ActionPostRequest,
    ActionPostResponse,
    ACTIONS_CORS_HEADERS,
    BLOCKCHAIN_IDS,
} from "@solana/actions";
import {
    clusterApiUrl,
    Connection,
    LAMPORTS_PER_SOL,
    PublicKey,
    SystemProgram,
    Transaction,
} from "@solana/web3.js";

// GET endpoint returns the Blink metadata (JSON) and UI configuration
export const GET = async (req: Request) => {
    const baseUrl = new URL(req.url).origin;

    // This JSON is used to render the Blink UI
    const response: ActionGetResponse = {
        type: "action",
        icon: `${baseUrl}/donate-sol.jpg`,
        label: "Transfer SOL",
        title: "Transfer SOL",
        description: "This Blink demonstrates how to transfer SOL on the Solana blockchain. It is a part of the official Blink Starter Guides by Dialect Labs.",
        links: {
            actions: [
                {
                    type: "transaction",
                    label: "0.01 SOL",
                    // href phải là relative path, không có baseUrl
                    href: `/api/actions/transfer-sol?amount=0.01`,
                },
                {
                    type: "transaction",
                    label: "0.05 SOL",
                    href: `/api/actions/transfer-sol?amount=0.05`,
                },
                {
                    type: "transaction",
                    label: "0.1 SOL",
                    href: `/api/actions/transfer-sol?amount=0.1`,
                },
                {
                    type: "transaction",
                    href: `/api/actions/transfer-sol?amount={amount}&to={to}`,
                    label: "Transfer",
                    parameters: [
                        {
                            name: "amount",
                            label: "Enter SOL amount",
                            type: "number",
                            required: true,
                        },
                        {
                            name: "to",
                            label: "Enter recipient address",
                            type: "text",
                            required: true,
                        },
                    ],
                },
            ],
        },
    };

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

        // Get amount and recipient from URL params
        const amountString = url.searchParams.get("amount");
        const toAddress = url.searchParams.get("to");

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

        if (!toAddress || toAddress.trim().length === 0) {
            return new Response('Missing or empty "to" address', {
                status: 400,
                headers: ACTIONS_CORS_HEADERS,
            });
        }

        let recipient: PublicKey;
        try {
            recipient = new PublicKey(toAddress);
        } catch (err) {
            return new Response('Invalid "to" address provided', {
                status: 400,
                headers: ACTIONS_CORS_HEADERS,
            });
        }

        // Create connection to devnet
        const connection = new Connection(clusterApiUrl("devnet"));

        // Get the latest blockhash
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();

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
            lastValidBlockHeight,
        }).add(transferInstruction);

        // Create the response
        const response: ActionPostResponse = {
            type: "transaction",
            transaction: Buffer.from(transaction.serialize({ requireAllSignatures: false })).toString("base64"),
            message: `Transfer ${amount} SOL to ${toAddress}`,
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