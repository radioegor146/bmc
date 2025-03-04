import {Body, Controller, Get, HttpException, HttpStatus, Param, Patch} from "@nestjs/common";
import {ApiBody, ApiDefaultResponse, ApiOkResponse, ApiOperation, ApiProperty, ApiTags} from "@nestjs/swagger";
import {ServersService} from "./servers.service";
import {IsNotEmpty} from "class-validator";
import {ErrorApiResponse} from "../common/api-responses";
import {Errors} from "../common/errors";

export enum ServerStatus {
    UNAVAILABLE = "unavailable",
    POWERED = "powered",
    NOT_POWERED = "not-powered"
}

export enum HardwareIcon {
    POWER = "power",
    RESET = "reset"
}

export class HardwareOptionInfoDTO {
    @ApiProperty()
    id: string;

    @ApiProperty()
    color: string;

    @ApiProperty({enum: HardwareIcon})
    icon: HardwareIcon;

    @ApiProperty({required: false})
    state?: boolean;
}

export class ServerInfoDTO {
    @ApiProperty()
    id: string;

    @ApiProperty()
    name: string;

    @ApiProperty()
    description: string;

    @ApiProperty({enum: ServerStatus})
    status: ServerStatus;
}

export class ServerHardwareInfoDTO {
    @ApiProperty({type: [HardwareOptionInfoDTO]})
    leds: HardwareOptionInfoDTO[];

    @ApiProperty({type: [HardwareOptionInfoDTO]})
    buttons: HardwareOptionInfoDTO[];

    @ApiProperty({type: [HardwareOptionInfoDTO]})
    toggles: HardwareOptionInfoDTO[];
}

export class ChangeStateDTO {
    @ApiProperty()
    @IsNotEmpty()
    state: boolean;
}

@Controller("servers")
@ApiTags("servers")
export class ServersController {
    constructor(private serverService: ServersService) {
    }

    @Get("/")
    @ApiOperation({
        summary: "Get all servers and their information"
    })
    @ApiOkResponse({
        description: "Successful response",
        type: [ServerInfoDTO]
    })
    @ApiDefaultResponse({
        description: "Erroneous response",
        type: ErrorApiResponse
    })
    async getServers(): Promise<ServerInfoDTO[]> {
        return await this.serverService.getServerInfos();
    }

    @Get("/:id/hardware")
    @ApiOperation({
        summary: "Get hardware server information by its ID"
    })
    @ApiOkResponse({
        description: "Successful response",
        type: ServerHardwareInfoDTO
    })
    @ApiDefaultResponse({
        description: "Erroneous response",
        type: ErrorApiResponse
    })
    async getServerHardwareInfo(@Param("id") id: string): Promise<ServerHardwareInfoDTO> {
        const info = await this.serverService.getServerHardwareInfo(id);
        if (!info) {
            throw new HttpException(Errors.SERVER_NOT_FOUND, HttpStatus.NOT_FOUND);
        }
        return info;
    }

    @Get("/:id/log")
    @ApiOperation({
        summary: "Get server log"
    })
    @ApiOkResponse({
        description: "Successful response",
        type: String
    })
    @ApiDefaultResponse({
        description: "Erroneous response",
        type: ErrorApiResponse
    })
    async getServerLog(@Param("id") id: string): Promise<string> {
        const log = await this.serverService.getServerLog(id);
        if (!log) {
            throw new HttpException(Errors.SERVER_NOT_FOUND, HttpStatus.NOT_FOUND);
        }
        return log.toString("hex");
    }

    @Patch("/:serverId/button/:buttonId")
    @ApiOperation({
        summary: "Set server button state"
    })
    @ApiBody({
        type: ChangeStateDTO
    })
    @ApiOkResponse({
        description: "Successful response"
    })
    @ApiDefaultResponse({
        description: "Erroneous response",
        type: ErrorApiResponse
    })
    async setButton(@Param("serverId") serverId: string,
                    @Param("buttonId") buttonId: string,
                    @Body() body: ChangeStateDTO): Promise<void> {
        await this.serverService.setServerButton(serverId, buttonId, body.state);
    }

    @Patch("/:serverId/toggle/:toggleId")
    @ApiOperation({
        summary: "Set server toggle state"
    })
    @ApiBody({
        type: ChangeStateDTO
    })
    @ApiOkResponse({
        description: "Successful response"
    })
    @ApiDefaultResponse({
        description: "Erroneous response",
        type: ErrorApiResponse
    })
    async setToggle(@Param("serverId") serverId: string,
                    @Param("toggleId") toggleId: string,
                    @Body() body: ChangeStateDTO): Promise<void> {
        await this.serverService.setServerToggle(serverId, toggleId, body.state);
    }
}