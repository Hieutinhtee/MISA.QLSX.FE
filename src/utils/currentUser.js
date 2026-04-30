const GUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function normalizeGuid(value) {
    if (typeof value !== "string") return null;
    const guid = value.trim();
    return GUID_REGEX.test(guid) ? guid : null;
}

export function getCurrentUserGuid() {
    if (typeof window === "undefined") return null;

    const rawUser = localStorage.getItem("user");
    if (!rawUser) return null;

    try {
        const user = JSON.parse(rawUser);
        const candidates = [
            user?.employee_id,
            user?.employeeId,
            user?.account_id,
            user?.accountId,
            user?.user_id,
            user?.userId,
            user?.id,
        ];

        for (const candidate of candidates) {
            const guid = normalizeGuid(candidate);
            if (guid) return guid;
        }
    } catch {
        return null;
    }

    return null;
}
