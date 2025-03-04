import type {Metadata} from "next";
import "./globals.css";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import {ColorSchemeScript, mantineHtmlProps, MantineProvider} from "@mantine/core";
import {SideMenu} from "@/components/side-menu/side-menu";
import {Notifications} from "@mantine/notifications";
import {AppQueryClientProvider} from "@/components/app-query-client-provider";
import classes from "./app.module.css";

export const metadata: Metadata = {
    title: "BMC",
    description: "servers.re146.dev BMC",
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" {...mantineHtmlProps}>
        <head>
            <ColorSchemeScript defaultColorScheme={"dark"}/>
        </head>
        <body>
        <MantineProvider defaultColorScheme={"dark"}>
            <Notifications/>
            <AppQueryClientProvider>
                <div className={classes.container}>
                    <SideMenu/>
                    <main>
                        {children}
                    </main>
                </div>
            </AppQueryClientProvider>
        </MantineProvider>
        </body>
        </html>
    );
}