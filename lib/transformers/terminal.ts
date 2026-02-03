import { BackendTerminalDTO, Terminal } from "@/type/themepark-support";

export const transformTerminal = (raw: BackendTerminalDTO): Terminal => ({
    id: String(raw.terminalID),
    terminalName: raw.terminal || "N/A",
    uuid: raw.uuid || "",
    terminalType: raw.terminalType || "POS",
    status: raw.status || "Active",
    modifiedDate: raw.modifiedDate || "N/A"
});

/**
 * Formats a terminal for UI display.
 */
export function formatTerminalLabel(terminal: Terminal): string {
    return `${terminal.terminalName} (ID: ${terminal.id})`;
}

/**
 * Cleans terminal IDs before API submission.
 */
export function extractNumericTerminalId(id: string): number {
    return Number(id.split('-').pop() || id) || 0;
}