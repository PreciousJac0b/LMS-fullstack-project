import { createLogger, Logger, format, transports } from "winston";

export class LoggerUtils {
    private static instance: Logger | null = null;

    static initialize(): void {
        if (!this.instance) {
            const LOG_DIR = process.env.LOG_DIR ?? "logs";
            const LOG_FILE = process.env.LOG_FILE ?? "app.log";
            this.instance = createLogger({
                level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
                format: format.combine( // Global config for formatting
                    format.timestamp(),
                    format.json()
                ),
                transports: [ // States destinations
                    new transports.Console({ // Overrides format config for console specifically.
                        format: format.combine(
                            format.colorize(),
                            format.simple() // human readable format.
                        )
                    }),
                    new transports.File({
                        filename: `${LOG_DIR}/${LOG_FILE}`,
                        maxsize: 10485760,
                        maxFiles: 5,
                        tailable: true,
                    })
                ]
            });
        }
    }

    static getLogger() {
        if (!this.instance) {
            this.initialize()
        }
        return this.instance!;
    }

    static info(message: string, additionalInfo?: Record<string, any>): void {
        this.log('info', message, additionalInfo);
    }

    static error(message: string, error?: Record<string, any>): void {
        this.log('error', message, error);
    }

    static warn(message: string, additionalInfo?: Record<string, any>): void {
        this.log('warn', message, additionalInfo);
    }

    static debug(message: string, additionalInfo?: Record<string, any>): void {
        this.log('debug', message, additionalInfo);
    }

    private static log(level: string, message: string, additionalInfo?: Record<string, any>): void {
        if (!this.instance) {
            this.initialize();
        }

        const logObject = {
            level,
            message,
            additionalInfo,
            environment: process.env.NODE_ENV,
            timestamp: new Date().toISOString()
        };

        this.instance?.log(logObject);
    }
}