/**
 * @name LastSeen
 * @author cancercocaine
 * @authorId 1425095870399123662
 * @description Muestra la última vez que viste conectado a alguien. Haz clic derecho en un usuario para verlo. Solo registra mientras Discord está abierto.
 * @version 1.0.0
 * @source https://github.com/ccrccne/vencord-lastseen
 */

const STORE_KEY = "seen";

function platformOf(clientStatus) {
    if (!clientStatus) return "";
    if (clientStatus.mobile) return "móvil";
    if (clientStatus.desktop) return "escritorio";
    if (clientStatus.web) return "web";
    return "";
}

function ago(t) {
    const s = Math.floor((Date.now() - t) / 1000);
    if (s < 60) return "hace un momento";
    const m = Math.floor(s / 60);
    if (m < 60) return `hace ${m} min`;
    const h = Math.floor(m / 60);
    if (h < 24) return `hace ${h} h`;
    return `hace ${Math.floor(h / 24)} d`;
}

module.exports = class LastSeen {
    constructor(meta) {
        this.api = new BdApi(meta.name);
        this.seen = {};
        this.prev = {};
        this.onPresence = this.onPresence.bind(this);
    }

    start() {
        const { Data, Webpack, ContextMenu } = this.api;
        this.seen = Data.load(STORE_KEY) ?? {};
        this.presenceStore = Webpack.getStore("PresenceStore");
        this.dispatcher = Webpack.getByKeys("dispatch", "subscribe", "unsubscribe");
        this.dispatcher.subscribe("PRESENCE_UPDATES", this.onPresence);

        this.unpatchMenu = ContextMenu.patch("user-context", (res, props) => {
            const user = props?.user;
            const children = res?.props?.children;
            if (!user || !Array.isArray(children)) return;
            children.push(ContextMenu.buildItem({ type: "separator" }), this.menuItem(user.id));
        });
    }

    stop() {
        this.dispatcher?.unsubscribe("PRESENCE_UPDATES", this.onPresence);
        this.unpatchMenu?.();
        clearTimeout(this.saveTimer);
        this.api.Data.save(STORE_KEY, this.seen);
    }

    save() {
        clearTimeout(this.saveTimer);
        this.saveTimer = setTimeout(() => this.api.Data.save(STORE_KEY, this.seen), 2000);
    }

    onPresence({ updates }) {
        for (const u of updates) {
            const id = u.user?.id;
            if (!id) continue;
            const old = this.prev[id];
            if (u.status === "offline" && old && old.status !== "offline") {
                this.seen[id] = { t: Date.now(), p: old.platform };
                this.save();
            }
            this.prev[id] = {
                status: u.status,
                platform: platformOf(u.clientStatus) || old?.platform || ""
            };
        }
    }

    menuItem(userId) {
        const status = this.presenceStore?.getStatus(userId);
        const entry = this.seen[userId];

        let label;
        if (status && status !== "offline") label = "Conectado ahora";
        else if (entry) label = `Últ. vez ${ago(entry.t)}${entry.p ? ` (${entry.p})` : ""}`;
        else label = "Últ. vez: sin datos";

        return this.api.ContextMenu.buildItem({
            id: "last-seen",
            label,
            action: () => {
                if (entry) this.api.UI.showToast(`Última vez visto: ${new Date(entry.t).toLocaleString()}`);
            }
        });
    }
};
