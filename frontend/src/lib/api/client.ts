import createClient, {Client} from "openapi-fetch";
import type {paths} from "./types";

export function getClient(): Client<paths> {
    return createClient<paths>({
        baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
        credentials: "include"
    })
}

interface ResponseWithError<T> {
    error?: {
        statusCode: number;
        message: string;
    };
    data?: T;
}

const errorDescriptions: Record<string, string> = {
    "server-not-found": "Server not found"
};

function getErrorText(error: { statusCode: number, message: string }): string {
    return errorDescriptions[error.message] ? errorDescriptions[error.message] :
        `${error.statusCode} ${error.message}`;
}

export function R<T extends ResponseWithError<TData>, TData>(response: T): T {
    if (response.error) {
        throw new Error(getErrorText(response.error));
    }

    if (!response.data) {
        throw new Error("No response");
    }

    return response;
}