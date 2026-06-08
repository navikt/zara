import { pino, transport } from 'pino'

import { bundledEnv } from '@lib/env'

const APP_NAME = 'zara'

const auditLogTransport = transport({
    target: 'pino-socket',
    options: {
        address: 'audit.nais',
        port: 6514,
        mode: 'tcp',
    },
})

const auditLogger = pino({}, bundledEnv.runtimeEnv !== 'local' ? auditLogTransport : undefined)

type AuditEventType = 'audit:create' | 'audit:access' | 'audit:read' | 'audit:update' | 'audit:delete'

type CefFormat = {
    timestamp: number
    message: string
    auditType: AuditEventType
    suid: string
    duid: string
}

function cefFormat({ timestamp, message, auditType, suid, duid }: CefFormat): string {
    return `CEF:0|Symfoni|${APP_NAME}|1.0|${auditType}|Sporingslogg|INFO|suid=${suid} duid=${duid} end=${timestamp} msg=${message}`
}

export function logAuditEvent(message: string, type: AuditEventType, navIdent: string, brukerIdent: string): void {
    const line = cefFormat({
        auditType: type,
        message,
        suid: navIdent,
        duid: brukerIdent,
        timestamp: new Date().getTime(),
    })

    auditLogger.info(line)
}
