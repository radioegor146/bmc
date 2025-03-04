"use client";

import classes from "@/components/side-menu/side-menu.module.css";
import Image from "next/image";
import icon from "@/app/icon.svg";
import {IconDashboard, IconServer, IconSettings} from "@tabler/icons-react";
import {SideMenuCollapsableItem, SideMenuItem, SideMenuServerItem} from "@/components/side-menu/item";
import {getClient, R} from "@/lib/api/client";
import {useQuery, useQueryClient} from "@tanstack/react-query";
import {SERVERS_QUERY_KEY} from "@/lib/cache-tags";
import {useEffect} from "react";

export function SideMenu() {
    const client = getClient();

    const servers = useQuery({
        queryFn: async () => {
            const response = R(await client.GET("/api/servers", {}));
            return response.data!;
        },
        queryKey: [SERVERS_QUERY_KEY],
        retry: false
    });

    const queryClient = useQueryClient();

    useEffect(() => {
        const fetchInterval = setInterval(() => {
            queryClient.refetchQueries({queryKey: [SERVERS_QUERY_KEY]}).catch(() => {
            });
        }, 1000);
        return () => {
            clearInterval(fetchInterval);
        };
    }, []);

    return <div className={classes.sideMenu}>
        <div className={classes.logo}>
            <Image src={icon} alt={"icon"} className={classes.logoImage}/>
            <div className={classes.logoText}>
                BMC
            </div>
        </div>
        <div className={classes.menu}>
            <SideMenuItem icon={<IconDashboard/>} text={"Dashboard"} link={"/"}/>
            <SideMenuCollapsableItem defaultCollapsed={false} icon={<IconServer/>} text={"Servers"}>
                {servers.data ? servers.data.map(server =>
                    <SideMenuServerItem key={server.id} name={server.name} isPowered={server.status === "powered"}
                                        available={server.status !== "unavailable"} link={`/servers/${server.id}`}/>) : <></>}
            </SideMenuCollapsableItem>
            <SideMenuItem icon={<IconSettings/>} text={"Settings"} link={"/settings"}/>
        </div>
    </div>;
}