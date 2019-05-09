
export enum LogLevels
{
    info = 0,
    warn = 1,
    error = 2,
    none = 100
}

export const LoggerSettings = {
    logLevel : LogLevels.warn
};

export class VidiunLogger
{
    constructor(private _name: string)
    {
    }

    warn(message: string): void
    {
        if (LoggerSettings.logLevel <= LogLevels.warn)
        {
            console.warn(`[vidiun-client/${this._name}]: ${message}`);
        }
    }

    info(message: string): void
    {
        if (LoggerSettings.logLevel <= LogLevels.info)
        {
            console.info(`[vidiun-client/${this._name}]: ${message}`);
        }
    }

    error(message: string): void
    {
        if (LoggerSettings.logLevel <= LogLevels.error)
        {
            console.error(`[vidiun-client/${this._name}]: ${message}`);
        }
    }
}
