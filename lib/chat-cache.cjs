function upsertMessage(oldData, message, insert = true) {
    if (!oldData?.pages?.length) return oldData;
    const exists = oldData.pages.some((page) => page.items.some((item) => item.id === message.id));
    if (!exists && !insert) return oldData;
    const pages = oldData.pages.map((page, index) => ({
        ...page,
        items: exists ? page.items.map((item) => item.id === message.id ?
            (new Date(item.updatedAt) > new Date(message.updatedAt) ? item : message) : item) :
            index === 0 ? [message, ...page.items].sort((a, b) =>
                new Date(b.createdAt) - new Date(a.createdAt) || b.id.localeCompare(a.id)) : page.items,
    }));
    return { ...oldData, pages };
}

function reconcileMessages(oldData, latest) {
    if (!oldData?.pages?.length) return oldData;
    // Only add unseen messages newer than loaded history; retain older pages and cursors.
    const loaded = oldData.pages.flatMap((page) => page.items);
    const oldest = loaded.length ? Math.min(...loaded.map((item) => new Date(item.createdAt).getTime())) : -Infinity;
    return latest.items.reduce((data, message) => {
        const exists = data.pages.some((page) => page.items.some((item) => item.id === message.id));
        if (!exists && new Date(message.createdAt).getTime() < oldest) return data;
        return upsertMessage(data, message);
    }, oldData);
}
module.exports = { upsertMessage, reconcileMessages };
