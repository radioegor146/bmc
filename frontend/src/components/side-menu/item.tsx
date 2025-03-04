"use client";

import classes from "@/components/side-menu/side-menu.module.css";
import {useEffect, useState} from "react";
import {IconChevronDown, IconChevronUp} from "@tabler/icons-react";
import {useRouter} from "next/navigation";

export function SideMenuServerItem({name, available, isPowered, link}: {
    name: string,
    available: boolean,
    isPowered: boolean,
    link: string
}) {
    const router = useRouter();

    return <div className={`${classes.server} ${available ? classes.serverAvaliable : classes.serverUnavailable}`}
                onClick={() => router.push(link)}>
        <div className={classes.serverName}>{name}</div>
        <div className={classes.serverStatus}>
            <div className={classes.smallServerStatus}>{available ? isPowered ? "On" : "Off" : "N/A"}</div>
            <div
                className={`${classes.serverPower} ${available ? (isPowered ? classes.serverPowered : classes.serverNotPowered) : ""}`}></div>
        </div>
    </div>;
}

export interface SideMenuItemProps {
    icon: React.ReactNode;
    text: string;
}

export function SideMenuCollapsableItem({children, icon, text, defaultCollapsed}: {
    children: React.ReactNode,
    defaultCollapsed: boolean
} & SideMenuItemProps) {
    const [collapsed, setCollapsed] = useState(false);

    useEffect(() => {
        setCollapsed(defaultCollapsed);
    }, []);

    return <>
        <div className={classes.menuItemCollapsable} onClick={() => setCollapsed(!collapsed)}>
            <div className={classes.menuItemCollapsableContents}>
                {icon}
                <div className={classes.menuItemText}>{text}</div>
            </div>
            {collapsed ? <IconChevronDown className={classes.menuItemCollapsableChevron}/> :
                <IconChevronUp className={classes.menuItemCollapsableChevron}/>}
        </div>
        <div className={classes.menu} style={{display: collapsed ? 'none' : undefined}}>
            {children}
        </div>
    </>;
}

export function SideMenuItem({icon, text, link}: { link: string } & SideMenuItemProps) {
    const router = useRouter();

    return <div className={classes.menuItem} onClick={() => router.push(link)}>
        {icon}
        <div className={classes.menuItemText}>{text}</div>
    </div>;
}