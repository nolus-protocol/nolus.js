/**
 * LeaserUtils provides helpers for working with Nolus liability calculations.
 */
export class LiabilityUtils {
    public static async convertLTDtoLTV(ltd: number) {
        return (1000 * ltd) / (1000 + ltd);
    }

    public static async convertLTVtoLTD(ltv: number) {
        return (1000 * ltv) / (1000 - ltv);
    }
}
