import {Injectable, OnModuleInit} from "@nestjs/common";
import {ConfigService} from "@nestjs/config";
import {promises as fsPromises} from "fs";
import {
    HardwareIcon,
    HardwareOptionInfoDTO,
    ServerHardwareInfoDTO,
    ServerInfoDTO,
    ServerStatus
} from "./servers.controller";
import {TTYHardwareInterface, TTYPin} from "../utils/tty-hardware-interface";

export interface ServerHardwareOptionConfig {
    color: string;
    icon: HardwareIcon;
    pin: TTYPin;
}

export interface ServerConfig {
    name: string;
    description: string;
    tty: {
        path: string;
        baudrate: number;
    };
    leds: Record<string, ServerHardwareOptionConfig>;
    buttons: Record<string, ServerHardwareOptionConfig>;
    toggles: Record<string, ServerHardwareOptionConfig>;
    powerStatus: {
        type: "toggle" | "led" | "button";
        id: string;
    };
}

export type ServersConfig = Record<string, ServerConfig>;

export class Server {
    onData?: (data: Buffer) => Promise<void> | void;

    readonly id: string;
    readonly tty: TTYHardwareInterface;
    readonly config: ServerConfig;

    constructor(id: string, config: ServerConfig) {
        this.id = id;
        this.config = config;
        this.tty = new TTYHardwareInterface(config.tty);
        this.tty.onData = async (data) => await this.onData(data);
    }

    getPowerPin(): TTYPin {
        switch (this.config.powerStatus.type) {
            case "toggle":
                return this.config.toggles[this.config.powerStatus.id].pin;
            case "led":
                return this.config.leds[this.config.powerStatus.id].pin;
            case "button":
                return this.config.buttons[this.config.powerStatus.id].pin;
        }
    }

    async getPowerState(): Promise<boolean> {
        return await this.tty.getPinState(this.getPowerPin());
    }

    async getLEDStates(): Promise<HardwareOptionInfoDTO[]> {
        const result: HardwareOptionInfoDTO[] = [];
        for (const id in this.config.leds) {
            const ledConfig = this.config.leds[id];
            result.push({
                id,
                icon: ledConfig.icon,
                color: ledConfig.color,
                state: this.isConnected() ? await this.tty.getPinState(ledConfig.pin) : undefined
            })
        }
        return result;
    }

    async getButtonStates(): Promise<HardwareOptionInfoDTO[]> {
        const result: HardwareOptionInfoDTO[] = [];
        for (const id in this.config.buttons) {
            const buttonConfig = this.config.buttons[id];
            result.push({
                id,
                icon: buttonConfig.icon,
                color: buttonConfig.color,
                state: this.isConnected() ? await this.tty.getPinState(buttonConfig.pin) : undefined
            })
        }
        return result;
    }

    async getToggleStates(): Promise<HardwareOptionInfoDTO[]> {
        const result: HardwareOptionInfoDTO[] = [];
        for (const id in this.config.toggles) {
            const toggleConfig = this.config.toggles[id];
            result.push({
                id,
                icon: toggleConfig.icon,
                color: toggleConfig.color,
                state: this.isConnected() ? await this.tty.getPinState(toggleConfig.pin) : undefined
            })
        }
        return result;
    }

    async setButton(buttonId: string, state: boolean) {
        const button = this.config.buttons[buttonId];
        if (!button) {
            return;
        }
        if (!this.isConnected()) {
            return;
        }
        await this.tty.setPinState(button.pin, state);
    }

    async setToggle(toggleId: string, state: boolean) {
        const toggle = this.config.toggles[toggleId];
        if (!toggle) {
            return;
        }
        if (!this.isConnected()) {
            return;
        }
        await this.tty.setPinState(toggle.pin, state);
    }

    isConnected(): boolean {
        return this.tty.isConnected();
    }
}

@Injectable()
export class ServersService implements OnModuleInit {
    private readonly configPath: string;
    private readonly logLengthLimit: number;

    private config: ServersConfig;

    private readonly servers: Server[] = [];
    private readonly serverLogs: Record<string, Buffer> = {};

    constructor(private configService: ConfigService) {
        this.configPath = configService.getOrThrow("SERVERS_CONFIG_PATH");
        this.logLengthLimit = parseInt(configService.getOrThrow("LOG_LENGTH_LIMIT"));
    }

    async onModuleInit(): Promise<void> {
        this.config = JSON.parse((await fsPromises.readFile(this.configPath)).toString());
        for (const serverId in this.config) {
            const serverConfig = this.config[serverId];
            this.servers.push(new Server(serverId, serverConfig));
        }

        this.registerDataCallbacks();
    }

    registerDataCallbacks(): void {
        for (const server of this.servers) {
            server.onData = async (data) => {
                const currentBuffer = this.serverLogs[server.id];
                if (!currentBuffer) {
                    this.serverLogs[server.id] = Buffer.alloc(0);
                }

                const result = Buffer.concat([this.serverLogs[server.id], data]);
                this.serverLogs[server.id] = result.subarray(Math.max(0, result.length - this.logLengthLimit));
            };
        }
    }

    async getServerInfos(): Promise<ServerInfoDTO[]> {
        const serverInfos: ServerInfoDTO[] = [];
        for (const server of this.servers) {
            serverInfos.push({
                id: server.id,
                name: server.config.name,
                description: server.config.description,
                status: server.isConnected() ? await server.getPowerState() ?
                    ServerStatus.POWERED : ServerStatus.NOT_POWERED : ServerStatus.UNAVAILABLE
            });
        }
        return serverInfos;
    }

    async getServerHardwareInfo(id: string): Promise<ServerHardwareInfoDTO | null> {
        const server = this.servers.find(server => server.id === id);
        if (!server) {
            return null;
        }
        return {
            id: server.id,
            name: server.config.name,
            description: server.config.description,
            status: server.isConnected() ? await server.getPowerState() ?
                ServerStatus.POWERED : ServerStatus.NOT_POWERED : ServerStatus.UNAVAILABLE,
            leds: await server.getLEDStates(),
            buttons: await server.getButtonStates(),
            toggles: await server.getToggleStates()
        };
    }

    async getServerLog(id: string): Promise<Buffer | null> {
        const server = this.servers.find(server => server.id === id);
        if (!server) {
            return null;
        }
        return this.serverLogs[server.id] ?? Buffer.alloc(0);
    }

    async setServerButton(serverId: string, buttonId: string, state: boolean): Promise<void> {
        const server = this.servers.find(server => server.id === serverId);
        if (!server) {
            return null;
        }
        await server.setButton(buttonId, state);
    }

    async setServerToggle(serverId: string, toggleId: string, state: boolean): Promise<void> {
        const server = this.servers.find(server => server.id === serverId);
        if (!server) {
            return null;
        }
        await server.setToggle(toggleId, state);
    }
}