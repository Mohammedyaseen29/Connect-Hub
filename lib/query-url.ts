type QueryValue = string | number | boolean | string[] | null | undefined;

export function stringifyUrl({ url, query = {} }: { url: string; query?: Record<string, QueryValue> }) {
    const hashIndex = url.indexOf("#");
    const hash = hashIndex >= 0 ? url.slice(hashIndex) : "";
    const base = hashIndex >= 0 ? url.slice(0, hashIndex) : url;
    const queryIndex = base.indexOf("?");
    const path = queryIndex >= 0 ? base.slice(0, queryIndex) : base;
    const params = new URLSearchParams(queryIndex >= 0 ? base.slice(queryIndex + 1) : "");
    Object.entries(query).forEach(([key, value]) => {
        if (value === undefined || value === null) { params.delete(key); return; }
        if (Array.isArray(value)) { params.delete(key); value.forEach((item) => params.append(key, item)); }
        else params.set(key, String(value));
    });
    const search = params.toString();
    return path + (search ? "?" + search : "") + hash;
}
const queryUrl = { stringifyUrl };
export default queryUrl;
