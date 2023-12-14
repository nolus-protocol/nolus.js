export const getProtocolsMsg = () => {
    return {
        protocols: {},
    };
};

export const getProtocolMsg = (protocolName: string) => {
    return {
        protocol: {
            protocol: protocolName,
        },
    };
};
