"use client";

import {useParams} from "next/navigation";
import classes from "./servers.module.css";
import {useQuery} from "@tanstack/react-query";
import {getClient, R} from "@/lib/api/client";
import {SERVER_HARDWARE_QUERY_KEY} from "@/lib/cache-tags";
import React, {useEffect, useState} from "react";
import {IconPower, IconQuestionMark, IconRestore} from "@tabler/icons-react";
import {Switch} from "@mantine/core";

export interface HardwareOption {
    id: string;
    color: string;
    icon: "power" | "reset";
    state?: boolean;
}

function getIcon(icon: string) {
    switch (icon) {
        case "power":
            return <IconPower/>;
        case "reset":
            return <IconRestore/>;
        default:
            return <IconQuestionMark/>;
    }
}

function LED({led}: {led: HardwareOption}) {
    return <div className={classes.led}>
        {getIcon(led.icon)}
    </div>;
}

function Button({button}: {button: HardwareOption}) {
    return <div></div>;
}

function Toggle({toggle}: {toggle: HardwareOption}) {
    return <div className={classes.toggle}>
        {getIcon(toggle.icon)}
        <Switch color={toggle.color}></Switch>
    </div>;
}

export default function ServerPage() {
    const {id} = useParams<{ id: string }>();

    const [leds, setLEDs] = useState<HardwareOption[]>([]);
    const [buttons, setButtons] = useState<HardwareOption[]>([]);
    const [toggles, setToggles] = useState<HardwareOption[]>([]);

    const client = getClient();

    const serverHardware = useQuery({
        queryFn: async () => {
            const response = R(await client.GET("/api/servers/{id}/hardware", {
                params: {
                    path: {
                        id
                    }
                }
            }));
            return response.data!;
        },
        queryKey: [SERVER_HARDWARE_QUERY_KEY, id],
        retry: false
    });

    useEffect(() => {
        if (!serverHardware.data) {
            return;
        }

        setLEDs(serverHardware.data.leds);
        setButtons(serverHardware.data.buttons);
        setToggles(serverHardware.data.toggles);
    }, [serverHardware]);

    return serverHardware.data ? <div className={classes.main}>
        <div className={classes.hardware}>
            <div className={classes.hardwareInfo}>
                <div className={classes.hardwareInfoName}>
                    {serverHardware.data.name}
                </div>
                <div className={classes.hardwareInfoDescription}>
                    {serverHardware.data.description}
                </div>
            </div>
            {serverHardware.data.status === "unavailable" ? <></> : <>
                <div className={classes.toggles}>
                    {toggles.map(toggle => <Toggle key={toggle.id} toggle={toggle}/>)}
                </div>
                <div className={classes.buttons}>
                    {buttons.map(button => <Button key={button.id} button={button}/>)}
                </div>
                <div className={classes.leds}>
                    {leds.map(led => <LED key={led.id} led={led}/>)}
                </div>
            </>}
        </div>
    </div> : <></>;
}