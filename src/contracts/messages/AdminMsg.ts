export const getProtocolsMsg = () => {
    return {
        protocols: {},
    };
};

export const getProtocolMsg = (protocolName: string) => {
    return {
        protocol: protocolName,
    };
};

export const getPlatformMsg = () => {
    return {
        platform: {},
    };
};
