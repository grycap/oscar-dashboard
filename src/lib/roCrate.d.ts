export interface RoCrateServiceDefinition {
    name: string;
    description: string;
    fdlUrl: string;
    scriptUrl: string;
    author: string;
    type: string;
    iconUrl: string;
    memoryRequirements: string;
    memoryUnits: string;
    cpuRequirements: string;
};

/**
 * Parses the RO-Crate data and returns an array of service definitions.
 * @returns {Promise<RoCrateServiceDefinition[]>} A promise that resolves to an array of service definitions.
 */
declare const parseROCrateDataJS: () => Promise<RoCrateServiceDefinition[]>;
export default parseROCrateDataJS;