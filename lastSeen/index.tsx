import * as DataStore from "@api/DataStore";
import definePlugin from "@utils/types";
import { FluxDispatcher, PresenceStore, Tooltip, useStateFromStores } from "@webpack/common";

const STORE_KEY = "LastSeen_v1";

interface Seen { t: number; p: string; }

let seen: Record<string, Seen> = {};
const prev: Record<string, { status: string; platform: string; }> = {};
let saveTimer: ReturnType<typeof setTimeout> | undefined;

function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => DataStore.set(STORE_KEY, seen), 2000);
}

function platformOf(clientStatus?: Record<string, string>) {
    if (!clientStatus) return "";
    if (clientStatus.mobile) return "móvil";
    if (clientStatus.desktop) return "escritorio";
    if (clientStatus.web) return "web";
    return "";
}

function ago(t: number) {
    const s = Math.floor((Date.now() - t) / 1000);
    if (s < 60) return "hace un momento";
    const m = Math.floor(s / 60);
    if (m < 60) return `hace ${m} min`;
    const h = Math.floor(m / 60);
    if (h < 24) return `hace ${h} h`;
    return `hace ${Math.floor(h / 24)} d`;
}

function onPresence({ updates }: { updates: any[]; }) {
    for (const u of updates) {
        const id = u.user?.id;
        if (!id) continue;
        const status: string = u.status;
        const old = prev[id];
        if (status === "offline" && old && old.status !== "offline") {
            seen[id] = { t: Date.now(), p: old.platform };
            save();
        }
        prev[id] = {
            status,
            platform: platformOf(u.clientStatus) || old?.platform || ""
        };
    }
}

function LastSeen({ userId, compact }: { userId: string; compact?: boolean; }) {
    const status = useStateFromStores([PresenceStore], () => PresenceStore.getStatus(userId));
    const entry = seen[userId];
    if (status !== "offline" || !entry) return null;

    const full = new Date(entry.t).toLocaleString();
    const text = compact ? ago(entry.t) : `últ. vez ${ago(entry.t)}`;

    return (
        <Tooltip text={`Última vez visto: ${full}${entry.p ? ` (${entry.p})` : ""}`}>
            {tooltipProps => (
                <span
                    {...tooltipProps}
                    style={{ fontSize: "11px", opacity: 0.6, marginLeft: 6, whiteSpace: "nowrap" }}
                >
                    {text}
                </span>
            )}
        </Tooltip>
    );
}

export default definePlugin({
    name: "LastSeen",
    description: "Muestra la última vez que viste conectado a alguien. Solo registra mientras Discord está abierto.",
    authors: [{ name: "cancercocaine", id: 1425095870399123662n }],

    renderMemberListDecorator: ({ user }) =>
        user ? <LastSeen userId={user.id} compact /> : null,

    renderMessageDecoration: ({ message }) =>
        message?.author ? <LastSeen userId={message.author.id} /> : null,

    async start() {
        seen = (await DataStore.get<Record<string, Seen>>(STORE_KEY)) ?? {};
        FluxDispatcher.subscribe("PRESENCE_UPDATES", onPresence);
    },

    stop() {
        FluxDispatcher.unsubscribe("PRESENCE_UPDATES", onPresence);
        DataStore.set(STORE_KEY, seen);
    }
});
