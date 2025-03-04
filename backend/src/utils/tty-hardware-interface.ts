import {SerialPort} from "serialport";
import Semaphore from "semaphore-async-await";
import {Logger} from "@nestjs/common";

export interface TTYConfig {
    path: string,
    baudrate: number
}

export type TTYPin = "dtr" | "rts" | "cts" | "dsr";

export class TTYHardwareInterface {
    private readonly logger: Logger;

    public onData?: (data: Buffer) => Promise<void> | void;

    private serialPort?: SerialPort;
    private dtr: boolean = false;
    private rts: boolean = false;
    private writeSemaphore: Semaphore = new Semaphore(1);
    private setPinStateSemaphore: Semaphore = new Semaphore(1);
    private restartTimeout?: NodeJS.Timeout;

    constructor(private readonly config: TTYConfig) {
        this.logger = new Logger(`TTYHardwareInterface:${this.config.path}`);
        this.start();
    }

    isConnected(): boolean {
        return this.serialPort && this.serialPort.isOpen;
    }

    restart(): void {
        try {
            this.serialPort?.close();
        } catch (e) {
            // ignore
        }
        try {
            this.serialPort?.destroy();
        } catch (e) {
            // ignore
        }
        this.serialPort = undefined;
        if (this.restartTimeout) {
            clearTimeout(this.restartTimeout);
            this.restartTimeout = undefined;
        }
        this.restartTimeout = setTimeout(() => this.start(), 1000);
    }

    start(): void {
        if (this.serialPort) {
            return;
        }
        try {
            this.serialPort = new SerialPort({
                path: this.config.path,
                baudRate: this.config.baudrate
            }, error => {
                if (error) {
                    this.logger.error(`Failed to open serial port: ${error}`);
                    this.restart();
                    return;
                }
                this.serialPort.addListener("error", error => {
                    this.logger.error(`Error: ${error}`);
                    this.restart();
                });
                this.serialPort.addListener("close", () => {
                    this.logger.warn(`Closed?`);
                    this.restart();
                });
                this.serialPort.addListener("data", data => {
                    if (this.onData) {
                        this.onData(data);
                    }
                });
                this.serialPort.set({
                    dtr: false,
                    rts: false
                }, error => {
                    if (error) {
                        this.logger.error(`Failed to clear DTR/RTS: ${error}`);
                        // this.restart();
                        // return;
                    }
                    this.dtr = false;
                    this.rts = false;
                    this.logger.log("Connected");
                });
            });
        } catch (e) {
            this.logger.error(`Failed to connect to serial port: ${e}`);
            this.restart();
        }
    }

    async getPinState(pin: TTYPin): Promise<boolean> {
        if (!this.isConnected()) {
            throw new Error("Not connected");
        }
        if (pin === "dtr") {
            return this.dtr;
        }
        if (pin === "rts") {
            return this.rts;
        }
        return await new Promise<boolean>((resolve, reject) => {
            this.serialPort.get((error, state) => {
                if (error) {
                    this.logger.error(`Failed to get pin state: ${error}`);
                    reject(error);
                    this.restart();
                    return;
                }
                if (pin === "dsr") {
                    resolve(state.dsr);
                } else if (pin === "cts") {
                    resolve(state.cts);
                }
                reject(new Error("Invalid pin"));
            });
        });
    }

    async setPinState(pin: TTYPin, state: boolean): Promise<void> {
        if (!this.isConnected()) {
            throw new Error("Not connected");
        }
        if (pin !== "dtr" && pin !== "rts") {
            throw new Error("Invalid pin");
        }
        await this.setPinStateSemaphore.wait();
        const newDtr = pin === "dtr" ? state : this.dtr;
        const newRts = pin === "rts" ? state : this.rts;
        try {
            await new Promise<void>((resolve, reject) => {
                this.serialPort.set({
                    dtr: newDtr,
                    rts: newRts
                }, error => {
                    if (error) {
                        this.logger.error(`Failed to set pin state: ${error}`);
                        this.restart();
                        reject(error);
                        return;
                    }
                    this.dtr = newDtr;
                    this.rts = newRts;
                    resolve();
                });
            });
        } finally {
            this.setPinStateSemaphore.release();
        }
    }

    async write(data: Buffer): Promise<void> {
        if (!this.isConnected()) {
            throw new Error("Not connected");
        }
        await this.writeSemaphore.wait();
        try {
            await new Promise<void>((resolve, reject) => {
                this.serialPort.write(data, error => {
                    if (error) {
                        this.logger.error(`Failed to write: ${error}`);
                        this.serialPort.close();
                        this.serialPort = undefined;
                        setTimeout(() => this.start, 1000);
                        reject(error);
                        return;
                    }
                    resolve();
                });
            });
        } finally {
            this.writeSemaphore.release();
        }
    }
}