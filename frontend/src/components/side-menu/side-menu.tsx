import classes from "@/app/app.module.css";
import Image from "next/image";
import icon from "@/app/icon.svg";
import {IconDashboard, IconServer, IconSettings} from "@tabler/icons-react";
import {SideMenuCollapsableItem, SideMenuItem, SideMenuServerItem} from "@/components/side-menu/item";

export function SideMenu() {
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
                <SideMenuServerItem name={"Elbrus"} available={true} isPowered={true}/>
                <SideMenuServerItem name={"MIPS LE"} available={false} isPowered={false}/>
                <SideMenuServerItem name={"MIPS BE"} available={false} isPowered={false}/>
                <SideMenuServerItem name={"MIPS64"} available={false} isPowered={false}/>
                <SideMenuServerItem name={"PowerPC BE"} available={true} isPowered={false}/>
                <SideMenuServerItem name={"RISC-V 64"} available={true} isPowered={false}/>
                <SideMenuServerItem name={"x86"} available={true} isPowered={true}/>
            </SideMenuCollapsableItem>
            <SideMenuItem icon={<IconSettings/>} text={"Settings"} link={"/settings"}/>
        </div>
    </div>;
}