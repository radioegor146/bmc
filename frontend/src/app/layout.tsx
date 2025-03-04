import type {Metadata} from "next";
import "./globals.css";
import "@mantine/core/styles.css";
import {ColorSchemeScript, mantineHtmlProps, MantineProvider} from "@mantine/core";
import {SideMenu} from "@/components/side-menu/side-menu";

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
        <MantineProvider>
            <div className={"flex flex-row"}>
                <SideMenu/>
                <main>
                    {children}
                </main>
            </div>
        </MantineProvider>
        </body>
        </html>
    );
}
