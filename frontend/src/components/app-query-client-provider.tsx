"use client";

import React, {useState} from "react";
import {MutationCache, QueryClient} from "@tanstack/query-core";
import {QueryCache, QueryClientProvider} from "@tanstack/react-query";
import {notifications} from "@mantine/notifications";

export function AppQueryClientProvider({children}: Readonly<{
    children: React.ReactNode;
}>) {
    function defaultErrorHandler(error: Error) {
        notifications.show({
            title: "Error",
            message: "message" in error ? error.message : `${error}`,
            color: "red"
        });
    }

    const [queryClient] = useState(new QueryClient({
        queryCache: new QueryCache({
            onError: defaultErrorHandler,
        }),
        mutationCache: new MutationCache({
            onError: defaultErrorHandler
        })
    }));

    return <QueryClientProvider client={queryClient}>
        {children}
    </QueryClientProvider>;
}